import { Star } from 'lucide-react';

function normalizeUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, 'https://api.mylokalni.pl');
}

interface ServiceShellData {
    title?: string;
    description?: string;
    city?: string;
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
    const cityPart = data.city ? ` w ${data.city}` : '';
    const image = normalizeUrl(data.image || data.images?.[0] || data.provider?.profilowe);
    const rating = parseFloat(String(data.rating ?? 0)) || 0;
    const reviewsCount = parseInt(String(data.reviewsCount ?? 0)) || 0;
    const providerAvatar = normalizeUrl(data.provider?.profilowe);

    return (
        <div data-ssr-shell>
            <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 z-10">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full shrink-0" aria-hidden="true" />
                    <h1 className="font-bold text-gray-900 text-base truncate">
                        {data.title}{cityPart}
                    </h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pb-32">
                {image && (
                    <div className="mt-4">
                        <img
                            src={image}
                            alt={data.title ?? ''}
                            width={800}
                            height={450}
                            className="w-full aspect-video object-cover rounded-2xl"
                        />
                    </div>
                )}

                <div className="mt-5 space-y-3">
                    <h2 className="text-2xl font-black text-gray-900 leading-tight">
                        {data.title}{cityPart}
                    </h2>

                    {(data.price !== undefined && data.price !== null && data.price !== '') && (
                        <p className="text-xl font-bold text-[#6366F1]">
                            {data.price} PLN{data.priceUnit ? `/${data.priceUnit}` : ''}
                        </p>
                    )}

                    {rating > 0 && reviewsCount > 0 && (
                        <div className="flex items-center gap-1.5">
                            <Star size={16} className="text-amber-400 fill-amber-400" />
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
            </div>
        </div>
    );
}
