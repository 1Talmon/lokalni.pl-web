'use client';
import { QueryProvider } from '@/providers/QueryProvider';
import { AppProvider } from '@/providers/AppProvider';
import { LandingView } from './LandingView';

interface Props {
    initialServices: Record<string, unknown>[];
    keyword: string | null;
    city: string | null;
    slug: string;
}

export function LandingAppWrapper({ initialServices, keyword, city, slug }: Props) {
    return (
        <QueryProvider>
            <AppProvider>
                <LandingView
                    initialServices={initialServices}
                    keyword={keyword}
                    city={city}
                    slug={slug}
                />
            </AppProvider>
        </QueryProvider>
    );
}
