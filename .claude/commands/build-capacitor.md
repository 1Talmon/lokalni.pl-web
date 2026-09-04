---
description: Sync z siostrzanym Vite+Capacitor projektem — sync widoków + bun build + cap sync ios/android
---

Wykonaj synchronizację z mobile Capacitor projektem zgodnie ze skillem `build-capacitor`.

**Wczytaj pełną procedurę:** przeczytaj `.ai/skills/build-capacitor/SKILL.md` i wykonaj kroki 1-6.

**Kluczowe punkty:**

1. **Osobne repo** — commity w `/Users/cypriantalmon/Desktop/lokalni projekt/`, nie w `lokalni-web`
2. **Package manager: `bun`** (nie npm ani pnpm)
3. Jeśli edytowałeś shared widok w lokalni-web:
   - `diff` między projektami (SKILL.md sekcja 1)
   - Ręcznie zaaplikuj z transform: `next/navigation` → `react-router-dom`, `next/image` → `<img>`, `next/link` → `react-router-dom Link`
4. `bun run lint && bun run build` w lokalni projekt
5. `npx cap sync ios` / `npx cap sync android`
6. `npx cap open ios` / `android` — otwiera Xcode / Android Studio

**Deploy do stores** (Xcode Archive → App Store / Android Studio AAB → Play Store) — **robi user w GUI**, nie Claude.

**Pitfalls udokumentowane w SKILL.md** — nie zmieniaj:
- `CapacitorHttp.enabled: false` w `capacitor.config.ts` (intencjonalnie)
- iOS keyboard workaround w `App.css`
- iOS swipe-back JS override dla chat/support
- Android splash delay 160ms
