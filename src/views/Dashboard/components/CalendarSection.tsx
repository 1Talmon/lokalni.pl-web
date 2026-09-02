'use client';
import { useState, useEffect, memo, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom'; // Ważny import
import { ChevronLeft, ChevronRight, Save, Loader2, Ban, CalendarCheck, X, Calendar as CalendarIcon, Info, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence, animate } from 'framer-motion';
import { authService } from '../../../services/authService';

// --- LINIOWY LICZNIK ---
const RollingNumber = ({ value }: { value: number }) => {
    const [display, setDisplay] = useState(0);
    const prevValue = useRef(0);
    useEffect(() => {
        const controls = animate(prevValue.current, value, {
            duration: 0.4,
            ease: "linear",
            onUpdate: (latest) => setDisplay(Math.floor(latest)),
        });
        prevValue.current = value;
        return () => controls.stop();
    }, [value]);
    return <span className="tabular-nums">{display}</span>;
};

export const CalendarSection = memo(({ addToast }: { addToast?: (msg: string, type?: string) => void }) => {
    const [isComponentReady, setIsComponentReady] = useState(false);
    const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showInfoModal, setShowInfoModal] = useState(false);

    // --- BEZPIECZNY PORTAL ---
    // Potrzebujemy referencji do body, żeby mieć pewność, że istnieje podczas renderowania
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
        setIsComponentReady(true);
    }, []);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [busyDays, setBusyDays] = useState<string[]>([]);
    const [serverBusyDays, setServerBusyDays] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth() + 1;
                const data = await authService.getAvailability(year, month);
                if (isMounted && data?.busyDays) {
                    setBusyDays(data.busyDays);
                    setServerBusyDays(data.busyDays);
                }
            } catch {
                if (addToast) addToast("Nie udało się pobrać grafiku", "error");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        if (isComponentReady) fetchData();
        return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- addToast is stable; year/month as primitives avoids complex expression warning
    }, [currentDate.getFullYear(), currentDate.getMonth(), isComponentReady]);

    const calendarData = useMemo(() => {
        const y = currentDate.getFullYear();
        const m = currentDate.getMonth();
        const dInM = new Date(y, m + 1, 0).getDate();
        const fDay = new Date(y, m, 1).getDay();
        const nameOnly = currentDate.toLocaleString('pl-PL', { month: 'long' });
        const nameFull = currentDate.toLocaleString('pl-PL', { month: 'long', year: 'numeric' });
        return {
            year: y, month: m, daysInMonth: dInM,
            firstDay: fDay === 0 ? 6 : fDay - 1,
            monthNameOnly: nameOnly.charAt(0).toUpperCase() + nameOnly.slice(1),
            monthNameFull: nameFull.charAt(0).toUpperCase() + nameFull.slice(1)
        };
    }, [currentDate]);

    const workingDaysCount = useMemo(() => calendarData.daysInMonth - busyDays.length, [calendarData.daysInMonth, busyDays]);

    const formatDate = (day: number) => {
        const mStr = String(calendarData.month + 1).padStart(2, '0');
        const dStr = String(day).padStart(2, '0');
        return `${calendarData.year}-${mStr}-${dStr}`;
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const daysOff = busyDays.filter(day => !serverBusyDays.includes(day));
            const daysOn = serverBusyDays.filter(day => !busyDays.includes(day));
            await authService.updateAvailability(daysOff, daysOn);
            setServerBusyDays(busyDays);
            if (addToast) addToast("Grafik zaktualizowany", "success");
            setIsMobileFullscreen(false);
        } catch {
            if (addToast) addToast("Błąd zapisu", "error");
        } finally { setIsSaving(false); }
    };

    const toggleDayStatus = (day: number) => {
        const dateStr = formatDate(day);
        setBusyDays(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr]);
    };

    const toggleWeekends = () => {
        const weekends: string[] = [];
        for (let d = 1; d <= calendarData.daysInMonth; d++) {
            const date = new Date(calendarData.year, calendarData.month, d);
            if (date.getDay() === 0 || date.getDay() === 6) weekends.push(formatDate(d));
        }
        const areAllBlocked = weekends.every(date => busyDays.includes(date));
        setBusyDays(prev => areAllBlocked ? prev.filter(date => !weekends.includes(date)) : Array.from(new Set([...prev, ...weekends])));
    };

    const weekendsBlocked = useMemo(() => {
        const weekends: string[] = [];
        for (let d = 1; d <= calendarData.daysInMonth; d++) {
            const date = new Date(calendarData.year, calendarData.month, d);
            if (date.getDay() === 0 || date.getDay() === 6) weekends.push(formatDate(d));
        }
        return weekends.length > 0 && weekends.every(date => busyDays.includes(date));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- formatDate is a pure util derived from calendarData, already in deps
    }, [busyDays, calendarData]);

    const renderCalendarGrid = ({ isMobile = false }: { isMobile?: boolean }) => {
        const showFullDetails = !isMobile || !isAnimating;
        return (
            <div className={`relative ${isMobile ? 'flex-1 px-4' : ''}`}>
                <div className="flex items-center justify-between mb-8">
                    <button onClick={() => setCurrentDate(new Date(calendarData.year, calendarData.month - 1))} className="p-3 hover:bg-gray-50 rounded-2xl transition-colors text-gray-400"><ChevronLeft size={isMobile ? 24 : 20} /></button>
                    <div className="text-center">
                        <div className="text-xl font-black text-gray-900">{isMobile ? calendarData.monthNameOnly : calendarData.monthNameFull}</div>
                        {isMobile && <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{calendarData.year}</div>}
                    </div>
                    <button onClick={() => setCurrentDate(new Date(calendarData.year, calendarData.month + 1))} className="p-3 hover:bg-gray-50 rounded-2xl transition-colors text-gray-400"><ChevronRight size={isMobile ? 24 : 20} /></button>
                </div>

                <div className={`grid grid-cols-7 ${isMobile ? 'gap-1 mb-2' : 'gap-2 mb-4'}`}>
                    {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((d, i) => (
                        <div key={d} className={`text-[10px] font-black uppercase text-center tracking-tighter ${i >= 5 ? 'text-rose-400' : 'text-gray-300'}`}>{d}</div>
                    ))}
                </div>

                <div className={`grid grid-cols-7 ${isMobile ? 'gap-1 pb-20' : 'gap-2 md:gap-3'}`}>
                    {Array.from({ length: calendarData.firstDay }).map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
                    {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const dateStr = formatDate(day);
                        const isBusy = busyDays.includes(dateStr);
                        const isToday = new Date().toDateString() === new Date(calendarData.year, calendarData.month, day).toDateString();

                        return (
                            <motion.button
                                key={dateStr}
                                animate={{
                                    backgroundColor: isBusy ? '#f43f5e' : '#ffffff',
                                    borderColor: isBusy ? '#f43f5e' : '#f3f4f6',
                                    color: isBusy ? '#ffffff' : '#374151'
                                }}
                                transition={{ duration: 0.2 }}
                                whileTap={showFullDetails ? { scale: 0.95 } : {}}
                                whileHover={!isBusy && !isMobile ? { borderColor: '#e0e7ff' } : {}}
                                onClick={() => toggleDayStatus(day)}
                                className={`aspect-square ${isMobile ? 'rounded-xl' : 'rounded-[1.25rem]'} flex flex-col items-center justify-center gap-1 border-2 relative
                                    ${isToday && showFullDetails ? 'ring-2 ring-[#6366F1] ring-offset-2' : ''}`}
                            >
                                <span className={`${isMobile ? 'text-lg' : 'text-sm md:text-base'} font-black`}>{day}</span>
                                <div className="h-4 flex items-center justify-center">
                                    {isBusy ? <Ban size={isMobile ? 14 : 12} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                                </div>
                                {isToday && !isMobile && (
                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-1.5 py-[2px] bg-[#6366F1] text-white text-[7px] font-black rounded-full uppercase tracking-widest shadow-sm">Dziś</span>
                                )}
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (!isComponentReady) return <div className="w-full h-[500px]" />;

    return (
        <>
            {/* --- DESKTOP VIEW --- */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} className="space-y-6 text-left max-w-5xl hidden md:block">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-1">Twój Grafik</h3>
                        <p className="text-gray-500 font-medium text-sm">Kliknij dzień, aby oznaczyć jako <span className="text-rose-500 font-bold">wolne</span>.</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={toggleWeekends} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm active:scale-95 ${weekendsBlocked ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-indigo-50 text-[#6366F1] border-indigo-100'}`}>
                            {weekendsBlocked ? <CalendarCheck size={14} /> : <Ban size={14} />} {weekendsBlocked ? 'Odblokuj weekendy' : 'Zablokuj weekendy'}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="group relative overflow-hidden bg-[#6366F1] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-100 hover:bg-[#4F46E5] active:scale-95 transition-all flex items-center justify-center gap-2 isolate"
                        >
                            {/* Treść przycisku */}
                            <div className="flex items-center gap-2 relative z-20 pointer-events-none">
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                <span>Zapisz grafik</span>
                            </div>

                            {/* Efekt Shimmer (Błysk) */}
                            <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform" />
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-50 relative max-w-3xl overflow-hidden">
                    {renderCalendarGrid({ isMobile: false })}
                    <div className="mt-8 flex items-center justify-center gap-4 pt-4 border-t border-gray-50">
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-white border border-gray-200 rounded flex items-center justify-center"><div className="w-1 h-1 bg-emerald-400 rounded-full" /></div><span className="text-[10px] font-bold text-gray-400 uppercase">Pracuję</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-3 h-3 bg-rose-500 rounded flex items-center justify-center"><Ban size={8} className="text-white" /></div><span className="text-[10px] font-bold text-gray-400 uppercase">Urlop</span></div>
                    </div>
                </div>
            </motion.div>

            {/* --- MOBILE VIEW --- */}
            <div className="md:hidden px-2">
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl shadow-indigo-50/50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10"><CalendarIcon size={120} /></div>
                    <div className="relative z-10 text-left">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200"><CalendarIcon size={24} /></div>
                            <div>
                                <h4 className="font-black text-gray-900 text-xl tracking-tight">Dostępność</h4>
                                <p className="text-[10px] uppercase font-bold text-indigo-500 tracking-widest">{calendarData.monthNameOnly} {calendarData.year}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-8">
                            <div className="bg-gray-50 p-4 rounded-3xl">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Dni pracujące</p>
                                <div className="text-sm font-black text-emerald-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"/><span className="tabular-nums"><RollingNumber value={workingDaysCount} /></span><span>dni</span></div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-3xl">
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Dni wolne</p>
                                <div className="text-sm font-black text-rose-500 flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500 shrink-0"/><span className="tabular-nums"><RollingNumber value={busyDays.length} /></span><span>dni</span></div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsMobileFullscreen(true)}
                            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 shadow-xl shadow-gray-200 cursor-pointer"
                        >
                            Edytuj grafik pracy
                        </button>
                    </div>
                </div>
            </div>

            {/* --- PORTAL RENDEROWANIA --- */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isMobileFullscreen && (
                        <motion.div
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            onAnimationStart={() => setIsAnimating(true)}
                            onAnimationComplete={() => setIsAnimating(false)}
                            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
                            data-modal-panel
                            className="fixed inset-0 bg-white z-[9999] md:hidden flex flex-col"
                            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }} // Wymuszenie pozycji
                        >
                            <div className="w-full flex flex-col items-center pt-3 pb-6 border-b bg-white sticky top-0 z-20 shadow-sm">
                                <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-6" />
                                <div className="w-full px-6 flex items-center justify-between">
                                    <button onClick={() => setIsMobileFullscreen(false)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 active:scale-90"><X size={20} /></button>
                                    <h3 className="font-black text-xl tracking-tight text-gray-900 text-center">Mój Grafik</h3>
                                    <button onClick={() => setShowInfoModal(true)} className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 active:scale-90 transition-transform"><Info size={18} /></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-white pt-2 text-left">
                                {renderCalendarGrid({ isMobile: true })}
                            </div>

                            <div className="p-6 bg-white border-t flex items-center gap-3 sticky bottom-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                                <button onClick={toggleWeekends} className={`flex-[1.1] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 border ${weekendsBlocked ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-gray-50 text-gray-500 border-gray-100'}`}><CalendarDays size={16} /><span className="whitespace-nowrap">Weekendy</span></button>
                                <button onClick={handleSave} disabled={isSaving || isLoading} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2">{isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}<span className="whitespace-nowrap uppercase">Zapisz grafik</span></button>
                            </div>

                            {/* INFO MODAL */}
                            <AnimatePresence>
                                {showInfoModal && (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        onClick={() => setShowInfoModal(false)}
                                        className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-6"
                                        style={{ position: 'fixed' }} // Fix dla modala wewnątrz portalu
                                    >
                                        <motion.div
                                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-gray-100"
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <h4 className="text-lg font-black text-gray-900">Legenda</h4>
                                                <button onClick={() => setShowInfoModal(false)} className="p-2 bg-gray-50 rounded-full text-gray-500"><X size={16} /></button>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm"><div className="w-2 h-2 rounded-full bg-emerald-400" /></div>
                                                    <div><p className="font-bold text-gray-900 text-sm">Dzień pracujący</p><p className="text-xs text-gray-400">Domyślny status dnia</p></div>
                                                </div>
                                                <div className="flex items-center gap-4 p-3 bg-rose-50 rounded-2xl border border-rose-100">
                                                    <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center shadow-sm shadow-rose-200"><Ban size={16} className="text-white" /></div>
                                                    <div><p className="font-bold text-rose-700 text-sm">Dzień wolny</p><p className="text-xs text-rose-400">Kliknij, aby zablokować</p></div>
                                                </div>
                                            </div>
                                            <button onClick={() => setShowInfoModal(false)} className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-95 transition-transform">Rozumiem</button>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
});