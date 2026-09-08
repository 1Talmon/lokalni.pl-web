'use client';
import { Suspense, useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { SWIPE_TABS, SWIPE_TAB_NAMES } from '../../hooks/useTabSwipe';
import { useNativeBottomNav } from '../../hooks/useNativeBottomNav';
import { useRouter, usePathname } from 'next/navigation';
import { navDirection, setNavDirection } from '../../utils/navDirection';
import { useMotionValue } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';
import { LoadingScreen } from '../ui/LoadingScreen';
import { UserProfile, NotificationItem } from '@/types';

// Strip fills from below the top navbar to the physical screen bottom.
const STRIP_H = 'calc(100vh - var(--total-nav-h, calc(var(--nav-content-h, 73px) + env(safe-area-inset-top, 0px))))';

interface MainLayoutProps {
    userProfile: UserProfile | null;
    isLoggedIn: boolean;
    unreadCount: number;
    notifications: NotificationItem[];
    showNotifications: boolean;
    onToggleNotifications: () => void;
    onCloseNotifications: () => void;
    onMarkAllRead: () => void;
    onNotificationClick: (id: number, chatId?: string, type?: string, bookingId?: string | null, bookingTab?: string | null, servicePublicId?: string | null) => void | Promise<void>;
    onProfileClick: () => void;
    onLogoClick: () => void;
    currentView: string;
    onChangeView: (view: string) => void;
    onAddClick: () => void;
    hasUnreadMessages: boolean;
    hideNavigation?: boolean;
    tabElements?: React.ReactNode[];
    isSlugRoute?: boolean;
    onOpenSupport?: () => void;
    children?: React.ReactNode;
}

const DeferredTabSlot = ({ index, activeIdx, children }: {
    index: number;
    activeIdx: number;
    children: React.ReactNode;
}) => {
    const [ready, setReady] = useState(index === activeIdx);
    useLayoutEffect(() => {
        if (ready) return;
        const id = requestAnimationFrame(() => setReady(true));
        return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <>{ready ? children : null}</>;
};

export const MainLayout = ({
    userProfile,
    isLoggedIn,
    unreadCount,
    notifications,
    showNotifications,
    onToggleNotifications,
    onCloseNotifications,
    onMarkAllRead,
    onNotificationClick,
    onProfileClick,
    onLogoClick,
    currentView,
    onChangeView,
    onAddClick,
    hasUnreadMessages,
    hideNavigation = false,
    tabElements,
    isSlugRoute = false,
    onOpenSupport,
    children,
}: MainLayoutProps) => {

    const router = useRouter();
    const pathname = usePathname();

    const enterClass = navDirection === 'pop' ? 'page-pop-back' : 'page-enter-forward';
    useEffect(() => { setNavDirection('push'); }, [pathname]);
    useEffect(() => {
        const onPop = () => setNavDirection('pop');
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, []);

    const NO_GLOBAL_BACK = useMemo(() => new Set([...SWIPE_TABS, '/auth', '/reset-password', '/verify-email', '/delete-account', '/delete-account-confirm', '/dashboard']), []);
    const showGlobalBack = !NO_GLOBAL_BACK.has(pathname)
        && !isSlugRoute
        && !pathname.startsWith('/service/')
        && !pathname.startsWith('/profile/');
    const isDetailRoute = pathname.startsWith('/service/') || pathname.startsWith('/profile/');
    const [isFooterVisible, setIsFooterVisible] = useState(false);
    const footerRef = useRef<HTMLElement>(null);
    const navWrapperRef = useRef<HTMLDivElement>(null);
    const navHeightUpdateRef = useRef<() => void>(() => {});
    const bottomNavWrapperRef = useRef<HTMLDivElement>(null);
    const tabScrollRef = useRef<HTMLDivElement>(null);
    const scrollDebounceRef = useRef<ReturnType<typeof setTimeout>>();
    const pathnameRef = useRef(pathname);
    useEffect(() => { pathnameRef.current = pathname; });

    const initialIdx = Math.max(0, SWIPE_TABS.indexOf(pathname as typeof SWIPE_TABS[number]));
    const scrollProgress = useMotionValue(initialIdx);
    const prevTabRef = useRef(initialIdx);

    const isOnTabRoute = !!tabElements && SWIPE_TABS.includes(pathname as typeof SWIPE_TABS[number]);

    const { isNativeNavActive } = useNativeBottomNav({
        isLoggedIn,
        currentView,
        onChangeView,
        onAddClick,
        hasUnreadMessages,
        hideNavigation,
    });

    useLayoutEffect(() => {
        const el = navWrapperRef.current;
        if (!el) return;
        const update = () => {
            if (document.documentElement.dataset.nativeNav) return;
            document.documentElement.style.setProperty('--total-nav-h', el.offsetHeight + 'px');
        };
        navHeightUpdateRef.current = update;
        update();
        const t1 = setTimeout(update, 100);
        const t2 = setTimeout(update, 300);
        const ro = new ResizeObserver(update);
        ro.observe(el);
        window.visualViewport?.addEventListener('resize', update);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            ro.disconnect();
            window.visualViewport?.removeEventListener('resize', update);
        };
    }, []);

    useEffect(() => {
        const check = () => {
            const active = !!document.documentElement.dataset.nativeNav;
            if (!active) navHeightUpdateRef.current();
        };
        const obs = new MutationObserver(check);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-native-nav'] });
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        const el = bottomNavWrapperRef.current;
        if (!el) return;
        const update = () =>
            document.documentElement.style.setProperty('--web-bottom-nav-h', el.offsetHeight + 'px');
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => {
            ro.disconnect();
            document.documentElement.style.removeProperty('--web-bottom-nav-h');
        };
    }, [isLoggedIn, isNativeNavActive, hideNavigation]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { setIsFooterVisible(entry.isIntersecting); },
            { threshold: 0.1 }
        );
        const el = footerRef.current;
        if (el) observer.observe(el);
        return () => { if (el) observer.unobserve(el); };
    }, [pathname]);

    useEffect(() => {
        const hide = isFooterVisible && pathname !== '/calendar';
        document.documentElement.classList.toggle('footer-visible', hide);
        return () => { document.documentElement.classList.remove('footer-visible'); };
    }, [isFooterVisible, pathname]);

    useLayoutEffect(() => {
        if (!tabScrollRef.current) return;
        const idx = SWIPE_TABS.indexOf(pathname as typeof SWIPE_TABS[number]);
        if (idx === -1) {
            if (isSlugRoute) {
                tabScrollRef.current.scrollLeft = 0;
                scrollProgress.set(0);
                prevTabRef.current = 0;
            }
            return;
        }
        tabScrollRef.current.scrollLeft = idx * window.innerWidth;
        scrollProgress.set(idx);
        prevTabRef.current = idx;
    }, [pathname, isSlugRoute]); // eslint-disable-line react-hooks/exhaustive-deps

    // scrollend fires when snap animation completes — immediate URL sync, no debounce needed
    useEffect(() => {
        const el = tabScrollRef.current;
        if (!el) return;
        const onScrollEnd = () => {
            const raw = Math.round(el.scrollLeft / window.innerWidth);
            const idx = Math.max(0, Math.min(SWIPE_TABS.length - 1, raw));
            const expectedLeft = idx * window.innerWidth;
            if (Math.abs(el.scrollLeft - expectedLeft) > 2) {
                el.scrollTo({ left: expectedLeft, behavior: 'smooth' });
                return;
            }
            const tab = SWIPE_TABS[idx];
            if (tab && tab !== pathnameRef.current) router.push(tab);
        };
        el.addEventListener('scrollend', onScrollEnd);
        return () => el.removeEventListener('scrollend', onScrollEnd);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleTabScroll = useCallback(() => {
        const el = tabScrollRef.current;
        if (!el) return;
        const progress = el.scrollLeft / window.innerWidth;
        scrollProgress.set(progress);

        const snappingTo = Math.round(progress);
        if (snappingTo !== prevTabRef.current && snappingTo >= 0 && snappingTo < SWIPE_TABS.length) {
            prevTabRef.current = snappingTo;
            void SWIPE_TAB_NAMES[snappingTo]; // reference for type safety
        }

        // Fallback for browsers without scrollend (iOS < 16.4)
        clearTimeout(scrollDebounceRef.current);
        scrollDebounceRef.current = setTimeout(() => {
            const idx = Math.round(el.scrollLeft / window.innerWidth);
            const tab = SWIPE_TABS[idx];
            if (tab && tab !== pathnameRef.current) router.push(tab);
        }, 80);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        return () => clearTimeout(scrollDebounceRef.current);
    }, []);

    const hideFooterOn = ['/chat', '/dashboard', '/calendar', '/bookings', '/favorites', '/booking-form'];
    const shouldShowFooter = !hideFooterOn.includes(pathname) && !hideNavigation;
    const hasRouteFooter = !isOnTabRoute && !hideFooterOn.includes(pathname);

    return (
        <div className="flex flex-col min-h-screen">
            {showGlobalBack && (
                <div
                    data-fixed-nav-px4
                    className="fixed left-0 right-0 z-[99999] lg:hidden flex items-center px-4 h-12"
                    style={{ top: 'var(--total-nav-h, 73px)' }}
                >
                    <button
                        onClick={() => router.back()}
                        type="button"
                        className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl text-[10px] font-black shadow-sm border border-slate-100 text-slate-700 uppercase tracking-wider transition-all active:scale-95 hover:bg-white"
                    >
                        <ArrowLeft size={13} strokeWidth={3} /> Wróć
                    </button>
                </div>
            )}
            <div ref={navWrapperRef} data-fixed-nav style={{ paddingTop: 'env(safe-area-inset-top, 0px)', backgroundColor: isDetailRoute ? 'transparent' : '#FFFFFF' }} className={`fixed top-0 left-0 right-0 z-50 min-w-[300px]${isDetailRoute ? '' : ' border-b border-gray-100'}`}>
                <Navbar
                    userProfile={userProfile}
                    isLoggedIn={isLoggedIn}
                    unreadCount={unreadCount}
                    notifications={notifications}
                    showNotifications={showNotifications}
                    onToggleNotifications={onToggleNotifications}
                    onCloseNotifications={onCloseNotifications}
                    onMarkAllRead={onMarkAllRead}
                    onNotificationClick={onNotificationClick}
                    onProfileClick={onProfileClick}
                    onLogoClick={onLogoClick}
                />
            </div>

            <main
                className="flex-grow bg-[#F4F4F9]"
                style={{
                    paddingTop: 'var(--total-nav-h, calc(var(--nav-content-h, 73px) + env(safe-area-inset-top, 0px)))',
                    paddingBottom: (hasRouteFooter || isOnTabRoute) ? '0px' : 'var(--bottom-nav-total-h, var(--web-bottom-nav-h, 0px))',
                }}
            >
                <Suspense fallback={null}>
                    {tabElements ? (
                        <>
                            <div style={{ height: STRIP_H, display: isOnTabRoute ? 'block' : 'none' }}>
                                <div
                                    ref={tabScrollRef}
                                    onScroll={handleTabScroll}
                                    className="scrollbar-hide"
                                    style={{
                                        height: '100%',
                                        overflowX: hideNavigation ? 'hidden' : 'scroll',
                                        overflowY: 'hidden',
                                        display: 'flex',
                                        scrollSnapType: 'x mandatory',
                                    }}
                                >
                                    {SWIPE_TABS.map((tab, i) => (
                                        <div
                                            key={tab}
                                            style={{
                                                width: '100vw',
                                                height: '100%',
                                                flexShrink: 0,
                                                scrollSnapAlign: 'start',
                                                scrollSnapStop: 'always',
                                                overflowY: 'scroll',
                                                overflowX: 'hidden',
                                                overscrollBehaviorY: 'contain',
                                                paddingBottom: 'var(--bottom-nav-total-h, env(safe-area-inset-bottom, 0px))',
                                            }}
                                        >
                                            <DeferredTabSlot index={i} activeIdx={initialIdx}>
                                                {tabElements[i]}
                                            </DeferredTabSlot>
                                            {i === 0 && shouldShowFooter && (
                                                <footer ref={footerRef} className="hidden md:block">
                                                    <Footer onOpenSupport={onOpenSupport} />
                                                </footer>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {!isOnTabRoute && (
                                <>
                                    <div
                                        key={pathname}
                                        className={(pathname === '/support' || pathname.startsWith('/chat/') || pathname === '/dashboard') ? '' : enterClass}
                                        style={hasRouteFooter ? { paddingBottom: 'var(--bottom-nav-total-h, var(--web-bottom-nav-h, 0px))' } : undefined}
                                        onAnimationEnd={(e) => {
                                            if (e.currentTarget === e.target) {
                                                const el = e.currentTarget as HTMLDivElement;
                                                el.style.willChange = 'auto';
                                                el.style.backfaceVisibility = 'visible';
                                                (el.style as unknown as Record<string, string>).webkitBackfaceVisibility = 'visible';
                                            }
                                        }}
                                    >
                                        {children}
                                    </div>
                                    {shouldShowFooter && (
                                        <footer ref={footerRef} className="hidden md:block">
                                            <Footer onOpenSupport={onOpenSupport} />
                                        </footer>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        <div key={pathname} style={{ minHeight: '100vh' }}>
                            {children}
                        </div>
                    )}
                </Suspense>
            </main>

            {isLoggedIn && !hideNavigation && !isNativeNavActive && (
                <div
                    ref={bottomNavWrapperRef}
                    data-fixed-bottom-nav
                    style={{ paddingBottom: 'var(--bottom-nav-pb, 0px)' }}
                    className={`fixed bottom-0 left-0 right-0 z-50 min-w-[300px] bg-white/80 backdrop-blur-xl border-t border-gray-200/50 lg:bg-transparent lg:backdrop-blur-none lg:border-t-0 lg:pointer-events-none transition-[transform,opacity] duration-150 transform ${
                        (isFooterVisible && pathname !== '/calendar')
                            ? 'translate-y-full opacity-0 pointer-events-none'
                            : 'translate-y-0 opacity-100'
                    }`}>
                    <BottomNav
                        currentView={currentView}
                        onChangeView={onChangeView}
                        onAddClick={onAddClick}
                        hasUnreadMessages={hasUnreadMessages}
                        scrollProgress={undefined}
                    />
                    <LoadingScreen isVisible={false} />
                </div>
            )}
        </div>
    );
};
