'use client';
import { useEffect } from 'react';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

/**
 * Wspólna baza WSZYSTKICH okien (arkusze, panele, podglądy). Rodziny okien różnią się układem,
 * ale uchwyt (BottomSheetHandle), przycisk X, Esc, blokada scrolla i warstwy są tu jedne.
 * Opis: docs/UI-STYLE.md §5.
 */

/** Warstwy okien (rosnąco). Okno otwierane z innego okna ma być wyżej niż ono. */
export const MODAL_Z = {
    panel: 'z-[100001]',  // duże panele: czat, zdjęcia, aktualności
    sheet: 'z-[100002]',  // arkusze: formularze, potwierdzenia – otwierane też nad panelami
    viewer: 'z-[200000]', // podglądy pełnoekranowe: galeria, zdjęcia klientów, podgląd certyfikatu
    viewerTop: 'z-[300000]', // podgląd zdjęcia/filmu otwierany z galerii lub panelu – nad wszystkim
} as const;

/** Przycisk X – ten sam w nagłówku arkusza i panelu. */
export const MODAL_CLOSE_BTN = 'p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400';

/** Przycisk X na ciemnym tle podglądów. */
export const MODAL_CLOSE_BTN_DARK = 'w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90';

/** Klasy ikony w nagłówku okna. */
export const MODAL_ICON_TONE = {
    indigo: 'bg-indigo-50 text-indigo-600',
    rose: 'bg-rose-50 text-rose-500',
} as const;

/** Klasy przycisków w dolnym pasku okna (docs/UI-STYLE.md §3). */
const BTN = 'py-4 px-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
export const MODAL_BTN_SECONDARY = `flex-1 ${BTN} text-gray-500 hover:bg-gray-100 active:scale-100`;
export const MODAL_BTN_PRIMARY = `flex-1 ${BTN} text-white bg-[#6366F1] hover:bg-[#5558e8] shadow-lg shadow-indigo-100`;
export const MODAL_BTN_DANGER = `flex-1 ${BTN} text-white bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-100`;

/**
 * Esc + blokada scrolla dla każdego okna. Okno otwarte nad innym (które już blokuje scroll)
 * nie zdejmuje cudzej blokady – to był powód skoku strony po zamknięciu.
 * `onEscape` wołane tylko gdy okno jest otwarte; Esc nie „przecieka” do okna pod spodem.
 */
export const useModalBehavior = (isOpen: boolean, onEscape?: () => void | false) => {
    useEffect(() => {
        if (!isOpen || !onEscape) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            // `false` = okno nie obsłużyło Esc (np. nad nim jest podgląd) – niech trafi do tego, kto go obsłuży
            if (onEscape() === false) return;
            e.stopPropagation();
        };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [isOpen, onEscape]);

    useEffect(() => {
        if (!isOpen) return;
        const alreadyLocked = document.documentElement.classList.contains('scroll-locked');
        if (!alreadyLocked) lockScroll();
        return () => { if (!alreadyLocked) unlockScroll(); };
    }, [isOpen]);
};
