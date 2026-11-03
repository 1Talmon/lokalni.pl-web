import {
    formatPriceRange, landingH1, offersLabel, priceSummary, providerSummary,
    type LandingData,
} from '@/lib/landings';

// Visible (never hidden) summary of a landing group, built only from its real offers.
// Lives OUTSIDE SlugStaticShell on purpose: the shell is hidden once the app takes over, and text that only
// crawlers can see is exactly what we don't want. Server component → in the HTML for Google and users alike.
// Shown only when the page lists every offer of the group: with a partial list, min/max would be wrong.
export function LandingFacts({ data }: { data: LandingData }) {
    const { group, services, total } = data;
    if (services.length === 0 || services.length !== total) return null;

    const prices = priceSummary(services);
    const providers = providerSummary(services);
    const shownProviders = providers.slice(0, 8);

    return (
        <section aria-labelledby="landing-facts" className="max-w-7xl mx-auto px-4 pb-12">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 md:p-6 max-w-3xl">
                <h2 id="landing-facts" className="text-base md:text-lg font-bold text-gray-900 mb-3">
                    {landingH1(group)} – w skrócie
                </h2>
                <dl className="text-sm text-gray-600 space-y-2">
                    <div>
                        <dt className="inline font-semibold text-gray-800">Oferty: </dt>
                        <dd className="inline">{offersLabel(total)} od {providers.length} {providers.length === 1 ? 'specjalisty' : 'specjalistów'}</dd>
                    </div>
                    {prices.length > 0 && (
                        <div>
                            <dt className="inline font-semibold text-gray-800">Ceny: </dt>
                            <dd className="inline">
                                {prices.map(r => `${r.unit}: ${formatPriceRange(r)} (${offersLabel(r.count)})`).join('; ')}
                            </dd>
                        </div>
                    )}
                    {shownProviders.length > 0 && (
                        <div>
                            <dt className="inline font-semibold text-gray-800">Wykonawcy: </dt>
                            <dd className="inline">
                                {shownProviders.map((p, i) => (
                                    <span key={p.uid}>
                                        {i > 0 && ', '}
                                        <a href={`/profile/${p.uid}`} className="text-indigo-600 hover:underline font-medium">{p.name}</a>
                                        {' '}({offersLabel(p.count)})
                                    </span>
                                ))}
                                {providers.length > shownProviders.length && ` i ${providers.length - shownProviders.length} więcej`}
                            </dd>
                        </div>
                    )}
                </dl>
                <p className="text-xs text-gray-400 mt-3">
                    Ceny ustalają wykonawcy; podane zakresy pochodzą z aktualnych ofert w tej grupie.
                </p>
            </div>
        </section>
    );
}
