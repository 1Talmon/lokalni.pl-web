import { Capacitor } from '@capacitor/core';

let _savedScrollY = 0;

// On native iOS the scroll position is managed by the native layer — html{overflow:hidden}
// freezes DOM scroll without any position jump.
// On web, body{overflow:hidden} propagates to the viewport (browser quirk: body overflow
// bubbles to viewport when html has no explicit overflow), freezing scroll in place.
// Modern browsers preserve scroll position under overflow:hidden, so position:fixed hack
// is not needed and was removed (it caused reflow issues in Next.js App Router).

export const lockScroll = (): void => {
    _savedScrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-w', `${scrollbarWidth}px`);
    document.documentElement.classList.add('scroll-locked');

    if (Capacitor.isNativePlatform()) {
        document.documentElement.style.overflow = 'hidden';
    }
    // Web: CSS class applies body{overflow:hidden} + padding-right compensation.
    // No position:fixed needed — modern browsers keep scroll position under overflow:hidden.
};

export const unlockScroll = (): void => {
    const wasLocked = document.documentElement.classList.contains('scroll-locked');
    document.documentElement.classList.remove('scroll-locked');
    document.documentElement.style.removeProperty('--scrollbar-w');

    if (Capacitor.isNativePlatform()) {
        document.documentElement.style.overflow = '';
    } else if (wasLocked && _savedScrollY > 0) {
        // Restore scroll only if we actually locked it — prevents spurious
        // window.scrollTo calls from unmount cleanup after scroll is already restored.
        window.scrollTo(0, _savedScrollY);
    }
};
