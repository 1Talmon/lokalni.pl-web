import { cache } from 'react';
import { API_URL, CATEGORY_SLUG, CITY_LOCATIVE, KEYWORD_DISPLAY } from './seo-data';
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
        author: { ...p.author, profilowe: normalizeMediaUrl(p.author.profilowe) },
    };
}

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

export function categoryLabel(categorySlug: string | null): string | null {
    if (!categorySlug) return null;
    // "Inne" alone reads badly in titles ("Inne w Rowach") — "Inne usługi w Rowach"
    return categorySlug === 'inne' ? 'Inne usługi' : (KEYWORD_DISPLAY[categorySlug] ?? null);
}

/** "w Gdańsku" when the locative is known, otherwise "– Wielki Klincz" (never a guessed declension). */
export function cityPhrase(g: Pick<LandingGroup, 'city' | 'citySlug'>): string {
    if (!g.city || !g.citySlug) return '';
    const loc = CITY_LOCATIVE[g.citySlug];
    return loc ? `w ${loc}` : `– ${g.city}`;
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
