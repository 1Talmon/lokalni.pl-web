---
name: build-capacitor
description: Build mobile app (iOS/Android) z siostrzanego projektu lokalni projekt — bun build → cap sync → Xcode/Android Studio. Uruchamiany z lokalni-web hub gdy zmiana dotyka shared widoków i trzeba zsynchronizować z mobile.
---

# Skill: build-capacitor

## Kiedy używać

- Zmieniłeś shared widok (`src/views/*.tsx`, `src/components/modals/*.tsx`) w `lokalni-web`
- User pyta o "build mobile" / "sync z appką" / "wdrożenie na iOS/Android"
- Testowanie feature w Capacitor środowisku (native APIs, keyboard behavior, safe area, itd.)

## Ważne

- **Osobne repo** — commity w `lokalni projekt`, nie w `lokalni-web`.
- **Package manager: `bun`** (nie npm, nie pnpm). Fallback `npm` może działać ale pref jest bun.
- **Kod widoków ≈ 1:1** z lokalni-web, ale różnice:
  - `react-router-dom` (Router 6) zamiast `next/navigation` (App Router)
  - Prawdziwy Capacitor (nie stuby) — `@capacitor/core`, `@capacitor/haptics` itp. w node_modules
  - `strict: false` w tsconfig — lenient TypeScript
  - `main.tsx` monkey-patches `window.fetch` z `CapacitorHttp` na native
  - App ID: `com.lokalni.app`

## Kroki

### 1. Synchronizacja kodu (jeśli zmiana w shared widoku)

```bash
# Sprawdź różnice między projektami
diff /Users/cypriantalmon/Desktop/lokalni-web/src/views/ServiceDetailsView.tsx \
     "/Users/cypriantalmon/Desktop/lokalni projekt/src/views/ServiceDetailsView.tsx" | head -50
```

Ręcznie zaaplikuj zmiany do siostrzanego pliku, ostrożnie:
- Zamień `next/navigation` → `react-router-dom`
- Zamień `useRouter` → `useNavigate`, `usePathname` → `useLocation`
- Zamień `Link` z `next/link` → `Link` z `react-router-dom`
- Zamień `Image` z `next/image` → zwykły `<img>` (react-easy-crop dla edit)

### 2. Web build

```bash
cd "/Users/cypriantalmon/Desktop/lokalni projekt"

bun run lint            # ESLint 0 warnings, pre-commit hook lint-staged
bun run build           # → dist/
```

Type-check przez pre-commit hook (`npx tsc --noEmit` z `src/`).

### 3. Cap sync

```bash
npx cap sync ios        # iOS: skopiuje dist/ do ios/App/App/public/
npx cap sync android    # Android: skopiuje dist/ do android/app/src/main/assets/public/
```

Jeśli dodałeś nowy plugin Capacitor (rzadko):
- `npx cap update ios` / `android` — pobiera new pods/gradle deps
- `cd ios/App && pod install` (macOS only)

### 4. Otwarcie w IDE

```bash
npx cap open ios        # otwiera Xcode
npx cap open android    # otwiera Android Studio
```

### 5. Test na urządzeniu/simulatorze

**iOS (Xcode):**
- Wybierz simulator / connected device w toolbar
- ⌘R — Run
- Console pod ⌘⇧C — Web logs (WKWebView) + Native logs (Xcode console)

**Android (Android Studio):**
- Device picker → wybierz AVD lub USB device
- ▶ Run
- Logcat na dole — filter po `Capacitor` / `WebView` / package `com.lokalni.app`

### 6. Deploy do stores

**iOS:** Xcode → Product → Archive → Distribute App → App Store Connect → TestFlight → Review

**Android:** Android Studio → Build → Generate Signed Bundle/APK → AAB dla Play Store

**Nie robi tego Claude** — user manuwolnie w GUI.

## Pitfalls

- **HTTP requests padają na native po zmianie fetch:** `capacitor.config.ts` ma `CapacitorHttp.enabled: false` **intencjonalnie**. Nie enable-ować — monkey-patches `window.fetch` i psuje FormData/upload plików.
- **iOS keyboard zasłania input:** to bug WKWebView, workaround w `src/App.css` przez `env(safe-area-inset-*)` + JS scroll adjustment
- **iOS swipe-back nie działa z chatu:** UIScreenEdgePanGestureRecognizer przegrywa z UIScrollView chatu. Workaround: JS touchstart/touchend override w `ChatConversationWrapper` (`src/routes/AppRoutes.tsx:982-1008`)
- **Android splash flash:** 160ms delay w `App.tsx` przed pierwszym renderem żeby safe-area inset się zaaplikował
- **iOS splash:** `SplashScreen.launchAutoHide: false`, ukryty ręcznie w `ServiceDetailsWrapper` gdy `isLoadingApp=false + data ready`

## Native docs
- Capacitor `capacitor.config.ts` w root
- iOS: `ios/App/` (Swift bridging code, Podfile, Xcode project)
- Android: `android/app/` (Java bridging, Gradle, AndroidManifest)
- Plugins Swift: `src/plugins/` (NativeNav — custom native navigation animations)
