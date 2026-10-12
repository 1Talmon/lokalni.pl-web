'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { useAppLogic } from '../hooks/useAppLogic';
import type { AppState, AppActions } from '../types/appTypes';

interface AppContextValue {
    state: AppState;
    actions: AppActions;
}

export const AppContext = createContext<AppContextValue | null>(null);

// Value for the server render (and the first client render, before mount): the app is "loading", so
// views render nothing and only the page's static SEO shell ends up in the HTML. Keeps useAppLogic —
// the mega-hook — out of the edge render, which pushed the Worker over its CPU limit (503s).
const noop = () => undefined;
export const SSR_APP_CONTEXT: AppContextValue = {
    state: new Proxy({}, { get: (_, key) => (key === 'isLoadingApp' ? true : undefined) }) as AppState,
    actions: new Proxy({}, { get: () => noop }) as AppActions,
};

export function AppProvider({ children }: { children: ReactNode }) {
    const { state, actions } = useAppLogic();
    return (
        <AppContext.Provider value={{ state, actions }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp(): AppContextValue {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useApp must be used within AppProvider');
    return ctx;
}
