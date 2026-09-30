import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { blockService, confirmBlockUser } from '../services/blockService';

/** Lista zablokowanych przeze mnie użytkowników + akcje blokuj/odblokuj. */
export function useBlockedUsers(enabled: boolean) {
    const queryClient = useQueryClient();
    const { data: blockedUsers = [], isLoading } = useQuery({
        queryKey: ['blocked-users'],
        queryFn: blockService.list,
        enabled,
        staleTime: 1000 * 60 * 5,
    });

    const refresh = useCallback(async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['blocked-users'] }),
            queryClient.invalidateQueries({ queryKey: ['chats'] }),
        ]);
    }, [queryClient]);

    const isBlocked = useCallback((uid?: string | null) => !!uid && blockedUsers.some(u => u.uid === uid), [blockedUsers]);

    /** Pyta o potwierdzenie i blokuje. Zwraca true, jeśli użytkownik został zablokowany. */
    const block = useCallback(async (uid: string, name: string) => {
        if (!(await confirmBlockUser(name))) return false;
        await blockService.block(uid);
        await refresh();
        return true;
    }, [refresh]);

    const unblock = useCallback(async (uid: string) => {
        await blockService.unblock(uid);
        await refresh();
    }, [refresh]);

    return { blockedUsers, isLoading, isBlocked, block, unblock };
}
