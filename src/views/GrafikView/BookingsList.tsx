'use client';
import { memo, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Ban, CalendarCheck, Calendar as CalendarIcon, MapPin, Globe,
    Clock, Banknote, ChevronRight, PartyPopper, X, Loader2, Save, Info,
} from 'lucide-react';
import { MapNavigationButton } from '../../components/ui/MapNavigationButton';
import type { BookingEvent } from '../../hooks/useBookings';
import { fmt, getTodayStr } from './helpers';

// ── PlanDayDetail ──────────────────────────────────────────────────────────────

export const PlanDayDetail = memo(({ selected, events, busyDays, onComplete, onOpenChat }: {
    selected: string;
    events: BookingEvent[];
    busyDays: string[];
    onComplete?: (id: number | string) => void;
    onOpenChat?: (chatId: string) => void;
}) => {
    const [showAll, setShowAll] = useState(false);
    const isBusy = busyDays.includes(selected);
    const sorted = [...events].sort((a, b) =>
        (a.booking.time || '99:99').localeCompare(b.booking.time || '99:99')
    );
    const LIMIT = 4;
    const visible = showAll ? sorted : sorted.slice(0, LIMIT);
    const hidden = sorted.length - LIMIT;
    const d = new Date(selected + 'T00:00');
    const isToday = selected === getTodayStr();
    const isTomorrow = selected === fmt(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1);
    const dateLabel = isToday ? 'Dziś' : isTomorrow ? 'Jutro'
        : d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                    <p className={`font-black text-base capitalize ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}>{dateLabel}</p>
                    {isBusy && (
                        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg">
                            <Ban size={9} /> Dzień wolny
                        </span>
                    )}
                </div>
                {events.length > 0 && (
                    <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-2.5 py-1 rounded-xl">
                        {events.length} {events.length === 1 ? 'zlecenie' : events.length < 5 ? 'zlecenia' : 'zleceń'}
                    </span>
                )}
            </div>
            {sorted.length === 0 ? (
                <div className="flex items-start gap-3 px-5 py-4">
                    <div className="w-10 shrink-0" />
                    <div className="w-0.5 self-stretch rounded-full bg-gray-100 shrink-0" />
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                        <CalendarCheck size={14} className="text-gray-200" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-sm font-bold text-gray-300 truncate">Brak zleceń</p>
                        <p className="text-xs text-gray-300 font-medium mt-0.5">w tym dniu</p>
                        <div className="flex items-center gap-1 mt-1.5">
                            <div className="w-14 h-2.5 bg-gray-100 rounded-full" />
                            <div className="w-10 h-2.5 bg-gray-100 rounded-full" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="divide-y divide-gray-50">
                    {visible.map(ev => (
                        <button
                            key={String(ev.booking.id)}
                            onClick={() => ev.booking.chatId && onOpenChat ? onOpenChat(ev.booking.chatId) : undefined}
                            className="w-full flex items-start gap-3 px-5 py-4 text-left active:bg-gray-50 transition-colors"
                        >
                            <div className="text-center w-10 shrink-0 pt-0.5">
                                <p className="text-xs font-black text-indigo-600 leading-none">{ev.booking.time || '—'}</p>
                            </div>
                            <div className={`w-0.5 self-stretch rounded-full shrink-0 ${ev.isOutgoing ? 'bg-teal-400' : 'bg-indigo-500'}`} />
                            {ev.booking.serviceImage
                                ? <Image src={ev.booking.serviceImage} width={40} height={40} className="rounded-xl object-cover shrink-0" alt="" />
                                : <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0"><CalendarIcon size={14} className="text-indigo-300" /></div>
                            }
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 text-sm truncate">{ev.booking.serviceTitle}</p>
                                <p className="text-xs text-gray-400 font-medium truncate">{ev.otherPartyName}</p>
                                <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-gray-500 font-medium">
                                    {ev.booking.address
                                        ? <div className="flex items-center gap-1.5 w-full">
                                            <MapPin size={10} className="text-indigo-400 shrink-0" />
                                            <span className="flex-1 leading-snug">{ev.booking.address}</span>
                                            {ev.booking.addressLat && ev.booking.addressLng && (
                                                <MapNavigationButton
                                                    lat={ev.booking.addressLat}
                                                    lng={ev.booking.addressLng}
                                                    label={ev.booking.address}
                                                    buttonClassName="p-1.5 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 active:scale-90 transition-all shrink-0"
                                                    iconSize={14}
                                                />
                                            )}
                                          </div>
                                        : <span className="flex items-center gap-1"><Globe size={10} className="text-indigo-400" />Online</span>}
                                    <span className="flex items-center gap-1 font-bold text-gray-700">
                                        <Banknote size={10} className="text-indigo-400" />{ev.booking.price} {ev.booking.priceUnit}
                                    </span>
                                </div>
                                {!ev.isOutgoing && onComplete && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onComplete(ev.booking.id); }}
                                        className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[11px] font-black active:scale-95 shadow-sm shadow-indigo-200 transition-all"
                                    >
                                        <PartyPopper size={11} /> Zakończyłem zlecenie
                                    </button>
                                )}
                            </div>
                            {ev.booking.chatId && onOpenChat && <ChevronRight size={14} className="text-gray-300 shrink-0 mt-1" />}
                        </button>
                    ))}
                    {!showAll && hidden > 0 && (
                        <button
                            onClick={() => setShowAll(true)}
                            className="w-full px-5 py-3 text-center text-xs font-bold text-indigo-500 hover:bg-indigo-50 active:bg-indigo-100 transition-colors"
                        >
                            Pokaż {hidden} więcej {hidden === 1 ? 'zlecenie' : hidden < 5 ? 'zlecenia' : 'zleceń'}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
});

PlanDayDetail.displayName = 'PlanDayDetail';

// ── DayPanel (desktop sidebar) ─────────────────────────────────────────────────

interface DayPanelProps {
    selected: string | null;
    events: BookingEvent[];
    busyDays: string[];
    onClose: () => void;
    onComplete?: (bookingId: number | string) => void;
}

export const DayPanel = memo(({ selected, events, busyDays, onClose, onComplete }: DayPanelProps) => (
    <AnimatePresence>
        {selected && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
                className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wybrany dzień</p>
                        <p className="font-bold text-gray-900 text-sm capitalize mt-0.5">
                            {new Date(selected + 'T00:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        {busyDays.includes(selected) && (
                            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg"><Ban size={9} /> Dzień wolny</span>
                        )}
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200 active:scale-90 transition-all shrink-0">
                        <X size={14} />
                    </button>
                </div>
                {events.length === 0 ? (
                    <div className="px-5 py-4 flex items-center gap-2.5 text-gray-400">
                        <CalendarCheck size={16} className="text-gray-200 shrink-0" />
                        <p className="text-sm font-medium">Brak zleceń w tym dniu</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {events.map(ev => (
                            <div key={String(ev.booking.id)} className="flex items-start gap-3 px-5 py-4">
                                <div className={`w-1 self-stretch rounded-full shrink-0 mt-1 ${ev.isOutgoing ? 'bg-emerald-400' : 'bg-indigo-500'}`} />
                                <Image src={ev.booking.serviceImage ?? ''} width={40} height={40} className="rounded-2xl object-cover shrink-0" alt="" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-sm truncate">{ev.booking.serviceTitle}</p>
                                    <p className="text-xs text-gray-400 font-medium">{ev.otherPartyName}</p>
                                    <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-gray-500 font-medium">
                                        {ev.booking.time && <span className="flex items-center gap-1"><Clock size={10} className="text-[#6366F1]" />{ev.booking.time}</span>}
                                        <span className="flex items-center gap-1 font-bold text-gray-700"><Banknote size={10} className="text-[#6366F1]" />{ev.booking.price} {ev.booking.priceUnit}</span>
                                        {ev.booking.address
                                            ? <div className="flex items-center gap-1.5 w-full">
                                                <MapPin size={10} className="text-[#6366F1] shrink-0" />
                                                <span className="flex-1 leading-snug">{ev.booking.address}</span>
                                                {ev.booking.addressLat && ev.booking.addressLng && (
                                                    <MapNavigationButton
                                                        lat={ev.booking.addressLat}
                                                        lng={ev.booking.addressLng}
                                                        label={ev.booking.address}
                                                        buttonClassName="p-1.5 rounded-lg bg-indigo-50 text-indigo-500 hover:bg-indigo-100 active:scale-90 transition-all shrink-0"
                                                        iconSize={14}
                                                    />
                                                )}
                                              </div>
                                            : <span className="flex items-center gap-1"><Globe size={10} className="text-[#6366F1]" />Online</span>}
                                    </div>
                                    {!ev.isOutgoing && onComplete && (
                                        <button onClick={() => onComplete(ev.booking.id)}
                                            className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-[11px] font-black hover:bg-indigo-700 active:scale-95 transition-all shadow-sm shadow-indigo-200">
                                            <PartyPopper size={11} /> Zakończyłem zlecenie
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        )}
    </AnimatePresence>
));

DayPanel.displayName = 'DayPanel';

// ── AgendaSection ──────────────────────────────────────────────────────────────

interface AgendaSectionProps {
    events: Array<BookingEvent & { dateKey: string }>;
    onSelect: (dateKey: string) => void;
    onOpenChat?: (chatId: string) => void;
}

export const AgendaSection = memo(({ events, onSelect, onOpenChat: _onOpenChat }: AgendaSectionProps) => {
    const grouped = useMemo(() => {
        const map: Record<string, Array<BookingEvent & { dateKey: string }>> = {};
        events.forEach(ev => {
            if (!map[ev.dateKey]) map[ev.dateKey] = [];
            map[ev.dateKey].push(ev);
        });
        return Object.entries(map).slice(0, 5);
    }, [events]);

    if (grouped.length === 0) return (
        <div className="bg-white rounded-[2rem] border border-gray-100 px-5 py-6 flex items-center gap-3 shadow-sm">
            <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0">
                <CalendarCheck size={18} className="text-gray-300" />
            </div>
            <div>
                <p className="font-bold text-gray-700 text-sm">Brak nadchodzących zleceń</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">Zaakceptowane rezerwacje pojawią się tutaj.</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-3">
            {grouped.map(([dateKey, evs]) => {
                const d = new Date(dateKey + 'T00:00');
                const isToday = dateKey === getTodayStr();
                const isTomorrow = dateKey === fmt(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1);
                const label = isToday ? 'Dziś' : isTomorrow ? 'Jutro'
                    : d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
                return (
                    <div key={dateKey}>
                        <div className="flex items-center gap-2 mb-2 px-1">
                            <span className={`text-[11px] font-black uppercase tracking-widest ${isToday ? 'text-indigo-500' : 'text-gray-400'}`}>{label}</span>
                            {isToday && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                        </div>
                        <div className="space-y-2">
                            {evs.slice(0, 3).map(ev => (
                                <button key={String(ev.booking.id)} onClick={() => onSelect(dateKey)}
                                    className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 lg:px-5 lg:py-4 flex items-center gap-3 active:scale-[0.98] hover:bg-indigo-50/40 transition-all text-left">
                                    <div className={`w-1 self-stretch rounded-full shrink-0 ${ev.isOutgoing ? 'bg-teal-400' : 'bg-indigo-500'}`} />
                                    <div className="shrink-0 text-center w-10">
                                        <p className="text-[11px] lg:text-xs font-black text-indigo-600 leading-none">{ev.booking.time || '—'}</p>
                                    </div>
                                    <div className="w-px h-6 bg-gray-100 shrink-0" />
                                    {ev.booking.serviceImage
                                        ? <Image src={ev.booking.serviceImage} width={44} height={44} className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl object-cover shrink-0" alt="" />
                                        : <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0"><CalendarIcon size={13} className="text-indigo-300" /></div>
                                    }
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 text-sm lg:text-[15px] truncate leading-tight">{ev.booking.serviceTitle}</p>
                                        <p className="text-xs lg:text-[13px] text-gray-400 font-medium truncate mt-0.5">{ev.otherPartyName}</p>
                                    </div>
                                    <ChevronRight size={14} className="text-gray-300 shrink-0" />
                                </button>
                            ))}
                            {evs.length > 3 && (
                                <p className="text-[10px] font-bold text-gray-400 px-4 py-1">
                                    +{evs.length - 3} więcej w tym dniu
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
});

AgendaSection.displayName = 'AgendaSection';

// ── WorkingHoursEditor ─────────────────────────────────────────────────────────

const ALL_HOURS = Array.from({ length: 17 }, (_, i) => `${String(i + 6).padStart(2, '0')}:00`);

interface WorkingHoursEditorProps {
    hours: string[];
    savedHours: string[];
    saving: boolean;
    onToggle: (h: string) => void;
    onSave: () => void;
}

export const WorkingHoursEditor = memo(({ hours, savedHours, saving, onToggle, onSave }: WorkingHoursEditorProps) => {
    const hasChanges = JSON.stringify([...hours].sort()) !== JSON.stringify([...savedHours].sort());
    return (
        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="font-bold text-gray-900 text-sm">Godziny pracy</p>
                    <p className="text-xs text-gray-400 font-medium mt-0.5">Zaznacz godziny, w których przyjmujesz zlecenia</p>
                </div>
                <button onClick={onSave} disabled={saving || !hasChanges}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-sm ${
                        hasChanges ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}>
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    Zapisz
                </button>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-9 gap-2">
                {ALL_HOURS.map(h => {
                    const active = hours.includes(h);
                    return (
                        <motion.button key={h} whileTap={{ scale: 0.88 }} onClick={() => onToggle(h)}
                            className={`py-3 rounded-xl text-xs font-bold transition-colors ${
                                active ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200' : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-gray-100'
                            }`}>
                            {h}
                        </motion.button>
                    );
                })}
            </div>
            {hours.length === 0 && (
                <p className="mt-4 text-[11px] text-amber-500 font-semibold flex items-center gap-1.5">
                    <Info size={12} className="shrink-0" /> Brak wybranych godzin — klienci nie będą mogli rezerwować konkretnych terminów.
                </p>
            )}
        </div>
    );
});

WorkingHoursEditor.displayName = 'WorkingHoursEditor';
