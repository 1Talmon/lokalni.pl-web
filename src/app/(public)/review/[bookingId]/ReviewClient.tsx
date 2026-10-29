'use client';
import { ReviewView } from '../../../../views/ReviewView';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../../providers/AppProvider';
import { loginHref } from '../../../../utils/authRedirect';

export default function ReviewClient() {
    const router = useRouter();
    const { state } = useApp();

    if (!state.isLoggedIn && !state.isLoadingApp) { router.replace(loginHref()); return null; }

    return <ReviewView />;
}
