'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import {
    MessageCircle, ChevronRight, Clock, User, MapPin,
    CheckCircle2, X, Play, Mic, AlignLeft, Maximize2,
    CalendarClock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Order {
    id: number;
    service: string;
    clientName?: string;
    provider?: string;
    address?: string;
    date: string;
    time: string;
    status: string;
    description?: string;
    voiceNote?: boolean;
    images?: string[];
    isUnseen?: boolean;
}

interface OrderItemProps {
    order: Order;
    viewMode: 'provider' | 'client';
    isHistory?: boolean;
    onCancel?: (id: number) => void;
    onProposeNewDate?: (id: number) => void;
}

export const OrderItem = ({ order, viewMode, isHistory = false, onCancel, onProposeNewDate }: OrderItemProps) => {
    const isProvider = viewMode === 'provider';
    const themeColor = isProvider ? 'indigo' : 'emerald';

    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedImg, setSelectedImg] = useState<string | null>(null);

    // Flaga nowości dla czerwonego paska
    const isNew = order.isUnseen && isProvider && !isHistory;

    return (
        <div className={`bg-white p-5 md:p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-5 transition-all group relative overflow-hidden ${isHistory ? 'opacity-75 grayscale-[0.5]' : ''}`}>

            {/* BADGE - Znika płynnie przez CSS opacity */}
            <div
                className={`absolute top-0 left-12 px-4 py-1.5 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-b-xl shadow-lg z-20 transition-opacity duration-1000 ease-in-out ${isNew ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                Nowe
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    {/* DATA - Bez czerwonej kropki */}
                    <div className="relative shrink-0">
                        <div className={`w-16 h-16 bg-${themeColor}-50 rounded-2xl flex flex-col items-center justify-center font-bold text-${themeColor}-600 border border-${themeColor}-100 shrink-0`}>
                            <span className="text-[10px] uppercase opacity-70 mb-1">{order.date.split(' ')[1]}</span>
                            <span className="text-xl leading-none">{order.date.split(' ')[0]}</span>
                        </div>
                    </div>

                    <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-lg truncate pr-4">{order.service}</h4>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1">
                            {isProvider ? (
                                <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                                    <MapPin size={14} className="text-indigo-500" />
                                    <span className="truncate">{order.address}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                                    <User size={14} className="text-emerald-500" />
                                    <span className="truncate">{order.provider}</span>
                                </div>
                            )}
                            <span className="hidden md:block w-1 h-1 bg-gray-300 rounded-full" />
                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                                <Clock size={14} /> {order.time}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!isHistory ? (
                        <>
                            {isProvider && (
                                <button
                                    onClick={() => onProposeNewDate?.(order.id)}
                                    className="hidden lg:flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-gray-400 hover:text-indigo-600 transition-colors px-2"
                                >
                                    <CalendarClock size={14} />
                                    Inny termin
                                </button>
                            )}

                            <button className={`p-3 bg-${themeColor}-50 text-${themeColor}-600 rounded-xl font-bold text-xs hover:bg-${themeColor}-100 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm`}>
                                <MessageCircle size={18} />
                                <span className="hidden sm:inline">Chat</span>
                            </button>

                            <button
                                onClick={() => onCancel?.(order.id)}
                                className="p-3 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"
                            >
                                <X size={20} />
                            </button>

                            <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition-all">
                                <ChevronRight size={20} />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 px-4 py-2 rounded-xl">
                            <CheckCircle2 size={16} /> Zakończone
                        </div>
                    )}
                </div>
            </div>

            {!isHistory && (
                <div className="space-y-4 pt-4 border-t border-gray-50">
                    {order.description && (
                        <div className="flex items-start gap-3 bg-gray-50/30 p-4 rounded-2xl border border-gray-100/50">
                            <AlignLeft size={16} className="text-gray-400 shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-600 italic">"{order.description}"</p>
                        </div>
                    )}
                    <div className="flex flex-col md:flex-row gap-4">
                        {order.voiceNote && (
                            <div className="flex-1 flex items-center gap-3 bg-indigo-50/50 p-3 rounded-2xl border border-indigo-100/50">
                                <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md active:scale-90">
                                    {isPlaying ? <X size={16} /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                                </button>
                                <div className="flex-1 h-1 bg-indigo-100 rounded-full overflow-hidden">
                                    <div className={`h-full bg-indigo-500 ${isPlaying ? 'w-full transition-all duration-[24s] linear' : 'w-0'}`} />
                                </div>
                                <Mic size={14} className="text-indigo-300" />
                            </div>
                        )}
                        {order.images && order.images.length > 0 && (
                            <div className="flex items-center gap-2 bg-gray-50/50 p-2 rounded-2xl border border-gray-100 min-h-[56px]">
                                {order.images.map((img: string, idx: number) => (
                                    <div key={idx} onClick={() => setSelectedImg(img)} className="relative w-12 h-12 rounded-xl overflow-hidden cursor-zoom-in group/img bg-gray-200">
                                        <Image src={img} alt="" fill className="object-cover transition-transform group-hover/img:scale-110" sizes="48px" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                                            <Maximize2 size={12} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <AnimatePresence>
                {selectedImg && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setSelectedImg(null)}
                        className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4 cursor-zoom-out"
                    >
                        <motion.img
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                            src={selectedImg}
                            className="max-w-[95%] max-h-[90%] rounded-2xl shadow-2xl object-contain"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};