# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Next.js 15 App Router + React 18, deploy na Cloudflare Pages (`@cloudflare/next-on-pages`).
Produkcja: `https://mylokalni.pl`. Backend API: `https://api.mylokalni.pl` (osobny projekt).

Siostrzany projekt: `/Users/cypriantalmon/Desktop/lokalni projekt/` — starszy Vite/React + Capacitor SPA (iOS/Android). Web wygaszany, ten projekt (`lokalni-web`) przejmuje SEO i przeglądarkę. Duża część kodu (`src/views/*`, `src/components/modals/*`, `src/hooks/*`) jest współdzielona 1:1 z siostrzanym projektem — dzięki cap-stubs (patrz niżej) działa bez Capacitor runtime.

## AI context — `.ai/`

Ten projekt utrzymuje briefy i skille w `.ai/` — Claude Code powinien czytać na start sesji dla kontekstu domenowego, a skille wywoływać gdy zadanie pasuje do opisu.

| Ścieżka | Zawartość |
|---|---|
| `.ai/architecture.md` | Ecosystem diagram (5 projektów), request flow, deploy topology, shared code map |
| `.ai/context/01-project-brief.md` | Cel biznesowy MyLokalni.pl, target users, funkcje, roadmap |
| `.ai/context/current-state.md` | Snapshot bieżących prac (**szybko się starzeje** — sprawdź `git log` i CF Dashboard dla live state) |
| `.ai/skills/review-code/SKILL.md` | Procedura review — MCP graph + CF Pages specifics + quality gates |
| `.ai/skills/deploy-web/SKILL.md` | Flow `git push` → CF Pages CI → post-deploy curl verification |
| `.ai/skills/build-capacitor/SKILL.md` | Web build + `cap sync` + Xcode/Android Studio dla siostrzanego mobile projektu |

**Konwencje:**
- `context/` — dokumenty do wczytania (briefy, snapshots, decisions). Numerowane prefixem gdy kolejność ma znaczenie (`01-project-brief.md` przed dowolnym nowym `02-*.md`).
- `skills/<slug>/SKILL.md` — reusable procedury z YAML frontmatter (`name`, `description`). Każdy skill w swoim folderze (Claude Code convention — dodatkowe pliki `.md` w tym samym folderze są kontekstem skilla, wczytywane po głównym `SKILL.md`).
- `architecture.md` — pojedynczy source-of-truth diagram; aktualizuj przy strukturalnych zmianach ecosystemu (nowa DB, nowy service, nowa integracja).

**Nowy brief / skill:**
- Dodaj plik do właściwego folderu, PO ANGIELSKU jeśli reusable między instancjami Claude — po polsku jeśli team-internal
- Zaktualizuj tabelę wyżej (w tym CLAUDE.md)
- Krótki commit `docs(ai): dodaj skill <slug>` / `docs(ai): brief <slug>`

### Auto-refresh `current-state.md`

`.claude/settings.json` ma **`SessionStart` hook** który przy każdym uruchomieniu sesji Claude Code w tym projekcie wywołuje `scripts/ai-refresh.sh`. Skrypt regeneruje sekcję między znacznikami `<!-- AI_AUTO_START -->` / `<!-- AI_AUTO_END -->` w `.ai/context/current-state.md`:

- Git snapshot (branch, uncommitted count, ahead/behind vs origin)
- Ostatnie 10 commitów (`git log -10 --oneline`)

Manualne notatki (Historia sesji, Otwarte punkty, Przypomnienia, Audit workflow) są **poza** znacznikami — nietknięte przy refreshu.

**Trigger:** `startup` i `clear` matcher. `resume` intentionally omitted — resumowana sesja ma już context, refresh niepotrzebny.

**Ręczne uruchomienie:** `bash scripts/ai-refresh.sh` (poza sesją Claude, np. przed manualnym commit).

**Efekt uboczny:** po refreshu `git status` może pokazać `.ai/context/current-state.md` jako modified — świadome, w kolejnym commit inny lub osobny `chore(ai): sync current-state`.

### Slash commands (`.claude/commands/`)

Skille z `.ai/skills/` są też wystawione jako **slash commands** Claude Code — piszesz `/nazwa` w input i Claude uruchamia procedurę:

| Command | Delegate → | Co robi |
|---|---|---|
| `/deploy-web` | `.ai/skills/deploy-web/SKILL.md` | Pre-flight + push + 3 curl checks |
| `/review-code` | `.ai/skills/review-code/SKILL.md` | git diff + MCP graph + CF specifics + lint/tsc/build |
| `/build-capacitor` | `.ai/skills/build-capacitor/SKILL.md` | Sync widoków + bun build + cap sync |

