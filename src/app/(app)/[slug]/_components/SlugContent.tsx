'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { CATEGORIES_DATA } from '@/data/categories';
import HomeView from '@/views/HomeView';
import { useApp } from '@/providers/AppProvider';

export function SlugContent() {
    const { state, actions } = useApp();
    const didScroll = useRef(false);

    // Hide SSR shell before first paint — Googlebot already has it in HTML, user shouldn't see it above HomeView
    useLayoutEffect(() => {
        document.querySelectorAll('[data-slug-shell]').forEach(el => {
            if (el instanceof HTMLElement) el.style.display = 'none';
        });
    }, []);

    // Once app + services ready, scroll to results — same feel as clicking Szukaj in-app
    useEffect(() => {
        if (state.servicesLoading || state.isLoadingApp || didScroll.current) return;
        didScroll.current = true;
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
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
