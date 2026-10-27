import { useSyncExternalStore } from 'react';

/**
 * Offers opened during this visit, newest first — sent to /services/recommended so "Polecane" shows similar offers
 * right away (also without an account). Kept only in the page's memory: nothing is written to the device
 * (no cookie / localStorage), it disappears when the page or app is closed.
 */
const MAX = 10;
let viewed: string[] = [];
const listeners = new Set<() => void>();

export function markViewed(publicId: string) {
    if (viewed[0] === publicId) return;
    viewed = [publicId, ...viewed.filter(id => id !== publicId)].slice(0, MAX);
    listeners.forEach(l => l());
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const snapshot = () => viewed;
const serverSnapshot: string[] = [];

export const useRecentlyViewed = () => useSyncExternalStore(subscribe, snapshot, () => serverSnapshot);
