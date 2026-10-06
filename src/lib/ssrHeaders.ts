// Server-only: headers for API calls made during SSR / sitemap generation. On Cloudflare every
// visitor's SSR request leaves through the same Workers egress IP, so the API would rate-limit the
// whole site as one client — x-lokalni-ssr (shared REVALIDATE_SECRET) exempts us from per-IP limits.
// Read per call: on Cloudflare the env is bound per request.
export function ssrHeaders(userAgent = 'Lokalni-MetaBot/1.0'): Record<string, string> {
    const secret = process.env.REVALIDATE_SECRET;
    return secret ? { 'User-Agent': userAgent, 'x-lokalni-ssr': secret } : { 'User-Agent': userAgent };
}
