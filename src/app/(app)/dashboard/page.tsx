'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useApp } from '../../../providers/AppProvider';
import { UserProfileView } from '../../../views/Dashboard/UserProfileView';
import { loginHref } from '../../../utils/authRedirect';

export default function DashboardPage() {
    const { state, actions } = useApp();
    const router = useRouter();
    const queryClient = useQueryClient();

    // Back from Stripe Checkout: Plus arrives via webhook, usually within seconds — refresh the account a few times
    useEffect(() => {
        if (!state.isLoggedIn) return;
        const result = new URLSearchParams(window.location.search).get('plus');
        if (result !== 'success' && result !== 'cancel') return;
        window.history.replaceState(null, '', window.location.pathname);
        if (result === 'cancel') { actions.addToast('Płatność przerwana — nic nie zostało pobrane.', 'info'); return; }
        actions.addToast('Dziękujemy! Włączamy Plus…');
        let n = 0;
        const refresh = () => {
            queryClient.invalidateQueries({ queryKey: ['my-profile'] });
            queryClient.invalidateQueries({ queryKey: ['stripe-config'] });
        };
        refresh();
        const t = setInterval(() => { refresh(); if (++n >= 6) clearInterval(t); }, 2500);
        return () => clearInterval(t);
    }, [state.isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!state.isLoggedIn && !state.isLoadingApp) {
            router.replace(loginHref());
        }
    }, [state.isLoggedIn, state.isLoadingApp]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!state.isLoggedIn && !state.isLoadingApp) return null;

    return (
        <UserProfileView
            user={state.freshUser || state.userProfile}
            isLoggedIn={state.isLoggedIn}
            myServices={state.myDashboardServices}
            onLogin={() => router.push(loginHref())}
            onLogout={actions.handleLogout}
            onAvatarChange={actions.handleAvatarUpdate}
            onAddService={actions.openAddServiceModal}
            onEditService={actions.openEditServiceModal}
            onDeleteService={actions.deleteService}
            addToast={actions.addToast}
            onBookingAction={actions.handleBookingAction}
            onReschedule={actions.handleBookingReschedule}
            onUpgrade={actions.handleUpgradeToPremium}
            onOpenChat={(chatId) => { actions.setCurrentChatId(chatId); actions.setActiveModal('chat_detail'); }}
            onOpenSupport={() => actions.openSupportModal()}
            onOpenTicket={actions.openSupportTicket}
        />
    );
}
