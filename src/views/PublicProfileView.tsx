'use client';
import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { ClientPortal } from '../components/ui/ClientPortal';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../plugins/NativeNav';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { logger } from '../utils/logger';
import { polishPlural } from '../utils/helpers';
import { CATEGORIES_DATA } from '../data/categories';
import { apiClient } from '../services/apiClient';
import { normalizeMediaUrl } from '../utils/normalizeUrl';
import {
    ArrowLeft, MapPin, Star, Briefcase, Flag, ShieldCheck,
    MessageCircle, Send, ChevronRight, FileCheck, Calendar,
    CheckCircle, ThumbsUp, Globe, Share2, Trash2
} from 'lucide-react';
import { ProviderProfile, Service, Review } from '../types';
import type { AppActions } from '../types/appTypes';
import { usePlatform } from '../hooks/usePlatform';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const ReportModal = dynamic(() => import('../components/modals/ReportModal').then(m => ({ default: m.ReportModal })));
import { NewsFeedModal, type FeedItem } from '../components/modals/NewsFeedModal';
import { CertificatesModal, type CertOrComp } from '../components/modals/CertificatesModal';
import { ClientPhotosModal } from '../components/modals/ClientPhotosModal';
import { MediaLightbox } from '../components/modals/MediaLightbox';
import type { ChatMediaItem } from '../components/modals/ChatMediaGallery';
import { PlusBadge } from '../components/premium/PlusBadge';
import { ReviewForm } from '../components/reviews/ReviewForm';
import { UserAvatar } from '../components/ui/UserAvatar';
import { useWsEvent } from '../hooks/useWebSocket';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { useNativeNavBar, nativeShare } from '../hooks/useNativeNavBar';
import { DeleteReviewModal } from '../components/modals/DeleteReviewModal';

interface PublicProfileViewProps {
    provider: ProviderProfile | null;
    onBack: () => void;
    providerServices: Service[];
    onServiceClick: (service: Service) => void;
    onStartChat: (service: Service) => void;
    activityStatus?: string;
    isOnline?: boolean;
    isLoggedIn?: boolean;
    isOwner?: boolean;
    currentUserUid?: string | null;
    isChatOpen?: boolean;
    showNotificationsOpen?: boolean;
    actions: Pick<AppActions, 'addToast'>;
}

