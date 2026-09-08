import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BASE_URL, parseSlug, LANDING_SLUGS } from '@/lib/seo-data';
import { createServiceUrl } from '@/utils/helpers';
import { fetchServices, resolveFetchParams, buildH1, PAGE_SIZE } from '@/lib/slug-services';
import { SlugSeoServer } from './_components/SlugSeoServer';
import { SlugNavbar } from './_components/SlugNavbar';
import { SlugServiceGrid } from './_components/SlugServiceGrid';
import { SlugLoadMore } from './_components/SlugLoadMore';
import { Footer } from '@/components/layout/Footer';

export const revalidate = 3600;

export async function generateStaticParams() {
    return [...LANDING_SLUGS].map(slug => ({ slug }));
}

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

    if (services.length === 0) notFound();

    const h1 = buildH1(parsed);
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
            {hasMore && <link rel="next" href={`${BASE_URL}/${slug}/2`} />}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
            {aggregateRatingJsonLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(aggregateRatingJsonLd) }} />
            )}

            <SlugNavbar />

            <div className="max-w-7xl mx-auto px-4 pt-6 pb-4">
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
