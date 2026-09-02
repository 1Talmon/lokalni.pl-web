export const BASE_URL = 'https://mylokalni.pl';
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.mylokalni.pl/api';

export const CATEGORIES = [
    'sprzatanie', 'dom-ogrod', 'budowa', 'auto', 'transport',
    'uroda', 'it-naprawy', 'edukacja', 'zdrowie', 'zwierzeta',
    'finanse', 'opieka', 'sztuka', 'eventy', 'inne',
];

export const POPULAR_KEYWORDS = [
    'hydraulik', 'elektryk', 'malarz', 'korepetycje', 'catering',
    'fryzjer', 'mechanik', 'kosmetyczka', 'fotograf', 'fizjoterapeuta',
    'ogrodnik', 'przeprowadzka', 'trener', 'dietetyk', 'psycholog',
    'ksiegowy', 'glazurnik', 'dekarz', 'murarz', 'instalator',
    'slusarz', 'opiekunka', 'niania', 'weterynarz', 'prawnik',
    'stolarz', 'tynkarz', 'klimatyzacja', 'mycie-okien', 'lekcje-angielskiego',
    'kurs-jazdy', 'sprzatanie-biur', 'naprawa-komputera',
];

export const ALL_KEYWORDS = [...CATEGORIES, ...POPULAR_KEYWORDS];

export const TOP_CITIES = [
    'warszawa', 'krakow', 'wroclaw', 'poznan', 'gdansk',
    'lodz', 'katowice', 'lublin', 'bydgoszcz', 'szczecin',
    'bialystok', 'rzeszow',
];

export const EXTRA_CITIES = [
    'gdynia', 'czestochowa', 'radom', 'torun', 'sosnowiec',
    'kielce', 'gliwice', 'olsztyn', 'zabrze', 'bielsko-biala',
    'bytom', 'zielona-gora', 'rybnik', 'opole', 'tychy',
    'tarnow', 'koszalin', 'kalisz',
];

export const ALL_CITIES = [...TOP_CITIES, ...EXTRA_CITIES];

// Display names for URL slugs
export const CITY_DISPLAY: Record<string, string> = {
    warszawa: 'Warszawa', krakow: 'Kraków', wroclaw: 'Wrocław',
    poznan: 'Poznań', gdansk: 'Gdańsk', lodz: 'Łódź',
    katowice: 'Katowice', lublin: 'Lublin', bydgoszcz: 'Bydgoszcz',
    szczecin: 'Szczecin', bialystok: 'Białystok', rzeszow: 'Rzeszów',
    gdynia: 'Gdynia', czestochowa: 'Częstochowa', radom: 'Radom',
    torun: 'Toruń', sosnowiec: 'Sosnowiec', kielce: 'Kielce',
    gliwice: 'Gliwice', olsztyn: 'Olsztyn', zabrze: 'Zabrze',
    'bielsko-biala': 'Bielsko-Biała', bytom: 'Bytom',
    'zielona-gora': 'Zielona Góra', rybnik: 'Rybnik', opole: 'Opole',
    tychy: 'Tychy', tarnow: 'Tarnów', koszalin: 'Koszalin', kalisz: 'Kalisz',
};

/** Locative case — used in "Usługi w <locative>" */
export const CITY_LOCATIVE: Record<string, string> = {
    warszawa: 'Warszawie', krakow: 'Krakowie', wroclaw: 'Wrocławiu',
    poznan: 'Poznaniu', gdansk: 'Gdańsku', lodz: 'Łodzi',
    katowice: 'Katowicach', lublin: 'Lublinie', bydgoszcz: 'Bydgoszczy',
    szczecin: 'Szczecinie', bialystok: 'Białymstoku', rzeszow: 'Rzeszowie',
    gdynia: 'Gdyni', czestochowa: 'Częstochowie', radom: 'Radomiu',
    torun: 'Toruniu', sosnowiec: 'Sosnowcu', kielce: 'Kielcach',
    gliwice: 'Gliwicach', olsztyn: 'Olsztynie', zabrze: 'Zabrzu',
    'bielsko-biala': 'Bielsku-Białej', bytom: 'Bytomiu',
    'zielona-gora': 'Zielonej Górze', rybnik: 'Rybniku', opole: 'Opolu',
    tychy: 'Tychach', tarnow: 'Tarnowie', koszalin: 'Koszalinie', kalisz: 'Kaliszu',
};

