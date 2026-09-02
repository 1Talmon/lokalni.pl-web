'use client';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Send, Image as ImageIcon, Film, X, Trash2, Edit3, Check, CheckCircle, Camera, MoreVertical, Megaphone, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookings } from '../../../hooks/useBookings';
import { apiClient } from '../../../services/apiClient';
import { UserAvatar } from '../../../components/ui/UserAvatar';
import { dataUrlToFile } from '../../../utils/imageUtils';
import { MediaLightbox } from '../../../components/modals/MediaLightbox';
import type { ChatMediaItem } from '../../../components/modals/ChatMediaGallery';
import { lockScroll, unlockScroll } from '../../../utils/scrollLock';

// Kompresja zdjęcia przed zapisem — iPhone 12MP (~6MB) → ~150KB
const compressImage = (dataUrl: string, maxSide = 1080, quality = 0.72): Promise<string> =>
    new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(img.width * scale);
            canvas.height = Math.round(img.height * scale);
            canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });

interface Post {
    id: number;
    content: string;
    image?: string;
    video?: string;
    date: string;
}

export type PostMedia =
    | { type: 'image'; dataUrl: string }
    | { type: 'video'; file: File };

interface PostsSectionProps {
    newPostContent: string;
    setNewPostContent: (val: string) => void;
    posts: Post[];
    onPublish: (media?: PostMedia) => Promise<void>;
    onDeletePost?: (id: number) => void;
    onUpdatePost?: (id: number, newContent: string, image?: string) => void;
    isLoggedIn?: boolean;
    userData?: { imie?: string | null; nazwisko?: string | null; name?: string; avatar?: string | null } | null;
}

const MONTHS_PL = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];

const formatDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return `${d.getDate()} ${MONTHS_PL[d.getMonth()]} ${d.getFullYear()}`;
};

type FeedEntry =
    | { kind: 'post'; post: Post }
    | { kind: 'booking'; id: number; serviceName: string; date: string; bookingImage?: string };

type SelectedMedia =
    | { type: 'image'; dataUrl: string }
    | { type: 'video'; file: File; objectUrl: string };

