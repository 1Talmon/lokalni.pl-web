# SEO Architecture — MyLokalni.pl

Kompletna dokumentacja SEO + plan refaktoru. Source of truth dla każdej sesji pracy.

**Cel biznesowy:** każde aktywne ogłoszenie discoverable przez Google. Landing pages są PEŁNĄ aplikacją (jak OLX) — nie przekierowaniem. Jeden spójny system, zero granicy między "landing page" a "apką".

**Filozofia architektoniczna:** zero hardkodowanych list. Wszystko generowane live z Postgres. Strona istnieje jeśli ma >= 2 aktywnych serwisów — nie istnieje jeśli ma 0 (404).

---

## 1. Docelowa mapa URL-i

| Typ | Przykład | Skala | Status |
|---|---|---|---|
| Indywidualny post | `/service/koszenie-trawnika-abc123` | tyle ile postów w DB | ✅ działa |
| Kategoria | `/sprzatanie` | ~15 stron | ❌ brak w sitemap |
| Kategoria + miasto | `/sprzatanie-warszawa` | ~15 × N miast z DB | ⚠️ tylko 30 miast |
| Fraza z search_phrases | `/koszenie-trawnika` | top N fraz (count≥3) | ❌ nie zbudowane |
| Fraza + miasto | `/koszenie-trawnika-warszawa` | top N fraz × N miast | ❌ nie zbudowane |
| Strony statyczne | `/`, `/faq`, `/o-nas`, ... | 7 stron | ✅ działa |

**Trzy typy wyników Google (cel):**
1. `"koszenie trawnika warszawa"` → `/service/koszenie-trawnika-abc123` — bezpośrednio do posta ✅
2. `"sprzątanie Gdańsk"` → `/sprzatanie-gdansk` — listing kategorii+miasto ⚠️
3. `"usługi sprzątanie"` → `/sprzatanie` — listing kategorii ❌

---

## 2. Architektura docelowa — Droga B (pełna unifikacja)

### Obecny stan (problem)

```
(app)/layout.tsx  ←  AppProvider + AppShell + useAppLogic
    /              ←  HomeView (pełna apka)
    /chat          ←  pełna apka
    ...

[slug]/page.tsx   ←  OSOBNY route, brak AppProvider, tylko SSR
    /sprzatanie-warszawa  ←  lite landing page → auto-redirect do apki
```

Dwie oddzielne rzeczy. User z Google ląduje w "lite" wersji i musi przejść do apki.

### Docelowy stan (Droga B)

```
[slug]/page.tsx (edge SSR)
    generateMetadata()    ←  metadata + JSON-LD dla Google (server)
    fetchServices()       ←  initial data dla Google (server)
         ↓
    <LandingAppWrapper    ←  client component
        initialServices={services}
        keyword={kw}
        city={city}
    />
         ↓
    AppProvider           ←  ten sam co w (app)/ — useAppLogic, auth, WebSocket
         ↓
    LandingView           ←  nowy view: listing + search + filtry + auth
```

**Efekt:** `/sprzatanie-warszawa` ładuje SSR HTML (szybkie, Google to widzi), potem hydruje do pełnej apki z `useAppLogic`. User może się zalogować, dodać do ulubionych, zarezerwować — bez opuszczania URL-a.

### Co to oznacza dla architektury

- `LandingAutoRedirect` — **usuwamy całkowicie**
- `LandingNavbar` — **usuwamy**, zastąpione przez app `Navbar`
- `AppProvider` w `(app)/layout.tsx` — zostaje bez zmian
- `AppProvider` w `[slug]/LandingAppWrapper` — **nowa instancja** (poza (app)/ group, nie koliduje)
- Tab strip (`/chat`, `/calendar`, `/favorites`) — **nie pojawia się** na landing pages (LandingView ma własny layout bez tab strip)
- Apka (`/?q=...`) — nadal istnieje dla zaawansowanych filtrów i mapy, dostępna via link z landing pages

