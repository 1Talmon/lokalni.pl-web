'use client';
import { ArrowLeft, Heart, Share2, MapPin, Star, Flag, Globe, Check, ChevronLeft, ChevronRight, Trash2, Eye, LifeBuoy } from 'lucide-react';
import { ClientPhotosModal } from '../components/modals/ClientPhotosModal';
import { logger } from '../utils/logger';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { useNativeBottomBar } from '../hooks/useNativeBottomBar';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { normalizeMediaUrl } from '../utils/normalizeUrl';
import { ClientPortal } from '../components/ui/ClientPortal';
import { createSafariOverlay, revealAfterUnmount } from '../utils/safariNavOverlay';
import { mapApiService, type ApiService } from '../services/serviceService';
import { CATEGORIES_DATA } from '../data/categories';
import { isRemoteService as checkIsRemote } from '../utils/serviceUtils';
import { polishPlural } from '../utils/helpers';
import { Spinner } from '../components/ui/Spinner';
import { UserAvatar } from '../components/ui/UserAvatar';
import { ServiceMap } from './ServiceDetailsView/ServiceMap';
import { ServiceBookingPanel } from './ServiceDetailsView/ServiceBookingPanel';
import { ServiceMediaGallery } from './ServiceDetailsView/ServiceMediaGallery';
import { ServiceReviews } from './ServiceDetailsView/ServiceReviews';
import { Service, Review, ProviderProfile } from '../types';
import { DeleteReviewModal } from '../components/modals/DeleteReviewModal';

export { ServiceMap } from './ServiceDetailsView/ServiceMap';

interface ServiceDetailsViewProps {
    service: Service | null;
    reviews?: Review[];
    isFavorite: boolean;
    onBack: () => void;
    onToggleFavorite: (publicId: string) => void;
    onOpenProfile: (provider: ProviderProfile) => void;
    onOpenService: (service: Service) => void;
    onStartChat: (service: Service, message?: string) => void;
    onEdit: (service: Service) => void;
    onBook: () => void;
    isLoggedIn: boolean;
    onLoginRedirect: () => void;
    userLocation: string;
    currentUserUid?: string | null;
    onReport: () => void;
    onReportReview: (id: number) => void;
    onOpenSupport?: () => void;
    addToast: (msg: string, type: 'success' | 'error' | 'info' | 'custom', icon?: React.ReactNode, className?: string) => void;
    isChatOpen?: boolean;
    isReportOpen?: boolean;
    isSupportOpen?: boolean;
    showNotificationsOpen?: boolean;
}


// Scroll poziomy karuzeli podobnych serwisów — zapisywany przy unmount (push), przywracany przy remount (pop).
const savedCarouselScrolls = new Map<string, number>();

