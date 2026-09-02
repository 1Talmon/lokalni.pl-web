'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ExternalLink, Pencil, Check } from 'lucide-react';

interface CertificatePreviewModalProps {
    cert: {
        id: string;
        name: string;
        type?: string;
        status: 'verified' | 'pending';
        url: string | null;
    } | null;
    onClose: () => void;
    onUpdateName?: (id: string, name: string) => void;
}

export const CertificatePreviewModal = ({ cert, onClose, onUpdateName }: CertificatePreviewModalProps) => {
    const [editingName, setEditingName] = useState(false);
    const [draftName, setDraftName] = useState('');
    const [displayName, setDisplayName] = useState('');

    useEffect(() => {
        if (cert) setDisplayName(cert.name);
        else setEditingName(false);
    }, [cert]);

    useEffect(() => {
        if (!cert) return;
        const fn = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { if (editingName) setEditingName(false); else onClose(); }
        };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [cert, editingName, onClose]);

    const startEdit = () => {
        setDraftName(displayName);
        setEditingName(true);
    };

    const saveName = () => {
        if (!cert || !draftName.trim()) return;
        setDisplayName(draftName.trim());
        onUpdateName?.(cert.id, draftName.trim());
        setEditingName(false);
    };

    return createPortal(
        <AnimatePresence>
        {cert && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-10 bg-gray-900/95 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="relative max-w-4xl w-full bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
                            <button onClick={onClose} className="p-3 bg-white/90 backdrop-blur shadow-sm rounded-xl text-gray-700 hover:text-rose-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 md:p-12 flex flex-col items-center">
                            {cert.type === 'image' ? (
                                <img src={cert.url ?? undefined} alt={displayName} className="max-h-[50vh] md:max-h-[65vh] rounded-xl object-contain shadow-sm" />
                            ) : (
                                <div className="w-full h-[40vh] md:h-[50vh] flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                    <FileText size={60} className="text-rose-500 mb-4" />
                                    <a href={cert.url ?? undefined} target="_blank" rel="noreferrer"
                                        className="flex items-center gap-2 px-6 py-3 bg-white shadow-sm rounded-xl text-indigo-600 font-bold hover:bg-indigo-50 transition-all border border-indigo-100"
                                    >
                                        Otwórz dokument PDF <ExternalLink size={16} />
                                    </a>
                                </div>
                            )}

                            <div className="mt-8 text-center max-w-lg w-full">
                                {onUpdateName && (
                                    editingName ? (
                                        <div className="flex items-center gap-2 justify-center mb-1">
                                            <input
                                                autoFocus
                                                value={draftName}
                                                onChange={e => setDraftName(e.target.value)}
                                                onKeyDown={e => { if (e.key === 'Enter') saveName(); }}
                                                className="flex-1 max-w-sm text-center text-lg font-bold text-gray-900 border-b-2 border-indigo-500 outline-none bg-transparent pb-1"
                                            />
                                            <button
                                                onClick={saveName}
                                                className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white hover:bg-indigo-500 active:scale-90 transition-all shrink-0"
                                            >
                                                <Check size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={startEdit}
                                            className="group inline-flex items-center gap-2 mb-1 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors"
                                        >
                                            <h4 className="text-lg md:text-xl font-bold text-gray-900 leading-tight group-hover:text-indigo-600 transition-colors">
                                                {displayName}
                                            </h4>
                                            <Pencil size={14} className="text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                                        </button>
                                    )
                                )}
                                {!onUpdateName && (
                                    <h4 className="text-lg md:text-xl font-bold text-gray-900 leading-tight mb-1">{displayName}</h4>
                                )}
                                <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-[0.2em] font-black">
                                    Status: {cert.status === 'verified' ? 'Zweryfikowany' : 'W trakcie weryfikacji'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
        )}
        </AnimatePresence>,
        document.body
    );
};
