# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from the **project root** (`/Users/cypriantalmon/Desktop/lokalni projekt/`), not from `src/`.

```bash
npm run dev          # Dev server on port 8080
npm run build        # Production build → dist/
npm run lint         # ESLint check
npx tsc --noEmit     # TypeScript type-check (run from src/)
```

No test suite exists. Type-checking is the primary quality gate — always run `npx tsc --noEmit` from `src/` before finishing.

Deploy: copy `dist/` contents to `/usr/share/nginx/html/` on the server, then `sudo systemctl reload nginx`. The nginx config lives at `src/nginx.conf`.

## Architecture

### Root split
- `package.json`, `vite.config.ts`, `tailwind.config.ts`, `capacitor.config.ts` live in the **project root**
- All source code is in `src/`
- Git root is **`src/`** (not the project root)

### State management — single mega-hook
`src/hooks/useAppLogic.ts` is the brain of the app. It owns all global state (auth, services, chat, favorites, modals) and exports `{ state: AppState, actions: AppActions }`. These types are in `src/types/appTypes.ts`. Every top-level component receives `state` and `actions` as props — there is no Context or Redux.

`useMyProfile`, `useNotifications`, `usePublicProfile` are React Query hooks that layer on top.

### Routing
`src/routes/AppRoutes.tsx` — all routes. Views inside `MainLayout` use `<Outlet>`. Heavy views are **lazy-loaded** (`React.lazy`). `AuthRoute` is a local wrapper inside AppRoutes that holds `authMode` state (fixes the register/login toggle).

### Modal system — two patterns
1. **Global modals** (`chat_detail`, `add_service`, `report`): managed via `state.activeModal` in `useAppLogic`, rendered by `src/components/modals/ModalsManager.tsx` in `App.tsx`. Opened via `actions.setActiveModal(...)` or `actions.openReportModal(...)`.
2. **View-local modals** (`NewsFeedModal`, `CertificatesModal`, `ClientPhotosModal`, `ReportModal` in PublicProfileView): managed with local `useState` inside the view, use `createPortal` to `document.body`.

### API layer
`src/services/apiClient.ts` — central HTTP client. Uses `tokenUtils.get()` to retrieve the JWT, handles 401 with auto-refresh via `/auth/refresh`. All authenticated calls go through `apiClient.get/post/patch/delete`.

`src/services/authService.ts` — auth + profile. Token is stored in `localStorage` under key `userToken` (known limitation; httpOnly cookie requires backend change).

`src/utils/tokenUtils.ts` — JWT validation, expiry checking, `clearAll()`. Used by `useAppLogic` to auto-logout on token expiry, including on tab visibility change.

`src/utils/logger.ts` — replaces `console.*`. In production, `info/debug` are silent. Use `logger.error/warn/info/debug`.

### Data
- `src/data/constants.ts` — `INITIAL_SERVICES`, `MOCK_REVIEWS`, `CITY_COORDS` (12 Polish cities → lat/lon strings), `POLISH_CITIES`
- `src/data/fixtures.ts` — mock data for `PublicProfileView` (posts, reviews, photos, certificates). View-specific, not API data.
- `src/data/categories.tsx` — 16 service categories with lucide icons

### Key conventions
- **Path alias**: `@/` maps to `src/` — use for imports outside immediate directory
- **Tailwind**: utility-first, no CSS modules. Custom colors in `tailwind.config.ts` (primary `#6366F1`, accent `#10B981`)
- **`usePersistedState`**: localStorage wrapper with prototype pollution protection. Used for: `user_location`, `is_logged_in`, `user_profile`, `user_favorites`, `user_chats`, `all_services_v20`
- **Map**: `src/components/MapView.tsx` uses `react-leaflet` v4 + Carto Positron tiles. Manual city-based clustering (zoom < 9 = clusters, zoom ≥ 9 = individual markers). Leaflet CSS overrides in `src/App.css` under `.lokalni-popup`.
- **Mobile**: Capacitor (`com.lokalni.test`). `main.tsx` monkey-patches `window.fetch` with `CapacitorHttp` for native platforms. Safe area insets handled via `env(safe-area-inset-*)` in `App.css`.

### Security notes
- CSP, HSTS, X-Frame-Options are **HTTP headers** in nginx (not meta tags) — see `src/nginx.conf`
- `src/components/ui/ErrorBoundary.tsx` wraps `<App>` and `<Routes>` — crashes show a Polish fallback UI
- `strict: false` in `tsconfig.app.json` — TypeScript is lenient; `any` types exist, especially in older dashboard code

## Crucial Development Rules
- **NEVER** delete any existing code or change the visual appearance, styling, or project structure unless explicitly commanded.
- If changes are requested, modify **ONLY** the specific parts indicated. Keep everything else intact.