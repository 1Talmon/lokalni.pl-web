import { cache } from 'react';
import { API_URL, parseSlug, CITY_DISPLAY, CITY_LOCATIVE, KEYWORD_DISPLAY } from './seo-data';
import { mapServiceRaw } from './mappers/serviceMapper';
import type { Service } from '../types';

export const PAGE_SIZE = 24;

export type ParsedSlug = ReturnType<typeof parseSlug>;

/** URL keyword slug → API category IDs (exact match on s.category column) */
const SLUG_TO_CATEGORY_IDS: Record<string, string[]> = {
    sprzatanie:   ['cleaning'],
    'dom-ogrod':  ['home'],
    budowa:       ['construction'],
    auto:         ['auto'],
    transport:    ['transport'],
    uroda:        ['beauty'],
    'it-naprawy': ['tech'],
    edukacja:     ['edu'],
    zdrowie:      ['health'],
    zwierzeta:    ['pets'],
    finanse:      ['finance'],
    opieka:       ['care'],
    sztuka:       ['art'],
    eventy:       ['events'],
    inne:         ['garden', 'other'],
};


/** Derive a display city name from a URL slug (e.g. 'nowy-sacz' → 'Nowy Sacz') */
function slugToCity(slug: string): string {
    return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export type FetchParams = {
    categoryIds?: string[] | null;
    city?: string | null;
    query?: string | null;
};

async function fetchOnePage(
    category: string | null,
    city: string | null,
    query: string | null,
    limit: number,
    page: number,
): Promise<{ services: Service[]; total: number }> {
    try {
        const p = new URLSearchParams({ limit: String(limit), sort: 'rating', page: String(page) });
        if (city)          p.set('city', city);
        if (category)      p.set('category', category);
        else if (query)    p.set('query', query);

        const res = await fetch(`${API_URL}/services?${p}`, {
            headers: { 'User-Agent': 'Lokalni-MetaBot/1.0' },
            next: { revalidate: 3600 },
        });
        if (!res.ok) return { services: [], total: 0 };
        const json = await res.json() as Record<string, unknown>;
        const raw = Array.isArray(json) ? json : ((json.data as unknown[]) ?? []);
        const total = (json.meta as Record<string, unknown> | undefined)?.total as number | undefined ?? raw.length;
        return { services: (raw as Record<string, unknown>[]).map(mapServiceRaw), total };
    } catch {
        return { services: [], total: 0 };
    }
}

export const fetchServices = cache(async function fetchServices(
    params: FetchParams,
    page = 1,
    limit = PAGE_SIZE,
): Promise<{ services: Service[]; total: number }> {
    const { categoryIds, city = null, query = null } = params;

    if (!categoryIds || categoryIds.length === 0) {
        return fetchOnePage(null, city, query, limit, page);
    }

    if (categoryIds.length === 1) {
        return fetchOnePage(categoryIds[0], city, query, limit, page);
    }

    // Multiple API categories for one URL slug (e.g. 'inne' → ['garden', 'other'])
    const results = await Promise.all(
        categoryIds.map(cat => fetchOnePage(cat, city, query, limit, page))
    );
    const seen = new Set<string>();
    const services: Service[] = [];
    for (const r of results) {
        for (const s of r.services) {
            const id = s.publicId ?? '';
            if (id && !seen.has(id)) {
                seen.add(id);
                services.push(s);
            }
        }
    }
    services.sort((a, b) => Number(b.rating) - Number(a.rating));
    const total = results.reduce((sum, r) => sum + r.total, 0);
    return { services, total };
});

export function resolveFetchParams(parsed: ParsedSlug): FetchParams {
    switch (parsed.type) {
        case 'keyword': {
            const categoryIds = SLUG_TO_CATEGORY_IDS[parsed.keyword] ?? null;
            if (categoryIds) return { categoryIds, city: null, query: null };
            return { categoryIds: null, city: null, query: KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword.replace(/-/g, ' ') };
        }
        case 'city': {
            const city = CITY_DISPLAY[parsed.citySlug] ?? slugToCity(parsed.citySlug);
            return { categoryIds: null, city, query: null };
        }
        case 'keyword-city': {
            const city = CITY_DISPLAY[parsed.citySlug] ?? slugToCity(parsed.citySlug);
            const categoryIds = SLUG_TO_CATEGORY_IDS[parsed.keyword] ?? null;
            if (categoryIds) return { categoryIds, city, query: null };
            return { categoryIds: null, city, query: KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword.replace(/-/g, ' ') };
        }
        case 'search': {
            const city = parsed.citySlug ? (CITY_DISPLAY[parsed.citySlug] ?? slugToCity(parsed.citySlug)) : null;
            return { categoryIds: null, city, query: parsed.query };
        }
    }
}

export function buildH1(parsed: ParsedSlug): string {
    switch (parsed.type) {
        case 'keyword': return KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword.replace(/-/g, ' ');
        case 'city':    return `Usługi w ${CITY_LOCATIVE[parsed.citySlug] ?? CITY_DISPLAY[parsed.citySlug] ?? slugToCity(parsed.citySlug)}`;
        case 'keyword-city': {
            const kw = KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword.replace(/-/g, ' ');
            const city = CITY_LOCATIVE[parsed.citySlug]
                ? `w ${CITY_LOCATIVE[parsed.citySlug]}`
                : `w ${CITY_DISPLAY[parsed.citySlug] ?? slugToCity(parsed.citySlug)}`;
            return `${kw} ${city}`;
        }
        case 'search': {
            const city = parsed.citySlug ? (CITY_DISPLAY[parsed.citySlug] ?? slugToCity(parsed.citySlug)) : null;
            return city ? `${parsed.query} ${city}` : parsed.query;
        }
    }
}
