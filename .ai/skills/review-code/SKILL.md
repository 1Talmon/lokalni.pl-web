---
name: review-code
description: Przegląd kodu w tym projekcie (lokalni-web) lub shared widoków z siostrzanego Vite/Capacitor projektu. Używa MCP code-review-graph do trace impact + weryfikuje CF Pages specifics (headers, edge runtime, static params).
---

# Skill: review-code

## Kiedy używać

- User prosi o review konkretnego pliku, PR, feature branch
- Przed commit większej zmiany (`git diff main..HEAD`)
- Po refactorze — sprawdzić że nic się nie zepsuło

## Kroki

### 1. Zebrać kontekst zmiany

```bash
git -C /Users/cypriantalmon/Desktop/lokalni-web diff main..HEAD --stat
git -C /Users/cypriantalmon/Desktop/lokalni-web log main..HEAD --oneline
```

Dla konkretnego PR:
```bash
gh pr diff <NUMBER> -R 1Talmon/lokalni.pl-web
```

### 2. MCP graph — trace impact

Preferuj **przed** Grep/Read:
- `mcp__code-review-graph__detect_changes_tool` — risk-scored analiza
- `mcp__code-review-graph__get_impact_radius_tool` — co się może zepsuć
- `mcp__code-review-graph__get_affected_flows_tool` — które user flow są dotknięte
- `mcp__code-review-graph__query_graph_tool` pattern="callers_of" — kto woła zmienione funkcje
- `mcp__code-review-graph__query_graph_tool` pattern="tests_for" — test coverage

### 3. Weryfikacja CF Pages specifics

Jeśli zmiana dotyka:

**`next.config.ts`**: sprawdź czy używa `headers()` — **nie działa** na CF Pages. Wszelkie CSP/security headers muszą iść do `public/_headers`.

**`src/app/*/page.tsx`** z `runtime: 'edge'`: fetch API musi być non-blocking, nie używać `fs` / `path`.

**`src/app/[slug]/page.tsx`**: `generateStaticParams` musi używać `LANDING_SLUGS` (nie `ALL_KEYWORDS + ALL_CITIES`) — inaczej 846 landing URLi da 404.

**`src/app/service/[slug]/page.tsx` / `profile/[uid]/page.tsx`**: fetch API → jeśli null musi wywołać `notFound()`. Fallback metadata z 200 daje Google śmieciowe indeksowanie.

**Grupa route:**
- W `(app)/` → dostaje MainLayout + tab strip + BottomNav + ModalsManager. Dla user-facing app UX.
- W `(public)/` → tylko QueryProvider + AppProvider + Suspense. Dla stron z linku/maila które używają `useApp()`.
- Top-level (bez grupy) → tylko RootLayout. Dla SEO SSR (service/profile/[slug]) i marketing landings bez `useApp()`.

**`public/_headers`**: jeśli dodajesz nowy private route, dodaj wpis `X-Robots-Tag: noindex, nofollow` (2 wpisy: path + path/*).

### 4. Local quality gates

Zawsze przed uznaniem review za pozytywne:

```bash
cd /Users/cypriantalmon/Desktop/lokalni-web
npx tsc --noEmit       # pre-commit hook, 0 errors wymagane
npm run lint           # 0 errors, 0 warnings (config nie pozwala na warnings)
npm run build:cf       # NIE tylko `build` — CF-specific weryfikacja
```

`build:cf` sprawdza:
- Static params count (`Prerendered Routes (N)` — po fixie z sesji 09/2026 powinno być ~949)
- `_headers` w output (`.vercel/output/static/_headers`)
- Edge routes bindowanie

### 5. Weryfikacja post-deploy (jeśli commit + push zdeployowany)

```bash
curl -sSI https://mylokalni.pl/dashboard | grep -iE "csp|x-robots-tag"
# oczekiwane: content-security-policy: default-src 'self'; ... + x-robots-tag: noindex, nofollow

curl -sS --max-time 15 -o /dev/null -w "HTTP:%{http_code}\n" \
  https://mylokalni.pl/service/nonexistent-XYZ
# oczekiwane: HTTP:404
```

## Anti-patterns do wychwycenia

- `console.log`/`.info` — użyć `logger.info/debug/warn/error` z `src/utils/logger.ts` (silent w prod)
- Nowy provider gdzie już jest `AppProvider` — użyć `useApp()` z `providers/AppProvider.tsx`
- `<Navigate>` w routes które są w tab strip (`(app)/page.tsx`, `chat`, `calendar`, `favorites`) — wszystkie sloty w DOM naraz, redirect execute z ukrytego slotu
- Dodanie `@capacitor/*` do package.json — nadal będzie brany stub przez tsconfig+webpack alias
- Bezpośrednie czytanie `service.city` / `service.isRemote` — zawsze przez `src/utils/serviceUtils.ts` (`isRemoteService`, `serviceMatchesLocation`, `getServiceCoords`)
- Nowe security header w `next.config.ts::headers()` — nie działa, dodać do `public/_headers`

## Output review

Napisz krótko:
1. **Co zmienia** (1-2 zdania)
2. **Impact** (co jeszcze się dotyka wg grafu)
3. **Ryzyko** (1-5, uzasadnij)
4. **Findings** (bugi + nice-to-have, bulletpoints)
5. **Verdict**: LGTM / needs changes
