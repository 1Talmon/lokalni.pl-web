#!/usr/bin/env bash
# Lokalne sprawdzenia jakości kodu — odpowiednik pre-commit + build gate
# Użycie:
#   bash scripts/local-check.sh           # tsc + lint + code checks (bez build)
#   bash scripts/local-check.sh --build   # + npm run build:cf (~3 min)

PASS=0; FAIL=0; WARN=0
ERRORS=()
BUILD=false

for arg in "$@"; do
  [[ "$arg" == "--build" ]] && BUILD=true
done

green() { printf "\033[32m✓\033[0m %s\n" "$1"; }
red()   { printf "\033[31m✗\033[0m %s\n" "$1"; }
yellow(){ printf "\033[33m⚠\033[0m %s\n" "$1"; }
header(){ printf "\n\033[1m%s\033[0m\n" "$1"; }

run_cmd() {
  local label="$1"; shift
  if "$@" > /tmp/lc_out 2>&1; then
    green "$label"
    ((PASS++)) || true
  else
    red "$label"
    ((FAIL++)) || true
    ERRORS+=("$label")
    tail -20 /tmp/lc_out
  fi
}

echo ""
echo "╔══════════════════════════════╗"
echo "║  Lokalne sprawdzenia kodu    ║"
echo "╚══════════════════════════════╝"

header "1. TypeScript"
run_cmd "npx tsc --noEmit" npx tsc --noEmit

header "2. ESLint"
run_cmd "npm run lint" npm run lint

header "3. Console.log / console.debug w src/"
CL_COUNT=$(grep -rn "console\.log\|console\.info\|console\.debug" src/ \
  --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "// eslint-disable" \
  | grep -v "logger\." \
  | wc -l | tr -d ' ')
if [[ "$CL_COUNT" -gt 0 ]]; then
  yellow "Znaleziono $CL_COUNT console.log/debug (użyj logger.*):"
  grep -rn "console\.log\|console\.info\|console\.debug" src/ \
    --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "// eslint-disable" | grep -v "logger\." | head -10
  ((WARN++)) || true
else
  green "Brak console.log (tylko logger.*)"
  ((PASS++)) || true
fi

header "4. Importy @capacitor/* poza cap-stubs"
CAP_LEAKS=$(grep -rn "from '@capacitor/" src/ --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "cap-stubs" | wc -l | tr -d ' ')
if [[ "$CAP_LEAKS" -gt 0 ]]; then
  red "Bezpośrednie importy @capacitor/* poza cap-stubs ($CAP_LEAKS):"
  grep -rn "from '@capacitor/" src/ --include="*.ts" --include="*.tsx" | grep -v "cap-stubs"
  ((FAIL++)) || true
  ERRORS+=("leak importów @capacitor/*")
else
  green "Brak bezpośrednich importów @capacitor/*"
  ((PASS++)) || true
fi

header "5. 'any' w kodzie (strict mode)"
ANY_COUNT=$(grep -rn ": any\b\|as any\b" src/ --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v "eslint-disable" | grep -v "Record<string, any>" | wc -l | tr -d ' ')
if [[ "$ANY_COUNT" -gt 0 ]]; then
  yellow "Znaleziono $ANY_COUNT użyć 'any' (informacyjnie):"
  grep -rn ": any\b\|as any\b" src/ --include="*.ts" --include="*.tsx" 2>/dev/null \
    | grep -v "eslint-disable" | grep -v "Record<string, any>" | head -8
  ((WARN++)) || true
else
  green "Brak użyć 'any'"
  ((PASS++)) || true
fi

header "6. TODO / FIXME"
TODO_COUNT=$(grep -rn "TODO\|FIXME\|HACK\b" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [[ "$TODO_COUNT" -gt 0 ]]; then
  yellow "Znaleziono $TODO_COUNT TODO/FIXME (informacyjnie):"
  grep -rn "TODO\|FIXME\|HACK\b" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -6
  ((WARN++)) || true
else
  green "Brak TODO/FIXME"
  ((PASS++)) || true
fi

if [[ "$BUILD" == "true" ]]; then
  header "7. Build CF Pages"
  echo "  ⏳ Kompilacja... (~2-3 min)"
  run_cmd "npm run build:cf" npm run build:cf
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════"
printf "  \033[32mPASS: %d\033[0m  |  \033[31mFAIL: %d\033[0m  |  \033[33mWARN: %d\033[0m\n" $PASS $FAIL $WARN
echo "══════════════════════════════"

if [[ ${#ERRORS[@]} -gt 0 ]]; then
  echo ""
  echo "Błędy:"
  for e in "${ERRORS[@]}"; do
    echo "  • $e"
  done
fi

echo ""
if [[ $FAIL -gt 0 ]]; then
  echo "❌  Sprawdzenia nie przeszły ($FAIL)"
  exit 1
else
  echo "✅  Kod OK"
  exit 0
fi
