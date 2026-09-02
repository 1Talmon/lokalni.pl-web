'use client';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Wrench, CreditCard, AlertTriangle, User, HelpCircle, CheckCircle, ChevronRight, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { readNavState } from '../utils/navState';
import { useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { apiClient } from '../services/apiClient';

type Category = 'technical' | 'payment' | 'dispute' | 'account' | 'other';
type Step = 'category' | 'form' | 'success';

const CATEGORIES: { id: Category; label: string; desc: string; icon: React.ReactNode; color: string }[] = [
    { id: 'technical', label: 'Techniczny',  desc: 'Błąd w aplikacji, problem z działaniem', icon: <Wrench size={20} />,       color: 'bg-blue-50 text-blue-600' },
    { id: 'payment',   label: 'Płatność',    desc: 'Problem z płatnością lub fakturą',       icon: <CreditCard size={20} />,    color: 'bg-green-50 text-green-600' },
    { id: 'dispute',   label: 'Spór',        desc: 'Problem z rezerwacją lub wykonawcą',     icon: <AlertTriangle size={20} />, color: 'bg-orange-50 text-orange-600' },
    { id: 'account',   label: 'Konto',       desc: 'Problem z kontem lub logowaniem',        icon: <User size={20} />,          color: 'bg-purple-50 text-purple-600' },
    { id: 'other',     label: 'Inne',        desc: 'Inne pytanie lub problem',               icon: <HelpCircle size={20} />,    color: 'bg-gray-50 text-gray-600' },
];

import type { ToastType } from '../types';

interface SupportViewProps {
    addToast: (msg: string, type?: ToastType) => void;
    onClose: () => void;
}

export const SupportView = ({ addToast, onClose }: SupportViewProps) => {
    const navState = readNavState<{ context?: { bookingId?: number; category?: string } | null }>('/support');
    const ctx = navState?.context;

    const [step, setStep] = useState<Step>(ctx?.category ? 'form' : 'category');
    const [category, setCategory] = useState<Category | null>((ctx?.category as Category) ?? null);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [ticketNo, setTicketNo] = useState('');
    const [kbHeight, setKbHeight] = useState(0);

    const isNative = Capacitor.isNativePlatform();
    const contentRef = useRef<HTMLDivElement>(null);
    const queryClient = useQueryClient();

    // ── Swipe z lewej krawędzi → back (JS, bez WKWebView native cache) ────────
    const edgeDragRef = useRef<{ startX: number; startY: number; active: boolean } | null>(null);

    useEffect(() => {
        if (isNative) return; // Na native SupportWrapper obsługuje swipe (capture phase) — tu byłby duplikat
        const EDGE = 22; // px od lewej krawędzi
        const MIN_DX = 60; // minimalne przesunięcie w prawo

        const onTouchStart = (e: TouchEvent) => {
            const t = e.touches[0];
            if (t.clientX > EDGE) return;
            edgeDragRef.current = { startX: t.clientX, startY: t.clientY, active: false };
        };
        const onTouchMove = (e: TouchEvent) => {
            if (!edgeDragRef.current) return;
            const t = e.touches[0];
            const dx = t.clientX - edgeDragRef.current.startX;
            const dy = Math.abs(t.clientY - edgeDragRef.current.startY);
            // Anuluj jeśli ruch bardziej pionowy niż poziomy
            if (!edgeDragRef.current.active && dy > dx) { edgeDragRef.current = null; return; }
            if (dx > 10) edgeDragRef.current.active = true;
        };
        const onTouchEnd = (e: TouchEvent) => {
            if (!edgeDragRef.current?.active) { edgeDragRef.current = null; return; }
            const dx = e.changedTouches[0].clientX - edgeDragRef.current.startX;
            edgeDragRef.current = null;
            if (dx >= MIN_DX) onClose();
        };

        document.addEventListener('touchstart', onTouchStart, { passive: true });
        document.addEventListener('touchmove', onTouchMove, { passive: true });
        document.addEventListener('touchend', onTouchEnd, { passive: true });
        return () => {
            document.removeEventListener('touchstart', onTouchStart);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('touchend', onTouchEnd);
        };
    }, [isNative, onClose]);

    useEffect(() => {
        if (!isNative) return;
        Keyboard.setScroll({ isDisabled: true }).catch((_: unknown) => undefined);
        return () => { Keyboard.setScroll({ isDisabled: false }).catch((_: unknown) => undefined); };
    }, [isNative]);

    useEffect(() => {
        if (!isNative) return;
        let showH: { remove(): void } | undefined;
        let hideH: { remove(): void } | undefined;
        let hideTimer: ReturnType<typeof setTimeout> | null = null;

        Keyboard.addListener('keyboardWillShow', info => {
            if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
            setKbHeight(info.keyboardHeight);
            setTimeout(() => {
                const active = document.activeElement as HTMLElement | null;
                const container = contentRef.current;
                if (!active || !container) return;
                const tag = active.tagName;
                if (tag !== 'INPUT' && tag !== 'TEXTAREA') return;
                const rect = active.getBoundingClientRect();
                const visibleBottom = window.innerHeight - info.keyboardHeight;
                if (rect.bottom > visibleBottom - 24) {
                    container.scrollTop += rect.bottom - (visibleBottom - 24);
                }
            }, 320);
        }).then(h => { showH = h; });

        Keyboard.addListener('keyboardWillHide', () => {
            hideTimer = setTimeout(() => { setKbHeight(0); hideTimer = null; }, 300);
        }).then(h => { hideH = h; });

        return () => {
            showH?.remove();
            hideH?.remove();
            if (hideTimer) clearTimeout(hideTimer);
            setKbHeight(0);
        };
    }, [isNative]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
        };
        window.addEventListener('keydown', handleEsc, true);
        return () => window.removeEventListener('keydown', handleEsc, true);
    }, [onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !subject.trim() || !body.trim()) return;
        setIsSending(true);
        try {
            const res = await apiClient.post('/support/tickets', {
                category,
                subject: subject.trim(),
                body: body.trim(),
                ...(ctx?.bookingId ? { bookingId: ctx.bookingId } : {}),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error ?? 'Błąd wysyłania');
            setTicketNo(data.ticketNo);
            setStep('success');
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
        } catch (err) {
            addToast((err as Error)?.message ?? 'Błąd wysyłania zgłoszenia', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const selectedCat = CATEGORIES.find(c => c.id === category);

    const footerStyle: React.CSSProperties = {
        transform: isNative && kbHeight > 0 ? `translateY(-${kbHeight}px)` : undefined,
        transition: isNative ? 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)' : undefined,
        paddingBottom: kbHeight > 0 ? '12px' : 'var(--bottom-nav-total-h, calc(12px + env(safe-area-inset-bottom)))',
    };

    return (
        <div
            className="fixed inset-0 z-[999997] bg-white flex flex-col"
            style={{ paddingTop: isNative ? 'env(safe-area-inset-top)' : undefined }}
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3 bg-gray-50/50 shrink-0">
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 shrink-0"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="font-bold text-lg text-gray-900 flex items-center gap-2 min-w-0">
                    <div className="p-1.5 bg-indigo-50 text-[#6366F1] rounded-xl shrink-0">
                        <Ticket size={16} />
                    </div>
                    {step === 'success' ? 'Zgłoszenie wysłane' : 'Centrum pomocy'}
                </h1>
            </div>

            {/* Content */}
            <div ref={contentRef} className="overflow-y-auto flex-1 p-6">
                <AnimatePresence mode="wait">
                    {step === 'category' && (
                        <motion.div
                            key="cat"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.18 }}
                        >
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
                        <motion.div
                            key="form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.18 }}
                        >
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
                                        className={`w-full px-4 py-3 border rounded-2xl text-sm focus:outline-none focus:ring-2 transition-all resize-none ${
                                            body.length > 0 && body.length < 10
                                                ? 'ring-2 ring-rose-300 focus:ring-rose-300 border-rose-300 bg-rose-50/40'
                                                : 'border-gray-200 focus:ring-[#6366F1]/30 focus:border-[#6366F1]'
                                        }`}
                                    />
                                    <p className={`text-[10px] font-bold text-right mt-1 ${body.length > 0 && body.length < 10 ? 'text-rose-400' : 'text-gray-300'}`}>
                                        {body.length}/10 min
                                    </p>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {step === 'success' && (
                        <motion.div
                            key="ok"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.22 }}
                            className="text-center py-4"
                        >
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
            </div>

            {/* Footer */}
            <div
                className={`px-6 shrink-0 bg-white ${step !== 'category' ? 'pt-3 border-t border-gray-50' : ''}`}
                style={footerStyle}
            >
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
                        onClick={onClose}
                        className="w-full py-4 rounded-2xl font-black text-white bg-[#6366F1] hover:bg-[#5558e8] transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs active:scale-95"
                    >
                        Gotowe
                    </button>
                )}
            </div>
        </div>
    );
};
