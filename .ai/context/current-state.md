# Current state

Sekcja między `AI_AUTO_START` / `AI_AUTO_END` jest regenerowana automatycznie
przez `scripts/ai-refresh.sh` (Claude Code SessionStart hook). Manualne notatki
(sesje, otwarte punkty, przypomnienia) edytuj **poza** znacznikami — są zachowane
przy refreshu.

<!-- AI_AUTO_START -->

_Regenerated: **2026-09-04 14:10 UTC** przez `scripts/ai-refresh.sh`_

### Git snapshot

- Branch: `dev`
- Uncommitted files: **0**
- Ahead of origin: **0** commits
- Behind origin: **0** commits

### Ostatnie 10 commitów

```
0e71621 chore(cf-pages): cleanup wrangler.json do Pages-only format
462d0d1 chore(gitignore): ignore *.bak (pnpm-lock.yaml.bak i podobne)
ed88e0a docs(deploy): preview URL to dev.lokalni-pl-web.pages.dev (branch alias, bez custom domain)
eced143 docs(deploy): dev-first workflow — push dev → dev.mylokalni.pl preview → merge do main
e5abc6b docs(claude): sekcja Feedback rules — utrwalone zasady współpracy team-shared
be00e61 feat(ai): slash commands /deploy-web /review-code /build-capacitor (thin wrappers)
1af16bf feat(ai): auto-refresh .ai/context/current-state.md via Claude Code SessionStart hook
51a98cd docs(ai): wypełnij .ai/ brief + skille + architecture + link z CLAUDE.md
fce2c73 docs(claude): rozszerz CLAUDE.md o cross-project hub (5 projektów ecosystemu)
9cbeb2c docs(claude): przepisz CLAUDE.md od zera pod Next.js/CF Pages, usuń przestarzały src/CLAUDE.md
```

<!-- AI_AUTO_END -->

## Historia sesji

### 2026-09-04 — audit Vite → Next.js, fazy 1-4 + infra hygiene

Rozszerzona sesja: kompletne fazy 1-4 audytu + cross-project hub + dev-first workflow + cleanup wszystkich siostrzanych repo.

**Bloki roboty:**

**A. Fazy 1-3 audit fixy (na main, zdeployowane na produkcję):**
- `refactor(routes)` — public strony `(app)/` → `(public)/` (regresja z migracji: `/verify-email`, `/delete-account*` dostawały tab strip)
- `fix(seo)` — `notFound()` dla nieistniejących `/service` / `/profile` (Google nie indeksuje śmieci)
- `fix(security)` — CSP + X-Robots-Tag noindex w `public/_headers` (`next.config.ts::headers()` nie działa na CF Pages)
- `chore(pnpm,eslint)` — pnpm@10 dla build:cf + ignore .wrangler
- `fix(seo)` — `[slug]` generateStaticParams → `LANDING_SLUGS` (846 URLi z sitemapy było 404)
- `perf(sitemap)` — cache sitemap-services.xml (revalidate: 3600)

**B. Docs + .ai/ scaffold (na dev):**
- `docs(claude)` — CLAUDE.md od zera pod Next.js/CF Pages + cross-project hub 5 projektów
- `docs(ai)` — `.ai/` scaffold: architecture + brief + current-state + 3 skille (deploy-web, review-code, build-capacitor)
- `feat(ai)` — SessionStart hook `scripts/ai-refresh.sh` regeneruje `current-state.md` przy każdym starcie
- `feat(ai)` — slash commands `/deploy-web`, `/review-code`, `/build-capacitor` (thin wrappers → `.ai/skills/*/SKILL.md`)
- `docs(claude)` — Feedback rules team-shared w CLAUDE.md (język PL, nie pushuj, dev-first, branches, Notion, Docker)

**C. Dev-first workflow (na dev):**
- `docs(deploy)` — kompletna 6-krokowa procedura push dev → verify preview → merge --ff-only main → push main → verify prod
- Cleanup URL: `dev.lokalni-pl-web.pages.dev` (branch alias, bez custom domain)

**D. Faza 4 — Deploy hygiene (na dev):**
- `chore(cf-pages)` — wrangler.json cleanup Workers-style → Pages-only format
- `chore(gitignore)` — ignore *.bak

**E. Cross-project cleanup:**
- `lokalni projekt` (dev): usunięty CLAUDE.md + 937 linii martwych sitemap XML + skrypt `generate-sitemap.mjs` + fix `package.json:build`
- `Lokalni Admin` (main): commit + push feature `deep link ?ticket=X` (dryfował uncommitted)
- `Lokalni API`, `Lokalni Admin API`: sprawdzone, clean

**Weryfikacja na produkcji (`mylokalni.pl`):**
```
curl /dashboard              → 200 + CSP + x-robots-tag: noindex, nofollow ✅
curl /service/nonexistent    → 404 ✅
curl /hydraulik-warszawa     → 200 ✅ (przed fixem: 404)
curl /_next/static/*.js      → cache-control: public, max-age=31536000, immutable ✅
```

