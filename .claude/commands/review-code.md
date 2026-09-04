---
description: Code review — git diff + MCP graph impact + CF Pages specifics + tsc/lint/build:cf
---

Wykonaj code review zgodnie ze skillem `review-code`.

**Wczytaj pełną procedurę:** przeczytaj `.ai/skills/review-code/SKILL.md` i wykonaj kroki 1-5.

**Kluczowe punkty (nie pomijaj):**
1. Zbierz kontekst przez `git diff main..HEAD --stat` + `git log main..HEAD --oneline` (lub `gh pr diff` dla PR)
2. **Użyj MCP code-review-graph tools PRZED** Grep/Read (patrz sekcja 2 SKILL.md — `detect_changes_tool`, `get_impact_radius_tool`, `get_affected_flows_tool`, `query_graph_tool`)
3. Sprawdź CF Pages specifics (sekcja 3): `next.config.ts::headers()` nie działa, `[slug]` musi używać `LANDING_SLUGS`, `service/[slug]`/`profile/[uid]` musi wołać `notFound()`, grupa route (`(app)/` vs `(public)/` vs top-level), `public/_headers` dla nowych private routes
4. Local quality gates: `tsc --noEmit`, `lint`, `build:cf` (nie tylko `build`)

**Output** (sekcja 5 SKILL.md): co zmienia, impact wg grafu, ryzyko 1-5 z uzasadnieniem, findings (bulletpoints), verdict LGTM / needs changes.

**Anti-patterns do wychwycenia** (sekcja "Anti-patterns" w SKILL.md): `console.log`, `<Navigate>` w tab strip, `@capacitor/*` w deps, bezpośrednie `service.city`, headers w `next.config.ts`.
