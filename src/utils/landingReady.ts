import { useSyncExternalStore } from 'react';

// "A landing page is still preparing its results" flag. AppShell keeps the full-screen loader up while it is
// set, so the visitor gets the finished page (filtered, scrolled to the offers) when the loader fades —
// not hero → scroll jump → blank gap → cards popping in.
//
// The hold lives here, not in a component: when the app finishes starting, AppShell moves the page into another
// slot of the tree, so SlugContent is unmounted and mounted again (a new instance). The hold must survive that.
let pending = false;
let capTimer: ReturnType<typeof setTimeout> | undefined;
const subs = new Set<() => void>();

function set(value: boolean): void {
    if (pending === value) return;
    pending = value;
    subs.forEach(fn => fn());
}

/** Start holding the loader. `maxMs` is a hard cap so the loader can never get stuck. */
export function holdLanding(maxMs: number): void {
    clearTimeout(capTimer);
    capTimer = setTimeout(() => set(false), maxMs);
    set(true);
}

export function releaseLanding(): void {
    clearTimeout(capTimer);
    set(false);
}

export const isLandingPending = (): boolean => pending;

export function useLandingPending(): boolean {
    return useSyncExternalStore(
        cb => { subs.add(cb); return () => { subs.delete(cb); }; },
        () => pending,
        () => false, // SSR: the loader is already visible through isLoadingApp
    );
}
