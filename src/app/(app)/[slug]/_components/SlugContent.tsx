'use client';
import { useLayoutEffect } from 'react';
import { CATEGORIES_DATA } from '@/data/categories';
import HomeView from '@/views/HomeView';
import { useApp } from '@/providers/AppProvider';

export function SlugContent() {
    const { state, actions } = useApp();

    // Hide all SSR shells synchronously before paint once HomeView has loaded services
    useLayoutEffect(() => {
        if (state.servicesLoading) return;
        document.querySelectorAll('[data-slug-shell]').forEach(el => {
            if (el instanceof HTMLElement) el.style.display = 'none';
        });
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
