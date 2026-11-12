'use client';
import { type ReactNode, type Ref } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, type LucideIcon } from 'lucide-react';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { BottomSheetHandle } from '../ui/BottomSheetHandle';
import { MODAL_Z, MODAL_ICON_TONE, MODAL_CLOSE_BTN, useModalBehavior } from './modalBase';

/**
 * RODZINA 1 – ARKUSZE: formularze, potwierdzenia, krótkie akcje (zgłoszenie, blokada, usunięcie,
 * wsparcie, zmiana terminu…). Telefon: arkusz z dołu z uchwytem i gestem zamknięcia; PC: karta na środku.
 * Jedno miejsce na układ – okna z tej rodziny mają wyglądać i zachowywać się identycznie.
 * Wzorzec: docs/UI-STYLE.md §5.
 */

const SIZE_CLASS = {
    md: 'md:max-w-md',
    lg: 'md:max-w-lg',
    xl: 'md:max-w-xl',
    '3xl': 'md:max-w-3xl',
} as const;

export interface SheetModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: ReactNode;
    /** Drobna linia pod tytułem (np. numer zgłoszenia + status). */
    subtitle?: ReactNode;
    icon: LucideIcon;
    /** Kolor ikony w nagłówku: indigo (domyślny) albo rose (akcje niszczące, zgłoszenia). */
    tone?: keyof typeof MODAL_ICON_TONE;
    /** Szerokość karty na PC. */
    size?: keyof typeof SIZE_CLASS;
    /** Stała wysokość (czat, kreator) zamiast dopasowania do treści. String = własne klasy wysokości (np. iPad, natywny czat). */
    tall?: boolean | string;
    /** false = nie da się zamknąć (trwa zapis): Esc, tło, X i gest wyłączone. */
    dismissible?: boolean;
    /** Element obok X w nagłówku (np. „Wstecz”). */
    headerExtra?: ReactNode;
    /** Dolny pasek przycisków. Użyj MODAL_BTN_* z modalBase. Funkcja dostaje `close` (zamknięcie z animacją). */
    footer?: ReactNode | ((api: { close: () => void }) => ReactNode);
    /** Treść bez własnego paddingu/przewijania – okno układa wnętrze samo (czat, kreator). */
    bare?: boolean;
    bodyClassName?: string;
    /** Ref do przewijanej treści (np. przewinięcie do wybranej godziny). */
    bodyRef?: Ref<HTMLDivElement>;
    children: ReactNode;
}

export const SheetModal = ({
    isOpen, onClose, title, subtitle, icon: Icon, tone = 'indigo', size = 'md', tall = false,
    dismissible = true, headerExtra, footer, bare = false, bodyClassName = '', bodyRef, children,
}: SheetModalProps) => {
    const { sheetDragProps, startDrag, backdropOpacity, triggerClose, handleClose } = useBottomSheet(onClose, isOpen);
    const close = () => { if (dismissible) handleClose(); };

    useModalBehavior(isOpen, () => { if (dismissible) triggerClose(); });

    const footerNode = typeof footer === 'function' ? footer({ close }) : footer;
    const drag = dismissible ? startDrag : undefined;

    return createPortal(
        isOpen ? (
            <div className={`fixed inset-0 ${MODAL_Z.sheet}`}>
                {/* Backdrop — znika razem z gestem przeciągania */}
                <motion.div
                    style={{ opacity: backdropOpacity }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={close}
                    onTouchMove={e => e.stopPropagation()}
                />
                <div className="absolute inset-0 flex items-end md:items-center justify-center md:p-4 pointer-events-none">
                    <motion.div
                        {...sheetDragProps}
                        onClick={e => e.stopPropagation()}
                        onTouchMove={e => e.stopPropagation()}
                        className={`pointer-events-auto w-full ${SIZE_CLASS[size]} bg-white rounded-t-[2rem] md:rounded-[2.5rem] shadow-2xl relative text-left flex flex-col overflow-hidden ${
                            tall ? (typeof tall === 'string' ? tall : 'h-[92dvh] md:h-[640px] md:max-h-[90vh]') : 'max-h-[92dvh] md:max-h-[90vh]'
                        }`}
                    >
                        <div className="md:hidden">
                            <BottomSheetHandle onPointerDown={drag} />
                        </div>

                        {/* Nagłówek = uchwyt do przeciągania */}
                        <div
                            className="px-6 md:px-8 py-4 md:py-5 border-b border-gray-50 bg-gray-50/50 shrink-0 flex items-center justify-between gap-3 cursor-grab md:cursor-default active:cursor-grabbing"
                            style={{ touchAction: 'none' }}
                            onPointerDown={drag}
                        >
                            <div className="min-w-0">
                                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-3 min-w-0">
                                    <div className={`p-2 rounded-xl shrink-0 ${MODAL_ICON_TONE[tone]}`}>
                                        <Icon size={18} />
                                    </div>
                                    <span className="truncate">{title}</span>
                                </h3>
                                {subtitle && <div className="mt-1 pl-[3.25rem] flex items-center gap-2 flex-wrap">{subtitle}</div>}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                {headerExtra}
                                <button type="button" onClick={close} aria-label="Zamknij" className={MODAL_CLOSE_BTN}>
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {bare ? (
                            <div ref={bodyRef} className={`flex-1 min-h-0 flex flex-col ${bodyClassName}`}>{children}</div>
                        ) : (
                            <div
                                ref={bodyRef}
                                className={`flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 md:px-8 py-5 ${bodyClassName}`}
                            >
                                {children}
                            </div>
                        )}

                        {footerNode && (
                            <div
                                className="px-6 md:px-8 pt-4 border-t border-gray-100 flex gap-3 shrink-0 bg-white"
                                style={{ paddingBottom: 'calc(var(--native-cta-h, var(--bottom-nav-total-h, env(safe-area-inset-bottom, 0px))) + 1.25rem)' }}
                            >
                                {footerNode}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        ) : null,
        document.body
    );
};
