import { StaticServiceCard } from '@/components/seo/StaticServiceCard';
import { StaticPostCard } from '@/components/seo/StaticPostCard';
import { LandingLinks } from '@/components/seo/LandingLinks';
import { categoryLabel, landingH1, offersLabel, type LandingData, type LandingGroup } from '@/lib/landings';

interface Props {
    data: LandingData;
    related: LandingGroup[];
    parents: LandingGroup[];
}

function intro(g: LandingGroup, total: number, providers: number, cities: string[]): string {
    const cat = categoryLabel(g.categorySlug);
    const who = `${providers} ${providers === 1 ? 'specjalisty' : 'specjalistów'}`;
    if (g.type === 'category') {
        const where = cities.length > 0 ? ` z miejscowości: ${cities.join(', ')}` : '';
        return `Kategoria ${cat}: ${offersLabel(total)} od ${who}${where}. Porównaj ceny i opinie, napisz do wykonawcy i zarezerwuj termin na MyLokalni.pl.`;
    }
    if (g.type === 'city') {
        return `${offersLabel(total)} lokalnych usług od ${who} w miejscowości ${g.city}. Porównaj ceny i opinie, napisz do wykonawcy i zarezerwuj termin na MyLokalni.pl.`;
    }
    return `${cat} w miejscowości ${g.city}: ${offersLabel(total)} od ${who}. Porównaj ceny i opinie, napisz do wykonawcy i zarezerwuj termin na MyLokalni.pl.`;
}

export function SlugStaticShell({ data, related, parents }: Props) {
    const { group, services, posts, total } = data;
    const providers = new Set(services.map(s => s.provider.uid)).size;
    const cities = [...new Set(services.map(s => s.city).filter(Boolean))];

    return (
        <div data-slug-shell className="max-w-7xl mx-auto px-4 pt-4 pb-12">
            <nav aria-label="breadcrumb" className="mb-2">
                <ol className="flex items-center flex-wrap gap-x-1.5 text-xs text-gray-400">
                    <li><a href="/" className="hover:text-indigo-600">Strona główna</a></li>
                    {parents.map(p => (
                        <li key={p.slug} className="flex items-center gap-x-1.5">
                            <span aria-hidden="true">/</span>
                            <a href={`/${p.slug}`} className="hover:text-indigo-600">{p.type === 'category' ? categoryLabel(p.categorySlug) : p.city}</a>
                        </li>
                    ))}
                    <li className="flex items-center gap-x-1.5"><span aria-hidden="true">/</span><span className="text-gray-600">{landingH1(group)}</span></li>
                </ol>
            </nav>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{landingH1(group)}</h1>
            <p className="text-sm text-gray-600 mt-2 max-w-3xl">{intro(group, total, providers, cities)}</p>

            <section className="mt-6" aria-label="Oferty">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {services.map((s, i) => (
                        <StaticServiceCard key={s.publicId} s={s} priority={i < 4} />
                    ))}
                </div>
            </section>

            {posts.length > 0 && (
                <section className="mt-10">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Wpisy specjalistów</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {posts.map(p => <StaticPostCard key={p.id} post={p} />)}
                    </div>
                </section>
            )}

            <LandingLinks
                title={group.type === 'city' ? `Kategorie usług – ${group.city}` : group.type === 'category' ? `${categoryLabel(group.categorySlug)} w innych miejscowościach` : 'Zobacz także'}
                groups={related}
            />
        </div>
    );
}
