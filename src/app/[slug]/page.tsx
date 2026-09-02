import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
    API_URL, BASE_URL,
    parseLandingSlug,
    CITY_DISPLAY, CITY_LOCATIVE, KEYWORD_DISPLAY,
    ALL_KEYWORDS, ALL_CITIES, POPULAR_KEYWORDS,
} from '@/lib/seo-data';
import { createServiceUrl } from '@/utils/helpers';

export async function generateStaticParams() {
    return [
        ...ALL_KEYWORDS.map(slug => ({ slug })),
        ...ALL_CITIES.map(slug => ({ slug })),
    ];
}

interface Props {
    params: Promise<{ slug: string }>;
}

async function fetchServices(keyword: string | null, city: string | null) {
    try {
        const params = new URLSearchParams({ limit: '24', sort: 'rating' });
        if (city) params.set('city', CITY_DISPLAY[city] ?? city);
        if (keyword) params.set('search', KEYWORD_DISPLAY[keyword] ?? keyword.replace(/-/g, ' '));

        const res = await fetch(`${API_URL}/services?${params}`, {
            headers: { 'User-Agent': 'Lokalni-MetaBot/1.0' },
            next: { revalidate: 3600 },
        });
        if (!res.ok) return [];
        const json = await res.json();
        return Array.isArray(json) ? json : (json.data ?? []);
    } catch {
        return [];
    }
}

function normalizeMediaUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, 'https://api.mylokalni.pl');
}