Slash command files w `.claude/commands/*.md` to **thin wrappery** — 15 linii, delegują do `.ai/skills/<name>/SKILL.md` (jedno źródło prawdy). Jeśli edytujesz procedurę — edytuj `.ai/skills/`, nigdy `.claude/commands/`.

**Rejestracja:** slash commands są auto-loadowane przez Claude Code przy starcie sesji. Nowe komendy wymagają restart sesji żeby były widoczne.

**Team-shared:** `.claude/commands/` w git (via `!.claude/commands/` exception w `.gitignore`, obok `settings.json`).

## Commands

Uruchamiać z **project root** (`/Users/cypriantalmon/Desktop/lokalni-web/`).

```bash
npm run dev              # Next dev na :3000
npm run build            # next build → .next/
npm run build:cf         # @cloudflare/next-on-pages → .vercel/output/static/ (weryfikuj przed pushem)
npm run preview:cf       # wrangler pages dev — lokalny preview CF Pages output
npm run lint             # ESLint (pre-commit hook wywala tsc, nie lint)
npx tsc --noEmit         # TypeScript check (pre-commit hook)
```

**Brak test suite.** Type-check + build:cf są głównymi bramkami jakości. Zawsze puszczaj `build:cf` (nie tylko `build`) przed pushem — CF-specific config (`_headers`, edge runtime, static params) sprawdzany jest tylko tam.

## Deploy

**Automatyczny** — push do `main` na GitHub (`1Talmon/lokalni.pl-web`) → Cloudflare Pages CI zbuduje i zdeployuje. **Claude Code nie deployuje ręcznie** — user pushuje, CI robi resztę.

Custom domain `mylokalni.pl` → CF Pages project `lokalni-pl-web`.
Env vars w CF Dashboard: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_MAPS_KEY`.

## Package manager — pnpm@10 obowiązkowe

`package.json` ma `"packageManager": "pnpm@10.15.0"`. **Nie downgraduj.**
Vercel CLI (wewnątrz `@cloudflare/next-on-pages`) używa wersji z `packageManager` — pnpm 9 wymaga interactive `pnpm approve-builds` co blokuje CI (`ERR_PNPM_IGNORED_BUILDS` dla `esbuild`, `workerd`). pnpm 10 czyta `onlyBuiltDependencies` z `pnpm-workspace.yaml` non-interactive.

## Architektura

### Struktura routes (`src/app/`)

Trzy warstwy layoutów, wybierane per-page według rodzaju strony:

```
src/app/
├── (app)/                    # AppShell + MainLayout + tab strip + ModalsManager
│   ├── layout.tsx            # 'use client' - QueryProvider + AppProvider + AppShell
│   ├── page.tsx              # / (tab home)
│   ├── chat|calendar|favorites/  # tab routes (render null, treść w AppShell tab strip)
│   ├── dashboard, booking-form, support, chat/[chatId]
│   ├── faq, regulamin, polityka-prywatnosci, o-nas, zasady-bezpieczenstwa, jak-to-dziala, zgoda-rodzica
│   └── _components/          # private (Next.js: `_` prefix skips as route)
├── (public)/                 # QueryProvider + AppProvider + Suspense (bez chrome-u)
│   ├── layout.tsx
│   ├── verify-email/         # jednorazowe, otwierane z maila
│   ├── delete-account, delete-account-confirm/
│   └── review/[bookingId]/   # z ReviewClient.tsx (edge runtime)
├── auth, reset-password/     # top-level bez providerów (auth flow)
├── invite/[code], r/[code]/  # top-level bez providerów (marketing landings)
├── service/[slug]/           # top-level edge runtime, SSR metadata + JSON-LD LocalBusiness
├── profile/[uid]/            # jw.
├── [slug]/                   # top-level SSG landing pages (city / keyword / keyword-city)
├── layout.tsx                # root: metadata, JSON-LD Organization + WebSite
├── error.tsx, not-found.tsx  # global error/404
├── robots.ts                 # App Router native robots.txt
└── sitemap*.xml/route.ts     # 4 sitemapy: index + services (edge) + locations + categories
```

**Decyzja gdzie umieścić nową stronę:**
- Ma tab strip + navbar + user-facing app UX → `(app)/`
- Otwierana z linku/maila, wymaga `useApp()` ale bez chrome — `(public)/`
- Auth flow albo marketing landing bez `useApp()` — top-level bez grupy
- Główne strony SEO (service, profile, landing) — top-level (poza grupami), `runtime: 'edge'`, `generateMetadata` + JSON-LD

**URL vs folder:** grupy `(...)` w Next.js **nie wpływają na URL** — `/(public)/verify-email` → URL `/verify-email`.

### State management

`src/hooks/useAppLogic.ts` — mega-hook z całym globalnym stanem (auth, services, chat, favorites, modals). Zwraca `{ state: AppState, actions: AppActions }` (typy w `src/types/appTypes.ts`).

`src/providers/AppProvider.tsx` — Context wrapper wokół `useAppLogic()`. Wołany raz w `(app)/layout.tsx` lub `(public)/layout.tsx`. `useApp()` sięga po `state` i `actions` z kontekstu.

`src/providers/QueryProvider.tsx` — React Query provider (osobny plik bo `AppProvider` sam by mieszał concerns).

`useMyProfile`, `useNotifications`, `usePublicProfile` — React Query hooks nad `useAppLogic`.

### AppShell + MainLayout (`src/components/AppShell.tsx`)

Wywoływany tylko z `(app)/layout.tsx`. Obowiązki:
- Trzyma `MainLayout` z tab strip (`/`, `/chat`, `/calendar`, `/favorites`), Navbar, Footer, BottomNav
- Renderuje `<ModalsManager>` z globalnymi modałami (`state.activeModal`)
- Obsługuje deep links (`com.lokalni.app://`, `https://mylokalni.pl/*`), Capacitor `appUrlOpen`
- Obsługuje Android back button (`CapacitorApp.backButton`)
- Biometric lock (`useBiometricLock`)
- Splash screen hiding (native/Android)