const PublicProfileView = ({
                               provider,
                               onBack,
                               providerServices,
                               onServiceClick,
                               onStartChat,
                               activityStatus = "",
                               isOnline = false,
                               isLoggedIn = false,
                               isOwner = false,
                               currentUserUid = null,
                               isChatOpen = false,
                               showNotificationsOpen = false,
                               actions
                           }: PublicProfileViewProps) => {

    const router = useRouter();
    const { isNative, isIos } = usePlatform();

    const handleShare = async () => {
        if (!provider) return;
        const url = window.location.href.replace(/^(capacitor|https?):\/\/localhost(:\d+)?/, 'https://mylokalni.pl');
        const title = `${provider.name} — MyLokalni.pl`;
        if (isNative) {
            Haptics.impact({ style: ImpactStyle.Medium });
            const imageUrl = provider.avatar || normalizeMediaUrl(provider.zdjecieTla) || 'https://mylokalni.pl/og-image.png';
            try { await nativeShare({ url, title: provider.name || title, imageUrl }); return; } catch { return; }
        }
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = url; ta.style.cssText = 'position:fixed;left:-9999px';
            document.body.appendChild(ta); ta.focus(); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta);
        }
        actions.addToast?.('Link skopiowany do schowka', 'success');
    };

    // ── State (wszystko przed null-checkiem) ──────────────────────────────────
    const [isExpanded, setIsExpanded] = useState(false);
    const [visibleLimit, setVisibleLimit] = useState(6);
    const [newsFeedOpen, setNewsFeedOpen] = useState(false);
    const [certListOpen, setCertListOpen] = useState(false);
    const [reviewSort, setReviewSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
    const [likedReviews, setLikedReviews] = useState<Set<number>>(new Set());
    const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
    const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
    const [reviewsVisible, setReviewsVisible] = useState(4);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [galleryStartInGrid, setGalleryStartInGrid] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [liveOnline, setLiveOnline] = useState<boolean | null>(null);
    const [liveLastSeen, setLiveLastSeen] = useState<string | null>(null);
    const [reportConfig, setReportConfig] = useState<{
        isOpen: boolean;
        type: 'service' | 'profile' | 'review' | null;
        targetId?: number | string;
    }>({ isOpen: false, type: null });
    const [profileViewerOpen, setProfileViewerOpen] = useState(false);
    const [profileViewerPhotos, setProfileViewerPhotos] = useState<string[]>([]);

    const [newsFeedLightboxOpen, setNewsFeedLightboxOpen] = useState(false);
    const [newsFeedLbItems, setNewsFeedLbItems] = useState<ChatMediaItem[]>([]);
    const [newsFeedLbIndex, setNewsFeedLbIndex] = useState(0);
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const longPressMovedRef = useRef(false);

    const startLongPress = useCallback((url: string) => {
        longPressMovedRef.current = false;
        longPressTimer.current = setTimeout(() => {
            if (!longPressMovedRef.current) {
                if (isNative) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
                setProfileViewerPhotos([url]);
                setProfileViewerOpen(true);
            }
        }, 600);
    }, [isNative]);

    const cancelLongPress = useCallback(() => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }, []);

    const moveLongPress = useCallback(() => {
        longPressMovedRef.current = true;
        cancelLongPress();
    }, [cancelLongPress]);

    const queryClient = useQueryClient();

    useSwipeBack(!galleryOpen && !newsFeedOpen && !certListOpen && !showReviewForm && !reportConfig.isOpen && !profileViewerOpen, onBack);

    const nativeShareUrl = provider
        ? window.location.href.replace(/^(capacitor|https?):\/\/localhost(:\d+)?/, 'https://mylokalni.pl')
        : '';

    useNativeNavBar({
        showFavorite: false,
        shareUrl: nativeShareUrl,
        shareTitle: provider?.name || '',
        shareImageUrl: provider?.avatar || normalizeMediaUrl(provider?.zdjecieTla) || 'https://mylokalni.pl/og-image.png',
        onBack,
        hidden: (isChatOpen && !reportConfig.isOpen) || galleryOpen || showReviewForm || showNotificationsOpen || profileViewerOpen || (newsFeedOpen && newsFeedLightboxOpen),
        isMapOpen: reportConfig.isOpen || certListOpen || newsFeedOpen,
    });

    useEffect(() => {
        const updateLimit = () => setVisibleLimit(window.innerWidth < 768 ? 3 : 6);
        updateLimit();
        window.addEventListener('resize', updateLimit);
        return () => window.removeEventListener('resize', updateLimit);
    }, []);

    useWsEvent('online_status', useCallback((payload) => {
        if (!provider?.uid || payload.uid !== provider.uid) return;
        setLiveOnline(payload.isOnline as boolean);
        setLiveLastSeen((payload.lastSeenAt as string | null) ?? null);
    }, [provider?.uid]));

    const { data: canReviewData } = useQuery({
        queryKey: ['can-review', provider?.uid],
        queryFn: async () => {
            const res = await apiClient.get(`/users/${provider!.uid}/can-review`);
            if (!res.ok) return { canReview: false };
            return res.json() as Promise<{ canReview: boolean; bookingId?: number; servicePublicId?: string }>;
        },
        staleTime: 1000 * 60,
        enabled: !!provider?.uid && isLoggedIn,
    });

    const { data: apiReviewsData, isLoading: reviewsLoading } = useQuery({
        queryKey: ['reviews', provider?.uid],
        queryFn: async () => {
            const res = await apiClient.get(`/users/${provider!.uid}/reviews?limit=50`);
            if (!res.ok) return [];
            const json = await res.json();
            return (json.data ?? []).map((r: Review & { dateLabel?: string; likesCount?: number; ownerReply?: string | null; autoGenerated?: boolean }) => ({
                id: r.id, rating: r.rating, text: r.text,
                date: r.dateLabel || new Date(r.date).toLocaleDateString('pl-PL'),
                userName: r.userName, userAvatar: normalizeMediaUrl(r.userAvatar),
                userUid: r.userUid ?? null,
                providerUid: provider!.uid, serviceTitle: r.serviceTitle,
                autoGenerated: r.autoGenerated ?? false,
                likesCount: r.likesCount ?? 0,
                ownerReply: r.ownerReply ?? null,
            }));
        },
        staleTime: 1000 * 60,
        enabled: !!provider?.uid,
    });

    const { data: feedData, refetch: refetchFeed } = useQuery({
        queryKey: ['user-feed', provider?.uid],
        queryFn: async () => {
            const res = await apiClient.get(`/users/${provider!.uid}/feed`);
            if (!res.ok) return { items: [] };
            const json = await res.json() as { items: FeedItem[] };
            return json;
        },
        enabled: !!provider?.uid && !!provider?.isPremium,
        staleTime: 0,
        gcTime: 0,
    });

    useEffect(() => {
        if (provider?.uid && provider?.isPremium) {
            refetchFeed();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [provider?.uid]);

    const { data: certData } = useQuery({
        queryKey: ['public-certificates', provider?.uid],
        queryFn: async () => {
            const res = await apiClient.get(`/users/${provider!.uid}/certificates`);
            if (!res.ok) return { data: [] };
            return res.json() as Promise<{ data: Array<{ id: number; name: string; fileType: string | null; url: string | null }> }>;
        },
        enabled: !!provider?.uid && (provider?.isPremium === true),
        staleTime: 1000 * 60 * 10,
    });

    // allReviews i useEffect muszą być przed null-checkiem — hook nie może być wywoływany warunkowo
    const allReviews = apiReviewsData ?? [];

    // Inicjalizuj likeCounts z danych API (tylko raz przy załadowaniu)
    useEffect(() => {
        if (!allReviews.length) return;
        setLikeCounts(prev => {
            const next = { ...prev };
            allReviews.forEach((r: Review) => {
                if (!(r.id in next)) next[r.id] = r.likesCount ?? 0;
            });
            return next;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiReviewsData]);

    // ── Null-check ────────────────────────────────────────────────────────────
    if (!provider) return null;

    // ── Wartości pochodne (nie-hooki, po null-checku) ─────────────────────────
    const providerData = provider;
    const fullName = `${providerData.imie || ''} ${providerData.nazwisko || ''}`.trim() || provider.name || "Użytkownik";
    const providerIsPremium = !!(provider.isPremium ?? false);

    const avatarUrl = normalizeMediaUrl(providerData.profilowe) || normalizeMediaUrl(provider.avatar) || null;
    const bgImageUrl: string | null = (providerIsPremium && providerData.zdjecieTla) ? (providerData.zdjecieTla as string) : null;

    const isActiveNow = liveOnline !== null ? liveOnline : isOnline;
    const computedActivityStatus = (() => {
        if (isActiveNow) return 'Aktywny teraz';
        const raw = liveLastSeen ?? null;
        if (!raw) return activityStatus || 'Niedostępny';
        const diffMin = Math.floor((Date.now() - new Date(raw).getTime()) / 60000);
        if (diffMin < 1) return 'Aktywny przed chwilą';
        if (diffMin < 60) return `Aktywny ${diffMin} min temu`;
        const diffH = Math.floor(diffMin / 60);
        if (diffH < 24) return `Aktywny ${diffH} godz. temu`;
        return activityStatus || 'Niedostępny';
    })();

    const feed: FeedItem[] = feedData?.items ?? [];
    const certItems: CertOrComp[] = (certData?.data ?? []).map(c => ({
        id: Number(c.id),
        type: 'cert' as const,
        name: c.name,
        image: c.url || '',
    }));

    const handleReportSubmit = async (reason: string) => {
        if (!isLoggedIn) return;
        const reasonMap: Record<string, string> = {
            'Spam': 'spam', 'Treści reklamowe': 'spam',
            'Fałszywe konto': 'fraud', 'Fałszywa opinia': 'fraud', 'Oszustwo': 'fraud',
            'Nękanie': 'inappropriate_content', 'Wulgaryzmy': 'inappropriate_content',
            'Nieodpowiednie treści': 'inappropriate_content', 'Niedozwolone treści': 'inappropriate_content',
        };
        const targetTypeMap: Record<string, string> = { profile: 'user', review: 'review', service: 'service' };
        try {
            await apiClient.post('/reports', {
                targetType: targetTypeMap[reportConfig.type ?? ''] ?? 'user',
                targetId: String(reportConfig.targetId ?? provider.uid),
                reason: reasonMap[reason] ?? 'other',
            });
        } catch {
            logger.error('Nie udało się wysłać zgłoszenia');
        }
    };

    const handleReviewSubmit = async (rating: number, text: string, imageUrl?: string | null) => {
        const servicePublicId = canReviewData?.servicePublicId;
        const bookingId = canReviewData?.bookingId;
        if (!servicePublicId || !bookingId) {
            actions.addToast?.('Nie można znaleźć powiązanej rezerwacji.', 'error');
            return;
        }
        try {
            const res = await apiClient.post(`/services/${servicePublicId}/reviews`, {
                rating, text, bookingId, ...(imageUrl ? { imageUrl } : {}),
            });
            if (!res.ok) {
                const json = await res.json().catch(() => ({})) as { error?: string };
                const err = Object.assign(new Error(json.error || 'Failed'), { status: res.status });
                throw err;
            }
            setShowReviewForm(false);
            queryClient.invalidateQueries({ queryKey: ['reviews', provider.uid] });
            queryClient.invalidateQueries({ queryKey: ['can-review', provider.uid] });
            actions.addToast?.('Opinia została dodana. Dziękujemy!', 'success');
        } catch (err: unknown) {
            if ((err as { status?: number })?.status === 409) {
                actions.addToast?.('Już wystawiłeś opinię dla tego wykonawcy.', 'error');
            } else {
                actions.addToast?.('Nie udało się dodać opinii. Spróbuj ponownie.', 'error');
            }
            throw err;
        }
    };

    const handleDeleteReview = async (reviewId: number) => {
        setDeletingReviewId(null);
        try {
            const res = await apiClient.delete(`/reviews/${reviewId}`);
            if (!res.ok) throw new Error();
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            queryClient.invalidateQueries({ queryKey: ['service-reviews'] });
            actions.addToast?.('Opinia usunięta', 'success');
        } catch {
            actions.addToast?.('Nie udało się usunąć opinii', 'error');
        }
    };

    const toggleLike = async (id: number) => {
        if (!isLoggedIn) return;
        const wasLiked = likedReviews.has(id);
        // Optimistic update
        setLikedReviews(prev => { const s = new Set(prev); if (wasLiked) s.delete(id); else s.add(id); return s; });
        setLikeCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (wasLiked ? -1 : 1)) }));
        try {
            const res = await apiClient.post(`/reviews/${id}/like`, {});
            if (res.ok) {
                const json = await res.json() as { liked: boolean; count: number };
                setLikedReviews(prev => { const s = new Set(prev); if (json.liked) s.add(id); else s.delete(id); return s; });
                setLikeCounts(prev => ({ ...prev, [id]: json.count }));
            } else {
                // Rollback
                setLikedReviews(prev => { const s = new Set(prev); if (wasLiked) s.add(id); else s.delete(id); return s; });
                setLikeCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (wasLiked ? 1 : -1)) }));
            }
        } catch {
            setLikedReviews(prev => { const s = new Set(prev); if (wasLiked) s.add(id); else s.delete(id); return s; });
            setLikeCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (wasLiked ? 1 : -1)) }));
        }
    };

    const openNewsFeed = () => setNewsFeedOpen(true);

    const _openGallery = (index: number) => {
        setGalleryIndex(index);
        setGalleryStartInGrid(false);
        setGalleryOpen(true);
    };
    const _openGalleryGrid = () => {
        setGalleryStartInGrid(true);
        setGalleryOpen(true);
    };

    const ALL_CLIENT_PHOTOS = providerServices.flatMap(s => s.images ?? (s.image ? [s.image] : [])).filter(Boolean);

    const displayReviews = allReviews.filter((r: Review) => !r.autoGenerated).sort((a: Review, b: Review) => {
        if (reviewSort === 'highest') return b.rating - a.rating;
        if (reviewSort === 'lowest') return a.rating - b.rating;
        return b.id - a.id;
    });

    const visibleReviews = displayReviews.slice(0, reviewsVisible);
    const hasMoreReviews = reviewsVisible < displayReviews.length;

    const allServices = providerServices;

    const hasMoreServices = allServices.length > visibleLimit;
    const displayedServices = isExpanded ? allServices : allServices.slice(0, visibleLimit);

    return (
        <div className="min-h-screen bg-[#F4F4F9] pb-32 font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">

            {/* Pasek nawigacji — portaled do body żeby transform motion.div nie tworzył
                nowego containing block dla position:fixed (fixed wewnątrz transformed parenta
                jest relatywny do parenta, nie viewportu → navbar skacze przy animacji wejścia) */}
            {!isIos && (
                <ClientPortal>
                    <div
                        data-fixed-nav-px4
                        className="fixed left-0 right-0 z-[99999] lg:hidden flex items-center justify-end px-4 h-12 pointer-events-none"
                        style={{ top: 'var(--total-nav-h, 73px)' }}
                    >
                        <button
                            onClick={handleShare}
                            type="button"
                            aria-label="Udostępnij profil"
                            className="pointer-events-auto p-2.5 bg-white/90 hover:bg-white backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm text-slate-600 transition-all active:scale-95"
                            style={(newsFeedOpen || certListOpen || galleryOpen || showReviewForm) ? { opacity: 0.35, filter: 'blur(2px)', pointerEvents: 'none', transition: 'opacity 0.2s, filter 0.2s' } : { transition: 'opacity 0.2s, filter 0.2s' }}
                        >
                            <Share2 size={20} />
                        </button>
                    </div>
                </ClientPortal>
            )}

            {/* Tło */}
            <div
                className="h-52 md:h-64 relative overflow-hidden"
                style={bgImageUrl ? { cursor: 'pointer', userSelect: 'none' } : undefined}
                onTouchStart={bgImageUrl ? () => startLongPress(bgImageUrl) : undefined}
                onTouchMove={bgImageUrl ? moveLongPress : undefined}
                onTouchEnd={bgImageUrl ? cancelLongPress : undefined}
                onContextMenu={bgImageUrl ? (e) => e.preventDefault() : undefined}
                onClick={bgImageUrl && !isNative ? () => { setProfileViewerPhotos([bgImageUrl]); setProfileViewerOpen(true); } : undefined}
            >
                {providerIsPremium && providerData.zdjecieTla ? (
                    <img
                        src={providerData.zdjecieTla}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        alt="Background"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-500 via-slate-600 to-indigo-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/10 to-slate-900/30 pointer-events-none" />
            </div>

            <div className="max-w-[1200px] mx-auto px-4 md:px-6 relative">

                {/* Przycisk wróć — tylko desktop */}
                <div className="hidden lg:block absolute -top-36 left-6 z-30">
                    <button
                        onClick={onBack}
                        type="button"
                        aria-label="Wróć do poprzedniej strony"
                        className="flex items-center gap-2 bg-white/90 hover:bg-white backdrop-blur-md px-4 py-2.5 rounded-2xl text-[10px] font-black shadow-lg transition-all active:scale-95 text-slate-700 border border-white/50 uppercase tracking-wider"
                    >
                        <ArrowLeft size={13} strokeWidth={3} /> Wróć
                    </button>
                </div>

                {/* ── HEADER CARD ── */}
                <div className="bg-white rounded-3xl p-5 md:p-7 shadow-xl shadow-slate-200/50 border border-slate-100/80 flex flex-col md:flex-row items-center justify-between gap-5 -mt-14 relative z-20">
                    <div className="flex flex-col md:flex-row items-center gap-5 w-full md:w-auto">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div
                                className="w-24 h-24 md:w-[100px] md:h-[100px] rounded-3xl overflow-hidden ring-4 ring-white shadow-lg relative bg-slate-100"
                                style={avatarUrl ? { cursor: 'pointer', userSelect: 'none' } : undefined}
                                onTouchStart={avatarUrl ? () => startLongPress(avatarUrl) : undefined}
                                onTouchMove={avatarUrl ? moveLongPress : undefined}
                                onTouchEnd={avatarUrl ? cancelLongPress : undefined}
                                onContextMenu={avatarUrl ? (e) => e.preventDefault() : undefined}
                                onClick={avatarUrl && !isNative ? () => { setProfileViewerPhotos([avatarUrl]); setProfileViewerOpen(true); } : undefined}
                            >
                                <img
                                    src={avatarUrl || '/default-profile-picture.webp'}
                                    className="w-full h-full object-cover pointer-events-none"
                                    alt="Avatar"
                                    fetchPriority="high"
                                    decoding="async"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-profile-picture.webp'; }}
                                />
                            </div>
                            {isActiveNow && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-[3px] border-white shadow-sm" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                <h1 className="text-2xl md:text-[28px] font-black text-slate-900 tracking-tight leading-tight">{fullName}</h1>
                                {providerIsPremium && <PlusBadge />}
                                <div className="relative group/shield cursor-help">
                                    <ShieldCheck size={22} className="text-indigo-500 fill-indigo-50 shrink-0" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover/shield:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">
                                        Profil zweryfikowany
                                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                    </div>
                                </div>
                            </div>

                            {/* Tagi statusu */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
                                    isActiveNow ? "bg-green-50 text-green-700 border-green-100" : "bg-slate-50 text-slate-500 border-slate-100"
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isActiveNow ? "bg-green-500" : "bg-slate-300"}`} />
                                    {computedActivityStatus}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-100">
                                    <MapPin size={11} /> {providerServices[0]?.city || providerData.city || 'Polska'}
                                </span>
                            </div>

                            {/* Mini stats */}
                            <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                                <div className="flex items-center gap-1">
                                    <Star size={13} className="fill-amber-400 text-amber-400" />
                                    <span className="text-sm font-black text-slate-900">
                                        {(providerData.avgRating ?? 0) > 0 ? Number(providerData.avgRating).toFixed(1) : '–'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold">({providerData.reviewsCount ?? 0})</span>
                                </div>
                                <div className="w-px h-3 bg-slate-200" />
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                                    <CheckCircle size={12} className="text-indigo-400" />
                                    <span>{providerData.reviewsCount ?? 0} {polishPlural(providerData.reviewsCount ?? 0, 'realizacja', 'realizacje', 'realizacji')}</span>
                                </div>
                                <div className="w-px h-3 bg-slate-200" />
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                                    <Calendar size={12} className="text-slate-400" />
                                    <span>{providerData.joinedAt
                                        ? `od ${new Date(providerData.joinedAt).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                                        : providerData.joinedYear ? `od ${providerData.joinedYear}` : '–'
                                    }</span>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* CTA */}
                    <div className="w-full md:w-auto shrink-0 flex items-center gap-2">
                        <button
                            onClick={() => allServices.length > 0 && onStartChat(allServices[0])}
                            className="flex-1 md:flex-none bg-[#6366F1] text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-[#4F46E5] hover:shadow-lg hover:shadow-indigo-300/40 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={17} /> Napisz wiadomość
                        </button>
                        <button
                            onClick={handleShare}
                            aria-label="Udostępnij profil"
                            className="hidden lg:flex w-12 h-12 shrink-0 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 items-center justify-center transition-all active:scale-95 shadow-sm"
                        >
                            <Share2 size={18} className="text-slate-600" />
                        </button>
                    </div>
                </div>

                {/* ── BIO + AKTUALNOŚCI ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-6">
                    <div className={`${providerIsPremium ? 'lg:col-span-5' : 'lg:col-span-12'} flex flex-col gap-5`}>
                        {/* O mnie */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex-1 flex flex-col">
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className="w-7 h-7 rounded-xl bg-slate-50 flex items-center justify-center">
                                    <Briefcase size={13} className="text-slate-400" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">O mnie</span>
                            </div>
                            <p className="text-slate-600 text-[14px] leading-relaxed flex-1">
                                {provider.description || "Ten wykonawca jeszcze nie dodał opisu. Napisz wiadomość, aby dowiedzieć się więcej o oferowanych usługach."}
                            </p>
                            <div className="mt-5 pt-4 border-t border-slate-50 flex items-center gap-2">
                                {[
                                    { label: "Facebook", href: providerData.facebook, hover: "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100",
                                        icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
                                    { label: "Instagram", href: providerData.instagram, hover: "hover:bg-pink-50 hover:text-pink-500 hover:border-pink-100",
                                        icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg> },
                                    { label: "TikTok", href: providerData.tiktok, hover: "hover:bg-slate-100 hover:text-slate-900 hover:border-slate-200",
                                        icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.3a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg> },
                                    { label: "Strona www", href: providerData.website, hover: "hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100",
                                        icon: <Globe size={15} /> },
                                ].filter(({ href }) => !!href && /^https?:\/\//i.test(href as string)).map(({ label, href, hover, icon }) => (
                                    <a key={label} href={href ?? undefined} target="_blank" rel="noreferrer noopener" title={label}
                                       className={`w-9 h-9 rounded-2xl border border-slate-100 bg-slate-50 text-slate-400 flex items-center justify-center transition-all duration-200 active:scale-90 ${hover}`}>
                                        {icon}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Certyfikaty — tylko Premium */}
                        {providerIsPremium && (
                            <button
                                onClick={() => setCertListOpen(true)}
                                className="w-full bg-[#6366F1] p-6 rounded-3xl shadow-lg shadow-indigo-300/30 text-white relative overflow-hidden shrink-0 hover:bg-[#4f51e0] transition-colors group text-left cursor-pointer"
                            >
                                <div className="absolute -right-4 -bottom-4 opacity-[0.08] pointer-events-none">
                                    <FileCheck size={110} />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 mb-1">Dokumentacja</p>
                                    <h3 className="text-lg font-black tracking-tight mb-2">Certyfikaty i kompetencje</h3>
                                    <p className="text-[11px] text-indigo-200 font-semibold">{certItems.length} pozycji · kliknij, aby zobaczyć</p>
                                    <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Otwórz dokumentację</span>
                                        <ChevronRight size={14} className="text-indigo-300 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </button>
                        )}
                    </div>

                    {/* Aktualności — tylko Premium */}
                    {providerIsPremium && <div className="lg:col-span-7">
                        <button
                            onClick={openNewsFeed}
                            className="w-full h-full bg-slate-900 p-7 rounded-3xl border border-slate-800 flex flex-col cursor-pointer hover:bg-slate-800/90 transition-colors group text-left"
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-8 h-8 rounded-2xl bg-indigo-500/15 group-hover:bg-indigo-500/25 flex items-center justify-center transition-colors">
                                    <Send size={14} className="text-indigo-400" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Aktualności</span>
                                <span className="ml-auto text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
                                    {feed.length} wpisów <ChevronRight size={10} />
                                </span>
                            </div>

                            <div className="h-[140px] flex flex-col justify-center">
                                {feed.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-3 text-center">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                                            <Send size={18} className="text-slate-600" />
                                        </div>
                                        <div>
                                            <p className="text-[13px] text-slate-300 font-bold">Brak aktualności</p>
                                            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed max-w-[200px] mx-auto">Aktualności pojawią się po wykonaniu pierwszych usług</p>
                                        </div>
                                    </div>
                                ) : feed.length === 1 ? (
                                    <div className={`relative pl-5 border-l ${feed[0].type === 'realizacja' ? 'border-emerald-500/50' : 'border-indigo-500/50'}`}>
                                        <div className={`absolute left-[-4px] top-2 w-2.5 h-2.5 rounded-full ${feed[0].type === 'realizacja' ? 'bg-emerald-400 ring-4 ring-emerald-400/20' : 'bg-indigo-400 ring-4 ring-indigo-400/20'}`} />
                                        <span className={`text-[9px] font-black block mb-2 uppercase tracking-widest ${feed[0].type === 'realizacja' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                            {feed[0].date}
                                        </span>
                                        {feed[0].type === 'post' ? (
                                            <p className="text-[14px] text-slate-300 leading-relaxed line-clamp-4">{feed[0].content}</p>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                {feed[0].image && (
                                                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                                                        <Image src={feed[0].image} width={64} height={64} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-[11px] text-slate-500 font-semibold mb-1">Wykonano usługę</p>
                                                    <p className="text-[15px] text-slate-200 font-bold leading-snug">{feed[0].serviceName}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        {feed.slice(0, 2).map((item) => (
                                            <div key={`${item.type}-${item.id}`} className={`relative pl-5 border-l ${
                                                item.type === 'realizacja' ? 'border-emerald-500/50' : 'border-indigo-500/50'
                                            }`}>
                                                <div className={`absolute left-[-4px] top-1.5 w-2 h-2 rounded-full ${
                                                    item.type === 'realizacja' ? 'bg-emerald-400 ring-4 ring-emerald-400/20' : 'bg-indigo-400 ring-4 ring-indigo-400/20'
                                                }`} />
                                                <span className={`text-[9px] font-black block mb-1.5 uppercase tracking-widest ${item.type === 'realizacja' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                                    {item.date}
                                                </span>
                                                {item.type === 'post' ? (
                                                    <p className="text-[13px] text-slate-400 leading-relaxed line-clamp-2">{item.content}</p>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        {(item.image) && (
                                                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                                                                <Image src={item.image} width={48} height={48} className="w-full h-full object-cover" alt="" />
                                                            </div>
                                                        )}
                                                        <p className="text-[13px] text-slate-400 leading-relaxed line-clamp-2">
                                                            Wykonano: <span className="text-slate-300">{item.serviceName}</span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Zobacz całą tablicę</span>
                                <ChevronRight size={14} className="text-indigo-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </button>
                    </div>}
                </div>

                {/* ── USŁUGI ── */}
                <div className="mt-14">
                    <div className="flex items-center gap-3 mb-7 px-1">
                        <div className="w-1.5 h-7 bg-indigo-500 rounded-full" />
                        <div>
                            <h2 className="font-black text-2xl text-slate-900 tracking-tight leading-none">Usługi i cennik</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{allServices.length} aktywnych ofert</p>
                        </div>
                    </div>

                    {allServices.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-14 rounded-3xl border border-dashed border-slate-200 text-center gap-3">
                            <Briefcase size={28} className="text-slate-300" />
                            <p className="text-sm font-bold text-slate-400">Brak aktywnych usług</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {displayedServices.map((service, idx) => (
                            <div
                                key={service.publicId || idx}
                                onClick={() => onServiceClick(service)}
                                className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/8 hover:-translate-y-1 transition-all duration-400 cursor-pointer flex flex-col"
                            >
                                <div className="relative h-52 w-full overflow-hidden rounded-t-3xl">
                                    <img
                                        src={normalizeMediaUrl(service.image) || service.image}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
                                        alt={service.title}
                                    />
                                    {/* Cena */}
                                    <div className="absolute bottom-3 left-3">
                                        <div className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-2xl shadow-md">
                                            <span className="text-slate-900 font-black text-sm">{service.price} {service.priceUnit || "zł"}</span>
                                        </div>
                                    </div>
                                    {/* Rating */}
                                    {service.rating > 0 && (
                                        <div className="absolute top-3 right-3">
                                            <div className="bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-xl flex items-center gap-1">
                                                <Star size={10} className="fill-amber-400 text-amber-400" />
                                                <span className="text-white font-black text-[11px]">{service.rating.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-5 flex flex-col flex-1">
                                    <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-wider rounded-lg self-start mb-2.5">
                                        {CATEGORIES_DATA.find(c => c.id === service.category)?.name ?? service.category ?? "Premium"}
                                    </span>
                                    <h4 className="font-bold text-slate-900 text-[15px] leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2 mb-3">
                                        {service.title}
                                    </h4>
                                    <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                            <MapPin size={11} className="text-indigo-300" /> {service.city || "Gdańsk"}
                                        </span>
                                        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasMoreServices && (
                        <div className="mt-8 text-center">
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="inline-flex items-center gap-2.5 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 px-7 py-3.5 rounded-2xl text-sm font-black text-slate-700 transition-all active:scale-95 shadow-sm"
                            >
                                {isExpanded ? "Zwiń" : `Pokaż wszystkie (${allServices.length})`}
                                <ChevronRight size={16} className={`transition-transform ${isExpanded ? "rotate-90" : "-rotate-90 mt-px"}`} />
                            </button>
                        </div>
                    )}
                </div>

                {/* ── OPINIE ── */}
                <div className="mt-20 mb-8">

                    {/* Header */}
                    <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-8 px-1 mb-10">
                        <div className="flex flex-col gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <div className="w-1.5 h-8 bg-amber-400 rounded-full shrink-0" />
                                    <h2 className="font-black text-3xl text-slate-900 tracking-tight">Opinie klientów</h2>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-4">{(() => { const n = providerData.reviewsCount ?? allReviews.length; return `${n} ${polishPlural(n, 'zweryfikowana recenzja', 'zweryfikowane recenzje', 'zweryfikowanych recenzji')}`; })()}</p>
                            </div>
                            {allReviews.length > 0 && (
                            <div className="pl-1">
                                <div className="inline-flex bg-slate-100 p-1 rounded-2xl gap-0.5">
                                    {([
                                        { key: 'newest', label: 'Najnowsze' },
                                        { key: 'highest', label: 'Najwyższe' },
                                        { key: 'lowest', label: 'Najgorsze' },
                                    ] as const).map(({ key, label }) => (
                                        <button
                                            key={key}
                                            onClick={() => { setReviewSort(key); setReviewsVisible(4); }}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                                                reviewSort === key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            )}
                        </div>

                        {/* Rating card — tylko gdy są ręczne opinie */}
                        {allReviews.filter((r: Review) => !r.autoGenerated).length > 0 && (
                        <div className="bg-white rounded-3xl px-6 py-5 border border-slate-100 shadow-sm flex items-center gap-6 shrink-0 self-start">
                            <div className="text-center pr-6 border-r border-slate-100">
                                <div className="text-[52px] font-black text-slate-900 leading-none tracking-tighter">
                                    {(providerData.avgRating ?? 0) > 0 ? Number(providerData.avgRating).toFixed(1) : '–'}
                                </div>
                                <div className="flex gap-0.5 mt-2 justify-center">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={12} className="fill-amber-400 text-amber-400" />)}
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                                    {(() => { const n = allReviews.filter((r: Review) => !r.autoGenerated).length; return `${n} ${polishPlural(n, 'opinia', 'opinie', 'opinii')}`; })()}
                                </p>
                            </div>
                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                                {[5, 4, 3, 2, 1].map((stars) => {
                                    const manualReviews = allReviews.filter((r: Review) => !r.autoGenerated);
                                    const cnt = manualReviews.filter((r: Review) => Math.round(r.rating) === stars).length;
                                    const total = manualReviews.length;
                                    const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
                                    return (
                                        <div key={stars} className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 w-3 shrink-0 text-right">{stars}</span>
                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                            <span className="text-[9px] text-slate-400 w-6 text-right shrink-0">{pct}%</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        )}
                    </div>

                    {/* CTA napisz opinię — tylko po ukończonej rezerwacji */}
                    {isLoggedIn && canReviewData?.canReview && !showReviewForm && (
                        <button
                            onClick={() => setShowReviewForm(true)}
                            className="w-full mb-8 flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-2xl px-5 py-4 transition-colors group text-left"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm group-hover:border-indigo-100 transition-colors shrink-0">
                                    <Star size={15} className="text-slate-400 group-hover:text-[#6366F1] transition-colors" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Korzystałeś z usług tego wykonawcy?</p>
                                    <p className="text-xs text-slate-400 mt-0.5">Twoja opinia pomoże innym użytkownikom</p>
                                </div>
                            </div>
                            <span className="text-sm font-black text-[#6366F1] flex items-center gap-1 shrink-0 ml-4">
                                Napisz opinię <ChevronRight size={15} />
                            </span>
                        </button>
                    )}

                    <ReviewForm
                        isOpen={showReviewForm && isLoggedIn}
                        onSubmit={handleReviewSubmit}
                        onCancel={() => setShowReviewForm(false)}
                    />

                    {/* Skeleton podczas ładowania */}
                    {reviewsLoading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                            {[0, 1, 2, 4].map(i => (
                                <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 animate-pulse">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 bg-slate-100 rounded-2xl shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3.5 bg-slate-100 rounded-lg w-1/2" />
                                            <div className="h-3 bg-slate-100 rounded-lg w-1/4" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 bg-slate-100 rounded-lg w-full" />
                                        <div className="h-3 bg-slate-100 rounded-lg w-4/5" />
                                        <div className="h-3 bg-slate-100 rounded-lg w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty state — brak opinii */}
                    {!reviewsLoading && allReviews.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-14 rounded-3xl border border-dashed border-slate-200 text-center gap-3 mb-10">
                            <Star size={28} className="text-slate-300" />
                            <p className="text-sm font-bold text-slate-400">Brak opinii</p>
                            <p className="text-xs text-slate-300">Ten wykonawca nie ma jeszcze żadnych recenzji</p>
                        </div>
                    )}

                    {/* Zdjęcia od klientów — sekcja ukryta; czeka na implementację zdjęć przypisanych do opinii */}

                    {/* Karty opinii */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visibleReviews.map((review: Review) => {
                            const isLiked = likedReviews.has(review.id);
                            const likeCount = likeCounts[review.id] ?? review.likesCount ?? 0;
                            return (
                                <div
                                    key={review.id}
                                    className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
                                >
                                    {/* Header: avatar + name + stars */}
                                    <div className="p-6 flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4 text-left">
                                            {review.autoGenerated ? (
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                                                    <CheckCircle size={20} className="text-slate-400" />
                                                </div>
                                            ) : (
                                                <div
                                                    className={`flex items-center gap-4 text-left ${review.userUid ? 'cursor-pointer group/reviewer' : ''}`}
                                                    onClick={async () => { if (!review.userUid) return; if (Capacitor.isNativePlatform()) await NativeNav.push().catch(() => {}); router.push(`/profile/${review.userUid}`); }}
                                                >
                                                    <div className="relative shrink-0">
                                                        <UserAvatar src={review.userAvatar} name={review.userName || '?'} size={48} className={`rounded-2xl transition-transform duration-200 ${review.userUid ? 'group-hover/reviewer:scale-105' : ''}`} />
                                                    </div>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-[15px] font-bold block text-slate-900">
                                                    {review.autoGenerated ? 'Zweryfikowana realizacja' : review.userName}
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    {!review.autoGenerated && (
                                                        <div className="flex gap-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} size={12} className={i < review.rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-100"} />
                                                            ))}
                                                        </div>
                                                    )}
                                                    <span className="text-[11px] text-slate-400">{review.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Tag usługi */}
                                        <span className="shrink-0 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold border border-indigo-100/70 hidden sm:block">
                                            {review.serviceTitle}
                                        </span>
                                    </div>

                                    {/* Tag usługi mobile */}
                                    <div className="px-6 pb-3 sm:hidden">
                                        <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-bold border border-indigo-100/70 inline-block">
                                            {review.serviceTitle}
                                        </span>
                                    </div>

                                    {/* Tekst opinii */}
                                    {!review.autoGenerated && (
                                    <div className="px-6 pb-5 flex-1">
                                        <p className="text-[15px] text-slate-700 leading-[1.65] font-normal">{review.text}</p>
                                    </div>
                                    )}

                                    {/* Odpowiedź właściciela */}
                                    {review.ownerReply && !review.autoGenerated && (
                                        <div className="mx-6 mb-4 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100/70">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Odpowiedź właściciela</p>
                                            <p className="text-[13px] text-slate-700 leading-relaxed">{review.ownerReply}</p>
                                        </div>
                                    )}

                                    {/* Stopka */}
                                    <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
                                        {review.autoGenerated ? (
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-2 py-1 bg-slate-50 rounded-lg">
                                                Opinia automatyczna
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => toggleLike(review.id)}
                                                aria-label={isLiked ? 'Cofnij oznaczenie jako pomocna' : 'Oznacz opinię jako pomocną'}
                                                aria-pressed={isLiked}
                                                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 transition-all duration-200 active:scale-95 ${
                                                    isLiked
                                                        ? 'bg-indigo-50 text-indigo-600'
                                                        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                                                }`}
                                            >
                                                <ThumbsUp
                                                    size={14}
                                                    className={`transition-transform duration-200 ${isLiked ? 'fill-indigo-600 -translate-y-px' : ''}`}
                                                />
                                                {likeCount > 0 && (
                                                    <span className="text-[11px] font-bold">{likeCount}</span>
                                                )}
                                            </button>
                                        )}
                                        {!review.autoGenerated && (
                                            review.userUid === currentUserUid
                                                ? (
                                                    <button onClick={() => setDeletingReviewId(review.id)} aria-label="Usuń opinię" className="text-slate-200 hover:text-rose-400 transition-colors p-2 rounded-xl hover:bg-rose-50 active:scale-90">
                                                        <Trash2 size={13} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => setReportConfig({ isOpen: true, type: 'review', targetId: review.id })}
                                                        aria-label="Zgłoś opinię"
                                                        className="text-slate-200 hover:text-rose-400 transition-colors p-2 rounded-xl hover:bg-rose-50 active:scale-90"
                                                    >
                                                        <Flag size={13} />
                                                    </button>
                                                )
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Paginacja opinii */}
                    {displayReviews.length > 0 && (
                    <div className="mt-10 flex flex-col items-center gap-3">
                        {hasMoreReviews ? (
                            <>
                                <button
                                    onClick={() => setReviewsVisible(prev => Math.min(prev + 3, displayReviews.length))}
                                    className="group flex items-center gap-3 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-8 py-3.5 rounded-2xl font-black text-sm transition-all duration-200 active:scale-95 shadow-sm"
                                >
                                    {reviewsVisible <= 4 ? 'Pokaż więcej opinii' : 'Wczytaj kolejne'}
                                    <span className="bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-700 transition-colors px-2.5 py-0.5 rounded-lg text-xs font-black">
                                        +{Math.min(3, displayReviews.length - reviewsVisible)}
                                    </span>
                                </button>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Pokazano {reviewsVisible} z {providerData.reviewsCount ?? displayReviews.length} opinii
                                </p>
                            </>
                        ) : (
                            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-100">
                                <CheckCircle size={15} />
                                <span className="text-[12px] font-bold">Wyświetlono wszystkie opinie</span>
                            </div>
                        )}
                    </div>
                    )}
                </div>

                {/* Zgłoś profil */}
                <div className="mt-10 text-center">
                    <button
                        onClick={() => setReportConfig({ isOpen: true, type: 'profile', targetId: provider.uid })}
                        className="text-slate-400 hover:text-rose-400 text-[10px] font-bold uppercase tracking-[0.2em] py-3 transition-colors flex items-center justify-center gap-1.5 mx-auto"
                    >
                        <Flag size={11} /> Zgłoś profil
                    </button>
                </div>
            </div>

            <NewsFeedModal
                isOpen={newsFeedOpen}
                onClose={() => { setNewsFeedOpen(false); setNewsFeedLightboxOpen(false); }}
                items={feed}
                providerName={fullName}
                providerAvatar={providerData.profilowe || provider?.avatar || undefined}
                activityStatus={computedActivityStatus}
                canEdit={isOwner}
                isSubModalOpen={newsFeedLightboxOpen}
                onOpenLightbox={(index, items) => {
                    setNewsFeedLbIndex(index);
                    setNewsFeedLbItems(items);
                    setNewsFeedLightboxOpen(true);
                }}
                onImageUploaded={() => queryClient.invalidateQueries({ queryKey: ['user-feed', provider?.uid] })}
                onUploadError={() => actions.addToast?.('Nie udało się dodać zdjęcia. Spróbuj ponownie.', 'error')}
            />

            <MediaLightbox
                isOpen={newsFeedLightboxOpen}
                onClose={() => setNewsFeedLightboxOpen(false)}
                items={newsFeedLbItems}
                initialIndex={newsFeedLbIndex}
                nativeBottomPadding
            />

            <CertificatesModal
                isOpen={certListOpen}
                onClose={() => setCertListOpen(false)}
                items={certItems}
            />

            <ClientPhotosModal
                isOpen={galleryOpen}
                onClose={() => setGalleryOpen(false)}
                items={ALL_CLIENT_PHOTOS.map(url => ({ type: 'image' as const, url }))}
                initialIndex={galleryIndex}
                startInGrid={galleryStartInGrid}
            />

            <ClientPhotosModal
                isOpen={profileViewerOpen}
                onClose={() => setProfileViewerOpen(false)}
                items={profileViewerPhotos.map(url => ({ type: 'image' as const, url }))}
                initialIndex={0}
                showCloseOnNative
            />

            <Suspense fallback={null}>
                <ReportModal
                    isOpen={reportConfig.isOpen}
                    onClose={() => setReportConfig({ ...reportConfig, isOpen: false })}
                    type={reportConfig.type}
                    onSubmit={handleReportSubmit}
                />
            </Suspense>
            <DeleteReviewModal
                isOpen={deletingReviewId !== null}
                onClose={() => setDeletingReviewId(null)}
                onConfirm={() => deletingReviewId !== null && handleDeleteReview(deletingReviewId)}
            />
        </div>
    );
};

export default PublicProfileView;