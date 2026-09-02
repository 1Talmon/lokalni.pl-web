import { CityResult } from '../types';
import { logger } from '../utils/logger';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.mylokalni.pl/api'}/public/cities`;

const toResult = (name: string, lat?: number, lng?: number, label?: string): CityResult => ({
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    nazwa: name,
    label: label || name,
    lat,
    lng,
});

export const cityService = {
    async searchCities(query: string): Promise<CityResult[]> {
        try {
            const response = await fetch(`${API_URL}?query=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('Błąd API wyszukiwania');
            const json = await response.json();
            const rows = (json.data ?? []) as { name: string; label?: string; lat?: number; lng?: number }[];
            return rows.map(r => toResult(r.name, r.lat, r.lng, r.label));
        } catch (error) {
            logger.error("City search error", error);
            return [];
        }
    },

    async getCityByLocation(lat: number, lon: number): Promise<CityResult | null> {
        try {
            const response = await fetch(`${API_URL}/reverse-geocode?lat=${lat}&lon=${lon}`);
            if (!response.ok) {
                if (response.status === 404) return null;
                throw new Error('Błąd API geolokalizacji');
            }
            const data = await response.json() as { city: string };
            return toResult(data.city);
        } catch (error) {
            logger.error("Geo search error", error);
            return null;
        }
    }
};