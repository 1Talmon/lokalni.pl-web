import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { blockService } from '../services/blockService';

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

    /** Blokuje bez pytania — potwierdzenie pokazuje BlockUserModal. */
    const block = useCallback(async (uid: string) => {
        await blockService.block(uid);
        await refresh();
    }, [refresh]);

    const unblock = useCallback(async (uid: string) => {
        await blockService.unblock(uid);
        await refresh();
    }, [refresh]);

    return { blockedUsers, isLoading, isBlocked, block, unblock };
}
