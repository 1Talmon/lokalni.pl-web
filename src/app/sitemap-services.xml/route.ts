import { NextResponse } from 'next/server';
import { BASE_URL, API_URL } from '@/lib/seo-data';
import { createServiceUrl } from '@/utils/helpers';

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

function urlTag(loc: string, priority: string, changefreq: string, lastmod: string) {
    return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

export async function GET() {
    const today = new Date().toISOString().slice(0, 10);
    const lines: string[] = [];

    try {
        const res = await fetch(`${API_URL}/public/sitemap/services`, {
            headers: { 'User-Agent': 'Lokalni-SitemapBot/1.0' },
            next: { revalidate: 3600 },
        });

        if (res.ok) {
            const json = await res.json();
            const services = (Array.isArray(json) ? json : (json.data ?? [])) as Array<{ title?: string; publicId?: string; updatedAt?: string; providerId?: string }>;

            for (const s of services) {
                if (!s.title || !s.publicId) continue;
                const slug = createServiceUrl(s.title, s.publicId);
                const lastmod = s.updatedAt ? new Date(s.updatedAt).toISOString().slice(0, 10) : today;
                lines.push(urlTag(`${BASE_URL}/service/${slug}`, '0.7', 'weekly', lastmod));

                if (s.providerId) {
                    lines.push(urlTag(`${BASE_URL}/profile/${s.providerId}`, '0.6', 'weekly', today));
                }
            }
        }
    } catch {
        // API unavailable — return empty sitemap
    }

    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join('\n')}\n</urlset>`;

    return new NextResponse(body, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
}
