import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import NextTopLoader from 'nextjs-toploader';
import { WebVitals } from '@/components/WebVitals';
import { ChunkErrorRecovery } from '@/components/ChunkErrorRecovery';
import '../index.css';
import '../App.css';
import { safeJsonLd } from '@/lib/safeJsonLd';

// Self-hosted (was next/font/google): the build no longer depends on Google Fonts responding —
// an unexpected Google response broke the production build on 2026-10-05. Variable font, wght 200–800,
// latin + latin-ext subset of google/fonts PlusJakartaSans[wght].ttf (OFL, see fonts/PlusJakartaSans-OFL.txt).
const font = localFont({
    src: './fonts/PlusJakartaSans-Variable.woff2',
    weight: '200 800',
    style: 'normal',
    display: 'swap',
    variable: '--font-jakarta',
});

const BASE_URL = 'https://mylokalni.pl';

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: 'MyLokalni.pl – lokalne usługi od młodych z Twojej okolicy',
        template: '%s | MyLokalni.pl',
    },
    description: 'Zarabiaj na tym, co umiesz, lub znajdź kogoś tuż obok. Koszenie trawnika, paznokcie, korepetycje – oferty z cenami, opinie i rezerwacja online.',
    keywords: ['lokalny specjalista', 'usługi lokalne', 'rezerwacja usług online', 'Polska'],
    authors: [{ name: 'MyLokalni.pl' }],
    creator: 'MyLokalni.pl',
    publisher: 'MyLokalni.pl',
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
    },
    openGraph: {
        type: 'website',
        locale: 'pl_PL',
        siteName: 'MyLokalni.pl',
        title: 'MyLokalni.pl – lokalne usługi od młodych z Twojej okolicy',
        description: 'Zarabiaj na tym, co umiesz, lub znajdź kogoś tuż obok.',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'MyLokalni.pl' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'MyLokalni.pl – lokalne usługi od młodych z Twojej okolicy',
        description: 'Zarabiaj na tym, co umiesz, lub znajdź kogoś tuż obok.',
        images: ['/og-image.png'],
    },
    alternates: {
        canonical: BASE_URL,
        languages: { 'pl': BASE_URL },
    },
    manifest: '/manifest.json',
    // Safari (iOS) Smart App Banner: "Pobierz" for people without the app, "Otwórz" when installed
    itunes: { appId: '6788702057' },
    appleWebApp: {
        capable: true,
        statusBarStyle: 'default',
        title: 'MyLokalni',
    },
    icons: {
        icon: [
            { url: '/icons/favicon.ico', type: 'image/x-icon' },
            { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { url: '/icons/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
            { url: '/icons/favicon.svg', type: 'image/svg+xml' },
        ],
        apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
    },
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    viewportFit: 'cover',
    themeColor: '#ffffff',
};

const orgJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MyLokalni.pl',
    url: BASE_URL,
    logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/icons/favicon-96x96.png`,
        width: 96,
        height: 96,
    },
    contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        availableLanguage: 'Polish',
        areaServed: 'PL',
    },
};

const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MyLokalni.pl',
    url: BASE_URL,
    potentialAction: {
        '@type': 'SearchAction',
        target: {
            '@type': 'EntryPoint',
            urlTemplate: `${BASE_URL}/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pl" className={font.variable}>
            <head>
                <meta property="fb:app_id" content="1082296997226159" />
                {/* Preconnects — reduce connection latency for critical origins */}
                <link rel="preconnect" href="https://api.mylokalni.pl" />
                <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
                <link rel="dns-prefetch" href="https://accounts.google.com" />
                <link rel="dns-prefetch" href="https://maps.googleapis.com" />
            </head>
            <body className={font.className}>
                <NextTopLoader color="#6366F1" showSpinner={false} height={2} crawlSpeed={200} />
                <WebVitals />
                <ChunkErrorRecovery />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(orgJsonLd) }} />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(websiteJsonLd) }} />
                {children}
            </body>
        </html>
    );
}
