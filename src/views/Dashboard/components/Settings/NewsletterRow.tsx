'use client';
import { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { ToastType } from '../../../../types';
import { apiClient } from '../../../../services/apiClient';
import { SettingsRow, SettingsToggle } from './SettingsRow';

/** Newsletter: dobrowolna zgoda marketingowa (art. 6 ust. 1 lit. a RODO, art. 398 PKE) — zapis i wypisanie jednym przełącznikiem. */
export const NewsletterRow = ({ enabled, available, addToast }: { enabled: boolean; available: boolean; addToast?: (msg: string, type?: ToastType) => void }) => {
    const [on, setOn] = useState(enabled);
    const [busy, setBusy] = useState(false);
    const queryClient = useQueryClient();
    useEffect(() => { setOn(enabled); }, [enabled]);

    const toggle = async () => {
        const next = !on;
        setBusy(true);
        try {
            const res = await apiClient.put('/users/me/newsletter', { enabled: next });
            if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.message || 'Nie udało się zapisać zmiany.');
            setOn(next);
            void queryClient.invalidateQueries({ queryKey: ['my-profile'] });
            addToast?.(next ? 'Zapisano na newsletter' : 'Wypisano z newslettera', 'success');
        } catch (e) {
            addToast?.((e as Error).message, 'error');
        } finally {
            setBusy(false);
        }
    };

    return (
        <SettingsRow
            icon={Mail}
            title="Newsletter e-mail"
            description={available
                ? 'Nowości w serwisie, porady i informacje o promocjach MyLokalni. Wypisać się możesz w każdej chwili – tutaj albo linkiem w każdym newsletterze.'
                : 'Newsletter jest dostępny od 16. roku życia.'}
            action={<SettingsToggle enabled={on} onToggle={toggle} disabled={busy || (!available && !on)} label="Newsletter e-mail" />}
        />
    );
};
