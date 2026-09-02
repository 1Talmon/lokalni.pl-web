import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../plugins/NativeNav';

// Aktywuje natywny swipe-back gesture od lewej krawędzi.
// doNav = czyste navigate(-1) BEZ NativeNav.pop() — animacja już się odbyła w Swift.
// Przy anulowaniu gestu JS nic nie nawigował (navigate(-1) jest na complete, nie na start),
// więc cancel nie wymaga odwrócenia.
export function useNativeSwipeBack(doNav: () => void, options?: { interactive?: boolean }) {
    const doNavRef = useRef(doNav);
    useEffect(() => { doNavRef.current = doNav; }, [doNav]);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        NativeNav.enableSwipeBack({ interactive: options?.interactive ?? true }).catch(() => {});

        // cancelled może być true jeśli komponent unmountuje zanim addListener promise się rozwiąże —
        // w tej sytuacji completeHandle jest null w cleanup, listener wisiałby w nieskończoność
        // i przy kolejnej wizycie na ekranie nakładały się dwa listenery (double navigate)
        let cancelled = false;
        let completeHandle: { remove(): Promise<void> } | null = null;

        NativeNav.addListener('swipeBackComplete', () => {
            doNavRef.current();
        }).then(h => {
            if (cancelled) { h.remove().catch(() => {}); }
            else { completeHandle = h; }
        }).catch(() => {});

        return () => {
            cancelled = true;
            NativeNav.disableSwipeBack().catch(() => {});
            completeHandle?.remove().catch(() => {});
        };
    }, [options?.interactive]);
}
