'use client';
import { lockScroll, unlockScroll } from '../../../utils/scrollLock';
import { useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipeBack } from '../../../hooks/useSwipeBack';
import { useQuery } from '@tanstack/react-query';
import {
    ArrowLeft, CheckCircle2, Wallet,
    TrendingUp, ArrowRight, CalendarDays, ChevronDown, Calendar
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { TransactionSidebar } from './TransactionSidebar';
import { UserAvatar } from '../../../components/ui/UserAvatar';
import { getMyEarnings, type AnalyticsRange, type EarningsTransaction } from '../../../services/analyticsService';

type TimeRange = AnalyticsRange;

const fmtPLN = (n: number) =>
    n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';

const fmtPLNShort = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toLocaleString('pl-PL', { maximumFractionDigits: 0 });
};

export const EarningsDetail = ({ onBack }: { onBack: () => void }) => {
    const [range, setRange] = useState<TimeRange>('month');
    const [visibleLimit, setVisibleLimit] = useState(5);
    const [pageSize, setPageSize] = useState(5);
    const [selectedTx, setSelectedTx] = useState<EarningsTransaction | null>(null);
    useSwipeBack(!selectedTx, onBack);

    const { data: earnings, isLoading } = useQuery({
        queryKey: ['my-earnings', range],
        queryFn: () => getMyEarnings(range),
        staleTime: 60_000,
    });

    const kpi = earnings?.kpi;
    const chartData = useMemo(() => earnings?.chart?.data ?? [], [earnings?.chart?.data]);
    const allTransactions = earnings?.transactions ?? [];

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

    const displayedTxs = allTransactions.slice(0, visibleLimit);
    const hasMore = visibleLimit < allTransactions.length;

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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <StatCard title="Przychód" value={kpi ? fmtPLN(kpi.earnedPeriod) : '—'} icon={<TrendingUp size={16} />} isLoading={isLoading} />
                    <StatCard title="Oczekujące" value={kpi ? fmtPLN(kpi.pending) : '—'} icon={<CalendarDays size={16} />} isLoading={isLoading} />
                    <StatCard title="Łącznie zarobione" value={kpi ? fmtPLN(kpi.totalEarned) : '—'} icon={<Wallet size={16} />} isMain isLoading={isLoading} />
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
                            Widoczne: {displayedTxs.length} / {allTransactions.length}
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
                    ) : allTransactions.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                            <CheckCircle2 size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Brak transakcji</p>
                            <p className="text-xs text-gray-400 mt-1">Zarobki pojawią się po zakończeniu rezerwacji</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            <AnimatePresence initial={false}>
                                {displayedTxs.map((tx, index) => (
                                    <motion.div
                                        key={tx.id}
                                        initial={index >= visibleLimit - pageSize ? { height: 0, opacity: 0 } : false}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                    >
                                        <TransactionRow tx={tx} onClick={() => setSelectedTx(tx)} />
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

function StatCard({ title, value, icon, isMain, isLoading }: {
    title: string; value: ReactNode; icon: ReactNode; isMain?: boolean; isLoading?: boolean;
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
                            <div className={`w-24 h-5 animate-pulse rounded-md ${isMain ? 'bg-white/20' : 'bg-gray-100'}`} />
                        )}
                    </AnimatePresence>
                </div>
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
