'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Plus, Loader2, ShieldCheck, FileText, Trash2, Maximize2, Clock, Check, X, ArrowRight, ArrowLeft, ImagePlus, Pencil } from 'lucide-react';
import { createPortal } from 'react-dom';
import { CertificatePreviewModal } from '../../../../components/modals/CertificatePreviewModal';
import { apiClient } from '../../../../services/apiClient';

export interface CertEntry {
    id: string;
    name: string;
    type?: string;
    fileType: 'image' | 'pdf' | null;
    status: 'verified' | 'pending';
    url: string | null;
}

interface CertificateSectionProps {
    initialCerts?: CertEntry[];
    onAdd?: (entry: Omit<CertEntry, 'id' | 'status'>) => Promise<CertEntry>;
    onUpdateName?: (id: string, name: string) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
    isLoading?: boolean;
}

// ── Modal dodawania certyfikatu ─────────────────────────────────────────────
interface AddCertificateModalProps {
    onSave: (entry: Omit<CertEntry, 'id' | 'status'>) => Promise<void>;
    onClose: () => void;
}

const AddCertificateModal = ({ onSave, onClose }: AddCertificateModalProps) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [direction, setDirection] = useState<1 | -1>(1);
    const [draftName, setDraftName] = useState('');
    const [draftUrl, setDraftUrl] = useState<string | null>(null);
    const [draftFileType, setDraftFileType] = useState<'image' | 'pdf' | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const goStep = (s: 1 | 2) => { setDirection(s > step ? 1 : -1); setStep(s); };

    useEffect(() => {
        const fn = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { if (step === 2) goStep(1); else onClose(); }
        };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, onClose]);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        setUploadError(null);

        if (file.type === 'image/heic' || file.type === 'image/heif') {
            setUploadError('Format HEIC nie jest obsługiwany. Wyślij plik jako JPG lub PNG.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('Plik przekracza 10 MB.');
            return;
        }

        setIsUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await apiClient.postFormData('/upload/document', fd);
            const json = await res.json() as { url?: string; error?: string };
            if (!res.ok || !json.url) throw new Error(json.error ?? 'Błąd przesyłania pliku.');
            setDraftUrl(json.url);
            setDraftFileType(file.type.includes('pdf') ? 'pdf' : 'image');
        } catch (err: unknown) {
            setUploadError(err instanceof Error ? err.message : 'Błąd przesyłania pliku.');
        } finally {
            setIsUploading(false);
        }
    };

    const save = async () => {
        if (!draftName.trim()) return;
        setIsSaving(true);
        try { await onSave({ name: draftName.trim(), fileType: draftFileType, url: draftUrl }); }
        catch { /* TODO: toast */ }
        setIsSaving(false);
        onClose();
    };

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 sm:p-6"
        >
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3">
                    <AnimatePresence mode="wait" initial={false}>
                        {step === 1 ? (
                            <motion.p
                                key="title-1"
                                initial={{ opacity: 0, x: direction * -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction * 12 }}
                                transition={{ duration: 0.16 }}
                                className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400"
                            >
                                Nowy certyfikat
                            </motion.p>
                        ) : (
                            <motion.button
                                key="title-2"
                                initial={{ opacity: 0, x: direction * -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction * 12 }}
                                transition={{ duration: 0.16 }}
                                onClick={() => goStep(1)}
                                className="flex items-center gap-1.5 min-w-0 group"
                            >
                                <ArrowLeft size={13} className="text-gray-400 group-hover:text-indigo-500 shrink-0 transition-colors" />
                                <span className="text-[13px] font-bold text-gray-700 truncate group-hover:text-indigo-600 transition-colors">{draftName}</span>
                            </motion.button>
                        )}
                    </AnimatePresence>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-all active:scale-90 shrink-0"
                    >
                        <X size={14} />
                    </button>
                </div>

                <div className="h-px bg-gray-100 mx-6" />

                {/* Body */}
                <div className="px-6 py-5 overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                        {step === 1 && (
                            <motion.div
                                key="body-1"
                                initial={{ opacity: 0, x: direction * 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction * -20 }}
                                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                                className="space-y-3"
                            >
                                <div>
                                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.12em] block mb-2">
                                        Nazwa certyfikatu
                                    </label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={draftName}
                                        onChange={e => setDraftName(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && draftName.trim()) goStep(2); }}
                                        placeholder="np. Uprawnienia SEP E do 1kV"
                                        lang="pl"
                                        autoCorrect="on"
                                        autoCapitalize="sentences"
                                        className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-400 focus:bg-white rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300 outline-none transition-all"
                                    />
                                </div>
                                <button
                                    onClick={() => goStep(2)}
                                    disabled={!draftName.trim()}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#6366F1] disabled:opacity-40 text-white rounded-2xl text-[13px] font-bold hover:bg-[#4F46E5] active:scale-95 transition-all"
                                >
                                    Dalej <ArrowRight size={14} />
                                </button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="body-2"
                                initial={{ opacity: 0, x: direction * 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction * -20 }}
                                transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                                className="space-y-3"
                            >
                                {draftUrl ? (
                                    <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                                        {draftFileType === 'image'
                                            ? <img src={draftUrl} className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0" alt="" />
                                            : <div className="w-14 h-14 rounded-xl bg-rose-50 flex items-center justify-center shrink-0"><FileText size={22} className="text-rose-400" /></div>
                                        }
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-gray-800">{draftFileType === 'pdf' ? 'Dokument PDF' : 'Zdjęcie'}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Gotowe do zapisania</p>
                                        </div>
                                        <button
                                            onClick={() => { setDraftUrl(null); setDraftFileType(null); setUploadError(null); }}
                                            className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors shrink-0"
                                        >
                                            <X size={15} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="w-full h-32 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-indigo-500 transition-all"
                                        >
                                            {isUploading
                                                ? <Loader2 size={24} className="animate-spin" />
                                                : <ImagePlus size={24} />
                                            }
                                            <span className="text-[12px] font-bold">
                                                {isUploading ? 'Wgrywanie...' : 'Dodaj zdjęcie lub PDF'}
                                            </span>
                                            {!isUploading && <span className="text-[10px] text-gray-300">opcjonalne · max 10 MB</span>}
                                        </button>
                                        {uploadError && (
                                            <p className="text-[11px] text-rose-500 font-[600] text-center -mt-1">{uploadError}</p>
                                        )}
                                    </>
                                )}
                                <button
                                    onClick={save}
                                    disabled={isSaving}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#6366F1] disabled:opacity-60 text-white rounded-2xl text-[13px] font-bold hover:bg-[#4F46E5] active:scale-95 transition-all"
                                >
                                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                                    Zapisz
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <input ref={fileInputRef} type="file" hidden accept="image/*,.pdf" onChange={handleFile} />
            </motion.div>
        </motion.div>,
        document.body
    );
};

