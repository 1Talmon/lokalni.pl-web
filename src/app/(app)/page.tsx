export const runtime = 'edge';

import type { Metadata } from 'next';
import { fetchLandingGroups, fetchLatestServices, fetchPosts, categoryLabel } from '@/lib/landings';
import { homeDescription } from '@/lib/seoText';
import { HomeStaticShell } from './_components/HomeStaticShell';

export async function generateMetadata(): Promise<Metadata> {
    const groups = await fetchLandingGroups().catch(() => []);
    const description = homeDescription(
        groups.filter(g => g.type === 'category').map(g => categoryLabel(g.categorySlug) ?? ''),
        groups.filter(g => g.type === 'city' && g.city).map(g => g.city!),
    );
    const title = 'MyLokalni.pl – znajdź specjalistę w swoim mieście';
    // openGraph/twitter replace the layout's objects as a whole — repeat every field, not just description
    return {
        description,
        openGraph: {
            type: 'website', locale: 'pl_PL', siteName: 'MyLokalni.pl', url: '/', title, description,
            images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'MyLokalni.pl – strona główna' }],
        },
        twitter: { card: 'summary_large_image', title, description, images: ['/og-image.png'] },
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
