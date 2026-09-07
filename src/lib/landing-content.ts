export interface CategoryContent {
    description: string;
    faq: { q: string; a: string }[];
    related: string[];  // keyword/category slugs
}

const CONTENT: Record<string, CategoryContent> = {
    sprzatanie: {
        description: 'Znajdź sprawdzonych specjalistów od sprzątania w swojej okolicy. Oferujemy profesjonalne sprzątanie mieszkań, domów, biur i lokali użytkowych. Każda oferta zawiera realne opinie innych klientów, przejrzyste ceny i możliwość rezerwacji online.',
        faq: [
            { q: 'Ile kosztuje sprzątanie mieszkania?', a: 'Cena zależy od metrażu i zakresu usługi. Sprzątanie standardowe mieszkania 50 m² kosztuje zazwyczaj 150–300 zł. Porównaj oferty specjalistów na MyLokalni.pl i wybierz najlepszą opcję.' },
            { q: 'Jak często warto zamawiać profesjonalne sprzątanie?', a: 'Większość klientów korzysta z usług co 2–4 tygodnie. Jednorazowe sprzątanie generalne poleca się przed wprowadzką lub po remoncie.' },
            { q: 'Czy sprzątaczka przynosi własny sprzęt i środki?', a: 'Zazwyczaj tak — większość specjalistów na MyLokalni.pl pracuje z własnym sprzętem i profesjonalnymi środkami. Sprawdź opis oferty lub zapytaj bezpośrednio.' },
            { q: 'Jak zarezerwować usługę sprzątania?', a: 'Wybierz ofertę, sprawdź dostępne terminy i kliknij "Zarezerwuj". Możesz też napisać wiadomość bezpośrednio do specjalisty.' },
            { q: 'Czy mogę zamówić jednorazowe sprzątanie?', a: 'Tak. Większość specjalistów oferuje zarówno jednorazowe sprzątanie, jak i cykliczną obsługę. Szczegóły znajdziesz w opisie każdej oferty.' },
        ],
        related: ['dom-ogrod', 'opieka', 'eventy', 'budowa'],
    },
    'dom-ogrod': {
        description: 'Hydraulicy, elektryki, malarze i specjaliści od wykończeń wnętrz — wszystko czego potrzebujesz dla domu i ogrodu. Remonty, drobne naprawy, montaże i prace wykończeniowe. Sprawdź opinie klientów i zarezerwuj wizytę online.',
        faq: [
            { q: 'Jak znaleźć dobrego hydraulika lub elektryka?', a: 'Na MyLokalni.pl znajdziesz sprawdzonych fachowców z opiniami klientów i cennikiem. Filtruj po mieście i sortuj po ocenie, żeby wybrać najlepszego specjalistę.' },
            { q: 'Czy fachowiec przyjedzie w weekend lub wieczorem?', a: 'Wielu specjalistów oferuje elastyczne godziny pracy. Sprawdź dostępność bezpośrednio w profilu lub napisz wiadomość.' },
            { q: 'Ile kosztuje małe zlecenie budowlane?', a: 'Drobne naprawy zaczynają się od ok. 50–150 zł. Większe prace remontowe wyceniane są indywidualnie — skorzystaj z funkcji wyceny na stronie specjalisty.' },
            { q: 'Jak szybko fachowiec może przyjechać?', a: 'W nagłych przypadkach wielu specjalistów oferuje realizację w ciągu 24–48 godzin. Sprawdź dostępność w kalendarzu lub skontaktuj się bezpośrednio.' },
            { q: 'Czy specjalista wystawia fakturę?', a: 'Tak, większość profesjonalnych fachowców wystawia faktury VAT. Informacja o tym jest zwykle podana w opisie oferty.' },
        ],
        related: ['budowa', 'sprzatanie', 'finanse', 'inne'],
    },
    budowa: {
        description: 'Murarze, tynkarze, dekarze i ekipy budowlane z opiniami klientów. Znajdź sprawdzonego wykonawcę do budowy domu, remontu lub prac wykończeniowych. Porównaj ceny i zarezerwuj wizytę w kilka minut.',
        faq: [
            { q: 'Jak wybrać rzetelną ekipę budowlaną?', a: 'Sprawdź oceny i opinie klientów na profilu każdego wykonawcy. Warto wybrać specjalistę z co najmniej kilkoma zrealizowanymi zleceniami i pozytywnymi recenzjami.' },
            { q: 'Ile kosztuje wycena prac budowlanych?', a: 'Większość specjalistów oferuje bezpłatną wycenę na miejscu. Skontaktuj się bezpośrednio przez MyLokalni.pl, żeby umówić wizję lokalną.' },
            { q: 'Jak długo trwa remont mieszkania?', a: 'Zależy od zakresu prac. Remont łazienki trwa zazwyczaj 1–2 tygodnie, remont całego mieszkania 4–12 tygodni. Zapytaj specjalistę o szczegółowy harmonogram.' },
            { q: 'Czy wykonawca zapewnia materiały budowlane?', a: 'Możliwe są oba modele — z materiałami lub bez. Uzgodnij to z wykonawcą przed podpisaniem umowy.' },
            { q: 'Co powinno znaleźć się w umowie z ekipą?', a: 'Zakres prac, termin realizacji, cena, warunki płatności i gwarancja na wykonane prace. Dobry specjalista chętnie podpisze umowę.' },
        ],
        related: ['dom-ogrod', 'finanse', 'transport', 'inne'],
    },
    auto: {
        description: 'Mechanicy, detaillerzy, elektryki samochodowi i serwisy opon z opiniami klientów. Znajdź zaufany serwis w swojej okolicy, sprawdź ceny i umów wizytę online.',
        faq: [
            { q: 'Jak często powinienem oddawać auto do serwisu?', a: 'Co najmniej raz w roku na przegląd ogólny lub co 15 000–20 000 km. Szczegółowy harmonogram znajdziesz w instrukcji obsługi pojazdu.' },
            { q: 'Ile kosztuje wymiana oleju?', a: 'Zazwyczaj 100–250 zł za robociznę plus koszt oleju i filtra. Cena zależy od marki auta i rodzaju oleju. Sprawdź oferty w swoim mieście.' },
            { q: 'Czy mechanik może przyjechać do mojego domu?', a: 'Część mechaników oferuje usługi mobilne. Wyszukaj oferty z opcją dojazdu lub skontaktuj się bezpośrednio ze specjalistą.' },
            { q: 'Jak sprawdzić, czy mechanik jest godny zaufania?', a: 'Czytaj opinie klientów na MyLokalni.pl. Wybieraj specjalistów z wieloma pozytywnymi recenzjami i historią zrealizowanych zleceń.' },
            { q: 'Czy mogę zarezerwować wymianę opon online?', a: 'Tak — wybierz termin w kalendarzu specjalisty i zarezerwuj slot. Dostaniesz potwierdzenie na maila lub SMS.' },
        ],
        related: ['transport', 'it-naprawy', 'dom-ogrod', 'inne'],
    },
    transport: {
        description: 'Firmy przeprowadzkowe, kurierzy i przewoźnicy z opiniami klientów. Zarezerwuj transport mebli, przeprowadzkę lub dostawę dużych gabarytów w kilka minut.',
        faq: [
            { q: 'Ile kosztuje przeprowadzka?', a: 'Koszt zależy od odległości, ilości mebli i liczby pięter. Lokalna przeprowadzka to zazwyczaj 500–2000 zł. Porównaj oferty i poproś o wycenę.' },
            { q: 'Jak wcześniej zarezerwować firmę przeprowadzkową?', a: 'Warto rezerwować z co najmniej 1–2 tygodniowym wyprzedzeniem, szczególnie w weekendy. W szczycie sezonu (lato) nawet 3–4 tygodnie wcześniej.' },
            { q: 'Czy firma ubezpiecza przewożone mienie?', a: 'Większość profesjonalnych firm oferuje ubezpieczenie. Sprawdź opis oferty lub zapytaj przed podpisaniem umowy.' },
            { q: 'Czy możliwy jest transport jednej kanapie lub lodówki?', a: 'Tak — wiele firm oferuje transport pojedynczych mebli lub AGD. Wyszukaj oferty z opcją małej przeprowadzki lub transportu gabarytów.' },
            { q: 'Jak przygotować się do przeprowadzki?', a: 'Zapakuj rzeczy w oznaczone kartony, zabezpiecz meble folią i przygotuj dostęp do wind/klatek. Dobra firma udzieli Ci szczegółowych wskazówek.' },
        ],
        related: ['auto', 'budowa', 'dom-ogrod', 'inne'],
    },
    uroda: {
        description: 'Fryzjerzy, kosmetyczki, masażyści i specjaliści od stylizacji paznokci z opiniami klientów. Umów wizytę online i zadbaj o siebie u sprawdzonego specjalisty w Twojej okolicy.',
        faq: [
            { q: 'Jak umówić wizytę u fryzjera lub kosmetyczki?', a: 'Wybierz ofertę, sprawdź dostępność w kalendarzu i kliknij "Zarezerwuj". Możesz też napisać wiadomość ze swoimi oczekiwaniami.' },
            { q: 'Ile kosztuje strzyżenie lub koloryzacja?', a: 'Strzyżenie damskie to zazwyczaj 50–150 zł, koloryzacja 150–400 zł. Ceny zależą od długości włosów i salonu. Sprawdź aktualne oferty w swoim mieście.' },
            { q: 'Czy mogę zobaczyć portfolio przed wizytą?', a: 'Tak — wielu specjalistów dodaje zdjęcia swoich prac do profilu. Sprawdź galerię i opinie klientów przed rezerwacją.' },
            { q: 'Czy masaż wymaga skierowania lekarskiego?', a: 'Masaż relaksacyjny nie wymaga skierowania. Masaż leczniczy lub rehabilitacyjny może wymagać konsultacji z fizjoterapeutą.' },
            { q: 'Czy mogę odwołać wizytę?', a: 'Zazwyczaj tak, z odpowiednim wyprzedzeniem. Polityka odwołań różni się u różnych specjalistów — sprawdź ją w opisie oferty.' },
        ],
        related: ['zdrowie', 'opieka', 'eventy', 'sztuka'],
    },
    'it-naprawy': {
        description: 'Serwisy komputerów, naprawa telefonów, tworzenie stron www i usługi IT z opiniami klientów. Znajdź sprawdzonego specjalistę od technologii w swojej okolicy lub zdalnie.',
        faq: [
            { q: 'Ile kosztuje naprawa laptopa lub komputera?', a: 'Diagnostyka to zazwyczaj 50–100 zł. Naprawa w zależności od usterki 150–500 zł. Zapytaj o wycenę przed oddaniem sprzętu.' },
            { q: 'Ile czeka się na naprawę telefonu?', a: 'Wymiana ekranu czy baterii to często naprawa w ciągu jednego dnia. Bardziej skomplikowane usterki mogą trwać 3–7 dni roboczych.' },
            { q: 'Czy specjalista IT może przyjść do domu lub biura?', a: 'Tak — wielu specjalistów oferuje wizyty w domu, biurze lub zdalną pomoc przez internet. Sprawdź opis oferty.' },
            { q: 'Ile kosztuje stworzenie strony internetowej?', a: 'Prosta strona wizytówkowa to 500–2000 zł, bardziej rozbudowany sklep internetowy 3000–15000 zł i więcej. Poproś o indywidualną wycenę.' },
            { q: 'Czy moje dane są bezpieczne podczas naprawy?', a: 'Profesjonalni technicy pracują zgodnie z zasadami poufności. Możesz poprosić o podpisanie klauzuli NDA lub wykonać kopię zapasową danych przed oddaniem sprzętu.' },
        ],
        related: ['finanse', 'sztuka', 'edukacja', 'auto'],
    },
    edukacja: {
        description: 'Korepetytorzy, nauczyciele języków obcych i instruktorzy z opiniami uczniów i rodziców. Umów lekcje online lub stacjonarne u sprawdzonego nauczyciela w Twojej okolicy.',
        faq: [
            { q: 'Ile kosztuje godzina korepetycji?', a: 'Zazwyczaj 60–150 zł za godzinę, w zależności od przedmiotu i poziomu zaawansowania. Korepetytorzy z wyższych uczelni lub z dużym doświadczeniem mogą pobierać więcej.' },
            { q: 'Czy lekcje mogą odbywać się online?', a: 'Tak — większość nauczycieli oferuje zajęcia przez Zoom, Teams lub Google Meet. To wygodna opcja bez konieczności dojazdu.' },
            { q: 'Jak szybko widać efekty korepetycji?', a: 'Zależy od przedmiotu i regularności zajęć. Przy 2–3 spotkaniach tygodniowo pierwsze efekty widać zazwyczaj po 4–8 tygodniach.' },
            { q: 'Czy korepetytor dostosuje materiał do poziomu ucznia?', a: 'Tak — profesjonalni nauczyciele zawsze przeprowadzają wstępną diagnozę i dostosowują program do potrzeb i możliwości ucznia.' },
            { q: 'Czy mogę zamówić jednorazową lekcję przed egzaminem?', a: 'Tak. Wiele osób korzysta z pojedynczych sesji powtórkowych przed klasówką, maturą lub egzaminem na studiach.' },
        ],
        related: ['zdrowie', 'opieka', 'eventy', 'it-naprawy'],
    },
    zdrowie: {
        description: 'Fizjoterapeuci, dietetycy, psycholodzy i specjaliści zdrowia z opiniami pacjentów. Zarezerwuj wizytę bez kolejek i długiego oczekiwania — bezpośrednio u sprawdzonego specjalisty.',
        faq: [
            { q: 'Ile kosztuje wizyta u fizjoterapeuty?', a: 'Zazwyczaj 80–200 zł za sesję (60 min). Pakiety kilku wizyt mogą być tańsze — zapytaj specjalistę o możliwość rabatu.' },
            { q: 'Czy potrzebuję skierowania na fizjoterapię prywatną?', a: 'Nie. Na prywatną fizjoterapię, dietetykon czy psychologa możesz umówić się bez skierowania.' },
            { q: 'Jak wybrać dobrego psychologa lub psychoterapeutę?', a: 'Sprawdź wykształcenie, certyfikaty i opinie pacjentów. Ważne jest też poczucie komfortu na pierwszej sesji — wielu specjalistów oferuje bezpłatną konsultację wstępną.' },
            { q: 'Ile trwa terapia lub dieta?', a: 'Zależy od celu i problemu. Podstawowy program diety trwa zazwyczaj 4–12 tygodni, terapia psychologiczna może potrwać od kilku tygodni do kilku lat.' },
            { q: 'Czy możliwe są wizyty domowe?', a: 'Tak — część fizjoterapeutów i dietetyków oferuje wizyty w domu pacjenta. Sprawdź opis oferty lub zapytaj bezpośrednio.' },
        ],
        related: ['uroda', 'opieka', 'edukacja', 'sprzatanie'],
    },
    zwierzeta: {
        description: 'Weterynarze, groomerzy, dog-sitterzy i opiekunowie zwierząt z opiniami klientów. Znajdź zaufaną osobę lub serwis dla swojego pupila w Twojej okolicy.',
        faq: [
            { q: 'Ile kosztuje grooming psa lub kota?', a: 'Zazwyczaj 80–200 zł w zależności od rasy, rozmiaru i zakresu usługi (kąpiel, strzyżenie, obcinanie pazurów). Sprawdź cennik w ofercie.' },
            { q: 'Jak znaleźć dog-sittera na czas wakacji?', a: 'Wyszukaj opiekunów zwierząt w swoim mieście lub okolicy. Sprawdź opinie, porozmawiaj ze specjalistą i umów próbne spotkanie przed dłuższym pobytem.' },
            { q: 'Czy dog-sitter przyjedzie do mojego domu?', a: 'Tak — wielu opiekunów oferuje opiekę u klienta w domu, co minimalizuje stres zwierzęcia. Dostępna jest też opcja opieki w domu opiekuna.' },
            { q: 'Ile kosztuje wizyta weterynaryjna?', a: 'Wizyta prywatna to zazwyczaj 80–200 zł. Szczepienia, badania krwi czy zabiegi wyceniane są oddzielnie.' },
            { q: 'Jak przygotować psa do pierwszej wizyty u groomera?', a: 'Przyzwyczajaj pupila do dotyku łap i uszu od szczenięcia. Pierwsze wizyty zamawiaj jako krótkie — sam kąpiel, żeby zwierzę mogło się oswoić ze salonem.' },
        ],
        related: ['zdrowie', 'opieka', 'dom-ogrod', 'inne'],
    },
    finanse: {
        description: 'Księgowi, doradcy podatkowi i prawnicy z opiniami klientów. Ogarnij formalności, podatkowe i prawne bez stresu — z pomocą sprawdzonego specjalisty.',
        faq: [
            { q: 'Ile kosztuje miesięczna obsługa księgowa firmy?', a: 'Dla małej firmy (do 30 dokumentów miesięcznie) zazwyczaj 150–500 zł. Cena rośnie wraz z liczbą transakcji i skomplikowaniem rozliczeń.' },
            { q: 'Czy mogę skorzystać z biura rachunkowego zdalnie?', a: 'Tak — większość biur rachunkowych obsługuje klientów online. Dokumenty przesyłasz mailem lub przez specjalną aplikację.' },
            { q: 'Kiedy powinienem skontaktować się z księgowym?', a: 'Najlepiej przed założeniem działalności lub na początku roku podatkowego. Wcześniejszy kontakt pozwala wybrać optymalną formę rozliczenia.' },
            { q: 'Czy potrzebuję prawnika do prostej umowy?', a: 'Dla standardowych umów (zlecenie, o dzieło) nie jest konieczny. Przy umowach dotyczących nieruchomości, spółek lub większych kwot warto skonsultować się z prawnikiem.' },
            { q: 'Jak szybko mogę rozwiązać kwestię podatkową?', a: 'Prosta konsultacja podatkowa trwa zazwyczaj 30–60 minut. Bardziej skomplikowane sprawy (optymalizacja, spory z US) mogą trwać tygodnie.' },
        ],
        related: ['it-naprawy', 'dom-ogrod', 'budowa', 'inne'],
    },
    opieka: {
        description: 'Nianie, opiekunki do dzieci, opiekunowie osób starszych i pomoc domowa z opiniami klientów. Znajdź zaufaną osobę do opieki nad bliskimi w swojej okolicy.',
        faq: [
            { q: 'Ile kosztuje niania lub opiekunka do dziecka?', a: 'Zazwyczaj 20–40 zł za godzinę. Opiekunki z wyższym wykształceniem lub doświadczeniem pedagogicznym mogą pobierać więcej.' },
            { q: 'Jak sprawdzić wiarygodność opiekunki?', a: 'Sprawdź opinie klientów, poproś o referencje i przeprowadź rozmowę kwalifikacyjną. Warto też omówić szczegóły opieki przed pierwszym dniem pracy.' },
            { q: 'Czy opiekunka powinna mieć zaświadczenie o niekaralności?', a: 'Jest to zalecane, szczególnie przy opiece nad dziećmi lub osobami starszymi. Profesjonalne opiekunki chętnie je okazują.' },
            { q: 'Czy możliwa jest opieka nocna lub całodobowa?', a: 'Tak — część opiekunów oferuje opiekę nocną, całodobową lub weekendową. Sprawdź opis oferty lub zapytaj bezpośrednio.' },
            { q: 'Jak umówić opiekunkę na próbny dzień?', a: 'Skontaktuj się ze specjalistką przez MyLokalni.pl i poproś o krótkie spotkanie próbne. Pomoże to ocenić, czy osoba odpowiada Twoim oczekiwaniom.' },
        ],
        related: ['zdrowie', 'edukacja', 'sprzatanie', 'zwierzeta'],
    },
    sztuka: {
        description: 'Graficy, fotografowie, videografowie, muzycy i artyści z opiniami klientów. Zamów profesjonalne projekty graficzne, sesje zdjęciowe lub nagrania w Twojej okolicy.',
        faq: [
            { q: 'Ile kosztuje projekt logo lub identyfikacji wizualnej?', a: 'Podstawowe logo to 300–1000 zł. Pełna identyfikacja wizualna (logo, kolory, fonty, szablony) kosztuje 1500–8000 zł i więcej.' },
            { q: 'Jak długo trwa realizacja sesji zdjęciowej?', a: 'Sesja reportażowa lub portretowa trwa 1–4 godziny. Obróbka i dostarczenie zdjęć zajmuje zazwyczaj 3–14 dni roboczych.' },
            { q: 'Czy mogę zobaczyć portfolio przed zleceniem?', a: 'Tak — każdy artysta na MyLokalni.pl może dodać przykłady swojej pracy do profilu. Sprawdź je przed podjęciem decyzji.' },
            { q: 'Ile kosztuje montaż wideo?', a: 'Od 50 zł za minutę gotowego materiału dla prostych filmów, do kilkuset złotych za minutę przy produkcjach reklamowych lub ślubnych.' },
            { q: 'Czy muzykant przyjedzie na moje wesele lub imprezę?', a: 'Tak — wielu muzyków i DJ-ów przyjmuje zlecenia na eventy. Rezerwuj z co najmniej 3–6 miesięcznym wyprzedzeniem, szczególnie w sezonie weselnym.' },
        ],
        related: ['eventy', 'edukacja', 'it-naprawy', 'uroda'],
    },
    eventy: {
        description: 'Organizatorzy imprez, cateringowcy, fotografowie eventowi i animatorzy z opiniami klientów. Zorganizuj niezapomniane wesele, urodziny lub imprezę firmową z pomocą sprawdzonych specjalistów.',
        faq: [
            { q: 'Jak wcześniej zarezerwować organizatora wesela?', a: 'Popularnych organizatorów wesel warto rezerwować 12–18 miesięcy wcześniej. W przypadku mniejszych imprez wystarczy 3–6 miesięcy.' },
            { q: 'Ile kosztuje catering na imprezę?', a: 'Od ok. 50–80 zł od osoby za prosty bufet, do 150–300 zł od osoby za pełną obsługę kelnerską. Cena zależy od menu i liczby gości.' },
            { q: 'Czy możliwe jest zorganizowanie małej imprezy (20–30 osób)?', a: 'Tak — wielu specjalistów obsługuje zarówno kameralne przyjęcia, jak i duże eventy. Sprawdź zakres usług w opisie oferty.' },
            { q: 'Co powinna zawierać umowa z organizatorem imprezy?', a: 'Termin, miejsce, zakres usług, cena, harmonogram płatności i warunki odwołania lub zmiany terminu. Zawsze podpisuj umowę przed wpłatą zaliczki.' },
            { q: 'Czy mogę wynająć tylko fotografa lub DJ-a bez pakietu?', a: 'Tak — możesz zamawiać poszczególne usługi oddzielnie. Znajdziesz tu zarówno pełne pakiety eventowe, jak i pojedynczych specjalistów.' },
        ],
        related: ['sztuka', 'transport', 'sprzatanie', 'uroda'],
    },
    inne: {
        description: 'Różnorodne usługi lokalne, których nie znajdziesz w standardowych kategoriach. Ślusarze, szewcy, krawcy i inni rzemieślnicy z opiniami klientów — sprawdź oferty w Twojej okolicy.',
        faq: [
            { q: 'Jak znaleźć ślusarza w nagłej sytuacji?', a: 'Wyszukaj ślusarzy w swoim mieście i sprawdź, który ma najkrótszy czas oczekiwania. Wielu przyjmuje zlecenia od ręki.' },
            { q: 'Ile kosztuje naprawa zamka lub dorobienie klucza?', a: 'Dorobienie klucza to 30–80 zł, wymiana zamka 150–400 zł w zależności od modelu i robocizny.' },
            { q: 'Czy krawiec może przyjść do domu?', a: 'Część krawców oferuje wizyty domowe do przymiarek. Sprawdź opis oferty lub zapytaj bezpośrednio.' },
            { q: 'Jak szybko mogę zlecić naprawę obuwia?', a: 'Większość szewców realizuje proste naprawy (wklejenie podeszwy, wymiana obcasów) w ciągu 1–3 dni.' },
            { q: 'Jak zarezerwować usługę u rzemieślnika przez MyLokalni.pl?', a: 'Wybierz ofertę, kliknij "Zarezerwuj" i wybierz termin. Możesz też napisać wiadomość z opisem zlecenia.' },
        ],
        related: ['dom-ogrod', 'auto', 'transport', 'finanse'],
    },
};

