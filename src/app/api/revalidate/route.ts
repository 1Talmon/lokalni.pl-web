import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// revalidatePath is a Next.js server API — on CF Pages (next-on-pages) it invalidates
// the CF KV cache entry for that path, triggering ISR regeneration on next request.
// Dynamic import + try-catch guards against edge runtimes where it may be unavailable.
async function tryRevalidatePath(path: string): Promise<void> {
    try {
        const { revalidatePath } = await import('next/cache');
        revalidatePath(path);
    } catch {
        console.warn('[revalidate] revalidatePath unavailable for', path);
    }
}

interface RevalidateBody {
    event: string;
    data: {
        slug?: string;
        uid?: string;
        categorySlug?: string;
    };
}

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
    const revalidated: string[] = [];

    switch (event) {
        case 'service.created':
        case 'service.updated':
        case 'service.deleted':
            if (data.slug) {
                await tryRevalidatePath(`/service/${data.slug}`);
                revalidated.push(`/service/${data.slug}`);
            }
            // Also invalidate category landing pages when services change
            if (data.categorySlug) {
                await tryRevalidatePath(`/${data.categorySlug}`);
                revalidated.push(`/${data.categorySlug}`);
            }
            break;

        case 'profile.updated':
            if (data.uid) {
                await tryRevalidatePath(`/profile/${data.uid}`);
                revalidated.push(`/profile/${data.uid}`);
            }
            break;

        default:
            return NextResponse.json({ error: 'unknown_event', event }, { status: 400 });
    }

    // eslint-disable-next-line no-console
    console.log('[revalidate]', event, revalidated);
    return NextResponse.json({ revalidated, event });
}
