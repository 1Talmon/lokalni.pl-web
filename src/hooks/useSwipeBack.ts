import { useEffect, useRef } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { usePlatform } from './usePlatform';

// Edge-swipe-back for full-page views (not overlay panels).
// Activates only when touch starts within EDGE_WIDTH px from left edge,
// so it never conflicts with vertical page scroll.
const EDGE_WIDTH = 38;

export const useSwipeBack = (isEnabled: boolean, onBack: () => void) => {
    const { isNative } = usePlatform();
    const onBackRef = useRef(onBack);
    useEffect(() => { onBackRef.current = onBack; }, [onBack]);

    useEffect(() => {
        if (!isNative || !isEnabled) return;

        let startX = 0, startY = 0;
        let edgeStart = false;
        let isHoriz = false, decided = false;
        let prevX = 0, prevTime = 0, lastX = 0, lastTime = 0;

        const onStart = (e: TouchEvent) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            edgeStart = startX < EDGE_WIDTH;
            isHoriz = false; decided = false;
            prevX = startX; prevTime = Date.now();
            lastX = startX; lastTime = Date.now();
        };

        const onMove = (e: TouchEvent) => {
            if (!edgeStart) return;
            const cx = e.touches[0].clientX;
            const dx = cx - startX;
            const dy = Math.abs(e.touches[0].clientY - startY);
            if (!decided && (Math.abs(dx) > 4 || dy > 4)) {
                isHoriz = dx > 0 && Math.abs(dx) >= dy * 0.75;
                decided = true;
            }
            if (isHoriz) {
                e.preventDefault();
                prevX = lastX; prevTime = lastTime;
                lastX = cx; lastTime = Date.now();
            }
        };

        const onEnd = () => {
            if (!isHoriz || !edgeStart) return;
            const dx = lastX - startX;
            const dt = lastTime - prevTime;
            const vel = dt > 0 ? (lastX - prevX) / dt : 0;
            if (dx > 60 || vel > 0.3) {
                Haptics.impact({ style: ImpactStyle.Light });
                onBackRef.current();
            }
            isHoriz = false; decided = false; edgeStart = false;
        };

        window.addEventListener('touchstart', onStart, { passive: true });
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd, { passive: true });
        return () => {
            window.removeEventListener('touchstart', onStart);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
        };
    }, [isNative, isEnabled]);
};