### Flow dla użytkownika (docelowy)

```
Google → /sprzatanie-warszawa
    ↓ SSR HTML (natychmiastowe)
    ↓ JS hydruje → AppProvider → useAppLogic ładuje auth, WebSocket
    ↓ User widzi: listing serwisów, searchbar, filtry, navbar
    ↓ Może: szukać w miejscu, klikać w serwisy, logować się, bookować
    ↓ Opcja: "Pokaż na mapie / zaawansowane filtry →" otwiera /?q=...
```

---

## 3. Ecosystem

```
Google Bot
   ↓ crawluje
mylokalni.pl (CF Pages / Next.js edge)
   ↓ SSR initial HTML + sitemap proxy
api.mylokalni.pl (Docker / Fastify)
   ↓ query
Postgres  ← source of truth (is_deleted, status, category, city, title, public_id)
   ↓ sync
Meilisearch  ← full-text search, zasila /services?query=... (SSR + client)
Redis  ← cache sitemaps 1h–12h
```

| Warstwa | Co robi |
|---|---|
| Next.js `[slug]/page.tsx` | Edge SSR: generateMetadata, initial HTML, JSON-LD (dla Google) |
| `LandingAppWrapper` | Client hydration: AppProvider + pełna apka na landing URL |
| `LandingView` | Nowy widok: listing + in-place search + filtry kategorii/miast |
| Fastify | Postgres/Meilisearch queries, Redis cache, sitemap endpoints |
| Postgres | Source of truth — sitemaps z tego generowane |
| Meilisearch | Fuzzy search dla SSR fetch i in-place search na landing pages |

---

## 4. Sitemap architecture (docelowa)

```
sitemap.xml (index)
├── sitemap-static.xml      — 7 stron informacyjnych      (RENAME z sitemap-categories.xml)
├── sitemap-categories.xml  — /sprzatanie, /auto, ...     (NOWE — real kategorie z DB)
├── sitemap-services.xml    — każdy aktywny post           ✅ działa
├── sitemap-search.xml      — keyword×miasto z DB          ✅ działa (fix miast w toku)
└── sitemap-keywords.xml    — frazy search_phrases×miasto  (NOWE)
```

### sitemap-static.xml
7 statycznych stron: `/` (1.0), `/jak-to-dziala`, `/faq` (0.8), `/o-nas` (0.7), `/zasady-bezpieczenstwa` (0.6), `/regulamin`, `/polityka-prywatnosci` (0.5).

### sitemap-categories.xml (NOWE)
Backend: `GET /public/sitemap/category-pages` — `SELECT DISTINCT category HAVING COUNT(*) >= 2`, Redis 6h.
Format: `/${CATEGORY_SLUG[category]}` → `/sprzatanie`, `/auto`, `/transport`...

### sitemap-services.xml ✅
Backend: `GET /public/sitemap/services` — aktywne posty, Redis 1h. Format: `/service/${toSlug(title)}-${public_id}`.

### sitemap-search.xml ✅
Backend: `GET /public/sitemap/search-pages` — `GROUP BY category, city HAVING COUNT(*) >= 2`, Redis 6h.
Format: `/${CATEGORY_SLUG[category]}-${toSlug(city)}`.

### sitemap-keywords.xml (NOWE)
Backend: `GET /public/sitemap/keyword-pages` — `search_phrases WHERE count >= 3` × aktywne miasta, Redis 12h.
Format: `/${toSlug(phrase)}` + `/${toSlug(phrase)}-${toSlug(city)}`.

---

## 5. Meilisearch

**JEST:** fuzzy full-text search — zasila in-place search na landing pages i apkę.
**NIE JEST:** source of truth dla sitemaps. Sitemaps = Postgres.

