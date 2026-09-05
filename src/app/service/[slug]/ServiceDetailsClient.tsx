'use client';
import React, { useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trash2, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../../../plugins/NativeNav';
import { apiClient } from '../../../services/apiClient';
import { mapApiService } from '../../../services/serviceService';
import { createSlug } from '../../../utils/helpers';
import { useNativeSwipeBack } from '../../../hooks/useNativeNav';
import { setPageMeta, resetPageMeta } from '../../../utils/pageMeta';
import { useApp } from '../../../providers/AppProvider';
import { setNavDirection } from '../../../utils/navDirection';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import ServiceDetailsView from '../../../views/ServiceDetailsView';
import type { Service } from '../../../types';

const serviceScrollPositions = new Map<string, number>();

function DeletedServiceView({ onBack }: { onBack: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 size={28} className="text-slate-400" />
            </div>
            <h2 className="text-lg font-black text-slate-800 mb-2">Ogłoszenie niedostępne</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-xs">
                To ogłoszenie zostało usunięte przez właściciela lub administratora platformy.
            </p>
            <button onClick={onBack} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-sm font-bold active:scale-95 transition-transform">
                <ArrowLeft size={14} /> Wróć
            </button>
        </div>
    );
}

function NotFoundView() {
    const router = useRouter();
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center">
            <h2 className="text-lg font-black text-slate-800 mb-2">Strona nie znaleziona</h2>
            <button onClick={() => router.push('/')} className="mt-4 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-sm font-bold">
                Strona główna
            </button>
        </div>
    );
}

