const API_URL = 'https://api.mylokalni.pl/api';
const API_BASE = 'https://api.mylokalni.pl';
const FRONTEND_URL = 'https://mylokalni.pl';
const DEFAULT_IMAGE = 'https://mylokalni.pl/og-image.png';

function normalizeMediaUrl(url) {
  if (!url) return null;
  return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, API_BASE);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function injectOgTags(html, { title, description, imageUrl, pageUrl, ogType }) {
  const t = escapeHtml(title);
  const d = escapeHtml(description);
  const i = escapeHtml(imageUrl);
  const u = escapeHtml(pageUrl);

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${t}</title>`)
    .replace(/<meta property="og:title"[^>]*>/g,        `<meta property="og:title" content="${t}" />`)
    .replace(/<meta property="og:description"[^>]*>/g,  `<meta property="og:description" content="${d}" />`)
    .replace(/<meta property="og:image"(?!:)[^>]*>/g,   `<meta property="og:image" content="${i}" />`)
    .replace(/<meta property="og:image:width"[^>]*>/g,  '')
    .replace(/<meta property="og:image:height"[^>]*>/g, '')
    .replace(/<meta property="og:url"[^>]*>/g,          `<meta property="og:url" content="${u}" />`)
    .replace(/<meta property="og:type"[^>]*>/g,         `<meta property="og:type" content="${escapeHtml(ogType)}" />`)
    .replace(/<meta name="twitter:title"[^>]*>/g,       `<meta name="twitter:title" content="${t}" />`)
    .replace(/<meta name="twitter:description"[^>]*>/g, `<meta name="twitter:description" content="${d}" />`)
    .replace(/<meta name="twitter:image"[^>]*>/g,       `<meta name="twitter:image" content="${i}" />`)
    .replace(/<link rel="canonical"[^>]*>/g,            `<link rel="canonical" href="${u}" />`);
}

async function fetchServiceOg(publicId) {
  try {
    const res = await fetch(`${API_URL}/services/${publicId}`, {
      headers: { 'User-Agent': 'Lokalni-MetaBot/1.0' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const d = json.data ?? json;
    const cityPart = d.city ? ` w ${d.city}` : '';
    const title = d.title ? `${d.title}${cityPart}` : '';
    const descBase = d.description ? String(d.description).slice(0, 160) : '';
    const description = descBase || `${d.title || 'Usługa'}${cityPart} – sprawdź ofertę, opinie i ceny na MyLokalni.pl.`;
    const rating = parseFloat(d.rating) || 0;
    const reviewsCount = parseInt(d.reviewsCount) || 0;
    const providerName = d.provider?.name || null;
    return {
      title,
      description,
      imageUrl: normalizeMediaUrl(d.image || d.images?.[0] || d.provider?.profilowe) || DEFAULT_IMAGE,
      rating,
      reviewsCount,
      price: d.price || null,
      priceUnit: d.priceUnit || null,
      providerName,
      city: d.city || null,
    };
  } catch {
    return null;
  }
}

function buildServiceSchema(data, slug) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: data.title,
    description: data.description,
    url: `${FRONTEND_URL}/service/${slug}`,
    image: data.imageUrl,
    areaServed: data.city ? { '@type': 'City', name: data.city } : { '@type': 'Country', name: 'Polska' },
    provider: data.providerName ? { '@type': 'Person', name: data.providerName } : undefined,
  };
  if (data.rating > 0 && data.reviewsCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.rating.toFixed(1),
      reviewCount: data.reviewsCount,
      bestRating: '5',
      worstRating: '1',
    };
  }
  if (data.price && data.priceUnit) {
    schema.offers = {
      '@type': 'Offer',
      price: data.price,
      priceCurrency: 'PLN',
      priceSpecification: { '@type': 'UnitPriceSpecification', unitText: data.priceUnit },
    };
  }
  return schema;
}

async function fetchProfileOg(uid) {
  try {
    const res = await fetch(`${API_URL}/users/${uid}/profile`, {
      headers: { 'User-Agent': 'Lokalni-MetaBot/1.0' },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const d = json.data ?? json;
    const name = [d.imie, d.nazwisko].filter(Boolean).join(' ');
    return {
      title: name ? `${name} | Lokalni` : 'Profil specjalisty | Lokalni',
      description: d.bio ? String(d.bio).slice(0, 200) : 'Sprawdź profil specjalisty na portalu Lokalni.',
      imageUrl: normalizeMediaUrl(d.profilowe) || normalizeMediaUrl(d.zdjecieTla) || DEFAULT_IMAGE,
      name,
      avgRating: parseFloat(d.avgRating) || 0,
      reviewsCount: parseInt(d.reviewsCount) || 0,
    };
  } catch {
    return null;
  }
}

function buildProfileSchema(data, uid) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: data.name || 'Specjalista',
    url: `${FRONTEND_URL}/profile/${uid}`,
    image: data.imageUrl,
    description: data.description,
  };
  if (data.avgRating > 0 && data.reviewsCount > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: data.avgRating.toFixed(1),
      reviewCount: data.reviewsCount,
      bestRating: '5',
      worstRating: '1',
    };
  }
  return schema;
}

function injectSchema(html, schema) {
  const tag = `<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
  return html.replace('</head>', tag + '</head>');
}

