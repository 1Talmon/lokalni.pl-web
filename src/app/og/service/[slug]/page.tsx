export const runtime = 'edge';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BASE_URL, API_URL, DEFAULT_OG_IMAGE } from '@/lib/seo-data';
import { buildServiceJsonLd } from '@/lib/jsonLd';
import { ServiceStaticShell } from '@/app/service/[slug]/ServiceStaticShell';
import { safeJsonLd } from '@/lib/safeJsonLd';
import { serviceDescription, serviceTitle } from '@/lib/seoText';

interface Props { params: Promise<{ slug: string }> }

async function fetchServiceMeta(publicId: string) {
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
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const publicId = slug.split('-').pop() ?? '';
    const service = await fetchServiceMeta(publicId);
    if (!service) notFound();

    const title = serviceTitle(service);
    const description = serviceDescription(service);
    const url = `${BASE_URL}/service/${slug}`;
    const image = ((service.ogImage || service.image || (Array.isArray(service.images) ? service.images[0] : undefined)) as string | undefined) ?? DEFAULT_OG_IMAGE;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'website',
            siteName: 'MyLokalni.pl',
            locale: 'pl_PL',
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

export default async function OgServicePage({ params }: Props) {
    const { slug } = await params;
    const publicId = slug.split('-').pop() ?? '';
    const service = await fetchServiceMeta(publicId);
    if (!service) notFound();
    const jsonLd = buildServiceJsonLd(service, slug);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
            />
            <ServiceStaticShell data={service as Parameters<typeof ServiceStaticShell>[0]['data']} />
        </>
    );
}
