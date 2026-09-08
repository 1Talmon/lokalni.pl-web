function StarIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 fill-amber-400" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}

import Link from 'next/link';
import { CATEGORY_SLUG, KEYWORD_DISPLAY, CITY_SLUG } from '@/lib/seo-data';

function normalizeUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, 'https://api.mylokalni.pl');
}

interface ServiceShellData {
    title?: string;
    description?: string;
    city?: string;
    category?: string;
    price?: string | number;
    priceUnit?: string;
    rating?: string | number;
    reviewsCount?: string | number;
    image?: string;
    images?: string[];
    provider?: {
        name?: string;
        profilowe?: string;
    };
}

export function ServiceStaticShell({ data }: { data: ServiceShellData }) {
    const image = normalizeUrl(data.image || data.images?.[0] || data.provider?.profilowe);
    const rating = parseFloat(String(data.rating ?? 0)) || 0;
    const reviewsCount = parseInt(String(data.reviewsCount ?? 0)) || 0;
    const providerAvatar = normalizeUrl(data.provider?.profilowe);
    const catSlug = data.category ? (CATEGORY_SLUG[data.category] ?? null) : null;
    const catLabel = catSlug ? (KEYWORD_DISPLAY[catSlug] ?? null) : null;
    const citySlug = data.city ? (CITY_SLUG[data.city] ?? null) : null;
    const catCitySlug = catSlug && citySlug ? `${catSlug}-${citySlug}` : null;

    return (
        <div data-ssr-shell>
            <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 z-10">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full shrink-0" aria-hidden="true" />
                    <h1 className="font-bold text-gray-900 text-base truncate">
                        {data.title}
                    </h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pb-32">
                {(catSlug || data.city) && (
                    <nav aria-label="breadcrumb" className="pt-3 pb-1">
                        <ol className="flex items-center flex-wrap gap-x-1.5 gap-y-1 text-xs text-gray-400">
                            <li><Link href="/" className="hover:text-indigo-600 transition-colors">Strona główna</Link></li>
                            {catSlug && catLabel && (
                                <>
                                    <li aria-hidden="true">/</li>
                                    <li><Link href={`/${catSlug}`} className="hover:text-indigo-600 transition-colors">{catLabel}</Link></li>
                                </>
                            )}
                            {catCitySlug && data.city && (
                                <>
                                    <li aria-hidden="true">/</li>
                                    <li><Link href={`/${catCitySlug}`} className="hover:text-indigo-600 transition-colors">{data.city}</Link></li>
                                </>
                            )}
                            <li aria-hidden="true">/</li>
                            <li className="text-gray-600 font-medium truncate max-w-[180px]">{data.title}</li>
                        </ol>
                    </nav>
                )}

                {image && (
                    <div className="mt-4">
                        <img
                            src={image}
                            alt={data.title ?? ''}
                            width={800}
                            height={450}
                            fetchPriority="high"
                            loading="eager"
                            decoding="sync"
                            className="w-full aspect-video object-cover rounded-2xl"
                        />
                    </div>
                )}

                <div className="mt-5 space-y-3">
                    <h2 className="text-2xl font-black text-gray-900 leading-tight">
                        {data.title}
                    </h2>

                    {(data.price !== undefined && data.price !== null && data.price !== '') && (
                        <p className="text-xl font-bold text-[#6366F1]">
                            {data.price} PLN{data.priceUnit ? `/${data.priceUnit}` : ''}
                        </p>
                    )}

                    {rating > 0 && reviewsCount > 0 && (
                        <div className="flex items-center gap-1.5">
                            <StarIcon />
                            <span className="font-semibold text-gray-900 text-sm">{rating.toFixed(1)}</span>
                            <span className="text-gray-400 text-sm">({reviewsCount} {reviewsCount === 1 ? 'opinia' : reviewsCount < 5 ? 'opinie' : 'opinii'})</span>
                        </div>
                    )}

                    {data.description && (
                        <p className="text-gray-600 leading-relaxed text-sm">
                            {String(data.description).slice(0, 400)}
                        </p>
                    )}
                </div>

                {data.provider?.name && (
                    <div className="mt-6 flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        {providerAvatar ? (
                            <img
                                src={providerAvatar}
                                alt={data.provider.name}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover shrink-0"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                <span className="text-[#6366F1] font-bold text-base">
                                    {data.provider.name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div>
                            <p className="text-xs text-gray-400 font-medium">Specjalista</p>
                            <p className="font-bold text-gray-900 text-sm">{data.provider.name}</p>
                        </div>
                    </div>
                )}

                {(catCitySlug || catSlug) && catLabel && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <Link
                            href={`/${catCitySlug ?? catSlug}`}
                            className="inline-flex items-center gap-2 text-sm text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
                        >
                            ← Więcej: {catLabel}{data.city ? ` w ${data.city}` : ''}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
