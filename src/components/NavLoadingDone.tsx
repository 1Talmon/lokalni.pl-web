'use client';

import { useEffect } from 'react';
import { useApp } from '@/providers/AppProvider';

/**
 * Zdejmuje nakładkę ładowania powłoki aplikacji na stronach „nie istnieje”.
 *
 * Wejście na /service/… i /profile/… włącza nakładkę (`isNavLoading`), a zdejmuje ją dopiero komponent
 * oferty/profilu po wczytaniu danych. Gdy strona zwraca 404 już na serwerze (oferta usunięta, stary link),
 * ten komponent w ogóle się nie renderuje i nakładka „Ładowanie…” wisiała do końca watchdoga
 * (10 s + przeładowanie + 10 s). 404 renderuje to zamiast niego.
 */
export function NavLoadingDone() {
    const { actions } = useApp();
    useEffect(() => {
        actions.setNavLoading(false);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    return null;
}
