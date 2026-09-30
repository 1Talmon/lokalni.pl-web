import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, MapPin } from 'lucide-react';
import { useBottomSheet } from '@/hooks/useBottomSheet';
import { BottomSheetHandle } from '@/components/ui/BottomSheetHandle';
import { lockScroll, unlockScroll } from '@/utils/scrollLock';

const LABEL = 'block text-xs font-bold text-gray-500 mb-1.5';
const POSTAL_RE = /^\d{2}-\d{3}$/;

function inputCls(hasError: boolean) {
    return `w-full bg-gray-50 rounded-xl p-4 text-sm border-none outline-none transition-all ring-inset font-medium placeholder:text-gray-400 ${
        hasError
            ? 'ring-2 ring-rose-300 focus:ring-2 focus:ring-rose-300'
            : 'focus:ring-2 focus:ring-indigo-100'
    }`;
}

function validate(form: { addressStreet: string; addressPostal: string; addressCity: string }) {
    const e: Partial<Record<keyof typeof form, string>> = {};

    const street = form.addressStreet.trim();
    if (!street) e.addressStreet = 'Ulica i numer są wymagane.';
    else if (street.length < 3) e.addressStreet = 'Minimum 3 znaki.';
    else if (street.length > 150) e.addressStreet = 'Maksymalnie 150 znaków.';

    const postal = form.addressPostal.trim();
    if (!postal) e.addressPostal = 'Kod pocztowy jest wymagany.';
    else if (!POSTAL_RE.test(postal)) e.addressPostal = 'Format: XX-XXX (np. 00-950).';

    const city = form.addressCity.trim();
    if (!city) e.addressCity = 'Miasto jest wymagane.';
    else if (city.length < 2) e.addressCity = 'Minimum 2 znaki.';
    else if (city.length > 100) e.addressCity = 'Maksymalnie 100 znaków.';

    return e;
}

function formatPostal(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 5);
    return digits.length > 2 ? `${digits.slice(0, 2)}-${digits.slice(2)}` : digits;
}

interface DgSetupSheetProps {
    initialData: { addressStreet: string; addressCity: string; addressPostal: string };
    onClose: () => void;
    onSave: (data: { addressStreet: string; addressCity: string; addressPostal: string; unregisteredActivityEnabled: true }) => void;
    isSaving: boolean;
}

export const DgSetupSheet = ({ initialData, onClose, onSave, isSaving }: DgSetupSheetProps) => {
    const { sheetDragProps, startDrag, backdropOpacity, triggerClose } = useBottomSheet(onClose, true);
    const [form, setForm] = useState(initialData);
    const [touched, setTouched] = useState<Partial<Record<keyof typeof form, boolean>>>({});
    const errors = validate(form);

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

    const touch = (field: keyof typeof form) =>
        setTouched(t => ({ ...t, [field]: true }));

    const showErr = (field: keyof typeof form) => !!(touched[field] && errors[field]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched({ addressStreet: true, addressPostal: true, addressCity: true });
        if (Object.keys(validate(form)).length > 0) return;
        onSave({
            addressStreet: form.addressStreet.trim(),
            addressPostal: form.addressPostal.trim(),
            addressCity: form.addressCity.trim(),
            unregisteredActivityEnabled: true,
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

                    <form onSubmit={handleSubmit} className="px-6 pt-5 space-y-4" style={{
                        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
                    }}>
                        <div>
                            <label className={LABEL}>Ulica i numer</label>
                            <input
                                type="text"
                                placeholder="np. ul. Kwiatowa 5"
                                maxLength={150}
                                value={form.addressStreet}
                                onChange={e => setForm(f => ({ ...f, addressStreet: e.target.value }))}
                                onBlur={() => touch('addressStreet')}
                                className={inputCls(showErr('addressStreet'))}
                            />
                            {showErr('addressStreet') && <p className="text-xs text-rose-500 mt-1.5">{errors.addressStreet}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className={LABEL}>Kod pocztowy</label>
                                <input
                                    type="text"
                                    placeholder="00-000"
                                    maxLength={6}
                                    value={form.addressPostal}
                                    onChange={e => setForm(f => ({ ...f, addressPostal: formatPostal(e.target.value) }))}
                                    onBlur={() => touch('addressPostal')}
                                    className={inputCls(showErr('addressPostal'))}
                                />
                                {showErr('addressPostal') && <p className="text-xs text-rose-500 mt-1.5">{errors.addressPostal}</p>}
                            </div>
                            <div>
                                <label className={LABEL}>Miasto</label>
                                <input
                                    type="text"
                                    placeholder="np. Warszawa"
                                    maxLength={100}
                                    value={form.addressCity}
                                    onChange={e => setForm(f => ({ ...f, addressCity: e.target.value }))}
                                    onBlur={() => touch('addressCity')}
                                    className={inputCls(showErr('addressCity'))}
                                />
                                {showErr('addressCity') && <p className="text-xs text-rose-500 mt-1.5">{errors.addressCity}</p>}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full py-4 bg-[#6366F1] text-white rounded-2xl text-[13px] font-bold transition-all hover:bg-[#4F46E5] active:scale-95 shadow-xl shadow-indigo-100 disabled:opacity-70 flex items-center justify-center"
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
