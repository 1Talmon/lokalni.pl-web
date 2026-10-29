// Where to go back after signing in. Every login gate sends the user to /auth?next=<this page>, the auth page
// returns there after login, registration or a social sign-in. The target is also kept for an hour in
// localStorage, so registering → confirming the e-mail (link opens a new tab) → logging in still lands there.

const ORIGIN = 'https://mylokalni.pl';
const KEY = 'login_next';

/** Same-site path with its query (e.g. /dashboard?tab=orders&bookingId=5), or null — never another host. */
export function safeNext(raw: string | null | undefined): string | null {
    if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.includes('\\')) return null;
    try {
        const u = new URL(raw, ORIGIN);
        if (u.origin !== ORIGIN || u.pathname === '/auth' || u.pathname.startsWith('/auth/')) return null;
        return u.pathname + u.search;
    } catch {
        return null;
    }
}

/** /auth link that brings the user back to `next` (default: the page they're on) after signing in. */
export function loginHref(next?: string | null): string {
    const here = typeof window !== 'undefined' ? window.location.pathname + window.location.search : null;
    const target = safeNext(next ?? here);
    return target && target !== '/' ? `/auth?next=${encodeURIComponent(target)}` : '/auth';
}

export function rememberLoginNext(next: string | null): void {
    if (!next) return;
    try { localStorage.setItem(KEY, JSON.stringify({ next, at: Date.now() })); } catch { /* private mode */ }
}

/** The remembered target (once), if it's under an hour old. */
export function takeLoginNext(): string | null {
    try {
        const raw = localStorage.getItem(KEY);
        localStorage.removeItem(KEY);
        const v = raw ? JSON.parse(raw) as { next?: string; at?: number } : null;
        return v?.next && v.at && Date.now() - v.at < 60 * 60 * 1000 ? safeNext(v.next) : null;
    } catch {
        return null;
    }
}
