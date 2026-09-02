'use client';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Trash2 } from 'lucide-react';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { BottomSheetHandle } from '../ui/BottomSheetHandle';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

interface DeleteReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const DeleteReviewModal = ({ isOpen, onClose, onConfirm }: DeleteReviewModalProps) => {
    const { sheetDragProps, startDrag, backdropOpacity, triggerClose, handleClose } = useBottomSheet(onClose, isOpen);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) { e.stopPropagation(); triggerClose(); }
        };
        if (isOpen) window.addEventListener('keydown', handleEsc, true);
        return () => window.removeEventListener('keydown', handleEsc, true);
    }, [isOpen, triggerClose]);

    useEffect(() => {
        if (isOpen) lockScroll();
        else unlockScroll();
        return () => { unlockScroll(); };
    }, [isOpen]);

    return createPortal(
        isOpen ? (
            <div className="fixed inset-0 z-[500]">
                {/* Backdrop — fades in real time with drag gesture */}
                <motion.div
                    style={{ opacity: backdropOpacity }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={handleClose}
                    onTouchMove={e => e.stopPropagation()}
                />
                {/* Sheet */}
                <div className="absolute inset-0 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
                    <motion.div
                        onClick={e => e.stopPropagation()}
                        onTouchMove={e => e.stopPropagation()}
                        {...sheetDragProps}
                        className="pointer-events-auto bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl relative text-left flex flex-col overflow-hidden"
                    >
                        <div className="sm:hidden">
                            <BottomSheetHandle onPointerDown={startDrag} />
                        </div>

                        {/* Header */}
                        <div
                            className="px-6 sm:px-8 py-4 sm:py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0 sm:cursor-default cursor-grab active:cursor-grabbing"
                            style={{ touchAction: 'none' }}
                            onPointerDown={startDrag}
                        >
                            <h3 className="font-bold text-lg sm:text-xl text-gray-900 flex items-center gap-3">
                                <div className="p-2 bg-rose-50 text-rose-500 rounded-xl">
                                    <Trash2 size={18} />
                                </div>
                                Usuń opinię
                            </h3>
                            <button
                                onClick={handleClose}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 sm:px-8 py-6">
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Czy na pewno chcesz usunąć swoją opinię? Tej operacji nie można cofnąć.
                            </p>
                        </div>

                        {/* Buttons */}
                        <div
                            className="px-6 sm:px-8 pt-3 border-t border-gray-50 flex gap-3 shrink-0 bg-white"
                            style={{ paddingBottom: 'calc(var(--native-cta-h, var(--bottom-nav-total-h, env(safe-area-inset-bottom))) + 32px)' }}
                        >
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex-1 py-4 px-4 rounded-2xl font-black text-gray-500 hover:bg-gray-100 transition-colors uppercase tracking-widest text-xs"
                            >
                                Anuluj
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className="flex-1 py-4 px-4 rounded-2xl font-black text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-100 uppercase tracking-widest text-xs active:scale-95"
                            >
                                Usuń
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        ) : null,
        document.body
    );
};
