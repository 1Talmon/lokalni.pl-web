import { OPERATOR, LEGAL_DATES, formatLegalDate, operatorAddress } from './operator';
import type { LegalDocumentData } from './types';

export const PRIVACY: LegalDocumentData = {
    title: 'Polityka prywatności',
    dateLine: `Ostatnia aktualizacja: ${formatLegalDate(LEGAL_DATES.privacyUpdated)} r.`,
    intro: 'Poniżej wyjaśniamy, jakie dane osobowe przetwarzamy w serwisie i aplikacji MyLokalni, w jakim celu, jak długo i komu je przekazujemy oraz jakie masz prawa. Polityka spełnia obowiązki informacyjne z art. 13 i 14 RODO.',
    sections: [
        {
            id: 'administrator',
            title: 'Administrator danych',
            blocks: [
                { type: 'p', text: `1. Administratorem Twoich danych osobowych jest **${OPERATOR.fullName}**, ${operatorAddress()}, prowadzący serwis ${OPERATOR.serviceName} jako osoba fizyczna w ramach działalności nierejestrowanej (dalej: „Administrator”, „my”).` },
                { type: 'p', text: `2. Kontakt we wszystkich sprawach dotyczących danych osobowych: ${OPERATOR.email} lub pisemnie na adres podany powyżej.` },
                { type: 'p', text: '3. Administrator nie wyznaczył inspektora ochrony danych, ponieważ nie ma takiego obowiązku (art. 37 RODO).' },
                { type: 'p', text: `4. Polityka dotyczy serwisu internetowego ${OPERATOR.website} oraz aplikacji mobilnej MyLokalni na iOS i Android (dalej łącznie: „Serwis”).` },
            ],
        },
        {
            id: 'zrodla',
            title: 'Skąd mamy Twoje dane',
            blocks: [
                {
                    type: 'list',
                    items: [
                        'bezpośrednio od Ciebie – gdy zakładasz Konto, uzupełniasz Profil, dodajesz Ogłoszenia, piszesz na Czacie, rezerwujesz lub wystawiasz Opinie,',
                        'od Google, Meta (Facebook) lub Apple – gdy logujesz się przez te usługi: identyfikator konta, adres e-mail, imię i nazwisko oraz zdjęcie profilowe, jeżeli dostawca je przekaże (Apple może przekazać zastępczy adres e-mail),',
                        'od innych Użytkowników – np. gdy Klient rezerwuje Twoją usługę, pisze do Ciebie albo wystawia Ci Opinię, a także gdy ktoś zgłasza naruszenie,',
                        'automatycznie z Twojego urządzenia – adres IP, informacje o przeglądarce lub systemie, identyfikator urządzenia do powiadomień, a za Twoją zgodą systemową – lokalizacja.',
                    ],
                },
            ],
        },
        {
            id: 'cele',
            title: 'Cele, podstawy prawne i okresy przetwarzania',
            blocks: [
                {
                    type: 'table',
                    head: ['Cel', 'Dane', 'Podstawa prawna', 'Jak długo'],
                    rows: [
                        ['Założenie i prowadzenie Konta, logowanie, bezpieczeństwo Konta (m.in. weryfikacja dwuetapowa)', 'e-mail, hasło (wyłącznie w postaci skrótu), imię i nazwisko, data urodzenia, identyfikatory kont Google / Facebook / Apple, numer telefonu, jeżeli go podasz', 'art. 6 ust. 1 lit. b RODO – wykonanie umowy', 'do usunięcia Konta'],
                        ['Weryfikacja wieku i zgoda rodzica dla osób w wieku 13–15 lat', 'data urodzenia, e-mail rodzica lub opiekuna, data potwierdzenia zgody', 'art. 6 ust. 1 lit. c w zw. z art. 8 RODO; art. 6 ust. 1 lit. f (wykazanie zgody)', 'do usunięcia Konta dziecka, a dowód zgody – do upływu przedawnienia roszczeń'],
                        ['Publiczny Profil, Ogłoszenia, Certyfikaty, Aktualności', 'imię, zdjęcie, opis, kategorie, ceny, miejscowość lub obszar działania, zdjęcia i nagrania, skany Certyfikatów, linki do mediów społecznościowych, telefon i e-mail – jeżeli zdecydujesz się je pokazać', 'art. 6 ust. 1 lit. b RODO', 'do usunięcia danej Treści lub Konta'],
                        ['Wyszukiwanie usług w pobliżu', 'wskazana miejscowość lub lokalizacja urządzenia (tylko po zgodzie systemowej, wyłącznie podczas korzystania z aplikacji)', 'art. 6 ust. 1 lit. b RODO; dostęp do lokalizacji urządzenia – Twoja zgoda systemowa (art. 399 PKE)', 'lokalizacja urządzenia nie jest zapisywana na serwerze – służy do jednorazowego wyszukania (współrzędne przekazujemy dostawcy usług lokalizacyjnych wyłącznie w celu ustalenia nazwy miejscowości)'],
                        ['Rezerwacje, kalendarz i przypomnienia', 'dane stron, usługa, data i godzina, adres wykonania usługi i jego współrzędne, notatki, status', 'art. 6 ust. 1 lit. b RODO', 'do usunięcia Konta; po usunięciu – w formie zanonimizowanej. Współrzędne adresu ustalamy przez dostawcę usług lokalizacyjnych; wynik przechowujemy w pamięci podręcznej bez powiązania z Kontem – do 12 miesięcy'],
                        ['Czat', 'treść wiadomości, zdjęcia, nagrania, pliki, daty, informacja o odczytaniu', 'art. 6 ust. 1 lit. b RODO', 'do usunięcia Konta; wiadomości wysłane innym osobom pozostają w ich rozmowach jako wiadomości „Usuniętego Użytkownika” (art. 6 ust. 1 lit. f – interes rozmówcy)'],
                        ['Opinie i odpowiedzi na Opinie', 'ocena, treść, zdjęcie, imię autora, powiązana Rezerwacja', 'art. 6 ust. 1 lit. b i f RODO – rzetelność ocen dla innych Użytkowników', 'do usunięcia; po usunięciu Konta – w formie zanonimizowanej'],
                        ['Zestawienia zarobków i pomocnicza ewidencja sprzedaży', 'kwoty z Rezerwacji i wpisy ręczne, adres do ewidencji (ulica, kod, miejscowość)', 'art. 6 ust. 1 lit. b RODO', 'do usunięcia wpisów lub Konta'],
                        ['Polecane oferty i statystyki wyszukiwania', 'historia wyświetlonych i dodanych do ulubionych Ogłoszeń, rozpoczętych rozmów i Rezerwacji, wyszukiwane frazy, najczęściej przeglądane kategorie i miejscowości', 'art. 6 ust. 1 lit. f RODO – dopasowanie ofert i rozwój wyszukiwarki; możesz wnieść sprzeciw', 'do 12 miesięcy; po usunięciu Konta – usuwane lub odłączane od Konta'],
                        ['Pakiet Plus', 'data aktywacji i wygaśnięcia okresu bezpłatnego', 'art. 6 ust. 1 lit. b RODO', 'do usunięcia Konta'],
                        ['Powiadomienia e-mail i push związane z Kontem (np. nowa wiadomość, Rezerwacja, przypomnienie)', 'e-mail, token urządzenia do powiadomień', 'art. 6 ust. 1 lit. b RODO; powiadomienia push – po Twojej zgodzie systemowej', 'token – do wylogowania lub usunięcia Konta'],
                        ['Przypomnienia o uzupełnieniu Profilu i wskazówki dotyczące korzystania z Serwisu', 'e-mail, stan uzupełnienia Profilu', 'art. 6 ust. 1 lit. f RODO – rozwój Serwisu; możesz w każdej chwili wnieść sprzeciw', 'do sprzeciwu lub usunięcia Konta'],
                        ['Moderacja, zgłoszenia, odwołania i blokowanie Użytkowników (DSA)', 'treść zgłoszenia, dane zgłaszającego, zgłoszona Treść, decyzja i uzasadnienie, lista zablokowanych osób', 'art. 6 ust. 1 lit. c RODO (obowiązki z DSA) oraz lit. f (bezpieczeństwo Użytkowników)', 'do 3 lat od zamknięcia sprawy, a lista blokad – do jej zdjęcia lub usunięcia Konta'],
                        ['Bezpieczeństwo, zapobieganie nadużyciom, wykrywanie błędów', 'adres IP, logi zdarzeń (np. logowania, zmiana hasła, usunięcie Konta), informacje techniczne o błędach', 'art. 6 ust. 1 lit. f RODO – bezpieczeństwo Serwisu', 'do 12 miesięcy'],
                        ['Obsługa zapytań i reklamacji', 'dane z korespondencji', 'art. 6 ust. 1 lit. b, c lub f RODO', 'do zakończenia sprawy, następnie do upływu przedawnienia roszczeń'],
                        ['Ustalenie, dochodzenie lub obrona roszczeń', 'dane niezbędne do wykazania okoliczności sprawy', 'art. 6 ust. 1 lit. f RODO', 'do upływu przedawnienia roszczeń'],
                    ],
                },
                { type: 'p', text: 'Nie prowadzimy marketingu na rzecz podmiotów trzecich, nie wyświetlamy reklam, nie korzystamy z narzędzi analitycznych ani reklamowych podmiotów zewnętrznych (np. Google Analytics, Meta Pixel) i **nie sprzedajemy danych osobowych**.' },
            ],
        },
        {
            id: 'dobrowolnosc',
            title: 'Czy musisz podać dane',
            blocks: [
                { type: 'p', text: 'Podanie danych jest dobrowolne, ale bez adresu e-mail (lub konta Google, Facebook albo Apple), imienia i daty urodzenia nie da się założyć Konta. Pozostałe dane (zdjęcie, telefon, opis, lokalizacja, linki) są opcjonalne – bez nich niektóre funkcje mogą być niedostępne.' },
            ],
        },
        {
            id: 'odbiorcy',
            title: 'Komu przekazujemy dane',
            blocks: [
                { type: 'p', text: '1. **Innym Użytkownikom** – w zakresie, w jakim sam publikujesz dane (Profil, Ogłoszenia, Opinie, Certyfikaty, Aktualności) lub kontaktujesz się z kimś (Czat, Rezerwacje). Treści publiczne są widoczne także dla osób bez Konta i mogą być indeksowane przez wyszukiwarki internetowe.' },
                { type: 'p', text: '2. **Podmiotom przetwarzającym dane na nasze zlecenie** (art. 28 RODO) – na podstawie umów powierzenia i wyłącznie w zakresie niezbędnym do działania Serwisu. Są to następujące kategorie dostawców:' },
                {
                    type: 'table',
                    head: ['Kategoria dostawców', 'Zakres', 'Miejsce przetwarzania'],
                    rows: [
                        ['dostawcy infrastruktury serwerowej i sieciowej', 'serwery, przekazywanie ruchu, sieć CDN, ochrona przed atakami, hosting serwisu, przechowywanie plików (zdjęcia, nagrania, Certyfikaty, pliki z Czatu)', 'Polska i inne państwa UE; możliwy transfer do USA'],
                        ['dostawcy przechowywania kopii zapasowych', 'zaszyfrowane kopie zapasowe w niezależnych lokalizacjach', 'UE'],
                        ['dostawca wysyłki wiadomości e-mail', 'wysyłka wiadomości e-mail z Serwisu', 'USA'],
                        ['dostawcy usług powiadomień push', 'dostarczanie powiadomień na urządzenia', 'UE i USA'],
                        ['dostawcy narzędzi diagnostycznych i monitoringu', 'wykrywanie błędów aplikacji, monitorowanie działania serwerów, logi techniczne (mogą zawierać adres IP)', 'UE i Wielka Brytania'],
                        ['dostawcy map i usług lokalizacyjnych', 'podpowiadanie adresów i miejscowości, mapy, zamiana adresu na współrzędne i współrzędnych na nazwę miejscowości (bez danych pozwalających Cię zidentyfikować)', 'UE, Wielka Brytania i USA'],
                    ],
                },
                { type: 'p', text: `Aktualną listę dostawców z nazwy przekażemy Ci na prośbę wysłaną na ${OPERATOR.email}.` },
                { type: 'p', text: '3. **Niezależnym administratorom**: Google, Meta Platforms i Apple – gdy logujesz się przez ich usługi (przetwarzają dane według własnych polityk prywatności); operatorom sklepów z aplikacjami i systemowych usług powiadomień (Apple, Google); dostawcom poczty e-mail i hostingu Twoich rozmówców.' },
                { type: 'p', text: '4. **Organom publicznym** (np. sądom, prokuraturze, Policji, Prezesowi UKE, UOKiK) – wyłącznie gdy wynika to z przepisów prawa, w tym z nakazów wydanych na podstawie DSA.' },
            ],
        },
        {
            id: 'transfer',
            title: 'Przekazywanie danych poza Europejski Obszar Gospodarczy',
            blocks: [
                { type: 'p', text: 'Część dostawców może przetwarzać dane w USA. Przekazanie odbywa się na podstawie decyzji Komisji Europejskiej stwierdzającej odpowiedni stopień ochrony w ramach EU–US Data Privacy Framework (art. 45 RODO) wobec podmiotów certyfikowanych w tym programie, a w pozostałym zakresie – na podstawie standardowych klauzul umownych zatwierdzonych przez Komisję Europejską (art. 46 ust. 2 lit. c RODO). Dane przekazywane do Wielkiej Brytanii są chronione na podstawie decyzji Komisji Europejskiej stwierdzającej odpowiedni stopień ochrony. Kopię zabezpieczeń możesz otrzymać, pisząc do nas.' },
            ],
        },
        {
            id: 'usuniecie-konta',
            title: 'Usunięcie Konta i danych',
            blocks: [
                { type: 'p', text: `1. Konto usuniesz w ustawieniach Konta w aplikacji lub w serwisie internetowym albo na stronie ${OPERATOR.website}/delete-account (bez instalowania aplikacji). Dla bezpieczeństwa usunięcie potwierdzasz linkiem wysłanym na adres e-mail Konta.` },
                { type: 'p', text: '2. Po potwierdzeniu: usuwamy dane Profilu (imię, nazwisko, zdjęcia, opis, telefon, linki, datę urodzenia, adres do ewidencji), Ogłoszenia z ich zdjęciami i nagraniami, Aktualności, Certyfikaty z plikami, wpisy ewidencji, tokeny powiadomień i powiązania z kontami Google, Facebook i Apple, a adres e-mail zastępujemy losowym identyfikatorem. Kończymy też wszystkie sesje logowania.' },
                { type: 'p', text: '3. Rezerwacje i Opinie pozostają w Serwisie w formie zanonimizowanej (bez powiązania z Twoją osobą), aby nie zafałszować historii i ocen drugiej strony. Wiadomości wysłane innym Użytkownikom pozostają w ich rozmowach jako wiadomości „Usuniętego Użytkownika”.' },
                { type: 'p', text: '4. Dane mogą jeszcze znajdować się w zaszyfrowanych kopiach zapasowych – **nie dłużej niż 4 miesiące** od usunięcia (kopie przechowujemy do 90 dni, a w drugiej lokalizacji są dodatkowo chronione przed usunięciem przez 30 dni) – oraz w logach bezpieczeństwa (do 12 miesięcy). Kopii zapasowych nie używamy do innych celów niż odtworzenie Serwisu po awarii. Dłużej przechowujemy tylko dane potrzebne do wykonania obowiązków prawnych lub obrony przed roszczeniami (patrz tabela w §3).' },
            ],
        },
        {
            id: 'prawa',
            title: 'Twoje prawa',
            blocks: [
                { type: 'p', text: 'Masz prawo do:' },
                {
                    type: 'list',
                    items: [
                        'dostępu do danych i otrzymania ich kopii (art. 15 RODO),',
                        'sprostowania danych (art. 16 RODO) – większość danych poprawisz sam w ustawieniach Konta,',
                        'usunięcia danych (art. 17 RODO) – w tym przez usunięcie Konta,',
                        'ograniczenia przetwarzania (art. 18 RODO),',
                        'przenoszenia danych, które nam przekazałeś, w ustrukturyzowanym formacie (art. 20 RODO),',
                        '**sprzeciwu** wobec przetwarzania opartego na prawnie uzasadnionym interesie (art. 21 RODO), w tym wobec przypomnień o uzupełnieniu Profilu,',
                        'cofnięcia zgody w dowolnym momencie (np. na lokalizację lub powiadomienia – w ustawieniach urządzenia), bez wpływu na zgodność z prawem przetwarzania przed jej cofnięciem,',
                        'wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych (ul. Stawki 2, 00-193 Warszawa, uodo.gov.pl).',
                    ],
                },
                { type: 'p', text: `Aby skorzystać z praw, napisz na ${OPERATOR.email}. Odpowiadamy bez zbędnej zwłoki, nie później niż w ciągu miesiąca (w uzasadnionych przypadkach termin może zostać przedłużony o dwa miesiące – poinformujemy Cię o tym). Możemy poprosić o potwierdzenie tożsamości, np. przez odpowiedź z adresu e-mail Konta.` },
            ],
        },
        {
            id: 'profilowanie',
            title: 'Profilowanie i automatyczne decyzje',
            blocks: [
                { type: 'p', text: 'Dobieramy kolejność Ogłoszeń i oferty polecane na podstawie ocen, popularności, lokalizacji, pakietu Plus oraz kategorii, które przeglądałeś (szczegóły w §11 Regulaminu). Nie podejmujemy wobec Ciebie decyzji opartych wyłącznie na zautomatyzowanym przetwarzaniu, które wywoływałyby skutki prawne lub w podobny sposób istotnie na Ciebie wpływały (art. 22 RODO). Decyzje moderacyjne podejmuje człowiek.' },
            ],
        },
        {
            id: 'cookies',
            title: 'Pliki cookies i pamięć urządzenia',
            blocks: [
                { type: 'p', text: '1. Serwis zapisuje informacje w Twoim urządzeniu (pliki cookies, pamięć przeglądarki localStorage, bezpieczna pamięć aplikacji) wyłącznie w zakresie **niezbędnym do świadczenia usługi, której żądasz** – zgodnie z art. 399 ust. 3 ustawy – Prawo komunikacji elektronicznej taki zapis nie wymaga zgody. Są to:' },
                {
                    type: 'list',
                    items: [
                        'cookie sesji logowania (refreshToken, httpOnly) – utrzymanie zalogowania, do 30 dni lub do wylogowania,',
                        'informacje o stanie zalogowania i podstawowe dane profilu w pamięci przeglądarki – szybkie wczytanie Serwisu,',
                        'Twoje ustawienia (np. wybrane miasto, filtry, ukończony samouczek, informacja o zapoznaniu się z komunikatem o cookies, ustawienia blokady Face ID w aplikacji),',
                        'w aplikacji mobilnej – token logowania w bezpiecznej pamięci systemu (Keychain / Keystore).',
                    ],
                },
                { type: 'p', text: '2. Gdy korzystasz z podpowiedzi adresów lub mapy, łączysz się z usługą map dostawcy zewnętrznego. Gdy logujesz się przez Google, Facebook lub Apple, otwierasz okno logowania tego dostawcy. Dostawcy ci mogą odczytywać lub zapisywać własne pliki cookies zgodnie ze swoimi politykami.' },
                { type: 'p', text: '3. Nie stosujemy cookies analitycznych, reklamowych ani śledzących. Pliki cookies możesz usunąć lub zablokować w ustawieniach przeglądarki – zablokowanie cookie sesji uniemożliwi pozostanie zalogowanym.' },
            ],
        },
        {
            id: 'aplikacja',
            title: 'Aplikacja mobilna – uprawnienia',
            blocks: [
                { type: 'p', text: 'Aplikacja prosi o uprawnienia systemowe tylko wtedy, gdy korzystasz z danej funkcji. Możesz je w każdej chwili wyłączyć w ustawieniach telefonu:' },
                {
                    type: 'list',
                    items: [
                        '**Lokalizacja** (tylko podczas używania aplikacji) – wyszukiwanie usług w pobliżu; lokalizacja nie jest zapisywana na serwerze,',
                        '**Aparat i zdjęcia** – dodawanie zdjęć do Profilu, Ogłoszeń, Opinii, Certyfikatów i Czatu; aplikacja nie przegląda galerii w tle,',
                        '**Powiadomienia** – informacje o wiadomościach, Rezerwacjach i przypomnieniach,',
                        '**Face ID / Touch ID / odcisk palca** – opcjonalna blokada aplikacji i sekcji Zarobki; weryfikacji dokonuje system telefonu, a my nie otrzymujemy ani nie przechowujemy danych biometrycznych – dostajemy jedynie informację, czy weryfikacja się powiodła.',
                    ],
                },
                { type: 'p', text: 'Aplikacja nie zawiera reklam ani narzędzi śledzących użytkowników między aplikacjami innych firm.' },
            ],
        },
        {
            id: 'dzieci',
            title: 'Dzieci',
            blocks: [
                { type: 'p', text: '1. Konto może założyć osoba, która ukończyła 13 lat. Osoby w wieku 13–15 lat potrzebują zgody rodzica lub opiekuna prawnego (art. 8 RODO – w Polsce granicą wieku jest 16 lat). Zgodę potwierdza rodzic lub opiekun przez link wysłany na jego adres e-mail.' },
                { type: 'p', text: `2. Rodzic lub opiekun może w każdej chwili cofnąć zgodę i zażądać usunięcia Konta dziecka, pisząc na ${OPERATOR.email}.` },
                { type: 'p', text: '3. Jeżeli dowiemy się, że Konto założyła osoba poniżej 13 lat lub osoba w wieku 13–15 lat bez zgody rodzica, usuniemy Konto i dane.' },
            ],
        },
        {
            id: 'bezpieczenstwo',
            title: 'Bezpieczeństwo danych',
            blocks: [
                { type: 'p', text: 'Stosujemy środki techniczne i organizacyjne odpowiednie do ryzyka, w tym: szyfrowanie połączeń (HTTPS/TLS), przechowywanie haseł wyłącznie w postaci skrótu, krótkotrwałe tokeny dostępu, opcjonalną weryfikację dwuetapową, przechowywanie skanów Certyfikatów i plików z Czatu w prywatnym magazynie z dostępem przez czasowe, podpisane linki, ograniczanie liczby prób logowania, szyfrowane kopie zapasowe w dwóch niezależnych lokalizacjach oraz ograniczony dostęp do danych. Do panelu administracyjnego ma dostęp wyłącznie Administrator; wgląd w treść rozmów na Czacie jest technicznie możliwy tylko w związku ze zgłoszeniem dotyczącym uczestnika rozmowy albo z udokumentowanego powodu (np. żądanie organu), a każdy taki wgląd, podgląd profilu i eksport danych jest rejestrowany. O naruszeniu ochrony danych, które może powodować ryzyko dla Twoich praw, zawiadomimy Prezesa UODO w ciągu 72 godzin, a jeżeli ryzyko jest wysokie – także Ciebie.' },
            ],
        },
        {
            id: 'zmiany',
            title: 'Zmiany Polityki prywatności',
            blocks: [
                { type: 'p', text: 'Politykę aktualizujemy, gdy zmieniają się przepisy, funkcje Serwisu lub dostawcy. O istotnych zmianach informujemy e-mailem lub w Serwisie przed ich wejściem w życie. Aktualna wersja jest zawsze dostępna w Serwisie wraz z datą ostatniej aktualizacji.' },
            ],
        },
    ],
};
