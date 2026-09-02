'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Plus, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../../../services/apiClient';

interface BioSectionProps {
    currentBio?: string;
    onSaved?: (newBio: string) => void;
}

export const BioSection = ({ currentBio = '', onSaved }: BioSectionProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [bioText, setBioText] = useState(currentBio);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setBioText(currentBio);
    }, [currentBio]);

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            const res = await apiClient.patch('/users/me', { bio: bioText });
            if (!res.ok) throw new Error('Błąd zapisu');
            setIsSaved(true);
            setIsFocused(false);
            onSaved?.(bioText);
            setTimeout(() => setIsSaved(false), 2000);
        } catch {
            setError('Nie udało się zapisać biografii');
        } finally {
            setIsSaving(false);
        }
    };

    const handleStartTyping = () => {
        setIsFocused(true);
        setTimeout(() => textareaRef.current?.focus(), 50);
    };

    const showEmptyState = bioText === "" && !isFocused;

    return (
        <div className="pt-2">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <User size={18} />
                        </div>
                        Biografia
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 ml-10">Daj ludziom się poznać, napisz coś o sobie.</p>
                </div>

                <div className="flex flex-col items-end gap-1">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="group relative overflow-hidden px-6 py-3 bg-[#6366F1] text-white rounded-2xl text-[13px] font-bold transition-all hover:bg-[#4F46E5] active:scale-95 shadow-xl shadow-indigo-100 disabled:opacity-70"
                    >
                        <div className="flex items-center gap-2 relative z-10">
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : isSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                            <span>{isSaving ? "Zapisywanie..." : isSaved ? "Zapisano" : "Zapisz biografię"}</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform" />
                    </button>
                    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                </div>
            </div>

            <div className="relative w-full min-h-[180px]">
                <AnimatePresence>
                    {showEmptyState && (
                        <motion.div
                            key="empty-state-bio"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={handleStartTyping}
                            className="absolute inset-0 z-20 w-full border-2 border-dashed border-gray-100 rounded-[2rem] flex items-center justify-center gap-8 bg-white cursor-pointer group hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 transition-colors duration-300"
                        >
                            <div className="relative">
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
                                    <User className="text-gray-300 group-hover:text-indigo-500 transition-colors" size={28} />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform duration-300">
                                    <Plus size={14} strokeWidth={3} />
                                </div>
                            </div>
                            <div className="text-left">
                                <h5 className="text-[15px] font-bold text-gray-800">Opisz swoją pasję</h5>
                                <p className="text-xs text-gray-400 mt-0.5">Dodaj biografię, aby klienci mogli Cię lepiej poznać.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className={`w-full min-h-[180px] border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col transition-all duration-300 overflow-hidden ${isFocused || bioText !== "" ? 'border-solid border-[#6366F1] bg-white shadow-sm' : 'bg-gradient-to-br from-gray-50/50 to-white'}`}>
                    <textarea
                        ref={textareaRef}
                        value={bioText}
                        onChange={(e) => setBioText(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Napisz coś o sobie..."
                        lang="pl"
                        autoCorrect="on"
                        autoCapitalize="sentences"
                        className={`w-full flex-grow p-8 bg-transparent border-none outline-none ring-0 focus:ring-0 text-[14px] text-gray-800 placeholder:text-gray-400 resize-none custom-scrollbar transition-opacity duration-200 ${showEmptyState ? 'opacity-0' : 'opacity-100'}`}
                    />
                    <div className={`flex justify-end p-2 px-8 pb-6 bg-transparent transition-opacity duration-200 ${showEmptyState ? 'opacity-0' : 'opacity-100'}`}>
                        <span className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.15em]">
                            {bioText.length} ZNAKÓW
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
