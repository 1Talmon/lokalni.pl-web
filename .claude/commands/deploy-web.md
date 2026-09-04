---
description: Deploy lokalni-web — push dev → dev.lokalni-pl-web.pages.dev preview verify → merge do main → produkcja
---

Wykonaj procedurę deploy lokalni-web zgodnie ze skillem `deploy-web`.

**Wczytaj pełną procedurę:** przeczytaj `.ai/skills/deploy-web/SKILL.md` i wykonaj wszystkie 6 kroków w kolejności.

**Kluczowy workflow (dev-first):**

```
push dev → dev.lokalni-pl-web.pages.dev (preview) → verify → merge dev→main → mylokalni.pl (prod) → verify
```

**Zasady bezpieczeństwa** (obowiązkowe — SKILL.md sekcja "Zasady bezpieczeństwa"):
- **Domyślnie push na `dev`**, nigdy bezpośrednio na `main` bez zgody usera
- **Zapytaj usera o zgodę** przed każdym `git push` — "push" ≠ "commit"
- **Promocja dev → main tylko fast-forward** (`git merge --ff-only dev` na main)
- Nigdy force-push (ani dev, ani main)
- Zawsze `npm run build:cf` przed pushem

Jeśli którykolwiek pre-flight check faili — **nie pushuj**, napraw najpierw.

Po push na `dev` zaczekaj ~3 min i puść 3 curl checks z sekcji 4 (na **dev.lokalni-pl-web.pages.dev** — nie prod!). Jeśli OK, zapytaj usera o zgodę na promocję do main. Jeśli tak — merge + push main + kolejne 3 curle na produkcji.
