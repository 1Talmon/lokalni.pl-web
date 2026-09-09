'use client';
import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Ban, ChevronLeft, ChevronRight } from 'lucide-react';
import type { BookingEvent } from '../../hooks/useBookings';
import { MONTHS, DAYS, fmt, getTodayStr } from './helpers';

// ── CalendarGrid ───────────────────────────────────────────────────────────────

export interface CalendarGridProps {
    y: number; m: number;
    daysInMonth: number; offset: number;
    busyDays: string[];
    byDate: Record<string, BookingEvent[]>;
    selected: string | null;
    editMode: boolean;
    isMobile?: boolean;
    onPrev: () => void;
    onNext: () => void;
    onToggleDay: (day: number) => void;
    onSelectDay: (ds: string) => void;
}

export const CalendarGrid = memo(({
    y, m, daysInMonth, offset, busyDays, byDate,
    selected, editMode, isMobile = false,
    onPrev, onNext, onToggleDay, onSelectDay,
}: CalendarGridProps) => (
    <>
        <div className={`flex items-center justify-between ${isMobile ? 'mb-6' : 'mb-8'}`}>
            <button onClick={onPrev} className="p-3 hover:bg-gray-50 rounded-2xl transition-colors text-gray-400 active:scale-90">
                <ChevronLeft size={isMobile ? 26 : 22} />
            </button>
            <div className="text-center">
                <div className={`font-black text-gray-900 ${isMobile ? 'text-2xl' : 'text-xl'}`}>{MONTHS[m]}</div>
                <div className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">{y}</div>
            </div>
            <button onClick={onNext} className="p-3 hover:bg-gray-50 rounded-2xl transition-colors text-gray-400 active:scale-90">
                <ChevronRight size={isMobile ? 26 : 22} />
            </button>
        </div>

        <div className={`grid grid-cols-7 ${isMobile ? 'gap-1 mb-2' : 'gap-2 mb-3'}`}>
            {DAYS.map((d) => (
                <div key={d} className="text-center text-[11px] font-black uppercase tracking-tight text-gray-300">{d}</div>
            ))}
        </div>

        <motion.div key={`${y}-${m}`} className={`grid grid-cols-7 ${isMobile ? 'gap-1' : 'gap-2'}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
            {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} className="aspect-square" />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
                const day  = i + 1;
                const ds   = fmt(y, m, day);
                const busy = busyDays.includes(ds);
                const isSel   = ds === selected && !editMode;
                const isToday = ds === getTodayStr();
                const events  = byDate[ds] || [];
                const hasIn   = events.some(e => !e.isOutgoing);
                const hasOut  = events.some(e => e.isOutgoing);

                return (
                    <motion.button
                        key={ds}
                        whileTap={{ scale: 0.88 }}
                        onClick={() => editMode ? onToggleDay(day) : onSelectDay(isSel ? '' : ds)}
                        className={[
                            `aspect-square ${isMobile ? 'rounded-xl' : 'rounded-[1.1rem]'} flex items-center justify-center border-2 relative transition-colors duration-150`,
                            isSel  ? 'bg-indigo-500 border-indigo-500'
                                   : busy ? 'bg-slate-50 border-slate-200'
                                   : !busy && hasIn ? 'bg-indigo-100 border-indigo-400'
                                   : !busy && hasOut ? 'bg-teal-50 border-teal-400'
                                   : 'bg-green-50 border-green-200',
                            isToday ? 'ring-2 ring-[#6366F1] ring-offset-2' : '',
                        ].join(' ')}
                    >
                        <span className={[
                            `font-black leading-none transition-colors duration-150 ${isMobile ? 'text-base' : 'text-sm'}`,
                            isSel  ? 'text-white'
                                   : busy ? 'text-slate-400'
                                   : hasIn ? 'text-indigo-700'
                                   : hasOut ? 'text-teal-700'
                                   : 'text-green-800',
                        ].join(' ')}>{day}</span>
                        <motion.div
                            className="absolute bottom-1 inset-x-0 flex justify-center pointer-events-none"
                            initial={{ opacity: busy ? 0.55 : 0 }}
                            animate={{ opacity: busy ? 0.55 : 0 }}
                            transition={{ duration: 0.22 }}
                        >
                            <Ban size={8} strokeWidth={2.5} />
                        </motion.div>
                        <AnimatePresence>
                            {!busy && (hasIn || hasOut) && (
                                <motion.div
                                    key="dots"
                                    initial={{ opacity: 0, scale: 0.4 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.4 }}
                                    transition={{ duration: 0.18 }}
                                    className="absolute bottom-1.5 right-1.5 flex gap-0.5"
                                >
                                    {hasIn  && <div className="w-2 h-2 rounded-full bg-indigo-600 ring-2 ring-white" />}
                                    {hasOut && <div className="w-2 h-2 rounded-full bg-teal-600 ring-2 ring-white" />}
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {isToday && !isMobile && (
                            <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-1.5 py-[2px] bg-[#6366F1] text-white text-[7px] font-black rounded-full uppercase tracking-widest shadow-sm whitespace-nowrap">Dziś</span>
                        )}
                    </motion.button>
                );
            })}
        </motion.div>

        <div className={`${isMobile ? 'mt-6' : 'mt-8'} pt-4 border-t border-gray-50 flex flex-wrap items-center justify-center gap-4`}>
            {[
                { dot: <div className="w-3.5 h-3.5 bg-green-50 border-2 border-green-200 rounded flex items-center justify-center"><div className="w-1 h-1 bg-green-500 rounded-full" /></div>, label: 'Pracuję' },
                { dot: <div className="w-3.5 h-3.5 bg-slate-100 border-2 border-slate-200 rounded flex items-center justify-center"><Ban size={7} className="text-slate-400" /></div>, label: 'Wolny' },
                { dot: <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />, label: 'Zlecenie' },
                { dot: <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />, label: 'Rezerwacja' },
            ].map(({ dot, label }) => (
                <span key={label} className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase">{dot} {label}</span>
            ))}
        </div>
    </>
));

CalendarGrid.displayName = 'CalendarGrid';

// ── WeekStrip ──────────────────────────────────────────────────────────────────

export const WeekStrip = memo(({ weekDays, selected, byDate, busyDays, onSelect }: {
    weekDays: Date[];
    selected: string | null;
    byDate: Record<string, BookingEvent[]>;
    busyDays: string[];
    onSelect: (ds: string) => void;
}) => (
    <div className="flex gap-1">
        {weekDays.map(day => {
            const ds = fmt(day.getFullYear(), day.getMonth(), day.getDate());
            const isToday = ds === getTodayStr();
            const isSel = ds === selected;
            const hasEvents = (byDate[ds]?.length ?? 0) > 0;
            const isBusy = busyDays.includes(ds);
            const dow = day.getDay();
            const dayLabel = DAYS[dow === 0 ? 6 : dow - 1];
            return (
                <motion.button
                    key={ds}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => onSelect(ds)}
                    className={[
                        'flex-1 flex flex-col items-center py-2.5 rounded-2xl transition-all',
                        isSel
                            ? 'bg-indigo-600 shadow-lg shadow-indigo-200/60'
                            : isToday ? 'bg-indigo-50' : '',
                    ].join(' ')}
                >
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${
                        isSel ? 'text-indigo-200' : 'text-gray-400'
                    }`}>{dayLabel}</span>
                    <span className={`text-xl font-black mt-0.5 leading-none ${
                        isSel ? 'text-white' : isToday ? 'text-indigo-600' : 'text-gray-800'
                    }`}>{day.getDate()}</span>
                    <div className="h-2 mt-1 flex items-center justify-center">
                        {hasEvents && !isBusy && (
                            <div className={`w-1.5 h-1.5 rounded-full ${isSel ? 'bg-white/70' : 'bg-indigo-500'}`} />
                        )}
                        {isBusy && (
                            <Ban size={8} className={isSel ? 'text-rose-300' : 'text-rose-400'} />
                        )}
                    </div>
                </motion.button>
            );
        })}
    </div>
));

WeekStrip.displayName = 'WeekStrip';
