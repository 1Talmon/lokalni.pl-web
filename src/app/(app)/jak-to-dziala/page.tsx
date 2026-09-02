import type { Metadata } from 'next';
import HowItWorksView from '../../../views/HowItWorksView';
import { BASE_URL } from '../../../lib/seo-data';

const title = 'Jak to działa | MyLokalni.pl – Znajdź specjalistę w 3 krokach';
const description = 'Jak znaleźć i zamówić usługę na MyLokalni.pl – trzy proste kroki: wyszukaj, porównaj opinie, zarezerwuj.';
const url = `${BASE_URL}/jak-to-dziala`;

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', siteName: 'MyLokalni.pl', locale: 'pl_PL', images: [{ url: `${BASE_URL}/og-image.png` }] },
    twitter: { card: 'summary_large_image', title, description },
};

export default function HowItWorksPage() { return <HowItWorksView />; }
