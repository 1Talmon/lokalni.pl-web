'use client';
import { useEffect, useLayoutEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play, LayoutGrid } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { StatusBar } from '@capacitor/status-bar';
import { usePlatform } from '../../hooks/usePlatform';
import type { ChatMediaItem } from './ChatMediaGallery';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    items: ChatMediaItem[];
    initialIndex?: number;
    nativeBottomPadding?: boolean;
    onOpenGallery?: () => void;
}

const DOTS_THRESHOLD = 10;

function rubberBand(x: number, min: number, max: number): number {
    if (x >= min && x <= max) return x;
    if (x < min) return min - (min - x) * 0.3;
    return max + (x - max) * 0.3;
}

export const MediaLightbox = ({
    isOpen,
    onClose,
    items,
    initialIndex = 0,
    nativeBottomPadding: _nativeBottomPadding = false,
    onOpenGallery,
}: Props) => {
    const { isNative } = usePlatform();

    const [current, setCurrent] = useState(initialIndex);
    const [dir, setDir] = useState(0);

    // Zoom state (images only)
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
    const imgSizeRef = useRef<{ w: number; h: number } | null>(null);
    const panStartPos = useRef<{ x: number; y: number } | null>(null);
    const wasPinchingRef = useRef(false);

    // Double-tap to zoom
    const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

    // Swipe down to close
    const swipeDownRef = useRef<{ startY: number; startX: number } | null>(null);
    const [swipeDownY, setSwipeDownY] = useState(0);
    const [isSnappingBack, setIsSnappingBack] = useState(false);
    const [isImgSpringBack, setIsImgSpringBack] = useState(false);
    const [isDoubleTapZoom, setIsDoubleTapZoom] = useState(false);
    const isDraggingDownRef = useRef(false);

    const thumbStripRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [videoReady, setVideoReady] = useState(false);

    const resetZoom = useCallback(() => {
        scaleRef.current = 1;
        imgOffsetRef.current = { x: 0, y: 0 };
        setScale(1);
        setImgOffset({ x: 0, y: 0 });
    }, []);

    const clampOffset = useCallback((ox: number, oy: number, s: number, cw: number, ch: number) => {
        const size = imgSizeRef.current;
        if (!size) return { x: ox, y: oy };
        const maxX = Math.max(0, (size.w * s - cw) / 2);
        const maxY = Math.max(0, (size.h * s - ch) / 2);
        return {
            x: Math.max(-maxX, Math.min(maxX, ox)),
            y: Math.max(-maxY, Math.min(maxY, oy)),
        };
    }, []);

    const softClampOffset = useCallback((ox: number, oy: number, s: number, cw: number, ch: number) => {
        const size = imgSizeRef.current;
        if (!size) return { x: ox, y: oy };
        const maxX = Math.max(0, (size.w * s - cw) / 2);
        const maxY = Math.max(0, (size.h * s - ch) / 2);
        return {
            x: rubberBand(ox, -maxX, maxX),
            y: rubberBand(oy, -maxY, maxY),
        };
    }, []);

    useLayoutEffect(() => {
        if (isOpen) {
            setCurrent(initialIndex);
            setDir(0);
            resetZoom();
            wasPinchingRef.current = false;
            setSwipeDownY(0);
            isDraggingDownRef.current = false;
            setVideoReady(false);
        }
    }, [isOpen, initialIndex, resetZoom]);

    useEffect(() => {
        if (!isNative || !isOpen) return;
        StatusBar.hide().catch(() => {});
        return () => { StatusBar.show().catch(() => {}); };
    }, [isOpen, isNative]);

    useEffect(() => {
        imgSizeRef.current = null;
        resetZoom();
        setVideoReady(false);
    }, [current, resetZoom]);

    // Auto-scroll thumbnail strip — centruje aktywną miniaturę
    useEffect(() => {
        const strip = thumbStripRef.current;
        if (!strip) return;
        // pl-6 = 24px offset + thumbnail width 46px + gap 8px = 54px/slot
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
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, go, onClose]);

    // ── Pinch zoom & pan (images only) ───────────────────────────────────────

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
        swipeDownRef.current = { startY: e.touches[0].clientY, startX: e.touches[0].clientX };
        isDraggingDownRef.current = false;
    }, []);

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

    const closeOpacity = Math.max(0.3, 1 - swipeDownY / 250);
    const closeScale = Math.max(0.88, 1 - swipeDownY / 1200);

    const currentItem = items[current];
    const isVideo = currentItem?.type === 'video';

    const safeBottom = 'env(safe-area-inset-bottom)';
    const slideBottomPad = items.length > 1
        ? items.length <= DOTS_THRESHOLD
            ? `calc(${safeBottom} + 4.5rem)`
            : `calc(${safeBottom} + 5.5rem)`
        : safeBottom;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-[300000]"
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
                        {/* Header */}
                        <div
                            className="relative flex items-center justify-between px-4 pb-2 shrink-0"
                            style={{ paddingTop: isNative ? 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' : '1.25rem' }}
                        >
                            {/* Pull-down indicator — tylko native */}
                            {isNative && <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-12 h-1.5 bg-white/25 rounded-full pointer-events-none" />}
                            <span className="text-white/50 text-sm tabular-nums min-w-[48px]">
                                <span className="text-white font-semibold">{current + 1}</span>
                                {' '}/ {items.length}
                            </span>
                            <div className="flex items-center gap-2">
                                {onOpenGallery && (
                                    <button
                                        onClick={onOpenGallery}
                                        className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90"
                                        aria-label="Otwórz galerię"
                                    >
                                        <LayoutGrid size={17} />
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Carousel */}
                        <div className="flex-1 overflow-hidden relative">
                            {/* Prev / Next — desktop */}
                            {items.length > 1 && (
                                <>
                                    <button
                                        onClick={() => go(-1)}
                                        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 items-center justify-center text-white transition-all border border-white/10 active:scale-90"
                                    >
                                        <ChevronLeft size={22} />
                                    </button>
                                    <button
                                        onClick={() => go(1)}
                                        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 items-center justify-center text-white transition-all border border-white/10 active:scale-90"
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
                                        paddingBottom: slideBottomPad,
                                        touchAction: isVideo ? 'pan-y' : 'none',
                                        cursor: !isVideo && scaleRef.current > 1 ? 'grab' : 'default',
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
                                        <img
                                            ref={imgRef}
                                            src={currentItem?.url}
                                            onLoad={() => {
                                                const el = imgRef.current;
                                                if (el) imgSizeRef.current = { w: el.offsetWidth, h: el.offsetHeight };
                                            }}
                                            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                                            style={{
                                                transform: `scale(${scale}) translate(${imgOffset.x / scale}px, ${imgOffset.y / scale}px)`,
                                                transformOrigin: 'center center',
                                                transition: (isImgSpringBack || isDoubleTapZoom)
                                                    ? 'transform 0.38s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                                                    : (scale === 1 ? 'transform 0.22s ease' : 'none'),
                                            }}
                                            alt={`Zdjęcie ${current + 1}`}
                                            draggable="false"
                                        />
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            {/* Zoom badge */}
                            {!isVideo && scale > 1 && (
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full pointer-events-none backdrop-blur-sm z-10">
                                    {Math.round(scale * 10) / 10}×
                                </div>
                            )}

                            {/* Dots — zostają w carousel (małe, nie potrzebują scroll) */}
                            {items.length > 1 && items.length <= DOTS_THRESHOLD && (
                                <div
                                    className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 py-4"
                                    style={{ paddingBottom: `calc(${safeBottom} + 1.5rem)` }}
                                >
                                    {items.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => { setDir(i > current ? 1 : -1); go(i - current); }}
                                            className={`rounded-full transition-all duration-200 ${
                                                i === current
                                                    ? 'w-5 h-2 bg-white'
                                                    : 'w-2 h-2 bg-white/30 hover:bg-white/60 active:bg-white/80'
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Thumbnail strip — poza overflow-hidden carousel, pozycja absolute względem outer div */}
                        {items.length > DOTS_THRESHOLD && (
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
                                            key={`${item.type}-${item.url}-${i}`}
                                            onClick={() => { const step = i - current; setDir(step); setCurrent(i); resetZoom(); }}
                                            className={`relative shrink-0 w-[46px] h-[46px] rounded-2xl overflow-hidden transition-opacity duration-150 ${
                                                i === current
                                                    ? 'ring-[2.5px] ring-inset ring-white opacity-100'
                                                    : 'opacity-35 hover:opacity-65 active:opacity-85'
                                            }`}
                                        >
                                            <div className="w-full h-full">
                                                {item.type === 'video' ? (
                                                    <>
                                                        <video
                                                            src={item.url}
                                                            className="w-full h-full object-cover pointer-events-none"
                                                            muted
                                                            playsInline
                                                            preload="metadata"
                                                            onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 0.1; }}
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none">
                                                            <Play size={12} className="text-white ml-0.5" fill="white" />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <img src={item.url} className="w-full h-full object-cover" alt="" draggable="false" />
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                    {/* spacer — Safari ignoruje padding-right w overflow-x:auto */}
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
