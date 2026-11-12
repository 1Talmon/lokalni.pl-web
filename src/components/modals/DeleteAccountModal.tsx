'use client';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { SheetModal } from './SheetModal';
import { MODAL_BTN_DANGER, MODAL_BTN_SECONDARY } from './modalBase';

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void> | void;
    isDeleting: boolean;
}

export const DeleteAccountModal = ({ isOpen, onClose, onConfirm, isDeleting }: DeleteAccountModalProps) => (
    <SheetModal
        isOpen={isOpen}
        onClose={onClose}
        title="Czy na pewno?"
        icon={AlertTriangle}
        tone="rose"
        dismissible={!isDeleting}
        footer={({ close }) => (
            <>
                <button type="button" onClick={close} disabled={isDeleting} className={MODAL_BTN_SECONDARY}>Anuluj</button>
                <button type="button" onClick={onConfirm} disabled={isDeleting} className={MODAL_BTN_DANGER}>
                    {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Potwierdzam usunięcie'}
                </button>
            </>
        )}
    >
        <p className="text-sm text-gray-600 leading-relaxed">
            Ta operacja jest nieodwracalna. Wszystkie Twoje dane, usługi oraz historia zostaną trwale usunięte z naszego systemu.
        </p>
    </SheetModal>
);
