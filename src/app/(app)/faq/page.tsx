import type { Metadata } from 'next';
import FaqView from '../../../views/FaqView';
import { BASE_URL } from '../../../lib/seo-data';

const title = 'FAQ – Często zadawane pytania | MyLokalni.pl';
const description = 'Odpowiedzi na najczęstsze pytania o MyLokalni.pl – jak znaleźć specjalistę, zarezerwować usługę i co zrobić w razie problemów.';
const url = `${BASE_URL}/faq`;

export const metadata: Metadata = {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', siteName: 'MyLokalni.pl', locale: 'pl_PL', images: [{ url: `${BASE_URL}/og-image.png` }] },
    twitter: { card: 'summary_large_image', title, description },
};

const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'Czy korzystanie z serwisu jest płatne?',
            acceptedAnswer: { '@type': 'Answer', text: 'Rejestracja, przeglądanie ofert oraz publikowanie podstawowych ogłoszeń jest całkowicie bezpłatne.' },
        },
        {
            '@type': 'Question',
            name: 'Jak założyć konto?',
            acceptedAnswer: { '@type': 'Answer', text: 'Wystarczy kliknąć przycisk „Zarejestruj się" na stronie głównej i podać adres e-mail lub skorzystać z szybkiego logowania przez Google albo Facebook.' },
        },
        {
            '@type': 'Question',
            name: 'Od ilu lat można korzystać z serwisu?',
            acceptedAnswer: { '@type': 'Answer', text: 'Serwis jest dostępny dla osób od 13. roku życia. Osoby w wieku 13–15 lat rejestrują się za zgodą rodzica lub opiekuna prawnego. Osoby w wieku 16–17 lat rejestrują się samodzielnie. Pełnoletni korzystają z serwisu bez ograniczeń.' },
        },
        {
            '@type': 'Question',
            name: 'Jak weryfikujecie wykonawców?',
            acceptedAnswer: { '@type': 'Answer', text: 'Weryfikujemy adres e-mail każdego użytkownika przed aktywacją konta. Dodatkowo system opinii od innych użytkowników pozwala ocenić rzetelność danego specjalisty.' },
        },
        {
            '@type': 'Question',
            name: 'Czy moje dane są bezpieczne?',
            acceptedAnswer: { '@type': 'Answer', text: 'Tak, Twoje dane są szyfrowane i przetwarzane zgodnie z Polityką Prywatności. Nigdy nie udostępniamy Twojego numeru bez Twojej zgody.' },
        },
        {
            '@type': 'Question',
            name: 'Jak płacę za wykonaną usługę?',
            acceptedAnswer: { '@type': 'Answer', text: 'Obecnie rozliczenia odbywają się bezpośrednio między Zleceniodawcą a Wykonawcą (gotówka, przelew lub BLIK po wykonaniu pracy).' },
        },
    ],
};

export default function FaqPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
            <FaqView />
        </>
    );
}
