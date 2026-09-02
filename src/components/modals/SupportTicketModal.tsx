'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { X, ArrowUp, LifeBuoy } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { BottomSheetHandle } from '../ui/BottomSheetHandle';
import { apiClient } from '../../services/apiClient';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import type { ToastType } from '../../types';

interface SupportMessage {
    id: string;
    is_admin: boolean;
    body: string;
    created_at: string;
    sender_name: string;
}

interface SupportTicket {
    id: string;
    ticket_no: string;
    category: string;
    priority: string;
    status: string;
    subject: string;
    created_at: string;
    resolved_at: string | null;
    messages: SupportMessage[];
}

const STATUS_META: Record<string, { label: string; color: string }> = {
    open:        { label: 'Otwarte',    color: 'bg-indigo-50 text-indigo-600' },
    in_progress: { label: 'W toku',     color: 'bg-amber-50 text-amber-600' },
    waiting:     { label: 'Oczekuje',   color: 'bg-blue-50 text-blue-600' },
    resolved:    { label: 'Rozwiązane', color: 'bg-green-50 text-green-600' },
    closed:      { label: 'Zamknięte',  color: 'bg-gray-50 text-gray-500' },
};

interface SupportTicketModalProps {
    ticketId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onToast?: (msg: string, type?: ToastType) => void;
}

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

const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

