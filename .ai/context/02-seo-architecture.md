# SEO Architecture — MyLokalni.pl

Kompletna dokumentacja jak działa SEO, sitemapy, generowanie stron i Meilisearch w projekcie `lokalni-web` (Next.js 15 + CF Pages) w połączeniu z backendem `Lokalni API` (Fastify + Postgres + Meilisearch).

**Cel biznesowy SEO:** każdy realny post w bazie powinien być odkrywalny przez Google — zarówno przez indywidualną stronę (`/service/[slug]`), jak i przez dynamiczne strony kategorii+miasto (`/kategoria-miasto`) generowane wyłącznie z prawdziwych danych. Puste kombinacje nigdy nie powinny istnieć w indeksie Google.

**Filozofia:** brak hardkodowanych list. Wszystko generowane live z Postgres/Meilisearch. Zero pustych stron w Google. User z Google zawsze ląduje w apce (HomeView) z pre-fillowanym wyszukiwaniem.

---

## 1. Ecosystem — kto co robi

```
Google Bot
   ↓ crawluje
mylokalni.pl (CF Pages / Next.js)
   ↓ sitemap proxy
api.mylokalni.pl (Docker / Fastify)
   ↓ query
Postgres  ← soft-delete (is_deleted), status='active'
   ↓ sync
Meilisearch (index 'services')  ← full-text search
```

**Odpowiedzialności:**

| Warstwa | Co robi |
|---|---|
| Next.js (`lokalni-web`) | Renderuje strony SSR/SSG dla Google, sitemap-y XML, canonical URLs, metadata, JSON-LD |
| Fastify (`Lokalni API`) | Query do Postgres, cache Redis, generuje XML sitemap-services + endpoint search-pages |
| Postgres | Source of truth — `services` table z `is_deleted`, `status`, `category`, `city`, `title`, `public_id` |
| Meilisearch | Full-text search dla apki użytkownika (nie dla SEO — SEO idzie przez SSR z Postgres) |

---

## 2. Wejścia z Google — pełna mapa URL

Wszystkie ścieżki którymi Google może sprowadzić użytkownika na serwis:

| URL | Typ strony | Rendering | Zawartość dla Google | Kliknięcie → |
|---|---|---|---|---|
| `/` | Homepage | Client (app) | Meta tagi, JSON-LD Organization+WebSite | HomeView |
| `/service/[slug]` | Konkretne ogłoszenie | Edge SSR | Pełny content: title, opis, cena, JSON-LD LocalBusiness | Widok szczegółowy ogłoszenia |
| `/[category-city]` | Dynamiczna strona kategorii+miasta (NEW) | Edge SSR | Lista serwisów z tej kombinacji, metadata | Auto-redirect do `/?q=...&city=...` → HomeView z pre-fillem |
| `/faq`, `/o-nas`, `/regulamin`, `/polityka-prywatnosci`, `/jak-to-dziala`, `/zasady-bezpieczenstwa` | Strony informacyjne | Static | Statyczna treść | Ta sama strona |

**Nie indexowane (celowo):**
- `/[slug]` w obecnej formie (hardkodowane 924 landing pages) — `noindex`, wygaszane na rzecz dynamic search pages
- `/?q=...&city=...` — client-only, brak SSR contentu, brak metadata
- `/auth`, `/dashboard`, `/chat`, `/favorites`, `/calendar` — strony wymagające logowania
- `/invite/[code]`, `/r/[code]` — jednorazowe linki marketingowe
- `/verify-email`, `/reset-password`, `/delete-account*` — flow auth
- `/booking-form`, `/support` — akcje wewnątrz apki

---

## 3. Sitemap architecture

Sitemap index (`/sitemap.xml`) wskazuje na 2 sub-sitemapy:

```
sitemap.xml (index)
├── sitemap-categories.xml  — 7 statycznych stron (/, /faq, /jak-to-dziala, ...)
└── sitemap-services.xml    — wszystkie aktywne ogłoszenia z Postgres
```

