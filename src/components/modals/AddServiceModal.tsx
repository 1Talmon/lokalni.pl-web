'use client';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import { useState, useEffect, useRef, useCallback } from 'react';
import { tokenUtils } from '../../utils/tokenUtils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.mylokalni.pl/api';
import { motion } from 'framer-motion';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { BottomSheetHandle } from '../ui/BottomSheetHandle';
import { Geolocation } from '@capacitor/geolocation';
import { X, ArrowLeft, Zap, ImageIcon, Globe, Trash2, Star, Plus, LocateFixed, Loader2, Sparkles, Film } from 'lucide-react';
import { CityAutocomplete } from '../ui/CityAutocomplete';
import { AddressAutocomplete } from '../ui/AddressAutocomplete';
import { Service, Category } from '../../types';
import { parsePrice } from '../../utils/helpers';

interface AddServiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingService: Service | null;
    categories: Category[];
    onSubmit: (formData: any) => Promise<void>; // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface GalleryMedia { id: string; type: 'image' | 'video'; url: string; thumbnailUrl?: string; }


function dataUrlToBlob(dataUrl: string, mime: string): Blob {
    const data = dataUrl.split(',')[1];
    const bytes = atob(data);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
}

function normalizeImageOrientation(file: File): Promise<string> {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d')!;
                ctx.drawImage(img, 0, 0);
                const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                resolve(canvas.toDataURL(mime, mime === 'image/jpeg' ? 0.92 : undefined));
            };
            img.src = reader.result as string;
        };
        reader.readAsDataURL(file);
    });
}

const INPUT = "w-full bg-gray-50 p-3 rounded-xl border border-transparent outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:bg-white transition-all text-gray-900 text-sm placeholder:text-gray-400";
const LABEL = "block text-xs font-bold text-gray-500 mb-1.5";
const CATEGORY_PRICE_UNIT: Record<string, string> = {
    cleaning: 'za usługę', home: 'za usługę', construction: 'za m²',
    auto: 'za usługę', transport: 'za usługę', beauty: 'za usługę',
    tech: 'za godzinę', edu: 'za godzinę', health: 'za godzinę',
    pets: 'za usługę', finance: 'za usługę', care: 'za godzinę',
    art: 'za usługę', events: 'za usługę', other: 'za usługę',
};

