const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.mylokalni.pl/api')
  .replace(/\/api\/?$/, '');

export function normalizeMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Replace legacy dev-server URLs (http(s)://localhost:PORT, 127.0.0.1[:PORT]) with the real
  // server. Port required for localhost: the Android app itself runs at https://localhost
  // (no port) and its own bundled assets must not be rewritten to the API.
  return url.replace(/^https?:\/\/(localhost:\d+|127\.0\.0\.1(:\d+)?)/, API_BASE);
}

/**
 * Card-sized variant of an uploaded service photo. The API stores `<file>_thumb.webp`
 * (400×400) next to every `<file>.webp` upload; list cards use it instead of the full
 * 1200px photo (~10× smaller). Other URLs are returned unchanged.
 */
export function cardImageUrl(url: string | null | undefined): string | null {
  const u = normalizeMediaUrl(url);
  if (!u) return null;
  if (!/^https:\/\/media\.mylokalni\.pl\/.+\.webp$/.test(u) || u.endsWith('_thumb.webp')) return u;
  return u.replace(/\.webp$/, '_thumb.webp');
}
