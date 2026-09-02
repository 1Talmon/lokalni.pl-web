'use client';
import { useEffect, type ReactNode } from 'react';
import type { EarningsTransaction } from '../../../services/analyticsService';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, CheckCircle2, Hash, Clock, CalendarDays, User, ExternalLink } from 'lucide-react';
import { useSwipeToClose } from '../../../hooks/useSwipeToClose';
import { useRouter } from 'next/navigation';
import { createServiceUrl } from '../../../utils/helpers';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '../../../plugins/NativeNav';

interface TransactionSidebarProps {
    tx: EarningsTransaction | null;
    onClose: () => void;
}

export const TransactionSidebar = ({ tx, onClose }: TransactionSidebarProps) => {
    const { panelRef, panelX, isNative, triggerClose } = useSwipeToClose(!!tx, onClose);
    const router = useRouter();
    const serviceUrl = tx?.servicePublicId
        ? `/service/${createServiceUrl(tx.serviceTitle, tx.servicePublicId)}`
        : null;

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!tx) return null;

    return createPortal(
        <>
            {!isNative && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/20 backdrop-blur-md z-[60]"
                />
            )}
            <motion.div
                ref={panelRef}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={isNative ? { x: '100%', transition: { duration: 0 } } : { x: '100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                style={{ x: panelX, paddingTop: 'calc(2rem + env(safe-area-inset-top, 0px))', paddingBottom: 'calc(2rem + var(--bottom-nav-total-h, env(safe-area-inset-bottom, 0px)))' }}
                data-modal-panel
                className="fixed right-0 top-0 h-full w-full md:w-[450px] bg-white z-[70] shadow-2xl p-8 flex flex-col text-left overflow-hidden"
            >
                <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[1px] bg-gray-50" />

                <div className="flex justify-between items-center mb-4">
                    <button
                        onClick={triggerClose}
                        className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                    >
                        <X size={20} className="text-gray-900" />
                    </button>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        Szczegóły wpłaty
                    </span>
                    <div className="w-10" />
                </div>

                <div className="flex flex-col items-center text-center space-y-5 flex-1 justify-center min-h-0 overflow-y-auto scrollbar-hide">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-indigo-50 text-[#6366F1] rounded-[2rem] flex items-center justify-center mb-3">
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight">+{tx.amount.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} zł</h3>
                        <p className="text-indigo-500 font-black text-[10px] uppercase tracking-widest mt-2">
                            Zakończono pomyślnie
                        </p>
                    </div>

                    <div className="w-full space-y-1">
                        <DetailItem icon={<Hash size={16}/>} label="Numer" value={`#${tx.id}`} />
                        <DetailItem icon={<User size={16}/>} label="Klient" value={tx.clientName || '—'} />
                        <DetailItem icon={<Clock size={16}/>} label="Czas" value={tx.dateLabel} />
                        <DetailItem icon={<CalendarDays size={16}/>} label="Data usługi" value={tx.dateLabel || '—'} />
                    </div>

                    <div className="w-full text-left">
                        <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                Tytuł usługi
                            </p>
                            <p className="font-bold text-gray-900">{tx.serviceTitle}</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={async () => { if (Capacitor.isNativePlatform()) await NativeNav.push().catch(() => {}); onClose(); if (serviceUrl) router.push(serviceUrl); }}
                    disabled={!serviceUrl}
                    className="w-full py-4 bg-[#6366F1] text-white rounded-[2rem] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 mt-4 shadow-lg shadow-indigo-100 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    <ExternalLink size={18} /> Zobacz ogłoszenie
                </button>
            </motion.div>
        </>,
        document.body
    );
};

const DetailItem = ({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) => (
    <div className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
        <div className="flex items-center gap-3 text-gray-400">
            {icon}
            <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
        </div>
        <span className="font-bold text-gray-900 text-sm">{value}</span>
    </div>
);