const ServiceDetailsView = ({
    service, reviews: reviewsProp = [], isFavorite, onBack, onToggleFavorite, onOpenProfile,
    onOpenService, onStartChat, onEdit, onBook, isLoggedIn, onLoginRedirect, userLocation,
    currentUserUid, onReport, onReportReview, onOpenSupport, addToast, isChatOpen = false, isReportOpen = false, isSupportOpen = false,
}: ServiceDetailsViewProps) => {

    const router = useRouter();
    const queryClient = useQueryClient();

    const servicePublicId = service?.publicId ?? null;
    const serviceProviderUid = service?.provider?.uid ?? null;

    const { data: canReviewData } = useQuery({
        queryKey: ['can-review', serviceProviderUid, servicePublicId],
        queryFn: async () => {
            const res = await apiClient.get(`/users/${serviceProviderUid}/can-review`);
            if (!res.ok) return null;
            const data = await res.json() as { canReview: boolean; bookingId?: number; servicePublicId?: string };
            // Musi dotyczyć tej konkretnej usługi
            if (data.servicePublicId && data.servicePublicId !== servicePublicId) return null;
            return data;
        },
        enabled: !!serviceProviderUid && !!servicePublicId && isLoggedIn,
        staleTime: 1000 * 60,
    });

    interface RawApiReview extends Review { dateLabel?: string; }

    const { data: apiReviews } = useQuery({
        queryKey: ['service-reviews', servicePublicId],
        queryFn: async () => {
            const res = await apiClient.get(`/services/${servicePublicId}/reviews?limit=50`);
            if (!res.ok) return [];
            const json = await res.json();
            return (json.data ?? []).map((r: RawApiReview) => ({
                ...r,
                userAvatar: normalizeMediaUrl(r.userAvatar) || null,
                imageUrl: normalizeMediaUrl(r.imageUrl) || null,
                date: r.dateLabel || new Date(r.date).toLocaleDateString('pl-PL'),
            })) as Review[];
        },
        enabled: !!servicePublicId,
        staleTime: 1000 * 60,
    });
    const reviews = apiReviews ?? reviewsProp;

    useEffect(() => {
        if (!reviews.length) return;
        setLikeCounts(prev => {
            const next = { ...prev };
            reviews.forEach((r: Review) => { if (!(r.id in next)) next[r.id] = r.likesCount ?? 0; });
            return next;
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reviews.length]);

    // Zakończona rezerwacja dla tej usługi — potrzebna do wystawienia opinii

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [cachedService, setCachedService] = useState<Service | null>(service);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [galleryStartInGrid, setGalleryStartInGrid] = useState(false);
    const [clientPhotosOpen, setClientPhotosOpen] = useState(false);
    const [clientPhotosIndex, setClientPhotosIndex] = useState(0);
    const [clientPhotosInGrid, setClientPhotosInGrid] = useState(false);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const isMapExpandedRef = useRef(false);
    const handleMapExpandedChange = useCallback((v: boolean) => {
        isMapExpandedRef.current = v;
        setIsMapExpanded(v);
    }, []);
    // Kontroluje czy ServiceMap jest w ogóle zamontowany — ustawiany na false
    // synchronicznie (flushSync) tuż przed router.back(), żeby React usunął węzły
    // DOM map Google z drzewa ZANIM zacznie się animacja przejścia. iOS WebKit
    // nie zwalnia GPU layera od display:none, ale zwalnia od unmount.
    const [mapMounted] = useState(true);
    useSwipeBack(!galleryOpen && !clientPhotosOpen && !isMapExpanded, onBack);
    const [reviewSort, setReviewSort] = useState<'newest' | 'highest' | 'lowest'>('newest');
    const [reviewsVisible, setReviewsVisible] = useState(4);
    const [likedReviews, setLikedReviews] = useState<Set<number>>(new Set());
    const [likeCounts, setLikeCounts] = useState<Record<number, number>>({});
    const [newReviews] = useState<Review[]>([]);
    const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(null);
    const effectiveFavorite = optimisticFavorite !== null ? optimisticFavorite : isFavorite;

    const [ctaReady] = useState(true);

    const isDraggingRef = useRef(false);
    const similarScrollRef = useRef<HTMLDivElement>(null);
    const similarSentinelRef = useRef<HTMLDivElement>(null);

    const mapControlsRef = useRef<{ collapse: () => void; zoomIn: () => void; zoomOut: () => void } | null>(null);
    const [, setGalleryViewMode] = useState<'carousel' | 'grid'>('carousel');
    const [, setClientPhotosViewMode] = useState<'carousel' | 'grid'>('carousel');
    const galleryToggleRef = useRef<(() => void) | null>(null);
    const clientPhotosToggleRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (service) setCachedService(service);
    }, [service]);



    const activeService = service || cachedService;

    const images = useMemo(() => {
        if (!activeService) return [];
        return activeService.images && activeService.images.length > 0
            ? activeService.images
            : (activeService.image ? [activeService.image] : []);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- JSON.stringify is intentional: deep-compare images array to avoid stale lightbox after edit
    }, [activeService?.id, JSON.stringify(activeService?.images), activeService?.image]);

    const mediaItems = useMemo(() => {
        const imgs = images.map(url => ({ type: 'image' as const, url }));
        const vids = (activeService?.videos ?? []).map(v => ({
            type: 'video' as const,
            url: v.url,
            thumbnail: v.thumbnailUrl ?? undefined,
        }));
        return [...imgs, ...vids];
    }, [images, activeService?.videos]);

    const viewCount = activeService?.views ?? 0;

    const isRemoteService = activeService ? checkIsRemote(activeService) : false;
    const isUserActive = activeService?.isOnline === true;

    const { data: similarData, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
        queryKey: ['similar-services-v4', servicePublicId],
        queryFn: async ({ pageParam }: { pageParam: number }) => {
            try {
                const res = await apiClient.get(`/services/${servicePublicId}/similar?limit=8&offset=${pageParam}`);
                if (!res.ok) return [] as ApiService[];
                const json = await res.json();
                const arr = json.data ?? json;
                return (Array.isArray(arr) ? arr : []) as ApiService[];
            } catch {
                return [] as ApiService[];
            }
        },
        getNextPageParam: (lastPage: ApiService[], allPages: ApiService[][]) => {
            if (!Array.isArray(lastPage) || lastPage.length < 8) return undefined;
            return allPages.reduce((sum, p) => sum + (Array.isArray(p) ? p.length : 0), 0);
        },
        initialPageParam: 0,
        enabled: !!servicePublicId,
        staleTime: 1000 * 60,
    });
    const similarServices = useMemo(() => {
        return (similarData?.pages ?? []).flat().filter(Boolean).map((s: ApiService) => mapApiService(s));
    }, [similarData]);

    useEffect(() => {
        const sentinel = similarSentinelRef.current;
        const scroller = similarScrollRef.current;
        if (!sentinel || !scroller) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
            },
            { root: scroller, threshold: 0.1 }
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Zapisuj scrollLeft karuzeli na żywo przez scroll event — ref jest null w useEffect cleanup,
    // więc cleanup-based save nie działa. Event listener ma zawsze świeży dostęp do elementu.
    useEffect(() => {
        const scroller = similarScrollRef.current;
        if (!scroller || !servicePublicId || !similarServices.length) return;
        const save = () => { savedCarouselScrolls.set(servicePublicId, scroller.scrollLeft); };
        scroller.addEventListener('scroll', save, { passive: true });
        return () => scroller.removeEventListener('scroll', save);
    }, [servicePublicId, similarServices]);

    // Przywróć scrollLeft karuzeli po remount (pop navigation).
    useEffect(() => {
        if (!servicePublicId || !similarServices.length) return;
        const saved = savedCarouselScrolls.get(servicePublicId);
        if (!saved) return;
        const raf = requestAnimationFrame(() => {
            if (similarScrollRef.current) similarScrollRef.current.scrollLeft = saved;
        });
        return () => cancelAnimationFrame(raf);
    }, [servicePublicId, similarServices]);

    const providerName = activeService?.provider?.name || 'Nieznany użytkownik';
    const providerAvatar = activeService?.provider?.avatar;
    const ctaLabel = activeService?.type === 'offer' ? 'Zarezerwuj termin' : 'Zgłoś się do zlecenia';

    const handleCTA = useCallback(() => {
        if (!activeService) return;
        if (!isLoggedIn) { onLoginRedirect(); return; }
        if (activeService.type === 'request') {
            onStartChat(activeService);
        } else { onBook(); }
    }, [activeService, isLoggedIn, onLoginRedirect, onStartChat, onBook]);

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!activeService) return;
        if (!isLoggedIn) {
            addToast('Zaloguj się, aby dodać do ulubionych', 'info', <Heart size={18} />);
            router.push('/auth');
            return;
        }
        const willBeFavorite = !effectiveFavorite;
        setOptimisticFavorite(willBeFavorite);
        onToggleFavorite(activeService.publicId ?? '');
        if (!willBeFavorite) addToast('Usunięto z ulubionych', 'custom', <Trash2 size={18} />, 'bg-gray-800');
        else addToast('Dodano do ulubionych', 'custom', <Heart size={18} fill="currentColor" />, 'bg-rose-500');
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!activeService) return;
        const webUrl = window.location.href;
        try {
            await navigator.clipboard.writeText(webUrl);
            addToast('Link skopiowany do schowka', 'success', <Check size={18} />);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = webUrl; ta.style.cssText = 'position:fixed;left:-9999px';
            document.body.appendChild(ta); ta.focus(); ta.select();
            try { document.execCommand('copy'); addToast('Link skopiowany do schowka', 'success', <Check size={18} />); } catch (err) { logger.warn('Copy failed', err); }
            document.body.removeChild(ta);
        }
    };

    // Biały overlay na popstate: przykrywa canvas GPU layer, sticky nav (z-[99999]) i wszystko inne.
    // flushSync (native) odpala się PO wstawieniu overlaya — pośredni paint jest zasłonięty.
    // Overlay odpala się tylko dla browser-back / swipe-back (nie dla webNavigate z vt-running).
    useEffect(() => {
        const handlePop = () => {
            if (document.documentElement.classList.contains('vt-running')) return;
            const overlay = createSafariOverlay();
            const sdvRoot = document.querySelector('[data-sdv-root]');
            revealAfterUnmount(overlay, sdvRoot);
        };
        window.addEventListener('popstate', handlePop, { capture: true });
        return () => window.removeEventListener('popstate', handlePop, { capture: true });
    }, []);

    const doBack = useCallback(() => {
        // onBack() → NativeNav.pop() na native (Swift animation) lub webNavigate na web;
        // obsługuje też hasHistory (deep link z idx=0 → router.push('/') zamiast -1)
        onBack();
    }, [onBack]);

    const handleSmartBack = useCallback(() => {
        if (galleryOpen) { setGalleryOpen(false); return; }
        if (clientPhotosOpen) { setClientPhotosOpen(false); return; }
        if (isMapExpandedRef.current && mapControlsRef.current) {
            mapControlsRef.current.collapse();
            setTimeout(doBack, 120);
            return;
        }
        doBack();
    }, [galleryOpen, clientPhotosOpen, doBack]);

    const ctaBarRef = useRef<HTMLDivElement>(null);

    const { isNativeBottomBarActive } = useNativeBottomBar({
        price:     activeService?.price?.toString() ?? '',
        unit:      activeService?.priceUnit ?? '',
        label:     ctaLabel,
        enabled:   false,
        visible:   false,
        collapsed: !isLoggedIn || galleryOpen || clientPhotosOpen || isMapExpanded || isReportOpen || isSupportOpen,
        onAction: () => {
            if (!activeService) return;
            if (!isLoggedIn) { onLoginRedirect(); return; }
            onBook();
        },
    });

    // Ustawia --page-cta-bar-h żeby ToastContainer pozycjonował się ponad CTA barem na web
    useEffect(() => {
        const el = ctaBarRef.current;
        if (!el) return;
        const update = () => {
            const visible = ctaReady && !isNativeBottomBarActive;
            document.documentElement.style.setProperty('--page-cta-bar-h', visible ? `${el.offsetHeight}px` : '0px');
        };
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => { ro.disconnect(); document.documentElement.style.removeProperty('--page-cta-bar-h'); };
    }, [ctaReady, isNativeBottomBarActive]);

    const handleReviewSubmit = async (rating: number, text: string, imageUrl?: string | null) => {
        const spId = canReviewData?.servicePublicId ?? servicePublicId;
        const bookingId = canReviewData?.bookingId;
        if (!spId || !bookingId) {
            addToast('Nie można znaleźć powiązanej rezerwacji.', 'error');
            return;
        }
        try {
            const res = await apiClient.post(`/services/${spId}/reviews`, {
                rating,
                text,
                bookingId,
                ...(imageUrl ? { imageUrl } : {}),
            });
            if (!res.ok) {
                const errJson = await res.json().catch(() => ({})) as { error?: string };
                if (res.status === 409) throw Object.assign(new Error('duplicate'), { status: 409 });
                throw Object.assign(new Error(errJson.error || 'error'), { status: res.status });
            }
            queryClient.invalidateQueries({ queryKey: ['service-reviews', servicePublicId] });
            queryClient.invalidateQueries({ queryKey: ['can-review', serviceProviderUid, servicePublicId] });
            setShowReviewForm(false);
            addToast('Opinia została dodana. Dziękujemy!', 'success');
        } catch (err: unknown) {
            if ((err as { status?: number })?.status === 409) {
                addToast('Już wystawiłeś opinię dla tej usługi.', 'error');
            } else {
                addToast('Nie udało się dodać opinii. Spróbuj ponownie.', 'error');
            }
            throw err;
        }
    };

    const toggleLike = async (id: number) => {
        if (!isLoggedIn) return;
        const wasLiked = likedReviews.has(id);
        setLikedReviews(prev => { const s = new Set(prev); if (wasLiked) s.delete(id); else s.add(id); return s; });
        setLikeCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (wasLiked ? -1 : 1)) }));
        try {
            const res = await apiClient.post(`/reviews/${id}/like`, {});
            if (res.ok) {
                const json = await res.json() as { liked: boolean; count: number };
                setLikedReviews(prev => { const s = new Set(prev); if (json.liked) s.add(id); else s.delete(id); return s; });
                setLikeCounts(prev => ({ ...prev, [id]: json.count }));
            } else {
                setLikedReviews(prev => { const s = new Set(prev); if (wasLiked) s.add(id); else s.delete(id); return s; });
                setLikeCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (wasLiked ? 1 : -1)) }));
            }
        } catch {
            setLikedReviews(prev => { const s = new Set(prev); if (wasLiked) s.add(id); else s.delete(id); return s; });
            setLikeCounts(prev => ({ ...prev, [id]: Math.max(0, (prev[id] ?? 0) + (wasLiked ? 1 : -1)) }));
        }
    };

    const handleDeleteReview = async (reviewId: number) => {
        setDeletingReviewId(null);
        try {
            const res = await apiClient.delete(`/reviews/${reviewId}`);
            if (!res.ok) throw new Error();
            queryClient.invalidateQueries({ queryKey: ['service-reviews'] });
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            addToast('Opinia usunięta', 'success');
        } catch {
            addToast('Nie udało się usunąć opinii', 'error');
        }
    };

    const displayReviews = useMemo(() => {
        const sorted = [...newReviews, ...reviews].filter((r: Review) => !r.autoGenerated);
        if (reviewSort === 'highest') sorted.sort((a, b) => b.rating - a.rating);
        else if (reviewSort === 'lowest') sorted.sort((a, b) => a.rating - b.rating);
        return sorted;
    }, [reviews, newReviews, reviewSort]);

    const visibleReviews = displayReviews.slice(0, reviewsVisible);
    const hasMoreReviews = reviewsVisible < displayReviews.length;

    const reviewPhotos = useMemo(
        () => [...newReviews, ...reviews].map(r => r.imageUrl).filter(Boolean) as string[],
        [reviews, newReviews]
    );

    const handleNextImage = useCallback(() => setCurrentImageIndex(p => (p + 1) % mediaItems.length), [mediaItems.length]);
    const handlePrevImage = useCallback(() => setCurrentImageIndex(p => (p - 1 + mediaItems.length) % mediaItems.length), [mediaItems.length]);

    // Preload sąsiednich zdjęć przy każdej zmianie (tylko image items)
    useEffect(() => {
        if (mediaItems.length <= 1) return;
        const neighbors = [
            mediaItems[(currentImageIndex + 1) % mediaItems.length],
            mediaItems[(currentImageIndex - 1 + mediaItems.length) % mediaItems.length],
        ];
        neighbors.forEach(item => {
            if (item.type === 'image') { const img = document.createElement('img'); img.src = item.url; }
        });
    }, [currentImageIndex, mediaItems]);

    const touchSwipeRef = useRef<{ startX: number; startY: number; t: number } | null>(null);

    const _handleTouchStart = useCallback((e: React.TouchEvent) => {
        touchSwipeRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, t: Date.now() };
        isDraggingRef.current = false;
    }, []);

    const _handleTouchEnd = useCallback((e: React.TouchEvent) => {
        if (!touchSwipeRef.current || mediaItems.length <= 1) return;
        const dx = e.changedTouches[0].clientX - touchSwipeRef.current.startX;
        const dy = Math.abs(e.changedTouches[0].clientY - touchSwipeRef.current.startY);
        const dt = Date.now() - touchSwipeRef.current.t;
        const vx = dx / dt;
        touchSwipeRef.current = null;
        if (dy > 40) return; // pionowy scroll — ignoruj
        if (Math.abs(dx) > 30 || Math.abs(vx) > 0.3) {
            isDraggingRef.current = true;
            if (dx < 0) handleNextImage(); else handlePrevImage();
            setTimeout(() => { isDraggingRef.current = false; }, 100);
        }
    }, [mediaItems.length, handleNextImage, handlePrevImage]);

    const handleVideoDragEnd = useCallback((_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
        if (mediaItems.length <= 1) return;
        if (info.offset.x < -50 || info.velocity.x < -400) {
            isDraggingRef.current = true;
            handleNextImage();
            setTimeout(() => { isDraggingRef.current = false; }, 100);
        } else if (info.offset.x > 50 || info.velocity.x > 400) {
            isDraggingRef.current = true;
            handlePrevImage();
            setTimeout(() => { isDraggingRef.current = false; }, 100);
        }
    }, [mediaItems.length, handleNextImage, handlePrevImage]);

    // Osobny handler dla drag end na zdjęciach — nawigacja jak video, ale zawsze
    // ustawia isDraggingRef żeby zablokować onClick nawet przy małym drag (< 50px).
    const handleImageDragEnd = useCallback((_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
        handleVideoDragEnd(_, info);
        isDraggingRef.current = true;
        setTimeout(() => { isDraggingRef.current = false; }, 150);
    }, [handleVideoDragEnd]);

    const handleImageClick = useCallback(() => {
        if (!isDraggingRef.current && mediaItems.length > 0) {
            setGalleryIndex(currentImageIndex);
            setGalleryStartInGrid(false);
            setGalleryOpen(true);
        }
    }, [mediaItems.length, currentImageIndex]);

    if (!activeService) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F4F4F9]">
                <div className="flex flex-col items-center gap-4">
                    <Spinner size="lg" />
                    <p className="text-slate-500 font-medium">Ładowanie ogłoszenia...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* ── GALERIA GŁÓWNA ── */}
            <ClientPhotosModal
                isOpen={galleryOpen}
                onClose={() => setGalleryOpen(false)}
                items={mediaItems}
                initialIndex={galleryIndex}
                startInGrid={galleryStartInGrid}
                onViewChange={setGalleryViewMode}
                registerToggle={galleryToggleRef}
            />

            {/* ── GALERIA ZDJĘĆ REALIZACJI ── */}
            <ClientPhotosModal
                isOpen={clientPhotosOpen}
                onClose={() => setClientPhotosOpen(false)}
                items={reviewPhotos.map(url => ({ type: 'image' as const, url }))}
                initialIndex={clientPhotosIndex}
                startInGrid={clientPhotosInGrid}
                onViewChange={setClientPhotosViewMode}
                registerToggle={clientPhotosToggleRef}
            />

            {/* ── MOBILE BOTTOM CTA BAR ──
                 Web: portaled do body — fixed wewnątrz transformed motion.div byłoby relatywne do parenta,
                      przez co CTA "jedzie" ze stroną podczas animacji wejścia.
                 iOS native: inline — portal zaburza synchronizację z natywnym BottomBar pluginem. */}
            {!activeService.isMine && (
                <ClientPortal>
                    <div
                        ref={ctaBarRef}
                        data-cta-bar
                        className={`fixed left-0 right-0 z-40 lg:hidden bg-white/80 backdrop-blur-xl border-t border-white/30 transition-[opacity] duration-200${isNativeBottomBarActive ? ' opacity-0 pointer-events-none' : ''}`}
                        style={{ bottom: isLoggedIn ? 'var(--bottom-nav-total-h, calc(68px + var(--bottom-nav-pb, 0px)))' : '0' }}
                    >
                        <div className="flex items-center gap-3 px-4 pt-3" style={{ paddingBottom: isLoggedIn ? '0.75rem' : 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                            <div className="shrink-0">
                                <p className="font-black text-xl text-slate-900 leading-tight">{activeService.price} zł</p>
                                <p className="text-[11px] text-slate-400">/ {activeService.priceUnit}</p>
                            </div>
                            <button onClick={handleCTA} className="flex-1 bg-indigo-600 text-white py-3.5 rounded-2xl font-black text-base hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-300/50">{ctaLabel}</button>
                        </div>
                    </div>
                </ClientPortal>
            )}


            <div
                className="min-h-screen bg-[#F4F4F9] w-full relative font-sans selection:bg-indigo-500 selection:text-white pb-28 lg:pb-0"
            >
                <div className="max-w-6xl mx-auto px-4 pb-4 pt-14 md:px-6 md:pb-6 md:pt-14 lg:p-8 w-full">

                    {/* ── NAWIGACJA mobile: portaled to body, tylko domyślny widok (galerie i mapa mają własne kontrolki) ── */}
                    {!galleryOpen && !clientPhotosOpen && (!isChatOpen || isReportOpen || isSupportOpen) && (
                        <ClientPortal>
                            <div
                                className="fixed left-0 right-0 z-[99999] lg:hidden flex items-center justify-between px-4 h-12 pointer-events-none"
                                style={{ top: 'var(--total-nav-h, 73px)' }}
                            >
                                <button onClick={handleSmartBack} type="button" aria-label="Wróć" className="pointer-events-auto flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-2xl border border-slate-100 shadow-sm hover:bg-white transition-all active:scale-95 focus:outline-none"
                                    style={(isReportOpen || isSupportOpen) ? { opacity: 0.35, filter: 'blur(2px)', pointerEvents: 'none', transition: 'opacity 0.2s, filter 0.2s' } : { transition: 'opacity 0.2s, filter 0.2s' }}
                                >
                                    <ArrowLeft size={15} strokeWidth={2.5} className="text-slate-700" />
                                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Wróć</span>
                                </button>
                                <div className="flex gap-2 items-center">
                                    <button onClick={handleFavoriteClick} type="button" aria-label={effectiveFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'} aria-pressed={effectiveFavorite} className="pointer-events-auto p-2.5 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm hover:bg-white transition-all active:scale-95 focus:outline-none"
                                        style={(isReportOpen || isSupportOpen) ? { opacity: 0.35, filter: 'blur(2px)', pointerEvents: 'none', transition: 'opacity 0.2s, filter 0.2s' } : { transition: 'opacity 0.2s, filter 0.2s' }}
                                    >
                                        <Heart size={20} className={effectiveFavorite ? 'fill-red-500 text-red-500' : 'text-slate-600'} />
                                    </button>
                                    <button onClick={handleShare} type="button" aria-label="Udostępnij" className="pointer-events-auto p-2.5 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm hover:bg-white transition-all active:scale-95 focus:outline-none"
                                        style={(isReportOpen || isSupportOpen) ? { opacity: 0.35, filter: 'blur(2px)', pointerEvents: 'none', transition: 'opacity 0.2s, filter 0.2s' } : { transition: 'opacity 0.2s, filter 0.2s' }}
                                    >
                                        <Share2 size={20} className="text-slate-600" />
                                    </button>
                                </div>
                            </div>
                        </ClientPortal>
                    )}
                    <div className="hidden lg:flex justify-between items-center mb-5">
                        <button onClick={handleSmartBack} type="button" className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-2xl text-[10px] font-black shadow-sm border border-slate-100 text-slate-700 uppercase tracking-wider transition-all active:scale-95 hover:bg-white">
                            <ArrowLeft size={13} strokeWidth={3} /> Wróć
                        </button>
                        <div className="flex gap-2">
                            <button onClick={handleFavoriteClick} type="button" aria-label={effectiveFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'} aria-pressed={effectiveFavorite} className="p-2.5 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm hover:bg-white transition-all active:scale-95 focus:outline-none">
                                <Heart size={20} className={effectiveFavorite ? 'fill-red-500 text-red-500' : 'text-slate-600'} />
                            </button>
                            <button onClick={handleShare} type="button" aria-label="Udostępnij" className="p-2.5 bg-white/90 backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm hover:bg-white transition-all active:scale-95 focus:outline-none">
                                <Share2 size={20} className="text-slate-600" />
                            </button>
                        </div>
                    </div>

                    {/* ── MEDIA (zdjęcia + filmy) ── */}
                    <ServiceMediaGallery
                        mediaItems={mediaItems}
                        currentImageIndex={currentImageIndex}
                        serviceTitle={activeService.title}
                        serviceType={activeService.type as 'offer' | 'request'}
                        onImageClick={handleImageClick}
                        onPrev={handlePrevImage}
                        onNext={handleNextImage}
                        onDragStart={() => { isDraggingRef.current = true; }}
                        onVideoDragEnd={handleVideoDragEnd}
                        onImageDragEnd={handleImageDragEnd}
                    />

                    {/* ── GŁÓWNA SIATKA ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                        <div className="lg:col-span-2 space-y-5 min-w-0">

                            {/* Karta: Tytuł */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 leading-tight break-words tracking-tight">
                                    {activeService.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2">
                                    {activeService.category && (() => {
                                        const cat = CATEGORIES_DATA.find(c => c.id === activeService.category);
                                        return cat ? (
                                            <span className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-xl text-sm">
                                                {cat.name}
                                            </span>
                                        ) : null;
                                    })()}
                                    {activeService.rating > 0 && (
                                        <span className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-xl text-sm">
                                            <Star size={13} className="fill-amber-400 text-amber-400"/>
                                            <strong className="text-amber-600 font-black">{activeService.rating}</strong>
                                            <span className="text-amber-400 font-semibold">({reviews.length} {polishPlural(reviews.length, 'opinia', 'opinie', 'opinii')})</span>
                                        </span>
                                    )}
                                    {isRemoteService ? (
                                        <span className="inline-flex items-center gap-1.5 text-indigo-600 font-bold bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-xl text-sm">
                                            <Globe size={13}/> Zdalnie / Online
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 text-slate-600 font-semibold bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl text-sm">
                                            <MapPin size={13} className="text-indigo-400"/> {activeService.city}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Karta: Gospodarz */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4 cursor-pointer group" onClick={() => activeService.provider && onOpenProfile(activeService.provider)}>
                                    <div className="relative shrink-0">
                                        <UserAvatar src={providerAvatar} name={providerName} size={56} className="rounded-2xl border border-slate-100 group-hover:scale-105 transition-transform shadow-sm" />
                                        {isUserActive && (
                                            <span className="absolute -bottom-0.5 -right-0.5 block h-4 w-4 rounded-full ring-2 ring-white bg-green-500 shadow-sm" />
                                        )}
                                    </div>
                                    <div>

                                        <h3 className="font-bold text-[17px] text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{providerName}</h3>
                                        <p className="text-sm text-slate-400">
                                            Na platformie od {activeService?.createdAt ? new Date(activeService.createdAt).getFullYear() : '—'}
                                            {(activeService?.bookings ?? 0) > 0 && ` · ${activeService!.bookings} ${activeService!.bookings === 1 ? 'zlecenie' : activeService!.bookings < 5 ? 'zlecenia' : 'zleceń'}`}
                                            {isUserActive && ' · Aktywny teraz'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => onStartChat(activeService)} className="w-full sm:w-auto px-6 py-3 mt-4 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors">
                                    Wyślij wiadomość
                                </button>
                            </div>

                            {/* Karta: O ofercie */}
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">O ofercie</p>
                                <p className="text-slate-600 leading-relaxed whitespace-pre-line text-[17px] break-words">
                                    {activeService.description || 'Brak opisu.'}
                                </p>
                            </div>

                            {/* Karta: Lokalizacja / Zdalna */}
                            {isRemoteService ? (
                                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Tryb realizacji</p>
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100">
                                            <Globe size={22} className="text-indigo-500" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 text-base leading-tight mb-1">
                                                {activeService.type === 'request' ? 'Zlecenie w pełni zdalne' : 'Usługa w pełni zdalna'}
                                            </h3>
                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                {activeService.type === 'request'
                                                    ? 'Praca odbywa się zdalnie — wykonawca może być z dowolnego miejsca w Polsce.'
                                                    : 'Realizacja odbywa się w 100% online — bez wychodzenia z domu.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (() => {
                                const isFixed = activeService.radius === 0;
                                const isRequest = activeService.type === 'request';
                                const label = isFixed
                                    ? 'Lokalizacja'
                                    : isRequest
                                        ? 'Obszar poszukiwania'
                                        : 'Obszar obsługi';
                                const desc = isFixed
                                    ? isRequest
                                        ? <><strong className="text-slate-700">Praca stacjonarna</strong> w <strong className="text-slate-700">{activeService.city}</strong></>
                                        : <><strong className="text-slate-700">Stacjonarnie</strong> w <strong className="text-slate-700">{activeService.city}</strong></>
                                    : isRequest
                                        ? <>Szukam wykonawcy w promieniu <strong className="text-slate-700">{activeService.radius} km</strong> od <strong className="text-slate-700">{activeService.city}</strong></>
                                        : <>Dojazd do <strong className="text-slate-700">{activeService.radius} km</strong> od centrum <strong className="text-slate-700">{activeService.city}</strong></>;
                                return (
                                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">{label}</p>
                                        {mapMounted
                                            ? <ServiceMap city={activeService.city} address={activeService.address} lat={activeService.location?.lat} lng={activeService.location?.lng} radiusKm={activeService.radius} serviceName={activeService.provider?.name} providerAvatar={activeService.provider?.avatar ?? undefined} providerName={activeService.provider?.name} onExpandedChange={handleMapExpandedChange} onRegisterControls={(c) => { mapControlsRef.current = c; }} />
                                            : <div style={{ height: 300, borderRadius: 16, background: '#f1f5f9' }} />
                                        }
                                        <p className="text-sm text-slate-400 mt-3 flex items-start gap-1.5">
                                            <MapPin size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                                            <span>{desc}</span>
                                        </p>
                                    </div>
                                );
                            })()}

                            {/* Karta: Opinie */}
                            <ServiceReviews
                                displayReviews={displayReviews}
                                reviews={reviews}
                                visibleReviews={visibleReviews}
                                hasMoreReviews={hasMoreReviews}
                                reviewsVisible={reviewsVisible}
                                reviewSort={reviewSort}
                                showReviewForm={showReviewForm}
                                likedReviews={likedReviews}
                                likeCounts={likeCounts}
                                canReviewData={canReviewData}
                                isLoggedIn={isLoggedIn}
                                isMine={!!activeService.isMine}
                                rating={activeService.rating}
                                currentUserUid={currentUserUid}
                                reviewPhotos={reviewPhotos}
                                onChangeSortKey={(key) => { setReviewSort(key); setReviewsVisible(4); }}
                                onLoadMore={() => setReviewsVisible(prev => Math.min(prev + 3, displayReviews.length))}
                                onToggleReviewForm={() => setShowReviewForm(v => !v)}
                                onReviewSubmit={handleReviewSubmit}
                                onToggleLike={toggleLike}
                                onRequestDelete={setDeletingReviewId}
                                onReportReview={onReportReview}
                                onShowProviderProfile={() => activeService.provider && onOpenProfile(activeService.provider)}
                                onSetClientPhotosIndex={setClientPhotosIndex}
                                onSetClientPhotosInGrid={setClientPhotosInGrid}
                                onSetClientPhotosOpen={setClientPhotosOpen}
                            />

                        </div>

                        {/* ── SIDEBAR (tylko desktop) ── */}
                        <ServiceBookingPanel
                            price={activeService.price}
                            priceUnit={activeService.priceUnit ?? ''}
                            rating={activeService.rating}
                            isMine={!!activeService.isMine}
                            isRemoteService={isRemoteService}
                            userLocation={userLocation}
                            city={activeService.city ?? ''}
                            ctaLabel={ctaLabel}
                            onCTA={handleCTA}
                            onEdit={() => onEdit(activeService)}
                        />
                    </div>

                    {/* ── PODOBNE USŁUGI ── */}
                    {similarServices.length > 0 && (
                        <div className="mt-10">
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Podobne w okolicy</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => { const el = similarScrollRef.current; if (el) el.scrollTo({ left: Math.max(0, el.scrollLeft - 268), behavior: 'smooth' }); }}
                                        className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-colors active:scale-95"
                                        aria-label="Przewiń w lewo"
                                    >
                                        <ChevronLeft size={16} className="text-slate-600" />
                                    </button>
                                    <button
                                        onClick={() => { const el = similarScrollRef.current; if (el) el.scrollTo({ left: el.scrollLeft + 268, behavior: 'smooth' }); }}
                                        className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center hover:bg-slate-50 hover:border-slate-300 transition-colors active:scale-95"
                                        aria-label="Przewiń w prawo"
                                    >
                                        <ChevronRight size={16} className="text-slate-600" />
                                    </button>
                                </div>
                            </div>
                            <div ref={similarScrollRef} className="flex items-stretch gap-4 overflow-x-auto pb-3 -mx-1 px-1" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', overscrollBehaviorX: 'contain' } as React.CSSProperties}>
                                {similarServices.map(svc => {
                                    const svcCat = CATEGORIES_DATA.find(c => c.id === svc.category);
                                    return (
                                        <div
                                            key={svc.publicId}
                                            onClick={() => onOpenService(svc)}
                                            className="group cursor-pointer shrink-0 w-[200px] md:w-[240px] flex flex-col"
                                        >
                                            <div className="relative h-40 md:h-44 rounded-2xl overflow-hidden bg-slate-100 mb-3 shadow-sm shrink-0">
                                                <img
                                                    src={svc.image || '/placeholder.svg'}
                                                    alt={svc.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={e => { (e.target as HTMLImageElement).src = '/placeholder.svg' }}
                                                />
                                                <div className="absolute bottom-3 left-3">
                                                    <div className="bg-white px-3 py-1 rounded-xl shadow-sm">
                                                        <span className="font-black text-slate-900 text-sm">{svc.price} {svc.priceUnit || 'zł'}</span>
                                                    </div>
                                                </div>
                                                {svc.rating > 0 && (
                                                    <div className="absolute top-3 right-3">
                                                        <div className="bg-slate-900 px-2.5 py-1 rounded-xl flex items-center gap-1">
                                                            <Star size={10} className="fill-amber-400 text-amber-400" />
                                                            <span className="text-white font-black text-[11px]">{svc.rating}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col flex-1">
                                                {svcCat && (
                                                    <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-wider rounded-lg mb-2 self-start">
                                                        {svcCat.name}
                                                    </span>
                                                )}
                                                <h4 className="font-bold text-slate-900 text-[14px] leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2 mb-auto pb-2">
                                                    {svc.title}
                                                </h4>
                                                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-auto">
                                                    <MapPin size={11} className="text-indigo-300 shrink-0" />
                                                    <span>{svc.city || 'Online'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {isFetchingNextPage && (
                                    <div className="shrink-0 flex items-center justify-center w-16 h-40">
                                        <Spinner size="sm" />
                                    </div>
                                )}
                                <div ref={similarSentinelRef} className="shrink-0 w-1" />
                            </div>
                        </div>
                    )}

                    {/* ── STOPKA ── */}
                    <div className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Eye size={14} className="shrink-0"/>
                            <span><strong className="text-slate-600">{viewCount.toLocaleString('pl-PL')}</strong> wyświetleń</span>
                        </div>
                        {!service?.isMine && (
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                            <button onClick={onReport} className="text-slate-400 text-sm flex items-center gap-2 hover:text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors">
                                <Flag size={14}/> Zgłoś nieodpowiednią treść
                            </button>
                            {onOpenSupport && (
                                <button onClick={onOpenSupport} className="text-slate-400 text-sm flex items-center gap-2 hover:text-indigo-500 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors">
                                    <LifeBuoy size={14}/> Zgłoś problem z usługą
                                </button>
                            )}
                        </div>
                        )}
                    </div>
                </div>
            </div>
            <DeleteReviewModal
                isOpen={deletingReviewId !== null}
                onClose={() => setDeletingReviewId(null)}
                onConfirm={() => deletingReviewId !== null && handleDeleteReview(deletingReviewId)}
            />
        </>
    );
};

export default ServiceDetailsView;
