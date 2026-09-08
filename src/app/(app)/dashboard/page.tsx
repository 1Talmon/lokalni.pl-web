'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../providers/AppProvider';
import { UserProfileView } from '../../../views/Dashboard/UserProfileView';

export default function DashboardPage() {
    const { state, actions } = useApp();
    const router = useRouter();

    useEffect(() => {
        if (!state.isLoggedIn && !state.isLoadingApp) {
            router.replace('/auth');
        }
    }, [state.isLoggedIn, state.isLoadingApp]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!state.isLoggedIn && !state.isLoadingApp) return null;

    return (
        <UserProfileView
            user={state.freshUser || state.userProfile}
            isLoggedIn={state.isLoggedIn}
            myServices={state.myDashboardServices}
            onLogin={() => router.push('/auth')}
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
