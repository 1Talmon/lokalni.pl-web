'use client';
import { useLayoutEffect, useRef } from 'react';
import { CATEGORIES_DATA } from '@/data/categories';
import HomeView from '@/views/HomeView';
import { useApp } from '@/providers/AppProvider';

export function SlugContent() {
    const { state, actions } = useApp();
    const isFreshLoad = useRef(state.isLoadingApp);

    // On in-app navigation (app already initialized), hide SSR shell immediately
    // before first paint so there's no flash of static cards then HomeView.
    // On fresh page load (isLoadingApp=true at mount), leave shell visible until services load.
    useLayoutEffect(() => {
        if (isFreshLoad.current) return;
        document.querySelectorAll('[data-slug-shell]').forEach(el => {
            if (el instanceof HTMLElement) el.style.display = 'none';
        });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Fresh load path: hide shell once services are ready
    useLayoutEffect(() => {
        if (state.servicesLoading) return;
        document.querySelectorAll('[data-slug-shell]').forEach(el => {
            if (el instanceof HTMLElement) el.style.display = 'none';
        });
    }, [state.servicesLoading]);

    // After in-app navigation, scroll results into view once services load
    const didScroll = useRef(false);
    useLayoutEffect(() => {
        if (isFreshLoad.current || state.servicesLoading || didScroll.current) return;
        didScroll.current = true;
        requestAnimationFrame(() => {
            document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
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
