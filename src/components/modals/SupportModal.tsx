'use client';
import { useState, useEffect } from 'react';
import { Wrench, CreditCard, AlertTriangle, User, HelpCircle, CheckCircle, ChevronRight, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { SheetModal } from './SheetModal';
import { MODAL_BTN_PRIMARY, MODAL_BTN_SECONDARY } from './modalBase';
import { apiClient } from '../../services/apiClient';
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

    return (
        <SheetModal
            isOpen={isOpen}
            onClose={onClose}
            title={step === 'success' ? 'Zgłoszenie wysłane' : 'Centrum pomocy'}
            icon={Ticket}
            tall
            bodyClassName="overflow-x-hidden"
            footer={step === 'category' ? null : ({ close }) => (
                step === 'form' ? (
                    <>
                        <button type="button" onClick={() => setStep('category')} className={MODAL_BTN_SECONDARY}>Wstecz</button>
                        <button
                            type="submit"
                            form="support-form"
                            disabled={isSending || !subject.trim() || !body.trim()}
                            className={MODAL_BTN_PRIMARY}
                        >
                            {isSending ? 'Wysyłanie…' : 'Wyślij zgłoszenie'}
                        </button>
                    </>
                ) : (
                    <button type="button" onClick={close} className={MODAL_BTN_PRIMARY}>Gotowe</button>
                )
            )}
        >
            {stepsJSX}
        </SheetModal>
    );
};
