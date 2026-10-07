# Current state

Sekcja między `AI_AUTO_START` / `AI_AUTO_END` jest regenerowana automatycznie
przez `scripts/ai-refresh.sh` (Claude Code SessionStart hook). Manualne notatki
(sesje, otwarte punkty, przypomnienia) edytuj **poza** znacznikami — są zachowane
przy refreshu.

<!-- AI_AUTO_START -->

_Regenerated: **2026-10-07 12:18 UTC** przez `scripts/ai-refresh.sh`_

### Git snapshot

- Branch: `dev`
- Uncommitted files: **1**
- Ahead of origin: **0** commits
- Behind origin: **0** commits

### Ostatnie 10 commitów

```
f1fda0b fix(chat): podgląd zdjęcia/filmu/pliku na liście czatów jak zwykła wiadomość
33ad09e fix(chat): pierwsza klatka filmu w dymku gdy brak miniatury z serwera
3ebedc1 perf(home): miniatury w kartach, bez podwójnego pobierania zdjęć, bez fade przy wejściu
2217339 fix(og): podgląd landingów jako JPEG (_og.jpg) zamiast WebP
4f1c4ed fix(ssr): zapytania SSR do API z nagłówkiem x-lokalni-ssr (bez limitu per IP Workers)
8b94a59 ci(lighthouse): timeout na pobieranie sitemapy (CI wisiał), log kodu HTTP, + /wpisy
b7b9153 ci(lighthouse): pomiń is-crawlable na hoście podglądowym (CF dodaje noindex na *.pages.dev), UA przeglądarki dla sitemapy
e461e31 ci(lighthouse): landingi z sitemapy testowanego hosta + configPath (progi wreszcie sprawdzane)
1f55b22 ci(lighthouse): testuj realne landingi z API zamiast nieistniejących slugów
b05aace feat(seo): tytuły i opisy w Google z realnych danych
```

<!-- AI_AUTO_END -->

## Historia sesji

### 2026-09-30 — revert nonce CSP (produkcja nie ładowała się) + sync docs

**Problem:** Commit `7890b6e fix(security): nonce-based CSP` (wykonanie SEC-3 z `AUDIT_REPORT_DEEP.md`) dał białą stronę na `mylokalni.pl` — konsola: *"'unsafe-inline' is ignored if either a hash or nonce value is present"*. Ten sam błąd co 2026-09-09 (fix `6c0f903`).

**Root cause:** nonce w `script-src` wyłącza `'unsafe-inline'`, a inline/chunk scripts Next.js nie dostają nonce (strony statyczne/ISR na CF Pages — Next nie wstrzykuje nonce do HTML).

**Fix:** `ecdce5c revert(csp)` — `script-src 'self' 'unsafe-inline' …` przywrócony w `src/middleware.ts` (+ kopia CSP w `next.config.ts` dla `next dev`). Zweryfikowane curl-em na `mylokalni.pl` i w przeglądarce ✅.

**Decyzja:** SEC-3 (`unsafe-inline`) = zaakceptowane ryzyko. Nie wracać do nonce/hashy — opisane w CLAUDE.md → Security headers + Pitfalls + `review-code` skill.

**Deploy gotcha:** push `dev` i `main` wskazujących na ten sam commit → CF Pages zbudował tylko `dev`; produkcja wymagała ręcznego „Retry deployment” w CF Dashboard. Przy hotfixie sprawdzaj curl-em nagłówki na `mylokalni.pl`, nie tylko status GitHub checka.

**Stan audytu `AUDIT_REPORT_DEEP.md` (2026-09-09, plik lokalny, nieśledzony — repo publiczne):** zrobione m.in. SEC-1 (brak `setItem('user_profile')`), SEC-2 (dev URL z CSP), ARCH-1 (`useAppLogic` 842 → 573 linii), FE-1 (widoki ≤ 934 linii), DEBT-3 (fixtures). SEC-3 — zaakceptowane (patrz wyżej).

