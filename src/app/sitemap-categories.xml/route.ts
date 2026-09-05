import { NextResponse } from 'next/server';
import { BASE_URL, ALL_KEYWORDS } from '@/lib/seo-data';

export const dynamic = 'force-static';
export const revalidate = 86400;

const LAST_MODIFIED = '2025-06-01';

function u(loc: string, priority: string, changefreq: string) {
    return `  <url><loc>${loc}</loc><lastmod>${LAST_MODIFIED}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export function GET() {
    const urls = [
        u(`${BASE_URL}/`,                      '1.0', 'daily'),
        u(`${BASE_URL}/jak-to-dziala`,         '0.8', 'monthly'),
        u(`${BASE_URL}/faq`,                   '0.8', 'monthly'),
        u(`${BASE_URL}/o-nas`,                 '0.7', 'monthly'),
        u(`${BASE_URL}/zasady-bezpieczenstwa`, '0.6', 'monthly'),
        u(`${BASE_URL}/regulamin`,             '0.5', 'monthly'),
        u(`${BASE_URL}/polityka-prywatnosci`,  '0.5', 'monthly'),
        ...ALL_KEYWORDS.map(kw => u(`${BASE_URL}/${kw}`, '0.9', 'daily')),
    ];

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

    return new NextResponse(body, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
}
