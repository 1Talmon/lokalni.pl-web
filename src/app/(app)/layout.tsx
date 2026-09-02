'use client';
import { type ReactNode } from 'react';
import { QueryProvider } from '../../providers/QueryProvider';
import { AppProvider } from '../../providers/AppProvider';
import { AppShell } from '../../components/AppShell';

export default function AppLayout({ children }: { children: ReactNode }) {
    return (
        <QueryProvider>
            <AppProvider>
                <AppShell>{children}</AppShell>
            </AppProvider>
        </QueryProvider>
    );
}
