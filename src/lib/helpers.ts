export const createSlug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
    .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
    .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const createServiceUrl = (title: string, publicId: string): string =>
  `${createSlug(title)}-${publicId}`;

export const polishPlural = (n: number, singular: string, pluralNom: string, pluralGen: string): string => {
  if (n % 10 === 1 && n % 100 !== 11) return singular;
  if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return pluralNom;
  return pluralGen;
};

export const formatRating = (rating: number): string =>
  rating.toFixed(1).replace('.', ',');
