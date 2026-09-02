'use client';
import { Calendar, CheckCircle, X, Clock, PartyPopper, XCircle, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../../plugins/NativeNav';
import { createServiceUrl } from '../../utils/helpers';
import type { BookingData } from '../../types';

interface Props {
    booking: BookingData;
    isMe: boolean;
    onClose?: () => void;
    onGoToReservations?: () => void;
}

const STATUS_CHIP: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    pending:   { label: 'Oczekuje',      color: 'text-amber-600',   bg: 'bg-amber-50',   icon: <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> },
    accepted:  { label: 'Potwierdzona',  color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle size={10} /> },
    declined:  { label: 'Odrzucona',     color: 'text-red-500',     bg: 'bg-red-50',     icon: <XCircle size={10} /> },
    cancelled: { label: 'Anulowana',     color: 'text-slate-400',   bg: 'bg-slate-50',   icon: <X size={10} /> },
    completed: { label: 'Zakończona',    color: 'text-indigo-600',  bg: 'bg-indigo-50',  icon: <PartyPopper size={10} /> },
    reviewed:  { label: 'Oceniona',      color: 'text-violet-600',  bg: 'bg-violet-50',  icon: <CheckCircle size={10} /> },
};

const fmtDate = (d: string) => {
    try {
        return new Date(d + 'T12:00:00').toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return d; }
};

export const RecurringBookingCard = ({ booking, isMe: _isMe, onClose: _onClose, onGoToReservations }: Props) => {
    const router = useRouter();
    const series = booking.seriesBookings ?? [];
    const total = series.length;
    const active = series.filter(b => b.status !== 'cancelled' && b.status !== 'declined').length;

    return (
        <div className="w-[280px] bg-white rounded-2xl border border-slate-100 shadow-md overflow-hidden">
            {/* Header ze zdjęciem */}
            <div
                className="relative h-20 cursor-pointer group overflow-hidden"
                onClick={async () => {
                    if (!booking.servicePublicId) return;
                    if (Capacitor.isNativePlatform()) await NativeNav.push({ fullScreen: true }).catch(() => {});
                    router.push(`/service/${createServiceUrl(booking.serviceTitle, booking.servicePublicId)}`);
                }}
            >
                <img src={booking.serviceImage} alt={booking.serviceTitle} className="w-full h-full object-cover group-hover:brightness-90 transition-all" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                {booking.servicePublicId && (
                    <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink size={12} className="text-white" />
                    </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <Calendar size={9} className="text-indigo-300" />
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
                            Rezerwacje cykliczne
                        </p>
                    </div>
                    <h4 className="font-black text-white text-sm leading-tight line-clamp-1">{booking.serviceTitle}</h4>
                </div>
            </div>

            {/* Podsumowanie */}
            <div className="px-4 pt-3 pb-1 flex items-center justify-between border-b border-slate-50">
                <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
                        <Calendar size={12} className="text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black text-slate-800">{total} terminów</p>
                        <p className="text-[10px] text-slate-400 font-medium">{active} aktywnych</p>
                    </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                    {booking.price} {booking.priceUnit}
                </span>
            </div>

            {/* Lista terminów — klikalny obszar → rezerwacje */}
            <div
                className={`px-4 py-2.5 space-y-1.5 ${onGoToReservations ? 'cursor-pointer' : ''}`}
                onClick={onGoToReservations}
            >
                {series.slice(0, 3).map((s, i) => {
                    const chip = STATUS_CHIP[s.status] ?? STATUS_CHIP.pending;
                    return (
                        <div key={s.id} className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 w-4 shrink-0">{i + 1}.</span>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold text-slate-700 truncate">{fmtDate(s.date)}</p>
                                    {s.time && (
                                        <p className="text-[10px] text-slate-400 flex items-center gap-0.5">
                                            <Clock size={8} /> {s.time}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase shrink-0 ${chip.bg} ${chip.color}`}>
                                {chip.icon} {chip.label}
                            </span>
                        </div>
                    );
                })}
                {series.length > 3 && (
                    <p className="text-[10px] text-slate-400 font-bold text-center pt-0.5">
                        +{series.length - 3} więcej terminów
                    </p>
                )}
            </div>

        </div>
    );
};
