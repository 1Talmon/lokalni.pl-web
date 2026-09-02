import { CITY_COORDS } from '../data/constants';

export const parsePrice = (price: string): number => {
  const parsed = parseInt(price)
  return isNaN(parsed) ? 0 : parsed
}

export const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export const getMapUrl = (city: string, radiusKm: number) => {
    const coords = CITY_COORDS[city] || CITY_COORDS['default'];
    const [lat, lon] = coords.split(',').map(parseFloat);
    
    // Zabezpieczenie minimalnego promienia dla widoczności (min 2km)
    const effectiveRadius = Math.max(radiusKm, 2);

    // Obliczamy BBOX tak, aby wysokość mapy to było ok. 4x promień
    const latSpan = (effectiveRadius * 4) / 111; 
    const lonSpan = latSpan / Math.cos(lat * (Math.PI / 180)); 

    const minLat = lat - (latSpan / 2);
    const maxLat = lat + (latSpan / 2);
    const minLon = lon - (lonSpan / 2);
    const maxLon = lon + (lonSpan / 2);

    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLon}%2C${minLat}%2C${maxLon}%2C${maxLat}&layer=mapnik&marker=${lat}%2C${lon}`;
}

// NOWA FUNKCJA: Tworzenie przyjaznych linków
export const createSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
        .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
        .replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
        .replace(/[^a-z0-9]+/g, '-') // Zamień znaki specjalne na myślnik
        .replace(/^-+|-+$/g, '');   // Usuń myślniki z brzegów
}

export const createServiceUrl = (title: string, publicId: string): string => {
  return `${createSlug(title)}-${publicId}`
}

export const polishPlural = (n: number, singular: string, pluralNom: string, pluralGen: string): string => {
    if (n % 10 === 1 && n % 100 !== 11) return singular;
    if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return pluralNom;
    return pluralGen;
};