**Workflow:** commity z 2026-09-09 → 09-30 (~32) szły bezpośrednio na `main`; `dev` zrównany z `main` fast-forwardem przy tym fixie. Od teraz znów dev-first.

---

### 2026-09-05 (sesja 3) — fix: scrollLock spurious restore przy nawigacji z dashboard subviews

**Problem:** Po wejściu w Zarobki / Opinie / Wyświetlenia, otwarciu prawego sidebara, zamknięciu go i przejściu do innej strony — powrót na Dashboard nie scrollował do góry.

**Root cause:** `unlockScroll()` w `scrollLock.ts` zawsze wywoływał `window.scrollTo(0, _savedScrollY)` gdy `_savedScrollY > 0`. Cleanup React (`return () => unlockScroll()`) odpala się przy odmontowaniu komponentu (np. `EarningsDetail` znika gdy user przechodzi do innego tabu) — w tym momencie `_savedScrollY` ciągle przechowywał starą pozycję scrolla z czasu blokady, więc `window.scrollTo` strzelał do niej podczas przejścia Next.js.

**Fix:** `scrollLock.ts` — `unlockScroll` sprawdza `wasLocked` (czy klasa `scroll-locked` faktycznie była na `<html>`) zanim wywoła `window.scrollTo`. Gdy cleanup odpala po normalnym zamknięciu sidebara, klasa jest już usunięta → `wasLocked = false` → brak fałszywego scroll restore.

**Porównanie z lokalni projekt:** Mobile używa `body{position:fixed}` — `unlockScroll` sprawdza `wasFixed = document.body.style.position === 'fixed'` jako guard. Lokalni-web usunął `position:fixed` (słusznie, bo reflow w Next.js) ale nie dodał ekwiwalentu — naprawione przez użycie klasy CSS jako state trackera.

**Commit:** `f898365` — `fix(scrollLock): napraw fałszywy window.scrollTo przy odmontowaniu komponentu`
**Status:** commit na dev, pushed ✅

---

### 2026-09-05 (sesja 2) — UI fixes + scroll lock refactor

**Zmiany (niezcommitowane, na dev):**

1. **`AddServiceModal.tsx`** — layout Kategoria / Cena / Rozliczenie przepisany z `grid-cols-1 + nested flex` na płaski `grid-cols-1 sm:grid-cols-3`. Na mobile każde pole full-width (poprzednio Cena i Rozliczenie były po 50% ściśnięte obok siebie).

2. **`scrollLock.ts`** — usunięty `position: fixed; top: -scrollY; width: 100%` z web-path lockScroll. Root cause jumpa: `position: fixed` wyjmuje body z normal flow co powoduje reflow w Next.js. Nowe podejście: tylko CSS class — `body { overflow: hidden }` propaguje do viewportu (browser quirk), zamrażając scroll bez layout shift. `window.scrollTo(0, savedScrollY)` jako safety net w unlock.

3. **`App.css`** — usunięty `scrollbar-gutter: stable` z `body {}`. Był przyczyną podwójnej kompensacji: spec CSS zachowuje gutter przy `overflow: hidden`, więc body miał już 1265px szerokości — dodatkowy `padding-right: 15px` z klasy `scroll-locked` zawężał go do 1250px → treść skakała w lewo.

4. **`MainLayout.tsx`** — przywrócony footer na `/service/*` i `/profile/*`. Był explicite wykluczony w `shouldShowFooter` (`&& !pathname.startsWith('/service/')` itp.). Footer pojawia się tylko `hidden md:block` (desktop), co jest ok.

**Do zrobienia:**
- Commit + push na `dev` → verify → merge main

---

### 2026-09-05 — fix nawigacji service/profile + prefetch cache

**Problem:** LoadingScreen przy przejściu na `/service/*` i `/profile/*` "wjeżdżał z prawej" zamiast pokrywać cały ekran. Root cause: `position:fixed` wewnątrz przodka z `transform:translateX` (animacja `page-enter-forward`) pozycjonuje się względem rodzica, nie viewportu.

