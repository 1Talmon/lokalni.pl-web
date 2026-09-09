import { useState } from 'react';
import type { Service } from '../../types';
import type { ReportType } from '../../types/appTypes';

export const useModalState = () => {
    const [activeModal, setActiveModal] = useState<'none' | 'chat_detail' | 'add_service' | 'report' | 'support'>('none');
    const [showNotifications, setShowNotifications] = useState(false);
    const [reportData, setReportData] = useState<{ type: 'service' | 'profile' | 'review'; id: number | string } | null>(null);
    const [supportContext, setSupportContext] = useState<{ bookingId?: number; category?: string } | null>(null);
    const [activeSupportTicketId, setActiveSupportTicketId] = useState<string | null>(null);
    const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
    const [editingServiceFull, setEditingServiceFull] = useState<Service | null>(null);

    const openReportModal = (type: ReportType, id: number | string) => {
        setReportData({ type, id });
        setActiveModal('report');
    };

    const openSupportModal = (context?: { bookingId?: number; category?: string }) => {
        setSupportContext(context ?? null);
        setActiveModal('support');
    };

    return {
        activeModal, setActiveModal,
        showNotifications, setShowNotifications,
        reportData, supportContext,
        activeSupportTicketId, setActiveSupportTicketId,
        editingServiceId, setEditingServiceId,
        editingServiceFull, setEditingServiceFull,
        openReportModal, openSupportModal,
        openSupportTicket: (id: string) => setActiveSupportTicketId(id),
        closeSupportTicket: () => setActiveSupportTicketId(null),
    };
};
