'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Plus, Loader2, FileText, Trash2, Clock, X, ImagePlus, Pencil, AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { CertificatePreviewModal } from '../../../../components/modals/CertificatePreviewModal';
import { apiClient } from '../../../../services/apiClient';
import { useBottomSheet } from '../../../../hooks/useBottomSheet';
import { BottomSheetHandle } from '../../../../components/ui/BottomSheetHandle';
import { lockScroll, unlockScroll } from '../../../../utils/scrollLock';
import { SettingsRow } from './SettingsRow';
import { settingsActionClass } from './settingsStyles';

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

// Must match addCertificateSchema / ALLOWED_DOCUMENT_MIME in Lokalni API.
const NAME_MAX = 200;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const errorMessage = (err: unknown, fallback: string) =>
    err instanceof Error && err.message ? err.message : fallback;

/** Sheet on mobile, centered modal on desktop — same shell as DgSetupSheet / BlockUserModal. */
const SheetShell = ({ icon, iconClass, title, onClose, children }: {
    icon: React.ReactNode;
    iconClass: string;
    title: string;
    onClose: () => void;
    children: (close: () => void) => React.ReactNode;
}) => {
    const { sheetDragProps, startDrag, backdropOpacity, triggerClose, handleClose } = useBottomSheet(onClose, true);

    useEffect(() => {
        const alreadyLocked = document.documentElement.classList.contains('scroll-locked');
        if (!alreadyLocked) lockScroll();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { e.stopPropagation(); triggerClose(); }
        };
        window.addEventListener('keydown', onKey, true);
        return () => {
            if (!alreadyLocked) unlockScroll();
            window.removeEventListener('keydown', onKey, true);
        };
    }, [triggerClose]);

    return createPortal(
        <div className="fixed inset-0 z-[300]">
            <motion.div
                style={{ opacity: backdropOpacity }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
                onTouchMove={e => e.stopPropagation()}
            />
            <div className="absolute inset-0 flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
                <motion.div
                    {...sheetDragProps}
                    onClick={e => e.stopPropagation()}
                    onTouchMove={e => e.stopPropagation()}
                    className="pointer-events-auto w-full sm:max-w-md bg-white rounded-t-[2rem] sm:rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl text-left"
                >
                    <div className="sm:hidden">
                        <BottomSheetHandle onPointerDown={startDrag} />
                    </div>
                    <div
                        className="px-6 sm:px-8 py-4 sm:py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50 shrink-0 sm:cursor-default cursor-grab active:cursor-grabbing"
                        style={{ touchAction: 'none' }}
                        onPointerDown={startDrag}
                    >
                        <h3 className="font-bold text-lg sm:text-xl text-gray-900 flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${iconClass}`}>{icon}</div>
                            {title}
                        </h3>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    {children(handleClose)}
                </motion.div>
            </div>
        </div>,
        document.body
    );
};

const FOOTER_STYLE: React.CSSProperties = {
    paddingBottom: 'calc(var(--native-cta-h, var(--bottom-nav-total-h, env(safe-area-inset-bottom))) + 32px)',
};
const CANCEL_BTN = 'flex-1 py-4 px-4 rounded-2xl font-black text-gray-500 hover:bg-gray-100 transition-colors uppercase tracking-widest text-xs';
const PRIMARY_BTN = 'flex-1 py-4 px-4 rounded-2xl font-black text-white bg-[#6366F1] hover:bg-[#4F46E5] transition-all shadow-lg shadow-indigo-100 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2';

// ── Add / edit sheet ────────────────────────────────────────────────────────
interface CertificateFormSheetProps {
    /** Present = edit mode (name only — API does not allow swapping the file). */
    cert?: CertEntry;
    onSubmit: (data: { name: string; fileType: 'image' | 'pdf' | null; url: string | null }) => Promise<void>;
    onClose: () => void;
}

