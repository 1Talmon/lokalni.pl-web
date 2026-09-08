export const runtime = 'edge';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BASE_URL, parseSlug } from '@/lib/seo-data';
import { fetchServices, resolveFetchParams, buildH1 } from '@/lib/slug-services';

interface Props { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const parsed = parseSlug(slug);
    const fetchParams = resolveFetchParams(parsed);
    const { services, total } = await fetchServices(fetchParams);

    const h1 = buildH1(parsed);
    const url = `${BASE_URL}/${slug}`;
    const title = total >= 2
        ? `${total} ofert: ${h1}`
        : h1;
    const description = `Porównaj ${total > 0 ? total : ''} ofert${total === 1 ? 'ę' : ''}: ${h1.toLowerCase()}. Sprawdzone opinie, przejrzyste ceny, szybki kontakt na MyLokalni.pl.`.trim();

    if (services.length === 0) {
        return { title: 'MyLokalni.pl – znajdź specjalistę w swoim mieście' };
    }

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            siteName: 'MyLokalni.pl',
            locale: 'pl_PL',
            type: 'website',
        },
        twitter: { card: 'summary', title, description },
    };
}

export default async function OgSlugPage({ params }: Props) {
    const { slug } = await params;
    const parsed = parseSlug(slug);
    const fetchParams = resolveFetchParams(parsed);
    const { services } = await fetchServices(fetchParams);

    if (services.length === 0) notFound();

    const h1 = buildH1(parsed);

    return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>{h1}</h1>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                {services.length} ofert na MyLokalni.pl
            </p>
            <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {services.slice(0, 5).map(s => (
                    <li key={s.publicId} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
                        <a href={`${BASE_URL}/service/${s.publicId}`} style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
                            {s.title}
                        </a>
                        {s.city && <span style={{ color: '#9ca3af', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{s.city}</span>}
                    </li>
                ))}
            </ul>
        </div>
    );
}
