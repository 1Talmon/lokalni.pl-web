'use client';
import { Ban, Loader2 } from 'lucide-react';
import { SheetModal } from './SheetModal';
import { MODAL_BTN_DANGER, MODAL_BTN_SECONDARY } from './modalBase';

interface BlockUserModalProps {
    isOpen: boolean;
    userName: string;
    isLoading?: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

/** Potwierdzenie blokady użytkownika — rodzina „arkusze” (SheetModal). */
export const BlockUserModal = ({ isOpen, userName, isLoading = false, onClose, onConfirm }: BlockUserModalProps) => (
    <SheetModal
        isOpen={isOpen}
        onClose={onClose}
        title="Zablokuj użytkownika"
        icon={Ban}
        tone="rose"
        footer={({ close }) => (
            <>
                <button type="button" onClick={close} className={MODAL_BTN_SECONDARY}>Anuluj</button>
                <button type="button" onClick={onConfirm} disabled={isLoading} className={MODAL_BTN_DANGER}>
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Zablokuj'}
                </button>
            </>
        )}
    >
        <p className="text-sm text-gray-600 mb-3">
            Blokujesz użytkownika: <span className="font-bold text-gray-900">{userName}</span>
        </p>
        <ul className="text-sm text-gray-600 leading-relaxed space-y-1.5 list-disc pl-5">
            <li>Nie będziecie mogli do siebie pisać ani wysyłać próśb o rezerwację.</li>
            <li>Rozmowa zniknie z Twojej listy czatów.</li>
            <li>Ta osoba nie dostanie powiadomienia o blokadzie.</li>
        </ul>
        <p className="text-xs text-gray-400 mt-4">
            Możesz to cofnąć w Ustawieniach → Zablokowani użytkownicy.
        </p>
    </SheetModal>
);
