import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, PlusCircle } from 'lucide-react';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { BottomSheetHandle } from '@/components/ui/BottomSheetHandle';
import { lockScroll, unlockScroll } from '@/utils/scrollLock';

const INPUT = 'w-full bg-gray-50 rounded-xl p-4 text-sm border-none focus:ring-2 focus:ring-indigo-100 outline-none transition-all ring-inset font-medium placeholder:text-gray-400';
const LABEL = 'block text-xs font-bold text-gray-500 mb-1.5';

interface ManualIncomeSheetProps {
    onClose: () => void;
    onSave: (entry: { date: string; description: string; amount: number; buyerName?: string }) => void;
    isSaving: boolean;
    isError: boolean;
}

export const ManualIncomeSheet = ({ onClose, onSave, isSaving, isError }: ManualIncomeSheetProps) => {
    const { sheetDragProps, startDrag, backdropOpacity, triggerClose } = useBottomSheet(onClose, true);
    const [form, setForm] = useState({ date: '', description: '', amount: '', buyerName: '' });

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            date: form.date,
            description: form.description,
            amount: parseFloat(form.amount),
            buyerName: form.buyerName || undefined,
        });
    };

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
                                    <PlusCircle size={18} />
                                </div>
                                Dodaj przychód zewnętrzny
                            </h3>
                            <button
                                type="button"
                                onClick={() => triggerClose()}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 pt-5 space-y-4" style={{
                        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
                    }}>
                        <div>
                            <label className={LABEL}>Data</label>
                            <input
                                type="date"
                                required
                                value={form.date}
                                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>Opis usługi / zlecenia</label>
                            <input
                                type="text"
                                required
                                placeholder="np. Sprzątanie mieszkania"
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>Kwota (zł)</label>
                            <input
                                type="number"
                                required
                                min="0.01"
                                step="0.01"
                                placeholder="0.00"
                                value={form.amount}
                                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                className={INPUT}
                            />
                        </div>
                        <div>
                            <label className={LABEL}>Nabywca <span className="font-normal normal-case text-gray-300">(opcjonalnie)</span></label>
                            <input
                                type="text"
                                placeholder="np. Jan Kowalski"
                                value={form.buyerName}
                                onChange={e => setForm(f => ({ ...f, buyerName: e.target.value }))}
                                className={INPUT}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-4 bg-[#6366F1] text-white rounded-2xl text-[13px] font-bold transition-all hover:bg-[#4F46E5] active:scale-95 shadow-xl shadow-indigo-100 disabled:opacity-70 flex items-center justify-center"
                        >
                            {isSaving ? 'Dodawanie…' : 'Dodaj przychód'}
                        </button>
                        {isError && (
                            <p className="text-xs text-rose-500 text-center pb-2">Wystąpił błąd. Spróbuj ponownie.</p>
                        )}
                    </form>
                </motion.div>
            </div>
        </div>,
        document.body
    );
};
