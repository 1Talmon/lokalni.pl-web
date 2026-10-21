import { apiClient } from './apiClient';

/** Plus on the website: Stripe Checkout + customer portal. The server grants Plus only from Stripe's signed events. */

export interface StripePlan { plan: 'monthly' | 'yearly'; priceId: string; amount: number; currency: string; interval: string }
export interface StripeSubscription { plan: string | null; status: string; currentPeriodEnd: string | null; trialEnd: string | null; cancelAtPeriodEnd: boolean; test: boolean }
export interface StripeConfig {
    enabled: boolean;
    plans: StripePlan[];
    trialDays: number;
    trialEligible: boolean;
    subscriptions: StripeSubscription[];
    isPremium: boolean;
    premiumExpiresAt: string | null;
    premiumSource: 'apple' | 'trial' | 'admin' | 'stripe' | null;
}

export async function getStripeConfig(): Promise<StripeConfig> {
    const res = await apiClient.get('/billing/stripe/config');
    if (!res.ok) throw new Error(`config ${res.status}`);
    return res.json();
}

async function redirectFrom(endpoint: string, body: Record<string, unknown>): Promise<void> {
    const res = await apiClient.post(endpoint, body);
    const data = await res.json().catch(() => ({})) as { url?: string; error?: string };
    if (!res.ok || !data.url) throw new Error(data.error ?? 'Nie udało się połączyć z płatnościami. Spróbuj ponownie.');
    window.location.assign(data.url);
}

/** Opens Stripe Checkout (the card form lives on Stripe's page; nothing card-related reaches our servers). */
export const startCheckout = (plan: 'monthly' | 'yearly') => redirectFrom('/billing/stripe/checkout', { plan, consent: true });

/** Stripe customer portal: cancel, change plan or card, invoices. */
export const openBillingPortal = () => redirectFrom('/billing/stripe/portal', {});
