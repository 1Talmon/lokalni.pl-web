import { useEffect, useRef, useState } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface BottomBarPlugin {
    show(opts: { price: string; unit: string; label: string; collapsed?: boolean; isHidden?: boolean }): Promise<{ height: number }>;
    hide(): Promise<void>;
    setCollapsed(opts: { collapsed: boolean }): Promise<void>;
    addListener(event: 'bottomBarAction', handler: () => void): Promise<{ remove(): Promise<void> }>;
}

const isIOS = Capacitor.getPlatform() === 'ios';
const BottomBar = isIOS ? registerPlugin<BottomBarPlugin>('BottomBar') : null;

interface Options {
    price: string;
    unit:  string;
    label: string;
    enabled?: boolean;
    visible?: boolean;
    collapsed?: boolean;
    onAction: () => void;
}

export function useNativeBottomBar({ price, unit, label, enabled = true, visible = true, collapsed = false, onAction }: Options) {
    const cbRef = useRef({ onAction });
    useEffect(() => { cbRef.current = { onAction }; });

    // true once Swift confirms inset applied — never reset on visible changes
    const [isActive, setIsActive] = useState(isIOS);

    // tracks whether the bar pill is currently visually shown (not isHidden)
    // starts true on iOS so web CTA is hidden from first render (no flash)
    const [, setIsBarVisible] = useState(isIOS);

    // Sync price/unit/label/visible changes.
    // visible false→true: delay 380ms so modal exit animation (220ms) finishes
    // and native bar slides in smoothly, crossfading with web CTA fade-out.
    const collapsedRef = useRef(collapsed);
    useEffect(() => { collapsedRef.current = collapsed; }, [collapsed]);

    const prevVisibleRef = useRef(visible);
    useEffect(() => {
        if (!BottomBar || !enabled || !isActive) return;
        prevVisibleRef.current = visible;
        if (!visible) {
            // hide() zamiast show({isHidden:true}) — zwalnia additionalSafeAreaInsets
            // które BottomBar.show() ustawia na WKWebView. Bez tego env(safe-area-inset-bottom)
            // w ChatModal zawiera wysokość CTA bara i input ląduje za wysoko.
            BottomBar.hide().catch(() => {});
            setIsBarVisible(false);
            return;
        }
        BottomBar.show({ price, unit, label, collapsed: collapsedRef.current, isHidden: false }).catch(() => {});
        setIsBarVisible(true);
    }, [price, unit, label, enabled, visible, isActive]);

    // Sync collapsed state
    useEffect(() => {
        if (!BottomBar || !enabled || !isActive) return;
        BottomBar.setCollapsed({ collapsed }).catch(() => {});
    }, [collapsed, enabled, isActive]);

    // Mount: show bar; teardown only when enabled flips
    useEffect(() => {
        if (!BottomBar || !enabled) return;

        let cancelled = false;

        BottomBar.show({ price, unit, label, collapsed, isHidden: !visible })
            .then(({ height }) => {
                if (cancelled) return;
                if (height > 0) {
                    setIsActive(true);
                    document.documentElement.style.setProperty('--native-cta-h', `${height}px`);
                }
            })
            .catch(() => {});

        return () => {
            cancelled = true;
            setIsActive(false);
            setIsBarVisible(false);
            BottomBar.hide().catch(() => {});
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);

    // Action listener: register/remove based on visible
    useEffect(() => {
        if (!BottomBar || !enabled || !visible) return;

        let handle: { remove(): Promise<void> } | null = null;
        let cancelled = false;
        BottomBar.addListener('bottomBarAction', () => cbRef.current.onAction())
            .then(h => { if (cancelled) h.remove(); else handle = h; });

        return () => { cancelled = true; handle?.remove(); };
    }, [enabled, visible]);

    return { isNativeBottomBarActive: visible && isActive };
}