**Docelowo dojdzie:**
```
└── sitemap-search.xml      — dynamiczne strony kategoria×miasto (z realnych danych)
```

### 3.1 `sitemap-services.xml` — realne ogłoszenia

**Frontend:** `src/app/sitemap-services.xml/route.ts` — edge runtime, `force-dynamic`, proxy do API.

**Backend:** `GET /public/sitemap/services` w `Lokalni API`:
- Query: `SELECT public_id, title, updated_at FROM services WHERE is_deleted = FALSE AND status = 'active' AND deleted_at IS NULL ORDER BY updated_at DESC`
- Cache: Redis, klucz `sitemap:services:v2`, TTL 1h
- URL format: `${BASE}/service/${toSlug(title)}-${public_id}`
- `<lastmod>` z `updated_at`

**Auto-refresh:**
- Post dodany → `INSERT` w Postgres → **po max 1h** znika Redis cache → nowy XML zawiera post
- Post usunięty (`is_deleted=TRUE`) → **po max 1h** znika z sitemap
- Post edytowany → `updated_at` się zmienia, `<lastmod>` się zmieni **po max 1h**

**Uwaga:** można dodać `redis.del('sitemap:services:v2')` w routes `POST/PATCH/DELETE /services` żeby refresh był natychmiastowy — obecnie nie jest, ale Google crawluje sitemapy co kilka dni więc 1h to komfortowe okno.

### 3.2 `sitemap-categories.xml` — strony informacyjne

**Frontend:** `src/app/sitemap-categories.xml/route.ts` — statyczna lista 7 URL-i:
- `/` (priority 1.0, daily)
- `/jak-to-dziala`, `/faq` (0.8, monthly)
- `/o-nas` (0.7, monthly)
- `/zasady-bezpieczenstwa` (0.6, monthly)
- `/regulamin`, `/polityka-prywatnosci` (0.5, monthly)

**Nie ma landing pages kategorii** (`/auto`, `/edukacja`, etc.) — usunięte, bo landing pages są `noindex`.

### 3.3 `sitemap-search.xml` — DYNAMICZNE strony kategoria×miasto (do wdrożenia)

**Docelowo:**
- Frontend: `src/app/sitemap-search.xml/route.ts` — proxy do API
- Backend: `GET /public/sitemap/search-pages` — zwraca unikalne kombinacje `category × city` które mają realne aktywne serwisy
- Query source of truth:
  ```sql
  SELECT DISTINCT category, city
  FROM services
  WHERE is_deleted = FALSE AND status = 'active' AND deleted_at IS NULL
    AND category IS NOT NULL AND category != ''
    AND city IS NOT NULL AND city != ''
  ```
- Cache Redis, klucz `sitemap:search-pages:v1`, TTL 6h (rzadziej się zmienia niż individual services)
- Format URL: `/${toSlug(category)}-${toSlug(city)}` (np. `/rejsy-rowy`, `/hydraulik-warszawa`)

---

## 4. Meilisearch — czym jest, czym nie jest

**JEST:** silnik full-text search dla apki użytkownika (`/services?query=...` używa Meilisearch dla fuzzy matching).

**NIE JEST:** źródłem prawdy dla SEO. SEO renderuje się z Postgres SSR. Meilisearch jest tylko dla dynamicznego search-a użytkownika.

### 4.1 Sync flow

**Runtime sync** (fire-and-forget):
- `POST /services` (create) → `indexService(data).catch(() => {})`
- `PATCH /services/:id` (update) → `reindexService(id)` → fetch fresh + indexService
- `DELETE /services/:id` (soft delete) → `deleteFromIndex(id).catch(() => {})`
- `POST /services/:id/restore` → `reindexService(id)`