### Sync flow
- Runtime: `POST/PATCH/DELETE /services` → `indexService()` / `deleteFromIndex()`
- Startup: `syncMeilisearch()` — usuwa stale IDs, upsertuje wszystkie aktywne (batch 100)
- Manual: `ssh main && docker exec lokalni-api-1 node dist/db/sync-meilisearch.js`

---

## 6. Auto-generation flow (docelowy)

```
User dodaje post "Koszenie trawnika, Gdańsk"
        ↓
INSERT Postgres + indexService() Meilisearch
+ redis.del('sitemap:services:v2')
+ redis.del('sitemap:search-pages:v1')
+ redis.del('sitemap:keyword-pages:v1')
        ↓
[natychmiast] sitemaps zaktualizowane
        ↓
Google crawluje → /koszenie-trawnika-gdansk
        ↓
Edge SSR: fetchServices("koszenie trawnika", "Gdańsk") → 2+ wyniki → index: true
Google widzi: H1, lista serwisów, metadata, JSON-LD
        ↓
User z Google klika → /koszenie-trawnika-gdansk
        ↓
SSR HTML (szybkie) → hydruje AppProvider → LandingView z useAppLogic
User widzi: listing, może szukać w miejscu, zalogować się, zarezerwować
```

**Usunięcie ostatniego posta:**
```
DELETE → redis.del() → sitemap refresh → brak URL
Googlebot crawluje → 0 wyników → notFound() → 404 → Google deindeksuje
```

---

## 7. Szczegóły techniczne

### 7.1 `[slug]/page.tsx` — nowa struktura (po refaktorze)

```tsx
export const runtime = 'edge';

export async function generateMetadata({ params }) {
  // bez zmian — server component, edge SSR
  const services = await fetchServices(...)
  const robotsIndex = services.length >= 2
    ? { robots: { index: true } }
    : { robots: { index: false } }
  return { title: `${services.length} ofert: ${kw} w ${city}`, ...robotsIndex }
}

export default async function SlugPage({ params }) {
  const services = await fetchServices(...)
  if (services.length === 0) notFound()

  return (
    <>
      {/* JSON-LD scripts — widoczne dla Google */}
      <script type="application/ld+json" ... />
      {/* Client wrapper — pełna apka po hydratacji */}
      <LandingAppWrapper
        initialServices={services}
        keyword={kw}
        city={city}
        slug={slug}
      />
    </>
  )
}
```

### 7.2 `LandingAppWrapper.tsx` — nowy komponent

```tsx
'use client'
// Wraps landing page content with AppProvider (same as (app)/layout.tsx)
// Osobna instancja — poza (app)/ group, nie koliduje
export function LandingAppWrapper({ initialServices, keyword, city, slug }) {
  return (
    <QueryProvider>
      <AppProvider>
        <LandingView
          initialServices={initialServices}
          keyword={keyword}
          city={city}
        />
      </AppProvider>
    </QueryProvider>
  )
}
```

### 7.3 `LandingView.tsx` — nowy widok

Zastępuje obecny inline JSX w `[slug]/page.tsx`. Używa `useApp()` dla:
- In-place search (setSearchQuery, setLocation)
- Favorites (toggleFavorite)
- Auth state (isLoggedIn)
- Modal (add service, login)

Layout:
```
Navbar (z apki, z auth state)
│
├── Hero: H1, count, opis, LandingSearchBar (in-place)
├── Filtry: kategorie, miasta (link do innych landing pages)
├── Listing: ServiceGrid (karty z ulubionym, cena, ocena)
├── CTA: "Pokaż na mapie / zaawansowane filtry →" (link do /?q=...)
├── Content: opis kategorii, FAQ, stats
└── Footer
```

### 7.4 `LandingSearchBar` — nowe zachowanie

Zamiast `router.replace('/?q=...')`:
```typescript
onSubmit(keyword, city) {
  // Spróbuj nawigować do landing page (SEO-friendly)
  const slug = buildSlug(keyword, city)  // np. "hydraulik-warszawa"
  router.push(`/${slug}`)
  // Fallback: jeśli slug nie istnieje → 404 → graceful redirect do /?q=...
  // (Next.js notFound() na [slug]/page.tsx obsługuje to automatycznie)
}
```

