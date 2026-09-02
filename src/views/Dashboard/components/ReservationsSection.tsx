'use client';
import { useState, useEffect, useRef } from 'react';
import { Calendar, MapPin, Banknote, MessageSquare, CheckCircle, XCircle, X, PartyPopper, Pencil, Clock } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useBookings, BookingEvent } from '../../../hooks/useBookings';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../../../plugins/NativeNav';
import type { BookingStatus } from '../../../types';
import { MapNavigationButton } from '../../../components/ui/MapNavigationButton';
import { RescheduleSheet } from '../../../components/modals/RescheduleSheet';

type Tab = 'incoming' | 'outgoing' | 'history';

interface ReservationsSectionProps {
    isLoggedIn?: boolean;
    initialTab?: Tab;
    initialBookingId?: number;
    onBookingAction?: (chatId: string | null, bookingId: number | string, action: 'accept' | 'decline' | 'cancel' | 'complete') => Promise<void>;
    onReschedule?: (chatId: string | null, bookingId: number | string, newDate: string, newTime?: string) => void;
    addToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
    onOpenChat?: (chatId: string) => void;
}

const STATUS_LABELS: Record<BookingStatus, string> = {
    pending:   'Oczekuje',
    accepted:  'Zaakceptowana',
    declined:  'Odrzucona',
    cancelled: 'Anulowana',
    completed: 'Zakończona',
    reviewed:  'Oceniona',
};
const STATUS_STYLES: Record<BookingStatus, string> = {
    pending:   'bg-amber-50 text-amber-600 border border-amber-100',
    accepted:  'bg-emerald-50 text-emerald-600 border border-emerald-100',
    declined:  'bg-red-50 text-red-500 border border-red-100',
    cancelled: 'bg-gray-100 text-gray-400 border border-gray-200',
    completed: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    reviewed:  'bg-violet-50 text-violet-600 border border-violet-100',
};

function formatDate(d: string | null): string | null {
    if (!d) return null
    const s = d.slice(0, 10)
    const [y, m, day] = s.split('-')
    if (!y || !m || !day) return d
    return `${day}.${m}.${y}`
}

const EmptyState = ({ tab }: { tab: Tab }) => {
    const cfg = {
        incoming: { title: 'Brak oczekujących próśb',      desc: 'Gdy ktoś zamówi Twoją usługę, pojawi się tutaj.' },
        outgoing: { title: 'Brak oczekujących rezerwacji',  desc: 'Twoje prośby o rezerwację pojawią się tutaj.' },
        history:  { title: 'Historia jest pusta',           desc: 'Zakończone rezerwacje pojawią się tutaj.' },
    }[tab];
    return (
        <div className="w-full min-h-[160px] border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center gap-2 py-10 px-6 text-center">
            <p className="text-sm font-bold text-gray-700">{cfg.title}</p>
            <p className="text-xs text-gray-400 font-medium">{cfg.desc}</p>
        </div>
    );
};

