const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.mylokalni.pl/api')
  .replace(/\/api\/?$/, '');

export function normalizeMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Replace legacy dev-server URLs (http(s)://localhost:PORT, 127.0.0.1[:PORT]) with the real
  // server. Port required for localhost: the Android app itself runs at https://localhost
  // (no port) and its own bundled assets must not be rewritten to the API.
  return url.replace(/^https?:\/\/(localhost:\d+|127\.0\.0\.1(:\d+)?)/, API_BASE);
}