**Startup sync + cleanup** (`syncMeilisearch()` w `server.ts`):
- Uruchamia się przy każdym starcie kontenera API
- Pobiera wszystkie aktywne ID z Postgres
- Pobiera wszystkie ID z Meilisearch (`getDocuments({ limit: 100000, fields: ['id'] })`)
- Usuwa stale (te w Meili ale nie w Postgres)
- Upsertuje wszystkie aktywne serwisy z Postgres do Meili (batch 100)
- Cel: naprawia dryf między Postgres a Meilisearch który mógł się pojawić gdy `.catch(() => {})` zjadł błąd

**Manual sync:**
```bash
ssh main
docker exec lokalni-api-1 node dist/db/sync-meilisearch.js
```

### 4.2 Konfiguracja indexu

```
Index: 'services'
Primary key: id
Searchable: title, description, category
Displayed: id, title, category
Filterable: category
Typo tolerance: enabled (1 typo od 5 znaków, 2 typo od 9)
```

### 4.3 Meilisearch a SEO — jak się łączą?

**W apce (użytkownik):**
```
User w HomeView wpisuje "rejs rib"
    ↓
GET /services?query=rejs+rib
    ↓
Backend: Meilisearch fuzzy search → zwraca IDs
    ↓
Backend: SQL "SELECT * FROM services WHERE id = ANY(ids) AND is_deleted = FALSE"
    ↓
Zwraca serwisy → React Query cache → HomeView pokazuje
```

**W SEO (Google/SSR):**
```
Googlebot crawluje /rejsy-rowy
    ↓
Next.js SSR fetch: GET /services?query=rejsy&city=Rowy
    ↓
Backend: Meilisearch → SQL → results
    ↓
Next.js renderuje HTML z metadata + kartkami serwisów
    ↓
Google indexuje URL /rejsy-rowy z realną treścią
```

Meilisearch jest w oba przepływach — ale dla SEO w formie SSR fetch, nie client-side.

---

## 5. Auto-generation flow — jak strony powstają "same"

**Docelowy przepływ dla dynamic search pages:**

```
1. User dodaje post "Rejs RIB, Rowy" (category=rejsy, city=Rowy)
                     ↓
2. INSERT w Postgres  →  indexService() do Meilisearch (natychmiast)
                     ↓
3. [max 1h] Redis cache sitemap-services wygasa
                     ↓
4. [max 6h] Redis cache sitemap-search-pages wygasa
                     ↓
5. Google crawluje /sitemap.xml → widzi nowy URL /rejsy-rowy
                     ↓
6. Google crawluje /rejsy-rowy
                     ↓
7. Next.js SSR: fetch API /services?query=rejsy&city=Rowy → są wyniki
                     ↓
8. Render z metadata (title, description, JSON-LD) + karty serwisów
                     ↓
9. Google indexuje /rejsy-rowy jako "rejsy w Rowach"
                     ↓
10. User googluje "rejsy Rowy" → widzi wynik → klika
                     ↓
11. Ląduje na /rejsy-rowy → client-side JS auto-redirectuje do /?q=rejsy&city=Rowy
                     ↓
12. AppShell useEffect czyta ?q + ?city → setSearchQuery + setLocation
                     ↓
13. HomeView pokazuje wyniki z pre-fillowanym search barem
```

**Gdy user usuwa post (ostatni w kategorii+miasto):**

```
1. UPDATE services SET is_deleted = TRUE
                     ↓
2. deleteFromIndex() z Meilisearch (natychmiast)
                     ↓
3. [max 1h] sitemap-services wygasa → post znika z sitemap
                     ↓
4. [max 6h] sitemap-search-pages wygasa → /rejsy-rowy znika z sitemap
                     ↓
5. Google crawluje /rejsy-rowy → SSR fetch: 0 wyników → notFound() → 404
                     ↓
6. Google usuwa URL z indeksu
```

Cały cykl życia strony jest **napędzany danymi**. Zero ręcznych operacji.

---

## 6. Techniczne szczegóły

### 6.1 Root metadata (`src/app/layout.tsx`)

