export const CAT_COLORS: Record<string, string> = {
    cleaning: '#6366F1', auto: '#F59E0B', home: '#10B981', construction: '#EF4444',
    transport: '#3B82F6', beauty: '#EC4899', tech: '#8B5CF6', edu: '#06B6D4',
    health: '#14B8A6', pets: '#F97316', finance: '#84CC16', care: '#E879F9',
    art: '#F43F5E', events: '#A78BFA', garden: '#22C55E', other: '#94A3B8',
};

export const catColor = (cat: string): string => CAT_COLORS[cat] ?? '#6366F1';

export const POLAND = { lat: 52.07, lng: 19.48 };
export const POLAND_ZOOM = 6;
export const FONT = "'Plus Jakarta Sans',system-ui,-apple-system,sans-serif";

export const MAP_STYLES: google.maps.MapTypeStyle[] = [
    { elementType: 'geometry', stylers: [{ color: '#e8edf5' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff', weight: 3 }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#93c5fd' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#1d4ed8' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#d1fae5' }] },
    { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#e8edf5' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#bbf7d0' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f1f5f9' }] },
    { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fde68a' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#f59e0b' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#92400e' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#94a3b8', weight: 1.5 }] },
    { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#0f172a' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff', weight: 4 }] },
];
