'use client';
import { ArrowLeft, MapPin, Expand, Plus, Minus } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useMotionValue, motion, animate as fmAnimate } from 'framer-motion';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { CITY_COORDS } from '../../data/constants';
import { ClientPortal } from '../../components/ui/ClientPortal';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { MapNavigationButton } from '../../components/ui/MapNavigationButton';

const MAP_STYLES = [
    { elementType: 'geometry', stylers: [{ color: '#f8fafc' }] },
    { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff', weight: 3 }] },
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#7dd3fc' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#0369a1' }] },
    { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#bbf7d0' }] },
    { featureType: 'landscape.man_made', elementType: 'geometry', stylers: [{ color: '#f1f5f9' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#bbf7d0' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e2e8f0' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f1f5f9' }] },
    { featureType: 'road.arterial', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fde68a' }] },
    { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#f59e0b' }] },
    { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#92400e' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#94a3b8', weight: 1.5 }] },
    { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }] },
    { featureType: 'administrative.locality', elementType: 'labels', stylers: [{ visibility: 'on' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#0f172a' }] },
    { featureType: 'administrative.locality', elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff', weight: 4 }] },
    { featureType: 'administrative.neighborhood', elementType: 'labels', stylers: [{ visibility: 'on' }] },
    { featureType: 'administrative.neighborhood', elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
];

const getZoom = (r: number) => {
    if (r <= 1) return 15;
    if (r <= 2) return 14;
    if (r <= 5) return 13;
    if (r <= 15) return 12;
    if (r <= 30) return 11;
    if (r <= 80) return 10;
    return 9;
};

export const ServiceMap = ({ city, address, lat: propLat, lng: propLng, radiusKm, serviceName, providerAvatar, providerName, onExpandedChange, onRegisterControls }: {
    city: string; address?: string | null; lat?: number; lng?: number; radiusKm: number; serviceName?: string; providerAvatar?: string; providerName?: string; onExpandedChange?: (v: boolean) => void; onRegisterControls?: (c: { collapse: () => void; zoomIn: () => void; zoomOut: () => void }) => void;
}) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: (process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY as string | undefined) ?? '',
    });

    const portalMapRef = useRef<google.maps.Map | null>(null);
    const portalDivRef = useRef<HTMLDivElement>(null);
    const portalWrapperRef = useRef<HTMLDivElement>(null);
    const placeholderRef = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [animating, setAnimating] = useState(false);

    const mTop = useMotionValue(-9999);
    const mLeft = useMotionValue(0);
    const mWidth = useMotionValue(300);
    const mHeight = useMotionValue(300);
    const mRadius = useMotionValue(16);

    const raw = CITY_COORDS[city] || CITY_COORDS['default'] || '52.07,19.48';
    const [fallbackLat, fallbackLng] = raw.split(',').map(Number);
    const [geocodedLat, setGeocodedLat] = useState<number | null>(null);
    const [geocodedLng, setGeocodedLng] = useState<number | null>(null);

    useEffect(() => {
        if (!city) return;
        const apiBase = `${process.env.NEXT_PUBLIC_API_URL || '/api'}`;
        if (address) {
            fetch(`${apiBase}/public/address?query=${encodeURIComponent(address + ', ' + city)}`)
                .then(r => r.json())
                .then((json: { data: { lat: number; lng: number }[] }) => {
                    const hit = json.data?.[0];
                    if (hit?.lat) { setGeocodedLat(hit.lat); setGeocodedLng(hit.lng); return; }
                    return fetch(`${apiBase}/public/cities?query=${encodeURIComponent(city)}`);
                })
                .then((r?: Response) => r?.json())
                .then((json?: { data: { lat: number; lng: number }[] }) => {
                    if (!json) return;
                    const hit = json.data?.[0];
                    if (hit?.lat) { setGeocodedLat(hit.lat); setGeocodedLng(hit.lng); }
                })
                .catch(() => {});
        } else if (propLat === null || propLat === undefined || propLng === null || propLng === undefined) {
            fetch(`${apiBase}/public/cities?query=${encodeURIComponent(city)}`)
                .then(r => r.json())
                .then((json: { data: { lat: number; lng: number }[] }) => {
                    const hit = json.data?.[0];
                    if (hit?.lat) { setGeocodedLat(hit.lat); setGeocodedLng(hit.lng); }
                })
                .catch(() => {});
        }
    }, [city, address, propLat, propLng]);

    const lat = address ? (geocodedLat ?? propLat ?? fallbackLat) : (propLat ?? geocodedLat ?? fallbackLat);
    const lng = address ? (geocodedLng ?? propLng ?? fallbackLng) : (propLng ?? geocodedLng ?? fallbackLng);
    const center = { lat, lng };
    const isFixedLocation = radiusKm === 0;
    const effectiveRadius = radiusKm;
    const fixedZoom = address ? 17 : 15;

    const handleExpand = useCallback(() => {
        if (!placeholderRef.current || animating) return;
        requestAnimationFrame(() => {
            if (!placeholderRef.current) return;
            const r = placeholderRef.current.getBoundingClientRect();

            mTop.set(Math.max(0, r.top));
            mLeft.set(r.left);
            mWidth.set(r.width);
            mHeight.set(r.height || 300);
            mRadius.set(16);

            setExpanded(true);
            setAnimating(true);
            onExpandedChange?.(true);
            onRegisterControls?.({
                collapse: handleCollapse,
                zoomIn: () => { const z = portalMapRef.current?.getZoom(); if (z !== undefined) portalMapRef.current?.setZoom(z + 1); },
                zoomOut: () => { const z = portalMapRef.current?.getZoom(); if (z !== undefined) portalMapRef.current?.setZoom(z - 1); },
            });
            portalMapRef.current?.setOptions({ gestureHandling: 'greedy' });

            const isDesktop = window.innerWidth >= 768;
            const targetW = isDesktop ? Math.min(window.innerWidth * 0.9, 768) : window.innerWidth;
            const targetH = isDesktop ? window.innerHeight * 0.85 : window.innerHeight * 0.75;
            const targetTop = isDesktop ? (window.innerHeight - targetH) / 2 : window.innerHeight - targetH;
            const targetLeft = (window.innerWidth - targetW) / 2;
            const tween = { duration: 0.32, ease: 'easeInOut' } as const;
            fmAnimate(mTop, targetTop, tween);
            fmAnimate(mLeft, targetLeft, tween);
            fmAnimate(mWidth, targetW, tween);
            fmAnimate(mHeight, targetH, tween);
            fmAnimate(mRadius, isDesktop ? 24 : 20, tween).then(() => setAnimating(false));
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [animating, mTop, mLeft, mWidth, mHeight, mRadius, onExpandedChange]);

    const handleCollapse = useCallback(() => {
        if (!placeholderRef.current) return;
        const r = placeholderRef.current.getBoundingClientRect();
        portalMapRef.current?.setOptions({ gestureHandling: 'none' });
        if (portalDivRef.current) {
            portalDivRef.current.style.visibility = 'hidden';
            portalDivRef.current.style.opacity = '0';
        }
        mTop.set(r.top);
        mLeft.set(r.left);
        mWidth.set(r.width);
        mHeight.set(r.height || 300);
        mRadius.set(16);
        setExpanded(false);
        setAnimating(false);
        onExpandedChange?.(false);
    }, [mTop, mLeft, mWidth, mHeight, mRadius, onExpandedChange]);

    useEffect(() => {
        if (!expanded) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleCollapse(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [expanded, handleCollapse]);

    if (!isLoaded) {
        return <div className="rounded-2xl bg-slate-100 animate-pulse" style={{ height: 300 }} />;
    }

    const markerIcon: google.maps.Symbol = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: isFixedLocation ? 10 : 8,
        fillColor: '#6366F1', fillOpacity: 1,
        strokeColor: '#ffffff', strokeWeight: 3,
    };

    const placeOverlays = (map: google.maps.Map) => {
        const gm = google.maps;
        new gm.Marker({ position: center, map, icon: markerIcon, clickable: false });
        if (!isFixedLocation) {
            const circle = new gm.Circle({
                center, radius: effectiveRadius * 1000, map,
                fillColor: '#6366F1', fillOpacity: 0.12,
                strokeColor: '#6366F1', strokeWeight: 2.5, strokeOpacity: 0.65, clickable: false,
            });
            const bounds = circle.getBounds() as google.maps.LatLngBounds | null;
            if (bounds) map.fitBounds(bounds, 40);
        }
    };

    const isOpen = expanded || animating;
    const mapOptions = { disableDefaultUI: true, styles: MAP_STYLES, gestureHandling: 'none' as const, clickableIcons: false };

    return (
        <>
            <div
                ref={placeholderRef}
                style={{ height: 300, borderRadius: 16, overflow: 'hidden', position: 'relative' }}
            >
                <div style={{ position: 'absolute', inset: 0, visibility: isOpen ? 'hidden' : 'visible' }}>
                    <GoogleMap
                        mapContainerStyle={{ height: '100%', width: '100%' }}
                        center={center}
                        zoom={isFixedLocation ? fixedZoom : getZoom(effectiveRadius)}
                        options={mapOptions}
                        onLoad={placeOverlays}
                    />
                </div>

                {isOpen && (
                    <div style={{ position: 'absolute', inset: 0, background: '#edf0f5', overflow: 'hidden' }}>
                        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
                            <rect x="60" y="40" width="110" height="70" rx="4" fill="#e2e7ef"/>
                            <rect x="230" y="30" width="90" height="50" rx="4" fill="#e2e7ef"/>
                            <rect x="310" y="100" width="80" height="90" rx="4" fill="#e2e7ef"/>
                            <rect x="40" y="170" width="130" height="80" rx="4" fill="#e2e7ef"/>
                            <rect x="210" y="190" width="100" height="70" rx="4" fill="#e2e7ef"/>
                            <line x1="0" y1="120" x2="400" y2="118" stroke="#fff" strokeWidth="10"/>
                            <line x1="0" y1="120" x2="400" y2="118" stroke="#c8cfe0" strokeWidth="1"/>
                            <line x1="0" y1="165" x2="400" y2="162" stroke="#fff" strokeWidth="6"/>
                            <line x1="0" y1="248" x2="400" y2="250" stroke="#fff" strokeWidth="10"/>
                            <line x1="0" y1="248" x2="400" y2="250" stroke="#c8cfe0" strokeWidth="1"/>
                            <line x1="180" y1="0" x2="182" y2="300" stroke="#fff" strokeWidth="10"/>
                            <line x1="180" y1="0" x2="182" y2="300" stroke="#c8cfe0" strokeWidth="1"/>
                            <line x1="310" y1="0" x2="308" y2="300" stroke="#fff" strokeWidth="6"/>
                            <line x1="80" y1="0" x2="78" y2="300" stroke="#fff" strokeWidth="6"/>
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)', background: '#6366F1', boxShadow: '0 6px 20px rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ transform: 'rotate(45deg)', display: 'flex' }}><MapPin size={20} color="#fff" /></div>
                            </div>
                            <div style={{ background: '#fff', borderRadius: 20, padding: '5px 14px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{city}</div>
                        </div>
                    </div>
                )}

                {!isOpen && (
                    <>
                        <div className="absolute inset-0 cursor-pointer" style={{ zIndex: 1 }} onClick={handleExpand} />
                        <div className="absolute bottom-0 left-0 right-0 z-10 p-3 pointer-events-none">
                            <div className="bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3 pointer-events-auto">
                                <UserAvatar src={providerAvatar} name={providerName || '?'} size={36} className="rounded-xl border border-slate-100 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    {serviceName && <p className="font-bold text-sm text-slate-900 truncate">{serviceName}</p>}
                                    <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} className="text-indigo-400 shrink-0" /> {city}</p>
                                </div>
                                <MapNavigationButton
                                    lat={lat} lng={lng} label={serviceName}
                                    buttonClassName="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-indigo-50 transition-colors"
                                    iconClassName="text-indigo-500"
                                />
                            </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); handleExpand(); }}
                            className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-md flex items-center justify-center hover:bg-white transition-colors">
                            <Expand size={13} className="text-slate-600" />
                        </button>
                    </>
                )}
            </div>

            {isOpen && (
            <ClientPortal>
                <div ref={portalWrapperRef}>
                    <motion.div className="fixed inset-0 bg-black/60" style={{ zIndex: 999999 }}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        transition={{ duration: 0.18 }} onClick={handleCollapse} />

                    <motion.div ref={portalDivRef} style={{
                        position: 'fixed', top: mTop, left: mLeft, width: mWidth, height: mHeight,
                        borderRadius: mRadius, zIndex: 9999999, overflow: 'hidden',
                    }}>
                        <GoogleMap
                            mapContainerStyle={{ height: '100%', width: '100%' }}
                            center={center}
                            zoom={isFixedLocation ? fixedZoom : getZoom(effectiveRadius)}
                            options={{ ...mapOptions, gestureHandling: expanded ? 'greedy' : 'none' }}
                            onLoad={map => { portalMapRef.current = map; placeOverlays(map); }}
                        />

                        <div className="absolute bottom-0 left-0 right-0 z-10 pt-3 px-3 pointer-events-none"
                            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1.25rem)' }}>
                            <div className="bg-white rounded-2xl shadow-lg px-4 py-3.5 flex items-center gap-3 pointer-events-auto">
                                <UserAvatar src={providerAvatar} name={providerName || '?'} size={36} className="rounded-xl border border-slate-100 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    {serviceName && <p className="font-bold text-sm text-slate-900 truncate">{serviceName}</p>}
                                    <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={10} className="text-indigo-400 shrink-0" /> {city}</p>
                                </div>
                                <MapNavigationButton
                                    lat={lat} lng={lng} label={serviceName}
                                    buttonClassName="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center hover:bg-indigo-50 transition-colors"
                                    iconClassName="text-indigo-500"
                                />
                            </div>
                        </div>

                        {expanded && !animating && (
                            <>
                                <button onClick={handleCollapse}
                                    className="absolute top-4 left-4 z-20 w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors">
                                    <ArrowLeft size={18} className="text-slate-700" />
                                </button>
                                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                                    <button onClick={() => { const z = portalMapRef.current?.getZoom(); if (z !== undefined) portalMapRef.current?.setZoom(z + 1); }}
                                        className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors">
                                        <Plus size={18} className="text-slate-700" />
                                    </button>
                                    <button onClick={() => { const z = portalMapRef.current?.getZoom(); if (z !== undefined) portalMapRef.current?.setZoom(z - 1); }}
                                        className="w-10 h-10 bg-white rounded-xl shadow-lg flex items-center justify-center hover:bg-slate-50 transition-colors">
                                        <Minus size={18} className="text-slate-700" />
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            </ClientPortal>
            )}
        </>
    );
};
