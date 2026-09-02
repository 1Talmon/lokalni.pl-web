'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Facebook, Instagram, Music2, Globe, Link as LinkIcon,
    ArrowRight, Check, AlertCircle, Loader2
} from 'lucide-react';
import { apiClient } from '../../../../services/apiClient';

interface SocialLinks {
    fb: string;
    ig: string;
    tt: string;
    web: string;
}

interface SocialSectionProps {
    initialLinks?: Partial<SocialLinks>;
    addToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const SocialSection = ({ initialLinks = {}, addToast }: SocialSectionProps) => {
    const [socialLinks, setSocialLinks] = useState<SocialLinks>({
        fb: initialLinks.fb || '',
        ig: initialLinks.ig || '',
        tt: initialLinks.tt || '',
        web: initialLinks.web || '',
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [savingId, setSavingId] = useState<string | null>(null);

    useEffect(() => {
        setSocialLinks({
            fb: initialLinks.fb || '',
            ig: initialLinks.ig || '',
            tt: initialLinks.tt || '',
            web: initialLinks.web || '',
        });
    }, [initialLinks.fb, initialLinks.ig, initialLinks.tt, initialLinks.web]);

    const socials = [
        { id: 'fb', name: 'Facebook', icon: <Facebook size={18} fill="currentColor" />, color: '#1877F2', pattern: /facebook\.com/i, apiKey: 'facebook' },
        { id: 'ig', name: 'Instagram', icon: <Instagram size={18} />, color: '#E4405F', pattern: /instagram\.com/i, apiKey: 'instagram' },
        { id: 'tt', name: 'TikTok', icon: <Music2 size={18} />, color: '#000000', pattern: /tiktok\.com/i, apiKey: 'tiktok' },
        { id: 'web', name: 'Strona WWW', icon: <Globe size={18} />, color: '#6366F1', pattern: /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})/i, apiKey: 'website' }
    ];

    const isValidSocial = (id: string, value: string) => {
        if (!value) return true;
        const social = socials.find(s => s.id === id);
        return social?.pattern.test(value);
    };

    const handleConfirm = async (id: string) => {
        const currentUrl = socialLinks[id as keyof SocialLinks];
        if (!isValidSocial(id, currentUrl)) return;
        const social = socials.find(s => s.id === id);
        if (!social) return;
        setSavingId(id);
        try {
            const res = await apiClient.patch('/users/me', { [social.apiKey]: currentUrl || null });
            if (!res.ok) throw new Error('Błąd zapisu');
            addToast?.('Link zapisany', 'success');
            setEditingId(null);
        } catch {
            addToast?.('Nie udało się zapisać linku', 'error');
        } finally {
            setSavingId(null);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (editingId) {
                const target = event.target as HTMLElement;
                if (!target.closest('.social-edit-zone')) {
                    const currentUrl = socialLinks[editingId as keyof SocialLinks];
                    if (isValidSocial(editingId, currentUrl)) {
                        setEditingId(null);
                    }
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- isValidSocial is a pure util, no reactive deps
    }, [editingId, socialLinks]);

    return (
        <div className="pt-2">
            <div className="flex items-center gap-2 mb-6 text-gray-900">
                <LinkIcon size={18} className="text-indigo-500" />
                <h4 className="font-bold">Media społecznościowe</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socials.map((social) => {
                    const currentUrl = socialLinks[social.id as keyof SocialLinks];
                    const isConnected = !!currentUrl;
                    const isEditing = editingId === social.id;
                    const isSaving = savingId === social.id;
                    const isLinkValid = isValidSocial(social.id, currentUrl);

                    return (
                        <div
                            key={social.id}
                            className={`relative group ${!isEditing ? 'cursor-pointer' : ''}`}
                            onClick={() => !isEditing && setEditingId(social.id)}
                        >
                            <div className={`min-h-[76px] px-5 py-4 rounded-[1.5rem] border transition-all duration-300 flex items-center overflow-hidden ${isEditing ? (isLinkValid ? 'bg-white border-indigo-200 ring-4 ring-indigo-50/50' : 'bg-white border-rose-200 ring-4 ring-rose-50/50') : isConnected ? 'bg-white border-indigo-100 shadow-lg shadow-indigo-50/50' : 'bg-gray-50/50 border-gray-100 hover:border-gray-200'}`}>
                                <AnimatePresence mode="wait">
                                    {!isEditing ? (
                                        <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isConnected ? 'bg-white shadow-md' : 'bg-gray-100 text-gray-300'}`} style={{ color: isConnected ? social.color : undefined, boxShadow: isConnected ? `0 4px 12px ${social.color}20` : '' }}>{social.icon}</div>
                                                <div>
                                                    <p className="text-[13px] font-bold text-gray-700">{social.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-0.5">
                                                        <div className="relative flex items-center justify-center">
                                                            <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                                            {isConnected && <div className="absolute w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping opacity-75" />}
                                                        </div>
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isConnected ? 'text-emerald-500' : 'text-gray-400'}`}>{isConnected ? 'Aktywne' : 'Brak Linku'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`p-2 transition-all duration-300 ${isConnected ? 'text-indigo-500 translate-x-1' : 'text-gray-300 group-hover:text-indigo-400 group-hover:translate-x-1'}`}><ArrowRight size={18} /></div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="edit" initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -5 }} className="flex items-center gap-3 w-full social-edit-zone" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex-1 relative">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    placeholder={`Link ${social.name}...`}
                                                    className={`w-full bg-white rounded-xl px-4 py-2.5 text-xs border-none outline-none focus:ring-0 transition-all shadow-inner ${!isLinkValid ? 'text-rose-600' : ''}`}
                                                    value={currentUrl}
                                                    onChange={(e) => setSocialLinks({...socialLinks, [social.id]: e.target.value})}
                                                    onKeyDown={(e) => e.key === 'Enter' && isLinkValid && handleConfirm(social.id)}
                                                />
                                                {!isLinkValid && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-500"><AlertCircle size={14} /></div>}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); handleConfirm(social.id); }}
                                                disabled={!isLinkValid || isSaving}
                                                className={`p-2 rounded-xl shadow-md transition-all ${isLinkValid && !isSaving ? 'bg-indigo-600 text-white active:scale-90' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                                            >
                                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3} />}
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
