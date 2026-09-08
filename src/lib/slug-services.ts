import { API_URL, parseSlug, CITY_DISPLAY, CITY_LOCATIVE, KEYWORD_DISPLAY } from './seo-data';
import { normalizeMediaUrl } from '../utils/normalizeUrl';
import type { Service } from '../types';

export const PAGE_SIZE = 24;

export type ParsedSlug = ReturnType<typeof parseSlug>;

function mapService(s: Record<string, unknown>): Service {
    const p = (s.provider ?? {}) as Record<string, unknown>;
    return {
        publicId: s.publicId as string,
        title: s.title as string,
        description: (s.description as string) ?? '',
        price: String(s.price ?? 0),
        priceUnit: (s.priceUnit as string) ?? '',
        rating: Number(s.rating) || 0,
        distance: '0',
        city: (s.city as string) ?? '',
        location: s.location as Service['location'],
        category: (s.category as string) ?? '',
        radius: Number(s.radius) || 0,
        type: ((s.type as string) === 'request' ? 'request' : 'offer'),
        isRemote: Boolean(s.isRemote),
        provider: {
            uid: (p.uid as string) ?? '',
            name: `${(p.imie as string) ?? ''} ${(p.nazwisko as string) ?? ''}`.trim(),
            avatar: normalizeMediaUrl(p.profilowe as string | null) ?? '',
            responseRate: '100%',
            isPremium: Boolean(p.isPremium),
        },
        address: (s.address as string) ?? undefined,
        image: normalizeMediaUrl(s.image as string | null) ?? '',
        images: ((s.images as string[]) ?? []).map(u => normalizeMediaUrl(u) ?? u),
        isOnline: Boolean((p as Record<string, unknown>).online),
        deliveryTime: (s.deliveryTime as string) ?? '',
        durationMinutes: (s.durationMinutes as number) ?? 60,
        bookings: Number(s.bookings) || 0,
        isMine: Boolean(s.isMine),
        isFavorite: Boolean(s.isFavorite),
        phoneNumber: '',
        distanceKm: (s.distanceKm as number | null) ?? null,
        views: (s.views as number) ?? 0,
        createdAt: (s.createdAt as string) ?? '',
        videos: (s.videos as Service['videos']) ?? [],
    };
}

export async function fetchServices(
    params: { keyword?: string | null; city?: string | null; citySlug?: string | null; query?: string | null },
    offset = 0,
    limit = PAGE_SIZE,
): Promise<Service[]> {
    try {
        const p = new URLSearchParams({ limit: String(limit), sort: 'rating', offset: String(offset) });

        if (params.city)          p.set('city', params.city);
        else if (params.citySlug) p.set('citySlug', params.citySlug);

        if (params.keyword)      p.set('query', KEYWORD_DISPLAY[params.keyword] ?? params.keyword.replace(/-/g, ' '));
        else if (params.query)   p.set('query', params.query);

        const res = await fetch(`${API_URL}/services?${p}`, {
            headers: { 'User-Agent': 'Lokalni-MetaBot/1.0' },
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const json = await res.json() as Record<string, unknown>;
        const raw = Array.isArray(json) ? json : ((json.data as unknown[]) ?? []);
        return (raw as Record<string, unknown>[]).map(mapService);
    } catch {
        return [];
    }
}

export function resolveFetchParams(parsed: ParsedSlug) {
    switch (parsed.type) {
        case 'keyword':
            return { keyword: parsed.keyword, city: null, citySlug: null, query: null };
        case 'city': {
            const cityDisplay = CITY_DISPLAY[parsed.citySlug];
            return { keyword: null, city: cityDisplay ?? null, citySlug: cityDisplay ? null : parsed.citySlug, query: null };
        }
        case 'keyword-city': {
            const cityDisplay = CITY_DISPLAY[parsed.citySlug];
            return { keyword: parsed.keyword, city: cityDisplay ?? null, citySlug: cityDisplay ? null : parsed.citySlug, query: null };
        }
        case 'search':
            return { keyword: null, city: null, citySlug: parsed.citySlug, query: parsed.query };
    }
}

export function buildH1(parsed: ParsedSlug): string {
    switch (parsed.type) {
        case 'keyword': return KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword.replace(/-/g, ' ');
        case 'city':    return `Usługi w ${CITY_LOCATIVE[parsed.citySlug] ?? CITY_DISPLAY[parsed.citySlug] ?? parsed.citySlug}`;
        case 'keyword-city': {
            const kw = KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword.replace(/-/g, ' ');
            const city = CITY_LOCATIVE[parsed.citySlug]
                ? `w ${CITY_LOCATIVE[parsed.citySlug]}`
                : CITY_DISPLAY[parsed.citySlug] ?? parsed.citySlug.replace(/-/g, ' ');
            return `${kw} ${city}`;
        }
        case 'search': {
            const city = parsed.citySlug ? (CITY_DISPLAY[parsed.citySlug] ?? parsed.citySlug.replace(/-/g, ' ')) : null;
            return city ? `${parsed.query} ${city}` : parsed.query;
        }
    }
}
