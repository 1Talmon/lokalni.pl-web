'use client';
import { useState, useEffect, useRef } from 'react';
import { Star, Loader2, Camera, X } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface ReviewFormProps {
    isOpen: boolean;
    onSubmit: (rating: number, text: string, imageUrl?: string | null) => Promise<void> | void;
    onCancel: () => void;
}

const RATING_LABELS = ['', 'Bardzo słaba', 'Słaba', 'Przeciętna', 'Dobra', 'Doskonała'];

export const ReviewForm = ({ isOpen, onSubmit, onCancel }: ReviewFormProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [text, setText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | Blob | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setRating(5);
            setHoverRating(0);
            setText('');
            setIsSubmitting(false);
            setImagePreview(null);
            setImageFile(null);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handlePickImage = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = ev => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0 || !text.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            let imageUrl: string | null = null;
            if (imageFile) {
                const fd = new FormData();
                fd.append('file', imageFile, 'review.jpg');
                fd.append('context', 'review');
                const uploadRes = await apiClient.postFormData('/upload/image', fd);
                if (uploadRes.ok) {
                    const json = await uploadRes.json() as { url: string };
                    imageUrl = json.url;
                }
            }
            await onSubmit(rating, text.trim(), imageUrl);
        } catch {
            // błąd obsługiwany przez rodzica (toast)
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden mb-6">
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-[#6366F1] rounded-full" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Twoja opinia</span>
                </div>

                {/* Gwiazdki */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                        Ocena <span className="text-red-400">*</span>
                    </label>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                            <button
                                key={star}
                                type="button"
                                disabled={isSubmitting}
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                className="p-1 transition-transform active:scale-90 disabled:opacity-50"
                                aria-label={`Ocena ${star}`}
                            >
                                <Star
                                    size={32}
                                    className={`transition-colors duration-100 ${
                                        star <= (hoverRating || rating)
                                            ? 'fill-amber-400 text-amber-400'
                                            : 'fill-slate-200 text-slate-200'
                                    }`}
                                />
                            </button>
                        ))}
                        {rating > 0 && (
                            <span className="ml-2 text-sm font-bold text-slate-500">
                                {RATING_LABELS[rating]}
                            </span>
                        )}
                    </div>
                </div>

                {/* Treść */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                        Treść opinii <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        required
                        disabled={isSubmitting}
                        rows={4}
                        maxLength={5000}
                        lang="pl"
                        autoCorrect="on"
                        autoCapitalize="sentences"
                        placeholder="Opisz swoje doświadczenie z tym wykonawcą..."
                        className="w-full p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#6366F1] transition-all resize-none text-slate-700 text-sm disabled:opacity-60"
                    />
                </div>

                {/* Zdjęcie */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Zdjęcie (opcjonalnie)</label>
                    {imagePreview ? (
                        <div className="relative w-24 h-24">
                            <img src={imagePreview} className="w-24 h-24 rounded-2xl object-cover border border-slate-200" alt="Podgląd" />
                            <button
                                type="button"
                                onClick={() => { setImagePreview(null); setImageFile(null); }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center shadow"
                            >
                                <X size={12} className="text-white" />
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            onClick={handlePickImage}
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-slate-300 rounded-2xl text-sm font-semibold text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                        >
                            <Camera size={16} />
                            Dodaj zdjęcie
                        </button>
                    )}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                </div>

                {/* Przyciski */}
                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={rating === 0 || !text.trim() || isSubmitting}
                        className="flex-1 bg-[#6366F1] text-white py-3.5 rounded-2xl font-black text-base hover:bg-[#4F46E5] active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-indigo-300/40 flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <><Loader2 size={18} className="animate-spin" /> Wysyłanie...</>
                        ) : (
                            'Opublikuj opinię'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-5 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-600 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Anuluj
                    </button>
                </div>
            </form>
        </div>
    );
};
