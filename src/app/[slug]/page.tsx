export const runtime = 'edge';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
    API_URL, BASE_URL,
    parseSlug,
    CITY_DISPLAY, CITY_LOCATIVE, KEYWORD_DISPLAY,
} from '@/lib/seo-data';
import { createServiceUrl } from '@/utils/helpers';
import { LandingAppWrapper } from './_components/LandingAppWrapper';

interface Props {
    params: Promise<{ slug: string }>;
}

async function fetchServices(params: {
    keyword?: string | null;
    city?: string | null;
    citySlug?: string | null;
    query?: string | null;
}) {
    try {
        const p = new URLSearchParams({ limit: '24', sort: 'rating' });

        if (params.city)     p.set('city', params.city);
        else if (params.citySlug) p.set('citySlug', params.citySlug);

        if (params.keyword)  p.set('query', KEYWORD_DISPLAY[params.keyword] ?? params.keyword.replace(/-/g, ' '));
        else if (params.query) p.set('query', params.query);

        const res = await fetch(`${API_URL}/services?${p}`, {
            headers: { 'User-Agent': 'Lokalni-MetaBot/1.0' },
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json) ? json : (json.data ?? []);
    } catch {
        return [];
    }
}

function resolveFetchParams(parsed: ReturnType<typeof parseSlug>) {
    switch (parsed.type) {
        case 'keyword':
            return { keyword: parsed.keyword, city: null, citySlug: null, query: null };
        case 'city':
            return { keyword: null, city: CITY_DISPLAY[parsed.citySlug] ?? null, citySlug: CITY_DISPLAY[parsed.citySlug] ? null : parsed.citySlug, query: null };
        case 'keyword-city': {
            const cityDisplay = CITY_DISPLAY[parsed.citySlug];
            return { keyword: parsed.keyword, city: cityDisplay ?? null, citySlug: cityDisplay ? null : parsed.citySlug, query: null };
        }
        case 'search':
            return { keyword: null, city: null, citySlug: parsed.citySlug, query: parsed.query };
    }
}

function buildH1(parsed: ReturnType<typeof parseSlug>): string {
    switch (parsed.type) {
        case 'keyword': return KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword.replace(/-/g, ' ');
        case 'city':    return `Usługi w ${CITY_LOCATIVE[parsed.citySlug] ?? CITY_DISPLAY[parsed.citySlug] ?? parsed.citySlug}`;
        case 'keyword-city': {
            const kw = KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword.replace(/-/g, ' ');
            const city = CITY_DISPLAY[parsed.citySlug] ?? parsed.citySlug.replace(/-/g, ' ');
            return `${kw} ${city}`;
        }
        case 'search': {
            const city = parsed.citySlug ? (CITY_DISPLAY[parsed.citySlug] ?? parsed.citySlug.replace(/-/g, ' ')) : null;
            return city ? `${parsed.query} ${city}` : parsed.query;
        }
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const parsed = parseSlug(slug);
    const fetchParams = resolveFetchParams(parsed);
    const services = await fetchServices(fetchParams);

    const url = `${BASE_URL}/${slug}`;
    const noindex = services.length >= 2
        ? { robots: { index: true, follow: true } }
        : { robots: { index: false, follow: true } };

    const h1 = buildH1(parsed);
    const count = services.length;
    const title = count >= 2
        ? `${count} ofert: ${h1} | MyLokalni.pl`
        : `${h1} | MyLokalni.pl`;
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
    const services = await fetchServices(fetchParams) as Record<string, unknown>[];

    if (services.length === 0) notFound();

    const h1 = buildH1(parsed);
    const keyword = parsed.type === 'keyword' || parsed.type === 'keyword-city' ? parsed.keyword : null;
    const citySlug = parsed.type === 'keyword' ? null : (parsed.type === 'city' || parsed.type === 'keyword-city' || parsed.type === 'search' ? parsed.citySlug : null);
    const cityDisplay = citySlug ? (CITY_DISPLAY[citySlug] ?? null) : null;

    // Aggregate rating from services
    const ratings = (services as Record<string, unknown>[])
        .map(s => parseFloat(s.rating as string) || 0)
        .filter(r => r > 0);
    const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Strona główna', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: h1, item: `${BASE_URL}/${slug}` },
        ],
    };

    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: h1,
        numberOfItems: services.length,
        itemListElement: (services as Record<string, unknown>[]).slice(0, 10).map((s, i) => {
            const id = (s.publicId ?? s.id) as string | undefined;
            const title = s.title as string | undefined;
            const svcSlug = id && title ? createServiceUrl(title, id) : null;
            return { '@type': 'ListItem', position: i + 1, name: title, url: svcSlug ? `${BASE_URL}/service/${svcSlug}` : undefined };
        }).filter(item => item.url),
    };

    const aggregateRatingJsonLd = avgRating ? {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: h1,
        aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: avgRating,
            reviewCount: ratings.length,
            bestRating: '5',
            worstRating: '1',
        },
    } : null;

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
            {aggregateRatingJsonLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingJsonLd) }} />
            )}
            <LandingAppWrapper
                initialServices={services}
                keyword={keyword}
                city={cityDisplay ?? citySlug}
                slug={slug}
            />
        </>
    );
}
