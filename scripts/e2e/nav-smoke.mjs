#!/usr/bin/env node
// Navigation smoke test against a deployed environment (or a local `next start`).
//
//   npm run test:nav                                   # dev preview, 30 runs
//   npm run test:nav -- https://mylokalni.pl 60        # production, 60 runs
//   npm run test:nav -- http://localhost:3100 30       # local build (API proxied with CORS)
//
// Each run uses a fresh browser (cold cache, like a visitor from Google) with an iPhone UA,
// opens "/", clicks the first service card and measures how long until the service page renders.
// A run slower than SLOW_MS means the router transition hung and was rescued by the
// watchdog — the bug useNavRecovery guards against. Exit code 1 if any run is slow or fails.
//
// Requires Chromium for Playwright once: `npx playwright install chromium`.

import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://dev.lokalni-pl-web.pages.dev';
const RUNS = Number(process.argv[3] || 30);
const PARALLEL = Number(process.env.PAR || 3);
const SLOW_MS = 1500;
const CORS_ALLOWED = new Set(['https://mylokalni.pl', 'https://dev.lokalni-pl-web.pages.dev']);
const TIMEOUT_MS = 15_000;
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

async function newContext(browser) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, userAgent: UA });
    // Cookie banner overlaps cards on mobile viewport
    await ctx.addInitScript(() => {
        document.addEventListener('DOMContentLoaded', () => {
            const st = document.createElement('style');
            st.textContent = '[data-cookie-banner]{display:none!important}';
            document.head.appendChild(st);
        });
    });
    // API CORS (nginx on the LB) only allows production + dev origins — for local builds and
    // other preview branches, proxy API calls through Playwright and rewrite the CORS headers
    if (!CORS_ALLOWED.has(new URL(BASE).origin)) {
        await ctx.route(/api\.mylokalni\.pl/, async (route) => {
            const req = route.request();
            const cors = { 'access-control-allow-origin': BASE, 'access-control-allow-credentials': 'true' };
            if (req.method() === 'OPTIONS') {
                return route.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': '*', 'access-control-allow-methods': 'GET,POST,PATCH,DELETE' } });
            }
            try {
                const res = await route.fetch({ headers: { ...req.headers(), origin: 'https://mylokalni.pl' } });
                await route.fulfill({ response: res, headers: { ...res.headers(), ...cors } });
            } catch {
                try { await route.abort(); } catch { /* context closed */ }
            }
        });
    }
    return ctx;
}

async function runOnce() {
    const browser = await chromium.launch();
    try {
        const ctx = await newContext(browser);
        const page = await ctx.newPage();
        await page.goto(BASE + '/', { waitUntil: 'load' });
        await page.waitForTimeout(2500);
        await page.locator('[class*="cursor-pointer"]').filter({ hasText: /zł/ }).first().click();
        const t0 = Date.now();
        while (Date.now() - t0 < TIMEOUT_MS) {
            if (page.url().includes('/service/') && await page.locator('[data-sdv-root]').count() > 0) return Date.now() - t0;
            await page.waitForTimeout(150);
        }
        return Infinity;
    } finally {
        await browser.close();
    }
}

async function checkGuestSession() {
    // Stale "logged in" flag without a valid refresh cookie must leave the visitor on "/" as a guest
    const browser = await chromium.launch();
    try {
        const ctx = await newContext(browser);
        await ctx.addInitScript(() => {
            try { if (!sessionStorage.__seeded) { localStorage.setItem('is_logged_in', 'true'); sessionStorage.__seeded = '1'; } } catch { /* ignore */ }
        });
        const page = await ctx.newPage();
        await page.goto(BASE + '/', { waitUntil: 'load' });
        await page.waitForTimeout(4000);
        return !page.url().includes('/auth');
    } finally {
        await browser.close();
    }
}

const times = [];
const errors = [];
let next = 0;
await Promise.all(Array.from({ length: PARALLEL }, async () => {
    while (next < RUNS) {
        next++;
        try { times.push(await runOnce()); } catch (e) { errors.push(String(e?.message ?? e).split('\n')[0].slice(0, 120)); }
    }
}));
times.sort((a, b) => a - b);
const slow = times.filter((t) => t > SLOW_MS);
const guestOk = await checkGuestSession();

console.log(`${BASE}`);
console.log(`  navigation: ${times.length} runs, median ${times[times.length >> 1]}ms, slow(>${SLOW_MS}ms): ${slow.length}${slow.length ? ' [' + slow.join(', ') + ']' : ''}`);
console.log(`  expired session stays guest: ${guestOk ? 'PASS' : 'FAIL'}`);
if (errors.length) console.log(`  harness errors (${errors.length}): ${[...new Set(errors)].join(' | ')}`);
process.exit(slow.length === 0 && guestOk && errors.length === 0 ? 0 : 1);
