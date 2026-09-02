'use client';
import { useEffect, Suspense, useState, useCallback, useRef, memo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { MapPin, X, Star, ArrowLeft, Plus, Minus, Globe2, ChevronRight } from 'lucide-react';
import { BottomSheetHandle } from '../ui/BottomSheetHandle';
import type { Service } from '../../types';
import type { SelectedMarker } from '../MapView';

const MapView = dynamic(() => import('../../components/MapView').then(m => ({ default: m.MapView })), { ssr: false });

const F = "'Plus Jakarta Sans',system-ui,-apple-system,sans-serif";
const PRIMARY = '#6366F1';

export const MapFallback = memo(({ services, onServiceClick, location, hoveredServiceId, onBoundsChange, onMarkerSelect, onMapReady }: {
    services: Service[];
    onServiceClick: (s: Service) => void;
    location: string;
    hoveredServiceId?: string | null;
    onBoundsChange?: (visible: Service[]) => void;
    onMarkerSelect?: (item: SelectedMarker) => void;
    onMapReady?: (map: google.maps.Map) => void;
}) => (
    <Suspense fallback={
        <div className="w-full h-full bg-slate-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-slate-400">
                <div className="w-10 h-10 border-[3px] border-slate-200 border-t-indigo-500 rounded-full animate-spin" />
                <span className="text-sm font-semibold">Ładowanie mapy...</span>
            </div>
        </div>
    }>
        <MapView
            services={services}
            onServiceClick={onServiceClick}
            centerCity={location || undefined}
            hoveredServiceId={hoveredServiceId}
            onBoundsChange={onBoundsChange}
            onMarkerSelect={onMarkerSelect}
            onMapReady={onMapReady}
        />
    </Suspense>
));

// ── MOBILE: karta serwisu ─────────────────────────────────────────────────
const ServiceCard = ({ svc, onServiceClick, onClose, onHandleDown }: {
    svc: Service; onServiceClick: (s: Service) => void; onClose: () => void;
    onHandleDown: (e: React.PointerEvent) => void;
}) => (
    <div
        style={{ background: '#fff', fontFamily: F }}
        onClick={e => e.stopPropagation()}
    >
        <BottomSheetHandle onPointerDown={onHandleDown} compact />

        <div style={{ position: 'relative', margin: '0 14px 0', borderRadius: 18, overflow: 'hidden', height: 190 }}>
            <Image src={svc.image} alt="" fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, 400px" />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.65) 0%, transparent 55%)' }} />
            <button
                onClick={onClose}
                className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center text-white border-0 cursor-pointer transition-colors"
                style={{ background: 'rgba(0,0,0,.35)', backdropFilter: 'blur(4px)' }}
            >
                <X size={15} />
            </button>
            <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-.04em', lineHeight: 1 }}>{svc.price}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,.7)', marginLeft: 4 }}>{svc.priceUnit || 'zł'}</span>
                </div>
                {svc.rating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,.45)', borderRadius: 99, padding: '5px 10px' }}>
                        <Star size={11} fill="#fbbf24" color="#fbbf24" />
                        <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{svc.rating}</span>
                    </div>
                )}
            </div>
        </div>

        <div style={{ padding: '14px 16px 0', touchAction: 'none', cursor: 'grab' }} onPointerDown={onHandleDown}>
            <p style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800, color: '#111827', lineHeight: 1.25, letterSpacing: '-.02em', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>
                {svc.title}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{svc.provider.name}</span>
                {svc.city && <>
                    <span style={{ color: '#d1d5db' }}>·</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, color: '#9ca3af' }}><MapPin size={10} />{svc.city}</span>
                </>}
            </div>
        </div>

        <div style={{ padding: '14px 16px 20px' }}>
            <button
                onClick={() => onServiceClick(svc)}
                className="w-full flex items-center justify-center gap-1.5 py-4 rounded-2xl font-black text-white text-sm tracking-wide transition-all active:scale-95 shadow-lg shadow-indigo-200"
                style={{ background: PRIMARY, fontFamily: F, border: 'none', cursor: 'pointer' }}
            >
                Sprawdź ogłoszenie <ChevronRight size={16} strokeWidth={2.5} />
            </button>
        </div>
    </div>
);

