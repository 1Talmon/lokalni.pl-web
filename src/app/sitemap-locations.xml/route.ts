import { NextResponse } from 'next/server';
import { BASE_URL, ALL_KEYWORDS, CATEGORIES, TOP_CITIES, EXTRA_CITIES, ALL_CITIES } from '@/lib/seo-data';

export const dynamic = 'force-static';
export const revalidate = 86400;

const LAST_MODIFIED = '2025-06-01';

function u(loc: string, priority: string, changefreq: string) {
    return `  <url><loc>${loc}</loc><lastmod>${LAST_MODIFIED}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export function GET() {
    const urls: string[] = [
        ...ALL_CITIES.map(city => u(`${BASE_URL}/${city}`, '0.8', 'daily')),
    ];

    for (const kw of ALL_KEYWORDS) {
        for (const city of TOP_CITIES) {
            urls.push(u(`${BASE_URL}/${kw}-${city}`, '0.9', 'daily'));
        }
    }

    for (const cat of CATEGORIES) {
        for (const city of EXTRA_CITIES) {
            urls.push(u(`${BASE_URL}/${cat}-${city}`, '0.8', 'daily'));
        }
    }

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

    return new NextResponse(body, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
}
