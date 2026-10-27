import { OPERATOR, LEGAL_DATES, formatLegalDate, operatorAddress } from './operator';
import type { LegalDocumentData } from './types';

const contact = OPERATOR.phone
    ? `e-mail: ${OPERATOR.email}, tel.: ${OPERATOR.phone}`
    : `e-mail: ${OPERATOR.email}`;

export const TERMS: LegalDocumentData = {
    title: 'Regulamin serwisu MyLokalni.pl',
    dateLine: `Obowiązuje od ${formatLegalDate(LEGAL_DATES.termsEffective)} r.`,
    sections: [
        {
            id: 'postanowienia-ogolne',
            title: 'Postanowienia ogólne',
            blocks: [
                { type: 'p', text: `1. Regulamin określa zasady korzystania z serwisu internetowego ${OPERATOR.serviceName} dostępnego pod adresem ${OPERATOR.website} oraz z aplikacji mobilnej MyLokalni na systemy iOS i Android (dalej łącznie: „Serwis”).` },
                { type: 'p', text: `2. Serwis prowadzi **${OPERATOR.fullName}**, ${operatorAddress()}, osoba fizyczna wykonująca działalność nierejestrowaną w rozumieniu art. 5 ust. 1 ustawy z dnia 6 marca 2018 r. – Prawo przedsiębiorców (dalej: „Operator”). Z uwagi na charakter działalności Operator nie jest wpisany do CEIDG i nie posługuje się numerem NIP ani REGON.` },
                { type: 'p', text: `3. Kontakt z Operatorem: ${contact}, adres korespondencyjny: ${operatorAddress()}. Operator odpowiada na wiadomości w języku polskim i angielskim.` },
                { type: 'p', text: '4. Regulamin jest regulaminem, o którym mowa w art. 8 ustawy z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną. Jest dostępny nieodpłatnie w Serwisie przed zawarciem umowy i w każdym czasie, w sposób umożliwiający jego pobranie, utrwalenie i wydrukowanie.' },
                { type: 'p', text: '5. Regulamin stosuje się do wszystkich osób korzystających z Serwisu. Przeglądanie ofert i profili nie wymaga zakładania Konta. Założenie Konta wymaga akceptacji Regulaminu; z Polityką prywatności Użytkownik zapoznaje się przed założeniem Konta.' },
            ],
        },
        {
            id: 'definicje',
            title: 'Definicje',
            blocks: [
                {
                    type: 'defs',
                    items: [
                        ['Użytkownik', 'osoba korzystająca z Serwisu, w tym osoba posiadająca Konto.'],
                        ['Konto', 'indywidualny panel Użytkownika w Serwisie, dostępny po rejestracji i zalogowaniu.'],
                        ['Usługodawca', 'Użytkownik, który publikuje w Serwisie Ogłoszenie o świadczonych przez siebie usługach.'],
                        ['Klient', 'Użytkownik, który przegląda Ogłoszenia, kontaktuje się z Usługodawcami lub dokonuje Rezerwacji.'],
                        ['Ogłoszenie', 'prezentacja usługi Usługodawcy w Serwisie (opis, zdjęcia, cena, lokalizacja, dostępność).'],
                        ['Profil', 'publiczna strona Użytkownika w Serwisie, zawierająca w szczególności imię, zdjęcie, opis, Ogłoszenia, Opinie, Certyfikaty i Aktualności.'],
                        ['Rezerwacja', 'prośba Klienta o wykonanie usługi w określonym terminie, kierowana do Usługodawcy przez Serwis, oraz jej dalszy przebieg (akceptacja, zmiana terminu, odwołanie, realizacja).'],
                        ['Opinia', 'ocena w skali 1–5 wraz z ewentualnym komentarzem i zdjęciem, wystawiana przez Klienta po zrealizowanej Rezerwacji.'],
                        ['Czat', 'funkcja wymiany wiadomości tekstowych, zdjęć, plików i nagrań wideo pomiędzy Użytkownikami.'],
                        ['Certyfikat', 'informacja o uprawnieniu, kwalifikacji lub ukończonym szkoleniu dodana przez Usługodawcę do Profilu, wraz z opcjonalnym skanem dokumentu.'],
                        ['Aktualność', 'wpis publikowany przez Usługodawcę i widoczny dla obserwujących go Użytkowników oraz na Profilu.'],
                        ['Plus', 'pakiet rozszerzonych funkcji dla Usługodawców opisany w §12.'],
                        ['Treści', 'wszelkie materiały zamieszczane przez Użytkowników w Serwisie, w szczególności Ogłoszenia, opisy, zdjęcia, nagrania, Opinie, wiadomości na Czacie, Certyfikaty i Aktualności.'],
                        ['Konsument', 'Użytkownik będący osobą fizyczną, który korzysta z Serwisu w celu niezwiązanym bezpośrednio z jego działalnością gospodarczą lub zawodową.'],
                        ['Przedsiębiorca', 'Usługodawca, który zgodnie ze swoim oświadczeniem w Serwisie oferuje usługi w ramach działalności gospodarczej lub zawodowej (także działalności nierejestrowanej).'],
                    ],
                },
            ],
        },
        {
            id: 'uslugi',
            title: 'Usługi świadczone w Serwisie',
            blocks: [
                { type: 'p', text: '1. Operator świadczy drogą elektroniczną następujące usługi:' },
                {
                    type: 'list',
                    items: [
                        'przeglądanie i wyszukiwanie Ogłoszeń oraz Profili, w tym według kategorii, lokalizacji i odległości – bez Konta,',
                        'prowadzenie Konta i Profilu,',
                        'publikowanie Ogłoszeń przez Usługodawców,',
                        'Czat pomiędzy Użytkownikami,',
                        'Rezerwacje, kalendarz i przypomnienia o terminach,',
                        'wystawianie i publikowanie Opinii oraz odpowiedzi na Opinie,',
                        'dodawanie Usługodawców do ulubionych i obserwowanie ich Aktualności,',
                        'zestawienia zarobków oraz pomocnicze narzędzie do prowadzenia uproszczonej ewidencji sprzedaży dla działalności nierejestrowanej (§8 ust. 6),',
                        'zgłaszanie Treści i blokowanie innych Użytkowników,',
                        'pobranie kopii danych Konta,',
                        'funkcje pakietu Plus (§12),',
                        'powiadomienia e-mail i push związane z korzystaniem z Serwisu,',
                        'newsletter e-mail – wyłącznie dla Użytkowników, którzy wyrazili na to osobną, dobrowolną zgodę (od 16 lat); zgodę można wycofać w każdej chwili w ustawieniach Konta albo linkiem w każdym newsletterze.',
                    ],
                },
                { type: 'p', text: '2. Usługi wymienione w ust. 1 są **nieodpłatne**, z wyjątkiem płatnej subskrypcji Plus opisanej w §12. Operator nie pobiera prowizji od usług świadczonych pomiędzy Użytkownikami.' },
                { type: 'p', text: '3. Umowa o świadczenie usług drogą elektroniczną w zakresie Konta zostaje zawarta z chwilą założenia Konta, na czas nieokreślony. W zakresie przeglądania Serwisu bez Konta umowa zostaje zawarta z chwilą wejścia do Serwisu i wygasa z chwilą jego opuszczenia.' },
            ],
        },
        {
            id: 'wymagania-techniczne',
            title: 'Wymagania techniczne i bezpieczeństwo',
            blocks: [
                { type: 'p', text: '1. Do korzystania z Serwisu potrzebne są: urządzenie z dostępem do Internetu, aktualna przeglądarka internetowa z obsługą JavaScript i plików cookies (np. Chrome, Safari, Firefox, Edge) albo aplikacja mobilna w wersji obsługiwanej przez system iOS lub Android, a do założenia Konta – aktywny adres e-mail lub konto Google, Facebook albo Apple.' },
                { type: 'p', text: '2. Niektóre funkcje aplikacji mobilnej wymagają zgód systemowych (lokalizacja, aparat, zdjęcia, powiadomienia, Face ID / odcisk palca). Brak zgody ogranicza jedynie daną funkcję. Zgody można w każdej chwili zmienić w ustawieniach urządzenia.' },
                { type: 'p', text: '3. Zgodnie z art. 6 pkt 1 ustawy o świadczeniu usług drogą elektroniczną Operator informuje o szczególnych zagrożeniach związanych z korzystaniem z usług drogą elektroniczną, takich jak: złośliwe oprogramowanie, wyłudzanie danych logowania (phishing), przejęcie Konta, podszywanie się pod innych Użytkowników lub pod Operatora oraz oszustwa przy rozliczeniach poza Serwisem. Operator nigdy nie prosi o hasło ani o dane karty płatniczej. Zalecamy korzystanie z aktualnego oprogramowania, silnego i unikalnego hasła oraz weryfikacji dwuetapowej, a także ostrożność wobec linków i próśb o przedpłatę od nieznanych osób.' },
            ],
        },
        {
            id: 'konto',
            title: 'Konto',
            blocks: [
                { type: 'p', text: '1. Konto można założyć, podając adres e-mail, hasło, imię, nazwisko i numer telefonu, albo logując się przez Google, Facebook lub Apple. Przy logowaniu przez zewnętrznego dostawcę Operator otrzymuje od niego dane opisane w Polityce prywatności, a Użytkownik podaje datę urodzenia.' },
                { type: 'p', text: '2. Użytkownik podaje dane prawdziwe i aktualne. Imię wyświetlane na Profilu nie może wprowadzać w błąd co do tożsamości Użytkownika.' },
                { type: 'p', text: '3. Jedna osoba może mieć jedno Konto. Konto jest osobiste i nie może być udostępniane ani przenoszone na inne osoby.' },
                { type: 'p', text: '4. Użytkownik chroni dane logowania przed osobami trzecimi. W razie podejrzenia przejęcia Konta należy niezwłocznie zmienić hasło i powiadomić Operatora.' },
                { type: 'p', text: `5. Użytkownik może w każdej chwili, bez podania przyczyny i bez kosztów, usunąć Konto w ustawieniach Konta (w aplikacji i w serwisie internetowym) lub na stronie ${OPERATOR.domain}/delete-account. Usunięcie Konta jest równoznaczne z wypowiedzeniem umowy ze skutkiem natychmiastowym. Skutki usunięcia dla danych opisuje Polityka prywatności.` },
                { type: 'p', text: '6. Konsument może odstąpić od umowy o prowadzenie Konta w terminie 14 dni od jej zawarcia bez podania przyczyny – wystarczy usunąć Konto albo przesłać Operatorowi oświadczenie e-mailem. Odstąpienie od umowy o prowadzenie Konta nie wiąże się z żadnymi kosztami. Odstąpienie od subskrypcji Plus opisuje §12 ust. 10–12.' },
            ],
        },
        {
            id: 'maloletni',
            title: 'Małoletni',
            blocks: [
                { type: 'p', text: '1. Konto może założyć osoba, która ukończyła 13 lat.' },
                { type: 'p', text: '2. Osoba w wieku 13–15 lat może założyć Konto wyłącznie za zgodą rodzica lub opiekuna prawnego, potwierdzoną przez kliknięcie w link wysłany na jego adres e-mail (art. 8 RODO). Do czasu potwierdzenia Konto nie jest aktywne. Adres e-mail rodzica lub opiekuna musi być inny niż adres e-mail Konta.' },
                { type: 'p', text: '3. Przy rejestracji adresem e-mail osoba, która ukończyła 16 lat, może zamiast daty urodzenia potwierdzić swój wiek oświadczeniem. Osoba młodsza podaje datę urodzenia.' },
                { type: 'p', text: '4. Osoba w wieku 13–17 lat ma ograniczoną zdolność do czynności prawnych. Może samodzielnie korzystać z Serwisu w zakresie drobnych, bieżących spraw życia codziennego, natomiast oferowanie usług za wynagrodzenie oraz zawieranie umów wykraczających poza ten zakres wymaga zgody przedstawiciela ustawowego, a w przypadku pracy lub usług świadczonych przez osoby małoletnie – także przestrzegania przepisów chroniących małoletnich.' },
                { type: 'p', text: `5. Rodzic lub opiekun prawny może w każdej chwili cofnąć zgodę i zażądać zablokowania lub usunięcia Konta małoletniego, pisząc na ${OPERATOR.email}. Jeżeli Operator dowie się, że Konto założyła osoba poniżej 13 lat albo osoba w wieku 13–15 lat bez zgody rodzica lub opiekuna, usunie Konto i dane.` },
            ],
        },
        {
            id: 'rola-serwisu',
            title: 'Rola Serwisu i umowy pomiędzy Użytkownikami',
            blocks: [
                { type: 'p', text: '1. Serwis jest platformą ogłoszeniową i narzędziem do kontaktu oraz umawiania terminów. **Operator nie jest stroną umów** zawieranych pomiędzy Klientami a Usługodawcami, nie świadczy usług oferowanych w Ogłoszeniach, nie pośredniczy w płatnościach i nie przyjmuje płatności za te usługi.' },
                { type: 'p', text: '2. Warunki usługi (zakres, cenę, termin, sposób płatności, rękojmię lub gwarancję) Klient i Usługodawca uzgadniają bezpośrednio. Rozliczenia odbywają się poza Serwisem. Za wykonanie usługi, jej jakość, legalność oraz wystawienie dokumentu sprzedaży odpowiada Usługodawca.' },
                { type: 'p', text: '3. Na podstawie art. 12a ustawy o prawach konsumenta Operator informuje, że:' },
                {
                    type: 'list',
                    items: [
                        'przy każdym Ogłoszeniu i na Profilu widać, czy Usługodawca oferuje usługi jako „Przedsiębiorca” czy jako „Osoba prywatna”; informacja ta pochodzi wyłącznie z oświadczenia Usługodawcy w ustawieniach Konta i Operator jej nie weryfikuje,',
                        'jeżeli Usługodawca nie jest Przedsiębiorcą, do umowy zawieranej z nim przez Klienta nie stosuje się przepisów o ochronie konsumentów (w tym prawa odstąpienia od umowy zawartej na odległość),',
                        'obowiązki wynikające z umowy o usługę (wykonanie usługi, odpowiedzialność za jej wady, obowiązki informacyjne wobec Konsumenta, rozliczenie podatkowe) spoczywają na Usługodawcy; Operator odpowiada za prawidłowe działanie Serwisu,',
                        'główne parametry decydujące o kolejności wyświetlania Ogłoszeń opisuje §11.',
                    ],
                },
                { type: 'p', text: '4. Operator nie weryfikuje tożsamości, kwalifikacji, uprawnień ani doświadczenia Usługodawców. Certyfikaty publikowane są na odpowiedzialność Usługodawcy i nie są przez Operatora sprawdzane. Informacje przy Profilu (liczba zrealizowanych Rezerwacji, Opinie, data dołączenia) wynikają wyłącznie z danych w Serwisie. Klient powinien samodzielnie ocenić Usługodawcę, w szczególności przy usługach wymagających uprawnień.' },
            ],
        },
        {
            id: 'uslugodawca',
            title: 'Obowiązki Usługodawcy',
            blocks: [
                { type: 'p', text: '1. Usługodawca dba o to, aby Ogłoszenie, Profil i Certyfikaty były prawdziwe, aktualne i zgodne z prawem, a cena i opis usługi nie wprowadzały w błąd.' },
                { type: 'p', text: '2. Usługodawca oferuje wyłącznie usługi, do których świadczenia jest uprawniony. Jeżeli świadczenie usługi wymaga uprawnień, zezwolenia, wpisu do rejestru lub ubezpieczenia, Usługodawca ma je przed rozpoczęciem świadczenia.' },
                { type: 'p', text: '3. Usługodawca, który oferuje usługi w ramach działalności gospodarczej lub zawodowej (także nierejestrowanej), zaznacza to w ustawieniach Konta („Świadczę usługi jako przedsiębiorca”) i wykonuje wobec Konsumentów obowiązki wynikające z przepisów o ochronie konsumentów, w tym obowiązki informacyjne przed zawarciem umowy.' },
                { type: 'p', text: '4. Usługodawca samodzielnie rozlicza podatki i składki od przychodów z usług oferowanych przez Serwis.' },
                { type: 'p', text: '5. Usługodawca dodaje Certyfikaty wyłącznie na podstawie faktycznie posiadanych dokumentów i nie zamieszcza w skanach danych, których publikacja jest zbędna (np. numeru PESEL, numeru dowodu osobistego, adresu zamieszkania). Certyfikat jest widoczny na Profilu od chwili dodania.' },
                { type: 'p', text: '6. Zestawienia zarobków i narzędzie do ewidencji sprzedaży mają charakter wyłącznie pomocniczy, opierają się na danych wprowadzonych przez Usługodawcę oraz na Rezerwacjach w Serwisie i nie stanowią doradztwa podatkowego. Za kompletność ewidencji, przestrzeganie limitów przychodów działalności nierejestrowanej i rozliczenia z urzędem skarbowym odpowiada Usługodawca.' },
            ],
        },
        {
            id: 'rezerwacje',
            title: 'Rezerwacje',
            blocks: [
                { type: 'p', text: '1. Klient wybiera w Serwisie termin z listy dostępnych terminów Usługodawcy i wysyła prośbę o Rezerwację. Rezerwację można złożyć najpóźniej 15 minut przed rozpoczęciem wybranego terminu.' },
                { type: 'p', text: '2. Prośba o Rezerwację nie jest jeszcze zawarciem umowy o usługę. Usługodawca akceptuje ją albo odrzuca. Usługodawca może też dodać Rezerwację dla Klienta z poziomu Czatu, w tym Rezerwacje cykliczne.' },
                { type: 'p', text: '3. Każda ze stron może zaproponować zmianę terminu lub odwołać Rezerwację w Serwisie. Zasady odwołania i ewentualnych opłat za odwołanie ustalają Klient i Usługodawca bezpośrednio. Operator nie pobiera opłat za Rezerwacje.' },
                { type: 'p', text: '4. Po wykonaniu usługi Usługodawca oznacza Rezerwację jako zrealizowaną, co umożliwia Klientowi wystawienie Opinii.' },
                { type: 'p', text: '5. Przypomnienia o terminach mają charakter pomocniczy i mogą nie dotrzeć, np. gdy powiadomienia są wyłączone na urządzeniu.' },
            ],
        },
        {
            id: 'opinie',
            title: 'Opinie',
            blocks: [
                { type: 'p', text: '1. Opinię o usłudze może wystawić wyłącznie Klient, którego Rezerwacja u danego Usługodawcy została oznaczona jako zrealizowana, w terminie wskazanym w Serwisie (obecnie 14 dni od tej chwili). Do jednej Rezerwacji można wystawić jedną Opinię.' },
                { type: 'p', text: '2. Informacja o sposobie weryfikacji Opinii (ustawa o przeciwdziałaniu nieuczciwym praktykom rynkowym): Operator zapewnia, że Opinie pochodzą od osób, które skorzystały z usługi, w ten sposób, że możliwość wystawienia Opinii jest technicznie powiązana z Kontem Klienta i zrealizowaną Rezerwacją w Serwisie. Operator nie sprawdza, czy usługa została faktycznie wykonana poza Serwisem. Opinie oznaczone jako „Zweryfikowana realizacja” zostały wystawione w opisany sposób.' },
                { type: 'p', text: '3. Opinie są publikowane od najnowszych albo według wybranego przez Użytkownika sortowania (najwyżej lub najniżej ocenione). Operator nie usuwa ani nie ukrywa Opinii z powodu ich negatywnego charakteru i nie zmienia ich treści. Opinia może zostać usunięta wyłącznie w przypadku naruszenia prawa lub §14 – w trybie §15.' },
                { type: 'p', text: '4. Zabronione jest wystawianie Opinii nieprawdziwych, za wynagrodzeniem lub inną korzyścią, o własnych usługach lub usługach osób powiązanych, a także zlecanie lub publikowanie takich Opinii.' },
                { type: 'p', text: '5. Usługodawca może publicznie odpowiedzieć na Opinię. Opinię i zdjęcie do niej można zgłosić w trybie §16.' },
            ],
        },
        {
            id: 'ranking',
            title: 'Kolejność wyświetlania Ogłoszeń',
            blocks: [
                { type: 'p', text: '1. Informacja o głównych parametrach decydujących o kolejności (plasowaniu) Ogłoszeń w wynikach wyszukiwania – na podstawie art. 12a pkt 1 ustawy o prawach konsumenta, art. 6 ust. 3 ustawy o przeciwdziałaniu nieuczciwym praktykom rynkowym oraz art. 5 rozporządzenia (UE) 2019/1150 (P2B).' },
                { type: 'p', text: '2. Wyniki są najpierw zawężane według kryteriów wybranych przez Użytkownika (fraza, kategoria, miejscowość, promień, cena). Gdy Użytkownik wskaże lokalizację, Ogłoszenia usług świadczonych zdalnie są wyświetlane po Ogłoszeniach lokalnych.' },
                { type: 'p', text: '3. W ramach zawężonych wyników kolejność zależy od wybranego sortowania:' },
                {
                    type: 'list',
                    items: [
                        '**Polecane** (domyślnie) – według wskaźnika, w którym ok. 50% stanowi średnia ocen z Opinii, ok. 30% liczba zrealizowanych Rezerwacji, a ok. 20% posiadanie przez Usługodawcę pakietu Plus; przy równym wyniku – nowsze Ogłoszenia wyżej,',
                        '**Odległość** – od najbliższych względem wskazanej lokalizacji,',
                        '**Cena** – od najniższej ceny podanej w Ogłoszeniu,',
                        '**Plus najpierw** – najpierw Ogłoszenia Usługodawców z pakietem Plus, następnie według średniej ocen i liczby Rezerwacji.',
                    ],
                },
                { type: 'p', text: '4. **Oferty podobne do oglądanych.** W sortowaniu „Polecane” bez wpisanej frazy na górze listy pokazujemy do 6 Ogłoszeń podobnych do tych, które Użytkownik ostatnio oglądał albo z którymi miał kontakt (ulubione, Czat, Rezerwacja – z ostatnich 30 dni). Podobieństwo oceniamy według kategorii (ok. 50%), miejscowości lub odległości (ok. 20%), ceny (ok. 15%) i tytułu (ok. 15%); świeższe działania liczą się bardziej, a samych ostatnio oglądanych Ogłoszeń ani własnych ofert nie polecamy. Kolejność tych Ogłoszeń zależy w ok. 75% od podobieństwa i w ok. 25% od wskaźnika z ust. 3 (oceny, Rezerwacje, Plus). Gdy Użytkownik nie ma jeszcze takiej historii albo nic nie jest wystarczająco podobne, na górze listy mogą pojawić się Ogłoszenia najczęściej oglądane w ostatnich 7 dniach, a przy równej liczbie – z większą liczbą Rezerwacji i wyższą oceną. Kto nie chce takiego doboru, może wybrać inne sortowanie (Odległość, Cena, Plus najpierw) albo wpisać frazę.' },
                { type: 'p', text: '5. **Pakiet Plus wpływa na kolejność wyświetlania** w zakresie opisanym w ust. 3 i 4. Ogłoszenia Usługodawców z Plus są w wynikach wyszukiwania, na stronie głównej i na mapie wyraźnie oznaczone jako „Promowane · Plus”, a przy wyborze sortowania dostępne jest wyjaśnienie zasad kolejności. Plus jest dostępny jako płatna subskrypcja lub w okresie bezpłatnym na zasadach §12 – na takich samych warunkach dla wszystkich Usługodawców. Poza tym Operator nie przyjmuje od Usługodawców żadnych płatności ani innych korzyści za wyższą pozycję w wynikach i nie traktuje odmiennie Ogłoszeń prowadzonych przez siebie lub podmioty z nim powiązane.' },
            ],
        },
        {
            id: 'plus',
            title: 'Pakiet Plus',
            blocks: [
                { type: 'p', text: '1. Plus to pakiet dodatkowych funkcji dla Usługodawców obejmujący w szczególności: grafik pracy i zarządzanie dostępnością terminów, Certyfikaty na Profilu, Aktualności dla obserwujących, własne zdjęcie tła Profilu oraz wyróżnienie w wynikach wyszukiwania zgodnie z §11 (wyższa pozycja w sortowaniu „Polecane”, sortowanie „Plus najpierw” i oznaczenie „Promowane · Plus”). Plus nie oznacza weryfikacji Usługodawcy ani jego usług przez Operatora.' },
                { type: 'p', text: '2. Plus jest **płatną subskrypcją** odnawianą automatycznie. Ceny (kwoty brutto, zawierające ewentualne podatki): **14,99 zł za miesiąc** albo **99,99 zł za rok**. Aktualna cena i okres rozliczeniowy są zawsze pokazywane przed zakupem.' },
                { type: 'p', text: `3. Plus można kupić: (a) w aplikacji na iPhone’a – przez App Store; sprzedawcą i podmiotem pobierającym płatność jest wtedy Apple, a do płatności, odnowień, anulowania i zwrotów stosuje się warunki App Store; (b) w serwisie internetowym ${OPERATOR.domain} – kartą płatniczą lub inną metodą dostępną w formularzu płatności, za pośrednictwem operatora płatności Stripe; stroną umowy jest wtedy Operator. Na jednym Koncie może być aktywna tylko jedna płatna subskrypcja Plus.` },
                { type: 'p', text: '4. **Okres próbny**: przy pierwszym zakupie subskrypcji na danym Koncie może przysługiwać **30 dni bez opłat**, jeżeli informacja o nim jest wyświetlana przed zakupem. W serwisie internetowym wymaga on podania danych karty; jeżeli subskrypcja nie zostanie anulowana przed końcem okresu próbnego, po jego upływie pobierana jest pierwsza opłata. W App Store o dostępności okresu próbnego decyduje Apple (m.in. przysługuje on raz na Apple ID).' },
                { type: 'p', text: '5. Tam, gdzie płatny zakup Plus nie jest dostępny (np. w aplikacji na Androida), Użytkownik może jednorazowo aktywować Plus **bezpłatnie na 30 dni**. Taka aktywacja nie wymaga danych płatniczych, wygasa automatycznie i nie przekształca się w płatną subskrypcję.' },
                { type: 'p', text: '6. Umowa subskrypcji zostaje zawarta z chwilą potwierdzenia zakupu, na okres rozliczeniowy (miesiąc albo rok), i **odnawia się automatycznie** na kolejne takie okresy do czasu anulowania. Opłata za każdy kolejny okres jest pobierana na jego początku.' },
                { type: 'p', text: '7. **Anulowanie** jest możliwe w każdej chwili, bez podania przyczyny: przy zakupie w serwisie internetowym – w ustawieniach Konta (Plus → „Zarządzaj subskrypcją”); przy zakupie w App Store – w ustawieniach Apple ID na urządzeniu. Anulowanie wstrzymuje kolejne odnowienia; Plus działa do końca opłaconego okresu (lub okresu próbnego), po czym wygasa. Anulowanie w okresie próbnym nie powoduje żadnej opłaty.' },
                { type: 'p', text: '8. Jeżeli opłaty za kolejny okres nie uda się pobrać, operator płatności ponawia próby przez pewien czas, a Plus pozostaje w tym czasie aktywny; jeżeli płatność ostatecznie się nie powiedzie, subskrypcja wygasa. Usunięcie Konta powoduje natychmiastowe anulowanie subskrypcji kupionej w serwisie internetowym; subskrypcję kupioną w App Store należy dodatkowo anulować w ustawieniach Apple ID.' },
                { type: 'p', text: '9. O zmianie ceny Operator informuje e-mailem co najmniej **30 dni** przed jej zastosowaniem. Nowa cena obowiązuje od pierwszego okresu rozliczeniowego rozpoczynającego się po tym terminie; Użytkownik, który się na nią nie zgadza, może wcześniej anulować subskrypcję. Przy subskrypcjach z App Store obowiązują także zasady Apple dotyczące zmian cen.' },
                { type: 'p', text: '10. Konsumentowi, a także osobie fizycznej zawierającej umowę bezpośrednio związaną z jej działalnością gospodarczą, gdy umowa ta nie ma dla niej charakteru zawodowego (art. 38a ustawy o prawach konsumenta), przysługuje prawo **odstąpienia od umowy subskrypcji w terminie 14 dni** od jej zawarcia, bez podania przyczyny. Przy zakupie w serwisie internetowym wystarczy przesłać oświadczenie na adres e-mail Operatora (można skorzystać ze wzoru z załącznika nr 2 do ustawy o prawach konsumenta, nie jest to jednak obowiązkowe); przy zakupie w App Store – zgłosić żądanie Apple (reportaproblem.apple.com).' },
                { type: 'p', text: '11. Przed zakupem w serwisie internetowym Użytkownik **żąda rozpoczęcia świadczenia przed upływem terminu do odstąpienia** od umowy. W razie odstąpienia płaci wtedy kwotę proporcjonalną do okresu, w którym Plus był aktywny do chwili odstąpienia (art. 35 ustawy o prawach konsumenta); pozostałą część Operator zwraca w terminie 14 dni, tą samą metodą płatności. Odstąpienie w okresie próbnym nie wiąże się z żadną opłatą. Potwierdzenie zawarcia umowy wraz z tymi informacjami Użytkownik otrzymuje e-mailem.' },
                { type: 'p', text: '12. Zwroty za subskrypcje kupione w App Store obsługuje Apple, zgodnie ze swoimi zasadami. Reklamacje dotyczące działania Plus rozpatruje Operator w trybie §17.' },
                { type: 'p', text: '13. Po wygaśnięciu Plus Treści dodane w ramach jego funkcji mogą przestać być wyświetlane na Profilu. Operator nie usuwa ich wyłącznie z powodu wygaśnięcia Plus.' },
                { type: 'p', text: '14. Operator nie przechowuje danych kart płatniczych – przetwarza je operator płatności (Stripe) albo Apple. Przy zakupie w serwisie internetowym dokumenty płatności są dostępne w panelu „Zarządzaj subskrypcją”, a przy zakupie w App Store – w historii zakupów Apple ID.' },
            ],
        },
        {
            id: 'tresci',
            title: 'Treści Użytkowników',
            blocks: [
                { type: 'p', text: '1. Użytkownik odpowiada za zamieszczane Treści i oświadcza, że ma do nich prawa, a osoby widoczne na zdjęciach lub nagraniach zgodziły się na ich publikację.' },
                { type: 'p', text: '2. Użytkownik zachowuje prawa do Treści. Zamieszczając Treść, udziela Operatorowi nieodpłatnej, niewyłącznej, nieograniczonej terytorialnie licencji na jej przechowywanie, zwielokrotnianie, wyświetlanie i udostępnianie w Serwisie (w tym w wynikach wyszukiwania i podglądach linków w mediach społecznościowych) oraz na dostosowanie formatu (np. zmniejszenie zdjęcia) – w zakresie niezbędnym do działania Serwisu, na czas publikowania Treści w Serwisie. Przy zapisie zdjęć i nagrań Serwis co do zasady usuwa z plików metadane (np. lokalizację GPS).' },
                { type: 'p', text: '3. Licencja wygasa z chwilą usunięcia Treści albo Konta, z zastrzeżeniem Treści, które zgodnie z Polityką prywatności pozostają w Serwisie w formie zanonimizowanej (np. Opinie), oraz kopii zapasowych usuwanych w zwykłym cyklu ich rotacji.' },
                { type: 'p', text: '4. Serwis, jego oprogramowanie, układ, nazwa i oznaczenia są chronione prawem. Bez zgody Operatora nie wolno ich kopiować ani wykorzystywać poza zwykłym korzystaniem z Serwisu.' },
            ],
        },
        {
            id: 'zasady',
            title: 'Zasady korzystania z Serwisu',
            blocks: [
                { type: 'p', text: '1. Użytkownik korzysta z Serwisu zgodnie z prawem, Regulaminem i dobrymi obyczajami. Zakazane jest w szczególności:' },
                {
                    type: 'list',
                    items: [
                        'dostarczanie treści o charakterze bezprawnym (art. 8 ust. 3 pkt 1 lit. b ustawy o świadczeniu usług drogą elektroniczną), w tym treści nawołujących do nienawiści, przemocy lub dyskryminacji, naruszających dobra osobiste lub prawa autorskie, pornograficznych oraz dotyczących małoletnich w sposób naruszający ich dobro,',
                        'oferowanie usług zakazanych lub wymagających zezwoleń, których Usługodawca nie posiada, a także usług seksualnych, sprzedaży towarów zamiast usług, pożyczek oraz usług hazardowych,',
                        'podszywanie się pod inne osoby lub pod Operatora, wprowadzanie w błąd co do tożsamości, kwalifikacji, statusu (osoba prywatna albo Przedsiębiorca) lub ceny,',
                        'oszustwa, wyłudzanie danych, przedpłat lub danych logowania, przesyłanie linków do fałszywych płatności,',
                        'spam, niezamówiona informacja handlowa, zakładanie wielu Kont, sztuczne zawyżanie ocen lub popularności,',
                        'publikowanie danych osobowych innych osób bez podstawy prawnej,',
                        'automatyczne pobieranie danych z Serwisu (scraping), obchodzenie zabezpieczeń, ingerencja w działanie Serwisu,',
                        'nękanie lub obrażanie innych Użytkowników.',
                    ],
                },
                { type: 'p', text: '2. Użytkownik może zablokować innego Użytkownika. Zablokowane osoby nie mogą do siebie pisać ani składać sobie Rezerwacji.' },
            ],
        },
        {
            id: 'moderacja',
            title: 'Moderacja treści',
            blocks: [
                { type: 'p', text: '1. Informacja na podstawie art. 14 rozporządzenia (UE) 2022/2065 (akt o usługach cyfrowych, „DSA”): Operator moderuje Treści na podstawie zgłoszeń Użytkowników i osób trzecich (§16), zgłoszeń organów oraz informacji uzyskanych w inny sposób. Decyzje o usunięciu Treści lub ograniczeniu Konta podejmuje człowiek – Operator. Automatycznie stosowane są jedynie zabezpieczenia techniczne, takie jak limity liczby działań w czasie, usuwanie kodu HTML z tekstów oraz weryfikacja typu i rozmiaru plików. Jeżeli Operator włączy taką funkcję, Ogłoszenie zgłoszone przez określoną liczbę różnych Użytkowników jest automatycznie, tymczasowo ukrywane do czasu rozpatrzenia sprawy przez człowieka.' },
                { type: 'p', text: '2. W razie naruszenia prawa lub Regulaminu Operator może, proporcjonalnie do wagi naruszenia: usunąć lub ukryć Treść, ograniczyć widoczność Ogłoszenia lub Profilu, ograniczyć korzystanie z wybranych funkcji (np. Czatu), czasowo zawiesić Konto albo – przy poważnych lub powtarzających się naruszeniach – usunąć Konto.' },
                { type: 'p', text: '3. O każdej takiej decyzji Operator informuje Użytkownika, którego dotyczy, najpóźniej w chwili jej zastosowania, podając (art. 17 DSA): rodzaj ograniczenia i jego zakres czasowy, fakty i okoliczności, na których opiera się decyzja, wskazanie, czy dotyczy ona treści nielegalnej (z podstawą prawną) czy niezgodnej z Regulaminem (ze wskazaniem postanowienia), informację o tym, czy decyzję podjęto z użyciem środków zautomatyzowanych, oraz możliwość odwołania (§17). Obowiązek ten nie dotyczy spamu oraz sytuacji, gdy zakazuje tego organ.' },
                { type: 'p', text: '4. Operator nie ma ogólnego obowiązku monitorowania Treści ani aktywnego poszukiwania naruszeń. Operator nie przegląda wiadomości na Czacie, chyba że jest to niezbędne do rozpatrzenia zgłoszenia, które ich dotyczy, albo wynika z przepisów prawa.' },
                { type: 'p', text: '5. Jeżeli Operator poweźmie informację o treściach wskazujących na przestępstwo zagrażające życiu lub bezpieczeństwu osoby, niezwłocznie powiadamia właściwe organy (art. 18 DSA).' },
            ],
        },
        {
            id: 'zgloszenia',
            title: 'Zgłaszanie nielegalnych treści',
            blocks: [
                { type: 'p', text: `1. Każdy, także osoba bez Konta, może zgłosić Treść, którą uważa za nielegalną lub niezgodną z Regulaminem: za pomocą przycisku „Zgłoś” przy Treści, Profilu lub w Czacie albo e-mailem na ${OPERATOR.email} (art. 16 DSA).` },
                { type: 'p', text: '2. Zgłoszenie powinno zawierać: uzasadnienie, dlaczego Treść jest nielegalna lub narusza Regulamin; dokładne wskazanie Treści (link albo opis pozwalający ją odnaleźć); imię i nazwisko lub nazwę oraz adres e-mail zgłaszającego (chyba że zgłoszenie dotyczy wykorzystywania seksualnego dzieci); oświadczenie, że zgłaszający w dobrej wierze uważa informacje w zgłoszeniu za prawidłowe i kompletne.' },
                { type: 'p', text: '3. Operator niezwłocznie potwierdza otrzymanie zgłoszenia e-mailem, rozpatruje je w odpowiednim czasie, starannie i obiektywnie, a następnie informuje zgłaszającego o decyzji i możliwości odwołania.' },
                { type: 'p', text: `4. Punkt kontaktowy dla organów państw członkowskich, Komisji Europejskiej i Europejskiej Rady ds. Usług Cyfrowych (art. 11 DSA) oraz dla odbiorców usługi (art. 12 DSA): ${OPERATOR.email}. Języki komunikacji: polski i angielski.` },
                { type: 'p', text: '5. Po uprzednim ostrzeżeniu Operator może na rozsądny czas zawiesić rozpatrywanie zgłoszeń od osób, które często składają zgłoszenia ewidentnie bezzasadne.' },
            ],
        },
        {
            id: 'reklamacje',
            title: 'Reklamacje i odwołania',
            blocks: [
                { type: 'p', text: `1. Reklamację dotyczącą działania Serwisu oraz odwołanie od decyzji z §15 można złożyć e-mailem na ${OPERATOR.email} lub pisemnie na adres ${operatorAddress()}.` },
                { type: 'p', text: '2. Zgłoszenie powinno zawierać dane pozwalające zidentyfikować Użytkownika (np. adres e-mail Konta), opis problemu lub decyzji, której dotyczy, oraz oczekiwany sposób rozwiązania. Odwołanie można złożyć w terminie 6 miesięcy od otrzymania informacji o decyzji.' },
                { type: 'p', text: '3. Operator rozpatruje reklamację lub odwołanie w terminie **14 dni** od otrzymania i odpowiada e-mailem albo pisemnie. Odwołanie rozpatruje człowiek. Jeżeli odwołanie okaże się zasadne, Operator niezwłocznie cofa decyzję.' },
                { type: 'p', text: '4. Reklamacje dotyczące usług świadczonych przez Usługodawców należy kierować bezpośrednio do Usługodawcy, który za nie odpowiada.' },
                { type: 'p', text: '5. Konsument może skorzystać z pozasądowych sposobów rozwiązywania sporów, w szczególności zwrócić się o pomoc do miejskiego lub powiatowego rzecznika konsumentów, organizacji konsumenckiej (np. Federacji Konsumentów) albo do wojewódzkiego inspektoratu Inspekcji Handlowej z wnioskiem o mediację. Informacje są dostępne na stronie uokik.gov.pl. Skorzystanie z tych sposobów jest dobrowolne.' },
            ],
        },
        {
            id: 'zakonczenie',
            title: 'Ograniczenie, zawieszenie i zakończenie świadczenia usług',
            blocks: [
                { type: 'p', text: '1. Operator może wypowiedzieć umowę o prowadzenie Konta z ważnych powodów, w szczególności poważnego lub powtarzającego się naruszenia Regulaminu lub prawa, z zachowaniem **30-dniowego** okresu wypowiedzenia, przesyłając uzasadnienie na adres e-mail Konta.' },
                { type: 'p', text: '2. Operator może zawiesić Konto lub usunąć je bez okresu wypowiedzenia, jeżeli wymagają tego przepisy prawa lub nakaz organu albo Użytkownik w sposób poważny lub powtarzający się narusza prawo lub Regulamin (np. oszustwa, treści nielegalne, podszywanie się). Decyzję wraz z uzasadnieniem Operator przekazuje Użytkownikowi niezwłocznie (art. 4 rozporządzenia P2B, art. 17 DSA).' },
                { type: 'p', text: `3. Użytkownik może odwołać się od decyzji w trybie §17. Po usunięciu Konta przez Operatora Użytkownik może otrzymać kopię swoich danych na żądanie przesłane na ${OPERATOR.email}, chyba że sprzeciwiają się temu przepisy prawa lub nakaz organu.` },
                { type: 'p', text: '4. Operator może zakończyć prowadzenie Serwisu, informując Użytkowników z co najmniej 30-dniowym wyprzedzeniem.' },
            ],
        },
        {
            id: 'odpowiedzialnosc',
            title: 'Odpowiedzialność',
            blocks: [
                { type: 'p', text: '1. Operator dokłada starań, aby Serwis działał nieprzerwanie i prawidłowo. Mogą jednak wystąpić przerwy techniczne, w szczególności związane z aktualizacjami lub awariami infrastruktury. O planowanych dłuższych przerwach Operator informuje z wyprzedzeniem, jeżeli to możliwe.' },
                { type: 'p', text: '2. Operator nie odpowiada za Treści zamieszczane przez Użytkowników, jeżeli nie wie o ich bezprawnym charakterze, a po uzyskaniu takiej wiedzy niezwłocznie uniemożliwia do nich dostęp (art. 6 DSA).' },
                { type: 'p', text: '3. Operator nie odpowiada za wykonanie, jakość, legalność ani bezpieczeństwo usług świadczonych przez Usługodawców ani za rozliczenia pomiędzy Użytkownikami.' },
                { type: 'p', text: '4. Postanowienia Regulaminu nie wyłączają ani nie ograniczają odpowiedzialności Operatora w zakresie, w jakim nie można jej wyłączyć ani ograniczyć na podstawie bezwzględnie obowiązujących przepisów prawa, w szczególności wobec Konsumentów oraz za szkodę wyrządzoną umyślnie.' },
            ],
        },
        {
            id: 'aplikacje-mobilne',
            title: 'Aplikacje mobilne',
            blocks: [
                { type: 'p', text: '1. Aplikacja mobilna jest dostępna nieodpłatnie w sklepach App Store (Apple) i Google Play (Google). Do pobrania aplikacji stosuje się także regulaminy tych sklepów.' },
                { type: 'p', text: '2. Operator udziela Użytkownikowi niewyłącznej, nieprzenoszalnej, nieodpłatnej licencji na zainstalowanie i używanie aplikacji na urządzeniach, które Użytkownik posiada lub kontroluje, wyłącznie w celu korzystania z Serwisu. W przypadku aplikacji pobranej z App Store licencja obejmuje korzystanie w zakresie dozwolonym przez Zasady korzystania określone w Warunkach korzystania z App Store.' },
                { type: 'p', text: '3. Umowa dotycząca aplikacji jest zawierana pomiędzy Użytkownikiem a Operatorem. Apple Inc. i Google LLC nie są jej stronami, nie odpowiadają za aplikację ani jej treść, nie mają obowiązku świadczenia wsparcia technicznego ani obsługi i nie odpowiadają za roszczenia Użytkownika lub osób trzecich związane z aplikacją (w tym z tytułu niezgodności z prawem, ochrony konsumentów lub naruszenia praw własności intelektualnej). Za aplikację, jej wsparcie i rozpatrywanie takich spraw odpowiada Operator.' },
                { type: 'p', text: '4. W przypadku niezgodności aplikacji pobranej z App Store z zapewnieniami Użytkownik może powiadomić Apple, które – w zakresie, w jakim pobrało opłatę – zwróci ją. Apple nie ma innych obowiązków gwarancyjnych w odniesieniu do aplikacji. Apple i jej spółki zależne są beneficjentami tych postanowień i po ich akceptacji przez Użytkownika mogą je wobec niego egzekwować.' },
                { type: 'p', text: '5. Użytkownik oświadcza, że nie przebywa w państwie objętym embargiem rządu USA ani nie figuruje na liście podmiotów objętych zakazami lub ograniczeniami rządu USA.' },
                { type: 'p', text: '6. Operator udostępnia aktualizacje aplikacji. Korzystanie z nieaktualnej wersji może ograniczać działanie niektórych funkcji.' },
            ],
        },
        {
            id: 'dane-osobowe',
            title: 'Dane osobowe i pliki cookies',
            blocks: [
                { type: 'p', text: `Administratorem danych osobowych Użytkowników jest Operator. Zasady przetwarzania danych osobowych, prawa Użytkowników oraz zasady stosowania plików cookies i podobnych technologii opisuje Polityka prywatności dostępna pod adresem ${OPERATOR.website}/polityka-prywatnosci.` },
            ],
        },
        {
            id: 'zmiany',
            title: 'Zmiany Regulaminu',
            blocks: [
                { type: 'p', text: '1. Operator może zmienić Regulamin z ważnych przyczyn, takich jak: zmiana przepisów prawa lub ich wykładni, rozstrzygnięcie organu publicznego, zmiana zakresu, funkcji lub sposobu świadczenia usług, wprowadzenie odpłatności, konieczność przeciwdziałania nadużyciom lub poprawa bezpieczeństwa.' },
                { type: 'p', text: '2. O zmianie Operator informuje Użytkowników posiadających Konto e-mailem oraz w Serwisie co najmniej **15 dni** przed jej wejściem w życie, udostępniając nową treść Regulaminu. Krótszy termin jest możliwy, gdy wymagają tego przepisy prawa lub nakaz organu albo gdy zmiana jest niezbędna do przeciwdziałania nieprzewidzianemu i bezpośredniemu zagrożeniu bezpieczeństwa Serwisu lub Użytkowników.' },
                { type: 'p', text: '3. Użytkownik, który nie akceptuje zmian, może przed ich wejściem w życie usunąć Konto. Dalsze korzystanie z Konta po wejściu zmian w życie oznacza ich akceptację.' },
            ],
        },
        {
            id: 'postanowienia-koncowe',
            title: 'Postanowienia końcowe',
            blocks: [
                { type: 'p', text: '1. Regulamin podlega prawu polskiemu. Wybór prawa nie pozbawia Konsumenta ochrony przysługującej mu na podstawie bezwzględnie obowiązujących przepisów prawa państwa jego zwykłego pobytu.' },
                { type: 'p', text: '2. Operator i Użytkownik dążą do polubownego rozwiązywania sporów – w pierwszej kolejności w trybie reklamacji (§17), a w przypadku Konsumentów także przy pomocy pozasądowych sposobów rozwiązywania sporów (§17 ust. 5). Sprawy, których nie uda się rozwiązać polubownie, rozpatruje właściwy sąd powszechny.' },
                { type: 'p', text: `3. Regulamin obowiązuje od ${formatLegalDate(LEGAL_DATES.termsEffective)} r. i zastępuje wcześniejsze wersje. Wcześniejsza wersja jest dostępna na żądanie przesłane na ${OPERATOR.email}.` },
            ],
        },
    ],
};
