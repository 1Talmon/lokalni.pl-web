'use client';
import { useState } from 'react';
import { FileDown } from 'lucide-react';
import type { ToastType } from '../../../../types';
import { apiClient } from '../../../../services/apiClient';
import { SettingsRow } from './SettingsRow';
import { settingsActionClass } from './settingsStyles';

/** Copy of my data (art. 15 and 20 RODO): ZIP with moje-dane.html (readable) + moje-dane.json (machine-readable). */
export const DataExportRow = ({ addToast }: { addToast?: (msg: string, type?: ToastType) => void }) => {
    const [busy, setBusy] = useState(false);

    const download = async () => {
        setBusy(true);
        try {
            const res = await apiClient.get('/users/me/export.zip');
            if (res.status === 429) throw new Error('Możesz pobrać dane kilka razy na godzinę. Spróbuj później.');
            if (!res.ok) throw new Error('Nie udało się przygotować danych. Spróbuj ponownie.');
            const url = URL.createObjectURL(await res.blob());
            const a = document.createElement('a');
            a.href = url;
            a.download = `mylokalni-moje-dane-${new Date().toISOString().slice(0, 10)}.zip`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 10_000);
            addToast?.('Pobrano plik ZIP z Twoimi danymi – otwórz moje-dane.html', 'success');
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
            description="Plik ZIP: czytelna strona z Twoimi danymi i ten sam zakres w formacie JSON (RODO)."
            action={
                <button type="button" onClick={download} disabled={busy} className={settingsActionClass('default')}>
                    {busy ? 'Przygotowuję…' : 'Pobierz'}
                </button>
            }
        />
    );
};
