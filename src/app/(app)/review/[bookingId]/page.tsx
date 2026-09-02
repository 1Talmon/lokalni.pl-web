'use client';
import { ReviewView } from '../../../../views/ReviewView';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../../../../plugins/NativeNav';
import { useNativeSwipeBack } from '../../../../hooks/useNativeNav';
import { useApp } from '../../../../providers/AppProvider';

export default function ReviewPage() {
    const router = useRouter();
    const { state } = useApp();

    const doNav = useCallback(() => {
        const hasHistory = (window.history.state?.idx ?? 0) > 0;
        if (hasHistory) router.back(); else router.push('/dashboard');
    }, [router]);

    useNativeSwipeBack(doNav);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        let r2 = 0;
        const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => NativeNav.signalReady().catch(() => {})); });
        return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }, []);

    if (!state.isLoggedIn && !state.isLoadingApp) { router.replace('/auth'); return null; }

    return <ReviewView />;
}
