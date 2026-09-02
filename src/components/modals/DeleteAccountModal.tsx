'use client';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    isDeleting: boolean;
}

export const DeleteAccountModal = ({
                                       isOpen,
                                       onClose,
                                       onConfirm,
                                       isDeleting
                                   }: DeleteAccountModalProps) => {
    useEffect(() => {
        if (isOpen) lockScroll();
        else unlockScroll();
        return () => unlockScroll();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isDeleting) onClose(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [isOpen, isDeleting, onClose]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="bg-white max-w-md w-full rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6">
                                <AlertTriangle size={32} />
                            </div>
                            <h4 className="text-xl font-black text-gray-900 mb-2">Czy na pewno?</h4>
                            <p className="text-sm text-gray-500 leading-relaxed mb-8">
                                Ta operacja jest nieodwracalna. Wszystkie Twoje dane, usługi oraz historia zostaną trwale usunięte z naszego systemu.
                            </p>
                            <div className="flex flex-col w-full gap-3">
                                <button
                                    onClick={onConfirm}
                                    disabled={isDeleting}
                                    className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-rose-100 hover:bg-rose-600 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : "Potwierdzam usunięcie"}
                                </button>
                                <button
                                    onClick={onClose}
                                    disabled={isDeleting}
                                    className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-gray-100 transition-all"
                                >
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};