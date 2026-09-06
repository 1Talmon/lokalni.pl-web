export const runtime = 'edge';

import type { Metadata } from 'next';
import { BASE_URL, API_URL, DEFAULT_OG_IMAGE } from '@/lib/seo-data';
import { buildServiceJsonLd } from '@/lib/jsonLd';
import ServiceDetailsContent from './ServiceDetailsContent';

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

function buildDescription(service: Record<string, unknown>): string {
    const city = typeof service.city === 'string' && service.city ? ` w ${service.city}` : '';
    const raw = typeof service.description === 'string' ? service.description : '';
    if (raw.length > 15) return `${raw.slice(0, 155).trimEnd()}…`;
    return `${service.title}${city} – sprawdź opinie i zarezerwuj usługę online na MyLokalni.pl.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const publicId = slug.split('-').pop() ?? '';
    const service = await fetchServiceMeta(publicId);
    if (!service) return { title: 'Ogłoszenie | MyLokalni.pl' };

    const city = typeof service.city === 'string' && service.city ? ` w ${service.city}` : '';
    const title = `${service.title}${city} | MyLokalni.pl`;
    const description = buildDescription(service);
    const url = `${BASE_URL}/service/${slug}`;
    // Preferuj ogImage (JPEG) nad image (WebP) — Facebook OG scraper wymaga JPEG/PNG
    const image = ((service.ogImage || service.image || (Array.isArray(service.images) ? service.images[0] : undefined)) as string | undefined) ?? DEFAULT_OG_IMAGE;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title: `${service.title}${city}`,
            description,
            url,
            type: 'website',
            ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
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
    const jsonLd = service ? buildServiceJsonLd(service, slug) : null;

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <ServiceDetailsContent />
        </>
    );
}