- `metadataBase: 'https://mylokalni.pl'`
- Global title: `MyLokalni.pl – znajdź specjalistę w swoim mieście`
- Description, keywords, OG, Twitter cards
- `robots: index/follow, googleBot: index/follow, 'max-image-preview': 'large'`
- JSON-LD: `Organization` + `WebSite` z `SearchAction` (target: `{search_term_string}`)
- Icons, appleWebApp, manifest, canonical

### 6.2 Service detail (`src/app/service/[slug]/`)

- `runtime: 'edge'`
- `generateMetadata`: title=serwisTitle, description z opisu, canonical URL
- JSON-LD `LocalBusiness` (name, address, geo coords, rating, review count)
- `notFound()` gdy API zwróci null — kluczowe żeby nie tworzyć pustych stron w indeksie

### 6.3 Public profile (`src/app/profile/[uid]/`)

- Analogicznie do service — edge SSR + JSON-LD
- **Uwaga:** brak w sitemapach (user zdecydował że profile nie muszą być indexowane osobno; są linkowane z `/service/[slug]`)

### 6.4 `robots.ts` (`src/app/robots.ts`)

- `User-agent: *`
- `Allow: /`
- `Disallow: /auth, /dashboard, /chat, /favorites, /calendar, /invite, /r, /verify-email, /reset-password, /delete-account, /booking-form, /support, /_next, /api`
- `Sitemap: https://mylokalni.pl/sitemap.xml`

### 6.5 Middleware (`src/middleware.ts`)

- 301 redirect legacy URL-i `/{title-PublicId}` → `/service/{slug}` (mixed-case URLs)
- 404 na `/_next/data/*` (legacy Pages Router pułapka Googlebot cache)

### 6.6 `next.config.ts` vs `public/_headers`

**KRYTYCZNE:** headery security (CSP, HSTS, X-Robots-Tag) MUSZĄ być w `public/_headers`. `next.config.ts::headers()` **nie jest respektowany** przez `@cloudflare/next-on-pages` na produkcji. CF Pages honoruje `_headers` natywnie.

### 6.7 App URL → search state (`AppShell.tsx`)

```typescript
// Reads ?q= and ?city= from URL, applies to app state
useEffect(() => {
    if (state.isLoadingApp) return;
    const q = searchParams.get('q');
    if (q && pathname === '/') {
        actions.homeActions.setSearchQuery(q);
        actions.homeActions.setSearchDisplay(q);
    }
    const city = searchParams.get('city');
    if (city) actions.homeActions.setLocation(city);
}, [pathname, searchParams, ...]);
```

Ten useEffect jest kluczowy — bez niego user nawigujący z landing page do apki nie widziałby pre-fillowanego search-a (bo `useState(() => window.location.search)` działa tylko przy mount, nie przy nawigacji client-side).

---

## 7. Status implementacji — checklist

### ✅ Zrobione

