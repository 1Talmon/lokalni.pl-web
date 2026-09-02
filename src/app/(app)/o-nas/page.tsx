import type { Metadata } from 'next';
import AboutView from '../../../views/AboutView';
import { BASE_URL } from '../../../lib/seo-data';

const title = 'O nas | MyLokalni.pl – Platforma lokalnych specjalistów';
const description = 'Poznaj MyLokalni.pl – największą polską platformę łączącą klientów ze sprawdzonymi lokalnymi specjalistami w całej Polsce.';
const url = `${BASE_URL}/o-nas`;

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', siteName: 'MyLokalni.pl', locale: 'pl_PL', images: [{ url: `${BASE_URL}/og-image.png` }] },
    twitter: { card: 'summary_large_image', title, description },
};

const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
    isPartOf: { '@type': 'WebSite', url: BASE_URL, name: 'MyLokalni.pl' },
};

export default function AboutPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
            <AboutView />
        </>
    );
}
