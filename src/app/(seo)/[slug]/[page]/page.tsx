export const runtime = 'edge';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BASE_URL, parseSlug } from '@/lib/seo-data';
import { createServiceUrl } from '@/utils/helpers';
import { fetchServices, resolveFetchParams, buildH1, PAGE_SIZE } from '@/lib/slug-services';
import { SlugPageClient } from '../_components/SlugPageClient';

interface Props {
    params: Promise<{ slug: string; page: string }>;
}

function parsePage(raw: string): number | null {
    const n = parseInt(raw, 10);
    return Number.isFinite(n) && n >= 2 && String(n) === raw ? n : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug, page: pageRaw } = await params;
    const page = parsePage(pageRaw);
    if (!page) return {};

    const parsed = parseSlug(slug);
    const fetchParams = resolveFetchParams(parsed);
    const { services, total } = await fetchServices(fetchParams, (page - 1) * PAGE_SIZE);

    const url = `${BASE_URL}/${slug}/${page}`;
    const noindex = total >= 2
        ? { robots: { index: true, follow: true } }
        : { robots: { index: false, follow: true } };

    const h1 = buildH1(parsed);
    const count = services.length;
    const title = `Strona ${page}: ${h1}`;
    const description = `Strona ${page} — ${count} ofert: ${h1.toLowerCase()}. Sprawdzone opinie, przejrzyste ceny na MyLokalni.pl.`;

    return {
        title,
        description,
        ...noindex,
        alternates: { canonical: url },
        openGraph: { title, description, url, siteName: 'MyLokalni.pl', locale: 'pl_PL', type: 'website' },
        twitter: { card: 'summary', title, description },
    };
}

export default async function SlugPageN({ params }: Props) {
    const { slug, page: pageRaw } = await params;
    const page = parsePage(pageRaw);
    if (!page) notFound();

    const parsed = parseSlug(slug);
    const fetchParams = resolveFetchParams(parsed);
    const offset = (page - 1) * PAGE_SIZE;
    const { services, total } = await fetchServices(fetchParams, offset);

    if (services.length === 0) notFound();

    const h1 = buildH1(parsed);
    const hasMore = services.length === PAGE_SIZE;
    const baseUrl = `${BASE_URL}/${slug}`;
    const prevUrl = page === 2 ? baseUrl : `${baseUrl}/${page - 1}`;

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Strona główna', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: h1, item: `${BASE_URL}/${slug}` },
            { '@type': 'ListItem', position: 3, name: `Strona ${page}`, item: `${BASE_URL}/${slug}/${page}` },
        ],
    };

    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: `${h1} — strona ${page}`,
        numberOfItems: services.length,
        itemListElement: services.slice(0, 10).map((s, i) => {
            const svcSlug = s.publicId && s.title ? createServiceUrl(s.title, s.publicId) : null;
            return { '@type': 'ListItem', position: offset + i + 1, name: s.title, url: svcSlug ? `${BASE_URL}/service/${svcSlug}` : undefined };
        }).filter(item => item.url),
    };

    return (
        <>
            <link rel="prev" href={prevUrl} />
            {hasMore && <link rel="next" href={`${baseUrl}/${page + 1}`} />}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
            <SlugPageClient
                services={services}
                h1={`${h1} — strona ${page}`}
                slug={slug}
                hasMore={hasMore}
                totalCount={total}
            />
        </>
    );
}
