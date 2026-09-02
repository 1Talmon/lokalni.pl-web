'use client';
import Image from 'next/image';
import { Calendar, MapPin, MessageSquare, Banknote, CheckCircle, XCircle, X, Globe, Star, PartyPopper, Pencil, ExternalLink, Clock } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../../plugins/NativeNav';
import { AnimatePresence } from 'framer-motion';
import { createServiceUrl } from '../../utils/helpers';
import type { BookingData, BookingStatus } from '../../types';
import { RescheduleSheet } from '../modals/RescheduleSheet';
import { MapNavigationButton } from '../ui/MapNavigationButton';

interface BookingCardProps {
    booking: BookingData;
    isMe: boolean;
    isOutdated?: boolean;
    onAccept?: () => void;
    onDecline?: () => void;
    onCancel?: () => void;
    onComplete?: () => void;
    onReview?: () => void;
    onReschedule?: (newDate: string, newTime?: string) => void;
    onClose?: () => void;
    onGoToReservations?: () => void;
    onRescheduleSheetToggle?: (open: boolean) => void;
}

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string; border: string }> = {
    pending:   { label: 'Oczekuje',      color: 'text-amber-600',  bg: 'bg-amber-50',   border: 'border-amber-100' },
    accepted:  { label: 'Zaakceptowano', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    declined:  { label: 'Odrzucono',     color: 'text-red-600',    bg: 'bg-red-50',     border: 'border-red-100' },
    cancelled: { label: 'Anulowano',     color: 'text-slate-500',  bg: 'bg-slate-50',   border: 'border-slate-100' },
    completed: { label: 'Zakończono',    color: 'text-indigo-600', bg: 'bg-indigo-50',  border: 'border-indigo-100' },
    reviewed:  { label: 'Oceniono',      color: 'text-violet-600', bg: 'bg-violet-50',  border: 'border-violet-100' },
};

const StatusBadge = ({ status, clientReviewed }: { status: BookingStatus; clientReviewed?: boolean }) => {
    const isExpired = status === 'reviewed' && !clientReviewed;
    const cfg = isExpired
        ? { label: 'Bez oceny', color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-100' }
        : STATUS_CONFIG[status];
    const icons: Record<BookingStatus, React.ReactNode> = {
        pending:   <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />,
        accepted:  <CheckCircle size={11} />,
        declined:  <XCircle size={11} />,
        cancelled: <X size={11} />,
        completed: <PartyPopper size={11} />,
        reviewed:  <Star size={11} className="fill-current" />,
    };
    const icon = isExpired ? <Clock size={11} /> : icons[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            {icon} {cfg.label}
        </span>
    );
};

export const BookingCard = ({ booking, isMe, isOutdated, onAccept, onDecline, onCancel, onComplete, onReview, onReschedule, onClose: _onClose, onGoToReservations, onRescheduleSheetToggle }: BookingCardProps) => {
    const isRequest = booking.serviceType === 'request';
    const isDone = booking.status !== 'pending';
    const isCompleted = booking.status === 'completed' || booking.status === 'reviewed';
    const [showReschedule, setShowReschedule] = useState(false);
    const router = useRouter();

    const createdAtLabel = booking.createdAt
        ? new Date(booking.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        : '';

    if (isOutdated) {
        return (
            <div className="w-[280px] rounded-2xl border border-slate-100 bg-slate-50 opacity-60 overflow-hidden">
                <div className="relative h-16 overflow-hidden">
                    <Image src={booking.serviceImage} alt="" fill className="object-cover grayscale" sizes="280px" />
                    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/80 flex items-center gap-1.5">
                            <Calendar size={10} /> Zmieniono termin
                        </span>
                    </div>
                </div>
                <div className="px-4 py-2.5 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium truncate">{booking.serviceTitle}</span>
                    {booking.date && <span className="text-xs text-slate-400 line-through shrink-0 ml-2">{booking.date}</span>}
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="w-[280px] bg-white rounded-2xl border border-slate-100 shadow-md">
            {/* Header ze zdjęciem — klikalny */}
            <div
                className="relative h-28 cursor-pointer group overflow-hidden rounded-t-2xl"
                onClick={async () => { if (!booking.servicePublicId) return; if (Capacitor.isNativePlatform()) await NativeNav.push({ fullScreen: true }).catch(() => {}); router.push(`/service/${createServiceUrl(booking.serviceTitle, booking.servicePublicId)}`); }}
            >
                <Image src={booking.serviceImage} alt={booking.serviceTitle} fill className="object-cover group-hover:brightness-90 transition-all" sizes="280px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                {booking.servicePublicId && (
                    <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink size={12} className="text-white" />
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60 mb-0.5">
                        {isRequest ? 'Aplikacja do zlecenia' : 'Prośba o rezerwację'}
                    </p>
                    <h4 className="font-black text-white text-sm leading-tight line-clamp-1">{booking.serviceTitle}</h4>
                </div>
            </div>

            {/* Szczegóły */}
            <div className="p-4 space-y-2.5">
                <div
                    className={onGoToReservations && !isCompleted ? 'cursor-pointer' : ''}
                    onClick={onGoToReservations && !isCompleted ? onGoToReservations : undefined}
                >
                <div className="flex items-center justify-between">
                    <StatusBadge status={booking.status} clientReviewed={booking.clientReviewed} />
                    <span className="text-xs text-slate-400">{createdAtLabel}</span>
                </div>

                <div className="space-y-1.5 text-sm mt-2.5">
                    {isRequest ? (
                        <>
                            {booking.message && (
                                <div className="flex items-start gap-2 text-slate-600">
                                    <MessageSquare size={13} className="text-indigo-400 shrink-0 mt-0.5" />
                                    <span className="line-clamp-2 text-xs leading-relaxed">{booking.message}</span>
                                </div>
                            )}
                            {booking.proposedPrice && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Banknote size={13} className="text-indigo-400 shrink-0" />
                                    <span className="text-xs font-bold text-slate-900">{booking.proposedPrice} zł</span>
                                    <span className="text-xs text-slate-400">proponowana cena</span>
                                </div>
                            )}
                            {booking.availableFrom && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Calendar size={13} className="text-indigo-400 shrink-0" />
                                    <span className="text-xs">Dostępny od: <strong className="text-slate-900">{booking.availableFrom}</strong></span>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {booking.date && (
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Calendar size={13} className="text-indigo-400 shrink-0" />
                                    <span className="text-xs font-bold text-slate-900">{booking.date}</span>
                                    {booking.time && <span className="text-xs text-slate-400">{booking.time}</span>}
                                </div>
                            )}
                            {booking.address ? (
                                <div className="flex items-start gap-2 text-slate-600">
                                    <MapPin size={13} className="text-indigo-400 shrink-0 mt-0.5" />
                                    <span className="text-xs flex-1 leading-relaxed">{booking.address}</span>
                                    {booking.addressLat && booking.addressLng && (
                                        <MapNavigationButton
                                            lat={booking.addressLat}
                                            lng={booking.addressLng}
                                            label={booking.address}
                                            buttonClassName="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 active:scale-90 transition-all shrink-0"
                                            iconSize={14}
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Globe size={13} className="text-indigo-400 shrink-0" />
                                    <span className="text-xs">Zdalnie / Online</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <Banknote size={13} className="text-indigo-400 shrink-0" />
                                <span className="text-xs font-bold text-slate-900">{booking.price} {booking.priceUnit}</span>
                            </div>
                            {booking.notes && (
                                <div className="flex items-start gap-2 text-slate-500">
                                    <MessageSquare size={13} className="text-indigo-400 shrink-0 mt-0.5" />
                                    <span className="text-xs line-clamp-2 italic">{booking.notes}</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
                </div>

                {/* Akcje */}
                {!isDone && (
                    <div className="pt-2 border-t border-slate-50 space-y-2">
                        {/* Wykonawca/Zleceniodawca (nie ja) — może akceptować lub odrzucić */}
                        {!isMe && (
                            <div className="flex gap-2">
                                <button
                                    onClick={onDecline}
                                    className="flex-1 py-2 rounded-xl text-xs font-black border border-slate-200 text-slate-500 hover:bg-slate-50 active:scale-95 transition-all"
                                >
                                    Odrzuć
                                </button>
                                <button
                                    onClick={onAccept}
                                    className="flex-1 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200"
                                >
                                    Akceptuj
                                </button>
                            </div>
                        )}
                        {/* Ja (klient) — mogę anulować i zmienić termin */}
                        {isMe && (
                            <div className="flex gap-2">
                                <button
                                    onClick={onCancel}
                                    className="flex-1 py-2 rounded-xl text-xs font-black border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 active:scale-95 transition-all"
                                >
                                    Anuluj prośbę
                                </button>
                                {onReschedule && !isRequest && (
                                    <button
                                        onClick={() => { setShowReschedule(true); onRescheduleSheetToggle?.(true); }}
                                        className="flex-1 py-2 rounded-xl text-xs font-black border border-indigo-100 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Pencil size={11} /> Zmień termin
                                    </button>
                                )}
                            </div>
                        )}
                        {onReschedule && !isMe && !isRequest && (
                            <button
                                onClick={() => { setShowReschedule(true); onRescheduleSheetToggle?.(true); }}
                                className="w-full py-2 rounded-xl text-xs font-black border border-indigo-100 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                            >
                                <Pencil size={11} /> Zmień termin
                            </button>
                        )}
                    </div>
                )}

                {/* Status końcowy — accepted */}
                {isDone && booking.status === 'accepted' && (
                    <div className="pt-2 border-t border-slate-50 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-600">
                            <CheckCircle size={13} />
                            <span className="text-xs font-bold">
                                {isRequest ? 'Oferta zaakceptowana — skontaktujcie się!' : 'Termin potwierdzony — do zobaczenia!'}
                            </span>
                        </div>
                        {/* Wykonawca (isMe=false) może oznaczyć jako zakończone, zmienić termin i anulować */}
                        {!isMe && onComplete && (
                            <button
                                onClick={onComplete}
                                className="w-full py-2 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-200"
                            >
                                <CheckCircle size={11} /> Zakończyłem zlecenie
                            </button>
                        )}
                        {!isMe && onCancel && (
                            <button
                                onClick={onCancel}
                                className="w-full py-2 rounded-xl text-xs font-black border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 active:scale-95 transition-all"
                            >
                                Anuluj rezerwację
                            </button>
                        )}
                        {onReschedule && !isMe && !isRequest && (
                            <button
                                onClick={() => { setShowReschedule(true); onRescheduleSheetToggle?.(true); }}
                                className="w-full py-2 rounded-xl text-xs font-black border border-indigo-100 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                            >
                                <Pencil size={11} /> Zmień termin
                            </button>
                        )}
                        {/* Klient (isMe=true) może anulować i zaproponować zmianę terminu */}
                        {isMe && !isRequest && (
                            <div className="flex gap-2">
                                {onCancel && (
                                    <button
                                        onClick={onCancel}
                                        className="flex-1 py-2 rounded-xl text-xs font-black border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 active:scale-95 transition-all"
                                    >
                                        Anuluj
                                    </button>
                                )}
                                {onReschedule && (
                                    <button
                                        onClick={() => { setShowReschedule(true); onRescheduleSheetToggle?.(true); }}
                                        className="flex-1 py-2 rounded-xl text-xs font-black border border-indigo-100 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Pencil size={11} /> Zmień termin
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Status końcowy — completed: klient może wystawić opinię */}
                {isCompleted && (
                    <div className="pt-2 border-t border-slate-50 space-y-2">
                        <div className="flex items-center gap-2 text-indigo-600">
                            <PartyPopper size={13} />
                            <span className="text-xs font-bold">Zlecenie zakończone!</span>
                        </div>
                        {isMe && booking.status === 'completed' && onReview && (
                            <button
                                onClick={onReview}
                                className="w-full py-2 rounded-xl text-xs font-black bg-amber-50 text-amber-600 border border-amber-100 hover:bg-amber-100 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                            >
                                <Star size={11} className="fill-amber-500 text-amber-500" /> Wystaw opinię
                            </button>
                        )}
                        {isMe && booking.status === 'reviewed' && booking.clientReviewed && (
                            <div className="flex items-center gap-1.5 text-violet-600 text-xs font-bold justify-center py-1">
                                <Star size={11} className="fill-violet-500 text-violet-500" /> Opinia wystawiona — dziękujemy!
                            </div>
                        )}
                        {isMe && booking.status === 'reviewed' && !booking.clientReviewed && (
                            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold justify-center py-1">
                                <Clock size={11} /> Czas na wystawienie opinii minął
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

            <AnimatePresence>
                {showReschedule && onReschedule && (
                    <RescheduleSheet
                        servicePublicId={booking.servicePublicId}
                        onConfirm={(date, time) => onReschedule(date, time)}
                        onClose={() => { setShowReschedule(false); onRescheduleSheetToggle?.(false); }}
                    />
                )}
            </AnimatePresence>
        </>
    );
};
