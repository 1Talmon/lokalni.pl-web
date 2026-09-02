import type { Metadata } from 'next';
import SafetyView from '../../../views/SafetyView';
import { BASE_URL } from '../../../lib/seo-data';

const title = 'Zasady bezpieczeństwa | MyLokalni.pl';
const description = 'Zasady bezpiecznego korzystania z MyLokalni.pl – weryfikacja specjalistów, ochrona danych, zgłaszanie nadużyć.';

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/zasady-bezpieczenstwa` },
    openGraph: { title, description, url: `${BASE_URL}/zasady-bezpieczenstwa`, type: 'website', siteName: 'MyLokalni.pl', locale: 'pl_PL', images: [{ url: `${BASE_URL}/og-image.png` }] },
    twitter: { card: 'summary_large_image', title, description },
};

const url = `${BASE_URL}/zasady-bezpieczenstwa`;

const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
    isPartOf: { '@type': 'WebSite', url: BASE_URL, name: 'MyLokalni.pl' },
};

export default function SafetyPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
            <SafetyView />
        </>
    );
}
