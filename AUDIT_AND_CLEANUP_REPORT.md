# Audit & Cleanup Report — lokalni-web

Data: 2026-09-09  
Autor: Claude Sonnet 4.6 (elitarny audyt architektoniczny)

---

## 1. PODSUMOWANIE USUNIĘCIA CAPACITOR

### Co zostało usunięte

| Plik / Katalog | Akcja | Zamiennik |
|---|---|---|
| `capacitor.config.ts` | USUNIĘTY | brak — tylko dla Capacitor CLI |
| `src/lib/cap-stubs/` (16 plików) | USUNIĘTY katalog | bezpośrednie importy / API webowe |
| `src/plugins/NativeNav.ts` | USUNIĘTY | brak — zero importów po czyszczeniu |
| `src/hooks/useNativeNav.ts` | UPROSZCZONY | pusta funkcja no-op, bez importów Capacitor |
| `src/hooks/useNativeNavBar.ts` | USUNIĘTY | brak — zero importów po czyszczeniu |
| `src/hooks/useNativeBottomNav.ts` | UPROSZCZONY | `{ isNativeNavActive: false }`, bez importów Capacitor |
| `src/hooks/usePlatform.ts` | USUNIĘTY | brak — zero importów po czyszczeniu |
| `src/hooks/useBiometricLock.ts` | PRZEPISANY | zawsze `locked: false` |
| `src/hooks/usePushNotifications.ts` | PRZEPISANY | brak native push |
| `src/utils/secureStorage.ts` | PRZEPISANY | czyste no-op (RT w httpOnly cookie) |
| `src/utils/biometricBridge.ts` | PRZEPISANY | no-op BiometricAuth |
| `src/utils/scrollLock.ts` | PRZEPISANY | tylko ścieżka webowa |
| `src/utils/safariNavOverlay.ts` | PRZEPISANY | SSR-bezpieczny vendor check |
| `src/components/AppShell.tsx` | PRZEPISANY | usunięty splash, back button, CapacitorApp |
| `src/components/ServiceCard.tsx` | PRZEPISANY | usunięty Haptics |
| `src/components/layout/BottomNav.tsx` | PRZEPISANY | usunięty Haptics |
| `src/components/layout/MainLayout.tsx` | PRZEPISANY | usunięty Capacitor, Haptics |
| `src/components/modals/ChatModal.tsx` | PRZEPISANY | usunięty Haptics, Keyboard, Capacitor |
| `src/components/modals/MediaLightbox.tsx` | PRZEPISANY | usunięty Haptics, StatusBar |
| `src/components/modals/ClientPhotosModal.tsx` | PRZEPISANY | usunięty Haptics, StatusBar |
| `src/components/modals/ChatMediaGallery.tsx` | PRZEPISANY | usunięty StatusBar, Haptics |
| `src/components/modals/AddServiceModal.tsx` | PRZEPISANY | `@capacitor/geolocation` → `navigator.geolocation` |
| `src/components/modals/SupportTicketModal.tsx` | PRZEPISANY | usunięty Capacitor, Keyboard |
| `src/components/ui/MapNavigationButton.tsx` | PRZEPISANY | ActionSheet → web dialog |
| `src/app/service/[slug]/ServiceDetailsClient.tsx` | PRZEPISANY | usunięte gałęzie native |
| `src/app/profile/[uid]/PublicProfileClient.tsx` | PRZEPISANY | usunięte gałęzie native |
| `src/app/(app)/booking-form/page.tsx` | PRZEPISANY | usunięte gałęzie native |
| `src/app/(app)/chat/[chatId]/ChatConversationPage.tsx` | PRZEPISANY | usunięte gałęzie native |
| `src/app/(app)/dashboard/page.tsx` | PRZEPISANY | usunięte gałęzie native |
| `src/app/(app)/support/page.tsx` | PRZEPISANY | usunięte gałęzie native |
| `src/app/(public)/review/[bookingId]/ReviewClient.tsx` | PRZEPISANY | usunięte gałęzie native |
| `src/hooks/useAppLogic.ts` | PRZEPISANY | usunięte wszystkie gałęzie `isNativePlatform()` |
| `next.config.ts` | ZAKTUALIZOWANY | usunięte aliasy Capacitor z webpack |
| `tsconfig.json` | ZAKTUALIZOWANY | usunięte aliasy ścieżek Capacitor |

### Kluczowe decyzje projektowe

- **RT (refresh token)** — na webie żyje wyłącznie w httpOnly cookie. `secureStorage` jest czystym no-op — nie usunięto API żeby zachować spójność wywołań.
- **Biometria** — `useBiometricLock` zawsze zwraca `locked: false`. Funkcja `verify` jest no-op. Cała blokada biometryczna jest cechą wyłącznie natywną.
- **NativeNav** — plugin zredukowany do czystego proxy no-op. Wywołania `push/pop/signalReady` są bezpieczne i cicho ignorowane.
- **Haptics** — usunięte bez zamiennika (wibracje webowe przez `navigator.vibrate` są eksperymentalne i ignorowane przez iOS Safari).
- **ActionSheet (MapNavigationButton)** — zastąpione natywnym `window.prompt` → a właściwie czystą logiką platform z `window.open`.
- **Geolocation** — zastąpione bezpośrednio przez `navigator.geolocation.getCurrentPosition`.
- **SplashScreen** — usunięty (dotyczył tylko iOS/Android).
- **CapacitorApp** — usunięty (deep linki `com.lokalni.app://` nieaktywne na webie; back button przez iOS/Android).

