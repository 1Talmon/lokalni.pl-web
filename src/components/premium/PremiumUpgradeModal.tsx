'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Check, Loader2, Sparkles, Calendar, Award, Image, Megaphone, Star } from 'lucide-react';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { BottomSheetHandle } from '../ui/BottomSheetHandle';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

interface PremiumUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const BENEFITS = [
    { icon: Calendar, text: 'Grafik pracy i zarządzanie dostępnością' },
    { icon: Award,    text: 'Certyfikaty i kompetencje na profilu' },
    { icon: Megaphone,text: 'Aktualności dla obserwujących klientów' },
    { icon: Image,    text: 'Własne zdjęcie tła na profilu publicznym' },
    { icon: Star,     text: 'Wyróżnienie w wynikach wyszukiwania' },
];

export const PremiumUpgradeModal = ({ isOpen, onClose, onSuccess }: PremiumUpgradeModalProps) => {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const { sheetDragProps, startDrag, backdropOpacity, triggerClose, handleClose } = useBottomSheet(onClose, isOpen);

    useEffect(() => {
        if (isOpen) lockScroll();
        else unlockScroll();
        return () => unlockScroll();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                triggerClose();
                (document.activeElement as HTMLElement)?.blur();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, triggerClose]);

    const handlePay = async () => {
        setLoading(true);
        await new Promise(r => setTimeout(r, 1800));
        setLoading(false);
        setDone(true);
        await new Promise(r => setTimeout(r, 1000));
        onSuccess();
        setDone(false);
    };

    return createPortal(
        isOpen ? (
            <div className="fixed inset-0 z-[300]">
                {/* Backdrop — fades in real time with drag gesture */}
                <motion.div
                    style={{ opacity: backdropOpacity }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={handleClose}
                />
                {/* Sheet */}
                <div className="absolute inset-0 flex items-end md:items-center justify-center md:p-6 pointer-events-none">
                    <motion.div
                        {...sheetDragProps}
                        onClick={e => e.stopPropagation()}
                        className="pointer-events-auto w-full md:max-w-md bg-slate-900 md:rounded-[2.5rem] rounded-t-[2.5rem] overflow-hidden shadow-2xl"
                    >
                        <BottomSheetHandle onPointerDown={startDrag} dark />
                        <div
                            className="flex justify-end px-4 pb-0 cursor-grab active:cursor-grabbing"
                            style={{ touchAction: 'none' }}
                            onPointerDown={startDrag}
                        >
                            <button onClick={handleClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 active:scale-90 transition-all">
                                <X size={17} />
                            </button>
                        </div>

                        {/* Hero */}
                        <div className="px-8 pb-8 pt-2 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-xl shadow-amber-500/30">
                                <Sparkles size={28} className="text-white" />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                                MyLokalni Plus
                            </h2>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                Wyróżnij się spośród innych wykonawców i zdobywaj więcej klientów.
                            </p>
                        </div>

                        {/* Benefity */}
                        <div className="px-6 space-y-3 mb-6">
                            {BENEFITS.map(({ icon: Icon, text }) => (
                                <div key={text} className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0">
                                        <Icon size={15} className="text-amber-400" />
                                    </div>
                                    <span className="text-slate-300 text-sm font-medium">{text}</span>
                                    <Check size={15} className="text-amber-400 shrink-0 ml-auto" />
                                </div>
                            ))}
                        </div>

                        {/* Cena + CTA */}
                        <div className="px-6 pb-8" style={{ paddingBottom: 'calc(var(--native-cta-h, var(--bottom-nav-total-h, env(safe-area-inset-bottom))) + 2rem)' }}>
                            <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Subskrypcja miesięczna</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-white">30</span>
                                        <span className="text-slate-400 font-bold">zł / mies.</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-500 font-medium">Anuluj</p>
                                    <p className="text-[10px] text-slate-500 font-medium">kiedy chcesz</p>
                                </div>
                            </div>

                            <button
                                onClick={handlePay}
                                disabled={loading || done}
                                className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-xl shadow-amber-500/30 hover:from-amber-300 hover:to-amber-400 disabled:opacity-80"
                            >
                                {done ? (
                                    <><Check size={20} strokeWidth={3} /> Plus aktywowane!</>
                                ) : loading ? (
                                    <><Loader2 size={20} className="animate-spin" /> Przetwarzanie...</>
                                ) : (
                                    <><Sparkles size={18} /> Aktywuj MyLokalni Plus</>
                                )}
                            </button>

                            <p className="text-center text-[11px] text-slate-600 mt-3 font-medium">
                                Bezpieczna płatność · SSL · Bez zobowiązań
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        ) : null,
        document.body
    );
};
