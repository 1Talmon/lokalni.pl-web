import { useEffect, useReducer, useRef } from 'react';
import { logger } from '../utils/logger';
import {
    getNavTarget, getNavElapsedMs, endTrackedNav,
    wasHardNavAttempted, markHardNavAttempt, clearHardNavAttempt, reportNavIssue,
} from '../utils/navRecovery';

const NUDGE_INTERVAL_MS = 300;
const WATCHDOG_MS = 10_000;

/**
 * Recovers client navigations to service/profile pages that never commit.
 *
 * Root cause (reproduced on production with Playwright, ~10% of cold visits): the router
 * transition suspends on the target page's client module; the module resolves but React is
 * never pinged (root.suspendedLanes === pendingLanes, pingedLanes === 0), so the transition
 * stays pending until *any* re-render retries it. Not reproducible locally — needs real CF latency.
 *
 * 1. Nudge: while the URL has not reached the target, force a cheap re-render every 300ms.
 * 2. Watchdog: after 10s of overlay, one hard navigation/reload per URL; if that also hangs,
 *    hide the overlay instead of looping.
 */
export function useNavRecovery(isNavLoading: boolean, pathname: string, setNavLoading: (v: boolean) => void) {
    const [, nudge] = useReducer((n: number) => n + 1, 0);
    const nudgesRef = useRef(0);

    useEffect(() => {
        if (!isNavLoading) return;
        const target = getNavTarget();
        if (!target) return;
        if (pathname === target) {
            if (nudgesRef.current > 0) reportNavIssue('nudge_recovered', target, getNavElapsedMs());
            nudgesRef.current = 0;
            endTrackedNav();
            return;
        }
        const id = setInterval(() => {
            if (window.location.pathname === target) { clearInterval(id); return; }
            nudgesRef.current++;
            nudge();
        }, NUDGE_INTERVAL_MS);
        return () => clearInterval(id);
    }, [isNavLoading, pathname]);

    useEffect(() => {
        if (!isNavLoading) {
            clearHardNavAttempt();
            return;
        }
        const t = setTimeout(() => {
            const target = getNavTarget() || window.location.pathname;
            const elapsed = getNavElapsedMs() || WATCHDOG_MS;
            endTrackedNav();
            nudgesRef.current = 0;
            if (wasHardNavAttempted(target)) {
                clearHardNavAttempt();
                logger.warn('useNavRecovery: still stuck after hard navigation, hiding overlay', target);
                reportNavIssue('gave_up', target, elapsed);
                setNavLoading(false);
                return;
            }
            logger.warn('useNavRecovery: nav loading stuck, hard navigation', target);
            reportNavIssue('hard_nav', target, elapsed);
            markHardNavAttempt(target);
            if (window.location.pathname === target) window.location.reload();
            else window.location.assign(target);
        }, WATCHDOG_MS);
        return () => clearTimeout(t);
    }, [isNavLoading]); // eslint-disable-line react-hooks/exhaustive-deps
}
