import { useEffect, useRef } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface NativeNavBarPlugin {
    show(opts: { isFavorite: boolean; shareUrl: string; shareTitle?: string; shareImageUrl?: string; topOffset: number; showFavorite?: boolean; showShare?: boolean }): Promise<{ height: number }>;
    hide(): Promise<void>;
    setFavorite(opts: { isFavorite: boolean }): Promise<void>;
    setDimmed(opts: { dimmed: boolean }): Promise<void>;
    setModalMode(opts: { active: boolean; icon?: string; icon2?: string }): Promise<void>;
    share(opts: { url: string; title: string; imageUrl?: string }): Promise<void>;
    addListener(event: 'navBack',          handler: () => void): Promise<{ remove(): Promise<void> }>;
    addListener(event: 'navFavorite',      handler: (data: { isFavorite: boolean }) => void): Promise<{ remove(): Promise<void> }>;
    addListener(event: 'navModalBack',     handler: () => void): Promise<{ remove(): Promise<void> }>;
    addListener(event: 'navModalAction',   handler: () => void): Promise<{ remove(): Promise<void> }>;
    addListener(event: 'navModalAction2',  handler: () => void): Promise<{ remove(): Promise<void> }>;
}

const isIOS = Capacitor.getPlatform() === 'ios';
const NativeNavBar = isIOS ? registerPlugin<NativeNavBarPlugin>('NavBar') : null;

// Moduł-level counter — bar nie znika podczas przejść NavBar→NavBar.
// Jeśli count spada do 0, hide() odpala się po 200ms (bufor dla nowego widoku).
let activeNavBarCount = 0;
let pendingHideTimer: ReturnType<typeof setTimeout> | null = null;

interface Options {
    isFavorite?:       boolean;
    shareUrl:          string;
    shareTitle?:       string;
    shareImageUrl?:    string;
    isLoggedIn?:       boolean;
    showFavorite?:     boolean;
    showShare?:        boolean;
    isMapOpen?:        boolean;
    isGalleryOpen?:    boolean;
    galleryIsGrid?:    boolean;
    hidden?:           boolean;
    onBack:            () => void;
    onFavoriteChange?: (isFavorite: boolean) => void;
    onLoginRequired?:  () => void;
    onGalleryClose?:   () => void;
    onGalleryToggle?:  () => void;
    onModalAction2?:   () => void;
}

export function nativeShare(opts: { url: string; title: string; imageUrl?: string }): Promise<void> {
    if (!NativeNavBar) return Promise.resolve();
    return NativeNavBar.share(opts).catch(() => {});
}