const GENERIC: CategoryContent = {
    description: 'Znajdź sprawdzonych specjalistów w swojej okolicy. Porównaj oferty, sprawdź opinie klientów i zarezerwuj wizytę online na MyLokalni.pl.',
    faq: [
        { q: 'Jak zarezerwować usługę przez MyLokalni.pl?', a: 'Wybierz ofertę, kliknij "Zarezerwuj", wybierz termin i potwierdź rezerwację. Otrzymasz powiadomienie emailem.' },
        { q: 'Czy opinie na MyLokalni.pl są prawdziwe?', a: 'Tak — opinie mogą dodawać tylko osoby, które faktycznie zarezerwowały i odbyły usługę przez platformę.' },
        { q: 'Jak płacę za usługę?', a: 'Rozliczasz się bezpośrednio ze specjalistą — gotówką, przelewem lub kartą, według jego preferencji.' },
        { q: 'Czy mogę odwołać rezerwację?', a: 'Tak, najczęściej z odpowiednim wyprzedzeniem. Warunki odwołania znajdziesz w opisie każdej oferty.' },
        { q: 'Co zrobić, jeśli specjalista nie wywiąże się z umowy?', a: 'Skontaktuj się z nami przez formularz wsparcia. Pomagamy rozwiązywać spory i dbamy o jakość usług na platformie.' },
    ],
    related: [],
};

export function getLandingContent(keywordSlug: string | null): CategoryContent {
    if (!keywordSlug) return GENERIC;
    return CONTENT[keywordSlug] ?? GENERIC;
}

export const TOP_CITIES_DISPLAY: { slug: string; display: string }[] = [
    { slug: 'warszawa',   display: 'Warszawa' },
    { slug: 'krakow',    display: 'Kraków' },
    { slug: 'wroclaw',   display: 'Wrocław' },
    { slug: 'poznan',    display: 'Poznań' },
    { slug: 'gdansk',    display: 'Gdańsk' },
    { slug: 'lodz',      display: 'Łódź' },
    { slug: 'katowice',  display: 'Katowice' },
    { slug: 'lublin',    display: 'Lublin' },
];
