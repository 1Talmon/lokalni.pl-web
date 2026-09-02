import type { Metadata } from 'next';
import ServiceDetailsNoSSR from './ServiceDetailsNoSSR';
import { ServiceStaticShell } from './ServiceStaticShell';
import { API_URL, BASE_URL } from '@/lib/seo-data';

interface Props {
    params: Promise<{ slug: string }>;
}

function extractPublicId(slug: string): string {
    const parts = slug.split('-');
    return parts.length > 1 ? parts[parts.length - 1] : slug;
}

async function fetchService(slug: string) {
    const publicId = extractPublicId(slug);
    try {
        const res = await fetch(`${API_URL}/services/${publicId}`, {
            headers: { 'User-Agent': 'Lokalni-MetaBot/1.0' },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data ?? json;
    } catch {
        return null;
    }
}

function normalizeMediaUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, 'https://api.mylokalni.pl');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const d = await fetchService(slug);

    if (!d) {
        return {
            title: 'Usługa | MyLokalni.pl',
            description: 'Znajdź lokalnych specjalistów na MyLokalni.pl.',
        };
    }

    const cityPart = d.city ? ` w ${d.city}` : '';
    const title = `${d.title}${cityPart} | MyLokalni.pl`;
    const description = d.description
        ? String(d.description).slice(0, 160)
        : `${d.title}${cityPart} – sprawdź ofertę, opinie i ceny na MyLokalni.pl.`;
    const image = normalizeMediaUrl(d.image || d.images?.[0] || d.provider?.profilowe) ?? `${BASE_URL}/og-image.png`;
    const url = `${BASE_URL}/service/${slug}`;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'website',
            images: [{ url: image }],
            siteName: 'MyLokalni.pl',
            locale: 'pl_PL',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
        },
    };
}

export default async function ServicePage({ params }: Props) {
    const { slug } = await params;
    const d = await fetchService(slug);

    let jsonLd: object | null = null;

    if (d) {
        const cityPart = d.city ? ` w ${d.city}` : '';
        const image = normalizeMediaUrl(d.image || d.images?.[0] || d.provider?.profilowe) ?? `${BASE_URL}/og-image.png`;
        const rating = parseFloat(d.rating) || 0;
        const reviewsCount = parseInt(d.reviewsCount) || 0;

        jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: `${d.title}${cityPart}`,
            description: d.description ? String(d.description).slice(0, 300) : undefined,
            url: `${BASE_URL}/service/${slug}`,
            image,
            ...(d.city ? { address: { '@type': 'PostalAddress', addressLocality: d.city, addressCountry: 'PL' } } : {}),
            areaServed: d.city
                ? { '@type': 'City', name: d.city }
                : { '@type': 'Country', name: 'Polska' },
            ...(d.provider?.name ? { employee: { '@type': 'Person', name: d.provider.name } } : {}),
            ...(rating > 0 && reviewsCount > 0 ? {
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: rating.toFixed(1),
                    reviewCount: reviewsCount,
                    bestRating: '5',
                    worstRating: '1',
                },
            } : {}),
            ...(d.price ? { priceRange: `${d.price} PLN${d.priceUnit ? `/${d.priceUnit}` : ''}` } : {}),
        };
    }

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            {d && <ServiceStaticShell data={d} />}
            <script
                dangerouslySetInnerHTML={{
                    __html: `(function(){window.addEventListener('sdv:ready',function(){var e=document.querySelector('[data-ssr-shell]');if(e)e.style.display='none';},{once:true});})();`,
                }}
            />
            <ServiceDetailsNoSSR />
        </>
    );
}
