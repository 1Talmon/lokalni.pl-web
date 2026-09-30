import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { BottomSheetHandle } from '@/components/ui/BottomSheetHandle';
import { lockScroll, unlockScroll } from '@/utils/scrollLock';

const INPUT = 'w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-300';
const LABEL = 'block text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1.5';

interface DgSetupSheetProps {
    initialData: { addressStreet: string; addressCity: string; addressPostal: string };
    onClose: () => void;
    onSave: (data: { addressStreet: string; addressCity: string; addressPostal: string; unregisteredActivityEnabled: true }) => void;
    isSaving: boolean;
}

export const DgSetupSheet = ({ initialData, onClose, onSave, isSaving }: DgSetupSheetProps) => {
    const { sheetDragProps, startDrag, backdropOpacity, triggerClose } = useBottomSheet(onClose, true);
    const [form, setForm] = useState(initialData);

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
        onSave({ ...form, unregisteredActivityEnabled: true });
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
                                    <MapPin size={18} />
                                </div>
                                Dane do ewidencji
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
                            Adres pojawi się na dokumencie PDF ewidencji. Możesz go zmienić w każdej chwili.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 space-y-4" style={{
                        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
                    }}>
                        <div>
                            <label className={LABEL}>Ulica i numer</label>
                            <input
                                type="text"
                                placeholder="np. ul. Kwiatowa 5"
                                value={form.addressStreet}
                                onChange={e => setForm(f => ({ ...f, addressStreet: e.target.value }))}
                                className={INPUT}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={LABEL}>Kod pocztowy</label>
                                <input
                                    type="text"
                                    placeholder="00-000"
                                    value={form.addressPostal}
                                    onChange={e => setForm(f => ({ ...f, addressPostal: e.target.value }))}
                                    className={INPUT}
                                />
                            </div>
                            <div>
                                <label className={LABEL}>Miasto</label>
                                <input
                                    type="text"
                                    placeholder="np. Warszawa"
                                    value={form.addressCity}
                                    onChange={e => setForm(f => ({ ...f, addressCity: e.target.value }))}
                                    className={INPUT}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-3.5 bg-[#6366F1] text-white rounded-xl font-black text-sm tracking-wide hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-[0.98]"
                        >
                            {isSaving ? 'Zapisywanie…' : 'Zapisz i włącz ewidencję'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>,
        document.body
    );
};
