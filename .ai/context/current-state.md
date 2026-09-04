# Current state

Sekcja między `AI_AUTO_START` / `AI_AUTO_END` jest regenerowana automatycznie
przez `scripts/ai-refresh.sh` (Claude Code SessionStart hook). Manualne notatki
(sesje, otwarte punkty, przypomnienia) edytuj **poza** znacznikami — są zachowane
przy refreshu.

<!-- AI_AUTO_START -->

_Regenerated: **2026-09-04 12:59 UTC** przez `scripts/ai-refresh.sh`_

### Git snapshot

- Branch: `main`
- Uncommitted files: **3**
- Ahead of origin: **3** commits
- Behind origin: **0** commits

### Ostatnie 10 commitów

```
51a98cd docs(ai): wypełnij .ai/ brief + skille + architecture + link z CLAUDE.md
fce2c73 docs(claude): rozszerz CLAUDE.md o cross-project hub (5 projektów ecosystemu)
9cbeb2c docs(claude): przepisz CLAUDE.md od zera pod Next.js/CF Pages, usuń przestarzały src/CLAUDE.md
8182d97 perf(sitemap): cache sitemap-services.xml (revalidate: 3600)
f77e1f9 fix(seo): [slug] generateStaticParams → LANDING_SLUGS (924 zamiast 78)
e85f2b0 chore(pnpm,eslint): pnpm@10 dla build:cf + ignore .wrangler w eslint
da8cc4e fix(security): CSP + X-Robots-Tag noindex w public/_headers
ba28ef3 fix(seo): notFound() dla nieistniejących /service i /profile
ab9e999 refactor(routes): wyjmij public strony poza (app)/ do (public)/ i top-level
775564f fix(maps): ujednolić fallback googleMapsApiKey w ServiceDetailsView
```

<!-- AI_AUTO_END -->

## Historia sesji

### 2026-09-04 — audit Vite → Next.js, fazy 1-3

Multi-phase audit migracji. Zakończone Fazy 1-3, wszystkie fixy zdeployowane na produkcję.

**Commity z tej sesji (wszystkie na `main` w `lokalni-web`):**

- `refactor(routes)` — wyjmij public strony poza `(app)/` do `(public)/` i top-level (regresja z migracji: `/verify-email`, `/delete-account*`, `/invite/:code`, `/r/:code`, `/review/:bookingId` dostawały tab strip)
- `fix(seo)` — `notFound()` dla nieistniejących `/service` i `/profile` (Google nie będzie indeksować śmieciowych slugów)
- `fix(security)` — CSP + X-Robots-Tag noindex w `public/_headers` (next.config.ts::headers() nie działa na CF Pages)
- `chore(pnpm,eslint)` — pnpm@10 dla build:cf + ignore .wrangler w eslint
- `fix(seo)` — `[slug]` generateStaticParams → `LANDING_SLUGS` (924 zamiast 78, fix dla 846 URLi z sitemap-locations.xml które dawały 404)
- `perf(sitemap)` — cache sitemap-services.xml (revalidate: 3600 zamiast force-dynamic)
- `docs` — CLAUDE.md od zera + cross-project hub + `.ai/` scaffold

**Weryfikacja na produkcji:**

```
curl https://mylokalni.pl/dashboard              → 200 + CSP + x-robots-tag: noindex, nofollow ✅
curl https://mylokalni.pl/service/nonexistent    → 404 ✅
curl https://mylokalni.pl/hydraulik-warszawa     → 200 ✅ (przed fixem: 404)
```

## Otwarte punkty

### Wymaga akcji usera (nie z terminala)

- **HSTS max-age=0** — CF nadpisuje `_headers`. Włączyć w CF Dashboard → mylokalni.pl → SSL/TLS → Edge Certificates → HSTS → Enable (`max-age=31536000`, `includeSubDomains`, `preload`)
- **Google Search Console** → Coverage report po deploy — sprawdź czy 846 URLi z sitemap-locations.xml już nie zwraca 404
- **Google Rich Results Test** — walidacja JSON-LD:
  - `/service/{istniejący}` → LocalBusiness + AggregateRating
  - `/profile/{istniejący}` → LocalBusiness
  - `/warszawa` → WebPage + BreadcrumbList
  - `/faq` → FAQPage

### Do zrobienia (Faza 4-6 audytu)

**Faza 4 — Deploy / infra hygiene:**
- `wrangler.json` cleanup do Pages-only format (obecnie ma Worker fields: `main`, `assets`, `routes`)
- Cache policy dla `/_next/static/*` (już w `_headers`, weryfikacja)
- Preview environment env vars
- Sprawdzenie że backend backup działa

**Faza 5 — Code quality:**
- ESLint plugin `@next/eslint-plugin-next` (build ostrzega o braku)
- Dead code / unused imports scan
- Duplicated components między Vite a Next
- Konwencja nazywania PL vs EN

**Faza 6 — Perf:**
- Core Web Vitals audit (PageSpeed Insights)
- Bundle size analysis
- Lazy loading heavy components (mapa, video, chart)
- `next/font` optimization (obecnie `Plus_Jakarta_Sans` bez `latin-ext`)

### Pending SEO improvements (Faza 3)

- Sprawdzić czy `regulamin`, `polityka-prywatnosci`, `o-nas`, `zasady-bezpieczenstwa`, `jak-to-dziala` mają `metadata` w page.tsx (title, description, canonical)
- `title.template: '%s'` → `'%s | MyLokalni.pl'` w root layout + usunięcie `| MyLokalni.pl` z każdego sub-page
- `profile/[uid]` — rozważ zmianę schema z `LocalBusiness` na `Person` dla indywidualnych profili
- Rozdzielić `sitemap-categories.xml` (55 entries) na `sitemap-static.xml` (7 statycznych) + `sitemap-categories.xml` (48 keywordów)
- `Plus_Jakarta_Sans` — dodać `subsets: ['latin', 'latin-ext']`

## Aktualne przypomnienia (do NIE robienia)

- **Nie pushuj automatycznie** — tylko na wyraźne polecenie usera
- **Nie wgrywaj nic na serwer** ani nie restartuj API — user robi to sam
- **API docs w Notion** — nie edytuj lokalnych .md docs w Lokalni API/ (poza CLAUDE.md hub)
- **Docker w produkcji** — sprawdzaj logi przez `docker logs lokalni-api-1`, nie systemd/journalctl

## Audit workflow

Wyniki analiz zapisujemy do `/Users/cypriantalmon/Desktop/lokalni-audit/`:
- `00-plan.md` — plan 6 faz
- `01-feature-parity.md` — done
- `02-runtime.md` — done + fixy
- `03-seo.md` — done + fixy
- `04-deploy.md` — pending
- `05-code-quality.md` — pending
- `06-perf.md` — pending
