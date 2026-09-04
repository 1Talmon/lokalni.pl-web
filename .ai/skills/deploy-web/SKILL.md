---
name: deploy-web
description: Deploy lokalni-web (Next.js/CF Pages) — flow push dev → preview build → verify → merge do main → produkcja. Weryfikacja przez curl checks na preview i na prod.
---

# Skill: deploy-web

## Kiedy używać

- User prosi o "deploy" / "wdrożenie" / "push" zmian
- Chce zweryfikować że commit poszedł na preview (dev.lokalni-pl-web.pages.dev) lub produkcję (mylokalni.pl)
- Chce promować dev → main (produkcja)

## Workflow overview

```
    lokalne commity na dev
             ↓
       git push origin dev
             ↓
    CF Pages CI build → dev.lokalni-pl-web.pages.dev (preview)
             ↓
    verify curls (te same 3 checks co prod)
             ↓
    if OK: merge dev → main (fast-forward)
             ↓
       git push origin main
             ↓
    CF Pages CI build → mylokalni.pl (production)
             ↓
    verify curls na produkcji
```

**Kluczowa zasada:** wszystkie zmiany idą **najpierw na dev**, weryfikują się na `dev.lokalni-pl-web.pages.dev`, dopiero potem promocja do `main` (produkcja). Nigdy nie pushuj bezpośrednio na main bez uprzedniej weryfikacji na dev.

## Zasady bezpieczeństwa

- **Nie pushuj bez wyraźnego polecenia** ("push", "wdróż", "deploy"). "Commit" ≠ "push".
- **Domyślnie push na `dev`** — nigdy bezpośrednio na `main` bez zgody.
- Nie force-push nigdy (ani dev, ani main).
- Zawsze `build:cf` **przed** pushem.
- Promocja dev → main tylko fast-forward merge (żeby historia była czysta), nigdy `--no-ff` chyba że user prosi.

## Kroki

### 1. Pre-flight — lokalna weryfikacja

```bash
cd /Users/cypriantalmon/Desktop/lokalni-web

git status
git branch --show-current  # powinien być `dev`
git log --oneline origin/dev..HEAD  # ile commitów ahead na dev

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

### 2. Push na dev (tylko z eksplicit zgody)

```bash
git push origin dev
```

Uwaga na warnings:
- `Everything up-to-date` → nic nie zostało zdeployowane
- `[rejected]` → force-push required lub pull first — **nie force-push bez zgody**

### 3. CF Pages CI (preview deployment)

Push do `dev` triggers CF Pages CI automatycznie. Projekt: `lokalni-pl-web`. Build zwykle 2-5 minut. Preview URL: **`dev.lokalni-pl-web.pages.dev`** (custom domain) + `<hash>.lokalni-pl-web.pages.dev` (default preview URL per commit). **Nie jest widoczny z terminala** — user obserwuje w CF Dashboard.

Jeśli user pokaże że CI padło:
- Sprawdź czy `packageManager: pnpm@10.15.0` jest w `package.json` (bez tego pnpm 9 wywala z `ERR_PNPM_IGNORED_BUILDS`)
- Sprawdź czy `.npmrc` ma `onlyBuiltDependencies=esbuild,workerd,unrs-resolver`
- Sprawdź czy `pnpm-workspace.yaml` ma `onlyBuiltDependencies` block
- Sprawdź logi w CF Dashboard → Pages → deployment failed → View logs

### 4. Post-deploy verification na dev.lokalni-pl-web.pages.dev (obowiązkowe przed promocją do main)

Po ~3-5 min od pusha na `dev`, sprawdź trzy kluczowe endpointy na **preview**:

```bash
# 1. CSP + X-Robots-Tag na private route
/usr/bin/curl -sSI --max-time 15 https://dev.lokalni-pl-web.pages.dev/dashboard | \
  grep -iE "^HTTP|content-security-policy|x-robots-tag"
# oczekiwane:
#   HTTP/2 200
#   content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' ...
#   x-robots-tag: noindex, nofollow

# 2. 404 dla nieistniejących service/profile
/usr/bin/curl -sS --max-time 15 -o /dev/null -w "HTTP:%{http_code}\n" \
  https://dev.lokalni-pl-web.pages.dev/service/nonexistent-XYZ
# oczekiwane: HTTP:404

# 3. 200 dla landing pages keyword-city
/usr/bin/curl -sS --max-time 15 -o /dev/null -w "HTTP:%{http_code}\n" \
  https://dev.lokalni-pl-web.pages.dev/hydraulik-warszawa
# oczekiwane: HTTP:200
```

Jeśli którykolwiek fail — **nie promuj do main**, napraw najpierw na dev.

### 5. Promocja dev → main (produkcja)

Gdy verify preview OK i user zaakceptował, promuj do produkcji:

```bash
# Fast-forward merge dev do main (bez merge commit)
git checkout main
git merge --ff-only dev

# Push main → CF Pages produkcyjny build → mylokalni.pl
git push origin main

# Wróć na dev do dalszej pracy
git checkout dev
```

Jeśli `--ff-only` faili (main się rozjechał z dev) — trzeba rebase dev na main, nie force-merge.

### 6. Post-deploy verification na produkcji

Te same 3 curle, tylko na `mylokalni.pl` (bez `dev.`):

```bash
/usr/bin/curl -sSI --max-time 15 https://mylokalni.pl/dashboard | grep -iE "^HTTP|csp|x-robots-tag"
/usr/bin/curl -sS --max-time 15 -o /dev/null -w "HTTP:%{http_code}\n" https://mylokalni.pl/service/nonexistent-XYZ
/usr/bin/curl -sS --max-time 15 -o /dev/null -w "HTTP:%{http_code}\n" https://mylokalni.pl/hydraulik-warszawa
```

Jeśli któryś nie zgadza się z oczekiwanym:
- Poczekaj kolejne 2 min (CF cache CDN może się propagować)
- Sprawdź czy nowy commit hash jest w response (HTML `data-buildid` albo `x-nextjs-` headers)
- Jeśli nadal fail → sprawdź CF Dashboard deployment log

## Rollback (produkcja)

Jeśli deploy do main zepsuł produkcję:

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
