import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { usePlatform } from './usePlatform';
import { logger } from '@/utils/logger';
import { initPushNotifications } from '../services/pushNotificationService';
import { apiClient } from '../services/apiClient';

async function reRegisterFCMToken(token: string) {
    try {
        const p = Capacitor.getPlatform() as 'ios' | 'android' | 'web'
        if (p !== 'ios' && p !== 'android') return
        const res = await apiClient.post('/notifications/device-token', { token, platform: p })
        if (res.ok) {
            localStorage.setItem('push_device_token', token)
            logger.info('[Push] token rotation — re-registered OK')
        }
    } catch (err) {
        logger.error('[Push] token rotation re-register error:', err)
    }
};

export const usePushNotifications = (
    isLoggedIn: boolean,
    addToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void,
) => {
    const { isNative } = usePlatform();

    useEffect(() => {
        if (!isNative || !isLoggedIn) return;

        let actionHandle: Awaited<ReturnType<typeof LocalNotifications.addListener>> | undefined;

        const setup = async () => {
            const perm = await LocalNotifications.requestPermissions();
            if (perm.display !== 'granted') return;

            actionHandle = await LocalNotifications.addListener('localNotificationActionPerformed', (action: unknown) => {
                logger.info('[Notification] tapped:', (action as { notification?: unknown })?.notification);
            });

            initPushNotifications(addToast).catch(err => logger.error('[Push] initPushNotifications error:', err));
        };

        setup();

        const onTokenRefresh = (e: Event) => {
            const token = (e as CustomEvent<{ token: string }>).detail?.token
            if (token) reRegisterFCMToken(token).catch(() => {})
        }
        window.addEventListener('fcmTokenReady', onTokenRefresh)

        return () => {
            actionHandle?.remove()
            window.removeEventListener('fcmTokenReady', onTokenRefresh)
        }
    }, [isNative, isLoggedIn, addToast]);
};

export const sendLocalNotification = async (title: string, body: string, delayMs = 500) => {
    try {
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display !== 'granted') return;

        await LocalNotifications.schedule({
            notifications: [{
                id: Date.now(),
                title,
                body,
                schedule: { at: new Date(Date.now() + delayMs) },
                iconColor: '#6366F1',
            }],
        });
    } catch (e) {
        logger.error('[Notification] failed:', e);
    }
};

export const sendTestNotification = () =>
    sendLocalNotification('🔔 MyLokalni.pl', 'Powiadomienia działają!');
