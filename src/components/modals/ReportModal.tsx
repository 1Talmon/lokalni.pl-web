'use client';
import { AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SheetModal } from './SheetModal';
import { MODAL_BTN_DANGER, MODAL_BTN_SECONDARY } from './modalBase';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'service' | 'profile' | 'review' | 'message' | null;
    onSubmit: (reason: string) => void;
}

export const ReportModal = ({ isOpen, onClose, type, onSubmit }: ReportModalProps) => {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (isOpen) setReason('');
    }, [isOpen]);

    const getTexts = () => {
        switch (type) {
            case 'profile':
                return {
                    title: 'Zgłoś profil użytkownika',
                    desc: 'Dlaczego chcesz zgłosić ten profil?',
                    options: ['Fałszywe konto', 'Nękanie', 'Nieodpowiednie treści', 'Inne']
                };
            case 'message':
                return {
                    title: 'Zgłoś wiadomość',
                    desc: 'Co jest nie tak z tą wiadomością?',
                    options: ['Nękanie', 'Wulgaryzmy', 'Spam', 'Oszustwo', 'Inne']
                };
            case 'review':
                return {
                    title: 'Zgłoś opinię',
                    desc: 'Co jest nie tak z tą opinią?',
                    options: ['Spam', 'Wulgaryzmy', 'Fałszywa opinia', 'Treści reklamowe', 'Inne']
                };
            default:
                return {
                    title: 'Zgłoś ogłoszenie',
                    desc: 'Dlaczego chcesz zgłosić to ogłoszenie?',
                    options: ['Oszustwo', 'Zła kategoria', 'Nieaktualne', 'Niedozwolone treści', 'Inne']
                };
        }
    };

    const texts = getTexts();

    return (
        <SheetModal
            isOpen={isOpen}
            onClose={onClose}
            title={texts.title}
            icon={AlertTriangle}
            tone="rose"
            footer={({ close }) => (
                <>
                    <button type="button" onClick={close} className={MODAL_BTN_SECONDARY}>Anuluj</button>
                    <button
                        type="button"
                        disabled={!reason}
                        onClick={() => { onSubmit(reason); close(); }}
                        className={MODAL_BTN_DANGER}
                    >
                        Wyślij zgłoszenie
                    </button>
                </>
            )}
        >
            <p className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">
                {texts.desc}
            </p>
            <div className="space-y-2">
                {texts.options.map((option) => (
                    <label
                        key={option}
                        className={`flex items-center gap-3 p-3.5 md:p-4 border rounded-2xl cursor-pointer transition-all ${
                            reason === option
                                ? 'border-[#6366F1] bg-indigo-50/50 shadow-sm'
                                : 'border-gray-100 hover:border-gray-200'
                        }`}
                    >
                        <input
                            type="radio"
                            name="reason"
                            value={option}
                            checked={reason === option}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-4 h-4 text-[#6366F1] border-gray-300 focus:ring-[#6366F1]"
                        />
                        <span className={`text-sm font-bold ${reason === option ? 'text-indigo-600' : 'text-gray-600'}`}>
                            {option}
                        </span>
                    </label>
                ))}
            </div>
        </SheetModal>
    );
};
