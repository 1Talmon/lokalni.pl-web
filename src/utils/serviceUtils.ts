import { CITY_COORDS } from '../data/constants';
import type { Service } from '../types';

/**
 * Jedyne miejsce w aplikacji decydujące czy usługa jest zdalna.
 * Źródło prawdy: isRemote === true LUB brak miasta.
 * Używaj tej funkcji wszędzie zamiast sprawdzać city/isOnline/isRemote osobno.
 */
export const isRemoteService = (service: Pick<Service, 'isRemote' | 'city'>): boolean =>
    !!service.isRemote || !service.city?.trim();

/**
 * Zwraca koordynaty usługi.
 * Priorytet: location z API → CITY_COORDS (mock fallback).
 */
export const getServiceCoords = (service: { city: string; location?: { lat: number; lng: number } }): [number, number] | null => {
    if (service.location) return [service.location.lat, service.location.lng];
    const raw = CITY_COORDS[service.city];
    return raw ? parseCoords(raw) : null;
};

/**
 * Haversine distance between two lat/lon points in km.
 */
const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const parseCoords = (raw: string): [number, number] | null => {
    const parts = raw.split(',').map(Number);
    if (parts.length !== 2 || parts.some(isNaN)) return null;
    return [parts[0], parts[1]];
};

/**
 * Zwraca odległość w km między dwoma miastami z CITY_COORDS.
 * Zwraca Infinity jeśli któreś miasto jest nieznane.
 */
export const getCityDistanceKm = (city1: string, city2: string): number => {
    const raw1 = CITY_COORDS[city1];
    const raw2 = CITY_COORDS[city2];
    if (!raw1 || !raw2) return Infinity;
    const c1 = parseCoords(raw1);
    const c2 = parseCoords(raw2);
    if (!c1 || !c2) return Infinity;
    return haversineKm(c1[0], c1[1], c2[0], c2[1]);
};

/**
 * Zwraca nazwy miast z CITY_COORDS znajdujących się w podanym promieniu od danego miasta.
 * Przydatne do filtrowania usług "w okolicy".
 */
export const getNearbyCities = (city: string, radiusKm: number = 50): string[] => {
    return Object.keys(CITY_COORDS).filter(c => {
        if (c === city || c === 'default') return false;
        return getCityDistanceKm(city, c) <= radiusKm;
    });
};

/**
 * Sprawdza czy usługa pasuje do szukanej lokalizacji.
 * Uwzględnia: dokładne dopasowanie + miasta w promieniu 60km + usługi zdalne.
 */
export const serviceMatchesLocation = (
    service: Service,
    location: string,
    includeRemote: boolean = true
): boolean => {
    if (!location || location === 'Moja okolica') return true;

    // Usługi zdalne pasują do każdej lokalizacji
    if (includeRemote && isRemoteService(service)) return true;

    const loc = location.trim().toLowerCase();
    const svcCity = service.city?.trim().toLowerCase();

    // Dokładne dopasowanie
    if (svcCity === loc) return true;

    // Częściowe dopasowanie (np. "Gdań" → "Gdańsk")
    if (svcCity?.includes(loc) || loc.includes(svcCity ?? '')) return true;

    // Dopasowanie geograficzne — miasto w promieniu 60km
    const nearbyFromSearch = getNearbyCities(location, 60);
    if (nearbyFromSearch.some(c => c.toLowerCase() === svcCity)) return true;

    return false;
};
