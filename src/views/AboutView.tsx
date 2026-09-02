'use client';
import { ArrowLeft, Users, Target, Heart, Award, Mail, Building2, MapPin, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';

const AboutView = () => {
    const router = useRouter();

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push('/');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
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
                        <Users size={20} className="text-[#6366F1]"/>
                        O nas
                    </h1>
                </div>
            </div>

            {/* Treść */}
            <div className="max-w-3xl mx-auto px-6 py-12">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
                    
                    {/* Hero */}
                    <div className="mb-16 text-center">
                        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Łączymy ludzi lokalnie</h2>
                        <p className="text-gray-500 text-lg">Wierzymy, że najlepsze usługi to te, które są blisko Ciebie.</p>
                        <div className="h-1.5 w-16 bg-[#6366F1] mx-auto mt-8 rounded-full"></div>
                    </div>

                    <div className="space-y-16 text-gray-700 leading-relaxed">
                        
                        {/* Nasza Misja */}
                        <section>
                            <h3 className="text-sm uppercase tracking-[0.2em] font-bold text-[#6366F1] mb-6 flex items-center gap-3">
                                <Target size={20}/>
                                Nasza Misja
                            </h3>
                            <p className="text-lg">
                                MyLokalni powstało z prostej potrzeby – znalezienia rzetelnej pomocy w najbliższym otoczeniu. Naszym celem jest budowanie platformy, która wspiera lokalnych przedsiębiorców i ułatwia życie mieszkańcom, eliminując zbędne pośrednictwo.
                            </p>
                        </section>

                        {/* Co nas wyróżnia */}
                        <section>
                            <h3 className="text-sm uppercase tracking-[0.2em] font-bold text-[#6366F1] mb-6 flex items-center gap-3">
                                <Award size={20}/>
                                Dlaczego my?
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { title: "Transparentność", desc: "Jasne zasady współpracy bez ukrytych kosztów." },
                                    { title: "Bezpieczeństwo", desc: "Weryfikacja profilu i dbałość o jakość zleceń." },
                                    { title: "Lokalność", desc: "Skupienie na budowaniu relacji w Twoim sąsiedztwie." },
                                    { title: "Szybkość", desc: "Intuicyjny proces znajdowania wykonawców." }
                                ].map((item, i) => (
                                    <div key={i} className="p-5 bg-gray-50 rounded-2xl border border-gray-100 text-sm">
                                        <p className="font-bold text-gray-900 mb-1">{item.title}</p>
                                        <p className="text-gray-500">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Nasze Wartości */}
                        <section>
                            <h3 className="text-sm uppercase tracking-[0.2em] font-bold text-[#6366F1] mb-6 flex items-center gap-3">
                                <Heart size={20}/>
                                Nasze Wartości
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <div className="h-2 w-2 rounded-full bg-[#6366F1] mt-2 shrink-0"></div>
                                    <p>Wspieranie małych, lokalnych biznesów i rzemieślników.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="h-2 w-2 rounded-full bg-[#6366F1] mt-2 shrink-0"></div>
                                    <p>Budowanie społeczności opartej na wzajemnym zaufaniu.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="h-2 w-2 rounded-full bg-[#6366F1] mt-2 shrink-0"></div>
                                    <p>Ciągły rozwój narzędzi ułatwiających codzienną pracę.</p>
                                </li>
                            </ul>
                        </section>

                        {/* Dane rejestrowe */}
                        <section>
                            <h3 className="text-sm uppercase tracking-[0.2em] font-bold text-[#6366F1] mb-6 flex items-center gap-3">
                                <Building2 size={20}/>
                                Dane rejestrowe
                            </h3>
                            <div className="bg-gray-50 rounded-2xl border border-gray-100 divide-y divide-gray-100 text-sm">
                                {[
                                    { label: 'Pełna nazwa', value: '[PEŁNA NAZWA FIRMY]' },
                                    { label: 'Forma prawna', value: '[np. Spółka z ograniczoną odpowiedzialnością]' },
                                    { label: 'NIP', value: '[000-000-00-00]' },
                                    { label: 'KRS / CEiDG', value: '[0000000000]' },
                                    { label: 'Organ rejestrowy', value: '[np. Sąd Rejonowy dla m.st. Warszawy, XII Wydział Gospodarczy]' },
                                ].map(({ label, value }) => (
                                    <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-1 px-5 py-3.5">
                                        <span className="font-semibold text-gray-500 w-44 shrink-0">{label}</span>
                                        <span className="text-gray-900">{value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
                                    <MapPin size={16} className="text-[#6366F1] shrink-0"/>
                                    <span className="text-gray-700">ul. Prosta 1<br/>00-000 Warszawa</span>
                                </div>
                                <a href="mailto:kontakt@lokalni.pl" className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 hover:border-indigo-200 transition-colors">
                                    <Mail size={16} className="text-[#6366F1] shrink-0"/>
                                    <span className="text-gray-700">kontakt@lokalni.pl</span>
                                </a>
                                <a href="tel:+48577481340" className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100 hover:border-indigo-200 transition-colors">
                                    <Phone size={16} className="text-[#6366F1] shrink-0"/>
                                    <span className="text-gray-700">+48 577 481 340</span>
                                </a>
                            </div>
                        </section>

                        {/* Kontakt CTA */}
                        <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2rem] text-center">
                            <h4 className="font-bold text-indigo-900 mb-2">Chcesz dowiedzieć się więcej?</h4>
                            <p className="text-indigo-700 text-sm mb-6">Nasz zespół chętnie odpowie na Twoje pytania.</p>
                            <a 
                                href="mailto:kontakt@lokalni.pl" 
                                className="inline-flex items-center gap-2 bg-[#6366F1] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#4F46E5] transition-colors active:scale-95"
                            >
                                <Mail size={18}/>
                                Napisz do nas
                            </a>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
export default AboutView;
