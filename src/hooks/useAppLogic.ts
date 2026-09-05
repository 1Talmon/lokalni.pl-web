// src/hooks/useAppLogic.ts
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { navPush } from '../utils/navState';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../plugins/NativeNav';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePersistedState } from './usePersistedState';
import { useMyProfile } from './useMyProfile';
import { useNotifications } from './useNotifications';
import { usePushNotifications } from './usePushNotifications';
import { usePublicProfile } from './usePublicProfile';
import { useWebSocket } from './useWebSocket';
import { authService } from '../services/authService';
import { notificationService } from '../services/notificationService';
import { serviceService, mapApiService, type ApiService } from '../services/serviceService';
import { chatService, type ApiChatSession, type ApiMessage } from '../services/chatService';
import { apiClient } from '../services/apiClient';
import { unregisterPushToken, takePendingNavigation, setActiveChatId } from '../services/pushNotificationService';
import { createServiceUrl } from '../utils/helpers';
import { isRemoteService, serviceMatchesLocation } from '../utils/serviceUtils';
import { CITY_COORDS } from '../data/constants';
import { Service, UserProfile, ToastNotification, ToastType } from '../types';
import type { ReportType } from '../types/appTypes';
import { tokenUtils } from '../utils/tokenUtils';
import { secureStorage } from '../utils/secureStorage';
import { dataUrlToFile } from '../utils/imageUtils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.mylokalni.pl/api';

// --- LOCAL TYPES ---

interface ServiceFormData {
    publicId?: string;
    title: string;
    description: string;
    price: string;
    priceUnit?: string;
    category: string;
    type: 'offer' | 'request';
    city?: string;
    isRemote?: boolean;
    radius?: number;
    deliveryTime?: string;
    durationMinutes?: number;
    images?: string[];
    videos?: Array<{ url: string; thumbnailUrl?: string | null }>;
    address?: string;
    addressLat?: number;
    addressLng?: number;
}

interface ServiceApiPayload {
    title: string;
    description: string;
    price: number;
    priceUnit: string;
    category: string;
    type: 'offer' | 'request';
    city: string;
    radius: number;
    isRemote: boolean;
    deliveryTime?: string;
    durationMinutes?: number;
    images: string[];
    videos: Array<{ url: string; thumbnailUrl?: string | null }>;
    address?: string;
    addressLat?: number;
    addressLng?: number;
}

interface BookingPayload {
    type: 'offer' | 'request';
    servicePublicId: string;
    date?: string;
    time?: string;
    address?: string;
    notes?: string;
    addressLat?: number;
    addressLng?: number;
    message?: string;
    proposedPrice?: number;
    availableFrom?: string;
}

