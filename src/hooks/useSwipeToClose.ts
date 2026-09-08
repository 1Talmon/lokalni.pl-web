import { useEffect, useRef, useCallback } from 'react';
import { useMotionValue, useTransform } from 'framer-motion';

export const useSwipeToClose = (isOpen: boolean, onClose: () => void) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const panelX = useMotionValue(0);
    const backdropOpacity = useTransform(panelX, [0, 300], [1, 0]);
    const onCloseRef = useRef(onClose);

    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    useEffect(() => {
        if (!isOpen) panelX.set(0);
    }, [isOpen, panelX]);

    const triggerClose = useCallback(() => {
        onCloseRef.current();
    }, []);

    return { panelRef, panelX, backdropOpacity, isNative: false as const, triggerClose };
};