**Rozwiązanie — navigation overlay pattern:**
- `isNavLoading: boolean` dodany do `AppState` + `setNavLoading` do `AppActions`
- `LoadingScreen` renderowany w `AppShell` (przed `<MainLayout>`) — poza jakimkolwiek transform context
- `onServiceClick` + `handleOpenProfile`: `setNavLoading(true)` **przed** `router.push` — overlay instant na klik
- `ServiceDetailsClient` / `PublicProfileClient`: `setNavLoading(true)` na mount (fallback), `setNavLoading(false)` gdy dane gotowe
- `handleBack`: `setNavLoading(false)` przed cofaniem (brak overlay przy back navigation)
- Safety net w AppShell: reset przy każdej zmianie pathname poza `/service/` i `/profile/`
- `isNavLoading` inicjalizowany `true` przy direct URL (brak flesza startup→page loading)

**Cache / prefetch fix:**
- Prefetch on hover w `HomeView` (już istniał, 150ms debounce) — naprawiono queryFn: używa `mapApiService` zamiast surowych danych API (był bug: cache zapisywał `imie/nazwisko/profilowe`, component oczekiwał `provider.name/avatar`)
- `staleTime: 10 * 60 * 1000` wszędzie (service, publicProfile, prefetch) — spójność
- Warm cache → zero loading screen (check `queryClient.getQueryData` przed `setNavLoading`)

**Commity sesji (na dev, nie pushowane):**
```
8b1735a fix(perf): napraw prefetch queryFn i zwiększ staleTime do 10 min
dd0c057 perf(nav): instant navigation gdy dane są w React Query cache
18971a3 fix(nav): overlay LoadingScreen na poziomie AppShell (poza CSS transform)
```

**Do zrobienia:**
- Push na dev → verify preview → merge --ff-only main → push main

---

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

### Security (z sesji 2026-09-30)

- **JSON-LD escaping** — `JSON.stringify(schema)` w `dangerouslySetInnerHTML` nie escapuje `<`. Tytuł/opis usługi lub profilu zawierający `</script>` wyjdzie z tagu JSON-LD i (przy `'unsafe-inline'`) wykona się jako skrypt. Do poprawy: helper `safeJsonLd = (o) => JSON.stringify(o).replace(/</g, '\u003c')` w `service/[slug]`, `profile/[uid]`, `og/service`, `og/profile`, `[slug]`, root `layout.tsx`.
- Pozostałe z `AUDIT_REPORT_DEEP.md`: DEBT-7 (komentarz `ENTERPRISE LEVEL REFACTOR` w `src/types/index.ts`), FE-3 (`useBookings` polling 30 s niezależnie od WebSocket).

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

## Stan git (snapshot 2026-09-30)

- **`lokalni-web`** — `main` = `dev` = `ecdce5c` (revert nonce CSP), oba pushed, produkcja zweryfikowana. Nieśledzony lokalnie: `AUDIT_REPORT_DEEP.md` (nie commitować — repo publiczne).
- Pozostałe repo — nie tknięte w tej sesji.

## Kluczowe pliki tej sesji (dla przyszłego Claude)

Gdy będziesz kontynuował:
- `CLAUDE.md` — hub, sekcja "Ecosystem" + "Feedback rules" + "AI context — .ai/"
- `.ai/architecture.md` — ecosystem diagram
- `.ai/context/01-project-brief.md` — cel biznesowy
- `.ai/skills/deploy-web/SKILL.md` — dev-first workflow 6 kroków
- `.ai/skills/review-code/SKILL.md` — MCP graph + CF specifics
- `.ai/skills/build-capacitor/SKILL.md` — mobile sync
- `/deploy-web`, `/review-code`, `/build-capacitor` — slash commands (po restart sesji widoczne w dropdown)
