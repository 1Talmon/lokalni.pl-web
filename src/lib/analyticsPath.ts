/**
 * Adres strony wysyłany do analityki (Google Analytics / Firebase).
 *
 * Do Google nie może trafić nic, co jest poufne, a w adresach z maili są tokeny
 * (`/verify-email?token=…`, `/reset-password?token=…`, `/delete-account-confirm?token=…`),
 * a w niektórych ścieżkach kody (`/invite/<kod>`, `/r/<kod>`). Dlatego wysyłamy wyłącznie ścieżkę
 * bez parametrów, z kodami zastąpionymi znacznikiem. Jedyny wyjątek to oznaczenia kampanii
 * `utm_*` — bez nich nie wiadomo, skąd przyszedł ruch (Polityka prywatności: „źródło wejścia”).
 */

/** Pierwszy segment ścieżki, po którym następuje kod/token — drugi segment zastępujemy `:code`. */
const CODE_ROUTES = new Set(['invite', 'r']);

const CAMPAIGN_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];

/** `/invite/abc123` → `/invite/:code`; reszta ścieżki bez zmian, zawsze bez `?…` i `#…`. */
export function analyticsPath(pathname: string): string {
    const segments = pathname.split('?')[0].split('#')[0].split('/');
    if (segments[1] && CODE_ROUTES.has(segments[1]) && segments[2]) segments[2] = ':code';
    return segments.join('/') || '/';
}

/** Ścieżka plus ewentualne `utm_*` z bieżącego adresu — tylko to widzi analityka jako „pełny adres”. */
export function analyticsLocation(origin: string, pathname: string, search: string): string {
    const source = new URLSearchParams(search);
    const kept = new URLSearchParams();
    for (const key of CAMPAIGN_PARAMS) {
        const value = source.get(key);
        if (value) kept.set(key, value.slice(0, 100));
    }
    const query = kept.toString();
    return `${origin}${analyticsPath(pathname)}${query ? `?${query}` : ''}`;
}
