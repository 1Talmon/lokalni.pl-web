import { API_URL, BASE_URL } from '@/lib/seo-data';
import { SEO_TAG } from '@/lib/landings';
import { urlsetResponse, sitemapUnavailable } from '@/lib/sitemap';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Single posts with real content + the /wpisy group page (lastmod = newest indexed post).
export async function GET() {
    try {
        const res = await fetch(`${API_URL}/public/sitemap/posts`, {
            headers: { 'User-Agent': 'Lokalni-SitemapBot/1.0' },
            next: { revalidate: 300, tags: [SEO_TAG] },
        });
        if (!res.ok) return sitemapUnavailable();
        const { data } = await res.json() as { data: { slug: string; lastmod: string }[] };
        const entries = data.map(p => ({ loc: `${BASE_URL}/wpis/${p.slug}`, lastmod: p.lastmod }));
        if (entries.length > 0) {
            const newest = data.map(p => p.lastmod).sort().at(-1);
            entries.unshift({ loc: `${BASE_URL}/wpisy`, lastmod: newest! });
        }
        return urlsetResponse(entries);
    } catch {
        return sitemapUnavailable();
    }
}
