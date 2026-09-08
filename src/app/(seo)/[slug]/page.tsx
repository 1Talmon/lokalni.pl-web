export const runtime = 'edge';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BASE_URL, parseSlug, KEYWORD_DISPLAY, CITY_DISPLAY } from '@/lib/seo-data';
import { createServiceUrl } from '@/utils/helpers';
import { fetchServices, resolveFetchParams, buildH1, PAGE_SIZE } from '@/lib/slug-services';
import { SlugSeoServer } from './_components/SlugSeoServer';
import { SlugNavbar } from './_components/SlugNavbar';
import { SlugServiceGrid } from './_components/SlugServiceGrid';
import { SlugLoadMore } from './_components/SlugLoadMore';
import { SlugRedirect } from './_components/SlugRedirect';
import { Footer } from '@/components/layout/Footer';

// Fully dynamic edge rendering — no static pre-generation.
// Every slug from sitemap-locations.xml resolves here (e.g. /inne-rowy, /dom-ogrod-gdynia).
// fetchServices uses next: { revalidate: 3600 } so CF edge caches responses per slug.

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const parsed = parseSlug(slug);
    const fetchParams = resolveFetchParams(parsed);
    const { total } = await fetchServices(fetchParams);

    const url = `${BASE_URL}/${slug}`;
    const noindex = total >= 2
        ? { robots: { index: true, follow: true } }
        : { robots: { index: false, follow: true } };

    const h1 = buildH1(parsed);
    const count = total;
    const title = count >= 2
        ? `${count} ofert: ${h1}`
        : h1;
    const description = `Porównaj ${count > 0 ? count : ''} ofert${count === 1 ? 'ę' : ''}: ${h1.toLowerCase()}. Sprawdzone opinie, przejrzyste ceny, szybki kontakt na MyLokalni.pl.`.trim();

    return {
        title,
        description,
        ...noindex,
        alternates: { canonical: url },
        openGraph: { title, description, url, siteName: 'MyLokalni.pl', locale: 'pl_PL', type: 'website' },
        twitter: { card: 'summary', title, description },
    };
}

