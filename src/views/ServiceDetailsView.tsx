'use client';
import Image from 'next/image';
import { ArrowLeft, Heart, Share2, MapPin, Star, Edit2, Flag, Globe, Check, ChevronLeft, ChevronRight, Trash2, Eye, CheckCircle, Camera, ThumbsUp, Expand, Plus, Minus, LifeBuoy, Play } from 'lucide-react';
import { ReviewForm } from '../components/reviews/ReviewForm';
import { ClientPhotosModal } from '../components/modals/ClientPhotosModal';
import { logger } from '../utils/logger';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../plugins/NativeNav';
import { usePlatform } from '../hooks/usePlatform';
import { useSwipeBack } from '../hooks/useSwipeBack';
import { useNativeNavBar, nativeShare } from '../hooks/useNativeNavBar';
import { useNativeBottomBar } from '../hooks/useNativeBottomBar';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { normalizeMediaUrl } from '../utils/normalizeUrl';
import { ClientPortal } from '../components/ui/ClientPortal';
import { createSafariOverlay, revealAfterUnmount } from '../utils/safariNavOverlay';
import { motion, AnimatePresence, useMotionValue, animate as fmAnimate } from 'framer-motion';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { CITY_COORDS } from '../data/constants';
import { mapApiService, type ApiService } from '../services/serviceService';
import { CATEGORIES_DATA } from '../data/categories';
import { isRemoteService as checkIsRemote } from '../utils/serviceUtils';
import { polishPlural } from '../utils/helpers';
import { Spinner } from '../components/ui/Spinner';
import { UserAvatar } from '../components/ui/UserAvatar';
import { MapNavigationButton } from '../components/ui/MapNavigationButton';

