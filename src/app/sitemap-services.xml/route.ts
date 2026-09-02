import { NextResponse } from 'next/server';
import { API_URL } from '@/lib/seo-data';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const res = await fetch(`${API_URL}/public/sitemap/services`, {
            headers: { 'User-Agent': 'Lokalni-SitemapBot/1.0' },
        });

        if (res.ok) {
            const xml = await res.text();
            return new NextResponse(xml, {
                headers: {
                    'Content-Type': 'application/xml; charset=utf-8',
                    'Cache-Control': 'public, max-age=3600, s-maxage=3600',
                },
            });
        }
    } catch {
        // API unavailable — return empty sitemap
    }

    const empty = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>`;
    return new NextResponse(empty, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
}
