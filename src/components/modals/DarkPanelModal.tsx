'use client';
import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, type LucideIcon } from 'lucide-react';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { BottomSheetHandle } from '../ui/BottomSheetHandle';
import { MODAL_Z, useModalBehavior } from './modalBase';

/**
 * RODZINA 2 – CIEMNE PANELE z treścią profilu (aktualności, certyfikaty): ciemne tło, mały nagłówek
 * kapitalikami, treść przewijana przez wywołującego. Uchwyt, gest zamknięcia, Esc, blokada scrolla i
 * warstwa pochodzą z tej samej bazy (modalBase) co arkusze – zmienia się tylko motyw.
 */

const SIZE_CLASS = { md: 'md:max-w-lg', lg: 'md:max-w-2xl' } as const;

interface DarkPanelModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: ReactNode;
    subtitle?: ReactNode;
    icon: LucideIcon;
    /** Zamiast ikony (np. przycisk „Wstecz” w widoku szczegółów). */
    leading?: ReactNode;
    size?: keyof typeof SIZE_CLASS;
    closeLabel?: string;
    /** Esc: domyślnie zamyka. Wywołujący może przejąć (np. najpierw wyjść z podglądu). */
    onEscape?: (close: () => void) => void | false;
    /** false = kliknięcie w tło nie zamyka (np. otwarty podgląd zdjęcia). */
    dismissOnBackdrop?: boolean;
    children: ReactNode;
}

export const DarkPanelModal = ({
    isOpen, onClose, title, subtitle, icon: Icon, leading, size = 'md',
    closeLabel = 'Zamknij', onEscape, dismissOnBackdrop = true, children,
}: DarkPanelModalProps) => {
    const { sheetDragProps, startDrag, backdropOpacity, triggerClose, handleClose } = useBottomSheet(onClose, isOpen);

    useModalBehavior(isOpen, () => (onEscape ? onEscape(() => triggerClose()) : triggerClose()));

    return createPortal(
        isOpen ? (
            <div className={`fixed inset-0 ${MODAL_Z.sheet}`}>
                <motion.div
                    style={{ opacity: backdropOpacity }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={dismissOnBackdrop ? handleClose : undefined}
                />
                <div className="absolute inset-0 flex items-end md:items-center justify-center md:p-4 pointer-events-none">
                    <motion.div
                        {...sheetDragProps}
                        style={{ ...sheetDragProps.style, maxHeight: 'calc(88dvh - var(--bottom-nav-total-h, 0px))' }}
                        className={`pointer-events-auto relative w-full ${SIZE_CLASS[size]} min-h-[45dvh] bg-slate-900 rounded-t-[2rem] md:rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="md:hidden">
                            <BottomSheetHandle onPointerDown={startDrag} dark />
                        </div>

                        <div
                            className="px-6 md:px-8 py-4 md:py-5 border-b border-slate-800 shrink-0 flex items-center justify-between gap-3 cursor-grab md:cursor-default active:cursor-grabbing"
                            style={{ touchAction: 'none' }}
                            onPointerDown={startDrag}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                {leading ?? (
                                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                        <Icon size={14} />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white truncate">{title}</h3>
                                    {subtitle && <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{subtitle}</p>}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                aria-label={closeLabel}
                                className="p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {children}
                    </motion.div>
                </div>
            </div>
        ) : null,
        document.body
    );
};