async function buildOgResponse(env, request, ogMeta, schema) {
  const origin = new URL(request.url).origin;
  const spaRes = await env.ASSETS.fetch(new Request(origin + '/', { method: 'GET' }));
  let html = await spaRes.text();
  html = injectOgTags(html, ogMeta);
  if (schema) html = injectSchema(html, schema);

  const headers = new Headers(spaRes.headers);
  headers.set('Content-Type', 'text/html;charset=UTF-8');
  headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  return new Response(html, { status: 200, headers });
}

const BASE = FRONTEND_URL;
const TODAY = () => new Date().toISOString().slice(0, 10);

const STATIC_PAGES = [
  { loc: `${BASE}/`,                       priority: '1.0', changefreq: 'daily'   },
  { loc: `${BASE}/jak-to-dziala`,          priority: '0.8', changefreq: 'monthly' },
  { loc: `${BASE}/faq`,                    priority: '0.8', changefreq: 'monthly' },
  { loc: `${BASE}/o-nas`,                  priority: '0.7', changefreq: 'monthly' },
  { loc: `${BASE}/zasady-bezpieczenstwa`,  priority: '0.6', changefreq: 'monthly' },
  { loc: `${BASE}/regulamin`,              priority: '0.5', changefreq: 'monthly' },
  { loc: `${BASE}/polityka-prywatnosci`,   priority: '0.5', changefreq: 'monthly' },
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
  return `  <url><loc>${loc}</loc><lastmod>${lastmod ?? TODAY()}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

async function generateSitemap() {
  const today = TODAY();
  const lines = [
    ...STATIC_PAGES.map(u => urlTag(u.loc, u.priority, u.changefreq, today)),
    ...CATEGORY_CITY.map(slug => urlTag(`${BASE}/${slug}`, '0.9', 'daily', today)),
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
        if (!s.publicId) continue;
        const slug = s.title
          ? `${s.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 50)}-${s.publicId}`
          : s.publicId;
        const lastmod = s.updatedAt ? new Date(s.updatedAt).toISOString().slice(0, 10) : today;
        lines.push(urlTag(`${BASE}/service/${slug}`, '0.7', 'weekly', lastmod));
        if (s.provider?.uid) providerUids.add(s.provider.uid);
      }
      for (const uid of providerUids) {
        lines.push(urlTag(`${BASE}/profile/${uid}`, '0.6', 'weekly', today));
      }
    }
  } catch { /* timeout */ }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join('\n')}\n</urlset>`;
}

