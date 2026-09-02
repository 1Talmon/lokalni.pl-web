const API_URL = 'https://api.mylokalni.pl/api';
const BASE = 'https://mylokalni.pl';

const TODAY = new Date().toISOString().slice(0, 10);

const STATIC_PAGES = [
  { loc: `${BASE}/`,                       priority: '1.0', changefreq: 'daily',   lastmod: TODAY },
  { loc: `${BASE}/jak-to-dziala`,          priority: '0.8', changefreq: 'monthly', lastmod: TODAY },
  { loc: `${BASE}/faq`,                    priority: '0.8', changefreq: 'monthly', lastmod: TODAY },
  { loc: `${BASE}/o-nas`,                  priority: '0.7', changefreq: 'monthly', lastmod: TODAY },
  { loc: `${BASE}/zasady-bezpieczenstwa`,  priority: '0.6', changefreq: 'monthly', lastmod: TODAY },
  { loc: `${BASE}/regulamin`,              priority: '0.5', changefreq: 'monthly', lastmod: TODAY },
  { loc: `${BASE}/polityka-prywatnosci`,   priority: '0.5', changefreq: 'monthly', lastmod: TODAY },
];

const CATEGORY_CITY = [
  'hydraulik-warszawa','sprzatanie-warszawa','elektryk-warszawa','malarz-warszawa',
  'transport-warszawa','opiekunka-warszawa','budowa-warszawa','korepetycje-warszawa',
  'uroda-warszawa','it-naprawy-warszawa','auto-warszawa','dom-ogrod-warszawa',
  'sprzatanie-krakow','hydraulik-krakow','uroda-krakow','catering-krakow',
  'korepetycje-krakow','budowa-krakow','transport-krakow','elektryk-krakow',
  'edukacja-wroclaw','sprzatanie-wroclaw','hydraulik-wroclaw','budowa-wroclaw',
  'zdrowie-wroclaw','it-naprawy-wroclaw',
  'auto-poznan','transport-poznan','sprzatanie-poznan','hydraulik-poznan','dom-ogrod-poznan',
  'budowa-gdansk','sprzatanie-gdansk','hydraulik-gdansk','transport-gdansk','uroda-gdansk',
  'eventy-lodz','sprzatanie-lodz','hydraulik-lodz','transport-lodz',
  'it-naprawy-katowice','sprzatanie-katowice','hydraulik-katowice','transport-katowice',
  'sprzatanie-lublin','opieka-lublin','hydraulik-lublin',
  'hydraulik-bydgoszcz','sprzatanie-bydgoszcz','budowa-bydgoszcz',
  'sprzatanie-szczecin','hydraulik-szczecin','transport-szczecin',
  'uroda-bialystok','sprzatanie-bialystok',
  'transport-rzeszow','budowa-rzeszow',
];

function urlTag(loc, priority, changefreq, lastmod) {
  return `  <url><loc>${loc}</loc><lastmod>${lastmod ?? TODAY}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

async function generateSitemap() {
  const lines = [
    ...STATIC_PAGES.map(u => urlTag(u.loc, u.priority, u.changefreq, u.lastmod)),
    ...CATEGORY_CITY.map(slug => urlTag(`${BASE}/${slug}`, '0.9', 'daily', TODAY)),
  ];

  try {
    const res = await fetch(`${API_URL}/services?limit=100&sort=newest&type=offer`, {
      headers: { 'User-Agent': 'MyLokalni-SitemapBot/1.0' },
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const json = await res.json();
      const providerUids = new Set();
      for (const s of (json.data ?? [])) {
        if (s.publicId) {
          const slug = s.title
            ? `${s.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50)}-${s.publicId}`
            : s.publicId;
          const lastmod = s.updatedAt
            ? new Date(s.updatedAt).toISOString().slice(0, 10)
            : TODAY;
          lines.push(urlTag(`${BASE}/service/${slug}`, '0.7', 'weekly', lastmod));
          if (s.provider?.uid) providerUids.add(s.provider.uid);
        }
      }
      for (const uid of providerUids) {
        lines.push(urlTag(`${BASE}/profile/${uid}`, '0.6', 'weekly', TODAY));
      }
    }
  } catch { /* timeout — zwróć bez serwisów */ }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${lines.join('\n')}
</urlset>`;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);

  if (url.pathname === '/sitemap.xml') {
    const xml = await generateSitemap();
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        // Przeglądarka: nie cachuj (zawsze fresh)
        // CF CDN: cachuj 1h, potem rewaliduj
        'Cache-Control': 'public, max-age=0, s-maxage=3600, must-revalidate',
        'Vary': 'Accept-Encoding',
      },
    });
  }

  return context.next();
}