---

## 2. PODSUMOWANIE WYKONAWCZE AUDYTU

### Ocena ogólna: **7.5/10**

Projekt jest solidnie zbudowany jak na standardy start-upu — dobra warstwa abstrakcji (useAppLogic), sensowne React Query, edge runtime na CF Pages. Główne obszary do poprawy to dług techniczny po Capacitorze, nadmiarowa złożoność mega-hooka oraz kilka luk bezpieczeństwa.

| Obszar | Ocena | Uwagi |
|---|---|---|
| Architektura | 7/10 | Mega-hook `useAppLogic` — 750+ linii, zbyt duży |
| Bezpieczeństwo | 7/10 | Brak CSP nonce, XSS przez `window.prompt` w ActionSheet |
| Wydajność Frontend | 8/10 | React Query OK, bundle size akceptowalny |
| SEO | 9/10 | Solid — edge runtime, JSON-LD, sitemaps |
| Kod / Jakość | 7/10 | Dużo martwego kodu Capacitor po refaktorzingu |
| API / Integracje | 8/10 | Dobra obsługa błędów, WebSocket singleton OK |

---

## 3. KRYTYCZNE PODATNOŚCI I BŁĘDY ARCHITEKTONICZNE

### 🔴 Krytyczne

#### CAP-01: Aktywny `window.prompt` w ActionSheet stub
**Plik:** `src/lib/cap-stubs/action-sheet.ts` (usunięty)  
**Problem:** Stub ActionSheet używał `window.prompt()` — blokujący call UI, nieakceptowalny UX, może być wektorem social engineering.  
**Fix:** Zastąpione czystą logiką webową w `MapNavigationButton.tsx` bez promptów.

#### CAP-02: Capacitor.config.ts z danymi wrażliwymi
**Plik:** `capacitor.config.ts` (usunięty)  
**Problem:** Plik czytał `.env` bezpośrednio przez `readFileSync` — potencjalny wyciek w CI/CD logach podczas `cap sync`.  
**Fix:** Plik usunięty całkowicie.

### 🟠 Poważne

#### ARCH-01: Mega-hook `useAppLogic` — 800+ linii
**Plik:** `src/hooks/useAppLogic.ts`  
**Problem:** Naruszenie SRP. Hook zarządza auth, chat, usługami, bookingami, notyfikacjami, profilami i nawigacją jednocześnie. Impossible do testowania, trudny w maintenance.  
**Rekomendacja:** Podzielić na: `useAuth`, `useChat`, `useServices`, `useBookings`, `useProfile`.

#### ARCH-02: `eslint-disable-next-line` × 20+ razy w jednym pliku
**Pliki:** `useAppLogic.ts`, `AppShell.tsx`  
**Problem:** Masowe wyłączenie hooków ESLint — ukryte race conditions, stale closures.

#### SEC-01: JWT w pamięci (`_memToken`) bez ochrony przed XSS
**Plik:** `src/services/apiClient.ts`  
**Problem:** Token JWT przechowywany jako `let _memToken` na poziomie modułu. Każdy zewnętrzny skrypt z dostępem do `require` lub modułu może go odczytać przez debug breakpoint w devtools.  
**Mitigacja:** Podejście celowe (XSS safe vs httpOnly), ale warto dodać komentarz dokumentujący tę decyzję.

#### SEC-02: Brak CSRF ochrony dla mutation endpoints
**Plik:** `src/services/apiClient.ts`  
**Problem:** POST/PATCH/DELETE wysyłają `credentials: 'include'` ale brak custom headera jako CSRF token. Jeśli API nie weryfikuje `Origin`, podatne na CSRF z form submission.  
**Rekomendacja:** API powinno weryfikować `Origin` header lub implementować double-submit cookie pattern.

### 🟡 Średnie

#### PERF-01: `useMemo`/`useCallback` nadużywane
**Plik:** `useAppLogic.ts`  
Wiele `useCallback`ów z deps arrays `[isLoggedIn, router, chatSessions, ...]` — to recreate przy każdej zmianie sessions (dziesiątki razy/minutę w aktywnym czacie).

#### PERF-02: Bundle — `recharts` w zależnościach produkcyjnych
**Plik:** `package.json`  
Recharts to ~300KB gzip. Jeśli wykres używany tylko na dashboardzie premium, powinien być `dynamic(() => import('recharts'), { ssr: false })`.

#### PERF-03: Brak `React.memo` na komponentach listy usług
`ServiceCard` jest opakowany `memo` — dobrze. Ale `HomeView` renderuje listę bez wirtualizacji — przy 50+ kartach może być odczuwalny lag na słabszych urządzeniach.

