import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const KINDS = new Set(['nudge_recovered', 'hard_nav', 'gave_up']);
const MAX_BODY_BYTES = 1024; // real events are ~80 bytes

interface ClientEvent {
    kind: string;
    path: string;
    ms: number;
}

// Client-side navigation recovery events (see src/hooks/useNavRecovery.ts).
// Visible in CF Dashboard → Pages → Functions logs, same as /api/vitals.
export async function POST(request: NextRequest) {
    try {
        const declared = Number(request.headers.get('content-length') ?? 0);
        if (declared > MAX_BODY_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 });
        const raw = await request.text();
        if (raw.length > MAX_BODY_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 });
        const ev = JSON.parse(raw) as ClientEvent;
        if (!KINDS.has(ev.kind) || typeof ev.path !== 'string' || !Number.isFinite(ev.ms)) {
            return NextResponse.json({ error: 'invalid' }, { status: 400 });
        }
        // eslint-disable-next-line no-console
        console.log(JSON.stringify({ t: 'nav', kind: ev.kind, path: ev.path.slice(0, 200), ms: Math.round(ev.ms), ts: Date.now() }));
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'invalid' }, { status: 400 });
    }
}