// ── MOBILE: karta klastra ─────────────────────────────────────────────────
const ClusterCard = ({ item, onServiceClick, onClose, onHandleDown }: {
    item: { type: 'city'; city: string; services: Service[] };
    onServiceClick: (s: Service) => void; onClose: () => void;
    onHandleDown: (e: React.PointerEvent) => void;
}) => {
    const { city, services } = item;
    const n = services.length;
    return (
        <div
            style={{ background: '#fff', fontFamily: F, display: 'flex', flexDirection: 'column', maxHeight: '40dvh' }}
            onClick={e => e.stopPropagation()}
        >
            <div
                style={{ touchAction: 'none', flexShrink: 0, cursor: 'grab' }}
                onPointerDown={onHandleDown}
            >
                <BottomSheetHandle onPointerDown={onHandleDown} compact />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 16px 12px', borderBottom: '1px solid #f3f4f6' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#111827', letterSpacing: '-.02em' }}>{city !== 'Inne' ? city : 'Różne lokalizacje'}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>{n} {n === 1 ? 'oferta' : n < 5 ? 'oferty' : 'ofert'} w okolicy</p>
                    </div>
                    <button
                        onClick={e => { e.stopPropagation(); onClose(); }}
                        onPointerDown={e => e.stopPropagation()}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-400 shrink-0 border-0 cursor-pointer"
                    >
                        <X size={15} />
                    </button>
                </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', touchAction: 'pan-y', WebkitOverflowScrolling: 'touch', paddingBottom: 16 } as React.CSSProperties}>
                {services.map((s, i) => (
                    <div
                        key={s.publicId}
                        onClick={() => onServiceClick(s)}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderBottom: i < services.length - 1 ? '1px solid #f9fafb' : 'none', cursor: 'pointer' }}
                        onTouchStart={e => { (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
                        onTouchEnd={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                    >
                        <Image src={s.image} alt="" width={64} height={64} style={{ borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: '0 0 3px', fontSize: 14, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                            <p style={{ margin: '0 0 5px', fontSize: 11, color: '#9ca3af' }}>{s.provider.name}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 15, fontWeight: 800, color: '#111827', letterSpacing: '-.02em' }}>{s.price} zł</span>
                                <span style={{ fontSize: 10, color: '#9ca3af' }}>{s.priceUnit}</span>
                                {s.rating > 0 && <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#f59e0b', fontWeight: 700 }}><Star size={10} fill="currentColor" />{s.rating}</span>}
                            </div>
                        </div>
                        <ChevronRight size={15} color="#d1d5db" style={{ flexShrink: 0 }} />
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── MOBILE: domyślna lista ofert widoczna od razu ────────────────────────
const MobileListSheet = ({ services, onServiceClick, onHandleDown }: {
    services: Service[];
    onServiceClick: (s: Service) => void;
    onHandleDown: (e: React.PointerEvent) => void;
}) => {
    const n = services.length;
    return (
        <div style={{ background: '#fff', fontFamily: F }} onClick={e => e.stopPropagation()}>
            <BottomSheetHandle onPointerDown={onHandleDown} compact />
            <div style={{ padding: '4px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#111827', letterSpacing: '-.02em' }}>
                        {n} {n === 1 ? 'oferta' : n < 5 ? 'oferty' : 'ofert'} na mapie
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>Przesuń mapę, aby zaktualizować</p>
                </div>
            </div>
            {n > 0 && (
                <div style={{ overflowY: 'auto', maxHeight: '28dvh', touchAction: 'pan-y' }}>
                    {services.slice(0, 5).map((s) => (
                        <div
                            key={s.publicId}
                            onClick={() => onServiceClick(s)}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderTop: '1px solid #f9fafb', cursor: 'pointer' }}
                            onTouchStart={e => { (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
                            onTouchEnd={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                        >
                            <Image src={s.image} alt="" width={54} height={54} style={{ borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                                <p style={{ margin: '0 0 4px', fontSize: 11, color: '#9ca3af' }}>{s.provider.name}</p>
                                <span style={{ fontSize: 14, fontWeight: 800, color: '#111827', letterSpacing: '-.02em' }}>{s.price} zł</span>
                            </div>
                            <ChevronRight size={14} color="#d1d5db" style={{ flexShrink: 0 }} />
                        </div>
                    ))}
                </div>
            )}
            <div style={{ height: 'env(safe-area-inset-bottom)', background: '#fff' }} />
        </div>
    );
};

// ── MOBILE: wrapper z drag-to-close + safe-area-bottom ───────────────────
const MobileOverlay = ({ selectedItem, onServiceClick, onClose: _onClose, onDeselect }: {
    selectedItem: Exclude<SelectedMarker, null>;
    onServiceClick: (s: Service) => void;
    onClose: () => void;
    onDeselect: () => void;
}) => {
    const dc = useDragControls();
    const handleDown = useCallback((e: React.PointerEvent) => {
        e.stopPropagation();
        dc.start(e);
    }, [dc]);

    // X zawsze cofa: serwis → przywraca klaster (lub null), klaster → null
    const handleClose = onDeselect;

    return (
        <motion.div
            drag="y"
            dragControls={dc}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            dragMomentum={false}
            onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 400) onDeselect(); }}
            style={{ background: '#fff', borderRadius: '2rem 2rem 0 0', overflow: 'hidden', boxShadow: '0 -8px 40px rgba(0,0,0,.16)' }}
        >
            {selectedItem.type === 'service'
                ? <ServiceCard svc={selectedItem.service} onServiceClick={onServiceClick} onClose={handleClose} onHandleDown={handleDown} />
                : <ClusterCard item={selectedItem} onServiceClick={onServiceClick} onClose={handleClose} onHandleDown={handleDown} />
            }
            {/* Safe-area strip — tylko przy kartach, spójny kolor z kartą */}
            <div style={{ height: 'env(safe-area-inset-bottom)', background: '#fff' }} />
        </motion.div>
    );
};

// ── DESKTOP: karta serwisu ────────────────────────────────────────────────
const DesktopServiceCard = ({ service, onServiceClick, onBack }: {
    service: Service; onServiceClick: (s: Service) => void; onBack: () => void;
}) => (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
            <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-500 border-0 cursor-pointer shrink-0">
                <ArrowLeft size={14} />
            </button>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>Wróć do listy</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ position: 'relative', height: 170, overflow: 'hidden' }}>
                <Image src={service.image} alt="" fill style={{ objectFit: 'cover' }} sizes="300px" />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.6) 0%, transparent 55%)' }} />
                <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-.04em' }}>{service.price}</span>
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', marginLeft: 3 }}>{service.priceUnit || 'zł'}</span>
                    </div>
                    {service.rating > 0 && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'rgba(0,0,0,.4)', borderRadius: 99, padding: '3px 8px', fontSize: 11, color: '#fbbf24', fontWeight: 700 }}>
                            <Star size={10} fill="currentColor" />{service.rating}
                        </span>
                    )}
                </div>
            </div>
            <div style={{ padding: '14px 14px 0' }}>
                <p style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: '#111827', lineHeight: 1.3, letterSpacing: '-.02em' }}>{service.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: '#6b7280' }}>{service.provider.name}</span>
                    {service.city && <>
                        <span style={{ color: '#e5e7eb' }}>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#9ca3af' }}><MapPin size={9} />{service.city}</span>
                    </>}
                </div>
                {service.description && (
                    <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6b7280', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 6, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as React.CSSProperties}>
                        {service.description}
                    </p>
                )}
            </div>
        </div>
        <div style={{ padding: '12px 14px 16px', flexShrink: 0, borderTop: '1px solid #f3f4f6' }}>
            <button
                onClick={() => onServiceClick(service)}
                className="w-full flex items-center justify-center gap-1 py-3 rounded-xl font-black text-white text-sm tracking-wide transition-all active:scale-95 shadow-lg shadow-indigo-200 border-0 cursor-pointer"
                style={{ background: PRIMARY, fontFamily: F }}
            >
                Sprawdź ogłoszenie <ChevronRight size={14} />
            </button>
        </div>
    </div>
);