Tab routes (`/`, `/chat`, `/calendar`, `/favorites`) mają `page.tsx` które renderują `null` — treść jest w tab strip AppShell-a.

### Cap-stubs (`src/lib/cap-stubs/`)

Kluczowe. `tsconfig.json:paths` + `next.config.ts:webpack.resolve.alias` mapują wszystkie `@capacitor/*` importy oraz `capacitor-secure-storage-plugin`, `@aparajita/capacitor-biometric-auth`, `@capacitor-community/facebook-login`, `@codetrix-studio/capacitor-google-auth` na stub-y w `src/lib/cap-stubs/`. Dzięki temu kod współdzielony z siostrzanym projektem Capacitor imports `@capacitor/core` itd. bez błędu — na web dostaje no-op implementation.

**Nie usuwaj cap-stubs.** Nie dodawaj `@capacitor/*` do `dependencies` — nadal będzie brany stub przez alias.

### Modele modałów — dwa wzorce

1. **Globalne** (`state.activeModal`): `chat_detail`, `add_service`, `report`, `support`. Sterowane przez `actions.setActiveModal(...)`, rendered w `ModalsManager`.
2. **View-local**: `NewsFeedModal`, `CertificatesModal`, `ClientPhotosModal`, `ReportModal` w `PublicProfileView` — `useState` w widoku + `createPortal(document.body)`.

### SEO

- **Root metadata** w `src/app/layout.tsx` (metadataBase, OG, Twitter, keywords, canonical `/`) + JSON-LD `Organization` + `WebSite` z `SearchAction`.
- **`/service/[slug]`, `/profile/[uid]`**: `runtime: 'edge'`, `generateMetadata` + JSON-LD `LocalBusiness`. **Muszą wołać `notFound()`** gdy fetch API zwróci null (inaczej Google zaindeksuje puste strony z generic tytułem).
- **`/[slug]` (landing)**: `dynamicParams = false`, `generateStaticParams` **musi używać `LANDING_SLUGS`** (`src/lib/seo-data.ts`) — Set z 924 valid slugów (48 keywords + 30 cities + 576 keyword-topcity + 270 category-extracity). Jeśli używać samego `ALL_KEYWORDS + ALL_CITIES` (78), 846 URLi z `sitemap-locations.xml` da 404.
- **`middleware.ts`**: 301 redirect legacy `/{title-PublicId}` (mixed-case) → `/service/{slug}` + 404 na `/_next/data/*` (stara Pages Router pułapka Googlebot cache).

### Security headers — `public/_headers`, NIE `next.config.ts`