export const PostsSection = ({
    newPostContent, setNewPostContent, posts, onPublish, onDeletePost, onUpdatePost,
    isLoggedIn = false, userData,
}: PostsSectionProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [selectedMedia, setSelectedMedia] = useState<SelectedMedia | null>(null);
    const [activeMenu, setActiveMenu] = useState<{ id: number; rect: DOMRect } | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [addedPhotos, setAddedPhotos] = useState<Record<number, string>>({});
    const [pendingPhotoId, setPendingPhotoId] = useState<number | null>(null);
    const [editImage, setEditImage] = useState<string | null>(null);
    const [textareaFocused, setTextareaFocused] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);
    const editImageInputRef = useRef<HTMLInputElement>(null);

    const { history } = useBookings(isLoggedIn);
    const completedAsProvider = history.filter(
        e => !e.isOutgoing && ['completed', 'reviewed'].includes(e.booking.status)
    );
    const avatarRaw = userData?.avatar || '';
    const userName = userData?.imie ? `${userData.imie} ${userData.nazwisko || ''}`.trim() : userData?.name || 'Ty';

    // Revoke objectURL przy odmontowaniu lub zmianie
    useEffect(() => {
        return () => {
            if (selectedMedia?.type === 'video') URL.revokeObjectURL(selectedMedia.objectUrl);
        };
    }, [selectedMedia]);

    useEffect(() => {
        const handleClose = () => setActiveMenu(null);
        window.addEventListener('click', handleClose);
        window.addEventListener('scroll', handleClose, { passive: true, capture: true });
        return () => {
            window.removeEventListener('click', handleClose);
            window.removeEventListener('scroll', handleClose, { capture: true });
        };
    }, []);

    useEffect(() => {
        if (lightboxOpen) lockScroll();
        else unlockScroll();
        return () => { unlockScroll(); };
    }, [lightboxOpen]);

    const MAX_CHARS = 1000;
    const MIN_CHARS = 5;

    const trimmedContent = newPostContent.trim();
    const isTooShort = trimmedContent.length > 0 && trimmedContent.length < MIN_CHARS;
    const isOverLimit = newPostContent.length > MAX_CHARS;
    const isEmpty = !trimmedContent && !selectedMedia;

    const clearSelectedMedia = () => {
        if (selectedMedia?.type === 'video') URL.revokeObjectURL(selectedMedia.objectUrl);
        setSelectedMedia(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleLocalPublish = async () => {
        if (isEmpty || isTooShort || isOverLimit || isPublishing) return;
        setIsPublishing(true);
        try {
            const media: PostMedia | undefined = selectedMedia
                ? selectedMedia.type === 'image'
                    ? { type: 'image', dataUrl: selectedMedia.dataUrl }
                    : { type: 'video', file: selectedMedia.file }
                : undefined;
            await onPublish(media);
            clearSelectedMedia();
        } finally {
            setIsPublishing(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (file.type.startsWith('video/')) {
            if (selectedMedia?.type === 'video') URL.revokeObjectURL(selectedMedia.objectUrl);
            setSelectedMedia({ type: 'video', file, objectUrl: URL.createObjectURL(file) });
        } else {
            const r = new FileReader();
            r.onloadend = async () => {
                const compressed = await compressImage(r.result as string);
                if (selectedMedia?.type === 'video') URL.revokeObjectURL(selectedMedia.objectUrl);
                setSelectedMedia({ type: 'image', dataUrl: compressed });
            };
            r.readAsDataURL(file);
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || pendingPhotoId === null) return;
        const id = pendingPhotoId;
        const reader = new FileReader();
        reader.onload = async () => {
            const compressed = await compressImage(reader.result as string);
            setAddedPhotos(prev => ({ ...prev, [id]: compressed }));
            try {
                const fd = new FormData();
                const uploadFile = dataUrlToFile(compressed, 'feed.jpg');
                fd.append('file', uploadFile);
                fd.append('context', 'service');
                const uploadRes = await apiClient.postFormData('/upload/image', fd);
                if (!uploadRes.ok) throw new Error('upload failed');
                const { url } = await uploadRes.json() as { url: string };
                await apiClient.patch(`/bookings/${id}/feed-image`, { imageUrl: url });
            } catch {
                setAddedPhotos(prev => { const copy = { ...prev }; delete copy[id]; return copy; });
            }
        };
        reader.readAsDataURL(file);
        e.target.value = '';
        setPendingPhotoId(null);
    };

    const feed: FeedEntry[] = [
        ...posts.map(p => ({ kind: 'post' as const, post: p })),
        ...completedAsProvider.map(ev => ({
            kind: 'booking' as const,
            id: typeof ev.booking.id === 'number' ? ev.booking.id : parseInt(String(ev.booking.id)) || 0,
            serviceName: ev.booking.serviceTitle || 'Usługa',
            date: ev.booking.date || ev.booking.createdAt || '',
            bookingImage: ev.booking.feedImageUrl || undefined,
        })),
    ].sort((a, b) => {
        const tsA = a.kind === 'post' ? new Date(a.post.date).getTime() : new Date(a.date || 0).getTime();
        const tsB = b.kind === 'post' ? new Date(b.post.date).getTime() : new Date(b.date || 0).getTime();
        return tsB - tsA;
    });

    const mediaItems = useMemo<ChatMediaItem[]>(() => {
        const list: ChatMediaItem[] = [];
        for (const entry of feed) {
            if (entry.kind === 'post') {
                if (entry.post.video) list.push({ type: 'video', url: entry.post.video });
                if (entry.post.image) list.push({ type: 'image', url: entry.post.image });
            } else {
                const img = addedPhotos[entry.id] || entry.bookingImage;
                if (img) list.push({ type: 'image', url: img });
            }
        }
        return list;
    }, [feed, addedPhotos]);

    const openLightbox = (url: string) => {
        const idx = mediaItems.findIndex(m => m.url === url);
        setLightboxIndex(idx >= 0 ? idx : 0);
        setLightboxOpen(true);
    };

    return (
        <div className="space-y-6 md:space-y-8 text-left font-sans pb-10 w-full">

            {/* Nagłówek */}
            <div>
                <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-1">Posty</h3>
                <p className="text-gray-500 font-medium text-sm">
                    Informuj klientów o realizacjach i promocjach.
                    {feed.length > 0 && (
                        <span className="ml-2 text-indigo-500 font-bold">
                            {feed.length} {feed.length === 1 ? 'wpis' : feed.length < 5 ? 'wpisy' : 'wpisów'}
                        </span>
                    )}
                </p>
            </div>

            {/* Kontener */}
            <div className="bg-white rounded-[2rem] shadow-sm p-6 md:p-8">

                {/* Formularz jako pierwszy element osi czasu */}
                <div className="relative pl-6 pb-6 border-l border-indigo-500/30">
                    <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-500/20" />
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Nowy wpis</p>
                    <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        onFocus={() => setTextareaFocused(true)}
                        onBlur={() => setTextareaFocused(false)}
                        className={`w-full bg-gray-50 rounded-2xl p-4 min-h-[90px] outline-none text-sm focus:bg-white focus:ring-2 transition-all resize-none placeholder:text-gray-400 font-medium border ${isOverLimit || isTooShort ? 'border-rose-300 focus:ring-rose-100' : 'border-gray-100 focus:ring-indigo-100'}`}
                        placeholder="Napisz o promocji, zmianie godzin, realizacji..."
                    />
                    {isTooShort && (
                        <p className="text-[10px] font-bold mt-1 text-rose-500">
                            Opis jest za krótki — minimum {MIN_CHARS} znaków
                        </p>
                    )}
                    {(textareaFocused || newPostContent.length > 0) && !isTooShort && (
                        <p className={`text-right text-[10px] font-bold mt-1 ${isOverLimit ? 'text-rose-500' : newPostContent.length > MAX_CHARS * 0.85 ? 'text-amber-500' : 'text-gray-400'}`}>
                            {newPostContent.length}/{MAX_CHARS}
                        </p>
                    )}
                    {selectedMedia && (
                        <div className="relative mt-3 w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-100 shadow-md">
                            {selectedMedia.type === 'image' ? (
                                <img src={selectedMedia.dataUrl} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <video src={selectedMedia.objectUrl} className="w-full h-full object-cover" muted playsInline />
                            )}
                            <button onClick={clearSelectedMedia} className="absolute top-1 right-1 bg-black/50 text-white p-0.5 rounded-full hover:bg-rose-500 transition-colors">
                                <X size={10} />
                            </button>
                            {selectedMedia.type === 'video' && (
                                <div className="absolute bottom-1 left-1 pointer-events-none">
                                    <Film size={10} className="text-white/80" />
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex items-center justify-between mt-4">
                        <input type="file" ref={fileInputRef} accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
                        <button onClick={() => fileInputRef.current?.click()}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${selectedMedia ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'}`}>
                            {selectedMedia?.type === 'video' ? <Film size={13} /> : <ImageIcon size={13} />}
                            {selectedMedia ? 'Zmień' : 'Zdjęcie / film'}
                        </button>
                        <button onClick={handleLocalPublish} disabled={isEmpty || isTooShort || isOverLimit || isPublishing}
                            className={`px-6 py-2 rounded-xl font-bold text-sm transition-all flex items-center gap-1.5 ${!isEmpty && !isTooShort && !isOverLimit && !isPublishing ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-sm shadow-indigo-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                            {isPublishing
                                ? <><Loader2 size={14} className="animate-spin" /> Wysyłanie...</>
                                : <>Opublikuj <Send size={12} /></>}
                        </button>
                    </div>
                </div>

                {/* Feed */}
                {feed.length === 0 ? (
                    <div className="relative pl-6">
                        <div className="absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gray-300 ring-4 ring-gray-100/50" />
                        <div className="flex items-center gap-3 py-4 text-gray-400">
                            <Megaphone size={18} className="shrink-0" />
                            <p className="text-sm font-bold text-gray-500">Brak wpisów. Opublikuj coś powyżej.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {feed.map((entry) => {
                            const isPost = entry.kind === 'post';
                            const key = isPost ? `post-${entry.post.id}` : `booking-${entry.id}`;
                            const entryDate = formatDate(isPost ? entry.post.date : entry.date);

                            return (
                                <div key={key} className={`relative pl-6 border-l ${isPost ? 'border-indigo-500/30' : 'border-emerald-500/30'}`}>

                                    {/* Kropka */}
                                    <div className={`absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ${isPost ? 'bg-indigo-500 ring-indigo-500/20' : 'bg-emerald-500 ring-emerald-500/20'}`} />

                                    {/* Autor + data */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <UserAvatar src={avatarRaw} name={userName} size={32} className="rounded-xl" />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-[10px] font-black text-gray-900 block uppercase tracking-tight">{userName}</span>
                                            <span className={`text-[9px] font-bold block uppercase tracking-widest ${isPost ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                                {entryDate}
                                            </span>
                                        </div>
                                        {!isPost && (
                                            <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 rounded-full shrink-0">
                                                <CheckCircle size={10} className="text-emerald-400" />
                                                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Zrealizowano</span>
                                            </div>
                                        )}
                                        {isPost && (
                                            <button onClick={(e) => { e.stopPropagation(); setActiveMenu({ id: entry.post.id, rect: e.currentTarget.getBoundingClientRect() }); }}
                                                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all shrink-0">
                                                <MoreVertical size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Wpis */}
                                    {isPost && (
                                        <>
                                            {editingId === entry.post.id ? (
                                                <div className="space-y-2 mb-4">
                                                    <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                                                        className="w-full bg-gray-50 rounded-2xl p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100 min-h-[70px] resize-none border border-gray-100" autoFocus />
                                                    {(editImage || entry.post.image) && (
                                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-100 shadow-md">
                                                            <img src={editImage || entry.post.image} className="w-full h-full object-cover" alt="" />
                                                            {editImage && (
                                                                <button onClick={() => setEditImage(null)} className="absolute top-1 right-1 bg-black/50 text-white p-0.5 rounded-full hover:bg-rose-500 transition-colors">
                                                                    <X size={10} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                    {entry.post.video && !editImage && !entry.post.image && (
                                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-indigo-100 shadow-md">
                                                            <video src={entry.post.video} className="w-full h-full object-cover" muted playsInline />
                                                            <div className="absolute bottom-1 left-1 pointer-events-none"><Film size={10} className="text-white/80" /></div>
                                                        </div>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <button onClick={() => editImageInputRef.current?.click()}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all">
                                                            <ImageIcon size={12} /> {editImage || entry.post.image ? 'Zmień zdjęcie' : 'Dodaj zdjęcie'}
                                                        </button>
                                                        <button
                                                            onClick={() => { onUpdatePost?.(entry.post.id, editContent, editImage || undefined); setEditingId(null); setEditImage(null); }}
                                                            disabled={!editContent.trim() && !editImage && !entry.post.image && !entry.post.video}
                                                            className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed">
                                                            <Check size={12} /> Zapisz
                                                        </button>
                                                        <button onClick={() => { setEditingId(null); setEditImage(null); }} className="px-4 py-1.5 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold">Anuluj</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                entry.post.content && <p className="text-sm text-gray-600 font-medium leading-relaxed mb-4">{entry.post.content}</p>
                                            )}
                                            {entry.post.video && (
                                                <button
                                                    onClick={e => { (e.currentTarget as HTMLButtonElement).blur(); openLightbox(entry.post.video!); }}
                                                    className="w-full rounded-2xl overflow-hidden border border-gray-200/50 mb-4 block relative active:opacity-80 transition-opacity focus:outline-none"
                                                >
                                                    <video src={entry.post.video} playsInline muted preload="metadata" className="w-full pointer-events-none" style={{ maxHeight: '18rem' }} onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 0.1; }} />
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                                                        <div className="w-14 h-14 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center">
                                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                                                        </div>
                                                    </div>
                                                </button>
                                            )}
                                            {entry.post.image && (
                                                <button
                                                    onClick={e => { (e.currentTarget as HTMLButtonElement).blur(); openLightbox(entry.post.image!); }}
                                                    className="w-full rounded-2xl overflow-hidden border border-gray-200/50 mb-4 block active:opacity-80 transition-opacity focus:outline-none"
                                                >
                                                    <img src={entry.post.image} className="w-full h-72 object-cover" alt="" />
                                                </button>
                                            )}
                                            <AnimatePresence>
                                                {confirmDeleteId === entry.post.id && (
                                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                        className="flex items-center gap-3 p-3 bg-rose-50 rounded-2xl border border-rose-100 mb-4">
                                                        <span className="text-rose-600 font-bold text-xs flex-1">Usunąć ten wpis?</span>
                                                        <button onClick={() => { onDeletePost?.(entry.post.id); setConfirmDeleteId(null); }}
                                                            className="px-3 py-1.5 bg-rose-600 text-white rounded-xl font-black text-xs active:scale-95">Usuń</button>
                                                        <button onClick={() => setConfirmDeleteId(null)}
                                                            className="px-3 py-1.5 bg-white text-gray-500 rounded-xl font-black text-xs border border-gray-200 active:scale-95">Anuluj</button>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </>
                                    )}

                                    {/* Realizacja */}
                                    {!isPost && (
                                        <>
                                            <p className="text-sm text-gray-600 font-medium leading-relaxed mb-3">
                                                Wykonano usługę: <span className="text-gray-900 font-bold">{entry.serviceName}</span>
                                            </p>
                                            {(addedPhotos[entry.id] || entry.bookingImage) ? (
                                                <button
                                                    onClick={e => { (e.currentTarget as HTMLButtonElement).blur(); openLightbox(addedPhotos[entry.id] || entry.bookingImage!); }}
                                                    className="w-full rounded-2xl overflow-hidden border border-gray-200/50 mb-4 block active:opacity-80 transition-opacity focus:outline-none"
                                                >
                                                    <img src={addedPhotos[entry.id] || entry.bookingImage} className="w-full h-72 object-cover" alt="" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => { setPendingPhotoId(entry.id); photoInputRef.current?.click(); }}
                                                    className="mb-4 w-full h-20 rounded-2xl border border-dashed border-slate-600 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all flex items-center justify-center gap-2 text-slate-500 hover:text-emerald-400 group"
                                                >
                                                    <Camera size={16} className="group-hover:scale-110 transition-transform" />
                                                    <span className="text-[11px] font-bold uppercase tracking-widest">Dodaj zdjęcie</span>
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Portal menu */}
            {activeMenu && createPortal(
                <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ position: 'fixed', top: activeMenu.rect.bottom + 8, left: activeMenu.rect.right - 180, zIndex: 999999 }}
                    className="bg-white shadow-2xl border border-gray-100 rounded-[1.8rem] p-2.5 min-w-[180px]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={() => { const p = posts.find(p => p.id === activeMenu.id); if (p) { setEditingId(p.id); setEditContent(p.content); setEditImage(null); } setActiveMenu(null); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all">
                        <Edit3 size={15} /> Edytuj wpis
                    </button>
                    <div className="h-px bg-gray-50 my-1 mx-2" />
                    <button onClick={() => { setConfirmDeleteId(activeMenu.id); setActiveMenu(null); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">
                        <Trash2 size={15} /> Usuń wpis
                    </button>
                </motion.div>,
                document.body
            )}

            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            <input ref={editImageInputRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = async () => { const compressed = await compressImage(r.result as string); setEditImage(compressed); }; r.readAsDataURL(f); e.target.value = ''; } }} />

            <MediaLightbox
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                items={mediaItems}
                initialIndex={lightboxIndex}
                nativeBottomPadding
            />
        </div>
    );
};
