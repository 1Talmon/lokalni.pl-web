import { NextResponse } from 'next/server';
import { BASE_URL } from '@/lib/seo-data';

export const dynamic = 'force-static';
export const revalidate = 86400;

export function GET() {
    const body = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${BASE_URL}/sitemap-categories.xml</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-locations.xml</loc></sitemap>
  <sitemap><loc>${BASE_URL}/sitemap-services.xml</loc></sitemap>
</sitemapindex>`;

    return new NextResponse(body, {
        headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
}
