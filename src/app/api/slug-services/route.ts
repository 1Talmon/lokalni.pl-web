export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { parseSlug } from '@/lib/seo-data';
import { fetchServices, resolveFetchParams } from '@/lib/slug-services';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const offset = parseInt(searchParams.get('offset') ?? '0', 10);

    if (!slug) return NextResponse.json([], { status: 400 });

    const parsed = parseSlug(slug);
    const fetchParams = resolveFetchParams(parsed);
    const { services } = await fetchServices(fetchParams, offset);

    return NextResponse.json(services);
}
