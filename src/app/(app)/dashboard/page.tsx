'use client';
import { useRouter } from 'next/navigation';
import { useApp } from '../../../providers/AppProvider';
import { UserProfileView } from '../../../views/Dashboard/UserProfileView';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../../../plugins/NativeNav';

export default function DashboardPage() {
    const { state, actions } = useApp();
    const router = useRouter();

    const openChat = async (chatId: string) => {
        if (Capacitor.isNativePlatform()) {
            await NativeNav.push({ fullScreen: true }).catch(() => {});
            router.push(`/chat/${chatId}`);
        } else {
            actions.setCurrentChatId(chatId);
            actions.setActiveModal('chat_detail');
        }
    };

    const handleOpenSupport = async () => {
        if (Capacitor.isNativePlatform()) {
            await NativeNav.push({ fullScreen: true }).catch(() => {});
            router.push('/support');
        } else {
            actions.openSupportModal();
        }
    };

    if (!state.isLoggedIn && !state.isLoadingApp) {
        router.replace('/auth');
        return null;
    }

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
            onOpenChat={(chatId) => openChat(chatId)}
            onOpenSupport={() => handleOpenSupport()}
            onOpenTicket={actions.openSupportTicket}
        />
    );
}
