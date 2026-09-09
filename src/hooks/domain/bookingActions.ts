import { apiClient } from '../../services/apiClient';
import type { ApiMessage } from '../../services/chatService';
import type { Service, ToastType } from '../../types';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import type { QueryClient } from '@tanstack/react-query';

export interface BookingPayload {
    type: 'offer' | 'request';
    servicePublicId: string;
    date?: string;
    time?: string;
    address?: string;
    notes?: string;
    addressLat?: number;
    addressLng?: number;
    message?: string;
    proposedPrice?: number;
    availableFrom?: string;
}

interface BookingSubmitDeps {
    selectedService: Service | null;
    addToast: (msg: string, type?: ToastType) => void;
    router: AppRouterInstance;
    refetchChats: () => void;
    setCurrentChatId: (id: string | null) => void;
    setCurrentChatServiceId: (id: string | null) => void;
    setIsBookingLoading: (v: boolean) => void;
}

export async function submitBooking(e: React.FormEvent, deps: BookingSubmitDeps): Promise<void> {
    e.preventDefault();
    const { selectedService, addToast, router, refetchChats, setCurrentChatId, setCurrentChatServiceId, setIsBookingLoading } = deps;
    setIsBookingLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const service = selectedService;
    if (!service) { setIsBookingLoading(false); return; }

    try {
        const payload: BookingPayload = { type: service.type, servicePublicId: service.publicId ?? '' };
        if (service.type === 'offer') {
            payload.date = formData.get('date') as string;
            payload.time = formData.get('time') as string;
            payload.address = formData.get('address') as string || undefined;
            payload.notes = formData.get('notes') as string || undefined;
            const lat = formData.get('addressLat');
            const lng = formData.get('addressLng');
            if (lat && lng) {
                payload.addressLat = parseFloat(lat as string);
                payload.addressLng = parseFloat(lng as string);
            } else if (payload.address) {
                try {
                    const geoRes = await apiClient.get(`/public/address?query=${encodeURIComponent(payload.address)}`);
                    const geoJson = await geoRes.json();
                    if (geoJson.data?.[0]) {
                        payload.addressLat = geoJson.data[0].lat;
                        payload.addressLng = geoJson.data[0].lng;
                    }
                } catch { /* geo lookup failed — proceed without coords */ }
            }
        } else {
            payload.message = formData.get('message') as string;
            const pp = formData.get('proposed_price');
            if (pp) payload.proposedPrice = parseFloat(pp as string);
            payload.availableFrom = formData.get('available_from') as string || undefined;
        }

        const res = await apiClient.post('/bookings', payload as unknown as Record<string, unknown>);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Błąd rezerwacji');

        addToast(service.type === 'request' ? 'Oferta wysłana!' : 'Prośba wysłana!', 'success');

        if (json.chatId) {
            const chatId = String(json.chatId);
            setCurrentChatId(chatId);
            setCurrentChatServiceId(service.publicId ?? null);
            refetchChats();
            if (typeof window !== 'undefined') sessionStorage.setItem('__openChat__', chatId);
            router.back();
        } else {
            router.back();
        }
    } catch (err: unknown) {
        addToast((err as Error).message || 'Błąd rezerwacji', 'error');
    } finally {
        setIsBookingLoading(false);
    }
}

interface BookingActionDeps {
    addToast: (msg: string, type?: ToastType) => void;
    queryClient: QueryClient;
    setCurrentChatId: (id: string | null) => void;
    setActiveModal: (m: 'none' | 'chat_detail' | 'add_service' | 'report' | 'support') => void;
}

export async function executeBookingAction(
    chatId: string | null,
    bookingId: number | string,
    action: 'accept' | 'decline' | 'cancel' | 'complete',
    deps: BookingActionDeps,
): Promise<void> {
    const { addToast, queryClient } = deps;
    try {
        let res: Response;
        if (action === 'complete') {
            res = await apiClient.post(`/bookings/${bookingId}/complete`, {});
        } else {
            const statusMap = { accept: 'accepted', decline: 'declined', cancel: 'cancelled' } as const;
            res = await apiClient.patch(`/bookings/${bookingId}`, { status: statusMap[action as keyof typeof statusMap] });
        }
        if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            throw new Error((errJson as { message?: string }).message || `Błąd (${res.status})`);
        }
        const newStatus = action === 'complete' ? 'completed'
            : action === 'accept' ? 'accepted'
            : action === 'decline' ? 'declined'
            : 'cancelled';
        if (chatId) {
            queryClient.setQueryData<ApiMessage[]>(['chat-messages', chatId], (old) => {
                if (!old || !Array.isArray(old)) return old;
                return old.map((msg: ApiMessage) =>
                    msg.bookingData?.id !== null && msg.bookingData?.id !== undefined && String(msg.bookingData.id) === String(bookingId)
                        ? { ...msg, bookingData: { ...msg.bookingData, status: newStatus } }
                        : msg
                );
            });
        }
        queryClient.invalidateQueries({ queryKey: ['chats'] });
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
        const labels = { accept: 'Zaakceptowano!', decline: 'Odrzucono.', cancel: 'Anulowano.', complete: 'Zakończono!' };
        addToast(labels[action], action === 'accept' || action === 'complete' ? 'success' : 'info');
    } catch (err: unknown) {
        addToast((err as Error).message || 'Błąd', 'error');
    }
}

interface RescheduleDeps {
    addToast: (msg: string, type?: ToastType) => void;
    queryClient: QueryClient;
    setCurrentChatId: (id: string | null) => void;
    setActiveModal: (m: 'none' | 'chat_detail' | 'add_service' | 'report' | 'support') => void;
}

export async function rescheduleBooking(
    _chatId: string | null,
    bookingId: number | string,
    newDate: string,
    newTime: string | undefined,
    deps: RescheduleDeps,
): Promise<void> {
    const { addToast, queryClient, setCurrentChatId, setActiveModal } = deps;
    try {
        const res = await apiClient.patch(`/bookings/${bookingId}/reschedule`, { date: newDate, time: newTime });
        if (!res.ok) throw new Error('Błąd zmiany terminu');
        const json = await res.json() as { chatId?: string };
        queryClient.invalidateQueries({ queryKey: ['bookings'] });
        queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
        addToast('Termin zmieniony!', 'success');
        if (json.chatId) {
            setCurrentChatId(json.chatId);
            setActiveModal('chat_detail');
        }
    } catch (err: unknown) {
        addToast((err as Error).message || 'Błąd zmiany terminu', 'error');
    }
}
