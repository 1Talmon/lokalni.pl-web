'use client';
import { type ReactNode, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { QueryProvider } from '../../providers/QueryProvider';
import { AppContext, AppProvider, SSR_APP_CONTEXT } from '../../providers/AppProvider';
import { AppShell, PRIVATE_ROUTE_RE } from '../../components/AppShell';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

const subscribe = () => () => {};

export default function AppLayout({ children }: { children: ReactNode }) {
    // false on the server and during hydration, true once mounted in the browser
    const mounted = useSyncExternalStore(subscribe, () => true, () => false);
    const pathname = usePathname();

    // Server render: only the page's static shell (real content for crawlers). The full app
    // (useAppLogic + AppShell) mounts client-side — rendering it on the edge exceeded the Worker CPU limit.
    if (!mounted) {
        return (
            <QueryProvider>
                <AppContext.Provider value={SSR_APP_CONTEXT}>
                    <div className="min-h-screen bg-gray-50 font-sans antialiased">
                        <LoadingScreen isVisible />
                        {!PRIVATE_ROUTE_RE.test(pathname) && children}
                    </div>
                </AppContext.Provider>
            </QueryProvider>
        );
    }

    return (
        <QueryProvider>
            <AppProvider>
                <AppShell>{children}</AppShell>
            </AppProvider>
        </QueryProvider>
    );
}
