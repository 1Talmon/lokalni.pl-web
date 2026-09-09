#!/usr/bin/env bash
# API contract tests — weryfikuje że kluczowe endpointy zwracają poprawne dane
# Użycie:
#   bash scripts/api-check.sh         # → testuje https://api.mylokalni.pl/api
#   bash scripts/api-check.sh local   # → testuje http://localhost:8080/api

ENV="${1:-prod}"
case "$ENV" in
  prod)  API="https://api.mylokalni.pl/api" ;;
  local) API="http://localhost:8080/api" ;;
  *)     echo "Nieznane środowisko: $ENV (prod|local)"; exit 1 ;;
esac

PASS=0; FAIL=0; WARN=0
ERRORS=()

green() { printf "\033[32m✓\033[0m %s\n" "$1"; }
red()   { printf "\033[31m✗\033[0m %s\n" "$1"; }
yellow(){ printf "\033[33m⚠\033[0m %s\n" "$1"; }
header(){ printf "\n\033[1m%s\033[0m\n" "$1"; }

# Wykonuje GET, ustawia $BODY i $STATUS
fetch_get() {
  local url="$1"
  BODY=$(curl -sk --max-time 15 -o /tmp/api_resp -w "%{http_code}" "$url" 2>/dev/null) || BODY="0"
  STATUS="$BODY"
  BODY=$(cat /tmp/api_resp 2>/dev/null || echo "")
}

ok_status() {
  local label="$1" expected="${2:-200}"
  if [[ "$STATUS" == "$expected" ]]; then
    green "$label → HTTP $STATUS"
    ((PASS++)) || true
    return 0
  else
    red "$label → HTTP $STATUS (oczekiwano $expected)"
    ((FAIL++)) || true
    ERRORS+=("$label: HTTP $STATUS")
    return 1
  fi
}

has_field() {
  local label="$1" field="$2"
  if echo "$BODY" | grep -q "\"$field\"" 2>/dev/null; then
    green "  pole '$field' obecne"
    ((PASS++)) || true
  else
    red "  brak pola '$field'"
    ((FAIL++)) || true
    ERRORS+=("$label: brak '$field'")
  fi
}

not_empty_array() {
  local label="$1"
  if echo "$BODY" | grep -q '"data":\[\]' 2>/dev/null; then
    yellow "  data[] jest pusta (może być OK)"
    ((WARN++)) || true
  else
    green "  data[] nie jest pusta"
    ((PASS++)) || true
  fi
}

echo ""
echo "╔════════════════════════════════════════════╗"
printf "║  API Contract Tests — %-21s║\n" "$ENV"
echo "╚════════════════════════════════════════════╝"

# ── 1. GET /services ───────────────────────────────────────────────────────────
header "1. GET /services"
fetch_get "$API/services?limit=5"
if ok_status "GET /services"; then
  has_field "services" "data"
  has_field "services" "meta"
  if echo "$BODY" | grep -q '"publicId"' 2>/dev/null; then
    green "  lista zawiera usługi"
    ((PASS++)) || true
  else
    yellow "  brak usług (baza pusta?)"
    ((WARN++)) || true
  fi
fi

