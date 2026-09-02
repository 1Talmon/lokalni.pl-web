'use client';
import { MessageCircle } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ApiChatSession } from '@/services/chatService';

interface ChatListViewProps {
    chats: ApiChatSession[];
    onChatClick: (id: string) => void;
    isLoading?: boolean;
}

export const ChatListView = ({ chats, onChatClick, isLoading = false }: ChatListViewProps) => {
    const sorted = [...chats].sort((a, b) => {
        if (a.unread > 0 && b.unread === 0) return -1;
        if (a.unread === 0 && b.unread > 0) return 1;
        // najnowsze na górze
        if (a.lastMessageAt && b.lastMessageAt) {
            return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
        }
        return 0;
    });

    const unreadCount = chats.filter(c => c.unread > 0).length;

    const formatTime = (iso: string | null): string => {
        if (!iso) return '';
        const d = new Date(iso);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffDays === 0) return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
        if (diffDays === 1) return 'wczoraj';
        if (diffDays < 7) return d.toLocaleDateString('pl-PL', { weekday: 'short' });
        return d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' });
    };

    return (
        <div className="max-w-5xl mx-auto py-8 px-4 md:px-6 pb-20">

            {/* Nagłówek */}
            <div className="mb-6">
                <p className="text-2xl font-bold text-gray-900 mb-1">Wiadomości</p>
                <p className="text-sm text-gray-500 font-medium">
                    {isLoading
                        ? 'Ładowanie konwersacji…'
                        : unreadCount > 0
                            ? `${unreadCount} nieprzeczytanych · ${chats.length} konwersacji`
                            : chats.length > 0
                                ? `${chats.length} konwersacji`
                                : 'Brak wiadomości'
                    }
                </p>
            </div>

            {/* Loading skeleton */}
            {isLoading && (
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`flex items-center gap-3.5 px-5 py-4 ${i < 3 ? 'border-b border-gray-50' : ''}`}>
                            <div className="w-12 h-12 rounded-2xl bg-gray-100 animate-pulse shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 bg-gray-100 rounded-full w-1/3 animate-pulse" />
                                <div className="h-3 bg-gray-100 rounded-full w-2/3 animate-pulse" />
                                <div className="h-3 bg-gray-100 rounded-full w-1/2 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!isLoading && sorted.length === 0 && (
                <div className="flex flex-col items-center text-center pt-16">
                    <div className="w-16 h-16 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-center justify-center mb-4">
                        <MessageCircle size={28} className="text-indigo-300" />
                    </div>
                    <p className="font-bold text-gray-700 mb-1">Brak wiadomości</p>
                    <p className="text-sm text-gray-500">Napisz do wykonawcy z poziomu ogłoszenia.</p>
                </div>
            )}

            {/* Lista */}
            {!isLoading && sorted.length > 0 && (
                <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                    {sorted.map((chat, i) => {
                        const isUnread = chat.unread > 0;
                        const isLast = i === sorted.length - 1;

                        return (
                            <button
                                key={chat.id}
                                type="button"
                                onClick={() => onChatClick(chat.id)}
                                className={`w-full flex items-center gap-3.5 px-5 py-4 text-left transition-colors hover:bg-gray-50 active:bg-gray-100 focus:outline-none ${!isLast ? 'border-b border-gray-50' : ''} ${isUnread ? 'bg-indigo-50/30' : ''}`}
                            >
                                {/* Awatar */}
                                <div className="relative shrink-0">
                                    <UserAvatar
                                        src={chat.otherPartyAvatar}
                                        name={chat.otherPartyName}
                                        size={48}
                                        className="rounded-2xl"
                                    />
                                    {isUnread && (
                                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-[#6366F1] ring-2 ring-white rounded-full flex items-center justify-center px-1">
                                            <span className="text-[9px] font-black text-white leading-none">{chat.unread}</span>
                                        </span>
                                    )}
                                </div>

                                {/* Treść */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-0.5">
                                        <span className={`text-[15px] truncate ${isUnread ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                                            {chat.otherPartyName}
                                        </span>
                                        <span className={`text-[11px] shrink-0 ${isUnread ? 'font-bold text-[#6366F1]' : 'text-gray-400'}`}>
                                            {formatTime(chat.lastMessageAt)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400 truncate mb-0.5">{chat.serviceTitle}</p>
                                    <p className={`text-[13px] truncate ${isUnread ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                                        {chat.lastMessage?.startsWith('📷')
                                            ? <span className="text-[#6366F1]">📷 Zdjęcie</span>
                                            : (chat.lastMessage || <span className="italic text-gray-300">Brak wiadomości</span>)
                                        }
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
