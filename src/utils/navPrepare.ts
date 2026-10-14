// Client navigations to a service/profile page that commit only once the page is ready: the old page stays
// on screen with the top progress bar while the route payload, the page data and its main photo load, then
// the new page appears complete in one frame. The white loading overlay is left for slow navigations
// (AppShell). Safari's back-swipe snapshot is taken at pushState, so it also shows the old page, not a loader.

import type { QueryClient } from '@tanstack/react-query';
import type { useRouter } from 'next/navigation';
import { PrefetchKind } from 'next/dist/client/components/router-reducer/router-reducer-types';
import { apiClient } from '../services/apiClient';
import { mapApiService } from '../services/serviceService';
import { authService } from '../services/authService';
import { normalizeMediaUrl } from './normalizeUrl';
import { beginTrackedNav, getNavTarget } from './navRecovery';
import type { Service } from '../types';

/** Upper bound for preparing a page; after it the navigation goes ahead and the overlay covers the rest. */
export const NAV_PREPARE_MAX_MS = 1500;

/** The query the service page reads — prefetched before navigating, the page renders with data on its first frame. */
export const serviceDetailQuery = (publicId: string) => ({
    queryKey: ['service', publicId],
    queryFn: async ({ signal }: { signal?: AbortSignal }): Promise<Service | null> => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);
        signal?.addEventListener('abort', () => controller.abort(), { once: true });
        try {
            const res = await apiClient.get(`/services/${publicId}`, { signal: controller.signal });
            if (res.status === 404) return null;
            if (res.status === 410) return { __deleted: true } as unknown as Service;
            if (!res.ok) throw new Error(`server_${res.status}`);
            const json = await res.json();
            try { return mapApiService(json.data ?? json); } catch { throw new Error('parse_error'); }
        } finally {
            clearTimeout(timeout);
        }
    },
    staleTime: 10 * 60 * 1000,
    retry: false,
});

/** Main photo of the service page (first gallery item) — revealing the page waits until it is decoded. */
export function serviceHeroUrl(service: Service | null | undefined): string | null {
    if (!service || (service as Service & { __deleted?: boolean }).__deleted) return null;
    return service.images?.[0] || service.image || service.videos?.[0]?.thumbnailUrl || null;
}

/** Resolves once the image is decoded, failed or timed out — never rejects. */
export function decodeImage(url: string | null | undefined, maxMs = NAV_PREPARE_MAX_MS): Promise<void> {
    if (!url || typeof Image === 'undefined') return Promise.resolve();
    return new Promise(resolve => {
        const t = setTimeout(resolve, maxMs);
        const done = () => { clearTimeout(t); resolve(); };
        const img = new Image();
        img.src = url;
        img.decode().then(done, done);
    });
}

const capped = (work: Promise<unknown>): Promise<void> => Promise.race([
    work.then(() => undefined, () => undefined),
    new Promise<void>(resolve => setTimeout(resolve, NAV_PREPARE_MAX_MS)),
]);

export function prepareServicePage(queryClient: QueryClient, publicId: string): Promise<void> {
    if (!publicId) return Promise.resolve();
    return capped((async () => {
        const service = await queryClient.fetchQuery(serviceDetailQuery(publicId));
        await decodeImage(serviceHeroUrl(service));
    })());
}

export function prepareProfilePage(queryClient: QueryClient, uid: string): Promise<void> {
    if (!uid) return Promise.resolve();
    return capped((async () => {
        // Same key, fetcher and staleTime as usePublicProfile
        const data = await queryClient.fetchQuery({
            queryKey: ['public-profile', uid],
            queryFn: () => authService.fetchPublicProfile(uid),
            staleTime: 10 * 60 * 1000,
        }) as { profilowe?: string | null; zdjecieTla?: string | null; isPremium?: boolean } | null;
        await Promise.all([
            decodeImage(normalizeMediaUrl(data?.profilowe)),
            decodeImage(data?.isPremium ? data.zdjecieTla : null),
        ]);
    })());
}

let pendingUrl: string | null = null;

/**
 * Tracked navigation (see useNavRecovery) that pushes the route once `prepare` settles. Skipped when the
 * user went elsewhere in the meantime (another card, back, tab switch); a repeated click is ignored.
 */
export function navigateWhenReady(router: ReturnType<typeof useRouter>, url: string, prepare: Promise<void>): void {
    if (pendingUrl === url) return;
    pendingUrl = url;
    const from = window.location.pathname;
    beginTrackedNav(url);
    router.prefetch(url, { kind: PrefetchKind.FULL });
    void prepare.then(() => {
        pendingUrl = null;
        if (getNavTarget() !== url || window.location.pathname !== from) return;
        router.push(url);
    });
}
