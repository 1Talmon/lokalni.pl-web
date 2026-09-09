export const runtime = 'edge';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BASE_URL, parseSlug, KEYWORD_DISPLAY, CITY_DISPLAY } from '@/lib/seo-data';
import { createServiceUrl } from '@/utils/helpers';
import { fetchServices, resolveFetchParams, buildH1 } from '@/lib/slug-services';
import { SlugContent } from './_components/SlugContent';
import { SlugStaticShell } from './_components/SlugStaticShell';

// Slug routes live in (app) so AppShell handles them natively:
// - detects isSlugRoute, hides tab strip, pre-fills search state (useLayoutEffect)
// - renders {children} = <SlugContent> = HomeView with correct state
// This file only provides SSR metadata + JSON-LD for Googlebot.

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const parsed = parseSlug(slug);
    const fetchParams = resolveFetchParams(parsed);
    const { total } = await fetchServices(fetchParams);

    // Rzuć notFound() jak najwcześniej — generateMetadata jest pierwszym punktem gdzie
    // możemy to zrobić i CF Pages edge poprawnie ustawia 404 przed wygenerowaniem RSC payload.
    if (total === 0 && parsed.type === 'search') notFound();

    const url = `${BASE_URL}/${slug}`;
    const noindex = total >= 2
        ? { robots: { index: true, follow: true } }
        : { robots: { index: false, follow: true } };

    const h1 = buildH1(parsed);
    const title = total >= 2 ? `${total} ofert: ${h1}` : h1;
    const description = `Porównaj ${total > 0 ? total : ''} ofert${total === 1 ? 'ę' : ''}: ${h1.toLowerCase()}. Sprawdzone opinie, przejrzyste ceny, szybki kontakt na MyLokalni.pl.`.trim();

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

    // Unknown search-type slugs with no results → 404
    if (total === 0 && parsed.type === 'search') notFound();

    const h1 = buildH1(parsed);

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

    const ratings = services.map(s => s.rating).filter(r => r > 0);
    const avgRating = ratings.length > 0
        ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
        : null;

    const citySlug = (parsed.type === 'city' || parsed.type === 'keyword-city' || parsed.type === 'search')
        ? parsed.citySlug : null;
    const areaServed = citySlug ? { '@type': 'City', name: CITY_DISPLAY[citySlug] ?? citySlug.replace(/-/g, ' ') } : undefined;

    const aggregateRatingJsonLd = avgRating ? {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: h1,
        ...(areaServed ? { areaServed } : {}),
        aggregateRating: { '@type': 'AggregateRating', ratingValue: avgRating, reviewCount: ratings.length, bestRating: '5', worstRating: '1' },
    } : null;

    return (
        <>
            {/* JSON-LD for Googlebot */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
            {aggregateRatingJsonLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingJsonLd) }} />
            )}
            {/* SSR shell — widoczny HTML dla użytkownika i Googlebota zanim JS się załaduje */}
            {services.length > 0 && (
                <SlugStaticShell parsed={parsed} services={services} total={total} />
            )}
            {/* HomeView — przejmuje po hydratacji, chowa shell */}
            <SlugContent />
        </>
    );
}
