const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'https://api.mylokalni.pl/api')
  .replace(/\/api\/?$/, '');

export function normalizeMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Replace any http(s)://localhost:PORT or http://127.0.0.1:PORT with the real server
  return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, API_BASE);
}
