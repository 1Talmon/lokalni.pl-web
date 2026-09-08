export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { BASE_URL, API_URL } from '@/lib/seo-data';

interface ProfileEntry {
    uid: string;
    updatedAt?: string;
}

export async function GET() {
    let profiles: ProfileEntry[] = [];

    try {
        const res = await fetch(`${API_URL}/public/sitemap/profiles`, {
            headers: { 'User-Agent': 'Lokalni-MetaBot/1.0' },
            next: { revalidate: 21600 },
        });
        if (res.ok) {
            const json = await res.json() as unknown;
            profiles = Array.isArray(json) ? (json as ProfileEntry[]) : [];
        }
    } catch {
        // Return empty sitemap on API error rather than crashing
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${profiles.map(p => `  <url>
    <loc>${BASE_URL}/profile/${p.uid}</loc>${p.updatedAt ? `\n    <lastmod>${new Date(p.updatedAt).toISOString().split('T')[0]}</lastmod>` : ''}
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')}
</urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=21600, s-maxage=21600, stale-while-revalidate=3600',
        },
    });
}
