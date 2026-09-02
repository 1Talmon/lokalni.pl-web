# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool | Use when |
| ------ | ---------- |
| `detect_changes` | Reviewing code changes — gives risk-scored analysis |
| `get_review_context` | Need source snippets for review — token-efficient |
| `get_impact_radius` | Understanding blast radius of a change |
| `get_affected_flows` | Finding which execution paths are impacted |
| `query_graph` | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes` | Finding functions/classes by name or keyword |
| `get_architecture_overview` | Understanding high-level codebase structure |
| `refactor_tool` | Planning renames, finding dead code |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.

---

## Commands

All commands run from the **project root** (`/Users/cypriantalmon/Desktop/lokalni projekt/`).

```bash
bun run dev          # Vite dev server on :5173 (proxies /api → https://api.cypriantalmon.pl)
bun run build        # Production build → dist/
bun run lint         # ESLint (0 warnings allowed — enforced by pre-commit hook)
npx tsc --noEmit     # TypeScript type-check (run from src/ directory)
```

No test suite. Type-checking + lint are the primary quality gates — pre-commit runs both automatically via lint-staged + husky on staged `*.ts/tsx` files.

**Capacitor (mobile):** after `bun run build`, sync with `npx cap sync ios` or `npx cap sync android`, then open in Xcode/Android Studio.

**Deploy:** copy `dist/` to `/usr/share/nginx/html/` on the server, then `sudo systemctl reload nginx`. Nginx config lives at `src/nginx.conf`.

## Architecture

### Project layout
- Config files (`package.json`, `vite.config.ts`, `tailwind.config.ts`, `capacitor.config.ts`) live in the **project root**
- All source code is in `src/`
- Git root is the **project root** (not `src/`)
- App ID: `com.lokalni.app` (Capacitor), App name: `Lokalni.pl`

### State management — single mega-hook
`src/hooks/useAppLogic.ts` owns all global state (auth, services, chat, favorites, modals) and exports `{ state: AppState, actions: AppActions }`. Types live in `src/types/appTypes.ts`. Every top-level component receives `state` and `actions` as props — no Context, no Redux.

`useMyProfile`, `useNotifications`, `usePublicProfile` are React Query hooks that layer on top.

### Routing & tab strip

`src/routes/AppRoutes.tsx` — all routes. The four main tabs (`/`, `/chat`, `/calendar`, `/favorites`) are rendered as a **CSS scroll-snap strip** inside `MainLayout` — all four are mounted in the DOM simultaneously and never unmounted on tab switch (preserves scroll position). `SWIPE_TABS` and `SWIPE_TAB_NAMES` in `useTabSwipe.ts` define the order.

Never use `<Navigate>` inside the tab strip — it silently redirects when a hidden tab renders. Route-level guards use conditionally rendered elements (`state.isLoggedIn ? <View/> : authRedirect`).

Heavy views outside the strip are **lazy-loaded** (`React.lazy`). `HomeView` and `PublicProfileView` are eagerly imported — Suspense re-mounting breaks WAAPI animations on iOS. `AuthRoute` is a local wrapper inside AppRoutes that manages `authMode` state.

**Navigation transitions:**
- Native (iOS/Android): raw navigation, no transitions.
- Web: View Transitions API (`document.startViewTransition`) with CSS slide animation.
- Safari web: VT skipped (GPU canvas punch-through bug with Leaflet); a white DOM overlay (`z-index:49`) fades in/out instead.

### Modal system — two patterns
1. **Global modals** (`chat_detail`, `add_service`, `report`): `state.activeModal` in `useAppLogic`, rendered by `src/components/modals/ModalsManager.tsx`. Opened via `actions.setActiveModal(...)` or `actions.openReportModal(...)`.
2. **View-local modals** (`NewsFeedModal`, `CertificatesModal`, `ClientPhotosModal`, `ReportModal` in PublicProfileView): `useState` inside the view, rendered via `createPortal` to `document.body`.

### Auth & token security

**Access tokens live only in memory** (`src/utils/tokenUtils.ts`, module-level `_memToken`). They are never written to localStorage (XSS-safe). On page refresh the token is gone and must be silently restored.

**Refresh tokens** are stored in native Keychain/Keystore on mobile (`src/utils/secureStorage.ts` via `capacitor-secure-storage-plugin`), or in an httpOnly cookie on web.

**Startup flow** (`useAppLogic.ts`): if `isLoggedIn=true` in localStorage but no token in memory → `POST /api/auth/refresh` with RT from Keychain/cookie → store new AT in memory. On iOS, if Keychain is empty (old install pre-secureStorage), silently clear session without redirecting.

`src/services/apiClient.ts` — central HTTP client. Reads JWT via `tokenUtils.get()`, auto-retries 401 with a refreshed token. On second failure dispatches `auth:logout-required` custom event — React handles it without a hard reload (avoids visible native element flicker on iOS).

`src/utils/tokenUtils.ts` — in-memory JWT store with validation and expiry checking. `clearAll()` clears both memory and localStorage auth flags.

`src/utils/logger.ts` — replaces `console.*`. In production `info/debug` are silent. Always use `logger.error/warn/info/debug`.

### Real-time (WebSocket)

`src/hooks/useWebSocket.ts` maintains a **global singleton** WebSocket (`wss://api.cypriantalmon.pl`). Auto-connects on login, disconnects on logout, reconnects with exponential backoff (1 s → max 30 s). It dispatches typed events (`new_message`, `booking_update`, `online_status`, `typing`, etc.) to registered listeners; `useAppLogic` uses these to call `queryClient.invalidateQueries` and update chat/notification state. There is one WebSocket per app lifetime — do not create additional connections.

