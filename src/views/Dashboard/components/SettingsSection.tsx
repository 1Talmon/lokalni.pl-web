'use client';
import React, { useState, useEffect } from 'react';
import type { UserProfile, ToastType } from '../../../types';
import { LifeBuoy, FileText, Ban, Trash2, ChevronDown } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PremiumGate } from '../../../components/premium/PremiumGate';
import { apiClient } from '../../../services/apiClient';

// IMPORTY SUB-KOMPONENTÓW Z NOWEGO FOLDERU
import { PasswordSection } from './Settings/PasswordSection';
import { PhoneSection } from './Settings/PhoneSection';
import { SocialSection } from './Settings/SocialSection';
import { CertificateSection, type CertEntry } from './Settings/CertificateSection';
import { BlockedUsersSection } from './Settings/BlockedUsersSection';
import { SettingsRow, SettingsToggle } from './Settings/SettingsRow';
import { settingsActionClass } from './Settings/settingsStyles';
import { BioSection } from './Settings/BioSection';
import { BiometricSection } from './Settings/BiometricSection';
import { TwoFASection } from './Settings/TwoFASection';
import { DgSetupSheet } from './Settings/DgSetupSheet';

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
    const [showDgSetupModal, setShowDgSetupModal] = useState(false);
    const [dgAddressForm, setDgAddressForm] = useState({
        addressStreet: userData?.addressStreet || '',
        addressCity: userData?.addressCity || '',
        addressPostal: userData?.addressPostal || '',
    });

    const queryClient = useQueryClient();

    const dgMutation = useMutation({
        mutationFn: async (payload: Record<string, unknown>) => {
            const res = await apiClient.patch('/users/me', payload);
            if (!res.ok) throw new Error('Błąd zapisu');
            return res.json();
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['my-profile'] });
            void queryClient.invalidateQueries({ queryKey: ['unregistered-activity'] });
            setShowDgSetupModal(false);
        },
    });

    const handleDgToggle = () => {
        if (userData?.unregisteredActivityEnabled === true) {
            dgMutation.mutate({ unregisteredActivityEnabled: false });
        } else {
            setDgAddressForm({
                addressStreet: userData?.addressStreet || '',
                addressCity: userData?.addressCity || '',
                addressPostal: userData?.addressPostal || '',
            });
            setShowDgSetupModal(true);
        }
    };

    const handleDgSetupSave = (data: { addressStreet: string; addressCity: string; addressPostal: string; unregisteredActivityEnabled: true }) => {
        dgMutation.mutate(data as Record<string, unknown>);
    };

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
    // Na liście tylko sprawy w toku — rozwiązane/zamknięte schowane pod „Pokaż zakończone”
    const isTicketDone = (t: TicketItem) => t.status === 'resolved' || t.status === 'closed';
    const openTickets = tickets.filter(t => !isTicketDone(t));
    const doneTickets = tickets.filter(isTicketDone);
    const [showDoneTickets, setShowDoneTickets] = useState(false);
    const visibleTickets = showDoneTickets ? [...openTickets, ...doneTickets] : openTickets;

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
            {/* Nagłówek — ten sam co w Rezerwacjach / Postach */}
            <div>
                <h3 className="text-2xl font-bold text-gray-900 leading-tight mb-1">Ustawienia</h3>
                <p className="text-gray-500 font-medium text-sm">Zarządzaj profilem, bezpieczeństwem i prywatnością.</p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm overflow-visible">

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
                        <SettingsRow
                            icon={LifeBuoy}
                            title="Centrum wsparcia"
                            description="Zgłoś problem, spór lub pytanie do naszego zespołu."
                            action={
                                <button type="button" onClick={onOpenSupport} className={settingsActionClass()}>
                                    Zgłoś
                                </button>
                            }
                        />

                        {tickets.length > 0 && (
                            <div className="mt-5">
                                {openTickets.length > 0 && (
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] mb-3">Otwarte zgłoszenia</p>
                                )}
                                <div className="space-y-1">
                                    {visibleTickets.map((t) => {
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
                                {doneTickets.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setShowDoneTickets(v => !v)}
                                        className="mt-2 flex items-center gap-1 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <ChevronDown size={14} className={`transition-transform ${showDoneTickets ? 'rotate-180' : ''}`} />
                                        {showDoneTickets ? 'Ukryj zakończone' : `Pokaż zakończone (${doneTickets.length})`}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* GRUPA 4b: DZIAŁALNOŚĆ NIEREJESTROWANA */}
                    <div>
                        <SectionHeader title="Działalność nierejestrowana" />
                        <div>
                            <SettingsRow
                                icon={FileText}
                                title="Ewidencja przychodów"
                                description="Śledzenie limitu miesięcznego (75% min. wynagrodzenia) oraz generowanie ewidencji do PIT-36."
                                action={
                                    <SettingsToggle
                                        enabled={userData?.unregisteredActivityEnabled === true}
                                        onToggle={handleDgToggle}
                                        disabled={dgMutation.isPending}
                                        label="Ewidencja przychodów"
                                    />
                                }
                            />
                            {userData?.unregisteredActivityEnabled && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-2xl text-xs text-gray-500 space-y-1">
                                    <p className="font-bold text-gray-700 mb-1">Dane na dokumencie PDF:</p>
                                    <p>{[userData.imie, userData.nazwisko].filter(Boolean).join(' ') || userData.name || '—'}</p>
                                    <p>{[userData.addressStreet, userData.addressPostal, userData.addressCity].filter(Boolean).join(', ') || <span className="text-amber-600">Brak adresu</span>}</p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setDgAddressForm({
                                                addressStreet: userData.addressStreet || '',
                                                addressCity: userData.addressCity || '',
                                                addressPostal: userData.addressPostal || '',
                                            });
                                            setShowDgSetupModal(true);
                                        }}
                                        className="text-[#6366F1] font-bold hover:underline mt-1"
                                    >
                                        Zmień adres
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ZABLOKOWANI UŻYTKOWNICY */}
                    <div>
                        <SectionHeader title="Prywatność" />
                        <SettingsRow icon={Ban} title="Zablokowani użytkownicy" description="Te osoby nie mogą do Ciebie pisać ani wysyłać próśb o rezerwację." />
                        <div className="mt-4">
                            <BlockedUsersSection addToast={addToast} />
                        </div>
                    </div>

                    {/* GRUPA 5: STREFA ZAGROŻENIA */}
                    <div>
                        <SectionHeader title="Strefa Zagrożenia" />
                        <SettingsRow
                            icon={Trash2}
                            tone="danger"
                            title="Usuwanie konta"
                            description="Trwałe usunięcie wszystkich danych profilu."
                            action={
                                <button type="button" onClick={() => setShowDeleteModal(true)} className={settingsActionClass('danger')}>
                                    Usuń konto
                                </button>
                            }
                        />
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

            {mounted && showDgSetupModal && (
                <DgSetupSheet
                    initialData={dgAddressForm}
                    onClose={() => setShowDgSetupModal(false)}
                    onSave={handleDgSetupSave}
                    isSaving={dgMutation.isPending}
                />
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