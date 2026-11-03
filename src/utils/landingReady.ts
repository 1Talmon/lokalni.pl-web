import { useSyncExternalStore } from 'react';

// "A landing page is still preparing its results" flag. AppShell keeps the full-screen loader up while it is
// set, so the visitor gets the finished page (filtered, scrolled to the offers) when the loader fades —
// not hero → scroll jump → blank gap → cards popping in.
let pending = false;
const subs = new Set<() => void>();

export function setLandingPending(value: boolean): void {
    if (pending === value) return;
    pending = value;
    subs.forEach(fn => fn());
}

export function useLandingPending(): boolean {
    return useSyncExternalStore(
        cb => { subs.add(cb); return () => { subs.delete(cb); }; },
        () => pending,
        () => false, // SSR: the loader is already visible through isLoadingApp
    );
}
