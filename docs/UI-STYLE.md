# MyLokalni – zasady wyglądu (UI)

Jeden wygląd na stronie (`lokalni-web`) i w apce (`lokalni projekt`). Ten plik jest **identyczny w obu repo** – zmieniasz w jednym, kopiujesz do drugiego.
**Przed każdą zmianą wyglądu:** znajdź podobny istniejący element i skopiuj jego klasy. Nie wymyślaj nowych rozmiarów, kolorów ani zaokrągleń.

---

## 1. Kolory i czcionka

| Rola | Wartość | Uwagi |
|---|---|---|
| Główny (indygo) | `#6366F1` = `bg-[#6366F1]` / `bg-indigo-600`, hover `#5558e8` / `indigo-700` | przyciski główne, zaznaczenia, akcenty |
| Gradient marki | `from-[#6366F1] to-[#8B5CF6]` | hero, wyróżnione przyciski panelu (np. „Relacja na Instagram” na PC), relacje |
| Akcent / sukces | `#10B981` / `emerald-*` | „zakończone”, potwierdzenia |
| Tekst | `text-gray-900` (nagłówki), `text-gray-500`/`text-gray-400` (opisy), `#0F172A` w grafikach | |
| Tło strony | `#F4F4F9` / `bg-gray-50` | karty białe na szarym tle |
| Ostrzeżenie | `amber-*` (oczekuje, kropki „do uzupełnienia”) | |
| Błąd / usuwanie | `rose-500` / `red-500` | tylko akcje nieodwracalne |

Czcionka: **Plus Jakarta Sans** (zmienna `--font-jakarta`). W `<canvas>` bierz `getComputedStyle(document.body).fontFamily` i czekaj na `document.fonts.ready`.

## 2. Zaokrąglenia i karty

- Karty treści: `bg-white rounded-[2rem] border border-gray-100 shadow-sm` (+ `hover:shadow-md`), padding `p-5`/`p-6`.
- Okna (sheety): `rounded-t-[2rem] md:rounded-[2.5rem]`.
- Przycisk główny: `rounded-2xl`. Małe przyciski, pastylki, pola: `rounded-xl`. Ikony okrągłe: `rounded-full`.

## 3. Przyciski

| Rodzaj | Klasy (skopiuj) | Przykład |
|---|---|---|
| **Główny w oknie (CTA)** | `w-full py-4 rounded-2xl font-black text-white bg-[#6366F1] hover:bg-[#5558e8] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs active:scale-95` | SupportModal, ReportModal, StoryGeneratorModal |
| Główny niszczący | to samo z `bg-rose-500 hover:bg-rose-600 shadow-rose-100` | DeleteAccountModal |
| Drugorzędny w oknie | `py-4 rounded-2xl font-black text-gray-500 hover:bg-gray-100 uppercase tracking-widest text-xs` | „Anuluj” w ReportModal |
| Mały w karcie | `py-2 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-sm shadow-indigo-200` | BookingCard (czat) |
| Pastylka akcji w panelu | `text-xs font-bold px-4 py-2.5 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 shadow-sm` (na telefonie `text-[11px] px-3 py-1.5`) | „Podgląd publiczny”, „Relacja na Instagram” |
| Ikona okrągła (panel) | `p-2.5 bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100 active:scale-95 shadow-sm border border-gray-100` | ustawienia, podgląd |

**Kolumna ikon w karcie profilu (telefon) mieści 2 ikony** (ustawienia, podgląd). Trzecia wystaje poza kartę – nowe akcje dawaj jako pastylkę pod e-mailem.

## 4. Pastylki wyboru, etykiety, przełączniki

- **Pastylka wyboru** (jedna z kilku opcji):
  `px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95` +
  zaznaczona `bg-indigo-600 text-white border-indigo-600 shadow-sm`,
  niezaznaczona `bg-gray-50 border-gray-100 text-gray-700 hover:border-indigo-200`.
  Wzór: `CreateBookingForClientModal`, `StoryGeneratorModal`.
- **Zakładki segmentowe** (Przychodzące / Wychodzące / Historia): wzór w `ReservationsSection` – nie twórz nowych.
- **Etykieta sekcji:** `text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5`.
- **Przełącznik:** zawsze `SettingsToggle` (`views/Dashboard/components/Settings/SettingsRow.tsx`), wiersz `flex items-center justify-between px-4 py-3`, grupa w `rounded-xl border border-gray-100 bg-gray-50 divide-y divide-gray-100`.
- **Wybór zdjęć:** kafelki `aspect-square rounded-xl border-2` (zaznaczone `border-indigo-600` + znaczek ✓ w kółku indygo).
- **Status rezerwacji:** `STATUS_STYLES` / `STATUS_CONFIG` – nie wymyślaj nowych kolorów statusów.