**Krytyczne:** `next.config.ts::headers()` **nie jest respektowane** przez `@cloudflare/next-on-pages`. Pages nie ma warstwy Next Server która by je serwowała. Wszystkie headery security (CSP, HSTS, X-Robots-Tag) **muszą** być w `public/_headers` — CF Pages honoruje go natywnie i kopiuje do `.vercel/output/static/_headers` przy build.

`next.config.ts::headers()` zostaje dla `next dev` / lokalnego preview — ale produkcja czyta tylko `_headers`.

CSP zawiera `'unsafe-inline'` w `script-src` bo Next inline'uje bootstrap script. Google Maps callback (`window.initMap`) też przez inline. Nie usuwać `'unsafe-inline'` bez przetestowania.

### Auth & token

`src/services/apiClient.ts` — HTTP client. JWT via `tokenUtils.get()` (in-memory, module-level `_memToken`). Refresh token w httpOnly cookie na web (native: Keychain przez `capacitor-secure-storage-plugin` — nieaktywne bo cap-stub).

Startup: jeśli `is_logged_in=true` w localStorage ale brak tokenu → `POST /api/auth/refresh` z RT z cookie → nowy AT w pamięci.

401 → `apiClient` auto-retry z fresh tokenem. Drugie 401 → `auth:logout-required` custom event → React redirect na `/auth` (bez hard reload).

### WebSocket (`src/hooks/useWebSocket.ts`)

Global singleton na `wss://api.mylokalni.pl`. Auto-connect na login, disconnect na logout, exp. backoff reconnect (1s → 30s). Events: `new_message`, `booking_update`, `online_status`, `typing`. Dispatch do registered listeners, `useAppLogic` używa do invalidateQueries + update chat/notification state. **Jedna instancja na app lifetime.**

## Konwencje

- **Path alias:** `@/*` → `src/*`
- **Tailwind:** utility-first, custom kolory w `tailwind.config.ts` (primary `#6366F1`, accent `#10B981`)
- **`strict: true`** w tsconfig — nowszy projekt niż siostrzany, brak `any` w nowo pisanym kodzie
- **Data:** `src/data/constants.ts` (`CITY_COORDS`, `POLISH_CITIES`), `src/data/categories.tsx`, `src/data/fixtures.ts` (mock dla `PublicProfileView`)
- **Landing SEO data:** `src/lib/seo-data.ts` — `LANDING_SLUGS`, `CITY_DISPLAY`, `CITY_LOCATIVE`, `KEYWORD_DISPLAY`, `parseLandingSlug`
- **Logger:** `src/utils/logger.ts` — nie `console.*` (w produkcji `info/debug` są silent)
- **Service location helpers:** `src/utils/serviceUtils.ts` — `isRemoteService`, `serviceMatchesLocation`, `getServiceCoords` (single source of truth, nie czytaj `service.city`/`service.isRemote` bezpośrednio)

## Pitfalls / traps

- **Nie dodawaj `<Navigate>` w tab strip.** Wszystkie 4 taby są w DOM jednocześnie — Navigate w ukrytym slocie natychmiast zmienia URL. Guardy przez conditional element (`state.isLoggedIn ? <View/> : authRedirect`).
- **Suspense w `(public)/layout.tsx` jest obowiązkowy.** Widoki `VerifyEmailView`, `DeleteAccountConfirmView` używają `useSearchParams()` który wymaga Suspense boundary przy static generation (Next 15).
- **`build:cf` != `build`.** `next build` samo nie wygeneruje `.vercel/output/static/`. Zawsze uruchom `build:cf` żeby zweryfikować CF-specific behavior (`_headers`, edge runtime, static pages count).
- **`packageManager: pnpm@10.15.0`** wpływa też na CI. Zmiana tej wartości wpłynie na deployment.
- **HSTS w response** — CF nadpisuje `max-age=0`. Fix tylko w CF Dashboard → SSL/TLS → Edge Certificates → HSTS. `_headers` też deklaruje HSTS, ale CF wygrywa.

## Ecosystem — 5 projektów w monorepo-style workspace

Ten CLAUDE.md jest hubem — Claude Code pracujący w `lokalni-web` może z tego poziomu edytować dowolny z siostrzanych projektów na Desktop. Poniższe sekcje podają minimum żeby pracować. Każdy projekt ma osobne git repo — commity osobno.

**Kolejność startu przy full local dev:**
1. Postgres + Redis + Meilisearch (via `docker-compose` w Lokalni API)
2. `Lokalni API` (port 8080)
3. `lokalni-web` (`next dev`, port 3000) lub `lokalni projekt` (`bun run dev`, port 5173) — konsumują API
4. `Lokalni Admin API` (osobny port) + `Lokalni Admin` (port 3001)

