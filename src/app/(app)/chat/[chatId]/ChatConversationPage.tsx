'use client';
import { lazy, Suspense, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '../../../../providers/AppProvider';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../../../../plugins/NativeNav';
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

    const doNav = useCallback(() => {
        const hasHistory = (window.history.state?.idx ?? 0) > 0;
        if (hasHistory) router.back(); else router.push('/');
    }, [router]);

    const handleBack = useCallback(async () => {
        if (Capacitor.isNativePlatform()) { await NativeNav.pop({ fullScreen: true }).catch(() => {}); doNav(); }
        else doNav();
    }, [doNav]);

    const doNavRef = useRef(doNav);
    useEffect(() => { doNavRef.current = doNav; }, [doNav]);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        let startX = 0, startY = 0;
        const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; };
        const onEnd = async (e: TouchEvent) => {
            const dx = e.changedTouches[0].clientX - startX;
            const dy = e.changedTouches[0].clientY - startY;
            if (startX < 24 && dx > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                await NativeNav.pop({ fullScreen: true }).catch(() => {});
                doNavRef.current();
            }
        };
        document.addEventListener('touchstart', onStart, { passive: true, capture: true });
        document.addEventListener('touchend', onEnd, { passive: true, capture: true });
        return () => {
            document.removeEventListener('touchstart', onStart, { capture: true });
            document.removeEventListener('touchend', onEnd, { capture: true });
        };
    }, []);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        let r2 = 0;
        const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => NativeNav.signalReady().catch(() => {})); });
        return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }, []);

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