### Service location helpers

Always use `src/utils/serviceUtils.ts` instead of reading `service.city` or `service.isRemote` directly:
- `isRemoteService(service)` — single source of truth for remote/online service detection
- `serviceMatchesLocation(service, location)` — location filter logic
- `getServiceCoords(service)` — returns `{lat, lng}` with city fallback from `CITY_COORDS`

### Data
- `src/data/constants.ts` — `INITIAL_SERVICES`, `MOCK_REVIEWS`, `CITY_COORDS` (12 Polish cities → lat/lon), `POLISH_CITIES`
- `src/data/fixtures.ts` — mock data for `PublicProfileView` (posts, reviews, photos, certificates)
- `src/data/categories.tsx` — 16 service categories with lucide icons

### Key conventions
- **Path alias**: `@/` maps to `src/`
- **Tailwind**: utility-first, no CSS modules. Custom colors in `tailwind.config.ts` (primary `#6366F1`, accent `#10B981`)
- **`usePersistedState`**: localStorage wrapper with prototype pollution protection. Keys: `user_location`, `is_logged_in`, `user_profile`, `user_favorites`, `user_chats`, `all_services_v20`
- **Map**: `src/components/MapView.tsx` uses `react-leaflet` v4 + Carto Positron tiles. Manual city-based clustering (zoom < 9 = clusters, zoom ≥ 9 = individual markers). Leaflet CSS overrides in `src/App.css` under `.lokalni-popup`.
- **Mobile HTTP**: `CapacitorHttp.enabled` is intentionally `false` in `capacitor.config.ts`. Do not enable it — it monkey-patches `window.fetch` and breaks `FormData`/file uploads. JSON requests go through `CapacitorHttp.request()` manually; FormData uses native WKWebView fetch directly.
- **Android splash**: a 160 ms `setTimeout` in `App.tsx` delays rendering until safe-area insets are applied, then hides the native splash with a 300 ms fade. This prevents layout jump.
- **iOS splash**: `SplashScreen.launchAutoHide: false` — hidden manually in `ServiceDetailsWrapper` once content is ready (waits for `isLoadingApp=false` + data).
- **Safe area insets**: handled via `env(safe-area-inset-*)` CSS variables in `App.css`. `--total-nav-h` and `--nav-content-h` CSS vars drive MainLayout strip height.
- **`strict: false`** in `tsconfig.app.json` — TypeScript is lenient; `any` types exist in older dashboard code.

### Security notes
- CSP, HSTS, X-Frame-Options are nginx HTTP headers, not meta tags — see `src/nginx.conf`
- `src/components/ui/ErrorBoundary.tsx` wraps `<App>` and `<Routes>` — crashes show Polish fallback UI

## Crucial Development Rules
- **NEVER** delete existing code or change visual appearance, styling, or project structure unless explicitly commanded.
- Modify **ONLY** the specific parts indicated. Keep everything else intact.
