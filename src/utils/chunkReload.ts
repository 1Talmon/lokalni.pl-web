// Deployment skew: a tab opened before a deploy (or loaded mid-rollout) asks for JS chunks
// that the new deployment no longer has → 404 → ChunkLoadError → error screen.
// Fix: reload once to pick up the new build. Guarded so a genuinely broken deploy can't loop.

const KEY = '__chunk_reload_at__';
const MIN_INTERVAL_MS = 30_000;

export function isChunkLoadError(err: unknown): boolean {
    if (!err || typeof err !== 'object') return false;
    const { name, message } = err as { name?: unknown; message?: unknown };
    if (name === 'ChunkLoadError') return true;
    return typeof message === 'string' && /Loading (CSS )?chunk [\w-]+ failed|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(message);
}

/** True when reloadOnceForChunkError() would reload (not reloaded in the last 30s, storage available). */
export function canReloadForChunkError(): boolean {
    try {
        return Date.now() - Number(sessionStorage.getItem(KEY) || 0) >= MIN_INTERVAL_MS;
    } catch {
        return false;
    }
}

/** Reloads the page if the last chunk-error reload was >30s ago. Returns true when reloading. */
export function reloadOnceForChunkError(): boolean {
    if (!canReloadForChunkError()) return false;
    try {
        sessionStorage.setItem(KEY, String(Date.now()));
    } catch {
        return false; // no storage → can't guard against a loop, don't auto-reload
    }
    window.location.reload();
    return true;
}
