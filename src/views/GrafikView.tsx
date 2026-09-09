'use client';
import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronLeft, ChevronRight, Ban, Save, Loader2, Check,
    CalendarDays, Bell, Info, PartyPopper,
} from 'lucide-react';
import { authService } from '../services/authService';
import { useBookings } from '../hooks/useBookings';
import { useRouter, usePathname } from 'next/navigation';
import { navPush } from '../utils/navState';
import { PremiumGate } from '../components/premium/PremiumGate';
import { CalendarGrid, WeekStrip } from './GrafikView/CalendarHeader';
import { PlanDayDetail, DayPanel, AgendaSection, WorkingHoursEditor } from './GrafikView/BookingsList';
import { MONTHS_SHORT, fmt, getTodayStr, getWeekStart, getWeekDays } from './GrafikView/helpers';

// ── GŁÓWNY KOMPONENT ───────────────────────────────────────────────────────────

interface GrafikViewProps {
    isLoggedIn?: boolean;
    isPremium?: boolean;
    onUpgrade?: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onBookingAction?: (chatId: any, bookingId: number | string, action: 'accept' | 'decline' | 'cancel' | 'complete') => Promise<void>;
    addToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
    onOpenChat?: (chatId: string) => void;
}

export default function GrafikView({ isLoggedIn = false, isPremium, onUpgrade, onBookingAction, addToast, onOpenChat }: GrafikViewProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { byDate, pendingIncoming, acceptedIncoming, isLoading: bookingsLoading } = useBookings(isLoggedIn);
    const handleComplete = (bookingId: number | string) => onBookingAction?.(null, bookingId, 'complete');

    const currentUser = authService.getCurrentUser();
    const hasAccess = !!(isPremium || currentUser?.isPremium);

    // Shared state
    const [selected, setSelected]   = useState<string | null>(getTodayStr());
    const [busyDays, setBusyDays]   = useState<string[]>([]);
    const [saved, setSaved]         = useState<string[]>([]);
    const [statsReady, setStatsReady] = useState(false);
    const [saving, setSaving]       = useState(false);
    const [editMode, setEditMode]   = useState(false);
    const [workingHours, setWorkingHours] = useState<string[]>([]);
    const [savedHours, setSavedHours]     = useState<string[]>([]);
    const [savingHours, setSavingHours]   = useState(false);
    const [bufferMinutes, setBufferMinutes]     = useState(0);
    const [savedBuffer, setSavedBuffer]         = useState(0);
    const [savingBuffer, setSavingBuffer]       = useState(false);

    // Mobile tabs
    const [activeTab, setActiveTab] = useState<'plan' | 'month'>('plan');

    // Explicit height animation for day-detail — prevents Nadchodzące from jumping
    const dayDetailInnerRef = useRef<HTMLDivElement>(null);
    const [dayDetailHeight, setDayDetailHeight] = useState<number | 'auto'>('auto');

    // Avail-tab panel — same pattern, animates between concrete px values (no height:'auto' jank)
    const availDayInnerRef = useRef<HTMLDivElement>(null);
    const [availDayHeight, setAvailDayHeight] = useState<number>(0);

    // Plan tab — week navigation
    const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
    const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
    const weekLabel = `${weekDays[0].getDate()} – ${weekDays[6].getDate()} ${MONTHS_SHORT[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`;

    // Month tab — month navigation
    const [date, setDate] = useState(new Date());
    const y = date.getFullYear();
    const m = date.getMonth();

    const prevWeek = useCallback(() => {
        setWeekStart(ws => { const d = new Date(ws); d.setDate(d.getDate() - 7); return d; });
    }, []);
    const nextWeek = useCallback(() => {
        setWeekStart(ws => { const d = new Date(ws); d.setDate(d.getDate() + 7); return d; });
    }, []);

    const handleTabSwitch = (tab: 'plan' | 'month') => {
        setActiveTab(tab);
        setEditMode(false);
        if (tab === 'month') {
            setDate(new Date(weekStart.getFullYear(), weekStart.getMonth()));
            setSelected(null);
        }
        if (tab === 'plan') {
            setWeekStart(getWeekStart(date));
            setSelected(getTodayStr());
        }
    };

    useLayoutEffect(() => {
        if (pathname !== '/calendar') {
            setEditMode(false);
            setActiveTab('plan');
        } else {
            const today = new Date();
            setDate(new Date(today.getFullYear(), today.getMonth()));
            setWeekStart(getWeekStart(today));
            setSelected(getTodayStr());
        }
    }, [pathname]);

    useEffect(() => {
        authService.getWorkingHours().then(h => {
            if (h) { setWorkingHours(h); setSavedHours(h); }
        });
        authService.getBufferMinutes().then(b => { setBufferMinutes(b); setSavedBuffer(b); });
    }, []);

    useEffect(() => {
        let ok = true;
        setStatsReady(false);
        setBusyDays([]);
        setSaved([]);
        authService.getAvailability(y, m + 1)
            .then(d => { if (ok) { setBusyDays(d?.busyDays ?? []); setSaved(d?.busyDays ?? []); setStatsReady(true); } })
            .catch(() => { if (ok) { setStatsReady(true); addToast?.('Nie udało się pobrać grafiku', 'error'); } });
        return () => { ok = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [y, m]);

    // Measure day-detail content height after every render (before paint) so height animates smoothly
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useLayoutEffect(() => {
        const h = dayDetailInnerRef.current?.offsetHeight ?? 0;
        if (h > 0) setDayDetailHeight(prev => (prev === h ? prev : h));
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useLayoutEffect(() => {
        const h = availDayInnerRef.current?.offsetHeight ?? 0;
        if (h > 0) setAvailDayHeight(prev => (prev === h ? prev : h));
    });

    const cal = useMemo(() => {
        const days = new Date(y, m + 1, 0).getDate();
        const raw  = new Date(y, m, 1).getDay();
        return { days, offset: raw === 0 ? 6 : raw - 1 };
    }, [y, m]);

    const workDays   = cal.days - busyDays.length;
    const hasChanges = JSON.stringify([...busyDays].sort()) !== JSON.stringify([...saved].sort());

    const toggleDay = useCallback((day: number) => {
        const ds = fmt(y, m, day);
        setBusyDays(p => p.includes(ds) ? p.filter(d => d !== ds) : [...p, ds]);
    }, [y, m]);

    const toggleWeekends = useCallback(() => {
        const wk: string[] = [];
        for (let d = 1; d <= cal.days; d++) {
            const dow = new Date(y, m, d).getDay();
            if (dow === 0 || dow === 6) wk.push(fmt(y, m, d));
        }
        const allOn = wk.every(d => busyDays.includes(d));
        setBusyDays(p => allOn ? p.filter(d => !wk.includes(d)) : [...new Set([...p, ...wk])]);
    }, [y, m, cal.days, busyDays]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const off = busyDays.filter(d => !saved.includes(d));
            const on  = saved.filter(d => !busyDays.includes(d));
            await authService.updateAvailability(off, on);
            setSaved(busyDays);
            setEditMode(false);
            addToast?.('Grafik zaktualizowany', 'success');
        } catch { addToast?.('Błąd zapisu', 'error'); }
        finally { setSaving(false); }
    };

    const toggleHour = useCallback((h: string) => {
        setWorkingHours(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h].sort());
    }, []);

    const handleSaveHours = async () => {
        setSavingHours(true);
        try {
            await authService.updateWorkingHours(workingHours);
            setSavedHours(workingHours);
            addToast?.('Godziny pracy zaktualizowane', 'success');
        } catch { addToast?.('Błąd zapisu godzin', 'error'); }
        finally { setSavingHours(false); }
    };

    const handleSaveBuffer = async () => {
        setSavingBuffer(true);
        try {
            await authService.updateBufferMinutes(bufferMinutes);
            setSavedBuffer(bufferMinutes);
            addToast?.('Przerwa między wizytami zapisana', 'success');
        } catch { addToast?.('Błąd zapisu przerwy', 'error'); }
        finally { setSavingBuffer(false); }
    };

    const handleSelectDay = useCallback((ds: string) => { setSelected(ds || null); }, []);

    const handleSelectUpcoming = useCallback((dateKey: string) => {
        const d = new Date(dateKey + 'T00:00');
        setWeekStart(getWeekStart(d));
        setDate(new Date(d.getFullYear(), d.getMonth()));
        setSelected(dateKey);
        setEditMode(false);
    }, []);

    // Swipe tydzień
    const weekSwipeRef = useRef<{ x: number; y: number } | null>(null);
    const onWeekSwipeStart = useCallback((e: React.TouchEvent) => {
        weekSwipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, []);
    const onWeekSwipeEnd = useCallback((e: React.TouchEvent) => {
        if (!weekSwipeRef.current) return;
        const dx = e.changedTouches[0].clientX - weekSwipeRef.current.x;
        const dy = Math.abs(e.changedTouches[0].clientY - weekSwipeRef.current.y);
        weekSwipeRef.current = null;
        if (Math.abs(dx) < 40 || dy > Math.abs(dx) || Math.abs(dx) > window.innerWidth * 0.6) return;
        if (dx < 0) nextWeek(); else prevWeek();
    }, [nextWeek, prevWeek]);

    // Swipe miesiąc
    const calSwipeRef = useRef<{ x: number; y: number } | null>(null);
    const onCalSwipeStart = useCallback((e: React.TouchEvent) => {
        calSwipeRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, []);
    const onCalSwipeEnd = useCallback((e: React.TouchEvent) => {
        if (!calSwipeRef.current) return;
        const dx = e.changedTouches[0].clientX - calSwipeRef.current.x;
        const dy = Math.abs(e.changedTouches[0].clientY - calSwipeRef.current.y);
        calSwipeRef.current = null;
        if (Math.abs(dx) < 30 || dy > Math.abs(dx) || Math.abs(dx) > window.innerWidth * 0.25) return;
        if (dx < 0) { setDate(new Date(y, m + 1)); setSelected(null); }
        else { setDate(new Date(y, m - 1)); setSelected(null); }
    }, [y, m]);

    const selectedEvents = selected ? (byDate[selected] || []) : [];

    const upcomingEvents = useMemo(() =>
        Object.entries(byDate)
            .filter(([date]) => date >= getTodayStr())
            .sort(([a], [b]) => a.localeCompare(b))
            .flatMap(([dateKey, evs]) => evs.map(ev => ({ ...ev, dateKey }))),
    [byDate]);

    const gridProps = {
        y, m,
        daysInMonth: cal.days,
        offset: cal.offset,
        busyDays,
        byDate,
        selected,
        editMode,
        onPrev: () => { setDate(new Date(y, m - 1)); setSelected(null); },
        onNext: () => { setDate(new Date(y, m + 1)); setSelected(null); },
        onToggleDay: toggleDay,
        onSelectDay: handleSelectDay,
    };

    const SaveBtn = () => (
        <button onClick={handleSave} disabled={saving || !hasChanges}
            className={`group relative overflow-hidden px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg isolate transition-all active:scale-95 flex items-center gap-2 ${
                hasChanges ? 'bg-[#6366F1] text-white shadow-indigo-100 hover:bg-[#4F46E5]' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}>
            <div className="flex items-center gap-2 z-20 relative pointer-events-none">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Zapisz
            </div>
            {hasChanges && <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />}
        </button>
    );

    return (
        <PremiumGate isPremium={hasAccess} onUpgrade={onUpgrade ?? (() => undefined)} featureName="Grafik" mode="overlay" overlayAlign="center">
        <div className="max-w-5xl mx-auto py-8 px-4 md:px-6 font-sans text-left pb-40">

            {/* ══ MOBILE ══ */}
            <div className="lg:hidden space-y-4">

                {/* Nagłówek */}
                <div className="mb-6">
                    <p className="text-2xl font-bold text-gray-900 mb-1">Grafik</p>
                    <p className="text-sm text-gray-500 font-medium">Zarządzaj dostępnością i przeglądaj zlecenia.</p>
                </div>

                {/* Banery powiadomień */}
                <AnimatePresence initial={false}>
                    {pendingIncoming.length > 0 && (
                        <motion.div key="pending-banner" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="overflow-hidden">
                            <button onClick={() => navPush(router, '/dashboard', { openTab: 'orders' })} className="w-full bg-[#6366F1] text-white rounded-[2rem] px-5 py-4 flex items-center gap-3 shadow-xl shadow-indigo-100 active:scale-95 transition-all text-left">
                                <div className="w-9 h-9 bg-white/20 rounded-2xl flex items-center justify-center shrink-0"><Bell size={16} /></div>
                                <div>
                                    <p className="font-bold text-sm leading-tight">{pendingIncoming.length} {pendingIncoming.length === 1 ? 'prośba' : 'prośby'} o rezerwację</p>
                                    <p className="text-indigo-200 text-xs font-medium">Przejdź do Rezerwacji →</p>
                                </div>
                            </button>
                        </motion.div>
                    )}
                    {acceptedIncoming.length > 0 && (
                        <motion.div key="accepted-banner" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="overflow-hidden">
                            <button onClick={() => navPush(router, '/dashboard', { openTab: 'orders' })} className="w-full bg-emerald-500 text-white rounded-[2rem] px-5 py-4 flex items-center gap-3 shadow-xl shadow-emerald-100 active:scale-95 transition-all text-left">
                                <div className="w-9 h-9 bg-white/20 rounded-2xl flex items-center justify-center shrink-0"><PartyPopper size={16} /></div>
                                <div>
                                    <p className="font-bold text-sm leading-tight">{acceptedIncoming.length} aktywne {acceptedIncoming.length === 1 ? 'zlecenie' : 'zlecenia'} do zakończenia</p>
                                    <p className="text-emerald-100 text-xs font-medium">Przejdź do Rezerwacji →</p>
                                </div>
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Tab switcher */}
                <div className="bg-gray-100 rounded-2xl p-1 flex gap-1">
                    {(['plan', 'month'] as const).map(tab => (
                        <button key={tab} onClick={() => handleTabSwitch(tab)}
                            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                            }`}>
                            {tab === 'plan' ? 'Plan tygodnia' : 'Dostępność'}
                        </button>
                    ))}
                </div>

                {/* ── TAB: PLAN TYGODNIA ── */}
                <AnimatePresence initial={false} mode="wait">
                {activeTab === 'plan' && (
                    <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-4">

                        {/* Nawigacja tygodnia */}
                        <div className="flex items-center justify-between">
                            <button onClick={prevWeek} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 active:scale-90 transition-all">
                                <ChevronLeft size={18} />
                            </button>
                            <p className="text-sm font-bold text-gray-700">{weekLabel}</p>
                            <button onClick={nextWeek} className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 active:scale-90 transition-all">
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        {/* Pasek dni tygodnia z swipem */}
                        <div onTouchStart={onWeekSwipeStart} onTouchEnd={onWeekSwipeEnd}>
                            <WeekStrip
                                weekDays={weekDays}
                                selected={selected}
                                byDate={byDate}
                                busyDays={busyDays}
                                onSelect={handleSelectDay}
                            />
                        </div>

                        {/* Szczegół dnia — outer div animuje height jawnie, Nadchodzące porusza się płynnie */}
                        <motion.div
                            animate={{ height: dayDetailHeight }}
                            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div ref={dayDetailInnerRef}>
                                {selected ? (
                                    <motion.div key={selected} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                                        <PlanDayDetail selected={selected} events={selectedEvents} busyDays={busyDays} onComplete={handleComplete} onOpenChat={onOpenChat} />
                                    </motion.div>
                                ) : (
                                    <motion.div key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                                        <div className="bg-gray-50 rounded-[2rem] px-5 py-6 flex items-center gap-3 border border-gray-100">
                                            <Info size={16} className="text-gray-300 shrink-0" />
                                            <p className="text-sm text-gray-400 font-medium">Wybierz dzień aby zobaczyć szczegóły</p>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>

                        {/* Nadchodzące */}
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Nadchodzące</p>
                            {bookingsLoading ? (
                                <div className="animate-pulse">
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <div className="h-[11px] w-8 bg-gray-100 rounded-full" />
                                    </div>
                                    <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
                                        <div className="w-1 self-stretch bg-gray-100 rounded-full shrink-0" />
                                        <div className="w-10 text-center shrink-0">
                                            <div className="h-[11px] w-6 bg-gray-100 rounded-full mx-auto" />
                                        </div>
                                        <div className="w-px h-6 bg-gray-100 shrink-0" />
                                        <div className="w-9 h-9 bg-gray-100 rounded-xl shrink-0" />
                                        <div className="flex-1 space-y-1.5 min-w-0">
                                            <div className="h-3 bg-gray-100 rounded-full w-3/4" />
                                            <div className="h-2.5 bg-gray-100 rounded-full w-1/2" />
                                        </div>
                                        <div className="w-3 h-3 bg-gray-100 rounded-full shrink-0" />
                                    </div>
                                </div>
                            ) : (
                                <AgendaSection events={upcomingEvents} onSelect={handleSelectUpcoming} onOpenChat={onOpenChat} />
                            )}
                        </div>

                    </motion.div>
                )}

                {/* ── TAB: DOSTĘPNOŚĆ ── */}
                {activeTab === 'month' && (
                    <motion.div key="month" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-4">

                        {/* Statystyki + kontrolki edycji */}
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500 font-medium">
                                {statsReady
                                    ? <span><span className="text-emerald-600 font-bold">{workDays} pracujących</span> · <span className="text-rose-500 font-bold">{busyDays.length} wolnych</span> dni</span>
                                    : 'Ładowanie…'}
                            </p>
                            <div className="flex items-center gap-2">
                                {editMode && (
                                    <button onClick={toggleWeekends}
                                        className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-500 rounded-xl text-xs font-bold active:scale-95">
                                        <CalendarDays size={13} /> Weekendy
                                    </button>
                                )}
                                <button
                                    onClick={editMode && hasChanges ? handleSave : () => { setEditMode(e => !e); setSelected(null); }}
                                    disabled={saving}
                                    className={`ml-auto w-10 h-10 rounded-full flex items-center justify-center active:scale-90 ${editMode && hasChanges ? 'bg-indigo-600 text-white' : editMode ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : editMode && hasChanges ? <Check size={18} /> : <Ban size={18} />}
                                </button>
                            </div>
                        </div>

                        <div onTouchStart={onCalSwipeStart} onTouchEnd={onCalSwipeEnd}>
                            <CalendarGrid {...gridProps} isMobile />
                        </div>

                        <motion.div
                            animate={{ height: selected ? availDayHeight : 0, opacity: selected ? 1 : 0 }}
                            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div ref={availDayInnerRef}>
                                {selected && (
                                    <motion.div key={selected} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}>
                                        <PlanDayDetail selected={selected} events={selectedEvents} busyDays={busyDays} onComplete={handleComplete} onOpenChat={onOpenChat} />
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>

                        <WorkingHoursEditor hours={workingHours} savedHours={savedHours} saving={savingHours} onToggle={toggleHour} onSave={handleSaveHours} />

                        {/* Przerwa między wizytami */}
                        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="font-bold text-gray-900 text-sm">Przerwa między wizytami</p>
                                    <p className="text-xs text-gray-400 font-medium mt-0.5">Czas na przygotowanie się do kolejnej usługi</p>
                                </div>
                                <button onClick={handleSaveBuffer} disabled={savingBuffer || bufferMinutes === savedBuffer}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-sm ${
                                        bufferMinutes !== savedBuffer ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}>
                                    {savingBuffer ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Zapisz
                                </button>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[0, 10, 15, 30, 45, 60].map(min => (
                                    <button key={min} type="button" onClick={() => setBufferMinutes(min)}
                                        className={`py-3 rounded-xl text-xs font-bold text-center transition-all active:scale-95 ${bufferMinutes === min ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-gray-50 text-gray-600 border border-gray-100 hover:border-indigo-200 hover:text-indigo-600'}`}>
                                        {min === 0 ? 'Brak' : `${min} min`}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">Konkretną wizytę zawsze możesz przesunąć ręcznie w zakładce <span className="font-bold text-gray-500">Rezerwacje</span> → Zmień termin.</p>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

            </div>

            {/* ══ DESKTOP ══ */}
            <div className="hidden lg:block">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <p className="text-2xl font-bold text-gray-900 mb-1">Grafik</p>
                        <p className="text-sm text-gray-500 font-medium">
                            {editMode
                                ? <span className="text-rose-500 font-bold">Tryb edycji — kliknij dzień aby zmienić status</span>
                                : 'Kliknij dzień, aby zobaczyć szczegóły.'}
                        </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {editMode && (
                            <button onClick={toggleWeekends} className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm active:scale-95 bg-white text-gray-600 border-gray-200 hover:border-rose-200 hover:text-rose-600">
                                <CalendarDays size={13} /> Weekendy
                            </button>
                        )}
                        <button onClick={() => { setEditMode(e => !e); setSelected(null); }}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm active:scale-95 ${
                                editMode ? 'bg-rose-500 text-white border-rose-500 shadow-rose-100' : 'bg-white text-gray-600 border-gray-200 hover:border-rose-200 hover:text-rose-600'
                            }`}>
                            <Ban size={13} /> {editMode ? 'Zakończ' : 'Zaznacz wolne'}
                        </button>
                        <SaveBtn />
                    </div>
                </div>

                <div className="grid grid-cols-[1fr_340px] gap-6 items-start">
                    <div className="bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border border-gray-50">
                        <CalendarGrid {...gridProps} />
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Pracuję</p>
                                <div className="flex items-baseline gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 mb-0.5 shrink-0" />
                                    <span className="text-2xl font-black text-gray-900">{statsReady ? workDays : '–'}</span>
                                    <span className="text-sm text-gray-400 font-medium">dni</span>
                                </div>
                            </div>
                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-5">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Wolne</p>
                                <div className="flex items-baseline gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-rose-400 mb-0.5 shrink-0" />
                                    <span className="text-2xl font-black text-gray-900">{statsReady ? busyDays.length : '–'}</span>
                                    <span className="text-sm text-gray-400 font-medium">dni</span>
                                </div>
                            </div>
                        </div>
                        <AnimatePresence initial={false}>
                            {pendingIncoming.length > 0 && (
                                <motion.div key="pending-banner-d" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="overflow-hidden">
                                    <button onClick={() => navPush(router, '/dashboard', { openTab: 'orders' })} className="w-full bg-[#6366F1] text-white rounded-[2rem] px-5 py-4 flex items-center gap-3 shadow-xl shadow-indigo-100 active:scale-95 transition-all text-left">
                                        <div className="w-9 h-9 bg-white/20 rounded-2xl flex items-center justify-center shrink-0"><Bell size={16} /></div>
                                        <div>
                                            <p className="font-bold text-sm leading-tight">{pendingIncoming.length} {pendingIncoming.length === 1 ? 'prośba' : 'prośby'}</p>
                                            <p className="text-indigo-200 text-xs font-medium">Przejdź do Rezerwacji →</p>
                                        </div>
                                    </button>
                                </motion.div>
                            )}
                            {acceptedIncoming.length > 0 && (
                                <motion.div key="accepted-banner-d" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="overflow-hidden">
                                    <button onClick={() => navPush(router, '/dashboard', { openTab: 'orders' })} className="w-full bg-emerald-500 text-white rounded-[2rem] px-5 py-4 flex items-center gap-3 shadow-xl shadow-emerald-100 active:scale-95 transition-all text-left">
                                        <div className="w-9 h-9 bg-white/20 rounded-2xl flex items-center justify-center shrink-0"><PartyPopper size={16} /></div>
                                        <div>
                                            <p className="font-bold text-sm leading-tight">{acceptedIncoming.length} aktywne {acceptedIncoming.length === 1 ? 'zlecenie' : 'zlecenia'}</p>
                                            <p className="text-emerald-100 text-xs font-medium">Przejdź do Rezerwacji →</p>
                                        </div>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <AnimatePresence mode="wait">
                            {selected && !editMode ? (
                                <motion.div key="panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                                    <DayPanel selected={selected} events={selectedEvents} busyDays={busyDays} onClose={() => setSelected(null)} onComplete={handleComplete} />
                                </motion.div>
                            ) : !editMode ? (
                                <motion.div key="upcoming" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                                    <AgendaSection events={upcomingEvents} onSelect={handleSelectUpcoming} onOpenChat={onOpenChat} />
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="mt-6 space-y-4">
                    <WorkingHoursEditor hours={workingHours} savedHours={savedHours} saving={savingHours} onToggle={toggleHour} onSave={handleSaveHours} />

                    {/* Przerwa między wizytami */}
                    <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="font-bold text-gray-900 text-sm">Przerwa między wizytami</p>
                                <p className="text-xs text-gray-400 font-medium mt-0.5">Czas na przygotowanie się do kolejnej usługi</p>
                            </div>
                            <button onClick={handleSaveBuffer} disabled={savingBuffer || bufferMinutes === savedBuffer}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-all shadow-sm ${
                                    bufferMinutes !== savedBuffer ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}>
                                {savingBuffer ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Zapisz
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[0, 10, 15, 30, 45, 60].map(min => (
                                <button key={min} type="button" onClick={() => setBufferMinutes(min)}
                                    className={`py-3 rounded-xl text-xs font-bold text-center transition-all active:scale-95 ${bufferMinutes === min ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-gray-50 text-gray-600 border border-gray-100 hover:border-indigo-200 hover:text-indigo-600'}`}>
                                    {min === 0 ? 'Brak' : `${min} min`}
                                </button>
                            ))}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-3 leading-relaxed">Konkretną wizytę zawsze możesz przesunąć ręcznie w zakładce <span className="font-bold text-gray-500">Rezerwacje</span> → Zmień termin.</p>
                    </div>
                </div>
            </div>

        </div>
        </PremiumGate>
    );
}
