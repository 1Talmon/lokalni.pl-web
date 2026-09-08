'use client';
import React, { useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Trash2, ArrowLeft } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../services/apiClient';
import { mapApiService } from '../../../services/serviceService';
import { createSlug } from '../../../utils/helpers';
import { setPageMeta, resetPageMeta } from '../../../utils/pageMeta';
import { useApp } from '../../../providers/AppProvider';
import { setNavDirection } from '../../../utils/navDirection';
import ServiceDetailsView from '../../../views/ServiceDetailsView';
import type { Service } from '../../../types';

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
    const queryClient = useQueryClient();
    const { state, actions } = useApp();

    const publicId = id ? id.split('-').pop()! : '';

    const doNav = useCallback(() => {
        if (window.history.length <= 1) {
            router.replace('/');
        } else {
            router.back();
        }
    }, [router]);

    useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }); }, []);

    const handleBack = useCallback(() => {
        actions.setNavLoading(false);
        setNavDirection('pop');
        doNav();
    }, [doNav, actions]);

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
        staleTime: 10 * 60 * 1000,
        retry: false,
    });

    // Show AppShell-level nav loading overlay — only when there's no cached data
    useEffect(() => {
        if (isPending) actions.setNavLoading(true);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!isPending && (service !== undefined || isError) && !state.isLoadingApp) {
            actions.setNavLoading(false);
        }
    }, [isPending, service, isError, state.isLoadingApp]); // eslint-disable-line react-hooks/exhaustive-deps

    // Hide SSR static shell once the interactive component has data and will render.
    useEffect(() => {
        if (!isPending && service && !state.isLoadingApp) {
            const shell = document.querySelector('[data-ssr-shell]');
            if (shell instanceof HTMLElement) shell.style.display = 'none';
        }
    }, [isPending, service, state.isLoadingApp]);

    useEffect(() => {
        if (!service || (service as Service & { __deleted?: boolean }).__deleted) return;
        const rawDesc = typeof service.description === 'string' ? service.description : '';
        const cityFallback = service.city ? ` w ${service.city}` : '';
        const desc = rawDesc.length > 15 ? `${rawDesc.slice(0, 148).trimEnd()}…` : `${service.title}${cityFallback} – sprawdź opinie i zarezerwuj usługę online na MyLokalni.pl.`;
        setPageMeta({ title: `${service.title} | MyLokalni.pl`, description: desc, url: `https://mylokalni.pl/service/${service.publicId}`, image: service.image || service.images?.[0] });
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
        actions.setActiveModal('chat_detail');
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Restore scroll position (saved before navigating away from service)
    const hasRestoredScroll = useRef(false);
    useEffect(() => {
        if (!service || hasRestoredScroll.current) return;
        hasRestoredScroll.current = true;
        const saved = sessionStorage.getItem('nav_scroll_' + window.location.pathname);
        if (!saved) return;
        const y = parseInt(saved, 10);
        sessionStorage.removeItem('nav_scroll_' + window.location.pathname);
        let r2 = 0;
        const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => window.scrollTo(0, y)); });
        return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }, [service]);

    const handleOpenService = useCallback((svc: Service) => {
        return actions.onServiceClick(svc);
    }, [actions]);

    const handleOpenProfile = useCallback(async () => {
        if (!service) return;
        const uid = service.provider.uid || createSlug(service.provider.name);
        const url = `/profile/${uid}`;
        const cached = queryClient.getQueryData(['public-profile', uid]);
        if (!cached) actions.setNavLoading(true);
        router.push(url);
    }, [service, router, actions, queryClient]);

    const handleStartChat = useCallback((svc: Parameters<typeof actions.startChat>[0]) => {
        return actions.startChat(svc);
    }, [actions]);

    if (isError && !service) return null;
    if ((service as Service & { __deleted?: boolean })?.__deleted) return <DeletedServiceView onBack={doNav} />;
    if (!isPending && service === null) return <NotFoundView />;
    if (isPending || state.isLoadingApp || !service) return null;

    return (
        <>
            <span data-sdv-root style={{ display: 'none' }} />
            <ServiceDetailsView
                service={service}
                isFavorite={state.favorites.includes(service.publicId ?? '') || (state.isLoggedIn && !!service.isFavorite)}
                onBack={handleBack}
                onToggleFavorite={actions.toggleFavorite}
                onOpenProfile={handleOpenProfile}
                onOpenService={handleOpenService}
                onStartChat={handleStartChat}
                onEdit={actions.openEditServiceModal}
                onBook={() => router.push('/booking-form')}
                isLoggedIn={state.isLoggedIn}
                onLoginRedirect={() => router.push('/auth')}
                userLocation={state.location}
                currentUserUid={(state.freshUser || state.userProfile)?.uid ?? null}
                onReport={() => actions.openReportModal('service', service.publicId ?? '')}
                onReportReview={(rId) => actions.openReportModal('review', rId)}
                onOpenSupport={() => {
                    if (state.isLoggedIn) {
                        actions.openSupportModal();
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
        </>
    );
}