const CertificateFormSheet = ({ cert, onSubmit, onClose }: CertificateFormSheetProps) => {
    const isEdit = !!cert;
    const [name, setName] = useState(cert?.name ?? '');
    const [fileUrl, setFileUrl] = useState<string | null>(null);
    const [fileType, setFileType] = useState<'image' | 'pdf' | null>(null);
    const [fileName, setFileName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const trimmed = name.trim();
    const unchanged = isEdit && trimmed === cert.name;
    const canSubmit = !!trimmed && !unchanged && !isUploading && !isSaving;

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setError(null);

        if (!ALLOWED_MIME.includes(file.type)) {
            setError('Dozwolone formaty: JPG, PNG, WebP lub PDF.');
            return;
        }
        if (file.size > MAX_FILE_BYTES) {
            setError('Plik przekracza 10 MB.');
            return;
        }

        setIsUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await apiClient.postFormData('/upload/document', fd);
            const json = await res.json().catch(() => ({})) as { url?: string; error?: string; message?: string };
            if (!res.ok || !json.url) throw new Error(json.error ?? json.message ?? 'Nie udało się przesłać pliku.');
            setFileUrl(json.url);
            setFileType(file.type === 'application/pdf' ? 'pdf' : 'image');
            setFileName(file.name);
        } catch (err: unknown) {
            setError(errorMessage(err, 'Nie udało się przesłać pliku.'));
        } finally {
            setIsUploading(false);
        }
    };

    const clearFile = () => { setFileUrl(null); setFileType(null); setFileName(''); setError(null); };

    return (
        <SheetShell
            icon={isEdit ? <Pencil size={18} /> : <Award size={18} />}
            iconClass="bg-indigo-50 text-indigo-600"
            title={isEdit ? 'Edytuj certyfikat' : 'Nowy certyfikat'}
            onClose={onClose}
        >
            {close => {
                const submit = async (e: React.FormEvent) => {
                    e.preventDefault();
                    if (!canSubmit) return;
                    setIsSaving(true);
                    setError(null);
                    try {
                        await onSubmit({ name: trimmed, fileType, url: fileUrl });
                        close();
                    } catch (err: unknown) {
                        setError(errorMessage(err, 'Nie udało się zapisać. Spróbuj ponownie.'));
                        setIsSaving(false);
                    }
                };

                return (
                    <form onSubmit={submit} className="flex flex-col">
                        <div className="px-6 sm:px-8 py-6 space-y-5">
                            <div>
                                <div className="flex items-baseline justify-between mb-1.5">
                                    <label htmlFor="cert-name" className="block text-xs font-bold text-gray-500">Nazwa uprawnienia lub szkolenia</label>
                                    {name.length > NAME_MAX - 40 && (
                                        <span className="text-[11px] font-bold text-gray-400 tabular-nums">{name.length}/{NAME_MAX}</span>
                                    )}
                                </div>
                                <input
                                    id="cert-name"
                                    type="text"
                                    value={name}
                                    maxLength={NAME_MAX}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="np. Uprawnienia SEP E do 1 kV"
                                    lang="pl"
                                    autoCapitalize="sentences"
                                    enterKeyHint="done"
                                    className="w-full bg-gray-50 rounded-xl p-4 text-sm border-none outline-none transition-all ring-inset font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-100"
                                />
                                {isEdit && cert.status === 'verified' && !unchanged && trimmed && (
                                    <p className="text-xs text-amber-600 mt-1.5">Po zmianie nazwy certyfikat wróci do weryfikacji.</p>
                                )}
                            </div>

                            {!isEdit && (
                                <div>
                                    <p className="block text-xs font-bold text-gray-500 mb-1.5">
                                        Skan lub zdjęcie <span className="font-medium text-gray-400">(opcjonalnie)</span>
                                    </p>
                                    {fileUrl ? (
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                            {fileType === 'image'
                                                ? <img src={fileUrl} className="w-12 h-12 rounded-lg object-cover shrink-0" alt="" />
                                                : <div className="w-12 h-12 rounded-lg bg-rose-50 flex items-center justify-center shrink-0"><FileText size={20} className="text-rose-400" /></div>
                                            }
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-gray-800 truncate">{fileName}</p>
                                                <p className="text-[11px] text-gray-400">{fileType === 'pdf' ? 'Dokument PDF' : 'Zdjęcie'}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={clearFile}
                                                aria-label="Usuń plik"
                                                className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors shrink-0"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="w-full h-28 border-2 border-dashed border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 rounded-xl flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:text-indigo-500 transition-all disabled:hover:border-gray-200 disabled:hover:bg-transparent"
                                        >
                                            {isUploading ? <Loader2 size={22} className="animate-spin" /> : <ImagePlus size={22} />}
                                            <span className="text-xs font-bold">{isUploading ? 'Przesyłanie…' : 'Dodaj zdjęcie lub PDF'}</span>
                                            {!isUploading && <span className="text-[11px] text-gray-300">JPG, PNG, WebP, PDF · max 10 MB</span>}
                                        </button>
                                    )}
                                    <input ref={fileInputRef} type="file" hidden accept={ALLOWED_MIME.join(',')} onChange={handleFile} />
                                    <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                                        Dokument pomaga nam zweryfikować certyfikat. Na profilu pojawi się dopiero po weryfikacji.
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-start gap-2 p-3 bg-rose-50 rounded-xl text-rose-600">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <p className="text-xs font-semibold">{error}</p>
                                </div>
                            )}
                        </div>

                        <div className="px-6 sm:px-8 pt-3 border-t border-gray-50 flex gap-3 shrink-0 bg-white" style={FOOTER_STYLE}>
                            <button type="button" onClick={close} className={CANCEL_BTN}>Anuluj</button>
                            <button type="submit" disabled={!canSubmit} className={PRIMARY_BTN}>
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : isEdit ? 'Zapisz' : 'Dodaj'}
                            </button>
                        </div>
                    </form>
                );
            }}
        </SheetShell>
    );
};

