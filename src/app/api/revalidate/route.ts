import { NextRequest, NextResponse } from 'next/server';
import { SEO_TAG } from '@/lib/landings';

export const runtime = 'edge';

// Called by the API (lib/seo.ts publishSeoChange) right after a service/post/profile changes.
// Drops the SEO data cache (fetch tag) and the affected pages — single page + every group page
// (home, /wpisy, profile, landings) — so new content is visible to crawlers immediately.
// revalidatePath/revalidateTag are dynamically imported: on edge runtimes where they're missing
// the fetch cache still expires on its own (revalidate: 300).
async function tryRevalidate(kind: 'path' | 'tag', value: string): Promise<boolean> {
    try {
        const cache = await import('next/cache');
        if (kind === 'tag') cache.revalidateTag(value);
        else cache.revalidatePath(value);
        return true;
    } catch {
        console.warn('[revalidate] unavailable for', kind, value);
        return false;
    }
}

interface RevalidateBody {
    event: string;
    data: {
        slug?: string;          // legacy service events
        categorySlug?: string;  // legacy service events
        uid?: string;
        paths?: string[];
    };
}

const SAFE_PATH = /^\/[a-z0-9/_-]*$/i;

export async function POST(request: NextRequest): Promise<NextResponse> {
    // Validate webhook secret — set REVALIDATE_SECRET in CF Pages env vars
    const secret = request.headers.get('x-revalidate-secret');
    if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body: RevalidateBody;
    try {
        body = await request.json() as RevalidateBody;
    } catch {
        return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
    }

    const { event, data } = body;
    if (!/^(service|post|profile)\.[a-z]+$/.test(event ?? '')) {
        return NextResponse.json({ error: 'unknown_event', event }, { status: 400 });
    }

    const paths = new Set<string>(Array.isArray(data?.paths) ? data.paths : []);
    if (data?.slug) paths.add(`/service/${data.slug}`);
    if (data?.categorySlug) paths.add(`/${data.categorySlug}`);
    if (data?.uid) paths.add(`/profile/${data.uid}`);

    await tryRevalidate('tag', SEO_TAG);
    const revalidated: string[] = [];
    for (const p of [...paths].filter(p => SAFE_PATH.test(p)).slice(0, 100)) {
        if (await tryRevalidate('path', p)) revalidated.push(p);
    }

    // eslint-disable-next-line no-console
    console.log('[revalidate]', event, revalidated);
    return NextResponse.json({ revalidated, event });
}
