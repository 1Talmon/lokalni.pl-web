// Tracks the in-flight client navigation to a service/profile page so AppShell can
// recover it if the router transition never commits (see useNavRecovery).
// sessionStorage survives the one-time hard reload the watchdog may perform.

const TARGET_KEY = '__nav_target__';
const STARTED_KEY = '__nav_started__';
const RELOADED_KEY = '__nav_reloaded__';

function read(key: string): string | null {
    try { return sessionStorage.getItem(key); } catch { return null; }
}
function write(key: string, value: string): void {
    try { sessionStorage.setItem(key, value); } catch { /* private mode / storage blocked */ }
}
function remove(key: string): void {
    try { sessionStorage.removeItem(key); } catch { /* ignore */ }
}

/** Call right before router.push() to a page that shows the nav loading overlay. */
export function beginTrackedNav(url: string): void {
    write(TARGET_KEY, url);
    write(STARTED_KEY, String(Date.now()));
}

export function getNavTarget(): string | null {
    return read(TARGET_KEY);
}

export function getNavElapsedMs(): number {
    const started = Number(read(STARTED_KEY));
    return started > 0 ? Date.now() - started : 0;
}

export function endTrackedNav(): void {
    remove(TARGET_KEY);
    remove(STARTED_KEY);
}

export function wasHardNavAttempted(target: string): boolean {
    return read(RELOADED_KEY) === target;
}
export function markHardNavAttempt(target: string): void {
    write(RELOADED_KEY, target);
}
export function clearHardNavAttempt(): void {
    remove(RELOADED_KEY);
}

export type NavIssueKind = 'nudge_recovered' | 'hard_nav' | 'gave_up';

/** Fire-and-forget telemetry → /api/client-event → CF Pages Functions logs. */
export function reportNavIssue(kind: NavIssueKind, path: string, ms: number): void {
    try {
        const body = JSON.stringify({ kind, path: path.slice(0, 200), ms: Math.round(ms) });
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/client-event', new Blob([body], { type: 'application/json' }));
        } else {
            void fetch('/api/client-event', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
        }
    } catch { /* telemetry must never break navigation */ }
}