export const SupportTicketModal = ({ ticketId, isOpen, onClose, onToast }: SupportTicketModalProps) => {
    const [reply, setReply] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [kbHeight, setKbHeight] = useState(0);
    const isNative = Capacitor.isNativePlatform();
    const { sheetDragProps, startDrag, backdropOpacity, triggerClose, handleClose } = useBottomSheet(onClose, isOpen);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const kbHandlesRef = useRef<{ show: { remove(): void } | null; hide: { remove(): void } | null }>({ show: null, hide: null });
    const prevMsgCountRef = useRef(0);
    const queryClient = useQueryClient();

    const { data: ticket, isLoading } = useQuery<SupportTicket>({
        queryKey: ['support-ticket', ticketId],
        queryFn: async () => {
            const res = await apiClient.get(`/support/tickets/${ticketId}`);
            if (!res.ok) throw new Error('Błąd pobierania zgłoszenia');
            return res.json();
        },
        enabled: isOpen && !!ticketId,
        staleTime: 30_000,
    });

    useEffect(() => {
        if (isOpen) lockScroll();
        else unlockScroll();
        return () => { unlockScroll(); };
    }, [isOpen]);

    useEffect(() => {
        if (!isNative) return;
        if (!isOpen) { setKbHeight(0); return; }
        Keyboard.addListener('keyboardWillShow', info => {
            setKbHeight(info.keyboardHeight);
            requestAnimationFrame(() => {
                if (messagesContainerRef.current) {
                    messagesContainerRef.current.scrollTop += info.keyboardHeight + 12;
                }
            });
        }).then(h => { kbHandlesRef.current.show = h; });
        Keyboard.addListener('keyboardWillHide', () => setKbHeight(0)).then(h => { kbHandlesRef.current.hide = h; });
        return () => {
            kbHandlesRef.current.show?.remove();
            kbHandlesRef.current.hide?.remove();
            kbHandlesRef.current = { show: null, hide: null };
        };
    }, [isNative, isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) { e.stopPropagation(); triggerClose(); }
        };
        if (isOpen) window.addEventListener('keydown', handleEsc, true);
        return () => window.removeEventListener('keydown', handleEsc, true);
    }, [isOpen, triggerClose]);

    useEffect(() => {
        const msgs = ticket?.messages ?? [];
        const el = messagesContainerRef.current;
        if (!el || msgs.length === 0) return;
        const prev = prevMsgCountRef.current;
        prevMsgCountRef.current = msgs.length;
        if (prev === 0) {
            el.scrollTop = el.scrollHeight;
        } else if (msgs.length > prev) {
            const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
            if (distFromBottom < 300) el.scrollTop = el.scrollHeight;
        }
    }, [ticket?.messages]);

    useEffect(() => {
        if (isOpen) { setReply(''); prevMsgCountRef.current = 0; }
    }, [isOpen]);

    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }, [reply]);

    const handleSend = async () => {
        if (!reply.trim() || !ticketId || isSending) return;
        setIsSending(true);
        try {
            const res = await apiClient.post(`/support/tickets/${ticketId}/messages`, { body: reply.trim() });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err?.error ?? 'Błąd wysyłania');
            }
            setReply('');
            if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
            queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
        } catch (err) {
            onToast?.((err as Error)?.message ?? 'Błąd wysyłania odpowiedzi', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const isClosed = ticket?.status === 'resolved' || ticket?.status === 'closed';
    const statusMeta = STATUS_META[ticket?.status ?? 'open'];

    const msgsByDate = useMemo(() => {
        const msgs = ticket?.messages ?? [];
        const groups: { dateKey: string; label: string; msgs: SupportMessage[] }[] = [];
        for (const msg of msgs) {
            const dateKey = msg.created_at.slice(0, 10);
            const last = groups[groups.length - 1];
            if (last && last.dateKey === dateKey) {
                last.msgs.push(msg);
            } else {
                groups.push({ dateKey, label: formatDateLabel(msg.created_at), msgs: [msg] });
            }
        }
        return groups;
    }, [ticket?.messages]);

    const lastUserMsgId = useMemo(() => {
        const msgs = ticket?.messages ?? [];
        for (let i = msgs.length - 1; i >= 0; i--) {
            if (!msgs[i].is_admin) return msgs[i].id;
        }
        return null;
    }, [ticket?.messages]);

    return createPortal(
        isOpen ? (
            <div className="fixed inset-0 z-[500]">
                {/* Backdrop — fades in real time with drag gesture */}
                <motion.div
                    style={{ opacity: backdropOpacity }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={handleClose}
                />
                {/* Sheet */}
                <div className="absolute inset-0 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
                    <motion.div
                        onClick={e => e.stopPropagation()}
                        onTouchMove={e => e.stopPropagation()}
                        {...sheetDragProps}
                        className={`pointer-events-auto bg-white w-full sm:max-w-lg shadow-2xl relative text-left flex flex-col overflow-hidden rounded-t-[2rem] ${
                            isNative ? 'h-[85dvh]' : 'max-h-[92dvh]'
                        } sm:rounded-[2.5rem] sm:max-h-[85vh] sm:h-auto`}
                    >
                        <div className="sm:hidden">
                            <BottomSheetHandle onPointerDown={startDrag} />
                        </div>

                        {/* Header */}
                        <div
                            className="px-6 sm:px-8 py-4 sm:py-5 border-b border-gray-50 flex justify-between items-start bg-gray-50/50 shrink-0 sm:cursor-default cursor-grab active:cursor-grabbing"
                            style={{ touchAction: 'none' }}
                            onPointerDown={startDrag}
                        >
                            <div className="flex-1 min-w-0 pr-4">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <div className="p-1.5 bg-indigo-50 text-[#6366F1] rounded-lg shrink-0">
                                        <LifeBuoy size={14} />
                                    </div>
                                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                        {ticket?.ticket_no ?? '…'}
                                    </span>
                                    {statusMeta && (
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${statusMeta.color}`}>
                                            {statusMeta.label}
                                        </span>
                                    )}
                                </div>
                                <h3 className="font-bold text-gray-900 text-sm truncate">
                                    {ticket?.subject ?? (isLoading ? 'Ładowanie…' : '—')}
                                </h3>
                            </div>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Thread */}
                        <div
                            ref={messagesContainerRef}
                            className="overflow-y-auto flex-1 px-3 pt-2"
                            style={{
                                backgroundColor: '#F5F5F7',
                                paddingBottom: isNative && kbHeight > 0 ? `${kbHeight + 24}px` : '24px',
                            }}
                        >
                            {isLoading && (
                                <div className="space-y-3 px-1 pt-4">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className={`flex items-end gap-2 ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                            {i % 2 !== 0 && <div className="w-8 h-8 bg-white/70 rounded-full animate-pulse shrink-0" />}
                                            <div className={`h-10 rounded-[20px] animate-pulse ${i % 2 === 0 ? 'bg-indigo-200/60 w-40' : 'bg-white/80 w-52'}`} />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {!isLoading && ticket?.messages?.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full gap-2 py-16">
                                    <LifeBuoy size={32} className="text-slate-300" />
                                    <p className="text-[14px] text-slate-400 font-[500]">Brak wiadomości</p>
                                </div>
                            )}

                            {msgsByDate.map(group => (
                                <div key={group.dateKey}>
                                    <div className="flex justify-center my-4">
                                        <span
                                            className="text-[11px] font-[500] text-slate-400 px-3 py-[3px] rounded-full capitalize"
                                            style={{ background: 'rgba(0,0,0,0.06)' }}
                                        >
                                            {group.label}
                                        </span>
                                    </div>

                                    {group.msgs.map((msg, i, arr) => {
                                        const isMe = !msg.is_admin;
                                        const prevSame = i > 0 && arr[i - 1].is_admin === msg.is_admin;
                                        const nextSame = i < arr.length - 1 && arr[i + 1].is_admin === msg.is_admin;
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

                                        return (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, scale: 0.88, y: 8 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                transition={{ type: 'spring', damping: 22, stiffness: 300, mass: 0.7 }}
                                                style={{ originX: isMe ? 1 : 0, originY: 1 }}
                                                className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${isFirst ? 'mt-3' : 'mt-[3px]'}`}
                                            >
                                                {!isMe && (
                                                    <div className="w-8 shrink-0" style={{ alignSelf: 'flex-end', marginBottom: '2px' }}>
                                                        {isLast ? (
                                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                                                <LifeBuoy size={15} className="text-[#6366F1]" />
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                )}

                                                <div className={`flex flex-col max-w-[78%] ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div
                                                        className={`${bubbleCorners} px-[14px] py-[9px] text-[15px] leading-[1.45] break-words ${
                                                            isMe
                                                                ? 'bg-[#6366F1] text-white'
                                                                : 'bg-white text-slate-800'
                                                        }`}
                                                        style={!isMe ? { boxShadow: '0 1px 2px rgba(0,0,0,0.07)' } : undefined}
                                                    >
                                                        {msg.body}
                                                    </div>

                                                    {isLast && (
                                                        <p className={`text-[11px] text-slate-400 mt-1 px-0.5 ${isMe ? 'text-right' : 'text-left'}`}>
                                                            {formatTime(msg.created_at)}
                                                        </p>
                                                    )}

                                                    {isMe && msg.id === lastUserMsgId && (
                                                        <p className={`text-[11px] font-[500] px-0.5 text-right text-slate-400 ${isLast ? 'mt-[1px]' : 'mt-1'}`}>
                                                            wysłano
                                                        </p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        {/* Input bar */}
                        {!isClosed ? (
                            <div
                                className="px-3 pt-2 border-t shrink-0 bg-white"
                                style={{
                                    borderColor: 'rgba(0,0,0,0.06)',
                                    paddingBottom: isNative && kbHeight > 0
                                        ? '8px'
                                        : isNative
                                            ? 'calc(var(--bottom-nav-total-h, env(safe-area-inset-bottom)) + 10px)'
                                            : 'calc(8px + env(safe-area-inset-bottom))',
                                    transform: isNative && kbHeight > 0 ? `translateY(-${kbHeight}px)` : undefined,
                                    transition: isNative && kbHeight === 0 ? 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)' : undefined,
                                }}
                            >
                                <div className="flex gap-2 items-end pb-1">
                                    <div
                                        className="flex-1 flex items-center rounded-[24px] px-4 py-2.5 min-h-[44px]"
                                        style={{ background: '#F5F5F7' }}
                                    >
                                        <textarea
                                            ref={textareaRef}
                                            value={reply}
                                            onChange={e => setReply(e.target.value)}
                                            placeholder="Napisz odpowiedź…"
                                            rows={1}
                                            maxLength={5000}
                                            lang="pl"
                                            autoCorrect="on"
                                            autoCapitalize="sentences"
                                            onKeyDown={e => {
                                                const isEnter = e.key === 'Enter' || e.keyCode === 13;
                                                if (isEnter && !e.shiftKey && !e.nativeEvent.isComposing) {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    handleSend();
                                                }
                                            }}
                                            className="w-full bg-transparent border-none outline-none text-[15px] text-slate-900 placeholder:text-slate-400 resize-none leading-snug"
                                            style={{ maxHeight: 120, overflowY: 'hidden' }}
                                        />
                                    </div>
                                    <motion.button
                                        onClick={handleSend}
                                        disabled={!reply.trim() || isSending}
                                        whileTap={reply.trim() && !isSending ? { scale: 0.84 } : undefined}
                                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mb-0.5 transition-all duration-200 ${
                                            reply.trim() && !isSending
                                                ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-200/70'
                                                : 'bg-[#E8E8ED] text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {isSending
                                            ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            : <ArrowUp size={18} strokeWidth={2.5} />
                                        }
                                    </motion.button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="px-6 sm:px-8 py-4 border-t border-gray-50 shrink-0 bg-gray-50/50 text-center"
                                style={{
                                    paddingBottom: isNative && kbHeight > 0
                                        ? '12px'
                                        : 'calc(12px + env(safe-area-inset-bottom))',
                                    transform: isNative && kbHeight > 0 ? `translateY(-${kbHeight}px)` : undefined,
                                    transition: isNative && kbHeight === 0 ? 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)' : undefined,
                                }}
                            >
                                <p className="text-sm text-gray-500">
                                    Zgłoszenie jest zamknięte. Możesz otworzyć nowe z menu Pomoc.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        ) : null,
        document.body
    );
};
