'use client';
import React, { useCallback, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserX, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../../../plugins/NativeNav';
import { IS_SAFARI_WEB, createSafariOverlay, revealAfterUnmount } from '../../../utils/safariNavOverlay';
import { apiClient } from '../../../services/apiClient';
import { setPageMeta, resetPageMeta } from '../../../utils/pageMeta';
import { useNativeSwipeBack } from '../../../hooks/useNativeNav';
import { LoadingScreen } from '../../../components/ui/LoadingScreen';
import { useApp } from '../../../providers/AppProvider';
import { usePublicProfile } from '../../../hooks/usePublicProfile';
import PublicProfileView from '../../../views/PublicProfileView';

const slideIn = { initial: { x: 20, opacity: 0 }, animate: { x: 0, opacity: 1 } } as const;
const slideTransition = { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] as const };

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

function useDelayedLoading(isLoading: boolean) {
    const [show, setShow] = React.useState(false);
    React.useEffect(() => {
        if (!isLoading) { setShow(false); return; }
        const t = setTimeout(() => setShow(true), 150);
        return () => clearTimeout(t);
    }, [isLoading]);
    return show;
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

type DocumentWithVT = { startViewTransition?: (fn: () => void | Promise<void>) => { finished: Promise<void> } };

export default function PublicProfileClient() {
    const params = useParams();
    const uid = params?.uid as string | undefined;
    const router = useRouter();
    const { state, actions } = useApp();

    const doNav = useCallback(() => {
        const hasHistory = (window.history.state?.idx ?? 0) > 0;
        if (hasHistory) router.back(); else router.push('/');
    }, [router]);

    const fromFullScreenRef = useRef(false);
    useEffect(() => {
        const flag = sessionStorage.getItem('__fromFullScreen__');
        if (flag) { fromFullScreenRef.current = true; sessionStorage.removeItem('__fromFullScreen__'); }
    }, []);

    const handleBack = useCallback(async () => {
        if (Capacitor.isNativePlatform()) {
            await (fromFullScreenRef.current ? NativeNav.pop({ fullScreen: true }) : NativeNav.pop()).catch(() => {});
            doNav();
        } else {
            const doc = document as unknown as DocumentWithVT;
            if (!IS_SAFARI_WEB && typeof doc.startViewTransition === 'function') {
                document.documentElement.classList.add('vt-running', 'vt-inapp');
                const vt = doc.startViewTransition(() => { doNav(); return new Promise<void>(resolve => setTimeout(resolve, 20)); });
                vt.finished.finally(() => document.documentElement.classList.remove('vt-running', 'vt-inapp'));
            } else {
                document.documentElement.classList.add('vt-running');
                const overlay = createSafariOverlay();
                const sdvRoot = document.querySelector('[data-sdv-root]');
                doNav();
                revealAfterUnmount(overlay, sdvRoot, true);
            }
        }
    }, [doNav]);

    useNativeSwipeBack(doNav);

    const { profile, isOnline, activityStatus, isLoading, isError } = usePublicProfile(uid);

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

    const profileReady = !!profile && !isLoading;

    const hasRestoredScroll = useRef(false);
    useEffect(() => {
        if (!profileReady || hasRestoredScroll.current) return;
        hasRestoredScroll.current = true;
        const saved = sessionStorage.getItem('nav_scroll_' + window.location.pathname);
        if (!saved) return;
        const y = parseInt(saved, 10);
        sessionStorage.removeItem('nav_scroll_' + window.location.pathname);
        let r2 = 0;
        const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => window.scrollTo(0, y)); });
        return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }, [profileReady]);

    useEffect(() => {
        if (!profileReady) return;
        window.dispatchEvent(new CustomEvent('ppv:ready'));
    }, [profileReady]);

    useEffect(() => {
        if (!profileReady || !Capacitor.isNativePlatform()) return;
        let r2 = 0;
        const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => NativeNav.signalReady().catch(() => {})); });
        return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }, [profileReady]);

    const showLoading = useDelayedLoading(isLoading);
    if (showLoading || isError) return <LoadingScreen isVisible={true} />;
    if ((profile as { deleted?: boolean })?.deleted) return <DeletedAccountView onBack={doNav} />;
    if (!profile) return isLoading ? null : <NotFoundView />;

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

    const isNative = Capacitor.isNativePlatform();

    return (
        <>
            <span data-sdv-root style={{ display: 'none' }} />
            {isNative
                ? <div>{ppvEl}</div>
                : <motion.div {...slideIn} transition={slideTransition}>{ppvEl}</motion.div>}
        </>
    );
}
