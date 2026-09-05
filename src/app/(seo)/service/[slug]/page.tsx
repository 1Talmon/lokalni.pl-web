export const runtime = 'edge';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BASE_URL, API_URL } from '@/lib/seo-data';
import { buildServiceJsonLd } from '@/lib/jsonLd';
import ServiceDetailsClient from '@/app/service/[slug]/ServiceDetailsClient';

interface Props { params: Promise<{ slug: string }> }

async function fetchServiceMeta(publicId: string) {
    try {
        const res = await fetch(`${API_URL}/services/${publicId}`, {
            headers: { 'User-Agent': 'Lokalni-MetaBot/1.0' },
            next: { revalidate: 3600 },
        });
        if (res.status === 404 || res.status === 410) return null;
        if (!res.ok) return null;
        const json = await res.json();
        return (json.data ?? json) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function buildServiceDescription(service: Record<string, unknown>): string {
    const city = typeof service.city === 'string' && service.city ? ` w ${service.city}` : '';
    const raw = typeof service.description === 'string' ? service.description : '';
    if (raw.length > 15) return `${raw.slice(0, 155).trimEnd()}…`;
    return `${service.title}${city} – sprawdź opinie i zarezerwuj usługę online na MyLokalni.pl.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const publicId = slug.split('-').pop() ?? '';
    const service = await fetchServiceMeta(publicId);
    if (!service) notFound();

    const city = typeof service.city === 'string' && service.city ? ` w ${service.city}` : '';
    const title = `${service.title}${city} | MyLokalni.pl`;
    const description = buildServiceDescription(service);
    const url = `${BASE_URL}/service/${slug}`;
    const image = (service.image || (Array.isArray(service.images) ? service.images[0] : undefined)) as string | undefined;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title: `${service.title}${city}`,
            description,
            url,
            type: 'website',
            ...(image ? { images: [{ url: image }] } : {}),
        },
        twitter: {
            card: 'summary_large_image',
            title: `${service.title}${city}`,
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

    const jsonLd = buildServiceJsonLd(service, slug);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <ServiceDetailsClient />
        </>
    );
}