### 7.5 Elastyczny parser slug-ów

Obecny `parseLandingSlug` waliduje przeciwko 30 miastom + 48 keywordom. Docelowy parser:
```typescript
function parseSlug(slug) {
  // 1. Exact keyword match (ALL_KEYWORDS)
  if (ALL_KEYWORDS.includes(slug)) return { type: 'keyword', keyword: slug }

  // 2. Exact city match (ALL_CITIES)
  if (ALL_CITIES.includes(slug)) return { type: 'city', city: slug }

  // 3. Keyword + city: szukaj keyword prefix (sort malejąco po długości)
  for (const kw of [...ALL_KEYWORDS].sort((a, b) => b.length - a.length)) {
    if (slug.startsWith(kw + '-')) {
      return { type: 'keyword-city', keyword: kw, citySlug: slug.slice(kw.length + 1) }
    }
  }

  // 4. Dowolna fraza (search_phrases) — cały slug jako query
  //    Odetnij miasto z końca jeśli pasuje
  return { type: 'search', query: slug.replace(/-/g, ' ') }
}
```

### 7.6 Backend — city slug matching

Problem: `nowy-sacz` ≠ `Nowy Sącz` w DB. Fix w `services.routes.ts`:
```sql
WHERE city ILIKE $displayName
   OR LOWER(REGEXP_REPLACE(unaccent(city), '[^a-z0-9]+', '-', 'g')) = LOWER($citySlug)
```

### 7.7 Metadata z count

```typescript
title: `${services.length} ofert: ${kw} w ${city} | MyLokalni.pl`
// "45 ofert: Hydraulik w Warszawie | MyLokalni.pl"
// Social proof w Google SERP → większy CTR
```

### 7.8 AggregateRating JSON-LD

Na landing pages dodać schema z agregowaną oceną:
```json
{
  "@type": "AggregateRating",
  "ratingValue": "4.7",
  "reviewCount": "123"
}
```
Google może pokazać gwiazdki w wynikach wyszukiwania → +CTR.

### 7.9 Internal linking service → kategoria

Na stronie `/service/xxx` dodać link powrotny do kategorii:
```tsx
<Link href={`/${CATEGORY_SLUG[service.category]}`}>
  ← Wszystkie oferty: {CATEGORY_DISPLAY[service.category]}
</Link>
```
Google widzi hierarchię site → kategorie dostają PageRank z service pages.

### 7.10 Security headers
MUSZĄ być w `public/_headers`. `next.config.ts::headers()` nie działa na CF Pages.

---

## 8. Status implementacji — kompletny checklist

### ✅ Zrobione

- [x] Root metadata — title/OG/Twitter/JSON-LD w `layout.tsx`
- [x] `/service/[slug]` — edge SSR, generateMetadata, JSON-LD LocalBusiness, notFound()
- [x] `/profile/[uid]` — edge SSR, metadata
- [x] Strony statyczne — /faq, /jak-to-dziala, /o-nas, /regulamin, /polityka-prywatnosci, /zasady-bezpieczenstwa
- [x] `sitemap.xml` — index
- [x] `sitemap-services.xml` — proxy API, edge, force-dynamic
- [x] `API /public/sitemap/services` — Postgres, Redis 1h
- [x] `sitemap-search.xml` — proxy API, edge, force-dynamic
- [x] `API /public/sitemap/search-pages` — GROUP BY category×city HAVING >= 2, Redis 6h
- [x] `robots.ts` — Allow root, Disallow app routes
- [x] Middleware 301 — legacy URL → /service/slug
- [x] `public/_headers` — CSP, HSTS
- [x] Meilisearch runtime sync — indexService/deleteFromIndex w routes
- [x] Meilisearch startup cleanup — syncMeilisearch() w server.ts
- [x] `[slug]/page.tsx` — index: true gdy >= 2 wyniki, notFound() gdy 0
- [x] AppShell ?q= + ?city= — pre-fill search state

