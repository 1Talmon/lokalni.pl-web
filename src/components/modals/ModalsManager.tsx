'use client';
import React, { lazy } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CATEGORIES_DATA } from '../../data/categories';
import type { AppState, AppActions } from '../../types/appTypes';
import { apiClient } from '../../services/apiClient';

const ChatModal = lazy(() => import('./ChatModal').then(m => ({ default: m.ChatModal })));
const AddServiceModal = lazy(() => import('./AddServiceModal').then(m => ({ default: m.AddServiceModal })));
const ReportModal = lazy(() => import('./ReportModal').then(m => ({ default: m.ReportModal })));
const SupportModal = lazy(() => import('./SupportModal').then(m => ({ default: m.SupportModal })));
const SupportTicketModal = lazy(() => import('./SupportTicketModal').then(m => ({ default: m.SupportTicketModal })));

interface ModalsManagerProps {
    state: AppState;
    actions: AppActions;
}

const REASON_MAP: Record<string, string> = {
    'Spam': 'spam', 'Treści reklamowe': 'spam',
    'Fałszywe konto': 'fraud', 'Fałszywa opinia': 'fraud', 'Oszustwo': 'fraud',
    'Nękanie': 'inappropriate_content', 'Wulgaryzmy': 'inappropriate_content',
    'Nieodpowiednie treści': 'inappropriate_content', 'Niedozwolone treści': 'inappropriate_content',
    'Zła kategoria': 'other', 'Nieaktualne': 'other',
};
const TYPE_MAP: Record<string, string> = { profile: 'user', review: 'review', service: 'service' };

export const ModalsManager = ({ state, actions }: ModalsManagerProps) => {
    const handleReportSubmit = async (reason: string) => {
        const rd = state.reportData;
        if (!rd) return;
        try {
            await apiClient.post('/reports', {
                targetType: TYPE_MAP[rd.type] ?? 'user',
                targetId: String(rd.id),
                reason: REASON_MAP[reason] ?? 'other',
            });
            actions.addToast?.('Zgłoszenie wysłane', 'success');
        } catch {
            actions.addToast?.('Błąd wysyłania zgłoszenia', 'error');
        }
    };

    return (
        <AnimatePresence>
            {state.activeModal === 'chat_detail' && (
                <ChatModal
                    key="chat"
                    isOpen={true}
                    onClose={() => actions.setActiveModal('none')}
                    currentChatId={state.currentChatId}
                    pendingServiceId={state.currentChatServiceId}
                    chatSessions={state.chatSessions}
                    allServices={state.allServices}
                    onSendMessage={actions.handleSendMessage}
                    onBookingAction={(messageId, action) => actions.handleBookingAction(state.currentChatId!, messageId, action)}
                    onReschedule={(messageId, newDate, newTime) => actions.handleBookingReschedule(state.currentChatId!, messageId, newDate, newTime)}
                    onCreateBooking={(sessionId, date, time, servicePublicId, recurrence) => actions.handleCreateBookingForClient(sessionId, date, time, servicePublicId, recurrence)}
                    myServices={state.myDashboardServices}
                    initialMessage={state.initialChatText}
                />
            )}

            {state.activeModal === 'add_service' && (
                <AddServiceModal
                    key="add_service"
                    isOpen={true}
                    onClose={() => actions.setActiveModal('none')}
                    editingService={state.editingServiceFull ?? null}
                    categories={CATEGORIES_DATA}
                    onSubmit={actions.handleServiceSubmit}
                />
            )}

            {state.activeModal === 'report' && (
                <ReportModal
                    key="report"
                    isOpen={true}
                    onClose={() => actions.setActiveModal('none')}
                    type={state.reportData?.type || null}
                    onSubmit={handleReportSubmit}
                />
            )}

            {state.activeModal === 'support' && (
                <SupportModal
                    key="support"
                    isOpen={true}
                    onClose={() => actions.setActiveModal('none')}
                    context={state.supportContext}
                    onToast={actions.addToast}
                />
            )}
            {!!state.activeSupportTicketId && (
                <SupportTicketModal
                    key="support-ticket"
                    ticketId={state.activeSupportTicketId}
                    isOpen={true}
                    onClose={() => actions.closeSupportTicket()}
                    onToast={actions.addToast}
                />
            )}
        </AnimatePresence>
    );
};