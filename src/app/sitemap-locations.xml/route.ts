import { NextResponse } from 'next/server';
import { API_URL, BASE_URL, LANDING_SLUGS } from '@/lib/seo-data';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const res = await fetch(`${API_URL}/public/sitemap/locations`, {
            headers: { 'User-Agent': 'Lokalni-SitemapBot/1.0' },
            cache: 'no-store',
        });
        if (res.ok) {
            const xml = await res.text();
            const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
            const filtered = urlBlocks.filter(block => {
                const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
                if (!loc) return false;
                const slug = loc.replace(`${BASE_URL}/`, '');
                return LANDING_SLUGS.has(slug);
            });
            const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${filtered.join('\n')}\n</urlset>`;
            return new NextResponse(body, {
                headers: {
                    'Content-Type': 'application/xml; charset=utf-8',
                    'Cache-Control': 'public, max-age=86400, s-maxage=86400',
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
