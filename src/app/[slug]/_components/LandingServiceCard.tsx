import Image from 'next/image';
import Link from 'next/link';

function normalizeMediaUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, 'https://api.mylokalni.pl');
}

function StarRating({ rating, count }: { rating: number; count: number }) {
    const full = Math.floor(rating);
    const half = rating - full >= 0.5;
    return (
        <span className="flex items-center gap-0.5 text-xs">
            {Array.from({ length: 5 }, (_, i) => (
                <svg key={i} className={`w-3.5 h-3.5 ${i < full ? 'text-yellow-400' : i === full && half ? 'text-yellow-300' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
            <span className="text-gray-500 ml-1">{rating.toFixed(1)} ({count})</span>
        </span>
    );
}

type ServiceRecord = Record<string, unknown>;

function LandingServiceCard({ s, svcSlug }: { s: ServiceRecord; svcSlug: string | null }) {
    const title = s.title as string | undefined;
    const imgRaw = (s.image ?? (s.images as string[] | undefined)?.[0] ?? (s.provider as ServiceRecord | undefined)?.profilowe) as string | undefined;
    const image = normalizeMediaUrl(imgRaw);
    const rating = parseFloat(s.rating as string) || 0;
    const reviewsCount = parseInt(s.reviewsCount as string) || 0;
    const providerName = ((s.provider as ServiceRecord | undefined)?.name ?? (s.provider as ServiceRecord | undefined)?.displayName) as string | undefined;

    return (
        <article className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
            {image ? (
                <div className="relative w-full aspect-video">
                    <Image
                        src={image}
                        alt={title ?? 'Usługa'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                </div>
            ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-center">
                    <span className="text-indigo-300 text-4xl font-black">{title?.[0] ?? '?'}</span>
                </div>
            )}
            <div className="p-4 flex flex-col flex-1">
                {providerName && (
                    <p className="text-xs text-gray-500 mb-1 truncate">{providerName}</p>
                )}
                <h2 className="font-bold text-base text-gray-900 line-clamp-1 mb-1">{title}</h2>
                {rating > 0 && reviewsCount > 0 && (
                    <div className="mb-2">
                        <StarRating rating={rating} count={reviewsCount} />
                    </div>
                )}
                {Boolean(s.description) && (
                    <p className="text-sm text-gray-600 line-clamp-2 flex-1">{s.description as string}</p>
                )}
                <div className="flex items-center justify-between mt-4">
                    <span className="text-[#6366F1] font-semibold text-sm">
                        {s.price ? `${s.price as string} zł${s.priceUnit ? `/${s.priceUnit as string}` : ''}` : 'Zapytaj o cenę'}
                    </span>
                    {svcSlug && (
                        <Link
                            href={`/service/${svcSlug}`}
                            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                        >
                            Zarezerwuj
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
}

export function LandingServiceGrid({ services, createServiceUrl }: {
    services: ServiceRecord[];
    createServiceUrl: (title: string, id: string) => string;
}) {
    return (
        <>
            <p className="text-sm text-gray-500 mb-4">{services.length} ogłoszeń</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {services.map((s) => {
                    const id = (s.publicId ?? s.id) as string | undefined;
                    const title = s.title as string | undefined;
                    const svcSlug = id && title ? createServiceUrl(title, id) : null;
                    return <LandingServiceCard key={id ?? Math.random()} s={s} svcSlug={svcSlug} />;
                })}
            </div>
            <div className="mt-10 text-center">
                <Link
                    href="/"
                    className="inline-block bg-[#6366F1] text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-700 transition-colors"
                >
                    Zobacz więcej ogłoszeń
                </Link>
            </div>
        </>
    );
}
