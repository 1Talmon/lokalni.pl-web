/**
 * Zgoda na analitykę (Google Analytics) — jedno źródło prawdy dla banera cookies,
 * komponentu GA i stopki. Wybór zapisujemy w localStorage (nie w cookie), a zmianę
 * rozgłaszamy zdarzeniem, żeby GA włączyło się od razu po kliknięciu, bez przeładowania.
 */

export type AnalyticsConsent = 'granted' | 'denied';

/**
 * Klucz v2: stary `cookie-consent: 'acknowledged'` był tylko potwierdzeniem informacji
 * o cookies niezbędnych — nie zgodą na analitykę. Dlatego nie migrujemy go jako zgody.
 */
export const CONSENT_STORAGE_KEY = 'cookie-consent-v2';
export const CONSENT_EVENT = 'cookie-consent-changed';

export function readConsent(): AnalyticsConsent | null {
    if (typeof window === 'undefined') return null;
    try {
        const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
        return value === 'granted' || value === 'denied' ? value : null;
    } catch {
        // Tryb prywatny / zablokowany localStorage — traktujemy jak brak wyboru.
        return null;
    }
}

export function saveConsent(choice: AnalyticsConsent): void {
    try {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    } catch {
        // Bez zapisu zgoda działa do końca sesji — GA i tak włączy się po zdarzeniu niżej.
    }
    window.dispatchEvent(new CustomEvent<AnalyticsConsent>(CONSENT_EVENT, { detail: choice }));
}

/** Cofnięcie wyboru (stopka → „Ustawienia cookies”): baner pokazuje się ponownie. */
export function clearConsent(): void {
    try {
        window.localStorage.removeItem(CONSENT_STORAGE_KEY);
    } catch {
        // ignorujemy — baner i tak wróci po przeładowaniu
    }
    window.dispatchEvent(new CustomEvent<null>(CONSENT_EVENT, { detail: null }));
}

export function onConsentChange(listener: (choice: AnalyticsConsent | null) => void): () => void {
    const handler = (event: Event) => {
        listener((event as CustomEvent<AnalyticsConsent | null>).detail ?? null);
    };
    window.addEventListener(CONSENT_EVENT, handler);
    return () => window.removeEventListener(CONSENT_EVENT, handler);
}
