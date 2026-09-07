'use client';
import { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useApp } from '@/providers/AppProvider';
import { KEYWORD_DISPLAY, CITY_DISPLAY } from '@/lib/seo-data';
import { LandingSearchBar } from './LandingSearchBar';
import { LandingServiceGrid } from './LandingServiceCard';
import { createServiceUrl } from '@/utils/helpers';

interface Props {
    initialServices: Record<string, unknown>[];
    keyword: string | null;
    city: string | null;
    slug: string;
}

export function LandingView({ initialServices, keyword, city, slug }: Props) {
    const router = useRouter();
    const { state, actions } = useApp();

    const kwDisplay  = keyword ? (KEYWORD_DISPLAY[keyword] ?? keyword.replace(/-/g, ' ')) : null;
    const cityDisplay = city ? (CITY_DISPLAY[city] ?? city) : null;

    const h1 = kwDisplay && cityDisplay
        ? `${kwDisplay} ${cityDisplay}`
        : kwDisplay ?? (cityDisplay ? `Usługi w ${cityDisplay}` : 'Usługi w Twojej okolicy');

    const ctaUrl = (() => {
        const p = new URLSearchParams();
        if (kwDisplay) p.set('q', kwDisplay);
        if (cityDisplay) p.set('city', cityDisplay);
        return `/?${p}`;
    })();

    const handleOpenSupportNoop = useCallback(() => {
        if (state.isLoggedIn) actions.openSupportModal();
        else router.push('/auth');
    }, [state.isLoggedIn, actions, router]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar
                userProfile={state.freshUser ?? state.userProfile}
                isLoggedIn={state.isLoggedIn}
                unreadCount={state.unreadNotifications}
                notifications={state.notificationList}
                showNotifications={state.showNotifications}
                onToggleNotifications={actions.handleNotificationClick}
                onCloseNotifications={() => actions.setShowNotifications(false)}
                onMarkAllRead={actions.onMarkAllRead}
                onNotificationClick={actions.handleNotificationItemClick}
                onProfileClick={() => {
                    const uid = (state.freshUser ?? state.userProfile)?.uid;
                    if (uid) router.push(`/profile/${uid}`);
                    else router.push('/auth');
                }}
                onLogoClick={() => router.push('/')}
            />

            <section className="bg-white border-b border-gray-100 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{h1}</h1>
                    <p className="text-gray-500 text-sm">
                        {initialServices.length} {initialServices.length === 1 ? 'oferta' : initialServices.length < 5 ? 'oferty' : 'ofert'} · MyLokalni.pl
                    </p>
                    <LandingSearchBar
                        defaultKeyword={kwDisplay ?? ''}
                        defaultCity={cityDisplay ?? ''}
                    />
                </div>
            </section>

            <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
                <LandingServiceGrid
                    services={initialServices}
                    createServiceUrl={createServiceUrl}
                    favorites={state.favorites}
                    isLoggedIn={state.isLoggedIn}
                    onToggleFavorite={actions.toggleFavorite}
                />
                <div className="mt-10 text-center">
                    <Link
                        href={ctaUrl}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
                    >
                        Pokaż na mapie / zaawansowane filtry →
                    </Link>
                </div>
            </main>

            {!state.isLoggedIn && (
                <section className="bg-indigo-50 border-t border-indigo-100 py-8 px-4 text-center">
                    <p className="text-gray-700 font-medium mb-3">Zaloguj się, żeby rezerwować i dodawać do ulubionych</p>
                    <Link href="/auth" className="inline-block px-6 py-2.5 rounded-2xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors">
                        Zaloguj się
                    </Link>
                </section>
            )}

            <Footer onOpenSupport={handleOpenSupportNoop} />
        </div>
    );
}