export default function ServiceDetailsClient() {
    const params = useParams();
    const id = params?.slug as string | undefined;
    const router = useRouter();
    const { state, actions } = useApp();

    const publicId = id ? id.split('-').pop()! : '';

    const doNav = useCallback(() => {
        router.back();
    }, [router]);

    useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, []);

    const fromFullScreenRef = useRef(false);
    useEffect(() => {
        const flag = sessionStorage.getItem('__fromFullScreen__');
        if (flag) { fromFullScreenRef.current = true; sessionStorage.removeItem('__fromFullScreen__'); }
    }, []);

    const handleBack = useCallback(async () => {
        if (Capacitor.isNativePlatform()) {
            await (fromFullScreenRef.current ? NativeNav.pop({ fullScreen: true }) : NativeNav.pop()).catch(() => {});
        }
        setNavDirection('pop');
        doNav();
    }, [doNav]);

    useNativeSwipeBack(doNav);

    const { data: service, isPending, isError } = useQuery({
        queryKey: ['service', publicId],
        queryFn: async () => {
            const res = await apiClient.get(`/services/${publicId}`);
            if (res.status === 404) return null;
            if (res.status === 410) return { __deleted: true } as unknown as Service;
            if (!res.ok) throw new Error(`server_${res.status}`);
            const json = await res.json();
            try { return mapApiService(json.data ?? json); } catch { throw new Error('parse_error'); }
        },
        enabled: !!publicId,
        staleTime: 1000 * 60,
        retry: false,
    });

    useEffect(() => {
        if (!service || (service as Service & { __deleted?: boolean }).__deleted) return;
        const cityPart = service.city ? ` w ${service.city}` : '';
        const rawDesc = typeof service.description === 'string' ? service.description : '';
        const desc = rawDesc.length > 15 ? `${rawDesc.slice(0, 148).trimEnd()}…` : `${service.title}${cityPart} – sprawdź opinie i zarezerwuj usługę online na MyLokalni.pl.`;
        setPageMeta({ title: `${service.title}${cityPart} | MyLokalni.pl`, description: desc, url: `https://mylokalni.pl/service/${service.publicId}`, image: service.image || service.images?.[0] });
        return () => resetPageMeta();
    }, [service?.publicId]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (isError) {
            actions.addToast('Nie udało się załadować ogłoszenia. Spróbuj ponownie.', 'error');
            doNav();
        }
    }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        const openChatId = sessionStorage.getItem('__openChat__');
        if (!openChatId) return;
        sessionStorage.removeItem('__openChat__');
        if (Capacitor.isNativePlatform()) {
            (async () => {
                await NativeNav.push({ fullScreen: true }).catch(() => {});
                router.push(`/chat/${openChatId}`);
            })();
        } else {
            actions.setActiveModal('chat_detail');
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Signal native that content is ready (once per service)
    const signalSentRef = useRef(false);
    useEffect(() => {
        if (!service || !Capacitor.isNativePlatform() || signalSentRef.current) return;
        signalSentRef.current = true;
        let r2 = 0;
        const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => NativeNav.signalReady().catch(() => {})); });
        return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }, [service]);

    // Restore scroll position on native after back-navigation
    useEffect(() => {
        if (!service || !Capacitor.isNativePlatform()) return;
        const saved = serviceScrollPositions.get(publicId);
        if (saved !== undefined) { serviceScrollPositions.delete(publicId); window.scrollTo(0, saved); }
    }, [service, publicId]);

    const handleOpenService = useCallback((svc: Service) => {
        if (Capacitor.isNativePlatform()) serviceScrollPositions.set(publicId, window.scrollY);
        return actions.onServiceClick(svc);
    }, [publicId, actions]);

    const handleOpenProfile = useCallback(async () => {
        if (!service) return;
        const url = `/profile/${service.provider.uid || createSlug(service.provider.name)}`;
        if (Capacitor.isNativePlatform()) {
            serviceScrollPositions.set(publicId, window.scrollY);
            await NativeNav.push().catch(() => {});
        }
        router.push(url);
    }, [publicId, service, router]);

    const handleStartChat = useCallback((svc: Parameters<typeof actions.startChat>[0]) => {
        if (Capacitor.isNativePlatform()) serviceScrollPositions.set(publicId, window.scrollY);
        return actions.startChat(svc);
    }, [publicId, actions]);

    if (isError && !service) return null;
    if ((service as Service & { __deleted?: boolean })?.__deleted) return <DeletedServiceView onBack={doNav} />;
    if (!isPending && service === null) return <NotFoundView />;
    if (isPending || state.isLoadingApp || !service) return <LoadingScreen isVisible={true} />;

    const isNative = Capacitor.isNativePlatform();
    const sdvEl = (
        <ServiceDetailsView
            service={service}
            isFavorite={state.favorites.includes(service.publicId ?? '') || (state.isLoggedIn && !!service.isFavorite)}
            onBack={handleBack}
            onToggleFavorite={actions.toggleFavorite}
            onOpenProfile={handleOpenProfile}
            onOpenService={handleOpenService}
            onStartChat={handleStartChat}
            onEdit={actions.openEditServiceModal}
            onBook={async () => {
                if (isNative) {
                    serviceScrollPositions.set(publicId, window.scrollY);
                    await NativeNav.push().catch(() => {});
                }
                router.push('/booking-form');
            }}
            isLoggedIn={state.isLoggedIn}
            onLoginRedirect={() => router.push('/auth')}
            userLocation={state.location}
            currentUserUid={(state.freshUser || state.userProfile)?.uid ?? null}
            onReport={() => actions.openReportModal('service', service.publicId ?? '')}
            onReportReview={(rId) => actions.openReportModal('review', rId)}
            onOpenSupport={async () => {
                if (state.isLoggedIn) {
                    if (isNative) {
                        serviceScrollPositions.set(publicId, window.scrollY);
                        await NativeNav.push({ fullScreen: true }).catch(() => {});
                        router.push('/support');
                    } else {
                        actions.openSupportModal();
                    }
                } else {
                    router.push('/auth');
                }
            }}
            addToast={actions.addToast}
            isChatOpen={state.activeModal !== 'none'}
            isReportOpen={state.activeModal === 'report'}
            isSupportOpen={state.activeModal === 'support'}
            showNotificationsOpen={state.showNotifications}
        />
    );

    return (
        <>
            <span data-sdv-root style={{ display: 'none' }} />
            {isNative ? <div>{sdvEl}</div> : sdvEl}
        </>
    );
}
