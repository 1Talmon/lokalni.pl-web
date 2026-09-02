'use client';
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Lock, X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    password: string;
    setPassword: (val: string) => void;
    showPassword: boolean;
    setShowPassword: (val: boolean) => void;
    isVerifying: boolean;
    error: string;
}

export const AuthModal = ({
                              isOpen,
                              onClose,
                              onSubmit,
                              password,
                              setPassword,
                              showPassword,
                              setShowPassword,
                              isVerifying,
                              error
                          }: AuthModalProps) => {

    useEffect(() => {
        if (isOpen) lockScroll();
        else unlockScroll();
        return () => unlockScroll();
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [isOpen, onClose]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    // Animacja tła (backdrop)
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={onClose} // Kliknięcie w tło zamyka modal
                    className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
                >
                    <motion.div
                        // Zatrzymujemy propagację, aby kliknięcie wewnątrz formularza nie zamykało modala
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        // Szybsza animacja (150ms) dla lepszego UX
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-2xl relative text-left"
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center mb-6">
                            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4">
                                <Lock size={28} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900">Dane wrażliwe</h3>
                            <p className="text-sm text-gray-500 mt-2 font-medium">Wprowadź hasło, aby odsłonić zarobki.</p>
                        </div>

                        <form onSubmit={onSubmit} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-gray-400" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Twoje hasło"
                                    autoFocus
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-12 transition-all outline-none focus:outline-none focus:ring-2 ring-inset focus:ring-[#6366F1] focus:bg-white"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-20"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            {error && (
                                <p className="text-xs text-rose-500 mt-2 text-center font-bold tracking-wide">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={!password || isVerifying}
                                className="w-full bg-[#6366F1] text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-[#4F46E5] transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95"
                            >
                                {isVerifying ? <Loader2 className="animate-spin" size={18} /> : "Odblokuj"}
                            </button>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};