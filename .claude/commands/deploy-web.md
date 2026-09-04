---
description: Deploy lokalni-web — pre-flight (tsc/lint/build:cf) + git push + 3 curl checks (CSP/404/landing)
---

Wykonaj procedurę deploy lokalni-web zgodnie ze skillem `deploy-web`.

**Wczytaj pełną procedurę:** przeczytaj `.ai/skills/deploy-web/SKILL.md` i wykonaj wszystkie 5 kroków w kolejności.

**Zasady bezpieczeństwa** (obowiązkowe — SKILL.md sekcja "Zasady bezpieczeństwa"):
- **Zapytaj usera o zgodę** przed `git push` — "push" ≠ "commit"
- Nigdy force-push do `main`
- Zawsze `npm run build:cf` przed pushem (nie tylko `next build`)

Jeśli którykolwiek pre-flight check faili — **nie pushuj**, napraw najpierw.

Po push zaczekaj ~3 min na CF Pages CI i puść 3 curl checks z sekcji 4 (CSP + X-Robots-Tag na `/dashboard`, 404 na `/service/nonexistent`, 200 na `/hydraulik-warszawa`). Zaraportuj wynik każdego.