export const KEYWORD_DISPLAY: Record<string, string> = {
    sprzatanie: 'Sprzątanie', 'dom-ogrod': 'Dom i Ogród', budowa: 'Budowa',
    auto: 'Auto', transport: 'Transport', uroda: 'Uroda',
    'it-naprawy': 'IT i Naprawy', edukacja: 'Edukacja', zdrowie: 'Zdrowie',
    zwierzeta: 'Zwierzęta', finanse: 'Finanse', opieka: 'Opieka',
    sztuka: 'Sztuka', eventy: 'Eventy', inne: 'Inne',
    hydraulik: 'Hydraulik', elektryk: 'Elektryk', malarz: 'Malarz',
    korepetycje: 'Korepetycje', catering: 'Catering', fryzjer: 'Fryzjer',
    mechanik: 'Mechanik', kosmetyczka: 'Kosmetyczka', fotograf: 'Fotograf',
    fizjoterapeuta: 'Fizjoterapeuta', ogrodnik: 'Ogrodnik',
    przeprowadzka: 'Przeprowadzka', trener: 'Trener', dietetyk: 'Dietetyk',
    psycholog: 'Psycholog', ksiegowy: 'Księgowy', glazurnik: 'Glazurnik',
    dekarz: 'Dekarz', murarz: 'Murarz', instalator: 'Instalator',
    slusarz: 'Ślusarz', opiekunka: 'Opiekunka', niania: 'Niania',
    weterynarz: 'Weterynarz', prawnik: 'Prawnik', stolarz: 'Stolarz',
    tynkarz: 'Tynkarz', klimatyzacja: 'Klimatyzacja',
    'mycie-okien': 'Mycie Okien', 'lekcje-angielskiego': 'Lekcje Angielskiego',
    'kurs-jazdy': 'Kurs Jazdy', 'sprzatanie-biur': 'Sprzątanie Biur',
    'naprawa-komputera': 'Naprawa Komputera',
};

export type LandingSlugResult =
    | { type: 'keyword'; keyword: string; city: null }
    | { type: 'keyword-city'; keyword: string; city: string }
    | { type: 'city'; keyword: null; city: string };

/** Parse a landing slug into keyword + optional city, or city-only */
export function parseLandingSlug(slug: string): LandingSlugResult | null {
    if (ALL_KEYWORDS.includes(slug)) return { type: 'keyword', keyword: slug, city: null };
    if (ALL_CITIES.includes(slug)) return { type: 'city', keyword: null, city: slug };
    for (const city of ALL_CITIES) {
        if (slug.endsWith('-' + city) && slug.length > city.length + 1) {
            const kw = slug.slice(0, slug.length - city.length - 1);
            if (ALL_KEYWORDS.includes(kw)) return { type: 'keyword-city', keyword: kw, city };
        }
    }
    return null;
}

/** Set of all valid landing page slugs */
export const LANDING_SLUGS: Set<string> = new Set([
    ...ALL_KEYWORDS,
    ...ALL_CITIES,
    ...ALL_KEYWORDS.flatMap(kw => TOP_CITIES.map(c => `${kw}-${c}`)),
    ...CATEGORIES.flatMap(cat => EXTRA_CITIES.map(c => `${cat}-${c}`)),
]);

/** Normalize API media URL — replaces localhost with production domain */
export function normalizeMediaUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, 'https://api.mylokalni.pl');
}
