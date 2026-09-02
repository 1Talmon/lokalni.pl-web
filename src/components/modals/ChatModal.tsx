'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../../plugins/NativeNav';
import { usePlatform } from '../../hooks/usePlatform';
import { useChatScroll } from '../../hooks/useChatScroll';
import { UserAvatar } from '../ui/UserAvatar';
import { useSwipeToClose } from '../../hooks/useSwipeToClose';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { BottomSheetHandle } from '../ui/BottomSheetHandle';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, X, ImageIcon, ArrowUp, FileText, ChevronRight, ChevronDown, Trash2, MoreVertical, Film, Images, Play, CalendarPlus } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation'
import { navPush } from '../../utils/navState';
import { Service } from '../../types';
import { BookingCard } from '../chat/BookingCard';
import { RecurringBookingCard } from '../chat/RecurringBookingCard';
import { CreateBookingForClientModal } from './CreateBookingForClientModal';
import { ChatMediaGallery, type ChatMediaItem } from './ChatMediaGallery';
import { MediaLightbox } from './MediaLightbox';
import { chatService } from '../../services/chatService';
import { apiClient } from '../../services/apiClient';
import { createServiceUrl } from '../../utils/helpers';
import { useWsEvent, sendTyping, isWsConnected } from '../../hooks/useWebSocket';
import { normalizeMediaUrl } from '../../utils/normalizeUrl';
import { logger } from '../../utils/logger';
import { startVideoUpload, getVideoUploadState, clearVideoUploadState, type VideoUploadState } from '../../services/videoUploadStore';
import { dataUrlToFile } from '../../utils/imageUtils';

// ─── Typy ─────────────────────────────────────────────────────────────────────

interface ChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentChatId: string | null;
    pendingServiceId?: string | null;
    chatSessions: any[];
    allServices: Service[];
    onSendMessage: (text: string | null, image: string | null) => void;
    onBookingAction?: (messageId: number | string, action: 'accept' | 'decline' | 'cancel' | 'complete') => void;
    onReschedule?: (messageId: number | string, newDate: string, newTime?: string) => void;
    onCreateBooking?: (sessionId: string, date: string, time: string | undefined, servicePublicId: string, recurrence?: { interval: 'weekly' | 'biweekly' | 'monthly'; count: number }) => Promise<void>;
    myServices?: Service[];
    initialMessage?: string;
    asView?: boolean;
}

// ─── Pomocnicze komponenty ─────────────────────────────────────────────────────

const Avatar = ({ src, name, size = 28 }: { src: string | null; name: string; size?: number }) => (
    <UserAvatar src={src} name={name} size={size} className="rounded-full" />
);

const TypingIndicator = ({ avatar, name }: { avatar?: string | null; name: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 6, scale: 0.94 }}
        transition={{ type: 'spring', damping: 24, stiffness: 360 }}
        className="flex items-end gap-2 mt-2"
    >
        <div className="w-8 shrink-0 mb-0.5">
            <Avatar src={avatar ?? null} name={name} size={30} />
        </div>
        <div
            className="bg-white px-[14px] py-[11px] rounded-[20px] rounded-bl-[5px]"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
        >
            <div className="flex gap-[5px] items-center h-[14px]">
                {[0, 1, 2].map(i => (
                    <motion.div
                        key={i}
                        className="w-[7px] h-[7px] rounded-full bg-slate-400"
                        animate={{ scale: [1, 1.45, 1], opacity: [0.35, 1, 0.35] }}
                        transition={{ repeat: Infinity, duration: 1.15, delay: i * 0.18, ease: 'easeInOut' }}
                    />
                ))}
            </div>
        </div>
    </motion.div>
);

// ─── Pomocnicze funkcje ────────────────────────────────────────────────────────

const compressChatImage = (dataUrl: string, maxSide = 1080, quality = 0.72): Promise<string> =>
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

async function parseUploadJson(res: Response): Promise<{ url?: string }> {
    try {
        return await res.json() as { url?: string };
    } catch {
        throw new Error(`Błąd przesyłania (${res.status})`);
    }
}


// Thumbnail cache — przeżywa re-mounty komponentu, tracimy tylko przy hard reload
const videoThumbnailCache = new Map<string, string>();

// ─── VideoBubble ───────────────────────────────────────────────────────────────

interface VideoBubbleProps {
    videoUrl: string;
    msgId: string | number;
    isPending: boolean;
    videoUploadProgress: number | null;
    bubbleCorners: string;
    chatMediaItems: ChatMediaItem[];
    serverThumbnail?: string | null;
    onError: () => void;
    onOpenLightbox: (index: number) => void;
}

