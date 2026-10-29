'use client';
import { useApp } from '../../../providers/AppProvider';
import BookingFormView from '../../../views/BookingFormView';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { IS_SAFARI_WEB, createSafariOverlay, revealAfterUnmount } from '../../../utils/safariNavOverlay';
import { loginHref } from '../../../utils/authRedirect';

export default function BookingFormPage() {
    const { state, actions } = useApp();
    const router = useRouter();

    const doNav = useCallback(() => {
        // Next.js history.state has no react-router idx — that check was always false and sent Back to the home page
        const hasHistory = window.history.length > 1;
        if (hasHistory) router.back(); else router.push('/');
    }, [router]);

    const handleBack = useCallback(() => {
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
    }, [doNav]);

    // after login back to the offer — the form itself needs the offer picked in this session
    if (!state.isLoggedIn && !state.isLoadingApp) { router.replace(loginHref(state.selectedService?.publicId ? `/service/${state.selectedService.publicId}` : null)); return null; }
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
