export const runtime = 'edge';

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
    API_URL, BASE_URL,
    parseLandingSlug,
    CITY_DISPLAY, CITY_LOCATIVE, KEYWORD_DISPLAY,
    POPULAR_KEYWORDS,
} from '@/lib/seo-data';
import { createServiceUrl } from '@/utils/helpers';
import { LandingNavbar } from './_components/LandingNavbar';
import { LandingSearchBar } from './_components/LandingSearchBar';
import { LandingServiceGrid } from './_components/LandingServiceCard';
import { LandingAutoRedirect } from './_components/LandingAutoRedirect';

interface Props {
    params: Promise<{ slug: string }>;
}

async function fetchServices(keyword: string | null, city: string | null) {
    try {
        const params = new URLSearchParams({ limit: '24', sort: 'rating' });
        if (city) params.set('city', CITY_DISPLAY[city] ?? city);
        if (keyword) params.set('query', KEYWORD_DISPLAY[keyword] ?? keyword.replace(/-/g, ' '));

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const parsed = parseLandingSlug(slug);
    if (!parsed) return { title: 'MyLokalni.pl' };

    const url = `${BASE_URL}/${slug}`;

    const services = parsed.type === 'city'
        ? await fetchServices(null, parsed.city)
        : await fetchServices(parsed.keyword, parsed.city ?? null);
    const noindex = services.length >= 2
        ? { robots: { index: true, follow: true } }
        : { robots: { index: false, follow: true } };

    if (parsed.type === 'city') {
        const city = CITY_DISPLAY[parsed.city] ?? parsed.city;
        const cityLoc = CITY_LOCATIVE[parsed.city] ?? city;
        const title = `Usługi w ${cityLoc} – sprawdź specjalistów | MyLokalni.pl`;
        const description = `Znajdź sprawdzonych specjalistów w ${cityLoc}. Hydraulicy, elektryki, sprzątanie, korepetycje i wiele więcej – opinie, ceny, szybki kontakt na MyLokalni.pl.`;
        return {
            title,
            description,
            ...noindex,
            alternates: { canonical: url },
            openGraph: { title, description, url, siteName: 'MyLokalni.pl', locale: 'pl_PL', type: 'website' },
            twitter: { card: 'summary', title, description },
        };
    }

    const kw = KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword.replace(/-/g, ' ');
    const city = parsed.city ? CITY_DISPLAY[parsed.city] : null;
    const cityLoc = parsed.city ? (CITY_LOCATIVE[parsed.city] ?? city) : null;
    const title = city ? `${kw} ${city} – znajdź specjalistę | MyLokalni.pl` : `${kw} – znajdź lokalnego specjalistę | MyLokalni.pl`;
    const description = cityLoc
        ? `Porównaj oferty ${kw.toLowerCase()} w ${cityLoc}. Sprawdzone opinie, przejrzyste ceny, szybki kontakt.`
        : `Znajdź sprawdzonego specjalistę ${kw.toLowerCase()} w swojej okolicy. Realne opinie, uczciwe ceny.`;
    return {
        title,
        description,
        ...noindex,
        alternates: { canonical: url },
        openGraph: { title, description, url, siteName: 'MyLokalni.pl', locale: 'pl_PL', type: 'website' },
        twitter: { card: 'summary', title, description },
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
        if (services.length === 0) notFound();

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

        const itemListJsonLd = services.length > 0 ? {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: h1,
            numberOfItems: services.length,
            itemListElement: (services as Record<string, unknown>[]).slice(0, 10).map((s, i) => {
                const id = (s.publicId ?? s.id) as string | undefined;
                const title = s.title as string | undefined;
                const svcSlug = id && title ? createServiceUrl(title, id) : null;
                return { '@type': 'ListItem', position: i + 1, name: title, url: svcSlug ? `${BASE_URL}/service/${svcSlug}` : undefined };
            }).filter(item => item.url),
        } : null;

        return (
            <>
                <LandingAutoRedirect keyword="" city={cityDisplay} />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
                {itemListJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />}
                <div className="min-h-screen bg-gray-50">
                    <LandingNavbar />

                    <section className="bg-white border-b border-gray-100 py-8 px-4">
                        <div className="max-w-4xl mx-auto">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{h1}</h1>
                            <p className="text-gray-600 text-base max-w-xl">{description}</p>
                            <LandingSearchBar defaultKeyword="" defaultCity={cityDisplay} />
                        </div>
                    </section>

                    <section className="bg-white border-b border-gray-100 py-5 px-4">
                        <div className="max-w-7xl mx-auto">
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">Popularne usługi w {cityDisplay}</p>
                            <div className="flex flex-wrap gap-2">
                                {POPULAR_KEYWORDS.slice(0, 16).map(kw => (
                                    <Link
                                        key={kw}
                                        href={`/?q=${encodeURIComponent(KEYWORD_DISPLAY[kw] ?? kw)}&city=${encodeURIComponent(cityDisplay)}`}
                                        className="text-sm bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 px-3 py-1.5 rounded-full transition-colors"
                                    >
                                        {KEYWORD_DISPLAY[kw] ?? kw}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>

                    <main className="max-w-7xl mx-auto px-4 py-6">
                        <LandingServiceGrid
                            services={services as Record<string, unknown>[]}
                            createServiceUrl={createServiceUrl}
                        />
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
    if (services.length === 0) notFound();

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
            ...(city ? [{ '@type': 'ListItem', position: 2, name: kw, item: `${BASE_URL}/${parsed.keyword}` }] : []),
            { '@type': 'ListItem', position: city ? 3 : 2, name: h1, item: `${BASE_URL}/${slug}` },
        ],
    };

    const itemListJsonLd = services.length > 0 ? {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: h1,
        numberOfItems: services.length,
        itemListElement: (services as Record<string, unknown>[]).slice(0, 10).map((s, i) => {
            const id = (s.publicId ?? s.id) as string | undefined;
            const title = s.title as string | undefined;
            const svcSlug = id && title ? createServiceUrl(title, id) : null;
            return { '@type': 'ListItem', position: i + 1, name: title, url: svcSlug ? `${BASE_URL}/service/${svcSlug}` : undefined };
        }).filter(item => item.url),
    } : null;

    return (
        <>
            <LandingAutoRedirect keyword={kw} city={city} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            {itemListJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />}
            <div className="min-h-screen bg-gray-50">
                <LandingNavbar />

                <section className="bg-white border-b border-gray-100 py-8 px-4">
                    <div className="max-w-4xl mx-auto">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{h1}</h1>
                        <p className="text-gray-600 text-base max-w-xl">{description}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {city && (
                                <Link href={`/?q=${encodeURIComponent(kw)}`} className="text-sm text-indigo-600 underline">
                                    {kw} — wszystkie miasta
                                </Link>
                            )}
                            {!city && parsed.type === 'keyword' && (
                                <div className="mt-1 flex flex-wrap gap-2 w-full">
                                    <span className="text-xs text-gray-400 w-full">Wybierz miasto:</span>
                                    {['warszawa', 'krakow', 'wroclaw', 'poznan', 'gdansk', 'lodz', 'katowice', 'lublin'].map(c => (
                                        <Link key={c} href={`/?q=${encodeURIComponent(kw)}&city=${encodeURIComponent(CITY_DISPLAY[c])}`} className="text-sm bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 px-3 py-1 rounded-full transition-colors">
                                            {CITY_DISPLAY[c]}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                        <LandingSearchBar defaultKeyword={kw} defaultCity={city ?? ''} />
                    </div>
                </section>

                <main className="max-w-7xl mx-auto px-4 py-6">
                    <LandingServiceGrid
                        services={services as Record<string, unknown>[]}
                        createServiceUrl={createServiceUrl}
                    />
                </main>

                <PageFooter />
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
