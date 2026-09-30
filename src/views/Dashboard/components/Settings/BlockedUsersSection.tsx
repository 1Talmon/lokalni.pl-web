import { useState } from 'react';
import type { ToastType } from '../../../../types';
import { UserAvatar } from '../../../../components/ui/UserAvatar';
import { useBlockedUsers } from '../../../../hooks/useBlockedUsers';

/** Lista zablokowanych użytkowników z możliwością odblokowania (App Store 1.2). */
export const BlockedUsersSection = ({ addToast }: { addToast?: (msg: string, type?: ToastType) => void }) => {
    const { blockedUsers, isLoading, unblock } = useBlockedUsers(true);
    const [pendingUid, setPendingUid] = useState<string | null>(null);

    const handleUnblock = async (uid: string, name: string) => {
        setPendingUid(uid);
        try {
            await unblock(uid);
            addToast?.(`Odblokowano: ${name}`, 'success');
        } catch (e) {
            addToast?.((e as Error).message, 'error');
        } finally {
            setPendingUid(null);
        }
    };

    if (isLoading) return <p className="pt-2 text-xs text-gray-400">Ładowanie…</p>;

    if (blockedUsers.length === 0) {
        return (
            <p className="text-xs text-gray-400 px-3 py-3 rounded-2xl bg-gray-50">
                Nie masz zablokowanych użytkowników. Zablokować kogoś możesz w czacie lub na jego profilu.
            </p>
        );
    }

    return (
        <ul className="flex flex-col gap-2">
            {blockedUsers.map(u => (
                <li key={u.uid} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50">
                    <UserAvatar src={u.avatar} name={u.name} size={36} className="rounded-full shrink-0" />
                    <span className="flex-1 min-w-0 truncate text-sm font-semibold text-gray-900">{u.name || 'Użytkownik'}</span>
                    <button
                        onClick={() => handleUnblock(u.uid, u.name)}
                        disabled={pendingUid === u.uid}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-95 transition-all disabled:opacity-50"
                    >
                        Odblokuj
                    </button>
                </li>
            ))}
        </ul>
    );
};
