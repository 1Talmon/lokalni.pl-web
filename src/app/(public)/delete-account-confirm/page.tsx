'use client';
import { useApp } from '../../../providers/AppProvider';
import { DeleteAccountConfirmView } from '../../../views/DeleteAccountConfirmView';
import { useRouter } from 'next/navigation';

export default function DeleteAccountConfirmPage() {
    const { state, actions } = useApp();
    const router = useRouter();
    if (!state.isLoggedIn && !state.isLoadingApp) { router.replace('/auth'); return null; }
    return <DeleteAccountConfirmView addToast={actions.addToast} />;
}
