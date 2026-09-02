'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight, Clock, Loader2, X, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { BottomSheetHandle } from '../ui/BottomSheetHandle';
import type { Service } from '../../types';

const MONTHS_PL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const DAYS_PL   = ['Pn','Wt','Śr','Cz','Pt','So','Nd'];
const todayStr  = new Date().toISOString().split('T')[0];
const fmtDate   = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const INTERVALS = [
    { value: 'weekly',    label: 'Co tydzień' },
    { value: 'biweekly',  label: 'Co 2 tygodnie' },
    { value: 'monthly',   label: 'Co miesiąc' },
] as const;

interface Props {
    sessionId: string;
    myServices: Service[];
    defaultServicePublicId?: string;
    onConfirm: (date: string, time: string | undefined, servicePublicId: string, recurrence?: { interval: 'weekly' | 'biweekly' | 'monthly'; count: number }) => Promise<void>;
    onClose: () => void;
}

export const CreateBookingForClientModal = ({ sessionId: _sessionId, myServices, defaultServicePublicId, onConfirm, onClose }: Props) => {
    const [selService, setSelService] = useState<string>(
        defaultServicePublicId ?? myServices[0]?.publicId ?? ''
    );
    const [calDate, setCalDate]   = useState(new Date());
    const [selDate, setSelDate]   = useState('');
    const [selTime, setSelTime]   = useState('');
    const [recurring, setRecurring] = useState(false);
    const [interval, setInterval] = useState<'weekly' | 'biweekly' | 'monthly'>('weekly');
    const [count, setCount]       = useState(4);
    const [loading, setLoading]   = useState(false);

    const y = calDate.getFullYear();
    const m = calDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const offset = (() => { const r = new Date(y, m, 1).getDay(); return r === 0 ? 6 : r - 1; })();

    const { sheetDragProps, startDrag, backdropOpacity, triggerClose, handleClose } = useBottomSheet(onClose, true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const timeRef   = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const alreadyLocked = document.documentElement.classList.contains('scroll-locked');
        if (!alreadyLocked) lockScroll();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); triggerClose(); } };
        window.addEventListener('keydown', onKey, true);
        return () => { if (!alreadyLocked) unlockScroll(); window.removeEventListener('keydown', onKey, true); };
    }, [triggerClose]);

    useEffect(() => {
        if (!selDate) return;
        const id = requestAnimationFrame(() => {
            const container = scrollRef.current;
            const target = timeRef.current;
            if (!container || !target) return;
            container.scrollTop = target.offsetTop - 8;
        });
        return () => cancelAnimationFrame(id);
    }, [selDate]);

    const handleConfirm = async () => {
        if (!selDate || !selService || loading) return;
        setLoading(true);
        try {
            await onConfirm(
                selDate,
                selTime || undefined,
                selService,
                recurring ? { interval, count } : undefined
            );
            triggerClose();
        } catch {
            setLoading(false);
        }
    };

    const HOURS = Array.from({ length: 24 }, (_, h) =>
        [`${String(h).padStart(2,'0')}:00`, `${String(h).padStart(2,'0')}:30`]
    ).flat();

    return createPortal(
        <div className="fixed inset-0 z-[300]">
            {/* Backdrop — fades in real time with drag gesture */}
            <motion.div
                style={{ opacity: backdropOpacity }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />
            {/* Sheet */}
            <div className="absolute inset-0 flex items-end md:items-center justify-center md:p-4 pointer-events-none">
            <motion.div
                {...sheetDragProps}
                className="pointer-events-auto w-full sm:max-w-md bg-white rounded-t-[2rem] md:rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="md:hidden">
                    <BottomSheetHandle onPointerDown={startDrag} />
                </div>

                <div
                    className="px-6 md:px-8 py-4 md:py-5 border-b border-gray-50 bg-gray-50/50 shrink-0 md:cursor-default cursor-grab active:cursor-grabbing"
                    style={{ touchAction: 'none' }}
                    onPointerDown={startDrag}
                >
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Calendar size={18} />
                            </div>
                            Dodaj rezerwację
                        </h3>
                        <button onClick={handleClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-scroll overscroll-contain px-5 py-5 max-h-[55dvh] md:max-h-[70vh]">

                    {/* Selektor usługi */}
                    {myServices.length > 1 && (
                        <div className="mb-5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2.5">Usługa</p>
                            <div className="flex flex-col gap-1.5">
                                {myServices.map(s => (
                                    <button
                                        key={s.publicId}
                                        type="button"
                                        onClick={() => setSelService(s.publicId ?? '')}
                                        className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left text-xs font-bold transition-all active:scale-95 border ${
                                            selService === s.publicId
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                                : 'bg-gray-50 border-gray-100 text-gray-700 hover:border-indigo-200'
                                        }`}
                                    >
                                        <img
                                            src={s.image}
                                            alt=""
                                            className="w-8 h-8 rounded-lg object-cover shrink-0"
                                            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                        <span className="truncate">{s.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Kalendarz */}
                    <div className="flex items-center justify-between mb-4">
                        <button type="button" onClick={() => setCalDate(new Date(y, m - 1))}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 active:scale-90 transition-all">
                            <ChevronLeft size={16} />
                        </button>
                        <p className="text-sm font-black text-gray-700">{MONTHS_PL[m]} {y}</p>
                        <button type="button" onClick={() => setCalDate(new Date(y, m + 1))}
                            className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 active:scale-90 transition-all">
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="mb-5">
                        <div className="grid grid-cols-7 mb-2">
                            {DAYS_PL.map((d, i) => (
                                <div key={d} className={`text-center text-[9px] font-black uppercase py-1 ${i >= 5 ? 'text-rose-300' : 'text-gray-300'}`}>{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} className="aspect-square" />)}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const ds  = fmtDate(y, m, day);
                                const isPast  = ds < todayStr;
                                const isSel   = ds === selDate;
                                const isToday = ds === todayStr;
                                return (
                                    <button key={ds} type="button" disabled={isPast}
                                        onClick={() => setSelDate(prev => prev === ds ? '' : ds)}
                                        className={[
                                            'aspect-square rounded-xl text-xs font-bold transition-all active:scale-95',
                                            isSel    ? 'bg-indigo-600 text-white shadow-sm' : '',
                                            !isPast && !isSel ? 'hover:bg-indigo-50 text-gray-700' : '',
                                            isPast   ? 'text-gray-200 cursor-not-allowed' : '',
                                            isToday && !isSel ? 'ring-1 ring-indigo-400' : '',
                                        ].join(' ')}
                                    >{day}</button>
                                );
                            })}
                        </div>
                    </div>

                    {selDate && (
                        <div ref={timeRef} className="space-y-5">
                            {/* Godzina */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                                    <Clock size={10} /> Godzina <span className="font-medium normal-case tracking-normal">(opcjonalnie)</span>
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    {HOURS.map(h => (
                                        <button key={h} type="button"
                                            onClick={() => setSelTime(prev => prev === h ? '' : h)}
                                            className={`py-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                                                selTime === h
                                                    ? 'bg-indigo-600 text-white shadow-sm'
                                                    : 'bg-gray-50 border border-gray-100 text-gray-700 hover:border-indigo-300 hover:text-indigo-600'
                                            }`}
                                        >{h}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Cykliczność */}
                            <div>
                                <button
                                    type="button"
                                    onClick={() => setRecurring(v => !v)}
                                    className={`w-full py-3 px-4 rounded-xl text-xs font-bold flex items-center gap-2 transition-all active:scale-95 border ${
                                        recurring
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                                            : 'border-gray-200 text-gray-600 bg-gray-50 hover:border-indigo-300 hover:text-indigo-600'
                                    }`}
                                >
                                    <RefreshCw size={13} /> Rezerwacja cykliczna
                                    <div className={`ml-auto w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${recurring ? 'border-white bg-white' : 'border-gray-300'}`}>
                                        {recurring && <div className="w-2 h-2 rounded-full bg-indigo-600" />}
                                    </div>
                                </button>

                                {recurring && (
                                    <div className="mt-3 space-y-3">
                                        <div className="flex gap-2">
                                            {INTERVALS.map(iv => (
                                                <button key={iv.value} type="button"
                                                    onClick={() => setInterval(iv.value)}
                                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                                                        interval === iv.value
                                                            ? 'bg-indigo-600 text-white shadow-sm'
                                                            : 'bg-gray-50 border border-gray-100 text-gray-600 hover:border-indigo-200'
                                                    }`}
                                                >{iv.label}</button>
                                            ))}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Liczba powtórzeń: <span className="text-indigo-600">{count}x</span></p>
                                            <input
                                                type="range" min={2} max={26} value={count}
                                                onChange={e => setCount(Number(e.target.value))}
                                                className="w-full accent-indigo-600"
                                            />
                                            <div className="flex justify-between text-[10px] text-gray-300 font-bold mt-1">
                                                <span>2</span><span>26</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div
                    className="flex gap-2 px-5 pt-4 pb-5 shrink-0 border-t border-gray-100"
                    style={{ paddingBottom: 'calc(var(--native-cta-h, var(--bottom-nav-total-h, env(safe-area-inset-bottom, 0px))) + 1.25rem)' }}
                >
                    <button type="button" onClick={handleClose}
                        className="flex-1 py-3 rounded-xl text-xs font-bold border border-gray-200 text-gray-500 hover:bg-gray-100 active:scale-95 transition-all">
                        Anuluj
                    </button>
                    <button type="button" disabled={!selDate || !selService || loading}
                        onClick={handleConfirm}
                        className="flex-1 py-3 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40 shadow-sm shadow-indigo-200 flex items-center justify-center gap-2">
                        {loading && <Loader2 size={13} className="animate-spin" />}
                        {recurring ? `Dodaj ${count} rezerwacji` : 'Dodaj rezerwację'}
                    </button>
                </div>
            </motion.div>
            </div>
        </div>,
        document.body
    );
};
