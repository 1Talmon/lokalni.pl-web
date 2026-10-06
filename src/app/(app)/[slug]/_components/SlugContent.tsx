'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { CATEGORIES_DATA } from '@/data/categories';
import HomeView from '@/views/HomeView';
import { useApp } from '@/providers/AppProvider';

interface Props {
    /** DB category key of the landing group (null = all categories) */
    categoryId: string | null;
    /** Real city name of the landing group (null = everywhere) */
    city: string | null;
}

export function SlugContent({ categoryId, city }: Props) {
    const { state, actions } = useApp();
    const didScroll = useRef(false);

    // Once the app is ready: set HomeView filters to exactly this group, then hide the SSR shell
    // (Googlebot already has it in HTML). Before paint, so there's no flash of unfiltered results.
    useLayoutEffect(() => {
        if (state.isLoadingApp) return;
        actions.homeActions.setSearchQuery('');
        actions.homeActions.setSearchDisplay('');
        actions.homeActions.setActiveCategory(categoryId ?? 'all');
        actions.homeActions.setLocation(city ?? '');
        document.querySelectorAll('[data-slug-shell]').forEach(el => {
            if (el instanceof HTMLElement) el.style.display = 'none';
        });
    }, [state.isLoadingApp, categoryId, city]); // eslint-disable-line react-hooks/exhaustive-deps

    // Scroll as soon as app is ready — identical to clicking Szukaj (doesn't wait for services)
    useEffect(() => {
        if (state.isLoadingApp || didScroll.current) return;
        didScroll.current = true;
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, [state.isLoadingApp]);

    // During SSR/loading only the static shell is rendered — HomeView without data would show
    // "Ładowanie…" / "Brak wyników" next to the real offers in the HTML.
    if (state.isLoadingApp) return null;

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
