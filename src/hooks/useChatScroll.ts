import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';

interface UseChatScrollOptions {
    isOpen: boolean;
    chatId: string | null;
    hasData: boolean;
    onScrolledToTop?: () => void;
}

export const useChatScroll = ({
    isOpen,
    chatId,
    hasData,
    onScrolledToTop,
}: UseChatScrollOptions) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef   = useRef<HTMLDivElement>(null);
    const touchStartYRef = useRef(0);
    const pinToBottomRef = useRef(true);

    const [messagesVisible, setMessagesVisible]     = useState(false);
    const [showScrollBtn, setShowScrollBtn]         = useState(false);
    const [unreadWhileScrolled, setUnreadWhileScrolled] = useState(0);

    const pauseAutoScrollRef = useRef(false);

    const getContainer = () => containerRef.current;
    const dist = (el: HTMLDivElement) => el.scrollHeight - el.scrollTop - el.clientHeight;

    // ── Reset przy każdej zmianie sesji lub otwarciu ──────────────────────────
    useLayoutEffect(() => {
        pinToBottomRef.current = true;
        setMessagesVisible(false);
        setShowScrollBtn(false);
        setUnreadWhileScrolled(0);
    }, [isOpen, chatId]);

    // ── Inicjalny scroll + reveal ──────────────────────────────────────────────
    useLayoutEffect(() => {
        if (!isOpen || !chatId || !hasData) return;
        const el = getContainer();
        if (el) el.scrollTop = el.scrollHeight;
        setMessagesVisible(true);
    }, [isOpen, chatId, hasData]);

    // ── Safety net: reveal po 2s jeśli dane nadal nie przyszły ───────────────
    useEffect(() => {
        if (!isOpen || !chatId) return;
        const t = setTimeout(() => setMessagesVisible(true), 2000);
        return () => clearTimeout(t);
    }, [isOpen, chatId]);

    // ── ResizeObserver na TREŚCI ──────────────────────────────────────────────
    // Zastępuje 150/350/600ms timery i onLoad handlery na obrazkach/video.
    // Odpala przed paintem gdy treść urośnie (nowe wiadomości, ładowanie obrazków).
    useEffect(() => {
        const content = contentRef.current;
        if (!content) return;
        const ro = new ResizeObserver(() => {
            if (!pinToBottomRef.current || pauseAutoScrollRef.current) return;
            const el = getContainer();
            if (el) el.scrollTop = el.scrollHeight;
        });
        ro.observe(content);
        return () => ro.disconnect();
    }, []);

    // ── ResizeObserver na KONTENERZE ──────────────────────────────────────────
    // Gdy kontener się zmniejsza (rosnący input bar z podglądem media, klawiatura),
    // re-anchor jeśli user był na dole.
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            if (pinToBottomRef.current && !pauseAutoScrollRef.current) el.scrollTop = el.scrollHeight;
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // ── Scroll handler ────────────────────────────────────────────────────────
    const onScroll = useCallback(() => {
        const el = getContainer();
        if (!el) return;
        const d = dist(el);
        pinToBottomRef.current = d <= 50;
        setShowScrollBtn(d > 350);
        if (d < 80) setUnreadWhileScrolled(0);
        if (el.scrollTop < 80) onScrolledToTop?.();
    }, [onScrolledToTop]);

    // ── Touch handlers ────────────────────────────────────────────────────────
    const onTouchStart = useCallback((e: React.TouchEvent) => {
        touchStartYRef.current = e.touches[0].clientY;
        const el = getContainer();
        if (el && dist(el) > 30) pinToBottomRef.current = false;
    }, []);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        const dy = e.touches[0].clientY - touchStartYRef.current;
        if (dy < -10) pinToBottomRef.current = false;
    }, []);

    // ── Akcje eksponowane na zewnątrz ────────────────────────────────────────
    const scrollToBottom = useCallback(() => {
        const el = getContainer();
        if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        setUnreadWhileScrolled(0);
        pinToBottomRef.current = true;
    }, []);

    const snapToBottom = useCallback(() => {
        pinToBottomRef.current = true;
        const el = getContainer();
        if (el) el.scrollTop = el.scrollHeight;
    }, []);

    const addUnread = useCallback(() => {
        if (!pinToBottomRef.current) setUnreadWhileScrolled(prev => prev + 1);
    }, []);

    const clearUnread = useCallback(() => setUnreadWhileScrolled(0), []);

    const restoreScrollAfterOlderLoad = useCallback((prevScrollHeight: number) => {
        requestAnimationFrame(() => {
            const el = getContainer();
            if (el) el.scrollTop = el.scrollHeight - prevScrollHeight;
        });
    }, []);

    return {
        containerRef,
        contentRef,
        messagesVisible,
        showScrollBtn,
        unreadWhileScrolled,
        onScroll,
        onTouchStart,
        onTouchMove,
        scrollToBottom,
        snapToBottom,
        addUnread,
        clearUnread,
        restoreScrollAfterOlderLoad,
        pauseAutoScrollRef,
    };
};
