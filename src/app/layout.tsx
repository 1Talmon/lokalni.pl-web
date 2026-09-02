import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '../index.css';
import '../App.css';

const font = Plus_Jakarta_Sans({
    subsets: ['latin'],
    weight: ['400', '500', '600', '700', '800'],
    display: 'swap',
    variable: '--font-jakarta',
});

const BASE_URL = 'https://mylokalni.pl';

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: 'MyLokalni.pl – znajdź specjalistę w swoim mieście',
        template: '%s',
    },
    description: 'Platforma łącząca klientów ze sprawdzonymi lokalnymi specjalistami w Polsce. Hydraulik, sprzątanie, korepetycje i wiele więcej – znajdź, porównaj, zarezerwuj.',
    keywords: ['lokalny specjalista', 'usługi lokalne', 'hydraulik', 'sprzątanie', 'korepetycje', 'Polska'],
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
        title: 'MyLokalni.pl – znajdź specjalistę w swoim mieście',
        description: 'Platforma łącząca klientów ze sprawdzonymi lokalnymi specjalistami w Polsce.',
        images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'MyLokalni.pl' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'MyLokalni.pl – znajdź specjalistę w swoim mieście',
        description: 'Platforma łącząca klientów ze sprawdzonymi lokalnymi specjalistami w Polsce.',
        images: ['/og-image.png'],
    },
    alternates: {
        canonical: BASE_URL,
        languages: { 'pl': BASE_URL },
    },
    manifest: '/manifest.json',
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
    logo: `${BASE_URL}/icons/favicon-96x96.png`,
    sameAs: [],
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
            urlTemplate: `${BASE_URL}/{search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="pl" className={font.variable}>
            <body className={font.className}>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
                {children}
            </body>
        </html>
    );
}