export const AddServiceModal = ({ isOpen, onClose, editingService, categories, onSubmit }: AddServiceModalProps) => {
    const { sheetDragProps, startDrag, y, backdropOpacity, triggerClose, handleClose } = useBottomSheet(onClose, isOpen);
    const [formLocation, setFormLocation] = useState('');
    const [formAddress, setFormAddress] = useState('');
    const [formAddressCoords, setFormAddressCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [isGpsLoading, setIsGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState(false);

    const handleGps = async () => {
        if (isGpsLoading) return;
        setIsGpsLoading(true);
        setGpsError(false);
        try {
            const pos = await Geolocation.getCurrentPosition({ timeout: 10000, maximumAge: 60000 });
            const { latitude, longitude } = pos.coords;
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
                { headers: { 'Accept-Language': 'pl' } }
            );
            const data = await res.json();
            const city = data.address?.city || data.address?.town || data.address?.village || data.address?.county || '';
            if (city) setFormLocation(city);
        } catch {
            setGpsError(true);
            setTimeout(() => setGpsError(false), 3000);
        } finally {
            setIsGpsLoading(false);
        }
    };
    const [formRadius, setFormRadius] = useState(20);
    const [formDuration, setFormDuration] = useState(60);
    const [previewMedia, setPreviewMedia] = useState<GalleryMedia[]>([]);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [uploadingType, setUploadingType] = useState<'image' | 'video' | null>(null);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [locationError, setLocationError] = useState<string | null>(null);
    const mediaInputRef = useRef<HTMLInputElement>(null);
    const videoXhrRef = useRef<XMLHttpRequest | null>(null);
    const [formType, setFormType] = useState<'offer' | 'request'>('offer');
    const [isRemote, setIsRemote] = useState(false);
    const [descLength, setDescLength] = useState(0);
    const [categoryValue, setCategoryValue] = useState(editingService?.category || 'home');
    const [categoryAutoSet, setCategoryAutoSet] = useState(false);
    const [isSuggestingCategory, setIsSuggestingCategory] = useState(false);
    const [priceHint, setPriceHint] = useState<{ min: number; median: number; max: number; source: string } | null>(null);
    const [isFetchingPriceHint, setIsFetchingPriceHint] = useState(false);
    const [priceUnitAutoSet, setPriceUnitAutoSet] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const isSubmittingRef = useRef(false);
    const [titleValue, setTitleValue] = useState(editingService?.title || '');
    const VALID_UNITS = ['za usługę', 'za godzinę', 'za m²', 'za sztukę'];
    const [priceUnitValue, setPriceUnitValue] = useState(() => {
        const u = editingService?.priceUnit;
        return u && VALID_UNITS.includes(u) ? u : 'za usługę';
    });
    const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const priceHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const suggestAbortRef = useRef<AbortController | null>(null);
    const priceHintAbortRef = useRef<AbortController | null>(null);
    const editingOriginalTitleRef = useRef<string | null>(editingService ? (editingService.title || '') : null);
    const DESC_MIN = 10;
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    const generateId = () => Math.random().toString(36).substr(2, 9);

    useEffect(() => {
        if (!isOpen) return;
        lockScroll();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') triggerClose(); };
        window.addEventListener('keydown', onKey);
        return () => { unlockScroll(); window.removeEventListener('keydown', onKey); };
    }, [isOpen, triggerClose]);

    useEffect(() => {
        if (!isOpen || titleValue.length < 3 || isSuggestingCategory || (editingOriginalTitleRef.current !== null && titleValue === editingOriginalTitleRef.current)) {
            priceHintAbortRef.current?.abort();
            setPriceHint(null); setIsFetchingPriceHint(false); setCategoryAutoSet(false); setPriceUnitAutoSet(false); return;
        }
        priceHintAbortRef.current?.abort();
        const ctrl = new AbortController();
        priceHintAbortRef.current = ctrl;
        if (priceHintTimerRef.current) clearTimeout(priceHintTimerRef.current);
        setIsFetchingPriceHint(true);
        priceHintTimerRef.current = setTimeout(async () => {
            try {
                const params = new URLSearchParams({ category: categoryValue });
                params.set('title', titleValue);
                if (editingService?.publicId) params.set('excludeId', editingService.publicId);
                const res = await fetch(`${API_BASE}/public/price-hint?${params}`, { signal: ctrl.signal });
                if (res.ok) { const d = await res.json(); if (d.min !== null && d.min !== undefined) setPriceHint(d); }
            } catch (e) {
                if (e instanceof Error && e.name === 'AbortError') return;
            } finally {
                if (!ctrl.signal.aborted) setIsFetchingPriceHint(false);
            }
        }, 300);
    }, [categoryValue, formLocation, titleValue, isOpen, isSuggestingCategory, editingService]);

    const suggestCategory = useCallback(async (title: string) => {
        if (title.length < 5) return;
        suggestAbortRef.current?.abort();
        const ctrl = new AbortController();
        suggestAbortRef.current = ctrl;
        setIsSuggestingCategory(true);
        try {
            const res = await fetch(`${API_BASE}/public/suggest-category`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title }),
                signal: ctrl.signal,
            });
            if (!res.ok) return;
            const data = await res.json() as { category: string | null };
            if (data.category) {
                setCategoryValue(data.category);
                setCategoryAutoSet(true);
                setPriceUnitValue(CATEGORY_PRICE_UNIT[data.category] || 'za usługę');
                setPriceUnitAutoSet(true);
            }
        } catch (e) {
            if (e instanceof Error && e.name === 'AbortError') return;
        } finally {
            if (!ctrl.signal.aborted) setIsSuggestingCategory(false);
        }
    }, []);

    const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const title = e.target.value;
        setTitleValue(title);
        if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
        if (title.length >= 5) {
            setIsSuggestingCategory(true);
            suggestTimerRef.current = setTimeout(() => suggestCategory(title), 400);
        } else {
            setIsSuggestingCategory(false);
        }
    }, [suggestCategory]);

    useEffect(() => {
        editingOriginalTitleRef.current = editingService ? (editingService.title || '') : null;
        if (editingService) {
            setFormLocation(editingService.city || '');
            const existingAddr = editingService.address || '';
            setFormAddress(existingAddr);
            const existingLoc = editingService.location;
            if (existingAddr && existingLoc?.lat) {
                setFormAddressCoords({ lat: existingLoc.lat, lng: existingLoc.lng });
            } else {
                setFormAddressCoords(null);
                if (existingAddr) {
                    const cityParam = editingService.city ? `&city=${encodeURIComponent(editingService.city)}` : '';
                    fetch(`${API_BASE}/public/address?query=${encodeURIComponent(existingAddr)}${cityParam}`, { headers: { 'Accept-Language': 'pl' } })
                        .then(r => r.json())
                        .then(json => { if (json.data?.[0]) setFormAddressCoords({ lat: json.data[0].lat, lng: json.data[0].lng }); })
                        .catch(() => {});
                }
            }
            setIsRemote(!!editingService.isRemote || !editingService.city?.trim());
            setFormRadius(editingService.radius ?? 20);
            setFormDuration(editingService.durationMinutes ?? 60);
            setFormType(editingService.type || 'offer');
            const imgs = editingService.images?.length ? editingService.images : editingService.image ? [editingService.image] : [];
            const vids = editingService.videos ?? [];
            setPreviewMedia([
                ...imgs.map(url => ({ id: generateId(), type: 'image' as const, url })),
                ...vids.map(v => ({ id: generateId(), type: 'video' as const, url: v.url, thumbnailUrl: v.thumbnailUrl ?? undefined })),
            ]);
            setDescLength(editingService.description?.length ?? 0);
            setCategoryValue(editingService.category || 'home');
            setCategoryAutoSet(false);
            setTitleValue(editingService.title || '');
            setPriceHint(null);
            setPriceUnitAutoSet(false);
            const u = editingService.priceUnit;
            setPriceUnitValue(u && VALID_UNITS.includes(u) ? u : 'za usługę');
        } else {
            setFormLocation(''); setFormAddress(''); setFormAddressCoords(null);
            setIsRemote(false); setFormRadius(20); setFormDuration(60);
            setPreviewMedia([]); setFormType('offer');
            setDescLength(0);
            setCategoryValue('home');
            setCategoryAutoSet(false);
            setTitleValue('');
            setPriceHint(null);
            setPriceUnitAutoSet(false);
            setPriceUnitValue('za usługę');
        }
    }, [editingService?.publicId, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleMediaChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        e.target.value = '';
        if (!files.length) return;

        const imgCount = previewMedia.filter(m => m.type === 'image').length;
        const vidCount = previewMedia.filter(m => m.type === 'video').length;

        const imageFiles = files.filter(f => !f.type.startsWith('video/')).slice(0, Math.max(0, 5 - imgCount));
        const videoFiles = files.filter(f => f.type.startsWith('video/')).slice(0, Math.max(0, 3 - vidCount));

        const parseXhrError = (xhr: XMLHttpRequest, fallback: string): string => {
            try { const b = JSON.parse(xhr.responseText); return b.message || b.error || fallback; } catch { return fallback; }
        };

        setUploadError(null);
        for (const file of imageFiles) {
            if (file.type === 'image/heic' || file.type === 'image/heif') {
                setUploadError('Format HEIC nie jest obsługiwany. Wyślij zdjęcie jako JPG lub PNG.');
                continue;
            }
            setUploadProgress(0); setUploadingType('image');
            try {
                const dataUrl = await normalizeImageOrientation(file);
                const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                const blob = dataUrlToBlob(dataUrl, mime);
                const uploadFile = new File([blob], file.name || 'image.jpg', { type: mime });
                const result = await new Promise<{ url: string }>((resolve, reject) => {
                    const token = tokenUtils.get();
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mylokalni.pl/api';
                    const xhr = new XMLHttpRequest();
                    videoXhrRef.current = xhr;
                    xhr.open('POST', `${apiUrl}/upload/image`);
                    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    xhr.withCredentials = true;
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
                    };
                    xhr.onload = () => {
                        videoXhrRef.current = null;
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error('Błąd odpowiedzi serwera')); }
                        } else {
                            reject(new Error(parseXhrError(xhr, `Błąd ${xhr.status}`)));
                        }
                    };
                    xhr.onerror = () => { videoXhrRef.current = null; reject(new Error('Błąd połączenia')); };
                    xhr.onabort = () => { videoXhrRef.current = null; reject(new Error('Przerwano')); };
                    const fd = new FormData();
                    fd.append('file', uploadFile);
                    fd.append('context', 'service');
                    xhr.send(fd);
                });
                setPreviewMedia(prev => [...prev, { id: generateId(), type: 'image' as const, url: result.url }]);
            } catch (err: unknown) {
                setUploadError((err as Error)?.message ?? 'Błąd przesyłania zdjęcia');
            } finally {
                setUploadProgress(null); setUploadingType(null);
            }
        }

        for (const file of videoFiles) {
            if (file.size > 100 * 1024 * 1024) {
                setUploadError('Film jest za duży.');
                continue;
            }
            const duration = await new Promise<number>(res => {
                const vid = document.createElement('video');
                vid.preload = 'metadata';
                const url = URL.createObjectURL(file);
                vid.onloadedmetadata = () => { URL.revokeObjectURL(url); res(vid.duration); };
                vid.onerror = () => { URL.revokeObjectURL(url); res(0); };
                vid.src = url;
            });
            if (duration > 120) {
                setUploadError('Film jest za długi.');
                continue;
            }
            setUploadProgress(0); setUploadingType('video');
            try {
                const result = await new Promise<{ url: string; thumbnailUrl?: string }>((resolve, reject) => {
                    const token = tokenUtils.get();
                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mylokalni.pl/api';
                    const xhr = new XMLHttpRequest();
                    videoXhrRef.current = xhr;
                    xhr.open('POST', `${apiUrl}/upload/video`);
                    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
                    xhr.withCredentials = true;
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
                    };
                    xhr.onload = () => {
                        videoXhrRef.current = null;
                        if (xhr.status >= 200 && xhr.status < 300) {
                            try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error('Błąd odpowiedzi serwera')); }
                        } else {
                            reject(new Error(parseXhrError(xhr, `Błąd ${xhr.status}`)));
                        }
                    };
                    xhr.onerror = () => {
                        videoXhrRef.current = null;
                        if (xhr.status >= 400) {
                            reject(new Error(parseXhrError(xhr, `Błąd ${xhr.status}`)));
                        } else {
                            reject(new Error('Błąd połączenia'));
                        }
                    };
                    xhr.onabort = () => { videoXhrRef.current = null; reject(new Error('Przerwano')); };
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('context', 'service');
                    xhr.send(fd);
                });
                setPreviewMedia(prev => [...prev, { id: generateId(), type: 'video' as const, url: result.url, thumbnailUrl: result.thumbnailUrl }]);
            } catch (err: unknown) {
                setUploadError((err as Error)?.message ?? 'Błąd przesyłania wideo');
            } finally {
                setUploadProgress(null); setUploadingType(null);
            }
        }
    };

    const removeMedia = (i: number) => setPreviewMedia(prev => prev.filter((_, idx) => idx !== i));

    const setAsMain = (e: React.MouseEvent, i: number) => {
        e.preventDefault(); e.stopPropagation();
        if (previewMedia[i]?.type !== 'image') return;
        setPreviewMedia(prev => { const a = [...prev]; const [item] = a.splice(i, 1); a.unshift(item); return a; });
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isSubmittingRef.current) return;

        if (previewMedia.length === 0) {
            setUploadError('Dodaj co najmniej 1 zdjęcie lub film przed publikacją.');
            return;
        }
        if (!isRemote && !formLocation.trim()) {
            setLocationError('Podaj miasto lub zaznacz opcję „Usługa zdalna".');
            return;
        }

        isSubmittingRef.current = true;
        setIsSubmitting(true);
        const fd = new FormData(e.currentTarget);
        const images = previewMedia.filter(m => m.type === 'image').map(m => m.url);
        const videos = previewMedia.filter(m => m.type === 'video').map(v => ({ url: v.url, thumbnailUrl: v.thumbnailUrl ?? undefined }));
        try {
            await onSubmit({
                title: fd.get('title') as string,
                description: fd.get('description') as string,
                price: fd.get('price') as string,
                priceUnit: fd.get('priceUnit') as string,
                category: fd.get('category') as string,
                type: formType,
                city: isRemote ? '' : formLocation,
                address: isRemote ? '' : formAddress,
                addressLat: formAddressCoords?.lat,
                addressLng: formAddressCoords?.lng,
                radius: isRemote ? 0 : formRadius,
                isRemote,
                deliveryTime: (fd.get('deliveryTime') as string) || undefined,
                durationMinutes: formType === 'offer' ? formDuration : undefined,
                images,
                videos,
                publicId: editingService?.publicId,
            });
        } finally {
            isSubmittingRef.current = false;
            setIsSubmitting(false);
        }
    };

    const isOffer = formType === 'offer';

    return (
        <>
            {/* Backdrop — fades in real time with drag gesture */}
            <motion.div
                style={{ opacity: backdropOpacity }}
                onClick={handleClose}
                className="fixed inset-0 bg-black/50 z-[300] backdrop-blur-sm"
            />

            <div className="fixed inset-0 z-[301] flex items-end sm:items-center justify-center pointer-events-none sm:p-6">
                <motion.div
                    {...sheetDragProps}
                    style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px))', y }}
                    className="bg-white w-full h-[86dvh] sm:h-[88vh] sm:max-w-xl rounded-t-3xl sm:rounded-[2rem] shadow-2xl pointer-events-auto flex flex-col overflow-hidden"
                >
                    <BottomSheetHandle onPointerDown={startDrag} />

                    {/* ── HEADER ── */}
                    <div
                        className="shrink-0 flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-white sm:cursor-default cursor-grab active:cursor-grabbing"
                        style={{ touchAction: 'none' }}
                        onPointerDown={startDrag}
                    >
                        <button onClick={handleClose} className="p-2 -ml-1 rounded-full hover:bg-gray-100 transition-colors text-gray-500 shrink-0">
                            <ArrowLeft size={20} />
                        </button>
                        <h3 className="flex-1 text-lg font-bold text-gray-900 tracking-tight">
                            {editingService ? 'Edytuj ogłoszenie' : 'Nowe ogłoszenie'}
                        </h3>
                        <button onClick={handleClose} className="hidden sm:flex p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 shrink-0">
                            <X size={18} />
                        </button>
                    </div>

                    {/* ── TREŚĆ ── */}
                    <div className="flex-1 overflow-y-auto bg-gray-50/50" style={{ scrollbarGutter: 'stable' }}>
                        <form key={editingService?.publicId ?? 'new'} id="serviceForm" onSubmit={handleSubmit} className="p-5 space-y-6 pb-8">

                            {/* Typ */}
                            <div className="bg-white p-1.5 rounded-xl border border-gray-100 shadow-sm flex gap-1.5">
                                <button
                                    type="button" onClick={() => setFormType('offer')}
                                    className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${isOffer ? 'bg-[#6366F1] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    Oferuję usługę
                                </button>
                                <button
                                    type="button" onClick={() => setFormType('request')}
                                    className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${!isOffer ? 'bg-violet-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    Szukam wykonawcy
                                </button>
                            </div>

                            {/* Podstawowe info */}
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3 ml-1">Podstawowe informacje</p>
                                <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm space-y-4">
                                    <div>
                                        <label className={LABEL}>{isOffer ? 'Tytuł ogłoszenia' : 'Czego szukasz?'}</label>
                                        <input
                                            name="title" required minLength={5} maxLength={120}
                                            defaultValue={editingService?.title}
                                            lang="pl"
                                            autoCorrect="on"
                                            autoCapitalize="sentences"
                                            className={INPUT}
                                            placeholder={isOffer ? 'np. Remont łazienki, Sprzątanie…' : 'np. Potrzebuję hydraulika na cito…'}
                                            onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Tytuł musi mieć co najmniej 5 znaków')}
                                            onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                                            onChange={handleTitleChange}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className={LABEL.replace('mb-1.5', '')}>Kategoria</label>
                                                {isSuggestingCategory && (
                                                    <Loader2 size={11} className="animate-spin text-indigo-400" />
                                                )}
                                                {!isSuggestingCategory && categoryAutoSet && (
                                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-500">
                                                        <Sparkles size={10} /> Sugerowana
                                                    </span>
                                                )}
                                            </div>
                                            <select
                                                name="category"
                                                value={categoryValue}
                                                onChange={e => { suggestAbortRef.current?.abort(); setIsSuggestingCategory(false); setCategoryValue(e.target.value); setCategoryAutoSet(false); setPriceHint(null); setPriceUnitValue(CATEGORY_PRICE_UNIT[e.target.value] || 'za usługę'); setPriceUnitAutoSet(true); }}
                                                className={INPUT}
                                            >
                                                {categories.filter(c => c.id !== 'all').map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className={LABEL.replace('mb-1.5', '')}>{isOffer ? 'Cena' : 'Budżet'}</label>
                                                {(isFetchingPriceHint || isSuggestingCategory) && <Loader2 size={11} className="animate-spin text-indigo-400" />}
                                                {!isFetchingPriceHint && !isSuggestingCategory && priceHint && (
                                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-500">
                                                        <Sparkles size={10} />
                                                        {priceHint.min === priceHint.max
                                                            ? `~${priceHint.min} zł`
                                                            : `${priceHint.min}–${priceHint.max} zł`}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number" name="price" required min="1" step="1"
                                                    defaultValue={editingService ? parsePrice(editingService.price) : ''}
                                                    className={INPUT + " pl-7"}
                                                    placeholder="1"
                                                    onInvalid={e => (e.target as HTMLInputElement).setCustomValidity('Podaj kwotę bez groszy, co najmniej 1 zł')}
                                                    onInput={e => (e.target as HTMLInputElement).setCustomValidity('')}
                                                />
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">zł</span>
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className={LABEL.replace('mb-1.5', '')}>Rozliczenie</label>
                                                {isSuggestingCategory && <Loader2 size={11} className="animate-spin text-indigo-400" />}
                                                {!isSuggestingCategory && priceUnitAutoSet && (
                                                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-indigo-500">
                                                        <Sparkles size={10} /> Sugerowane
                                                    </span>
                                                )}
                                            </div>
                                            <select name="priceUnit" value={priceUnitValue} onChange={e => { setPriceUnitValue(e.target.value); setPriceUnitAutoSet(false); }} className={INPUT}>
                                                <option value="za usługę">za usługę</option>
                                                <option value="za godzinę">za godzinę</option>
                                                <option value="za m²">za m²</option>
                                                <option value="za sztukę">za sztukę</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className={LABEL}>{isOffer ? 'Opis usługi' : 'Opis zlecenia'}</label>
                                        <div className="relative">
                                            <textarea
                                                name="description" required minLength={DESC_MIN} maxLength={5000}
                                                defaultValue={editingService?.description}
                                                onChange={e => setDescLength(e.target.value.length)}
                                                lang="pl"
                                                autoCorrect="on"
                                                autoCapitalize="sentences"
                                                className={INPUT + ` h-28 resize-none pb-6 ${descLength > 0 && descLength < DESC_MIN ? 'ring-2 ring-rose-300 focus:ring-rose-300 bg-rose-50/40' : ''}`}
                                                placeholder={isOffer ? 'Opisz dokładnie co oferujesz…' : 'Opisz czego potrzebujesz, termin, szczegóły…'}
                                            />
                                            <span className={`absolute bottom-2 right-3 text-[10px] font-bold pointer-events-none ${descLength > 0 && descLength < DESC_MIN ? 'text-rose-400' : 'text-gray-300'}`}>
                                                {descLength}/{DESC_MIN} min
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Lokalizacja */}
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3 ml-1">Lokalizacja i zasięg</p>
                                <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm space-y-4">

                                    <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isRemote ? 'bg-indigo-50 border-indigo-100' : 'bg-gray-50 border-gray-100 hover:border-gray-200'}`}>
                                        <input type="checkbox" checked={isRemote} onChange={e => { setIsRemote(e.target.checked); setLocationError(null); }} className="w-5 h-5 accent-[#6366F1] cursor-pointer" />
                                        <Globe size={16} className={isRemote ? 'text-indigo-500' : 'text-gray-400'} />
                                        <span className={`font-semibold text-sm ${isRemote ? 'text-indigo-900' : 'text-gray-700'}`}>Usługa w pełni zdalna / Online</span>
                                    </label>

                                    <div className={`space-y-4 transition-all duration-200 ${isRemote ? 'opacity-30 pointer-events-none' : ''}`}>
                                        <div>
                                            <label className={LABEL}>{isOffer ? 'Twoja baza (miasto)' : 'Miejsce zlecenia'}</label>
                                            <div className="bg-gray-50 rounded-xl border border-transparent focus-within:ring-2 focus-within:ring-[#6366F1]/20 focus-within:bg-white transition-all flex items-center h-[44px] px-3 gap-2">
                                                <CityAutocomplete
                                                    value={formLocation}
                                                    onChange={v => { setFormLocation(v); setLocationError(null); }}
                                                    onSelect={v => { setFormLocation(v); setLocationError(null); }}
                                                    placeholder="Wpisz miasto…"
                                                    className="flex-1 min-w-0"
                                                    inputClassName="bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none w-full"
                                                />
                                                <button type="button" onClick={handleGps} disabled={isGpsLoading} className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-[#6366F1] transition-colors shrink-0">
                                                    {isGpsLoading
                                                        ? <Loader2 size={15} className="animate-spin text-[#6366F1]" />
                                                        : <LocateFixed size={15} className={gpsError ? 'text-rose-400' : ''} />}
                                                </button>
                                            </div>
                                            {gpsError && <p className="text-xs text-rose-400 mt-1 px-1">Nie udało się pobrać lokalizacji. Spróbuj ponownie.</p>}
                                            {locationError && <p className="text-xs text-rose-500 font-medium mt-1 px-1">{locationError}</p>}
                                        </div>

                                        <div>
                                            <label className={LABEL}>Ulica i numer <span className="text-gray-300 font-normal">(opcjonalnie)</span></label>
                                            <div className="bg-gray-50 rounded-xl border border-transparent focus-within:ring-2 focus-within:ring-[#6366F1]/20 focus-within:bg-white transition-all flex items-center px-3 py-3">
                                                <AddressAutocomplete
                                                    value={formAddress}
                                                    city={formLocation}
                                                    onChange={(val) => {
                                                        setFormAddress(val);
                                                        setFormAddressCoords(null);
                                                    }}
                                                    onSelect={(label, lat, lng) => {
                                                        setFormAddress(label);
                                                        setFormAddressCoords({ lat, lng });
                                                    }}
                                                    disabled={isRemote}
                                                    placeholder="np. ul. Marszałkowska 1"
                                                    className="w-full"
                                                    inputClassName="bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none w-full"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1.5 px-1">
                                                Bez adresu ogłoszenie nie pojawi się na mapie — tylko na liście.
                                            </p>
                                        </div>

                                        {isOffer && (
                                            <div>
                                                <div className="flex justify-between items-center mb-3">
                                                    <label className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                                        <Zap size={13} className="text-amber-500" /> Promień dojazdu
                                                    </label>
                                                    <span className="bg-amber-50 border border-amber-100 text-amber-700 px-3 py-1 rounded-lg text-xs font-bold">{formRadius} km</span>
                                                </div>
                                                <input
                                                    type="range" min="0" max="200" step="5"
                                                    value={formRadius}
                                                    onChange={e => setFormRadius(parseInt(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Czas trwania — tylko dla ofert */}
                            {isOffer && (
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em] mb-3 ml-1">Rezerwacje</p>
                                    <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm space-y-4">
                                        <div>
                                            <label className={LABEL}>Średni czas wykonania usługi</label>
                                            <p className="text-[11px] text-gray-400 mb-3">Na tej podstawie generowane są dostępne sloty w kalendarzu rezerwacji.</p>
                                            <div className="grid grid-cols-4 gap-2">
                                                {[30, 45, 60, 90, 120, 150, 180, 240].map(min => (
                                                    <button
                                                        key={min}
                                                        type="button"
                                                        onClick={() => setFormDuration(min)}
                                                        className={`py-3 rounded-xl text-xs font-bold text-center transition-all active:scale-95 ${
                                                            formDuration === min
                                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                                : 'bg-gray-50 text-gray-600 border border-gray-100 hover:border-indigo-200 hover:text-indigo-600'
                                                        }`}
                                                    >
                                                        {min >= 60
                                                            ? `${Math.floor(min / 60)}h${min % 60 > 0 ? `${min % 60}m` : ''}`
                                                            : `${min}m`}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Galeria — zdjęcia i filmy razem */}
                            <div>
                                <div className="flex items-center justify-between mb-3 ml-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">Galeria</p>
                                    <span className="text-[10px] font-bold text-gray-400">
                                        {previewMedia.filter(m => m.type === 'image').length}/5 zdj.
                                        {' · '}
                                        {previewMedia.filter(m => m.type === 'video').length}/3 filmów
                                    </span>
                                </div>
                                <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
                                    <input ref={mediaInputRef} type="file" accept="image/*,video/*" multiple onChange={handleMediaChange} className="hidden" />
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                        {previewMedia.map((item, i) => {
                                            const firstImgIdx = previewMedia.findIndex(m => m.type === 'image');
                                            const isMain = item.type === 'image' && i === firstImgIdx;
                                            return (
                                                <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                                                    className={`relative aspect-square rounded-xl overflow-hidden border-2 ${
                                                        isMain ? 'border-amber-400 ring-2 ring-amber-100' : item.type === 'video' ? 'border-gray-200 bg-slate-900' : 'border-gray-200'
                                                    }`}
                                                >
                                                    {item.type === 'image' ? (
                                                        <img src={item.url} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <>
                                                            {item.thumbnailUrl
                                                                ? <img src={item.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                                                : <video src={item.url} className="w-full h-full object-cover pointer-events-none" muted playsInline preload="metadata" onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 0.1; }} />
                                                            }
                                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                                                                <Film size={20} className="text-white/80" />
                                                            </div>
                                                        </>
                                                    )}
                                                    <button type="button" onClick={e => { e.stopPropagation(); removeMedia(i); }}
                                                        className="absolute top-1.5 right-1.5 bg-white/90 text-red-500 p-1.5 rounded-full shadow-sm hover:bg-red-50 transition-colors z-20">
                                                        <Trash2 size={13} />
                                                    </button>
                                                    {item.type === 'image' && (
                                                        isMain ? (
                                                            <>
                                                                <div className="absolute top-1.5 left-1.5 bg-amber-400 text-white p-1.5 rounded-full shadow-sm z-20"><Star size={13} fill="currentColor" /></div>
                                                                <div className="absolute bottom-0 left-0 right-0 bg-amber-400/95 text-white text-[9px] text-center py-1 font-bold tracking-wider uppercase">Główne</div>
                                                            </>
                                                        ) : (
                                                            <button type="button" onClick={e => setAsMain(e, i)}
                                                                className="absolute top-1.5 left-1.5 bg-white/90 text-gray-400 hover:text-amber-500 p-1.5 rounded-full shadow-sm transition-colors z-20">
                                                                <Star size={13} />
                                                            </button>
                                                        )
                                                    )}
                                                </motion.div>
                                            );
                                        })}

                                        {(previewMedia.filter(m => m.type === 'image').length < 5 || previewMedia.filter(m => m.type === 'video').length < 3) && (
                                            <motion.div layout
                                                onClick={() => uploadProgress === null && mediaInputRef.current?.click()}
                                                className={`rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 group ${uploadProgress !== null ? 'border-indigo-300 bg-indigo-50 cursor-default' : 'border-gray-300 hover:border-[#6366F1] hover:bg-gray-50 cursor-pointer text-gray-400 hover:text-[#6366F1]'} ${previewMedia.length === 0 ? 'col-span-full p-8' : 'aspect-square'}`}
                                            >
                                                {uploadProgress !== null
                                                    ? <div className="flex flex-col items-center justify-center gap-1">
                                                        <div className="relative flex items-center justify-center">
                                                            <svg width="52" height="52" viewBox="0 0 52 52">
                                                                <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(99,102,241,0.2)" strokeWidth="4" />
                                                                <circle
                                                                    cx="26" cy="26" r="22" fill="none"
                                                                    stroke="#6366F1" strokeWidth="4"
                                                                    strokeLinecap="round"
                                                                    strokeDasharray={`${2 * Math.PI * 22}`}
                                                                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - uploadProgress / 100)}`}
                                                                    transform="rotate(-90 26 26)"
                                                                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                                                                />
                                                            </svg>
                                                            <span className="absolute text-indigo-600 text-[11px] font-bold">{uploadProgress}%</span>
                                                        </div>
                                                        <span className="text-[10px] text-indigo-400 font-medium">Przesyłanie…</span>
                                                    </div>
                                                    : <>
                                                        <div className={`bg-gray-100 group-hover:bg-indigo-100 rounded-full group-hover:scale-110 transition-all ${previewMedia.length === 0 ? 'p-4 mb-1' : 'p-3'}`}>
                                                            {previewMedia.length === 0 ? <ImageIcon size={28} /> : <Plus size={22} />}
                                                        </div>
                                                        {previewMedia.length === 0 && (
                                                            <>
                                                                <p className="text-sm text-gray-600 font-medium">Dodaj zdjęcia lub filmy</p>
                                                                <p className="text-xs text-gray-400">Pierwsze zdjęcie będzie głównym</p>
                                                            </>
                                                        )}
                                                    </>
                                                }
                                            </motion.div>
                                        )}
                                    </div>
                                    {uploadError && (
                                        <p className="mt-3 text-xs text-rose-500 font-medium text-center">{uploadError}</p>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* ── FOOTER ── */}
                    <div className="shrink-0 p-4 border-t border-gray-100 bg-white flex gap-3 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'calc(var(--native-cta-h, var(--bottom-nav-total-h, env(safe-area-inset-bottom))) + 1rem)' }}>
                        <button type="button" onClick={handleClose}
                            className="px-5 py-3.5 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-50 transition-colors">
                            Anuluj
                        </button>
                        <button type="submit" form="serviceForm"
                            disabled={isSubmitting || uploadProgress !== null}
                            className={`flex-1 py-3.5 rounded-xl font-bold text-base text-white transition-all shadow-lg flex items-center justify-center gap-2 ${isSubmitting || uploadProgress !== null ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'} ${isOffer ? 'bg-[#6366F1] hover:bg-[#4F46E5] shadow-indigo-200' : 'bg-violet-600 hover:bg-violet-700 shadow-violet-200'}`}>
                            {isSubmitting
                                ? <><Loader2 size={18} className="animate-spin" />{editingService ? 'Zapisywanie…' : 'Publikowanie…'}</>
                                : uploadProgress !== null
                                    ? <><Loader2 size={18} className="animate-spin" />{uploadingType === 'video' ? 'Przesyłanie wideo…' : 'Przesyłanie zdjęcia…'}</>
                                    : editingService ? 'Zapisz zmiany' : 'Opublikuj'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </>
    );
};
