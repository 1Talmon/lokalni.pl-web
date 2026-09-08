'use client';
import { lazy, Suspense, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '../../../../providers/AppProvider';
import { setActiveChatId } from '../../../../services/pushNotificationService';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';

const ChatModalView = lazy(() => import('../../../../components/modals/ChatModal').then(m => ({ default: m.ChatModal })));

export default function ChatConversationPage() {
    const params = useParams();
    const chatId = params?.chatId as string | undefined;
    const searchParams = useSearchParams();
    const router = useRouter();
    const { state, actions } = useApp();

    const resolvedChatId = chatId !== 'new' ? (chatId ?? null) : null;
    const resolvedServiceId = chatId === 'new' ? searchParams.get('serviceId') : null;

    const handleBack = useCallback(() => {
        const hasHistory = (window.history.state?.idx ?? 0) > 0;
        if (hasHistory) router.back(); else router.push('/');
    }, [router]);

    useEffect(() => {
        setActiveChatId(resolvedChatId);
        return () => { setActiveChatId(null); };
    }, [resolvedChatId]);

    if (!state.isLoggedIn && !state.isLoadingApp) { router.replace('/auth'); return null; }

    return (
        <Suspense fallback={<LoadingScreen isVisible={true} />}>
            <ChatModalView
                asView={true}
                isOpen={true}
                onClose={handleBack}
                currentChatId={resolvedChatId}
                pendingServiceId={resolvedServiceId ?? (chatId === 'new' ? state.currentChatServiceId : null)}
                chatSessions={state.chatSessions}
                allServices={state.allServices}
                onSendMessage={actions.handleSendMessage}
                onBookingAction={(msgId, action) => actions.handleBookingAction(resolvedChatId ?? '', msgId, action)}
                onReschedule={(msgId, newDate, newTime) => actions.handleBookingReschedule(resolvedChatId ?? '', msgId, newDate, newTime)}
                onCreateBooking={actions.handleCreateBookingForClient}
                myServices={state.myDashboardServices}
                initialMessage={chatId === 'new' ? state.initialChatText : ''}
            />
        </Suspense>
    );
}