## 5. Okna (bottom sheet na telefonie, karta na PC) – jeden wzorzec

Wzór do skopiowania: `components/modals/CreateBookingForClientModal.tsx` (też `StoryGeneratorModal`, `RescheduleSheet`).

```tsx
const { sheetDragProps, startDrag, backdropOpacity, triggerClose, handleClose } = useBottomSheet(onClose, isOpen);
// Esc → triggerClose; lockScroll()/unlockScroll() (nie zdejmuj cudzej blokady – sprawdź 'scroll-locked')
return createPortal(
  <div className="fixed inset-0 z-[100002]">
    <motion.div style={{ opacity: backdropOpacity }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
    <div className="absolute inset-0 flex items-end md:items-center justify-center md:p-4 pointer-events-none">
      <motion.div {...sheetDragProps} onClick={e => e.stopPropagation()}
        className="pointer-events-auto w-full sm:max-w-md bg-white rounded-t-[2rem] md:rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
        <div className="md:hidden"><BottomSheetHandle onPointerDown={startDrag} /></div>
        {/* nagłówek = uchwyt do przeciągania */}
        <div className="px-6 md:px-8 py-4 md:py-5 border-b border-gray-50 bg-gray-50/50 shrink-0 cursor-grab md:cursor-default"
             style={{ touchAction: 'none' }} onPointerDown={startDrag}>
          <h3 className="font-bold text-lg text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Icon size={18} /></div> Tytuł
          </h3>  {/* + przycisk X: p-2 hover:bg-gray-200 rounded-full text-gray-400, X size 20 */}
        </div>
        <div className="flex-1 overflow-y-scroll overscroll-contain px-5 py-5 max-h-[55dvh] md:max-h-[70vh]">…</div>
        {/* dolny pasek nad nawigacją */}
        <div className="flex gap-2 px-5 pt-4 pb-5 shrink-0 border-t border-gray-100"
             style={{ paddingBottom: 'calc(var(--native-cta-h, var(--bottom-nav-total-h, env(safe-area-inset-bottom, 0px))) + 1.25rem)' }}>
          {/* przycisk główny z §3 */}
        </div>
      </motion.div>
    </div>
  </div>, document.body);
```

Szerokość: `sm:max-w-md` (formularze), `md:max-w-3xl` (podgląd + opcje obok siebie).

## 6. Powiadomienia (toast)

- `addToast(tekst, 'success' | 'error' | 'info' | 'warning')`.
- **Krótko – jedna linia na telefonie (≈ 40 znaków).** Dłuższy tekst przewija się i ucina. Szczegóły dawaj w oknie/podpowiedzi, nie w toaście.
  ✅ „Gotowe – link do profilu skopiowany” ❌ „Gotowe! Link do profilu skopiowany – wklej go na Instagramie jako naklejkę…”

## 7. Ikony

`lucide-react`. Rozmiary: 14 w małych przyciskach/pastylkach, 18 w nagłówkach okien, 20 w ikonach okrągłych i przycisku X.

## 8. Teksty (zasady marki – obowiązkowe)

- Po polsku, krótko, bez żargonu. Przyciski czasownikiem („Wyślij link”, „Pobierz obraz”).
- **Nigdzie „zweryfikowany profil” / „E-mail potwierdzony”.** Plus = płatne wyróżnienie, zawsze z oznaczeniem „Plus”.
- Ceny „ok./od”, bez obietnic; nie wymyślamy opinii ani statystyk.
- Miejsce usługi: „Stacjonarnie · miasto” / adres / „Dojazd do klienta” / „Zdalnie / Online” (`utils/bookingPlace.ts`).
- Teksty pasujące do osoby i firmy – bezosobowo („Zeskanuj i zarezerwuj”, „Rezerwuj przez MyLokalni.pl”), bez „mnie/moją”.

## 9. Strona a apka

- Ten sam wygląd. Różnice tylko techniczne: strona = Next.js (`useRouter`), apka = React Router + Capacitor (`useNavigate`, `NativeNav`, `Haptics`, `Share`/`Filesystem` zamiast `navigator.share`/pobierania).
- Plik z widokiem zmieniasz w obu repo; przed edycją `diff -q` żeby zobaczyć istniejące różnice.

## 10. Sprawdzenie przed oddaniem

1. Zrzut na telefonie (390–402 px szer.) i na PC (≥1280 px) – Playwright na `next dev`.
2. Nic nie wystaje poza kartę/okno, toast mieści się w jednej linii, dolny przycisk nie chowa się pod nawigacją.
3. Porównaj z oknem-wzorcem obok (te same klasy przycisków, pastylek, etykiet).
4. Apka: symulator iPhone (opis w `CLAUDE.md` apki).
