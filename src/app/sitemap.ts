import type { MetadataRoute } from 'next';

const BASE = 'https://mylokalni.pl';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: `${BASE}/`,                      priority: 1.0,  changeFrequency: 'daily'   as const },
    { url: `${BASE}/jak-to-dziala`,          priority: 0.8,  changeFrequency: 'monthly' as const },
    { url: `${BASE}/faq`,                    priority: 0.8,  changeFrequency: 'monthly' as const },
    { url: `${BASE}/o-nas`,                  priority: 0.7,  changeFrequency: 'monthly' as const },
    { url: `${BASE}/regulamin`,              priority: 0.5,  changeFrequency: 'monthly' as const },
    { url: `${BASE}/polityka-prywatnosci`,   priority: 0.5,  changeFrequency: 'monthly' as const },
  ];

  return staticPages.map(p => ({ ...p, lastModified: new Date() }));
}
