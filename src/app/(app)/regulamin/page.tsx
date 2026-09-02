import type { Metadata } from 'next';
import TermsView from '../../../views/TermsView';
import { BASE_URL } from '../../../lib/seo-data';

const title = 'Regulamin | MyLokalni.pl';
const description = 'Regulamin korzystania z platformy MyLokalni.pl – prawa i obowiązki użytkowników, warunki świadczenia usług.';
const url = `${BASE_URL}/regulamin`;

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

export default function TermsPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
            <TermsView />
        </>
    );
}
