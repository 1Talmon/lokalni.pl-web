---
name: deploy-web
description: Deploy lokalni-web (Next.js/CF Pages) — flow git push main → CF Pages CI → automatyczny build → mylokalni.pl. Weryfikacja post-deploy przez curl checks.
---

# Skill: deploy-web

## Kiedy używać

- User prosi o "deploy" lub "wdrożenie" zmian
- Chce zweryfikować że commit poszedł na produkcję

## Zasady bezpieczeństwa

- **Nie pushuj bez wyraźnego polecenia** ("push", "wdróż", "deploy"). "Commit" ≠ "push".
- Nie force-push do `main`.
- Zawsze weryfikacja lokalna (`build:cf`) **przed** pushem.

## Kroki

### 1. Pre-flight — lokalna weryfikacja

```bash
cd /Users/cypriantalmon/Desktop/lokalni-web

# Sprawdź stan repo
git status
git log --oneline main..HEAD  # ile commitów ahead

# Lokalna quality gate
npx tsc --noEmit
npm run lint
npm run build:cf   # OBOWIĄZKOWE — sprawdza CF-specific behavior

# Zweryfikuj _headers w output
grep -c "Content-Security-Policy" .vercel/output/static/_headers  # >=1
grep -c "X-Robots-Tag" .vercel/output/static/_headers             # >=14

# Zweryfikuj static params
grep "\[slug\]" .vercel/output/static/_worker.js/nop-build-log.json 2>/dev/null | head -3
```

Jeśli **którekolwiek** faili → nie pushuj, napraw najpierw.

### 2. Push (tylko z eksplicit zgody)

```bash
git push origin main
```

Uwaga na warnings:
- `Everything up-to-date` → nic nie zostało zdeployowane
- `[rejected]` → force-push required lub pull first — **nie force-push bez zgody**

### 3. CF Pages CI

Push do `main` triggers CF Pages CI automatycznie. Projekt: `lokalni-pl-web`. Build zwykle 2-5 minut. **Nie jest widoczny z terminala** — user obserwuje w CF Dashboard albo automatyczne notifications.

Jeśli user pokaże że CI padło:
- Sprawdź czy `packageManager: pnpm@10.15.0` jest w `package.json` (bez tego pnpm 9 wywala z `ERR_PNPM_IGNORED_BUILDS`)
- Sprawdź czy `.npmrc` ma `onlyBuiltDependencies=esbuild,workerd,unrs-resolver`
- Sprawdź czy `pnpm-workspace.yaml` ma `onlyBuiltDependencies` block
- Sprawdź logi w CF Dashboard → Pages → deployment failed → View logs

### 4. Post-deploy verification (obowiązkowe)

Po ~3-5 min od pusha, sprawdź trzy kluczowe endpointy:

```bash
# 1. CSP + X-Robots-Tag na private route
/usr/bin/curl -sSI --max-time 15 https://mylokalni.pl/dashboard | \
  grep -iE "^HTTP|content-security-policy|x-robots-tag"
# oczekiwane:
#   HTTP/2 200
#   content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' ...
#   x-robots-tag: noindex, nofollow

# 2. 404 dla nieistniejących service/profile
/usr/bin/curl -sS --max-time 15 -o /dev/null -w "HTTP:%{http_code}\n" \
  https://mylokalni.pl/service/nonexistent-XYZ
# oczekiwane: HTTP:404

# 3. 200 dla landing pages keyword-city (fix z sesji 09/2026)
/usr/bin/curl -sS --max-time 15 -o /dev/null -w "HTTP:%{http_code}\n" \
  https://mylokalni.pl/hydraulik-warszawa
# oczekiwane: HTTP:200
```

Jeśli któryś nie zgadza się z oczekiwanym:
- Poczekaj kolejne 2 min (CF cache CDN może się propagować)
- Sprawdź czy nowy commit hash jest w response (HTML `data-buildid` albo `x-nextjs-` headers)
- Jeśli nadal fail → sprawdź CF Dashboard deployment log

## Rollback

Jeśli deploy zepsuł produkcję:

**Opcja A — revert commit** (bezpieczniejsze):
```bash
git revert HEAD --no-edit
git push origin main   # trigger nowy CF build
```

**Opcja B — CF Dashboard** (natychmiastowe):
- CF Dashboard → Pages → `lokalni-pl-web` → Deployments → poprzedni successful → "Rollback to this deployment"
- Nie tworzy git commitu, ale zwraca produkcję do poprzedniego stanu w ~1 min

## Uwagi

- **Deploy backendu (Lokalni API)** to osobny flow — Docker build + push do `ghcr.io/1talmon/lokalni-api:latest` → SSH do serwera → `docker compose pull && up -d`. **User robi ręcznie**, nie Claude.
- **Deploy Lokalni Admin** (jeśli w tej samej sesji): patrz jego `wrangler.toml` — pewnie też CF (osobny projekt).
- **Kolejność deploy** przy API contract change: backend **pierwszy**, frontend **po**.