### ☐ Do zrobienia — 4 fazy (bez podwójnej roboty)

> **Klucz:** Faza 3 to DROGA B — refaktor `[slug]/page.tsx`. Wszystko co dotyka tego pliku
> (elastyczny parser, Meilisearch, metadata z count, AggregateRating) robimy **razem** w Fazie 3,
> nie osobno wcześniej. Backend i niezależny frontend robimy wcześniej, żeby nie wracać.

---

### FAZA 1 — Backend (tylko API, nie dotykamy frontu)

> Kolejność w Fazie 1 nie ma znaczenia — wszystkie są niezależne. Można paralelnie.

**F1-A — Cache invalidation w CRUD (~30 min) ✅ ZROBIONE**
- [x] `'sitemap:search-pages:v1'` dodane do `SITEMAP_KEYS` w `services.routes.ts`
- Efekt: sitemaps aktualizują się natychmiast po każdej operacji CRUD

**F1-B — City slug matching w GET /services (~1h) ✅ ZROBIONE**
- [x] `GET /services` akceptuje `citySlug` (np. `nowy-sacz`) jako alternatywę dla `city`
- [x] SQL: `OR LOWER(REGEXP_REPLACE(unaccent(city), '[^a-z0-9]+', '-', 'g')) = LOWER($citySlug)`
- [x] Dodaj `citySlug` do `servicesQuerySchema` w `services.schema.ts`
- Efekt: każde miasto z DB działa, nie tylko 30 hardkodowanych

**F1-C — Backend: endpoint category-pages (~30 min) ✅ ZROBIONE**
- [x] `GET /public/sitemap/category-pages` w `public.routes.ts`
- [x] SQL: `SELECT DISTINCT category FROM services WHERE is_deleted=FALSE HAVING COUNT(*) >= 2`
- [x] Mapuj przez `CATEGORY_SLUG`, Redis 6h (`sitemap:category-pages:v1`)
- [x] `redis.del('sitemap:category-pages:v1')` dodać do `SITEMAP_KEYS` w services.routes.ts
- Efekt: /sprzatanie, /auto, /transport itd. odkrywalne przez Google

**F1-D — Backend: endpoint keyword-pages (~1h) ✅ ZROBIONE**
- [x] `GET /public/sitemap/keyword-pages` w `public.routes.ts`
- [x] SQL: `search_phrases WHERE count >= 3` × aktywne miasta (GROUP BY city HAVING >= 2)
- [x] Format: `{ slug, phrase, city?, count }[]`, Redis 12h (`sitemap:keyword-pages:v1`)
- [x] `redis.del('sitemap:keyword-pages:v1')` dodać do `SITEMAP_KEYS`
- Efekt: backend generuje /koszenie-trawnika, /koszenie-trawnika-warszawa itd.

---

### FAZA 2 — Frontend niezależny (nie dotykamy `[slug]/page.tsx`)

> Pliki w tej fazie są **nowe** lub na innych routach — żaden nie zostanie nadpisany w Fazie 3.

**F2-A — Restrukturyzacja sitemaps (~30 min) ✅ ZROBIONE**
- [x] Rename route folder: `sitemap-categories.xml/` → `sitemap-static.xml/`
- [x] Nowy folder `sitemap-categories.xml/route.ts` → proxy do `category-pages` API (wymaga F1-C)
- [x] Aktualizacja `sitemap.xml` index: zamień `sitemap-categories` → `sitemap-static`, dodaj `sitemap-categories` i `sitemap-keywords`
- Efekt: sitemap index wskazuje na właściwe pliki

