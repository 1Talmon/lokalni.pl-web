export const runtime = 'edge';

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BASE_URL, API_URL } from '@/lib/seo-data';
import { buildProfileJsonLd } from '@/lib/jsonLd';
import PublicProfileClient from '@/app/profile/[uid]/PublicProfileClient';

interface Props { params: Promise<{ uid: string }> }

async function fetchProfileMeta(uid: string) {
    try {
        const res = await fetch(`${API_URL}/users/${uid}/profile`, {
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

function buildProfileName(p: Record<string, unknown>): string {
    return [p.imie, p.nazwisko].filter(Boolean).join(' ') || (p.name as string) || 'Specjalista';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { uid } = await params;
    const profile = await fetchProfileMeta(uid);
    if (!profile || profile.deleted) notFound();

    const name = buildProfileName(profile);
    const title = `${name} – specjalista | MyLokalni.pl`;
    const bio = typeof profile.bio === 'string' && profile.bio
        ? `${profile.bio.slice(0, 155).trimEnd()}…`
        : `Sprawdź profil ${name} na MyLokalni.pl – opinie klientów, dostępne usługi i możliwość bezpośredniego kontaktu.`;
    const url = `${BASE_URL}/profile/${uid}`;
    const image = (profile.profilowe || profile.avatar) as string | undefined;

    return {
        title,
        description: bio,
        alternates: { canonical: url },
        openGraph: {
            title: `${name} – specjalista`,
            description: bio,
            url,
            type: 'profile',
            ...(image ? { images: [{ url: image }] } : {}),
        },
        twitter: {
            card: 'summary',
            title: `${name} – specjalista`,
            description: bio,
            ...(image ? { images: [image] } : {}),
        },
    };
}

export default async function ProfilePage({ params }: Props) {
    const { uid } = await params;
    const profile = await fetchProfileMeta(uid);
    if (!profile || profile.deleted) notFound();

    const jsonLd = buildProfileJsonLd(profile, uid);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <PublicProfileClient />
        </>
    );
}
