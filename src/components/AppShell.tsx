'use client';
import { Suspense, useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { CATEGORIES_DATA } from '../data/categories';
import { parseSlug, KEYWORD_DISPLAY, CITY_DISPLAY } from '../lib/seo-data';
import { SWIPE_TABS } from '../hooks/useTabSwipe';
import { useApp } from '../providers/AppProvider';
import { useBiometricLock } from '../hooks/useBiometricLock';
import { ToastContainer } from './ui/ToastContainer';
import { LoadingScreen } from './ui/LoadingScreen';
import { MainLayout } from './layout/MainLayout';
import { ModalsManager } from './modals/ModalsManager';
import { ErrorBoundary } from './ui/ErrorBoundary';
import { AppLock } from './AppLock';
import { logger } from '../utils/logger';
const HomeView          = dynamic(() => import('../views/HomeView'),                                                  { ssr: false });
const ChatListView      = dynamic(() => import('../views/ChatListView').then(m => ({ default: m.ChatListView })),     { ssr: false });
const GrafikView        = dynamic(() => import('../views/GrafikView'),                                                { ssr: false });
const FavoritesListView = dynamic(() => import('../views/FavoritesListView').then(m => ({ default: m.FavoritesListView })), { ssr: false });

const CookieBanner      = dynamic(() => import('./ui/CookieBanner'),          { ssr: false });
const TourOverlay       = dynamic(() => import('./tour/TourOverlay').then(m => ({ default: m.TourOverlay })),   { ssr: false });

const SWIPE_TAB_SET = new Set(SWIPE_TABS);
const SLUG_RE = /^\/[a-z0-9][a-z0-9-]*(?:\/\d+)?$/;
const KNOWN_APP_ROUTES = new Set([
    '/dashboard', '/booking-form', '/support', '/faq', '/regulamin',
    '/polityka-prywatnosci', '/o-nas', '/zasady-bezpieczenstwa',
    '/jak-to-dziala', '/zgoda-rodzica',
]);

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
        const q = searchParams.get('q');
        if (q && pathname === '/') {
            actions.homeActions.setSearchQuery(q);
            actions.homeActions.setSearchDisplay(q);
        }
        const city = searchParams.get('city');
        if (city) actions.homeActions.setLocation(city);
    }, [pathname, searchParams, router, state.isLoadingApp]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleUrl = useCallback((url: string) => {
        const DOMAINS = ['https://mylokalni.pl', 'https://www.mylokalni.pl', 'https://mylokalni.com', 'https://www.mylokalni.com'];
        if (DOMAINS.some(d => url.startsWith(d))) {
            try {
                const parsed = new URL(url);
                const slug = parsed.pathname.slice(1);
                const landing = slug ? parseSlug(slug) : null;
                if (landing) {
                    const qp = new URLSearchParams();
                    if (landing.type === 'keyword') {
                        qp.set('q', KEYWORD_DISPLAY[landing.keyword] ?? landing.keyword.replace(/-/g, ' '));
                    } else if (landing.type === 'city') {
                        qp.set('city', CITY_DISPLAY[landing.citySlug] ?? landing.citySlug);
                    } else if (landing.type === 'keyword-city') {
                        qp.set('q', KEYWORD_DISPLAY[landing.keyword] ?? landing.keyword.replace(/-/g, ' '));
                        qp.set('city', CITY_DISPLAY[landing.citySlug] ?? landing.citySlug.replace(/-/g, ' '));
                    } else {
                        qp.set('q', landing.query);
                        if (landing.citySlug) qp.set('city', CITY_DISPLAY[landing.citySlug] ?? landing.citySlug.replace(/-/g, ' '));
                    }
                    router.replace(`/?${qp}`);
                    return;
                }
                router.replace(parsed.pathname + parsed.search);
            } catch (e) {
                logger.warn('AppShell: nieprawidłowy URL', e);
            }
        }
    }, [router]);

    const isTabRoute = SWIPE_TAB_SET.has(pathname as '/');
    const isSlugRoute = SLUG_RE.test(pathname) && !SWIPE_TAB_SET.has(pathname as '/') && !KNOWN_APP_ROUTES.has(pathname);

    // Pre-populate search from slug URL — useLayoutEffect prevents flash (runs before browser paint)
    useLayoutEffect(() => {
        if (!isSlugRoute || state.isLoadingApp) return;
        const slug = pathname.split('/').filter(Boolean)[0];
        const parsed = parseSlug(slug);
        if (parsed.type === 'keyword') {
            const kw = KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword.replace(/-/g, ' ');
            actions.homeActions.setSearchQuery(kw);
            actions.homeActions.setSearchDisplay(kw);
            actions.homeActions.setLocation('');
        } else if (parsed.type === 'city') {
            const city = CITY_DISPLAY[parsed.citySlug] ?? parsed.citySlug.replace(/-/g, ' ');
            actions.homeActions.setSearchQuery('');
            actions.homeActions.setSearchDisplay('');
            actions.homeActions.setLocation(city);
        } else if (parsed.type === 'keyword-city') {
            const kw = KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword.replace(/-/g, ' ');
            const city = CITY_DISPLAY[parsed.citySlug] ?? parsed.citySlug.replace(/-/g, ' ');
            actions.homeActions.setSearchQuery(kw);
            actions.homeActions.setSearchDisplay(kw);
            actions.homeActions.setLocation(city);
        } else {
            actions.homeActions.setSearchQuery(parsed.query);
            actions.homeActions.setSearchDisplay(parsed.query);
            if (parsed.citySlug) actions.homeActions.setLocation(CITY_DISPLAY[parsed.citySlug] ?? parsed.citySlug.replace(/-/g, ' '));
        }
    }, [pathname, isSlugRoute, state.isLoadingApp]); // eslint-disable-line react-hooks/exhaustive-deps

    const openChat = useCallback((chatId: string) => {
        actions.setCurrentChatId(chatId);
        actions.setActiveModal('chat_detail');
    }, [actions]);

    const handleOpenSupport = useCallback(() => {
        actions.openSupportModal();
    }, [actions]);

    void handleUrl;

    // On slug routes tab strip is display:none — skip mounting tab views to avoid unnecessary renders
    const tabElements = isSlugRoute ? [null, null, null, null] : [
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

    const showLoadingScreen = !!state.isLoadingApp || !!state.isNavLoading;

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

                {/* Slug SSR shell: rendered before app loads so initial HTML contains service cards */}
                {isSlugRoute && state.isLoadingApp && children}

                {!state.isLoadingApp && (
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
                                isSlugRoute={isSlugRoute}
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

                <CookieBanner />
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