- [x] **Root metadata** — pełne title/description/OG/Twitter/JSON-LD w `src/app/layout.tsx`
- [x] **`/service/[slug]`** — edge SSR, `generateMetadata`, JSON-LD LocalBusiness, `notFound()` gdy brak danych
- [x] **`/profile/[uid]`** — edge SSR, metadata (bez sitemap na decyzję usera)
- [x] **Static informational pages** — `/faq`, `/jak-to-dziala`, `/o-nas`, `/regulamin`, `/polityka-prywatnosci`, `/zasady-bezpieczenstwa`
- [x] **`sitemap.xml`** — index z 2 sub-sitemapami (services + categories)
- [x] **`sitemap-services.xml`** — proxy do API, edge, `force-dynamic`, no CF cache
- [x] **API `/public/sitemap/services`** — query Postgres, Redis cache 1h, filtruje `is_deleted=FALSE AND status='active'`
- [x] **`sitemap-categories.xml`** — statyczne 7 stron informacyjnych
- [x] **`robots.ts`** — Allow root, Disallow prywatne routes, link do sitemap
- [x] **Middleware 301** — legacy URL → `/service/slug`
- [x] **Middleware 404** — `/_next/data/*` blokada
- [x] **`public/_headers`** — CSP, HSTS, X-Robots-Tag (production)
- [x] **Meilisearch runtime sync** — indexService/deleteFromIndex w routes create/update/delete/restore
- [x] **Meilisearch startup sync + cleanup** — `syncMeilisearch()` w `server.ts` czyści stale + upsertuje aktywne
- [x] **`npm run sync:meili`** — manual sync script (`sync-meilisearch.ts`)
- [x] **Landing pages `/[slug]`** — obecnie `noindex` (wygaszane, będą zastąpione dynamic search pages)
- [x] **App URL → search state** — AppShell czyta `?q=` i `?city=`, ustawia HomeView pre-fill
- [x] **Nawigacja z landing → app** — LandingSearchBar, category pills, city links zawsze idą do `/?q=...&city=...`
- [x] **AppShell deep link handler** — konwertuje landing slugs z zewnętrznych źródeł (email, push notif) na app URL

### ☐ Do zrobienia — Dynamic Search Pages (target: OLX/Fixly-level SEO)

**Backend (`Lokalni API`):**

- [ ] Nowy endpoint `GET /public/sitemap/search-pages`
  - Query: `SELECT DISTINCT category, city FROM services WHERE is_deleted=FALSE AND status='active' AND category IS NOT NULL AND city IS NOT NULL`
  - Zwraca JSON: `[{ slug: "rejsy-rowy", category: "rejsy", city: "Rowy" }, ...]`
  - Redis cache klucz `sitemap:search-pages:v1`, TTL 6h
  - Rate limit: 20/min (jak inne sitemap endpoints)

- [ ] Rozszerz `GET /public/sitemap/search-pages` żeby zwracał XML dla `sitemap-search.xml` (alternatywnie: JSON + osobny endpoint XML)

- [ ] Opcjonalnie: cache invalidation przy CRUD services — `redis.del('sitemap:search-pages:v1')` w routes żeby refresh był natychmiastowy

**Frontend (`lokalni-web`):**

- [ ] Nowy route `src/app/sitemap-search.xml/route.ts`
  - Edge runtime, `force-dynamic`
  - Proxy do API `/public/sitemap/search-pages`
  - Cache-Control `public, max-age=21600, s-maxage=21600` (6h)

- [ ] Dodaj `sitemap-search.xml` do `src/app/sitemap.xml/route.ts` (sitemap index)

- [ ] Refaktor `src/app/[slug]/page.tsx`:
  - Usuń `LANDING_SLUGS` whitelist z `generateStaticParams`
  - Zamiast tego: `generateStaticParams` z API `/public/sitemap/search-pages` (dla top N stron przy build; reszta ISR)
  - LUB: `dynamicParams = true`, brak `generateStaticParams`, wszystko on-demand SSR
  - Parse slug: split po `-` na sensowne kombinacje, dopasuj do dostępnych `(category, city)` z API
  - Fetch API `/services?query=...&city=...` w server component
  - `services.length === 0` → `notFound()` (nie `noindex` — 404, żeby URL zniknął z Google)
  - `services.length > 0` → `robots: { index: true, follow: true }`, prawdziwa metadata

- [ ] Refaktor `src/lib/seo-data.ts`:
  - `LANDING_SLUGS` — usuń albo zredukuj rolę (może zostać jako soft-hint dla nazewnictwa)
  - `parseLandingSlug` — bardziej elastyczny, akceptuje dowolne kombinacje slug-ów po walidacji przez API

- [ ] Auto-redirect client component `LandingAutoRedirect.tsx`:
  - `useEffect` na mount → `router.replace('/?q=...&city=...')`
  - Include w `/[slug]/page.tsx` (obok/zamiast statycznego renderu)
  - Uwaga: SSR content dalej renderuje się dla Googlebota (Google robi JS execution ale wolniej niż browser, więc widzi SSR)
  - Alternatywa: `<meta http-equiv="refresh">` (bardziej niezawodne cross-browser, ale gorsza UX)

