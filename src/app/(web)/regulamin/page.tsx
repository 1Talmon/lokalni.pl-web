import type { Metadata } from 'next';
import { FileText, Scale, Mail, AlertTriangle } from 'lucide-react';
import { BackButton } from '../_components/BackButton';
import { BASE_URL } from '@/lib/seo-data';

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

function SectionBadge({ n }: { n: number }) {
    return (
        <span className="bg-indigo-50 text-[#6366F1] w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">{n}</span>
    );
}

export default function TermsPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />
            <div className="min-h-screen bg-gray-50 pb-20">
                <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
                        <BackButton />
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <FileText size={20} className="text-[#6366F1]" />
                            Regulamin Serwisu
                        </h1>
                    </div>
                </div>

                <div className="max-w-3xl mx-auto px-6 py-12">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">

                        <div className="mb-10 text-center">
                            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Regulamin świadczenia usług</h2>
                            <p className="text-gray-500 text-sm">Ostatnia aktualizacja: 23 sierpnia 2026 r.</p>
                        </div>

                        <div className="space-y-10 text-gray-700 leading-relaxed">

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <SectionBadge n={1} />
                                    Postanowienia ogólne
                                </h3>
                                <div className="space-y-3 pl-10">
                                    <p>1.1. Niniejszy Regulamin określa zasady i warunki korzystania z serwisu internetowego oraz aplikacji mobilnej „MyLokalni.pl", dostępnych pod adresem <strong>lokalni.pl</strong> oraz w sklepach App Store i Google Play (dalej: „Serwis" lub „Aplikacja").</p>
                                    <p>1.2. Operatorem Serwisu jest <strong>[PEŁNA NAZWA FIRMY]</strong>, z siedzibą w [ADRES], wpisana do [KRS / CEiDG], NIP: [NIP] (dalej: „Operator"). Kontakt: <span className="text-[#6366F1] font-medium">kontakt@lokalni.pl</span>.</p>
                                    <p>1.3. Regulamin jest udostępniany nieodpłatnie za pośrednictwem Serwisu, w formie umożliwiającej jego pobranie, utrwalenie i wydrukowanie. Przed założeniem Konta Użytkownik jest zobowiązany zapoznać się z jego treścią.</p>
                                    <p>1.4. Korzystanie z Serwisu jest równoznaczne z zapoznaniem się z niniejszym Regulaminem i jego akceptacją.</p>
                                    <p>1.5. Regulamin został wydany na podstawie:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li>Ustawy z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną (Dz.U. 2002 nr 144 poz. 1204 ze zm.),</li>
                                        <li>Ustawy z dnia 30 maja 2014 r. o prawach konsumenta (Dz.U. 2014 poz. 827 ze zm.),</li>
                                        <li>Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 r. w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych (RODO),</li>
                                        <li>Ustawy z dnia 23 kwietnia 1964 r. Kodeks cywilny (Dz.U. 1964 nr 16 poz. 93 ze zm.),</li>
                                        <li>Ustawy z dnia 16 lipca 2004 r. Prawo telekomunikacyjne (Dz.U. 2004 nr 171 poz. 1800 ze zm.).</li>
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <SectionBadge n={2} />
                                    Definicje
                                </h3>
                                <div className="pl-10 space-y-2">
                                    {[
                                        ['Serwis / Aplikacja', 'platforma internetowa i mobilna dostępna pod adresem lokalni.pl oraz w formie aplikacji na urządzenia z systemem iOS i Android, umożliwiająca połączenie Usługodawców z Klientami.'],
                                        ['Operator', 'podmiot zarządzający Serwisem, wskazany w §1 ust. 1.2.'],
                                        ['Użytkownik', 'każda osoba fizyczna, która ukończyła 13 lat i zawarła z Operatorem umowę o świadczenie usług drogą elektroniczną poprzez rejestrację Konta. Osoby w wieku 13–15 lat rejestrują się za zgodą rodzica lub opiekuna prawnego; osoby w wieku 16–17 lat rejestrują się samodzielnie przy ograniczonej zdolności do czynności prawnych; osoby pełnoletnie korzystają z Serwisu bez ograniczeń wiekowych.'],
                                        ['Usługodawca', 'Użytkownik, który w Serwisie prezentuje swoje usługi, umiejętności lub portfolio, w celu nawiązania współpracy z Klientami.'],
                                        ['Klient', 'Użytkownik poszukujący usług lub specjalistów za pośrednictwem Serwisu.'],
                                        ['Konto', 'zbiór zasobów i uprawnień w Serwisie przypisanych danemu Użytkownikowi, dostępny po rejestracji i zalogowaniu się.'],
                                        ['Profil', 'publiczna wizytówka Usługodawcy widoczna dla pozostałych Użytkowników Serwisu.'],
                                        ['Plan Premium', 'płatny pakiet rozszerzonych funkcjonalności dostępny dla Usługodawców, opisany w §9.'],
                                        ['Treści', 'wszelkie materiały zamieszczane przez Użytkowników w Serwisie, w tym zdjęcia, opisy, opinie, wiadomości, posty i aktualności.'],
                                        ['Rezerwacja', 'zaplanowane spotkanie lub usługa pomiędzy Klientem a Usługodawcą, zorganizowane za pośrednictwem funkcji kalendarza Serwisu.'],
                                    ].map(([term, def]) => (
                                        <p key={term}><strong>{term}</strong> – {def}</p>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <SectionBadge n={3} />
                                    Rodzaje i zakres usług elektronicznych
                                </h3>
                                <div className="pl-10 space-y-3">
                                    <p>3.1. Operator świadczy na rzecz Użytkowników <strong>nieodpłatnie</strong> następujące usługi drogą elektroniczną:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li>prowadzenie i obsługa Konta Użytkownika,</li>
                                        <li>możliwość przeglądania Profili Usługodawców i kategorii usług,</li>
                                        <li>wyszukiwanie Usługodawców według lokalizacji i kategorii,</li>
                                        <li>korzystanie z wewnętrznego systemu wiadomości (czat),</li>
                                        <li>dodawanie Usługodawców do ulubionych,</li>
                                        <li>wystawianie i przeglądanie opinii,</li>
                                        <li>przeglądanie kalendarza dostępności Usługodawców.</li>
                                    </ul>
                                    <p>3.2. Operator może świadczyć <strong>odpłatnie</strong> usługi w ramach Planu Premium, obejmujące rozszerzone funkcjonalności Profilu, o których mowa w §9.</p>
                                    <p>3.3. Serwis stanowi wyłącznie platformę pośredniczącą, umożliwiającą kontakt pomiędzy Usługodawcami a Klientami. Operator nie jest stroną jakichkolwiek umów zawieranych pomiędzy Użytkownikami i nie ponosi odpowiedzialności za ich wykonanie.</p>
                                    <p>3.4. Umowa o świadczenie usług drogą elektroniczną zostaje zawarta z chwilą skutecznej rejestracji Konta i trwa do momentu jego usunięcia.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <SectionBadge n={4} />
                                    Wymagania techniczne
                                </h3>
                                <div className="pl-10 space-y-3">
                                    <p>4.1. Do korzystania z Serwisu niezbędne jest:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li>dla wersji webowej: dostęp do Internetu oraz przeglądarka internetowa z obsługą JavaScript i plików cookies (zalecane: Chrome 90+, Safari 14+, Firefox 88+, Edge 90+),</li>
                                        <li>dla Aplikacji mobilnej: urządzenie z systemem iOS 15.0+ lub Android 8.0+, aktywne połączenie z Internetem.</li>
                                    </ul>
                                    <p>4.2. Operator nie ponosi odpowiedzialności za brak możliwości korzystania z Serwisu wynikający z niespełnienia przez Użytkownika powyższych wymagań technicznych.</p>
                                    <p>4.3. Korzystanie z niektórych funkcji (lokalizacja, powiadomienia, aparat) wymaga udzielenia odpowiednich uprawnień systemowych na urządzeniu mobilnym. Użytkownik może zarządzać tymi uprawnieniami w ustawieniach systemu operacyjnego.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <SectionBadge n={5} />
                                    Rejestracja i Konto Użytkownika
                                </h3>
                                <div className="pl-10 space-y-3">
                                    <p>5.1. Korzystanie z pełnej funkcjonalności Serwisu wymaga rejestracji i założenia Konta.</p>
                                    <p>5.2. Serwis jest dostępny dla osób, które ukończyły <strong>13 lat</strong>. Rejestracja przebiega w zależności od wieku:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li><strong>Osoby w wieku 13–15 lat</strong> — rejestracja wymaga uprzedniej, weryfikowalnej zgody rodzica lub opiekuna prawnego, udzielonej za pośrednictwem mechanizmu potwierdzenia e-mail wbudowanego w Aplikację (art. 8 RODO). Konto zostaje aktywowane dopiero po potwierdzeniu zgody przez rodzica/opiekuna.</li>
                                        <li><strong>Osoby w wieku 16–17 lat</strong> — rejestracja samodzielna; w zakresie zawierania umów w Serwisie zastosowanie mają przepisy o ograniczonej zdolności do czynności prawnych (art. 15 i następne Kodeksu cywilnego).</li>
                                        <li><strong>Osoby pełnoletnie (18 lat i więcej)</strong> — rejestracja samodzielna, bez ograniczeń wiekowych.</li>
                                    </ul>
                                    <p>5.3. Każdy Użytkownik, niezależnie od wieku, zobowiązany jest do:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li>zaakceptowania niniejszego Regulaminu oraz Polityki Prywatności,</li>
                                        <li>wyrażenia wymaganych zgód na przetwarzanie danych osobowych.</li>
                                    </ul>
                                    <p>5.4. Rejestracja następuje poprzez podanie adresu e-mail i hasła lub zalogowanie się za pośrednictwem konta Google albo Facebook.</p>
                                    <p>5.5. Użytkownik zobowiązany jest do podania prawdziwych, aktualnych i kompletnych danych. Podanie nieprawdziwych danych, w tym fałszywego wieku, może skutkować usunięciem Konta.</p>
                                    <p>5.6. Użytkownik jest zobowiązany do zachowania w tajemnicy danych logowania i ponosi pełną odpowiedzialność za działania podjęte z użyciem jego Konta przez osoby trzecie w wyniku ujawnienia przez Użytkownika hasła.</p>
                                    <p>5.7. Jeden Użytkownik może posiadać tylko jedno Konto. Operator zastrzega sobie prawo do usunięcia zduplikowanych Kont.</p>
                                    <p>5.8. Konto jest niezbywalne — Użytkownik nie może przenosić praw do Konta na osoby trzecie.</p>
                                    <p>5.9. W przypadku podejrzenia naruszenia bezpieczeństwa Konta, Użytkownik zobowiązany jest niezwłocznie poinformować Operatora na adres kontakt@lokalni.pl.</p>
                                    <p>5.10. <strong>Ochrona małoletnich.</strong> W odniesieniu do Użytkowników poniżej 18. roku życia Operator stosuje dodatkowe środki ochrony:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li>Konto osoby w wieku 13–15 lat może zostać zablokowane lub usunięte na żądanie rodzica lub opiekuna prawnego złożone na adres kontakt@lokalni.pl,</li>
                                        <li>Operator dokłada starań, aby Treści nieodpowiednie dla osób nieletnich nie były dostępne w Serwisie,</li>
                                        <li>rodzic lub opiekun prawny, który wyraził zgodę na rejestrację osoby w wieku 13–15 lat, ponosi odpowiedzialność za korzystanie przez nią z Serwisu w zakresie wynikającym z przepisów powszechnie obowiązującego prawa,</li>
                                        <li>Operator nie zbiera świadomie danych osobowych od osób poniżej 13. roku życia; jeśli Operator dowie się, że takie dane zostały pozyskane, niezwłocznie je usunie.</li>
                                    </ul>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <SectionBadge n={6} />
                                    Zasady korzystania z Serwisu
                                </h3>
                                <div className="pl-10 space-y-3">
                                    <p>6.1. Użytkownik zobowiązuje się do korzystania z Serwisu zgodnie z jego przeznaczeniem, niniejszym Regulaminem, dobrymi obyczajami oraz powszechnie obowiązującymi przepisami prawa.</p>
                                    <p>6.2. Zabrania się w szczególności:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li>zamieszczania treści bezprawnych, obraźliwych, pornograficznych, nawołujących do nienawiści lub dyskryminujących ze względu na rasę, płeć, narodowość, wyznanie lub inne cechy chronione prawem,</li>
                                        <li>podszywania się pod inne osoby lub podmioty,</li>
                                        <li>rozsyłania spamu lub niezamówionych wiadomości handlowych,</li>
                                        <li>wykorzystywania Serwisu do działalności sprzecznej z jego przeznaczeniem lub celami komercyjnymi niezwiązanymi z platformą,</li>
                                        <li>ingerowania w działanie Serwisu, jego kodu źródłowego, baz danych lub infrastruktury serwerowej,</li>
                                        <li>zamieszczania fałszywych, wprowadzających w błąd opinii lub recenzji,</li>
                                        <li>stosowania technik automatycznego pobierania danych (web scraping, crawling),</li>
                                        <li>naruszania praw własności intelektualnej Operatora lub osób trzecich,</li>
                                        <li>zamieszczania treści reklamowych bez zgody Operatora.</li>
                                    </ul>
                                    <p>6.3. Operator zastrzega sobie prawo do usuwania Treści naruszających Regulamin bez uprzedniego powiadamiania Użytkownika.</p>
                                    <p>6.4. W przypadku rażącego lub powtarzającego się naruszenia Regulaminu, Operator może zablokować lub usunąć Konto Użytkownika ze skutkiem natychmiastowym.</p>
                                    <p>6.5. Użytkownik może zgłaszać Treści naruszające Regulamin za pośrednictwem funkcji „Zgłoś" dostępnej w Aplikacji.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <SectionBadge n={7} />
                                    Profil Usługodawcy
                                </h3>
                                <div className="pl-10 space-y-3">
                                    <p>7.1. Każdy Użytkownik może uzupełnić swój Profil jako Usługodawca, prezentując zakres swoich usług, umiejętności, portfolio i cennik.</p>
                                    <p>7.2. Usługodawca przyjmuje do wiadomości, że:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li>informacje zawarte w Profilu są widoczne publicznie dla wszystkich Użytkowników Serwisu,</li>
                                        <li>ponosi wyłączną odpowiedzialność za prawdziwość, rzetelność i aktualność zamieszczonych informacji,</li>
                                        <li>certyfikaty, kwalifikacje i uprawnienia wskazane w Profilu powinny odzwierciedlać faktycznie posiadane kompetencje i dokumenty,</li>
                                        <li>zdjęcia zamieszczone w Profilu nie mogą naruszać praw osób trzecich ani zawierać treści, o których mowa w §6 ust. 6.2.</li>
                                    </ul>
                                    <p>7.3. Operator nie weryfikuje tożsamości ani kwalifikacji Usługodawców. Klienci nawiązują współpracę z Usługodawcami na własną odpowiedzialność i we własnym zakresie dokonują ich weryfikacji.</p>
                                    <p>7.4. Usługodawca może udostępnić Klientom swój kalendarz dostępności za pośrednictwem funkcji dostępnych w Serwisie.</p>
                                    <p>7.5. Operator zastrzega sobie prawo do moderowania lub usunięcia Profilu, który narusza postanowienia Regulaminu.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <SectionBadge n={8} />
                                    Komunikacja w Serwisie
                                </h3>
                                <div className="pl-10 space-y-3">
                                    <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3">
                                        <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                                        <p className="text-sm text-red-800">Nigdy nie udostępniaj swoich danych logowania, haseł ani pełnych danych kart płatniczych za pośrednictwem czatu. Serwis nie będzie o to prosić.</p>
                                    </div>
                                    <p>8.1. Serwis udostępnia wewnętrzny system wiadomości (czat) umożliwiający komunikację pomiędzy Użytkownikami w celu uzgodnienia szczegółów współpracy.</p>
                                    <p>8.2. Użytkownik zobowiązuje się do korzystania z czatu wyłącznie w celach zgodnych z przeznaczeniem Serwisu.</p>
                                    <p>8.3. Za pośrednictwem czatu zabrania się:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li>zamieszczania treści, o których mowa w §6 ust. 6.2,</li>
                                        <li>udostępniania danych logowania, haseł lub danych instrumentów płatniczych,</li>
                                        <li>nakłaniania do dokonania płatności w sposób niezgodny z prawem lub poza systemem Serwisu,</li>
                                        <li>rozsyłania materiałów reklamowych bez zgody odbiorcy.</li>
                                    </ul>
                                    <p>8.4. Operator nie ponosi odpowiedzialności za treść wiadomości wymienianych pomiędzy Użytkownikami. Operator zastrzega sobie prawo do ich moderacji na żądanie uprawnionego organu lub w przypadku uzasadnionego podejrzenia naruszenia Regulaminu.</p>
                                    <p>8.5. Wiadomości mogą być przechowywane przez Operatora przez okres niezbędny do realizacji usług i celów bezpieczeństwa, zgodnie z Polityką Prywatności.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <SectionBadge n={9} />
                                    Płatności i Plan Premium
                                </h3>
                                <div className="pl-10 space-y-3">
                                    <p>9.1. Podstawowe funkcje Serwisu — rejestracja, przeglądanie Profili, korzystanie z czatu — są dostępne <strong>nieodpłatnie</strong>.</p>
                                    <p>9.2. Operator może oferować płatny <strong>Plan Premium</strong> dla Usługodawców, obejmujący rozszerzone funkcjonalności, takie jak:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li>zaawansowany Profil ze zdjęciem w tle i rozbudowanym opisem,</li>
                                        <li>moduł kalendarza i rezerwacji dla Klientów,</li>
                                        <li>sekcja certyfikatów i kompetencji,</li>
                                        <li>możliwość publikowania aktualności i postów,</li>
                                        <li>wyróżnienie Profilu w wynikach wyszukiwania.</li>
                                    </ul>
                                    <p>9.3. Szczegółowe informacje o aktualnych planach cenowych, metodach płatności i warunkach subskrypcji będą udostępniane w Serwisie w chwili uruchomienia płatnych funkcjonalności. O ich wprowadzeniu Użytkownicy zostaną poinformowani z co najmniej 14-dniowym wyprzedzeniem.</p>
                                    <p>9.4. <strong>Operator nie jest stroną transakcji finansowych</strong> zawieranych bezpośrednio pomiędzy Usługodawcami a Klientami i nie pośredniczy w ich realizacji ani rozliczaniu.</p>
                                    <p>9.5. Wszelkie rozliczenia pomiędzy Użytkownikami odbywają się poza Serwisem, na warunkach uzgodnionych samodzielnie przez strony.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <SectionBadge n={10} />
                                    Odpowiedzialność
                                </h3>
                                <div className="pl-10 space-y-3">
                                    <p>10.1. Operator nie ponosi odpowiedzialności za:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li>treści zamieszczane przez Użytkowników w Serwisie,</li>
                                        <li>działania lub zaniechania Użytkowników, w tym jakość, bezpieczeństwo ani legalność świadczonych przez nich usług,</li>
                                        <li>niewykonanie lub nienależyte wykonanie umów zawartych pomiędzy Użytkownikami,</li>
                                        <li>przerwy w dostępności Serwisu wynikające z przyczyn technicznych, konserwacyjnych lub działania siły wyższej,</li>
                                        <li>szkody wynikłe z korzystania z Konta przez osoby trzecie na skutek ujawnienia przez Użytkownika danych logowania,</li>
                                        <li>utratę danych spowodowaną działaniem osób trzecich lub czynnikami niezależnymi od Operatora.</li>
                                    </ul>
                                    <p>10.2. Operator dokłada należytej staranności, aby zapewnić prawidłowe i bezprzerwane funkcjonowanie Serwisu, lecz nie gwarantuje jego nieprzerwanej dostępności.</p>
                                    <p>10.3. Odpowiedzialność Operatora wobec Użytkowników niebędących konsumentami jest ograniczona do szkód wyrządzonych z winy umyślnej Operatora.</p>
                                    <p>10.4. Wobec Użytkowników będących konsumentami zastosowanie mają bezwzględnie obowiązujące przepisy ustawy o prawach konsumenta oraz Kodeksu cywilnego, których niniejszy Regulamin nie wyłącza ani nie ogranicza.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <SectionBadge n={11} />
                                    Prawa własności intelektualnej
                                </h3>
                                <div className="pl-10 space-y-3">
                                    <p>11.1. Wszelkie prawa do Serwisu, w tym prawa autorskie do kodu źródłowego, szaty graficznej, logotypów, nazwy „MyLokalni.pl" oraz pozostałych elementów stanowiących utwór w rozumieniu ustawy z dnia 4 lutego 1994 r. o prawie autorskim i prawach pokrewnych, przysługują Operatorowi lub podmiotom, od których Operator nabył stosowne licencje.</p>
                                    <p>11.2. Użytkownik, zamieszczając Treści w Serwisie, udziela Operatorowi nieodpłatnej, niewyłącznej, nieograniczonej terytorialnie licencji na ich wykorzystanie w celu świadczenia usług Serwisu i jego promocji, na polach eksploatacji obejmujących: utrwalanie, zwielokrotnianie, wyświetlanie i publiczne udostępnianie.</p>
                                    <p>11.3. Użytkownik oświadcza, że zamieszczane przez niego Treści są jego autorstwa lub posiada do nich odpowiednie prawa, a ich publikacja nie narusza praw osób trzecich.</p>
                                    <p>11.4. Zabronione jest kopiowanie, powielanie lub dystrybucja jakichkolwiek elementów Serwisu bez pisemnej zgody Operatora.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <SectionBadge n={12} />
                                    Reklamacje
                                </h3>
                                <div className="pl-10 space-y-3">
                                    <p>12.1. Wszelkie reklamacje dotyczące funkcjonowania Serwisu należy zgłaszać:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li>drogą elektroniczną na adres: <span className="text-[#6366F1] font-medium">kontakt@lokalni.pl</span>,</li>
                                        <li>poprzez formularz kontaktowy dostępny w Aplikacji w sekcji „Pomoc i wsparcie".</li>
                                    </ul>
                                    <p>12.2. Reklamacja powinna zawierać: imię i nazwisko lub nazwę Użytkownika, adres e-mail przypisany do Konta, opis zgłaszanego problemu wraz z datą zdarzenia.</p>
                                    <p>12.3. Operator rozpatruje reklamację w terminie <strong>14 dni roboczych</strong> od daty jej otrzymania i informuje Użytkownika o sposobie rozpatrzenia drogą elektroniczną.</p>
                                    <p>12.4. Konsument ma prawo skorzystać z pozasądowych sposobów rozpatrywania reklamacji i dochodzenia roszczeń. Szczegółowe informacje dostępne są na stronie Urzędu Ochrony Konkurencji i Konsumentów (uokik.gov.pl) oraz platformie ODR Komisji Europejskiej (ec.europa.eu/consumers/odr).</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <SectionBadge n={13} />
                                    Rozwiązanie umowy i usunięcie Konta
                                </h3>
                                <div className="pl-10 space-y-3">
                                    <p>13.1. Użytkownik może w dowolnym momencie rozwiązać umowę o świadczenie usług drogą elektroniczną i usunąć Konto poprzez:</p>
                                    <ul className="list-disc pl-6 space-y-1 marker:text-[#6366F1] text-sm">
                                        <li>skorzystanie z opcji „Usuń konto" dostępnej w ustawieniach Aplikacji,</li>
                                        <li>wysłanie żądania na adres kontakt@lokalni.pl.</li>
                                    </ul>
                                    <p>13.2. Usunięcie Konta skutkuje trwałym usunięciem danych Użytkownika z Serwisu, z wyjątkiem danych, które Operator jest zobowiązany przechowywać na podstawie przepisów prawa (np. dane niezbędne do rozliczeń podatkowych lub obrony roszczeń).</p>
                                    <p>13.3. Operator może rozwiązać umowę z Użytkownikiem z zachowaniem <strong>14-dniowego okresu wypowiedzenia</strong>, informując go o tym drogą elektroniczną, bez podania przyczyny.</p>
                                    <p>13.4. Operator może usunąć Konto <strong>ze skutkiem natychmiastowym</strong> w przypadku rażącego naruszenia Regulaminu, w szczególności zamieszczania treści bezprawnych lub działania na szkodę innych Użytkowników.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <SectionBadge n={14} />
                                    Zmiany Regulaminu
                                </h3>
                                <div className="pl-10 space-y-3">
                                    <p>14.1. Operator zastrzega sobie prawo do zmiany niniejszego Regulaminu z ważnych przyczyn, w szczególności w przypadku zmian przepisów prawa, zmian zakresu świadczonych usług lub wymogów technicznych.</p>
                                    <p>14.2. O każdej zmianie Regulaminu Operator informuje Użytkownika z co najmniej <strong>14-dniowym wyprzedzeniem</strong>, poprzez powiadomienie w Aplikacji lub wiadomość e-mail na adres przypisany do Konta.</p>
                                    <p>14.3. Jeżeli Użytkownik nie akceptuje nowego brzmienia Regulaminu, jest uprawniony do usunięcia Konta przed datą wejścia zmian w życie. Dalsze korzystanie z Serwisu po tej dacie jest równoznaczne z akceptacją zmian.</p>
                                </div>
                            </section>

                            <section>
                                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <SectionBadge n={15} />
                                    Postanowienia końcowe
                                </h3>
                                <div className="pl-10 space-y-3">
                                    <p>15.1. W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają przepisy powszechnie obowiązującego prawa polskiego, w szczególności Kodeksu cywilnego oraz ustawy o świadczeniu usług drogą elektroniczną.</p>
                                    <p>15.2. Ewentualne spory pomiędzy Operatorem a Użytkownikiem niebędącym konsumentem będą rozstrzygane przez sąd właściwy dla siedziby Operatora.</p>
                                    <p>15.3. Konsument ma prawo do skorzystania z pozasądowego rozstrzygania sporów konsumenckich, w szczególności za pośrednictwem platformy ODR dostępnej pod adresem ec.europa.eu/consumers/odr. Operator nie jest zobowiązany i nie wyraża zgody na korzystanie z pozasądowego rozwiązywania sporów wobec podmiotów niebędących konsumentami.</p>
                                    <p>15.4. Jeżeli którekolwiek postanowienie Regulaminu zostanie uznane za nieważne lub bezskuteczne, pozostałe postanowienia zachowują moc wiążącą.</p>
                                    <p>15.5. Niniejszy Regulamin obowiązuje od dnia 23 sierpnia 2026 r.</p>
                                </div>
                            </section>

                            <div className="border-t border-gray-100 pt-10 mt-10">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-gray-50 p-6 rounded-2xl">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white p-3 rounded-xl shadow-sm">
                                            <Scale className="text-[#6366F1]" size={24} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">Pytania dotyczące Regulaminu?</p>
                                            <p className="text-xs text-gray-500">Chętnie wyjaśnimy wszelkie wątpliwości.</p>
                                        </div>
                                    </div>
                                    <a
                                        href="mailto:kontakt@lokalni.pl"
                                        className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors active:scale-95"
                                    >
                                        <Mail size={16} /> kontakt@lokalni.pl
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
