// Mock data używana w widokach gdy brak danych z API

export const MOCK_PROVIDER_POSTS = [
    {
        id: 1,
        type: 'post' as const,
        date: "Dziś, 14:30",
        isoDate: "2026-05-28",
        content: "Zakończyliśmy montaż oświetlenia szynowego w apartamencie na Wyspie Spichrzów. Efekt końcowy przerósł oczekiwania klienta! ✨ Wszystko sterowane z poziomu aplikacji.",
        image: "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?q=80&w=1000",
    },
    {
        id: 2,
        type: 'post' as const,
        date: "Wczoraj, 10:15",
        isoDate: "2026-05-27",
        content: "Dostawa nowych materiałów od naszego partnera. Tylko najwyższa jakość komponentów dla Waszych instalacji.",
        image: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=1000",
    },
    {
        id: 3,
        type: 'post' as const,
        date: "12 maja 2026",
        isoDate: "2026-05-12",
        content: "Szybka modernizacja rozdzielni w starym budownictwie. Bezpieczeństwo przede wszystkim! ⚡",
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1000",
    },
];

export const MOCK_REALIZACJE = [
    {
        id: 101,
        type: 'realizacja' as const,
        date: "25 maja 2026",
        isoDate: "2026-05-25",
        serviceName: "Montaż oświetlenia LED",
        image: "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?q=80&w=1000",
    },
    {
        id: 102,
        type: 'realizacja' as const,
        date: "20 maja 2026",
        isoDate: "2026-05-20",
        serviceName: "Instalacja gniazdek 230V",
        image: undefined,
    },
    {
        id: 103,
        type: 'realizacja' as const,
        date: "8 maja 2026",
        isoDate: "2026-05-08",
        serviceName: "System Smart Home KNX",
        image: "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=1000",
    },
    {
        id: 104,
        type: 'realizacja' as const,
        date: "22 kwietnia 2026",
        isoDate: "2026-04-22",
        serviceName: "Pomiary elektryczne",
        image: undefined,
    },
    {
        id: 105,
        type: 'realizacja' as const,
        date: "10 kwietnia 2026",
        isoDate: "2026-04-10",
        serviceName: "Montaż rozdzielnicy",
        image: undefined,
    },
];

