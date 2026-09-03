import { NextResponse, type NextRequest } from 'next/server';

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

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/_next/data/:path*',
        '/((?!_next|api|sitemap|robots|favicon|og-image|icons|manifest).*)',
    ],
};
