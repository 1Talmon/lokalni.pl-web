'use client';
import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import Supercluster from 'supercluster';
import { AnimatePresence } from 'framer-motion';
import type { Service } from '../../types';
import { CITY_COORDS } from '../../data/constants';
import { isRemoteService } from '../../utils/serviceUtils';
import { makeLKOverlay, type ILKOverlay } from './MapOverlay';
import { ServiceBottomSheet, ClusterBottomSheet } from './MapBottomSheets';
import { POLAND, POLAND_ZOOM, MAP_STYLES } from './constants';
import type { MapViewProps, MarkerSpec } from './types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getCoords = (city: string, location?: { lat: number; lng: number } | null) => {
    if (location?.lat !== undefined && location?.lat !== null && location?.lng !== undefined && location?.lng !== null) {
        return location as { lat: number; lng: number };
    }
    const s = CITY_COORDS[city] ?? CITY_COORDS['default'] ?? '52.07,19.48';
    const [lat, lng] = s.split(',').map(Number);
    return { lat: lat ?? 52.07, lng: lng ?? 19.48 };
};

const matchCity = (query?: string): string | undefined => {
    if (!query) return undefined;
    if (CITY_COORDS[query]) return query;
    const q = query.toLowerCase();
    return Object.keys(CITY_COORDS).find((k) => k.toLowerCase() === q || k.toLowerCase().startsWith(q));
};

// ─── Supercluster types ───────────────────────────────────────────────────────

type SCProps = { idx: number };
type SCIndex = Supercluster<SCProps>;

type Selected =
    | { type: 'service'; service: Service }
    | { type: 'city'; city: string; services: Service[] }
    | null;

// ─── Component ───────────────────────────────────────────────────────────────

