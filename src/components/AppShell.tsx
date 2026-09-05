'use client';
import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { CATEGORIES_DATA } from '../data/categories';
import { SWIPE_TABS } from '../hooks/useTabSwipe';
import { useApp } from '../providers/AppProvider';
import { useBiometricLock } from '../hooks/useBiometricLock';
import { ToastContainer } from './ui/ToastContainer';
import { LoadingScreen } from './ui/LoadingScreen';
import CookieBanner from './ui/CookieBanner';
import { MainLayout } from './layout/MainLayout';
import { ModalsManager } from './modals/ModalsManager';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { TourOverlay } from './tour/TourOverlay';
import { AppLock } from './AppLock';
import { logger } from '../utils/logger';
import HomeView from '../views/HomeView';
import { ChatListView } from '../views/ChatListView';
import GrafikView from '../views/GrafikView';
import { FavoritesListView } from '../views/FavoritesListView';

const isAndroid = Capacitor.getPlatform() === 'android';
const SWIPE_TAB_SET = new Set(SWIPE_TABS);

interface AppShellProps {
    children: React.ReactNode;
}

function AppShellContent({ children }: AppShellProps) {
    const { state, actions } = useApp();
    const { locked, verify, verifying, forceUnlock } = useBiometricLock();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [showTour, setShowTour] = useState(false);
    const wasLockedRef = useRef(locked);
    const pendingWidgetUrl = useRef<string | null>(null);
    const isLoadingRef = useRef(state.isLoadingApp);
    useEffect(() => { isLoadingRef.current = state.isLoadingApp; }, [state.isLoadingApp]);

    const [androidReady, setAndroidReady] = useState(!isAndroid);

    useEffect(() => {
        if (!isAndroid) return;
        const id = setTimeout(() => {
            setAndroidReady(true);
            SplashScreen.hide({ fadeOutDuration: 300 });
        }, 160);
        return () => clearTimeout(id);
    }, []);

    const splashHiddenRef = useRef(false);
    const hideSplash = useCallback(() => {
        if (splashHiddenRef.current || !Capacitor.isNativePlatform() || isAndroid) return;
        splashHiddenRef.current = true;
        let r2: number;
        const r1 = requestAnimationFrame(() => {
            r2 = requestAnimationFrame(() => {
                SplashScreen.hide({ fadeOutDuration: 300 }).catch(() => {});
            });
        });
        return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }, []);
    useEffect(() => {
        if (!state.isLoadingApp) hideSplash();
    }, [state.isLoadingApp, hideSplash]);
    useEffect(() => {
        if (!Capacitor.isNativePlatform() || isAndroid) return;
        const t = setTimeout(hideSplash, 3000);
        return () => clearTimeout(t);
    }, [hideSplash]);

    useEffect(() => {
        if (state.isLoadingApp) return;
        if (wasLockedRef.current && !locked && !state.isLoggedIn) {
            forceUnlock();
            router.replace('/auth');
        }
    }, [locked, state.isLoadingApp, state.isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (state.isLoadingApp) return;
        if (localStorage.getItem('pending_tour')) {
            localStorage.removeItem('pending_tour');
            setShowTour(true);
        }
        const ref = searchParams.get('ref');
        if (ref && /^[a-zA-Z0-9_-]{3,32}$/.test(ref)) {
            localStorage.setItem('referral_code', ref);
            router.replace('/');
        }
    }, [pathname, searchParams, router, state.isLoadingApp]);

    const handleUrl = useCallback((url: string) => {
        if (url.startsWith('com.lokalni.app://')) {
            const rest = url.slice('com.lokalni.app://'.length);
            const qIdx = rest.indexOf('?');
            const path = qIdx >= 0 ? rest.slice(0, qIdx) : rest;
            const search = qIdx >= 0 ? rest.slice(qIdx) : '';
            if (path === 'dashboard') { router.replace('/dashboard' + search); return; }
            if (path === 'orders')    { router.replace('/dashboard?tab=orders' + (search ? '&' + search.slice(1) : '')); return; }
            if (path === 'calendar')  { router.replace('/calendar'); return; }
            if (path === 'chat')      { router.replace('/chat'); return; }
            return;
        }
        const DOMAINS = ['https://mylokalni.pl', 'https://www.mylokalni.pl', 'https://mylokalni.com', 'https://www.mylokalni.com'];
        if (DOMAINS.some(d => url.startsWith(d))) {
            try {
                const parsed = new URL(url);
                router.replace(parsed.pathname + parsed.search);
            } catch (e) {
                logger.warn('AppShell: nieprawidłowy URL w appUrlOpen', e);
            }
        }
    }, [router]);

    useEffect(() => {
        if (state.isLoadingApp || !pendingWidgetUrl.current) return;
        const url = pendingWidgetUrl.current;
        pendingWidgetUrl.current = null;
        handleUrl(url);
    }, [state.isLoadingApp, handleUrl]);

    useEffect(() => {
        CapacitorApp.getLaunchUrl().then(r => {
            if (!r?.url) return;
            pendingWidgetUrl.current = r.url;
        });
        const listener = CapacitorApp.addListener('appUrlOpen', e => {
            if (isLoadingRef.current) {
                pendingWidgetUrl.current = e.url;
            } else {
                handleUrl(e.url);
            }
        });
        return () => { listener.then(l => l.remove()); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        const ROOT_PATHS = new Set(['/', '/chat', '/favorites', '/calendar', '/dashboard']);
        const listener = CapacitorApp.addListener('backButton', () => {
            if (state.activeModal) {
                actions.setActiveModal('none');
                return;
            }
            if (ROOT_PATHS.has(pathname)) {
                CapacitorApp.minimizeApp();
                return;
            }
            router.back();
        });
        return () => { listener.then(l => l.remove()); };
    }, [state.activeModal, pathname, router, actions]);

    const isTabRoute = SWIPE_TAB_SET.has(pathname as '/');

    const openChat = useCallback(async (chatId: string) => {
        if (Capacitor.isNativePlatform()) {
            const { NativeNav } = await import('../plugins/NativeNav');
            await NativeNav.push({ fullScreen: true }).catch(() => {});
            router.push(`/chat/${chatId}`);
        } else {
            actions.setCurrentChatId(chatId);
            actions.setActiveModal('chat_detail');
        }
    }, [router, actions]);

    const handleOpenSupport = useCallback(async () => {
        if (Capacitor.isNativePlatform()) {
            const { NativeNav } = await import('../plugins/NativeNav');
            await NativeNav.push({ fullScreen: true }).catch(() => {});
            router.push('/support');
        } else {
            actions.openSupportModal();
        }
    }, [router, actions]);

    // Tab views — always mounted in the scroll-snap strip
    const tabElements = [
        <HomeView
            key="home"
            {...state.homeProps}
            {...actions.homeActions}
            categories={CATEGORIES_DATA}
            onServiceClick={actions.onServiceClick}
            onStartChat={actions.startChat}
        />,
        state.isLoggedIn ? (
            <ChatListView
                key="chat"
                chats={state.chatSessions}
                onChatClick={(id) => openChat(id)}
            />
        ) : null,
        state.isLoggedIn ? (
            <GrafikView
                key="calendar"
                isLoggedIn={state.isLoggedIn}
                isPremium={!!(state.userProfile?.isPremium) || !!(state.freshUser?.isPremium)}
                onUpgrade={actions.handleUpgradeToPremium}
                onBookingAction={actions.handleBookingAction}
                addToast={actions.addToast}
                onOpenChat={(chatId) => openChat(chatId)}
            />
        ) : null,
        state.isLoggedIn ? (
            <FavoritesListView
                key="favorites"
                services={state.favServices}
                onServiceClick={actions.onServiceClick}
                onRemove={actions.toggleFavorite}
                addToast={actions.addToast}
            />
        ) : null,
    ];

    const showLoadingScreen = !Capacitor.isNativePlatform() && (!!state.isLoadingApp || !!state.isNavLoading);

    // Safety net — reset nav loading when leaving service/profile routes
    useEffect(() => {
        const isNavRoute = pathname.startsWith('/service/') || pathname.startsWith('/profile/');
        if (!isNavRoute) actions.setNavLoading(false);
    }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <ErrorBoundary context="App">
            <div className="min-h-screen bg-gray-50 font-sans antialiased">
                <LoadingScreen isVisible={showLoadingScreen} />
                <ToastContainer
                    toasts={state.toasts}
                    removeToast={actions.removeToast}
                />

                {!state.isLoadingApp && androidReady && (
                    <>
                        <ErrorBoundary context="Layout">
                            <MainLayout
                                userProfile={state.freshUser || state.userProfile}
                                isLoggedIn={state.isLoggedIn}
                                unreadCount={state.unreadNotifications}
                                notifications={state.notificationList}
                                showNotifications={state.showNotifications}
                                onToggleNotifications={actions.handleNotificationClick}
                                onCloseNotifications={() => actions.setShowNotifications(false)}
                                onMarkAllRead={actions.onMarkAllRead}
                                onNotificationClick={actions.handleNotificationItemClick}
                                onProfileClick={() => {
                                    if (pathname === '/dashboard') {
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    } else {
                                        actions.changeView('profile');
                                    }
                                }}
                                onLogoClick={() => router.push('/')}
                                currentView={actions.getCurrentViewName()}
                                onChangeView={actions.changeView}
                                onAddClick={actions.openAddServiceModal}
                                hasUnreadMessages={state.hasUnreadMessages}
                                hideNavigation={state.isFullScreen || (state.activeModal !== 'none' && state.activeModal !== 'add_service' && state.activeModal !== 'report' && state.activeModal !== 'chat_detail' && state.activeModal !== 'support')}
                                tabElements={tabElements}
                                onOpenSupport={() => state.isLoggedIn ? handleOpenSupport() : router.push('/auth')}
                            >
                                {!isTabRoute && children}
                            </MainLayout>
                        </ErrorBoundary>
                        <ErrorBoundary context="Modals" fallback={null}>
                            <Suspense fallback={null}>
                                <ModalsManager state={state} actions={actions} />
                            </Suspense>
                        </ErrorBoundary>
                    </>
                )}

                {!Capacitor.isNativePlatform() && <CookieBanner />}
                {showTour && <TourOverlay onDone={() => { localStorage.setItem('tour_seen', '1'); setShowTour(false); }} />}
                {locked && <AppLock onVerify={verify} verifying={verifying} />}
            </div>
        </ErrorBoundary>
    );
}

export function AppShell({ children }: AppShellProps) {
    return (
        <Suspense fallback={null}>
            <AppShellContent>{children}</AppShellContent>
        </Suspense>
    );
}
