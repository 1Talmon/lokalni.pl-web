import type { Metadata } from 'next';
import PublicProfileWrapper from './PublicProfileWrapper';
import { API_URL, BASE_URL } from '@/lib/seo-data';

interface Props {
    params: Promise<{ uid: string }>;
}

async function fetchProfile(uid: string) {
    try {
        const res = await fetch(`${API_URL}/users/${uid}/profile`, {
            headers: { 'User-Agent': 'Lokalni-MetaBot/1.0' },
            next: { revalidate: 3600 },
        });
        if (!res.ok) return null;
        const json = await res.json();
        return json.data ?? json;
    } catch {
        return null;
    }
}

function normalizeMediaUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, 'https://api.mylokalni.pl');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { uid } = await params;
    const d = await fetchProfile(uid);

    if (!d) {
        return {
            title: 'Profil specjalisty | MyLokalni.pl',
            description: 'Znajdź lokalnych specjalistów na MyLokalni.pl.',
        };
    }

    const name = [d.imie, d.nazwisko].filter(Boolean).join(' ');
    const title = name ? `${name} – specjalista | MyLokalni.pl` : 'Profil specjalisty | MyLokalni.pl';
    const description = d.bio
        ? String(d.bio).slice(0, 160)
        : `Sprawdź profil ${name || 'specjalisty'} na MyLokalni.pl – opinie, usługi, kontakt.`;
    const image = normalizeMediaUrl(d.profilowe || d.zdjecieTla) ?? `${BASE_URL}/og-image.png`;
    const url = `${BASE_URL}/profile/${uid}`;

    return {
        title,
        description,
        alternates: { canonical: url },
        openGraph: {
            title,
            description,
            url,
            type: 'profile',
            images: [{ url: image }],
            siteName: 'MyLokalni.pl',
            locale: 'pl_PL',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [image],
        },
    };
}

export default async function ProfilePage({ params }: Props) {
    const { uid } = await params;
    const d = await fetchProfile(uid);

    let jsonLd: object | null = null;

    if (d) {
        const name = [d.imie, d.nazwisko].filter(Boolean).join(' ');
        const image = normalizeMediaUrl(d.profilowe || d.zdjecieTla) ?? `${BASE_URL}/og-image.png`;
        const avgRating = parseFloat(d.avgRating) || 0;
        const reviewsCount = parseInt(d.reviewsCount) || 0;

        jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'LocalBusiness',
            name: name ? `${name} – specjalista` : 'Specjalista MyLokalni',
            url: `${BASE_URL}/profile/${uid}`,
            image,
            description: d.bio ? String(d.bio).slice(0, 300) : undefined,
            ...(d.city ? { address: { '@type': 'PostalAddress', addressLocality: d.city, addressCountry: 'PL' } } : {}),
            ...(avgRating > 0 && reviewsCount > 0 ? {
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: avgRating.toFixed(1),
                    reviewCount: reviewsCount,
                    bestRating: '5',
                    worstRating: '1',
                },
            } : {}),
        };
    }

    return (
        <>
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <PublicProfileWrapper />
        </>
    );
}