**F2-B — sitemap-keywords.xml (~20 min) ✅ ZROBIONE**
- [x] Nowy `src/app/sitemap-keywords.xml/route.ts` — proxy do `keyword-pages` API (wymaga F1-D)
- Efekt: Google odkrywa frazy z search_phrases

**F2-C — Internal linking service → kategoria (~30 min) ✅ ZROBIONE**
- [x] `/service/[slug]` — breadcrumb link `← Wszystkie: ${kategoria}` → `/${CATEGORY_SLUG[...]}` 
- [x] Plik: `src/app/service/[slug]/ServiceDetailsClient.tsx`
- [x] `CATEGORY_SLUG` dodany do `src/lib/seo-data.ts`
- Efekt: Google widzi hierarchię, kategorie dostają PageRank z postów

**F2-D — Google Search Console setup (manualne, ~30 min)**
- [ ] Dodaj właściwość `mylokalni.pl` w GSC
- [ ] Submit `https://mylokalni.pl/sitemap.xml`
- [ ] Sprawdź Coverage: indexed vs excluded
- [ ] Monitor: Rich Results, Performance per query

---

### FAZA 3 — DROGA B: Pełna unifikacja landing pages z apką (~2–3 tygodnie) 🏆

> **Cel:** `/sprzatanie-warszawa` = pełna apka z SSR HTML dla Google. Jak OLX.
> Robimy tu WSZYSTKO co dotyka `[slug]/page.tsx` — żeby nie wracać.

**F3-A — Elastyczny parser slug-ów (zastępuje `parseLandingSlug`) ✅ ZROBIONE**
- [x] Nowa funkcja `parseSlug(slug)` w `src/lib/seo-data.ts`
- [x] Obsługa: exact keyword, exact city, keyword+citySlug, dowolna fraza (type='search')
- [x] Przekazuje `citySlug` do `fetchServices` → backend używa F1-B
- [x] `buildLandingSlug()` do budowania URL-i z search bara

**F3-B — Meilisearch-driven parser dla dowolnych fraz ✅ ZROBIONE**
- [x] Gdy parser z F3-A zwraca type='search' → query = slug jako zdania, citySlug opcjonalny
- [x] `fetchServices` przekazuje `query` do Meilisearch przez GET /services?query=...

**F3-C — `LandingAppWrapper.tsx` — nowy komponent ✅ ZROBIONE**
- [x] `'use client'` wrapper z `QueryProvider` + `AppProvider`
- [x] Osobna instancja AppProvider (poza `(app)/` group — nie koliduje)
- [x] Props: `initialServices`, `keyword`, `city`, `slug`

**F3-D — `LandingView.tsx` — nowy widok ✅ ZROBIONE**
- [x] Używa `useApp()` dla auth, favorites, Navbar state
- [x] Layout: Navbar (z apki) + Hero (H1, count) + LandingSearchBar + ServiceGrid + CTA + Footer
- [x] Brak tab strip (inny niż HomeView)
- [x] CTA "Pokaż na mapie / zaawansowane filtry →" → `/?q=...&city=...`
- [x] LandingServiceCard z obsługą ulubionych (serce)

**F3-E — `[slug]/page.tsx` refaktor ✅ ZROBIONE**
- [x] Usunięto cały inline JSX (city page section, keyword page section)
- [x] Zostaje: `generateMetadata`, `fetchServices`, `notFound()`, JSON-LD scripts
- [x] Dodano: `<LandingAppWrapper initialServices={services} keyword={kw} city={city} />`
- [x] **Metadata z count:** `title: \`${count} ofert: ${h1} | MyLokalni.pl\``
- [x] **AggregateRating JSON-LD:** AVG(rating) × COUNT → gwiazdki w Google SERP
- [x] Używa `parseSlug` zamiast `parseLandingSlug`

**F3-F — `LandingSearchBar` — nowe zachowanie ✅ ZROBIONE**
- [x] Zamiast `router.push('/?q=...')` → `router.push('/${buildLandingSlug(kw, city)}')`
- [x] Nawiguje do landing page URL (SEO-friendly)

