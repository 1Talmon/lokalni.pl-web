export const runtime = 'edge';

import type { Metadata } from 'next';
import { fetchLandingGroups, fetchLatestServices, fetchPosts } from '@/lib/landings';
import { HomeStaticShell } from './_components/HomeStaticShell';

export async function generateMetadata(): Promise<Metadata> {
    // fixed copy — a list built from live categories/cities read oddly and skipped towns without a known locative
    const description = 'Lokalne usługi od młodych z Twojej okolicy. Zarabiaj na tym, co umiesz, albo znajdź kogoś tuż obok – oferty z cenami, opinie, czat i rezerwacja online.';
    const title = 'MyLokalni.pl – lokalne usługi od młodych z Twojej okolicy';
    // openGraph/twitter replace the layout's objects as a whole — repeat every field, not just description
    return {
        description,
        openGraph: {
            type: 'website', locale: 'pl_PL', siteName: 'MyLokalni.pl', url: '/', title, description,
            images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'MyLokalni.pl – strona główna' }],
        },
        twitter: { card: 'summary_large_image', title, description, images: ['/og-default.png'] },
    };
}

// Tab route — the interactive home is rendered by the AppShell tab strip once the app loads.
// This page only provides the server-rendered shell with real data (SSR HTML for crawlers).
export default async function HomePage() {
    const [latest, groups, posts] = await Promise.all([
        fetchLatestServices(12).catch(() => ({ services: [], total: 0 })),
        fetchLandingGroups().catch(() => []),
        fetchPosts(1, 3).catch(() => ({ posts: [], total: 0, pages: 0 })),
    ]);
    return (
        <HomeStaticShell
            services={latest.services}
            totalServices={latest.total}
            groups={groups}
            posts={posts.posts}
        />
    );
}