// ── Delete confirmation ─────────────────────────────────────────────────────
const DeleteCertificateSheet = ({ cert, onConfirm, onClose }: {
    cert: CertEntry;
    onConfirm: () => Promise<void>;
    onClose: () => void;
}) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return (
        <SheetShell icon={<Trash2 size={18} />} iconClass="bg-rose-50 text-rose-500" title="Usuń certyfikat" onClose={onClose}>
            {close => (
                <>
                    <div className="px-6 sm:px-8 py-6">
                        <p className="text-sm text-gray-600">
                            Usuwasz: <span className="font-bold text-gray-900 break-words">{cert.name}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-3">
                            {cert.status === 'verified'
                                ? 'Certyfikat zniknie z Twojego profilu publicznego. Tej operacji nie można cofnąć.'
                                : 'Tej operacji nie można cofnąć.'}
                        </p>
                        {error && (
                            <div className="flex items-start gap-2 p-3 mt-4 bg-rose-50 rounded-xl text-rose-600">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <p className="text-xs font-semibold">{error}</p>
                            </div>
                        )}
                    </div>
                    <div className="px-6 sm:px-8 pt-3 border-t border-gray-50 flex gap-3 shrink-0 bg-white" style={FOOTER_STYLE}>
                        <button type="button" onClick={close} className={CANCEL_BTN}>Anuluj</button>
                        <button
                            type="button"
                            disabled={isDeleting}
                            onClick={async () => {
                                setIsDeleting(true);
                                setError(null);
                                try { await onConfirm(); close(); }
                                catch (err: unknown) { setError(errorMessage(err, 'Nie udało się usunąć. Spróbuj ponownie.')); setIsDeleting(false); }
                            }}
                            className="flex-1 py-4 px-4 rounded-2xl font-black text-white bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-100 uppercase tracking-widest text-xs active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Usuń'}
                        </button>
                    </div>
                </>
            )}
        </SheetShell>
    );
};

