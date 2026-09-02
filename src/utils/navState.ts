import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

const PREFIX = '__navstate__';

export function navPush(router: AppRouterInstance, path: string, state?: Record<string, unknown>): void {
    if (state && typeof window !== 'undefined') {
        sessionStorage.setItem(PREFIX + path, JSON.stringify(state));
    }
    router.push(path);
}

export function readNavState<T = Record<string, unknown>>(path: string): T | null {
    if (typeof window === 'undefined') return null;
    const key = PREFIX + path;
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    sessionStorage.removeItem(key);
    try { return JSON.parse(raw) as T; } catch { return null; }
}
