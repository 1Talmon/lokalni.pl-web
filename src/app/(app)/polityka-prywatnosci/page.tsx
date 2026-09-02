import type { Metadata } from 'next';
import PrivacyPolicyView from '../../../views/PrivacyPolicyView';
import { BASE_URL } from '../../../lib/seo-data';

const title = 'Polityka prywatności | MyLokalni.pl';
const description = 'Polityka prywatności MyLokalni.pl – jak chronimy Twoje dane osobowe zgodnie z RODO.';
const url = `${BASE_URL}/polityka-prywatnosci`;

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

export default function PrivacyPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
            <PrivacyPolicyView />
        </>
    );
}
