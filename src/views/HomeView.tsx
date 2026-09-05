'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Geolocation } from '@capacitor/geolocation';
import { usePlatform } from '../hooks/usePlatform';
import { Search, Filter, ArrowUpDown, MapPin, Star, CreditCard, MessageCircle, Globe, X, ChevronDown, Check, LocateFixed, Loader2 } from 'lucide-react';
import { useState, useMemo, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ClientPortal } from '../components/ui/ClientPortal';
import { CityAutocomplete } from '../components/ui/CityAutocomplete';
import { cityService } from '../services/cityService';
import { ServiceSearchAutocomplete } from '../components/ui/ServiceSearchAutocomplete';
import { ImageWithSkeleton } from '../components/ui/ImageWithSkeleton';
import { Service, Category } from '../types';
import { createServiceUrl } from '../utils/helpers';
import { MobileMapSheet } from '../components/map/MobileMapSheet';
import { UserAvatar } from '../components/ui/UserAvatar';
import { serviceService, mapApiService } from '../services/serviceService';
import { apiClient } from '../services/apiClient';


// ── Custom sort dropdown — zastępuje brzydki natywny <select> na Androidzie ──
type SortBy = 'rating' | 'price-low' | 'distance' | 'verified';
const SORT_OPTS: { value: SortBy; label: string }[] = [
    { value: 'rating',    label: 'Polecane'   },
    { value: 'distance',  label: 'Odległość'  },
    { value: 'price-low', label: 'Cena'       },
    { value: 'verified',  label: 'Sprawdzeni' },
];
const SortDropdown = ({ value, onChange }: { value: SortBy; onChange: (v: SortBy) => void }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, [open]);
    const label = SORT_OPTS.find(o => o.value === value)?.label ?? 'Polecane';
    return (
        <div ref={ref} className="relative shrink-0 ml-3">
            <button
                onClick={() => setOpen(p => !p)}
                className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm active:bg-gray-50 transition-colors"
            >
                <ArrowUpDown size={13} className="text-gray-400 shrink-0" />
                <span className="text-xs font-bold text-gray-700 whitespace-nowrap">{label}</span>
                <ChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${open ? '-rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.ul
                        initial={{ opacity: 0, y: -6, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.96 }}
                        transition={{ duration: 0.14, ease: 'easeOut' }}
                        className="absolute right-0 top-[calc(100%+6px)] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 min-w-[150px] py-1"
                    >
                        {SORT_OPTS.map(opt => (
                            <li key={opt.value}>
                                <button
                                    onClick={() => {
                                        onChange(opt.value);
                                        setOpen(false);
                                        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
                                    }}
                                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold transition-colors ${
                                        opt.value === value
                                            ? 'text-[#6366F1] bg-indigo-50'
                                            : 'text-gray-700 active:bg-gray-50'
                                    }`}
                                >
                                    {opt.label}
                                    {opt.value === value && <Check size={14} className="text-[#6366F1] shrink-0" />}
                                </button>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

interface HomeViewProps {
    services: Service[];
    categories: Category[];
    activeCategory: string;
    setActiveCategory: (id: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    searchDisplay: string;
    setSearchDisplay: (v: string) => void;
    location: string;
    setLocation: (loc: string) => void;
    setLocationCoords: (coords: { lat: number; lng: number } | null) => void;
    filterType: 'all' | 'offer' | 'request';
    setFilterType: (type: 'all' | 'offer' | 'request') => void;
    sortBy: 'rating' | 'price-low' | 'distance' | 'verified';
    setSortBy: (sort: 'rating' | 'price-low' | 'distance' | 'verified') => void;
    loadedCount: number;
    setLoadedCount: React.Dispatch<React.SetStateAction<number>>;
    onServiceClick: (service: Service) => void;
    onToggleFavorite: (id: string) => void;
    onStartChat: (service: Service, msg?: string) => void | Promise<void>;
    favorites: string[] | number[];
    isLoggedIn: boolean;
    showOnlineOnly: boolean;
    setShowOnlineOnly: (val: boolean) => void;
}

const HomeView = ({
    services,
    categories,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    searchDisplay,
    setSearchDisplay,
    location,
    setLocation,
    setLocationCoords,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    loadedCount,
    setLoadedCount,
    onServiceClick,
    onToggleFavorite: _onToggleFavorite,
    onStartChat,
    favorites: _favorites,
    isLoggedIn,
    showOnlineOnly,
    setShowOnlineOnly
}: HomeViewProps) => {
    const { isNative, isIos } = usePlatform();

    const { data: recommendedData } = useQuery({
        queryKey: ['recommended', isLoggedIn],
        queryFn:  () => serviceService.getRecommendedServices(),
        staleTime: 5 * 60 * 1000,
    });
    const recommendedServices = useMemo(() => (recommendedData?.data ?? []) as unknown as Service[], [recommendedData?.data]);

    // Wstrzyknij rekomendacje na górę gridu gdy brak aktywnych filtrów (bez duplikatów)
    const displayServices = useMemo(() => {
        const noFilters = !searchQuery && activeCategory === 'all' && filterType === 'all' && !showOnlineOnly && !location;
        if (!noFilters || recommendedServices.length === 0) return services;
        const existingIds = new Set(services.map(s => s.publicId));
        const newRecs = recommendedServices.filter(s => !existingIds.has(s.publicId)).slice(0, 6);
        return [...newRecs, ...services];
    }, [recommendedServices, services, searchQuery, activeCategory, filterType, showOnlineOnly, location]);

    const [showMap, setShowMap] = useState(false);
    const pathname = usePathname();
    useEffect(() => { if (pathname !== '/') setShowMap(false); }, [pathname]);

    const [, setHoveredServiceId] = useState<string | null>(null);
    const queryClient = useQueryClient();
    const prefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleCardMouseEnter = (publicId: string) => {
        setHoveredServiceId(publicId);
        if (isNative) return; // na mobile nie ma hover
        prefetchTimerRef.current = setTimeout(() => {
            queryClient.prefetchQuery({
                queryKey: ['service', publicId],
                queryFn: async () => {
                    const res = await apiClient.get(`/services/${publicId}`);
                    if (!res.ok) throw new Error(`server_${res.status}`);
                    const json = await res.json();
                    return mapApiService(json.data ?? json);
                },
                staleTime: 10 * 60 * 1000,
            });
        }, 150);
    };
    const handleCardMouseLeave = () => {
        setHoveredServiceId(null);
        if (prefetchTimerRef.current) clearTimeout(prefetchTimerRef.current);
    };
    const [, setIsMobile] = useState(false);
    const [isGpsLoading, setIsGpsLoading] = useState(false);
    const heroRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);

    const handleGps = async () => {
        if (isGpsLoading) return;
        setIsGpsLoading(true);
        try {
            const pos = await Geolocation.getCurrentPosition({ timeout: 10000, maximumAge: 60000 });
            const { latitude, longitude } = pos.coords;
            setLocationCoords({ lat: latitude, lng: longitude });
            const result = await cityService.getCityByLocation(latitude, longitude);
            setLocation(result ? result.nazwa : 'Moja okolica');
        } catch {
            // user denied or error
        } finally {
            setIsGpsLoading(false);
        }
    };

    const handleSortChange = (newSort: typeof sortBy) => {
        setSortBy(newSort);
        if (newSort === 'distance' && !location) handleGps();
    };

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);


    useEffect(() => {
        const p = new URLSearchParams(window.location.search);
        if (p.get('from') === 'lp') {
            window.history.replaceState({}, '', '/');
            setTimeout(() => {
                document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
            }, 500);
        }
    }, []);

    const handleSearchClick = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchDisplay.trim()) {
            setSearchQuery('');
            setSearchDisplay('');
            setActiveCategory('all');
        }
        const resultsSection = document.getElementById('results-section');
        resultsSection?.scrollIntoView({ behavior: 'smooth' });
    };

    const nextBatchToPreload = services.slice(loadedCount, loadedCount + 24);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && services.length > loadedCount) {
                    setLoadedCount(c => c + 24);
                }
            },
            { rootMargin: '400px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [services.length, loadedCount, setLoadedCount]);

    // Klucz animacji wymuszający przerysowanie przy zmianie filtrów
    const animationKey = `${filterType}-${activeCategory}-${showOnlineOnly}-${location}-${sortBy}`;

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ duration: 0.3 }}
            className="pb-24 md:pb-32"
        >
        
        {/* HERO SECTION */}
        <div ref={heroRef} className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white py-8 md:py-16 px-4 md:px-6 rounded-b-[2rem] md:rounded-b-[3rem] shadow-2xl mb-6 md:mb-8 relative">
          
          <div className="absolute inset-0 overflow-hidden rounded-b-[2rem] md:rounded-b-[3rem] pointer-events-none">
              <div className="absolute top-[-10%] right-[-5%] w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
              <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-indigo-900 opacity-20 rounded-full blur-3xl"></div>
          </div>

          <div className="max-w-7xl mx-auto text-center md:text-left relative z-10">
            <h1 className="text-3xl md:text-6xl font-black mb-3 md:mb-4 leading-tight">
                Znajdź specjalistę <br className="hidden md:block"/> w swojej okolicy.
            </h1>
            <p className="text-white/90 text-base md:text-lg mb-8">
                Tysiące usługodawców czeka na Twoje zlecenie
            </p>
            
            <div className="bg-white rounded-2xl p-3 md:p-4 shadow-xl relative z-50">
              
              <form onSubmit={handleSearchClick} className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-100 relative">
                
                {/* 1. INPUT WYSZUKIWANIA */}
                <div className="flex-[1.5] w-full text-gray-900 pb-2 md:pb-0 md:pr-4 relative flex flex-col justify-center min-h-[60px] md:min-h-0">
                  <div className="flex items-center gap-2 md:gap-3 mb-1">
                    <Search className="text-gray-400" size={18} />
                    <label className="text-xs md:text-sm text-gray-500 font-medium">Czego szukasz?</label>
                  </div>
                  <div className="relative flex items-center">
                    <ServiceSearchAutocomplete
                        value={searchDisplay}
                        onChange={(v) => { setSearchDisplay(v); setSearchQuery(v); }}
                        onSelect={(phrase, category) => {
                            setSearchDisplay(phrase);
                            setSearchQuery(phrase);
                            if (category && category !== 'all') {
                                setActiveCategory(category);
                                serviceService.trackEvent('search', category);
                            }
                        }}
                        placeholder="Np. hydraulik, lekcje angielskiego..."
                        inputClassName="text-base md:text-lg border-none pr-8"
                    />
                    {searchDisplay && (
                        <button
                            type="button"
                            onClick={() => { setSearchDisplay(''); setSearchQuery(''); setActiveCategory('all'); }}
                            className="absolute right-0 text-gray-300 hover:text-gray-500 transition-colors p-1 z-10"
                        >
                            <X size={18} />
                        </button>
                    )}
                  </div>
                </div>

                {/* 2. LOKALIZACJA */}
                <div className="flex-1 w-full text-gray-900 pt-2 md:pt-0 md:px-4 relative z-10 flex flex-col justify-center min-h-[60px] md:min-h-0">
                    <div className={`flex flex-col justify-center ${showOnlineOnly ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center gap-2 md:gap-3 mb-1">
                            <MapPin className="text-gray-400" size={18} />
                            <label className="text-xs md:text-sm text-gray-500 font-medium">
                                {showOnlineOnly ? "Cała Polska" : "Lokalizacja"}
                            </label>
                        </div>
                        <div className="relative flex items-center">
                            <CityAutocomplete
                                value={location}
                                onChange={setLocation}
                                onSelect={setLocation}
                                onSelectWithCoords={(name, lat, lng) => {
                                    setLocation(name);
                                    setLocationCoords({ lat, lng });
                                }}
                                placeholder="Wpisz miasto..."
                                inputClassName="text-base md:text-lg py-1 pr-11"
                            />
                            {isGpsLoading ? (
                                <span className="absolute right-0 w-11 h-11 flex items-center justify-center">
                                    <Loader2 size={16} className="text-[#6366F1] animate-spin" />
                                </span>
                            ) : location && !showOnlineOnly ? (
                                <button
                                    type="button"
                                    onClick={() => { setLocation(''); setLocationCoords(null); }}
                                    className="absolute right-0 w-11 h-11 flex items-center justify-center text-gray-300 hover:text-gray-500 transition-colors"
                                >
                                    <X size={16}/>
                                </button>
                            ) : !showOnlineOnly ? (
                                <button
                                    type="button"
                                    onClick={handleGps}
                                    title="Użyj mojej lokalizacji"
                                    className="absolute right-0 w-11 h-11 flex items-center justify-center text-gray-300 hover:text-[#6366F1] transition-colors"
                                >
                                    <LocateFixed size={16}/>
                                </button>
                            ) : null}
                        </div>
                    </div>
                </div>

                {/* 3. PRZYCISKI SZUKAJ + MAPA */}
                <div className="pt-2 md:pt-0 md:pl-4 flex gap-2">
                    <button
                        type="submit"
                        className="bg-[#6366F1] text-white px-6 md:px-10 py-3 rounded-xl font-bold text-base md:text-lg hover:bg-[#4F46E5] w-full md:w-auto h-12 md:h-14 shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        <Search size={20} className="hidden md:block"/> Szukaj
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowMap(v => !v)}
                        title={showMap ? 'Ukryj mapę' : 'Pokaż mapę'}
                        className={`h-12 md:h-14 w-12 md:w-14 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center shrink-0 border-2 ${
                            showMap
                                ? 'bg-[#6366F1] border-[#6366F1] text-white shadow-lg'
                                : 'bg-white border-gray-200 text-gray-500 hover:border-[#6366F1] hover:text-[#6366F1]'
                        }`}
                    >
                        <MapPin size={20} />
                    </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* MAPA — modal (wszystkie urządzenia) */}
        <ClientPortal>
            <AnimatePresence>
                {showMap && (
                    <MobileMapSheet
                        key="map-sheet"
                        services={displayServices}
                        onServiceClick={(s) => { setShowMap(false); onServiceClick(s); }}
                        location={location}
                        onClose={() => setShowMap(false)}
                    />
                )}
            </AnimatePresence>
        </ClientPortal>

        {/* KATEGORIE */}
        <div className="px-4 md:px-6 py-4 md:py-6 max-w-7xl mx-auto">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Kategorie</h2>
          <div className="flex gap-3 md:gap-4 overflow-x-auto pt-2 pb-4 md:pb-6 -mx-4 px-4 md:-mx-6 md:px-6 md:grid md:grid-cols-8 md:overflow-visible md:pb-0 scrollbar-hide snap-x">
            {categories.slice(0, 16).map((category) => (
              <button 
                key={category.id} 
                onClick={() => setActiveCategory(category.id)} 
                className={`min-w-[90px] md:min-w-0 p-2 md:p-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 h-24 md:h-28 snap-center border md:hover:-translate-y-1 active:scale-95 ${activeCategory === category.id ? 'bg-gray-900 text-white border-gray-900 shadow-lg' : 'bg-white text-gray-700 border-gray-100 shadow-sm'}`}
              >
                <div className="mb-1 md:mb-2 text-xl md:text-2xl">
                    {category.icon}
                </div>
                <span className="font-semibold text-[10px] md:text-sm text-center leading-tight">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div id="results-section" className="px-4 md:px-6 py-4 md:py-6 max-w-7xl mx-auto">
          {/* FILTRY */}
          <div className="mb-6 md:mb-8">
              {/* Tytuł + Sortowanie */}
              <div className="flex items-center justify-between mb-3 md:mb-5">
                  <h2 className="text-lg md:text-3xl font-bold text-gray-900 leading-tight">
                      {location && !showOnlineOnly ? `Wyniki: ${location}` : 'Polecane usługi'}
                  </h2>
                  {isIos ? (
                      <div className="flex items-center gap-1.5 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm shrink-0 ml-3">
                          <ArrowUpDown size={13} className="text-gray-400 shrink-0" />
                          <select value={sortBy} onChange={(e) => handleSortChange(e.target.value as typeof sortBy)} className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer">
                              <option value="rating">Polecane</option>
                              <option value="distance">Odległość</option>
                              <option value="price-low">Cena</option>
                              <option value="verified">Sprawdzeni</option>
                          </select>
                      </div>
                  ) : (
                      <SortDropdown value={sortBy} onChange={handleSortChange} />
                  )}
              </div>

              {/* Segmented control + Zdalnie */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-0.5">
                  <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                      <button onClick={() => setFilterType('all')} className={`px-3.5 py-1.5 md:px-5 md:py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap active:scale-95 ${filterType === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                          Wszystkie
                      </button>
                      <button onClick={() => setFilterType('offer')} className={`px-3.5 py-1.5 md:px-5 md:py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap active:scale-95 ${filterType === 'offer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                          Oferty
                      </button>
                      <button onClick={() => setFilterType('request')} className={`px-3.5 py-1.5 md:px-5 md:py-2 rounded-lg text-sm font-bold transition-all duration-200 whitespace-nowrap active:scale-95 ${filterType === 'request' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                          Zlecenia
                      </button>
                  </div>

                  <button onClick={() => setShowOnlineOnly(!showOnlineOnly)} style={{ willChange: 'transform' }} className="relative flex items-center gap-1.5 px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl text-sm font-bold active:scale-95 whitespace-nowrap shrink-0">
                      <div style={{ willChange: 'transform' }} className={`absolute inset-0 rounded-xl pointer-events-none transition-colors ${showOnlineOnly ? 'bg-green-50' : 'bg-white'}`} />
                      <div style={{ willChange: 'transform' }} className={`absolute inset-0 rounded-xl border pointer-events-none transition-colors ${showOnlineOnly ? 'border-green-300' : 'border-gray-200'}`} />
                      <div style={{ willChange: 'transform' }} className={`relative w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${showOnlineOnly ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span style={{ willChange: 'transform' }} className={`relative transition-colors ${showOnlineOnly ? 'text-green-700' : 'text-gray-500'}`}>Zdalnie</span>
                  </button>
              </div>
          </div>

          {/* LISTA WYNIKÓW - KRÓL RESPONSYWNOŚCI (ZERO LAGÓW) */}
          <AnimatePresence mode="wait">
             <motion.div
                key={animationKey} 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.1 } }} // Wjazd 0.1s
                exit={{ opacity: 0, transition: { duration: 0.05 } }}  // Wyjazd 0.05s (Błyskawicznie)
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
             >
                {services.length === 0 && (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 md:py-24 bg-white rounded-3xl border border-dashed border-gray-300">
                    <div className="bg-gray-50 p-4 rounded-full mb-4"><Filter size={32} className="text-gray-300" /></div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Brak wyników</h3>
                    <p className="text-gray-400 font-medium text-center max-w-xs">Nie znaleziono usług spełniających Twoje kryteria. Spróbuj zmienić filtry lub lokalizację.</p>
                    <button onClick={() => { setFilterType('all'); setSearchQuery(''); setShowOnlineOnly(false); setLocation(''); }} className="mt-6 text-[#6366F1] font-bold hover:underline">Wyczyść filtry</button>
                  </div>
                )}

                {displayServices.slice(0, loadedCount).map((service, _serviceIndex) => {
                    const isRemote = !!service.isRemote;
                    const isUserActive = service.isOnline === true;
                    const isOffer = (service.type || 'offer') === 'offer';

                    const handleCardClick = (e: React.MouseEvent) => {
                        if (e.ctrlKey || e.metaKey) {
                            window.open(`/service/${createServiceUrl(service.title, service.publicId ?? '')}`, '_blank');
                        } else {
                            onServiceClick(service);
                        }
                    };

                    return (
                      <div
                        key={service.publicId}
                        onClick={handleCardClick}
                        onMouseEnter={() => service.publicId && handleCardMouseEnter(service.publicId)}
                        onMouseLeave={handleCardMouseLeave}
                        className={`relative bg-white rounded-3xl overflow-hidden shadow-lg md:transition-[transform,box-shadow] md:duration-300 md:hover:-translate-y-2 md:hover:shadow-2xl md:hover:z-30 cursor-pointer md:transform-gpu md:will-change-transform ${service.isMine ? 'ring-2 ring-[#6366F1]' : ''}`}
                      >
                        <div className="relative h-48 w-full bg-gray-200">
                            <ImageWithSkeleton src={service.image} alt={service.title} />
                            
                            <div className="absolute top-3 left-3 right-12 flex flex-wrap gap-1.5 z-10 items-start pointer-events-none">
                                {isRemote ? (
                                    <div className="bg-black/80 backdrop-blur text-white px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[10px] md:text-xs font-semibold flex items-center gap-1 shadow-sm shrink-0 max-w-full"><Globe size={10} className="shrink-0"/> <span className="truncate">Zdalnie</span></div>
                                ) : (
                                    <div className="bg-black/80 backdrop-blur text-white px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[10px] md:text-xs font-semibold flex items-center gap-1 shadow-sm shrink-0 max-w-full"><MapPin size={10} className="shrink-0"/> <span className="truncate">{service.city}</span> {service.radius > 0 ? `+${service.radius}km` : ''}</div>
                                )}
                                <div className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[10px] md:text-xs font-semibold flex items-center gap-1 shadow-sm shrink-0 ${isOffer ? 'bg-indigo-500 text-white' : 'bg-violet-600 text-white'}`}>{isOffer ? 'Oferta' : 'Zlecenie'}</div>
                            </div>
                            <div className="absolute bottom-3 right-3 z-10"><div className="bg-white px-3 py-2 md:px-4 md:py-3 rounded-xl shadow-sm text-right"><div className="font-bold text-lg md:text-xl text-gray-900">{service.price} zł</div><div className="text-[10px] md:text-xs text-gray-500">{service.priceUnit}</div></div></div>
                        </div>
                        <div className="p-4 md:p-5">
                          <div className="flex items-start justify-between mb-2 md:mb-3">
                            <div className="flex items-center gap-2 md:gap-3">
                              <div className="relative"><UserAvatar src={service.provider.avatar} name={service.provider.name} size={36} className="rounded-full border-2 border-white shadow" />{isUserActive && (<span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-green-500"></span>)}</div>
                              <div><div className="font-bold text-sm md:text-base text-gray-900">{service.provider.name}</div></div>
                            </div>
                            <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-1 md:px-3 md:py-1.5 rounded-lg"><Star size={12} fill="currentColor" /><span className="font-bold text-xs md:text-sm">{service.rating}</span></div>
                          </div>
                          <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1 md:mb-2 line-clamp-1">{service.title}</h3>
                          <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2 min-h-[32px] md:min-h-[40px]">{service.description}</p>
                          <div className="flex gap-2 md:gap-3">
                            <button onClick={(e) => { e.stopPropagation(); if (isNative) Haptics.impact({ style: ImpactStyle.Medium }); onServiceClick(service); }} className={`flex-1 text-white py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-colors active:scale-95 ${isOffer ? 'bg-gray-900 hover:bg-gray-800' : 'bg-[#6366F1] hover:bg-[#4F46E5]'}`}><CreditCard size={16} /> {isOffer ? 'Zarezerwuj' : 'Zgłoś się'}</button>
                            <button onClick={(e) => { e.stopPropagation(); if (isNative) Haptics.impact({ style: ImpactStyle.Light }); onStartChat(service); }} aria-label={`Napisz do ${service.provider.name}`} className="w-10 md:w-12 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 flex items-center justify-center transition-colors active:scale-95"><MessageCircle size={18} className="text-gray-700" /></button>
                          </div>
                        </div>
                      </div>
                    );
                })}
             </motion.div>
          </AnimatePresence>

          <div ref={sentinelRef} className="h-px" />
        </div>

        <div style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden' }}>
            {nextBatchToPreload.map(service => (
                <img key={`preload-${service.publicId}`} src={service.image} alt="" loading="eager" />
            ))}
        </div>
      </motion.div>
    );
}

export default HomeView;
