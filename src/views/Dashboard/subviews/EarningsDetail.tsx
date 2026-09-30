'use client';
import { lockScroll, unlockScroll } from '../../../utils/scrollLock';
import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeBack } from '../../../hooks/useSwipeBack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ArrowLeft, CheckCircle2, Wallet,
    TrendingUp, ArrowRight, CalendarDays, ChevronDown, Calendar,
    AlertTriangle, Plus, FileDown, Trash2,
} from 'lucide-react';
import { ManualIncomeSheet } from '../components/EarningsSheets/ManualIncomeSheet';
import { PdfDownloadSheet } from '../components/EarningsSheets/PdfDownloadSheet';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { TransactionSidebar } from './TransactionSidebar';
import { UserAvatar } from '../../../components/ui/UserAvatar';
import {
    getMyEarnings, getUnregisteredActivity, addManualIncome, deleteManualIncome,
    getManualIncomeList, getIncomeReport,
    type AnalyticsRange, type EarningsTransaction, type ManualIncomeEntry, type UnregisteredActivityData,
} from '../../../services/analyticsService';
import type { UserProfile } from '../../../types';
import { generateIncomePDF, type PdfRange } from '../../../utils/generateIncomePDF';

type TimeRange = AnalyticsRange;

const fmtPLN = (n: number) =>
    n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';

const fmtPLNShort = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toLocaleString('pl-PL', { maximumFractionDigits: 0 });
};

const NOW = new Date();
const CUR_YEAR = NOW.getFullYear();
const CUR_MONTH = NOW.getMonth() + 1;

