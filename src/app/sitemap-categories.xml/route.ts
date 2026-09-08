import { NextResponse } from 'next/server';
import { API_URL, BASE_URL, CATEGORY_SLUG } from '@/lib/seo-data';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface CategoryPage { slug: string }

// Derive category+city combination slugs from the locations sitemap when API endpoint is empty.
async function deriveFromLocations(): Promise<string[]> {
    try {
        const res = await fetch(`${API_URL}/public/sitemap/locations`, {
            headers: { 'User-Agent': 'Lokalni-SitemapBot/1.0' },
            cache: 'no-store',
        });
        if (!res.ok) return [];
        const xml = await res.text();
        // Extract <loc> values and return only category-level slugs (those matching a CATEGORY_SLUG value)
        const locs = [...xml.matchAll(/<loc>https:\/\/mylokalni\.pl\/([^<]+)<\/loc>/g)].map(m => m[1]);
        const catSlugs = new Set(Object.values(CATEGORY_SLUG));
        // Return category-only slugs (no city suffix) and category-city combinations
        return locs.filter(s => {
            const parts = s.split('-');
            // Check if any prefix of the slug is a category slug
            for (let i = 1; i <= parts.length; i++) {
                if (catSlugs.has(parts.slice(0, i).join('-'))) return true;
            }
            return false;
        });
    } catch {
        return [];
    }
}

export async function GET() {
    const TODAY = new Date().toISOString().slice(0, 10);
    let slugs: string[] = [];

    try {
        const res = await fetch(`${API_URL}/public/sitemap/category-pages`, {
            headers: { 'User-Agent': 'Lokalni-SitemapBot/1.0' },
            cache: 'no-store',
        });
        if (res.ok) {
            const json = await res.json() as { data: CategoryPage[] };
            slugs = (json.data ?? []).map(p => p.slug);
        }
    } catch { /* fall through */ }

    if (slugs.length === 0) {
        slugs = await deriveFromLocations();
    }

    const urls = slugs.map(slug =>
        `  <url><loc>${BASE_URL}/${slug}</loc><lastmod>${TODAY}</lastmod><changefreq>daily</changefreq><priority>0.9</priority></url>`
    );
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    return new NextResponse(body, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
}
