import type { Metadata } from 'next';
import { Rocket, Search, Star, CheckCircle, ShieldCheck } from 'lucide-react';
import { BackButton } from '../_components/BackButton';
import { BASE_URL } from '@/lib/seo-data';

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

const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
    isPartOf: { '@type': 'WebSite', url: BASE_URL, name: 'MyLokalni.pl' },
};

export default function HowItWorksPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
            <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-700">
                <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                        <BackButton />
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Rocket size={20} className="text-[#6366F1]" />
                            Jak to działa
                        </h1>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-6 py-12">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                        <div className="p-8 md:p-12 border-b border-gray-50 text-center bg-gray-50/30">
                            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight leading-tight">Prosta droga do celu</h2>
                            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                                MyLokalni to platforma, która skraca dystans między potrzebą a profesjonalnym rozwiązaniem. Zobacz, jak łatwo zacząć.
                            </p>
                        </div>

                        <div className="p-8 md:p-12 space-y-16">

                            <section>
                                <h3 className="text-sm uppercase tracking-[0.2em] font-bold text-[#6366F1] mb-10 flex items-center gap-3">
                                    <Search size={20} />
                                    Szukam specjalisty
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {[
                                        { step: '01', title: 'Znajdź usługę', desc: 'Wpisz czego potrzebujesz i wybierz lokalizację. Przeglądaj profile z opiniami.' },
                                        { step: '02', title: 'Ustal szczegóły', desc: 'Skontaktuj się bezpośrednio przez czat, aby omówić zakres prac i termin.' },
                                        { step: '03', title: 'Wystaw opinię', desc: 'Po zakończonym zleceniu oceń współpracę, pomagając budować lokalną społeczność.' },
                                    ].map((item) => (
                                        <div key={item.step} className="relative p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                            <span className="text-4xl font-black text-indigo-100 absolute top-4 right-4 leading-none">{item.step}</span>
                                            <p className="font-bold text-gray-900 mb-2 relative z-10">{item.title}</p>
                                            <p className="text-sm text-gray-500 relative z-10 leading-relaxed">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm uppercase tracking-[0.2em] font-bold text-[#6366F1] mb-10 flex items-center gap-3">
                                    <Star size={20} />
                                    Chcę świadczyć usługi
                                </h3>
                                <div className="space-y-6">
                                    {[
                                        { title: 'Stwórz profesjonalny profil', text: 'Zarejestruj się i uzupełnij swoje portfolio oraz zakres oferowanych usług, aby przyciągnąć klientów.' },
                                        { title: 'Otrzymuj zapytania bezpośrednio', text: 'Zlecenia od klientów z Twojej okolicy trafią prosto na Twój panel lub skrzynkę mailową.' },
                                        { title: 'Rozwijaj swój lokalny biznes', text: 'Buduj renomę dzięki zbieranym opiniom i zyskuj stałych klientów w swojej okolicy.' },
                                    ].map((item) => (
                                        <div key={item.title} className="flex gap-4 items-start p-5 rounded-2xl bg-white border border-gray-100 hover:border-indigo-100 transition-colors">
                                            <div className="mt-1 shrink-0">
                                                <CheckCircle size={18} className="text-[#6366F1]" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 text-sm mb-1">{item.title}</p>
                                                <p className="text-sm text-gray-500 leading-relaxed">{item.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <div className="bg-gray-900 p-8 md:p-10 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center gap-8">
                                <div className="p-5 bg-white/10 rounded-2xl text-[#818cf8] shrink-0">
                                    <ShieldCheck size={40} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-xl mb-2 text-center md:text-left">Bezpieczeństwo przede wszystkim</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed text-center md:text-left">
                                        Weryfikujemy kluczowe dane i dbamy o standardy komunikacji, abyś mógł skupić się na tym, co ważne – rzetelnej pracy i satysfakcji ze zrealizowanych zleceń.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
