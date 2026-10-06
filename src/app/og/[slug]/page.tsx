export const runtime = 'edge';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BASE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo-data';
import { createServiceUrl } from '@/utils/helpers';
import { fetchLanding, servicesOgImage, landingH1, offersLabel } from '@/lib/landings';

// Social-bot variant of a landing page (middleware rewrites bots here): og: tags in <head>.

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const data = await fetchLanding(slug);
    if (!data) notFound();

    const url = `${BASE_URL}/${slug}`;
    const title = `${landingH1(data.group)} – ${offersLabel(data.total)}`;
    const description = `${offersLabel(data.total)}: ${[...new Set(data.services.map(s => s.title))].slice(0, 3).join(', ')}. Porównaj opinie i zarezerwuj termin na MyLokalni.pl.`;
    const image = servicesOgImage(data.services) || DEFAULT_OG_IMAGE;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: { title, description, url, siteName: 'MyLokalni.pl', locale: 'pl_PL', type: 'website', images: [{ url: image }] },
        twitter: { card: 'summary_large_image', title, description, images: [image] },
    };
}

export default async function OgSlugPage({ params }: Props) {
    const { slug } = await params;
    const data = await fetchLanding(slug);
    if (!data) notFound();

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>{landingH1(data.group)}</h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                {offersLabel(data.total)} na MyLokalni.pl
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {data.services.slice(0, 5).filter(s => s.publicId).map(s => (
                    <li key={s.publicId} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
                        <a href={`${BASE_URL}/service/${createServiceUrl(s.title, s.publicId!)}`} style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
                            {s.title}
                        </a>
                        {s.city && <span style={{ color: '#9ca3af', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{s.city}</span>}
                    </li>
                ))}
            </ul>
        </div>
    );
}
