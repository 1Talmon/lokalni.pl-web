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
  const uid = context.params.uid;

  let title = 'Specjalista | MyLokalni.pl';
  let description = 'Sprawdź profil specjalisty na MyLokalni.pl – opinie, usługi, kontakt.';
  let imageUrl = DEFAULT_IMAGE;

  try {
    const res = await fetch(`${API_URL}/users/${uid}/profile`, {
      headers: { 'User-Agent': 'MyLokalni-MetaBot/1.0' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const json = await res.json();
      const d = json.data ?? json;
      const name = [d.imie, d.nazwisko].filter(Boolean).join(' ');
      if (name) title = `${name} – specjalista | MyLokalni.pl`;
      if (d.bio) description = String(d.bio).slice(0, 200);
      if (d.profilowe) imageUrl = d.profilowe;
      else if (d.zdjecieTla) imageUrl = d.zdjecieTla;
    }
  } catch {
    // zostają wartości domyślne
  }

  const safeTitle = escapeHtml(title);
  const safeDesc  = escapeHtml(description);
  const safeImage = escapeHtml(imageUrl);
  const safeUrl   = escapeHtml(`${FRONTEND_URL}/profile/${uid}`);

  const spaRes = await context.next();
  let html = await spaRes.text();

  html = html
    .replace(/<title>[^<]*<\/title>/,
      `<title>${safeTitle}</title>`)
    .replace(/<meta property="og:title"[^>]*>/g,
      `<meta property="og:title" content="${safeTitle}" />`)
    .replace(/<meta property="og:description"[^>]*>/g,
      `<meta property="og:description" content="${safeDesc}" />`)
    .replace(/<meta property="og:image"[^>]*>/g,
      `<meta property="og:image" content="${safeImage}" />`)
    .replace(/<meta property="og:url"[^>]*>/g,
      `<meta property="og:url" content="${safeUrl}" />`)
    .replace(/<meta name="twitter:title"[^>]*>/g,
      `<meta name="twitter:title" content="${safeTitle}" />`)
    .replace(/<meta name="twitter:image"[^>]*>/g,
      `<meta name="twitter:image" content="${safeImage}" />`)
    .replace(/<link rel="canonical"[^>]*>/g,
      `<link rel="canonical" href="${safeUrl}" />`);

  return new Response(html, {
    status: spaRes.status,
    headers: { 'Content-Type': 'text/html;charset=UTF-8' },
  });
}
