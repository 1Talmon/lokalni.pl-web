'use client';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { BottomSheetHandle } from '../ui/BottomSheetHandle';
import { X, Award, CheckCircle, ShieldCheck, ArrowLeft, FileCheck } from 'lucide-react';

export type CertItem = {
    id: number;
    type: 'cert';
    name: string;
    image: string;
};

export type CompItem = {
    id: number;
    type: 'comp';
    name: string;
    level: string;
    verified: boolean;
};

export type CertOrComp = CertItem | CompItem;

const LEVEL_BADGE: Record<string, { bg: string; text: string }> = {
    "Ekspert":             { bg: "bg-indigo-500/25", text: "text-indigo-300" },
    "Certyfikat":          { bg: "bg-amber-500/25",  text: "text-amber-300"  },
    "Zaawansowany":        { bg: "bg-emerald-500/25",text: "text-emerald-300"},
    "Średniozaawansowany": { bg: "bg-slate-700",     text: "text-slate-300"  },
};

interface Props {
    isOpen: boolean;
    onClose: () => void;
    items: CertOrComp[];
}

export const CertificatesModal = ({ isOpen, onClose, items }: Props) => {
    const [selected, setSelected] = useState<CertOrComp | null>(null);
    const { sheetDragProps, startDrag, backdropOpacity, triggerClose, handleClose } = useBottomSheet(onClose, isOpen);

    useEffect(() => {
        if (!isOpen) { setSelected(null); return; }
        lockScroll();
        return () => { setTimeout(unlockScroll, 250); };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (selected) setSelected(null);
                else triggerClose();
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, [isOpen, selected, triggerClose]);

    const certs = items.filter((i): i is CertItem => i.type === 'cert');
    const comps  = items.filter((i): i is CompItem => i.type === 'comp');

    return createPortal(
        isOpen ? (
            <div className="fixed inset-0 z-[400]">
                {/* Backdrop — fades in real time with drag gesture */}
                <motion.div
                    style={{ opacity: backdropOpacity }}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => { if (selected) setSelected(null); else triggerClose(); }}
                />
                {/* Sheet */}
                <div className="absolute inset-0 flex items-end md:items-center justify-center pointer-events-none">
                    <motion.div
                        {...sheetDragProps}
                        className="pointer-events-auto relative w-full max-w-lg bg-slate-900 md:rounded-[2.5rem] rounded-t-[2.5rem] overflow-hidden shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <BottomSheetHandle onPointerDown={startDrag} dark />

                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800 cursor-grab active:cursor-grabbing"
                            style={{ touchAction: 'none' }}
                            onPointerDown={startDrag}
                        >
                            <div className="flex items-center gap-3">
                                {selected && (
                                    <button
                                        onClick={() => setSelected(null)}
                                        className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
                                    >
                                        <ArrowLeft size={15} />
                                    </button>
                                )}
                                <div>
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                                        {selected ? selected.name : 'Certyfikaty i kompetencje'}
                                    </h3>
                                    {!selected && (
                                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                                            {items.length} {items.length === 1 ? 'pozycja' : 'pozycji'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {!selected ? (
                                /* ── SIATKA ── */
                                <motion.div
                                    key="grid"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="p-4 max-h-[65dvh] overflow-y-auto space-y-4"
                                    style={{ paddingBottom: 'calc(var(--native-cta-h, var(--bottom-nav-total-h, env(safe-area-inset-bottom))) + 1rem)' }}
                                >
                                    {items.length === 0 && (
                                        <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                                                <FileCheck size={20} className="text-slate-600" />
                                            </div>
                                            <p className="text-[13px] text-slate-500 font-semibold">Brak dokumentów</p>
                                        </div>
                                    )}

                                    {/* Certyfikaty — siatka 2 kolumny ze zdjęciem */}
                                    {certs.length > 0 && (
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2.5 px-1">Dokumenty</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {certs.map((item, idx) => (
                                                    <motion.button
                                                        key={item.id}
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: idx * 0.06 }}
                                                        onClick={() => setSelected(item)}
                                                        className="group rounded-2xl overflow-hidden bg-slate-800 border border-slate-700/50 hover:border-indigo-500/40 active:scale-[0.97] transition-all text-left"
                                                    >
                                                        <div className="relative aspect-[4/3] overflow-hidden bg-slate-700">
                                                            {item.image
                                                                ? <Image src={item.image} fill className="object-cover group-hover:scale-105 transition-transform duration-300" alt={item.name} sizes="200px" />
                                                                : <div className="w-full h-full flex items-center justify-center"><Award size={28} className="text-amber-500/30" /></div>
                                                            }
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                                        </div>
                                                        <div className="px-3 py-2.5">
                                                            <p className="text-[12px] font-bold text-white leading-tight truncate">{item.name}</p>
                                                            <div className="flex items-center gap-1 mt-1">
                                                                <ShieldCheck size={9} className="text-indigo-400 shrink-0" />
                                                                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Zweryfikowany</span>
                                                            </div>
                                                        </div>
                                                    </motion.button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Kompetencje — siatka 2 kolumny z ikoną */}
                                    {comps.length > 0 && (
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2.5 px-1">Kompetencje</p>
                                            <div className="grid grid-cols-2 gap-3">
                                                {comps.map((item, idx) => {
                                                    const badge = LEVEL_BADGE[item.level] ?? LEVEL_BADGE["Średniozaawansowany"];
                                                    return (
                                                        <motion.button
                                                            key={item.id}
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            transition={{ delay: (certs.length + idx) * 0.06 }}
                                                            onClick={() => setSelected(item)}
                                                            className="group rounded-2xl bg-slate-800 border border-slate-700/50 hover:border-indigo-500/40 active:scale-[0.97] transition-all text-left p-4 flex flex-col gap-3"
                                                        >
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.verified ? 'bg-emerald-500/15' : 'bg-slate-700'}`}>
                                                                <CheckCircle size={18} className={item.verified ? 'text-emerald-400' : 'text-slate-500'} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[12px] font-bold text-white leading-tight line-clamp-2">{item.name}</p>
                                                                <span className={`inline-block mt-1.5 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg ${badge.bg} ${badge.text}`}>
                                                                    {item.level}
                                                                </span>
                                                            </div>
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                /* ── DETAL ── */
                                <motion.div
                                    key={`detail-${selected.id}`}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 12 }}
                                    transition={{ duration: 0.18 }}
                                >
                                    {selected.type === 'cert' ? (
                                        <div>
                                            {selected.image
                                                ? <img src={selected.image} alt={selected.name} className="w-full object-contain max-h-[55vh] bg-slate-950" />
                                                : <div className="flex items-center justify-center h-48 bg-slate-800"><Award size={52} className="text-amber-500/20" /></div>
                                            }
                                            <div className="px-5 py-4 flex items-center gap-3 border-t border-slate-800" style={{ paddingBottom: 'calc(var(--native-cta-h, var(--bottom-nav-total-h, env(safe-area-inset-bottom))) + 1rem)' }}>
                                                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0">
                                                    <Award size={17} className="text-amber-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[15px] font-black text-white leading-tight truncate">{selected.name}</p>
                                                    <div className="flex items-center gap-1.5 mt-1">
                                                        <ShieldCheck size={11} className="text-indigo-400" />
                                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Zweryfikowany dokument</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            {(() => {
                                                const badge = LEVEL_BADGE[selected.level] ?? LEVEL_BADGE["Średniozaawansowany"];
                                                return (
                                                    <>
                                                        <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 px-6 pt-8 pb-10 flex flex-col items-center text-center gap-4">
                                                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg ${selected.verified ? 'bg-emerald-500/20 shadow-emerald-500/10' : 'bg-slate-700'}`}>
                                                                <CheckCircle size={36} className={selected.verified ? 'text-emerald-400' : 'text-slate-500'} strokeWidth={1.5} />
                                                            </div>
                                                            <div>
                                                                <h3 className="text-[18px] font-black text-white leading-tight">{selected.name}</h3>
                                                                {selected.verified && (
                                                                    <div className="flex items-center justify-center gap-1.5 mt-2">
                                                                        <ShieldCheck size={12} className="text-indigo-400" />
                                                                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Zweryfikowane</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${badge.bg} ${badge.text}`}>
                                                                {selected.level}
                                                            </span>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        ) : null,
        document.body
    );
};
