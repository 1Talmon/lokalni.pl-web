import { NextResponse } from 'next/server';
import { API_URL, BASE_URL, CATEGORY_SLUG, KEYWORD_DISPLAY } from '@/lib/seo-data';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

interface KeywordPage { slug: string }

// Build keyword slugs from real services when API endpoint isn't populated.
async function deriveFromServices(): Promise<string[]> {
    try {
        const res = await fetch(`${API_URL}/services?limit=1000`, {
            headers: { 'User-Agent': 'Lokalni-SitemapBot/1.0' },
            cache: 'no-store',
        });
        if (!res.ok) return [];
        const json = await res.json() as { data?: Record<string, unknown>[] };
        const data = json.data ?? [];
        const seen = new Set<string>();
        for (const s of data) {
            const cat = typeof s.category === 'string' ? s.category : '';
            const catSlug = CATEGORY_SLUG[cat];
            if (catSlug && KEYWORD_DISPLAY[catSlug]) seen.add(catSlug);
        }
        return [...seen];
    } catch {
        return [];
    }
}

export async function GET() {
    const TODAY = new Date().toISOString().slice(0, 10);
    let slugs: string[] = [];

    try {
        const res = await fetch(`${API_URL}/public/sitemap/keyword-pages`, {
            headers: { 'User-Agent': 'Lokalni-SitemapBot/1.0' },
            cache: 'no-store',
        });
        if (res.ok) {
            const json = await res.json() as { data: KeywordPage[] };
            slugs = (json.data ?? []).map(p => p.slug);
        }
    } catch { /* fall through */ }

    // Fallback: derive from real services in DB
    if (slugs.length === 0) {
        slugs = await deriveFromServices();
    }

    const urls = slugs.map(slug =>
        `  <url><loc>${BASE_URL}/${slug}</loc><lastmod>${TODAY}</lastmod><changefreq>daily</changefreq><priority>0.8</priority></url>`
    );
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    return new NextResponse(body, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    });
}
