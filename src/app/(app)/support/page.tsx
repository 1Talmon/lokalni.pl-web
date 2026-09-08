'use client';
import { useApp } from '../../../providers/AppProvider';
import { SupportView } from '../../../views/SupportView';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';

export default function SupportPage() {
    const { state, actions } = useApp();
    const router = useRouter();

    const handleBack = useCallback(() => {
        const hasHistory = (window.history.state?.idx ?? 0) > 0;
        if (hasHistory) router.back(); else router.push('/');
    }, [router]);

    if (!state.isLoggedIn && !state.isLoadingApp) { router.replace('/auth'); return null; }

    return <SupportView addToast={actions.addToast} onClose={handleBack} />;
}
