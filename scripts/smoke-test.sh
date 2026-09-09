#!/usr/bin/env bash
# Smoke tests — uruchamiaj ręcznie po deploy lub przed pushem
# Użycie:
#   bash scripts/smoke-test.sh              # → testuje produkcję (mylokalni.pl)
#   bash scripts/smoke-test.sh dev          # → testuje preview (dev.lokalni-pl-web.pages.dev)
#   bash scripts/smoke-test.sh local        # → testuje localhost:3000

ENV="${1:-prod}"
case "$ENV" in
  prod)   BASE="https://mylokalni.pl" ;;
  dev)    BASE="https://dev.lokalni-pl-web.pages.dev" ;;
  local)  BASE="http://localhost:3000" ;;
  *)      echo "Nieznane środowisko: $ENV (prod|dev|local)"; exit 1 ;;
esac

API_BASE="https://api.mylokalni.pl/api"
PASS=0; FAIL=0; WARN=0
ERRORS=()

green() { printf "\033[32m✓\033[0m %s\n" "$1"; }
red()   { printf "\033[31m✗\033[0m %s\n" "$1"; }
yellow(){ printf "\033[33m⚠\033[0m %s\n" "$1"; }
header(){ printf "\n\033[1m%s\033[0m\n" "$1"; }

check_status() {
  local label="$1" url="$2" expected="${3:-200}"
  local actual
  actual=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 12 "$url" 2>/dev/null) || actual="ERR"
  if [[ "$actual" == "$expected" ]]; then
    green "$label ($actual)"
    ((PASS++)) || true
  else
    red "$label — oczekiwano $expected, dostał $actual"
    ((FAIL++)) || true
    ERRORS+=("$label: $actual != $expected")
  fi
}

check_contains() {
  local label="$1" url="$2" needle="$3"
  local body
  body=$(curl -sk --max-time 12 "$url" 2>/dev/null) || body=""
  if echo "$body" | grep -q "$needle" 2>/dev/null; then
    green "$label"
    ((PASS++)) || true
  else
    red "$label — brak '$needle'"
    ((FAIL++)) || true
    ERRORS+=("$label: brak '$needle'")
  fi
}

check_header() {
  local label="$1" url="$2" header_name="$3"
  local headers
  headers=$(curl -skI --max-time 12 "$url" 2>/dev/null) || headers=""
  if echo "$headers" | grep -qi "$header_name" 2>/dev/null; then
    green "$label"
    ((PASS++)) || true
  else
    yellow "$label — brak nagłówka '$header_name'"
    ((WARN++)) || true
  fi
}

echo ""
echo "╔══════════════════════════════════════════╗"
printf "║  Smoke Tests — %-27s║\n" "$ENV → $BASE"
echo "╚══════════════════════════════════════════╝"

header "1. Strony główne"
check_status "Strona główna"      "$BASE/"
check_status "Auth"               "$BASE/auth"
check_status "FAQ"                "$BASE/faq"
check_status "Regulamin"          "$BASE/regulamin"
check_status "O nas"              "$BASE/o-nas"

header "2. SEO landing pages"
check_status "fryzjer-krakow"          "$BASE/fryzjer-krakow"
check_status "sprzatanie"             "$BASE/sprzatanie"
check_status "korepetycje-warszawa"   "$BASE/korepetycje-warszawa"
check_status "elektryki"              "$BASE/elektryki"

header "3. Sitemaps & robots"
check_status   "robots.txt"                "$BASE/robots.txt"
check_contains "sitemap.xml — <sitemap>"   "$BASE/sitemap.xml"          "<sitemap>"
check_contains "sitemap-services — <url>"  "$BASE/sitemap-services.xml" "<url>"
check_contains "sitemap-locations — <url>" "$BASE/sitemap-locations.xml" "<url>"

header "4. Security headers"
check_header "Content-Security-Policy" "$BASE/" "content-security-policy"
check_header "X-Frame-Options"         "$BASE/" "x-frame-options"
check_header "X-Content-Type-Options"  "$BASE/" "x-content-type-options"
check_header "Referrer-Policy"         "$BASE/" "referrer-policy"

header "5. 404 handling"
check_status "Nieistniejąca strona → 404" "$BASE/ta-strona-nie-istnieje-xyz123" "404"

header "6. API — podstawowe"
check_status   "GET /services"             "$API_BASE/services?limit=1"
check_contains "GET /services — data"      "$API_BASE/services?limit=1"  '"data"'
check_status   "GET /recommended"          "$API_BASE/services/recommended"

header "7. API — /similar (regresja)"
FIRST_ID=$(curl -sk --max-time 12 "$API_BASE/services?limit=1" 2>/dev/null \
  | grep -o '"publicId":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
if [[ -n "$FIRST_ID" ]]; then
  check_status   "GET /similar ($FIRST_ID)" "$API_BASE/services/$FIRST_ID/similar"
  check_contains "/similar — data"          "$API_BASE/services/$FIRST_ID/similar" '"data"'
else
  yellow "/similar — nie udało się pobrać publicId (pominięto)"
  ((WARN++)) || true
fi

# Test usługi zdalnej (brak city) — kluczowa regresja po naprawie
REMOTE_ID=$(curl -sk --max-time 12 "$API_BASE/services?limit=20&onlineOnly=true" 2>/dev/null \
  | grep -o '"publicId":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
if [[ -n "$REMOTE_ID" ]]; then
  REM_BODY=$(curl -sk --max-time 12 "$API_BASE/services/$REMOTE_ID/similar" 2>/dev/null) || REM_BODY=""
  if echo "$REM_BODY" | grep -q '"data":\[\]' 2>/dev/null; then
    red "/similar remote (no-city) → pusta tablica — REGRESJA!"
    ((FAIL++)) || true
    ERRORS+=("/similar remote: pusta tablica — poprawka nie działa")
  elif echo "$REM_BODY" | grep -q '"data"' 2>/dev/null; then
    green "/similar remote (no-city) → ma wyniki ✓"
    ((PASS++)) || true
  else
    yellow "/similar remote — brak pola data (pominięto)"
    ((WARN++)) || true
  fi
else
  yellow "/similar remote — brak usług online (pominięto)"
  ((WARN++)) || true
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
printf "  \033[32mPASS: %d\033[0m  |  \033[31mFAIL: %d\033[0m  |  \033[33mWARN: %d\033[0m\n" $PASS $FAIL $WARN
echo "══════════════════════════════════════════"

if [[ ${#ERRORS[@]} -gt 0 ]]; then
  echo ""
  echo "Błędy:"
  for e in "${ERRORS[@]}"; do
    echo "  • $e"
  done
fi

echo ""
if [[ $FAIL -gt 0 ]]; then
  echo "❌  Testy nie przeszły ($FAIL błędów)"
  exit 1
else
  echo "✅  Wszystkie testy przeszły"
  exit 0
fi
