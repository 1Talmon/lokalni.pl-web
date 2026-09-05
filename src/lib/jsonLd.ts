import { BASE_URL } from './seo-data';

type RawService = Record<string, unknown>;
type RawProfile = Record<string, unknown>;

export function buildServiceJsonLd(s: RawService, slug: string) {
    const provider = s.provider as RawProfile | undefined;
    const providerUid = provider?.uid ?? provider?.id;

    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: s.title,
        description: typeof s.description === 'string' ? s.description.slice(0, 500) : undefined,
        url: `${BASE_URL}/service/${slug}`,
        image: s.image || (Array.isArray(s.images) ? s.images[0] : undefined) || undefined,
        offers: s.price ? {
            '@type': 'Offer',
            price: String(s.price),
            priceCurrency: 'PLN',
        } : undefined,
        areaServed: s.city ? { '@type': 'City', name: s.city } : undefined,
        provider: provider ? {
            '@type': 'Person',
            name: provider.name,
            ...(providerUid ? { url: `${BASE_URL}/profile/${providerUid}` } : {}),
        } : undefined,
    };
}

export function buildProfileJsonLd(p: RawProfile, uid: string) {
    const name = [p.imie, p.nazwisko].filter(Boolean).join(' ') || (p.name as string) || 'Specjalista';
    const image = p.profilowe || p.avatar || p.zdjecieTla;

    const jsonLd: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name,
        url: `${BASE_URL}/profile/${uid}`,
        ...(image ? { image } : {}),
        ...(p.bio ? { description: String(p.bio).slice(0, 500) } : {}),
    };

    if (p.avgRating && p.reviewsCount) {
        jsonLd.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: p.avgRating,
            reviewCount: p.reviewsCount,
        };
    }

    return jsonLd;
}