// ── Modal edycji nazwy ──────────────────────────────────────────────────────
const EditNameModal = ({ cert, onSave, onClose }: { cert: CertEntry; onSave: (name: string) => void; onClose: () => void }) => {
    const [value, setValue] = useState(cert.name);

    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', fn);
        return () => document.removeEventListener('keydown', fn);
    }, [onClose]);

    return createPortal(
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-[300] bg-black/30 backdrop-blur-sm flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Edytuj nazwę</p>
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-all active:scale-90">
                            <X size={14} />
                        </button>
                    </div>
                    <input
                        autoFocus
                        type="text"
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && value.trim()) { onSave(value.trim()); onClose(); } }}
                        placeholder="np. Uprawnienia SEP E do 1kV"
                        className="w-full bg-gray-50 border border-gray-200 focus:border-indigo-400 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-300 outline-none transition-colors"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => { if (value.trim()) { onSave(value.trim()); onClose(); } }}
                            disabled={!value.trim()}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#6366F1] disabled:opacity-40 text-white rounded-xl text-[13px] font-bold hover:bg-[#4F46E5] active:scale-95 transition-all"
                        >
                            <Check size={14} /> Zapisz
                        </button>
                        <button onClick={onClose} className="px-4 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-[13px] font-bold hover:bg-gray-200 active:scale-95 transition-all">
                            Anuluj
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

