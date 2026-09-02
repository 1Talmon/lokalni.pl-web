'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, Play, Images } from 'lucide-react';
import { StatusBar } from '@capacitor/status-bar';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { usePlatform } from '../../hooks/usePlatform';
import { MediaLightbox } from './MediaLightbox';

export interface ChatMediaItem {
    type: 'image' | 'video';
    url: string;
    thumbnail?: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    items: ChatMediaItem[];
}

export const ChatMediaGallery = ({ isOpen, onClose, items }: Props) => {
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const { isNative } = usePlatform();

    const swipeRef = useRef<{ startY: number; startX: number } | null>(null);
    const isDraggingRef = useRef(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [dragY, setDragY] = useState(0);
    const [isSnapping, setIsSnapping] = useState(false);

    useEffect(() => {
        if (!isNative || !isOpen) return;
        StatusBar.hide().catch(() => {});
        return () => { StatusBar.show().catch(() => {}); };
    }, [isOpen, isNative]);

    useEffect(() => {
        if (!isOpen) { setDragY(0); setIsSnapping(false); }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !lightboxOpen) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose, lightboxOpen]);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        if (e.touches.length > 1) return;
        if ((scrollRef.current?.scrollTop ?? 0) > 4) return;
        swipeRef.current = { startY: e.touches[0].clientY, startX: e.touches[0].clientX };
        isDraggingRef.current = false;
    }, []);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (!swipeRef.current || e.touches.length > 1) return;
        const dy = e.touches[0].clientY - swipeRef.current.startY;
        const dx = Math.abs(e.touches[0].clientX - swipeRef.current.startX);
        if (dy > 12 && dy > dx * 1.5) {
            isDraggingRef.current = true;
            setDragY(dy);
        }
    }, []);

    const onTouchEnd = useCallback(() => {
        if (isDraggingRef.current && dragY > 90) {
            if (isNative) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {});
            onClose();
        } else if (dragY > 0) {
            setIsSnapping(true);
            setDragY(0);
            setTimeout(() => setIsSnapping(false), 350);
        }
        isDraggingRef.current = false;
        swipeRef.current = null;
    }, [dragY, onClose, isNative]);

    // Natywny listener — iOS WebKit konsumuje touchmove przy scrollTop=0
    useEffect(() => {
        const el = scrollRef.current;
        if (!el || !isOpen) return;
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
    }, [isOpen]);

    const handleItem = (_item: ChatMediaItem, globalIdx: number) => {
        setLightboxIndex(globalIdx);
        setLightboxOpen(true);
    };

    return createPortal(
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="gallery"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="fixed inset-0 z-[200000]"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <div
                            className="bg-slate-950 flex flex-col w-full h-full"
                            style={(dragY > 0 || isSnapping) ? {
                                opacity: Math.max(0.3, 1 - dragY / 250),
                                transform: `translateY(${dragY}px) scale(${Math.max(0.88, 1 - dragY / 1200)})`,
                                transformOrigin: 'top center',
                                transition: isSnapping
                                    ? 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.25s ease'
                                    : 'none',
                            } : undefined}
                        >
                            {/* Header */}
                            <div
                                className="relative flex items-center justify-between px-4 pb-2 shrink-0"
                                style={{ paddingTop: isNative ? 'calc(env(safe-area-inset-top, 0px) + 0.75rem)' : '1.25rem' }}
                            >
                                {isNative && <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-12 h-1.5 bg-white/25 rounded-full pointer-events-none" />}
                                <span className="text-[11px] font-bold uppercase tracking-widest text-white/40">
                                    {items.length === 0
                                        ? 'Brak mediów'
                                        : `${items.length} ${items.length === 1 ? 'medium' : 'mediów'}`}
                                </span>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all active:scale-90"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Grid */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
                                {items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-3">
                                        <Images size={40} className="text-white/20" />
                                        <p className="text-sm text-white/30">Brak zdjęć i filmów w tej rozmowie</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-0.5 p-0.5">
                                        {items.map((item, i) => (
                                            <button
                                                key={`${item.type}-${item.url}`}
                                                onClick={() => handleItem(item, i)}
                                                className="relative aspect-square bg-slate-900 overflow-hidden group"
                                            >
                                                {item.type === 'image' ? (
                                                    <>
                                                        <img
                                                            src={item.url}
                                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                            alt=""
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
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <MediaLightbox
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                items={items}
                initialIndex={lightboxIndex}
                nativeBottomPadding
            />
        </>,
        document.body
    );
};
