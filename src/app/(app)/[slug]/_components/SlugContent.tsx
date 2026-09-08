'use client';
import { useEffect } from 'react';
import { CATEGORIES_DATA } from '@/data/categories';
import HomeView from '@/views/HomeView';
import { useApp } from '@/providers/AppProvider';

export function SlugContent() {
    const { state, actions } = useApp();

    // Hide SSR shell once HomeView has finished loading services
    useEffect(() => {
        if (state.servicesLoading) return;
        const shell = document.querySelector('[data-slug-shell]');
        if (shell instanceof HTMLElement) shell.style.display = 'none';
    }, [state.servicesLoading]);

    return (
        <HomeView
            {...state.homeProps}
            {...actions.homeActions}
            categories={CATEGORIES_DATA}
            onServiceClick={actions.onServiceClick}
            onStartChat={actions.startChat}
        />
    );
}
