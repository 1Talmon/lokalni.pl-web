'use client';
import { useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserX, ArrowLeft } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../../../plugins/NativeNav';
import { setPageMeta, resetPageMeta } from '../../../utils/pageMeta';
import { useNativeSwipeBack } from '../../../hooks/useNativeNav';
import { useApp } from '../../../providers/AppProvider';
import { setNavDirection } from '../../../utils/navDirection';
import { usePublicProfile } from '../../../hooks/usePublicProfile';
import PublicProfileView from '../../../views/PublicProfileView';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../services/apiClient';

function DeletedAccountView({ onBack }: { onBack: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                <UserX size={28} className="text-slate-400" />
            </div>
            <h2 className="text-lg font-black text-slate-800 mb-2">Konto niedostępne</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-6 max-w-xs">
                To konto zostało usunięte lub dezaktywowane przez użytkownika.
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
            <h2 className="text-lg font-black text-slate-800 mb-2">Profil nie znaleziony</h2>
            <button onClick={() => router.push('/')} className="mt-4 px-5 py-2.5 rounded-2xl bg-indigo-600 text-white text-sm font-bold">
                Strona główna
            </button>
        </div>
    );
}

export default function PublicProfileClient() {
    const params = useParams();
    const uid = params?.uid as string | undefined;
    const router = useRouter();
    const { state, actions } = useApp();

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
        actions.setNavLoading(false);
        if (Capacitor.isNativePlatform()) {
            await (fromFullScreenRef.current ? NativeNav.pop({ fullScreen: true }) : NativeNav.pop()).catch(() => {});
        }
        setNavDirection('pop');
        doNav();
    }, [doNav, actions]);

    useNativeSwipeBack(doNav);

    const { profile, isOnline, activityStatus, isLoading, isError } = usePublicProfile(uid);

    // Show AppShell-level nav loading overlay — only when there's no cached data
    useEffect(() => {
        if (isLoading) actions.setNavLoading(true);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!isLoading && !state.isLoadingApp) {
            actions.setNavLoading(false);
        }
    }, [isLoading, state.isLoadingApp]); // eslint-disable-line react-hooks/exhaustive-deps

    const { data: servicesData } = useQuery({
        queryKey: ['provider-services', uid],
        queryFn: async () => {
            const res = await apiClient(`/users/${uid}/services?limit=50`);
            if (!res.ok) return [];
            const json = await res.json();
            return json.data ?? [];
        },
        enabled: !!uid,
        staleTime: 1000 * 60 * 2,
    });

    useEffect(() => {
        if (!profile) return;
        const p = profile as { name?: string; bio?: string; profilowe?: string; avatar?: string };
        const name = p.name ?? 'Specjalista';
        const bio = p.bio ? `${p.bio.slice(0, 148).trimEnd()}…` : `Sprawdź profil ${name} na MyLokalni.pl – opinie klientów, dostępne usługi i możliwość bezpośredniego kontaktu.`;
        setPageMeta({ title: `${name} – specjalista | MyLokalni.pl`, description: bio, url: `https://mylokalni.pl/profile/${uid}`, image: p.profilowe || p.avatar });
        return resetPageMeta;
    }, [profile, uid]);

    useEffect(() => {
        if (isError) {
            actions.addToast('Nie udało się załadować profilu. Spróbuj ponownie.', 'error');
            doNav();
        }
    }, [isError]); // eslint-disable-line react-hooks/exhaustive-deps

    // Signal native that content is ready (once)
    const signalSentRef = useRef(false);
    useEffect(() => {
        if (!profile || !Capacitor.isNativePlatform() || signalSentRef.current) return;
        signalSentRef.current = true;
        let r2 = 0;
        const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => NativeNav.signalReady().catch(() => {})); });
        return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }, [profile]);

    // Restore scroll position on web (saved before navigating away from profile)
    const hasRestoredScroll = useRef(false);
    useEffect(() => {
        if (!profile || hasRestoredScroll.current) return;
        hasRestoredScroll.current = true;
        const saved = sessionStorage.getItem('nav_scroll_' + window.location.pathname);
        if (!saved) return;
        const y = parseInt(saved, 10);
        sessionStorage.removeItem('nav_scroll_' + window.location.pathname);
        let r2 = 0;
        const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => window.scrollTo(0, y)); });
        return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }, [profile]);

    if (isLoading) return null;
    if (isError) return null;
    if ((profile as { deleted?: boolean })?.deleted) return <DeletedAccountView onBack={doNav} />;
    if (!profile) return <NotFoundView />;

    const isNative = Capacitor.isNativePlatform();

    const ppvEl = (
        <PublicProfileView
            provider={profile as never}
            onBack={handleBack}
            providerServices={servicesData ?? []}
            onServiceClick={actions.onServiceClick}
            onStartChat={actions.startChat}
            activityStatus={activityStatus}
            isOnline={isOnline}
            isLoggedIn={state.isLoggedIn}
            isOwner={uid === (state.freshUser || state.userProfile)?.uid}
            currentUserUid={(state.freshUser || state.userProfile)?.uid ?? null}
            isChatOpen={state.activeModal !== 'none'}
            showNotificationsOpen={state.showNotifications}
            actions={actions}
        />
    );

    return (
        <>
            <span data-sdv-root style={{ display: 'none' }} />
            {isNative ? <div>{ppvEl}</div> : ppvEl}
        </>
    );
}
