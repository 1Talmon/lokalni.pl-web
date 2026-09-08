'use client';
import { useReportWebVitals } from 'next/web-vitals';

const THRESHOLDS = { LCP: 2500, INP: 200, CLS: 0.1, FCP: 1800, TTFB: 800 } as const;

export function WebVitals() {
    useReportWebVitals((metric) => {
        const isPoor = metric.value > (THRESHOLDS[metric.name as keyof typeof THRESHOLDS] ?? Infinity);

        if (process.env.NODE_ENV !== 'production') {
            const label = isPoor ? '🔴' : metric.rating === 'needs-improvement' ? '🟡' : '🟢';
            // eslint-disable-next-line no-console
            console.debug(`[CWV] ${label} ${metric.name}`, Math.round(metric.value), metric.rating);
            return;
        }

        fetch('/api/vitals', {
            method: 'POST',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: metric.name,
                value: metric.value,
                rating: metric.rating,
                delta: metric.delta,
                id: metric.id,
                path: window.location.pathname,
                isPoor,
            }),
        }).catch(() => {});
    });

    return null;
}