- [ ] `generateMetadata` dla dynamic pages:
  - Title: `${keyword} ${city} – ${totalCount} ofert | MyLokalni.pl`
  - Description: dynamiczny bazujący na kategorii+mieście
  - Canonical: `/${slug}`
  - JSON-LD `CollectionPage` lub `ItemList` z serwisami

**Sitemap integration:**

- [ ] Zweryfikuj że nowa `sitemap-search.xml` jest crawlowana — dodaj URL do Google Search Console
- [ ] Monitor: ile URL-i z `sitemap-search.xml` jest indexed w GSC

**Testing / QA:**

- [ ] E2E: dodaj serwis w kategorii/miastie która nie miała wcześniej → sprawdź czy `sitemap-search.xml` po 6h zawiera nowy URL
- [ ] E2E: usuń ostatni serwis z kategorii/miasta → sprawdź czy strona daje 404 (po Redis TTL)
- [ ] Curl test: `curl -A "Googlebot" https://mylokalni.pl/rejsy-rowy` → widzi SSR content, nie flash empty
- [ ] Real user test: `https://mylokalni.pl/rejsy-rowy` → auto-redirect do apki z pre-fill

**Cleanup / migration:**

- [ ] Po weryfikacji że dynamic search pages działają — usuń stare landing pages content z `/[slug]/page.tsx` (LandingNavbar, LandingSearchBar UI, LandingServiceGrid). Zastąp minimalnym SSR HTML (dla Google) + auto-redirect (dla usera).
- [ ] Rozważ: może zostawić SSR content pełny (jak teraz — z kartkami serwisów) żeby Google miał więcej sygnału. Auto-redirect uruchomi się po chwili — Googlebot indexuje snapshot przed redirectem.

**Documentation:**

- [ ] Zaktualizuj `CLAUDE.md` — nowa architektura dynamic search pages, usunięcie 924 hardkodowanych slug-ów, opis flow
- [ ] Zaktualizuj `src/app/robots.ts` — sprawdź czy nie trzeba dodać/usunąć disallow
- [ ] Zaktualizuj ten dokument (`.ai/context/02-seo-architecture.md`) — odznacz zrealizowane, dodaj nowe znalezione tematy

---

## 8. Kluczowe decyzje architektoniczne (rationale)

**Q: Dlaczego nie serwować wyników wyszukiwania bezpośrednio pod `/?q=...` z SSR?**
A: `/` to route apki (client-only z całym state managementem, mega-hook `useAppLogic`, providery). Dodanie SSR tam wymagałoby dużego refaktoru state managementu na server-safe. Zamiast tego — SSR odpowiada osobna warstwa (`/[slug]`) która renderuje statyczny snapshot dla Google, a interakcja idzie do apki.

**Q: Dlaczego auto-redirect z landing page do apki, a nie serwowanie apki bezpośrednio na landing page URL?**
A: Analogicznie do wyżej — mieszanie SSR content-a i client app na tym samym URL wymagałoby refaktoru. Auto-redirect jest prostą warstwą — SSR robi swoje dla Google, JS redirect przenosi realnego usera do apki.

**Q: Dlaczego Meilisearch a nie tylko Postgres FTS dla search?**
A: Meilisearch daje fuzzy matching + typo tolerance out-of-the-box, i jest szybszy dla real-time search-as-you-type w apce. Postgres FTS jest fallback (gdy Meilisearch down).

**Q: Dlaczego cache 1h dla `sitemap-services` a 6h dla `sitemap-search-pages`?**
A: Individual services zmieniają się częściej (edycje, dodawania, usuwania). Kombinacje category×city zmieniają się rzadko — nowa kategoria/miasto pojawia się dopiero jak KTOŚ tam wrzuci pierwszy serwis. 6h to komfortowe okno.

