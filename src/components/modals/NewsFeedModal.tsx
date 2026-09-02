'use client';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { BottomSheetHandle } from '../ui/BottomSheetHandle';
import { X, Send, CheckCircle, Camera, Loader2 } from 'lucide-react';
import { UserAvatar } from '../ui/UserAvatar';
import { apiClient } from '../../services/apiClient';
import { MediaLightbox } from './MediaLightbox';
import type { ChatMediaItem } from './ChatMediaGallery';

export type PostItem = {
    id: number;
    type: 'post';
    date: string;
    content: string;
    image?: string;
    video?: string;
};

export type RealizacjaItem = {
    id: number;
    type: 'realizacja';
    date: string;
    serviceName: string;
    image?: string;
};

export type FeedItem = PostItem | RealizacjaItem;

interface NewsFeedModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: FeedItem[];
    providerName: string;
    providerAvatar?: string;
    activityStatus?: string;
    canEdit?: boolean;
    isSubModalOpen?: boolean;
    onLightboxChange?: (open: boolean) => void;
    onOpenLightbox?: (index: number, items: ChatMediaItem[]) => void;
    onImageUploaded?: () => void;
    onUploadError?: () => void;
}

export const NewsFeedModal = ({ isOpen, onClose, items, providerName, providerAvatar, activityStatus = "", canEdit = false, isSubModalOpen = false, onLightboxChange, onOpenLightbox, onImageUploaded, onUploadError }: NewsFeedModalProps) => {
    const isActiveNow = !!activityStatus &&
        (activityStatus.toLowerCase().includes('aktywn') || activityStatus.toLowerCase().includes('online'))
        && !activityStatus.toLowerCase().includes('temu');

    const [addedPhotos, setAddedPhotos] = useState<Record<number, string>>({});
    const [pendingId, setPendingId] = useState<number | null>(null);
    const [uploadingId, setUploadingId] = useState<number | null>(null);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { sheetDragProps, startDrag, backdropOpacity, triggerClose, handleClose, y } = useBottomSheet(onClose, isOpen);

    const mediaItems = useMemo<ChatMediaItem[]>(() => {
        const list: ChatMediaItem[] = [];
        for (const item of items) {
            if (item.type === 'post') {
                if (item.video) list.push({ type: 'video', url: item.video });
                if (item.image) list.push({ type: 'image', url: item.image });
            } else {
                const img = addedPhotos[item.id] || item.image;
                if (img) list.push({ type: 'image', url: img });
            }
        }
        return list;
    }, [items, addedPhotos]);

    const openLightbox = (url: string) => {
        const idx = mediaItems.findIndex(m => m.url === url);
        if (onOpenLightbox) {
            onOpenLightbox(idx >= 0 ? idx : 0, mediaItems);
        } else {
            setLightboxIndex(idx >= 0 ? idx : 0);
            setLightboxOpen(true);
        }
    };

    useEffect(() => {
        onLightboxChange?.(lightboxOpen);
    }, [lightboxOpen, onLightboxChange]);

    useEffect(() => {
        if (!isOpen) return;
        lockScroll();
        return () => { setTimeout(unlockScroll, 250); };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (isSubModalOpen || lightboxOpen) return;
            if (e.key === 'Escape') triggerClose();
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, triggerClose, isSubModalOpen, lightboxOpen]);

    const handleAddPhoto = (id: number) => {
        setPendingId(id);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || pendingId === null) return;
        const bookingId = pendingId;
        e.target.value = '';
        setPendingId(null);
        setUploadingId(bookingId);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('context', 'service');
            const uploadRes = await apiClient.postFormData('/upload/image', fd);
            if (!uploadRes.ok) throw new Error('upload failed');
            const { url } = await uploadRes.json() as { url: string };
            const saveRes = await apiClient.patch(`/bookings/${bookingId}/feed-image`, { imageUrl: url });
            if (!saveRes.ok) throw new Error('save failed');
            setAddedPhotos(prev => ({ ...prev, [bookingId]: url }));
            onImageUploaded?.();
        } catch {
            onUploadError?.();
        } finally {
            setUploadingId(null);
        }
    };

    const portal = createPortal(
        isOpen ? (
            <div className="fixed inset-0 z-[400]">
                {/* Backdrop — fades in real time with drag gesture */}
                <motion.div
                    style={{ opacity: backdropOpacity }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={lightboxOpen ? undefined : handleClose}
                />
                {/* Sheet */}
                <div className="absolute inset-0 flex items-end md:items-center justify-center pointer-events-none">
                    <motion.div
                        {...sheetDragProps}
                        style={{ maxHeight: 'calc(88dvh - var(--bottom-nav-total-h, 0px))', y }}
                        className="pointer-events-auto relative w-full max-w-2xl min-h-[45dvh] bg-slate-900 md:rounded-[2.5rem] rounded-t-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <BottomSheetHandle onPointerDown={startDrag} dark />

                        {/* Header */}
                        <div
                            className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0 cursor-grab active:cursor-grabbing"
                            style={{ touchAction: 'none' }}
                            onPointerDown={startDrag}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                    <Send size={14} />
                                </div>
                                <div>
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Aktualności</h3>
                                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{providerName}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                aria-label="Zamknij aktualności"
                                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Feed */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                            {items.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-14 gap-4 text-center px-8">
                                    <div className="w-16 h-16 rounded-3xl bg-slate-800 flex items-center justify-center">
                                        <Send size={22} className="text-slate-600" />
                                    </div>
                                    <div>
                                        <p className="text-slate-200 font-bold text-[15px]">Brak aktualności</p>
                                        <p className="text-slate-500 text-[13px] mt-2 leading-relaxed">
                                            Aktualności pojawiają się automatycznie po każdej zakończonej usłudze
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="p-6 space-y-6" style={{ paddingBottom: 'calc(var(--native-cta-h, var(--bottom-nav-total-h, env(safe-area-inset-bottom))) + 1.5rem)' }}>
                                {items.map((item, idx) => (
                                    <motion.div
                                        key={`${item.type}-${item.id}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.07 }}
                                        className={`relative pl-6 border-l ${item.type === 'realizacja' ? 'border-emerald-500/30' : 'border-indigo-500/30'}`}
                                    >
                                        {/* Timeline dot */}
                                        <div className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ${
                                            item.type === 'realizacja'
                                                ? 'bg-emerald-500 ring-emerald-500/20'
                                                : 'bg-indigo-500 ring-indigo-500/20'
                                        }`} />

                                        {/* Author row */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="relative shrink-0">
                                                <UserAvatar src={providerAvatar} name={providerName} size={32} className="rounded-xl" />
                                                {isActiveNow && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-slate-900" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[10px] font-black text-white block uppercase tracking-tight">{providerName}</span>
                                                <span className={`text-[9px] font-bold block uppercase tracking-widest ${item.type === 'realizacja' ? 'text-emerald-400' : 'text-indigo-400'}`}>
                                                    {item.date}
                                                </span>
                                            </div>
                                            {item.type === 'realizacja' && (
                                                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 rounded-full shrink-0">
                                                    <CheckCircle size={10} className="text-emerald-400" />
                                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Zrealizowano</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        {item.type === 'post' ? (
                                            <>
                                                {item.content && <p className="text-sm text-slate-300 font-medium leading-relaxed mb-4">{item.content}</p>}
                                                {item.video && (
                                                    <button
                                                        onClick={e => { (e.currentTarget as HTMLButtonElement).blur(); openLightbox(item.video!); }}
                                                        className="w-full rounded-2xl overflow-hidden border border-slate-700/50 mb-4 block relative active:opacity-80 transition-opacity focus:outline-none"
                                                    >
                                                        <video src={item.video} playsInline muted preload="metadata" className="w-full pointer-events-none" style={{ maxHeight: '18rem' }} onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 0.1; }} />
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                            <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                                                            </div>
                                                        </div>
                                                    </button>
                                                )}
                                                {item.image && (
                                                    <button
                                                        onClick={e => { (e.currentTarget as HTMLButtonElement).blur(); openLightbox(item.image!); }}
                                                        className="w-full rounded-2xl overflow-hidden border border-slate-700/50 mb-4 block active:opacity-80 transition-opacity focus:outline-none"
                                                    >
                                                        <img src={item.image} className="w-full h-72 object-cover" alt="" />
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <p className="text-sm text-slate-300 font-medium leading-relaxed mb-3">
                                                    Wykonano usługę: <span className="text-white font-bold">{item.serviceName}</span>
                                                </p>
                                                {(item.image || addedPhotos[item.id]) ? (
                                                    <button
                                                        onClick={e => { (e.currentTarget as HTMLButtonElement).blur(); openLightbox(addedPhotos[item.id] || item.image!); }}
                                                        className="w-full rounded-2xl overflow-hidden border border-slate-700/50 mb-4 block active:opacity-80 transition-opacity focus:outline-none"
                                                    >
                                                        <img src={addedPhotos[item.id] || item.image} className="w-full h-72 object-cover" alt="" />
                                                    </button>
                                                ) : canEdit ? (
                                                    <button
                                                        onClick={() => uploadingId === null && handleAddPhoto(item.id)}
                                                        disabled={uploadingId !== null}
                                                        className="mb-4 w-full h-20 rounded-2xl border border-dashed border-slate-600 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2 text-slate-500 hover:text-emerald-400 group disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        {uploadingId === item.id
                                                            ? <><Loader2 size={16} className="animate-spin text-emerald-400" /><span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Przesyłanie...</span></>
                                                            : <><Camera size={16} className="group-hover:scale-110 transition-transform" /><span className="text-[11px] font-bold uppercase tracking-widest">Dodaj zdjęcie</span></>
                                                        }
                                                    </button>
                                                ) : null}
                                            </>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </motion.div>
                </div>
            </div>
        ) : null,
        document.body
    );

    return (
        <>
            {portal}
            {!onOpenLightbox && (
                <MediaLightbox
                    isOpen={lightboxOpen}
                    onClose={() => setLightboxOpen(false)}
                    items={mediaItems}
                    initialIndex={lightboxIndex}
                    nativeBottomPadding
                />
            )}
        </>
    );
};
