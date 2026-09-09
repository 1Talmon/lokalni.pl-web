import { chatService, type ApiChatSession } from '../../services/chatService';
import type { Service, ToastType } from '../../types';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { QueryClient } from '@tanstack/react-query';

interface StartChatDeps {
    isLoggedIn: boolean;
    router: AppRouterInstance;
    chatSessions: ApiChatSession[];
    setInitialChatText: (t: string) => void;
    setCurrentChatServiceId: (id: string | null) => void;
    setCurrentChatId: (id: string | null) => void;
    setActiveModal: (m: 'none' | 'chat_detail' | 'add_service' | 'report' | 'support') => void;
}

export async function startChatWith(s: Service, msg: string = '', deps: StartChatDeps): Promise<void> {
    const { isLoggedIn, router, chatSessions, setInitialChatText, setCurrentChatServiceId, setCurrentChatId, setActiveModal } = deps;
    if (!isLoggedIn) { router.push('/auth'); return; }
    setInitialChatText(msg);
    setCurrentChatServiceId(s.publicId ?? null);

    const providerUid = s.provider?.uid;
    const existing = chatSessions.find((c: ApiChatSession) =>
        providerUid ? c.otherPartyUid === providerUid : c.servicePublicId === s.publicId
    );

    if (existing) {
        setCurrentChatId(existing.id);
    } else {
        setCurrentChatId(null);
    }
    setActiveModal('chat_detail');
}

interface SendMessageDeps {
    currentChatId: string | null;
    currentChatServiceId: string | null;
    addToast: (msg: string, type?: ToastType) => void;
    queryClient: QueryClient;
    refetchChats: () => void;
    setCurrentChatId: (id: string | null) => void;
}

export async function sendMessage(
    text: string | null,
    imageUrl: string | null,
    deps: SendMessageDeps,
): Promise<void> {
    if (!text?.trim() && !imageUrl) return;
    const { currentChatServiceId, addToast, queryClient, refetchChats, setCurrentChatId } = deps;
    let sessionId = deps.currentChatId;

    if (!sessionId) {
        if (!currentChatServiceId) return;
        try {
            const session = await chatService.startChat(currentChatServiceId);
            setCurrentChatId(session.id);
            sessionId = session.id;
            await refetchChats();
        } catch (err: unknown) {
            addToast((err as Error).message || 'Błąd tworzenia czatu', 'error');
            return;
        }
    }
    try {
        await chatService.sendMessage(sessionId, text || undefined, imageUrl || undefined);
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
    } catch {
        addToast('Błąd wysyłania wiadomości', 'error');
    }
}
