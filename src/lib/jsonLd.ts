import { BASE_URL, CATEGORY_SLUG, KEYWORD_DISPLAY } from './seo-data';

type RawService = Record<string, unknown>;
type RawProfile = Record<string, unknown>;

export function buildServiceJsonLd(s: RawService, slug: string) {
    const provider = s.provider as RawProfile | undefined;
    const providerUid = provider?.uid ?? provider?.id;
    const catSlug = typeof s.category === 'string' ? (CATEGORY_SLUG[s.category] ?? null) : null;
    const catLabel = catSlug ? (KEYWORD_DISPLAY[catSlug] ?? catSlug) : null;

    const serviceJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: s.title,
        description: typeof s.description === 'string' ? s.description.slice(0, 500) : undefined,
        url: `${BASE_URL}/service/${slug}`,
        image: s.ogImage || s.image || (Array.isArray(s.images) ? s.images[0] : undefined) || undefined,
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

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Strona główna', item: BASE_URL },
            ...(catSlug && catLabel ? [{ '@type': 'ListItem', position: 2, name: catLabel, item: `${BASE_URL}/${catSlug}` }] : []),
            { '@type': 'ListItem', position: catSlug ? 3 : 2, name: String(s.title ?? ''), item: `${BASE_URL}/service/${slug}` },
        ],
    };

    return [serviceJsonLd, breadcrumbJsonLd];
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