const MAP_STYLES = [
    { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff', weight: 3 }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#7dd3fc' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#0369a1' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#bbf7d0' }] },
    { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#f1f5f9' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#bbf7d0' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e2e8f0' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f1f5f9' }] },
    { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fde68a' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#f59e0b' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#92400e' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#94a3b8', weight: 1.5 }] },
    { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }] },
    { featureType: 'administrative.locality', elementType: 'labels', stylers: [{ visibility: 'on' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#0f172a' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff', weight: 4 }] },
    { featureType: 'administrative.neighborhood', elementType: 'labels', stylers: [{ visibility: 'on' }] },
    { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
];
import { Service, Review, ProviderProfile } from '../types';
import { DeleteReviewModal } from '../components/modals/DeleteReviewModal';

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

const getZoom = (r: number) => {
    if (r <= 1) return 15;
    if (r <= 2) return 14;
    if (r <= 5) return 13;
    if (r <= 15) return 12;
    if (r <= 30) return 11;
    if (r <= 80) return 10;
    return 9;
};

const ServiceMap = ({ city, address, lat: propLat, lng: propLng, radiusKm, serviceName, providerAvatar, providerName, onExpandedChange, onRegisterControls }: {
    city: string; address?: string | null; lat?: number; lng?: number; radiusKm: number; serviceName?: string; providerAvatar?: string; providerName?: string; onExpandedChange?: (v: boolean) => void; onRegisterControls?: (c: { collapse: () => void; zoomIn: () => void; zoomOut: () => void }) => void;
}) => {
    const { isNative } = usePlatform();
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: (process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string | undefined) ?? '',
    });

    const portalMapRef = useRef<google.maps.Map | null>(null);
    const portalDivRef = useRef<HTMLDivElement>(null);
    const portalWrapperRef = useRef<HTMLDivElement>(null);
    const placeholderRef = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [animating, setAnimating] = useState(false);

    const mTop = useMotionValue(-9999);
    const mLeft = useMotionValue(0);
    const mWidth = useMotionValue(300);
    const mHeight = useMotionValue(300);
    const mRadius = useMotionValue(16);

    const raw = CITY_COORDS[city] || CITY_COORDS['default'] || '52.07,19.48';
    const [fallbackLat, fallbackLng] = raw.split(',').map(Number);
    const [geocodedLat, setGeocodedLat] = useState<number | null>(null);
    const [geocodedLng, setGeocodedLng] = useState<number | null>(null);

    useEffect(() => {
        if (!city) return;
        const apiBase = `${process.env.NEXT_PUBLIC_API_URL || '/api'}`;
        if (address) {
            // Zawsze geocoduj adres ulicy — propLat/propLng mogą być tylko centrum miasta
            fetch(`${apiBase}/public/address?query=${encodeURIComponent(address + ', ' + city)}`)
                .then(r => r.json())
                .then((json: { data: { lat: number; lng: number }[] }) => {
                    const hit = json.data?.[0];
                    if (hit?.lat) { setGeocodedLat(hit.lat); setGeocodedLng(hit.lng); return; }
                    return fetch(`${apiBase}/public/cities?query=${encodeURIComponent(city)}`);
                })
                .then((r?: Response) => r?.json())
                .then((json?: { data: { lat: number; lng: number }[] }) => {
                    if (!json) return;
                    const hit = json.data?.[0];
                    if (hit?.lat) { setGeocodedLat(hit.lat); setGeocodedLng(hit.lng); }
                })
                .catch(() => {});
        } else if (propLat === null || propLat === undefined || propLng === null || propLng === undefined) {
            fetch(`${apiBase}/public/cities?query=${encodeURIComponent(city)}`)
                .then(r => r.json())
                .then((json: { data: { lat: number; lng: number }[] }) => {
                    const hit = json.data?.[0];
                    if (hit?.lat) { setGeocodedLat(hit.lat); setGeocodedLng(hit.lng); }
                })
                .catch(() => {});
        }
    }, [city, address, propLat, propLng]);

    // Gdy jest adres → geocodedLat ma pierwszeństwo (ulica dokładna)
    // Gdy brak adresu → propLat (z DB) lub geocodedLat (z miast) lub fallback
    const lat = address ? (geocodedLat ?? propLat ?? fallbackLat) : (propLat ?? geocodedLat ?? fallbackLat);
    const lng = address ? (geocodedLng ?? propLng ?? fallbackLng) : (propLng ?? geocodedLng ?? fallbackLng);
    const center = { lat, lng };
    const isFixedLocation = radiusKm === 0;
    const effectiveRadius = radiusKm;
    const fixedZoom = address ? 17 : 15;

    const handleExpand = useCallback(() => {
        if (!placeholderRef.current || animating) return;
        requestAnimationFrame(() => {
            if (!placeholderRef.current) return;
            const r = placeholderRef.current.getBoundingClientRect();

            mTop.set(Math.max(0, r.top));
            mLeft.set(r.left);
            mWidth.set(r.width);
            mHeight.set(r.height || 300);
            mRadius.set(16);

            setExpanded(true);
            setAnimating(true);
            onExpandedChange?.(true);
            onRegisterControls?.({
                collapse: handleCollapse,
                zoomIn: () => { const z = portalMapRef.current?.getZoom(); if (z !== undefined) portalMapRef.current?.setZoom(z + 1); },
                zoomOut: () => { const z = portalMapRef.current?.getZoom(); if (z !== undefined) portalMapRef.current?.setZoom(z - 1); },
            });
            portalMapRef.current?.setOptions({ gestureHandling: 'greedy' });

            const isDesktop = window.innerWidth >= 768;
            const targetW = isDesktop ? Math.min(window.innerWidth * 0.9, 768) : window.innerWidth;
            const targetH = isDesktop ? window.innerHeight * 0.85 : window.innerHeight * 0.75;
            const targetTop = isDesktop ? (window.innerHeight - targetH) / 2 : window.innerHeight - targetH;
            const targetLeft = (window.innerWidth - targetW) / 2;
            const tween = { duration: 0.32, ease: 'easeInOut' } as const;
            fmAnimate(mTop, targetTop, tween);
            fmAnimate(mLeft, targetLeft, tween);
            fmAnimate(mWidth, targetW, tween);
            fmAnimate(mHeight, targetH, tween);
            fmAnimate(mRadius, isDesktop ? 24 : 20, tween).then(() => setAnimating(false));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps -- handleCollapse is a forward ref (defined below, shares same motion deps so closure stays fresh); onRegisterControls is an inline prop arrow (new ref each render, only written to a ref)
    }, [animating, mTop, mLeft, mWidth, mHeight, mRadius, onExpandedChange]);

    const handleCollapse = useCallback(() => {
        if (!placeholderRef.current) return;
        const r = placeholderRef.current.getBoundingClientRect();
        portalMapRef.current?.setOptions({ gestureHandling: 'none' });
        // Ukryj portal synchronicznie przed setState (setState jest async — bez tego portal
        // byłby widoczny przez 1 klatkę na pozycji placeholder zanim React zrobi re-render)
        if (portalDivRef.current) {
            portalDivRef.current.style.visibility = 'hidden';
            portalDivRef.current.style.opacity = '0';
        }
        mTop.set(r.top);
        mLeft.set(r.left);
        mWidth.set(r.width);
        mHeight.set(r.height || 300);
        mRadius.set(16);
        setExpanded(false);
        setAnimating(false);
        onExpandedChange?.(false);
    }, [mTop, mLeft, mWidth, mHeight, mRadius, onExpandedChange]);

    useEffect(() => {
        if (!expanded) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCollapse(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [expanded, handleCollapse]);

    if (!isLoaded) {
        return <div className="rounded-2xl bg-slate-100 animate-pulse" style={{ height: 300 }} />;
    }

    const markerIcon: google.maps.Symbol = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: isFixedLocation ? 10 : 8,
        fillColor: '#6366F1', fillOpacity: 1,
        strokeColor: '#ffffff', strokeWeight: 3,
    };

    const placeOverlays = (map: google.maps.Map) => {
        const gm = google.maps;
        new gm.Marker({ position: center, map, icon: markerIcon, clickable: false });
        if (!isFixedLocation) {
            const circle = new gm.Circle({
                center, radius: effectiveRadius * 1000, map,
                fillColor: '#6366F1', fillOpacity: 0.12,
                strokeColor: '#6366F1', strokeWeight: 2.5, strokeOpacity: 0.65, clickable: false,
            });
            const bounds = circle.getBounds() as google.maps.LatLngBounds | null;
            if (bounds) map.fitBounds(bounds, 40);
        }
    };

    const isOpen = expanded || animating;
    const mapOptions = { disableDefaultUI: true, styles: MAP_STYLES, gestureHandling: 'none' as const, clickableIcons: false };

    return (
        <>
            {/* Inline — zawsze zamontowana mapa (tile cache), przy otwartym portalu zakryta szarym blokiem */}
            <div
                ref={placeholderRef}
                style={{ height: 300, borderRadius: 16, overflow: 'hidden', position: 'relative' }}
            >
                {/* Wrapper z visibility:hidden ukrywa iframe mapy (w tym stacking context) bez odmontowywania */}
                <div style={{ position: 'absolute', inset: 0, visibility: isOpen ? 'hidden' : 'visible' }}>
                    <GoogleMap
                        mapContainerStyle={{ height: '100%', width: '100%' }}
                        center={center}
                        zoom={isFixedLocation ? fixedZoom : getZoom(effectiveRadius)}
                        options={mapOptions}
                        onLoad={placeOverlays}
                    />
                </div>

                {/* Placeholder gdy portal jest otwarty — identyczny jak wcześniej */}
                {isOpen && (
                    <div style={{ position: 'absolute', inset: 0, background: '#edf0f5', overflow: 'hidden' }}>
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
                            <rect x="60" y="40" width="110" height="70" rx="4" fill="#e2e7ef"/>
                            <rect x="230" y="30" width="90" height="50" rx="4" fill="#e2e7ef"/>
                            <rect x="310" y="100" width="80" height="90" rx="4" fill="#e2e7ef"/>
                            <rect x="40" y="170" width="130" height="80" rx="4" fill="#e2e7ef"/>
                            <rect x="210" y="190" width="100" height="70" rx="4" fill="#e2e7ef"/>
                            <line x1="0" y1="120" x2="400" y2="118" stroke="#fff" strokeWidth="10"/>
                            <line x1="0" y1="120" x2="400" y2="118" stroke="#c8cfe0" strokeWidth="1"/>
                            <line x1="0" y1="165" x2="400" y2="162" stroke="#fff" strokeWidth="6"/>
                            <line x1="0" y1="248" x2="400" y2="250" stroke="#fff" strokeWidth="10"/>
                            <line x1="0" y1="248" x2="400" y2="250" stroke="#c8cfe0" strokeWidth="1"/>
                            <line x1="180" y1="0" x2="182" y2="300" stroke="#fff" strokeWidth="10"/>
                            <line x1="180" y1="0" x2="182" y2="300" stroke="#c8cfe0" strokeWidth="1"/>
                            <line x1="310" y1="0" x2="308" y2="300" stroke="#fff" strokeWidth="6"/>
                            <line x1="80" y1="0" x2="78" y2="300" stroke="#fff" strokeWidth="6"/>
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: '#6366F1', boxShadow: '0 6px 20px rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ transform: 'rotate(45deg)', display: 'flex' }}><MapPin size={20} color="#fff" /></div>
                            </div>
                            <div style={{ background: '#fff', borderRadius: 20, padding: '5px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{city}</div>
                        </div>
                    </div>
                )}

                {!isOpen && (
                    <>
                        {/* Nakładka z kursorem — nad mapą (z-[1]), pod bottom card (z-10) */}
                        <div className="absolute inset-0 cursor-pointer" style={{ zIndex: 1 }} onClick={handleExpand} />
                        <div className="absolute bottom-0 left-0 right-0 z-10 p-3 pointer-events-none">
                            <div className="bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 pointer-events-auto">
                                <UserAvatar src={providerAvatar} name={providerName || '?'} size={36} className="rounded-xl border border-slate-100 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    {serviceName && <p className="font-bold text-sm text-slate-900 truncate">{serviceName}</p>}
                                    <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} className="text-indigo-400 shrink-0" /> {city}</p>
                                </div>
                                <MapNavigationButton
                                    lat={lat} lng={lng} label={serviceName}
                                    buttonClassName="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-indigo-50 transition-colors"
                                    iconClassName="text-indigo-500"
                                />
                            </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); handleExpand(); }}
                            className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-md flex items-center justify-center hover:bg-white transition-colors">
                            <Expand size={13} className="text-slate-600" />
                        </button>
                    </>
                )}
            </div>

            {/* Portal — montowany tylko gdy isOpen; brak pre-warm = brak GPU layer flash przy cofaniu */}
            {isOpen && (
            <ClientPortal>
                <div ref={portalWrapperRef}>
                    <motion.div className="fixed inset-0 bg-black/60" style={{ zIndex: 999999 }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ duration: 0.18 }} onClick={handleCollapse} />

                    <motion.div ref={portalDivRef} style={{
                        position: 'fixed', top: mTop, left: mLeft, width: mWidth, height: mHeight,
                        borderRadius: mRadius, zIndex: 9999999, overflow: 'hidden',
                    }}>
                        <GoogleMap
                            mapContainerStyle={{ height: '100%', width: '100%' }}
                            center={center}
                            zoom={isFixedLocation ? fixedZoom : getZoom(effectiveRadius)}
                            options={{ ...mapOptions, gestureHandling: expanded ? 'greedy' : 'none' }}
                            onLoad={map => { portalMapRef.current = map; placeOverlays(map); }}
                        />

                        {/* Bottom card z nawigacją */}
                        <div className={`absolute bottom-0 left-0 right-0 z-10 pt-3 pointer-events-none${isNative ? ' px-4' : ' px-3'}`}
                            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}>
                            <div className="bg-white rounded-2xl shadow-lg px-4 py-3.5 flex items-center gap-3 pointer-events-auto">
                                <UserAvatar src={providerAvatar} name={providerName || '?'} size={36} className="rounded-xl border border-slate-100 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    {serviceName && <p className="font-bold text-sm text-slate-900 truncate">{serviceName}</p>}
                                    <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} className="text-indigo-400 shrink-0" /> {city}</p>
                                </div>
                                <MapNavigationButton
                                    lat={lat} lng={lng} label={serviceName}
                                    buttonClassName="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-indigo-50 transition-colors"
                                    iconClassName="text-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Kontrolki — tylko gdy w pełni otwarte */}
                        {expanded && !animating && (
                            <>
                                <button onClick={handleCollapse}
                                    className="absolute top-4 left-4 z-20 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors">
                                    <ArrowLeft size={18} className="text-slate-700" />
                                </button>
                                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                                    <button onClick={() => { const z = portalMapRef.current?.getZoom(); if (z !== undefined) portalMapRef.current?.setZoom(z + 1); }}
                                        className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors">
                                        <Plus size={18} className="text-slate-700" />
                                    </button>
                                    <button onClick={() => { const z = portalMapRef.current?.getZoom(); if (z !== undefined) portalMapRef.current?.setZoom(z - 1); }}
                                        className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors">
                                        <Minus size={18} className="text-slate-700" />
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            </ClientPortal>
            )}
        </>
    );
};

// Scroll poziomy karuzeli podobnych serwisów — zapisywany przy unmount (push), przywracany przy remount (pop).
const savedCarouselScrolls = new Map<string, number>();

const ServiceDetailsView = ({
    service, reviews: reviewsProp = [], isFavorite, onBack, onToggleFavorite, onOpenProfile,
    onOpenService, onStartChat, onEdit, onBook, isLoggedIn, onLoginRedirect, userLocation,
    currentUserUid, onReport, onReportReview, onOpenSupport, addToast, isChatOpen = false, isReportOpen = false, isSupportOpen = false, showNotificationsOpen = false,
}: ServiceDetailsViewProps) => {

    const { isNative, isIos } = usePlatform();
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
    const [galleryViewMode, setGalleryViewMode] = useState<'carousel' | 'grid'>('carousel');
    const [clientPhotosViewMode, setClientPhotosViewMode] = useState<'carousel' | 'grid'>('carousel');
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
        if (isNative) Haptics.impact({ style: ImpactStyle.Medium });
        if (!isLoggedIn) { onLoginRedirect(); return; }
        if (activeService.type === 'request') {
            onStartChat(activeService);
        } else { onBook(); }
    }, [activeService, isLoggedIn, isNative, onLoginRedirect, onStartChat, onBook]);

    const handleFavoriteClick = (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!activeService) return;
        if (!isLoggedIn) {
            addToast('Zaloguj się, aby dodać do ulubionych', 'info', <Heart size={18} />);
            router.push('/auth');
            return;
        }
        if (isNative) Haptics.impact({ style: ImpactStyle.Medium });
        const willBeFavorite = !effectiveFavorite;
        setOptimisticFavorite(willBeFavorite);
        onToggleFavorite(activeService.publicId ?? '');
        if (!willBeFavorite) addToast('Usunięto z ulubionych', 'custom', <Trash2 size={18} />, 'bg-gray-800');
        else addToast('Dodano do ulubionych', 'custom', <Heart size={18} fill="currentColor" />, 'bg-rose-500');
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        if (!activeService) return;
        const webUrl = window.location.href.replace(/^(capacitor|https?):\/\/localhost(:\d+)?/, 'https://mylokalni.pl');
        if (isNative) {
            Haptics.impact({ style: ImpactStyle.Medium });
            const imageUrl = activeService.images?.[0] || activeService.image || '';
            try { await nativeShare({ url: webUrl, title: activeService.title, imageUrl }); return; } catch { return; }
        }
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
            if (isNative) { return; }
            const overlay = createSafariOverlay();
            const sdvRoot = document.querySelector('[data-sdv-root]');
            revealAfterUnmount(overlay, sdvRoot);
        };
        window.addEventListener('popstate', handlePop, { capture: true });
        return () => window.removeEventListener('popstate', handlePop, { capture: true });
    }, [isNative]);

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

    const shareUrl = typeof window !== 'undefined'
        ? window.location.href.replace(/^(capacitor|https?):\/\/localhost(:\d+)?/, 'https://mylokalni.pl')
        : '';

    const shareImageUrl = activeService?.images?.[0] || activeService?.image || '';

    useNativeNavBar({
        isFavorite: effectiveFavorite,
        shareUrl,
        shareTitle: activeService?.title || '',
        shareImageUrl,
        isLoggedIn,
        hidden:        (isChatOpen && !isReportOpen && !isSupportOpen) || isSupportOpen || showNotificationsOpen,
        isMapOpen:     isMapExpanded || isReportOpen,
        isGalleryOpen: galleryOpen || clientPhotosOpen,
        galleryIsGrid: galleryOpen ? galleryViewMode === 'grid' : clientPhotosViewMode === 'grid',
        onBack: handleSmartBack,
        onFavoriteChange: (fav) => {
            if (!activeService) return;
            setOptimisticFavorite(fav);
            onToggleFavorite(activeService.publicId ?? '');
            if (!fav) addToast('Usunięto z ulubionych', 'custom', <Trash2 size={18} />, 'bg-gray-800');
            else      addToast('Dodano do ulubionych',  'custom', <Heart  size={18} fill="currentColor" />, 'bg-rose-500');
        },
        onLoginRequired: () => {
            addToast('Zaloguj się, aby dodać do ulubionych', 'info', <Heart size={18} />);
            router.push('/auth');
        },
        onGalleryClose: () => {
            if (galleryOpen) setGalleryOpen(false);
            else if (clientPhotosOpen) setClientPhotosOpen(false);
        },
        onGalleryToggle: () => {
            if (galleryOpen) galleryToggleRef.current?.();
            else if (clientPhotosOpen) clientPhotosToggleRef.current?.();
        },
    });

    const ctaBarRef = useRef<HTMLDivElement>(null);

    const { isNativeBottomBarActive } = useNativeBottomBar({
        price:     activeService?.price?.toString() ?? '',
        unit:      activeService?.priceUnit ?? '',
        label:     ctaLabel,
        enabled:   isNative,
        visible:   isNative && !activeService?.isMine && (!isChatOpen || isReportOpen || isSupportOpen),
        collapsed: !isLoggedIn || galleryOpen || clientPhotosOpen || isMapExpanded || isReportOpen || isSupportOpen,
        onAction: () => {
            if (!activeService) return;
            if (isNative) Haptics.impact({ style: ImpactStyle.Medium });
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
            <style>{`html { scrollbar-gutter: stable; }`}</style>

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
            {!activeService.isMine && (isNative
                ? <div
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
                : <ClientPortal>
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
                <div className={`max-w-6xl mx-auto px-4 pb-4 ${isIos ? 'pt-[60px]' : 'pt-14'} md:px-6 md:pb-6 md:pt-14 lg:p-8 w-full`}>

                    {/* ── NAWIGACJA mobile: portaled to body, tylko domyślny widok (galerie i mapa mają własne kontrolki) ── */}
                    {!isIos && !galleryOpen && !clientPhotosOpen && (!isChatOpen || isReportOpen || isSupportOpen) && (
                        <ClientPortal>
                            <div
                                data-fixed-nav-px4
                                className="fixed left-0 right-0 z-[99999] lg:hidden flex items-center justify-between px-4 h-12 pointer-events-none"
                                style={{ top: 'var(--total-nav-h, 73px)' }}
                            >
                                {!isNative ? (
                                    <button onClick={handleSmartBack} type="button" aria-label="Wróć" className="pointer-events-auto flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-2xl border border-slate-100 shadow-sm hover:bg-white transition-all active:scale-95 focus:outline-none"
                                        style={(isReportOpen || isSupportOpen) ? { opacity: 0.35, filter: 'blur(2px)', pointerEvents: 'none', transition: 'opacity 0.2s, filter 0.2s' } : { transition: 'opacity 0.2s, filter 0.2s' }}
                                    >
                                        <ArrowLeft size={15} strokeWidth={2.5} className="text-slate-700" />
                                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Wróć</span>
                                    </button>
                                ) : <div />}
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
                    <div className="w-full h-64 md:h-96 rounded-3xl overflow-hidden mb-5 relative shadow-lg bg-slate-100 group select-none touch-pan-y">
                        {mediaItems.length > 0 ? (
                            <>
                                <AnimatePresence mode="wait">
                                    {mediaItems[currentImageIndex]?.type === 'video' ? (
                                        <motion.div
                                            key={`v-${currentImageIndex}`}
                                            className="w-full h-full"
                                            initial={false}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            drag={mediaItems.length > 1 ? 'x' : false}
                                            dragConstraints={{ left: 0, right: 0 }}
                                            dragElastic={0.15}
                                            onDragEnd={handleVideoDragEnd}
                                            onClick={handleImageClick}
                                            style={{ touchAction: 'pan-y' }}
                                        >
                                            {mediaItems[currentImageIndex].thumbnail ? (
                                                <img src={mediaItems[currentImageIndex].thumbnail} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <video
                                                    src={mediaItems[currentImageIndex].url}
                                                    className="w-full h-full object-cover pointer-events-none"
                                                    muted playsInline preload="metadata"
                                                    onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 0.1; }}
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                                                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                    <Play size={22} className="text-white ml-1" fill="white" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key={`i-${currentImageIndex}`}
                                            className="w-full h-full cursor-grab active:cursor-grabbing"
                                            initial={false}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            drag={mediaItems.length > 1 ? 'x' : false}
                                            dragConstraints={{ left: 0, right: 0 }}
                                            dragElastic={0.15}
                                            onDragStart={() => { isDraggingRef.current = true; }}
                                            onDragEnd={handleImageDragEnd}
                                            onClick={handleImageClick}
                                            style={{ touchAction: 'pan-y' }}
                                        >
                                            <img
                                                src={mediaItems[currentImageIndex]?.url}
                                                alt={activeService.title}
                                                className="w-full h-full object-cover pointer-events-none"
                                                draggable={false}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {mediaItems.length > 1 && (
                                    <>
                                        <button onClick={e => { e.stopPropagation(); handlePrevImage(); }} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2.5 rounded-full shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-20 hidden md:block active:scale-90">
                                            <ChevronLeft size={22} className="text-slate-800" />
                                        </button>
                                        <button onClick={e => { e.stopPropagation(); handleNextImage(); }} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2.5 rounded-full shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-20 hidden md:block active:scale-90">
                                            <ChevronRight size={22} className="text-slate-800" />
                                        </button>
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none">
                                            {mediaItems.map((item, idx) => (
                                                <div key={idx} className={`h-1.5 rounded-full transition-all shadow-sm ${idx === currentImageIndex ? (item.type === 'video' ? 'bg-white w-5' : 'bg-white w-5') : 'bg-white/50 w-1.5'}`} />
                                            ))}
                                        </div>
                                    </>
                                )}

                                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg pointer-events-none">
                                    {mediaItems[currentImageIndex]?.type === 'video'
                                        ? <Play size={11} className="text-white/80" fill="white" />
                                        : <Camera size={11} className="text-white/80" />
                                    }
                                    {mediaItems.length > 1
                                        ? <span className="text-white text-[11px] font-bold">{currentImageIndex + 1} / {mediaItems.length}</span>
                                        : <span className="text-white text-[11px] font-bold">Powiększ</span>
                                    }
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 flex-col gap-2">
                                <Camera size={32} className="opacity-30" />
                                <span className="text-sm">Brak zdjęcia</span>
                            </div>
                        )}

                        <div className="absolute top-4 left-4 z-20 pointer-events-none">
                            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-md ${activeService.type === 'request' ? 'bg-violet-600' : 'bg-indigo-500'}`}>
                                {activeService.type === 'request' ? 'Zlecenie' : 'Oferta'}
                            </span>
                        </div>
                    </div>

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
                            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">

                                {/* Nagłówek */}
                                <div className="flex items-start justify-between gap-4 mb-5">
                                    <div>
                                        <div className="flex items-center gap-3 mb-1.5">
                                            <div className="w-1.5 h-7 bg-amber-400 rounded-full shrink-0" />
                                            <h3 className="font-black text-2xl text-slate-900 tracking-tight">Opinie klientów</h3>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-4">
                                            {displayReviews.length} {displayReviews.length === 1 ? 'zweryfikowana recenzja' : displayReviews.length < 5 ? 'zweryfikowane recenzje' : 'zweryfikowanych recenzji'}
                                        </p>
                                    </div>
                                    {isLoggedIn && !activeService?.isMine && canReviewData?.canReview && (
                                        <button
                                            onClick={() => setShowReviewForm(v => !v)}
                                            className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                                                showReviewForm
                                                    ? 'bg-white border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 shadow-sm'
                                                    : 'bg-[#6366F1] text-white hover:bg-[#4F46E5] shadow-lg shadow-indigo-300/40'
                                            }`}
                                        >
                                            <Star size={15} className={showReviewForm ? 'text-slate-500' : 'fill-white text-white'} />
                                            {showReviewForm ? 'Anuluj' : 'Napisz opinię'}
                                        </button>
                                    )}
                                </div>

                                {/* Formularz */}
                                <ReviewForm
                                    isOpen={showReviewForm && isLoggedIn && !activeService?.isMine && !!canReviewData?.canReview}
                                    onSubmit={handleReviewSubmit}
                                    onCancel={() => setShowReviewForm(false)}
                                />

                                {/* Sortowanie */}
                                {displayReviews.length > 1 && (
                                    <div className="flex w-full bg-slate-100 p-1 rounded-2xl gap-0.5 mb-6">
                                        {([
                                            { key: 'newest', label: 'Najnowsze' },
                                            { key: 'highest', label: 'Najwyższe' },
                                            { key: 'lowest', label: 'Najgorsze' },
                                        ] as const).map(({ key, label }) => (
                                            <button
                                                key={key}
                                                onClick={() => { setReviewSort(key); setReviewsVisible(4); }}
                                                className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all duration-200 ${reviewSort === key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Podsumowanie ratingu */}
                                {reviews.length > 0 && activeService.rating > 0 && (
                                    <div className="bg-white rounded-3xl px-5 py-4 border border-slate-100 shadow-sm flex items-center gap-5 mb-6">
                                        <div className="text-center pr-5 border-r border-slate-100 shrink-0">
                                            <div className="text-[46px] font-black text-slate-900 leading-none tracking-tighter">{activeService.rating}</div>
                                            <div className="flex gap-0.5 mt-1.5 justify-center">
                                                {[1,2,3,4,5].map(i => <Star key={i} size={12} className={i <= Math.round(activeService.rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-100'} />)}
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{reviews.length} {polishPlural(reviews.length, 'opinia', 'opinie', 'opinii')}</p>
                                        </div>
                                        <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
                                            {[5,4,3,2,1].map(stars => {
                                                const count = reviews.filter(r => r.rating === stars).length;
                                                const pct = Math.round((count / reviews.length) * 100);
                                                return (
                                                    <div key={stars} className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-slate-400 w-3 text-right shrink-0">{stars}</span>
                                                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                                        </div>
                                                        <span className="text-[9px] text-slate-400 w-6 text-right shrink-0">{pct}%</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Zdjęcia od klientów — tylko z opinii */}
                                {reviewPhotos.length > 0 && (
                                <div className="mb-6">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Camera size={12} className="text-slate-400" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Zdjęcia od klientów</span>
                                        <span className="text-[10px] font-black text-slate-400">· {reviewPhotos.length}</span>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                                        {reviewPhotos.slice(0, 5).map((photo, i) => (
                                            <div
                                                key={i}
                                                onClick={() => { setClientPhotosIndex(i); setClientPhotosInGrid(false); setClientPhotosOpen(true); }}
                                                className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group bg-slate-100"
                                            >
                                                <Image src={photo} fill className="object-cover object-center group-hover:scale-105 transition-transform duration-500" alt={`Zdjęcie ${i+1}`} sizes="(max-width: 640px) 33vw, 16vw" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                    <Expand size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                                </div>
                                            </div>
                                        ))}
                                        {reviewPhotos.length > 5 && (
                                        <div
                                            onClick={() => { setClientPhotosInGrid(true); setClientPhotosOpen(true); }}
                                            className="aspect-square rounded-2xl bg-slate-900 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-600 transition-colors duration-300 group"
                                        >
                                            <span className="text-white font-black text-xl group-hover:scale-110 transition-transform">+{reviewPhotos.length - 5}</span>
                                            <span className="text-[9px] font-bold text-slate-500 group-hover:text-white/60 uppercase tracking-wider mt-1 transition-colors">Wszystkie</span>
                                        </div>
                                        )}
                                    </div>
                                </div>
                                )}

                                {/* Lista opinii */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {reviews.length === 0 ? (
                                        <div className="md:col-span-2 py-10 bg-slate-50 rounded-2xl text-center border border-slate-100">
                                            <Star size={28} className="text-slate-200 mx-auto mb-3" />
                                            <p className="text-slate-500 font-semibold text-sm">Brak opinii dla tej usługi.</p>
                                            <p className="text-slate-400 text-xs mt-1">Bądź pierwszy, który oceni!</p>
                                        </div>
                                    ) : (
                                        visibleReviews.map(review => {
                                            const isLiked = likedReviews.has(review.id);
                                            const likeCount = likeCounts[review.id] ?? review.likesCount ?? 0;
                                            return (
                                                <div key={review.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
                                                    <div className="p-6 flex items-start justify-between gap-4">
                                                        {review.autoGenerated ? (
                                                            <div className="flex items-center gap-4 min-w-0">
                                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                                                                    <CheckCircle size={20} className="text-slate-400" />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <span className="text-[15px] font-bold block truncate text-slate-900">Zweryfikowana realizacja</span>
                                                                    <span className="text-[11px] text-slate-400 mt-1 block">{review.date}</span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className={`flex items-center gap-4 min-w-0 ${review.userUid ? 'cursor-pointer group/reviewer' : ''}`}
                                                                onClick={async () => { if (!review.userUid) return; if (Capacitor.isNativePlatform()) await NativeNav.push().catch(() => {}); router.push(`/profile/${review.userUid}`); }}
                                                            >
                                                                <div className="relative shrink-0">
                                                                    <UserAvatar
                                                                        src={review.userAvatar}
                                                                        name={review.userName || '?'}
                                                                        size={48}
                                                                        className={`rounded-2xl transition-transform duration-200 ${review.userUid ? 'group-hover/reviewer:scale-105' : ''}`}
                                                                    />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <span className={`text-[15px] font-bold block truncate transition-colors duration-150 ${review.userUid ? 'text-slate-900 group-hover/reviewer:text-indigo-600' : 'text-slate-900'}`}>{review.userName}</span>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <div className="flex gap-0.5">
                                                                            {[1,2,3,4,5].map(i => <Star key={i} size={11} className={i <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-100'} />)}
                                                                        </div>
                                                                        <span className="text-[11px] text-slate-400">{review.date}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {!review.autoGenerated && (
                                                        <div className="px-6 pb-5 flex-1">
                                                            <p className="text-[15px] text-slate-700 leading-relaxed">{review.text}</p>
                                                        </div>
                                                    )}

                                                    {/* Odpowiedź właściciela */}
                                                    {review.ownerReply && !review.autoGenerated && (
                                                        <div className="mx-6 mb-4 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100/70">
                                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Odpowiedź właściciela</p>
                                                            <p className="text-[13px] text-slate-700 leading-relaxed">{review.ownerReply}</p>
                                                        </div>
                                                    )}

                                                    <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
                                                        {review.autoGenerated ? (
                                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-2 py-1 bg-slate-50 rounded-lg">
                                                                Opinia automatyczna
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => toggleLike(review.id)}
                                                                aria-pressed={isLiked}
                                                                className={`flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all duration-200 active:scale-95 ${isLiked ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                                            >
                                                                <ThumbsUp size={14} className={`transition-transform duration-200 ${isLiked ? 'fill-indigo-600 -translate-y-px' : ''}`} />
                                                                {likeCount > 0
                                                                    ? <span className="text-[11px] font-bold">{likeCount}</span>
                                                                    : <span className="text-[11px] font-medium text-slate-400">Pomocna</span>
                                                                }
                                                            </button>
                                                        )}
                                                        {!review.autoGenerated && (
                                                            review.userUid === currentUserUid
                                                                ? (
                                                                    <button onClick={() => setDeletingReviewId(review.id)} aria-label="Usuń opinię" className="text-slate-200 hover:text-rose-400 transition-colors p-2 rounded-xl hover:bg-rose-50 active:scale-90">
                                                                        <Trash2 size={13} />
                                                                    </button>
                                                                ) : (
                                                                    <button onClick={() => onReportReview(review.id)} aria-label="Zgłoś opinię" className="text-slate-200 hover:text-rose-400 transition-colors p-2 rounded-xl hover:bg-rose-50 active:scale-90">
                                                                        <Flag size={13} />
                                                                    </button>
                                                                )
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Paginacja */}
                                {reviews.length > 0 && (
                                    <div className="mt-8 flex flex-col items-center gap-3">
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
                                                    Pokazano {reviewsVisible} z {displayReviews.length} opinii
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

                                <button onClick={() => activeService.provider && onOpenProfile(activeService.provider)} className="w-full mt-5 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors text-sm">
                                    Pokaż profil wykonawcy
                                </button>
                            </div>

                        </div>

                        {/* ── SIDEBAR (tylko desktop) ── */}
                        <div className="hidden lg:block self-stretch">
                            <div className="sticky top-[93px] bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-200/50">
                                <div className="flex justify-between items-start mb-5">
                                    <div>
                                        <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 block mb-1">Cena</span>
                                        <div>
                                            <span className="text-3xl font-black text-slate-900">{activeService.price} zł</span>
                                            <span className="text-slate-400 font-medium"> / {activeService.priceUnit}</span>
                                        </div>
                                    </div>
                                    {activeService.rating > 0 && (
                                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-xl">
                                            <Star size={13} className="fill-amber-400 text-amber-400"/>
                                            <span className="text-sm font-black text-amber-600">{activeService.rating}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="border border-slate-100 rounded-2xl mb-5 overflow-hidden divide-y divide-slate-100">
                                    <div className="p-3 bg-slate-50/60">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">Termin</label>
                                        <div className="text-sm font-semibold text-slate-700">Wybierz datę w kolejnym kroku</div>
                                    </div>
                                    <div className="p-3 bg-white">
                                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">{isRemoteService ? 'Tryb' : 'Lokalizacja'}</label>
                                        <div className={`text-sm font-semibold ${isRemoteService ? 'text-indigo-600' : 'text-slate-700'}`}>
                                            {isRemoteService ? '🌍 Zdalnie / Online' : (userLocation || activeService.city)}
                                        </div>
                                    </div>
                                </div>
                                {!activeService.isMine ? (
                                    <button onClick={handleCTA} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95 transition-all mb-3">
                                        {ctaLabel}
                                    </button>
                                ) : (
                                    <button onClick={() => onEdit(activeService)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mb-3 active:scale-95">
                                        <Edit2 size={20}/> Edytuj ogłoszenie
                                    </button>
                                )}
                                <p className="text-center text-xs text-slate-400">Nie ponosisz opłat w tym kroku.</p>
                            </div>
                        </div>
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
