import type { Metadata } from 'next';
import { ShieldCheck, Lock, AlertTriangle, CheckCircle, Mail, UserCheck } from 'lucide-react';
import { BackButton } from '../_components/BackButton';
import { BASE_URL } from '@/lib/seo-data';

const title = 'Zasady bezpieczeństwa | MyLokalni.pl';
const description = 'Zasady bezpiecznego korzystania z MyLokalni.pl – weryfikacja specjalistów, ochrona danych, zgłaszanie nadużyć.';
const url = `${BASE_URL}/zasady-bezpieczenstwa`;

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

export default function SafetyPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
            <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-700">
                <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                        <BackButton />
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <ShieldCheck size={20} className="text-[#6366F1]" />
                            Zasady bezpieczeństwa
                        </h1>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-6 py-12">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">

                        <div className="mb-12 text-center">
                            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Twoje bezpieczeństwo to priorytet</h2>
                            <p className="text-gray-500">Dowiedz się, jak bezpiecznie korzystać z serwisu MyLokalni i chronić swoje dane.</p>
                        </div>

                        <div className="space-y-12">

                            <section>
                                <h3 className="text-sm uppercase tracking-widest font-bold text-[#6366F1] mb-6 flex items-center gap-2">
                                    <UserCheck size={18} /> Weryfikacja użytkowników
                                </h3>
                                <p className="text-sm leading-relaxed mb-4 text-gray-600">
                                    Dbamy o to, aby społeczność Lokalnych była rzetelna. Każdy użytkownik przechodzi weryfikację adresu e-mail przed aktywacją konta. Numer telefonu podawany jest dobrowolnie i nie jest publicznie widoczny na stronie profilu.
                                </p>
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                                    <p className="text-sm text-blue-800 font-medium">
                                        Wskazówka: Zawsze sprawdzaj opinie o wykonawcy lub zleceniodawcy przed podjęciem współpracy.
                                    </p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm uppercase tracking-widest font-bold text-[#6366F1] mb-6 flex items-center gap-2">
                                    <Lock size={18} /> Bezpieczne płatności
                                </h3>
                                <ul className="space-y-4">
                                    <li className="flex gap-3 items-start">
                                        <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                                        <p className="text-sm text-gray-600">Nigdy nie dokonuj przedpłat przed osobistym spotkaniem lub podpisaniem umowy.</p>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
                                        <p className="text-sm text-gray-600">Rozliczaj się dopiero po rzetelnym wykonaniu zlecenia lub zgodnie z ustalonymi etapami prac.</p>
                                    </li>
                                </ul>
                            </section>

                            <section>
                                <h3 className="text-sm uppercase tracking-widest font-bold text-[#6366F1] mb-6 flex items-center gap-2">
                                    <AlertTriangle size={18} /> Na co uważać?
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        'Podejrzanie niskie ceny usług',
                                        'Prośby o dane do logowania do banku',
                                        'Naleganie na kontakt poza serwisem',
                                        'Brak numeru telefonu lub danych firmy',
                                    ].map((item) => (
                                        <div key={item} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs font-medium text-gray-600">
                                            <div className="h-1.5 w-1.5 rounded-full bg-red-400"></div>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm uppercase tracking-widest font-bold text-[#6366F1] mb-6 flex items-center gap-2">
                                    <ShieldCheck size={18} /> Ochrona danych
                                </h3>
                                <p className="text-sm leading-relaxed text-gray-600">
                                    Twoje dane kontaktowe są widoczne tylko dla osób, z którymi zdecydujesz się nawiązać współpracę. Nie udostępniamy Twojego numeru telefonu publicznie na stronie ogłoszenia.
                                </p>
                            </section>

                            <div className="border-t border-gray-100 pt-10 mt-10">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-50 p-6 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-3 rounded-xl shadow-sm">
                                            <Mail className="text-[#6366F1]" size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Zauważyłeś coś niepokojącego?</p>
                                            <p className="text-xs text-gray-500">Zgłoś to nam natychmiast, dbamy o porządek w serwisie.</p>
                                        </div>
                                    </div>
                                    <a
                                        href="mailto:kontakt@lokalni.pl"
                                        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors active:scale-95 text-center"
                                    >
                                        Zgłoś incydent
                                    </a>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
