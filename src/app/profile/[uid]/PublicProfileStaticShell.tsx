function StarIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 fill-amber-400" aria-hidden="true">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
    );
}
function MapPinIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0" aria-hidden="true">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}

function normalizeUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, 'https://api.mylokalni.pl');
}

interface ProfileShellData {
    imie?: string;
    nazwisko?: string;
    bio?: string;
    city?: string;
    profilowe?: string;
    zdjecieTla?: string;
    avgRating?: string | number;
    reviewsCount?: string | number;
}

export function PublicProfileStaticShell({ data }: { data: ProfileShellData }) {
    const name = [data.imie, data.nazwisko].filter(Boolean).join(' ') || 'Specjalista';
    const avatar = normalizeUrl(data.profilowe);
    const cover = normalizeUrl(data.zdjecieTla);
    const rating = parseFloat(String(data.avgRating ?? 0)) || 0;
    const reviewsCount = parseInt(String(data.reviewsCount ?? 0)) || 0;

    return (
        <div data-ssr-shell>
            <div className="sticky top-0 bg-white/90 backdrop-blur-sm border-b border-gray-100 z-10">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-full shrink-0" aria-hidden="true" />
                    <h1 className="font-bold text-gray-900 text-base truncate">{name}</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto pb-32">
                {cover ? (
                    <div className="relative h-44 bg-gray-200">
                        <img
                            src={cover}
                            alt={`Zdjęcie tła – ${name}`}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                ) : (
                    <div className="h-32 bg-gradient-to-br from-indigo-100 to-indigo-200" />
                )}

                <div className="px-4">
                    <div className="-mt-10 flex items-end gap-4 mb-4">
                        {avatar ? (
                            <img
                                src={avatar}
                                alt={name}
                                width={80}
                                height={80}
                                className="w-20 h-20 rounded-2xl object-cover border-4 border-white shadow-md shrink-0"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-2xl bg-indigo-500 border-4 border-white shadow-md flex items-center justify-center shrink-0">
                                <span className="text-white font-black text-3xl">
                                    {name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div className="mb-1 min-w-0">
                            <h2 className="text-xl font-black text-gray-900 leading-tight truncate">{name}</h2>
                            {data.city && (
                                <p className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
                                    <MapPinIcon />
                                    {data.city}
                                </p>
                            )}
                        </div>
                    </div>

                    {rating > 0 && reviewsCount > 0 && (
                        <div className="flex items-center gap-1.5 mb-4">
                            <StarIcon />
                            <span className="font-semibold text-gray-900 text-sm">{rating.toFixed(1)}</span>
                            <span className="text-gray-400 text-sm">
                                ({reviewsCount} {reviewsCount === 1 ? 'opinia' : reviewsCount < 5 ? 'opinie' : 'opinii'})
                            </span>
                        </div>
                    )}

                    {data.bio && (
                        <p className="text-gray-600 leading-relaxed text-sm">
                            {String(data.bio).slice(0, 400)}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
