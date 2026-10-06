// Shared helpers for sitemap route handlers. Every <lastmod> comes from real data (DB timestamps or
// the last content change of a static page) — never "today".

export interface SitemapEntry {
    loc: string;
    lastmod?: string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function urlsetResponse(entries: SitemapEntry[], maxAge = 3600): Response {
    const urls = entries.map(e =>
        `  <url><loc>${esc(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`,
    );
    const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
    return new Response(body, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': `public, max-age=${maxAge}, s-maxage=${maxAge}`,
        },
    });
}

/** API down → 503 + Retry-After. An empty 200 urlset would tell Google all URLs are gone. */
export function sitemapUnavailable(): Response {
    return new Response('Sitemap temporarily unavailable', {
        status: 503,
        headers: { 'Retry-After': '600', 'Cache-Control': 'no-store' },
    });
}
