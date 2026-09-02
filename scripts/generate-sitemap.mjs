import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dir, '..', 'public');

const BASE  = 'https://mylokalni.pl';
const TODAY = new Date().toISOString().slice(0, 10);

// Core categories (mapped to API categories)
const CATEGORIES = [
  'sprzatanie','dom-ogrod','budowa','auto','transport',
  'uroda','it-naprawy','edukacja','zdrowie','zwierzeta',
  'finanse','opieka','sztuka','eventy','inne',
];

// Popular keyword aliases — high-volume Polish local service searches
const POPULAR_KEYWORDS = [
  'hydraulik','elektryk','malarz','korepetycje','catering',
  'fryzjer','mechanik','kosmetyczka','fotograf','fizjoterapeuta',
  'ogrodnik','przeprowadzka','trener','dietetyk','psycholog',
  'ksiegowy','glazurnik','dekarz','murarz','instalator',
  'slusarz','opiekunka','niania','weterynarz','prawnik',
  'stolarz','tynkarz','klimatyzacja','mycie-okien','lekcje-angielskiego',
  'kurs-jazdy','sprzatanie-biur','naprawa-komputera',
];

const ALL_KEYWORDS = [...CATEGORIES, ...POPULAR_KEYWORDS];

// Top 12 cities — all keywords × these cities
const TOP_CITIES = [
  'warszawa','krakow','wroclaw','poznan','gdansk',
  'lodz','katowice','lublin','bydgoszcz','szczecin',
  'bialystok','rzeszow',
];

// Extended cities — only core categories × these cities
const EXTRA_CITIES = [
  'gdynia','czestochowa','radom','torun','sosnowiec',
  'kielce','gliwice','olsztyn','zabrze','bielsko-biala',
  'bytom','zielona-gora','rybnik','opole','tychy',
  'tarnow','koszalin','kalisz',
];

const ALL_CITIES = [...TOP_CITIES, ...EXTRA_CITIES];

function u(loc, priority, changefreq, lastmod = TODAY) {
  return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

function urlset(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;
}

function write(filename, content) {
  writeFileSync(join(PUBLIC, filename), content, 'utf-8');
}

// Usuń stare sub-sitemaps jeśli istnieją
for (const f of ['sitemap-static.xml','sitemap-category-city.xml','sitemap-profiles.xml']) {
  const p = join(PUBLIC, f);
  if (existsSync(p)) unlinkSync(p);
}

// 1. sitemap-categories.xml — strony statyczne + wszystkie kategorie + popularne słowa kluczowe
const categoryUrls = [
  u(`${BASE}/`,                      '1.0', 'daily'),
  u(`${BASE}/jak-to-dziala`,         '0.8', 'monthly'),
  u(`${BASE}/faq`,                   '0.8', 'monthly'),
  u(`${BASE}/o-nas`,                 '0.7', 'monthly'),
  u(`${BASE}/zasady-bezpieczenstwa`, '0.6', 'monthly'),
  u(`${BASE}/regulamin`,             '0.5', 'monthly'),
  u(`${BASE}/polityka-prywatnosci`,  '0.5', 'monthly'),
  // Wszystkie słowa kluczowe (kategorie + aliasy) bez miasta
  ...ALL_KEYWORDS.map(kw => u(`${BASE}/${kw}`, '0.9', 'daily')),
];
write('sitemap-categories.xml', urlset(categoryUrls));
console.log(`✓ sitemap-categories.xml (${categoryUrls.length} URL)`);

// 2. sitemap-locations.xml — miasta + słowa kluczowe × miasta
const locationUrls = [
  // Strony dla samych miast
  ...ALL_CITIES.map(city => u(`${BASE}/${city}`, '0.8', 'daily')),
];

// Wszystkie słowa kluczowe × 12 głównych miast (pełne pokrycie)
for (const kw of ALL_KEYWORDS) {
  for (const city of TOP_CITIES) {
    locationUrls.push(u(`${BASE}/${kw}-${city}`, '0.9', 'daily'));
  }
}

// Tylko kategorie × rozszerzone miasta (dodatkowe pokrycie dla większych miast)
for (const cat of CATEGORIES) {
  for (const city of EXTRA_CITIES) {
    locationUrls.push(u(`${BASE}/${cat}-${city}`, '0.8', 'daily'));
  }
}

write('sitemap-locations.xml', urlset(locationUrls));
console.log(`✓ sitemap-locations.xml (${locationUrls.length} URL)`);

// 3. sitemap-services.xml — placeholder (live data serwuje worker.js via API)
write('sitemap-services.xml', urlset([]));
console.log('✓ sitemap-services.xml (placeholder — live: /api/public/sitemap/services)');

// Sitemap index
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE}/sitemap-categories.xml</loc></sitemap>
  <sitemap><loc>${BASE}/sitemap-locations.xml</loc></sitemap>
  <sitemap><loc>${BASE}/sitemap-services.xml</loc></sitemap>
</sitemapindex>`);
console.log('✓ sitemap.xml (index, 3 sub-sitemaps)');

// Podsumowanie
const total = categoryUrls.length + locationUrls.length;
console.log(`\n📊 Łącznie: ${total} URL w statycznych sitemapach`);
console.log(`   + dynamiczne usługi i profile via API`);