export const MapView = ({
    services,
    onServiceClick,
    centerCity,
    hoveredServiceId,
    onBoundsChange,
    onMarkerSelect,
    onMapReady,
}: MapViewProps) => {
    const localServices = useMemo(
        () => services.filter(
            (s) => !isRemoteService(s) &&
                s.location?.lat !== undefined &&
                s.location?.lat !== null,
        ),
        [services],
    );

    const mapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string | undefined;
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: mapsKey ?? '',
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    const outerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<ILKOverlay | null>(null);
    const scRef = useRef<SCIndex | null>(null);
    const clusterPosRef = useRef<Map<number, { lat: number; lng: number }>>(new Map());
    const isProgrammaticRef = useRef(false);
    const pendingIdleListenerRef = useRef<google.maps.MapsEventListener | null>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [selected, setSelected] = useState<Selected>(null);

    // ── Supercluster index — rebuilt when service list changes ──────────────
    useEffect(() => {
        if (localServices.length === 0) {
            scRef.current = null;
            return;
        }
        const index = new Supercluster<SCProps>({ radius: 60, maxZoom: 17, minPoints: 2 });
        index.load(
            localServices.map((s, i) => {
                const { lat, lng } = getCoords(s.city, s.location);
                return {
                    type: 'Feature' as const,
                    geometry: { type: 'Point' as const, coordinates: [lng, lat] },
                    properties: { idx: i },
                };
            }),
        );
        scRef.current = index;
        clusterPosRef.current.clear();
        if (mapLoaded) updateMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [localServices]);

    // ── Compute clusters and push to overlay ────────────────────────────────
    const updateMarkers = useCallback(() => {
        const map = mapRef.current;
        const overlay = overlayRef.current;
        const sc = scRef.current;
        if (!map || !overlay) return;

        const bounds = map.getBounds();
        const zoom = map.getZoom();
        if (!bounds || zoom === undefined || zoom === null) return;

        if (!sc || localServices.length === 0) {
            overlay.update([]);
            return;
        }

        const bbox: [number, number, number, number] = [
            bounds.getSouthWest().lng(),
            bounds.getSouthWest().lat(),
            bounds.getNorthEast().lng(),
            bounds.getNorthEast().lat(),
        ];

        const rawClusters = sc.getClusters(bbox, Math.floor(zoom));

        const specs: MarkerSpec[] = (rawClusters as Array<typeof rawClusters[number]>).flatMap((cluster): MarkerSpec[] => {
            const [lng, lat] = cluster.geometry.coordinates;

            const props = cluster.properties as { cluster?: boolean; cluster_id?: number; point_count?: number } & SCProps;
            if (props.cluster) {
                const cid = props.cluster_id!;
                const count = props.point_count;
                clusterPosRef.current.set(cid, { lat, lng });
                let city: string | undefined;
                try {
                    const leaves = sc.getLeaves(cid, 5);
                    const cities = [...new Set(leaves.map((l) => localServices[l.properties.idx]?.city).filter(Boolean))];
                    if (cities.length === 1) city = cities[0] as string;
                } catch { /* ignore */ }
                return [{ id: `c-${cid}`, lat, lng, type: 'cluster' as const, count, city }];
            } else {
                const svc = localServices[props.idx];
                if (!svc) return [];
                return [{ id: `s-${svc.publicId ?? svc.id}`, lat, lng, type: 'price' as const, service: svc }];
            }
        });

        overlay.update(specs);

        if (onBoundsChange) {
            const visible = localServices.filter((s) => {
                const { lat, lng } = getCoords(s.city, s.location);
                return bounds.contains({ lat, lng });
            });
            onBoundsChange(visible);
        }
    }, [localServices, onBoundsChange]);

    // ── Marker click handler — stable ref avoids stale closures in overlay ──
    const onClickRef = useRef<(id: string) => void>();
    onClickRef.current = (id: string) => {
        const map = mapRef.current;
        const overlay = overlayRef.current;
        const sc = scRef.current;
        if (!map) return;

        if (id.startsWith('c-')) {
            if (!sc) return;
            const cid = parseInt(id.slice(2), 10);
            const pos = clusterPosRef.current.get(cid);
            if (!pos) return;
            try {
                const expansionZoom = sc.getClusterExpansionZoom(cid);
                if (expansionZoom > 17) {
                    const leaves = sc.getLeaves(cid, Infinity);
                    const clusterServices = leaves
                        .map((l) => localServices[l.properties.idx])
                        .filter(Boolean) as Service[];
                    const city = clusterServices[0]?.city ?? '';
                    setSelected({ type: 'city', city, services: clusterServices });
                    onMarkerSelect?.({ type: 'city', city, services: clusterServices });
                } else {
                    // Zbuduj bounds ze wszystkich liści klastra — fitBounds animuje
                    // natywnie (pan + zoom jednocześnie), działa tak samo przy każdym kliknięciu
                    const clusterBounds = new google.maps.LatLngBounds();
                    try {
                        const leaves = sc.getLeaves(cid, Infinity);
                        for (const leaf of leaves) {
                            const svc = localServices[leaf.properties.idx];
                            if (svc) {
                                const { lat: lLat, lng: lLng } = getCoords(svc.city, svc.location);
                                clusterBounds.extend({ lat: lLat, lng: lLng });
                            }
                        }
                    } catch { /* ignore */ }

                    // Jeśli bounds to punkt (wszystkie liście na tym samym miejscu) —
                    // dodaj małą ramkę, żeby fitBounds nie zoomował do max
                    if (clusterBounds.getNorthEast().lat() === clusterBounds.getSouthWest().lat() &&
                        clusterBounds.getNorthEast().lng() === clusterBounds.getSouthWest().lng()) {
                        const d = 0.003;
                        clusterBounds.extend({ lat: pos.lat + d, lng: pos.lng + d });
                        clusterBounds.extend({ lat: pos.lat - d, lng: pos.lng - d });
                    }

                    overlay?.update([]);

                    // Anuluj poprzedni pending listener (szybkie kolejne kliknięcia)
                    pendingIdleListenerRef.current?.remove();
                    isProgrammaticRef.current = true;

                    map.fitBounds(clusterBounds, 80);

                    pendingIdleListenerRef.current = google.maps.event.addListenerOnce(map, 'idle', () => {
                        pendingIdleListenerRef.current = null;
                        isProgrammaticRef.current = false;
                        updateMarkers();
                    });
                }
            } catch { /* ignore */ }

        } else if (id.startsWith('s-')) {
            const publicId = id.slice(2);
            const svc = localServices.find((s) => s.publicId === publicId);
            if (!svc) return;
            setSelected({ type: 'service', service: svc });
            onMarkerSelect?.({ type: 'service', service: svc });
            overlay?.setSelected(id);
        }
    };

    // ── Map lifecycle ───────────────────────────────────────────────────────
    const onLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        const overlay = makeLKOverlay((id) => onClickRef.current?.(id));
        overlay.setMap(map);
        overlayRef.current = overlay;
        setMapLoaded(true);
        onMapReady?.(map);
    }, [onMapReady]);

    const onUnmount = useCallback(() => {
        pendingIdleListenerRef.current?.remove();
        pendingIdleListenerRef.current = null;
        overlayRef.current?.setMap(null);
        overlayRef.current = null;
        mapRef.current = null;
        setMapLoaded(false);
    }, []);

    const onIdle = useCallback(() => {
        if (isProgrammaticRef.current) return;
        updateMarkers();
    }, [updateMarkers]);

    // ── Sync selected → overlay visual ─────────────────────────────────────
    useEffect(() => {
        overlayRef.current?.setSelected(
            selected?.type === 'service' ? `s-${selected.service.publicId}` : null,
        );
    }, [selected]);

    // ── Sync hovered → overlay ──────────────────────────────────────────────
    useEffect(() => {
        overlayRef.current?.setHovered(hoveredServiceId ? `s-${hoveredServiceId}` : null);
    }, [hoveredServiceId]);

    // ── ResizeObserver ──────────────────────────────────────────────────────
    useEffect(() => {
        const el = outerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            if (mapRef.current && el.offsetHeight > 0) {
                window.google?.maps.event.trigger(mapRef.current, 'resize');
            }
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // ── Double-tap zoom + drag-to-zoom (mobile) ─────────────────────────────
    useEffect(() => {
        const el = outerRef.current;
        if (!el || !isLoaded) return;

        let lastTapTime = 0;
        let lastTapY = 0;
        let dragActive = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let dragStartZoom = 10;
        let didDrag = false;

        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length !== 1) { dragActive = false; return; }
            const now = Date.now();
            const { clientX: x, clientY: y } = e.touches[0];
            if (now - lastTapTime < 300 && Math.abs(y - lastTapY) < 40) {
                e.preventDefault();
                e.stopPropagation();
                dragActive = true;
                dragStartX = x;
                dragStartY = y;
                dragStartZoom = mapRef.current?.getZoom() ?? 10;
                didDrag = false;
                lastTapTime = 0;
            } else {
                lastTapTime = now;
                lastTapY = y;
                dragActive = false;
            }
        };

        const onTouchMove = (e: TouchEvent) => {
            if (!dragActive || e.touches.length !== 1) return;
            e.preventDefault();
            e.stopPropagation();
            const dy = dragStartY - e.touches[0].clientY;
            if (Math.abs(dy) > 5) {
                didDrag = true;
                mapRef.current?.setZoom(Math.max(3, Math.min(20, dragStartZoom + dy / 60)));
            }
        };

        const onTouchEnd = () => {
            if (dragActive && !didDrag) {
                const map = mapRef.current;
                if (map) {
                    const z = map.getZoom() ?? 10;
                    const bounds = map.getBounds();
                    if (bounds) {
                        const rect = map.getDiv().getBoundingClientRect();
                        const ne = bounds.getNorthEast();
                        const sw = bounds.getSouthWest();
                        map.panTo({
                            lat: ne.lat() - (ne.lat() - sw.lat()) * ((dragStartY - rect.top) / rect.height),
                            lng: sw.lng() + (ne.lng() - sw.lng()) * ((dragStartX - rect.left) / rect.width),
                        });
                    }
                    map.setZoom(Math.min(20, z + 1));
                }
            }
            dragActive = false;
        };

        el.addEventListener('touchstart', onTouchStart, { passive: false, capture: true });
        el.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
        el.addEventListener('touchend', onTouchEnd);
        return () => {
            el.removeEventListener('touchstart', onTouchStart, { capture: true });
            el.removeEventListener('touchmove', onTouchMove, { capture: true });
            el.removeEventListener('touchend', onTouchEnd);
        };
    }, [isLoaded]);

    // ── Pan to centerCity ───────────────────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const matched = matchCity(centerCity);
        if (matched) {
            const cityCoords = getCoords(matched);
            const cityServices = localServices.filter((s) => s.city === matched);
            if (cityServices.length >= 2) {
                const bounds = new google.maps.LatLngBounds();
                for (const s of cityServices) {
                    const { lat, lng } = getCoords(s.city, s.location);
                    bounds.extend({ lat, lng });
                }
                // Jeśli wszystkie serwisy mają te same współrzędne (brak GPS) — fallback
                const ne = bounds.getNorthEast();
                const sw = bounds.getSouthWest();
                if (ne.lat() === sw.lat() && ne.lng() === sw.lng()) {
                    map.panTo(cityCoords);
                    map.setZoom(11);
                } else {
                    // Na mobile bottom sheet zakrywa ~35% ekranu — padding asymetryczny
                    const isMobile = window.innerWidth < 768;
                    const padding = isMobile
                        ? { top: 40, right: 20, bottom: Math.round(window.innerHeight * 0.35), left: 20 }
                        : 80;
                    map.fitBounds(bounds, padding);
                }
            } else {
                map.panTo(cityCoords);
                map.setZoom(11);
            }
        } else if (!centerCity) {
            map.panTo(POLAND);
            map.setZoom(POLAND_ZOOM);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [centerCity, mapLoaded]);

    // ── Render ──────────────────────────────────────────────────────────────
    if (!mapsKey) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 rounded-2xl gap-3 text-gray-400">
                <p className="text-sm font-semibold">Mapa niedostępna</p>
                <p className="text-xs text-center px-6">
                    Brak klucza <code className="bg-gray-100 px-1 rounded">VITE_GOOGLE_MAPS_KEY</code>
                </p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center" style={{ background: '#e8edf5' }}>
                <div className="flex flex-col items-center gap-3">
                    <div className="w-9 h-9 rounded-full border-[3px] border-slate-200 border-t-indigo-500 animate-spin" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Ładowanie mapy…
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={outerRef}
            style={{
                position: 'relative', width: '100%', height: '100%',
                borderRadius: 'inherit', overflow: 'hidden',
                WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)',
            }}
        >
            <GoogleMap
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={POLAND}
                zoom={POLAND_ZOOM}
                options={{
                    disableDefaultUI: true,
                    styles: MAP_STYLES,
                    gestureHandling: 'greedy',
                    clickableIcons: false,
                }}
                onLoad={onLoad}
                onUnmount={onUnmount}
                onIdle={onIdle}
                onClick={() => {
                    setSelected(null);
                    overlayRef.current?.setSelected(null);
                    onMarkerSelect?.(null);
                }}
            />

            <AnimatePresence>
                {selected && !onMarkerSelect && (
                    selected.type === 'service' ? (
                        <ServiceBottomSheet
                            key="svc"
                            svc={selected.service}
                            onView={(s) => { onServiceClick(s); setSelected(null); }}
                            onClose={() => { setSelected(null); overlayRef.current?.setSelected(null); }}
                        />
                    ) : (
                        <ClusterBottomSheet
                            key="city"
                            city={selected.city}
                            services={selected.services}
                            onView={(s) => { onServiceClick(s); setSelected(null); }}
                            onClose={() => setSelected(null)}
                        />
                    )
                )}
            </AnimatePresence>
        </div>
    );
};
