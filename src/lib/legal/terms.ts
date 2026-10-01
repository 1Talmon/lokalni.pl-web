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
                { type: 'p', text: '4. Regulamin jest regulaminem, o którym mowa w art. 8 ustawy z dnia 18 lipca 2002 r. o świadczeniu usług drogą elektroniczną. Jest udostępniany nieodpłatnie w Serwisie, przed zawarciem umowy i w każdym czasie, w sposób umożliwiający jego pobranie, utrwalenie i wydrukowanie.' },
                { type: 'p', text: '5. Regulamin uwzględnia w szczególności przepisy: ustawy o świadczeniu usług drogą elektroniczną, Kodeksu cywilnego, ustawy z dnia 30 maja 2014 r. o prawach konsumenta, ustawy z dnia 23 sierpnia 2007 r. o przeciwdziałaniu nieuczciwym praktykom rynkowym, ustawy z dnia 12 lipca 2024 r. – Prawo komunikacji elektronicznej, rozporządzenia (UE) 2016/679 (RODO), rozporządzenia (UE) 2022/2065 o jednolitym rynku usług cyfrowych (DSA) oraz rozporządzenia (UE) 2019/1150 w sprawie propagowania sprawiedliwości i przejrzystości dla użytkowników biznesowych usług pośrednictwa internetowego (P2B).' },
                { type: 'p', text: '6. Korzystanie z Serwisu bez zakładania Konta (przeglądanie ofert i profili) nie wymaga akceptacji Regulaminu, ale wymaga przestrzegania zasad z §14. Założenie Konta wymaga zapoznania się z Regulaminem i Polityką prywatności oraz ich akceptacji.' },
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
                        ['Czat', 'funkcja wymiany wiadomości tekstowych, zdjęć, plików i nagrań pomiędzy Użytkownikami.'],
                        ['Certyfikat', 'informacja o uprawnieniu, kwalifikacji lub ukończonym szkoleniu dodana przez Usługodawcę do Profilu, wraz z opcjonalnym skanem dokumentu.'],
                        ['Aktualność', 'wpis publikowany przez Usługodawcę i widoczny dla obserwujących go Użytkowników oraz na Profilu.'],
                        ['Plus', 'pakiet rozszerzonych funkcji dla Usługodawców opisany w §12.'],
                        ['Treści', 'wszelkie materiały zamieszczane przez Użytkowników w Serwisie, w szczególności Ogłoszenia, opisy, zdjęcia, nagrania, Opinie, wiadomości na Czacie, Certyfikaty i Aktualności.'],
                        ['Konsument', 'Użytkownik będący osobą fizyczną, który korzysta z Serwisu w celu niezwiązanym bezpośrednio z jego działalnością gospodarczą lub zawodową.'],
                        ['Przedsiębiorca', 'Usługodawca, który oferuje usługi w ramach działalności gospodarczej lub zawodowej (w tym działalności nierejestrowanej).'],
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
                        'funkcje pakietu Plus (§12),',
                        'powiadomienia e-mail i push związane z korzystaniem z Serwisu.',
                    ],
                },
                { type: 'p', text: '2. Wszystkie usługi wymienione w ust. 1 są obecnie **nieodpłatne**. Operator nie pobiera prowizji od usług świadczonych pomiędzy Użytkownikami. Wprowadzenie odpłatności wymaga zmiany Regulaminu w trybie §22.' },
                { type: 'p', text: '3. Umowa o świadczenie usług drogą elektroniczną w zakresie Konta zostaje zawarta z chwilą założenia Konta, na czas nieokreślony. W zakresie przeglądania Serwisu bez Konta umowa zostaje zawarta z chwilą wejścia do Serwisu i wygasa z chwilą jego opuszczenia.' },
            ],
        },
        {
            id: 'wymagania-techniczne',
            title: 'Wymagania techniczne i zagrożenia',
            blocks: [
                { type: 'p', text: '1. Do korzystania z Serwisu potrzebne są: urządzenie z dostępem do Internetu, aktualna przeglądarka internetowa z obsługą JavaScript i plików cookies (np. Chrome, Safari, Firefox, Edge) albo aplikacja mobilna w wersji obsługiwanej przez system iOS lub Android, a do założenia Konta – aktywny adres e-mail lub konto Google, Facebook albo Apple.' },
                { type: 'p', text: '2. Niektóre funkcje aplikacji mobilnej wymagają zgód systemowych (lokalizacja, aparat, zdjęcia, powiadomienia, Face ID / odcisk palca). Brak zgody ogranicza jedynie daną funkcję. Zgody można w każdej chwili zmienić w ustawieniach urządzenia.' },
                { type: 'p', text: '3. Zgodnie z art. 6 pkt 1 ustawy o świadczeniu usług drogą elektroniczną Operator informuje o szczególnych zagrożeniach związanych z korzystaniem z usług drogą elektroniczną, takich jak: złośliwe oprogramowanie, wyłudzanie danych logowania (phishing), przejęcie Konta, podszywanie się pod innych Użytkowników lub pod Operatora oraz oszustwa przy rozliczeniach poza Serwisem. Operator nigdy nie prosi o hasło ani dane karty płatniczej. Zalecamy korzystanie z aktualnego oprogramowania, silnego i unikalnego hasła oraz weryfikacji dwuetapowej, a także ostrożność wobec linków i próśb o przedpłatę od nieznanych osób.' },
            ],
        },
        {
            id: 'konto',
            title: 'Konto',
            blocks: [
                { type: 'p', text: '1. Konto można założyć, podając adres e-mail i hasło albo logując się przez Google, Facebook lub Apple. Przy logowaniu przez zewnętrznego dostawcę Operator otrzymuje od niego dane opisane w Polityce prywatności.' },
                { type: 'p', text: '2. Użytkownik podaje dane prawdziwe i aktualne. Imię wyświetlane na Profilu nie może wprowadzać w błąd co do tożsamości Użytkownika.' },
                { type: 'p', text: '3. Jedna osoba może mieć jedno Konto. Konto jest osobiste i nie może być udostępniane ani przenoszone na inne osoby.' },
                { type: 'p', text: '4. Użytkownik chroni dane logowania przed osobami trzecimi. W razie podejrzenia przejęcia Konta należy niezwłocznie zmienić hasło i powiadomić Operatora.' },
                { type: 'p', text: '5. Użytkownik może w każdej chwili, bez podania przyczyny i bez kosztów, usunąć Konto w ustawieniach Konta (w aplikacji i w serwisie internetowym) lub na stronie mylokalni.pl/delete-account. Usunięcie Konta jest równoznaczne z wypowiedzeniem umowy ze skutkiem natychmiastowym. Skutki usunięcia dla danych opisuje Polityka prywatności.' },
                { type: 'p', text: '6. Konsument może odstąpić od umowy o prowadzenie Konta w terminie 14 dni od jej zawarcia bez podania przyczyny – wystarczy usunąć Konto albo przesłać Operatorowi oświadczenie na adres e-mail. Ponieważ usługi są nieodpłatne, odstąpienie nie wiąże się z żadnymi kosztami ani zwrotami.' },
            ],
        },
        {
            id: 'maloletni',
            title: 'Małoletni',
            blocks: [
                { type: 'p', text: '1. Konto może założyć osoba, która ukończyła 13 lat.' },
                { type: 'p', text: '2. Osoba w wieku 13–15 lat może założyć Konto wyłącznie za zgodą rodzica lub opiekuna prawnego, potwierdzoną przez kliknięcie w link wysłany na jego adres e-mail (art. 8 RODO). Do czasu potwierdzenia Konto nie jest aktywne.' },
                { type: 'p', text: '3. Osoba w wieku 13–17 lat ma ograniczoną zdolność do czynności prawnych. Może samodzielnie korzystać z Serwisu w zakresie drobnych, bieżących spraw życia codziennego, natomiast oferowanie usług za wynagrodzenie oraz zawieranie umów wykraczających poza ten zakres wymaga zgody przedstawiciela ustawowego, a w przypadku pracy lub usług świadczonych przez osoby małoletnie – także przestrzegania przepisów chroniących małoletnich.' },
                { type: 'p', text: `4. Rodzic lub opiekun prawny może w każdej chwili zażądać zablokowania lub usunięcia Konta małoletniego, pisząc na ${OPERATOR.email}.` },
                { type: 'p', text: '5. Jeżeli Operator poweźmie wiadomość, że Konto założyła osoba poniżej 13 lat albo osoba w wieku 13–15 lat bez zgody rodzica lub opiekuna, usunie Konto i dane.' },
            ],
        },
        {
            id: 'rola-serwisu',
            title: 'Rola Serwisu i umowy pomiędzy Użytkownikami',
            blocks: [
                { type: 'p', text: '1. Serwis jest platformą ogłoszeniową i narzędziem do kontaktu oraz umawiania terminów. **Operator nie jest stroną umów** zawieranych pomiędzy Klientami a Usługodawcami, nie świadczy usług oferowanych w Ogłoszeniach, nie jest pośrednikiem w płatnościach i nie przyjmuje płatności za te usługi.' },
                { type: 'p', text: '2. Warunki usługi (zakres, cenę, termin, sposób płatności, rękojmię lub gwarancję) Klient i Usługodawca uzgadniają bezpośrednio. Rozliczenia odbywają się poza Serwisem. Za wykonanie usługi, jej jakość, legalność oraz wystawienie dokumentu sprzedaży odpowiada wyłącznie Usługodawca.' },
                { type: 'p', text: '3. Na podstawie art. 12a ustawy o prawach konsumenta Operator informuje, że:' },
                {
                    type: 'list',
                    items: [
                        'informacja o tym, czy Usługodawca jest Przedsiębiorcą, pochodzi wyłącznie z oświadczenia Usługodawcy złożonego w Serwisie; Operator jej nie weryfikuje,',
                        'jeżeli Usługodawca nie jest Przedsiębiorcą, do umowy zawieranej z nim przez Klienta nie stosuje się przepisów o ochronie konsumentów (w tym prawa odstąpienia od umowy zawartej na odległość),',
                        'obowiązki wynikające z umowy o usługę (wykonanie usługi, odpowiedzialność za jej wady, obowiązki informacyjne wobec Konsumenta, rozliczenie podatkowe) spoczywają na Usługodawcy; Operator odpowiada wyłącznie za prawidłowe działanie Serwisu,',
                        'główne parametry decydujące o kolejności wyświetlania Ogłoszeń opisuje §11.',
                    ],
                },
                { type: 'p', text: '4. Operator nie weryfikuje tożsamości, kwalifikacji, uprawnień ani doświadczenia Usługodawców. Certyfikaty publikowane są na odpowiedzialność Usługodawcy i nie są przez Operatora sprawdzane. Klient powinien samodzielnie ocenić Usługodawcę, w szczególności przy usługach wymagających uprawnień.' },
            ],
        },
        {
            id: 'uslugodawca',
            title: 'Obowiązki Usługodawcy',
            blocks: [
                { type: 'p', text: '1. Usługodawca odpowiada za to, aby Ogłoszenie, Profil i Certyfikaty były prawdziwe, aktualne i zgodne z prawem, a cena i opis usługi nie wprowadzały w błąd.' },
                { type: 'p', text: '2. Usługodawca oferuje wyłącznie usługi, do których świadczenia jest uprawniony. Jeżeli świadczenie usługi wymaga uprawnień, zezwolenia, wpisu do rejestru lub ubezpieczenia, Usługodawca ma je przed rozpoczęciem świadczenia.' },
                { type: 'p', text: '3. Usługodawca, który działa jako Przedsiębiorca, zaznacza to w Serwisie, jeżeli Serwis udostępnia taką funkcję, i wykonuje wobec Konsumentów obowiązki wynikające z przepisów o ochronie konsumentów, w tym obowiązki informacyjne przed zawarciem umowy.' },
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
                { type: 'p', text: '5. Przypomnienia o terminach mają charakter pomocniczy. Operator nie odpowiada za skutki niedotarcia przypomnienia, np. z powodu wyłączenia powiadomień na urządzeniu.' },
            ],
        },
        {
            id: 'opinie',
            title: 'Opinie',
            blocks: [
                { type: 'p', text: '1. Opinię o usłudze może wystawić wyłącznie Klient, którego Rezerwacja u danego Usługodawcy została oznaczona jako zrealizowana, w terminie 14 dni od tej chwili. Do jednej Rezerwacji można wystawić jedną Opinię.' },
                { type: 'p', text: '2. Informacja wymagana przepisami ustawy o przeciwdziałaniu nieuczciwym praktykom rynkowym (w brzmieniu wdrażającym dyrektywę Omnibus): Operator zapewnia, że Opinie pochodzą od osób, które skorzystały z usługi, w ten sposób, że możliwość wystawienia Opinii jest technicznie powiązana z Kontem Klienta i zrealizowaną Rezerwacją w Serwisie. Operator nie sprawdza, czy usługa została faktycznie wykonana poza Serwisem. Opinie oznaczone jako „Zweryfikowana realizacja” zostały wystawione w opisany sposób.' },
                { type: 'p', text: '3. Opinie są publikowane w kolejności chronologicznej lub według wybranego przez Użytkownika sortowania. Operator nie usuwa ani nie ukrywa Opinii z powodu ich negatywnego charakteru i nie zmienia ich treści. Opinia może zostać usunięta wyłącznie w przypadku naruszenia prawa lub §14 – w trybie §15.' },
                { type: 'p', text: '4. Zabronione jest wystawianie Opinii nieprawdziwych, za wynagrodzeniem lub inną korzyścią, o własnych usługach lub usługach osób powiązanych, a także zlecanie lub publikowanie takich Opinii.' },
                { type: 'p', text: '5. Usługodawca może publicznie odpowiedzieć na Opinię. Opinię i zdjęcie do niej można zgłosić w trybie §16.' },
            ],
        },
        {
            id: 'ranking',
            title: 'Kolejność wyświetlania Ogłoszeń',
            blocks: [
                { type: 'p', text: '1. Informacja o głównych parametrach decydujących o kolejności (plasowaniu) Ogłoszeń prezentowanych w wynikach wyszukiwania – na podstawie art. 12a pkt 1 ustawy o prawach konsumenta, art. 6 ust. 3 ustawy o przeciwdziałaniu nieuczciwym praktykom rynkowym oraz art. 5 rozporządzenia P2B.' },
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
                { type: 'p', text: '4. Sekcja ofert polecanych na stronie głównej jest dobierana według kategorii, które Użytkownik przeglądał (ok. 35%), tego, czy Ogłoszenie było już ostatnio oglądane (ok. 30%), oraz ocen, popularności i pakietu Plus (ok. 35%).' },
                { type: 'p', text: '5. **Pakiet Plus wpływa na kolejność wyświetlania** w zakresie opisanym w ust. 3 i 4. Obecnie Plus jest udostępniany nieodpłatnie (§12). Poza tym Operator nie przyjmuje od Usługodawców żadnych płatności ani innych korzyści za wyższą pozycję w wynikach. Operator nie traktuje odmiennie Ogłoszeń prowadzonych przez siebie lub podmioty z nim powiązane.' },
            ],
        },
        {
            id: 'plus',
            title: 'Pakiet Plus',
            blocks: [
                { type: 'p', text: '1. Plus to pakiet dodatkowych funkcji dla Usługodawców obejmujący w szczególności: grafik pracy i zarządzanie dostępnością terminów, Certyfikaty na Profilu, Aktualności dla obserwujących, własne zdjęcie tła Profilu oraz wyróżnienie w wynikach wyszukiwania zgodnie z §11.' },
                { type: 'p', text: '2. Obecnie każdy Użytkownik może jednorazowo aktywować Plus **bezpłatnie na 30 dni**. Po upływie tego okresu Plus wygasa automatycznie. Aktywacja nie wymaga podawania danych płatniczych i nie przekształca się w płatną subskrypcję.' },
                { type: 'p', text: '3. Po wygaśnięciu Plus Treści dodane w ramach jego funkcji mogą przestać być wyświetlane na Profilu. Operator nie usuwa ich wyłącznie z powodu wygaśnięcia Plus.' },
                { type: 'p', text: '4. Ewentualne wprowadzenie płatnego Plus nastąpi wyłącznie po zmianie Regulaminu w trybie §22, z podaniem ceny, okresu rozliczeniowego, sposobu płatności i zasad rezygnacji. Wymaga ono też wyraźnej decyzji Użytkownika o zakupie.' },
            ],
        },
        {
            id: 'tresci',
            title: 'Treści Użytkowników',
            blocks: [
                { type: 'p', text: '1. Użytkownik odpowiada za zamieszczane Treści i oświadcza, że ma do nich prawa, a osoby widoczne na zdjęciach lub nagraniach zgodziły się na ich publikację.' },
                { type: 'p', text: '2. Użytkownik zachowuje prawa do Treści. Zamieszczając Treść, udziela Operatorowi nieodpłatnej, niewyłącznej, nieograniczonej terytorialnie licencji na jej przechowywanie, zwielokrotnianie, wyświetlanie i udostępnianie w Serwisie (w tym w wynikach wyszukiwania i podglądach linków w mediach społecznościowych) oraz na dostosowanie formatu (np. zmniejszenie zdjęcia) – w zakresie niezbędnym do działania Serwisu, na czas publikowania Treści w Serwisie.' },
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
                        'podszywanie się pod inne osoby lub pod Operatora, wprowadzanie w błąd co do tożsamości, kwalifikacji lub ceny,',
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
                { type: 'p', text: '1. Informacja na podstawie art. 14 DSA: Operator moderuje Treści na podstawie zgłoszeń Użytkowników i osób trzecich (§16), zgłoszeń organów oraz informacji uzyskanych w inny sposób. Zgłoszenia rozpatruje człowiek – Operator. Operator nie stosuje zautomatyzowanych narzędzi do podejmowania decyzji o usunięciu Treści. Automatycznie stosowane są jedynie zabezpieczenia techniczne, takie jak limity liczby działań w czasie, usuwanie kodu HTML z tekstów oraz weryfikacja typu i rozmiaru plików.' },
                { type: 'p', text: '2. W razie naruszenia prawa lub Regulaminu Operator może, proporcjonalnie do wagi naruszenia: usunąć lub ukryć Treść, ograniczyć widoczność Ogłoszenia lub Profilu, ograniczyć korzystanie z wybranych funkcji (np. Czatu), czasowo zawiesić Konto albo – przy poważnych lub powtarzających się naruszeniach – usunąć Konto.' },
                { type: 'p', text: '3. O każdej takiej decyzji Operator informuje Użytkownika, którego dotyczy, najpóźniej w chwili jej zastosowania, podając (art. 17 DSA): rodzaj ograniczenia i jego zakres czasowy, fakty i okoliczności, które legły u podstaw decyzji, wskazanie, czy decyzja dotyczy treści nielegalnej (z podstawą prawną) czy niezgodnej z Regulaminem (ze wskazaniem postanowienia), informację, że decyzji nie podjęto w sposób zautomatyzowany, oraz możliwość odwołania (§17). Obowiązek ten nie dotyczy spamu oraz sytuacji, gdy zakazuje tego organ.' },
                { type: 'p', text: '4. Operator nie ma ogólnego obowiązku monitorowania Treści ani aktywnego poszukiwania naruszeń. Operator nie przegląda wiadomości na Czacie, chyba że jest to niezbędne do rozpatrzenia zgłoszenia, które ich dotyczy, albo wynika z przepisów prawa.' },
                { type: 'p', text: '5. Jeżeli Operator poweźmie informację o treściach wskazujących na przestępstwo zagrażające życiu lub bezpieczeństwu osoby, niezwłocznie powiadamia organy ścigania (art. 18 DSA).' },
            ],
        },
        {
            id: 'zgloszenia',
            title: 'Zgłaszanie nielegalnych treści',
            blocks: [
                { type: 'p', text: `1. Każdy, także osoba bez Konta, może zgłosić Treść, którą uważa za nielegalną lub niezgodną z Regulaminem: za pomocą przycisku „Zgłoś” przy Treści, Profilu lub w Czacie albo e-mailem na ${OPERATOR.email} (art. 16 DSA).` },
                { type: 'p', text: '2. Zgłoszenie powinno zawierać: uzasadnienie, dlaczego Treść jest nielegalna lub narusza Regulamin; dokładne wskazanie Treści (link albo opis pozwalający ją odnaleźć); imię i nazwisko lub nazwę oraz adres e-mail zgłaszającego (chyba że zgłoszenie dotyczy wykorzystywania seksualnego dzieci); oświadczenie, że zgłaszający w dobrej wierze uważa informacje w zgłoszeniu za prawidłowe i kompletne.' },
                { type: 'p', text: '3. Operator niezwłocznie potwierdza otrzymanie zgłoszenia podpisanego adresem e-mail, rozpatruje je w odpowiednim czasie, starannie i obiektywnie, a następnie informuje zgłaszającego o decyzji i możliwościach jej zaskarżenia.' },
                { type: 'p', text: `4. Punkt kontaktowy dla organów państw członkowskich, Komisji Europejskiej i Rady ds. Usług Cyfrowych (art. 11 DSA) oraz dla odbiorców usługi (art. 12 DSA): ${OPERATOR.email}. Języki komunikacji: polski i angielski.` },
                { type: 'p', text: '5. Operator może zawiesić rozpatrywanie zgłoszeń od osób, które często składają zgłoszenia ewidentnie bezzasadne, po uprzednim ostrzeżeniu (art. 23 ust. 2 DSA stosowany odpowiednio).' },
            ],
        },
        {
            id: 'reklamacje',
            title: 'Reklamacje i odwołania',
            blocks: [
                { type: 'p', text: `1. Reklamację dotyczącą działania Serwisu oraz odwołanie od decyzji z §15 można złożyć e-mailem na ${OPERATOR.email} lub pisemnie na adres ${operatorAddress()}.` },
                { type: 'p', text: '2. Zgłoszenie powinno zawierać dane pozwalające zidentyfikować Użytkownika (np. adres e-mail Konta), opis problemu lub decyzji, której dotyczy, oraz oczekiwany sposób rozwiązania. Odwołanie można złożyć w terminie 6 miesięcy od otrzymania informacji o decyzji.' },
                { type: 'p', text: '3. Operator rozpatruje reklamację lub odwołanie w terminie **14 dni** od otrzymania i odpowiada e-mailem albo pisemnie. Odwołanie rozpatruje człowiek. Jeżeli odwołanie okaże się zasadne, Operator niezwłocznie cofa decyzję.' },
                { type: 'p', text: '4. Reklamacje dotyczące usług świadczonych przez Usługodawców należy kierować bezpośrednio do Usługodawcy, który jest za nie odpowiedzialny.' },
                { type: 'p', text: '5. Konsument może skorzystać z pozasądowych sposobów rozpatrywania sporów, w szczególności zwrócić się o pomoc do miejskiego lub powiatowego rzecznika konsumentów, organizacji konsumenckiej (np. Federacji Konsumentów) albo do wojewódzkiego inspektoratu Inspekcji Handlowej z wnioskiem o mediację. Informacje są dostępne na stronie uokik.gov.pl. Skorzystanie z tych sposobów jest dobrowolne.' },
            ],
        },
        {
            id: 'zakonczenie',
            title: 'Ograniczenie, zawieszenie i zakończenie świadczenia usług',
            blocks: [
                { type: 'p', text: '1. Operator może wypowiedzieć umowę o prowadzenie Konta z ważnych powodów, w szczególności poważnego lub powtarzającego się naruszenia Regulaminu lub prawa, z zachowaniem **30-dniowego** okresu wypowiedzenia, przesyłając uzasadnienie na adres e-mail Konta.' },
                { type: 'p', text: '2. Operator może zawiesić Konto lub usunąć je bez okresu wypowiedzenia, jeżeli wymagają tego przepisy prawa, nakaz organu albo Użytkownik w sposób poważny lub powtarzający się narusza prawo lub Regulamin (np. oszustwa, treści nielegalne, podszywanie się). Decyzję wraz z uzasadnieniem Operator przekazuje Użytkownikowi niezwłocznie (art. 4 rozporządzenia P2B, art. 17 DSA).' },
                { type: 'p', text: '3. Użytkownik może odwołać się od decyzji w trybie §17. Przy usunięciu Konta Operator umożliwia pobranie kopii danych, chyba że sprzeciwiają się temu przepisy prawa lub nakaz organu.' },
                { type: 'p', text: '4. Operator może zakończyć prowadzenie Serwisu, informując Użytkowników z co najmniej 30-dniowym wyprzedzeniem.' },
            ],
        },
        {
            id: 'odpowiedzialnosc',
            title: 'Odpowiedzialność',
            blocks: [
                { type: 'p', text: '1. Operator dokłada starań, aby Serwis działał nieprzerwanie i prawidłowo. Mogą jednak wystąpić przerwy techniczne, w szczególności związane z aktualizacjami lub awariami infrastruktury. O planowanych dłuższych przerwach Operator informuje z wyprzedzeniem, jeżeli to możliwe.' },
                { type: 'p', text: '2. Operator nie odpowiada za Treści zamieszczane przez Użytkowników, jeżeli nie wie o ich bezprawnym charakterze, a po uzyskaniu takiej wiedzy niezwłocznie uniemożliwia do nich dostęp (art. 14 ustawy o świadczeniu usług drogą elektroniczną, art. 6 DSA).' },
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
                { type: 'p', text: '3. Umowa dotycząca aplikacji jest zawierana pomiędzy Użytkownikiem a Operatorem. Apple Inc. i Google LLC nie są jej stronami, nie odpowiadają za aplikację ani jej treść, nie mają obowiązku świadczenia wsparcia technicznego ani obsługi i nie odpowiadają za roszczenia Użytkownika lub osób trzecich związane z aplikacją (w tym roszczenia z tytułu niezgodności z prawem, ochrony konsumentów lub naruszenia praw własności intelektualnej). Za aplikację, jej wsparcie i rozpatrywanie takich roszczeń odpowiada Operator.' },
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
                { type: 'p', text: '1. Operator może zmienić Regulamin z ważnych przyczyn, takich jak: zmiana przepisów prawa lub ich wykładni, decyzja lub orzeczenie organu albo sądu, zmiana zakresu, funkcji lub sposobu świadczenia usług, wprowadzenie odpłatności, konieczność przeciwdziałania nadużyciom lub poprawa bezpieczeństwa.' },
                { type: 'p', text: '2. O zmianie Operator informuje Użytkowników posiadających Konto e-mailem oraz w Serwisie co najmniej **15 dni** przed jej wejściem w życie, udostępniając nową treść Regulaminu. Krótszy termin jest możliwy, gdy wymagają tego przepisy prawa lub nakaz organu albo gdy zmiana jest niezbędna do przeciwdziałania nieprzewidzianemu i bezpośredniemu zagrożeniu bezpieczeństwa Serwisu lub Użytkowników.' },
                { type: 'p', text: '3. Użytkownik, który nie akceptuje zmian, może przed ich wejściem w życie usunąć Konto. Dalsze korzystanie z Konta po wejściu zmian w życie oznacza ich akceptację.' },
            ],
        },
        {
            id: 'postanowienia-koncowe',
            title: 'Postanowienia końcowe',
            blocks: [
                { type: 'p', text: '1. Regulamin podlega prawu polskiemu. Wybór prawa nie pozbawia Konsumenta ochrony przysługującej mu na podstawie bezwzględnie obowiązujących przepisów prawa państwa jego zwykłego pobytu.' },
                { type: 'p', text: '2. Spory rozstrzyga sąd właściwy według przepisów Kodeksu postępowania cywilnego.' },
                { type: 'p', text: `3. Regulamin obowiązuje od ${formatLegalDate(LEGAL_DATES.termsEffective)} r. i zastępuje wcześniejsze wersje. Wcześniejsza wersja jest dostępna na żądanie przesłane na ${OPERATOR.email}.` },
            ],
        },
    ],
};
