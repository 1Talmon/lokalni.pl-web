'use client';
import { Suspense, type ReactNode } from 'react';
import { QueryProvider } from '@/providers/QueryProvider';
import { AppProvider } from '@/providers/AppProvider';

export default function SeoLayout({ children }: { children: ReactNode }) {
    return (
        <Suspense fallback={null}>
            <QueryProvider>
                <AppProvider>
                    {children}
                </AppProvider>
            </QueryProvider>
        </Suspense>
    );
}