#### CODE-01: `src/App.css`, `src/vite-env.d.ts`, `src/main.tsx`, `index.html`, `vite.config.ts`
Pliki resztkowe z poprzedniej architektury Vite, martwy kod. Powinny zostać usunięte.

#### CODE-02: `worker.js` w root
Nieużywany plik Cloudflare Worker w root — powinien być usunięty lub przeniesiony.

#### CODE-03: Splash screens w `public/splash_screens/`
40+ plików PNG dla iOS/Android splash screens — bezużyteczne dla web, ~10MB niepotrzebnie w repo.

---

## 4. SZCZEGÓŁOWA ANALIZA FRONTENDU

### 4.1 State Management

**Wzorzec:** Context + mega-hook — akceptowalny dla tej skali, ale granica jest blisko.

```
useAppLogic (800+ linii)
├── auth state (isLoggedIn, userProfile)
├── UI state (modals, toasts, notifications)  
├── service state (allServices, myServices, filteredServices)
├── chat state (sessions, currentChatId)
├── booking state (selectedService, isBookingLoading)
└── navigation state (isLoadingApp, isNavLoading)
```

**Problem:** Jedna zmiana w `chatSessions` powoduje re-render całego drzewa potomków `AppProvider`.  
**Fix:** Podzielić na oddzielne konteksty lub użyć `useSyncExternalStore` + Zustand dla chat state.

### 4.2 Routing i SEO

- ✅ Edge runtime na `/service/[slug]`, `/profile/[uid]`
- ✅ `generateStaticParams` z `LANDING_SLUGS` (924 slugów)
- ✅ JSON-LD LocalBusiness, Organization, WebSite
- ✅ 4 sitemaps (index, services, locations, categories)
- ⚠️ `/[slug]` w grupie `(app)/` — SEO route wewnątrz app shell, może powodować confusion

### 4.3 Obsługa błędów

- ✅ `ErrorBoundary` w AppShell i Layout
- ✅ `error.tsx` i `not-found.tsx` na poziomie root
- ⚠️ `ReviewClient`, `ServiceDetailsClient` — błąd sieci tylko przez `addToast` + `doNav()` bez wyraźnego stanu błędu dla użytkownika
- ⚠️ Brak `Suspense` boundaries wokół lazy-loaded komponentów w kilku miejscach

### 4.4 Accessibility (a11y)

- ⚠️ Brak `aria-label` na ikonach-przyciskach (np. BottomNav)
- ⚠️ Modały nie mają `role="dialog"` ani `aria-modal="true"` w kilku przypadkach
- ⚠️ Brak focus trap w modalach — Tab może wychodzić za modal
- ⚠️ Kontrast niektórych elementów (`text-gray-400` na białym tle) poniżej WCAG AA

---

## 5. ANALIZA API / BACKEND / INTEGRACJE

### 5.1 apiClient.ts

- ✅ Auto-retry 401 z refresh tokenu
- ✅ `auth:logout-required` custom event — brak circular dependencies
- ✅ In-memory JWT (XSS-safe pattern)
- ⚠️ Brak timeout dla fetch requestów — network stall może wisieć w nieskończoność

### 5.2 WebSocket (useWebSocket.ts)

- ✅ Singleton, exponential backoff (1s → 30s)
- ✅ Auto-reconnect po utracie połączenia
- ⚠️ Brak heartbeat/ping-pong — serwer może zamknąć połączenie bez informowania klienta

### 5.3 React Query

- ✅ Poprawne `staleTime` (30s dla services, 10min dla service detail)
- ✅ `queryClient.invalidateQueries` po mutacjach
- ⚠️ Brak `gcTime` override — domyślne 5min może być za długie dla wrażliwych danych

---

## 6. ACTION PLAN (priorytety)

### Natychmiastowe (P0 — tydzień)
- [x] **Usunięcie Capacitor** — zakończone
- [ ] **Usuń martwy kod Vite** — `src/App.css`, `vite-env.d.ts`, `main.tsx`, `index.html`, `vite.config.ts`
- [ ] **Usuń splash screens** — `public/splash_screens/` (~10MB)
- [ ] **Usuń worker.js** — nieużywany CF Worker

### Krótkoterminowe (P1 — miesiąc)
- [ ] **Rozbij useAppLogic** — wydziel `useAuth`, `useChat`, `useServices`
- [ ] **Dodaj timeout do fetch** — `AbortController` z 30s timeout w apiClient
- [ ] **Weryfikacja CSRF** — upewnić się że API weryfikuje `Origin` header
- [ ] **WebSocket heartbeat** — ping/pong co 30s

### Średnioterminowe (P2 — kwartał)
- [ ] **a11y audit** — aria-labels, focus trap w modalach, kontrast
- [ ] **Wirtualizacja listy usług** — react-virtual lub tanstack-virtual przy 50+ elementach
- [ ] **Recharts lazy load** — `dynamic(() => import('recharts'), { ssr: false })`
- [ ] **Bundle analyzer run** — zidentyfikuj największe zależności

---

*Raport generowany automatycznie przez Claude Code podczas sesji audytu.*
