import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Capacitor, registerPlugin } from '@capacitor/core';

interface NativeBottomNavPlugin {
    show(opts: { activeTab: string; hasUnreadMessages: boolean }): Promise<{ height: number }>;
    hide(): Promise<void>;
    setActiveTab(opts: { tab: string }): Promise<void>;
    setBadge(opts: { hasUnreadMessages: boolean }): Promise<void>;
    addListener(
        event: 'tabChange',
        handler: (data: { tab: string }) => void
    ): Promise<{ remove(): Promise<void> }>;
}

const isIOS = Capacitor.getPlatform() === 'ios';

const NativeBottomNav = isIOS
    ? registerPlugin<NativeBottomNavPlugin>('BottomNav')
    : null;

export { NativeBottomNav };

interface Options {
    isLoggedIn: boolean;
    currentView: string;
    onChangeView: (view: string) => void;
    onAddClick: () => void;
    hasUnreadMessages: boolean;
    hideNavigation: boolean;
}

export function useNativeBottomNav({
    isLoggedIn,
    currentView,
    onChangeView,
    onAddClick,
    hasUnreadMessages,
    hideNavigation,
}: Options) {
    const [isActive, setIsActive] = useState(false);
    const pathname = usePathname();

    // useLayoutEffect — synchronicznie przed malowaniem, bez klatki z webowym paskiem
    useLayoutEffect(() => {
        if (!NativeBottomNav) return;
        setIsActive(isLoggedIn && !hideNavigation);
    }, [isLoggedIn, hideNavigation]);

    const cbRef = useRef({ onChangeView, onAddClick });
    useEffect(() => { cbRef.current = { onChangeView, onAddClick }; });

    useEffect(() => {
        if (!NativeBottomNav) return;

        const shouldShow = isLoggedIn && !hideNavigation;

        if (!shouldShow) {
            NativeBottomNav.hide();
            document.documentElement.style.removeProperty('--bottom-nav-total-h');
            return;
        }

        let cancelled = false;
        let listenerHandle: { remove(): Promise<void> } | null = null;

        NativeBottomNav.show({ activeTab: currentView, hasUnreadMessages })
            .then(({ height }) => {
                if (cancelled) return;
                document.documentElement.style.setProperty('--bottom-nav-total-h', `${height}px`);
            })
            .catch(() => {});

        NativeBottomNav.addListener('tabChange', ({ tab }) => {
            if (tab === 'add') cbRef.current.onAddClick();
            else cbRef.current.onChangeView(tab);
        }).then(handle => {
            if (cancelled) { handle.remove(); return; }
            listenerHandle = handle;
        });

        return () => {
            cancelled = true;
            listenerHandle?.remove();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn, hideNavigation, pathname]);

    useEffect(() => {
        if (!isActive || !NativeBottomNav) return;
        NativeBottomNav.setActiveTab({ tab: currentView });
    }, [currentView, isActive]);

    useEffect(() => {
        if (!isActive || !NativeBottomNav) return;
        NativeBottomNav.setBadge({ hasUnreadMessages });
    }, [hasUnreadMessages, isActive]);

    return { isNativeNavActive: isActive };
}
