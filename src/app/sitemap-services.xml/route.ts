import { API_URL } from '@/lib/seo-data';
import { SEO_TAG } from '@/lib/landings';
import { sitemapUnavailable } from '@/lib/sitemap';
import { ssrHeaders } from '@/lib/ssrHeaders';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Proxies the API sitemap (public services only, lastmod = services.updated_at).
export async function GET() {
    try {
        const res = await fetch(`${API_URL}/public/sitemap/services`, {
            headers: ssrHeaders('Lokalni-SitemapBot/1.0'),
            next: { revalidate: 300, tags: [SEO_TAG] },
        });
        if (!res.ok) return sitemapUnavailable();
        return new Response(await res.text(), {
            headers: {
                'Content-Type': 'application/xml; charset=utf-8',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
        });
    } catch {
        return sitemapUnavailable();
    }
}
