'use client';
import { X, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { BottomSheetHandle } from '../ui/BottomSheetHandle';
import { createPortal } from 'react-dom';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'service' | 'profile' | 'review' | null;
    onSubmit: (reason: string) => void;
}

export const ReportModal = ({ isOpen, onClose, type, onSubmit }: ReportModalProps) => {
    const [reason, setReason] = useState('');
    const { sheetDragProps, startDrag, backdropOpacity, triggerClose, handleClose } = useBottomSheet(onClose, isOpen);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) { e.stopPropagation(); triggerClose(); }
        };
        if (isOpen) window.addEventListener('keydown', handleEsc, true);
        return () => window.removeEventListener('keydown', handleEsc, true);
    }, [isOpen, triggerClose]);

    useEffect(() => {
        if (isOpen) lockScroll();
        else unlockScroll();
        return () => { unlockScroll(); };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) setReason('');
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(reason);
        triggerClose();
    };

    const getTexts = () => {
        switch (type) {
            case 'profile':
                return {
                    title: 'Zgłoś profil użytkownika',
                    desc: 'Dlaczego chcesz zgłosić ten profil?',
                    options: ['Fałszywe konto', 'Nękanie', 'Nieodpowiednie treści', 'Inne']
                };
            case 'review':
                return {
                    title: 'Zgłoś opinię',
                    desc: 'Co jest nie tak z tą opinią?',
                    options: ['Spam', 'Wulgaryzmy', 'Fałszywa opinia', 'Treści reklamowe', 'Inne']
                };
            default:
                return {
                    title: 'Zgłoś ogłoszenie',
                    desc: 'Dlaczego chcesz zgłosić to ogłoszenie?',
                    options: ['Oszustwo', 'Zła kategoria', 'Nieaktualne', 'Niedozwolone treści', 'Inne']
                };
        }
    };

    const texts = getTexts();

    return createPortal(
        isOpen ? (
            <div className="fixed inset-0 z-[500]">
                {/* Backdrop — fades in real time with drag gesture */}
                <motion.div
                    style={{ opacity: backdropOpacity }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={handleClose}
                    onTouchMove={e => e.stopPropagation()}
                />
                {/* Sheet */}
                <div className="absolute inset-0 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
                    <motion.div
                        onClick={e => e.stopPropagation()}
                        onTouchMove={e => e.stopPropagation()}
                        {...sheetDragProps}
                        className="pointer-events-auto bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl relative text-left flex flex-col max-h-[92dvh] sm:max-h-[90vh] overflow-hidden"
                    >
                        <div className="sm:hidden">
                            <BottomSheetHandle onPointerDown={startDrag} />
                        </div>

                        {/* Header */}
                        <div
                            className="px-6 sm:px-8 py-4 sm:py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0 sm:cursor-default cursor-grab active:cursor-grabbing"
                            style={{ touchAction: 'none' }}
                            onPointerDown={startDrag}
                        >
                            <h3 className="font-bold text-lg sm:text-xl text-gray-900 flex items-center gap-3">
                                <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
                                    <AlertTriangle size={18} />
                                </div>
                                {texts.title}
                            </h3>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form */}
                        <form
                            id="report-form"
                            onSubmit={handleSubmit}
                            className="overflow-y-auto flex-1 p-6 sm:p-8"
                        >
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                                {texts.desc}
                            </label>
                            <div className="space-y-2">
                                {texts.options.map((option) => (
                                    <label
                                        key={option}
                                        className={`flex items-center gap-3 p-3.5 sm:p-4 border rounded-2xl cursor-pointer transition-all ${
                                            reason === option
                                                ? 'border-[#6366F1] bg-indigo-50/50 shadow-sm'
                                                : 'border-gray-100 hover:border-gray-200'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="reason"
                                            value={option}
                                            checked={reason === option}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="w-4 h-4 text-[#6366F1] border-gray-300 focus:ring-[#6366F1]"
                                        />
                                        <span className={`text-sm font-bold ${reason === option ? 'text-indigo-600' : 'text-gray-600'}`}>
                                            {option}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </form>

                        {/* Buttons */}
                        <div
                            className="px-6 sm:px-8 pt-3 border-t border-gray-50 flex gap-3 shrink-0 bg-white"
                            style={{ paddingBottom: 'calc(var(--native-cta-h, var(--bottom-nav-total-h, env(safe-area-inset-bottom))) + 32px)' }}
                        >
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 py-4 px-4 rounded-2xl font-black text-gray-500 hover:bg-gray-100 transition-colors uppercase tracking-widest text-xs"
                            >
                                Anuluj
                            </button>
                            <button
                                type="submit"
                                form="report-form"
                                disabled={!reason}
                                className="flex-1 py-4 px-4 rounded-2xl font-black text-white bg-red-500 hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-100 uppercase tracking-widest text-xs active:scale-95"
                            >
                                Wyślij zgłoszenie
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        ) : null,
        document.body
    );
};
