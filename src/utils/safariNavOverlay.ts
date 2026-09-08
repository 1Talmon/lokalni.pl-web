export const IS_SAFARI_WEB =
    typeof navigator !== 'undefined' && navigator.vendor === 'Apple Computer, Inc.';

export function createSafariOverlay(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.style.cssText =
        'position:fixed;inset:0;background:#fff;z-index:100000;pointer-events:none;';
    document.body.appendChild(overlay);
    return overlay;
}

/**
 * Czeka aż React faktycznie odmontuje trasę (usunie [data-sdv-root] z DOM),
 * następnie ukrywa canvas (GPU punch-through fix) i zanika overlay.
 */
export function revealAfterUnmount(
    overlay: HTMLDivElement,
    sdvRoot: Element | null,
    clearVtRunning = false,
): void {
    const reveal = () => {
        if (clearVtRunning) document.documentElement.classList.remove('vt-running');
        if (!overlay.isConnected) return;
        const canvases = document.querySelectorAll<HTMLElement>('canvas');
        canvases.forEach(c => { c.style.display = 'none'; });
        overlay.style.transition = 'opacity 0.15s ease-out';
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.remove();
            canvases.forEach(c => { c.style.display = ''; });
        }, 170);
    };

    if (sdvRoot) {
        const observer = new MutationObserver(() => {
            if (!sdvRoot.isConnected) {
                observer.disconnect();
                requestAnimationFrame(reveal);
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => { observer.disconnect(); reveal(); }, 600);
    } else {
        requestAnimationFrame(reveal);
    }
}
