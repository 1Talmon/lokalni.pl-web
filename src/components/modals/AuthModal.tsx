'use client';
import React from 'react';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { SheetModal } from './SheetModal';
import { MODAL_BTN_PRIMARY } from './modalBase';

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

    return (
        <SheetModal
            isOpen={isOpen}
            onClose={onClose}
            title="Dane wrażliwe"
            icon={Lock}
            footer={(
                <button
                    type="submit"
                    form="auth-modal-form"
                    disabled={!password || isVerifying}
                    className={MODAL_BTN_PRIMARY}
                >
                    {isVerifying ? <Loader2 className="animate-spin" size={18} /> : 'Odblokuj'}
                </button>
            )}
        >
            <p className="text-sm text-gray-600 mb-4 font-medium">Wprowadź hasło, aby odsłonić zarobki.</p>
                        <form id="auth-modal-form" onSubmit={onSubmit} className="space-y-4">
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
                        </form>
        </SheetModal>
    );
};
