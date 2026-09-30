import { NextResponse, type NextRequest } from 'next/server';

// Social bots that need og: tags in <head> — rewrite to /og/* which is a
// top-level server component where generateMetadata lands in <head>, not after
// the (app)/ 'use client' layout RSC payload.
const SOCIAL_BOT_RE = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|redditbot|Applebot/i;

// Landing slug pattern: single lowercase path segment (/hydraulik-warszawa)
const LANDING_SLUG_RE = /^\/[a-z][a-z0-9-]*$/;
// Paginated landing slug: /hydraulik-warszawa/2
const PAGINATED_SLUG_RE = /^\/[a-z][a-z0-9-]*\/\d+$/;

// Known app routes that share the single-segment pattern — must not get ISR cache headers.
// These are served by (app)/ or (public)/ layouts, not (seo)/[slug].
const APP_SEGMENTS = new Set([
    'chat', 'calendar', 'favorites', 'dashboard', 'booking-form', 'support',
    'faq', 'regulamin', 'polityka-prywatnosci', 'o-nas', 'zasady-bezpieczenstwa',
    'jak-to-dziala', 'zgoda-rodzica', 'auth', 'reset-password', 'verify-email',
    'delete-account', 'delete-account-confirm', 'invite', 'r',
    'service', 'profile', 'og', 'api',
]);

function buildCsp(): string {
    const isDev = process.env.NODE_ENV === 'development';
    return [
        "default-src 'self'",
        `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://connect.facebook.net https://accounts.google.com https://maps.googleapis.com`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "connect-src 'self' https://api.mylokalni.pl wss://api.mylokalni.pl https://accounts.google.com https://maps.googleapis.com",
        "frame-src 'self' https://accounts.google.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; ');
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // _next/data is the legacy Pages Router data-fetching format.
    // App Router doesn't generate these — stale Googlebot/browser cache hits
    // land here and the CF Worker would otherwise return 500.
    if (pathname.startsWith('/_next/data/')) {
        return new NextResponse(null, { status: 404 });
    }

    // Service slugs at root level (e.g. /title-words-PublicId) come from old
    // indexed URLs or links. Service slugs always contain a mixed-case publicId
    // (uppercase letters), while landing slugs (keywords/cities) are lowercase.
    // Redirect permanently to /service/<slug> to preserve SEO link equity.
    if (!pathname.includes('/', 1) && /[A-Z]/.test(pathname)) {
        const slug = pathname.slice(1);
        return NextResponse.redirect(new URL(`/service/${slug}`, request.url), 301);
    }

    const csp = buildCsp();

    const ua = request.headers.get('user-agent') ?? '';
    const isSocialBot = SOCIAL_BOT_RE.test(ua);

    // Rewrite social bot requests to /og/* — lightweight server pages where og:
    // tags land in <head> synchronously (not streamed after (app)/ RSC payload).
    if (isSocialBot) {
        if (pathname.startsWith('/service/') || pathname.startsWith('/profile/')) {
            const res = NextResponse.rewrite(new URL(`/og${pathname}`, request.url));
            res.headers.set('Content-Security-Policy', csp);
            return res;
        }
        // Landing slug pages: /hydraulik-warszawa, /sprzatanie, /warszawa etc.
        if (LANDING_SLUG_RE.test(pathname)) {
            const res = NextResponse.rewrite(new URL(`/og${pathname}`, request.url));
            res.headers.set('Content-Security-Policy', csp);
            return res;
        }
    }

    // Set edge Cache-Control headers for public SEO pages — not for social bots
    // (they get internally rewritten to /og/* which has its own cache policy).
    // ISR revalidate=3600 on pages; stale-while-revalidate allows CF edge to serve
    // stale content while regenerating, eliminating cold-miss latency spikes.
    if (!isSocialBot) {
        const firstSegment = pathname.split('/')[1] ?? '';
        const isLandingSlug =
            (LANDING_SLUG_RE.test(pathname) || PAGINATED_SLUG_RE.test(pathname)) &&
            !APP_SEGMENTS.has(firstSegment);

        if (isLandingSlug) {
            // Landing pages: ISR 1h, stale served for 24h, error fallback 7 days
            const response = NextResponse.next();
            response.headers.set(
                'Cache-Control',
                'public, s-maxage=3600, stale-while-revalidate=86400, stale-if-error=604800',
            );
            response.headers.set('Content-Security-Policy', csp);
            return response;
        }

        if (pathname.startsWith('/service/') || pathname.startsWith('/profile/')) {
            // Service/profile: ISR 1h, stale served 30min (fresher — user-generated content)
            const response = NextResponse.next();
            response.headers.set(
                'Cache-Control',
                'public, s-maxage=3600, stale-while-revalidate=1800, stale-if-error=86400',
            );
            response.headers.set('Content-Security-Policy', csp);
            return response;
        }
    }

    const response = NextResponse.next();
    response.headers.set('Content-Security-Policy', csp);
    return response;
}

export const config = {
    matcher: [
        '/_next/data/:path*',
        '/((?!_next|api|sitemap|robots|favicon|og-image|icons|manifest|.*\\.txt).*)',
    ],
};
