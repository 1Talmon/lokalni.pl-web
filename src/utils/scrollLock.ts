let _savedScrollY = 0;
let _pendingUnlock: ReturnType<typeof setTimeout> | null = null;

const cancelPendingUnlock = (): void => {
    if (_pendingUnlock) { clearTimeout(_pendingUnlock); _pendingUnlock = null; }
};

export const lockScroll = (): void => {
    cancelPendingUnlock();
    // Already locked (e.g. a sheet reopened while its delayed unlock was pending): keep the measured scrollbar
    // width and saved position — measuring now would read 0 (scrollbar hidden) and drop the compensation.
    if (document.documentElement.classList.contains('scroll-locked')) return;
    _savedScrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-w', `${scrollbarWidth}px`);
    document.documentElement.classList.add('scroll-locked');
    // Web: CSS class applies body{overflow:hidden} + padding-right compensation.
};

export const unlockScroll = (): void => {
    cancelPendingUnlock();
    const wasLocked = document.documentElement.classList.contains('scroll-locked');
    document.documentElement.classList.remove('scroll-locked');
    document.documentElement.style.removeProperty('--scrollbar-w');
    if (wasLocked && _savedScrollY > 0) {
        window.scrollTo(0, _savedScrollY);
    }
};

/** Unlock after `ms` (e.g. a sheet's exit animation); a lockScroll() in the meantime cancels it. */
export const unlockScrollAfter = (ms: number): void => {
    cancelPendingUnlock();
    _pendingUnlock = setTimeout(() => { _pendingUnlock = null; unlockScroll(); }, ms);
};
