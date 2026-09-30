import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, FileDown } from 'lucide-react';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { BottomSheetHandle } from '@/components/ui/BottomSheetHandle';
import { lockScroll, unlockScroll } from '@/utils/scrollLock';
import type { UserProfile } from '@/types';
import type { PdfRange } from '@/utils/generateIncomePDF';

const SELECT = 'w-full bg-gray-50 rounded-xl p-4 text-sm border-none focus:ring-2 focus:ring-indigo-100 outline-none transition-all ring-inset font-medium';
const LABEL = 'block text-xs font-bold text-gray-500 mb-1.5';
const MONTH_NAMES = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const CUR_YEAR = new Date().getFullYear();
const CUR_MONTH = new Date().getMonth() + 1;
const QUARTER_NAMES = ['I', 'II', 'III', 'IV'];
const pad = (n: number) => String(n).padStart(2, '0');
const lastDay = (y: number, m: number) => new Date(y, m, 0).getDate();
type Mode = 'month' | 'quarter' | 'year';
const MODE_LABEL: Record<Mode, string> = { month: 'Miesiąc', quarter: 'Kwartał', year: 'Cały rok' };

/** Zakres dat ewidencji dla wybranego trybu — od 2026 limit rozliczany jest kwartalnie. */
function buildRange(mode: Mode, year: number, month: number, quarter: number): PdfRange {
    if (mode === 'year') return { startDate: `${year}-01-01`, endDate: `${year}-12-31`, label: `Rok ${year}`, fileSuffix: `${year}` };
    if (mode === 'quarter') {
        const sm = (quarter - 1) * 3 + 1, em = sm + 2;
        return { startDate: `${year}-${pad(sm)}-01`, endDate: `${year}-${pad(em)}-${pad(lastDay(year, em))}`, label: `${QUARTER_NAMES[quarter - 1]} kwartał ${year}`, fileSuffix: `${year}-Q${quarter}` };
    }
    return { startDate: `${year}-${pad(month)}-01`, endDate: `${year}-${pad(month)}-${pad(lastDay(year, month))}`, label: `${MONTH_NAMES[month - 1]} ${year}`, fileSuffix: `${year}-${pad(month)}` };
}

interface PdfDownloadSheetProps {
    user?: UserProfile | null;
    onClose: () => void;
    onGenerate: (range: PdfRange) => void;
    isGenerating: boolean;
}

export const PdfDownloadSheet = ({ user, onClose, onGenerate, isGenerating }: PdfDownloadSheetProps) => {
    const { sheetDragProps, startDrag, backdropOpacity, triggerClose } = useBottomSheet(onClose, true);
    const [mode, setMode] = useState<Mode>(CUR_YEAR >= 2026 ? 'quarter' : 'month');
    const [year, setYear] = useState(CUR_YEAR);
    const [month, setMonth] = useState(CUR_MONTH);
    const [quarter, setQuarter] = useState(Math.floor((CUR_MONTH - 1) / 3) + 1);

    useEffect(() => {
        const alreadyLocked = document.documentElement.classList.contains('scroll-locked');
        if (!alreadyLocked) lockScroll();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.stopPropagation(); triggerClose(); }
        };
        window.addEventListener('keydown', onKey, true);
        return () => {
            if (!alreadyLocked) unlockScroll();
            window.removeEventListener('keydown', onKey, true);
        };
    }, [triggerClose]);

    const range = buildRange(mode, year, month, quarter);

    return createPortal(
        <div className="fixed inset-0 z-[300]">
            <motion.div
                style={{ opacity: backdropOpacity }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => triggerClose()}
            />
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
                        className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 shrink-0 cursor-grab active:cursor-grabbing"
                        style={{ touchAction: 'none' }}
                        onPointerDown={startDrag}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <FileDown size={18} />
                                </div>
                                Ewidencja przychodów
                            </h3>
                            <button
                                type="button"
                                onClick={() => triggerClose()}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5 ml-0.5">
                            Pole PESEL pozostawione puste — uzupełnij ręcznie po wydruku.
                        </p>
                    </div>

                    <div className="px-6 pt-5 space-y-5" style={{
                        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
                    }}>
                        {/* Tryb: miesiąc / kwartał / rok */}
                        <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
                            {(['month', 'quarter', 'year'] as const).map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setMode(m)}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-black transition-all ${
                                        mode === m
                                            ? 'bg-white shadow-sm text-gray-900'
                                            : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    {MODE_LABEL[m]}
                                </button>
                            ))}
                        </div>

                        <div className={`grid gap-3 ${mode === 'year' ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {mode === 'quarter' && (
                                <div>
                                    <label className={LABEL}>Kwartał</label>
                                    <select value={quarter} onChange={e => setQuarter(Number(e.target.value))} className={SELECT}>
                                        {QUARTER_NAMES.map((n, i) => (
                                            <option key={i + 1} value={i + 1}>{n} kwartał</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {mode === 'month' && (
                                <div>
                                    <label className={LABEL}>Miesiąc</label>
                                    <select value={month} onChange={e => setMonth(Number(e.target.value))} className={SELECT}>
                                        {MONTH_NAMES.map((n, i) => (
                                            <option key={i + 1} value={i + 1}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className={LABEL}>Rok</label>
                                <select value={year} onChange={e => setYear(Number(e.target.value))} className={SELECT}>
                                    {[CUR_YEAR, CUR_YEAR - 1].map(y => (
                                        <option key={y} value={y}>{y}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Dane podatnika */}
                        {user && (
                            <div className="bg-gray-50 rounded-2xl p-4 text-xs text-gray-500 space-y-0.5">
                                <p className="font-bold text-gray-800">
                                    {[user.imie, user.nazwisko].filter(Boolean).join(' ') || user.name || '—'}
                                </p>
                                {(user.addressStreet || user.addressCity) ? (
                                    <p>{[user.addressStreet, user.addressPostal, user.addressCity].filter(Boolean).join(', ')}</p>
                                ) : (
                                    <p className="text-amber-600 font-medium">Brak adresu — uzupełnij w Ustawieniach</p>
                                )}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => onGenerate(range)}
                            disabled={isGenerating || !user?.addressStreet || !user?.addressCity}
                            className="w-full py-4 bg-[#6366F1] text-white rounded-2xl text-[13px] font-bold transition-all hover:bg-[#4F46E5] active:scale-95 shadow-xl shadow-indigo-100 disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            <FileDown size={16} />
                            {isGenerating ? 'Generowanie…' : `Pobierz PDF — ${range.label}`}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>,
        document.body
    );
};
