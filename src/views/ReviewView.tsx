'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { readNavState } from '../utils/navState';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Loader2, CheckCircle, ArrowLeft, AlertCircle, Clock } from 'lucide-react';
import { Spinner } from '../components/ui/Spinner';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { apiClient } from '../services/apiClient';
import { UserAvatar } from '../components/ui/UserAvatar';

interface ReviewPageState {
    servicePublicId: string;
    serviceTitle: string;
    providerName: string;
    providerAvatar: string;
    bookingId: string;
}

const RATING_LABELS = ['', 'Bardzo słaba', 'Słaba', 'Przeciętna', 'Dobra', 'Doskonała'];
const REVIEW_WINDOW_DAYS = 14;

function isWithinReviewWindow(updatedAt: string): boolean {
    const ms = Date.now() - new Date(updatedAt).getTime();
    return ms < REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export const ReviewView = () => {
    const params = useParams();
    const bookingId = params?.bookingId as string | undefined;
    const router = useRouter();
    const rawState = readNavState<ReviewPageState>(`/review/${bookingId}`);

    const queryClient = useQueryClient();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const [bookingData, setBookingData] = useState<ReviewPageState | null>(rawState);
    const [loadingBooking, setLoadingBooking] = useState(!rawState);
    const [loadError, setLoadError] = useState(false);
    const [isExpired, setIsExpired] = useState(false);
    const [alreadyReviewed, setAlreadyReviewed] = useState(false);
    const [kbHeight, setKbHeight] = useState(0);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        let showH: Awaited<ReturnType<typeof Keyboard.addListener>> | undefined;
        let hideH: Awaited<ReturnType<typeof Keyboard.addListener>> | undefined;
        Keyboard.addListener('keyboardWillShow', info => setKbHeight(info.keyboardHeight)).then(h => { showH = h; });
        Keyboard.addListener('keyboardWillHide', () => setKbHeight(0)).then(h => { hideH = h; });
        return () => { showH?.remove(); hideH?.remove(); };
    }, []);

    // Gdy brak location.state (push notification, link email, deep link) — fetch z API
    useEffect(() => {
        if (rawState || !bookingId) return;
        apiClient.get(`/bookings/${bookingId}`)
            .then(async res => {
                if (!res.ok) throw new Error('not found');
                const b = await res.json();

                if (b.status === 'reviewed' && b.clientReviewed) {
                    setAlreadyReviewed(true);
                    setBookingData({
                        servicePublicId: b.servicePublicId ?? '',
                        serviceTitle: b.serviceTitle ?? 'Usługa',
                        providerName: b.providerName ?? '',
                        providerAvatar: b.providerAvatar ?? '',
                        bookingId: String(bookingId),
                    });
                    return;
                }

                if (b.status === 'reviewed' || (b.updatedAt && !isWithinReviewWindow(b.updatedAt))) {
                    setIsExpired(true);
                    setBookingData({
                        servicePublicId: b.servicePublicId ?? '',
                        serviceTitle: b.serviceTitle ?? 'Usługa',
                        providerName: b.providerName ?? '',
                        providerAvatar: b.providerAvatar ?? '',
                        bookingId: String(bookingId),
                    });
                    return;
                }

                setBookingData({
                    servicePublicId: b.servicePublicId ?? '',
                    serviceTitle: b.serviceTitle ?? 'Usługa',
                    providerName: b.providerName ?? b.providerFirstName ?? '',
                    providerAvatar: b.providerAvatar ?? b.providerProfilowe ?? '',
                    bookingId: String(bookingId),
                });
            })
            .catch(() => setLoadError(true))
            .finally(() => setLoadingBooking(false));
    }, [bookingId, rawState]);

    if (loadingBooking) {
        return (
            <div className="min-h-screen bg-[#F4F4F9] flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    if (loadError || !bookingData) return null;

    const { servicePublicId, serviceTitle, providerName, providerAvatar } = bookingData;
    const displayRating = hoverRating || rating;

    const handleSkip = async () => {
        setIsSkipping(true);
        try {
            await apiClient.post(`/services/${servicePublicId}/reviews/skip`, { bookingId: Number(bookingId) });
        } catch {
            // skip jest best-effort
        } finally {
            router.push('/dashboard');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rating || !text.trim() || isSubmitting) return;
        setIsSubmitting(true);
        setError('');
        try {
            const res = await apiClient.post(`/services/${servicePublicId}/reviews`, { rating, text: text.trim(), bookingId: Number(bookingId) });
            if (!res.ok) {
                const json = await res.json().catch(() => ({})) as { code?: string };
                if (json.code === 'REVIEW_EXISTS') setError('Opinia dla tej usługi już została wystawiona.');
                else if (json.code === 'INVALID_BOOKING') setError('Minął 14-dniowy termin na wystawienie opinii.');
                else setError('Nie udało się wysłać opinii. Spróbuj ponownie.');
                return;
            }
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
            setSubmitted(true);
        } catch {
            setError('Nie udało się wysłać opinii. Spróbuj ponownie.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const ServiceHeader = ({ label }: { label: string }) => (
        <div className="bg-[#6366F1] px-8 pt-8 pb-10 text-white relative overflow-hidden">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-8 -right-8 w-32 h-32 rounded-full border-[20px] border-white/5 pointer-events-none"
            />
            <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-5">{label}</p>
            <div className="flex items-center gap-4 relative z-10">
                <UserAvatar src={providerAvatar} name={providerName} size={56} className="rounded-2xl border-2 border-white/20" />
                <div>
                    <h2 className="text-xl font-bold leading-tight">{serviceTitle}</h2>
                    <p className="text-indigo-200 text-sm font-medium mt-0.5">{providerName}</p>
                </div>
            </div>
        </div>
    );

    return (
        <div
            className="min-h-screen bg-[#F4F4F9] overflow-y-auto flex flex-col items-center p-4"
            style={{ paddingBottom: kbHeight > 0 ? kbHeight + 16 : undefined }}
        >
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="w-full max-w-md my-auto"
            >
                <AnimatePresence mode="wait">
                    {alreadyReviewed ? (
                        <motion.div
                            key="already-reviewed"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden"
                        >
                            <ServiceHeader label="Oceń usługę" />
                            <div className="px-8 py-10 flex flex-col items-center text-center gap-5">
                                <div className="w-16 h-16 bg-violet-50 rounded-full flex items-center justify-center">
                                    <Star size={32} className="fill-violet-400 text-violet-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">Opinia już wystawiona</h2>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                        Wystawiłeś/aś już opinię dla tej usługi. Dziękujemy za feedback!
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="w-full bg-[#6366F1] text-white rounded-2xl py-3.5 font-bold text-sm hover:bg-[#4F46E5] active:scale-95 transition-all shadow-xl shadow-indigo-100"
                                >
                                    Wróć do dashboardu
                                </button>
                            </div>
                        </motion.div>
                    ) : isExpired ? (
                        <motion.div
                            key="expired"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden"
                        >
                            <ServiceHeader label="Oceń usługę" />
                            <div className="px-8 py-10 flex flex-col items-center text-center gap-5">
                                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
                                    <Clock size={32} className="text-amber-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 mb-2 leading-tight">Czas na opinię minął</h2>
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                        Termin {REVIEW_WINDOW_DAYS} dni na wystawienie opinii dla usługi{' '}
                                        <span className="text-gray-700 font-bold">{serviceTitle}</span> upłynął.
                                    </p>
                                </div>
                                <button
                                    onClick={() => router.push('/dashboard')}
                                    className="w-full bg-[#6366F1] text-white rounded-2xl py-3.5 font-bold text-sm hover:bg-[#4F46E5] active:scale-95 transition-all shadow-xl shadow-indigo-100"
                                >
                                    Wróć do dashboardu
                                </button>
                            </div>
                        </motion.div>
                    ) : submitted ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                            className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-10 flex flex-col items-center text-center gap-5"
                        >
                            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                                <CheckCircle size={40} className="text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">Dziękujemy za opinię!</h2>
                                <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                    Twoja opinia o <span className="text-gray-700 font-bold">{serviceTitle}</span> pomaga innym użytkownikom w wyborze wykonawcy.
                                </p>
                            </div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star
                                        key={s}
                                        size={22}
                                        className={s <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => router.push('/dashboard')}
                                className="w-full bg-[#6366F1] text-white rounded-2xl py-3.5 font-bold text-sm hover:bg-[#4F46E5] active:scale-95 transition-all shadow-xl shadow-indigo-100"
                            >
                                Wróć do dashboardu
                            </button>
                        </motion.div>
                    ) : (
                        <motion.div key="form" className="flex flex-col gap-4">
                            <button
                                onClick={() => router.back()}
                                className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl text-[10px] font-black shadow-sm border border-gray-100 text-gray-700 uppercase tracking-wider transition-all active:scale-95 hover:bg-gray-50 w-fit"
                            >
                                <ArrowLeft size={13} strokeWidth={3} /> Wróć
                            </button>

                            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                                <ServiceHeader label="Oceń usługę" />

                                <form onSubmit={handleSubmit} className="px-8 py-7 space-y-6">
                                    <div>
                                        <p className="text-sm font-bold text-gray-700 mb-3">
                                            Twoja ocena <span className="text-red-400">*</span>
                                        </p>
                                        <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    disabled={isSubmitting}
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    onClick={() => setRating(star)}
                                                    className="p-1.5 transition-transform active:scale-90 disabled:opacity-50"
                                                >
                                                    <Star
                                                        size={32}
                                                        className={`transition-colors duration-100 ${
                                                            star <= displayRating
                                                                ? 'fill-amber-400 text-amber-400'
                                                                : 'fill-gray-200 text-gray-200'
                                                        }`}
                                                    />
                                                </button>
                                            ))}
                                            <AnimatePresence mode="wait">
                                                {displayRating > 0 && (
                                                    <motion.span
                                                        key={displayRating}
                                                        initial={{ opacity: 0, x: 6 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0 }}
                                                        className="ml-2 text-sm font-bold text-gray-500"
                                                    >
                                                        {RATING_LABELS[displayRating]}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-bold text-gray-700 mb-2">
                                            Treść opinii <span className="text-red-400">*</span>
                                        </p>
                                        <textarea
                                            value={text}
                                            onChange={e => setText(e.target.value.slice(0, 500))}
                                            disabled={isSubmitting}
                                            rows={4}
                                            lang="pl"
                                            autoCorrect="on"
                                            autoCapitalize="sentences"
                                            placeholder="Opisz swoje doświadczenie z tym wykonawcą..."
                                            className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#6366F1] transition-all resize-none text-gray-700 text-sm disabled:opacity-60 placeholder:text-gray-400"
                                        />
                                        <p className="text-right text-[10px] font-bold text-gray-400 uppercase tracking-wide mt-1">
                                            {text.length} / 500
                                        </p>
                                    </div>

                                    <AnimatePresence>
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                                                    <AlertCircle size={16} className="shrink-0" />
                                                    {error}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={!rating || !text.trim() || isSubmitting || isSkipping}
                                            className="flex-1 bg-[#6366F1] text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-[#4F46E5] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-xl shadow-indigo-100 flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting
                                                ? <><Loader2 size={16} className="animate-spin" /> Wysyłanie...</>
                                                : 'Opublikuj opinię'
                                            }
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSkip}
                                            disabled={isSubmitting || isSkipping}
                                            className="px-5 py-3.5 bg-white border border-gray-200 rounded-2xl font-bold text-sm text-gray-500 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isSkipping
                                                ? <Loader2 size={14} className="animate-spin" />
                                                : 'Pomiń'
                                            }
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
