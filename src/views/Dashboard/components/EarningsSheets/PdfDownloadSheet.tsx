import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, FileDown } from 'lucide-react';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { BottomSheetHandle } from '@/components/ui/BottomSheetHandle';
import { lockScroll, unlockScroll } from '@/utils/scrollLock';
import type { UserProfile } from '@/types';

const SELECT = 'w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all';
const LABEL = 'block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5';
const MONTH_NAMES = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const CUR_YEAR = new Date().getFullYear();
const CUR_MONTH = new Date().getMonth() + 1;

interface PdfDownloadSheetProps {
    user?: UserProfile | null;
    onClose: () => void;
    onGenerate: (year: number, month: number | null) => void;
    isGenerating: boolean;
}

export const PdfDownloadSheet = ({ user, onClose, onGenerate, isGenerating }: PdfDownloadSheetProps) => {
    const { sheetDragProps, startDrag, backdropOpacity, triggerClose } = useBottomSheet(onClose, true);
    const [mode, setMode] = useState<'month' | 'year'>('month');
    const [year, setYear] = useState(CUR_YEAR);
    const [month, setMonth] = useState(CUR_MONTH);

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

    const label = mode === 'year' ? `Rok ${year}` : `${MONTH_NAMES[month - 1]} ${year}`;

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
                        {/* Tryb: miesiąc / rok */}
                        <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
                            {(['month', 'year'] as const).map(m => (
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
                                    {m === 'month' ? 'Miesiąc' : 'Cały rok'}
                                </button>
                            ))}
                        </div>

                        <div className={`grid gap-3 ${mode === 'month' ? 'grid-cols-2' : 'grid-cols-1'}`}>
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
                            onClick={() => onGenerate(year, mode === 'year' ? null : month)}
                            disabled={isGenerating}
                            className="w-full py-3.5 bg-[#6366F1] text-white rounded-xl font-black text-sm tracking-wide hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <FileDown size={16} />
                            {isGenerating ? 'Generowanie…' : `Pobierz PDF — ${label}`}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>,
        document.body
    );
};
