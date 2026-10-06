export const runtime = 'edge';

import { fetchLandingGroups, fetchLatestServices, fetchPosts } from '@/lib/landings';
import { HomeStaticShell } from './_components/HomeStaticShell';

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
