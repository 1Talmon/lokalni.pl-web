// Push notifications on web use the browser Web Push API via service worker.
// The native Capacitor LocalNotifications path has been removed.

import { useEffect } from 'react';
import { logger } from '@/utils/logger';
import { initPushNotifications } from '../services/pushNotificationService';
import { apiClient } from '../services/apiClient';

async function reRegisterFCMToken(token: string) {
    try {
        const res = await apiClient.post('/notifications/device-token', { token, platform: 'web' });
        if (res.ok) {
            localStorage.setItem('push_device_token', token);
            logger.info('[Push] token rotation — re-registered OK');
        }
    } catch (err) {
        logger.error('[Push] token rotation re-register error:', err);
    }
}

export const usePushNotifications = (
    isLoggedIn: boolean,
    addToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void,
) => {
    useEffect(() => {
        if (!isLoggedIn) return;

        initPushNotifications(addToast).catch(err => logger.error('[Push] initPushNotifications error:', err));

        const onTokenRefresh = (e: Event) => {
            const token = (e as CustomEvent<{ token: string }>).detail?.token;
            if (token) reRegisterFCMToken(token).catch(() => {});
        };
        window.addEventListener('fcmTokenReady', onTokenRefresh);
        return () => window.removeEventListener('fcmTokenReady', onTokenRefresh);
    }, [isLoggedIn, addToast]);
};

export const sendLocalNotification = async (title: string, body: string, _delayMs = 500) => {
    if (!('Notification' in window)) return;
    try {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') return;
        new Notification(title, { body, icon: '/icons/web-app-manifest-192x192.png' });
    } catch (e) {
        logger.error('[Notification] failed:', e);
    }
};

export const sendTestNotification = () =>
    sendLocalNotification('🔔 MyLokalni.pl', 'Powiadomienia działają!');