const VideoBubble = ({
    videoUrl, msgId: _msgId, isPending, videoUploadProgress, bubbleCorners,
    chatMediaItems, serverThumbnail, onError: _onError, onOpenLightbox,
}: VideoBubbleProps) => {
    // Seed cache z server thumbnail — działa nawet przy ponownym montowaniu
    if (serverThumbnail && !videoThumbnailCache.has(videoUrl)) {
        videoThumbnailCache.set(videoUrl, serverThumbnail);
    }
    const cachedThumb = videoThumbnailCache.get(videoUrl);

    return (
        <div
            data-video-container
            className={`relative overflow-hidden w-[240px] bg-slate-900 ${bubbleCorners} ${!isPending ? 'cursor-pointer' : ''}`}
            style={{ aspectRatio: '9/16', maxHeight: 360, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
            onClick={!isPending ? (e) => {
                e.stopPropagation();
                const idx = chatMediaItems.findIndex(item => item.type === 'video' && item.url === videoUrl);
                onOpenLightbox(idx >= 0 ? idx : 0);
            } : undefined}
        >
            {/* Miniatura znana — <img> ładuje się z wysokim priorytetem, instant jak zdjęcia */}
            {cachedThumb ? (
                <img
                    src={cachedThumb}
                    draggable={false}
                    className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                    onLoad={e => {
                        const img = e.target as HTMLImageElement;
                        const container = img.closest('[data-video-container]') as HTMLElement;
                        if (container && img.naturalWidth && img.naturalHeight) {
                            const ratio = Math.max(img.naturalWidth / img.naturalHeight, 240 / 360);
                            container.style.aspectRatio = String(ratio);
                        }
                    }}
                />
            ) : (
                /* Brak miniatury — ciemny placeholder; serwer generuje thumb dla każdego uploadu,
                   więc ten stan pojawia się tylko chwilowo przed refetchem React Query */
                !isPending && (
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-slate-900 pointer-events-none"
                    >
                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                            <Play size={20} className="text-white/40 ml-0.5" fill="rgba(255,255,255,0.4)" />
                        </div>
                    </div>
                )
            )}
            {!isPending && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <Play size={22} className="text-white ml-1" fill="white" />
                    </div>
                </div>
            )}
            {isPending && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                    {videoUploadProgress !== null ? (
                        <>
                            <svg width="52" height="52" viewBox="0 0 52 52">
                                <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                                <circle
                                    cx="26" cy="26" r="22" fill="none"
                                    stroke="white" strokeWidth="4"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 22}`}
                                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - videoUploadProgress / 100)}`}
                                    transform="rotate(-90 26 26)"
                                    style={{ transition: 'stroke-dashoffset 0.3s ease' }}
                                />
                            </svg>
                            <span className="text-white text-[12px] font-[700]">{videoUploadProgress}%</span>
                        </>
                    ) : (
                        <span className="w-9 h-9 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Główny komponent ─────────────────────────────────────────────────────────

export const ChatModal = ({
    isOpen, onClose, currentChatId, pendingServiceId, chatSessions,
    allServices, onSendMessage, onBookingAction, onReschedule, onCreateBooking, myServices, initialMessage, asView,
}: ChatModalProps) => {
    const { isNative } = usePlatform();
    const { panelRef, panelX, backdropOpacity } = useSwipeToClose(isOpen, onClose);
    const router = useRouter();
    const queryClient = useQueryClient();

    // ── Stan ─────────────────────────────────────────────────────────────────
    const [chatInput, setChatInput] = useState('');
    const [pendingImage, setPendingImage] = useState<string | null>(null);
    const [pendingVideo, setPendingVideo] = useState<string | null>(null);
    const pendingVideoFileRef = useRef<File | null>(null);
    const [pendingFile, setPendingFile] = useState<{ file: File; name: string; mime: string } | null>(null);
    const [isSending, setIsSending] = useState(false);
    const [olderMsgs, setOlderMsgs] = useState<any[]>([]);
    const [isLoadingOlder, setIsLoadingOlder] = useState(false);
    const [hasMoreOlder, setHasMoreOlder] = useState(false);
    const [optimisticMsgs, setOptimisticMsgs] = useState<any[]>([]);
    const [otherIsTyping, setOtherIsTyping] = useState(false);
    const [liveOnline, setLiveOnline] = useState<boolean | null>(null);
    const [liveLastSeen, setLiveLastSeen] = useState<string | null>(null);
    const [chatLightboxOpen, setChatLightboxOpen] = useState(false);
    const [chatLightboxIndex, setChatLightboxIndex] = useState(0);
    useEffect(() => { chatLightboxOpenRef.current = chatLightboxOpen; }, [chatLightboxOpen]);
    const [mediaGalleryOpen, setMediaGalleryOpen] = useState(false);
    const mediaGalleryOpenRef = useRef(false);
    useEffect(() => { mediaGalleryOpenRef.current = mediaGalleryOpen; }, [mediaGalleryOpen]);
    const [deleteMenu, setDeleteMenu] = useState<{ msgId: string; isMe: boolean; isLiked: boolean; x: number; y: number } | null>(null);
    const lastTapRef = useRef<{ msgId: string; time: number } | null>(null);
    const [sendErrorMsg, setSendErrorMsg] = useState<string | null>(null);
    const [videoUploadProgress, setVideoUploadProgress] = useState<number | null>(null);
    const [_bgUploadTempId, setBgUploadTempId] = useState<string | null>(null);
    const [failedMedia, setFailedMedia] = useState<Set<string>>(new Set());
    const { sheetDragProps: deleteSheetProps, startDrag: startDeleteDrag } = useBottomSheet(() => setDeleteMenu(null));
    const [showCreateBooking, setShowCreateBooking] = useState(false);

    // ── Refs ─────────────────────────────────────────────────────────────────
    // (scroll refs zarządzane przez useChatScroll)
    const chatEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const mediaInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const otherTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const typingSentRef = useRef(false);
    const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
    const chatLightboxOpenRef = useRef(false);
    const initialMsgIdsRef = useRef<Set<string | number>>(new Set());
    const msgIdsInitializedRef = useRef(false);

    // ── Dane sesji ────────────────────────────────────────────────────────────
    const activeSession = chatSessions.find((c: any) => c.id === currentChatId);
    const servicePublicId = activeSession?.servicePublicId ?? pendingServiceId;
    const service = (allServices ?? []).find(s => s.publicId === servicePublicId);
    const providerUid = activeSession?.otherPartyUid || service?.provider?.uid;
    const isProvider = activeSession?.isProvider ?? false;
    const isRequest = (activeSession?.serviceType ?? service?.type) === 'request';
    const serviceSlug = service ? createServiceUrl(service.title, service.publicId ?? '') : null;
    const sessionName = activeSession?.otherPartyName || service?.provider?.name || 'Użytkownik';
    const sessionAvatar = normalizeMediaUrl(activeSession?.otherPartyAvatar) || null;
    const sessionTitle = activeSession?.serviceTitle || service?.title || '';

    // ── Zapytanie o wiadomości ────────────────────────────────────────────────
    const {
        data: messagesData,
        refetch: refetchMessages,
        isFetching,
        isError,
        error: messagesError,
    } = useQuery({
        queryKey: ['chat-messages', currentChatId],
        queryFn: () => chatService.getMessages(currentChatId!, 50),
        enabled: isOpen && !!currentChatId,
        refetchInterval: isOpen && !isWsConnected() ? 10000 : false,
        staleTime: 3000,
        retry: 1,
    });

    // ── Scroll management ─────────────────────────────────────────────────────
    const {
        containerRef, contentRef,
        kbHeight, messagesVisible, showScrollBtn, unreadWhileScrolled,
        onScroll, onTouchStart, onTouchMove,
        scrollToBottom, snapToBottom,
        addUnread,
        restoreScrollAfterOlderLoad,
        pauseAutoScrollRef,
    } = useChatScroll({
        isOpen,
        chatId: currentChatId,
        hasData: messagesData !== undefined || isError,
        isNative,
        onScrolledToTop: () => {
            if (!hasMoreOlder || isLoadingOlder) return;
            const prevH = containerRef.current?.scrollHeight ?? 0;
            loadOlderMessages().then(() => restoreScrollAfterOlderLoad(prevH));
        },
    });

    useEffect(() => {
        if (messagesData !== undefined) {
            if (!msgIdsInitializedRef.current) {
                msgIdsInitializedRef.current = true;
                initialMsgIdsRef.current = new Set(messagesData.map((m: any) => m.id));
            }
            // eslint-disable-next-line eqeqeq
            setOptimisticMsgs(prev => prev.filter(m => (m as any).uploadId != null));
            setHasMoreOlder((messagesData?.length ?? 0) >= 50);

            // Preload miniaturek wideo i zdjęć — WKWebView (Capacitor) nie buforuje agresywnie jak Chrome,
            // więc ładujemy przez new Image() z góry żeby trafić w cache zanim <img> się wyrenderuje
            // (dotyczy też widoku galerii — tam używamy tych samych URL-i).
            for (const msg of messagesData) {
                const thumb = (msg as any).videoThumbnail;
                if (thumb && typeof thumb === 'string') new Image().src = thumb;
                const img = msg.image;
                if (img && typeof img === 'string') new Image().src = normalizeMediaUrl(img) ?? img;
            }
        }
    }, [messagesData]);

    // ── Ładowanie starszych ───────────────────────────────────────────────────
    const loadOlderMessages = async () => {
        if (!currentChatId || isLoadingOlder) return;
        const allCurrent = [...olderMsgs, ...(messagesData ?? [])];
        const firstId = allCurrent[0]?.id;
        if (!firstId) return;
        setIsLoadingOlder(true);
        try {
            const older = await chatService.getMessages(currentChatId, 50, String(firstId));
            if (older.length === 0) { setHasMoreOlder(false); return; }
            setOlderMsgs(prev => [...older, ...prev]);
            setHasMoreOlder(older.length >= 50);
        } catch {
            // ignoruj
        } finally {
            setIsLoadingOlder(false);
        }
    };

    // ── WebSocket ─────────────────────────────────────────────────────────────
    useWsEvent('new_message', useCallback((payload) => {
        if (!isOpen || payload.sessionId !== currentChatId) return;
        refetchMessages();
        if (payload.senderRole !== 'me') addUnread();
        chatService.markRead(currentChatId!).then(() => {
            queryClient.invalidateQueries({ queryKey: ['chats'] });
            queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
        }).catch(() => void 0);
    }, [isOpen, currentChatId, refetchMessages, addUnread, queryClient]));

    useWsEvent('online_status', useCallback((payload) => {
        const otherUid = activeSession?.otherPartyUid;
        if (!otherUid || payload.uid !== otherUid) return;
        setLiveOnline(payload.isOnline as boolean);
        setLiveLastSeen((payload.lastSeenAt as string | null) ?? null);
    }, [activeSession?.otherPartyUid]));

    useWsEvent('typing', useCallback((payload) => {
        if (!isOpen || payload.sessionId !== currentChatId) return;
        setOtherIsTyping(payload.isTyping as boolean);
        if (otherTypingTimeoutRef.current) clearTimeout(otherTypingTimeoutRef.current);
        if (payload.isTyping) {
            otherTypingTimeoutRef.current = setTimeout(() => setOtherIsTyping(false), 3000);
        }
    }, [isOpen, currentChatId]));

    useWsEvent('message_reaction', useCallback((payload) => {
        if (payload.sessionId !== currentChatId) return;
        // Aktualizuj tylko likedBy z payloadu — bez refetch, żeby nie triggerować scrolla
        queryClient.setQueryData(['chat-messages', currentChatId], (old: any) => {
            if (!Array.isArray(old)) return old;
            return old.map((m: any) =>
                String(m.id) === payload.msgId
                    ? { ...m, likedBy: payload.likedBy as string[] }
                    : m
            );
        });
        queryClient.invalidateQueries({ queryKey: ['chats'] });
    }, [currentChatId, queryClient]));

    useWsEvent('booking_update', useCallback((payload) => {
        const { bookingId, status } = payload as { bookingId: number | string; status: string };
        // Aktualizuj olderMsgs (lokalne state) — messagesData jest odświeżane przez globalny invalidateQueries
        setOlderMsgs(prev => prev.map((msg: any) =>
            // eslint-disable-next-line eqeqeq
            msg.bookingData?.id != null && String(msg.bookingData.id) === String(bookingId)
                ? { ...msg, bookingData: { ...msg.bookingData, status } }
                : msg
        ));
    }, []));

    // ── Oznaczanie jako przeczytane ───────────────────────────────────────────
    useEffect(() => {
        if (!isOpen || !currentChatId) return;
        chatService.markRead(currentChatId)
            .then(() => {
                queryClient.invalidateQueries({ queryKey: ['chats'] });
                queryClient.invalidateQueries({ queryKey: ['notification-counts'] });
                queryClient.invalidateQueries({ queryKey: ['notifications-list'] });
            });
    }, [isOpen, currentChatId, queryClient]);

    // ── Wypełnienie inputu przy otwarciu ──────────────────────────────────────
    useEffect(() => {
        if (isOpen && initialMessage) setChatInput(initialMessage);
    }, [isOpen, initialMessage]);

    // ── Scroll lock + Escape ──────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        lockScroll();
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !chatLightboxOpenRef.current && !mediaGalleryOpenRef.current) onCloseRef.current(); };
        window.addEventListener('keydown', onKey);
        return () => { unlockScroll(); window.removeEventListener('keydown', onKey); };
    }, [isOpen]);

    // ── Zamknij modal gdy użytkownik nawiguje poza stronę (np. iOS native swipe-back) ──
    // Zastępuje history.pushState — tamto podejście zawsze zostawiało ghost entry
    // w historii i psuło navigate(-1) w handleBack (lądowanie na stronie głównej).
    const routerPathname = usePathname();
    const prevPathnameRef = useRef(routerPathname);
    useEffect(() => {
        const prev = prevPathnameRef.current;
        prevPathnameRef.current = routerPathname;
        if (prev !== routerPathname) {
            onCloseRef.current();
        }
    }, [routerPathname]);


    // ── Auto-resize textarea ──────────────────────────────────────────────────
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }, [chatInput]);

    // ── Reset przy zmianie sesji ──────────────────────────────────────────────
    useEffect(() => {
        setLiveOnline(null);
        setLiveLastSeen(null);
        setOlderMsgs([]);
        setHasMoreOlder(false);
        setOptimisticMsgs([]);
        setFailedMedia(new Set());
        msgIdsInitializedRef.current = false;
        initialMsgIdsRef.current = new Set();
    }, [currentChatId]);

    // ── Upload wideo w tle — subskrypcja store ────────────────────────────────
    useEffect(() => {
        if (!isOpen || !currentChatId) return;

        // Przywróć stan uploadu jeśli user wrócił do czatu w trakcie
        const existing = getVideoUploadState();
        if (existing && existing.sessionId === currentChatId) {
            if (existing.status === 'uploading') {
                setVideoUploadProgress(existing.progress);
                setBgUploadTempId(existing.tempId);
                setIsSending(true);
            }
        }

        const handler = (e: Event) => {
            const s = (e as CustomEvent<VideoUploadState>).detail;
            if (s.sessionId !== currentChatId) return;

            if (s.status === 'uploading') {
                setVideoUploadProgress(s.progress);
                setBgUploadTempId(s.tempId);
                setIsSending(true);
            } else if (s.status === 'done') {
                // chatService.sendMessage is already called inside videoUploadStore —
                // here we only handle UI: hide progress, clean up optimistic message.
                setVideoUploadProgress(null);
                setBgUploadTempId(null);
                setIsSending(false);
                // Usuń optimistic dopiero po pobraniu realnych wiadomości — eliminuje flash
                refetchMessages().then(() => {
                    setOptimisticMsgs(prev => prev.filter(m => m.id !== s.tempId));
                });
                queryClient.invalidateQueries({ queryKey: ['chats'] });
                clearVideoUploadState();
            } else if (s.status === 'error') {
                setVideoUploadProgress(null);
                setBgUploadTempId(null);
                setIsSending(false);
                setOptimisticMsgs(prev => prev.filter(m => m.id !== s.tempId));
                setSendErrorMsg(s.error ?? 'Błąd wysyłania wideo');
                clearVideoUploadState();
            }
        };

        window.addEventListener('videoUpload:state', handler);
        return () => window.removeEventListener('videoUpload:state', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, currentChatId]);


    // ── Wysyłanie wiadomości ──────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!chatInput.trim() && !pendingImage && !pendingVideo && !pendingFile) || isSending) return;
        setSendErrorMsg(null);
        if (isNative) Haptics.impact({ style: ImpactStyle.Light });

        const textToSend = chatInput.trim();
        const imageToSend = pendingImage;
        const videoFile = pendingVideoFileRef.current;
        const videoPreviewUrl = pendingVideo;
        const fileToSend = pendingFile;
        const wasKbOpen = kbHeight > 0;

        const tempId = `temp-${Date.now()}`;
        const optimistic = {
            id: tempId,
            sender: 'me' as const,
            text: textToSend || undefined,
            image: imageToSend ?? undefined,
            video: videoFile && videoPreviewUrl ? videoPreviewUrl : undefined,
            fileUrl: fileToSend ? '__pending__' : undefined,
            fileName: fileToSend?.name,
            fileMime: fileToSend?.mime,
            time: new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' }),
            sentAt: new Date().toISOString(),
            isDeletedForAll: false,
            bookingData: undefined,
            pending: true,
        };
        snapToBottom();
        setOptimisticMsgs(prev => [...prev, optimistic]);

        setChatInput('');
        setPendingImage(null);
        setPendingVideo(null);
        setPendingFile(null);
        pendingVideoFileRef.current = null;
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
        if (!isNative || wasKbOpen) textareaRef.current?.focus();

        if (currentChatId) {
            if (videoFile) {
                setBgUploadTempId(tempId);
                setIsSending(true);
                setVideoUploadProgress(0);
                startVideoUpload(currentChatId, tempId, videoFile, textToSend || undefined, () => {
                    queryClient.invalidateQueries({ queryKey: ['chats'] });
                    queryClient.invalidateQueries({ queryKey: ['chat-messages', currentChatId] });
                });
                if (videoPreviewUrl) setTimeout(() => URL.revokeObjectURL(videoPreviewUrl), 3000);
            } else {
                setIsSending(true);
                try {
                    if (fileToSend) {
                        const fd = new FormData();
                        fd.append('file', fileToSend.file);
                        fd.append('name', fileToSend.name);
                        const uploadRes = await apiClient.postFormData('/upload/file', fd);
                        const uploaded = await uploadRes.json() as { url?: string; name?: string; mime?: string; error?: string };
                        if (!uploadRes.ok || !uploaded.url) throw new Error(uploaded.error ?? 'Błąd przesyłania pliku');
                        await chatService.sendMessage(currentChatId, textToSend || undefined, undefined, undefined, {
                            url: uploaded.url, name: uploaded.name ?? fileToSend.name, mime: uploaded.mime ?? fileToSend.mime,
                        });
                    } else if (imageToSend && imageToSend.startsWith('data:')) {
                        const fd = new FormData();
                        const file = dataUrlToFile(imageToSend, 'chat.jpg');
                        fd.append('file', file);
                        fd.append('context', 'chat');
                        const uploadRes = await apiClient.postFormData('/upload/image', fd);
                        const uploaded = await parseUploadJson(uploadRes);
                        if (!uploadRes.ok || !uploaded.url) throw new Error('Błąd przesyłania zdjęcia');
                        // Preload URL serwera zanim podmienimy src — przeglądarka ma go w cache
                        // gdy React zmieni src, więc <img> nie przechodzi przez stan "ładowania"
                        await new Promise<void>(resolve => {
                            const img = new window.Image();
                            img.onload = img.onerror = () => resolve();
                            img.src = uploaded.url ?? '';
                        });
                        // Podmień src IN PLACE (ten sam węzeł React) — zero flashu
                        setOptimisticMsgs(prev => prev.map(m =>
                            m.id === tempId ? { ...m, image: uploaded.url, pending: false } : m
                        ));
                        const sentMsg = await chatService.sendMessage(currentChatId, textToSend || undefined, uploaded.url);
                        // Podmień tempId na prawdziwe id z serwera — deduplication będzie dokładne
                        // eslint-disable-next-line eqeqeq
                        if (sentMsg?.id != null) {
                            setOptimisticMsgs(prev => prev.map(m =>
                                m.id === tempId ? { ...m, id: sentMsg.id } : m
                            ));
                        }
                    } else {
                        await chatService.sendMessage(currentChatId, textToSend || undefined, imageToSend || undefined);
                    }
                    refetchMessages();
                    queryClient.invalidateQueries({ queryKey: ['chats'] });
                } catch (err: any) {
                    setOptimisticMsgs(prev => prev.filter(m => m.id !== tempId));
                    if (!fileToSend) setChatInput(textToSend);
                    setSendErrorMsg(err?.message ?? 'Błąd wysyłania');
                    logger.error('sendMessage error:', err);
                } finally {
                    setIsSending(false);
                }
            }
        } else {
            onSendMessage(imageToSend ? (textToSend || null) : textToSend, imageToSend ?? null);
        }
    };

    // ── Obsługa mediów ────────────────────────────────────────────────────────
    const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (mediaInputRef.current) mediaInputRef.current.value = '';

        if (file.type.startsWith('video/')) {
            if (file.size > 100 * 1024 * 1024) {
                setSendErrorMsg('Film jest za duży. Maksymalny rozmiar to 100 MB.');
                return;
            }
            if (pendingVideo) URL.revokeObjectURL(pendingVideo);
            setPendingImage(null);
            setPendingFile(null);
            const previewUrl = URL.createObjectURL(file);
            const vid = document.createElement('video');
            vid.preload = 'metadata';
            vid.onloadedmetadata = () => {
                if (vid.duration > 300) {
                    setSendErrorMsg('Film jest za długi. Maksymalna długość to 5 minut.');
                    URL.revokeObjectURL(previewUrl);
                    return;
                }
                setPendingVideo(previewUrl);
                pendingVideoFileRef.current = file;
                if (isNative) setTimeout(() => { textareaRef.current?.focus(); Keyboard.show().catch(() => void 0); }, 350);
            };
            vid.onerror = () => {
                // Nie można odczytać metadanych — dopuszczamy, backend zweryfikuje
                setPendingVideo(previewUrl);
                pendingVideoFileRef.current = file;
            };
            vid.src = previewUrl;
        } else if (file.type.startsWith('image/')) {
            if (file.type === 'image/heic' || file.type === 'image/heif') {
                setSendErrorMsg('Format HEIC nie jest obsługiwany. Wyślij zdjęcie jako JPG lub PNG.');
                return;
            }
            setPendingVideo(null);
            pendingVideoFileRef.current = null;
            setPendingFile(null);
            const reader = new FileReader();
            reader.onload = async () => {
                const compressed = await compressChatImage(reader.result as string);
                setPendingImage(compressed);
            };
            reader.readAsDataURL(file);
            if (isNative) setTimeout(() => { textareaRef.current?.focus(); Keyboard.show().catch(() => void 0); }, 350);
        } else {
            // Document file (PDF, Word, etc.)
            if (file.size > 20 * 1024 * 1024) {
                setSendErrorMsg('Plik jest za duży. Maksymalny rozmiar to 20 MB.');
                return;
            }
            setPendingFile({ file, name: file.name, mime: file.type });
            setPendingImage(null);
            setPendingVideo(null);
            pendingVideoFileRef.current = null;
            if (isNative) setTimeout(() => { textareaRef.current?.focus(); Keyboard.show().catch(() => void 0); }, 350);
        }
    };

    const handlePickMedia = () => {
        if (mediaInputRef.current) mediaInputRef.current.value = '';
        mediaInputRef.current?.click();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
    };

    // ── Nawigacja ─────────────────────────────────────────────────────────────
    const goToProfile = async () => {
        if (!providerUid) return;
        if (Capacitor.isNativePlatform()) { await NativeNav.push({ fullScreen: true }).catch(() => {}); router.push(`/profile/${providerUid}`); }
        else { onClose(); router.push(`/profile/${providerUid}`); }
    };
    const goToService = async () => {
        if (!servicePublicId) return;
        if (Capacitor.isNativePlatform()) { await NativeNav.push({ fullScreen: true }).catch(() => {}); router.push(`/service/${serviceSlug ?? servicePublicId}`); }
        else { onClose(); router.push(`/service/${serviceSlug ?? servicePublicId}`); }
    };

    // ── Usuwanie wiadomości ───────────────────────────────────────────────────
    const handleDeleteMessage = async (msgId: string, scope: 'self' | 'all') => {
        setDeleteMenu(null);
        try {
            const res = await apiClient.post(`/chats/${currentChatId}/messages/${msgId}/delete`, { scope });
            if (res.ok) {
                await refetchMessages();
                queryClient.invalidateQueries({ queryKey: ['chats'] });
            }
        } catch {
            await refetchMessages();
        }
    };

    const handleToggleLike = useCallback(async (msgId: string) => {
        if (!currentChatId) return;
        // Optimistic toggle w cache
        queryClient.setQueryData(['chat-messages', currentChatId], (old: any) => {
            if (!Array.isArray(old)) return old;
            return old.map((m: any) => {
                if (String(m.id) !== msgId) return m;
                const nowLiked = !m.isLikedByMe;
                return {
                    ...m,
                    isLikedByMe: nowLiked,
                    likedBy: nowLiked
                        ? [...(m.likedBy ?? []), '__me__']
                        : (m.likedBy ?? []).filter((u: string) => u !== '__me__').slice(0, -1),
                };
            });
        });
        try {
            await chatService.reactToMessage(currentChatId, msgId);
        } catch {
            refetchMessages();
        }
    }, [currentChatId, queryClient, refetchMessages]);

    // ── Dane pochodne ─────────────────────────────────────────────────────────
    const canSend = (chatInput.trim().length > 0 || !!pendingImage || !!pendingVideo || !!pendingFile) && !isSending;

    const formatDateLabel = (iso: string): string => {
        const d = new Date(iso);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const diffDays = Math.round((today.getTime() - msgDay.getTime()) / 86400000);
        if (diffDays === 0) return 'Dzisiaj';
        if (diffDays === 1) return 'Wczoraj';
        if (diffDays < 7) return d.toLocaleDateString('pl-PL', { weekday: 'long' });
        return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: diffDays > 365 ? 'numeric' : undefined });
    };

    const mapMsg = (m: any) => ({
        id: m.id,
        sender: m.sender as 'me' | 'other',
        text: m.text ?? undefined,
        image: m.image ?? undefined,
        video: m.video ?? undefined,
        videoThumbnail: m.videoThumbnail ?? undefined,
        fileUrl: m.fileUrl ?? undefined,
        fileName: m.fileName ?? undefined,
        fileMime: m.fileMime ?? undefined,
        time: m.timeLabel,
        sentAt: m.sentAt as string,
        isDeletedForAll: !!m.isDeletedForAll,
        likedBy: (m.likedBy ?? []) as string[],
        isLikedByMe: !!m.isLikedByMe,
        bookingData: m.bookingData ? {
            id: String(m.bookingData.id),
            servicePublicId: (m.bookingData as any).servicePublicId ?? undefined,
            status: m.bookingData.status,
            serviceType: m.bookingData.serviceType,
            serviceTitle: m.bookingData.serviceTitle || '',
            serviceImage: m.bookingData.serviceImage || '',
            providerName: sessionName,
            providerAvatar: sessionAvatar,
            price: String(m.bookingData.price ?? 0),
            priceUnit: m.bookingData.priceUnit || 'zł',
            clientReviewed: (m.bookingData as any).clientReviewed ?? false,
            createdAt: m.bookingData.createdAt || m.sentAt,
            date: m.bookingData.date ?? undefined,
            time: m.bookingData.time ?? undefined,
            address: m.bookingData.address ?? undefined,
            notes: m.bookingData.notes ?? undefined,
            message: m.bookingData.message ?? undefined,
            // eslint-disable-next-line eqeqeq
            proposedPrice: m.bookingData.proposedPrice != null ? String(m.bookingData.proposedPrice) : undefined,
            availableFrom: m.bookingData.availableFrom ?? undefined,
            seriesId: (m.bookingData as any).seriesId ?? undefined,
            seriesBookings: (m.bookingData as any).seriesBookings ?? undefined,
        } : undefined,
    });

    const msgs = useMemo(() => {
        const realMsgs = [...olderMsgs.map(mapMsg), ...(messagesData ?? []).map(mapMsg)];
        if (optimisticMsgs.length === 0) return realMsgs;

        const pendingOptimistic = optimisticMsgs.filter(m => !(m as any).uploadId);
        if (pendingOptimistic.length === 0) return [...realMsgs, ...optimisticMsgs];

        // Dla każdej pending optimistic znajdź realną wiadomość "me" o bliskim timestamp
        // (±10s) i ukryj ją — zamiast heurystyki "ostatnie N", która może ukryć złą wiadomość
        // Chowamy tylko realne wiadomości z dokładnym ID — ustawianym po sendMessage().
        // Brak fallbacku po timestamp: podczas uploadu opt ma temp-ID i nic nie chowa,
        // więc poprzednie wiadomości "me" zawsze pozostają widoczne.
        const hiddenRealIds = new Set<string | number>();
        for (const opt of pendingOptimistic) {
            if (String(opt.id).startsWith('temp-')) continue;
            const exact = realMsgs.find(r => r.id === opt.id);
            if (exact) hiddenRealIds.add(exact.id);
        }
        const deduped = hiddenRealIds.size > 0 ? realMsgs.filter(m => !hiddenRealIds.has(m.id)) : realMsgs;
        return [...deduped, ...optimisticMsgs];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [olderMsgs, messagesData, optimisticMsgs]);

    const chatMediaItems = useMemo<ChatMediaItem[]>(() =>
        msgs
            .filter(m => !(m as any).pending && (m.image || m.video))
            .map(m => m.image
                ? { type: 'image' as const, url: normalizeMediaUrl(m.image) ?? m.image }
                : {
                    type: 'video' as const,
                    url: normalizeMediaUrl(m.video!) ?? m.video!,
                    thumbnail: (m as any).videoThumbnail ? (normalizeMediaUrl((m as any).videoThumbnail) ?? (m as any).videoThumbnail) : undefined,
                }
            ),
        [msgs]
    );
    const msgsByDate = useMemo(() => {
        const groups: { dateKey: string; label: string; msgs: typeof msgs }[] = [];
        msgs.forEach(msg => {
            const dateKey = msg.sentAt ? msg.sentAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
            const last = groups[groups.length - 1];
            if (last && last.dateKey === dateKey) {
                last.msgs.push(msg);
            } else {
                groups.push({ dateKey, label: formatDateLabel(msg.sentAt ?? new Date().toISOString()), msgs: [msg] });
            }
        });
        return groups;
    }, [msgs]);

    // Dla każdego bookingId zapamiętaj ID ostatniej wiadomości — starsze są "outdated"
    const latestBookingMsgIds = useMemo(() => {
        const map = new Map<string, string>();
        msgs.forEach(m => {
            if (m.bookingData?.id) map.set(String(m.bookingData.id), m.id);
        });
        return map;
    }, [msgs]);

    const lastMeMsg = msgs.reduce<typeof msgs[0] | null>((acc, m) => m.sender === 'me' ? m : acc, null);
    const meStatus = !lastMeMsg ? null
        : (lastMeMsg as any).pending ? 'wysyłanie…'
        : msgs.slice(msgs.indexOf(lastMeMsg) + 1).some(m => m.sender === 'other') ? 'odpisano'
        : 'wysłano';

    const isOnlineNow = liveOnline !== null ? liveOnline : (activeSession?.otherPartyOnline ?? false);
    const displayStatus = (() => {
        if (otherIsTyping) return 'pisze…';
        if (isOnlineNow) return 'Aktywny teraz';
        const lastSeenRaw = liveLastSeen ?? activeSession?.otherPartyLastSeen;
        if (!lastSeenRaw) return activeSession?.otherPartyStatus ?? 'Offline';
        const diffMin = Math.floor((Date.now() - new Date(lastSeenRaw).getTime()) / 60000);
        if (diffMin < 1) return 'Aktywny przed chwilą';
        if (diffMin < 60) return `Aktywny ${diffMin} min temu`;
        if (diffMin < 1440) return `Aktywny ${Math.floor(diffMin / 60)}h temu`;
        return `Aktywny ${Math.floor(diffMin / 1440)} dni temu`;
    })();

    // ── Renderowanie ──────────────────────────────────────────────────────────
    if (!isOpen) return null;

    return (
        <>
            <MediaLightbox
                isOpen={chatLightboxOpen}
                onClose={() => setChatLightboxOpen(false)}
                items={chatMediaItems}
                initialIndex={chatLightboxIndex}
                nativeBottomPadding={isNative}
                onOpenGallery={() => { setChatLightboxOpen(false); setMediaGalleryOpen(true); }}
            />
            <ChatMediaGallery
                isOpen={mediaGalleryOpen}
                onClose={() => setMediaGalleryOpen(false)}
                items={chatMediaItems}
            />

            {/* Backdrop — only in modal mode */}
            {!asView && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    style={isNative ? { opacity: backdropOpacity } : undefined}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/50 z-[100000] backdrop-blur-sm"
                />
            )}

            <div
                className={asView
                    ? "fixed inset-0 z-[300] overflow-hidden"
                    : "fixed inset-0 z-[100001] flex items-end md:items-center justify-center pointer-events-none md:p-6"
                }
            >
                <motion.div
                    ref={asView ? undefined : panelRef}
                    initial={asView ? undefined : (isNative ? undefined : { y: '100%', opacity: 0 })}
                    animate={asView ? undefined : (isNative ? undefined : { y: 0, opacity: 1 })}
                    exit={asView ? undefined : (isNative
                        ? { x: '100%', transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] } }
                        : { y: '100%', opacity: 0, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }
                    )}
                    transition={asView ? undefined : (isNative ? undefined : { type: 'spring', damping: 26, stiffness: 380, mass: 0.8 })}
                    data-modal-panel
                    className={asView
                        ? "w-full h-full flex flex-col overflow-hidden bg-white"
                        : "w-full h-full md:h-[85vh] md:max-h-[820px] md:w-[560px] md:rounded-3xl flex flex-col overflow-hidden pointer-events-auto"
                    }
                    style={asView ? { background: '#ffffff' } : {
                        x: panelX,
                        background: '#ffffff',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
                    }}
                >
                    {/* ══ HEADER ══ */}
                    <div
                        className="shrink-0 bg-white/95 backdrop-blur-xl"
                        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
                    >
                        <div className="flex items-center gap-2 px-3 pt-3 pb-2.5">
                            {/* Back button */}
                            <button
                                onClick={onClose}
                                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
                            >
                                <ArrowLeft size={20} />
                            </button>

                            {/* Avatar + name */}
                            <button
                                onClick={goToProfile}
                                disabled={!providerUid}
                                className="flex items-center gap-2.5 flex-1 min-w-0 text-left group disabled:cursor-default"
                            >
                                <div className="relative shrink-0">
                                    <Avatar src={sessionAvatar} name={sessionName} size={42} />
                                    <AnimatePresence>
                                        {isOnlineNow && (
                                            <motion.span
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className={`font-[700] text-[15px] text-slate-900 truncate leading-[1.25] ${providerUid ? 'group-hover:text-indigo-600 transition-colors' : ''}`}>
                                        {sessionName || 'Użytkownik'}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-[2px]">
                                        {(isOnlineNow || otherIsTyping) && (
                                            <motion.span
                                                initial={{ scale: 0.5, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0"
                                            />
                                        )}
                                        <p className={`text-[12px] font-[500] truncate ${isOnlineNow || otherIsTyping ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            {displayStatus}
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {/* Gallery button */}
                            {chatMediaItems.length > 0 && (
                                <button
                                    onClick={() => setMediaGalleryOpen(true)}
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-indigo-500 active:bg-slate-200 transition-colors shrink-0"
                                >
                                    <Images size={18} />
                                </button>
                            )}

                            {/* Add booking button — only for provider, non-request service */}
                            {isProvider && !isRequest && currentChatId && (
                                <button
                                    onClick={() => setShowCreateBooking(true)}
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-indigo-500 active:bg-slate-200 transition-colors shrink-0"
                                >
                                    <CalendarPlus size={18} />
                                </button>
                            )}

                            {/* Close on desktop */}
                            <button
                                onClick={onClose}
                                className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-slate-400 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0"
                            >
                                <X size={17} />
                            </button>
                        </div>

                        {/* Service bar */}
                        {sessionTitle && (() => {
                            const serviceImg = normalizeMediaUrl(
                                (activeSession as any)?.serviceImage || service?.image || (service as any)?.images?.[0]
                            );
                            return (
                                <button
                                    onClick={goToService}
                                    disabled={!servicePublicId}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:cursor-default"
                                    style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
                                >
                                    {serviceImg ? (
                                        <img
                                            src={serviceImg}
                                            alt=""
                                            className="w-11 h-11 rounded-xl object-cover shrink-0"
                                        />
                                    ) : (
                                        <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                                            <FileText size={19} className="text-indigo-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-[10px] font-[700] uppercase tracking-[0.1em] text-slate-400 mb-[3px]">Ogłoszenie</p>
                                        <p className="text-[13.5px] font-[700] text-slate-800 truncate leading-tight">
                                            {sessionTitle}
                                        </p>
                                    </div>
                                    {servicePublicId && <ChevronRight size={15} className="text-slate-300 shrink-0" />}
                                </button>
                            );
                        })()}
                    </div>

                    {/* ══ MESSAGES ══ */}
                    <div className="flex-1 overflow-hidden relative bg-white">
                        {!messagesVisible && isOpen && !!currentChatId && (
                            <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: '#F5F5F7' }}>
                                <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
                            </div>
                        )}
                        <div
                            ref={containerRef}
                            onScroll={onScroll}
                            onTouchStart={onTouchStart}
                            onTouchMove={onTouchMove}
                            className="h-full overflow-y-auto overflow-x-hidden px-3 pt-3"
                            style={{
                                WebkitOverflowScrolling: 'touch',
                                backgroundColor: '#F5F5F7',
                                paddingBottom: isNative && kbHeight > 0 ? `${kbHeight + 24}px` : '24px',
                                opacity: messagesVisible ? 1 : 0,
                                transition: messagesVisible ? 'opacity 120ms ease' : 'none',
                            }}
                        >
                            <div ref={contentRef}>
                            {/* Load older */}
                            {hasMoreOlder && (
                                <div className="flex justify-center mb-3">
                                    <button
                                        onClick={loadOlderMessages}
                                        disabled={isLoadingOlder}
                                        className="flex items-center gap-2 px-4 py-1.5 text-[12px] font-[600] text-slate-500 bg-white rounded-full disabled:opacity-50 transition-all active:scale-95"
                                        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}
                                    >
                                        {isLoadingOlder && (
                                            <span className="w-3 h-3 border-2 border-slate-300 border-t-indigo-400 rounded-full animate-spin" />
                                        )}
                                        Załaduj starsze
                                    </button>
                                </div>
                            )}

                            {/* Skeleton */}
                            {(isFetching || (!messagesData && !isError && !!currentChatId)) && msgs.length === 0 && (
                                <div className="space-y-3 px-1 pt-4">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                            {i % 2 !== 0 && <div className="w-8 h-8 bg-white/70 rounded-full animate-pulse shrink-0" />}
                                            <div className={`h-10 rounded-[20px] animate-pulse ${i % 2 === 0 ? 'bg-indigo-200/60 w-36' : 'bg-white/80 w-48'}`} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Error */}
                            {isError && msgs.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full gap-3 py-16 px-6">
                                    <p className="text-[14px] font-[600] text-slate-500 text-center">Nie można załadować wiadomości</p>
                                    {messagesError instanceof Error && (
                                        <p className="text-[11px] text-red-400 font-mono text-center px-4">{messagesError.message}</p>
                                    )}
                                    <button
                                        onClick={() => refetchMessages()}
                                        className="text-[13px] text-indigo-500 font-[700] px-5 py-2 rounded-full bg-white active:scale-95 transition-transform"
                                        style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.1)' }}
                                    >
                                        Spróbuj ponownie
                                    </button>
                                </div>
                            )}

                            {/* Messages grouped by date */}
                            {msgsByDate.map(group => (
                                <div key={group.dateKey}>
                                    {/* Date separator */}
                                    <div className="flex justify-center my-4">
                                        <span
                                            className="text-[11px] font-[500] text-slate-400 px-3 py-[3px] rounded-full capitalize"
                                            style={{ background: 'rgba(0,0,0,0.06)' }}
                                        >
                                            {group.label}
                                        </span>
                                    </div>

                                    {group.msgs.map((msg, i, arr) => {
                                        const isMe = msg.sender === 'me';
                                        const prevSame = i > 0 && arr[i - 1].sender === msg.sender;
                                        const nextSame = i < arr.length - 1 && arr[i + 1].sender === msg.sender;
                                        const isFirst = !prevSame;
                                        const isLast = !nextSame;

                                        const bubbleCorners = isMe
                                            ? (isFirst && isLast)  ? 'rounded-[20px]'
                                            : isFirst              ? 'rounded-t-[20px] rounded-bl-[20px] rounded-br-[5px]'
                                            : isLast               ? 'rounded-t-[5px] rounded-tl-[20px] rounded-br-[20px] rounded-bl-[20px]'
                                            :                        'rounded-l-[20px] rounded-r-[5px]'
                                            : (isFirst && isLast)  ? 'rounded-[20px]'
                                            : isFirst              ? 'rounded-t-[20px] rounded-br-[20px] rounded-bl-[5px]'
                                            : isLast               ? 'rounded-t-[5px] rounded-tr-[20px] rounded-b-[20px]'
                                            :                        'rounded-r-[20px] rounded-l-[5px]';

                                        const openDeleteMenu = (el: HTMLElement) => {
                                            if (msg.bookingData || msg.isDeletedForAll) return;
                                            if (isNative) { textareaRef.current?.blur(); Keyboard.hide().catch(() => void 0); }
                                            const rect = el.getBoundingClientRect();
                                            const MENU_H = 112;
                                            const spaceBelow = window.innerHeight - rect.bottom;
                                            const top = spaceBelow >= MENU_H + 8
                                                ? rect.bottom + 4
                                                : rect.top - MENU_H - 4;
                                            setDeleteMenu({ msgId: String(msg.id), isMe, isLiked: !!(msg as any).isLikedByMe, x: rect.left, y: Math.max(8, top) });
                                        };

                                        const isNew = String(msg.id).startsWith('temp-') || (!initialMsgIdsRef.current.has(msg.id) && msg.sender === 'other');
                                        const isPendingVideo = !!(msg as any).pending && !!msg.video;

                                        return (
                                            <motion.div
                                                key={msg.id}
                                                initial={isNew ? { opacity: 0, scale: 0.88, y: 8 } : false}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                transition={{ type: 'spring', damping: 22, stiffness: 300, mass: 0.7 }}
                                                style={{ originX: isMe ? 1 : 0, originY: 1 }}
                                                onTouchStart={() => {
                                                    if (msg.bookingData || msg.isDeletedForAll) return;
                                                    // Double-tap → toggle ❤️
                                                    const now = Date.now();
                                                    const last = lastTapRef.current;
                                                    if (last && last.msgId === String(msg.id) && now - last.time < 350) {
                                                        lastTapRef.current = null;
                                                        if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
                                                        Haptics.impact({ style: ImpactStyle.Light });
                                                        handleToggleLike(String(msg.id));
                                                        return;
                                                    }
                                                    lastTapRef.current = { msgId: String(msg.id), time: now };
                                                    // Long-press → menu z reakcją i usunięciem
                                                    longPressRef.current = setTimeout(() => {
                                                        Haptics.impact({ style: ImpactStyle.Medium });
                                                        if (isNative) { textareaRef.current?.blur(); Keyboard.hide().catch(() => void 0); }
                                                        setDeleteMenu({ msgId: String(msg.id), isMe, isLiked: !!(msg as any).isLikedByMe, x: 0, y: 0 });
                                                    }, 500);
                                                }}
                                                onTouchEnd={() => { if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; } }}
                                                onTouchMove={() => { if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; } }}
                                                className={`group/msg flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${isFirst ? 'mt-3' : 'mt-[3px]'}`}
                                            >
                                                {/* Avatar for "other" — shown at last message of group */}
                                                {!isMe && (
                                                    <div className="w-8 shrink-0" style={{ alignSelf: 'flex-end', marginBottom: '2px' }}>
                                                        {isLast ? (
                                                            <Avatar src={sessionAvatar} name={sessionName} size={30} />
                                                        ) : null}
                                                    </div>
                                                )}

                                                <div className={`flex flex-col max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div className="relative">
                                                        {msg.bookingData ? (
                                                            msg.bookingData.seriesId ? (
                                                                <RecurringBookingCard
                                                                    booking={msg.bookingData}
                                                                    isMe={isMe}
                                                                    onClose={onClose}
                                                                    onGoToReservations={() => { onClose(); navPush(router, '/dashboard', { openTab: 'orders', bookingTab: isMe ? 'incoming' : 'outgoing' }); }}
                                                                />
                                                            ) : (
                                                            <BookingCard
                                                                booking={(() => {
                                                                    const d = msg.bookingData!;
                                                                    if (d.addressLat && d.addressLng) return d;
                                                                    const all = queryClient.getQueryData<import('../../hooks/useBookings').ApiBooking[]>(['bookings']);
                                                                    const found = all?.find(b => String(b.id) === String(d.id));
                                                                    return found?.addressLat && found?.addressLng
                                                                        ? { ...d, addressLat: found.addressLat, addressLng: found.addressLng }
                                                                        : d;
                                                                })()}
                                                                isMe={isMe}
                                                                isOutdated={latestBookingMsgIds.get(String(msg.bookingData!.id)) !== msg.id}
                                                                onClose={onClose}
                                                                onGoToReservations={() => { onClose(); navPush(router, '/dashboard', { openTab: 'orders', bookingTab: isMe ? 'outgoing' : 'incoming' }); }}
                                                                onAccept={() => onBookingAction?.(msg.bookingData!.id, 'accept')}
                                                                onDecline={() => onBookingAction?.(msg.bookingData!.id, 'decline')}
                                                                onCancel={() => onBookingAction?.(msg.bookingData!.id, 'cancel')}
                                                                onComplete={!isMe && msg.bookingData.status === 'accepted' ? () => onBookingAction?.(msg.bookingData!.id, 'complete') : undefined}
                                                                onReschedule={(msg.bookingData.status === 'pending' || msg.bookingData.status === 'accepted') && msg.bookingData.serviceType !== 'request' ? (newDate, newTime) => onReschedule?.(msg.bookingData!.id, newDate, newTime) : undefined}
                                                                onRescheduleSheetToggle={open => { pauseAutoScrollRef.current = open; }}
                                                                onReview={isMe && msg.bookingData.status === 'completed' ? async () => {
                                                                    const reviewPath = `/review/${msg.bookingData!.id}`;
                                                                    const reviewNavState = { servicePublicId: activeSession?.servicePublicId ?? '', serviceTitle: msg.bookingData!.serviceTitle, providerName: activeSession?.providerName ?? '', providerAvatar: activeSession?.providerAvatar ?? '', bookingId: msg.bookingData!.id };
                                                                    if (Capacitor.isNativePlatform()) { await NativeNav.push({ fullScreen: true }).catch(() => {}); navPush(router, reviewPath, reviewNavState); }
                                                                    else { onClose(); navPush(router, reviewPath, reviewNavState); }
                                                                } : undefined}
                                                            />
                                                            )
                                                        ) : msg.isDeletedForAll ? (
                                                            <div className={`px-4 py-2.5 text-[13px] italic ${bubbleCorners} ${
                                                                isMe
                                                                    ? 'bg-indigo-50 text-indigo-300'
                                                                    : 'bg-white/70 text-slate-400'
                                                            }`}>
                                                                Wiadomość usunięta
                                                            </div>
                                                        ) : msg.video ? (
                                                            failedMedia.has(`vid-${msg.id}`) ? (
                                                                <div
                                                                    className={`w-[240px] ${bubbleCorners} bg-slate-900 flex flex-col items-center justify-center gap-2`}
                                                                    style={{ aspectRatio: '9/16', maxHeight: 360, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                                                                >
                                                                    <Film size={22} className="text-slate-600" />
                                                                    <span className="text-[11px] text-slate-500 font-medium">Brak połączenia</span>
                                                                </div>
                                                            ) : (
                                                            <VideoBubble
                                                                videoUrl={normalizeMediaUrl(msg.video) ?? msg.video ?? ''}
                                                                msgId={msg.id}
                                                                isPending={isPendingVideo}
                                                                videoUploadProgress={videoUploadProgress}
                                                                bubbleCorners={bubbleCorners}
                                                                chatMediaItems={chatMediaItems}
                                                                serverThumbnail={(msg as any).videoThumbnail ?? null}
                                                                onError={() => setFailedMedia(prev => { const n = new Set(prev); n.add(`vid-${msg.id}`); return n; })}
                                                                onOpenLightbox={idx => { setChatLightboxIndex(idx); setChatLightboxOpen(true); }}
                                                            />
                                                            )
                                                        ) : msg.image ? (
                                                            failedMedia.has(`img-${msg.id}`) ? (
                                                                <div
                                                                    className={`w-[240px] ${bubbleCorners} bg-slate-100 flex flex-col items-center justify-center gap-1.5 py-8`}
                                                                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
                                                                >
                                                                    <ImageIcon size={24} className="text-slate-400" />
                                                                    <span className="text-[11px] text-slate-400 font-medium">Brak połączenia</span>
                                                                </div>
                                                            ) : (
                                                            <div
                                                                className={`relative overflow-hidden w-[240px] bg-slate-200 ${bubbleCorners} cursor-pointer`}
                                                                style={{ maxHeight: 300, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                                                            >
                                                                <motion.img
                                                                    whileTap={{ scale: 0.97 }}
                                                                    onClick={() => {
                                                                        if ((msg as any).pending) return;
                                                                        const url = normalizeMediaUrl(msg.image) ?? msg.image!;
                                                                        const idx = chatMediaItems.findIndex(item => item.type === 'image' && item.url === url);
                                                                        setChatLightboxIndex(idx >= 0 ? idx : 0);
                                                                        setChatLightboxOpen(true);
                                                                    }}
                                                                    src={msg.image}
                                                                    alt=""
                                                                    className="block w-full h-auto"
                                                                    onError={() => setFailedMedia(prev => { const n = new Set(prev); n.add(`img-${msg.id}`); return n; })}
                                                                />
                                                                {(msg as any).pending && (
                                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                                                        <span className="w-8 h-8 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            )
                                                        ) : (msg as any).fileUrl ? (
                                                            <a
                                                                href={(msg as any).fileUrl !== '__pending__' ? (msg as any).fileUrl : undefined}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                onClick={e => { if ((msg as any).fileUrl === '__pending__') e.preventDefault(); }}
                                                                className={`flex items-center gap-3 px-4 py-3 max-w-[240px] no-underline ${bubbleCorners} ${
                                                                    isMe ? 'bg-[#6366F1] text-white' : 'bg-white text-slate-800'
                                                                }`}
                                                                style={!isMe ? { boxShadow: '0 1px 2px rgba(0,0,0,0.07)' } : undefined}
                                                            >
                                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isMe ? 'bg-white/20' : 'bg-indigo-50'}`}>
                                                                    {(msg as any).pending ? (
                                                                        <span className={`w-4 h-4 border-2 rounded-full animate-spin ${isMe ? 'border-white/30 border-t-white' : 'border-indigo-200 border-t-indigo-500'}`} />
                                                                    ) : (
                                                                        <FileText size={18} className={isMe ? 'text-white' : 'text-indigo-500'} />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-[13px] font-[600] truncate ${isMe ? 'text-white' : 'text-slate-800'}`}>
                                                                        {(msg as any).fileName ?? 'Plik'}
                                                                    </p>
                                                                    <p className={`text-[11px] ${isMe ? 'text-white/70' : 'text-slate-400'}`}>
                                                                        {(msg as any).pending ? 'Wysyłanie…' : 'Dotknij, aby otworzyć'}
                                                                    </p>
                                                                </div>
                                                            </a>
                                                        ) : (
                                                            <div className={`${bubbleCorners} px-[14px] py-[9px] text-[15px] leading-[1.45] break-words select-none ${
                                                                isMe
                                                                    ? 'bg-[#6366F1] text-white'
                                                                    : 'bg-white text-slate-800'
                                                            }`}
                                                            style={!isMe ? { boxShadow: '0 1px 2px rgba(0,0,0,0.07)' } : undefined}
                                                            >
                                                                {msg.text}
                                                            </div>
                                                        )}

                                                        {/* Hover menu — desktop */}
                                                        {!msg.bookingData && !msg.isDeletedForAll && (
                                                            <button
                                                                onClick={(e) => openDeleteMenu(e.currentTarget)}
                                                                className={`absolute top-1/2 -translate-y-1/2 ${isMe ? '-left-8' : '-right-8'} opacity-0 group-hover/msg:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-full hover:bg-black/5`}
                                                            >
                                                                <MoreVertical size={13} />
                                                            </button>
                                                        )}

                                                        {/* ❤️ badge — prawy górny róg bąbelka */}
                                                        {!msg.isDeletedForAll && !msg.bookingData && (msg as any).likedBy?.length > 0 && (
                                                            <motion.div
                                                                initial={{ scale: 0, opacity: 0 }}
                                                                animate={{ scale: 1, opacity: 1 }}
                                                                transition={{ type: 'spring', damping: 14, stiffness: 380, mass: 0.6 }}
                                                                className="absolute -top-3 -right-3 z-10 flex items-center gap-[3px] bg-white rounded-full pointer-events-none select-none"
                                                                style={{ padding: '3px 7px 3px 5px', boxShadow: '0 2px 10px rgba(0,0,0,0.15), 0 0 0 1.5px rgba(0,0,0,0.04)' }}
                                                            >
                                                                <span className="text-[13px] leading-none">❤️</span>
                                                                {(msg as any).likedBy.length > 1 && (
                                                                    <span className="text-[11px] font-bold text-rose-500 leading-none">{(msg as any).likedBy.length}</span>
                                                                )}
                                                            </motion.div>
                                                        )}

                                                    </div>

                                                    {/* Timestamp — osobny element, nigdy nie zmienia szerokości */}
                                                    {isLast && (
                                                        <p className={`text-[11px] text-slate-400 mt-1 px-0.5 ${isMe ? 'text-right' : 'text-left'}`}>
                                                            {msg.time}
                                                        </p>
                                                    )}
                                                    {/* Status — osobny element poniżej, pojawia/znika bez ruszania czasu */}
                                                    {isMe && msg.id === lastMeMsg?.id && meStatus && (
                                                        <p className={`text-[11px] font-[500] px-0.5 text-right ${isLast ? 'mt-[1px]' : 'mt-1'} ${meStatus === 'odpisano' ? 'text-indigo-400' : meStatus === 'wysyłanie…' ? 'text-slate-300' : 'text-slate-400'}`}>
                                                            {meStatus}
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ))}

                            {/* Typing indicator */}
                            <AnimatePresence>
                                {otherIsTyping && (
                                    <TypingIndicator avatar={sessionAvatar} name={sessionName} />
                                )}
                            </AnimatePresence>

                            <div ref={chatEndRef} className="h-1" />
                            </div>
                        </div>

                        {/* Delete bottom sheet */}
                        <AnimatePresence>
                            {deleteMenu && (
                                <motion.div
                                    key="del-backdrop"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute inset-0 z-[80] bg-black/15"
                                    onClick={() => setDeleteMenu(null)}
                                />
                            )}
                            {deleteMenu && (
                                <motion.div
                                    key="del-panel"
                                    {...deleteSheetProps}
                                    onPointerDown={startDeleteDrag}
                                    initial={{ y: '100%' }}
                                    animate={{ y: 0, transition: { type: 'spring', bounce: 0, duration: 0.38 } }}
                                    exit={{ y: '100%', transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }}
                                    className="absolute bottom-0 left-0 right-0 z-[81] bg-white rounded-t-[28px] pb-2"
                                    style={{ boxShadow: '0 -4px 32px rgba(0,0,0,0.1)' }}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <BottomSheetHandle onPointerDown={startDeleteDrag} compact />
                                    <button
                                        onClick={() => { handleToggleLike(deleteMenu.msgId); setDeleteMenu(null); }}
                                        className="w-full flex items-center gap-3.5 px-6 py-3 text-[15px] font-[600] text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                    >
                                        <span className="text-[19px] leading-none">{deleteMenu.isLiked ? '💔' : '❤️'}</span>
                                        {deleteMenu.isLiked ? 'Cofnij polubienie' : 'Polub'}
                                    </button>
                                    <div className="h-px bg-slate-100 mx-6" />
                                    <button
                                        onClick={() => handleDeleteMessage(deleteMenu.msgId, 'self')}
                                        className="w-full flex items-center gap-3.5 px-6 py-3 text-[15px] font-[600] text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                                    >
                                        <Trash2 size={17} className="text-slate-400" />
                                        Usuń u siebie
                                    </button>
                                    {deleteMenu.isMe && (
                                        <>
                                            <div className="h-px bg-slate-100 mx-6" />
                                            <button
                                                onClick={() => handleDeleteMessage(deleteMenu.msgId, 'all')}
                                                className="w-full flex items-center gap-3.5 px-6 py-3 text-[15px] font-[600] text-rose-500 hover:bg-rose-50 active:bg-rose-100 transition-colors"
                                            >
                                                <Trash2 size={17} />
                                                Usuń u obu stron
                                            </button>
                                        </>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Scroll to bottom */}
                        <AnimatePresence>
                            {showScrollBtn && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.7, y: 6 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.7, y: 6 }}
                                    transition={{ type: 'spring', damping: 22, stiffness: 420 }}
                                    onClick={() => {
                                        if (isNative) Haptics.impact({ style: ImpactStyle.Light });
                                        scrollToBottom();
                                    }}
                                    className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-500 hover:text-indigo-600 active:scale-90 transition-colors z-10"
                                    style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.14)' }}
                                >
                                    <ChevronDown size={20} />
                                    {unreadWhileScrolled > 0 && (
                                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-[#6366F1] text-white text-[10px] font-[800] rounded-full flex items-center justify-center px-1 leading-none">
                                            {unreadWhileScrolled > 9 ? '9+' : unreadWhileScrolled}
                                        </span>
                                    )}
                                </motion.button>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* ══ INPUT BAR ══ */}
                    <div
                        className="shrink-0 bg-white px-3 pt-2"
                        style={{
                            paddingBottom: isNative && kbHeight > 0 ? '8px' : asView ? 'calc(env(safe-area-inset-bottom) + 10px)' : isNative ? 'calc(var(--bottom-nav-total-h, env(safe-area-inset-bottom)) + 10px)' : 'calc(8px + env(safe-area-inset-bottom))',
                            borderTop: '1px solid rgba(0,0,0,0.06)',
                            transform: isNative && kbHeight > 0 ? `translateY(-${kbHeight}px)` : undefined,
                            transition: isNative && !deleteMenu && kbHeight === 0 ? 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)' : undefined,
                        }}
                    >
                        {/* Send error */}
                        {sendErrorMsg && (
                            <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-rose-50 border border-rose-100 rounded-2xl text-[12px] text-rose-500 font-[600]">
                                <span className="flex-1">{sendErrorMsg}</span>
                                <button onClick={() => setSendErrorMsg(null)} className="shrink-0 text-rose-400 hover:text-rose-600">
                                    <X size={12} />
                                </button>
                            </div>
                        )}

                        {/* Pending image preview */}
                        {pendingImage && (
                            <div className="mb-2 flex items-center gap-3 px-1">
                                <div className="relative shrink-0">
                                    <img src={pendingImage} alt="podgląd" className="w-16 h-16 rounded-2xl object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setPendingImage(null)}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-900/80 rounded-full flex items-center justify-center"
                                    >
                                        <X size={9} className="text-white" />
                                    </button>
                                </div>
                                <p className="text-[12px] text-slate-400 font-[500]">Zdjęcie gotowe do wysłania</p>
                            </div>
                        )}

                        {/* Pending video preview */}
                        {pendingVideo && (
                            <div className="mb-2 flex items-center gap-3 px-1">
                                <div className="relative shrink-0">
                                    <video src={pendingVideo} className="w-16 h-16 rounded-2xl object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/30">
                                        <Film size={16} className="text-white" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { URL.revokeObjectURL(pendingVideo); setPendingVideo(null); pendingVideoFileRef.current = null; }}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-900/80 rounded-full flex items-center justify-center"
                                    >
                                        <X size={9} className="text-white" />
                                    </button>
                                </div>
                                <p className="text-[12px] text-slate-400 font-[500]">Film gotowy do wysłania</p>
                            </div>
                        )}

                        {/* Pending file preview */}
                        {pendingFile && (
                            <div className="mb-2 flex items-center gap-3 px-1">
                                <div className="relative shrink-0 w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                    <FileText size={24} className="text-indigo-400" />
                                    <button
                                        type="button"
                                        onClick={() => setPendingFile(null)}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-900/80 rounded-full flex items-center justify-center"
                                    >
                                        <X size={9} className="text-white" />
                                    </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[13px] text-slate-700 font-[600] truncate">{pendingFile.name}</p>
                                    <p className="text-[12px] text-slate-400 font-[500]">Plik gotowy do wysłania</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="flex items-end gap-2 pb-1">
                            <input type="file" hidden ref={mediaInputRef} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" onChange={handleMediaSelect} />

                            {/* Attachment button */}
                            <button
                                type="button"
                                onClick={handlePickMedia}
                                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-indigo-500 hover:bg-slate-100 active:bg-slate-200 active:scale-90 transition-all shrink-0 mb-0.5"
                            >
                                <ImageIcon size={20} />
                            </button>

                            {/* Text input pill */}
                            <div
                                className="flex-1 flex items-center rounded-[24px] px-4 py-2.5 min-h-[44px] transition-all duration-200"
                                style={{ background: '#F5F5F7' }}
                            >
                                <textarea
                                    ref={textareaRef}
                                    rows={1}
                                    value={chatInput}
                                    lang="pl"
                                    autoCorrect="on"
                                    autoCapitalize="sentences"
                                    maxLength={5000}
                                    onChange={e => {
                                        setChatInput(e.target.value);
                                        if (!currentChatId) return;
                                        if (!typingSentRef.current) {
                                            typingSentRef.current = true;
                                            sendTyping(currentChatId, true);
                                        }
                                        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                                        typingTimeoutRef.current = setTimeout(() => {
                                            typingSentRef.current = false;
                                            if (currentChatId) sendTyping(currentChatId, false);
                                        }, 2000);
                                    }}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => {
                                        if (!showScrollBtn) {
                                            requestAnimationFrame(() => {
                                                const el = containerRef.current;
                                                if (el) el.scrollTop = el.scrollHeight;
                                            });
                                        }
                                    }}
                                    placeholder="Napisz wiadomość…"
                                    className="w-full bg-transparent border-none outline-none text-[15px] text-slate-900 placeholder:text-slate-400 resize-none leading-snug"
                                    style={{ maxHeight: 120, overflowY: 'hidden' }}
                                />
                            </div>

                            {/* Send button */}
                            <motion.button
                                type="submit"
                                disabled={!canSend}
                                whileTap={canSend ? { scale: 0.84 } : undefined}
                                onPointerDown={e => e.preventDefault()}
                                onTouchStart={e => e.preventDefault()}
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all duration-200 ${
                                    canSend
                                        ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-200/70'
                                        : 'bg-[#E8E8ED] text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                <ArrowUp size={18} strokeWidth={2.5} />
                            </motion.button>
                        </form>
                    </div>
                </motion.div>
            </div>
            {showCreateBooking && currentChatId && (
                <CreateBookingForClientModal
                    sessionId={currentChatId}
                    myServices={myServices ?? []}
                    defaultServicePublicId={activeSession?.servicePublicId}
                    onConfirm={async (date, time, servicePublicId, recurrence) => {
                        await onCreateBooking?.(currentChatId, date, time, servicePublicId, recurrence);
                    }}
                    onClose={() => setShowCreateBooking(false)}
                />
            )}
        </>
    );
};
