'use client';
import { QueryProvider } from '../../../providers/QueryProvider';
import { AppProvider } from '../../../providers/AppProvider';
import PublicProfileClient from './PublicProfileClient';

export default function PublicProfileWrapper() {
    return (
        <QueryProvider>
            <AppProvider>
                <PublicProfileClient />
            </AppProvider>
        </QueryProvider>
    );
}