**Q: Dlaczego `notFound()` (404) a nie `noindex` dla pustych search pages?**
A: `noindex` zostawia URL w indeksie ale mówi "nie pokazuj". 404 usuwa URL z indeksu. Chcemy żeby puste kombinacje NIE ISTNIAŁY w Google — czyli 404.

**Q: Dlaczego auto-redirect NIE po stronie serwera (302)?**
A: 302 sprawi że Google przekieruje sitemap → zostanie zaindeksowany URL apki (`/?q=...`), a ten nie ma SSR content-a. Chcemy żeby Google indexował `/[slug]` (SSR content), a redirect wykonał tylko realny user. Redirect JS uruchamia się tylko w przeglądarce (Googlebot renderuje JS ale zwykle indeksuje URL na którym landował).

---

## 9. Monitoring i healthcheck

**Live curl commands do weryfikacji:**

```bash
# Sitemap index
curl -s https://mylokalni.pl/sitemap.xml | head -20

# Individual services sitemap (should have real posts)
curl -s https://mylokalni.pl/sitemap-services.xml | grep -c "<url>"

# Dynamic search pages sitemap (post-implementation)
curl -s https://mylokalni.pl/sitemap-search.xml | grep -c "<url>"

# Robots.txt
curl -s https://mylokalni.pl/robots.txt

# Service page SSR content
curl -s -A "Googlebot" https://mylokalni.pl/service/rejs-rib-xxx | grep -E "og:title|<title>"

# Dynamic search page SSR (post-implementation)
curl -s -A "Googlebot" https://mylokalni.pl/rejsy-rowy | grep -E "og:title|<title>"

# API sitemap endpoints direct
curl -s https://api.mylokalni.pl/public/sitemap/services | head -20
curl -s https://api.mylokalni.pl/public/sitemap/search-pages | head -20  # post-implementation

# Meilisearch stats (SSH main required)
ssh main "docker exec lokalni-meilisearch curl -s http://localhost:7700/stats"
```

**Google Search Console:**
- Sprawdzaj coverage: ile URL-i indexed vs discovered vs excluded
- Monitor: performance dla queries "kategoria miasto" (długi ogon)
- Enhancements → Structured data → LocalBusiness (dla `/service/[slug]`)

---

## 10. Ryzyko i limity

**Cloudflare Pages limits:**
- Edge functions timeout: 30s (fetch do API musi się mieścić)
- Bundle size: 25MB (nie problem dla tych routes)

**Meilisearch limits:**
- `getDocuments({ limit: 100000 })` — jeśli masz >100k serwisów, trzeba paginacji
- Full sync przy każdym API start — dla dużego indexu może zająć minuty

**Postgres query performance:**
- `SELECT DISTINCT category, city` — dla >100k serwisów potrzebny index na `(category, city)` filtrowany `WHERE is_deleted=FALSE AND status='active'`

**Redis cache expiry:**
- Redis restart czyści cache → następny hit sitemap wygeneruje świeży (kilkasekundowy) query. To OK.

**Google crawl budget:**
- Zbyt duża sitemap (>50k URLs) — Google może nie zdążyć indeksować. Split na chunki jeśli potrzeba.

---

## 11. Kontakt / źródła

- **Kod SEO frontend:** `src/app/` (sitemap-*.xml, robots.ts, layout.tsx, service/, profile/, [slug]/)
- **Kod SEO backend:** `Lokalni API/src/modules/public/public.routes.ts`
- **Meilisearch:** `Lokalni API/src/lib/meilisearch.ts`, `src/db/sync-meilisearch.ts`
- **Deploy status:** CF Pages Dashboard, GHCR (`ghcr.io/1talmon/lokalni-api`)
- **Monitoring:** Google Search Console (`mylokalni.pl` property)
- **API docs:** Notion (nie lokalne `.md`)
