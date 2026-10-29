'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Download, Share2, Loader2, Check, Instagram } from 'lucide-react';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { BottomSheetHandle } from '../ui/BottomSheetHandle';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import { SettingsToggle } from '../../views/Dashboard/components/Settings/SettingsRow';
import { renderStory, loadStoryImage, STORY_TEMPLATES, type StoryTemplateId, type StoryData } from '../../utils/storyCanvas';

interface StoryGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    name: string;
    subtitle: string;
    /** "★ 4,9 · 12 opinii" — null without reviews (the switch is hidden then) */
    rating?: string | null;
    avatarUrl?: string | null;
    /** profile link in the QR code */
    url: string;
    /** the user's own pictures (offers, profile background, posts) for the photo templates */
    photos: string[];
    addToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

/** Instagram story generator: brand templates with a QR code to the profile, some with the user's photos.
 *  Same sheet as the other modals: handle + draggable header on phones, centred card on desktop. */
export const StoryGeneratorModal = ({ isOpen, onClose, name, subtitle, rating, avatarUrl, url, photos, addToast }: StoryGeneratorModalProps) => {
    const { sheetDragProps, startDrag, backdropOpacity, triggerClose, handleClose } = useBottomSheet(onClose, isOpen);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [template, setTemplate] = useState<StoryTemplateId>('gradient');
    const [picked, setPicked] = useState<string[]>([]);
    const [images, setImages] = useState<Record<string, HTMLImageElement | null>>({});
    const [avatar, setAvatar] = useState<HTMLImageElement | null>(null);
    const [showAvatar, setShowAvatar] = useState(true);
    const [showRating, setShowRating] = useState(true);
    const [ready, setReady] = useState(false);
    const [busy, setBusy] = useState(false);

    const tpl = STORY_TEMPLATES.find(t => t.id === template)!;
    // parents rebuild the photo list on every render — reload only when its content changes
    const photosKey = photos.join('|');

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape' && isOpen) { e.stopPropagation(); triggerClose(); } };
        if (isOpen) window.addEventListener('keydown', handleEsc, true);
        return () => window.removeEventListener('keydown', handleEsc, true);
    }, [isOpen, triggerClose]);

    useEffect(() => {
        if (!isOpen) return;
        const alreadyLocked = document.documentElement.classList.contains('scroll-locked');
        if (!alreadyLocked) lockScroll();
        return () => { if (!alreadyLocked) unlockScroll(); };
    }, [isOpen]);

    // fonts + avatar + photos once per opening
    useEffect(() => {
        if (!isOpen) return;
        let cancelled = false;
        setReady(false);
        (async () => {
            await document.fonts?.ready;
            const [av, ...imgs] = await Promise.all([loadStoryImage(avatarUrl), ...photos.map(loadStoryImage)]);
            if (cancelled) return;
            setAvatar(av);
            setImages(Object.fromEntries(photos.map((p, i) => [p, imgs[i]])));
            setPicked(prev => (prev.length ? prev : photos.filter((_, i) => imgs[i]).slice(0, 3)));
            setReady(true);
        })();
        return () => { cancelled = true; };
    }, [isOpen, avatarUrl, photosKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const usable = useMemo(() => photos.filter(p => images[p]), [photos, images]);

    useEffect(() => {
        if (!isOpen || !ready || !canvasRef.current) return;
        const data: StoryData = {
            name, subtitle, url,
            rating: showRating ? rating : null,
            avatar, hideAvatar: !showAvatar,
            font: getComputedStyle(document.body).fontFamily,
        };
        const chosen = picked.filter(p => images[p]).slice(0, tpl.photos || 0).map(p => images[p]);
        renderStory(canvasRef.current, template, data, chosen);
    }, [isOpen, ready, template, picked, images, avatar, showAvatar, showRating, name, subtitle, rating, url, tpl.photos]);

    const togglePhoto = (p: string) => {
        if (tpl.photos === 1) { setPicked([p, ...picked.filter(x => x !== p)]); return; }
        setPicked(prev => (prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p].slice(-3)));
    };

    // phones (Safari/Chrome) share the image straight to Instagram; desktops download it
    const canShareFiles = useMemo(() => {
        try {
            const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
            return !!nav.canShare?.({ files: [new File([new Blob()], 'x.png', { type: 'image/png' })] });
        } catch { return false; }
    }, []);

    const exportStory = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        setBusy(true);
        try {
            const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png'));
            if (!blob) throw new Error('blob');
            const file = new File([blob], 'mylokalni-relacja.png', { type: 'image/png' });
            // the link for Instagram's "Link" sticker
            navigator.clipboard?.writeText(url).catch(() => {});
            if (canShareFiles) {
                await navigator.share({ files: [file], title: 'Moja relacja MyLokalni' }).catch(() => {});
            } else {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = 'mylokalni-relacja.png';
                a.click();
                setTimeout(() => URL.revokeObjectURL(a.href), 5000);
            }
            addToast?.('Gotowe! Link do profilu skopiowany – wklej go na Instagramie jako naklejkę „Link”.', 'success');
        } catch {
            addToast?.('Nie udało się przygotować obrazu. Spróbuj inny szablon.', 'error');
        } finally {
            setBusy(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100002]">
            {/* Backdrop — fades in real time with drag gesture */}
            <motion.div
                style={{ opacity: backdropOpacity }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />
            {/* Sheet */}
            <div className="absolute inset-0 flex items-end md:items-center justify-center md:p-4 pointer-events-none">
                <motion.div
                    {...sheetDragProps}
                    className="pointer-events-auto w-full md:max-w-3xl bg-white rounded-t-[2rem] md:rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="md:hidden">
                        <BottomSheetHandle onPointerDown={startDrag} />
                    </div>

                    <div
                        className="px-6 md:px-8 py-4 md:py-5 border-b border-gray-50 bg-gray-50/50 shrink-0 md:cursor-default cursor-grab active:cursor-grabbing"
                        style={{ touchAction: 'none' }}
                        onPointerDown={startDrag}
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Instagram size={18} />
                                </div>
                                Relacja na Instagram
                            </h3>
                            <button onClick={handleClose} aria-label="Zamknij" className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-scroll overscroll-contain px-5 md:px-8 py-5 max-h-[60dvh] md:max-h-[70vh]">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="shrink-0 mx-auto relative" style={{ width: 'min(58vw, 270px)', aspectRatio: '9 / 16' }}>
                                <canvas ref={canvasRef} data-story-canvas className="w-full h-full rounded-2xl shadow-lg bg-gray-100" />
                                {!ready && <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" /></div>}
                            </div>

                            <div className="flex-1 min-w-0 flex flex-col gap-5">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Szablon</p>
                                    <div className="flex flex-wrap gap-2">
                                        {STORY_TEMPLATES.map(t => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                disabled={t.photos > 0 && !usable.length}
                                                onClick={() => setTemplate(t.id)}
                                                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all disabled:opacity-40 ${template === t.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                    {!usable.length && ready && (
                                        <p className="text-xs text-gray-400 mt-2">Szablony ze zdjęciem pojawią się, gdy dodasz zdjęcia do ogłoszeń, tło profilu albo aktualności.</p>
                                    )}
                                </div>

                                {tpl.photos > 0 && (
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">
                                            {tpl.photos === 1 ? 'Zdjęcie w tle' : 'Zdjęcia (do 3)'}
                                        </p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {usable.map(p => {
                                                const idx = picked.indexOf(p);
                                                const on = tpl.photos === 1 ? idx === 0 : idx >= 0;
                                                return (
                                                    <button key={p} type="button" onClick={() => togglePhoto(p)} className={`relative aspect-square rounded-xl overflow-hidden border-2 ${on ? 'border-indigo-600' : 'border-transparent'}`}>
                                                        <img src={p} alt="" className="w-full h-full object-cover" />
                                                        {on && <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center"><Check size={12} /></span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-2xl border border-gray-100 divide-y divide-gray-100">
                                    <div className="flex items-center justify-between gap-4 px-4 py-3">
                                        <span className="text-sm font-semibold text-gray-700">Zdjęcie profilowe</span>
                                        <SettingsToggle enabled={showAvatar} onToggle={() => setShowAvatar(v => !v)} label="Zdjęcie profilowe" />
                                    </div>
                                    {rating && (
                                        <div className="flex items-center justify-between gap-4 px-4 py-3">
                                            <span className="text-sm font-semibold text-gray-700">Ocena i liczba opinii</span>
                                            <SettingsToggle enabled={showRating} onToggle={() => setShowRating(v => !v)} label="Ocena i liczba opinii" />
                                        </div>
                                    )}
                                </div>

                                <p className="text-[11px] text-gray-400 leading-relaxed">
                                    Dodaj obraz do relacji na Instagramie. Link do profilu skopiujemy – wklej go jako naklejkę „Link”.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div
                        className="flex gap-2 px-5 pt-4 pb-5 shrink-0 border-t border-gray-100"
                        style={{ paddingBottom: 'calc(var(--native-cta-h, var(--bottom-nav-total-h, env(safe-area-inset-bottom, 0px))) + 1.25rem)' }}
                    >
                        <button
                            type="button"
                            onClick={exportStory}
                            disabled={!ready || busy}
                            className="flex-1 py-3 rounded-xl text-xs font-black bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-40 shadow-sm shadow-indigo-200 flex items-center justify-center gap-2"
                        >
                            {busy ? <Loader2 size={14} className="animate-spin" /> : canShareFiles ? <Share2 size={14} /> : <Download size={14} />}
                            {canShareFiles ? 'Udostępnij na Instagram' : 'Pobierz obraz'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>,
        document.body,
    );
};