const BookingCard = ({ ev, onAccept, onDecline, onCancel, onComplete, onReschedule, onMessage, showActions, highlighted, containerRef }: {
    ev: BookingEvent;
    onAccept?: () => void;
    onDecline?: () => void;
    onCancel?: () => void;
    onComplete?: () => void;
    onReschedule?: (newDate: string, newTime?: string) => void;
    onMessage?: () => void;
    showActions: boolean;
    highlighted?: boolean;
    containerRef?: React.RefObject<HTMLDivElement>;
}) => {
    const [imgError, setImgError] = useState(false);
    const [showReschedule, setShowReschedule] = useState(false);
    const router = useRouter();
    const b = ev.booking;
    const isPending = b.status === 'pending';
    const isAcceptedIncoming = b.status === 'accepted' && !ev.isOutgoing;

    return (
        <div
            ref={containerRef as React.RefObject<HTMLDivElement>}
            className={`bg-white p-5 rounded-[2rem] border shadow-sm hover:shadow-md transition-all ${highlighted ? 'border-indigo-300 shadow-indigo-100 ring-2 ring-indigo-200/60' : 'border-gray-100'}`}
        >
            <div className="flex gap-4">
                {/* Miniaturka — link do posta usługi */}
                <button
                    type="button"
                    onClick={async () => { if (Capacitor.isNativePlatform()) { sessionStorage.setItem('nav_scroll_' + window.location.pathname, String(window.scrollY)); await NativeNav.push().catch(() => {}); } router.push(`/service/${b.servicePublicId}`); }}
                    className="w-14 h-14 bg-indigo-50 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center active:scale-95 transition-transform"
                >
                    {!imgError && b.serviceImage ? (
                        <img
                            src={b.serviceImage}
                            onError={() => setImgError(true)}
                            className="w-full h-full object-cover"
                            alt=""
                        />
                    ) : (
                        <Calendar size={20} className="text-indigo-300" />
                    )}
                </button>

                {/* Treść */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                            <button
                                type="button"
                                onClick={async () => { if (Capacitor.isNativePlatform()) { sessionStorage.setItem('nav_scroll_' + window.location.pathname, String(window.scrollY)); await NativeNav.push().catch(() => {}); } router.push(`/service/${b.servicePublicId}`); }}
                                className="font-bold text-gray-900 text-sm leading-tight text-left line-clamp-2 hover:text-indigo-600 transition-colors active:opacity-70"
                            >
                                {b.serviceTitle || 'Rezerwacja'}
                            </button>
                            <p className="text-xs text-gray-400 font-medium truncate">{ev.otherPartyName}</p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-xl text-[10px] font-bold whitespace-nowrap shrink-0 ${STATUS_STYLES[b.status]}`}>
                            {STATUS_LABELS[b.status]}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-2">
                        {b.date && (
                            <span className="flex items-center gap-1">
                                <Calendar size={11} className="text-indigo-400 shrink-0" />
                                {formatDate(b.date)}{b.time ? ` · ${b.time}` : ''}
                            </span>
                        )}
                        {b.address && (
                            <div className="flex items-center gap-1.5 w-full">
                                <MapPin size={11} className="text-indigo-400 shrink-0" />
                                <span className="flex-1 leading-snug">{b.address}</span>
                                {b.addressLat && b.addressLng && (
                                    <MapNavigationButton
                                        lat={b.addressLat}
                                        lng={b.addressLng}
                                        label={b.address}
                                        buttonClassName="p-1.5 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 active:scale-90 transition-all shrink-0"
                                        iconSize={14}
                                    />
                                )}
                            </div>
                        )}
                        <span className="flex items-center gap-1 font-bold text-gray-700">
                            <Banknote size={11} className="text-indigo-400 shrink-0" />
                            {b.proposedPrice
                                ? `${b.proposedPrice.toLocaleString('pl-PL')} zł`
                                : b.price
                                ? `${b.price.toLocaleString('pl-PL')} zł ${b.priceUnit || ''}`.trim()
                                : '—'}
                        </span>
                    </div>

                    {(b.message || b.notes) && (
                        <p className="mt-1.5 text-[11px] text-gray-400 italic line-clamp-1">
                            „{b.message || b.notes}"
                        </p>
                    )}
                </div>
            </div>

            {/* Akcje */}
            <div className="mt-4 pt-4 border-t border-gray-50 flex flex-col lg:flex-row lg:flex-wrap gap-2">
                {/* Rząd główny — na desktop staje się częścią flex-row rodzica */}
                <div className="flex gap-2 lg:contents">
                    {showActions && isPending && !ev.isOutgoing && (
                        <>
                            <button
                                onClick={onDecline}
                                className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2.5 lg:px-4 rounded-xl text-xs font-bold text-red-500 border border-red-100 hover:bg-red-50 transition-all active:scale-95"
                            >
                                <XCircle size={14} /> Odrzuć
                            </button>
                            <button
                                onClick={onAccept}
                                className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2.5 lg:px-4 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200"
                            >
                                <CheckCircle size={14} /> Akceptuj
                            </button>
                        </>
                    )}
                    {showActions && isPending && ev.isOutgoing && (
                        <button
                            onClick={onCancel}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2.5 lg:px-4 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-200 active:scale-95 transition-all"
                        >
                            <X size={14} /> Anuluj prośbę
                        </button>
                    )}
                    {isAcceptedIncoming && onComplete && (
                        <button
                            onClick={onComplete}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2.5 lg:px-4 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-sm shadow-emerald-200"
                        >
                            <PartyPopper size={14} /> Zakończ zlecenie
                        </button>
                    )}
                    {showActions && isAcceptedIncoming && onCancel && (
                        <button
                            onClick={onCancel}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2.5 lg:px-4 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-200 active:scale-95 transition-all"
                        >
                            <X size={14} /> Anuluj
                        </button>
                    )}
                </div>
                {/* Klient — anuluj po akceptacji */}
                {showActions && b.status === 'accepted' && ev.isOutgoing && onCancel && (
                    <div className="flex gap-2 lg:contents">
                        <button
                            onClick={onCancel}
                            className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2.5 lg:px-4 border border-gray-200 text-gray-500 rounded-xl text-xs font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-200 active:scale-95 transition-all"
                        >
                            <X size={14} /> Anuluj
                        </button>
                    </div>
                )}
                {/* Rząd drugorzędny */}
                <div className="flex gap-2 lg:contents">
                    {onReschedule && b.date !== undefined && (isPending || b.status === 'accepted') && b.type !== 'request' && (
                        <button
                            onClick={() => setShowReschedule(v => !v)}
                            className={`flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2.5 lg:px-4 rounded-xl text-xs font-bold transition-all active:scale-95 ${showReschedule ? 'bg-indigo-600 text-white' : 'text-indigo-600 border border-indigo-100 bg-indigo-50 hover:bg-indigo-100'}`}
                        >
                            <Pencil size={13} /> Zmień termin
                        </button>
                    )}
                    <button
                        onClick={() => onMessage ? onMessage() : router.push('/chat')}
                        className="flex-1 lg:flex-none flex items-center justify-center gap-1.5 py-2.5 lg:px-4 text-xs font-bold text-gray-400 rounded-xl border border-gray-100 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all"
                    >
                        <MessageSquare size={13} /> Wiadomość
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showReschedule && onReschedule && (
                    <RescheduleSheet
                        servicePublicId={b.servicePublicId}
                        onConfirm={(date, time) => onReschedule(date, time)}
                        onClose={() => setShowReschedule(false)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export const ReservationsSection = ({ isLoggedIn = false, initialTab, initialBookingId, onBookingAction, onReschedule, onOpenChat }: ReservationsSectionProps) => {
    const [tab, setTab] = useState<Tab>(initialTab ?? 'incoming');
    const autoSwitched = useRef(false);
    const prevBookingIdRef = useRef<number | undefined>(undefined);
    const highlightRef = useRef<HTMLDivElement | null>(null);
    const { pendingIncoming, acceptedIncoming, pendingOutgoing, acceptedOutgoing, history, isLoading } = useBookings(isLoggedIn);

    useEffect(() => {
        if (isLoading) return;

        // Ciepła nawigacja: nowy bookingId — reset flagi i przewiń do karty
        if (initialBookingId && initialBookingId !== prevBookingIdRef.current) {
            prevBookingIdRef.current = initialBookingId;
            autoSwitched.current = false;
        }

        if (autoSwitched.current) return;
        autoSwitched.current = true;

        if (initialBookingId) {
            const allBookings = [...pendingIncoming, ...acceptedIncoming, ...pendingOutgoing, ...acceptedOutgoing, ...history];
            const found = allBookings.find(ev => Number(ev.booking.id) === initialBookingId);
            if (found) {
                if (!found.isOutgoing && (found.booking.status === 'pending' || found.booking.status === 'accepted')) setTab('incoming');
                else if (found.isOutgoing && (found.booking.status === 'pending' || found.booking.status === 'accepted')) setTab('outgoing');
                else setTab('history');
            }
            setTimeout(() => highlightRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 400);
            return;
        }

        const hasIncoming = pendingIncoming.length > 0 || acceptedIncoming.length > 0;
        if (hasIncoming) return;
        if (pendingOutgoing.length > 0 || acceptedOutgoing.length > 0) setTab('outgoing');
    }, [isLoading, initialBookingId]); // eslint-disable-line react-hooks/exhaustive-deps

    const tabs: { key: Tab; label: string; count?: number }[] = [
        { key: 'incoming', label: 'Przychodzące', count: (pendingIncoming.length + acceptedIncoming.length) || undefined },
        { key: 'outgoing', label: 'Wychodzące',   count: (pendingOutgoing.length + acceptedOutgoing.length) || undefined },
        { key: 'history',  label: 'Historia' },
    ];

    const renderCard = (ev: BookingEvent, showActions: boolean) => {
        const isHighlighted = !!initialBookingId && Number(ev.booking.id) === initialBookingId;
        return (
            <BookingCard
                key={String(ev.booking.id)}
                ev={ev}
                showActions={showActions}
                highlighted={isHighlighted}
                containerRef={isHighlighted ? highlightRef : undefined}
                onAccept={() => onBookingAction?.(null, ev.booking.id, 'accept')}
                onDecline={() => onBookingAction?.(null, ev.booking.id, 'decline')}
                onCancel={() => onBookingAction?.(null, ev.booking.id, 'cancel')}
                onComplete={() => onBookingAction?.(null, ev.booking.id, 'complete')}
                onReschedule={onReschedule ? (newDate, newTime) => onReschedule(null, ev.booking.id, newDate, newTime) : undefined}
                onMessage={ev.booking.chatId && onOpenChat ? () => onOpenChat(ev.booking.chatId!) : undefined}
            />
        );
    };

    return (
        <div className="space-y-6 text-left font-sans pb-10 w-full">

            {/* Nagłówek — nie zmieniać */}
            <div>
                <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-1">Rezerwacje</h3>
                <p className="text-gray-500 font-medium text-sm">Zarządzaj przychodzącymi i wychodzącymi rezerwacjami.</p>
            </div>

            {/* Tabs */}
            <div className="bg-gray-100 rounded-2xl p-1 flex gap-1">
                {tabs.map(({ key, label, count }) => (
                    <button
                        key={key}
                        onClick={() => setTab(key)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                            tab === key
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500'
                        }`}
                    >
                        {label}
                        {count !== undefined && (
                            <span className={`w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-black ${
                                tab === key ? 'bg-[#6366F1] text-white' : 'bg-gray-300 text-gray-500'
                            }`}>
                                {count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Zawartość zakładek */}
            <div className="space-y-6 w-full">
                {isLoading && (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-[2rem] border border-gray-100 h-32 animate-pulse" />
                        ))}
                    </div>
                )}
                {!isLoading && tab === 'incoming' && (
                    <>
                        {pendingIncoming.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-500 flex items-center gap-2">
                                    <PartyPopper size={11} /> Do akceptacji
                                </p>
                                <div className="grid grid-cols-1 gap-4">
                                    {pendingIncoming.map(ev => renderCard(ev, true))}
                                </div>
                            </div>
                        )}
                        {acceptedIncoming.length > 0 && (
                            <div className="space-y-3">
                                {pendingIncoming.length > 0 && (
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-500">Aktywne — do zakończenia</p>
                                )}
                                <div className="grid grid-cols-1 gap-4">
                                    {acceptedIncoming.map(ev => renderCard(ev, true))}
                                </div>
                            </div>
                        )}
                        {acceptedIncoming.length === 0 && pendingIncoming.length === 0 && <EmptyState tab="incoming" />}
                    </>
                )}

                {!isLoading && tab === 'outgoing' && (
                    <>
                        {acceptedOutgoing.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-500">Potwierdzone</p>
                                <div className="grid grid-cols-1 gap-4">
                                    {acceptedOutgoing.map(ev => renderCard(ev, true))}
                                </div>
                            </div>
                        )}
                        {pendingOutgoing.length > 0 && (
                            <div className="space-y-3">
                                {acceptedOutgoing.length > 0 && (
                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-amber-500">Oczekujące</p>
                                )}
                                <div className="grid grid-cols-1 gap-4">
                                    {pendingOutgoing.map(ev => renderCard(ev, true))}
                                </div>
                            </div>
                        )}
                        {acceptedOutgoing.length === 0 && pendingOutgoing.length === 0 && <EmptyState tab="outgoing" />}
                    </>
                )}

                {!isLoading && tab === 'history' && (
                    <div className="space-y-3">
                        {history.length > 0 && (
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 flex items-center gap-2">
                                <Clock size={11} /> Zakończone
                            </p>
                        )}
                        <div className="grid grid-cols-1 gap-4">
                            {history.length === 0 ? <EmptyState tab="history" /> : history.map(ev => renderCard(ev, false))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
