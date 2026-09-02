import { apiClient } from './apiClient';
import type { NotificationItem } from '../types';

export const notificationService = {
    async fetchNotifications(page: number = 1) {
        try {
            const response = await apiClient.get(`/notifications?page=${page}`);
            if (!response.ok) return [];
            const result = await response.json();
            return (result.data || []).map((n: NotificationItem) => ({
                id: n.id,
                title: n.title,
                text: n.text,
                time: n.time,
                read: n.read,
                type: n.type,
                chatId: n.chatId,
                senderAvatar: n.senderAvatar ?? null,
                senderName: n.senderName ?? null,
                bookingId: n.bookingId ?? null,
                servicePublicId: n.servicePublicId ?? null,
                bookingTab: n.bookingTab ?? null,
            }));
        } catch {
            return [];
        }
    },

    async markAsRead(id: number) {
        try {
            const response = await apiClient.patch(`/notifications/${id}/read`, {});
            return response.ok;
        } catch { return false; }
    },

    async markAllAsRead() {
        try {
            const response = await apiClient.post('/notifications/read-all', {});
            return response.ok;
        } catch { return false; }
    },

    async fetchBadgeCounts() {
        try {
            const response = await apiClient.get('/users/me/counters');
            if (!response.ok) return null;
            const result = await response.json();
            if (result.status === 'success') return result.data;
            return null;
        } catch { return null; }
    },
};
