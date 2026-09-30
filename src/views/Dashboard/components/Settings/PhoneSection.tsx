'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Loader2 } from 'lucide-react';

interface PhoneSectionProps {
    currentPhone: string;
    onPhoneChange: (newPhone: string) => Promise<void>;
}

export const PhoneSection = ({ currentPhone, onPhoneChange }: PhoneSectionProps) => {
    const [isEditingPhone, setIsEditingPhone] = useState(false);
    const [newPhone, setNewPhone] = useState(currentPhone);
    const [isPhoneLoading, setIsPhoneLoading] = useState(false);

    useEffect(() => {
        if (currentPhone) {
            setNewPhone(currentPhone);
        }
    }, [currentPhone]);

    return (
        <div className="overflow-visible">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <Phone size={18} />
                    </div>
                    <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm">Numer telefonu</h4>
                        <p className="text-xs text-gray-400">
                            {currentPhone
                                ? <span className="font-bold text-gray-700 tabular-nums">{currentPhone}</span>
                                : 'Twój numer kontaktowy widoczny w ofertach.'}
                        </p>
                    </div>
                </div>
                {!isEditingPhone ? (
                    <button
                        type="button"
                        onClick={() => setIsEditingPhone(true)}
                        className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    >
                        {currentPhone ? 'Zmień' : 'Dodaj'}
                    </button>
                ) : (
                    <button
                        onClick={() => setIsEditingPhone(false)}
                        className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                    >
                        Anuluj
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isEditingPhone && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-visible"
                    >
                        <div className="pt-6 pb-4 overflow-visible">
                            <div className="flex flex-col sm:flex-row gap-3 overflow-visible">
                                <div className="relative flex-1 overflow-visible">
                                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                                    <input
                                        type="tel"
                                        autoFocus
                                        className="w-full bg-gray-50 rounded-xl p-4 pl-12 text-sm border-none focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium ring-inset"
                                        placeholder="Nowy numer telefonu..."
                                        value={newPhone}
                                        onChange={(e) => setNewPhone(e.target.value)}
                                    />
                                </div>
                                <button
                                    disabled={isPhoneLoading}
                                    onClick={async () => {
                                        setIsPhoneLoading(true);
                                        try {
                                            await onPhoneChange(newPhone);
                                            setIsEditingPhone(false);
                                        } catch {
                                            // Error handling
                                        } finally {
                                            setIsPhoneLoading(false);
                                        }
                                    }}
                                    className="group relative overflow-hidden px-6 py-3 bg-[#6366F1] text-white rounded-2xl text-[13px] font-bold transition-all hover:bg-[#4F46E5] active:scale-95 shadow-xl shadow-indigo-100 disabled:opacity-70 flex items-center justify-center shrink-0 min-w-[160px]"
                                >
                                    {/* Treść przycisku nad efektem błysku */}
                                    <div className="flex items-center gap-2 relative z-10">
                                        {isPhoneLoading ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <>
                                                <Phone size={16} />
                                                <span>Zapisz numer</span>
                                            </>
                                        )}
                                    </div>

                                    {/* Efekt Shimmer (Błysk) */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