### 🌐 lokalni-web (ten projekt)

Patrz cały ten CLAUDE.md wyżej.

### 📱 lokalni projekt (Vite + Capacitor mobile)

**Ścieżka:** `/Users/cypriantalmon/Desktop/lokalni projekt/`
**Rola:** iOS + Android app (Capacitor). Web wygaszany na rzecz `lokalni-web`. Sporo widoków (`src/views/*`, `src/components/modals/*`) współdzielone 1:1 z tym projektem — jeśli zmieniasz shared widok tu, prawdopodobnie musisz zsynchronizować tam (i vice versa).

**Komendy** (z root):
```bash
bun run dev          # Vite :5173, proxy /api → https://api.cypriantalmon.pl
bun run build        # → dist/
bun run lint         # ESLint (pre-commit hook + lint-staged na *.ts/tsx)
npx tsc --noEmit     # TypeScript (z src/, strict: false)
```

**Deploy natywny:** `bun run build` → `npx cap sync ios|android` → Xcode / Android Studio.
**Deploy web (deprecated):** `dist/` → `/usr/share/nginx/html/` na serwerze + `sudo systemctl reload nginx` (user robi ręcznie, nie Claude).

**Kluczowe różnice od lokalni-web:**
- Vite (nie Next.js), React Router (nie App Router), single mega-hook `useAppLogic` (bez Context — props drilling)
- `strict: false` w tsconfig — legacy `any` w dashboard code
- Capacitor **prawdziwy** (nie stub) — `@capacitor/*` importy dają real native APIs
- App ID: `com.lokalni.app`
- Deep szczegóły w `lokalni projekt/CLAUDE.md`

### 🖥️ Lokalni API (backend `api.mylokalni.pl`)

**Ścieżka:** `/Users/cypriantalmon/Desktop/Lokalni API/`
**Stack:** Fastify 5 + TypeScript ESM (`"type": "module"`), Postgres + Redis + Meilisearch + Firebase Admin + S3 + Postmark + WebSocket.

**Komendy:**
```bash
npm run dev          # tsx watch, port z .env (typowo 8080)
npm run build        # tsc → dist/
npm run start        # node dist/server.js (produkcja)
npm run typecheck    # tsc --noEmit
npm run migrate      # dist/db/migrate.js — SQL migracje
npm run seed         # seed danych
npm run seed:cities  # seed miast (osobno)
npm run seed:geonames
npm run seed:teryt   # seed rejestru TERYT
npm run lint         # ESLint na src/
```

**Deploy:** Docker via GitHub Container Registry.
- Image: `ghcr.io/1talmon/lokalni-api:latest`
- `docker-compose.yml` w root — 2 instancje `api-1`, `api-2` (load-balanced przez nginx-lb) + Postgres + Redis + Meilisearch
- Build+push: `docker build -t ghcr.io/1talmon/lokalni-api:latest . && docker push ...`
- Na serwerze: `docker compose pull && docker compose up -d` (user robi ręcznie)

**Ważne:**
- **API to source of truth dla client contracts.** Zmiana route/schema tu wymaga równoległej zmiany w klientach (`lokalni-web`, `lokalni projekt`, `Lokalni Admin`).
- **Sitemap-services** (`lokalni-web/src/app/sitemap-services.xml/route.ts`) proxuje `${API_URL}/public/sitemap/services` — endpoint musi istnieć.
- **WebSocket** na tym samym hoście (`wss://api.mylokalni.pl`) — `@fastify/websocket`.
- **Docker w produkcji** — sprawdzaj logi przez `docker logs lokalni-api-1` (nie systemd, nie journalctl).
- **API docs** w Notion (nie w plikach `.md` lokalnych).

### 🛡️ Lokalni Admin API (admin backend)

**Ścieżka:** `/Users/cypriantalmon/Desktop/Lokalni Admin API/`
**Stack:** Fastify 5 + TypeScript ESM + Postgres + Firebase Admin + Postmark. Mniejszy niż Lokalni API.

**Komendy:**
```bash
npm run dev          # tsx watch
npm run build        # tsc + kopia migracji SQL do dist/
npm run start        # node dist/server.js
```

