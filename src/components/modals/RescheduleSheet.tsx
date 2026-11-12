'use client';
import { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, Loader2 } from 'lucide-react';
import { authService } from '../../services/authService';
import { SheetModal } from './SheetModal';
import { MODAL_BTN_PRIMARY, MODAL_BTN_SECONDARY } from './modalBase';

const MONTHS_PL = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const DAYS_PL   = ['Pn','Wt','Śr','Cz','Pt','So','Nd'];
const todayStr  = new Date().toISOString().split('T')[0];
const fmtDate   = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

interface RescheduleSheetProps {
    servicePublicId?: string | null;
    onConfirm: (date: string, time?: string) => void;
    onClose: () => void;
}

export const RescheduleSheet = ({ servicePublicId, onConfirm, onClose }: RescheduleSheetProps) => {
    const [calDate, setCalDate] = useState(new Date());
    const [selDate, setSelDate] = useState('');
    const [slots, setSlots]     = useState<string[] | null>(null);
    const [selSlot, setSelSlot] = useState('');
    const [loading, setLoading] = useState(false);

    const y = calDate.getFullYear();
    const m = calDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const offset = (() => { const r = new Date(y, m, 1).getDay(); return r === 0 ? 6 : r - 1; })();

    const slotsRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!selDate) return;
        const id = requestAnimationFrame(() => {
            const container = scrollRef.current;
            const target = slotsRef.current;
            if (!container || !target) return;
            container.scrollTop = target.offsetTop - 8;
        });
        return () => cancelAnimationFrame(id);
    }, [selDate]);

    useEffect(() => {
        if (!selDate || !servicePublicId) { setSlots(null); setSelSlot(''); return; }
        let ok = true;
        setLoading(true);
        setSelSlot('');
        authService.getServiceTakenHours(servicePublicId, selDate)
            .then(d => { if (ok) setSlots(d?.availableHours ?? []); })
            .catch(() => { if (ok) setSlots([]); })
            .finally(() => { if (ok) setLoading(false); });
        return () => { ok = false; };
    }, [selDate, servicePublicId]);

    return (
        <SheetModal
            isOpen
            onClose={onClose}
            title="Zmień termin"
            icon={Calendar}
            bodyRef={scrollRef}
            footer={({ close }) => (
                <>
                    <button type="button" onClick={close} className={MODAL_BTN_SECONDARY}>Anuluj</button>
                    <button type="button" disabled={!selDate}
                        onClick={() => { onConfirm(selDate, selSlot || undefined); close(); }}
                        className={MODAL_BTN_PRIMARY}>
                        Potwierdź
                    </button>
                </>
            )}
        >
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
                            <div ref={slotsRef}>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                                    <Clock size={10} /> Godzina
                                    {loading && <Loader2 size={11} className="animate-spin text-indigo-400" />}
                                    <span className="font-medium normal-case tracking-normal">(opcjonalnie)</span>
                                </p>
                                {slots === null ? (
                                    <div className="flex justify-center py-5">
                                        <Loader2 size={20} className="animate-spin text-indigo-400" />
                                    </div>
                                ) : slots.length === 0 ? (
                                    <p className="text-xs text-gray-400 text-center py-3 font-medium">Brak wolnych slotów tego dnia</p>
                                ) : (
                                    <div className={`grid grid-cols-4 gap-2 transition-opacity duration-150 ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                                        {slots.map(h => (
                                            <button key={h} type="button"
                                                onClick={() => setSelSlot(prev => prev === h ? '' : h)}
                                                className={`py-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                                                    selSlot === h
                                                        ? 'bg-indigo-600 text-white shadow-sm'
                                                        : 'bg-gray-50 border border-gray-100 text-gray-700 hover:border-indigo-300 hover:text-indigo-600'
                                                }`}
                                            >{h}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    
        </SheetModal>
    );
};
