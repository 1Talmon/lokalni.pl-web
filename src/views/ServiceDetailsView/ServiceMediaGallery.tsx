'use client';
import { memo } from 'react';
import { ChevronLeft, ChevronRight, Camera, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type MediaItem =
    | { type: 'image'; url: string }
    | { type: 'video'; url: string; thumbnail?: string };

interface ServiceMediaGalleryProps {
    mediaItems: MediaItem[];
    currentImageIndex: number;
    serviceTitle: string;
    serviceType: 'offer' | 'request';
    onImageClick: () => void;
    onPrev: () => void;
    onNext: () => void;
    onDragStart: () => void;
    onVideoDragEnd: (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => void;
    onImageDragEnd: (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => void;
}

export const ServiceMediaGallery = memo(({
    mediaItems, currentImageIndex, serviceTitle, serviceType,
    onImageClick, onPrev, onNext, onDragStart, onVideoDragEnd, onImageDragEnd,
}: ServiceMediaGalleryProps) => (
    <div className="w-full h-64 md:h-96 rounded-3xl overflow-hidden mb-5 relative shadow-lg bg-slate-100 group select-none touch-pan-y">
        {mediaItems.length > 0 ? (
            <>
                <AnimatePresence mode="wait">
                    {mediaItems[currentImageIndex]?.type === 'video' ? (
                        <motion.div
                            key={`v-${currentImageIndex}`}
                            className="w-full h-full"
                            initial={false}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            drag={mediaItems.length > 1 ? 'x' : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.15}
                            onDragEnd={onVideoDragEnd}
                            onClick={onImageClick}
                            style={{ touchAction: 'pan-y' }}
                        >
                            {mediaItems[currentImageIndex].thumbnail ? (
                                <img src={mediaItems[currentImageIndex].thumbnail} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <video
                                    src={mediaItems[currentImageIndex].url}
                                    className="w-full h-full object-cover pointer-events-none"
                                    muted playsInline preload="metadata"
                                    onLoadedMetadata={e => { (e.target as HTMLVideoElement).currentTime = 0.1; }}
                                />
                            )}
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Play size={22} className="text-white ml-1" fill="white" />
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`i-${currentImageIndex}`}
                            className="w-full h-full cursor-grab active:cursor-grabbing"
                            initial={false}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            drag={mediaItems.length > 1 ? 'x' : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.15}
                            onDragStart={onDragStart}
                            onDragEnd={onImageDragEnd}
                            onClick={onImageClick}
                            style={{ touchAction: 'pan-y' }}
                        >
                            <img
                                src={mediaItems[currentImageIndex]?.url}
                                alt={serviceTitle}
                                className="w-full h-full object-cover pointer-events-none"
                                draggable={false}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {mediaItems.length > 1 && (
                    <>
                        <button
                            onClick={e => { e.stopPropagation(); onPrev(); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2.5 rounded-full shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-20 hidden md:block active:scale-90"
                        >
                            <ChevronLeft size={22} className="text-slate-800" />
                        </button>
                        <button
                            onClick={e => { e.stopPropagation(); onNext(); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2.5 rounded-full shadow-md backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-20 hidden md:block active:scale-90"
                        >
                            <ChevronRight size={22} className="text-slate-800" />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none">
                            {mediaItems.map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`h-1.5 rounded-full transition-all shadow-sm ${idx === currentImageIndex ? (item.type === 'video' ? 'bg-white w-5' : 'bg-white w-5') : 'bg-white/50 w-1.5'}`}
                                />
                            ))}
                        </div>
                    </>
                )}

                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-lg pointer-events-none">
                    {mediaItems[currentImageIndex]?.type === 'video'
                        ? <Play size={11} className="text-white/80" fill="white" />
                        : <Camera size={11} className="text-white/80" />
                    }
                    {mediaItems.length > 1
                        ? <span className="text-white text-[11px] font-bold">{currentImageIndex + 1} / {mediaItems.length}</span>
                        : <span className="text-white text-[11px] font-bold">Powiększ</span>
                    }
                </div>
            </>
        ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 flex-col gap-2">
                <Camera size={32} className="opacity-30" />
                <span className="text-sm">Brak zdjęcia</span>
            </div>
        )}

        <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-md ${serviceType === 'request' ? 'bg-violet-600' : 'bg-indigo-500'}`}>
                {serviceType === 'request' ? 'Zlecenie' : 'Oferta'}
            </span>
        </div>
    </div>
));

ServiceMediaGallery.displayName = 'ServiceMediaGallery';