function StarRating({ rating, count }: { rating: number; count: number }) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return (
        <span className="flex items-center gap-1 text-sm">
            {Array.from({ length: 5 }, (_, i) => (
                <svg key={i} className={`w-4 h-4 ${i < full ? 'text-yellow-400' : i === full && half ? 'text-yellow-300' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
            <span className="text-gray-600 ml-1">{rating.toFixed(1)} ({count})</span>
        </span>
    );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const parsed = parseLandingSlug(slug);
    if (!parsed) return { title: 'MyLokalni.pl' };

    const url = `${BASE_URL}/${slug}`;

    if (parsed.type === 'city') {
        const city = CITY_DISPLAY[parsed.city] ?? parsed.city;
        const cityLoc = CITY_LOCATIVE[parsed.city] ?? city;
        const title = `Usługi w ${cityLoc} – sprawdź specjalistów | MyLokalni.pl`;
        const description = `Znajdź sprawdzonych specjalistów w ${cityLoc}. Hydraulicy, elektryki, sprzątanie, korepetycje i wiele więcej – opinie, ceny, szybki kontakt na MyLokalni.pl.`;
        return {
            title, description,
            alternates: { canonical: url },
            openGraph: { title, description, url, type: 'website', images: [{ url: `${BASE_URL}/og-image.png` }], siteName: 'MyLokalni.pl', locale: 'pl_PL' },
            twitter: { card: 'summary_large_image', title, description },
        };
    }

    const kw = KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword;
    const city = parsed.city ? CITY_DISPLAY[parsed.city] : null;
    const cityLoc = parsed.city ? (CITY_LOCATIVE[parsed.city] ?? city) : null;
    const title = city
        ? `${kw} ${city} – znajdź specjalistę | MyLokalni.pl`
        : `${kw} – znajdź lokalnego specjalistę | MyLokalni.pl`;
    const description = cityLoc
        ? `Szukasz usługi ${kw.toLowerCase()} w ${cityLoc}? Sprawdź opinie, porównaj ceny i skontaktuj się bezpośrednio ze sprawdzonymi specjalistami na MyLokalni.pl.`
        : `Sprawdź lokalnych specjalistów ${kw.toLowerCase()} w Twojej okolicy. Opinie, ceny i bezpośredni kontakt – tylko na MyLokalni.pl.`;

    return {
        title, description,
        alternates: { canonical: url },
        openGraph: { title, description, url, type: 'website', images: [{ url: `${BASE_URL}/og-image.png` }], siteName: 'MyLokalni.pl', locale: 'pl_PL' },
        twitter: { card: 'summary_large_image', title, description },
    };
}

export default async function SlugPage({ params }: Props) {
    const { slug } = await params;
    const parsed = parseLandingSlug(slug);
    if (!parsed) notFound();

    // ── CITY PAGE ──────────────────────────────────────────────────────────────
    if (parsed.type === 'city') {
        const cityDisplay = CITY_DISPLAY[parsed.city] ?? parsed.city;
        const cityLoc = CITY_LOCATIVE[parsed.city] ?? cityDisplay;
        const services = await fetchServices(null, parsed.city);

        const h1 = `Usługi w ${cityLoc}`;
        const description = `Porównaj oferty lokalnych specjalistów w ${cityLoc}. Sprawdzone opinie, uczciwe ceny, szybki kontakt.`;

        const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: h1,
            description,
            url: `${BASE_URL}/${slug}`,
            publisher: { '@type': 'Organization', name: 'MyLokalni.pl', url: BASE_URL },
        };

        const breadcrumbJsonLd = {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Strona główna', item: BASE_URL },
                { '@type': 'ListItem', position: 2, name: cityDisplay, item: `${BASE_URL}/${slug}` },
            ],
        };

        return (
            <>
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
                <div className="min-h-screen bg-gray-50">
                    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                            <Link href="/" className="text-indigo-600 font-bold text-lg">MyLokalni.pl</Link>
                            <Link href="/" className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors">
                                Otwórz aplikację
                            </Link>
                        </div>
                    </header>

                    <section className="bg-white border-b border-gray-100 py-8 px-4">
                        <div className="max-w-4xl mx-auto">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{h1}</h1>
                            <p className="text-gray-600 text-base max-w-xl">{description}</p>
                        </div>
                    </section>

                    {/* Popular categories for this city */}
                    <section className="bg-white border-b border-gray-100 py-5 px-4">
                        <div className="max-w-4xl mx-auto">
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Popularne usługi w {cityDisplay}</p>
                            <div className="flex flex-wrap gap-2">
                                {POPULAR_KEYWORDS.slice(0, 16).map(kw => (
                                    <Link
                                        key={kw}
                                        href={`/${kw}-${parsed.city}`}
                                        className="text-sm bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                                    >
                                        {KEYWORD_DISPLAY[kw] ?? kw}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>

                    <main className="max-w-4xl mx-auto px-4 py-6">
                        {services.length === 0 ? (
                            <div className="text-center py-16">
                                <p className="text-gray-500 text-lg mb-4">Brak ogłoszeń w {cityDisplay}.</p>
                                <Link href="/" className="bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors">
                                    Przeglądaj wszystkie ogłoszenia
                                </Link>
                            </div>
                        ) : (
                            <ServiceList services={services} />
                        )}
                    </main>

                    <PageFooter />
                </div>
            </>
        );
    }

    // ── KEYWORD / KEYWORD+CITY PAGE ────────────────────────────────────────────
    const kw = KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword.replace(/-/g, ' ');
    const city = parsed.city ? CITY_DISPLAY[parsed.city] : null;
    const cityLoc = parsed.city ? (CITY_LOCATIVE[parsed.city] ?? city) : null;
    const services = await fetchServices(parsed.keyword, parsed.city ?? null);

    const h1 = city ? `${kw} ${city}` : kw;
    const description = cityLoc
        ? `Porównaj oferty ${kw.toLowerCase()} w ${cityLoc}. Sprawdzone opinie, przejrzyste ceny, szybki kontakt.`
        : `Znajdź sprawdzonego specjalistę ${kw.toLowerCase()} w swojej okolicy. Realne opinie, uczciwe ceny.`;

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: h1,
        description,
        url: `${BASE_URL}/${slug}`,
        publisher: { '@type': 'Organization', name: 'MyLokalni.pl', url: BASE_URL },
    };

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Strona główna', item: BASE_URL },
            ...(city ? [
                { '@type': 'ListItem', position: 2, name: kw, item: `${BASE_URL}/${parsed.keyword}` },
                { '@type': 'ListItem', position: 3, name: `${kw} ${city}`, item: `${BASE_URL}/${slug}` },
            ] : [
                { '@type': 'ListItem', position: 2, name: kw, item: `${BASE_URL}/${slug}` },
            ]),
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <div className="min-h-screen bg-gray-50">
                <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                    <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                        <Link href="/" className="text-indigo-600 font-bold text-lg">MyLokalni.pl</Link>
                        <Link href="/" className="bg-indigo-600 text-white text-sm px-4 py-2 rounded-full font-medium hover:bg-indigo-700 transition-colors">
                            Otwórz aplikację
                        </Link>
                    </div>
                </header>

                <section className="bg-white border-b border-gray-100 py-8 px-4">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{h1}</h1>
                        <p className="text-gray-600 text-base max-w-xl">{description}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {city && (
                                <Link href={`/${parsed.keyword}`} className="text-sm text-indigo-600 underline">
                                    {kw} — wszystkie miasta
                                </Link>
                            )}
                            {!city && parsed.type === 'keyword' && (
                                <div className="mt-2 flex flex-wrap gap-2 w-full">
                                    <span className="text-xs text-gray-400 w-full">Wybierz miasto:</span>
                                    {['warszawa', 'krakow', 'wroclaw', 'poznan', 'gdansk', 'lodz', 'katowice', 'lublin'].map(c => (
                                        <Link key={c} href={`/${parsed.keyword}-${c}`} className="text-sm bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 px-3 py-1 rounded-full transition-colors">
                                            {CITY_DISPLAY[c]}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <main className="max-w-4xl mx-auto px-4 py-6">
                    {services.length === 0 ? (
                        <div className="text-center py-16">
                            <p className="text-gray-500 text-lg mb-4">Brak ogłoszeń w tej kategorii.</p>
                            <Link href="/" className="bg-indigo-600 text-white px-6 py-3 rounded-full font-medium hover:bg-indigo-700 transition-colors">
                                Przeglądaj wszystkie ogłoszenia
                            </Link>
                        </div>
                    ) : (
                        <ServiceList services={services} />
                    )}
                </main>

                <PageFooter />
            </div>
        </>
    );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function ServiceList({ services }: { services: ReturnType<typeof Array<unknown>>[number][] }) {
    return (
        <>
            <p className="text-sm text-gray-500 mb-4">{services.length} ogłoszeń</p>
            <ul className="space-y-4">
                {(services as Record<string, unknown>[]).map((s) => {
                    const id = (s.publicId ?? s.id) as string | undefined;
                    const title = s.title as string | undefined;
                    const svcSlug = id && title ? createServiceUrl(title, id) : null;
                    const imgRaw = (s.image ?? (s.images as string[] | undefined)?.[0] ?? (s.provider as Record<string, unknown> | undefined)?.profilowe) as string | undefined;
                    const image = normalizeMediaUrl(imgRaw);
                    const rating = parseFloat(s.rating as string) || 0;
                    const reviewsCount = parseInt(s.reviewsCount as string) || 0;

                    return (
                        <li key={id ?? Math.random()} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="flex gap-4 p-4">
                                {image && (
                                    <Image src={image} alt={title ?? 'Usługa'} width={80} height={80} className="rounded-xl object-cover flex-shrink-0" />
                                )}
                                <div className="flex-1 min-w-0">
                                    <h2 className="font-semibold text-gray-900 text-base leading-tight mb-1 line-clamp-2">{title}</h2>
                                    {Boolean(s.city) && <p className="text-sm text-gray-500 mb-1">{s.city as string}</p>}
                                    {rating > 0 && reviewsCount > 0 && <StarRating rating={rating} count={reviewsCount} />}
                                    {Boolean(s.description) && (
                                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{String(s.description).slice(0, 120)}</p>
                                    )}
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-indigo-600 font-semibold text-sm">
                                            {s.price ? `${s.price as string} zł${s.priceUnit ? `/${s.priceUnit as string}` : ''}` : 'Zapytaj o cenę'}
                                        </span>
                                        {svcSlug && (
                                            <Link href={`/service/${svcSlug}`} className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded-full font-medium hover:bg-indigo-700 transition-colors">
                                                Zobacz ofertę
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
            <div className="mt-8 text-center">
                <Link href="/" className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-700 transition-colors">
                    Zobacz więcej ogłoszeń w aplikacji
                </Link>
            </div>
        </>
    );
}

function PageFooter() {
    return (
        <footer className="border-t border-gray-200 mt-12 py-8 px-4 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} MyLokalni.pl – platforma lokalnych usług</p>
            <div className="flex justify-center gap-4 mt-2">
                <Link href="/jak-to-dziala" className="hover:text-indigo-600">Jak to działa</Link>
                <Link href="/faq" className="hover:text-indigo-600">FAQ</Link>
                <Link href="/regulamin" className="hover:text-indigo-600">Regulamin</Link>
                <Link href="/polityka-prywatnosci" className="hover:text-indigo-600">Polityka prywatności</Link>
            </div>
        </footer>
    );
}
