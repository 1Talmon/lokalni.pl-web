'use client';
import { QueryProvider } from '../../../providers/QueryProvider';
import { AppProvider } from '../../../providers/AppProvider';
import ServiceDetailsClient from './ServiceDetailsClient';

export default function ServiceDetailsWrapper() {
    return (
        <QueryProvider>
            <AppProvider>
                <ServiceDetailsClient />
            </AppProvider>
        </QueryProvider>
    );
}
