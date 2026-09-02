'use client';
import { useState, useEffect, type ReactNode } from 'react';
import type { UserProfile } from '../../../types';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Star, TrendingUp, Sparkles, PlusCircle, Lock, Unlock, ChevronRight, Copy } from 'lucide-react';
import { authService } from '../../../services/authService';
import { AuthModal } from '../../../components/modals/AuthModal';
import { BiometricAuth } from '../../../utils/biometricBridge';
import { BiometryErrorType } from '@aparajita/capacitor-biometric-auth';
import { logger } from '../../../utils/logger';
import { usePlatform } from '../../../hooks/usePlatform';
import { getMyAnalytics, getMyEarnings } from '../../../services/analyticsService';
import { Share } from '@capacitor/share';

export const DashboardHome = ({
                                  servicesCount,
                                  onNavigate,
                                  onOpenDetail,
                                  user,
                                  addToast,
                              }: {
    servicesCount: number,
    onNavigate: (tab: string) => void,
    onOpenDetail: (view: 'earnings' | 'reviews' | 'analytics') => void,
    user: UserProfile | null,
    addToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void,
}) => {
    const userData = user;

    const headlines = userData?.rekomendacje && userData.rekomendacje.length > 0
        ? userData.rekomendacje
        : [
            { tytul: "Zadbaj o profil", opis: "Uzupełnij brakujące dane, aby przyciągnąć więcej klientów.", napisPrzycisku: "Przejdź do ustawień", akcja: "settings" }
        ];

    const [headlineIndex, setHeadlineIndex] = useState(() =>
        Math.floor(Math.random() * headlines.length)
    );

    const { isNative } = usePlatform();
    const [showAuthModal, setShowAuthModal] = useState(false);

    const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
        queryKey: ['my-analytics', 'month'],
        queryFn: () => getMyAnalytics('month'),
        staleTime: 1000 * 60 * 5,
    });

    const { data: earningsData, isLoading: earningsLoading } = useQuery({
        queryKey: ['my-earnings', 'month'],
        queryFn: () => getMyEarnings('month'),
        staleTime: 1000 * 60 * 5,
    });

    const ratingValue = (() => {
        const v = analyticsData?.kpi?.avgRating;
        if (!v) return '–';
        return Number(v).toFixed(1);
    })();

    const viewsValue = (() => {
        const v = analyticsData?.kpi?.views;
        if (v === null || v === undefined) return '–';
        return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);
    })();

    const earningsValue = (() => {
        const v = earningsData?.kpi?.earnedPeriod;
        if (v === null || v === undefined) return '–';
        return v.toLocaleString('pl-PL', { maximumFractionDigits: 0 }) + ' zł';
    })();

    const isEarningsUnlocked = () => {
        const ts = sessionStorage.getItem('earnings_unlocked_at');
        return ts ? Date.now() - Number(ts) < 5 * 60 * 1000 : false;
    };
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (headlines.length <= 1) return;
        const timer = setInterval(() => setHeadlineIndex((prev) => (prev + 1) % headlines.length), 12000);
        return () => clearInterval(timer);
    }, [headlines.length]);

    const firstName = userData?.imie || userData?.name?.split(' ')[0] || "Użytkowniku";

    const handleAction = async (item: { akcja?: string }) => {
        switch(item.akcja) {
            case 'terminarz':
                onNavigate('calendar');
                break;
            case 'biografia':
            case 'settings':
            case 'odznakaZweryfikowanego':
                onNavigate('settings');
                break;
            case 'services':
                onNavigate('services');
                break;
            case 'kopiujLinkZapraszajacy':
                if (userData?.linkPolecajacy) {
                    const origin = window.location.origin.replace(/^(capacitor|https?):\/\/localhost(:\d+)?/, 'https://mylokalni.pl');
                    const inviteUrl = `${origin}/r/${userData.linkPolecajacy}`;
                    if (isNative) {
                        try { await Share.share({ title: 'Dołącz do MyLokalni.pl', text: 'Zarejestruj się przez mój link!', url: inviteUrl }); } catch { /* anulowane */ }
                    } else {
                        try {
                            await navigator.clipboard.writeText(inviteUrl);
                        } catch {
                            const ta = document.createElement('textarea');
                            ta.value = inviteUrl; ta.style.cssText = 'position:fixed;left:-9999px';
                            document.body.appendChild(ta); ta.focus(); ta.select();
                            document.execCommand('copy'); document.body.removeChild(ta);
                        }
                        addToast?.('Link skopiowany!', 'success');
                    }
                }
                break;
            default:
                onNavigate(item.akcja || 'dashboard');
        }
    };

    const handleEarningsClick = async () => {
        if (isEarningsUnlocked() || userData?.ustawionehaslo === false) {
            onOpenDetail('earnings');
            return;
        }
        const useBiometric = isNative && localStorage.getItem('earnings_unlock_method') === 'biometric';
        logger.debug('[DashboardHome] earnings unlock — useBiometric:', useBiometric, 'stored method:', localStorage.getItem('earnings_unlock_method'));
        if (useBiometric) {
            try {
                await BiometricAuth.authenticate({ reason: 'Odblokuj sekcję Zarobki' });
                sessionStorage.setItem('earnings_unlocked_at', Date.now().toString());
                onOpenDetail('earnings');
            } catch (err) {
                const code = (err as { code?: BiometryErrorType })?.code;
                const userCancelled = code === BiometryErrorType.userCancel
                    || code === BiometryErrorType.systemCancel
                    || code === BiometryErrorType.appCancel;
                if (!userCancelled) {
                    // Face ID niedostępny (wyłączony w Ustawieniach, lockout itp.) — fallback na hasło
                    setShowAuthModal(true);
                }
            }
            return;
        }
        setShowAuthModal(true);
    };

    const handleVerifyPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsVerifying(true);
        setError("");

        try {
            await authService.login(userData?.email ?? '', password);
            sessionStorage.setItem('earnings_unlocked_at', Date.now().toString());
            setShowAuthModal(false);
            setPassword("");
            setShowPassword(false);
            onOpenDetail('earnings');
        } catch {
            setError("Nieprawidłowe hasło");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="space-y-6 relative text-left">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                >
                    <h3 className="text-3xl font-bold text-gray-900 mb-1 leading-tight">
                        Witaj ponownie, {firstName}! <span className="emoji-wave" aria-hidden="true" />
                    </h3>
                    <p className="text-gray-500 text-sm font-medium">Oto co dzieje się w Twojej firmie.</p>
                </motion.div>
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div onClick={() => onNavigate('services')} className="cursor-pointer">
                    <StatCard
                        icon={<LayoutGrid size={20}/>}
                        color="bg-indigo-50 text-indigo-600"
                        value={servicesCount}
                        label="Moje usługi"
                    />
                </div>

                <div onClick={() => onOpenDetail('reviews')} className="cursor-pointer">
                    <StatCard
                        icon={<Star size={20}/>}
                        color="bg-amber-50 text-amber-600"
                        value={ratingValue}
                        label="Opinie"
                        isLoading={analyticsLoading}
                    />
                </div>

                <div onClick={() => onOpenDetail('analytics')} className="cursor-pointer">
                    <StatCard
                        icon={<TrendingUp size={20}/>}
                        color="bg-emerald-50 text-emerald-600"
                        value={viewsValue}
                        label="Wyświetlenia"
                        isLoading={analyticsLoading}
                    />
                </div>

                <div
                    onClick={handleEarningsClick}
                    className="cursor-pointer relative"
                >
                    <StatCard
                        icon={isEarningsUnlocked() ? <Unlock size={20}/> : <Lock size={20}/>}
                        color={isEarningsUnlocked() ? "bg-rose-50 text-rose-600" : "bg-gray-100 text-gray-500"}
                        value={earningsValue}
                        label="Zarobki"
                        isBlur={false}
                        showLock={!isEarningsUnlocked() && userData?.ustawionehaslo !== false}
                        isLoading={earningsLoading}
                    />
                </div>
            </div>

            <div className="bg-[#6366F1] rounded-[2.5rem] text-white relative overflow-hidden shadow-[0_20px_40px_-15px_rgba(99,102,241,0.5)] group">
                <div className="p-8 flex justify-between items-center relative z-20">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-4">
                            <Sparkles size={14}/> Rekomendacja dla Ciebie
                        </div>
                        <div className="min-h-[100px] flex flex-col justify-center">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={headlineIndex}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                >
                                    <h4 className="text-xl font-black mb-2 leading-tight">
                                        {headlines[headlineIndex].tytul}
                                    </h4>
                                    <p className="text-indigo-100 text-sm mb-6 max-w-xs leading-relaxed font-medium">
                                        {headlines[headlineIndex].opis}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        <button
                            onClick={() => handleAction(headlines[headlineIndex])}
                            className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold shadow-xl active:scale-95 hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                            {headlines[headlineIndex].akcja === 'kopiujLinkZapraszajacy' && <Copy size={16} />}
                            {headlines[headlineIndex].napisPrzycisku}
                        </button>
                    </div>
                </div>

                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                    className="absolute -bottom-10 -right-10 opacity-10 group-hover:opacity-20 transition-all duration-500 z-10 pointer-events-none"
                >
                    <PlusCircle size={150} />
                </motion.div>
            </div>

            <AuthModal
                isOpen={showAuthModal}
                onClose={() => {
                    setShowAuthModal(false);
                    setShowPassword(false);
                }}
                onSubmit={handleVerifyPassword}
                password={password}
                setPassword={setPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                isVerifying={isVerifying}
                error={error}
            />
        </div>
    );
};

function StatCard({ icon, color, value, label, isBlur, showLock, isLoading }: {
    icon: ReactNode; color: string; value: ReactNode; label: string;
    isBlur?: boolean; showLock?: boolean; isLoading?: boolean;
}) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white p-5 rounded-3xl shadow-sm border border-gray-50 hover:border-indigo-100 transition-all group h-full flex flex-col justify-between relative overflow-hidden"
        >
            {showLock && (
                <div className="absolute top-4 right-4 text-gray-300">
                    <Lock size={14} />
                </div>
            )}

            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-6`}>{icon}</div>
            <div className="flex flex-col">
                {isLoading ? (
                    <div className="h-5 w-14 bg-gray-100 rounded-lg animate-pulse mb-1" />
                ) : (
                    <div className={`text-xl font-black text-gray-900 leading-none mb-1 ${isBlur ? 'blur-[4px] select-none opacity-50' : ''}`}>
                        {value}
                    </div>
                )}
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</div>
            </div>
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={14} className="text-indigo-300" />
            </div>
        </motion.div>
    );
}