import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useMotionValue, useTransform, animate } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { usePlatform } from './usePlatform';

export const useSwipeToClose = (isOpen: boolean, onClose: () => void) => {
    const { isNative } = usePlatform();
    const panelRef = useRef<HTMLDivElement>(null);
    // Start off-screen on native — open animation brings it in via double-rAF
    const panelX = useMotionValue(isNative ? window.innerWidth : 0);
    const backdropOpacity = useTransform(panelX, [0, 300], [1, 0]);
    const onCloseRef = useRef(onClose);

    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    useLayoutEffect(() => {
        if (!isOpen) {
            panelX.set(isNative ? window.innerWidth : 0);
            return;
        }
        if (!isNative) return;
        // Ensure off-screen before animating in
        panelX.set(window.innerWidth);
        let raf2 = 0;
        const raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(() => {
                animate(panelX, 0, { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] });
            });
        });
        return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
    }, [isOpen, isNative, panelX]);

    // Animowane zamknięcie — dla przycisku X na native (żeby nie było exit framer-motion)
    const triggerClose = useCallback(() => {
        if (!isNative) { onCloseRef.current(); return; }
        Haptics.impact({ style: ImpactStyle.Light });
        animate(panelX, window.innerWidth, { duration: 0.18, ease: [0.32, 0.72, 0, 1] }).then(() => {
            onCloseRef.current();
        });
    }, [isNative, panelX]);

    useEffect(() => {
        const el = panelRef.current;
        if (!el || !isNative || !isOpen) return;

        let startX = 0, startY = 0, isHoriz = false, decided = false;
        let prevX = 0, prevTime = 0, lastX = 0, lastTime = 0;

        const onStart = (e: TouchEvent) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isHoriz = false; decided = false;
            prevX = startX; prevTime = Date.now();
            lastX = startX; lastTime = Date.now();
            panelX.stop();
        };

        const onMove = (e: TouchEvent) => {
            const cx = e.touches[0].clientX;
            const dx = cx - startX;
            const dy = Math.abs(e.touches[0].clientY - startY);
            if (!decided && (Math.abs(dx) > 3 || dy > 3)) {
                isHoriz = dx > 0 && Math.abs(dx) >= dy * 0.8;
                decided = true;
            }
            if (isHoriz) {
                e.preventDefault();
                panelX.set(Math.max(0, dx));
                prevX = lastX; prevTime = lastTime;
                lastX = cx; lastTime = Date.now();
            }
        };

        const onEnd = () => {
            if (!isHoriz) return;
            const x = panelX.get();
            const dt = lastTime - prevTime;
            const vel = dt > 0 ? (lastX - prevX) / dt : 0;
            if (x > 55 || vel > 0.3) {
                Haptics.impact({ style: ImpactStyle.Light });
                animate(panelX, window.innerWidth, { duration: 0.18, ease: [0.32, 0.72, 0, 1] }).then(() => {
                    onCloseRef.current();
                });
            } else {
                animate(panelX, 0, { type: 'spring', damping: 40, stiffness: 600 });
            }
            isHoriz = false; decided = false;
        };

        el.addEventListener('touchstart', onStart, { passive: true });
        el.addEventListener('touchmove', onMove, { passive: false });
        el.addEventListener('touchend', onEnd, { passive: true });
        return () => {
            el.removeEventListener('touchstart', onStart);
            el.removeEventListener('touchmove', onMove);
            el.removeEventListener('touchend', onEnd);
        };
    }, [isNative, isOpen, panelX]);

    return { panelRef, panelX, backdropOpacity, isNative, triggerClose };
};
