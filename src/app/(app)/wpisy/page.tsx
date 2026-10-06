export const runtime = 'edge';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BASE_URL } from '@/lib/seo-data';
import { fetchPosts } from '@/lib/landings';
import { StaticPostCard } from '@/components/seo/StaticPostCard';
import { safeJsonLd } from '@/lib/safeJsonLd';

// All public provider posts, newest first — the group page that every new post lands on immediately.

const PER_PAGE = 20;

interface Props { searchParams: Promise<{ page?: string }> }

function pageNumber(raw: string | undefined): number | null {
    if (raw === undefined) return 1;
    return /^[1-9]\d{0,3}$/.test(raw) ? Number(raw) : null;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const page = pageNumber((await searchParams).page);
    if (!page) notFound();
    const { posts } = await fetchPosts(page, PER_PAGE);
    const url = page === 1 ? `${BASE_URL}/wpisy` : `${BASE_URL}/wpisy?page=${page}`;
    const title = page === 1 ? 'Wpisy specjalistów' : `Wpisy specjalistów – strona ${page}`;
    const description = 'Aktualności, realizacje i porady lokalnych specjalistów z MyLokalni.pl – najnowsze wpisy wykonawców usług.';
    return {
        title,
        description,
        robots: posts.some(p => p.indexable) ? { index: true, follow: true } : { index: false, follow: true },
        alternates: { canonical: url },
        openGraph: { title, description, url, type: 'website', siteName: 'MyLokalni.pl', locale: 'pl_PL' },
    };
}

export default async function PostsPage({ searchParams }: Props) {
    const page = pageNumber((await searchParams).page);
    if (!page) notFound();
    const { posts, total, pages } = await fetchPosts(page, PER_PAGE);
    if (page > 1 && posts.length === 0) notFound();

    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Wpisy specjalistów',
        numberOfItems: total,
        itemListElement: posts.map((p, i) => ({ '@type': 'ListItem', position: (page - 1) * PER_PAGE + i + 1, url: `${BASE_URL}/wpis/${p.slug}` })),
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }} />
            <div className="max-w-5xl mx-auto px-4 pt-4 pb-32">
                <nav aria-label="breadcrumb" className="mb-2">
                    <ol className="flex items-center gap-x-1.5 text-xs text-gray-400">
                        <li><a href="/" className="hover:text-indigo-600">Strona główna</a></li>
                        <li aria-hidden="true">/</li>
                        <li className="text-gray-600">Wpisy specjalistów</li>
                    </ol>
                </nav>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Wpisy specjalistów</h1>
                <p className="text-sm text-gray-600 mt-2 mb-6 max-w-3xl">
                    Aktualności, realizacje i porady publikowane przez wykonawców usług na MyLokalni.pl.
                    {total > 0 && ` Łącznie wpisów: ${total}.`}
                </p>

                {posts.length === 0 ? (
                    <p className="text-gray-500">Specjaliści nie opublikowali jeszcze żadnych wpisów.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {posts.map(p => <StaticPostCard key={p.id} post={p} headingLevel="h2" />)}
                    </div>
                )}

                {pages > 1 && (
                    <nav aria-label="Strony" className="flex justify-between mt-8 text-sm font-semibold">
                        {page > 1 ? <a href={page === 2 ? '/wpisy' : `/wpisy?page=${page - 1}`} className="text-indigo-600">← Nowsze</a> : <span />}
                        {page < pages ? <a href={`/wpisy?page=${page + 1}`} className="text-indigo-600">Starsze →</a> : <span />}
                    </nav>
                )}
            </div>
        </>
    );
}
