'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Plus, Loader2, Save, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../../../services/apiClient';
import { SettingsRow } from './SettingsRow';
import { settingsActionClass } from './settingsStyles';

interface BioSectionProps {
    currentBio?: string;
    onSaved?: (newBio: string) => void;
}

export const BioSection = ({ currentBio = '', onSaved }: BioSectionProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [bioText, setBioText] = useState(currentBio);
    const [savedBio, setSavedBio] = useState(currentBio);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        setBioText(currentBio);
        setSavedBio(currentBio);
    }, [currentBio]);

    const isDirty = bioText.trim() !== savedBio.trim();

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        try {
            const res = await apiClient.patch('/users/me', { bio: bioText });
            if (!res.ok) throw new Error('Błąd zapisu');
            setIsSaved(true);
            setSavedBio(bioText);
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
            <div className="mb-6">
                <SettingsRow icon={User} title="Biografia" description="Daj ludziom się poznać, napisz coś o sobie." />
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

            {/* Zapis pod polem — aktywny dopiero po zmianie tekstu */}
            <div className="flex items-center justify-end gap-3 mt-3">
                {error && <p className="text-xs text-red-500 font-medium mr-auto">{error}</p>}
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving || (!isDirty && !isSaved)}
                    className={settingsActionClass()}
                >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : isSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                    {isSaving ? 'Zapisywanie…' : isSaved ? 'Zapisano' : 'Zapisz'}
                </button>
            </div>
        </div>
    );
};
