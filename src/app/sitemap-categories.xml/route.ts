import { NextResponse } from 'next/server';
import { API_URL, BASE_URL } from '@/lib/seo-data';

// v3 — fully dynamic: static pages hardcoded, keywords/cities from API
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const STATIC: [string, string, string][] = [
    ['/', '1.0', 'daily'],
    ['/jak-to-dziala', '0.8', 'monthly'],
    ['/faq', '0.8', 'monthly'],
    ['/o-nas', '0.7', 'monthly'],
    ['/zasady-bezpieczenstwa', '0.6', 'monthly'],
    ['/regulamin', '0.5', 'monthly'],
    ['/polityka-prywatnosci', '0.5', 'monthly'],
];

export async function GET() {
    const today = new Date().toISOString().slice(0, 10);

    const staticUrls = STATIC.map(
        ([path, pri, freq]) =>
            `  <url><loc>${BASE_URL}${path}</loc><lastmod>${today}</lastmod><changefreq>${freq}</changefreq><priority>${pri}</priority></url>`,
    );

    try {
        const res = await fetch(`${API_URL}/public/sitemap/categories`, {
            headers: { 'User-Agent': 'Lokalni-SitemapBot/1.0' },
            cache: 'no-store',
        });
        if (res.ok) {
            const xml = await res.text();
            const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? [];
            const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticUrls.join('\n')}\n${urlBlocks.join('\n')}\n</urlset>`;
            return new NextResponse(body, {
                headers: { 'Content-Type': 'application/xml; charset=utf-8' },
            });
        }
    } catch {
        // API unavailable — return static pages only
    }

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticUrls.join('\n')}\n</urlset>`;
    return new NextResponse(body, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
}
