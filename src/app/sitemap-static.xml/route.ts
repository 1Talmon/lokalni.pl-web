import { BASE_URL } from '@/lib/seo-data';
import { fetchLandingGroups } from '@/lib/landings';
import { urlsetResponse } from '@/lib/sitemap';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// lastmod = date of the last real content change of each page (git history). Update when editing a page.
const STATIC: [path: string, lastmod: string][] = [
    ['/jak-to-dziala', '2026-10-01'],
    ['/faq', '2026-10-01'],
    ['/o-nas', '2026-10-06'],
    ['/zasady-bezpieczenstwa', '2026-10-01'],
    ['/regulamin', '2026-10-01'],
    ['/polityka-prywatnosci', '2026-10-01'],
];

export async function GET() {
    // Homepage lists the newest offers → its lastmod is the newest offer update
    const groups = await fetchLandingGroups().catch(() => []);
    const homeLastmod = groups.map(g => g.lastmod).sort().at(-1);
    return urlsetResponse([
        { loc: `${BASE_URL}/`, lastmod: homeLastmod },
        ...STATIC.map(([path, lastmod]) => ({ loc: `${BASE_URL}${path}`, lastmod })),
    ], 86400);
}
