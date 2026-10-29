'use client';
import { useApp } from '../../../providers/AppProvider';
import { SupportView } from '../../../views/SupportView';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export default function SupportPage() {
    const { state, actions } = useApp();
    const router = useRouter();

    const handleBack = useCallback(() => {
        // Next.js history.state has no react-router idx — that check was always false and sent Back to the home page
        const hasHistory = window.history.length > 1;
        if (hasHistory) router.back(); else router.push('/');
    }, [router]);

    if (!state.isLoggedIn && !state.isLoadingApp) { router.replace('/auth'); return null; }

    return <SupportView addToast={actions.addToast} onClose={handleBack} />;
}
