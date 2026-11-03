import { cache } from 'react';
import { API_URL, CATEGORY_SLUG, CITY_LOCATIVE, KEYWORD_DISPLAY, inLocative } from './seo-data';
import { mapServiceRaw } from './mappers/serviceMapper';
import { normalizeMediaUrl } from '../utils/normalizeUrl';
import { polishPlural } from '../utils/helpers';
import { ssrHeaders } from './ssrHeaders';
import type { Service } from '../types';

// Server-side data for SEO pages (home, landings, posts). Everything comes from the API's
// /public/* endpoints, which only return real, publicly visible data — no templated groups.

/** Cache tag revalidated by /api/revalidate when the API reports a change. */
export const SEO_TAG = 'seo';
const fetchInit = () => ({
    headers: ssrHeaders(),
    next: { revalidate: 300, tags: [SEO_TAG] },
});

export type LandingType = 'category' | 'city' | 'category-city';

export interface LandingGroup {
    slug: string;
    type: LandingType;
    categorySlug: string | null;
    city: string | null;
    citySlug: string | null;
    count: number;
    lastmod: string;
}

export interface PublicPost {
    id: number;
    slug: string;
    content: string;
    image: string | null;
    video: string | null;
    indexable: boolean;
    createdAt: string;
    updatedAt: string;
    author: { uid: string; imie: string; nazwisko: string; profilowe: string | null };
}

export interface PostDetail extends PublicPost {
    services: { publicId: string; slug: string; title: string; city: string | null; category: string; categorySlug: string | null }[];
    landings: LandingGroup[];
}

export interface LandingData {
    group: LandingGroup;
    services: Service[];
    posts: PublicPost[];
    total: number;
}

/** Thrown on API failure — page renders 500 (retry later) instead of a 404 that would deindex it. */
export class SeoApiError extends Error {}

/** API statuses meaning the page is really gone (missing, malformed id, deleted/banned → 410). Anything else
 * that isn't ok (a bot challenge 403, 429, 5xx) is temporary and must not turn a live page into a 404. */
export const isGoneStatus = (status: number) => status === 400 || status === 404 || status === 410;

async function getJson<T>(path: string): Promise<T | null> {
    let res: Response;
    try {
        res = await fetch(`${API_URL}${path}`, fetchInit());
    } catch (e) {
        throw new SeoApiError(`fetch ${path}: ${String(e)}`);
    }
    if (res.status === 404) return null;
    if (!res.ok) throw new SeoApiError(`fetch ${path}: HTTP ${res.status}`);
    return await res.json() as T;
}

function mapPost<T extends PublicPost>(p: T): T {
    return {
        ...p,
        image: normalizeMediaUrl(p.image),
        video: normalizeMediaUrl(p.video),
        author: { ...p.author, profilowe: normalizeMediaUrl(p.author.profilowe) },
    };
}

/**
 * A landing is indexed and in the sitemap as soon as it lists at least one offer (owner's decision 26.10.2026:
 * early local visibility matters more than the thin-page risk). Empty landings stay `noindex, follow`.
 */
export const MIN_INDEXABLE_OFFERS: Record<LandingType, number> = { category: 1, city: 1, 'category-city': 1 };
export const isIndexableLanding = (g: Pick<LandingGroup, 'type' | 'count'>, total = g.count) => total >= MIN_INDEXABLE_OFFERS[g.type];

export const fetchLandingGroups = cache(async (): Promise<LandingGroup[]> => {
    const json = await getJson<{ data: LandingGroup[] }>('/public/landings');
    return json?.data ?? [];
});

export const fetchLanding = cache(async (slug: string): Promise<LandingData | null> => {
    if (!/^[a-z0-9-]{1,120}$/.test(slug)) return null;
    const json = await getJson<{ group: LandingGroup; services: Record<string, unknown>[]; posts: PublicPost[]; meta: { total: number } }>(
        `/public/landings/${slug}?limit=24`,
    );
    if (!json) return null;
    return {
        group: json.group,
        services: json.services.map(mapServiceRaw),
        posts: json.posts.map(mapPost),
        total: json.meta.total,
    };
});

export const fetchLatestServices = cache(async (limit = 12): Promise<{ services: Service[]; total: number }> => {
    const json = await getJson<{ data: Record<string, unknown>[]; meta: { total: number } }>(`/services?sort=newest&limit=${limit}`);
    return { services: (json?.data ?? []).map(mapServiceRaw), total: json?.meta.total ?? 0 };
});

export const fetchProviderServices = cache(async (uid: string): Promise<Service[]> => {
    const json = await getJson<{ data: Record<string, unknown>[] }>(`/services?uid=${encodeURIComponent(uid)}&sort=newest&limit=50`);
    return (json?.data ?? []).map(mapServiceRaw);
});

export const fetchPosts = cache(async (page = 1, limit = 20, uid?: string): Promise<{ posts: PublicPost[]; total: number; pages: number }> => {
    const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (uid) qs.set('uid', uid);
    const json = await getJson<{ data: PublicPost[]; meta: { total: number; pages: number } }>(`/public/posts?${qs}`);
    return { posts: (json?.data ?? []).map(mapPost), total: json?.meta.total ?? 0, pages: json?.meta.pages ?? 0 };
});

