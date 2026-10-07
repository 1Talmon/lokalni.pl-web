const DEFAULT_TITLE = 'MyLokalni – lokalne usługi od młodych z Twojej okolicy';
const DEFAULT_DESC = 'Zarabiaj na tym, co umiesz, albo znajdź kogoś do pomocy tuż obok. Koszenie trawnika, paznokcie, korepetycje – oferty z cenami, opinie i rezerwacja online.';
const DEFAULT_URL = 'https://mylokalni.pl/';
const DEFAULT_IMAGE = 'https://mylokalni.pl/og-image.png';

function setAttr(selector: string, attr: string, value: string) {
  document.querySelector(selector)?.setAttribute(attr, value);
}

export interface PageMetaOpts {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
}

export function setPageMeta({ title, description, url, image }: PageMetaOpts) {
  const t = title ?? DEFAULT_TITLE;
  const d = description ?? DEFAULT_DESC;
  const u = url ?? DEFAULT_URL;
  const img = image ?? DEFAULT_IMAGE;

  document.title = t;
  setAttr('meta[name="description"]', 'content', d);
  setAttr('meta[property="og:title"]', 'content', t);
  setAttr('meta[property="og:description"]', 'content', d);
  setAttr('meta[property="og:url"]', 'content', u);
  setAttr('meta[property="og:image"]', 'content', img);
  setAttr('meta[name="twitter:title"]', 'content', t);
  setAttr('meta[name="twitter:description"]', 'content', d);
  setAttr('meta[name="twitter:image"]', 'content', img);
  setAttr('link[rel="canonical"]', 'href', u);
}

export function resetPageMeta() {
  setPageMeta({});
}