**Uwagi:**
- Osobne repo, osobna baza (albo shared z Lokalni API — do sprawdzenia w `src/db/`).
- Sensitive endpoint'y (moderacja, user management) — CORS restrictive.
- Zawiera `AUDIT.md`, `AUDIT_PROGRESS.md`, `FIX_PROGRESS.md`, `PRODUCT_GAPS.md`, `ADMIN_FRONTEND_CONTRACT_CHANGES.md` — sprawdzaj tam context przed zmianami.

### 🎛️ Lokalni Admin (admin frontend)

**Ścieżka:** `/Users/cypriantalmon/Desktop/Lokalni Admin/`
**Stack:** Vite + React 18 + React Router 6 + React Query + Tailwind. Deploy: Cloudflare (`wrangler.toml`).

**Komendy:**
```bash
npm run dev          # Vite :3001
npm run build        # tsc --noEmit && vite build
npm run lint         # ESLint
npm run preview      # vite preview :3001
```

**Uwagi:**
- Konsumuje **Lokalni Admin API**, nie główne API.
- Osobna domena (do sprawdzenia w `wrangler.toml`).

### 📝 lokalni-audit (dokumentacja audytu)

**Ścieżka:** `/Users/cypriantalmon/Desktop/lokalni-audit/`
Multi-phase audit migracji Vite → Next.js: `00-plan.md`, `01-feature-parity.md`, `02-runtime.md`, `03-seo.md`, `04-deploy.md`, `05-code-quality.md`, `06-perf.md`. Piszesz do niego wyniki analiz, statusy, rekomendacje.

## Cross-project workflow

### Kiedy zmiana dotyka > 1 projektu

**API contract change (route, schema, response format):**
1. Zmień w `Lokalni API` (backend) — dodaj/zaktualizuj route + Zod schema
2. Uruchom `Lokalni API` lokalnie (`npm run dev`)
3. Zaktualizuj client w `lokalni-web` **i** `lokalni projekt` (shared widoki) — types w `src/types/`, wywołania w `src/services/apiClient.ts` lub React Query hooks
4. Zaktualizuj Notion API docs (source of truth dla API)
5. Deploy: backend **pierwszy** (Docker rebuild + `docker compose up -d`), frontend **po** (git push → CI). Kompatybilność wsteczna gdy klientów starych wersji jest live.

**Shared widok (`ServiceDetailsView`, `PublicProfileView`, `HomeView`, itd.):**
- Piki `src/views/*.tsx` istnieją prawie bit-po-bicie w obu projektach (`lokalni-web` + `lokalni projekt`). Zmiana tu = zmiana też tam.
- Sprawdź `diff -q` między projektami przed edycją żeby wiedzieć jakie różnice już istnieją (np. importy React Router vs Next router).

**Konfiguracja deploy (headers, CSP, cache):**
- `lokalni-web`: `public/_headers` (CF Pages honoruje natywnie)
- `lokalni projekt` (web deprecated): `src/nginx.conf`
- API: `@fastify/helmet` + CORS config w `src/server.ts`

### Kolejność deploy (production)

1. **Backend najpierw** (Lokalni API / Lokalni Admin API — Docker build + push + `docker compose up -d`)
2. **Frontend potem** (lokalni-web push do main → CF Pages CI; lokalni projekt web → nginx; mobile → Xcode/App Store review)

Nigdy nie deployuj frontendu z API dependency przed backendem.

### Commit conventions (spójne dla wszystkich projektów)

Style widoczny w git log:
- `fix(scope): opis` (np. `fix(cf-pages): pages_build_output_dir`)
- `feat(scope): opis`
- `refactor(scope): opis`
- `chore(scope): opis`
- `docs(scope): opis`
- `perf(scope): opis`

Po polsku. `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>` w trailer gdy commit robi Claude Code.

### Autorytatywne źródła

- **Kod:** live w każdym projekcie na Desktop + git remote
- **API contract:** Notion (nie lokalne `.md` docs — te są przestarzałe / obsolete)
- **Deploy state:** CF Dashboard (Pages), server SSH (Docker, nginx)
- **Bug tracking / roadmap:** Notion + `Lokalni Admin API/AUDIT.md` + `lokalni-audit/*.md`

## MCP: code-review-graph

Projekt ma knowledge graph (auto-update przez hooks). Preferuj MCP tools (`semantic_search_nodes`, `query_graph`, `detect_changes`, `get_impact_radius`, `get_affected_flows`) nad Grep/Glob/Read dla exploration i review — szybsze i tańsze tokenowo. Fall back do Grep/Read tylko gdy graf nie pokrywa.
