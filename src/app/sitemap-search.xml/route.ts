import { NextResponse } from 'next/server';
import { API_URL, BASE_URL } from '@/lib/seo-data';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface SearchPage {
    slug: string;
}

export async function GET() {
    try {
        const res = await fetch(`${API_URL}/public/sitemap/search-pages`, {
            headers: { 'User-Agent': 'Lokalni-SitemapBot/1.0' },
            cache: 'no-store',
        });
        if (res.ok) {
            const json = await res.json() as { data: SearchPage[] };
            const TODAY = new Date().toISOString().slice(0, 10);
            const urls = (json.data ?? []).map(({ slug }) =>
                `  <url><loc>${BASE_URL}/${slug}</loc><lastmod>${TODAY}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`
            );
            const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
            return new NextResponse(body, {
                headers: {
                    'Content-Type': 'application/xml; charset=utf-8',
                    'Cache-Control': 'public, max-age=21600, s-maxage=21600',
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