// ── Main component ──────────────────────────────────────────────────────────
export const CertificateSection = ({
    initialCerts = [],
    onAdd,
    onUpdateName,
    onDelete,
    isLoading = false,
}: CertificateSectionProps) => {
    const [certificates, setCertificates] = useState<CertEntry[]>(initialCerts);
    useEffect(() => { setCertificates(initialCerts); }, [initialCerts]);

    const [isAdding, setIsAdding] = useState(false);
    const [editingCert, setEditingCert] = useState<CertEntry | null>(null);
    const [deletingCert, setDeletingCert] = useState<CertEntry | null>(null);
    const [previewCert, setPreviewCert] = useState<CertEntry | null>(null);

    // Errors are rethrown so the sheet stays open and shows them inline.
    const handleAdd = async (data: Omit<CertEntry, 'id' | 'status'>) => {
        if (!onAdd) throw new Error('Nie można teraz dodać certyfikatu.');
        const saved = await onAdd(data);
        setCertificates(prev => [saved, ...prev]);
    };

    const handleRename = async (cert: CertEntry, name: string) => {
        if (onUpdateName) await onUpdateName(cert.id, name);
        // API resets verification on rename — mirror it until the refetch lands.
        setCertificates(prev => prev.map(c => c.id === cert.id ? { ...c, name, status: c.name === name ? c.status : 'pending' } : c));
    };

    const handleDelete = async (cert: CertEntry) => {
        if (onDelete) await onDelete(cert.id);
        setCertificates(prev => prev.filter(c => c.id !== cert.id));
    };

    const openCert = (cert: CertEntry) => {
        if (cert.url) setPreviewCert({ ...cert, type: cert.fileType ?? undefined });
        else setEditingCert(cert);
    };

    const hasPending = certificates.some(c => c.status === 'pending');
    const showSkeleton = isLoading && certificates.length === 0;

    return (
        <div className="pt-2">
            <div className="mb-6">
                <SettingsRow
                    icon={Award}
                    title="Certyfikaty i kompetencje"
                    description="Lista Twoich uprawnień i ukończonych szkoleń."
                    action={
                        <button type="button" onClick={() => setIsAdding(true)} className={settingsActionClass()}>
                            <Plus size={14} strokeWidth={3} /> Dodaj
                        </button>
                    }
                />
            </div>

            {showSkeleton ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {[0, 1].map(i => (
                        <div key={i} className="min-h-[76px] flex items-center gap-4 px-5 py-4 rounded-[1.5rem] border border-gray-100">
                            <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 w-2/3 bg-gray-100 rounded animate-pulse" />
                                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : certificates.length === 0 ? (
                <button
                    type="button"
                    onClick={() => setIsAdding(true)}
                    className="w-full min-h-[180px] border-2 border-dashed border-gray-100 rounded-[2rem] flex items-center justify-center gap-8 px-6 bg-gradient-to-br from-gray-50/50 to-white group hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 transition-colors duration-300"
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
                </button>
            ) : (
                <>
                    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-3 ${certificates.length > 4 ? 'max-h-[420px] overflow-y-auto pr-2 custom-scrollbar' : ''}`}>
                        <AnimatePresence initial={false}>
                            {certificates.map(cert => (
                                <motion.div
                                    key={cert.id}
                                    layout
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2, ease: 'easeOut' }}
                                    className={`min-h-[76px] flex items-center gap-1 pl-4 pr-2 py-3 rounded-[1.5rem] border transition-all duration-300 ${cert.status === 'verified' ? 'bg-white border-indigo-100 shadow-lg shadow-indigo-50/50' : 'bg-gray-50/50 border-gray-100 hover:border-gray-200'}`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => openCert(cert)}
                                        className="flex items-center gap-4 flex-1 min-w-0 text-left rounded-xl"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-white overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                                            {cert.url
                                                ? cert.fileType === 'image'
                                                    ? <img src={cert.url} alt="" className="w-full h-full object-cover" />
                                                    : <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-500"><FileText size={18} /></div>
                                                : <div className="w-full h-full flex items-center justify-center bg-indigo-50"><Award size={18} className="text-indigo-300" /></div>
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-bold text-gray-700 line-clamp-2 break-words leading-snug">{cert.name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className={`w-1.5 h-1.5 rounded-full ${cert.status === 'verified' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${cert.status === 'verified' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {cert.status === 'verified' ? 'Zweryfikowany' : 'W weryfikacji'}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                    <div className="flex items-center shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setEditingCert(cert)}
                                            aria-label="Edytuj nazwę"
                                            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                        >
                                            <Pencil size={16} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeletingCert(cert)}
                                            aria-label="Usuń certyfikat"
                                            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                    {hasPending && (
                        <p className="flex items-start gap-1.5 text-[11px] text-gray-400 mt-3 px-1 leading-relaxed">
                            <Clock size={12} className="shrink-0 mt-0.5" />
                            Certyfikaty w weryfikacji widzisz tylko Ty — na profilu publicznym pojawią się po zatwierdzeniu.
                        </p>
                    )}
                </>
            )}

            {isAdding && (
                <CertificateFormSheet onSubmit={handleAdd} onClose={() => setIsAdding(false)} />
            )}
            {editingCert && (
                <CertificateFormSheet
                    cert={editingCert}
                    onSubmit={({ name }) => handleRename(editingCert, name)}
                    onClose={() => setEditingCert(null)}
                />
            )}
            {deletingCert && (
                <DeleteCertificateSheet
                    cert={deletingCert}
                    onConfirm={() => handleDelete(deletingCert)}
                    onClose={() => setDeletingCert(null)}
                />
            )}

            <CertificatePreviewModal cert={previewCert} onClose={() => setPreviewCert(null)} />
        </div>
    );
};
