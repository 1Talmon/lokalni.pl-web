'use client';
import { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Cropper from 'react-easy-crop';
import { Loader2, Minus, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';

interface AvatarEditModalProps {
    image: string | null;
    onClose: () => void;
    onSave: (croppedAreaPixels: any) => Promise<void>; // eslint-disable-line @typescript-eslint/no-explicit-any
    isProcessing: boolean;
}

export const AvatarEditModal = ({ image, onClose, onSave, isProcessing }: AvatarEditModalProps) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    const onCropComplete = useCallback((_: any, pixels: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
        setCroppedAreaPixels(pixels);
    }, []);

    useEffect(() => {
        if (image) lockScroll();
        else unlockScroll();
        return () => unlockScroll();
    }, [image]);

    useEffect(() => {
        if (!image) return;
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [image, onClose]);

    return createPortal(
        <AnimatePresence>
            {image && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onClick={onClose}
                    className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        onClick={e => e.stopPropagation()}
                        className="bg-white w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl p-6 md:p-8 flex flex-col gap-6"
                    >
                        <div className="relative h-[300px] md:h-[350px] bg-gray-900 rounded-3xl overflow-hidden">
                            <Cropper
                                image={image}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        <div className="flex flex-col gap-3 px-2">
                            <div className="flex justify-between items-center text-gray-400">
                                <span className="text-[10px] font-bold uppercase tracking-widest">Przybliżenie</span>
                                <span className="text-xs font-bold text-indigo-600">{Math.round(zoom * 100)}%</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setZoom(Math.max(1, zoom - 0.2))} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                                    <Minus size={18} />
                                </button>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#6366F1]"
                                />
                                <button onClick={() => setZoom(Math.min(3, zoom + 0.2))} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors">
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-bold active:scale-95 transition-transform"
                            >
                                Anuluj
                            </button>
                            <button
                                onClick={() => onSave(croppedAreaPixels)}
                                disabled={isProcessing}
                                className="flex-[2] py-4 bg-[#6366F1] text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50 shadow-lg shadow-indigo-100"
                            >
                                {isProcessing ? <Loader2 className="animate-spin" size={20} /> : "Zapisz zdjęcie"}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};
