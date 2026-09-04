type Direction = 'push' | 'pop';

/**
 * Wraps a navigation call with View Transitions API (Chrome 111+ / Safari 18+).
 * Falls back to plain navigate on Firefox or older browsers.
 * Sets data-nav-dir attribute on <html> for CSS directional animations.
 * Sets vt-running class so ServiceDetailsView's popstate handler bails out (no double overlay).
 */
export function navTransition(direction: Direction, navigate: () => void): void {
    if (typeof document === 'undefined') { navigate(); return; }
    const doc = document as Document & {
        startViewTransition?: (fn: () => void | Promise<void>) => { finished: Promise<void> };
    };
    if (typeof doc.startViewTransition !== 'function') { navigate(); return; }
    document.documentElement.setAttribute('data-nav-dir', direction);
    document.documentElement.classList.add('vt-running');
    const vt = doc.startViewTransition(navigate);
    vt.finished.finally(() => {
        document.documentElement.removeAttribute('data-nav-dir');
        document.documentElement.classList.remove('vt-running');
    });
}
