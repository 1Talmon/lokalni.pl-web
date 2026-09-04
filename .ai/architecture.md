# Architecture — MyLokalni.pl ecosystem

High-level diagram jak 5 projektów łączy się w system produkcyjny.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                    │
│                                                                   │
│  📱 lokalni projekt          🌐 lokalni-web       🎛️ Lokalni Admin│
│  (iOS/Android via            (Next.js 15,         (Vite+React,    │
│   Capacitor,                  CF Pages)           CF)             │
│   com.lokalni.app)            mylokalni.pl        admin.*         │
└────────────┬─────────────────────┬──────────────────────┬────────┘
             │                     │                       │
             │   HTTPS + WS        │   HTTPS + WS          │  HTTPS
             └─────────┬───────────┘                       │
                       │                                    │
              ┌────────▼────────────┐          ┌───────────▼──────┐
              │   🖥️  Lokalni API    │          │ 🛡️ Lokalni Admin │
              │   api.mylokalni.pl   │          │       API         │
              │   Fastify 5 ESM      │          │   Fastify 5 ESM   │
              │   Docker (2× LB)     │          │   Docker          │
              └───┬──────┬──────┬────┘          └─────┬─────────────┘
                  │      │      │                     │
             ┌────▼─┐ ┌──▼──┐ ┌─▼──────┐          ┌──▼─────┐
             │Postgres│ │Redis│ │Meilisearch│      │Postgres│
             └────────┘ └─────┘ └───────────┘      └────────┘

External:  Postmark (email) · Firebase Admin (push) · S3 (media) · Google Maps · Google OAuth · Facebook Login · Sentry
```

## Request flow

1. **User → frontend** (mobile / web / admin): renderuje UI, wywołuje `apiClient` → HTTPS na `api.mylokalni.pl`.
2. **Frontend → API**: JWT w `Authorization: Bearer` header (web/mobile) lub httpOnly cookie (web refresh). 401 → auto-refresh przez `/api/auth/refresh` → retry.
3. **API → Postgres/Redis/Meilisearch**: fetch/save data. Meilisearch dla full-text search.
4. **API → WebSocket** (`wss://api.mylokalni.pl`): push events (`new_message`, `booking_update`, `online_status`, `typing`) do wszystkich zalogowanych klientów tego usera.
5. **API → external**: Postmark (transakcyjne emaile), Firebase (push notifications mobile), S3 (upload obrazów/wideo — Sharp resize + FFmpeg dla wideo).

## Deploy topology

| Layer | Where | How |
|---|---|---|
| **DNS** | Cloudflare | `mylokalni.pl` + `api.mylokalni.pl` + `admin.*` (per wrangler.toml) |
| **Web frontend** (Next.js) | Cloudflare Pages `lokalni-pl-web` | Git push `main` → CI build (`@cloudflare/next-on-pages`) → auto-deploy |
| **Web frontend** (Vite, deprecated) | Serwer nginx | `bun run build` → `dist/` → scp → `/usr/share/nginx/html/` → reload |
| **Mobile** | App Store / Google Play | Xcode/Android Studio archive → store submit |
| **Admin frontend** | Cloudflare (wrangler.toml) | `npm run build` → CF Pages/Workers |
| **API** | Docker on VPS | `docker build` → `ghcr.io/1talmon/lokalni-api:latest` → `docker compose pull && up -d` |
| **Admin API** | Docker on VPS | podobnie |
| **DB backups** | ? (do potwierdzenia) | prawdopodobnie server-side cron |

## Data flow — kluczowe endpointy

- **Public** (SSR/SEO w lokalni-web):
  - `GET /api/services/{publicId}` → SSR metadata + JSON-LD `LocalBusiness`
  - `GET /api/users/{uid}/profile` → SSR metadata dla `/profile/{uid}`
  - `GET /api/services?search=&city=&limit=&sort=` → landing pages `[slug]`
  - `GET /api/public/sitemap/services` → `sitemap-services.xml` proxy

- **Auth**:
  - `POST /api/auth/login`, `/register`, `/refresh`, `/logout`, `/forgot-password`, `/reset-password`, `/verify-email`
  - Google OAuth callback, Facebook Login

- **Realtime**:
  - `WSS /` — global singleton per app lifetime

- **Media upload**:
  - `POST /api/services/{id}/images` (multipart, Sharp)
  - `POST /api/services/{id}/video` (multipart, FFmpeg transcoding, streaming)

## Shared code (WAŻNE)

`lokalni-web/src/views/*.tsx` ≈ `lokalni projekt/src/views/*.tsx` (kopie 1:1 z drobnymi różnicami — router API).
Podobnie `src/components/modals/*`, `src/hooks/*` (bez native), `src/data/*`, `src/utils/*`.

Zmiana logiki biznesowej w shared widoku = zmiana też w drugim projekcie (osobne commity, osobne repa).

## Cross-cutting concerns

- **Rate limiting**: `@fastify/rate-limit` na API (per IP)
- **CSP + security headers**: `public/_headers` (lokalni-web), nginx (lokalni projekt web), `@fastify/helmet` (API)
- **CORS**: `@fastify/cors` na API — whitelist domen frontendów
- **Sentry**: `@sentry/react` (frontendy) + `@sentry/node` (API) — separate DSN-y
- **Logger**: `src/utils/logger.ts` we frontendach (silent info/debug w prod), Fastify built-in w API
