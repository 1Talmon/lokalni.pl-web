'use client';

import { Suspense, useEffect, useState } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { onConsentChange, readConsent, type AnalyticsConsent } from '@/lib/consent';

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
    const searchParams = useSearchParams();
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
        });
        setReady(true);
    }, [consent, ready]);

    // GA4 nie śledzi zmian trasy w App Routerze samo — page_view wysyłamy przy każdej nawigacji.
    // `send_page_view: false` w config poniżej, żeby nie policzyć pierwszego odsłonięcia dwa razy.
    useEffect(() => {
        if (!ready || consent !== 'granted' || typeof window.gtag !== 'function') return;
        const query = searchParams?.toString();
        window.gtag('event', 'page_view', {
            page_path: `${pathname}${query ? `?${query}` : ''}`,
            page_location: window.location.href,
            page_title: document.title,
        });
    }, [ready, consent, pathname, searchParams]);

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
                    ((...args: unknown[]) => {
                        window.dataLayer!.push(args);
                    });
                window.gtag('js', new Date());
                window.gtag('config', GA_ID, {
                    send_page_view: false,
                    // Zgodnie z Polityką prywatności: bez sygnałów Google i bez personalizacji reklam.
                    allow_google_signals: false,
                    allow_ad_personalization_signals: false,
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

    // useSearchParams w osobnym Suspense — inaczej całe drzewo layoutu wpadłoby w CSR bailout.
    return (
        <Suspense fallback={null}>
            <GoogleAnalyticsTracker />
        </Suspense>
    );
}