**F3-G — Usuń przestarzałe pliki ✅ ZROBIONE**
- [x] Usunieto `LandingAutoRedirect.tsx`
- [x] Usunięto `LandingNavbar.tsx`

**F3-H — Testy przed deployem**
- [ ] Auth na landing page — user loguje się na /sprzatanie-warszawa bez opuszczania URL
- [ ] Favorites — serce na karcie działa bez przejścia do apki
- [ ] Klik w serwis → /service/xxx (bez zmian)
- [ ] Mobile — brak tab strip, jest bottom nav
- [ ] `curl -A "Googlebot" https://mylokalni.pl/sprzatanie-warszawa` widzi SSR HTML z H1 i listingiem

---

### FAZA 4 — Po Drodze B (gdy Faza 3 na produkcji)

**F4-A — Core Web Vitals audit (~2h)**
- [ ] PageSpeed Insights dla /sprzatanie-warszawa (mobile + desktop) — dopiero po Fazie 3
- [ ] LCP, CLS, INP — napraw cokolwiek < 50 punktów

**F4-B — Content layer na landing pages ✅ ZROBIONE**
- [x] `src/lib/landing-content.ts` — 15 kategorii z opisem, 5 FAQ, 4 powiązane + `TOP_CITIES_DISPLAY`
- [x] `LandingView.tsx` — sekcja opisu, FAQ accordion, "w innych miastach", "powiązane kategorie"
- Efekt: strony mają realną wartość informacyjną → Google rankuje wyżej

**F4-C — Paginacja dla dużych kategorii ✅ ZROBIONE**
- [x] `src/app/[slug]/[page]/page.tsx` — trasa dla stron 2+, offset API, rel prev/next
- [x] `src/app/[slug]/_lib/shared.ts` — wspólne helpers + `PAGE_SIZE = 24`
- [x] `LandingView` — nawigacja ← Poprzednia / Następna →, numer strony w H1

---

## 9. Co usuwamy po refaktorze (Droga B)

| Plik | Akcja |
|---|---|
| `src/app/[slug]/_components/LandingAutoRedirect.tsx` | Usuń |
| `src/app/[slug]/_components/LandingNavbar.tsx` | Usuń |
| `src/app/[slug]/_components/LandingSearchBar.tsx` | Zostaw / przepisz zachowanie |
| `src/app/[slug]/_components/LandingServiceCard.tsx` | Zostaw — reused w LandingView |
| `src/lib/seo-data.ts` — `LANDING_SLUGS` | Usuń (zastąpione dynamicznym parserem) |
| `src/lib/seo-data.ts` — `parseLandingSlug` | Zastąp elastycznym parserem |

---

## 10. Kluczowe decyzje architektoniczne

**Q: Dlaczego Droga B a nie A?**
A: Droga A zostawia trwałą granicę — użytkownik zawsze "przeskakuje" między landing page a apką. Droga B to właściwa architektura na lata. Landing pages są pełną apką od razu.

**Q: Jak AppProvider w [slug]/ nie koliduje z (app)/layout.tsx?**
A: `[slug]/` jest poza group `(app)/` — żaden rodzic nie dostarcza AppContext. `LandingAppWrapper` tworzy własną, izolowaną instancję AppProvider. Dwa oddzielne drzewa React bez konfliktów.

**Q: Czy edge runtime + AppProvider (client) nie jest sprzeczne?**
A: Nie. `[slug]/page.tsx` jest server component (edge) — renderuje SSR HTML + JSON-LD. `LandingAppWrapper` jest client component — hydruje po stronie przeglądarki. Next.js obsługuje ten split natywnie.

**Q: Dlaczego notFound() a nie noindex dla pustych stron?**
A: noindex = URL w indeksie (waste crawl budget). 404 = URL usunięty z indeksu całkowicie.

