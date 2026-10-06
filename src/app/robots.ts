import type { MetadataRoute } from 'next';
import { BASE_URL } from '@/lib/seo-data';

// A crawler obeys only the most specific group matching its name — so every group must carry
// the full disallow list (previously Googlebot's own group had only /og/).
const DISALLOW = [
    '/og/',
    '/api/',
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
    // Tracking/session/search parameters — protect crawl budget (wildcard matches any position)
    '/*utm_',
    '/*fbclid=',
    '/*ref=',
    '/*gclid=',
    '/*msclkid=',
    '/*sort=',
    '/*?q=',
    '/*&q=',
];

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            { userAgent: ['Googlebot', 'Bingbot'], allow: '/', disallow: DISALLOW },
            // Link-preview bots must reach every public page (they never fetch /og/ directly)
            { userAgent: ['Twitterbot', 'facebookexternalhit'], allow: '/', disallow: ['/og/'] },
            { userAgent: '*', allow: '/', disallow: DISALLOW },
        ],
        sitemap: `${BASE_URL}/sitemap.xml`,
    };
}
