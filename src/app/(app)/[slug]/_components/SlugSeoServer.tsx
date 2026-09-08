import Link from 'next/link';
import { getLandingContent, TOP_CITIES_DISPLAY } from '@/lib/landing-content';
import { KEYWORD_DISPLAY } from '@/lib/seo-data';

interface SlugSeoServerProps {
    keywordSlug: string | null;
    citySlug: string | null;
    h1: string;
}

export function SlugSeoServer({ keywordSlug, citySlug, h1 }: SlugSeoServerProps) {
    const content = getLandingContent(keywordSlug);
    const keywordDisplay = keywordSlug ? (KEYWORD_DISPLAY[keywordSlug] ?? keywordSlug.replace(/-/g, ' ')) : null;

    const otherCities = citySlug
        ? TOP_CITIES_DISPLAY.filter(c => c.slug !== citySlug)
        : TOP_CITIES_DISPLAY;

    return (
        <section className="max-w-3xl mx-auto px-4 pb-16 mt-8" aria-label="Informacje o usłudze">
            <p className="text-gray-500 text-sm leading-relaxed">{content.description}</p>

            {keywordSlug && otherCities.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-base font-semibold text-gray-800 mb-3">
                        {keywordDisplay} w innych miastach
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {otherCities.map(c => (
                            <Link
                                key={c.slug}
                                href={`/${keywordSlug}-${c.slug}`}
                                className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                            >
                                {c.display}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {!keywordSlug && h1 && (
                <div className="mt-8">
                    <h2 className="text-base font-semibold text-gray-800 mb-3">Popularne kategorie</h2>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(KEYWORD_DISPLAY).slice(0, 8).map(([slug, label]) => (
                            <Link
                                key={slug}
                                href={`/${slug}`}
                                className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {content.related.length > 0 && (
                <div className="mt-6">
                    <h2 className="text-base font-semibold text-gray-800 mb-3">Powiązane kategorie</h2>
                    <div className="flex flex-wrap gap-2">
                        {content.related.map(rel => (
                            <Link
                                key={rel}
                                href={`/${rel}`}
                                className="px-4 py-2 rounded-full bg-white border border-gray-200 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-600 transition-colors"
                            >
                                {KEYWORD_DISPLAY[rel] ?? rel.replace(/-/g, ' ')}
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-10">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Najczęstsze pytania</h2>
                <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white overflow-hidden">
                    {content.faq.map((item, i) => (
                        <details key={i} className="group px-5 py-4">
                            <summary className="flex justify-between items-start cursor-pointer list-none gap-4">
                                <span className="font-medium text-gray-900 text-sm">{item.q}</span>
                                <span className="text-gray-400 shrink-0 group-open:rotate-45 transition-transform">+</span>
                            </summary>
                            <p className="mt-3 text-gray-600 text-sm leading-relaxed">{item.a}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
