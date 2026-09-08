import { NextResponse, type NextRequest } from 'next/server';

// Social bots that need og: tags in <head> — rewrite to /og/* which is a
// top-level server component where generateMetadata lands in <head>, not after
// the (app)/ 'use client' layout RSC payload.
const SOCIAL_BOT_RE = /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|WhatsApp|Slackbot|TelegramBot|redditbot|Applebot/i;

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

    // Rewrite social bot requests to /og/* — lightweight server pages where og:
    // tags land in <head> synchronously (not streamed after (app)/ RSC payload).
    const ua = request.headers.get('user-agent') ?? '';
    if (SOCIAL_BOT_RE.test(ua)) {
        if (pathname.startsWith('/service/') || pathname.startsWith('/profile/')) {
            return NextResponse.rewrite(new URL(`/og${pathname}`, request.url));
        }
        // Landing slug pages: /hydraulik-warszawa, /sprzatanie, /warszawa etc.
        // Detect slug pattern: single path segment, all lowercase + hyphens, no extension
        if (/^\/[a-z][a-z0-9-]*$/.test(pathname)) {
            return NextResponse.rewrite(new URL(`/og${pathname}`, request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/_next/data/:path*',
        '/((?!_next|api|sitemap|robots|favicon|og-image|icons|manifest|.*\\.txt).*)',
    ],
};
