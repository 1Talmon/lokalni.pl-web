'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutGrid, ChevronLeft, ChevronRight, Play, Film } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar } from '@capacitor/status-bar';
import { usePlatform } from '../../hooks/usePlatform';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import type { ChatMediaItem } from './ChatMediaGallery';

interface ClientPhotosModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: ChatMediaItem[];
    initialIndex?: number;
    startInGrid?: boolean;
    onViewChange?: (v: 'carousel' | 'grid') => void;
    registerToggle?: React.MutableRefObject<(() => void) | null>;
    hideControls?: boolean;
    showCloseOnNative?: boolean;
}

const DOTS_THRESHOLD = 10;

function rubberBand(x: number, min: number, max: number): number {
    if (x >= min && x <= max) return x;
    if (x < min) return min - (min - x) * 0.3;
    return max + (x - max) * 0.3;
}

export const ClientPhotosModal = ({
    isOpen,
    onClose,
    items,
    initialIndex = 0,
    startInGrid = false,
    onViewChange,
    registerToggle,
    hideControls = false,
    showCloseOnNative = false,
}: ClientPhotosModalProps) => {
    const { isNative } = usePlatform();
    const safeBottom = 'env(safe-area-inset-bottom)';
    const slideBottomPad = items.length <= DOTS_THRESHOLD
        ? `calc(${safeBottom} + 4.5rem)`
        : `calc(${safeBottom} + 5.5rem)`;

    const [view, setView] = useState<'carousel' | 'grid'>(startInGrid ? 'grid' : 'carousel');
    const [current, setCurrent] = useState(initialIndex);
    const [dir, setDir] = useState(0);
    const [isImgLoaded, setIsImgLoaded] = useState(false);
    const [videoReady, setVideoReady] = useState(false);

    const currentItem = items[current];
    const isVideo = currentItem?.type === 'video';

    // Pinch-to-zoom state
    const [scale, setScale] = useState(1);
    const [imgOffset, setImgOffset] = useState({ x: 0, y: 0 });
    const scaleRef = useRef(1);
    const imgOffsetRef = useRef({ x: 0, y: 0 });
    const pinchStartDist = useRef<number | null>(null);
    const pinchStartScaleRef = useRef(1);
    const pinchStartImgOffsetRef = useRef({ x: 0, y: 0 });
    const pinchCenterRef = useRef<{ x: number; y: number } | null>(null);
    const containerRectRef = useRef<{ cx: number; cy: number; w: number; h: number } | null>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const imgSizeRef = useRef<{ w: number; h: number } | null>(null);
    const panStartPos = useRef<{ x: number; y: number } | null>(null);
    const wasPinchingRef = useRef(false);

    const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

    const swipeDownRef = useRef<{ startY: number; startX: number } | null>(null);
    const [swipeDownY, setSwipeDownY] = useState(0);
    const [isSnappingBack, setIsSnappingBack] = useState(false);
    const [isImgSpringBack, setIsImgSpringBack] = useState(false);
    const [isDoubleTapZoom, setIsDoubleTapZoom] = useState(false);
    const isDraggingDownRef = useRef(false);

    const thumbStripRef = useRef<HTMLDivElement>(null);
    const gridScrollRef = useRef<HTMLDivElement>(null);

    const resetZoom = useCallback(() => {
        scaleRef.current = 1;
        imgOffsetRef.current = { x: 0, y: 0 };
        setScale(1);
        setImgOffset({ x: 0, y: 0 });
    }, []);

    const clampOffset = useCallback((ox: number, oy: number, s: number, cw: number, ch: number): { x: number; y: number } => {
        const size = imgSizeRef.current;
        if (!size) return { x: ox, y: oy };
        const maxX = Math.max(0, (size.w * s - cw) / 2);
        const maxY = Math.max(0, (size.h * s - ch) / 2);
        return {
            x: Math.max(-maxX, Math.min(maxX, ox)),
            y: Math.max(-maxY, Math.min(maxY, oy)),
        };
    }, []);

    const softClampOffset = useCallback((ox: number, oy: number, s: number, cw: number, ch: number): { x: number; y: number } => {
        const size = imgSizeRef.current;
        if (!size) return { x: ox, y: oy };
        const maxX = Math.max(0, (size.w * s - cw) / 2);
        const maxY = Math.max(0, (size.h * s - ch) / 2);
        return {
            x: rubberBand(ox, -maxX, maxX),
            y: rubberBand(oy, -maxY, maxY),
        };
    }, []);

    useEffect(() => {
        if (isOpen) {
            setCurrent(initialIndex);
            setView(startInGrid ? 'grid' : 'carousel');
            setDir(0);
            resetZoom();
            wasPinchingRef.current = false;
            setSwipeDownY(0);
            isDraggingDownRef.current = false;
            setVideoReady(false);
        }
    }, [isOpen, initialIndex, startInGrid, resetZoom]);

    useEffect(() => {
        if (!isNative || !isOpen) return;
        StatusBar.hide().catch(() => {});
        return () => { StatusBar.show().catch(() => {}); };
    }, [isOpen, isNative]);

    useEffect(() => {
        if (!isOpen) return;
        lockScroll();
        return () => unlockScroll();
    }, [isOpen]);

    useEffect(() => {
        imgSizeRef.current = null;
        resetZoom();
        setIsImgLoaded(false);
        setVideoReady(false);
        videoRef.current?.pause();
    }, [current, resetZoom]);

    useEffect(() => { onViewChange?.(view); }, [view, onViewChange]);

    useEffect(() => {
        if (!registerToggle) return;
        registerToggle.current = () => setView(p => p === 'carousel' ? 'grid' : 'carousel');
        return () => { registerToggle.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const strip = thumbStripRef.current;
        if (!strip) return;
        const thumbCenter = 24 + current * 54 + 23;
        strip.scrollTo({ left: Math.max(0, thumbCenter - strip.clientWidth / 2), behavior: 'smooth' });
    }, [current]);

    const go = useCallback((step: number) => {
        videoRef.current?.pause();
        setDir(step);
        setCurrent(prev => (prev + step + items.length) % items.length);
        resetZoom();
        if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }, [items.length, isNative, resetZoom]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { onClose(); return; }
            if (view === 'carousel') {
                if (e.key === 'ArrowRight') go(1);
                if (e.key === 'ArrowLeft') go(-1);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, view, go, onClose]);

    const openAt = (idx: number) => {
        setDir(0);
        setCurrent(idx);
        setView('carousel');
    };

    // ── Pinch zoom & pan ──────────────────────────────────────────────────────

    const onImgTouchStart = useCallback((e: React.TouchEvent) => {
        const domRect = e.currentTarget.getBoundingClientRect();
        containerRectRef.current = {
            cx: domRect.left + domRect.width / 2,
            cy: domRect.top + domRect.height / 2,
            w: domRect.width,
            h: domRect.height,
        };
        if (e.touches.length === 2) {
            wasPinchingRef.current = true;
            isDraggingDownRef.current = false;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            pinchStartDist.current = Math.sqrt(dx * dx + dy * dy);
            pinchStartScaleRef.current = scaleRef.current;
            pinchStartImgOffsetRef.current = { ...imgOffsetRef.current };
            pinchCenterRef.current = {
                x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
                y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
            };
        } else if (e.touches.length === 1 && scaleRef.current > 1) {
            panStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    }, []);

    const onImgTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 2 && pinchStartDist.current !== null && pinchCenterRef.current && containerRectRef.current) {
            e.stopPropagation();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const rawScale = pinchStartScaleRef.current * (dist / pinchStartDist.current);
            const newScale = rubberBand(rawScale, 1, 5);
            const { cx, cy, w, h } = containerRectRef.current;
            const px = pinchCenterRef.current.x - cx;
            const py = pinchCenterRef.current.y - cy;
            const scaleFactor = newScale / pinchStartScaleRef.current;
            const rawOffsetX = px + (pinchStartImgOffsetRef.current.x - px) * scaleFactor;
            const rawOffsetY = py + (pinchStartImgOffsetRef.current.y - py) * scaleFactor;
            const soft = softClampOffset(rawOffsetX, rawOffsetY, newScale, w, h);
            scaleRef.current = newScale;
            imgOffsetRef.current = soft;
            setScale(newScale);
            setImgOffset(soft);
        } else if (e.touches.length === 1 && scaleRef.current > 1 && panStartPos.current) {
            e.stopPropagation();
            const dx = e.touches[0].clientX - panStartPos.current.x;
            const dy = e.touches[0].clientY - panStartPos.current.y;
            panStartPos.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            const cr = containerRectRef.current;
            const soft = softClampOffset(
                imgOffsetRef.current.x + dx,
                imgOffsetRef.current.y + dy,
                scaleRef.current,
                cr?.w ?? window.innerWidth,
                cr?.h ?? window.innerHeight,
            );
            imgOffsetRef.current = soft;
            setImgOffset(soft);
        }
    }, [softClampOffset]);

    const onImgTouchEnd = useCallback((e: React.TouchEvent) => {
        if (e.touches.length < 2) pinchStartDist.current = null;
        if (e.touches.length === 0) {
            panStartPos.current = null;
            const cr = containerRectRef.current;
            const targetScale = Math.max(1, Math.min(5, scaleRef.current));
            const targetOffset = clampOffset(
                imgOffsetRef.current.x,
                imgOffsetRef.current.y,
                targetScale,
                cr?.w ?? window.innerWidth,
                cr?.h ?? window.innerHeight,
            );
            const needsSnap =
                Math.abs(targetScale - scaleRef.current) > 0.001 ||
                Math.abs(targetOffset.x - imgOffsetRef.current.x) > 0.5 ||
                Math.abs(targetOffset.y - imgOffsetRef.current.y) > 0.5;
            if (needsSnap) {
                setIsImgSpringBack(true);
                scaleRef.current = targetScale;
                imgOffsetRef.current = targetOffset;
                setScale(targetScale);
                setImgOffset(targetOffset);
                setTimeout(() => setIsImgSpringBack(false), 420);
            } else if (scaleRef.current <= 1.05) {
                resetZoom();
            }
            setTimeout(() => { wasPinchingRef.current = false; }, 150);
        }
    }, [resetZoom, clampOffset]);

    // ── Double-tap to zoom ────────────────────────────────────────────────────

    const onImgTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (wasPinchingRef.current) return;
        const now = Date.now();
        const clientX = 'touches' in e ? e.changedTouches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.changedTouches[0].clientY : e.clientY;
        const last = lastTapRef.current;
        if (last && now - last.time < 300 && Math.abs(clientX - last.x) < 40 && Math.abs(clientY - last.y) < 40) {
            lastTapRef.current = null;
            setIsDoubleTapZoom(true);
            setTimeout(() => setIsDoubleTapZoom(false), 420);
            if (scaleRef.current > 1) {
                resetZoom();
            } else {
                const newScale = 2.5;
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const px = clientX - cx;
                const py = clientY - cy;
                const scaleFactor = newScale / scaleRef.current;
                const rawOffsetX = px + (imgOffsetRef.current.x - px) * scaleFactor;
                const rawOffsetY = py + (imgOffsetRef.current.y - py) * scaleFactor;
                const clamped = clampOffset(rawOffsetX, rawOffsetY, newScale, rect.width, rect.height);
                scaleRef.current = newScale;
                imgOffsetRef.current = clamped;
                setScale(newScale);
                setImgOffset(clamped);
            }
        } else {
            lastTapRef.current = { time: now, x: clientX, y: clientY };
        }
    }, [resetZoom, clampOffset]);

    // ── Swipe down to close ───────────────────────────────────────────────────

    const onWrapperTouchStart = useCallback((e: React.TouchEvent) => {
        if (scaleRef.current > 1 || e.touches.length > 1 || wasPinchingRef.current) return;
        if (view === 'grid' && (gridScrollRef.current?.scrollTop ?? 0) > 4) return;
        swipeDownRef.current = { startY: e.touches[0].clientY, startX: e.touches[0].clientX };
        isDraggingDownRef.current = false;
    }, [view]);

    const onWrapperTouchMove = useCallback((e: React.TouchEvent) => {
        if (!swipeDownRef.current || scaleRef.current > 1 || e.touches.length > 1) return;
        const dy = e.touches[0].clientY - swipeDownRef.current.startY;
        const dx = Math.abs(e.touches[0].clientX - swipeDownRef.current.startX);
        if (dy > 12 && dy > dx * 1.5) {
            isDraggingDownRef.current = true;
            setSwipeDownY(dy);
        }
    }, []);

    const onWrapperTouchEnd = useCallback(() => {
        if (isDraggingDownRef.current && swipeDownY > 90) {
            if (isNative) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
            onClose();
        } else if (swipeDownY > 0) {
            setIsSnappingBack(true);
            setSwipeDownY(0);
            setTimeout(() => setIsSnappingBack(false), 350);
        }
        isDraggingDownRef.current = false;
        swipeDownRef.current = null;
    }, [swipeDownY, onClose, isNative]);

    useEffect(() => {
        if (view !== 'grid') return;
        const el = gridScrollRef.current;
        if (!el) return;
        let startY = 0;
        let startX = 0;
        const onStart = (e: TouchEvent) => {
            if (e.touches.length > 1) return;
            startY = e.touches[0].clientY;
            startX = e.touches[0].clientX;
        };
        const onMove = (e: TouchEvent) => {
            if (e.touches.length > 1 || el.scrollTop > 4) return;
            const dy = e.touches[0].clientY - startY;
            const dx = Math.abs(e.touches[0].clientX - startX);
            if (dy > 12 && dy > dx * 1.5) e.preventDefault();
        };
        el.addEventListener('touchstart', onStart, { passive: true });
        el.addEventListener('touchmove', onMove, { passive: false });
        return () => {
            el.removeEventListener('touchstart', onStart);
            el.removeEventListener('touchmove', onMove);
        };
    }, [view]);

    const closeOpacity = Math.max(0.3, 1 - swipeDownY / 250);
    const closeScale = Math.max(0.88, 1 - swipeDownY / 1200);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-[100000]"
                    onTouchStart={e => e.stopPropagation()}
                    onTouchMove={e => e.stopPropagation()}
                    onTouchEnd={e => e.stopPropagation()}
                >
                <div
                    className="flex flex-col bg-slate-950 w-full h-full relative"
                    style={(swipeDownY > 0 || isSnappingBack) ? {
                        opacity: closeOpacity,
                        transform: `translateY(${swipeDownY}px) scale(${closeScale})`,
                        transformOrigin: 'top center',
                        transition: isSnappingBack ? 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.25s ease' : 'none',
                    } : undefined}
                    onTouchStart={onWrapperTouchStart}
                    onTouchMove={onWrapperTouchMove}
                    onTouchEnd={onWrapperTouchEnd}
                >
                    {isNative ? (
                        <div className="shrink-0" style={{ height: '20vh' }}>
                            <div
                                className="relative flex items-center justify-between px-4 pb-2"
                                style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' }}
                            >
                                <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-12 h-1.5 bg-white/25 rounded-full pointer-events-none" />
                                <span className="text-white/50 text-sm tabular-nums min-w-[48px] h-10 flex items-center">
                                    {view === 'carousel'
                                        ? items.length > 1 && <><span className="text-white font-semibold">{current + 1}</span>{' '}/ {items.length}</>
                                        : <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">{items.length} {items.length === 1 ? 'medium' : 'mediów'}</span>
                                    }
                                </span>
                                <div className="w-10 h-10 flex items-center justify-center">
                                    {showCloseOnNative && (
                                        <button
                                            onClick={onClose}
                                            className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90"
                                            aria-label="Zamknij"
                                        >
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="relative flex items-center justify-between px-4 pt-5 pb-2 shrink-0">
                            <span className="text-white/50 text-sm tabular-nums min-w-[48px]">
                                {view === 'carousel'
                                    ? items.length > 1 && <><span className="text-white font-semibold">{current + 1}</span> / {items.length}</>
                                    : <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">{items.length} mediów</span>
                                }
                            </span>
                            {!hideControls && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setView(v => v === 'carousel' ? 'grid' : 'carousel')}
                                        className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90"
                                        aria-label={view === 'grid' ? 'Widok pojedynczy' : 'Widok siatki'}
                                    >
                                        <LayoutGrid size={18} />
                                    </button>
                                    <button
                                        onClick={onClose}
                                        className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90"
                                        aria-label="Zamknij"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 overflow-hidden relative">
                        <AnimatePresence mode="wait">
                            {view === 'carousel' ? (
                                <motion.div
                                    key="carousel"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    {items.length > 1 && (
                                        <>
                                            <button
                                                onClick={() => go(-1)}
                                                className="hidden md:flex absolute left-3 z-20 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 items-center justify-center text-white transition-all border border-white/10 active:scale-90"
                                            >
                                                <ChevronLeft size={22} />
                                            </button>
                                            <button
                                                onClick={() => go(1)}
                                                className="hidden md:flex absolute right-3 z-20 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 items-center justify-center text-white transition-all border border-white/10 active:scale-90"
                                            >
                                                <ChevronRight size={22} />
                                            </button>
                                        </>
                                    )}

                                    <AnimatePresence initial={false} custom={dir}>
                                        <motion.div
                                            key={current}
                                            custom={dir}
                                            initial={{ opacity: 0, x: dir > 0 ? 60 : -60 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: dir > 0 ? -60 : 60 }}
                                            transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
                                            drag={scaleRef.current <= 1 && !isDraggingDownRef.current ? 'x' : false}
                                            dragConstraints={{ left: 0, right: 0 }}
                                            dragElastic={0.25}
                                            onDragEnd={(_, info) => {
                                                if (wasPinchingRef.current) return;
                                                if (info.offset.x < -50 || info.velocity.x < -400) go(1);
                                                else if (info.offset.x > 50 || info.velocity.x > 400) go(-1);
                                            }}
                                            className="absolute inset-0 flex items-center justify-center p-4 md:px-20 select-none"
                                            style={{
                                                touchAction: isVideo ? 'pan-y' : 'none',
                                                cursor: !isVideo && scaleRef.current > 1 ? 'grab' : 'default',
                                                paddingBottom: slideBottomPad,
                                            }}
                                            onTouchStart={!isVideo ? onImgTouchStart : undefined}
                                            onTouchMove={!isVideo ? onImgTouchMove : undefined}
                                            onTouchEnd={!isVideo ? onImgTouchEnd : undefined}
                                            onClick={!isVideo ? onImgTap : undefined}
                                        >
                                            {isVideo ? (
                                                <>
                                                    {!videoReady && (
                                                        <div className="flex items-center justify-center w-16 h-16">
                                                            <span className="w-10 h-10 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
                                                        </div>
                                                    )}
                                                    <video
                                                        ref={videoRef}
                                                        src={currentItem.url}
                                                        controls
                                                        playsInline
                                                        autoPlay
                                                        className="max-w-full max-h-full rounded-xl shadow-2xl"
                                                        style={{
                                                            opacity: videoReady ? 1 : 0,
                                                            transition: videoReady ? 'opacity 0.2s ease' : 'none',
                                                            position: videoReady ? undefined : 'absolute',
                                                            pointerEvents: videoReady ? undefined : 'none',
                                                        }}
                                                        onLoadedMetadata={() => setVideoReady(true)}
                                                        onClick={e => e.stopPropagation()}
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    {!isImgLoaded && (
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <span className="w-10 h-10 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
                                                        </div>
                                                    )}
                                                    <img
                                                        ref={imgRef}
                                                        src={currentItem?.url}
                                                        onLoad={() => {
                                                            const el = imgRef.current;
                                                            if (el) imgSizeRef.current = { w: el.offsetWidth, h: el.offsetHeight };
                                                            setIsImgLoaded(true);
                                                        }}
                                                        className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                                                        style={{
                                                            transform: `scale(${scale}) translate(${imgOffset.x / scale}px, ${imgOffset.y / scale}px)`,
                                                            transformOrigin: 'center center',
                                                            opacity: isImgLoaded ? 1 : 0,
                                                            transition: (isImgSpringBack || isDoubleTapZoom)
                                                                ? 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.2s ease'
                                                                : (scale === 1 ? 'transform 0.22s ease, opacity 0.2s ease' : 'opacity 0.2s ease'),
                                                        }}
                                                        alt={`Zdjęcie ${current + 1}`}
                                                        draggable="false"
                                                    />
                                                </>
                                            )}
                                        </motion.div>
                                    </AnimatePresence>

                                    {!isVideo && scale > 1 && (
                                        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full pointer-events-none backdrop-blur-sm">
                                            {Math.round(scale * 10) / 10}×
                                        </div>
                                    )}

                                    {items.length > 1 && items.length <= DOTS_THRESHOLD && (
                                        <div
                                            className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 py-4"
                                            style={{ paddingBottom: `calc(${safeBottom} + 1.5rem)` }}
                                        >
                                            {items.map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => { setDir(i > current ? 1 : -1); setCurrent(i); }}
                                                    className={`rounded-full transition-all duration-200 ${
                                                        i === current
                                                            ? 'w-5 h-2 bg-white'
                                                            : 'w-2 h-2 bg-white/30 hover:bg-white/60 active:bg-white/80'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="grid"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute inset-0 flex flex-col"
                                >
                                    <div
                                        ref={gridScrollRef}
                                        className="flex-1 overflow-y-auto"
                                        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 48px)' }}
                                    >
                                        <div className="grid grid-cols-3 md:grid-cols-4 gap-0.5 p-0.5">
                                            {items.map((item, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, scale: 0.96 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ delay: i * 0.015 }}
                                                    onClick={() => openAt(i)}
                                                    className="relative aspect-square cursor-pointer group overflow-hidden bg-slate-900"
                                                >
                                                    {item.type === 'image' ? (
                                                        <>
                                                            <img
                                                                src={item.url}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                alt={`Zdjęcie ${i + 1}`}
                                                            />
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                                        </>
                                                    ) : (
                                                        <>
                                                            {item.thumbnail ? (
                                                                <img
                                                                    src={item.thumbnail}
                                                                    className="w-full h-full object-cover pointer-events-none"
                                                                    alt=""
                                                                />
                                                            ) : (
                                                                <video
                                                                    src={item.url}
                                                                    className="w-full h-full object-cover pointer-events-none"
                                                                    muted
                                                                    playsInline
                                                                    preload="metadata"
                                                                    onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 0.1; }}
                                                                />
                                                            )}
                                                            <div className="absolute inset-0 bg-black/45 flex items-center justify-center pointer-events-none">
                                                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                                    <Play size={17} className="text-white ml-0.5" fill="white" />
                                                                </div>
                                                            </div>
                                                            <div className="absolute bottom-1.5 left-1.5 pointer-events-none" style={{ transform: 'translateZ(0)' }}>
                                                                <Film size={11} className="text-white/60" />
                                                            </div>
                                                        </>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Thumbnail strip */}
                    {view === 'carousel' && items.length > DOTS_THRESHOLD && (
                        <div
                            ref={thumbStripRef}
                            className="absolute bottom-0 left-0 right-0 overflow-x-auto"
                            style={{
                                touchAction: 'pan-x pan-y',
                                scrollbarWidth: 'none',
                                WebkitOverflowScrolling: 'touch',
                                background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)',
                            } as React.CSSProperties}
                        >
                            <div
                                className="flex items-center gap-2 pl-6 py-2"
                                style={{ paddingBottom: `calc(${safeBottom} + 0.75rem)` }}
                            >
                                {items.map((item, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setDir(i > current ? 1 : -1); setCurrent(i); resetZoom(); }}
                                        className={`relative shrink-0 w-[46px] h-[46px] rounded-2xl overflow-hidden transition-opacity duration-150 ${
                                            i === current
                                                ? 'ring-[2.5px] ring-inset ring-white opacity-100'
                                                : 'opacity-35 hover:opacity-65 active:opacity-85'
                                        }`}
                                    >
                                        {item.type === 'video' ? (
                                            <>
                                                {item.thumbnail ? (
                                                    <img src={item.thumbnail} className="w-full h-full object-cover" alt="" draggable="false" />
                                                ) : (
                                                    <video
                                                        src={item.url}
                                                        className="w-full h-full object-cover pointer-events-none"
                                                        muted
                                                        playsInline
                                                        preload="metadata"
                                                        onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 0.1; }}
                                                    />
                                                )}
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                                                    <Play size={12} className="text-white ml-0.5" fill="white" />
                                                </div>
                                            </>
                                        ) : (
                                            <img src={item.url} className="w-full h-full object-cover" alt="" draggable="false" />
                                        )}
                                    </button>
                                ))}
                                <div className="shrink-0 w-6" />
                            </div>
                        </div>
                    )}
                </div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
