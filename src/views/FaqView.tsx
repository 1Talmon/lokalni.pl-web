'use client';
import { ArrowLeft, HelpCircle, MessageCircle, ShieldCheck, CreditCard, User } from 'lucide-react';
import { useRouter } from 'next/navigation';

const FaqView = () => {
    const router = useRouter();

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-700">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button 
                        onClick={handleBack} 
                        className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-600 active:scale-95"
                    >
                        <ArrowLeft size={24}/>
                    </button>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <HelpCircle size={20} className="text-[#6366F1]"/>
                        Najczęstsze pytania
                    </h1>
                </div>
            </div>

            {/* Treść */}
            <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
                    
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl font-black text-gray-900 mb-4">Centrum Pomocy</h2>
                        <p className="text-gray-500">Znajdź odpowiedzi na najpopularniejsze pytania dotyczące serwisu.</p>
                    </div>

                    <div className="space-y-12">
                        
                        {/* Kategoria: Ogólne */}
                        <section>
                            <h3 className="text-sm uppercase tracking-widest font-bold text-[#6366F1] mb-6 flex items-center gap-2">
                                <User size={18}/> Ogólne
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="font-bold text-gray-900 mb-2">Czy korzystanie z serwisu jest płatne?</p>
                                    <p className="text-sm leading-relaxed text-gray-600">Rejestracja, przeglądanie ofert oraz publikowanie podstawowych ogłoszeń jest całkowicie bezpłatne.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 mb-2">Jak założyć konto?</p>
                                    <p className="text-sm leading-relaxed text-gray-600">Wystarczy kliknąć przycisk „Zarejestruj się" na stronie głównej i podać adres e-mail lub skorzystać z szybkiego logowania przez Google albo Facebook.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 mb-2">Od ilu lat można korzystać z serwisu?</p>
                                    <p className="text-sm leading-relaxed text-gray-600">Serwis jest dostępny dla osób od 13. roku życia. Osoby w wieku 13–15 lat rejestrują się za zgodą rodzica lub opiekuna prawnego — po podaniu daty urodzenia wysyłamy e-mail z prośbą o potwierdzenie do rodzica. Osoby w wieku 16–17 lat rejestrują się samodzielnie. Pełnoletni korzystają z serwisu bez ograniczeń.</p>
                                </div>
                            </div>
                        </section>

                        {/* Kategoria: Bezpieczeństwo */}
                        <section>
                            <h3 className="text-sm uppercase tracking-widest font-bold text-[#6366F1] mb-6 flex items-center gap-2">
                                <ShieldCheck size={18}/> Bezpieczeństwo
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="font-bold text-gray-900 mb-2">Jak weryfikujecie wykonawców?</p>
                                    <p className="text-sm leading-relaxed text-gray-600">Weryfikujemy adres e-mail każdego użytkownika przed aktywacją konta. Dodatkowo system opinii od innych użytkowników pozwala ocenić rzetelność danego specjalisty.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 mb-2">Czy moje dane są bezpieczne?</p>
                                    <p className="text-sm leading-relaxed text-gray-600">Tak, Twoje dane są szyfrowane i przetwarzane zgodnie z naszą Polityką Prywatności. Nigdy nie udostępniamy Twojego numeru bez Twojej zgody.</p>
                                </div>
                            </div>
                        </section>

                        {/* Kategoria: Płatności */}
                        <section>
                            <h3 className="text-sm uppercase tracking-widest font-bold text-[#6366F1] mb-6 flex items-center gap-2">
                                <CreditCard size={18}/> Rozliczenia
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="font-bold text-gray-900 mb-2">Jak płacę za wykonaną usługę?</p>
                                    <p className="text-sm leading-relaxed text-gray-600">Obecnie rozliczenia odbywają się bezpośrednio między Zleceniodawcą a Wykonawcą (gotówka, przelew lub BLIK po wykonaniu pracy).</p>
                                </div>
                            </div>
                        </section>

                        {/* Kontakt CTA */}
                        <div className="border-t border-gray-100 pt-10 mt-10">
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-50 p-6 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white p-3 rounded-xl shadow-sm">
                                        <MessageCircle className="text-[#6366F1]" size={24}/>
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">Nie znalazłeś odpowiedzi?</p>
                                        <p className="text-xs text-gray-500">Napisz do nas, odpowiemy w ciągu 24h.</p>
                                    </div>
                                </div>
                                <a
                                    href="mailto:kontakt@lokalni.pl"
                                    className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors active:scale-95 inline-block"
                                >
                                    Skontaktuj się
                                </a>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
export default FaqView;
