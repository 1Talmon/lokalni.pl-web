'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { useAppLogic } from '../hooks/useAppLogic';
import type { AppState, AppActions } from '../types/appTypes';

interface AppContextValue {
    state: AppState;
    actions: AppActions;
}

const AppContext = createContext<AppContextValue | null>(null);

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
