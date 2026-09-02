'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

interface Slide {
    emoji: string;
    bg: string;
    title: string;
    desc: string;
}

const SLIDES: Slide[] = [
    {
        emoji: '👋',
        bg: 'bg-indigo-50',
        title: 'Witaj w MyLokalni.pl!',
        desc: 'Łączymy mieszkańców z lokalnymi wykonawcami w całej Polsce. Zajmie Ci chwilę — pokażemy Ci jak to działa.',
    },
    {
        emoji: '🔍',
        bg: 'bg-sky-50',
        title: 'Szukaj w okolicy',
        desc: 'Wpisz usługę i miasto albo przeglądaj po kategoriach. Możesz też przełączyć się na widok mapy.',
    },
    {
        emoji: '✨',
        bg: 'bg-violet-50',
        title: 'Dodaj ogłoszenie',
        desc: 'Jesteś wykonawcą lub masz zlecenie? Naciśnij przycisk + i opublikuj ogłoszenie widoczne dla tysięcy użytkowników.',
    },
    {
        emoji: '👤',
        bg: 'bg-emerald-50',
        title: 'Uzupełnij profil',
        desc: 'Twój profil to Twoja wizytówka. Dodaj zdjęcie i opis — klienci i wykonawcy Ci zaufają.',
    },
];

const slideVariants = {
    enter: (dir: number) => ({ x: dir * 48, opacity: 0 }),
    center:               ({ x: 0, opacity: 1 }),
    exit:  (dir: number) => ({ x: -dir * 48, opacity: 0 }),
};

export const TourOverlay = ({ onDone }: { onDone: () => void }) => {
    const [step, setStep] = useState(0);
    const [dir, setDir] = useState(1);
    const router = useRouter();

    const current = SLIDES[step];
    const isLast = step === SLIDES.length - 1;
    const isFirst = step === 0;

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onDone(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onDone]);

    const goNext = () => {
        setDir(1);
        setStep(s => s + 1);
    };

    const goPrev = () => {
        setDir(-1);
        setStep(s => s - 1);
    };

    const handleProfile = () => {
        onDone();
        router.push('/dashboard');
    };

    return createPortal(
        <div className="fixed inset-0 z-[9000]">
            {/* Backdrop — nie zamyka po kliknięciu */}
            <motion.div
                className="absolute inset-0 bg-black/65"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
            />

            {/* Card */}
            <div className="absolute inset-0 flex items-center justify-center p-5 pointer-events-none">
                <motion.div
                    className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden pointer-events-auto flex flex-col"
                    initial={{ opacity: 0, scale: 0.94, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.94, y: 16 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                >
                    {/* Header: progress + close */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-0">
                        <div className="flex items-center gap-1.5">
                            {SLIDES.map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="rounded-full bg-[#6366F1]"
                                    animate={{ width: i === step ? 20 : 6, opacity: i <= step ? 1 : 0.25 }}
                                    transition={{ duration: 0.25 }}
                                    style={{ height: 6 }}
                                />
                            ))}
                        </div>
                        <button
                            onClick={onDone}
                            className="p-1.5 rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Slide content */}
                    <div className="relative h-[220px] overflow-hidden">
                        <AnimatePresence mode="wait" custom={dir}>
                            <motion.div
                                key={step}
                                custom={dir}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.22, ease: 'easeOut' }}
                                className="absolute inset-0 px-6 flex flex-col items-center justify-center"
                            >
                                <div className="flex justify-center mb-4">
                                    <div className={`w-20 h-20 rounded-full ${current.bg} flex items-center justify-center text-4xl shrink-0`}>
                                        {current.emoji}
                                    </div>
                                </div>

                                <h2 className="font-bold text-gray-900 text-lg tracking-tight text-center mb-2">
                                    {current.title}
                                </h2>
                                <p className="text-sm text-gray-500 font-medium text-center leading-relaxed line-clamp-3">
                                    {current.desc}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Buttons */}
                    <div className="px-5 pb-5 pt-4 space-y-2">
                        {isLast ? (
                            <>
                                <button
                                    onClick={handleProfile}
                                    className="w-full bg-[#6366F1] text-white rounded-2xl py-3 font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-[#4F46E5] active:scale-95 transition-all shadow-xl shadow-indigo-100"
                                >
                                    Uzupełnij profil <ArrowRight size={15} />
                                </button>
                                <button
                                    onClick={onDone}
                                    className="w-full text-center text-xs text-gray-400 hover:text-gray-600 font-medium py-1.5 transition-colors"
                                >
                                    Zrobię to później
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                {!isFirst && (
                                    <button
                                        onClick={goPrev}
                                        className="p-2.5 rounded-2xl text-gray-400 hover:bg-gray-100 transition-colors"
                                    >
                                        <ArrowLeft size={18} />
                                    </button>
                                )}
                                <button
                                    onClick={goNext}
                                    className="flex-1 bg-[#6366F1] text-white rounded-2xl py-3 font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-[#4F46E5] active:scale-95 transition-all shadow-xl shadow-indigo-100"
                                >
                                    Dalej <ArrowRight size={15} />
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>,
        document.body
    );
};