export const EarningsDetail = ({ onBack, user, addToast }: { onBack: () => void; user?: UserProfile | null; addToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) => {
    const [range, setRange] = useState<TimeRange>('month');
    const [visibleLimit, setVisibleLimit] = useState(5);
    const [pageSize, setPageSize] = useState(5);
    const [selectedTx, setSelectedTx] = useState<EarningsTransaction | null>(null);

    const [showManualModal, setShowManualModal] = useState(false);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [isPdfGenerating, setIsPdfGenerating] = useState(false);

    const queryClient = useQueryClient();
    useSwipeBack(!selectedTx && !showManualModal && !showPdfModal, onBack);

    const { data: earnings, isLoading } = useQuery({
        queryKey: ['my-earnings', range],
        queryFn: () => getMyEarnings(range),
        staleTime: 60_000,
    });

    const dgEnabled = user?.unregisteredActivityEnabled === true;

    const { data: dgData, isLoading: dgLoading } = useQuery({
        queryKey: ['unregistered-activity', CUR_YEAR, CUR_MONTH],
        queryFn: () => getUnregisteredActivity(CUR_YEAR, CUR_MONTH),
        staleTime: 60_000,
        enabled: dgEnabled,
    });

    const dgQueryKey = ['unregistered-activity', CUR_YEAR, CUR_MONTH] as const;
    const manualListKey = ['manual-income-list'] as const;

    const { data: manualList } = useQuery({
        queryKey: manualListKey,
        queryFn: getManualIncomeList,
        staleTime: 60_000,
        enabled: dgEnabled,
    });

    const addManualMutation = useMutation({
        mutationFn: addManualIncome,
        onSuccess: (newEntry) => {
            queryClient.setQueryData(manualListKey, (old: ManualIncomeEntry[] | undefined) =>
                old ? [newEntry, ...old] : [newEntry]
            );
            queryClient.setQueryData(dgQueryKey, (old: UnregisteredActivityData | undefined) =>
                old ? { ...old, manualEntries: [newEntry, ...old.manualEntries] } : old
            );
            void queryClient.invalidateQueries({ queryKey: ['unregistered-activity'] });
            void queryClient.invalidateQueries({ queryKey: manualListKey });
            setShowManualModal(false);
        },
    });

    const deleteManualMutation = useMutation({
        mutationFn: deleteManualIncome,
        onSuccess: (_, id) => {
            queryClient.setQueryData(manualListKey, (old: ManualIncomeEntry[] | undefined) =>
                old ? old.filter(e => e.id !== id) : old
            );
            queryClient.setQueryData(dgQueryKey, (old: UnregisteredActivityData | undefined) =>
                old ? { ...old, manualEntries: old.manualEntries.filter(e => e.id !== id) } : old
            );
            void queryClient.invalidateQueries({ queryKey: ['unregistered-activity'] });
            void queryClient.invalidateQueries({ queryKey: manualListKey });
        },
        onError: () => {
            addToast?.('Nie udało się usunąć wpisu. Spróbuj ponownie.', 'error');
            void queryClient.invalidateQueries({ queryKey: ['unregistered-activity'] });
            void queryClient.invalidateQueries({ queryKey: manualListKey });
        },
    });

    const kpi = earnings?.kpi;
    const chartData = useMemo(() => earnings?.chart?.data ?? [], [earnings?.chart?.data]);
    const allTransactions = earnings?.transactions ?? [];

    const toSortDate = (d: string) => {
        if (d.includes('-')) return d.split('T')[0];
        const [day, mo, yr] = d.split('.');
        return `${yr}-${mo}-${day}`;
    };

    type MixedEntry =
        | { kind: 'tx'; data: EarningsTransaction }
        | { kind: 'manual'; data: ManualIncomeEntry };

    const mergedEntries = useMemo<MixedEntry[]>(() => {
        const txs = allTransactions.map(tx => ({ kind: 'tx' as const, data: tx }));
        const manuals = (dgEnabled && manualList)
            ? manualList.map(e => ({ kind: 'manual' as const, data: e }))
            : [];
        return [...txs, ...manuals].sort((a, b) =>
            toSortDate(b.data.date).localeCompare(toSortDate(a.data.date))
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allTransactions, dgEnabled, manualList]);

    const rangeLabels: Record<TimeRange, string> = { week: 'Tydzień', month: 'Miesiąc', year: 'Rok' };

    const chartPoints = useMemo(() => {
        const DAY = ['Ndz', 'Pon', 'Wt', 'Śr', 'Czw', 'Pią', 'Sob'];
        const MON = ['Sty', 'Lut', 'Mar', 'Kwi', 'Maj', 'Cze', 'Lip', 'Sie', 'Wrz', 'Paź', 'Lis', 'Gru'];
        if (range === 'week') {
            return chartData.map((v, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return { label: DAY[d.getDay()], value: v };
            });
        }
        if (range === 'month') {
            return chartData.map((v, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (29 - i));
                return { label: `${DAY[d.getDay()]} ${d.getDate()}`, value: v };
            });
        }
        return chartData.map((v, i) => ({ label: MON[i] ?? String(i + 1), value: v }));
    }, [chartData, range]);

    const getRangeDates = useCallback(() => {
        const now = new Date();
        const fmt = (d: Date) => d.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' });
        if (range === 'week') { const s = new Date(now); s.setDate(now.getDate() - 6); return `${fmt(s)} – ${fmt(now)}`; }
        if (range === 'month') { const s = new Date(now); s.setDate(now.getDate() - 29); return `${fmt(s)} – ${fmt(now)}`; }
        const s = new Date(now); s.setFullYear(now.getFullYear() - 1); return `${fmt(s)} – ${fmt(now)}`;
    }, [range]);

    useEffect(() => {
        if (selectedTx) lockScroll(); else unlockScroll();
        return () => { unlockScroll(); };
    }, [selectedTx]);

    useEffect(() => {
        const calc = () => {
            const rowH = 88, offset = window.innerWidth < 768 ? 340 : 520;
            const count = Math.max(3, Math.floor((window.innerHeight - offset) / rowH));
            setPageSize(count);
            setVisibleLimit(count);
        };
        calc();
        window.addEventListener('resize', calc);
        return () => window.removeEventListener('resize', calc);
    }, []);

    const handleRangeChange = (r: TimeRange) => {
        if (r === range) return;
        setRange(r);
    };

    const handleGeneratePdf = async (range: PdfRange) => {
        setIsPdfGenerating(true);
        try {
            const reportData = await getIncomeReport(range.startDate, range.endDate);
            generateIncomePDF(reportData, reportData.userData, range);
            setShowPdfModal(false);
        } catch {
            addToast?.('Nie udało się wygenerować PDF. Spróbuj ponownie.', 'error');
        } finally {
            setIsPdfGenerating(false);
        }
    };

    const manualEarnedPeriod = useMemo(() => {
        if (!dgEnabled || !manualList?.length) return 0;
        const cutoff = new Date();
        if (range === 'week') cutoff.setDate(cutoff.getDate() - 7);
        else if (range === 'month') cutoff.setDate(cutoff.getDate() - 30);
        else cutoff.setFullYear(cutoff.getFullYear() - 1);
        const cutoffStr = cutoff.toISOString().slice(0, 10);
        return manualList
            .filter(e => e.date.split('T')[0] >= cutoffStr)
            .reduce((sum, e) => sum + e.amount, 0);
    }, [dgEnabled, manualList, range]);

    const manualTotalEarned = useMemo(() => {
        if (!dgEnabled || !manualList?.length) return 0;
        return manualList.reduce((sum, e) => sum + e.amount, 0);
    }, [dgEnabled, manualList]);

    const displayedEntries = mergedEntries.slice(0, visibleLimit);
    const hasMore = visibleLimit < mergedEntries.length;

    // Od 2026 limit rozliczany kwartalnie — nowe pola API; stare (currentMonth*) jako fallback
    const dgPct = dgData?.periodPercent ?? dgData?.currentMonthPercent ?? 0;
    const dgIncome = dgData?.periodIncome ?? dgData?.currentMonthIncome ?? 0;
    const dgLimit = dgData?.limitAmount ?? dgData?.monthlyLimit ?? 0;
    const dgIsQuarter = dgData?.limitPeriod === 'quarter';
    const dgBarColor = dgData?.warningLevel === 'danger'
        ? 'bg-rose-500'
        : dgData?.warningLevel === 'warning'
        ? 'bg-amber-500'
        : 'bg-emerald-500';

    const MONTH_NAMES = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];

    return (
        <div className="relative">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`space-y-6 text-left pb-24 ${selectedTx ? 'md:blur-sm pointer-events-none' : ''}`}
            >
                <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-4 group">
                    <div className="p-2 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                        <ArrowLeft size={18} />
                    </div>
                    <span className="font-bold text-sm">Powrót do podsumowania</span>
                </button>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Zarobki</h2>
                        <p className="text-gray-500 font-medium">
                            Szczegółowa analityka za <span className="text-[#6366F1] lowercase">{rangeLabels[range]}</span>
                            <span className="block md:inline md:ml-2 text-[10px] font-black uppercase tracking-wider text-gray-300">({getRangeDates()})</span>
                        </p>
                    </div>
                    <div className="flex bg-gray-100/80 backdrop-blur-md p-1 rounded-2xl border border-gray-100 self-start md:self-auto shadow-sm">
                        {(['week', 'month', 'year'] as TimeRange[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => handleRangeChange(r)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                                    range === r ? 'bg-white text-[#6366F1] shadow-sm' : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                {rangeLabels[r]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* DG BANNER */}
                {user === undefined ? (
                    <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 md:p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="space-y-1.5">
                                <div className="h-2.5 w-40 bg-gray-100 rounded animate-pulse" />
                                <div className="h-3 w-32 bg-gray-100 rounded animate-pulse" />
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <div className="h-7 w-28 bg-emerald-100 rounded-xl animate-pulse" />
                                <div className="h-7 w-14 bg-emerald-100 rounded-xl animate-pulse" />
                            </div>
                        </div>
                        <div className="flex justify-between items-end mb-2">
                            <div className="h-8 w-28 bg-emerald-100 rounded-lg animate-pulse" />
                            <div className="h-5 w-10 bg-emerald-100 rounded-lg animate-pulse" />
                        </div>
                        <div className="h-2.5 bg-emerald-100 rounded-full animate-pulse" />
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-emerald-100">
                            <div className="h-2.5 w-24 bg-gray-100 rounded animate-pulse" />
                            <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
                        </div>
                    </div>
                ) : dgEnabled ? (
                    <div className={`rounded-[2rem] border p-5 md:p-6 ${
                        dgData?.warningLevel === 'danger'
                            ? 'bg-rose-50 border-rose-200'
                            : dgData?.warningLevel === 'warning'
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-emerald-50 border-emerald-100'
                    }`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-4">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5">Działalność nierejestrowana</p>
                                <p className="text-xs text-gray-500">
                                    {dgIsQuarter ? 'Bieżący kwartał' : 'Bieżący miesiąc'} — {dgData?.periodLabel ?? `${MONTH_NAMES[CUR_MONTH - 1]} ${CUR_YEAR}`}
                                </p>
                            </div>
                            <div className="flex gap-2 shrink-0">
                                <button
                                    onClick={() => setShowManualModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-wider text-gray-600 hover:border-indigo-200 hover:text-[#6366F1] transition-all"
                                >
                                    <Plus size={12} /> Dodaj przychód
                                </button>
                                <button
                                    onClick={() => setShowPdfModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6366F1] rounded-xl text-[10px] font-black uppercase tracking-wider text-white hover:bg-indigo-700 transition-all"
                                >
                                    <FileDown size={12} /> PDF
                                </button>
                            </div>
                        </div>

                        {dgLoading ? (
                            <>
                                <div className="flex justify-between items-end mb-2">
                                    <div className="h-8 w-28 bg-gray-100 rounded-lg animate-pulse" />
                                    <div className="h-5 w-10 bg-gray-100 rounded-lg animate-pulse" />
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full animate-pulse" />
                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/50">
                                    <div className="h-2.5 w-24 bg-gray-100 rounded animate-pulse" />
                                    <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <span className="text-2xl font-black text-gray-900">
                                            {fmtPLN(dgIncome)}
                                        </span>
                                        <span className="text-xs text-gray-400 ml-1.5">
                                            / {fmtPLN(dgLimit)}
                                        </span>
                                    </div>
                                    <span className={`text-sm font-black ${
                                        dgData?.warningLevel === 'danger' ? 'text-rose-600' :
                                        dgData?.warningLevel === 'warning' ? 'text-amber-600' :
                                        'text-emerald-600'
                                    }`}>
                                        {dgPct.toFixed(1)}%
                                    </span>
                                </div>

                                <div className="h-2.5 bg-white/80 rounded-full overflow-hidden">
                                    <motion.div
                                        className={`h-full rounded-full ${dgBarColor}`}
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(100, dgPct)}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                    />
                                </div>

                                {dgData?.warningLevel === 'danger' && (
                                    <div className="flex items-center gap-2 mt-3 text-rose-600">
                                        <AlertTriangle size={14} />
                                        <span className="text-xs font-bold">
                                            Uwaga — zbliżasz się do limitu {dgIsQuarter ? 'kwartalnego' : 'miesięcznego'}! Po przekroczeniu masz 7 dni na rejestrację w CEIDG.
                                        </span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/50">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rok {CUR_YEAR} łącznie</span>
                                    <span className="text-sm font-black text-gray-700">{fmtPLN(dgData?.ytdIncome ?? 0)}</span>
                                </div>
                            </>
                        )}
                    </div>
                ) : null}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <StatCard title="Przychód" value={kpi ? fmtPLN(kpi.earnedPeriod + manualEarnedPeriod) : '—'} icon={<TrendingUp size={16} />} isLoading={isLoading} />
                    <StatCard title="Oczekujące" value={kpi ? fmtPLN(kpi.pending) : '—'} icon={<CalendarDays size={16} />} isLoading={isLoading} />
                    <StatCard title="Łącznie zarobione" value={kpi ? fmtPLN(kpi.totalEarned + manualTotalEarned) : '—'} icon={<Wallet size={16} />} isMain isLoading={isLoading} subtitle={manualTotalEarned > 0 ? `w tym ${fmtPLN(manualTotalEarned)} zewnętrzne` : undefined} />
                    <StatCard title="Rezerwacje" value={kpi ? String(kpi.completedCount) : '—'} icon={<CheckCircle2 size={16} />} isLoading={isLoading} />
                </div>

                {/* WYKRES */}
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Przychód w czasie</h4>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                            <Calendar size={12} className="text-gray-400" />
                            <span className="text-[10px] font-black text-gray-500 uppercase">{rangeLabels[range]}</span>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="w-full h-52 bg-gray-50 rounded-2xl animate-pulse" />
                    ) : (
                        <ResponsiveContainer width="100%" height={208}>
                            <AreaChart data={chartPoints} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    tick={range === 'month' ? <MonthXTick /> : { fontSize: 9, fontWeight: 700, fill: '#CBD5E1' }}
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                />
                                <YAxis
                                    tick={{ fontSize: 9, fontWeight: 700, fill: '#CBD5E1' }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={fmtPLNShort}
                                    width={40}
                                />
                                <Tooltip
                                    content={<EarningsTooltip />}
                                    cursor={{ stroke: '#6366F1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#6366F1"
                                    strokeWidth={2}
                                    fill="url(#earningsGradient)"
                                    dot={false}
                                    activeDot={{ r: 5, fill: '#6366F1', stroke: '#fff', strokeWidth: 2 }}
                                    isAnimationActive={true}
                                    animationDuration={800}
                                    animationEasing="ease-out"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                        <h4 className="font-bold text-gray-900 text-sm">Ostatnie transakcje</h4>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Widoczne: {displayedEntries.length} / {mergedEntries.length}
                        </span>
                    </div>

                    {isLoading ? (
                        <div className="divide-y divide-gray-50">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="p-5 md:p-6 flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-100 rounded-[1.25rem] animate-pulse shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
                                        <div className="h-2 bg-gray-100 rounded animate-pulse w-1/3" />
                                    </div>
                                    <div className="h-4 w-20 bg-gray-100 rounded animate-pulse" />
                                </div>
                            ))}
                        </div>
                    ) : mergedEntries.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                            <CheckCircle2 size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Brak transakcji</p>
                            <p className="text-xs text-gray-400 mt-1">Zarobki pojawią się po zakończeniu rezerwacji</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            <AnimatePresence initial={false}>
                                {displayedEntries.map((entry, index) => (
                                    <motion.div
                                        key={entry.kind === 'tx' ? `tx-${entry.data.id}` : `m-${entry.data.id}`}
                                        initial={index >= visibleLimit - pageSize ? { height: 0, opacity: 0 } : false}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                    >
                                        {entry.kind === 'tx'
                                            ? <TransactionRow tx={entry.data} onClick={() => setSelectedTx(entry.data)} />
                                            : <ManualEntryRow
                                                entry={entry.data}
                                                onDelete={() => deleteManualMutation.mutate(entry.data.id)}
                                                isDeleting={deleteManualMutation.isPending}
                                              />
                                        }
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}

                    {hasMore && (
                        <button onClick={() => setVisibleLimit(prev => prev + pageSize)}
                            className="w-full py-4 bg-gray-50/50 hover:bg-gray-50 text-gray-400 hover:text-[#6366F1] transition-all flex items-center justify-center gap-2 border-t border-gray-50 group">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pokaż więcej (+{pageSize})</span>
                            <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" />
                        </button>
                    )}
                </div>
            </motion.div>

            <AnimatePresence>
                {selectedTx && (
                    <TransactionSidebar tx={selectedTx} onClose={() => setSelectedTx(null)} />
                )}
            </AnimatePresence>

            {showManualModal && (
                <ManualIncomeSheet
                    onClose={() => setShowManualModal(false)}
                    onSave={entry => addManualMutation.mutate(entry)}
                    isSaving={addManualMutation.isPending}
                    isError={addManualMutation.isError}
                />
            )}

            {showPdfModal && (
                <PdfDownloadSheet
                    user={user}
                    onClose={() => setShowPdfModal(false)}
                    onGenerate={(range) => void handleGeneratePdf(range)}
                    isGenerating={isPdfGenerating}
                />
            )}
        </div>
    );
};

function MonthXTick(props: { x?: number; y?: number; payload?: { value: string } }) {
    const { x = 0, y = 0, payload } = props;
    const label = payload?.value ?? '';
    if (!label.startsWith('Pon ')) return <g />;
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={12} textAnchor="middle" fill="#CBD5E1" fontSize={9} fontWeight={700}>
                {label}
            </text>
        </g>
    );
}

function EarningsTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; value: number } }> }) {
    if (!active || !payload?.length) return null;
    const { label, value } = payload[0].payload;
    return (
        <div style={{ background: '#111827', borderRadius: 12, padding: '8px 12px', pointerEvents: 'none' }}>
            <div style={{ fontSize: 9, fontWeight: 900, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                {label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 900, color: '#fff' }}>
                {fmtPLN(value as number)}
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, isMain, isLoading, subtitle }: {
    title: string; value: ReactNode; icon: ReactNode; isMain?: boolean; isLoading?: boolean; subtitle?: string;
}) {
    return (
        <div className={`relative p-4 md:p-6 rounded-[1.5rem] md:rounded-[1.75rem] border transition-all duration-300 flex md:flex-col items-center md:items-start gap-4 md:gap-0 ${
            isMain ? 'bg-[#6366F1] border-[#6366F1] text-white shadow-lg' : 'bg-white border-gray-100 text-gray-900 shadow-sm'
        }`}>
            <div className={`p-2.5 rounded-xl shrink-0 md:mb-4 ${isMain ? 'bg-white/20' : 'bg-indigo-50 text-[#6366F1]'}`}>
                {icon}
            </div>
            <div className="flex-1 md:w-full text-left">
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.15em] opacity-60 md:mb-1">{title}</p>
                <div className="relative h-6 md:h-8 flex items-center md:block overflow-hidden">
                    <AnimatePresence mode="wait">
                        {!isLoading ? (
                            <motion.p key={String(value)} initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -15, opacity: 0 }}
                                transition={{ duration: 0.3 }} className="text-lg md:text-2xl font-black tracking-tight tabular-nums absolute md:relative">
                                {value}
                            </motion.p>
                        ) : (
                            <div className={`w-20 h-5 animate-pulse rounded-md ${isMain ? 'bg-white/20' : 'bg-gray-100'}`} />
                        )}
                    </AnimatePresence>
                </div>
                {!isLoading && subtitle && (
                    <p className={`text-[9px] font-bold mt-1 tabular-nums hidden md:block ${isMain ? 'text-white/60' : 'text-gray-400'}`}>{subtitle}</p>
                )}
            </div>
        </div>
    );
}

function TransactionRow({ tx, onClick }: { tx: EarningsTransaction; onClick: () => void }) {
    return (
        <div onClick={onClick} className="p-5 md:p-6 flex items-center justify-between hover:bg-gray-50/30 transition-all group cursor-pointer">
            <div className="flex items-center gap-3 md:gap-4 text-left">
                <div className="shrink-0 group-hover:scale-110 transition-transform">
                    <UserAvatar src={tx.clientAvatar} name={tx.clientName || '?'} size={40} className="rounded-xl md:rounded-[1.25rem]" />
                </div>
                <div>
                    <p className="font-black text-gray-900 text-xs md:text-sm line-clamp-1">{tx.serviceTitle}</p>
                    <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                        <span className="text-[9px] md:text-[10px] font-black px-1.5 py-0.5 bg-emerald-100 text-emerald-600 rounded uppercase tracking-tighter">Zakończona</span>
                        <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{tx.dateLabel}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
                <p className="font-black text-gray-900 text-sm md:text-base tabular-nums">+{tx.amount.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł</p>
                <div className="p-2 bg-gray-50 rounded-full text-gray-300 group-hover:text-[#6366F1] group-hover:bg-indigo-50 transition-all">
                    <ArrowRight size={14} />
                </div>
            </div>
        </div>
    );
}

function ManualEntryRow({ entry, onDelete, isDeleting }: {
    entry: ManualIncomeEntry;
    onDelete: () => void;
    isDeleting: boolean;
}) {
    const datePart = entry.date.split('T')[0];
    const [y, m, d] = datePart.split('-');
    const dateLabel = `${d}.${m}.${y}`;
    return (
        <div className="p-5 md:p-6 flex items-center justify-between">
            <div className="flex-1 min-w-0">
                <p className="font-black text-gray-900 text-xs md:text-sm truncate">{entry.description}</p>
                <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                    <span className="text-[9px] md:text-[10px] font-black px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded uppercase tracking-tighter">Zewnętrzny</span>
                    <span className="text-[9px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{dateLabel}</span>
                    {entry.buyerName && (
                        <span className="text-[9px] md:text-[10px] text-gray-400 truncate">{entry.buyerName}</span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
                <p className="font-black text-gray-900 text-sm tabular-nums">+{Number(entry.amount).toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł</p>
                <button
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="p-2 bg-gray-50 rounded-full text-gray-300 hover:text-rose-500 hover:bg-rose-50 transition-all disabled:opacity-50"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}
