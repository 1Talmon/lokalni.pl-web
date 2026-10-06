import { API_URL, BASE_URL } from '@/lib/seo-data';
import { SEO_TAG } from '@/lib/landings';
import { urlsetResponse, sitemapUnavailable } from '@/lib/sitemap';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Providers with ≥1 public offer; lastmod = newest profile/offer update.
export async function GET() {
    try {
        const res = await fetch(`${API_URL}/public/sitemap/profiles`, {
            headers: { 'User-Agent': 'Lokalni-SitemapBot/1.0' },
            next: { revalidate: 300, tags: [SEO_TAG] },
        });
        if (!res.ok) return sitemapUnavailable();
        const { data } = await res.json() as { data: { uid: string; lastmod: string }[] };
        return urlsetResponse(data.map(p => ({ loc: `${BASE_URL}/profile/${p.uid}`, lastmod: p.lastmod })));
    } catch {
        return sitemapUnavailable();
    }
}
