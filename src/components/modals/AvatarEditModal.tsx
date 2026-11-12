'use client';
import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Camera, Loader2, Minus, Plus } from 'lucide-react';
import { SheetModal } from './SheetModal';
import { MODAL_BTN_PRIMARY, MODAL_BTN_SECONDARY } from './modalBase';

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

    return (
        <SheetModal
            isOpen={!!image}
            onClose={onClose}
            title="Zdjęcie profilowe"
            icon={Camera}
            size="lg"
            dismissible={!isProcessing}
            footer={({ close }) => (
                <>
                    <button type="button" onClick={close} disabled={isProcessing} className={MODAL_BTN_SECONDARY}>Anuluj</button>
                    <button
                        type="button"
                        onClick={() => onSave(croppedAreaPixels)}
                        disabled={isProcessing}
                        className={MODAL_BTN_PRIMARY}
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={18} /> : 'Zapisz zdjęcie'}
                    </button>
                </>
            )}
        >
                        <div className="relative h-[300px] md:h-[350px] bg-gray-900 rounded-3xl overflow-hidden">
                            {image && <Cropper
                                image={image}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />}
                        </div>

                        <div className="flex flex-col gap-3 px-2 mt-6">
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
        </SheetModal>
    );
};
