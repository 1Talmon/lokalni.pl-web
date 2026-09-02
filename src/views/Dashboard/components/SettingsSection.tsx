'use client';
import React, { useState, useEffect } from 'react';
import type { UserProfile, ToastType } from '../../../types';
import { LifeBuoy } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { PremiumGate } from '../../../components/premium/PremiumGate';
import { apiClient } from '../../../services/apiClient';

// IMPORTY SUB-KOMPONENTÓW Z NOWEGO FOLDERU
import { PasswordSection } from './Settings/PasswordSection';
import { PhoneSection } from './Settings/PhoneSection';
import { SocialSection } from './Settings/SocialSection';
import { CertificateSection, type CertEntry } from './Settings/CertificateSection';
import { BioSection } from './Settings/BioSection';
import { BiometricSection } from './Settings/BiometricSection';
import { TwoFASection } from './Settings/TwoFASection';


// IMPORTY MODALI
import { DeleteAccountModal } from '../../../components/modals/DeleteAccountModal';

export const SettingsSection = ({
                                    isChangingPassword, setIsChangingPassword,
                                    passwordData, setPasswordData, handlePasswordChange, isPasswordLoading,
                                    hasPasswordMethod,
                                    currentPhone = "",
                                    onPhoneChange,
                                    onRequestDeletion,
                                    isDeletingAccount,
                                    isPremium = false,
                                    onUpgradeToPremium,
                                    hasBio = true,
                                    hasSocial = true,
                                    hasPhone = true,
                                    userData,
                                    addToast,
                                    certificates = [],
                                    isCertsLoading = false,
                                    onCertAdd,
                                    onCertUpdateName,
                                    onCertDelete,
                                    onOpenSupport,
                                    onOpenTicket,
                                }: {
    isChangingPassword: boolean;
    setIsChangingPassword: (v: boolean) => void;
    passwordData: { oldPassword: string; newPassword: string; confirmPassword: string };
    setPasswordData: (v: { oldPassword: string; newPassword: string; confirmPassword: string }) => void;
    handlePasswordChange: (e: React.FormEvent) => void;
    isPasswordLoading: boolean;
    hasPasswordMethod: boolean;
    currentPhone?: string;
    onPhoneChange?: (phone: string) => Promise<void>;
    onRequestDeletion?: () => void;
    isDeletingAccount?: boolean;
    isPremium?: boolean;
    onUpgradeToPremium?: () => void;
    hasBio?: boolean;
    hasSocial?: boolean;
    hasPhone?: boolean;
    userData?: UserProfile | null;
    addToast?: (msg: string, type?: ToastType) => void;
    certificates?: CertEntry[];
    isCertsLoading?: boolean;
    onCertAdd?: (entry: Omit<import('./Settings/CertificateSection').CertEntry, 'id' | 'status'>) => Promise<import('./Settings/CertificateSection').CertEntry>;
    onCertUpdateName?: (id: string, name: string) => Promise<void>;
    onCertDelete?: (id: string) => Promise<void>;
    onOpenSupport?: () => void;
    onOpenTicket?: (id: string) => void;
}) => {

    const [mounted, setMounted] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    interface TicketItem { id: string; ticket_no: string; subject: string; status: string; created_at: string; }

    const { data: ticketsData } = useQuery<{ items: TicketItem[] }>({
        queryKey: ['support-tickets'],
        queryFn: async () => {
            const res = await apiClient.get('/support/tickets');
            if (!res.ok) throw new Error('Błąd pobierania zgłoszeń');
            return res.json();
        },
        staleTime: 60_000,
    });
    const tickets: TicketItem[] = ticketsData?.items ?? [];

    const SectionHeader = ({ title, dot }: { title: string, dot?: boolean }) => (
        <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2.5 whitespace-nowrap">
                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.15em]">{title}</h5>
                {dot && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full shrink-0">
                        <span className="flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                        </span>
                        <span className="text-[9px] font-black text-amber-600 uppercase tracking-wider">Uzupełnij</span>
                    </span>
                )}
            </div>
            <div className="h-px bg-gray-100 w-full" />
        </div>
    );

    return (
        <div className="space-y-6 text-left">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm overflow-visible">
                <h3 className="text-xl font-bold mb-8 tracking-tight text-gray-900">Ustawienia konta</h3>

                <div className="space-y-12">

                    {/* GRUPA 2: Biografia */}
                    <div>
                        <SectionHeader title="Biografia" dot={!hasBio} />
                        <BioSection
                            currentBio={userData?.bio || ''}
                            onSaved={() => addToast?.('Biografia zapisana', 'success')}
                        />
                    </div>

                    {/* GRUPA 2: KWALIFIKACJE ZAWODOWE — tylko Plus */}
                    <div>
                        <SectionHeader title="Kwalifikacje Zawodowe" />
                        <PremiumGate
                            isPremium={isPremium}
                            onUpgrade={onUpgradeToPremium || (() => {})}
                            mode="overlay"
                            featureName="Certyfikaty"
                        >
                            <CertificateSection
                                initialCerts={certificates ?? []}
                                isLoading={isCertsLoading}
                                onAdd={onCertAdd}
                                onUpdateName={onCertUpdateName}
                                onDelete={onCertDelete}
                            />
                        </PremiumGate>
                    </div>

                    {/* GRUPA 3: WIZERUNEK W SIECI */}
                    <div>
                        <SectionHeader title="Wizerunek w sieci" dot={!hasSocial} />
                        <SocialSection
                            initialLinks={{
                                fb: userData?.facebook || '',
                                ig: userData?.instagram || '',
                                tt: userData?.tiktok || '',
                                web: userData?.website || '',
                            }}
                            addToast={addToast}
                        />
                    </div>

                    {/* GRUPA 1: BEZPIECZEŃSTWO I KONTAKT */}
                    <div>
                        <SectionHeader title="Bezpieczeństwo i Kontakt" dot={!hasPasswordMethod || !hasPhone} />
                        <div className="space-y-10">

                            <PasswordSection
                                isChangingPassword={isChangingPassword}
                                setIsChangingPassword={setIsChangingPassword}
                                passwordData={passwordData}
                                setPasswordData={setPasswordData}
                                handlePasswordChange={handlePasswordChange}
                                isPasswordLoading={isPasswordLoading}
                                hasPasswordMethod={hasPasswordMethod}
                            />

                            <div className="pt-8 border-t border-gray-50 overflow-visible">
                                <PhoneSection
                                    currentPhone={currentPhone}
                                    onPhoneChange={onPhoneChange ?? (async () => {})}
                                />
                            </div>

                            <TwoFASection addToast={addToast} />

                            <BiometricSection />
                        </div>
                    </div>

                    {/* GRUPA 4: POMOC */}
                    <div>
                        <SectionHeader title="Pomoc" />
                        <div className="pt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-gray-900">Centrum wsparcia</h4>
                                <p className="text-xs text-gray-400">Zgłoś problem, spór lub pytanie do naszego teamu.</p>
                            </div>
                            <button
                                type="button"
                                onClick={onOpenSupport}
                                className="w-full md:w-auto flex items-center justify-center gap-2 font-bold text-xs px-6 py-2.5 border border-indigo-100 rounded-xl text-[#6366F1] hover:bg-indigo-50 transition-all text-center"
                            >
                                <LifeBuoy size={15} />
                                Zgłoś problem
                            </button>
                        </div>

                        {tickets.length > 0 && (
                            <div className="mt-5">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] mb-3">Moje zgłoszenia</p>
                                <div className="space-y-1">
                                    {tickets.map((t) => {
                                        const STATUS_DOT: Record<string, string> = {
                                            open:        'bg-indigo-400',
                                            in_progress: 'bg-amber-400',
                                            waiting:     'bg-blue-400',
                                            resolved:    'bg-green-400',
                                            closed:      'bg-gray-300',
                                        };
                                        const STATUS_LABEL: Record<string, string> = {
                                            open:        'Otwarte',
                                            in_progress: 'W toku',
                                            waiting:     'Oczekuje',
                                            resolved:    'Rozwiązane',
                                            closed:      'Zamknięte',
                                        };
                                        const dot = STATUS_DOT[t.status] ?? 'bg-gray-300';
                                        const label = STATUS_LABEL[t.status] ?? t.status;
                                        const date = new Date(t.created_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' });
                                        return (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => onOpenTicket?.(t.id)}
                                                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                                            >
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                                                <span className="flex-1 min-w-0">
                                                    <span className="block text-sm font-bold text-gray-800 truncate">{t.subject}</span>
                                                    <span className="text-[10px] text-gray-400 font-mono">{t.ticket_no}</span>
                                                </span>
                                                <span className="text-[10px] text-gray-400 shrink-0">{date}</span>
                                                <span className={`text-[10px] font-bold shrink-0 ${
                                                    t.status === 'open' ? 'text-indigo-500' :
                                                    t.status === 'in_progress' ? 'text-amber-500' :
                                                    t.status === 'waiting' ? 'text-blue-500' :
                                                    t.status === 'resolved' ? 'text-green-500' :
                                                    'text-gray-400'
                                                }`}>{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* GRUPA 5: STREFA ZAGROŻENIA */}
                    <div>
                        <SectionHeader title="Strefa Zagrożenia" />
                        <div className="pt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div>
                                <h4 className="font-bold text-gray-900">Usuwanie konta</h4>
                                <p className="text-xs text-gray-400">Trwałe usunięcie wszystkich danych profilu.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(true)}
                                className="w-full md:w-auto text-rose-500 font-bold text-xs px-6 py-2.5 border border-rose-100 rounded-xl hover:bg-rose-50 transition-all text-center"
                            >
                                Usuń konto
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* MODALE */}
            {mounted && (
                <>
                    <DeleteAccountModal
                        isOpen={showDeleteModal}
                        onClose={() => setShowDeleteModal(false)}
                        onConfirm={async () => {
                            if(onRequestDeletion) await onRequestDeletion();
                            setShowDeleteModal(false);
                        }}
                        isDeleting={isDeletingAccount ?? false}
                    />
                </>
            )}

            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </div>
    );
};