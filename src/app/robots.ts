import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/seo-data';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: ['Googlebot', 'Bingbot', 'Twitterbot', 'facebookexternalhit'],
                allow: '/',
                disallow: ['/og/'],
            },
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/og/',
                    '/chat',
                    '/chat/',
                    '/calendar',
                    '/favorites',
                    '/dashboard',
                    '/booking-form',
                    '/support',
                    '/review/',
                    '/invite/',
                    '/r/',
                    '/auth',
                    '/verify-email',
                    '/reset-password',
                    '/delete-account',
                    '/delete-account-confirm',
                    '/zgoda-rodzica',
                ],
            },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
