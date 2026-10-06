export const runtime = 'edge';

import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { createServiceUrl } from '@/utils/helpers';
import { BASE_URL, API_URL, DEFAULT_OG_IMAGE } from '@/lib/seo-data';
import { buildServiceJsonLd } from '@/lib/jsonLd';
import { ServiceStaticShell } from '@/app/service/[slug]/ServiceStaticShell';
import ServiceDetailsContent from './ServiceDetailsContent';
import { safeJsonLd } from '@/lib/safeJsonLd';
import { serviceDescription, serviceTitle } from '@/lib/seoText';

interface Props { params: Promise<{ slug: string }> }

const fetchServiceMeta = cache(async function fetchServiceMeta(publicId: string) {
    try {
        const res = await fetch(`${API_URL}/services/${publicId}`, {
            headers: { 'User-Agent': 'Lokalni-MetaBot/1.0' },
            next: { revalidate: 3600 },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return (json.data ?? json) as Record<string, unknown>;
    } catch {
        return null;
    }
});

/** Canonical slug = slugified title + publicId (same algorithm as API sitemap). */
function canonicalSlug(service: Record<string, unknown>, fallback: string): string {
    if (typeof service.slug === 'string' && service.slug) return service.slug;
    const title = typeof service.title === 'string' ? service.title : '';
    const publicId = typeof service.publicId === 'string' ? service.publicId : '';
    return title && publicId ? createServiceUrl(title, publicId) : fallback;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const publicId = slug.split('-').pop() ?? '';
    const service = await fetchServiceMeta(publicId);
    if (!service) notFound();
    const canonical = canonicalSlug(service, slug);
    if (canonical !== slug) permanentRedirect(`/service/${canonical}`);

    const title = serviceTitle(service);
    const description = serviceDescription(service);
    const url = `${BASE_URL}/service/${canonical}`;
    // Preferuj ogImage (JPEG) nad image (WebP) — Facebook OG scraper wymaga JPEG/PNG
    const image = ((service.ogImage || service.image || (Array.isArray(service.images) ? service.images[0] : undefined)) as string | undefined) ?? DEFAULT_OG_IMAGE;

    return {
        title,
        description,
        // Hidden / pending / rejected services stay reachable for the owner but are never indexed
        ...(service.isPublic === false ? { robots: { index: false, follow: true } } : {}),
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'website',
            ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            ...(image ? { images: [image] } : {}),
        },
    };
}

export default async function ServicePage({ params }: Props) {
    const { slug } = await params;
    const publicId = slug.split('-').pop() ?? '';
    const service = await fetchServiceMeta(publicId);
    if (!service) notFound();
    const canonical = canonicalSlug(service, slug);
    if (canonical !== slug) permanentRedirect(`/service/${canonical}`);
    const jsonLdSchemas = buildServiceJsonLd(service, canonical);

    // Hero image for LCP preload — sent in <head> before any body content
    const heroImage = (service.ogImage || service.image ||
        (Array.isArray(service.images) ? service.images[0] : null)) as string | null;

    return (
        <>
            {/* Preload hero — browser fetches before parser reaches <img> in body */}
            {heroImage && (
                <link
                    rel="preload"
                    as="image"
                    href={heroImage}
                    {...{ fetchPriority: 'high' }}
                />
            )}
            {jsonLdSchemas.map((schema, i) => (
                <script
                    key={i}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
                />
            ))}
            {/* SSR visible content — LCP candidate for real users + Googlebot indexable HTML.
                Hidden by ServiceDetailsClient once interactive version renders. */}
            <ServiceStaticShell data={service as Parameters<typeof ServiceStaticShell>[0]['data']} />
            {/* Client component — takes over when JS is ready */}
            <ServiceDetailsContent />
        </>
    );
}