export const useAppLogic = () => {
    const router = useRouter();
    const pathname = usePathname();
    const queryClient = useQueryClient();

    // --- STAN UI ---
    const [activeCategory, setActiveCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState(() => {
        if (typeof window === 'undefined') return '';
        const p = new URLSearchParams(window.location.search);
        return p.get('q') ?? '';
    });
    const [searchDisplay, setSearchDisplay] = useState(() => {
        if (typeof window === 'undefined') return '';
        const p = new URLSearchParams(window.location.search);
        return p.get('q') ?? '';
    });
    const [location, setLocation] = usePersistedState('user_location', '');
    const [pickedCoords, setPickedCoords] = usePersistedState<{ lat: number; lng: number } | null>('user_location_coords', null);
    const [sortBy, setSortBy] = useState<'rating' | 'price-low' | 'distance' | 'verified'>('rating');
    const [filterType, setFilterType] = useState<'all' | 'offer' | 'request'>('all');
    const [showOnlineOnly, setShowOnlineOnly] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = usePersistedState('is_logged_in', false);
    const [userProfile, setUserProfile] = usePersistedState<UserProfile | null>('user_profile', null);
    const [toasts, setToasts] = useState<ToastNotification[]>([]);
    const [loadedCount, setLoadedCount] = useState(48);
    const [activeModal, setActiveModal] = useState<'none' | 'chat_detail' | 'add_service' | 'report' | 'support'>('none');
    const [showNotifications, setShowNotifications] = useState(false);
    const [reportData, setReportData] = useState<{ type: 'service' | 'profile' | 'review', id: number | string } | null>(null);
    const [supportContext, setSupportContext] = useState<{ bookingId?: number; category?: string } | null>(null);
    const [activeSupportTicketId, setActiveSupportTicketId] = useState<string | null>(null);
    const [isBookingLoading, setIsBookingLoading] = useState(false);
    const [initialChatText, setInitialChatText] = useState<string>('');
    const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
    const [editingServiceFull, setEditingServiceFull] = useState<Service | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [currentChatServiceId, setCurrentChatServiceId] = useState<string | null>(null);

    // --- STARTUP SILENT REFRESH ───────────────────────────────────────────────
    // accessToken lives ONLY in memory (XSS-safe). On page refresh the token is
    // gone → we silently restore it via the httpOnly refreshToken cookie before
    // rendering any authenticated content or opening the WebSocket.
    const [isLoadingApp, setIsLoadingApp] = useState(true);
    // Start true on service/profile routes so there's no flash between startup loading and page loading
    const [isNavLoading, setIsNavLoading] = useState(
        () => pathname.startsWith('/service/') || pathname.startsWith('/profile/')
    );

    useEffect(() => {
        if (!isLoggedIn) { setIsLoadingApp(false); return; }
        if (tokenUtils.get()) { setIsLoadingApp(false); return; } // already in memory (fresh login)

        (async () => {
            try {
                // Na native: czytaj RT z Keychain/Keystore i wyślij w body.
                // Cookie httpOnly nie przeżywa zabicia aplikacji na iOS/Android.
                const rt = await secureStorage.getRefreshToken();

                if (!rt && Capacitor.isNativePlatform()) {
                    // Keychain pusty — brak RT (np. stary login przed secureStorage).
                    // Czyść stan lokalny cicho bez redirect — user zobaczy stronę
                    // jako niezalogowany i może zalogować się z navbara.
                    setIsLoggedIn(false);
                    setUserProfile(null);
                    tokenUtils.clearAll();
                    return;
                }

                const body: Record<string, string> = {};
                if (rt) body.refreshToken = rt;

                const res = await fetch(`${API_BASE}/auth/refresh`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(body),
                });

                if (!res.ok) {
                    if (res.status === 401) {
                        setIsLoggedIn(false);
                        setUserProfile(null);
                        setActiveModal('none');
                        setCurrentChatId(null);
                        tokenUtils.clearAll();
                        await secureStorage.removeRefreshToken();
                        queryClient.clear();
                        router.push('/auth');
                    }
                    // 5xx / inne → nie wylogowuj
                    return;
                }

                const data = await res.json() as { token?: string; refreshToken?: string };
                if (data?.token) {
                    tokenUtils.set(data.token);
                }
                if (data?.refreshToken && Capacitor.isNativePlatform()) {
                    await secureStorage.setRefreshToken(data.refreshToken);
                }
            } catch {
                // Błąd sieci — NIE wylogowuj
            } finally {
                setIsLoadingApp(false);
            }
        })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- LOGOUT wymuszony przez apiClient (wygasły RT w trakcie sesji) ─────────
    useEffect(() => {
        const handle = () => {
            // Zapisz token push i JWT zanim zostaną wyczyszczone
            const pushToken = localStorage.getItem('push_device_token');
            const jwt = tokenUtils.get();
            localStorage.removeItem('push_device_token');
            if (pushToken && jwt) {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mylokalni.pl/api';
                fetch(`${apiUrl}/notifications/device-token`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
                    credentials: 'include',
                    body: JSON.stringify({ token: pushToken }),
                }).catch(() => {});
            }
            setIsLoggedIn(false);
            setUserProfile(null);
            setActiveModal('none');
            setCurrentChatId(null);
            tokenUtils.clearAll();
            secureStorage.removeRefreshToken().catch(() => {});
            queryClient.clear();
            router.push('/auth');
        };
        window.addEventListener('auth:logout-required', handle);
        return () => window.removeEventListener('auth:logout-required', handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- PUSH NOTIFICATION — wspólna logika nawigacji ─────────────────────────
    // fromKilledApp=true: review_received/reply kieruje na stronę usługi zamiast dashboardu
    const handlePushData = useCallback(async (data: Record<string, string>, fromKilledApp = false) => {
        if (data.type === 'message' && data.sessionId) {
            if (Capacitor.isNativePlatform()) {
                if (!fromKilledApp) {
                    await NativeNav.push({ fullScreen: true }).catch(() => {});
                }
                router.push(`/chat/${data.sessionId}`);
            } else {
                setCurrentChatId(data.sessionId);
                setActiveModal('chat_detail');
                router.push('/chat');
            }
        } else if (data.type === 'booking') {
            navPush(router, '/dashboard', { openTab: 'orders', bookingTab: data.bookingTab || 'incoming' });
        } else if (data.type === 'review_received' || data.type === 'review_reply') {
            if (fromKilledApp && data.servicePublicId) router.push(`/service/${data.servicePublicId}`);
            else navPush(router, '/dashboard', { openDetail: 'reviews' });
        } else if (data.type === 'review' && data.bookingId) {
            router.push(`/review/${data.bookingId}`);
        } else if (data.type === 'review') {
            navPush(router, '/dashboard', { openTab: 'orders', bookingTab: 'outgoing' });
        } else if (data.type === 'post' && data.providerUid) {
            router.push(`/profile/${data.providerUid}`);
        } else if (data.type === 'system' || data.type === 'premium') {
            router.push('/dashboard');
        } else if (data.type === 'support_ticket' && data.ticketId) {
            setActiveSupportTicketId(data.ticketId);
            router.push('/dashboard');
        }
    }, [router])

    // --- PUSH NOTIFICATION TAP — nawigacja po kliknięciu ─────────────────────
    useEffect(() => {
        const handle = (e: Event) => {
            if (!isLoggedIn) return
            const data = (e as CustomEvent<Record<string, string>>).detail
            if (!data) return
            handlePushData(data)
        }
        window.addEventListener('push:navigate', handle)
        return () => window.removeEventListener('push:navigate', handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn])

    // Killed app case — sprawdź pending nawigację gdy auth się przywróci
    useEffect(() => {
        if (!isLoggedIn || isLoadingApp) return
        const data = takePendingNavigation()
        if (!data) return
        handlePushData(data, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn, isLoadingApp])

    // --- WEBSOCKET — real-time push ───────────────────────────────────────────
    // Pass token only after startup restore is complete to avoid connecting with null token
    const wsToken = isLoggedIn && !isLoadingApp ? tokenUtils.get() : null;
    useWebSocket(isLoggedIn && !isLoadingApp, wsToken);

    // --- PROFIL I NOTYFIKACJE ---
    // Blokuj wszystkie authenticated queries podczas isLoadingApp — token jeszcze nie wróciło z refresh.
    // Bez tego useMyProfile/useNotifications strzelają 401, apiClient próbuje refresh równolegle
    // z startup refresh → ten sam RT użyty dwa razy → theft detection → SESSION_COMPROMISED.
    const authReady = isLoggedIn && !isLoadingApp;
    const { data: freshUser } = useMyProfile(authReady);
    const { unreadNotifications, hasUnreadMessages, notificationList } = useNotifications(authReady);

    useEffect(() => {
        if (!freshUser) return;
        setUserProfile(prev => {
            if (!prev) return prev;
            const updates: Record<string, unknown> = {};
            if (freshUser.isPremium !== undefined && freshUser.isPremium !== prev.isPremium) updates.isPremium = freshUser.isPremium;
            if (freshUser.zdjecieTla !== undefined) updates.zdjecieTla = freshUser.zdjecieTla;
            return Object.keys(updates).length ? { ...prev, ...updates } : prev;
        });
        const bgUrl: string | null = freshUser.zdjecieTla ?? null;
        if (bgUrl) { const img = new Image(); img.src = bgUrl; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [freshUser]);

    // --- USŁUGI Z API ---
    const apiSort = sortBy === 'rating' ? 'rating'
        : sortBy === 'price-low' ? 'price_asc'
        : sortBy === 'distance' ? 'distance'
        : sortBy === 'verified' ? 'verified'
        : 'newest';

    // Koordynaty dla filtrowania geo: picked z autocomplete (wszystkie 259 miast z DB)
    // albo fallback na CITY_COORDS (38 hardkodowanych — dla odtworzonych z localStorage)
    const userCoords = useMemo(() => {
        if (!location || location === 'Moja okolica') return null;
        if (pickedCoords) return pickedCoords;
        const raw = CITY_COORDS[location];
        if (!raw) return null;
        const [lat, lng] = raw.split(',').map(Number);
        if (isNaN(lat) || isNaN(lng)) return null;
        return { lat, lng };
    }, [location, pickedCoords]);

    const { data: servicesData, isLoading: servicesLoading } = useQuery({
        queryKey: ['services', activeCategory, filterType, location, showOnlineOnly, searchQuery, apiSort],
        queryFn: () => serviceService.getServices({
            limit: 50,
            category: activeCategory !== 'all' ? activeCategory : undefined,
            type: filterType !== 'all' ? filterType : undefined,
            // Z geo/onlineOnly: nie filtrujemy po mieście (zdalne nie mają miasta)
            // Bez geo: fallback na city ILIKE
            city: (userCoords || showOnlineOnly) ? undefined : (location && location !== 'Moja okolica' ? location : undefined),
            query: searchQuery.trim() || undefined,
            sort: apiSort,
            onlineOnly: showOnlineOnly || undefined,
            userLat: userCoords?.lat,
            userLng: userCoords?.lng,
        }),
        staleTime: 1000 * 30,
    });

    const allServices: Service[] = useMemo(() => (servicesData?.data ?? []) as unknown as Service[], [servicesData]);

    // --- MOJE USŁUGI ---
    const { data: myServicesData, refetch: refetchMyServices } = useQuery({
        queryKey: ['my-services'],
        queryFn: () => serviceService.getMyServices(),
        enabled: authReady,
        staleTime: 1000 * 30,
    });
    const myServices: Service[] = useMemo(() => (myServicesData ?? []) as unknown as Service[], [myServicesData]);

    // --- ULUBIONE ---
    const { data: favoritesData, refetch: refetchFavorites } = useQuery({
        queryKey: ['favorites'],
        queryFn: async () => {
            const res = await apiClient.get('/favorites');
            if (!res.ok) throw new Error(`Błąd pobierania ulubionych (${res.status})`);
            const json = await res.json();
            return (json.data ?? []).map((s: ApiService) => mapApiService(s));
        },
        enabled: authReady,
        staleTime: 1000 * 60,
    });
    const favServices: Service[] = useMemo(() => (favoritesData ?? []) as unknown as Service[], [favoritesData]);
    const favoriteIds: Set<string> = useMemo(() => new Set(favServices.map(s => s.publicId).filter((id): id is string => !!id)), [favServices]);

    // App-level optimistic toggles — survive navigation (unlike component useState)
    const [pendingToggles, setPendingToggles] = useState<Map<string, boolean>>(new Map());
    const effectiveFavoriteIds: Set<string> = useMemo(() => {
        const result = new Set(favoriteIds);
        // Seed from allServices.isFavorite so hearts are correct as soon as the services
        // list loads — no need to wait for the separate ['favorites'] query to resolve.
        if (isLoggedIn) {
            allServices.forEach(s => {
                if (s.isFavorite && s.publicId && !pendingToggles.has(s.publicId)) result.add(s.publicId);
            });
        }
        pendingToggles.forEach((isFav, publicId) => { if (isFav) result.add(publicId); else result.delete(publicId); });
        return result;
    }, [favoriteIds, pendingToggles, allServices, isLoggedIn]);

    // --- CHATY ---
    const { data: chatSessionsData, refetch: refetchChats } = useQuery({
        queryKey: ['chats'],
        queryFn: () => chatService.getSessions(),
        enabled: authReady,
        refetchInterval: authReady ? 15000 : false,
        staleTime: 5000,
    });
    const chatSessions = useMemo(() => chatSessionsData ?? [], [chatSessionsData]);

    // --- MUTACJE ---
    const toggleFavoriteMutation = useMutation({
        mutationFn: async ({ publicId, remove }: { publicId: string; remove: boolean }) => {
            const res = remove
                ? await apiClient.delete(`/favorites/${publicId}`)
                : await apiClient.put(`/favorites/${publicId}`, {});
            if (!res.ok) throw new Error(`favorite_error_${res.status}`);
        },
        onMutate: ({ publicId, remove }) => {
            if (remove) {
                queryClient.setQueryData<ReturnType<typeof mapApiService>[]>(['favorites'], (old) =>
                    old ? old.filter(s => s.publicId !== publicId) : old
                );
            } else {
                const serviceData = queryClient.getQueryData<ReturnType<typeof mapApiService>>(['service', state.selectedService?.publicId ?? '']);
                if (serviceData) {
                    queryClient.setQueryData<ReturnType<typeof mapApiService>[]>(['favorites'], (old) =>
                        old ? [{ ...serviceData, isFavorite: true }, ...old] : [{ ...serviceData, isFavorite: true }]
                    );
                }
            }
            setPendingToggles(prev => new Map(prev).set(publicId, !remove));
        },
        onSuccess: async (_data, { publicId, remove }) => {
            if (!remove) {
                const svc = queryClient.getQueryData<ReturnType<typeof mapApiService>>(['service', publicId])
                    ?? allServices.find(s => s.publicId === publicId);
                if (svc?.category) serviceService.trackEvent('favorite', svc.category);
            }
            await refetchFavorites();
            setPendingToggles(prev => { const m = new Map(prev); m.delete(publicId); return m; });
            queryClient.invalidateQueries({ queryKey: ['service'] });
        },
        onError: (_err, { publicId }) => {
            refetchFavorites();
            setPendingToggles(prev => { const m = new Map(prev); m.delete(publicId); return m; });
        },
    });

    const deleteServiceMutation = useMutation({
        mutationFn: (publicId: string) => serviceService.deleteService(publicId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            queryClient.invalidateQueries({ queryKey: ['my-services'] });
        },
    });

    // --- FILTROWANIE (backup — już zrobione przez API) ---
    const filteredServices = useMemo(() => {
        return allServices.filter(service => {
            if (showOnlineOnly) return isRemoteService(service);
            if (!userCoords && !serviceMatchesLocation(service, location, true)) return false;
            return true;
        });
    }, [allServices, location, showOnlineOnly, userCoords]);

    // --- TOAST ---
    const addToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev.slice(-2), { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
    }, []);

    usePushNotifications(authReady, addToast);

    // Synchronizuj aktywny czat z serwisem push — wycisza powiadomienia od rozmówcy
    useEffect(() => {
        setActiveChatId(activeModal === 'chat_detail' ? currentChatId : null);
    }, [currentChatId, activeModal]);

    // Gdy panel powiadomień się zamyka → oznacz wszystkie jako przeczytane
    const prevShowNotifications = useRef(false);
    useEffect(() => {
        const wasOpen = prevShowNotifications.current;
        prevShowNotifications.current = showNotifications;
        if (wasOpen && !showNotifications) {
            notificationService.markAllAsRead().then(() => {
                queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
                queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
            });
        }
    }, [showNotifications, queryClient]);

    // --- LOGOUT ---
    const handleLogout = async () => {
        await unregisterPushToken().catch(() => {});
        try { await authService.logout(); } catch { /* best-effort */ }
        setIsLoggedIn(false);
        setUserProfile(null);
        setActiveModal('none');
        setCurrentChatId(null);
        queryClient.clear();
        router.push('/');
        addToast("Wylogowano");
    };

    // --- OGŁOSZENIA: submit przez API + upload zdjęć ---
    const handleServiceSubmit = useCallback(async (rawData: unknown) => {
        const data = rawData as ServiceFormData;
        try {
            const imageUrls: string[] = (await Promise.all(
                (data.images || []).slice(0, 5).map(async (imgUrl: string) => {
                    if (imgUrl.startsWith('data:')) {
                        return await serviceService.uploadServiceImage(dataUrlToFile(imgUrl, 'image.jpg'));
                    } else if (imgUrl.startsWith('http')) {
                        return imgUrl;
                    }
                    return null;
                })
            )).filter(Boolean) as string[];

            const payload: ServiceApiPayload = {
                title: data.title,
                description: data.description,
                price: parseFloat(data.price),
                priceUnit: data.priceUnit || 'za usługę',
                category: data.category,
                type: data.type,
                city: data.isRemote ? '' : (data.city || ''),
                radius: data.isRemote ? 0 : (data.radius ?? 20),
                isRemote: !!data.isRemote,
                deliveryTime: data.deliveryTime || undefined,
                durationMinutes: data.durationMinutes ?? undefined,
                images: imageUrls,
                videos: data.videos ?? [],
                address: data.address || undefined,
                addressLat: data.addressLat ?? undefined,
                addressLng: data.addressLng ?? undefined,
            };

            if (payload.address && !payload.addressLat) {
                try {
                    const geoRes = await apiClient.get(`/public/address?query=${encodeURIComponent(payload.address)}`);
                    const geoJson = await geoRes.json();
                    if (geoJson.data?.[0]) {
                        payload.addressLat = geoJson.data[0].lat;
                        payload.addressLng = geoJson.data[0].lng;
                    }
                } catch { /* geo lookup failed — proceed without coords */ }
            }

            if (data.publicId) {
                await serviceService.updateService(data.publicId, payload);
                addToast("Ogłoszenie zaktualizowane!");
            } else {
                await serviceService.createService(payload);
                addToast("Opublikowano!", "success");
            }

            const uid = userProfile?.uid || freshUser?.uid;
            await Promise.all([
                refetchMyServices(),
                queryClient.invalidateQueries({ queryKey: ['services'] }),
                queryClient.invalidateQueries({ queryKey: ['public-profile', uid] }),
                queryClient.invalidateQueries({ queryKey: ['my-profile'] }),
                queryClient.invalidateQueries({ queryKey: ['recommended'] }),
                ...(data.publicId ? [queryClient.invalidateQueries({ queryKey: ['service'] })] : []),
            ]);
            setActiveModal('none');
        } catch (err: unknown) {
            addToast((err as Error).message || "Błąd zapisu ogłoszenia", "error");
        }
    }, [addToast, queryClient, refetchMyServices, freshUser, userProfile]);

    // --- CHAT: otwórz / stwórz sesję ---
    const startChat = useCallback(async (s: Service, msg: string = '') => {
        if (!isLoggedIn) { router.push('/auth'); return; }
        setInitialChatText(msg);
        setCurrentChatServiceId(s.publicId ?? null);

        const providerUid = s.provider?.uid;
        const existing = (chatSessions as ApiChatSession[]).find((c: ApiChatSession) =>
            providerUid ? c.otherPartyUid === providerUid : c.servicePublicId === s.publicId
        );

        if (Capacitor.isNativePlatform()) {
            await NativeNav.push({ fullScreen: true }).catch(() => {});
            if (existing) {
                router.push(`/chat/${existing.id}`);
            } else {
                router.push(`/chat/new?serviceId=${s.publicId}`);
            }
            return;
        }

        if (existing) {
            setCurrentChatId(existing.id);
        } else {
            setCurrentChatId(null);
        }
        setActiveModal('chat_detail');
    }, [isLoggedIn, router, chatSessions, setActiveModal]);

    // --- BOOKING ---
    const handleBookingSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsBookingLoading(true);
        const formData = new FormData(e.target as HTMLFormElement);
        const service = selectedService;
        if (!service) { setIsBookingLoading(false); return; }

        try {
            const payload: BookingPayload = { type: service.type, servicePublicId: service.publicId ?? '' };
            if (service.type === 'offer') {
                payload.date = formData.get('date') as string;
                payload.time = formData.get('time') as string;
                payload.address = formData.get('address') as string || undefined;
                payload.notes = formData.get('notes') as string || undefined;
                const lat = formData.get('addressLat');
                const lng = formData.get('addressLng');
                if (lat && lng) {
                    payload.addressLat = parseFloat(lat as string);
                    payload.addressLng = parseFloat(lng as string);
                } else if (payload.address) {
                    // Użytkownik nie kliknął podpowiedzi — geocoduj przed wysłaniem
                    try {
                        const geoRes = await apiClient.get(`/public/address?query=${encodeURIComponent(payload.address)}`);
                        const geoJson = await geoRes.json();
                        if (geoJson.data?.[0]) {
                            payload.addressLat = geoJson.data[0].lat;
                            payload.addressLng = geoJson.data[0].lng;
                        }
                    } catch { /* geo lookup failed — proceed without coords */ }
                }
            } else {
                payload.message = formData.get('message') as string;
                const pp = formData.get('proposed_price');
                if (pp) payload.proposedPrice = parseFloat(pp as string);
                payload.availableFrom = formData.get('available_from') as string || undefined;
            }

            const res = await apiClient.post('/bookings', payload as unknown as Record<string, unknown>);
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Błąd rezerwacji');

            addToast(service.type === 'request' ? 'Oferta wysłana!' : 'Prośba wysłana!', 'success');

            // Backend creates chat session + booking message — open chat immediately
            if (json.chatId) {
                const chatId = String(json.chatId);
                setCurrentChatId(chatId);
                setCurrentChatServiceId(service.publicId ?? null);
                refetchChats();
                // openChat w state routera — ServiceDetailsWrapper wykryje po montowaniu
                // i otworzy modal dopiero gdy komponent jest w DOM. Brak setTimeout.
                if (typeof window !== 'undefined') sessionStorage.setItem('__openChat__', chatId);
                router.back();
            } else {
                router.back();
            }
        } catch (err: unknown) {
            addToast((err as Error).message || 'Błąd rezerwacji', 'error');
        } finally {
            setIsBookingLoading(false);
        }
    }, [selectedService, addToast, router, refetchChats, setCurrentChatId, setCurrentChatServiceId]);

    const handleBookingAction = useCallback(async (
        chatId: string | null,
        bookingId: number | string,
        action: 'accept' | 'decline' | 'cancel' | 'complete'
    ) => {
        try {
            let res: Response;
            if (action === 'complete') {
                res = await apiClient.post(`/bookings/${bookingId}/complete`, {});
            } else {
                const statusMap = { accept: 'accepted', decline: 'declined', cancel: 'cancelled' } as const;
                res = await apiClient.patch(`/bookings/${bookingId}`, { status: statusMap[action as keyof typeof statusMap] });
            }
            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error((errJson as { message?: string }).message || `Błąd (${res.status})`);
            }
            const newStatus = action === 'complete' ? 'completed'
                : action === 'accept' ? 'accepted'
                : action === 'decline' ? 'declined'
                : 'cancelled';
            // Optimistic update — natychmiastowa zmiana statusu w karcie bez czekania na refetch
            if (chatId) {
                queryClient.setQueryData<ApiMessage[]>(['chat-messages', chatId], (old) => {
                    if (!old || !Array.isArray(old)) return old;
                    return old.map((msg: ApiMessage) =>
                        msg.bookingData?.id !== null && msg.bookingData?.id !== undefined && String(msg.bookingData.id) === String(bookingId)
                            ? { ...msg, bookingData: { ...msg.bookingData, status: newStatus } }
                            : msg
                    );
                });
            }
            queryClient.invalidateQueries({ queryKey: ['chats'] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
            const labels = { accept: 'Zaakceptowano!', decline: 'Odrzucono.', cancel: 'Anulowano.', complete: 'Zakończono!' };
            addToast(labels[action], action === 'accept' || action === 'complete' ? 'success' : 'info');
        } catch (err: unknown) {
            addToast((err as Error).message || 'Błąd', 'error');
        }
    }, [addToast, queryClient]);

    // =================== STATE + ACTIONS ===================

    const state = {
        isLoggedIn, userProfile, freshUser, unreadNotifications, hasUnreadMessages, notificationList,
        showNotifications, location, favorites: Array.from(effectiveFavoriteIds), chatSessions, selectedService,
        isBookingLoading, servicesLoading, toasts, activeModal, currentChatId, currentChatServiceId,
        initialChatText, editingServiceId, editingServiceFull, allServices, reportData, supportContext, activeSupportTicketId, isLoadingApp, isNavLoading,
        myDashboardServices: myServices,
        favServices,
        homeProps: {
            services: filteredServices, activeCategory, searchQuery, searchDisplay, location,
            filterType, sortBy, loadedCount, favorites: Array.from(effectiveFavoriteIds),
            isLoggedIn, showOnlineOnly,
        },
        isFullScreen: ['/auth', '/login', '/register', '/booking-form', '/verify-email']
            .some(p => pathname.startsWith(p)),
    };

    const actions = {
        addToast,
        handleLogout,
        removeToast: (id: number) => setToasts(prev => prev.filter(t => t.id !== id)),
        onServiceClick: async (s: Service) => {
            setSelectedService(s);
            if (!Capacitor.isNativePlatform()) setIsNavLoading(true);
            if (Capacitor.isNativePlatform()) {
                sessionStorage.setItem('nav_scroll_' + window.location.pathname, String(window.scrollY));
                await NativeNav.push().catch(() => {});
                router.push(`/service/${createServiceUrl(s.title, s.publicId ?? '')}`);
            } else {
                router.push(`/service/${createServiceUrl(s.title, s.publicId ?? '')}`);
            }
        },
        toggleFavorite: (publicId: string) => {
            if (!isLoggedIn) { router.push('/auth'); return; }
            toggleFavoriteMutation.mutate({ publicId, remove: effectiveFavoriteIds.has(publicId) });
        },
        handleLoginSuccess: (u: UserProfile | null) => {
            setIsLoggedIn(true);
            setUserProfile(u);
            router.push('/');
            addToast("Zalogowano pomyślnie");
        },
        handleNotificationClick: () => setShowNotifications(!showNotifications),
        handleNotificationItemClick: async (id: number, cId?: string, type?: string, bookingId?: string | null, bookingTab?: string | null, servicePublicId?: string | null) => {
            await notificationService.markAsRead(id);
            queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
            setShowNotifications(false);
            if (type === 'booking') {
                navPush(router, '/dashboard', { openTab: 'orders', bookingTab: bookingTab ?? 'incoming' });
                return;
            }
            if (type === 'review' && servicePublicId) { navPush(router, '/dashboard', { openDetail: 'reviews' }); return; }
            if (type === 'review' && bookingId) { if (Capacitor.isNativePlatform()) await NativeNav.push().catch(() => {}); router.push(`/review/${bookingId}`); return; }
            if (type === 'review') { navPush(router, '/dashboard', { openTab: 'orders', bookingTab: 'outgoing' }); return; }
            if (cId) {
                if (Capacitor.isNativePlatform()) {
                    await NativeNav.push({ fullScreen: true }).catch(() => {});
                    router.push(`/chat/${cId}`);
                } else { setCurrentChatId(cId); setActiveModal('chat_detail'); }
                return;
            }
        },
        onMarkAllRead: async () => {
            queryClient.setQueryData(['notifications-list'], (old: unknown) => {
                if (!Array.isArray(old)) return old;
                return old.map((n: { read: boolean }) => ({ ...n, read: true }));
            });
            queryClient.setQueryData(['notification-counts'], (old: unknown) => {
                if (!old || typeof old !== 'object') return old;
                return { ...(old as object), unreadNotifications: 0 };
            });
            notificationService.markAllAsRead().then(() => {
                queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
                queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
            });
        },
        getCurrentViewName: () => {
            if (pathname === '/') return 'home';
            return pathname.substring(1).split('/')[0];
        },
        changeView: (v: string) => {
            setActiveModal('none');
            router.push(v === 'profile' ? (isLoggedIn ? '/dashboard' : '/auth') : `/${v === 'home' ? '' : v}`);
        },
        openAddServiceModal: () => {
            if (!isLoggedIn) { router.push('/auth'); return; }
            if (activeModal === 'add_service') { setActiveModal('none'); return; }
            setEditingServiceId(null);
            setActiveModal('add_service');
        },
        openEditServiceModal: (s: Service) => {
            setEditingServiceId(s.publicId ?? null);
            setEditingServiceFull(s);
            setActiveModal('add_service');
        },
        deleteService: (publicId: string) => {
            deleteServiceMutation.mutate(publicId);
            addToast("Usunięto ogłoszenie");
        },
        handleUpgradeToPremium: async () => {
            // Endpoint /users/me/premium jest teraz wyłącznie dla adminów/webhooków.
            // Premium jest aktywowane przez backend po potwierdzeniu płatności.
            addToast('Przekierowanie do płatności wkrótce dostępne.', 'info');
        },
        startChat,
        openReportModal: (type: ReportType, id: number | string) => {
            setReportData({ type, id });
            setActiveModal('report');
        },
        openSupportModal: (context?: { bookingId?: number; category?: string }) => {
            setSupportContext(context ?? null);
            setActiveModal('support');
        },
        openSupportTicket: (id: string) => setActiveSupportTicketId(id),
        closeSupportTicket: () => setActiveSupportTicketId(null),
        handleBookingSubmit,
        handleBookingAction,
        handleCreateBookingForClient: async (sessionId: string, date: string, time: string | undefined, servicePublicId: string, recurrence?: { interval: 'weekly' | 'biweekly' | 'monthly'; count: number }) => {
            const res = await apiClient.post('/bookings/for-client', { sessionId, servicePublicId, date, time, recurrence });
            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error((errJson as { message?: string }).message || 'Błąd tworzenia rezerwacji');
            }
            queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
            queryClient.invalidateQueries({ queryKey: ['chats'] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            addToast(recurrence ? `Dodano ${recurrence.count} rezerwacji!` : 'Rezerwacja dodana!', 'success');
        },
        handleBookingReschedule: async (_chatId: string | null, bookingId: number | string, newDate: string, newTime?: string) => {
            try {
                const res = await apiClient.patch(`/bookings/${bookingId}/reschedule`, { date: newDate, time: newTime });
                if (!res.ok) throw new Error('Błąd zmiany terminu');
                const json = await res.json() as { chatId?: string };
                queryClient.invalidateQueries({ queryKey: ['bookings'] });
                queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
                addToast('Termin zmieniony!', 'success');
                if (json.chatId) {
                    setCurrentChatId(json.chatId);
                    setActiveModal('chat_detail');
                }
            } catch (err: unknown) {
                addToast((err as Error).message || 'Błąd zmiany terminu', 'error');
            }
        },
        homeActions: {
            setActiveCategory, setSearchQuery, setSearchDisplay, setLocation, setFilterType,
            setSortBy, setLoadedCount, setShowOnlineOnly,
            setLocationCoords: setPickedCoords,
            onToggleFavorite: (publicId: string) => {
                if (!isLoggedIn) { router.push('/auth'); return; }
                toggleFavoriteMutation.mutate({ publicId, remove: effectiveFavoriteIds.has(publicId) });
            },
        },
        usePublicProfileHook: usePublicProfile,
        handleServiceSubmit,
        handleSendMessage: async (text: string | null, imageUrl: string | null) => {
            if (!text?.trim() && !imageUrl) return;
            let sessionId = currentChatId;
            if (!sessionId) {
                if (!currentChatServiceId) return;
                try {
                    const session = await chatService.startChat(currentChatServiceId);
                    setCurrentChatId(session.id);
                    sessionId = session.id;
                    await refetchChats();
                } catch (err: unknown) {
                    addToast((err as Error).message || 'Błąd tworzenia czatu', 'error');
                    return;
                }
            }
            try {
                await chatService.sendMessage(sessionId, text || undefined, imageUrl || undefined);
                queryClient.invalidateQueries({ queryKey: ['chats'] });
                queryClient.invalidateQueries({ queryKey: ['chat-messages', sessionId] });
            } catch {
                addToast('Błąd wysyłania wiadomości', 'error');
            }
        },
        setSelectedService,
        setShowNotifications,
        setCurrentChatId,
        setActiveModal,
        setNavLoading: setIsNavLoading,
        handleAvatarUpdate: async (url: string) => {
            setUserProfile(prev => prev ? { ...prev, avatar: url } : prev);
        },
    };

    return { state, actions };
};
