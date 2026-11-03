'use client';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { CATEGORIES_DATA } from '@/data/categories';
import HomeView from '@/views/HomeView';
import { useApp } from '@/providers/AppProvider';
import { setLandingPending } from '@/utils/landingReady';

interface Props {
    /** DB category key of the landing group (null = all categories) */
    categoryId: string | null;
    /** Real city name of the landing group (null = everywhere) */
    city: string | null;
}

/** Longest the loader is held for this page's offers; after that the page shows what it has. */
const MAX_HOLD_MS = 3500;

export function SlugContent({ categoryId, city }: Props) {
    const { state, actions } = useApp();
    const fetching = useIsFetching({ queryKey: ['services'] });
    const fetchingRef = useRef(fetching);
    fetchingRef.current = fetching;
    const held = useRef(false); // this mount holds the loader (hard page load)
    const done = useRef(false);

    // Hard page load (the app is still starting): keep the loader up until this landing's offers are in place
    // and the page is scrolled to them, so the loader fades onto the finished page — not hero → jump → blank
    // gap → cards popping in. In-app navigation (app already loaded) keeps the earlier behaviour.
    useLayoutEffect(() => {
        if (state.isLoadingApp) { held.current = true; setLandingPending(true); }
        return () => { if (held.current) setLandingPending(false); };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Scroll to the offers (instantly while the loader still covers the page; smoothly after in-app navigation),
    // then let the loader go.
    const finish = useCallback(() => {
        if (done.current) return;
        done.current = true;
        document.getElementById('results-section')?.scrollIntoView({ behavior: held.current ? 'auto' : 'smooth' });
        if (held.current) setLandingPending(false);
    }, []);

    // homeProps does not exist yet during SSR / app start (isLoadingApp is true there) — never read it before
    const hp = state.isLoadingApp ? null : state.homeProps;
    const filtersApplied = hp !== null && hp.activeCategory === (categoryId ?? 'all') && hp.location === (city ?? '');

    // Safety net: never keep the loader longer than MAX_HOLD_MS once the app is ready
    useEffect(() => {
        if (state.isLoadingApp) return;
        const t = setTimeout(finish, MAX_HOLD_MS);
        return () => clearTimeout(t);
    }, [state.isLoadingApp, finish]);

    // The offers for this page's filters are in place once a services request has run and finished after the
    // filters were applied. (The category is a server-side filter and keepPreviousData keeps the previous list on
    // screen meanwhile, so "list is non-empty" proves nothing.)
    const sawFetch = useRef(false);
    useEffect(() => {
        if (filtersApplied && fetching > 0) sawFetch.current = true;
    }, [filtersApplied, fetching]);

    useEffect(() => {
        if (state.isLoadingApp || done.current) return;
        if (!held.current) { finish(); return; } // in-app navigation: scroll straight away, as before
        if (!filtersApplied || fetching > 0) return;
        // Nothing in flight. A short settle delay guards the gap between "filters applied" and "request started".
        // No request seen at all = the data was already cached and fresh, so wait a little longer to be sure.
        let poll = 0;
        const t = window.setTimeout(() => {
            if (fetchingRef.current !== 0) return;
            // HomeView animates its list (AnimatePresence): the empty state leaves and the cards enter a beat after
            // the data lands, more on slow devices. Wait until "Brak wyników" is really gone (bounded).
            let tries = 0;
            const check = () => {
                if (!/Brak wyników/.test(document.body.innerText) || ++tries > 30) { finish(); return; }
                poll = window.setTimeout(check, 50);
            };
            check();
        }, sawFetch.current ? 120 : 600);
        return () => { window.clearTimeout(t); window.clearTimeout(poll); };
    }, [state.isLoadingApp, filtersApplied, fetching, finish]);

    // During SSR/loading only the static shell is rendered — HomeView without data would show
    // "Ładowanie…" / "Brak wyników" next to the real offers in the HTML.
    if (state.isLoadingApp) return null;

    return (
        <HomeView
            skipInitialAnimation
            {...state.homeProps}
            {...actions.homeActions}
            categories={CATEGORIES_DATA}
            onServiceClick={actions.onServiceClick}
            onStartChat={actions.startChat}
        />
    );
}
