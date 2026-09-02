'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '@/plugins/NativeNav';
import { Plus, MoreHorizontal, Zap, Edit3, Trash2, Tag, RotateCcw, AlertTriangle, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { Service } from '@/types';
import { serviceService } from '@/services/serviceService';
import { createServiceUrl } from '@/utils/helpers';

interface ServicesProps {
    myServices: Service[];
    onAddService: () => void;
    onEditService: (s: Service) => void;
    setServiceToDelete: (publicId: string) => void;
    addToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const ServiceCard = ({ service, onEdit, onDelete, onNavigate }: { service: Service; onEdit: () => void; onDelete: () => void; onNavigate: () => void }) => {
    const [imgError, setImgError] = useState(false);
    return (
        <div className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group w-full">
            <div className="flex gap-4">
                <div onClick={onNavigate} className="w-16 h-16 bg-indigo-50 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center cursor-pointer">
                    {!imgError && service.image ? (
                        <Image src={service.image} onError={() => setImgError(true)} width={64} height={64} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <Tag size={20} className="text-indigo-300" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 onClick={onNavigate} className="font-bold text-gray-900 text-sm leading-tight truncate cursor-pointer hover:text-indigo-600 transition-colors">{service.title}</h4>
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-bold shrink-0 border border-emerald-100">
                            <Zap size={9} fill="currentColor" /> Aktywna
                        </span>
                    </div>
                    {service.description && (
                        <p className="text-xs text-gray-400 font-medium line-clamp-2 leading-relaxed mb-2">{service.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-auto pt-1">
                        <p className="text-lg font-black text-indigo-600 tracking-tight">
                            {service.price} <span className="text-xs font-bold text-indigo-300">PLN</span>
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={onEdit} className="w-9 h-9 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all active:scale-90">
                                <Edit3 size={15} />
                            </button>
                            <button onClick={onDelete} className="w-9 h-9 rounded-xl bg-white border border-gray-100 text-gray-400 flex items-center justify-center hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-90">
                                <Trash2 size={15} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ArchivedCard = ({ service, onRestore }: { service: { image?: string | null; title: string; deletedAt?: string | null }; onRestore: () => void }) => {
    const [imgError, setImgError] = useState(false);
    return (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm opacity-70 flex gap-3 items-center w-full">
            <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center">
                {!imgError && service.image ? (
                    <Image src={service.image} onError={() => setImgError(true)} width={48} height={48} className="w-full h-full object-cover" alt="" />
                ) : (
                    <Tag size={16} className="text-gray-300" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-700 text-sm truncate">{service.title}</p>
                <p className="text-[11px] text-gray-400">
                    Usunięto {service.deletedAt ? new Date(service.deletedAt).toLocaleDateString('pl-PL') : '—'}
                </p>
            </div>
            <button onClick={onRestore} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors shrink-0">
                <RotateCcw size={13} /> Przywróć
            </button>
        </div>
    );
};

interface ConfirmDeleteModalProps {
    onConfirm: () => void;
    onCancel: () => void;
}
const ConfirmDeleteModal = ({ onConfirm, onCancel }: ConfirmDeleteModalProps) => {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onCancel]);

    return createPortal(
        <>
            <motion.div
                key="confirm-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                onClick={onCancel}
                className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
            />
            <div className="fixed inset-0 z-[61] flex items-end sm:items-center justify-center pointer-events-none sm:p-6">
            <motion.div
                    key="confirm-dialog"
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1, transition: { type: 'spring', bounce: 0, duration: 0.38 } }}
                    exit={{ y: '100%', opacity: 0, transition: { duration: 0.22, ease: 'easeIn' } }}
                    onClick={e => e.stopPropagation()}
                    className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl pointer-events-auto"
                    style={{ paddingBottom: 'calc(var(--native-cta-h, var(--bottom-nav-total-h, env(safe-area-inset-bottom))) + 1.5rem)' }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                            <AlertTriangle size={20} className="text-rose-500" />
                        </div>
                        <h4 className="font-bold text-gray-900 text-base">Usuń ogłoszenie?</h4>
                    </div>
                    <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                        Ogłoszenie trafi do archiwum. Możesz je przywrócić w sekcji <strong>Zarchiwizowane</strong>.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={onCancel} className="flex-1 py-3 rounded-2xl border border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                            Anuluj
                        </button>
                        <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition-colors active:scale-95">
                            Usuń
                        </button>
                    </div>
                </motion.div>
            </div>
        </>,
        document.body
    );
};

export const ServicesSection = ({ myServices, onAddService, onEditService, setServiceToDelete, addToast }: ServicesProps) => {
    const queryClient = useQueryClient();
    const router = useRouter();
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
    const [showArchived, setShowArchived] = useState(false);
    const [archivedServices, setArchivedServices] = useState<{ image?: string | null; title: string; deletedAt?: string | null; publicId: string }[]>([]);
    const [loadingArchived, setLoadingArchived] = useState(false);

    const handleConfirmDelete = () => {
        if (confirmDeleteId === null || confirmDeleteId === undefined) return;
        // Optimistic — natychmiast usuń z listy
        setRemovedIds(prev => new Set([...prev, confirmDeleteId]));
        setServiceToDelete(confirmDeleteId);
        setConfirmDeleteId(null);
    };

    const toggleArchived = async () => {
        if (showArchived) { setShowArchived(false); return; }
        setLoadingArchived(true);
        try {
            const data = await serviceService.getArchivedServices();
            setArchivedServices(data);
        } catch { setArchivedServices([]); }
        setLoadingArchived(false);
        setShowArchived(true);
    };

    const handleRestore = async (publicId: string) => {
        try {
            await serviceService.restoreService(publicId);
            setArchivedServices(prev => prev.filter(s => s.publicId !== publicId));
            setRemovedIds(prev => { const n = new Set(prev); n.delete(publicId); return n; });
            queryClient.invalidateQueries({ queryKey: ['my-services'] });
            addToast?.('Ogłoszenie przywrócone!', 'success');
        } catch {
            addToast?.('Błąd przywracania ogłoszenia', 'error');
        }
    };

    const visibleServices = myServices.filter(s => !removedIds.has(s.publicId ?? ''));

    return (
        <div className="space-y-6 md:space-y-8 text-left font-sans pb-10 w-full">

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-1">Twój Cennik</h3>
                    <p className="text-gray-500 font-medium text-sm">
                        Zarządzaj ofertą widoczną dla klientów.
                        {visibleServices.length > 0 && (
                            <span className="ml-2 text-indigo-500 font-bold">{visibleServices.length} {visibleServices.length === 1 ? 'usługa' : visibleServices.length < 5 ? 'usługi' : 'usług'}</span>
                        )}
                    </p>
                </div>
                <button onClick={onAddService} className="group relative overflow-hidden px-6 py-3 bg-[#6366F1] text-white rounded-2xl text-[13px] font-bold transition-all hover:bg-[#4F46E5] active:scale-95 shadow-xl shadow-indigo-100 flex items-center justify-center shrink-0 min-w-[160px] isolate">
                    <div className="flex items-center gap-2 relative z-20 pointer-events-none">
                        <Plus size={16} strokeWidth={3} />
                        <span>Nowa usługa</span>
                    </div>
                    <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 w-full">
                {visibleServices.length === 0 ? (
                    <div onClick={onAddService} className="w-full min-h-[180px] border-2 border-dashed border-gray-100 rounded-[2rem] flex items-center justify-center gap-8 bg-gradient-to-br from-gray-50/50 to-white cursor-pointer group hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 transition-all duration-300">
                        <div className="relative">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
                                <Zap className="text-gray-300 group-hover:text-indigo-500 transition-colors" size={28} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform duration-300">
                                <Plus size={14} strokeWidth={3} />
                            </div>
                        </div>
                        <div className="text-left">
                            <h5 className="text-[15px] font-bold text-gray-800 uppercase tracking-tight">Dodaj pierwszą usługę</h5>
                            <p className="text-xs text-gray-400 mt-0.5">Klienci czekają na Twoją ofertę.</p>
                        </div>
                    </div>
                ) : (
                    visibleServices.map(service => (
                        <ServiceCard
                            key={service.publicId}
                            service={service}
                            onEdit={() => onEditService(service)}
                            onDelete={() => setConfirmDeleteId(service.publicId ?? '')}
                            onNavigate={async () => { if (Capacitor.isNativePlatform()) { sessionStorage.setItem('nav_scroll_/dashboard', String(window.scrollY)); await NativeNav.push().catch(() => {}); } router.push(`/service/${createServiceUrl(service.title, service.publicId ?? '')}`); }}
                        />
                    ))
                )}
            </div>

            <div className="pt-8 border-t border-gray-100">
                <button onClick={toggleArchived} className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">
                    {showArchived ? <ChevronUp size={14} /> : <MoreHorizontal size={14} />}
                    {showArchived ? 'Ukryj zarchiwizowane' : 'Pokaż zarchiwizowane'}
                </button>
                {showArchived && (
                    <div className="mt-4 space-y-3">
                        {loadingArchived && [0, 1, 2].map(i => (
                            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex gap-3 items-center w-full animate-pulse">
                                <div className="w-12 h-12 bg-gray-100 rounded-xl shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3.5 bg-gray-100 rounded-lg w-2/3" />
                                    <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
                                </div>
                                <div className="w-20 h-8 bg-gray-100 rounded-xl shrink-0" />
                            </div>
                        ))}
                        {!loadingArchived && archivedServices.length === 0 && (
                            <p className="text-sm text-gray-400 text-center py-4">Brak zarchiwizowanych ogłoszeń.</p>
                        )}
                        {archivedServices.map(s => (
                            <ArchivedCard key={s.publicId} service={s} onRestore={() => handleRestore(s.publicId)} />
                        ))}
                    </div>
                )}
            </div>

            <AnimatePresence>
                {confirmDeleteId !== null && confirmDeleteId !== undefined && (
                    <ConfirmDeleteModal onConfirm={handleConfirmDelete} onCancel={() => setConfirmDeleteId(null)} />
                )}
            </AnimatePresence>
        </div>
    );
};
