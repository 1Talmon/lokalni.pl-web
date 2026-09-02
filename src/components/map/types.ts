import type { Service } from '../../types';

export type SelectedMarker =
    | { type: 'service'; service: Service }
    | { type: 'city'; city: string; services: Service[] }
    | null;

export interface MapViewProps {
    services: Service[];
    onServiceClick: (service: Service) => void;
    centerCity?: string;
    hoveredServiceId?: string | null;
    onBoundsChange?: (visibleServices: Service[]) => void;
    onMarkerSelect?: (item: SelectedMarker) => void;
    onMapReady?: (map: google.maps.Map) => void;
}

export interface MarkerSpec {
    id: string;
    lat: number;
    lng: number;
    type: 'price' | 'cluster';
    service?: Service;
    count?: number;
    city?: string;
}

export interface MarkerEntry {
    outer: HTMLDivElement;
    pillEl: HTMLElement | null;
    arrowEl: HTMLElement | null;
    lat: number;
    lng: number;
}
