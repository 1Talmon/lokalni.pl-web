const API_URL = 'https://api.mylokalni.pl/api';
const FRONTEND_URL = 'https://mylokalni.pl';
const DEFAULT_IMAGE = 'https://mylokalni.pl/og-image.png';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function onRequest(context) {
  const slug = context.params.slug;
  const parts = slug.split('-');
  const publicId = parts[parts.length - 1];

  let title = parts.length > 1
    ? parts.slice(0, -1).join(' ').replace(/\b\w/g, l => l.toUpperCase())
    : slug;
  let description = 'Sprawdź ofertę specjalisty na MyLokalni.pl.';
  let imageUrl = DEFAULT_IMAGE;

  try {
    const res = await fetch(`${API_URL}/services/${publicId}`, {
      headers: { 'User-Agent': 'MyLokalni-MetaBot/1.0' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json = await res.json();
      const d = json.data ?? json;
      if (d.title) title = d.title;
      if (d.city) title = `${title} w ${d.city}`;
      if (d.description) description = String(d.description).slice(0, 200);
      if (d.image) imageUrl = d.image;
      else if (d.images?.[0]) imageUrl = d.images[0];
      else if (d.provider?.profilowe) imageUrl = d.provider.profilowe;
    }
  } catch {
    // zostają wartości domyślne
  }

  const safeTitle = escapeHtml(title);
  const safeDesc  = escapeHtml(description);
  const safeImage = escapeHtml(imageUrl);
  const safeUrl   = escapeHtml(`${FRONTEND_URL}/service/${slug}`);

  const spaRes = await context.next();
  let html = await spaRes.text();

  html = html
    .replace(/<title>[^<]*<\/title>/,
      `<title>${safeTitle} | MyLokalni.pl</title>`)
    .replace(/<meta property="og:title"[^>]*>/g,
      `<meta property="og:title" content="${safeTitle} | MyLokalni.pl" />`)
    .replace(/<meta property="og:description"[^>]*>/g,
      `<meta property="og:description" content="${safeDesc}" />`)
    .replace(/<meta property="og:image"[^>]*>/g,
      `<meta property="og:image" content="${safeImage}" />`)
    .replace(/<meta property="og:url"[^>]*>/g,
      `<meta property="og:url" content="${safeUrl}" />`)
    .replace(/<meta name="twitter:title"[^>]*>/g,
      `<meta name="twitter:title" content="${safeTitle} | MyLokalni.pl" />`)
    .replace(/<meta name="twitter:image"[^>]*>/g,
      `<meta name="twitter:image" content="${safeImage}" />`)
    .replace(/<link rel="canonical"[^>]*>/g,
      `<link rel="canonical" href="${safeUrl}" />`);

  return new Response(html, {
    status: spaRes.status,
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}
