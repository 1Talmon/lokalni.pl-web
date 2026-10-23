'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Check, Loader2, Sparkles, Calendar, Award, Image, Megaphone, Star } from 'lucide-react';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { BottomSheetHandle } from '../ui/BottomSheetHandle';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { useMyProfile } from '../../hooks/useMyProfile';
import { getStripeConfig } from '../../services/stripeBilling';
import { WebSubscriptionPanel } from './WebSubscriptionPanel';

interface PremiumUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const BENEFITS = [
    { icon: Star,     text: 'Wyższe miejsce w wynikach i odznaka Plus', short: 'Wyżej w wynikach + odznaka' },
    { icon: Calendar, text: 'Grafik pracy i zarządzanie dostępnością', short: 'Grafik pracy' },
    { icon: Image,    text: 'Własne zdjęcie tła na profilu publicznym', short: 'Własne tło profilu' },
    { icon: Megaphone,text: 'Aktualności dla obserwujących klientów', short: 'Aktualności' },
    { icon: Award,    text: 'Certyfikaty i kompetencje na profilu', short: 'Certyfikaty' },
];

export const PremiumUpgradeModal = ({ isOpen, onClose, onSuccess }: PremiumUpgradeModalProps) => {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const queryClient = useQueryClient();
    // Real account state, so the sheet never offers something that will fail (App Review, 2026-10-01).
    const { data: me, isLoading: meLoading } = useMyProfile(isOpen);
    const plusActive = !!me?.isPremium;
    const trialUsed = !plusActive && !!me?.premiumTrialUsed;
    const activeUntil = me?.premiumExpiresAt
        ? new Date(me.premiumExpiresAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })
        : null;
    // Paid Plus on the website (Stripe) — shown only when sales are switched on or a subscription already exists
    const { data: stripeCfg } = useQuery({ queryKey: ['stripe-config'], queryFn: getStripeConfig, enabled: isOpen, staleTime: 30_000, retry: false });
    const showStripe = !!stripeCfg && (
        (stripeCfg.enabled && stripeCfg.plans.length > 0) || (stripeCfg.isPremium && (stripeCfg.premiumSource === 'stripe' || stripeCfg.premiumSource === 'apple'))
    );
    const compact = showStripe && !(stripeCfg?.isPremium && stripeCfg.premiumSource !== 'trial' && stripeCfg.premiumSource !== 'admin');
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

    // Plus jest bezpłatny: 30 dni raz na konto, wygasa sam. Brak jakichkolwiek płatności (App Store 3.1.1).
    const handleClaim = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await apiClient.post('/users/me/premium/trial', {});
            if (!res.ok) {
                setError(res.status === 409
                    ? 'Darmowy miesiąc został już wykorzystany na tym koncie.'
                    : 'Nie udało się aktywować Plus. Spróbuj ponownie.');
                return;
            }
            await queryClient.invalidateQueries({ queryKey: ['my-profile'] });
            setDone(true);
            await new Promise(r => setTimeout(r, 1000));
            onSuccess();
            setDone(false);
        } catch {
            setError('Brak połączenia. Spróbuj ponownie.');
        } finally {
            setLoading(false);
        }
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
                        className="pointer-events-auto w-full md:max-w-[440px] max-h-[94dvh] flex flex-col overflow-hidden bg-slate-900 md:rounded-[2rem] rounded-t-[2rem] shadow-2xl"
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

                        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {/* Hero */}
                        <div className={`px-8 text-center cursor-grab active:cursor-grabbing ${compact ? 'pb-3 pt-0' : 'pb-8 pt-2'}`} style={{ touchAction: 'none' }} onPointerDown={startDrag}>
                            <div className={`${compact ? 'w-11 h-11 mb-2 rounded-2xl' : 'w-16 h-16 mb-5 rounded-3xl'} bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30`}>
                                <Sparkles size={compact ? 20 : 28} className="text-white" />
                            </div>
                            <h2 className={`font-black text-white tracking-tight ${compact ? 'text-xl mb-1' : 'text-2xl mb-2'}`}>
                                MyLokalni Plus
                            </h2>
                            <p className={`text-slate-400 font-medium leading-relaxed ${compact ? 'text-[13px]' : 'text-sm'}`}>
                                Bądź wyżej w wynikach i łatwiej zdobywaj klientów.
                            </p>
                        </div>

                        {/* Benefity */}
                        {compact ? (
                            <div className="px-6 mb-3 flex flex-wrap justify-center gap-1.5">
                                {BENEFITS.map(({ icon: Icon, text, short }) => (
                                    <span key={text} className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-[11.5px] font-semibold text-slate-300">
                                        <Icon size={12} className="text-amber-400" /> {short}
                                    </span>
                                ))}
                            </div>
                        ) : (
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
                        )}

                        {/* Stan konta + CTA */}
                        <div className="px-6 pb-8" style={{ paddingBottom: 'calc(var(--native-cta-h, var(--bottom-nav-total-h, env(safe-area-inset-bottom))) + 2rem)' }}>
                            {showStripe && stripeCfg && !done ? (
                                <WebSubscriptionPanel config={stripeCfg} />
                            ) : plusActive && !done ? (
                                <>
                                    <div className="bg-white/5 rounded-2xl p-4 mb-4 text-center">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Twój status</p>
                                        <p className="text-xl font-black text-white">Plus jest aktywny</p>
                                        {activeUntil && <p className="text-[12px] text-slate-400 font-medium mt-1">do {activeUntil}</p>}
                                    </div>
                                    <button onClick={() => triggerClose()} className="w-full py-4 rounded-2xl font-black text-base bg-white/10 text-white hover:bg-white/15 active:scale-95 transition-all">
                                        Zamknij
                                    </button>
                                </>
                            ) : trialUsed && !done ? (
                                <>
                                    <div className="bg-white/5 rounded-2xl p-4 mb-4 text-center">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Darmowy miesiąc wykorzystany</p>
                                        <p className="text-[13px] text-slate-300 font-medium leading-relaxed">
                                            Na tym koncie wykorzystano już bezpłatny miesiąc Plus. Plus nie jest obecnie dostępny w sprzedaży — damy znać, gdy pojawi się nowa możliwość.
                                        </p>
                                    </div>
                                    <button onClick={() => triggerClose()} className="w-full py-4 rounded-2xl font-black text-base bg-white/10 text-white hover:bg-white/15 active:scale-95 transition-all">
                                        Zamknij
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="bg-white/5 rounded-2xl p-4 flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Bezpłatnie</p>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl font-black text-white">30 dni Plus</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-500 font-medium">Bez płatności</p>
                                            <p className="text-[10px] text-slate-500 font-medium">raz na konto</p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleClaim}
                                        disabled={loading || done || meLoading}
                                        className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-xl shadow-amber-500/30 hover:from-amber-300 hover:to-amber-400 disabled:opacity-80"
                                    >
                                        {done ? (
                                            <><Check size={20} strokeWidth={3} /> Plus aktywowane!</>
                                        ) : loading || meLoading ? (
                                            <><Loader2 size={20} className="animate-spin" /> {loading ? 'Aktywowanie...' : 'Wczytywanie...'}</>
                                        ) : (
                                            <><Sparkles size={18} /> Aktywuj bezpłatnie na 30 dni</>
                                        )}
                                    </button>

                                    {error && (
                                        <p className="text-center text-[12px] text-rose-400 mt-3 font-semibold">{error}</p>
                                    )}
                                    <p className="text-center text-[11px] text-slate-600 mt-3 font-medium">
                                        Plus wyłącza się automatycznie po 30 dniach. Nic nie płacisz.
                                    </p>
                                </>
                            )}
                        </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        ) : null,
        document.body
    );
};