// ── DESKTOP: lista z klastra ───────────────────────────────────────────────
const DesktopCityList = ({ city, services, onServiceClick, onBack }: {
    city: string; services: Service[]; onServiceClick: (s: Service) => void; onBack: () => void;
}) => (
    <div style={{ fontFamily: F, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #f3f4f6', flexShrink: 0 }}>
            <button onClick={onBack} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-500 border-0 cursor-pointer shrink-0">
                <ArrowLeft size={14} />
            </button>
            <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#111827' }}>{city !== 'Inne' ? city : 'Różne lokalizacje'}</p>
                <p style={{ margin: 0, fontSize: 10, color: '#9ca3af' }}>{services.length} {services.length === 1 ? 'oferta' : services.length < 5 ? 'oferty' : 'ofert'}</p>
            </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
            {services.map((s, i) => (
                <div
                    key={s.publicId}
                    onClick={() => onServiceClick(s)}
                    style={{ display: 'flex', gap: 12, padding: '11px 14px', borderBottom: i < services.length - 1 ? '1px solid #f9fafb' : 'none', cursor: 'pointer', transition: 'background .1s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#f9fafb'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                >
                    <Image src={s.image} alt="" width={60} height={60} style={{ borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                        <p style={{ margin: '0 0 5px', fontSize: 11, color: '#9ca3af' }}>{s.provider.name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#111827', letterSpacing: '-.02em' }}>{s.price} zł</span>
                            {s.rating > 0 && <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: '#f59e0b', fontWeight: 700 }}><Star size={9} fill="currentColor" />{s.rating}</span>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ── DESKTOP: lista wszystkich widocznych ──────────────────────────────────
const DesktopList = ({ services, onServiceClick }: { services: Service[]; onServiceClick: (s: Service) => void }) => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="px-4 py-3 border-b border-gray-100 bg-white shrink-0">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                {services.length} {services.length === 1 ? 'oferta' : services.length < 5 ? 'oferty' : 'ofert'} na mapie
            </p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
            {services.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                    <Globe2 size={32} className="text-gray-200 mb-3" />
                    <p className="text-sm font-semibold text-gray-400">Brak ofert w tym obszarze</p>
                    <p className="text-xs text-gray-300 mt-1">Przesuń lub oddal mapę</p>
                </div>
            ) : (
                services.map((s, i) => (
                    <div
                        key={s.publicId}
                        onClick={() => onServiceClick(s)}
                        style={{ display: 'flex', gap: 12, padding: '11px 14px', borderBottom: i < services.length - 1 ? '1px solid #f8fafc' : 'none', cursor: 'pointer', transition: 'background .1s', fontFamily: F }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fafbff'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ''; }}
                    >
                        <Image src={s.image} alt="" width={60} height={60} style={{ borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: '0 0 3px', fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</p>
                            <p style={{ margin: '0 0 5px', fontSize: 11, color: '#94a3b8' }}>{s.provider.name}{s.city ? ` · ${s.city}` : ''}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a', letterSpacing: '-.02em' }}>{s.price} zł</span>
                                <span style={{ fontSize: 10, color: '#94a3b8' }}>{s.priceUnit}</span>
                                {s.rating > 0 && <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: '#f59e0b', fontWeight: 700 }}><Star size={9} fill="currentColor" />{s.rating}</span>}
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    </div>
);

// ── GŁÓWNY KOMPONENT ──────────────────────────────────────────────────────
interface MobileMapSheetProps {
    services: Service[];
    onServiceClick: (s: Service) => void;
    location: string;
    onClose: () => void;
}

export const MobileMapSheet = ({ services, onServiceClick, location, onClose }: MobileMapSheetProps) => {
    const dragControls = useDragControls();
    const listDragControls = useDragControls();
    const [visibleServices, setVisibleServices] = useState<Service[]>(services);
    const [selectedItem, setSelectedItem] = useState<SelectedMarker>(null);
    const [listSheetVisible, setListSheetVisible] = useState(true);
    const mapRef = useRef<google.maps.Map | null>(null);
    const previousClusterRef = useRef<SelectedMarker>(null);
    const visibleServicesRef = useRef<Service[]>(services);

    const handleMapReady = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        // Na mobile przesuń mapę do góry ekranu, żeby domyślny bottom sheet nie zakrywał klastrów
        if (window.innerWidth < 768) {
            setTimeout(() => { map.panBy(0, Math.round(window.innerHeight * 0.14)); }, 350);
        }
    }, []);
    const handleBoundsChange = useCallback((visible: Service[]) => {
        visibleServicesRef.current = visible;
        setVisibleServices(visible);
    }, []);
    const handleMarkerSelect = useCallback((item: SelectedMarker) => {
        setSelectedItem(prev => {
            if (item?.type === 'service') {
                if (prev?.type === 'city') {
                    // drill-down z klastra → zapamiętaj klaster
                    previousClusterRef.current = prev;
                } else {
                    // klik bezpośredni → wirtualny klaster z widocznych serwisów
                    const vs = visibleServicesRef.current;
                    previousClusterRef.current = vs.length > 0
                        ? { type: 'city', city: 'W pobliżu', services: vs }
                        : null;
                }
            } else {
                previousClusterRef.current = null;
            }
            return item;
        });
    }, []);
    const resetView = useCallback(() => {
        if (!mapRef.current) return;
        mapRef.current.panTo({ lat: 52.07, lng: 19.48 });
        mapRef.current.setZoom(6);
    }, []);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    // Sheet wraca gdy odznaczysz marker
    useEffect(() => {
        if (!selectedItem) setListSheetVisible(true);
    }, [selectedItem]);

    // Sheet wraca gdy zmienisz lokalizację
    useEffect(() => {
        setListSheetVisible(true);
    }, [location]);

    // Po kliknięciu markera: przesuń mapę tak, żeby marker był w górnej części ekranu
    // (nad wysuniętym bottom sheetem) — dotyczy tylko mobile
    useEffect(() => {
        if (!selectedItem || !mapRef.current || window.innerWidth >= 768) return;

        let lat: number | null = null;
        let lng: number | null = null;
        let offset: number;

        if (selectedItem.type === 'service') {
            const loc = selectedItem.service.location;
            if (loc?.lat !== null && loc?.lat !== undefined) { lat = loc.lat; lng = loc.lng; }
            offset = Math.round(window.innerHeight * 0.22); // karta serwisu ~380px
        } else {
            const withCoords = selectedItem.services.filter((s: Service) => s.location?.lat !== null && s.location?.lat !== undefined);
            if (withCoords.length) {
                lat = withCoords.reduce((acc: number, s: Service) => acc + s.location!.lat, 0) / withCoords.length;
                lng = withCoords.reduce((acc: number, s: Service) => acc + s.location!.lng, 0) / withCoords.length;
            }
            offset = Math.round(window.innerHeight * 0.28); // karta klastra
        }

        if (lat === null || lng === null) return;
        const fLat = lat, fLng = lng, fOffset = offset;
        const timer = setTimeout(() => {
            if (!mapRef.current) return;
            mapRef.current.panTo({ lat: fLat, lng: fLng });
            mapRef.current.panBy(0, fOffset);
        }, 120);
        return () => clearTimeout(timer);
    }, [selectedItem]);

    const count = selectedItem?.type === 'city' ? selectedItem.services.length : visibleServices.length;
    const countLabel = count === 1 ? 'wynik' : count < 5 ? 'wyniki' : 'wyników';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[200] flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                drag="y"
                dragControls={dragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.25 }}
                dragMomentum={false}
                onDragEnd={(_, info) => { if (info.offset.y > 90 || info.velocity.y > 500) onClose(); }}
                className="w-full md:w-[92vw] md:max-w-5xl flex flex-col rounded-t-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl"
                style={{ height: '92dvh', maxHeight: '92dvh', background: '#fff' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Handle + header mobile */}
                <div
                    className="md:hidden shrink-0 cursor-grab active:cursor-grabbing"
                    style={{ touchAction: 'none' }}
                    onPointerDown={e => dragControls.start(e)}
                >
                    <BottomSheetHandle compact />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px 8px', fontFamily: F }}>
                        <div>
                            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: '-.02em' }}>Mapa ofert</p>
                            <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>{location || 'Cała Polska'} · {count} {countLabel}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-400 border-0 cursor-pointer"
                            onPointerDown={e => e.stopPropagation()}
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>

                {/* Header desktop */}
                <div className="hidden md:flex items-center gap-3 px-5 shrink-0 border-b border-gray-100 bg-white" style={{ height: 54 }}>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center text-gray-500 shrink-0">
                        <X size={16} />
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 text-sm leading-tight">Mapa ofert</p>
                        <p className="text-xs text-gray-400 truncate">{location || 'Cała Polska'} · {count} {countLabel}</p>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Mapa */}
                    <div className="flex-1 overflow-hidden relative">
                        <MapFallback
                            services={services}
                            onServiceClick={onServiceClick}
                            location={location}
                            onBoundsChange={handleBoundsChange}
                            onMarkerSelect={handleMarkerSelect}
                            onMapReady={handleMapReady}
                        />

                        {/* Zoom controls */}
                        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
                            {[
                                { icon: <Plus size={16} />, fn: () => { const z = mapRef.current?.getZoom(); if (z !== undefined) mapRef.current?.setZoom(z + 1); } },
                                { icon: <Minus size={16} />, fn: () => { const z = mapRef.current?.getZoom(); if (z !== undefined) mapRef.current?.setZoom(z - 1); } },
                                { icon: <Globe2 size={16} />, fn: resetView },
                            ].map((b, i) => (
                                <button key={i} onClick={b.fn} className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-50 active:scale-90 transition-all">
                                    {b.icon}
                                </button>
                            ))}
                        </div>

                        {/* Mobile overlay — domyślna lista lub karta markera */}
                        <AnimatePresence mode="wait">
                            {selectedItem ? (
                                <motion.div
                                    key="mob-overlay"
                                    initial={{ y: 80, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 80, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                                    className="absolute bottom-0 left-0 right-0 md:hidden z-20"
                                >
                                    <MobileOverlay
                                        selectedItem={selectedItem}
                                        onServiceClick={onServiceClick}
                                        onClose={onClose}
                                        onDeselect={() => {
                                            const prev = previousClusterRef.current;
                                            previousClusterRef.current = null;
                                            setSelectedItem(prev);
                                        }}
                                    />
                                </motion.div>
                            ) : listSheetVisible ? (
                                <motion.div
                                    key="mob-default"
                                    initial={{ y: 60, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 60, opacity: 0 }}
                                    transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                                    className="absolute bottom-0 left-0 right-0 md:hidden z-20"
                                    drag="y"
                                    dragControls={listDragControls}
                                    dragListener={false}
                                    dragConstraints={{ top: 0, bottom: 0 }}
                                    dragElastic={{ top: 0, bottom: 0.4 }}
                                    dragMomentum={false}
                                    onDragEnd={(_, info) => { if (info.offset.y > 80 || info.velocity.y > 400) setListSheetVisible(false); }}
                                    style={{ boxShadow: '0 -8px 40px rgba(0,0,0,.16)', borderRadius: '2rem 2rem 0 0', overflow: 'hidden', background: '#fff' }}
                                >
                                    <MobileListSheet
                                        services={visibleServices}
                                        onServiceClick={onServiceClick}
                                        onHandleDown={e => { e.stopPropagation(); listDragControls.start(e); }}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="mob-pill"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: 20, opacity: 0 }}
                                    transition={{ duration: 0.18 }}
                                    className="absolute bottom-4 left-0 right-0 md:hidden z-20 flex justify-center"
                                    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                                >
                                    <button
                                        onClick={() => setListSheetVisible(true)}
                                        style={{ background: '#fff', borderRadius: 999, padding: '10px 20px', boxShadow: '0 4px 20px rgba(0,0,0,.18)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: F }}
                                    >
                                        <MapPin size={14} color={PRIMARY} />
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                                            {visibleServices.length} {visibleServices.length === 1 ? 'oferta' : visibleServices.length < 5 ? 'oferty' : 'ofert'} na mapie
                                        </span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Desktop side panel */}
                    <div className="hidden md:flex flex-col w-[290px] shrink-0 border-l border-slate-100 overflow-hidden bg-white">
                        <AnimatePresence mode="popLayout">
                            {selectedItem ? (
                                <motion.div key="sel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} className="flex flex-col h-full overflow-hidden">
                                    {selectedItem.type === 'service'
                                        ? <DesktopServiceCard service={selectedItem.service} onServiceClick={onServiceClick} onBack={() => setSelectedItem(null)} />
                                        : <DesktopCityList city={selectedItem.city} services={selectedItem.services} onServiceClick={onServiceClick} onBack={() => setSelectedItem(null)} />
                                    }
                                </motion.div>
                            ) : (
                                <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} className="flex-1 overflow-hidden">
                                    <DesktopList services={visibleServices} onServiceClick={onServiceClick} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};
