export const runtime = 'edge';

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BASE_URL, API_URL, DEFAULT_OG_IMAGE } from '@/lib/seo-data';
import { buildProfileJsonLd } from '@/lib/jsonLd';
import { PublicProfileStaticShell } from '@/app/profile/[uid]/PublicProfileStaticShell';
import { safeJsonLd } from '@/lib/safeJsonLd';
import { fetchProviderServices } from '@/lib/landings';
import { profileDescription } from '@/lib/seoText';

interface Props { params: Promise<{ uid: string }> }

async function fetchProfileMeta(uid: string) {
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
}

function buildProfileName(p: Record<string, unknown>): string {
    return [p.imie, p.nazwisko].filter(Boolean).join(' ') || (p.name as string) || 'Specjalista';
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { uid } = await params;
    const profile = await fetchProfileMeta(uid);
    if (!profile || profile.deleted) notFound();

    const name = buildProfileName(profile);
    const title = name;
    const services = await fetchProviderServices(uid).catch(() => []);
    const bio = profileDescription(name, profile, services.map(s => ({ title: s.title, city: s.city })));
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
            siteName: 'MyLokalni.pl',
            locale: 'pl_PL',
            ...(image ? { images: [{ url: image, width: 1200, height: 630 }] } : {}),
        },
        twitter: {
            card: 'summary_large_image',
            title: `${name}`,
            description: bio,
            ...(image ? { images: [image] } : {}),
        },
    };
}

export default async function OgProfilePage({ params }: Props) {
    const { uid } = await params;
    const profile = await fetchProfileMeta(uid);
    if (!profile || profile.deleted) notFound();
    const jsonLd = buildProfileJsonLd(profile, uid);

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }}
            />
            <PublicProfileStaticShell data={profile as Parameters<typeof PublicProfileStaticShell>[0]['data']} />
        </>
    );
}