export const MOCK_CERTIFICATES = [
    { id: 1, name: "Uprawnienia SEP E do 1kV", image: "https://images.unsplash.com/photo-1589330694653-ded6df03f754?q=80&w=800" },
    { id: 2, name: "Certyfikat KNX Partner", image: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?q=80&w=800" },
    { id: 3, name: "Instalator Fotowoltaiki PIME", image: "https://images.unsplash.com/photo-1520923179278-ee25e24e4674?q=80&w=800" },
];

export const MOCK_COMPETENCES = [
    { id: 101, name: "Instalacje elektryczne NN", level: "Ekspert", verified: true },
    { id: 102, name: "Uprawnienia SEP do 15kV", level: "Certyfikat", verified: true },
    { id: 103, name: "Smart Home / KNX", level: "Zaawansowany", verified: true },
    { id: 104, name: "Systemy alarmowe CCTV", level: "Zaawansowany", verified: false },
    { id: 105, name: "Pomiary elektryczne", level: "Ekspert", verified: true },
    { id: 106, name: "Fotowoltaika PV", level: "Średniozaawansowany", verified: false },
];

export const MOCK_CLIENT_PHOTOS = [
    "https://images.unsplash.com/photo-1556912177-c54030639a8a?q=80&w=800",
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800",
    "https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=800",
    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=800",
    "https://images.unsplash.com/photo-1565814636199-ae8133055c1c?q=80&w=800",
    "https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=800",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?q=80&w=800",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?q=80&w=800",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=800",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=800",
    "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=800",
    "https://images.unsplash.com/photo-1581093196867-ca2b9c4ddde3?q=80&w=800",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800",
    "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?q=80&w=800",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800",
    "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?q=80&w=800",
    "https://images.unsplash.com/photo-1565182999561-18d7dc61c393?q=80&w=800",
    "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800",
    "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?q=80&w=800",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=800",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=800",
    "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?q=80&w=800",
    "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=800",
    "https://images.unsplash.com/photo-1556912177-c54030639a8a?q=80&w=800",
];

export const MOCK_PROVIDER_REVIEWS = [
    {
        id: 1, user: "Krystian M.", text: "Rewelacyjny kontakt, zero opóźnień. Klasa sama w sobie. Polecam każdemu, kto szuka profesjonalisty.",
        img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100", rating: 5, date: "2 dni temu",
        reply: "Dziękuję za miłe słowa! Cieszę się, że system oświetlenia spełnia oczekiwania.",
        helpful: 14, service: "Instalacje elektryczne", order: 1,
    },
    {
        id: 2, user: "Marta K.", text: "Usługa na najwyższym poziomie, wszystko wykonane zgodnie z planem i w świetnej cenie. Szczegółowość wykonania zachwyca.",
        img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100", rating: 5, date: "Tydzień temu",
        reply: "Polecam się na przyszłość! Projekt kuchni wyszedł naprawdę nowocześnie.",
        helpful: 9, service: "Remonty kuchni", order: 2,
    },
    {
        id: 3, user: "Tomasz W.", text: "Pełen profesjonalizm i dbałość o detale. Na pewno skorzystam ponownie z usług tego fachowca.",
        img: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=100", rating: 4, date: "2 tygodnie temu",
        reply: null, helpful: 6, service: "Montaż klimatyzacji", order: 3,
    },
    {
        id: 4, user: "Agnieszka P.", text: "Wszystko zrobione na czas i w perfekcyjnym stanie. Sąsiedzi pytają kto robił — polecam bez wahania!",
        img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100", rating: 5, date: "3 tygodnie temu",
        reply: "Dziękuję! Miło widzieć efekty pracy budzące takie zainteresowanie.",
        helpful: 21, service: "Smart Home / KNX", order: 4,
    },
    {
        id: 5, user: "Piotr S.", text: "Szybko, sprawnie, bez zbędnych pytań. Fachowiec z prawdziwego zdarzenia — wreszcie komuś mogę zaufać.",
        img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100", rating: 5, date: "Miesiąc temu",
        reply: null, helpful: 5, service: "Pomiary elektryczne", order: 5,
    },
    {
        id: 6, user: "Karolina B.", text: "Montaż przebiegł bez żadnych niespodzianek. Czysty, schludny i profesjonalny. Gorąco polecam.",
        img: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100", rating: 5, date: "Miesiąc temu",
        reply: "Dziękuję Karolino! Zapraszam przy kolejnych projektach.",
        helpful: 8, service: "Instalacje elektryczne", order: 6,
    },
    {
        id: 7, user: "Damian K.", text: "Szybko, rzetelnie i w dobrej cenie. Elektryka zrobiona w dzień, bez bałaganu. Zdecydowanie polecam.",
        img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100", rating: 5, date: "6 tygodni temu",
        reply: null, helpful: 3, service: "Instalacje elektryczne", order: 7,
    },
    {
        id: 8, user: "Zofia M.", text: "Kompetentny fachowiec, świetna organizacja pracy. Projekt łazienki wyszedł lepiej niż oczekiwałam — naprawdę wow.",
        img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=100", rating: 5, date: "2 miesiące temu",
        reply: "Dziękuję serdecznie! Projekt łazienki to jeden z moich ulubionych.",
        helpful: 11, service: "Projektowanie łazienek", order: 8,
    },
    {
        id: 9, user: "Rafał T.", text: "Bardzo dobra jakość za rozsądną cenę. Klimatyzacja działa bez zarzutu, montaż sprawny i bez przeszkód.",
        img: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?q=80&w=100", rating: 4, date: "2 miesiące temu",
        reply: null, helpful: 4, service: "Montaż klimatyzacji", order: 9,
    },
    {
        id: 10, user: "Anna W.", text: "Polecam w stu procentach. Terminowo, estetycznie i bez niespodzianek. Wrócę przy kolejnym projekcie.",
        img: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?q=80&w=100", rating: 5, date: "3 miesiące temu",
        reply: "Bardzo się cieszę, do zobaczenia przy kolejnym projekcie!",
        helpful: 7, service: "Remonty kuchni", order: 10,
    },
    {
        id: 11, user: "Michał B.", text: "System alarmowy zamontowany profesjonalnie, wszystko skonfigurowane i działa bez zarzutu.",
        img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=100", rating: 5, date: "3 miesiące temu",
        reply: null, helpful: 2, service: "Systemy alarmowe", order: 11,
    },
    {
        id: 12, user: "Katarzyna N.", text: "Wspaniała obsługa i fachowe doradztwo. Panele fotowoltaiczne pracują lepiej niż zakładałam — polecam!",
        img: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=100", rating: 5, date: "4 miesiące temu",
        reply: "Dziękuję za zaufanie, fotowoltaika to inwestycja na lata!",
        helpful: 9, service: "Fotowoltaika PV", order: 12,
    },
];
