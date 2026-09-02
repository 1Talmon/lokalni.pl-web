import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    // _next/data is the legacy Pages Router data-fetching format.
    // App Router doesn't generate these — stale Googlebot/browser cache hits
    // land here and the CF Worker would otherwise return 500.
    if (request.nextUrl.pathname.startsWith('/_next/data/')) {
        return new NextResponse(null, { status: 404 });
    }
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/_next/data/:path*',
        '/((?!_next|api|sitemap|robots|favicon|og-image|icons|manifest).*)',
    ],
};
