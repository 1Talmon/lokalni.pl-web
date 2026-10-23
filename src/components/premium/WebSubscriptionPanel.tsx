'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, Sparkles, Settings2 } from 'lucide-react';
import { startCheckout, openBillingPortal, type StripeConfig } from '../../services/stripeBilling';

/**
 * Plus paywall on the website (Stripe). We are the merchant here, so before paying the user accepts the Terms
 * and asks for the service to start at once (consumer withdrawal rules) — the server refuses checkout without it.
 */

const pln = (amount: number, currency: string) =>
    new Intl.NumberFormat('pl-PL', { style: 'currency', currency: currency.toUpperCase() }).format(amount);
/** "ok. 1,92 zł / mies." under the yearly price — same line as in the iPhone app */
const perMonth = (amount: number, currency: string, interval: string) =>
    interval === 'year' ? pln(amount / 12, currency) : null;
const per = (interval: string) => (interval === 'year' ? 'rok' : 'miesiąc');
const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' }) : null);

export const WebSubscriptionPanel = ({ config }: { config: StripeConfig }) => {
    const plans = useMemo(() => [...config.plans].sort((a, b) => (a.plan === 'yearly' ? -1 : b.plan === 'yearly' ? 1 : 0)), [config.plans]);
    const [selected, setSelected] = useState(plans[0]?.plan ?? 'yearly');
    const [consent, setConsent] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const monthly = plans.find(p => p.plan === 'monthly');
    const savings = (p: (typeof plans)[number]) => {
        if (!monthly || p.plan !== 'yearly') return null;
        const pct = Math.round((1 - p.amount / (monthly.amount * 12)) * 100);
        return pct >= 5 ? pct : null;
    };
    const current = plans.find(p => p.plan === selected);
    const trial = config.trialEligible && config.trialDays > 0;
    const active = config.subscriptions.find(s => ['trialing', 'active', 'past_due'].includes(s.status));

    const go = async (fn: () => Promise<void>) => {
        setBusy(true); setError(null);
        try { await fn(); } catch (e) { setError((e as Error).message); setBusy(false); }
    };

    // Plus bought in the iPhone app — managed in Apple ID, never sold twice
    if (config.isPremium && config.premiumSource === 'apple') {
        return (
            <div className="bg-white/5 rounded-2xl p-4 text-center">
                <p className="text-xl font-black text-white">Plus jest aktywny</p>
                <p className="text-[12px] text-slate-400 font-medium mt-1">Subskrypcja kupiona w aplikacji na iPhone&apos;a. Zarządzasz nią w Ustawieniach iPhone&apos;a → [Twoje imię] → Subskrypcje.</p>
            </div>
        );
    }

    if (config.isPremium && config.premiumSource === 'stripe') {
        const until = date(active?.currentPeriodEnd ?? config.premiumExpiresAt);
        return (
            <>
                <div className="bg-white/5 rounded-2xl p-4 mb-4 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Twoja subskrypcja</p>
                    <p className="text-xl font-black text-white">Plus jest aktywny</p>
                    {until && (
                        <p className="text-[12px] text-slate-400 font-medium mt-1">
                            {active?.cancelAtPeriodEnd ? `Anulowana — działa do ${until}` : active?.status === 'trialing' ? `Okres próbny do ${until}` : `Odnowi się ${until}`}
                        </p>
                    )}
                    {active?.status === 'past_due' && (
                        <p className="text-[12px] text-amber-400 font-semibold mt-2">Płatność się nie udała. Zaktualizuj kartę, żeby nie stracić Plus.</p>
                    )}
                </div>
                <button onClick={() => go(openBillingPortal)} disabled={busy}
                    className="w-full py-4 rounded-2xl font-black text-base bg-white/10 text-white hover:bg-white/15 active:scale-95 transition-all flex items-center justify-center gap-2">
                    {busy ? <Loader2 size={18} className="animate-spin" /> : <Settings2 size={18} />} Zarządzaj subskrypcją
                </button>
                <p className="text-center text-[11px] text-slate-500 mt-2">Anulowanie, zmiana planu lub karty i faktury — na bezpiecznej stronie Stripe.</p>
                {error && <p className="text-center text-[12px] text-rose-400 mt-3 font-semibold">{error}</p>}
            </>
        );
    }

    return (
        <>
            {config.isPremium && (
                <p className="text-center text-[12px] text-slate-400 font-medium mb-3">
                    Plus jest aktywny{config.premiumExpiresAt ? ` do ${date(config.premiumExpiresAt)}` : ''}. Możesz już teraz włączyć subskrypcję.
                </p>
            )}
            <div className="space-y-2 mb-3">
                {plans.map(p => {
                    const on = p.plan === selected;
                    const save = savings(p);
                    return (
                        <button key={p.plan} onClick={() => setSelected(p.plan)}
                            className={`w-full text-left rounded-2xl px-4 py-3 border-2 transition-all active:scale-[0.98] ${on ? 'border-amber-400 bg-amber-400/10' : 'border-white/10 bg-white/5'}`}>
                            <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[15px] font-black text-white flex items-center gap-2">
                                        {p.plan === 'yearly' ? 'Rocznie' : 'Miesięcznie'}
                                        {save && <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-900 rounded-full px-2 py-0.5">−{save}%</span>}
                                    </p>
                                    <p className="text-[12px] text-slate-400 font-medium mt-0.5">
                                        {trial ? `${config.trialDays} dni za darmo, potem ` : ''}{pln(p.amount, p.currency)} / {per(p.interval)}
                                        {perMonth(p.amount, p.currency, p.interval) && <span className="text-amber-300/90"> · ok. {perMonth(p.amount, p.currency, p.interval)} / mies.</span>}
                                    </p>
                                </div>
                                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${on ? 'border-amber-400 bg-amber-400' : 'border-white/30'}`}>
                                    {on && <Check size={14} strokeWidth={3} className="text-slate-900" />}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <label className="flex items-start gap-2.5 text-left mb-4 cursor-pointer">
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 w-4 h-4 accent-amber-400 shrink-0" />
                <span className="text-[11px] text-slate-400 leading-relaxed">
                    Akceptuję <Link href="/regulamin" className="text-slate-200 underline">Regulamin</Link> i żądam rozpoczęcia świadczenia usługi Plus przed upływem
                    14-dniowego terminu na odstąpienie od umowy. Przyjmuję do wiadomości, że w razie odstąpienia zapłacę za okres, w którym korzystałem z Plus.
                </span>
            </label>

            <button onClick={() => current && go(() => startCheckout(current.plan))} disabled={!current || !consent || busy}
                className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-95 flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-xl shadow-amber-500/30 disabled:opacity-50">
                {busy ? <><Loader2 size={20} className="animate-spin" /> Przechodzę do płatności…</>
                    : trial ? <><Sparkles size={18} /> Wypróbuj {config.trialDays} dni za darmo</>
                    : <><Sparkles size={18} /> Subskrybuj za {current ? `${pln(current.amount, current.currency)} / ${per(current.interval)}` : ''}</>}
            </button>
            <p className="text-center text-[12px] text-slate-300 font-semibold mt-2">Anulujesz w każdej chwili w ustawieniach konta.</p>
            {error && <p className="text-center text-[12px] text-rose-400 mt-3 font-semibold">{error}</p>}

            {current && (
                <p className="text-center text-[11px] text-slate-400 mt-2 leading-snug">
                    {trial ? `Przez ${config.trialDays} dni nic nie płacisz — podajesz tylko kartę. Potem s` : 'S'}ubskrypcja odnawia się automatycznie
                    za {pln(current.amount, current.currency)} / {per(current.interval)}, dopóki jej nie anulujesz. Anulujesz w każdej chwili w ustawieniach
                    konta (Plus → Zarządzaj subskrypcją); Plus działa wtedy do końca opłaconego okresu. Płatność obsługuje Stripe — nie widzimy danych Twojej karty.
                </p>
            )}
            <div className="flex items-center justify-center gap-4 mt-2 text-[11px] font-semibold text-slate-400">
                <Link href="/regulamin" className="hover:text-white">Regulamin</Link>
                <Link href="/polityka-prywatnosci" className="hover:text-white">Prywatność</Link>
            </div>
        </>
    );
};
