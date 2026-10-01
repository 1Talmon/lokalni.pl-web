/**
 * Operator / data controller identity — single source of truth for the Terms, Privacy Policy,
 * footer and contact links. Shared 1:1 with `lokalni projekt/src/lib/legal/operator.ts`.
 *
 * The operator is a natural person running unregistered activity (działalność nierejestrowana,
 * art. 5 ust. 1 Prawa przedsiębiorców) — no company name, NIP, REGON or CEIDG entry.
 */
export const OPERATOR = {
    fullName: '[IMIĘ I NAZWISKO]',
    /** Adres zamieszkania — wymagany przez art. 5 ust. 2 UŚUDE i art. 12 ust. 1 pkt 3 ustawy o prawach konsumenta. */
    street: '[ULICA I NUMER]',
    postalCity: '[KOD POCZTOWY I MIEJSCOWOŚĆ]',
    email: 'mylokalni@gmail.com',
    /** Optional — leave null to omit. */
    phone: '+48 577 481 340' as string | null,
    serviceName: 'MyLokalni.pl',
    website: 'https://mylokalni.pl',
    domain: 'mylokalni.pl',
} as const;

export const operatorAddress = () => `${OPERATOR.street}, ${OPERATOR.postalCity}`;

/** Dates shown on the documents (ISO). Bump both when the text changes. */
export const LEGAL_DATES = {
    termsEffective: '2026-10-16',
    privacyUpdated: '2026-10-01',
} as const;

export const formatLegalDate = (iso: string) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Warsaw' });
