'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { QueryProvider } from '../../providers/QueryProvider';
import { AppProvider, useApp } from '../../providers/AppProvider';
import AuthView from '../../views/AuthView';
import type { AuthMode } from '../../hooks/useAuthLogic';
import { safeNext, rememberLoginNext, takeLoginNext } from '../../utils/authRedirect';

function AuthPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { state, actions } = useApp();
    const initialMode = (searchParams.get('mode') as AuthMode) || 'login';
    const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
    // ?next=/dashboard?tab=orders&bookingId=5 — back to that page after signing in; same-site only (utils/authRedirect).
    // Also remembered for an hour: register → confirm e-mail in a new tab → log in still returns there.
    const next = safeNext(searchParams.get('next'));
    useEffect(() => { rememberLoginNext(next); }, [next]);
    const finishLogin = (u: Parameters<typeof actions.handleLoginSuccess>[0]) =>
        actions.handleLoginSuccess(u, takeLoginNext() ?? next ?? '/');

    // already signed in (e.g. a link from an e-mail opened in a logged-in browser) → straight to the target
    useEffect(() => {
        if (!state.isLoadingApp && state.isLoggedIn && next) router.replace(takeLoginNext() ?? next);
    }, [state.isLoadingApp, state.isLoggedIn, next]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <AuthView
            authMode={authMode}
            setAuthMode={setAuthMode}
            onLoginSuccess={finishLogin}
            onGoBack={() => router.back()}
        />
    );
}

export default function AuthPage() {
    return (
        <QueryProvider>
            <AppProvider>
                <Suspense fallback={null}>
                    <AuthPageContent />
                </Suspense>
            </AppProvider>
        </QueryProvider>
    );
}
