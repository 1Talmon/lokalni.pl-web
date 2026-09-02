'use client';
import { useApp } from '../../../providers/AppProvider';
import BookingFormView from '../../../views/BookingFormView';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../../../plugins/NativeNav';
import { IS_SAFARI_WEB, createSafariOverlay, revealAfterUnmount } from '../../../utils/safariNavOverlay';

export default function BookingFormPage() {
    const { state, actions } = useApp();
    const router = useRouter();

    const doNav = useCallback(() => {
        const hasHistory = (window.history.state?.idx ?? 0) > 0;
        if (hasHistory) router.back(); else router.push('/');
    }, [router]);

    const handleBack = useCallback(async () => {
        if (Capacitor.isNativePlatform()) { await NativeNav.pop().catch(() => {}); doNav(); }
        else {
            const doc = document as unknown as { startViewTransition?: (fn: () => void | Promise<void>) => { finished: Promise<void> } };
            if (!IS_SAFARI_WEB && typeof doc.startViewTransition === 'function') {
                document.documentElement.classList.add('vt-running', 'vt-inapp');
                const vt = doc.startViewTransition(() => { doNav(); return new Promise<void>(resolve => setTimeout(resolve, 20)); });
                vt.finished.finally(() => document.documentElement.classList.remove('vt-running', 'vt-inapp'));
            } else {
                document.documentElement.classList.add('vt-running');
                const overlay = createSafariOverlay();
                const sdvRoot = document.querySelector('[data-sdv-root]');
                doNav();
                revealAfterUnmount(overlay, sdvRoot, true);
            }
        }
    }, [doNav]);

    if (!state.isLoggedIn && !state.isLoadingApp) { router.replace('/auth'); return null; }
    if (!state.selectedService && !state.isLoadingApp) { router.replace('/'); return null; }

    return (
        <BookingFormView
            service={state.selectedService}
            onBack={handleBack}
            userLocation={state.location}
            onSubmit={actions.handleBookingSubmit}
            isSubmitting={state.isBookingLoading}
        />
    );
}
