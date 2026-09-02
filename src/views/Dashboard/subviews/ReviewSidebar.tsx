'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Star, User, ExternalLink, AlertTriangle, Send, CheckCircle2, CalendarDays, ChevronRight } from 'lucide-react';
import { useSwipeToClose } from '../../../hooks/useSwipeToClose';
import { UserAvatar } from '../../../components/ui/UserAvatar';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../../../plugins/NativeNav';
import { apiClient } from '../../../services/apiClient';
import { useQueryClient } from '@tanstack/react-query';

interface ReviewSidebarProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    review: any;
    onClose: () => void;
    onOpenReport: (type: 'review' | 'profile') => void;
    isModalOpen?: boolean;
}

const DetailItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
        <div className="flex items-center gap-3 text-gray-400">
            {icon}
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <span className="font-bold text-gray-900 text-sm">{value}</span>
    </div>
);

export const ReviewSidebar = ({ review, onClose, onOpenReport, isModalOpen }: ReviewSidebarProps) => {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { panelRef, panelX, isNative, triggerClose } = useSwipeToClose(!!review && !isModalOpen, onClose);
    const [replyText, setReplyText] = useState(review?.ownerReply ?? '');
    const [sendingReply, setSendingReply] = useState(false);
    const [replySent, setReplySent] = useState(false);

    useEffect(() => {
        setReplyText(review?.ownerReply ?? '');
        setReplySent(false);
    }, [review?.id, review?.ownerReply]);

    const handleSendReply = async () => {
        if (!replyText.trim() || !review?.id) return;
        setSendingReply(true);
        try {
            const res = await apiClient.post(`/reviews/${review.id}/reply`, { reply: replyText.trim() });
            if (res.ok) {
                setReplySent(true);
                queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
            }
        } catch {
            // network error
        } finally {
            setSendingReply(false);
        }
    };

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isModalOpen) onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose, isModalOpen]);

    if (!review) return null;

    const ratingValue = review.rating ?? 5;
    const serviceNavId = review.servicePublicId ?? review.serviceId;

    return createPortal(
        <>
            {!isNative && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => { if (!isModalOpen) onClose(); }}
                    className="fixed inset-0 bg-black/20 backdrop-blur-md z-[60]"
                />
            )}

            <motion.div
                ref={panelRef}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={isNative ? { x: '100%', transition: { duration: 0 } } : { x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{ x: panelX, paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(2rem + var(--bottom-nav-total-h, env(safe-area-inset-bottom, 0px)))' }}
                data-modal-panel
                className="fixed right-0 top-0 h-full w-full md:w-[450px] bg-white z-[70] shadow-2xl p-8 flex flex-col text-left overflow-hidden"
            >
                <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-gray-50" />

                {/* NAGŁÓWEK */}
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <button
                        onClick={triggerClose}
                        className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <X size={20} className="text-gray-900" />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        Szczegóły opinii
                    </span>
                    <div className="w-10" />
                </div>

                {/* TREŚĆ */}
                <div className="flex flex-col items-center text-center space-y-5 flex-1 justify-center min-h-0 overflow-y-auto scrollbar-hide">

                    {/* Hero */}
                    <div className="flex flex-col items-center">
                        {review.autoGenerated ? (
                            <div className="w-16 h-16 bg-amber-50 text-amber-400 rounded-[2rem] flex items-center justify-center mb-3">
                                <Star size={32} fill="currentColor" />
                            </div>
                        ) : (
                            <div className="relative mb-3">
                                <UserAvatar src={review.userAvatar} name={review.userName || '?'} size={64} className="rounded-[2rem] border-2 border-indigo-50 shadow-sm" />
                                <div className="absolute -bottom-2 -right-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100 text-amber-400">
                                    <Star size={14} fill="currentColor" />
                                </div>
                            </div>
                        )}
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                            {review.autoGenerated ? 'Automatyczna' : review.userName}
                        </h3>
                        {!review.autoGenerated && (
                            <div className="flex items-center justify-center gap-0.5 mt-2">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={14} fill={i < ratingValue ? 'currentColor' : 'none'} className={i < ratingValue ? 'text-amber-400' : 'text-gray-200'} />
                                ))}
                            </div>
                        )}
                        {review.autoGenerated && (
                            <p className="text-indigo-500 font-black text-[10px] uppercase tracking-widest mt-2">Opinia automatyczna</p>
                        )}

                        {/* Przyciski nawigacji — profil */}
                        {!review.autoGenerated && review.userUid && (
                            <button
                                onClick={async () => { onClose(); if (Capacitor.isNativePlatform()) { sessionStorage.setItem('nav_scroll_' + window.location.pathname, String(window.scrollY)); await NativeNav.push().catch(() => {}); } router.push(`/profile/${review.userUid}`); }}
                                className="mt-3 flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full px-4 py-2 active:scale-[0.97]"
                            >
                                <User size={13} className="text-gray-500" />
                                <span className="text-[11px] font-black text-gray-600 uppercase tracking-widest">Zobacz profil</span>
                            </button>
                        )}
                    </div>

                    {/* Detail items */}
                    <div className="w-full space-y-1">
                        {!review.autoGenerated && (
                            <DetailItem icon={<Star size={16} />} label="Ocena" value={`${ratingValue} / 5`} />
                        )}
                        {review.createdAt && (
                            <DetailItem icon={<CalendarDays size={16} />} label="Data" value={new Date(review.createdAt).toLocaleDateString('pl-PL')} />
                        )}
                    </div>

                    {/* Karta ogłoszenia — klikalna */}
                    <div className="w-full">
                        {serviceNavId ? (
                            <button
                                onClick={async () => { onClose(); if (Capacitor.isNativePlatform()) { sessionStorage.setItem('nav_scroll_' + window.location.pathname, String(window.scrollY)); await NativeNav.push().catch(() => {}); } router.push(`/service/${serviceNavId}`); }}
                                className="w-full bg-gray-50 rounded-[2rem] p-6 border border-gray-100 text-left hover:bg-indigo-50/40 hover:border-indigo-100 transition-all active:scale-[0.98] group"
                            >
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <ExternalLink size={12} /> Ogłoszenie
                                </p>
                                <div className="flex items-center justify-between gap-3">
                                    <p className="font-bold text-gray-900">{review.serviceTitle || '—'}</p>
                                    <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
                                </div>
                            </button>
                        ) : (
                            <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <ExternalLink size={12} /> Ogłoszenie
                                </p>
                                <p className="font-bold text-gray-900">{review.serviceTitle || '—'}</p>
                            </div>
                        )}
                    </div>

                    {/* Treść opinii */}
                    <div className="w-full">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Treść recenzji</p>
                        <p className="text-gray-600 font-medium text-sm leading-relaxed bg-indigo-50/30 p-5 rounded-[2rem] border border-indigo-50/50 italic">
                            {review.text ? `"${review.text}"` : <span className="not-italic text-gray-400">Brak komentarza</span>}
                        </p>
                    </div>

                    {/* Odpowiedź */}
                    {!review.autoGenerated && (
                        <div className="w-full">
                            <div className="flex items-center gap-2 mb-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {review.ownerReply ? 'Twoja odpowiedź' : 'Odpowiedz na opinię'}
                                </p>
                                {replySent && (
                                    <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                        <CheckCircle2 size={10} /> Zapisano
                                    </span>
                                )}
                            </div>
                            <div className={`relative rounded-[1.5rem] border shadow-sm transition-all ${
                                replyText.length > 0 && replyText.trim().length < 5
                                    ? 'border-rose-200 bg-rose-50/30 focus-within:shadow-[inset_0_0_0_3px_rgba(244,63,94,0.12)]'
                                    : 'border-gray-100 bg-gray-50 focus-within:border-indigo-300/70 focus-within:bg-white focus-within:shadow-[inset_0_0_0_3px_rgba(99,102,241,0.14)]'
                            }`}>
                                <textarea
                                    value={replyText}
                                    onChange={e => { setReplyText(e.target.value); setReplySent(false); }}
                                    placeholder="Napisz podziękowanie lub odpowiedź..."
                                    maxLength={2000}
                                    className="w-full h-28 bg-transparent rounded-[1.5rem] p-4 pb-7 text-sm font-medium outline-none resize-none"
                                />
                                <span className={`absolute bottom-2.5 right-4 text-[9px] font-bold pointer-events-none ${
                                    replyText.length > 0 && replyText.trim().length < 5
                                        ? 'text-rose-400'
                                        : replyText.length > 1900 ? 'text-amber-500' : 'text-gray-300'
                                }`}>
                                    {replyText.length > 0 && replyText.trim().length < 5
                                        ? `${replyText.length}/5 min`
                                        : `${replyText.length}/2000`}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* STOPKA */}
                {review.autoGenerated ? (
                    <div className="mt-4 shrink-0">
                        <div className="py-4 bg-gray-50 text-gray-400 rounded-[2rem] text-center text-[10px] font-black uppercase tracking-widest border border-gray-100">
                            Opinia automatyczna — brak dostępnych akcji
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-5 gap-3 mt-4 shrink-0">
                        <button
                            onClick={handleSendReply}
                            disabled={sendingReply || replyText.trim().length < 5 || replyText.trim() === (review.ownerReply ?? '')}
                            className="col-span-4 py-4 bg-[#6366F1] text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-100 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={18} />
                            {sendingReply ? 'Wysyłanie…' : review.ownerReply ? 'Zaktualizuj odpowiedź' : 'Wyślij odpowiedź'}
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onOpenReport('review'); }}
                            className="col-span-1 py-4 bg-rose-50 text-rose-500 rounded-[2rem] transition-all hover:bg-rose-100 flex items-center justify-center border border-rose-100 active:scale-[0.98]"
                        >
                            <AlertTriangle size={20} />
                        </button>
                    </div>
                )}
            </motion.div>
        </>,
        document.body
    );
};
