'use client';
import { useApp } from '../../../providers/AppProvider';
import { SupportView } from '../../../views/SupportView';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../../../plugins/NativeNav';

export default function SupportPage() {
    const { state, actions } = useApp();
    const router = useRouter();

    const doNav = useCallback(() => {
        const hasHistory = (window.history.state?.idx ?? 0) > 0;
        if (hasHistory) router.back(); else router.push('/');
    }, [router]);

    const doNavRef = useRef(doNav);
    useEffect(() => { doNavRef.current = doNav; }, [doNav]);

    const handleBack = useCallback(async () => {
        if (Capacitor.isNativePlatform()) { await NativeNav.pop({ fullScreen: true }).catch(() => {}); doNav(); }
        else doNav();
    }, [doNav]);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        let startX = 0, startY = 0;
        const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
        const onEnd = async (e: TouchEvent) => {
            const dx = e.changedTouches[0].clientX - startX;
            const dy = e.changedTouches[0].clientY - startY;
            if (startX < 24 && dx > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                await NativeNav.pop({ fullScreen: true }).catch(() => {});
                doNavRef.current();
            }
        };
        document.addEventListener('touchstart', onStart, { passive: true, capture: true });
        document.addEventListener('touchend', onEnd, { passive: true, capture: true });
        return () => {
            document.removeEventListener('touchstart', onStart, { capture: true });
            document.removeEventListener('touchend', onEnd, { capture: true });
        };
    }, []);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        let r2 = 0;
        const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => NativeNav.signalReady().catch(() => {})); });
        return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }, []);

    if (!state.isLoggedIn && !state.isLoadingApp) { router.replace('/auth'); return null; }

    return <SupportView addToast={actions.addToast} onClose={handleBack} />;
}
