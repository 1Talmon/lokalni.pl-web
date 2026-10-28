'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { QueryProvider } from '../../providers/QueryProvider';
import { AppProvider, useApp } from '../../providers/AppProvider';
import AuthView from '../../views/AuthView';
import type { AuthMode } from '../../hooks/useAuthLogic';

function AuthPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { actions } = useApp();
    const initialMode = (searchParams.get('mode') as AuthMode) || 'login';
    const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
    // ?next=/delete-account — back to that page after signing in; same-site paths only (no "//host" open redirect)
    const nextParam = searchParams.get('next');
    const next = nextParam && /^\/(?!\/)[\w\-/]*$/.test(nextParam) ? nextParam : '/';

    return (
        <AuthView
            authMode={authMode}
            setAuthMode={setAuthMode}
            onLoginSuccess={(u) => actions.handleLoginSuccess(u, next)}
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