# Zapamiętaj pierwszy publicId do kolejnych testów
FIRST_ID=$(echo "$BODY" | grep -o '"publicId":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

# ── 2. GET /services/:id ───────────────────────────────────────────────────────
header "2. GET /services/:id"
if [[ -n "$FIRST_ID" ]]; then
  fetch_get "$API/services/$FIRST_ID"
  if ok_status "GET /services/$FIRST_ID"; then
    has_field "service" "publicId"
    has_field "service" "title"
    has_field "service" "price"
    has_field "service" "category"
    has_field "service" "provider"
  fi
else
  yellow "Pominięto — brak publicId z /services"
  ((WARN++)) || true
fi

# ── 3. GET /services/:id/similar ──────────────────────────────────────────────
header "3. GET /services/:id/similar (z miastem)"
if [[ -n "$FIRST_ID" ]]; then
  fetch_get "$API/services/$FIRST_ID/similar?limit=8&offset=0"
  if ok_status "GET /similar ($FIRST_ID)"; then
    has_field "similar" "data"
    not_empty_array "similar"
  fi
else
  yellow "Pominięto — brak publicId"
  ((WARN++)) || true
fi

# ── 4. GET /services/:id/similar — remote (no-city) — REGRESJA TEST ───────────
header "4. GET /services/:id/similar — usługa zdalna (brak city)"
fetch_get "$API/services?limit=20&onlineOnly=true"
REMOTE_ID=$(echo "$BODY" | grep -o '"publicId":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
if [[ -n "$REMOTE_ID" ]]; then
  fetch_get "$API/services/$REMOTE_ID/similar?limit=8"
  if ok_status "GET /similar remote ($REMOTE_ID)"; then
    has_field "similar-remote" "data"
    if echo "$BODY" | grep -q '"data":\[\]' 2>/dev/null; then
      red "  REGRESJA: /similar (no-city) zwraca pustą tablicę!"
      ((FAIL++)) || true
      ERRORS+=("REGRESJA: /similar no-city = [] — poprawka nie aktywna na prod")
    else
      green "  data[] ma wyniki — poprawka działa ✓"
      ((PASS++)) || true
    fi
  fi
else
  yellow "Brak usług online/remote — test pominięty"
  ((WARN++)) || true
fi

# ── 5. GET /services/recommended ──────────────────────────────────────────────
header "5. GET /services/recommended"
fetch_get "$API/services/recommended"
if ok_status "GET /recommended"; then
  has_field "recommended" "data"
  has_field "recommended" "source"
  if echo "$BODY" | grep -q '"source":"trending"\|"source":"personalized"' 2>/dev/null; then
    green "  source = trending|personalized"
    ((PASS++)) || true
  else
    yellow "  source ma inną wartość"
    ((WARN++)) || true
  fi
fi

# ── 6. Auth — format błędów (bez kredencjałów) ────────────────────────────────
header "6. POST /auth/login — format błędu"
AUTH_STATUS=$(curl -sk -o /tmp/auth_resp -w "%{http_code}" --max-time 10 \
  -X POST "$API/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@nieistnieje.pl","password":"zle_haslo"}' 2>/dev/null) || AUTH_STATUS="0"
AUTH_BODY=$(cat /tmp/auth_resp 2>/dev/null || echo "")

if [[ "$AUTH_STATUS" == "401" || "$AUTH_STATUS" == "400" || "$AUTH_STATUS" == "422" ]]; then
  green "POST /auth/login z błędnymi danymi → $AUTH_STATUS (poprawne)"
  ((PASS++)) || true
  # Sprawdź brak stack trace
  if echo "$AUTH_BODY" | grep -qi "at Object\.\|at Function\.\|at Module\." 2>/dev/null; then
    red "  Wyciek stack trace w odpowiedzi!"
    ((FAIL++)) || true
    ERRORS+=("auth: wyciek stack trace")
  else
    green "  Brak stack trace w odpowiedzi"
    ((PASS++)) || true
  fi
else
  yellow "POST /auth/login → $AUTH_STATUS (nieoczekiwany status)"
  ((WARN++)) || true
fi

# ── 7. Sitemap proxy ───────────────────────────────────────────────────────────
header "7. GET /public/sitemap/services"
fetch_get "$API/public/sitemap/services?limit=1"
if [[ "$STATUS" == "200" ]]; then
  green "GET /public/sitemap/services → 200"
  ((PASS++)) || true
else
  yellow "GET /public/sitemap/services → $STATUS (opcjonalne)"
  ((WARN++)) || true
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════"
printf "  \033[32mPASS: %d\033[0m  |  \033[31mFAIL: %d\033[0m  |  \033[33mWARN: %d\033[0m\n" $PASS $FAIL $WARN
echo "══════════════════════════════════════════════"

if [[ ${#ERRORS[@]} -gt 0 ]]; then
  echo ""
  echo "Błędy:"
  for e in "${ERRORS[@]}"; do
    echo "  • $e"
  done
fi

echo ""
if [[ $FAIL -gt 0 ]]; then
  echo "❌  API testy nie przeszły ($FAIL błędów)"
  exit 1
else
  echo "✅  API testy przeszły"
  exit 0
fi
