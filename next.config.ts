import type { NextConfig } from 'next';
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';
import withBundleAnalyzer from '@next/bundle-analyzer';

const isDev = process.env.NODE_ENV === 'development';

const SECURITY_HEADERS = [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self), payment=()' },
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
    // CSP jest ustawiane per-request w middleware.ts (nonce-based) — nie może być statyczne
];

const NOINDEX_HEADER = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
const PRIVATE_ROUTES = '/(dashboard|booking-form|support|chat|calendar|favorites|delete-account|delete-account-confirm|verify-email|review|invite|r|auth|zgoda-rodzica)/:path*';

if (process.env.NODE_ENV === 'development') {
    void setupDevPlatform();
}

const nextConfig: NextConfig = {
    typescript: { ignoreBuildErrors: false },
    eslint: { ignoreDuringBuilds: false },
    async headers() {
        return [
            { source: '/(.*)', headers: SECURITY_HEADERS },
            { source: PRIVATE_ROUTES, headers: NOINDEX_HEADER },
        ];
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'api.mylokalni.pl' },
            { protocol: 'https', hostname: 'media.mylokalni.pl' },
            { protocol: 'https', hostname: '*.googleusercontent.com' },
            { protocol: 'https', hostname: '*.fbcdn.net' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
        ],
    },
};

const bundleAnalyzer = withBundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
export default bundleAnalyzer(nextConfig);
