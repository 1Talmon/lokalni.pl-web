import { NextResponse } from 'next/server';
import { BASE_URL } from '@/lib/seo-data';

export const dynamic = 'force-static';
export const revalidate = 86400;

const STATIC: [string, string, string][] = [
    ['/', '1.0', 'daily'],
    ['/jak-to-dziala', '0.8', 'monthly'],
    ['/faq', '0.8', 'monthly'],
    ['/o-nas', '0.7', 'monthly'],
    ['/zasady-bezpieczenstwa', '0.6', 'monthly'],
    ['/regulamin', '0.5', 'monthly'],
    ['/polityka-prywatnosci', '0.5', 'monthly'],
];

export function GET() {
    const today = new Date().toISOString().slice(0, 10);

    const urls = STATIC.map(
        ([path, pri, freq]) =>
            `  <url><loc>${BASE_URL}${path}</loc><lastmod>${today}</lastmod><changefreq>${freq}</changefreq><priority>${pri}</priority></url>`,
    );

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    return new NextResponse(body, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
}