// ── Główny komponent ────────────────────────────────────────────────────────
export const CertificateSection = ({
    initialCerts = [],
    onAdd,
    onUpdateName,
    onDelete,
    isLoading: _isLoading = false,
}: CertificateSectionProps) => {
    const [certificates, setCertificates] = useState<CertEntry[]>(initialCerts);

    useEffect(() => { setCertificates(initialCerts); }, [initialCerts]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCert, setEditingCert] = useState<CertEntry | null>(null);
    const [selectedCert, setSelectedCert] = useState<CertEntry | null>(null);

    const handleAdd = async (payload: Omit<CertEntry, 'id' | 'status'>) => {
        if (onAdd) {
            try { const saved = await onAdd(payload); setCertificates(prev => [saved, ...prev]); }
            catch { /* TODO: toast */ }
        } else {
            setCertificates(prev => [{ id: Math.random().toString(36).substr(2, 9), status: 'pending', ...payload }, ...prev]);
        }
    };

    const saveName = async (id: string, name: string) => {
        if (onUpdateName) { try { await onUpdateName(id, name); } catch { /* TODO: toast */ } }
        setCertificates(prev => prev.map(c => c.id === id ? { ...c, name } : c));
    };

    const removeCert = async (id: string) => {
        if (onDelete) { try { await onDelete(id); } catch { /* TODO: toast */ return; } }
        setCertificates(prev => prev.filter(c => c.id !== id));
    };

    return (
        <div className="pt-2">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                <div>
                    <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"><Award size={18} /></div>
                        Certyfikaty i kompetencje
                    </h4>
                    <p className="text-xs text-gray-400 mt-1 ml-10">Lista Twoich uprawnień i ukończonych szkoleń.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="group relative overflow-hidden px-6 py-3 bg-[#6366F1] text-white rounded-2xl text-[13px] font-bold transition-all hover:bg-[#4F46E5] active:scale-95 shadow-xl shadow-indigo-100"
                >
                    <div className="flex items-center gap-2 relative z-10"><Plus size={16} strokeWidth={3} /><span>Dodaj certyfikat</span></div>
                </button>
            </div>

            {/* Lista / Pusty stan */}
            <div className={`relative ${certificates.length === 0 ? 'min-h-[180px]' : ''}`}>
                <AnimatePresence>
                    {certificates.length === 0 && (
                        <motion.div
                            key="empty-cert"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsModalOpen(true)}
                            className="absolute inset-0 border-2 border-dashed border-gray-100 rounded-[2rem] flex items-center justify-center gap-8 bg-gradient-to-br from-gray-50/50 to-white cursor-pointer group hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 transition-colors duration-300"
                        >
                            <div className="relative">
                                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center group-hover:rotate-6 transition-transform duration-300">
                                    <Award className="text-gray-300 group-hover:text-indigo-500 transition-colors" size={28} />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform duration-300">
                                    <Plus size={14} strokeWidth={3} />
                                </div>
                            </div>
                            <div className="text-left">
                                <h5 className="text-[15px] font-bold text-gray-800">Uwiarygodnij swój profil</h5>
                                <p className="text-xs text-gray-400 mt-0.5">Dodaj certyfikaty, aby przyciągnąć więcej klientów.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence initial={false}>
                    {certificates.length > 0 && (
                        <motion.div
                            key="cert-list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-3 ${certificates.length > 4 ? 'max-h-[420px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
                                <AnimatePresence initial={false}>
                                    {certificates.map(cert => (
                                        <motion.div
                                            key={cert.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.2, ease: 'easeOut' }}
                                            className="group relative bg-gray-50/50 border border-gray-100 rounded-[1.8rem] p-3 md:p-4 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all duration-300"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 md:gap-4 flex-1 overflow-hidden cursor-pointer" onClick={() => cert.url && setSelectedCert({ ...cert, type: cert.fileType ?? undefined })}>
                                                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                                                        {cert.url
                                                            ? cert.fileType === 'image'
                                                                ? <img src={cert.url} alt="" className="w-full h-full object-cover" />
                                                                : <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-500"><FileText size={20} /></div>
                                                            : <div className="w-full h-full flex items-center justify-center bg-indigo-50"><Award size={20} className="text-indigo-300" /></div>
                                                        }
                                                    </div>
                                                    <div className="overflow-hidden text-left flex-1 min-w-0">
                                                        <h5 className="text-[13px] md:text-[14px] font-bold text-gray-800 truncate pr-2">{cert.name}</h5>
                                                        <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider mt-0.5 ${cert.status === 'verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                            {cert.status === 'verified' ? <ShieldCheck size={10} /> : <Clock size={10} />}
                                                            {cert.status === 'verified' ? 'Zweryfikowany' : 'Weryfikacja'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <button onClick={() => setEditingCert(cert)} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><Pencil size={15} /></button>
                                                    {cert.url && <button onClick={() => setSelectedCert({ ...cert, type: cert.fileType ?? undefined })} className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"><Maximize2 size={16} /></button>}
                                                    <button onClick={() => removeCert(cert.id)} className="p-2 text-gray-400 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {isModalOpen && (
                    <AddCertificateModal
                        onSave={handleAdd}
                        onClose={() => setIsModalOpen(false)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {editingCert && (
                    <EditNameModal
                        cert={editingCert}
                        onSave={name => saveName(editingCert.id, name)}
                        onClose={() => setEditingCert(null)}
                    />
                )}
            </AnimatePresence>

            <CertificatePreviewModal
                cert={selectedCert}
                onClose={() => setSelectedCert(null)}
                onUpdateName={(id, name) => saveName(id, name)}
            />
        </div>
    );
};
