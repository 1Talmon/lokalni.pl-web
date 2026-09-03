import type { Metadata } from 'next';
import { Lock, Eye, Database, ShieldCheck, Cookie, Mail, MapPin, Bell, Fingerprint, MessageSquare, UserCheck } from 'lucide-react';
import { BackButton } from '../_components/BackButton';
import { BASE_URL } from '@/lib/seo-data';

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
            <div className="min-h-screen bg-gray-50 pb-20 font-sans">
                <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                        <BackButton />
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Lock size={20} className="text-[#6366F1]" />
                            Polityka Prywatności
                        </h1>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-6 py-12">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">

                        <div className="mb-10 text-center">
                            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Twoje dane są bezpieczne</h2>
                            <p className="text-gray-500 text-sm">Ostatnia aktualizacja: 23 sierpnia 2026 r.</p>
                            <p className="text-gray-500 text-sm mt-1">Dbamy o pełną przejrzystość przetwarzania Twoich danych osobowych.</p>
                        </div>

                        <div className="space-y-10 text-gray-700 leading-relaxed">

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <ShieldCheck className="text-[#6366F1]" size={24} />
                                    §1 Administrator Danych Osobowych
                                </h3>
                                <div className="space-y-3 pl-9">
                                    <p>1.1. Administratorem Twoich danych osobowych jest <strong>[PEŁNA NAZWA FIRMY]</strong> z siedzibą w [ADRES], wpisana do [KRS / CEiDG], NIP: [NIP] (dalej: „Administrator").</p>
                                    <p>1.2. W sprawach dotyczących ochrony danych osobowych możesz skontaktować się z Administratorem:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li>drogą elektroniczną: <span className="text-[#6366F1] font-medium">prywatnosc@lokalni.pl</span>,</li>
                                        <li>pisemnie na adres siedziby Administratora wskazany powyżej.</li>
                                    </ul>
                                    <p>1.3. Administrator nie wyznaczył Inspektora Ochrony Danych (IOD), gdyż nie jest do tego zobowiązany na podstawie art. 37 RODO. Wszelkie zapytania w zakresie ochrony danych kieruj bezpośrednio do Administratora.</p>
                                    <p>1.4. Niniejsza Polityka Prywatności stosuje się do przetwarzania danych osobowych w ramach serwisu internetowego i aplikacji mobilnej „MyLokalni.pl" (iOS, Android), dostępnych pod adresem <strong>lokalni.pl</strong>.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <Database className="text-[#6366F1]" size={24} />
                                    §2 Cele i podstawy prawne przetwarzania danych
                                </h3>
                                <div className="pl-9 space-y-4">
                                    <p>Administrator przetwarza Twoje dane osobowe wyłącznie w konkretnych, wyraźnych i prawnie uzasadnionych celach, na następujących podstawach prawnych (art. 6 RODO):</p>
                                    <div className="space-y-4">
                                        {[
                                            { cel: 'Rejestracja Konta i świadczenie usług', podstawa: 'art. 6 ust. 1 lit. b RODO — niezbędność do wykonania umowy', dane: 'adres e-mail, imię, hasło (przechowywane w postaci zaszyfrowanej).' },
                                            { cel: 'Weryfikacja wieku i zgoda rodzicielska (osoby w wieku 13–15 lat)', podstawa: 'art. 6 ust. 1 lit. c RODO w zw. z art. 8 RODO — wypełnienie obowiązku prawnego; przetwarzanie danych dziecka na podstawie zgody rodzica/opiekuna prawnego', dane: 'data urodzenia (opcjonalna — podana dobrowolnie celem weryfikacji wieku), adres e-mail rodzica lub opiekuna prawnego, jednorazowy token weryfikacyjny (przechowywany tymczasowo do momentu potwierdzenia).' },
                                            { cel: 'Logowanie przez Google / Facebook', podstawa: 'art. 6 ust. 1 lit. b RODO — wykonanie umowy', dane: 'identyfikator i adres e-mail z konta dostawcy logowania społecznościowego.' },
                                            { cel: 'Obsługa funkcji kalendarza i rezerwacji', podstawa: 'art. 6 ust. 1 lit. b RODO — wykonanie umowy', dane: 'daty, godziny, dane stron rezerwacji.' },
                                            { cel: 'Wewnętrzny system wiadomości (czat)', podstawa: 'art. 6 ust. 1 lit. b RODO — wykonanie umowy', dane: 'treść wiadomości, dane nadawcy i odbiorcy, znaczniki czasu.' },
                                            { cel: 'Wyświetlanie usług w pobliżu', podstawa: 'art. 6 ust. 1 lit. a RODO — zgoda użytkownika', dane: 'lokalizacja GPS lub wskazane miasto.' },
                                            { cel: 'Profil Usługodawcy (zdjęcia, opis, portfolio)', podstawa: 'art. 6 ust. 1 lit. b RODO — wykonanie umowy', dane: 'zdjęcia, opis, kategoria usług, cennik, kompetencje.' },
                                            { cel: 'Powiadomienia push', podstawa: 'art. 6 ust. 1 lit. a RODO — zgoda użytkownika', dane: 'token urządzenia mobilnego.' },
                                            { cel: 'Bezpieczeństwo i zapobieganie nadużyciom', podstawa: 'art. 6 ust. 1 lit. f RODO — prawnie uzasadniony interes Administratora', dane: 'logi systemowe, adres IP, dane sesji.' },
                                            { cel: 'Wypełnienie obowiązków prawnych', podstawa: 'art. 6 ust. 1 lit. c RODO — obowiązek prawny', dane: 'dane niezbędne do celów podatkowych, rachunkowych lub na żądanie organu.' },
                                            { cel: 'Marketing własny i informowanie o zmianach', podstawa: 'art. 6 ust. 1 lit. f RODO — prawnie uzasadniony interes Administratora', dane: 'adres e-mail zarejestrowanego Konta.' },
                                        ].map(({ cel, podstawa, dane }) => (
                                            <div key={cel} className="bg-gray-50 rounded-2xl p-4 text-sm">
                                                <p className="font-semibold text-gray-900 mb-1">{cel}</p>
                                                <p className="text-gray-500 mb-1"><span className="font-medium text-gray-700">Podstawa:</span> {podstawa}</p>
                                                <p className="text-gray-500"><span className="font-medium text-gray-700">Dane:</span> {dane}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <MapPin className="text-[#6366F1]" size={24} />
                                    §3 Dane szczególnych kategorii i wrażliwe dane funkcjonalne
                                </h3>
                                <div className="pl-9 space-y-4">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="font-semibold text-gray-900 mb-1 flex items-center gap-2"><MapPin size={16} className="text-[#6366F1]" /> Dane lokalizacyjne (GPS)</p>
                                            <p className="text-sm text-gray-600">Aplikacja może uzyskiwać dostęp do Twojej lokalizacji GPS wyłącznie po wyrażeniu przez Ciebie zgody systemowej. Lokalizacja jest wykorzystywana do wyświetlania Usługodawców w Twojej okolicy i nie jest udostępniana innym Użytkownikom bez Twojej wiedzy. Możesz cofnąć dostęp do lokalizacji w ustawieniach systemu operacyjnego urządzenia w dowolnym momencie.</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 mb-1 flex items-center gap-2"><Fingerprint size={16} className="text-[#6366F1]" /> Dane biometryczne (Face ID / Touch ID)</p>
                                            <p className="text-sm text-gray-600">Aplikacja może korzystać z biometrycznego uwierzytelniania (Face ID, Touch ID) dostępnego na Twoim urządzeniu. Dane biometryczne są przetwarzane wyłącznie przez system operacyjny urządzenia i jego bezpieczne enklawy sprzętowe — Administrator nigdy nie otrzymuje ani nie przechowuje Twoich danych biometrycznych.</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 mb-1 flex items-center gap-2"><Eye size={16} className="text-[#6366F1]" /> Zdjęcia i materiały wizualne</p>
                                            <p className="text-sm text-gray-600">Aplikacja może uzyskiwać dostęp do aparatu i galerii zdjęć wyłącznie po wyrażeniu zgody systemowej, w celu przesyłania zdjęć profilowych lub materiałów do portfolio. Aplikacja nie skanuje zawartości galerii w tle.</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 mb-1 flex items-center gap-2"><MessageSquare size={16} className="text-[#6366F1]" /> Wiadomości i komunikacja</p>
                                            <p className="text-sm text-gray-600">Treść wiadomości wymieniana za pośrednictwem czatu jest przechowywana na serwerach Administratora w celu zapewnienia ciągłości komunikacji. Wiadomości mogą być przeglądane przez Administratora wyłącznie w uzasadnionych przypadkach (np. zgłoszenie naruszenia, żądanie organu).</p>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 mb-1 flex items-center gap-2"><Bell size={16} className="text-[#6366F1]" /> Powiadomienia push</p>
                                            <p className="text-sm text-gray-600">Wysyłanie powiadomień push wymaga Twojej zgody systemowej. Token urządzenia jest przechowywany na serwerach Administratora wyłącznie w celu dostarczania powiadomień. Możesz wycofać zgodę w ustawieniach systemu lub Aplikacji.</p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <UserCheck className="text-[#6366F1]" size={24} />
                                    §4 Odbiorcy danych i przekazywanie do państw trzecich
                                </h3>
                                <div className="pl-9 space-y-3">
                                    <p>4.1. Twoje dane osobowe mogą być przekazywane następującym kategoriom odbiorców:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li><strong>Dostawcy infrastruktury technicznej</strong> — serwery, hosting, usługi chmurowe niezbędne do funkcjonowania Serwisu,</li>
                                        <li><strong>Google LLC</strong> — w związku z korzystaniem z logowania przez Google, usług Firebase (powiadomienia push) oraz Google Analytics 4 (analityka ruchu — wyłącznie po wyrażeniu zgody przez użytkownika, z anonimizacją IP),</li>
                                        <li><strong>Meta Platforms, Inc.</strong> — w związku z korzystaniem z logowania przez Facebook,</li>
                                        <li><strong>Apple Inc.</strong> — w związku z dystrybucją Aplikacji przez App Store oraz usługami APNs (powiadomienia push na iOS),</li>
                                        <li><strong>Organy publiczne</strong> — na żądanie uprawnionych organów państwowych w zakresie wynikającym z przepisów prawa.</li>
                                    </ul>
                                    <p>4.2. Dane mogą być przekazywane poza Europejski Obszar Gospodarczy (EOG) — w szczególności do Stanów Zjednoczonych — w przypadku korzystania z usług Google LLC, Meta Platforms, Inc. i Apple Inc. Przekazywanie odbywa się na podstawie standardowych klauzul umownych (SCC) zatwierdzonych przez Komisję Europejską, zgodnie z art. 46 ust. 2 lit. c RODO.</p>
                                    <p>4.3. Administrator nie sprzedaje danych osobowych Użytkowników osobom trzecim.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <Database className="text-[#6366F1]" size={24} />
                                    §5 Okres przechowywania danych
                                </h3>
                                <div className="pl-9 space-y-3">
                                    <p>5.1. Dane osobowe są przechowywane przez okres niezbędny do realizacji celów, dla których zostały zgromadzone:</p>
                                    <div className="space-y-2">
                                        {[
                                            ['Dane Konta', 'przez okres posiadania Konta w Serwisie, a po jego usunięciu przez 30 dni (możliwość przywrócenia), następnie trwale usuwane.'],
                                            ['Wiadomości czatu', 'przez okres posiadania Konta, usuwane wraz z usunięciem Konta.'],
                                            ['Dane bilingowe (jeśli dotyczy)', 'przez 5 lat od końca roku podatkowego, zgodnie z przepisami prawa podatkowego.'],
                                            ['Logi systemowe i bezpieczeństwa', 'przez maksymalnie 12 miesięcy.'],
                                            ['Dane lokalizacyjne (cache)', 'przez okres sesji — nie są trwale przechowywane po zamknięciu Aplikacji.'],
                                            ['Tokeny powiadomień push', 'do czasu cofnięcia zgody lub odinstalowania Aplikacji.'],
                                        ].map(([rodzaj, okres]) => (
                                            <div key={rodzaj} className="bg-gray-50 rounded-xl p-3 text-sm">
                                                <span className="font-semibold text-gray-900">{rodzaj}:</span>{' '}
                                                <span className="text-gray-600">{okres}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <p>5.2. Po upływie okresu przechowywania dane są trwale usuwane lub anonimizowane w taki sposób, że nie jest możliwa identyfikacja osoby, której dotyczą.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <ShieldCheck className="text-[#6366F1]" size={24} />
                                    §6 Prawa osób, których dane dotyczą
                                </h3>
                                <div className="pl-9 space-y-3">
                                    <p>Na podstawie RODO przysługują Ci następujące prawa w odniesieniu do Twoich danych osobowych:</p>
                                    <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl">
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-indigo-800 font-medium">
                                            {[
                                                ['Prawo dostępu (art. 15 RODO)', 'możesz uzyskać informację o przetwarzanych danych i kopię danych.'],
                                                ['Prawo do sprostowania (art. 16 RODO)', 'możesz żądać poprawienia nieprawidłowych lub uzupełnienia niekompletnych danych.'],
                                                ['Prawo do usunięcia (art. 17 RODO)', 'możesz żądać usunięcia danych, gdy nie są już potrzebne do celu, w jakim zostały zebrane.'],
                                                ['Prawo do ograniczenia (art. 18 RODO)', 'możesz żądać ograniczenia przetwarzania danych w określonych przypadkach.'],
                                                ['Prawo do przenoszenia (art. 20 RODO)', 'możesz otrzymać dane w ustrukturyzowanym formacie i przekazać je innemu administratorowi.'],
                                                ['Prawo sprzeciwu (art. 21 RODO)', 'możesz sprzeciwić się przetwarzaniu opartemu na prawnie uzasadnionym interesie.'],
                                                ['Prawo do cofnięcia zgody (art. 7 RODO)', 'jeśli podstawą jest zgoda, możesz ją cofnąć w każdym czasie bez wpływu na wcześniejsze przetwarzanie.'],
                                                ['Prawo do skargi (art. 77 RODO)', 'możesz wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (uodo.gov.pl).'],
                                            ].map(([prawo, opis]) => (
                                                <li key={prawo} className="flex items-start gap-2">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1] mt-1.5 shrink-0"></span>
                                                    <span><span className="font-bold">{prawo}</span> — {opis}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <p>Realizacja praw następuje na pisemny lub elektroniczny wniosek skierowany na adres <span className="text-[#6366F1] font-medium">prywatnosc@lokalni.pl</span>. Administrator odpowiada w terminie 30 dni od daty otrzymania wniosku (termin może zostać przedłużony o kolejne 60 dni przy złożonych żądaniach).</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <Cookie className="text-[#6366F1]" size={24} />
                                    §7 Pliki cookies i podobne technologie
                                </h3>
                                <div className="pl-9 space-y-3">
                                    <p>7.1. Serwis w wersji webowej (lokalni.pl) wykorzystuje pliki cookies oraz podobne technologie przechowywania danych po stronie klienta.</p>
                                    <p>7.2. Stosowane są następujące kategorie cookies:</p>
                                    <div className="space-y-2">
                                        {[
                                            ['Niezbędne (sesyjne)', 'Wymagane do prawidłowego działania Serwisu — utrzymanie sesji zalogowanego Użytkownika i tokenu odświeżania. Nie wymagają zgody.', 'Session / httpOnly'],
                                            ['Funkcjonalne', 'Zapamiętywanie preferencji Użytkownika (wybrana lokalizacja, tryb wyświetlania). Wymagają zgody.', 'Lokalne (localStorage)'],
                                            ['Analityczne', 'Zbieranie anonimowych statystyk ruchu w celu poprawy funkcjonowania Serwisu. Wymagają zgody.', 'Do 24 miesięcy'],
                                        ].map(([nazwa, opis, czas]) => (
                                            <div key={nazwa} className="bg-gray-50 rounded-xl p-3 text-sm">
                                                <p className="font-semibold text-gray-900">{nazwa}</p>
                                                <p className="text-gray-600">{opis}</p>
                                                <p className="text-gray-400 text-xs mt-1">Okres: {czas}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <p>7.3. Możesz zarządzać plikami cookies za pośrednictwem ustawień przeglądarki internetowej. Wyłączenie cookies niezbędnych może uniemożliwić korzystanie z niektórych funkcji Serwisu.</p>
                                    <p>7.4. Aplikacja mobilna nie wykorzystuje plików cookies. Zamiast tego korzysta z bezpiecznego magazynu systemowego (iOS Keychain, Android Keystore) do przechowywania tokenów uwierzytelniających.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <Lock className="text-[#6366F1]" size={24} />
                                    §8 Bezpieczeństwo danych
                                </h3>
                                <div className="pl-9 space-y-3">
                                    <p>8.1. Administrator stosuje odpowiednie środki techniczne i organizacyjne w celu ochrony danych osobowych przed nieautoryzowanym dostępem, ujawnieniem, zmianą lub zniszczeniem, w szczególności:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li>szyfrowanie transmisji danych przy użyciu protokołu TLS/HTTPS,</li>
                                        <li>przechowywanie tokenów dostępu wyłącznie w pamięci operacyjnej aplikacji (nie w localStorage — ochrona przed XSS),</li>
                                        <li>przechowywanie tokenów odświeżania w bezpiecznym magazynie systemowym (iOS Keychain / Android Keystore) lub w pliku cookie httpOnly (web),</li>
                                        <li>szyfrowanie haseł przy użyciu silnych algorytmów kryptograficznych,</li>
                                        <li>stosowanie polityki Content Security Policy (CSP) i nagłówków bezpieczeństwa HTTP (HSTS, X-Frame-Options),</li>
                                        <li>ograniczenie dostępu do danych do uprawnionych pracowników i współpracowników na zasadzie niezbędności.</li>
                                    </ul>
                                    <p>8.2. Pomimo stosowania wskazanych środków Administrator informuje, że żaden system informatyczny nie jest w stanie zagwarantować całkowitego bezpieczeństwa. W razie podejrzenia naruszenia bezpieczeństwa Twoich danych prosimy o niezwłoczny kontakt.</p>
                                    <p>8.3. W przypadku naruszenia ochrony danych osobowych mogącego powodować ryzyko naruszenia praw lub wolności osób fizycznych, Administrator poinformuje Prezesa UODO bez zbędnej zwłoki (nie później niż w ciągu 72 godzin) oraz poinformuje Użytkowników, których dane dotyczą, jeśli naruszenie może powodować wysokie ryzyko.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <Eye className="text-[#6366F1]" size={24} />
                                    §9 Profilowanie i zautomatyzowane podejmowanie decyzji
                                </h3>
                                <div className="pl-9 space-y-3">
                                    <p>9.1. Administrator może stosować profilowanie w celu dostosowania wyników wyszukiwania i kolejności wyświetlania Profili Usługodawców do lokalizacji i preferencji Użytkownika. Profilowanie nie skutkuje automatycznym podejmowaniem decyzji wywołujących skutki prawne ani istotnie na Ciebie wpływających w rozumieniu art. 22 RODO.</p>
                                    <p>9.2. Użytkownik ma prawo do wyrażenia sprzeciwu wobec profilowania na podstawie art. 21 RODO, kierując stosowny wniosek na adres prywatnosc@lokalni.pl.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <UserCheck className="text-[#6366F1]" size={24} />
                                    §10 Ochrona danych małoletnich
                                </h3>
                                <div className="pl-9 space-y-3">
                                    <p>10.1. Serwis jest dostępny dla osób, które ukończyły <strong>13 lat</strong>. Administrator nie gromadzi świadomie danych osobowych od dzieci poniżej 13. roku życia. W przypadku powzięcia informacji o takim przetwarzaniu Administrator niezwłocznie usunie dane i Konto.</p>
                                    <p>10.2. W stosunku do Użytkowników w wieku <strong>13–15 lat</strong> podstawą przetwarzania danych osobowych jest zgoda rodzica lub opiekuna prawnego, udzielona w trybie art. 8 RODO. Administrator przetwarza w tym celu adres e-mail rodzica/opiekuna wyłącznie do momentu potwierdzenia zgody lub odrzucenia wniosku rejestracyjnego — po tym czasie adres jest trwale usuwany, chyba że rodzic/opiekun złożył odrębne żądanie jego zachowania.</p>
                                    <p>10.3. Rodzic lub opiekun prawny, który wyraził zgodę na rejestrację dziecka, ma prawo do:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li>wglądu w dane osobowe dziecka przetwarzane przez Administratora,</li>
                                        <li>żądania usunięcia Konta dziecka lub wycofania zgody — żądanie kieruj na adres <span className="text-[#6366F1] font-medium">prywatnosc@lokalni.pl</span>,</li>
                                        <li>cofnięcia wyrażonej zgody w dowolnym momencie; cofnięcie zgody nie narusza zgodności z prawem przetwarzania dokonanego przed jej cofnięciem.</li>
                                    </ul>
                                    <p>10.4. W stosunku do Użytkowników w wieku <strong>16–17 lat</strong> rejestracja odbywa się samodzielnie, a podstawą przetwarzania danych jest wykonanie umowy o świadczenie usług drogą elektroniczną (art. 6 ust. 1 lit. b RODO). Dane tej grupy wiekowej są przetwarzane na identycznych zasadach jak dane osób pełnoletnich.</p>
                                    <p>10.5. Administrator stosuje środki techniczne i organizacyjne zaprojektowane z myślą o ochronie prywatności małoletnich, w szczególności ogranicza zakres zbieranych danych do minimum niezbędnego do świadczenia usług.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <ShieldCheck className="text-[#6366F1]" size={24} />
                                    §11 Zmiany Polityki Prywatności
                                </h3>
                                <div className="pl-9 space-y-3">
                                    <p>11.1. Administrator zastrzega sobie prawo do zmiany niniejszej Polityki Prywatności w uzasadnionych przypadkach, w szczególności w związku ze zmianą przepisów prawa, zmianą zakresu świadczonych usług lub wytycznych organów ochrony danych.</p>
                                    <p>11.2. O każdej istotnej zmianie Użytkownicy zostaną poinformowani co najmniej <strong>14 dni wcześniej</strong> poprzez powiadomienie w Aplikacji lub wiadomość e-mail na adres przypisany do Konta.</p>
                                    <p>11.3. Aktualna wersja Polityki Prywatności jest zawsze dostępna w Aplikacji w sekcji „Informacje" oraz na stronie lokalni.pl/prywatnosc.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                                    <ShieldCheck className="text-[#6366F1]" size={24} />
                                    §12 Skarga do organu nadzorczego
                                </h3>
                                <div className="pl-9 space-y-3">
                                    <p>12.1. Jeśli uważasz, że przetwarzanie Twoich danych osobowych narusza przepisy RODO lub ustawy z dnia 10 maja 2018 r. o ochronie danych osobowych, masz prawo wniesienia skargi do organu nadzorczego:</p>
                                    <div className="bg-gray-50 rounded-2xl p-4 text-sm">
                                        <p className="font-bold text-gray-900">Prezes Urzędu Ochrony Danych Osobowych (PUODO)</p>
                                        <p className="text-gray-600">ul. Stawki 2, 00-193 Warszawa</p>
                                        <p className="text-gray-600">Telefon: 22 531 03 00</p>
                                        <p className="text-[#6366F1] font-medium">uodo.gov.pl</p>
                                    </div>
                                    <p>12.2. Przed złożeniem skargi zachęcamy do wcześniejszego kontaktu z Administratorem — dążymy do polubownego rozwiązania wszelkich wątpliwości.</p>
                                </div>
                            </section>

                            <div className="border-t border-gray-100 pt-10 mt-10">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-50 p-6 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-3 rounded-xl shadow-sm">
                                            <Mail className="text-[#6366F1]" size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Pytania dotyczące prywatności?</p>
                                            <p className="text-xs text-gray-500">Napisz do nas — odpowiemy w ciągu 30 dni.</p>
                                        </div>
                                    </div>
                                    <a
                                        href="mailto:prywatnosc@lokalni.pl"
                                        className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors active:scale-95 text-center"
                                    >
                                        prywatnosc@lokalni.pl
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
