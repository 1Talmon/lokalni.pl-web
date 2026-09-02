'use client';
import { useState, useEffect } from 'react';
import { X, Wrench, CreditCard, AlertTriangle, User, HelpCircle, CheckCircle, ChevronRight, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { BottomSheetHandle } from '../ui/BottomSheetHandle';
import { apiClient } from '../../services/apiClient';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import type { ToastType } from '../../types';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
    context?: { bookingId?: number; category?: string } | null;
    onToast?: (msg: string, type?: ToastType) => void;
}

type Category = 'technical' | 'payment' | 'dispute' | 'account' | 'other';
type Step = 'category' | 'form' | 'success';

const CATEGORIES: { id: Category; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    { id: 'technical', label: 'Techniczny',  desc: 'Błąd w aplikacji, problem z działaniem', icon: <Wrench size={20} />,       color: 'bg-blue-50 text-blue-600' },
    { id: 'payment',   label: 'Płatność',    desc: 'Problem z płatnością lub fakturą',       icon: <CreditCard size={20} />,    color: 'bg-green-50 text-green-600' },
    { id: 'dispute',   label: 'Spór',        desc: 'Problem z rezerwacją lub wykonawcą',     icon: <AlertTriangle size={20} />, color: 'bg-orange-50 text-orange-600' },
    { id: 'account',   label: 'Konto',       desc: 'Problem z kontem lub logowaniem',        icon: <User size={20} />,          color: 'bg-purple-50 text-purple-600' },
    { id: 'other',     label: 'Inne',        desc: 'Inne pytanie lub problem',               icon: <HelpCircle size={20} />,    color: 'bg-gray-50 text-gray-600' },
];

