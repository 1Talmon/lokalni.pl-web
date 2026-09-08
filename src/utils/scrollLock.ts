let _savedScrollY = 0;

export const lockScroll = (): void => {
    _savedScrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--scrollbar-w', `${scrollbarWidth}px`);
    document.documentElement.classList.add('scroll-locked');
    // Web: CSS class applies body{overflow:hidden} + padding-right compensation.
};

export const unlockScroll = (): void => {
    const wasLocked = document.documentElement.classList.contains('scroll-locked');
    document.documentElement.classList.remove('scroll-locked');
    document.documentElement.style.removeProperty('--scrollbar-w');
    if (wasLocked && _savedScrollY > 0) {
        window.scrollTo(0, _savedScrollY);
    }
};