export const fetchPost = cache(async (slug: string): Promise<PostDetail | null> => {
    const id = slug.split('-').pop() ?? '';
    if (!/^\d{1,18}$/.test(id)) return null;
    const json = await getJson<PostDetail>(`/public/posts/${id}`);
    return json ? mapPost(json) : null;
});

// ─── Polish copy built from real data ────────────────────────────────────────

export const offersLabel = (n: number) => `${n} ${polishPlural(n, 'oferta', 'oferty', 'ofert')}`;

export interface PriceRange { unit: string; min: number; max: number; count: number }

/**
 * Price ranges per unit ("za usługę", "za godzinę"…) from real offers. Units are never mixed:
 * 50 zł per hour and 400 zł per service are not comparable. Most common unit first.
 */
export function priceSummary(services: Pick<Service, 'price' | 'priceUnit'>[]): PriceRange[] {
    const byUnit = new Map<string, PriceRange>();
    for (const s of services) {
        const p = parseFloat(s.price);
        if (!(p > 0)) continue;
        const unit = s.priceUnit?.trim() || 'za usługę';
        const cur = byUnit.get(unit);
        if (cur) { cur.min = Math.min(cur.min, p); cur.max = Math.max(cur.max, p); cur.count += 1; }
        else byUnit.set(unit, { unit, min: p, max: p, count: 1 });
    }
    return [...byUnit.values()].sort((a, b) => b.count - a.count || a.unit.localeCompare(b.unit, 'pl'));
}

const formatZl = (n: number) => `${n.toLocaleString('pl-PL', { maximumFractionDigits: 2 })} zł`;

/** "150–700 zł" or "400 zł" when every offer has the same price. */
export const formatPriceRange = (r: Pick<PriceRange, 'min' | 'max'>) =>
    r.min === r.max ? formatZl(r.min) : `${formatZl(r.min).replace(' zł', '')}–${formatZl(r.max)}`;

export interface ProviderCount { uid: string; name: string; count: number }

/** Providers of the given offers with their offer counts, most offers first. */
export function providerSummary(services: Pick<Service, 'provider'>[]): ProviderCount[] {
    const byUid = new Map<string, ProviderCount>();
    for (const s of services) {
        const uid = s.provider?.uid;
        if (!uid) continue;
        const cur = byUid.get(uid);
        if (cur) cur.count += 1;
        else byUid.set(uid, { uid, name: s.provider.name || 'Specjalista', count: 1 });
    }
    return [...byUid.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'pl'));
}

export function categoryLabel(categorySlug: string | null): string | null {
    if (!categorySlug) return null;
    // "Inne" alone reads badly in titles ("Inne w Rowach") — "Inne usługi w Rowach"
    return categorySlug === 'inne' ? 'Inne usługi' : (KEYWORD_DISPLAY[categorySlug] ?? null);
}

/** "w Gdańsku" when the locative is known, otherwise "– Wielki Klincz" (never a guessed declension). */
export function cityPhrase(g: Pick<LandingGroup, 'city' | 'citySlug'>): string {
    if (!g.city || !g.citySlug) return '';
    const loc = CITY_LOCATIVE[g.citySlug];
    return loc ? inLocative(loc) : `– ${g.city}`;
}

export function landingH1(g: LandingGroup): string {
    const cat = categoryLabel(g.categorySlug);
    switch (g.type) {
        case 'category':      return `${cat} – lokalni specjaliści`;
        case 'city':          return `Usługi ${cityPhrase(g)}`;
        case 'category-city': return `${cat} ${cityPhrase(g)}`;
    }
}

/** DB category key for the client-side HomeView filter ('inne' covers garden+other → 'other'). */
export function categoryIdForSlug(categorySlug: string | null): string | null {
    if (!categorySlug) return null;
    const keys = Object.keys(CATEGORY_SLUG).filter(k => CATEGORY_SLUG[k] === categorySlug);
    return keys.includes('other') ? 'other' : (keys[0] ?? null);
}

export function postTitle(content: string, max = 70): string {
    const firstLine = content.trim().split(/\n+/)[0] ?? '';
    const sentence = firstLine.split(/(?<=[.!?])\s/)[0] ?? firstLine;
    return sentence.length > max ? `${sentence.slice(0, max).replace(/\s+\S*$/, '')}…` : sentence;
}

export function postExcerpt(content: string, max = 155): string {
    const flat = content.replace(/\s+/g, ' ').trim();
    return flat.length > max ? `${flat.slice(0, max).replace(/\s+\S*$/, '')}…` : flat;
}

export const authorName = (a: PublicPost['author']) => [a.imie, a.nazwisko].filter(Boolean).join(' ') || 'Specjalista';

export function formatDatePl(iso: string): string {
    return new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' });
}

/** Short link text for a landing group (chips, related links). */
export function landingLinkLabel(g: LandingGroup): string {
    if (g.type === 'category') return categoryLabel(g.categorySlug) ?? g.slug;
    if (g.type === 'city') return g.city ?? g.slug;
    return landingH1(g);
}

/** Social preview image for a list of services: the API stores a JPEG twin "<file>_og.jpg" for every
 * uploaded WebP (Facebook/WhatsApp don't render WebP previews reliably). */
export function servicesOgImage(services: Service[]): string | null {
    const img = services.find(s => s.image)?.image;
    return img ? img.replace(/\.webp$/, '_og.jpg') : null;
}