**Weryfikacja na preview (`dev.lokalni-pl-web.pages.dev`):**
```
curl /dashboard              → 200 + CSP + x-robots-tag ✅
curl /service/nonexistent    → 404 ✅
curl /hydraulik-warszawa     → 200 ✅
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

### Do zrobienia (Fazy 5-6 audytu)

**Faza 5 — Code quality (pending):**
- ESLint plugin `@next/eslint-plugin-next` (build ostrzega o braku)
- Dead code / unused imports scan
- Duplicated components między Vite a Next (`src/views/*` shared 1:1)
- Konwencja nazywania PL vs EN

**Faza 6 — Perf (pending):**
- Core Web Vitals audit (PageSpeed Insights)
- Bundle size analysis
- Lazy loading heavy components (mapa, video, chart)
- `next/font` optimization (obecnie `Plus_Jakarta_Sans` bez `latin-ext`)

**Nie w scope audytu, ale zanotowane:**
- Backend backup verify (Postgres/Redis w Lokalni API Docker) — pytanie do usera przy okazji

### Pending SEO improvements (Faza 3)

- Sprawdzić czy `regulamin`, `polityka-prywatnosci`, `o-nas`, `zasady-bezpieczenstwa`, `jak-to-dziala` mają `metadata` w page.tsx (title, description, canonical)
- `title.template: '%s'` → `'%s | MyLokalni.pl'` w root layout + usunięcie `| MyLokalni.pl` z każdego sub-page
- `profile/[uid]` — rozważ zmianę schema z `LocalBusiness` na `Person` dla indywidualnych profili
- Rozdzielić `sitemap-categories.xml` (55 entries) na `sitemap-static.xml` (7 statycznych) + `sitemap-categories.xml` (48 keywordów)
- `Plus_Jakarta_Sans` — dodać `subsets: ['latin', 'latin-ext']`

## Aktualne przypomnienia (do NIE robienia)

- **Nie pushuj automatycznie** — tylko na wyraźne polecenie usera. "commit" ≠ "push".
- **Domyślnie push na `dev`, nigdy direct main** — dev-first workflow (patrz `.ai/skills/deploy-web/SKILL.md`). Promocja dev → main tylko `git merge --ff-only dev` po weryfikacji preview.
- **Nie wgrywaj nic na serwer** ani nie restartuj API — user robi to sam
- **API docs w Notion** — nie edytuj lokalnych .md docs w Lokalni API/ (poza CLAUDE.md hub)
- **Docker w produkcji** — sprawdzaj logi przez `docker logs lokalni-api-1`, nie systemd/journalctl
- **Custom domain `dev.mylokalni.pl`** — nie skonfigurowany, używamy default `dev.lokalni-pl-web.pages.dev`. Opcjonalne do dodania w CF Dashboard.

## Audit workflow

Wyniki analiz zapisujemy do `/Users/cypriantalmon/Desktop/lokalni-audit/`:
- `00-plan.md` — plan 6 faz
- `01-feature-parity.md` — ✅ done + fixy (routes refactor)
- `02-runtime.md` — ✅ done + fixy (CSP/noindex headers, notFound, HSTS pending)
- `03-seo.md` — ✅ done + fixy (LANDING_SLUGS, sitemap cache)
- `04-deploy.md` — ✅ done + fixy (wrangler cleanup, actions dla usera w CF Dashboard)
- `05-code-quality.md` — pending
- `06-perf.md` — pending

## Stan git (snapshot post-sesja)

- **`lokalni-web`** — main = `8182d97` (produkcja), dev = `0e71621` (11 commitów ahead of main, wszystko doc+config+dev-first)
- **`lokalni projekt`** — main = dev = `d111e98` (equal), teraz local dev = `ca14556` (3 commity cleanup, pushed)
- **`Lokalni Admin`** — main = `223db6d` (deep-link feature live)
- **`Lokalni API`, `Lokalni Admin API`** — clean, nie tknięte

## Kluczowe pliki tej sesji (dla przyszłego Claude)

Gdy będziesz kontynuował:
- `CLAUDE.md` — hub, sekcja "Ecosystem" + "Feedback rules" + "AI context — .ai/"
- `.ai/architecture.md` — ecosystem diagram
- `.ai/context/01-project-brief.md` — cel biznesowy
- `.ai/skills/deploy-web/SKILL.md` — dev-first workflow 6 kroków
- `.ai/skills/review-code/SKILL.md` — MCP graph + CF specifics
- `.ai/skills/build-capacitor/SKILL.md` — mobile sync
- `/deploy-web`, `/review-code`, `/build-capacitor` — slash commands (po restart sesji widoczne w dropdown)
