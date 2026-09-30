import { apiClient } from './apiClient';

export interface BlockedUser {
    uid: string;
    name: string;
    avatar: string | null;
    blockedAt: string;
}

export const blockService = {
    async list(): Promise<BlockedUser[]> {
        const res = await apiClient('/users/me/blocks');
        if (!res.ok) throw new Error('Nie udało się pobrać listy zablokowanych.');
        const json = await res.json();
        return json.data ?? [];
    },
    async block(uid: string): Promise<void> {
        const res = await apiClient.post(`/users/${uid}/block`, {});
        if (!res.ok) throw new Error('Nie udało się zablokować użytkownika.');
    },
    async unblock(uid: string): Promise<void> {
        const res = await apiClient.delete(`/users/${uid}/block`);
        if (!res.ok) throw new Error('Nie udało się odblokować użytkownika.');
    },
};