const CAT_LABELS = {
  'sprzatanie':'Sprzątanie','dom-ogrod':'Dom i Ogród','budowa':'Budowa i Remonty',
  'auto':'Auto i Mechanik','transport':'Transport','uroda':'Uroda',
  'it-naprawy':'IT i Naprawy','edukacja':'Edukacja','zdrowie':'Zdrowie',
  'zwierzeta':'Zwierzęta','finanse':'Finanse','opieka':'Opieka',
  'sztuka':'Sztuka','eventy':'Eventy','inne':'Inne usługi',
  // Keyword aliases — popular search terms
  'hydraulik':'Hydraulik','elektryk':'Elektryk','malarz':'Malarz',
  'korepetycje':'Korepetycje','catering':'Catering',
  'fryzjer':'Fryzjer','mechanik':'Mechanik','kosmetyczka':'Kosmetyczka',
  'fotograf':'Fotograf','fizjoterapeuta':'Fizjoterapeuta','ogrodnik':'Ogrodnik',
  'przeprowadzka':'Przeprowadzka','trener':'Trener personalny','dietetyk':'Dietetyk',
  'psycholog':'Psycholog','ksiegowy':'Księgowy','glazurnik':'Glazurnik',
  'dekarz':'Dekarz','murarz':'Murarz','instalator':'Instalator',
  'slusarz':'Ślusarz','opiekunka':'Opiekunka','niania':'Niania',
  'weterynarz':'Weterynarz','prawnik':'Prawnik','stolarz':'Stolarz',
  'tynkarz':'Tynkarz','klimatyzacja':'Klimatyzacja','mycie-okien':'Mycie okien',
  'lekcje-angielskiego':'Lekcje angielskiego','kurs-jazdy':'Kurs jazdy',
  'sprzatanie-biur':'Sprzątanie biur','naprawa-komputera':'Naprawa komputera',
};
const CITY_NAMES = {
  'warszawa':'Warszawa','krakow':'Kraków','wroclaw':'Wrocław','poznan':'Poznań',
  'gdansk':'Gdańsk','lodz':'Łódź','katowice':'Katowice','lublin':'Lublin',
  'bydgoszcz':'Bydgoszcz','szczecin':'Szczecin','bialystok':'Białystok','rzeszow':'Rzeszów',
  'gdynia':'Gdynia','czestochowa':'Częstochowa','radom':'Radom','torun':'Toruń',
  'sosnowiec':'Sosnowiec','kielce':'Kielce','gliwice':'Gliwice','olsztyn':'Olsztyn',
  'zabrze':'Zabrze','bielsko-biala':'Bielsko-Biała','bytom':'Bytom',
  'zielona-gora':'Zielona Góra','rybnik':'Rybnik','opole':'Opole','tychy':'Tychy',
  'tarnow':'Tarnów','koszalin':'Koszalin','kalisz':'Kalisz',
};
const SORTED_CATS  = Object.keys(CAT_LABELS).sort((a, b) => b.length - a.length);
const SORTED_CITIES = Object.keys(CITY_NAMES).sort((a, b) => b.length - a.length);

