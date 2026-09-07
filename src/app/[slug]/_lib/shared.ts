import {
    API_URL,
    parseSlug,
    CITY_DISPLAY, CITY_LOCATIVE, KEYWORD_DISPLAY,
} from '@/lib/seo-data';

export const PAGE_SIZE = 24;

export type ParsedSlug = ReturnType<typeof parseSlug>;

export async function fetchServices(
    params: { keyword?: string | null; city?: string | null; citySlug?: string | null; query?: string | null },
    offset = 0,
    limit = PAGE_SIZE,
): Promise<Record<string, unknown>[]> {
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
        const json = await res.json();
        return Array.isArray(json) ? json : (json.data ?? []);
    } catch {
        return [];
    }
}

export function resolveFetchParams(parsed: ParsedSlug) {
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

export function buildH1(parsed: ParsedSlug): string {
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
