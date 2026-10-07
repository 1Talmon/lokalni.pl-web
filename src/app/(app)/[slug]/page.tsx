export const runtime = 'edge';

import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { BASE_URL, DEFAULT_OG_IMAGE, legacyLandingRedirect } from '@/lib/seo-data';
import { createServiceUrl } from '@/utils/helpers';
import {
    fetchLanding, servicesOgImage, fetchLandingGroups, landingH1, offersLabel, categoryLabel, categoryIdForSlug,
    type LandingData, type LandingGroup,
} from '@/lib/landings';
import { SlugContent } from './_components/SlugContent';
import { SlugStaticShell } from './_components/SlugStaticShell';
import { safeJsonLd } from '@/lib/safeJsonLd';

// Landing pages = real groups of public services from the API (/public/landings):
// category (/auto), city (/gdansk), category+city (/auto-gdansk). A slug that isn't a group with
// ≥1 public offer is a real 404 — no free-text catch-all, no templated cities.

interface Props {
    params: Promise<{ slug: string }>;
}

function description(data: LandingData): string {
    const { group, services, total } = data;
    const titles = [...new Set(services.map(s => s.title))].slice(0, 3).join(', ');
    const prices = services.map(s => parseFloat(s.price)).filter(p => p > 0);
    const from = prices.length > 0 ? ` Ceny od ${Math.min(...prices)} zł.` : '';
    return `${landingH1(group)}: ${offersLabel(total)} – ${titles}.${from} Porównaj opinie i zarezerwuj termin na MyLokalni.pl.`;
}

/** Breadcrumb parents + related groups, all from the real group list. */
function relations(group: LandingGroup, all: LandingGroup[]) {
    const bySlug = new Map(all.map(g => [g.slug, g]));
    const parents: LandingGroup[] = [];
    let related: LandingGroup[] = [];
    if (group.type === 'category-city') {
        const cat = group.categorySlug ? bySlug.get(group.categorySlug) : undefined;
        const city = group.citySlug ? bySlug.get(group.citySlug) : undefined;
        if (cat) parents.push(cat);
        related = [
            ...(city ? [city] : []),
            ...all.filter(g => g.type === 'category-city' && g.slug !== group.slug &&
                (g.categorySlug === group.categorySlug || g.citySlug === group.citySlug)),
        ];
    } else if (group.type === 'category') {
        related = all.filter(g => g.type === 'category-city' && g.categorySlug === group.categorySlug);
    } else {
        related = all.filter(g => g.type === 'category-city' && g.citySlug === group.citySlug);
    }
    return { parents, related: related.slice(0, 30) };
}

/** Retired category slug (pre-2026-10, e.g. /edukacja-gdynia) → 308 to its successor, else 404. */
function notFoundOrLegacy(slug: string): never {
    const target = legacyLandingRedirect(slug);
    if (target) permanentRedirect(`/${target}`);
    notFound();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const data = await fetchLanding(slug);
    if (!data) notFoundOrLegacy(slug);

    const url = `${BASE_URL}/${slug}`;
    const title = `${landingH1(data.group)} – ${offersLabel(data.total)}`;
    const desc = description(data);
    const image = servicesOgImage(data.services) || DEFAULT_OG_IMAGE;

    return {
        title,
        description: desc,
        robots: { index: true, follow: true },
        alternates: { canonical: url },
        openGraph: { title, description: desc, url, siteName: 'MyLokalni.pl', locale: 'pl_PL', type: 'website', images: [{ url: image }] },
        twitter: { card: 'summary_large_image', title, description: desc, images: [image] },
    };
}

export default async function SlugPage({ params }: Props) {
    const { slug } = await params;
    const [data, all] = await Promise.all([fetchLanding(slug), fetchLandingGroups()]);
    if (!data) notFoundOrLegacy(slug);

    const { group, services } = data;
    const h1 = landingH1(group);
    const { parents, related } = relations(group, all);

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Strona główna', item: BASE_URL },
            ...parents.map((p, i) => ({
                '@type': 'ListItem', position: i + 2,
                name: p.type === 'category' ? categoryLabel(p.categorySlug) : p.city,
                item: `${BASE_URL}/${p.slug}`,
            })),
            { '@type': 'ListItem', position: parents.length + 2, name: h1, item: `${BASE_URL}/${slug}` },
        ],
    };

    const itemListJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: h1,
        numberOfItems: data.total,
        itemListElement: services.slice(0, 24)
            .filter(s => s.publicId && s.title)
            .map((s, i) => ({ '@type': 'ListItem', position: i + 1, name: s.title, url: `${BASE_URL}/service/${createServiceUrl(s.title, s.publicId!)}` })),
    };

    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(itemListJsonLd) }} />
            {/* SSR shell — real HTML for crawlers and first paint; hidden once HomeView takes over */}
            <SlugStaticShell data={data} related={related} parents={parents} />
            <SlugContent categoryId={categoryIdForSlug(group.categorySlug)} city={group.city} />
        </>
    );
}
