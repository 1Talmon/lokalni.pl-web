export const runtime = 'edge';

import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { BASE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo-data';
import {
    fetchPost, postTitle, postExcerpt, authorName, formatDatePl, categoryLabel, offersLabel,
    landingLinkLabel, type PostDetail,
} from '@/lib/landings';
import { safeJsonLd } from '@/lib/safeJsonLd';

// Single provider post. URL /wpis/<slug-from-content>-<id>; any other slug 301s to the canonical one.
// Indexed only when the post has real content (API `indexable`: ≥80 chars or a photo).

interface Props { params: Promise<{ slug: string }> }

async function load(slug: string): Promise<PostDetail> {
    const post = await fetchPost(slug);
    if (!post) notFound();
    if (post.slug !== slug) permanentRedirect(`/wpis/${post.slug}`);
    return post;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = await load(slug);
    const name = authorName(post.author);
    const title = `${postTitle(post.content)} – ${name}`;
    const description = postExcerpt(post.content);
    const url = `${BASE_URL}/wpis/${post.slug}`;
    const image = post.image || post.author.profilowe || DEFAULT_OG_IMAGE;

    return {
        title,
        description,
        robots: post.indexable ? { index: true, follow: true } : { index: false, follow: true },
        alternates: { canonical: url },
        openGraph: { title, description, url, type: 'article', siteName: 'MyLokalni.pl', locale: 'pl_PL',
            publishedTime: post.createdAt, modifiedTime: post.updatedAt, images: [{ url: image }] },
        twitter: { card: post.image ? 'summary_large_image' : 'summary', title, description, images: [image] },
    };
}

export default async function PostPage({ params }: Props) {
    const { slug } = await params;
    const post = await load(slug);
    const name = authorName(post.author);
    const title = postTitle(post.content);
    const url = `${BASE_URL}/wpis/${post.slug}`;
    const profileUrl = `${BASE_URL}/profile/${post.author.uid}`;

    const postingJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SocialMediaPosting',
        '@id': url,
        url,
        headline: title,
        articleBody: post.content,
        datePublished: post.createdAt,
        dateModified: post.updatedAt,
        ...(post.image ? { image: post.image } : {}),
        author: { '@type': 'Person', name, url: profileUrl },
        publisher: { '@type': 'Organization', name: 'MyLokalni.pl', url: BASE_URL },
        mainEntityOfPage: url,
    };
    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Strona główna', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: 'Wpisy specjalistów', item: `${BASE_URL}/wpisy` },
            { '@type': 'ListItem', position: 3, name: title, item: url },
        ],
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(postingJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
            <article className="max-w-2xl mx-auto px-4 pt-4 pb-32">
                <nav aria-label="breadcrumb" className="mb-3">
                    <ol className="flex items-center flex-wrap gap-x-1.5 text-xs text-gray-400">
                        <li><a href="/" className="hover:text-indigo-600">Strona główna</a></li>
                        <li aria-hidden="true">/</li>
                        <li><a href="/wpisy" className="hover:text-indigo-600">Wpisy specjalistów</a></li>
                        <li aria-hidden="true">/</li>
                        <li className="text-gray-600 truncate max-w-[200px]">{title}</li>
                    </ol>
                </nav>

                <header className="flex items-center gap-3 mb-4">
                    <a href={`/profile/${post.author.uid}`} className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 overflow-hidden">
                        {post.author.profilowe
                            ? <img src={post.author.profilowe} alt={name} className="w-full h-full object-cover" />
                            : name.charAt(0).toUpperCase()}
                    </a>
                    <div>
                        <a href={`/profile/${post.author.uid}`} className="font-bold text-gray-900 hover:text-indigo-600">{name}</a>
                        <p className="text-xs text-gray-400">
                            <time dateTime={post.createdAt}>{formatDatePl(post.createdAt)}</time>
                        </p>
                    </div>
                </header>

                <h1 className="text-2xl font-black text-gray-900 leading-tight mb-4">{title}</h1>
                {post.image && (
                    <img src={post.image} alt={title} className="w-full rounded-2xl mb-4 object-cover" />
                )}
                <div className="text-gray-700 leading-relaxed space-y-3">
                    {post.content.split(/\n{2,}/).map((para, i) => (
                        <p key={i} className="whitespace-pre-line">{para}</p>
                    ))}
                </div>

                {post.services.length > 0 && (
                    <section className="mt-8 pt-6 border-t border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Usługi: {name}</h2>
                        <ul className="space-y-2">
                            {post.services.map(s => (
                                <li key={s.publicId}>
                                    <a href={`/service/${s.slug}`} className="font-semibold text-indigo-600 hover:text-indigo-800">{s.title}</a>
                                    <span className="text-sm text-gray-400">
                                        {[categoryLabel(s.categorySlug), s.city].filter(Boolean).map(t => ` · ${t}`).join('')}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                {post.landings.length > 0 && (
                    <section className="mt-6">
                        <h2 className="text-sm font-bold text-gray-500 mb-2">Zobacz też oferty</h2>
                        <ul className="flex flex-wrap gap-2">
                            {post.landings.map(g => (
                                <li key={g.slug}>
                                    <a href={`/${g.slug}`} className="inline-block bg-white border border-gray-200 rounded-full px-3 py-1.5 text-sm text-gray-700 hover:border-indigo-400">
                                        {landingLinkLabel(g)} <span className="text-gray-400 text-xs">{offersLabel(g.count)}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <p className="mt-8">
                    <a href="/wpisy" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">← Wszystkie wpisy specjalistów</a>
                </p>
            </article>
        </>
    );
}
