'use client';
import { Trash2 } from 'lucide-react';
import { SheetModal } from './SheetModal';
import { MODAL_BTN_DANGER, MODAL_BTN_SECONDARY } from './modalBase';

interface DeleteReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const DeleteReviewModal = ({ isOpen, onClose, onConfirm }: DeleteReviewModalProps) => (
    <SheetModal
        isOpen={isOpen}
        onClose={onClose}
        title="Usuń opinię"
        icon={Trash2}
        tone="rose"
        footer={({ close }) => (
            <>
                <button type="button" onClick={close} className={MODAL_BTN_SECONDARY}>Anuluj</button>
                <button type="button" onClick={onConfirm} className={MODAL_BTN_DANGER}>Usuń</button>
            </>
        )}
    >
        <p className="text-sm text-gray-600 leading-relaxed">
            Czy na pewno chcesz usunąć swoją opinię? Tej operacji nie można cofnąć.
        </p>
    </SheetModal>
);
