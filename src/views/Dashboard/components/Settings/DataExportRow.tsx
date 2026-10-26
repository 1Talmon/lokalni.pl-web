'use client';
import { useState } from 'react';
import { FileDown } from 'lucide-react';
import type { ToastType } from '../../../../types';
import { apiClient } from '../../../../services/apiClient';
import { SettingsRow } from './SettingsRow';
import { settingsActionClass } from './settingsStyles';

/** Copy of my data (art. 15 and 20 RODO) — the JSON from GET /users/me/export, saved as a file. */
export const DataExportRow = ({ addToast }: { addToast?: (msg: string, type?: ToastType) => void }) => {
    const [busy, setBusy] = useState(false);

    const download = async () => {
        setBusy(true);
        try {
            const res = await apiClient.get('/users/me/export');
            if (res.status === 429) throw new Error('Możesz pobrać dane kilka razy na godzinę. Spróbuj później.');
            if (!res.ok) throw new Error('Nie udało się przygotować danych. Spróbuj ponownie.');
            const blob = new Blob([JSON.stringify(await res.json(), null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mylokalni-moje-dane-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 10_000);
            addToast?.('Plik z Twoimi danymi został pobrany', 'success');
        } catch (e) {
            addToast?.((e as Error).message, 'error');
        } finally {
            setBusy(false);
        }
    };

    return (
        <SettingsRow
            icon={FileDown}
            title="Pobierz moje dane"
            description="Kopia danych Twojego konta w pliku JSON (RODO)."
            action={
                <button type="button" onClick={download} disabled={busy} className={settingsActionClass('default')}>
                    {busy ? 'Przygotowuję…' : 'Pobierz'}
                </button>
            }
        />
    );
};