export const SupportModal = ({ isOpen, onClose, context, onToast }: SupportModalProps) => {
    const [step, setStep] = useState<Step>('category');
    const [category, setCategory] = useState<Category | null>(null);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [ticketNo, setTicketNo] = useState('');
    const { sheetDragProps, startDrag, backdropOpacity, triggerClose, handleClose } = useBottomSheet(onClose, isOpen);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (isOpen) {
            setStep(context?.category ? 'form' : 'category');
            setCategory((context?.category as Category) ?? null);
            setSubject('');
            setBody('');
            setTicketNo('');
            setIsSending(false);
        }
    }, [isOpen, context]);

    useEffect(() => {
        if (isOpen) lockScroll();
        else unlockScroll();
        return () => { unlockScroll(); };
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) { e.stopPropagation(); triggerClose(); }
        };
        if (isOpen) window.addEventListener('keydown', handleEsc, true);
        return () => window.removeEventListener('keydown', handleEsc, true);
    }, [isOpen, triggerClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !subject.trim() || !body.trim()) return;
        setIsSending(true);
        try {
            const res = await apiClient.post('/support/tickets', {
                category,
                subject: subject.trim(),
                body: body.trim(),
                ...(context?.bookingId ? { bookingId: context.bookingId } : {}),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? 'Błąd wysyłania');
            setTicketNo(data.ticketNo);
            setStep('success');
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
        } catch (err) {
            onToast?.((err as Error)?.message ?? 'Błąd wysyłania zgłoszenia', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const selectedCat = CATEGORIES.find(c => c.id === category);

    const stepsJSX = (
        <AnimatePresence mode="wait">
            {step === 'category' && (
                <motion.div key="cat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Wybierz temat zgłoszenia</p>
                    <div className="space-y-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => { setCategory(cat.id); setStep('form'); }}
                                className="w-full flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:border-[#6366F1]/30 hover:bg-indigo-50/30 transition-all active:scale-[0.98] text-left"
                            >
                                <div className={`p-2.5 rounded-xl shrink-0 ${cat.color}`}>
                                    {cat.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-sm">{cat.label}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{cat.desc}</p>
                                </div>
                                <ChevronRight size={16} className="text-gray-300 shrink-0" />
                            </button>
                        ))}
                    </div>
                </motion.div>
            )}

            {step === 'form' && (
                <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.18 }}>
                    {selectedCat && (
                        <button
                            onClick={() => setStep('category')}
                            className="flex items-center gap-2 mb-5 text-sm font-bold text-[#6366F1] hover:opacity-75 transition-opacity"
                        >
                            <div className={`p-1.5 rounded-lg ${selectedCat.color}`}>{selectedCat.icon}</div>
                            {selectedCat.label} · Zmień
                        </button>
                    )}
                    <form id="support-form" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Temat</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="Krótko opisz problem..."
                                maxLength={255}
                                required
                                lang="pl"
                                autoCorrect="on"
                                autoCapitalize="sentences"
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1] transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Opis</label>
                            <textarea
                                value={body}
                                onChange={e => setBody(e.target.value)}
                                placeholder="Opisz szczegółowo co się dzieje, kiedy problem wystąpił i jakie kroki podjąłeś/aś..."
                                minLength={10}
                                maxLength={5000}
                                required
                                rows={5}
                                lang="pl"
                                autoCorrect="on"
                                autoCapitalize="sentences"
                                className={`w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all resize-none ${body.length > 0 && body.length < 10 ? 'ring-2 ring-rose-300 focus:ring-rose-300 border-rose-300 bg-rose-50/40' : 'border-gray-200 focus:ring-[#6366F1]/30 focus:border-[#6366F1]'}`}
                            />
                            <p className={`text-[10px] font-bold text-right mt-1 ${body.length > 0 && body.length < 10 ? 'text-rose-400' : 'text-gray-300'}`}>
                                {body.length}/10 min
                            </p>
                        </div>
                    </form>
                </motion.div>
            )}

            {step === 'success' && (
                <motion.div key="ok" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.22 }} className="text-center py-4">
                    <div className="flex justify-center mb-5">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                            <CheckCircle size={32} className="text-green-500" />
                        </div>
                    </div>
                    <h4 className="font-black text-gray-900 text-xl mb-2">Zgłoszenie przyjęte!</h4>
                    <p className="text-gray-500 text-sm leading-relaxed mb-5">
                        Otrzymałeś/aś e-mail z potwierdzeniem. Odpiszemy najszybciej jak to możliwe.
                    </p>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 inline-block">
                        <p className="text-xs text-indigo-500 font-bold uppercase tracking-wider mb-1">Numer sprawy</p>
                        <p className="text-xl font-black text-[#6366F1] tracking-wider">{ticketNo}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    const footerButtons = (
        <>
            {step === 'form' && (
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => setStep('category')}
                        className="flex-1 py-4 px-4 rounded-2xl font-black text-gray-500 hover:bg-gray-100 transition-colors uppercase tracking-widest text-xs"
                    >
                        Wstecz
                    </button>
                    <button
                        type="submit"
                        form="support-form"
                        disabled={isSending || !subject.trim() || !body.trim()}
                        className="flex-1 py-4 px-4 rounded-2xl font-black text-white bg-[#6366F1] hover:bg-[#5558e8] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs active:scale-95"
                    >
                        {isSending ? 'Wysyłanie…' : 'Wyślij zgłoszenie'}
                    </button>
                </div>
            )}
            {step === 'success' && (
                <button
                    onClick={handleClose}
                    className="w-full py-4 rounded-2xl font-black text-white bg-[#6366F1] hover:bg-[#5558e8] transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs active:scale-95"
                >
                    Gotowe
                </button>
            )}
        </>
    );

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
                        className="pointer-events-auto bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl relative text-left flex flex-col h-[92dvh] sm:h-[640px] overflow-hidden"
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
                                <div className="p-2 bg-indigo-50 text-[#6366F1] rounded-xl">
                                    <Ticket size={18} />
                                </div>
                                {step === 'success' ? 'Zgłoszenie wysłane' : 'Centrum pomocy'}
                            </h3>
                            <button onClick={handleClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="overflow-y-auto sm:overflow-hidden flex-1 p-6 sm:p-8">
                            {stepsJSX}
                        </div>

                        {/* Footer */}
                        <div
                            className={`px-6 sm:px-8 shrink-0 bg-white ${step !== 'category' ? 'pt-3 border-t border-gray-50' : ''}`}
                            style={{
                                paddingBottom: 'calc(var(--native-cta-h, var(--bottom-nav-total-h, env(safe-area-inset-bottom))) + 32px)',
                            }}
                        >
                            {footerButtons}
                        </div>
                    </motion.div>
                </div>
            </div>
        ) : null,
        document.body
    );
};
