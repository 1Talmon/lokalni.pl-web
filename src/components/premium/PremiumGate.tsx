'use client';
import React, { useState } from 'react';
import { Sparkles, Lock } from 'lucide-react';
import { PremiumUpgradeModal } from './PremiumUpgradeModal';

interface PremiumGateProps {
    isPremium: boolean;
    onUpgrade: () => void;
    children: React.ReactNode;
    /**
     * 'block'   — prompt zamiast treści (domyślny)
     * 'overlay' — treść zamazana z overlayem
     */
    mode?: 'block' | 'overlay';
    /** Pozycja overlaya: 'top' (domyślnie) lub 'center' */
    overlayAlign?: 'top' | 'center';
    featureName?: string;
}

/** Inline prompt — mały blok z przyciskiem otwierającym modal bezpośrednio */
const InlinePrompt = ({ featureName, onOpen }: { featureName?: string; onOpen: () => void }) => (
    <div className="flex flex-col items-center justify-center flex-1 px-6 text-center py-16">
        <div className="w-14 h-14 bg-amber-50 border-2 border-amber-100 rounded-3xl flex items-center justify-center mb-4">
            <Lock size={22} className="text-amber-500" />
        </div>
        <h3 className="text-base font-bold text-gray-900 mb-1.5">
            {featureName ? `${featureName}` : 'Funkcja'} wymaga MyLokalni Plus
        </h3>
        <p className="text-sm text-gray-400 font-medium mb-5 max-w-[240px] leading-relaxed">
            Odblokuj pełne możliwości platformy za 30 zł miesięcznie.
        </p>
        <button
            onClick={onOpen}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-2xl font-black text-sm shadow-lg shadow-amber-200 active:scale-95 transition-all"
        >
            <Sparkles size={14} /> Odblokuj MyLokalni Plus
        </button>
    </div>
);

export const PremiumGate = ({
    isPremium,
    onUpgrade,
    children,
    mode = 'block',
    overlayAlign = 'top',
    featureName,
}: PremiumGateProps) => {
    const [modalOpen, setModalOpen] = useState(false);

    const handleSuccess = () => {
        setModalOpen(false);
        onUpgrade();
    };

    if (isPremium) return <>{children}</>;

    if (mode === 'overlay') {
        return (
            <>
                <div className="relative">
                    {/* Treść zamazana */}
                    <div className="opacity-25 pointer-events-none select-none blur-sm">
                        {children}
                    </div>
                    {/* Overlay */}
                    <div
                        className={`absolute inset-0 flex flex-col items-center ${overlayAlign === 'center' ? 'justify-start' : 'justify-start pt-10'}`}
                        style={overlayAlign === 'center' ? { paddingTop: '28vh' } : undefined}
                    >
                        <div className="flex flex-col items-center gap-4 text-center px-6 max-w-sm">
                            <div className="w-14 h-14 bg-amber-50 border-2 border-amber-100 rounded-3xl flex items-center justify-center">
                                <Lock size={24} className="text-amber-500" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-base">
                                    {featureName ? `${featureName} wymaga` : 'Wymaga'} MyLokalni Plus
                                </p>
                                <p className="text-sm text-gray-500 font-medium mt-1">
                                    Odblokuj za 30 zł miesięcznie.
                                </p>
                            </div>
                            <button
                                onClick={() => setModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-2xl font-black text-sm shadow-lg shadow-amber-200 active:scale-95 transition-all"
                            >
                                <Sparkles size={15} /> Odblokuj MyLokalni Plus
                            </button>
                        </div>
                    </div>
                </div>
                <PremiumUpgradeModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSuccess={handleSuccess}
                />
            </>
        );
    }

    return (
        <>
            <InlinePrompt featureName={featureName} onOpen={() => setModalOpen(true)} />
            <PremiumUpgradeModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSuccess={handleSuccess}
            />
        </>
    );
};
