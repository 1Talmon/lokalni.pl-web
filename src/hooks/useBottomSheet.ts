import { useRef, useEffect, useLayoutEffect, useCallback, type PointerEvent } from 'react';
import { useMotionValue, animate, useTransform, useDragControls, type PanInfo } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export const useBottomSheet = (onClose: () => void, isOpen?: boolean) => {
    const dragControls = useDragControls();
    const y = useMotionValue(window.innerHeight);
    // backdropOpacity: 1 when sheet at rest (y=0), fades to 0 as sheet drags down to half-screen
    const backdropOpacity = useTransform(y, [0, window.innerHeight * 0.5], [1, 0]);
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    // Open animation — runs each time isOpen flips to true
    useLayoutEffect(() => {
        if (!isOpen) return;
        y.set(window.innerHeight);
        const ctrl = animate(y, 0, { type: 'spring', bounce: 0, duration: 0.38 });
        return () => ctrl.stop();
    }, [isOpen, y]);

    const triggerClose = useCallback((releaseVelocity = 0) => {
        if (releaseVelocity > 200) {
            // Flick — spring matching finger velocity, feels like throwing the sheet away
            animate(y, window.innerHeight, {
                type: 'spring',
                velocity: releaseVelocity,
                damping: 32,
                stiffness: 280,
                restDelta: 2,
            }).then(() => onCloseRef.current());
        } else {
            // Button/ESC — smooth ease-out
            animate(y, window.innerHeight, {
                duration: 0.28,
                ease: [0.32, 0.72, 0, 1],
            }).then(() => onCloseRef.current());
        }
    }, [y]);

    const onDragEnd = useCallback((_: unknown, info: PanInfo) => {
        if (info.offset.y > 80 || info.velocity.y > 400) {
            Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
            triggerClose(info.velocity.y);
        }
        // else: dragTransition spring handles snap-back to y=0
    }, [triggerClose]);

    const handleClose = useCallback(() => triggerClose(), [triggerClose]);

    return {
        sheetDragProps: {
            drag: 'y' as const,
            dragControls,
            dragListener: false,
            dragConstraints: { top: 0, bottom: 0 },
            dragElastic: { top: 0.15, bottom: 1 },
            dragTransition: { bounceStiffness: 500, bounceDamping: 50 },
            style: { y },
            onDragEnd,
        },
        backdropOpacity,
        triggerClose,
        handleClose,
        y,
        startDrag: (e: PointerEvent<Element>) => dragControls.start(e),
    };
};
