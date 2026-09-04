#!/usr/bin/env bash
# ai-refresh.sh — regeneruje sekcję AUTO w .ai/context/current-state.md
# Wywoływany przez Claude Code SessionStart hook (patrz .claude/settings.json)
# lub manualnie: `bash scripts/ai-refresh.sh`
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FILE="$PROJECT_ROOT/.ai/context/current-state.md"
cd "$PROJECT_ROOT"

MARKER_START='<!-- AI_AUTO_START -->'
MARKER_END='<!-- AI_AUTO_END -->'

# Zbierz świeże dane z git
BRANCH=$(git branch --show-current 2>/dev/null || echo "detached")
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')
AHEAD=$(git rev-list --count "@{u}..HEAD" 2>/dev/null || echo "?")
BEHIND=$(git rev-list --count "HEAD..@{u}" 2>/dev/null || echo "?")
LAST_10=$(git log -10 --oneline 2>/dev/null || echo "(no commits)")
NOW_UTC=$(date -u +"%Y-%m-%d %H:%M UTC")

# Zbuduj sekcję auto w tempie
AUTO_FILE=$(mktemp)
cat > "$AUTO_FILE" <<EOF

_Regenerated: **${NOW_UTC}** przez \`scripts/ai-refresh.sh\`_

### Git snapshot

- Branch: \`${BRANCH}\`
- Uncommitted files: **${UNCOMMITTED}**
- Ahead of origin: **${AHEAD}** commits
- Behind origin: **${BEHIND}** commits

### Ostatnie 10 commitów

\`\`\`
${LAST_10}
\`\`\`

EOF

# Jeśli plik nie istnieje lub nie ma markerów → utwórz z template
if [ ! -f "$FILE" ] || ! grep -q "$MARKER_START" "$FILE" 2>/dev/null; then
  mkdir -p "$(dirname "$FILE")"
  cat > "$FILE" <<TEMPLATE
# Current state

Sekcja między \`AI_AUTO_START\` / \`AI_AUTO_END\` jest regenerowana automatycznie
przez \`scripts/ai-refresh.sh\` (Claude Code SessionStart hook). Manualne notatki
edytuj **poza** znacznikami — będą zachowane przy refreshu.

${MARKER_START}
$(cat "$AUTO_FILE")
${MARKER_END}

## Manualne notatki

_Edytuj ręcznie. Zawartość poza markerami AUTO nie jest nadpisywana._

TEMPLATE
  rm "$AUTO_FILE"
  echo "✅ Created new $FILE"
  exit 0
fi

# Plik istnieje i ma markery — zamień tylko sekcję auto
TMP=$(mktemp)
{
  # Wszystko przed AI_AUTO_START (włącznie z markerem)
  awk -v start="$MARKER_START" '{print} $0 ~ start {exit}' "$FILE"
  # Nowy content auto
  cat "$AUTO_FILE"
  # Marker AI_AUTO_END i wszystko po
  awk -v end="$MARKER_END" '$0 ~ end {found=1} found {print}' "$FILE"
} > "$TMP"

mv "$TMP" "$FILE"
rm "$AUTO_FILE"
echo "✅ Refreshed $FILE"