export default async function SlugPage({ params }: Props) {
    const { slug } = await params;
    const parsed = parseSlug(slug);
    const fetchParams = resolveFetchParams(parsed);
    const { services, total } = await fetchServices(fetchParams);

    const h1 = buildH1(parsed);

    // Build main app URL — mirrors AppShell handleUrl deep-link logic (lines 130-143)
    const appParams = new URLSearchParams();
    if (parsed.type === 'keyword' || parsed.type === 'keyword-city') {
        appParams.set('q', KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword.replace(/-/g, ' '));
    } else if (parsed.type === 'search') {
        appParams.set('q', parsed.query);
    }
    if (parsed.type === 'keyword-city' || parsed.type === 'city') {
        appParams.set('city', CITY_DISPLAY[parsed.citySlug] ?? parsed.citySlug.replace(/-/g, ' '));
    } else if (parsed.type === 'search' && parsed.citySlug) {
        appParams.set('city', CITY_DISPLAY[parsed.citySlug] ?? parsed.citySlug.replace(/-/g, ' '));
    }
    const mainAppUrl = appParams.toString() ? `/?${appParams}` : '/';

    // 0 results — keyword/city pages with no services: show helpful redirect, don't 404.
    // Search-type slugs (no known keyword match) with 0 results: 404.
    if (services.length === 0) {
        if (parsed.type === 'search') notFound();

        const keywordLabel = parsed.type === 'keyword' || parsed.type === 'keyword-city'
            ? (KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword.replace(/-/g, ' '))
            : null;
        const cityLabel = parsed.type === 'city' || parsed.type === 'keyword-city'
            ? (CITY_DISPLAY[parsed.citySlug] ?? parsed.citySlug.replace(/-/g, ' '))
            : null;

        return (
            <>
                <SlugNavbar />
                <div className="max-w-2xl mx-auto px-4 pt-16 pb-32 text-center">
                    <p className="text-4xl mb-4">🔍</p>
                    <h1 className="text-xl font-black text-gray-900 mb-2">
                        Brak ogłoszeń
                        {keywordLabel ? `: ${keywordLabel}` : ''}
                        {cityLabel ? ` w ${cityLabel}` : ''}
                    </h1>
                    <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
                        Nie ma jeszcze ogłoszeń dla tego zapytania. Sprawdź wyniki dla całej Polski lub wróć na stronę główną.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        {parsed.type === 'keyword-city' && (
                            <Link
                                href={`/${parsed.keyword}`}
                                className="px-6 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
                            >
                                {keywordLabel} — cała Polska
                            </Link>
                        )}
                        <Link
                            href="/"
                            className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-700 text-sm font-semibold hover:border-indigo-400 transition-colors"
                        >
                            Strona główna
                        </Link>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const hasMore = services.length === PAGE_SIZE;

    const keywordSlug = (parsed.type === 'keyword' || parsed.type === 'keyword-city')
        ? parsed.keyword
        : null;
    const citySlug = (parsed.type === 'city' || parsed.type === 'keyword-city' || parsed.type === 'search')
        ? parsed.citySlug
        : null;

    const ratings = services.map(s => s.rating).filter(r => r > 0);
    const avgRating = ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : null;

    const breadcrumbItems = parsed.type === 'keyword-city'
        ? [
            { '@type': 'ListItem', position: 1, name: 'Strona główna', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword, item: `${BASE_URL}/${parsed.keyword}` },
            { '@type': 'ListItem', position: 3, name: h1, item: `${BASE_URL}/${slug}` },
        ]
        : [
            { '@type': 'ListItem', position: 1, name: 'Strona główna', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: h1, item: `${BASE_URL}/${slug}` },
        ];

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems,
    };

    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: h1,
        numberOfItems: services.length,
        itemListElement: services.slice(0, 10).map((s, i) => {
            const svcSlug = s.publicId && s.title ? createServiceUrl(s.title, s.publicId) : null;
            return { '@type': 'ListItem', position: i + 1, name: s.title, url: svcSlug ? `${BASE_URL}/service/${svcSlug}` : undefined };
        }).filter(item => item.url),
    };

    const areaServed = citySlug ? { '@type': 'City', name: citySlug.replace(/-/g, ' ') } : undefined;
    const aggregateRatingJsonLd = avgRating ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: h1,
        ...(areaServed ? { areaServed } : {}),
        aggregateRating: { '@type': 'AggregateRating', ratingValue: avgRating, reviewCount: ratings.length, bestRating: '5', worstRating: '1' },
    } : null;

    return (
        <>
            {/* Client redirect: Google sees SSR content; real users go to HomeView with pre-filled search */}
            <SlugRedirect href={mainAppUrl} />
            {hasMore && <link rel="next" href={`${BASE_URL}/${slug}/2`} />}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
            {aggregateRatingJsonLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingJsonLd) }} />
            )}

            <SlugNavbar />

            <div className="max-w-7xl mx-auto px-4 pt-4 pb-4">
                <nav aria-label="breadcrumb" className="mb-3">
                    <ol className="flex items-center flex-wrap gap-x-1.5 gap-y-1 text-xs text-gray-400">
                        <li><Link href="/" className="hover:text-indigo-600 transition-colors">Strona główna</Link></li>
                        {parsed.type === 'keyword-city' && (
                            <>
                                <li aria-hidden="true">/</li>
                                <li>
                                    <Link href={`/${parsed.keyword}`} className="hover:text-indigo-600 transition-colors">
                                        {KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword}
                                    </Link>
                                </li>
                            </>
                        )}
                        {parsed.type === 'city' && parsed.citySlug && (
                            <>
                                <li aria-hidden="true">/</li>
                                <li>
                                    <Link href="/warszawa" className="hover:text-indigo-600 transition-colors">Usługi</Link>
                                </li>
                            </>
                        )}
                        <li aria-hidden="true">/</li>
                        <li className="text-gray-600 font-medium truncate max-w-[200px]">{h1}</li>
                    </ol>
                </nav>
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{h1}</h1>
                    {total > 0 && (
                        <p className="text-sm text-gray-500 mt-1">
                            {total} {total === 1 ? 'oferta' : total < 5 ? 'oferty' : 'ofert'}
                        </p>
                    )}
                </div>
                <SlugServiceGrid services={services} />
                <SlugLoadMore slug={slug} initialCount={services.length} hasMore={hasMore} />
            </div>

            <SlugSeoServer keywordSlug={keywordSlug} citySlug={citySlug} h1={h1} />
            <Footer />
        </>
    );
}