export function useNativeNavBar({
    isFavorite = false, shareUrl, shareTitle = '', shareImageUrl = '',
    isLoggedIn = false, showFavorite = true, showShare = true,
    isMapOpen = false, isGalleryOpen = false, galleryIsGrid = false,
    hidden = false,
    onBack, onFavoriteChange, onLoginRequired, onGalleryClose, onGalleryToggle, onModalAction2,
}: Options) {
    const cbRef = useRef({ onBack, onFavoriteChange, onLoginRequired, isLoggedIn, isFavorite, onGalleryClose, onGalleryToggle, onModalAction2 });
    useEffect(() => { cbRef.current = { onBack, onFavoriteChange, onLoginRequired, isLoggedIn, isFavorite, onGalleryClose, onGalleryToggle, onModalAction2 }; });

    const showParamsRef = useRef({ isFavorite, shareUrl, shareTitle, shareImageUrl, topOffset: 0, showFavorite, showShare });
    useEffect(() => { showParamsRef.current = { ...showParamsRef.current, isFavorite, shareUrl, shareTitle, shareImageUrl, showFavorite, showShare }; }, [isFavorite, shareUrl, shareTitle, shareImageUrl, showFavorite, showShare]);

    // Sync heart state
    useEffect(() => {
        if (!NativeNavBar) return;
        NativeNavBar.setFavorite({ isFavorite });
    }, [isFavorite]);

    // Map open → dim the bar (stays visible, not interactive)
    useEffect(() => {
        if (!NativeNavBar) return;
        NativeNavBar.setDimmed({ dimmed: isMapOpen }).catch(() => {});
    }, [isMapOpen]);

    // Gallery open → switch to modal mode with grid/carousel toggle icon
    useEffect(() => {
        if (!NativeNavBar) return;
        const icon = galleryIsGrid ? 'photo.on.rectangle' : 'square.grid.2x2';
        NativeNavBar.setModalMode({ active: isGalleryOpen, icon }).catch(() => {});
    }, [isGalleryOpen, galleryIsGrid]);

    // hidden=true → ukryj (np. gdy otwarty chat/modal); hidden=false → przywróć
    const isHiddenRef = useRef(false);
    useEffect(() => {
        if (!NativeNavBar) return;
        if (hidden && !isHiddenRef.current) {
            isHiddenRef.current = true;
            NativeNavBar.hide().catch(() => {});
        } else if (!hidden && isHiddenRef.current) {
            isHiddenRef.current = false;
            const { isFavorite: fav, shareUrl: url, shareTitle: st, shareImageUrl: si, topOffset, showFavorite: sf, showShare: ss } = showParamsRef.current;
            NativeNavBar.show({ isFavorite: fav, shareUrl: url, shareTitle: st, shareImageUrl: si, topOffset, showFavorite: sf, showShare: ss }).catch(() => {});
        }
    }, [hidden]);

    // Mount: show bar + register listeners
    useEffect(() => {
        if (!NativeNavBar) return;

        let cancelled = false;
        const handles: { remove(): Promise<void> }[] = [];

        // WAŻNE: React uruchamia cleanup starego komponentu PRZED setupem nowego (useEffect),
        // więc activeNavBarCount spada do 0 zanim nowy komponent go zinkrementuje.
        // pendingHideTimer !== null oznacza, że NavBar właśnie był aktywny → traktuj jako wasActive.
        const wasActive = activeNavBarCount > 0 || pendingHideTimer !== null;
        activeNavBarCount++;
        if (pendingHideTimer !== null) {
            clearTimeout(pendingHideTimer);
            pendingHideTimer = null;
        }

        const navEl = document.querySelector('[data-fixed-nav]') as HTMLElement | null;
        const topOffset = navEl ? navEl.offsetHeight : 0;

        // stabView w Swift chroni glass przed ciemnymi klatkami WKWebView przez 550ms —
        // nie trzeba czekać na sdv:ready ani żadnego dodatkowego buforu.
        const showTimer = setTimeout(() => {
            if (cancelled || isHiddenRef.current) return;
            NativeNavBar!.show({ isFavorite, shareUrl, shareTitle, shareImageUrl, topOffset, showFavorite, showShare })
                .then(() => {
                    if (cancelled) return;
                    showParamsRef.current.topOffset = topOffset;
                    document.documentElement.dataset.nativeNav = '1';
                    document.documentElement.style.setProperty('--total-nav-h', `${topOffset}px`);
                })
                .catch(() => {});
        }, wasActive ? 0 : 16);

        NativeNavBar.addListener('navBack', () => cbRef.current.onBack())
            .then(h => { if (cancelled) h.remove(); else handles.push(h); });

        NativeNavBar.addListener('navFavorite', ({ isFavorite: fav }) => {
                if (!cbRef.current.isLoggedIn) {
                    NativeNavBar!.setFavorite({ isFavorite: cbRef.current.isFavorite });
                    cbRef.current.onLoginRequired?.();
                    return;
                }
                cbRef.current.onFavoriteChange?.(fav);
            })
            .then(h => { if (cancelled) h.remove(); else handles.push(h); });

        NativeNavBar.addListener('navModalBack', () => cbRef.current.onGalleryClose?.())
            .then(h => { if (cancelled) h.remove(); else handles.push(h); });

        NativeNavBar.addListener('navModalAction', () => cbRef.current.onGalleryToggle?.())
            .then(h => { if (cancelled) h.remove(); else handles.push(h); });

        NativeNavBar.addListener('navModalAction2', () => cbRef.current.onModalAction2?.())
            .then(h => { if (cancelled) h.remove(); else handles.push(h); });

        return () => {
            cancelled = true;
            clearTimeout(showTimer);
            isHiddenRef.current = false;
            handles.forEach(h => h.remove());

            activeNavBarCount--;
            if (activeNavBarCount <= 0) {
                activeNavBarCount = 0;
                // Bufor 200ms — nowy widok NavBar może już montować i anuluje ten timer
                pendingHideTimer = setTimeout(() => {
                    pendingHideTimer = null;
                    if (activeNavBarCount === 0) {
                        NativeNavBar?.hide().catch(() => {});
                        delete document.documentElement.dataset.nativeNav;
                        document.documentElement.style.removeProperty('--total-nav-h');
                    }
                }, 80);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { isNativeNavActive: isIOS };
}
