'use client';
import { ReviewView } from '../../../../views/ReviewView';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../../providers/AppProvider';

export default function ReviewClient() {
    const router = useRouter();
    const { state } = useApp();

    if (!state.isLoggedIn && !state.isLoadingApp) { router.replace('/auth'); return null; }

    return <ReviewView />;
}
