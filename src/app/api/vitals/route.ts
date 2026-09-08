import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface VitalMetric {
    name: string;
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    delta: number;
    id: string;
    path: string;
    isPoor: boolean;
}

export async function POST(request: NextRequest) {
    try {
        const metric = await request.json() as VitalMetric;

        // Logs visible in CF Dashboard → Pages → Functions (real-time + historical)
        // Replace with Datadog / Grafana Faro / PostHog when analytics infra is ready
        console.log(JSON.stringify({ t: 'cwv', ...metric, ts: Date.now() }));

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }
}
