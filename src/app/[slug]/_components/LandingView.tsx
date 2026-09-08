'use client';
import { useEffect, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useApp } from '@/providers/AppProvider';
import { KEYWORD_DISPLAY, CITY_DISPLAY } from '@/lib/seo-data';
import { getLandingContent, TOP_CITIES_DISPLAY } from '@/lib/landing-content';
import { CATEGORIES_DATA } from '@/data/categories';
import HomeView from '@/views/HomeView';

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

export function LandingView({ keyword, city, slug, page, prevUrl, nextUrl }: Props) {
    const router = useRouter();
    const { state, actions } = useApp();

    const kwDisplay   = keyword ? (KEYWORD_DISPLAY[keyword] ?? keyword.replace(/-/g, ' ')) : null;
    const cityDisplay = city    ? (CITY_DISPLAY[city]       ?? city)                        : null;

    // Pre-populate search state from slug
    useEffect(() => {
        if (kwDisplay)   { actions.homeActions.setSearchQuery(kwDisplay); actions.homeActions.setSearchDisplay(kwDisplay); }
        if (cityDisplay)   actions.homeActions.setLocation(cityDisplay);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const content = getLandingContent(keyword);

    const handleOpenSupport = useCallback(() => {
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

            <HomeView
                {...state.homeProps}
                {...actions.homeActions}
                categories={CATEGORIES_DATA}
                onServiceClick={actions.onServiceClick}
                onStartChat={actions.startChat}
            />

            {/* Pagination */}
            {(prevUrl || nextUrl) && (
                <nav aria-label="Paginacja" className="flex justify-center gap-4 py-6 px-4">
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

            {/* SEO content */}
            <div className="max-w-3xl mx-auto w-full px-4 pb-12">
                <p className="text-gray-600 text-sm leading-relaxed mt-6">{content.description}</p>

                {keyword && (
                    <div className="mt-8">
                        <h2 className="text-base font-semibold text-gray-800 mb-3">{kwDisplay} w innych miastach</h2>
                        <div className="flex flex-wrap gap-2">
                            {TOP_CITIES_DISPLAY.filter(c => c.display !== cityDisplay).map(c => (
                                <Link key={c.slug} href={`/${keyword}-${c.slug}`}
                                    className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                                    {c.display}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-8">
                    <h2 className="text-base font-semibold text-gray-800 mb-3">Powiązane kategorie</h2>
                    <div className="flex flex-wrap gap-2">
                        {content.related.map(rel => (
                            <Link key={rel} href={`/${rel}`}
                                className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                                {KEYWORD_DISPLAY[rel] ?? rel.replace(/-/g, ' ')}
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="mt-10">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Najczęstsze pytania</h2>
                    <div className="divide-y divide-gray-100">
                        {content.faq.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
                    </div>
                </div>
            </div>

            <Footer onOpenSupport={handleOpenSupport} />
        </div>
    );
}
