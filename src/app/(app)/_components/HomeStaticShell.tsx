import { StaticServiceCard } from '@/components/seo/StaticServiceCard';
import { StaticPostCard } from '@/components/seo/StaticPostCard';
import { LandingLinks } from '@/components/seo/LandingLinks';
import { offersLabel, type LandingGroup, type PublicPost } from '@/lib/landings';
import type { Service } from '@/types';

interface Props {
    services: Service[];
    totalServices: number;
    groups: LandingGroup[];
    posts: PublicPost[];
}

// Server-rendered homepage content: real HTML (h1, intro, offers, categories, towns, posts) for
// crawlers and first paint. The interactive HomeView (tab strip) replaces it once the app loads.
export function HomeStaticShell({ services, totalServices, groups, posts }: Props) {
    const categories = groups.filter(g => g.type === 'category');
    const cities = groups.filter(g => g.type === 'city');
    const providers = new Set(services.map(s => s.provider.uid)).size;

    return (
        <div className="pb-16 bg-[#F4F4F9]">
            <section className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white py-8 md:py-16 px-4 md:px-6 rounded-b-[2rem] md:rounded-b-[3rem] shadow-2xl mb-6 md:mb-8">
                <div className="max-w-7xl mx-auto text-center md:text-left">
                    <h1 className="text-3xl md:text-6xl font-black mb-3 md:mb-4 leading-tight">
                        Zarabiaj na tym, co umiesz. <br className="hidden md:block" /> Albo znajdź kogoś tuż obok.
                    </h1>
                    <p className="text-white/90 text-base md:text-lg max-w-3xl">
                        MyLokalni.pl to lokalne usługi od młodych z Twojej okolicy – od koszenia trawnika i detailingu,
                        przez paznokcie i korepetycje, po montaż TikToków. Wystaw ogłoszenie i zarabiaj na tym, co umiesz,
                        albo przeglądaj oferty z cenami, czytaj opinie, pisz bezpośrednio do wykonawcy i rezerwuj termin
                        online – bez prowizji od zlecenia.
                    </p>
                    {totalServices > 0 && (
                        <p className="text-white/80 text-sm mt-4">
                            Obecnie w serwisie: {offersLabel(totalServices)}
                            {cities.length > 0 && <> w {cities.length} {cities.length === 1 ? 'miejscowości' : 'miejscowościach'}</>}.
                        </p>
                    )}
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4">
                {services.length > 0 && (
                    <section aria-labelledby="home-latest">
                        <h2 id="home-latest" className="text-xl font-bold text-gray-900 mb-4">Najnowsze oferty</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {services.map((s, i) => <StaticServiceCard key={s.publicId} s={s} priority={i < 4} />)}
                        </div>
                        {providers > 0 && (
                            <p className="text-sm text-gray-500 mt-3">Oferty dodali zweryfikowani użytkownicy serwisu – każda z nich ma własną stronę z opisem, ceną i opiniami.</p>
                        )}
                    </section>
                )}

                <LandingLinks title="Kategorie usług" groups={categories} />
                <LandingLinks title="Usługi w Twojej okolicy" groups={cities} />

                {posts.length > 0 && (
                    <section className="mt-10" aria-labelledby="home-posts">
                        <div className="flex items-baseline justify-between mb-3">
                            <h2 id="home-posts" className="text-lg font-bold text-gray-900">Wpisy specjalistów</h2>
                            <a href="/wpisy" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">Wszystkie wpisy →</a>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {posts.map(p => <StaticPostCard key={p.id} post={p} />)}
                        </div>
                    </section>
                )}

                <section className="mt-10 grid gap-4 md:grid-cols-3" aria-labelledby="home-how">
                    <h2 id="home-how" className="md:col-span-3 text-lg font-bold text-gray-900">Jak to działa?</h2>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-1">1. Wyszukaj</h3>
                        <p className="text-sm text-gray-600">Wpisz, czego potrzebujesz, i wybierz miejscowość. Zobaczysz oferty z cenami i lokalizacją wykonawcy.</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-1">2. Porównaj i napisz</h3>
                        <p className="text-sm text-gray-600">Sprawdź opinie i profil specjalisty, a pytania zadaj na czacie – bezpośrednio, bez pośredników.</p>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-1">3. Zarezerwuj</h3>
                        <p className="text-sm text-gray-600">Wybierz wolny termin w kalendarzu wykonawcy. Po usłudze wystaw opinię, która pomoże innym.</p>
                    </div>
                    <p className="md:col-span-3 text-sm text-gray-500">
                        Więcej: <a href="/jak-to-dziala" className="text-indigo-600 hover:underline">jak to działa</a>,{' '}
                        <a href="/faq" className="text-indigo-600 hover:underline">najczęstsze pytania</a>,{' '}
                        <a href="/zasady-bezpieczenstwa" className="text-indigo-600 hover:underline">zasady bezpieczeństwa</a>,{' '}
                        <a href="/o-nas" className="text-indigo-600 hover:underline">o nas</a>.
                    </p>
                </section>
            </div>
        </div>
    );
}
