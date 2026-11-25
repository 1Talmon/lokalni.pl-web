'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Gift } from 'lucide-react';
import { loginHref } from '@/utils/authRedirect';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mylokalni.pl/api';
const CODE_RE = /^[a-zA-Z0-9_-]{3,40}$/;
const APP_STORE_URL = 'https://apps.apple.com/pl/app/mylokalni/id6788702057?l=pl';

/** Prefiks, po którym apka rozpoznaje kod skopiowany do schowka przy instalacji ze sklepu. */
export const REFERRAL_CLIPBOARD_PREFIX = 'lokalni-ref:';

type Invite = { status: 'loading' } | { status: 'ok'; name: string | null; rewardDays: number } | { status: 'invalid' };

export const InviteView = () => {
    const params = useParams();
    const rawCode = params?.code as string | undefined;
    const code = rawCode && CODE_RE.test(rawCode) ? rawCode : null;
    const router = useRouter();
    const [invite, setInvite] = useState<Invite>({ status: code ? 'loading' : 'invalid' });
    const [isIos, setIsIos] = useState(false);

    useEffect(() => {
        setIsIos(/iPhone|iPad|iPod/i.test(navigator.userAgent));
    }, []);

    useEffect(() => {
        if (!code) return;
        const ctrl = new AbortController();
        fetch(`${API_URL}/public/referral/${encodeURIComponent(code)}`, { signal: ctrl.signal })
            .then(async (res) => {
                if (res.status === 404) { setInvite({ status: 'invalid' }); return; }
                if (!res.ok) throw new Error(String(res.status));
                const data = await res.json() as { name?: string; rewardDays?: number };
                try { localStorage.setItem('referral_code', code); } catch { /* private mode */ }
                setInvite({ status: 'ok', name: data.name ?? null, rewardDays: data.rewardDays ?? 30 });
            })
            .catch((err) => {
                if ((err as Error).name === 'AbortError') return;
                // Brak sieci / błąd serwera: kod zapisujemy mimo to – API i tak sprawdzi go przy rejestracji.
                try { localStorage.setItem('referral_code', code); } catch { /* private mode */ }
                setInvite({ status: 'ok', name: null, rewardDays: 30 });
            });
        return () => ctrl.abort();
    }, [code]);

    const goAuth = () => router.push(loginHref('/'));

    // Zanim ktoś przejdzie do sklepu, kopiujemy kod – po instalacji apka go odczyta (iOS nie przenosi parametrów linku).
    const goStore = () => {
        if (code) navigator.clipboard?.writeText(`${REFERRAL_CLIPBOARD_PREFIX}${code}`).catch(() => {});
        window.location.href = APP_STORE_URL;
    };

    const ok = invite.status === 'ok' ? invite : null;
    const title = invite.status === 'loading' ? ' '
        : ok?.name ? `${ok.name} zaprasza Cię`
        : ok ? 'Zaprosił Cię znajomy'
        : 'Witaj w MyLokalni';

    return (
        <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] px-6 text-white">
            <div className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-fuchsia-300/20 blur-3xl" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                className="relative flex w-full max-w-sm flex-col items-center text-center"
            >
                <div className="text-5xl font-black tracking-tight">
                    MyLokalni<span className="text-white/60">.</span>
                </div>

                <h1 className="mt-6 min-h-[1.75rem] text-xl font-bold text-white/90">{title}</h1>

                {ok && (
                    <div className="mt-6 flex items-center gap-3 rounded-2xl bg-white/15 px-5 py-3.5 text-left backdrop-blur">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                            <Gift size={20} />
                        </div>
                        <div className="text-sm font-bold leading-snug">
                            Załóż konto, a oboje dostaniecie miesiąc Plus w prezencie.
                        </div>
                    </div>
                )}

                <button
                    onClick={goAuth}
                    className="mt-10 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-xs font-black uppercase tracking-widest text-[#6366F1] shadow-lg shadow-black/10 transition-all hover:bg-indigo-50 active:scale-95"
                >
                    Dołącz <ArrowRight size={16} />
                </button>
                <button
                    onClick={goAuth}
                    className="mt-2 w-full rounded-2xl py-3 text-xs font-black uppercase tracking-widest text-white/70 transition-all hover:bg-white/10"
                >
                    Mam już konto
                </button>

                {isIos && (
                    <button
                        onClick={goStore}
                        className="mt-6 text-xs font-bold text-white/70 underline underline-offset-4 hover:text-white"
                    >
                        Wolę aplikację – pobierz z App Store
                    </button>
                )}
            </motion.div>
        </div>
    );
};
