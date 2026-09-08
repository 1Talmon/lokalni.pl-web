export const runtime = 'edge';

import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BASE_URL, API_URL, DEFAULT_OG_IMAGE } from '@/lib/seo-data';
import { buildProfileJsonLd } from '@/lib/jsonLd';
import { PublicProfileStaticShell } from '@/app/profile/[uid]/PublicProfileStaticShell';
import PublicProfileContent from './PublicProfileContent';

interface Props { params: Promise<{ uid: string }> }

const fetchProfileMeta = cache(async function fetchProfileMeta(uid: string) {
    try {
        const res = await fetch(`${API_URL}/users/${uid}/profile`, {
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

function buildProfileName(p: Record<string, unknown>): string {
    return [p.imie, p.nazwisko].filter(Boolean).join(' ') || (p.name as string) || 'Specjalista';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { uid } = await params;
    const profile = await fetchProfileMeta(uid);
    if (!profile || profile.deleted) notFound();

    const name = buildProfileName(profile);
    const title = name;
    const bio = typeof profile.bio === 'string' && profile.bio
        ? `${profile.bio.slice(0, 155).trimEnd()}…`
        : `Sprawdź profil ${name} na MyLokalni.pl – opinie klientów, dostępne usługi i możliwość bezpośredniego kontaktu.`;
    const url = `${BASE_URL}/profile/${uid}`;
    const image = ((profile.ogAvatar || profile.profilowe || profile.avatar) as string | undefined) ?? DEFAULT_OG_IMAGE;

    return {
        title,
        description: bio,
        alternates: { canonical: url },
        openGraph: {
            title: `${name}`,
            description: bio,
            url,
            type: 'profile',
            ...(image ? { images: [{ url: image, width: 800, height: 800 }] } : {}),
        },
        twitter: {
            card: 'summary',
            title: `${name}`,
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

    // Cover is full-width (h-44) — primary LCP candidate; avatar is fallback
    const heroImage = ((profile.zdjecieTla || profile.profilowe || profile.avatar) as string | null) || null;

    return (
        <>
            {heroImage && (
                <link
                    rel="preload"
                    as="image"
                    href={heroImage}
                    {...{ fetchPriority: 'high' }}
                />
            )}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            {/* SSR visible shell — LCP candidate for real users + Googlebot indexable HTML.
                Hidden by PublicProfileClient once interactive version renders. */}
            <PublicProfileStaticShell data={profile as Parameters<typeof PublicProfileStaticShell>[0]['data']} />
            <PublicProfileContent />
        </>
    );
}
