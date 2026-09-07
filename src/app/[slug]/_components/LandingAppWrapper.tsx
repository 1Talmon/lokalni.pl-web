'use client';
import { QueryProvider } from '@/providers/QueryProvider';
import { AppProvider } from '@/providers/AppProvider';
import { LandingView } from './LandingView';

interface Props {
    initialServices: Record<string, unknown>[];
    keyword: string | null;
    city: string | null;
    slug: string;
    page?: number;
    prevUrl?: string | null;
    nextUrl?: string | null;
}

export function LandingAppWrapper({ initialServices, keyword, city, slug, page, prevUrl, nextUrl }: Props) {
    return (
        <QueryProvider>
            <AppProvider>
                <LandingView
                    initialServices={initialServices}
                    keyword={keyword}
                    city={city}
                    slug={slug}
                    page={page}
                    prevUrl={prevUrl}
                    nextUrl={nextUrl}
                />
            </AppProvider>
        </QueryProvider>
    );
}
