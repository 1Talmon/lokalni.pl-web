'use client';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useApp } from '@/providers/AppProvider';
import { KEYWORD_DISPLAY, CITY_DISPLAY } from '@/lib/seo-data';
import { getLandingContent, TOP_CITIES_DISPLAY } from '@/lib/landing-content';
import { LandingSearchBar } from './LandingSearchBar';
import { LandingServiceGrid } from './LandingServiceCard';
import { createServiceUrl } from '@/utils/helpers';

interface Props {
    initialServices: Record<string, unknown>[];
    keyword: string | null;
    city: string | null;
    slug: string;
    page?: number;
    prevUrl?: string | null;
    nextUrl?: string | null;
}

function FaqItem({ q, a }: { q: string; a: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className="py-4">
            <button
                onClick={() => setOpen(v => !v)}
                className="w-full flex justify-between items-start text-left gap-4"
                aria-expanded={open}
            >
                <span className="font-medium text-gray-900 text-sm">{q}</span>
                <span className="text-gray-400 text-lg leading-none flex-shrink-0">{open ? '−' : '+'}</span>
            </button>
            {open && <p className="mt-2 text-gray-600 text-sm leading-relaxed">{a}</p>}
        </div>
    );
}

export function LandingView({ initialServices, keyword, city, slug, page, prevUrl, nextUrl }: Props) {
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

    const content = getLandingContent(keyword);

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
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {h1}{page && page > 1 ? ` — strona ${page}` : ''}
                    </h1>
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
                {/* Pagination nav */}
                {(prevUrl || nextUrl) && (
                    <nav aria-label="Paginacja" className="mt-10 flex justify-center gap-4">
                        {prevUrl && (
                            <Link href={prevUrl} className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-indigo-400 transition-colors">
                                ← Poprzednia strona
                            </Link>
                        )}
                        {nextUrl && (
                            <Link href={nextUrl} className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-indigo-400 transition-colors">
                                Następna strona →
                            </Link>
                        )}
                    </nav>
                )}

                <div className="mt-10 text-center">
                    <Link
                        href={ctaUrl}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors"
                    >
                        Pokaż na mapie / zaawansowane filtry →
                    </Link>
                </div>

                {/* Category description */}
                <div className="mt-12 max-w-3xl">
                    <p className="text-gray-600 text-sm leading-relaxed">{content.description}</p>
                </div>

                {/* Other cities — only on keyword pages */}
                {keyword && (
                    <div className="mt-10">
                        <h2 className="text-lg font-semibold text-gray-800 mb-3">
                            {kwDisplay} w innych miastach
                        </h2>
                        <div className="flex flex-wrap gap-2">
                            {TOP_CITIES_DISPLAY.filter(c => c.display !== cityDisplay).map(c => (
                                <Link
                                    key={c.slug}
                                    href={`/${keyword}-${c.slug}`}
                                    className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                                >
                                    {c.display}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Related categories */}
                <div className="mt-10">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Powiązane kategorie</h2>
                    <div className="flex flex-wrap gap-2">
                        {content.related.map(rel => (
                            <Link
                                key={rel}
                                href={`/${rel}`}
                                className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                            >
                                {KEYWORD_DISPLAY[rel] ?? rel.replace(/-/g, ' ')}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-12 max-w-3xl">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Najczęstsze pytania</h2>
                    <div className="divide-y divide-gray-100">
                        {content.faq.map((item, i) => (
                            <FaqItem key={i} q={item.q} a={item.a} />
                        ))}
                    </div>
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