**Q: Dlaczego Postgres → sitemap, nie Meilisearch?**
A: Meilisearch może mieć dryf. Postgres = source of truth. Sitemap musi być dokładny.

**Q: count >= 2 a nie >= 1?**
A: Jedna oferta to za mało żeby strona miała SEO value. >= 2 gwarantuje sensowny listing.

---

## 11. Monitoring

```bash
# Sitemap index
curl -s https://mylokalni.pl/sitemap.xml

# Ile ogłoszeń
curl -s https://mylokalni.pl/sitemap-services.xml | grep -c "<url>"

# Ile kombinacji keyword×miasto
curl -s https://mylokalni.pl/sitemap-search.xml | grep -c "<url>"

# Kategorie (po Fix #4)
curl -s https://mylokalni.pl/sitemap-categories.xml | grep -c "<url>"

# Frazy keyword pages (po Fix #6)
curl -s https://mylokalni.pl/sitemap-keywords.xml | grep -c "<url>"

# SSR content dla Googlebota
curl -s -A "Googlebot" https://mylokalni.pl/sprzatanie-warszawa | grep -E "<title>|og:title|<h1>"

# Redis cache keys
ssh main "docker exec lokalni-redis redis-cli KEYS 'sitemap:*'"

# Meilisearch stats
ssh main "docker exec lokalni-meilisearch curl -s http://localhost:7700/stats"
```

---

## 12. Ryzyko i limity

| Ryzyko | Opis | Mitigation |
|---|---|---|
| AppProvider double-mount | Dwie instancje AppProvider (app + landing) — osobne WebSocket, auth check | Normalne — izolowane drzewa React, nie kolidują |
| Crawl budget | 500 fraz × 50 miast = 25k URL-i | Priorytetyzuj sitemap priority tag, top frazy najpierw |
| LandingView mobile UX | Brak tab strip na landing — inny niż apka | Bottom nav CTA zamiast tab strip na mobile |
| Meilisearch dryf | Między restartami API możliwy krótki dryf | Startup sync naprawia |
| CF Pages edge timeout 30s | Duże sitemaps mogą przekroczyć | Redis cache eliminuje DB query per request |
| Doorway page risk | Eliminuje Fix #8 — strony NIE są przekierowaniami | Google widzi pełną apkę, nie redirect trap |

---

## 13. Pliki kluczowe (docelowe)

| Plik | Co robi |
|---|---|
| `src/app/[slug]/page.tsx` | Edge SSR: generateMetadata, fetchServices, notFound(), JSON-LD |
| `src/app/[slug]/_components/LandingAppWrapper.tsx` | Client: AppProvider + QueryProvider wrapper |
| `src/app/[slug]/_components/LandingView.tsx` | Widok: listing + search + filtry (używa useApp()) |
| `src/app/[slug]/_components/LandingSearchBar.tsx` | Search → nawigacja do landing page URL |
| `src/app/[slug]/_components/LandingServiceCard.tsx` | Karta serwisu (reused) |
| `src/app/sitemap.xml/route.ts` | Sitemap index |
| `src/app/sitemap-static.xml/route.ts` | 7 statycznych stron |
| `src/app/sitemap-categories.xml/route.ts` | Proxy → category-pages API |
| `src/app/sitemap-services.xml/route.ts` | Proxy → services API |
| `src/app/sitemap-search.xml/route.ts` | Proxy → search-pages API |
| `src/app/sitemap-keywords.xml/route.ts` | Proxy → keyword-pages API |
| `src/lib/seo-data.ts` | ALL_KEYWORDS, ALL_CITIES, elastyczny parser (refaktor) |
| `Lokalni API/src/modules/public/public.routes.ts` | Wszystkie /public/sitemap/* endpointy |
| `Lokalni API/src/modules/services/services.routes.ts` | CRUD + redis.del() po Fix #1 |
