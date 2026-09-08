'use client';
import { useEffect, useRef } from 'react';
import { CATEGORIES_DATA } from '@/data/categories';
import HomeView from '@/views/HomeView';
import { useApp } from '@/providers/AppProvider';

export function SlugContent() {
    const { state, actions } = useApp();
    const didScroll = useRef(false);

    useEffect(() => {
        if (state.servicesLoading || state.isLoadingApp || didScroll.current) return;
        didScroll.current = true;

        // Same behaviour as clicking Szukaj in-app: scroll past the SSR shell to results.
        // Shell scrolls above the viewport naturally — no layout flash.
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });

        // After scroll animation ends, remove shell from layout (it's already off-screen).
        // Browser overflow-anchor:auto keeps viewport position stable during removal.
        const t = setTimeout(() => {
            document.querySelectorAll('[data-slug-shell]').forEach(el => {
                if (el instanceof HTMLElement) el.style.display = 'none';
            });
        }, 700);
        return () => clearTimeout(t);
    }, [state.servicesLoading, state.isLoadingApp]);

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
