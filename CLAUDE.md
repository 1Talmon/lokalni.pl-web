# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Next.js 15 App Router + React 18, deploy na Cloudflare Pages (`@cloudflare/next-on-pages`).
Produkcja: `https://mylokalni.pl`. Backend API: `https://api.mylokalni.pl` (osobny projekt).

Siostrzany projekt: `/Users/cypriantalmon/Desktop/lokalni projekt/` — starszy Vite/React + Capacitor SPA (iOS/Android). Web wygaszany, ten projekt (`lokalni-web`) przejmuje SEO i przeglądarkę. Duża część kodu (`src/views/*`, `src/components/modals/*`, `src/hooks/*`) jest współdzielona 1:1 z siostrzanym projektem — dzięki cap-stubs (patrz niżej) działa bez Capacitor runtime.

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

## Sibling projects na Desktop

- `/Users/cypriantalmon/Desktop/lokalni projekt/` — Vite/React + Capacitor (mobile iOS/Android)
- `/Users/cypriantalmon/Desktop/Lokalni API/` — backend (`api.mylokalni.pl`), Docker
- `/Users/cypriantalmon/Desktop/Lokalni Admin/` + `Lokalni Admin API/` — admin panel + backend
- `/Users/cypriantalmon/Desktop/lokalni-audit/` — dokumentacja audytu migracji (6 faz)

## MCP: code-review-graph

Projekt ma knowledge graph (auto-update przez hooks). Preferuj MCP tools (`semantic_search_nodes`, `query_graph`, `detect_changes`, `get_impact_radius`, `get_affected_flows`) nad Grep/Glob/Read dla exploration i review — szybsze i tańsze tokenowo. Fall back do Grep/Read tylko gdy graf nie pokrywa.
