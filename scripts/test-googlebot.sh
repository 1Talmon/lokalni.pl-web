#!/bin/bash
# Googlebot simulation test — weryfikuje SSR content i status codes
# Użycie: bash scripts/test-googlebot.sh [https://custom-url.pages.dev]

set -e

BASE="${1:-https://dev.lokalni-pl-web.pages.dev}"
BOT_UA="Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"
FAILED=0

check() {
    local slug="$1"
    local expect_status="${2:-200}"
    local url="$BASE/$slug"

    STATUS=$(curl -o /tmp/gsbot_body.txt -s -w "%{http_code}" -A "$BOT_UA" --max-time 15 "$url")
    H1=$(grep -oP '(?<=<h1[^>]*>)[^<]+' /tmp/gsbot_body.txt 2>/dev/null | head -1 || echo "")
    JSON_LD=$(grep -c 'application/ld+json' /tmp/gsbot_body.txt 2>/dev/null || echo "0")
    TITLE=$(grep -oP '(?<=<title>)[^<]+' /tmp/gsbot_body.txt 2>/dev/null | head -1 || echo "")

    local status_ok="✅"
    if [[ "$STATUS" != "$expect_status" ]]; then
        status_ok="❌"
        FAILED=1
    fi

    local h1_ok="✅"
    if [[ "$expect_status" == "200" && -z "$H1" ]]; then
        h1_ok="⚠️ brak H1"
        FAILED=1
    fi

    printf "%-45s %s %s | H1: '%-30s' | JSON-LD: %s | title: '%s'\n" \
        "/$slug" "$STATUS $status_ok" "$h1_ok" "$H1" "$JSON_LD" "${TITLE:0:50}"
}

echo "=== Googlebot SSR test — $BASE ==="
echo ""
echo "--- Landing pages (oczekiwane 200 + H1 + JSON-LD) ---"
check "hydraulik-warszawa"
check "sprzatanie"
check "sprzatanie-krakow"
check "transport"

echo ""
echo "--- Strony serwisów (oczekiwane 200 + H1) ---"
check "service/$(curl -s "$BASE/sitemap-services.xml" | grep -oP '(?<=<loc>https://[^/]+/service/)[^<]+' | head -1 || echo 'nieistniejacy-abc000')"

echo ""
echo "--- 404 dla nieistniejących (oczekiwane 404) ---"
check "zupelnie-nieistniejacy-slug-xyzabc123" "404"
check "service/nieistniejacy-xyzabc000" "404"

echo ""
echo "--- noindex dla app routes (oczekiwane X-Robots-Tag: noindex) ---"
for route in dashboard chat calendar favorites auth; do
    TAG=$(curl -sI -A "$BOT_UA" "$BASE/$route" | grep -i "x-robots-tag" | tr '[:upper:]' '[:lower:]' || echo "")
    if echo "$TAG" | grep -q "noindex"; then
        printf "%-30s ✅ noindex\n" "/$route"
    else
        printf "%-30s ❌ BRAK noindex: '%s'\n" "/$route" "$TAG"
        FAILED=1
    fi
done

echo ""
if [[ "$FAILED" -eq 0 ]]; then
    echo "=== WSZYSTKIE TESTY PRZESZŁY ✅ ==="
else
    echo "=== BŁĘDY WYKRYTE ❌ — sprawdź logi powyżej ==="
    exit 1
fi
