import { Capacitor } from '@capacitor/core';

let _savedScrollY = 0;

// On native iOS the scroll position is stored in the native view, not in
// document.documentElement.scrollTop, so html{overflow:hidden} freezes scroll
// without a position reset — no window.scrollTo restoration needed → no flash.
// On desktop Chrome/Firefox, html{overflow:hidden} resets scrollTop to 0 (jump),
// so we keep the body{position:fixed} approach there.

export const lockScroll = (): void => {
    _savedScrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-w', `${scrollbarWidth}px`);
    document.documentElement.classList.add('scroll-locked');

    if (Capacitor.isNativePlatform()) {
        document.documentElement.style.overflow = 'hidden';
    } else if (_savedScrollY > 0) {
        document.body.style.position = 'fixed';
        document.body.style.top = `-${_savedScrollY}px`;
        document.body.style.width = '100%';
    }
};

export const unlockScroll = (): void => {
    document.documentElement.classList.remove('scroll-locked');
    document.documentElement.style.removeProperty('--scrollbar-w');

    if (Capacitor.isNativePlatform()) {
        document.documentElement.style.overflow = '';
    } else {
        const wasFixed = document.body.style.position === 'fixed';
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        if (wasFixed) {
            window.scrollTo(0, _savedScrollY);
        }
    }
};
