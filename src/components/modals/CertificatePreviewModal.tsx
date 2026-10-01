'use client';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ExternalLink } from 'lucide-react';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

interface CertificatePreviewModalProps {
    cert: {
        id: string;
        name: string;
        type?: string;
        status: 'verified' | 'pending';
        url: string | null;
    } | null;
    onClose: () => void;
}

/** Read-only lightbox for a certificate file. Editing happens in CertificateSection's sheet. */
export const CertificatePreviewModal = ({ cert, onClose }: CertificatePreviewModalProps) => {
    const isOpen = !!cert;

    useEffect(() => {
        if (!isOpen) return;
        const alreadyLocked = document.documentElement.classList.contains('scroll-locked');
        if (!alreadyLocked) lockScroll();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
        };
        window.addEventListener('keydown', onKey, true);
        return () => {
            if (!alreadyLocked) unlockScroll();
            window.removeEventListener('keydown', onKey, true);
        };
    }, [isOpen, onClose]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {cert && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-10 bg-gray-900/90 backdrop-blur-sm"
                    style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1rem)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1rem)' }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="w-full max-w-3xl max-h-full bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between gap-3 shrink-0">
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-900 leading-snug line-clamp-2 break-words">{cert.name}</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${cert.status === 'verified' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${cert.status === 'verified' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {cert.status === 'verified' ? 'Zweryfikowany' : 'W weryfikacji'}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Zamknij"
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 md:p-8 flex items-center justify-center min-h-0 overflow-auto">
                            {cert.type === 'image' && cert.url ? (
                                <img src={cert.url} alt={cert.name} className="max-h-[65vh] w-auto rounded-xl object-contain" />
                            ) : (
                                <div className="w-full py-14 flex flex-col items-center justify-center bg-gray-50 rounded-2xl">
                                    <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-5">
                                        <FileText size={30} className="text-rose-500" />
                                    </div>
                                    <a
                                        href={cert.url ?? undefined}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-2 px-5 py-3 bg-white shadow-sm rounded-xl text-sm text-indigo-600 font-bold hover:bg-indigo-50 transition-colors border border-indigo-100"
                                    >
                                        Otwórz dokument PDF <ExternalLink size={16} />
                                    </a>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
