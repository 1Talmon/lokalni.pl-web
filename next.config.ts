import type { NextConfig } from 'next';
import path from 'path';
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';

const isDev = process.env.NODE_ENV === 'development';

const SECURITY_HEADERS = [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(self), payment=()' },
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
    {
        key: 'Content-Security-Policy',
        value: [
            "default-src 'self'",
            `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://connect.facebook.net https://accounts.google.com https://maps.googleapis.com`,
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: blob: https:",
            "connect-src 'self' https://api.mylokalni.pl wss://api.mylokalni.pl https://api.cypriantalmon.pl wss://api.cypriantalmon.pl https://accounts.google.com https://maps.googleapis.com",
            "frame-src 'self' https://accounts.google.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ].join('; '),
    },
];

const NOINDEX_HEADER = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];
const PRIVATE_ROUTES = '/(dashboard|booking-form|support|chat|calendar|favorites|delete-account|delete-account-confirm|verify-email|review|invite|r|auth|zgoda-rodzica)/:path*';

if (process.env.NODE_ENV === 'development') {
    await setupDevPlatform();
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
            { protocol: 'https', hostname: 'api.cypriantalmon.pl' },
            { protocol: 'https', hostname: '*.googleusercontent.com' },
            { protocol: 'https', hostname: '*.fbcdn.net' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
        ],
    },
    webpack(config) {
        const stubs = path.resolve('./src/lib/cap-stubs');
        config.resolve.alias = {
            ...config.resolve.alias,
            '@capacitor/action-sheet':                path.join(stubs, 'action-sheet.ts'),
            '@capacitor/core':                        path.join(stubs, 'core.ts'),
            '@capacitor/app':                         path.join(stubs, 'app.ts'),
            '@capacitor/haptics':                     path.join(stubs, 'haptics.ts'),
            '@capacitor/splash-screen':               path.join(stubs, 'splash-screen.ts'),
            '@capacitor/status-bar':                  path.join(stubs, 'status-bar.ts'),
            '@capacitor/keyboard':                    path.join(stubs, 'keyboard.ts'),
            '@capacitor/camera':                      path.join(stubs, 'camera.ts'),
            '@capacitor/push-notifications':          path.join(stubs, 'push-notifications.ts'),
            '@capacitor/local-notifications':         path.join(stubs, 'local-notifications.ts'),
            '@capacitor/share':                       path.join(stubs, 'share.ts'),
            '@capacitor/geolocation':                 path.join(stubs, 'geolocation.ts'),
            'capacitor-secure-storage-plugin':        path.join(stubs, 'secure-storage.ts'),
            '@aparajita/capacitor-biometric-auth':    path.join(stubs, 'biometric-auth.ts'),
            '@capacitor-community/facebook-login':    path.join(stubs, 'facebook-login.ts'),
            '@codetrix-studio/capacitor-google-auth': path.join(stubs, 'google-auth.ts'),
        };
        return config;
    },
};

export default nextConfig;
