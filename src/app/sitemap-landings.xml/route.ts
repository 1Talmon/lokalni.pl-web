import { BASE_URL } from '@/lib/seo-data';
import { fetchLandingGroups, isIndexableLanding } from '@/lib/landings';
import { urlsetResponse, sitemapUnavailable } from '@/lib/sitemap';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Category / city / category+city pages — only indexable groups (enough offers, see isIndexableLanding), lastmod = newest offer update.
export async function GET() {
    try {
        const groups = await fetchLandingGroups();
        return urlsetResponse(groups.filter(g => isIndexableLanding(g)).map(g => ({ loc: `${BASE_URL}/${g.slug}`, lastmod: g.lastmod })));
    } catch {
        return sitemapUnavailable();
    }
}
