'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { onConsentChange, readConsent, type AnalyticsConsent } from '@/lib/consent';
import { analyticsLocation, analyticsPath } from '@/lib/analyticsPath';

declare global {
    interface Window {
        dataLayer?: unknown[];
        gtag?: (...args: unknown[]) => void;
        [key: `ga-disable-${string}`]: boolean | undefined;
    }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID?.trim() ?? '';

/** Wycofanie zgody: usuwamy cookies GA (_ga, _ga_<ID>, _gid, _gat*). */
function clearAnalyticsCookies(): void {
    if (typeof document === 'undefined') return;
    const host = window.location.hostname;
    const domains = ['', host, `.${host.replace(/^www\./, '')}`];
    const names = document.cookie
        .split(';')
        .map((entry) => entry.split('=')[0]?.trim())
        .filter(Boolean);

    for (const name of names) {
        if (name !== '_ga' && name !== '_gid' && !name.startsWith('_ga_') && !name.startsWith('_gat')) continue;
        for (const domain of domains) {
            document.cookie = `${name}=; Max-Age=0; path=/${domain ? `; domain=${domain}` : ''}`;
        }
    }
}

function GoogleAnalyticsTracker() {
    const pathname = usePathname();
    const [consent, setConsent] = useState<AnalyticsConsent | null>(null);
    const [ready, setReady] = useState(false);

    // Zgoda czytana dopiero po montażu (localStorage nie istnieje na serwerze) + nasłuch zmian.
    useEffect(() => {
        setConsent(readConsent());
        return onConsentChange(setConsent);
    }, []);

    // Wycofanie zgody: blokujemy wysyłkę (oficjalna flaga opt-out GA) i czyścimy cookies.
    useEffect(() => {
        window[`ga-disable-${GA_ID}`] = consent !== 'granted';
        if (consent === 'denied') {
            setReady(false);
            clearAnalyticsCookies();
        }
    }, [consent]);

    // Ponowna zgoda po jej wycofaniu: skrypt gtag już jest w DOM, więc `onLoad` się nie powtórzy —
    // konfigurujemy GA tutaj, żeby `page_view` znów działał bez przeładowania strony.
    useEffect(() => {
        if (consent !== 'granted' || ready || typeof window.gtag !== 'function') return;
        window.gtag('js', new Date());
        window.gtag('config', GA_ID, {
            send_page_view: false,
            allow_google_signals: false,
            allow_ad_personalization_signals: false,
            page_location: analyticsLocation(window.location.origin, window.location.pathname, window.location.search),
        });
        setReady(true);
    }, [consent, ready]);

    // GA4 nie śledzi zmian trasy w App Routerze samo — page_view wysyłamy przy każdej nawigacji.
    // `send_page_view: false` w config, żeby nie policzyć pierwszego odsłonięcia dwa razy.
    // Adres jest oczyszczony (bez tokenów z maili, z kodami zastąpionymi znacznikiem). `set` ustawia go
    // też dla zdarzeń pomiaru rozszerzonego (przewijanie, kliknięcia wychodzące), które inaczej wzięłyby
    // prawdziwy adres z paska przeglądarki.
    useEffect(() => {
        if (!ready || consent !== 'granted' || typeof window.gtag !== 'function') return;
        const location = analyticsLocation(window.location.origin, pathname, window.location.search);
        window.gtag('set', { page_location: location, page_path: analyticsPath(pathname) });
        window.gtag('event', 'page_view', {
            page_path: analyticsPath(pathname),
            page_location: location,
            page_title: document.title,
        });
    }, [ready, consent, pathname]);

    if (consent !== 'granted') return null;

    return (
        <Script
            id="ga4"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`}
            strategy="afterInteractive"
            onLoad={() => {
                window.dataLayer = window.dataLayer || [];
                window.gtag =
                    window.gtag ??
                    function gtag() {
                        // gtag.js czyta obiekt `arguments`; tablicę z `...args` ignoruje i nic nie wysyła.
                        // eslint-disable-next-line prefer-rest-params
                        window.dataLayer!.push(arguments);
                    };
                window.gtag('js', new Date());
                window.gtag('config', GA_ID, {
                    send_page_view: false,
                    // Zgodnie z Polityką prywatności: bez sygnałów Google i bez personalizacji reklam.
                    allow_google_signals: false,
                    allow_ad_personalization_signals: false,
                    // Adres bez parametrów (tokeny z maili!) — patrz lib/analyticsPath.ts.
                    page_location: analyticsLocation(window.location.origin, window.location.pathname, window.location.search),
                });
                setReady(true);
            }}
        />
    );
}

/**
 * Google Analytics 4 — ładowany wyłącznie po zgodzie na analitykę (baner cookies).
 * Bez `NEXT_PUBLIC_GA_ID` komponent nic nie robi, więc dev/preview działają bez GA.
 */
export function GoogleAnalytics() {
    if (!GA_ID) return null;
    return <GoogleAnalyticsTracker />;
}
