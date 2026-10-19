'use client';
import { useEffect, useState } from 'react';
import { Wrench } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export const MAINTENANCE_EVENT = 'mylokalni:maintenance';

// Strip under the top navbar while the panel's maintenance mode is on (Konfiguracja).
// Checks /public/status on start and every minute; apiClient also fires MAINTENANCE_EVENT on a 503 MAINTENANCE.
export const MaintenanceBanner = () => {
    const [message, setMessage] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;
        const check = async () => {
            try {
                const res = await apiClient.get('/public/status');
                if (!res.ok) return;
                const s = await res.json() as { maintenance?: boolean; message?: string | null };
                if (alive) setMessage(s.maintenance ? (s.message || 'Trwają prace serwisowe.') : null);
            } catch { /* offline — OfflineBanner covers it */ }
        };
        const onEvent = (e: Event) => setMessage((e as CustomEvent<string>).detail || 'Trwają prace serwisowe.');
        check();
        const t = setInterval(check, 60_000);
        window.addEventListener(MAINTENANCE_EVENT, onEvent);
        return () => { alive = false; clearInterval(t); window.removeEventListener(MAINTENANCE_EVENT, onEvent); };
    }, []);

    if (!message) return null;
    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed left-0 right-0 z-[99999] flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-amber-950 bg-amber-300 shadow-md text-center"
            style={{ top: 'var(--total-nav-h, calc(var(--nav-content-h, 73px) + env(safe-area-inset-top, 0px)))' }}
        >
            <Wrench size={16} className="shrink-0" />
            {message}
        </div>
    );
};
