import { BASE_URL } from '@/lib/seo-data';

export const dynamic = 'force-static';
export const revalidate = 86400;

const CHILDREN = ['static', 'landings', 'services', 'profiles', 'posts'];

export function GET() {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${CHILDREN.map(c => `  <sitemap><loc>${BASE_URL}/sitemap-${c}.xml</loc></sitemap>`).join('\n')}
</sitemapindex>`;

    return new Response(body, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
}
