import Link from 'next/link';
import { createServiceUrl } from '@/utils/helpers';
import { KEYWORD_DISPLAY, CITY_DISPLAY, CITY_LOCATIVE } from '@/lib/seo-data';
import type { Service } from '@/types';
import type { ParsedSlug } from '@/lib/slug-services';

interface Props {
    parsed: ParsedSlug;
    services: Service[];
    total: number;
}

function normalizeImg(url: string | undefined): string | null {
    if (!url) return null;
    return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, 'https://api.mylokalni.pl');
}

function StaticCard({ s, priority }: { s: Service; priority: boolean }) {
    const slug = s.publicId && s.title ? createServiceUrl(s.title, s.publicId) : null;
    const img = normalizeImg(s.image || s.images?.[0]);
    const href = slug ? `/service/${slug}` : '/';

    return (
        <a href={href} className="relative bg-white rounded-3xl overflow-hidden shadow-lg block">
            {/* Image */}
            <div className="relative h-48 w-full bg-gray-200">
                {img ? (
                    <img
                        src={img}
                        alt={s.title}
                        loading={priority ? 'eager' : 'lazy'}
                        fetchPriority={priority ? 'high' : 'auto'}
                        decoding={priority ? 'sync' : 'async'}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-100 to-indigo-200" />
                )}
                {/* Location badge */}
                <div className="absolute top-3 left-3 z-10">
                    <span className="bg-black/80 text-white px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                        {s.isRemote ? 'Zdalnie' : (s.city || '')}
                    </span>
                </div>
                {/* Price badge */}
                <div className="absolute bottom-3 right-3 z-10">
                    <div className="bg-white px-3 py-2 rounded-xl shadow-sm text-right">
                        <div className="font-bold text-lg text-gray-900">{s.price} zł</div>
                        <div className="text-[10px] text-gray-500">{s.priceUnit}</div>
                    </div>
                </div>
            </div>

            {/* Card body */}
            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm shrink-0 overflow-hidden">
                            {s.provider.avatar
                                ? <img src={normalizeImg(s.provider.avatar) ?? ''} alt="" className="w-full h-full object-cover" />
                                : (s.provider.name?.[0] ?? '?')
                            }
                        </div>
                        <span className="font-bold text-sm text-gray-900 truncate max-w-[120px]">{s.provider.name}</span>
                    </div>
                    {s.rating > 0 && (
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-1 rounded-lg shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                            </svg>
                            <span className="font-bold text-xs">{s.rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>
                <h2 className="font-bold text-base text-gray-900 mb-1 line-clamp-1">{s.title}</h2>
                <p className="text-gray-600 text-xs mb-3 line-clamp-2 min-h-[32px]">{s.description}</p>
                <div className="w-full bg-gray-900 text-white py-2.5 rounded-xl font-bold text-sm text-center">
                    Zobacz szczegóły
                </div>
            </div>
        </a>
    );
}

export function SlugStaticShell({ parsed, services, total }: Props) {
    // Build human-readable title
    let h1 = '';
    if (parsed.type === 'keyword') {
        h1 = KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword.replace(/-/g, ' ');
    } else if (parsed.type === 'city') {
        const loc = CITY_LOCATIVE[parsed.citySlug] ?? CITY_DISPLAY[parsed.citySlug] ?? parsed.citySlug;
        h1 = `Usługi w ${loc}`;
    } else if (parsed.type === 'keyword-city') {
        const kw = KEYWORD_DISPLAY[parsed.keyword] ?? parsed.keyword.replace(/-/g, ' ');
        const loc = CITY_LOCATIVE[parsed.citySlug]
            ? `w ${CITY_LOCATIVE[parsed.citySlug]}`
            : CITY_DISPLAY[parsed.citySlug] ?? parsed.citySlug.replace(/-/g, ' ');
        h1 = `${kw} ${loc}`;
    } else {
        const city = parsed.citySlug ? (CITY_DISPLAY[parsed.citySlug] ?? parsed.citySlug.replace(/-/g, ' ')) : null;
        h1 = city ? `${parsed.query} ${city}` : parsed.query;
    }

    return (
        <div data-slug-shell>
            {/* Search context header */}
            <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{h1}</h1>
                {total > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                        {total} {total === 1 ? 'oferta' : total < 5 ? 'oferty' : 'ofert'}
                    </p>
                )}
            </div>

            {/* Service grid */}
            <div className="max-w-7xl mx-auto px-4 pb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {services.map((s, i) => (
                        <StaticCard key={s.publicId} s={s} priority={i < 4} />
                    ))}
                </div>
            </div>
        </div>
    );
}