function parseCategorySlug(pathname) {
  const slug = pathname.slice(1);
  if (!slug || slug.includes('/') || slug.includes('.')) return null;
  for (const cat of SORTED_CATS) {
    if (slug === cat || slug.startsWith(cat + '-')) {
      const citySlug = slug.slice(cat.length).replace(/^-/, '');
      const cityName = citySlug ? (CITY_NAMES[citySlug] ?? null) : null;
      if (citySlug && !cityName) return null;
      return { label: CAT_LABELS[cat], cityName };
    }
  }
  for (const city of SORTED_CITIES) {
    if (slug.endsWith('-' + city) && slug.length > city.length + 1) {
      const kw = slug.slice(0, slug.length - city.length - 1).replace(/-/g, ' ');
      return { label: kw.charAt(0).toUpperCase() + kw.slice(1), cityName: CITY_NAMES[city] };
    }
  }
  if (CITY_NAMES[slug]) {
    return { label: 'Usługi lokalne', cityName: CITY_NAMES[slug] };
  }
  return null;
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    // ── /sitemap-services.xml — proxy do API (pełna DB, nie limit 100) ──────
    if (pathname === '/sitemap-services.xml') {
      const cache = caches.default;
      const cacheReq = new Request('https://mylokalni.pl/__sitemap-services-cache');
      const hit = await cache.match(cacheReq);
      if (hit) return hit;

      try {
        const apiRes = await fetch(`${API_URL}/public/sitemap/services`, {
          headers: { 'User-Agent': 'MyLokalni-Worker/1.0' },
          signal: AbortSignal.timeout(10000),
        });
        if (apiRes.ok) {
          const xml = await apiRes.text();
          const res = new Response(xml, {
            headers: {
              'Content-Type': 'application/xml; charset=utf-8',
              'Cache-Control': 'public, max-age=3600, s-maxage=3600',
            },
          });
          await cache.put(cacheReq, res.clone());
          return res;
        }
      } catch { /* fallback poniżej */ }
      return env.ASSETS.fetch(request);
    }

    // ── /service/:slug ────────────────────────────────────────────────────
    const serviceMatch = pathname.match(/^\/service\/([^/?#]+)/);
    if (serviceMatch) {
      const slug = serviceMatch[1];
      const parts = slug.split('-');
      const publicId = parts[parts.length - 1];

      let title = parts.length > 1
        ? parts.slice(0, -1).join(' ').replace(/\b\w/g, l => l.toUpperCase())
        : slug;
      let description = 'Sprawdź ofertę specjalisty na portalu Lokalni.';
      let imageUrl = DEFAULT_IMAGE;
      let serviceSchema = null;

      if (publicId) {
        const data = await fetchServiceOg(publicId);
        if (data) {
          if (data.title)       title       = data.title;
          if (data.description) description = data.description;
          if (data.imageUrl)    imageUrl    = data.imageUrl;
          serviceSchema = buildServiceSchema(
            { ...data, title: title.includes('MyLokalni') ? title : `${title} | MyLokalni.pl`, description, imageUrl },
            slug
          );
        }
      }

      return buildOgResponse(env, request, {
        title: title.includes('MyLokalni') ? title : `${title} | MyLokalni.pl`,
        description,
        imageUrl,
        pageUrl: `${FRONTEND_URL}/service/${slug}`,
        ogType: 'website',
      }, serviceSchema);
    }

    // ── /profile/:uid ─────────────────────────────────────────────────────
    const profileMatch = pathname.match(/^\/profile\/([^/?#]+)/);
    if (profileMatch) {
      const uid = profileMatch[1];

      let title = 'Specjalista | MyLokalni.pl';
      let description = 'Sprawdź profil specjalisty na MyLokalni.pl – opinie, usługi, kontakt.';
      let imageUrl = DEFAULT_IMAGE;

      const data = await fetchProfileOg(uid);
      let profileSchema = null;
      if (data) {
        title       = data.title;
        description = data.description;
        imageUrl    = data.imageUrl;
        profileSchema = buildProfileSchema({ ...data, description }, uid);
      }

      return buildOgResponse(env, request, {
        title,
        description,
        imageUrl,
        pageUrl: `${FRONTEND_URL}/profile/${uid}`,
        ogType: 'profile',
      }, profileSchema);
    }

    // ── Category/city landing pages ───────────────────────────────────────
    const catInfo = parseCategorySlug(pathname);
    if (catInfo) {
      const { label, cityName } = catInfo;
      const pageLabel = cityName ? `${label} ${cityName}` : label;
      const cityPrep  = cityName ? `w ${cityName}` : 'w Polsce';
      return buildOgResponse(env, request, {
        title: `${pageLabel} | MyLokalni.pl`,
        description: `Szukaj: ${label} ${cityPrep} – sprawdzeni specjaliści z opiniami i cenami. Zarezerwuj online na MyLokalni.pl.`,
        imageUrl: DEFAULT_IMAGE,
        pageUrl: `${FRONTEND_URL}${pathname}`,
        ogType: 'website',
      });
    }

    // ── Wszystko inne → statyczne assety / SPA fallback ───────────────────
    return env.ASSETS.fetch(request);
  },
};
