'use client';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { useApp } from '@/providers/AppProvider';
import { Navbar } from '@/components/layout/Navbar';

export function SlugNavbar() {
    const { state, actions } = useApp();
    const router = useRouter();

    if (Capacitor.isNativePlatform()) return null;

    return (
        <Navbar
            userProfile={state.freshUser || state.userProfile}
            isLoggedIn={state.isLoggedIn}
            unreadCount={state.unreadNotifications}
            notifications={state.notificationList}
            showNotifications={state.showNotifications}
            onToggleNotifications={actions.handleNotificationClick}
            onCloseNotifications={() => actions.setShowNotifications(false)}
            onMarkAllRead={actions.onMarkAllRead}
            onNotificationClick={actions.handleNotificationItemClick}
            onProfileClick={() => router.push('/dashboard')}
            onLogoClick={() => router.push('/')}
        />
    );
}
