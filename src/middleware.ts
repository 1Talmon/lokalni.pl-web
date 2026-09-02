import { NextResponse, type NextRequest } from 'next/server';

export function middleware(_request: NextRequest) {
    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!_next|api|sitemap|robots|favicon|og-image|icons|manifest).*)'],
};
