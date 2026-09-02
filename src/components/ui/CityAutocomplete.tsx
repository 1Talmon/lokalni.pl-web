'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { CityResult } from '../../types';
import { cityService } from '../../services/cityService';
import { logger } from '../../utils/logger';

interface CityOptionGroup {
    type: 'group' | 'subgroup';
    name: string;
    members: CityResult[];
    count: number;
    isLeaf?: boolean;
}

// --- KOMPONENT WIDOKU (Input + Dropdown) ---
interface CityAutocompleteProps {
    value: string;
    onChange: (val: string) => void;
    onSelect: (val: string) => void;
    onSelectWithCoords?: (name: string, lat: number, lng: number) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
}

export const CityAutocomplete = ({
    value,
    onChange,
    onSelect,
    onSelectWithCoords,
    placeholder = "Wpisz miasto...",
    className = "",
    inputClassName = ""
}: CityAutocompleteProps) => {
    const [query, setQuery] = useState(value);
    const [, setResults] = useState<CityResult[]>([]);

    // Stan widoku
    const [viewOptions, setViewOptions] = useState<CityOptionGroup[]>([]);
    const [historyStack, setHistoryStack] = useState<CityOptionGroup[][]>([]);
    const [isDrillDown, setIsDrillDown] = useState(!!value);
    const [drillLevel, setDrillLevel] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const wrapperRef = useRef<HTMLDivElement>(null);
    // Refy trzymają aktualne wartości bez stale-closure w setTimeout
    const isDrillDownRef = useRef(!!value);
    const queryRef = useRef(value);

    useEffect(() => {
        if (value === query) return; // zmiana pochodzi od użytkownika — rodzic odbitał wartość, ignoruj
        setQuery(value);
        if (value) setIsDrillDown(true); // programatyczne ustawienie (np. edycja) — blokuj auto-search
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Synchronizuj refy przy każdym renderze (bez stale closure w setTimeout)
    isDrillDownRef.current = isDrillDown;
    queryRef.current = query;

    // --- LOGIKA WYSZUKIWANIA ---
    useEffect(() => {
        if (query.length < 2 || isDrillDown) {
            if (query.length < 2) {
                setResults([]);
                setViewOptions([]);
                setIsOpen(false);
                setLoading(false);
            }
            return;
        }
        setIsOpen(true);
        setLoading(true);
        setViewOptions([]);
        const timer = setTimeout(() => fetchData(query), 300);
        return () => clearTimeout(timer);
    }, [query, isDrillDown]); // eslint-disable-line react-hooks/exhaustive-deps

    const fetchData = async (q: string) => {
        try {
            const data = await cityService.searchCities(q);
            setResults(data);
            processInitialGrouping(data);
        } catch (error) {
            logger.error('CityAutocomplete fetch error', error);
        } finally {
            setLoading(false);
        }
    };

    const processInitialGrouping = (cities: CityResult[]) => {
        const groups: Record<string, CityResult[]> = {};
        cities.forEach(city => {
            const nameKey = city.nazwa.trim();
            if (!groups[nameKey]) groups[nameKey] = [];
            groups[nameKey].push(city);
        });
        const options: CityOptionGroup[] = Object.keys(groups).map(name => ({
            type: 'group' as const, name: name, members: groups[name], count: groups[name].length
        }));
        setViewOptions(options);
        setHistoryStack([]);
        setDrillLevel(0);
    };

    const enterDrillDown = (members: CityResult[], level: number, _parentName: string) => {
        setHistoryStack(prev => [...prev, viewOptions]);
        const subGroups: Record<string, CityResult[]> = {};
        members.forEach(m => {
            const parts = m.label.split(',').map(s => s.trim());
            const key = parts[level] || parts[parts.length - 1]; 
            if (!subGroups[key]) subGroups[key] = [];
            subGroups[key].push(m);
        });
        const newOptions: CityOptionGroup[] = Object.keys(subGroups).map(key => ({
            type: 'subgroup' as const, name: key, members: subGroups[key], count: subGroups[key].length, isLeaf: subGroups[key].length === 1
        }));
        setViewOptions(newOptions);
        setDrillLevel(level + 1);
        setIsDrillDown(true);
    };

    const handleBack = () => {
        if (historyStack.length === 0) return;
        const previousView = historyStack[historyStack.length - 1];
        setViewOptions(previousView);
        setHistoryStack(prev => prev.slice(0, -1));
        setDrillLevel(prev => prev - 1);
        if (historyStack.length === 1) setIsDrillDown(false); 
    };

    const handleSelectCity = (city: CityResult) => {
        isDrillDownRef.current = true; // synchronicznie, przed setTimeout z onBlur
        setIsDrillDown(true);
        setQuery(city.nazwa);
        queryRef.current = city.nazwa;
        onChange(city.nazwa);
        onSelect(city.nazwa);
        if (onSelectWithCoords && city.lat !== null && city.lat !== undefined && city.lng !== null && city.lng !== undefined) {
            onSelectWithCoords(city.nazwa, city.lat, city.lng);
        }
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className={`relative w-full ${className}`}>
            <input
                type="text"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    onChange(e.target.value);
                    setIsDrillDown(false);
                }}
                onFocus={() => { if (viewOptions.length > 0) setIsOpen(true); }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        if (viewOptions.length > 0) {
                            const first = viewOptions[0];
                            if (first.type === 'group' && first.count === 1) {
                                handleSelectCity(first.members[0]);
                            } else if (first.type === 'subgroup' && first.isLeaf) {
                                handleSelectCity(first.members[0]);
                            } else {
                                onSelect(query);
                                setIsOpen(false);
                                setIsDrillDown(true);
                            }
                        } else if (query.trim().length >= 2) {
                            onSelect(query.trim());
                            setIsDrillDown(true);
                        }
                    }
                    if (e.key === 'Escape') {
                        setIsOpen(false);
                    }
                }}
                onBlur={() => {
                    // Używamy refów zamiast stanu — zawsze aktualny snapshot
                    setTimeout(() => {
                        if (!isDrillDownRef.current && queryRef.current.trim().length >= 2) {
                            onSelect(queryRef.current.trim());
                            isDrillDownRef.current = true;
                            setIsDrillDown(true);
                        }
                        setIsOpen(false);
                    }, 150);
                }}
                className={`w-full outline-none bg-transparent placeholder-gray-400 font-medium text-gray-900 ${inputClassName}`}
                placeholder={placeholder}
                spellCheck={false}
            />

            <AnimatePresence>
                {isOpen && (loading || viewOptions.length > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-xl mt-3 overflow-hidden z-[100] border border-gray-100 max-h-60 overflow-y-auto custom-scrollbar min-w-[200px]"
                    >
                        {loading && (
                            <ul>
                                {[1, 2, 3].map(i => (
                                    <li key={i} className="px-4 py-3 border-b last:border-none border-gray-50">
                                        <div className={`h-3 rounded-full bg-gray-200 animate-pulse mb-1.5 ${i === 1 ? 'w-28' : i === 2 ? 'w-20' : 'w-24'}`} />
                                        <div className="h-2 rounded-full bg-gray-100 animate-pulse w-36" />
                                    </li>
                                ))}
                            </ul>
                        )}
                        {!loading && drillLevel > 0 && (
                            <div
                                onClick={handleBack}
                                className="sticky top-0 bg-gray-50 border-b border-gray-100 px-4 py-2 text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 flex items-center gap-1 z-10"
                            >
                                <ArrowLeft size={12} /> Wróć
                            </div>
                        )}
                        {!loading && <ul>
                            {viewOptions.map((opt, idx) => {
                                if (opt.type === 'group') {
                                    return (
                                        <li key={`${opt.name}-${idx}`} onClick={() => { if (opt.count === 1) handleSelectCity(opt.members[0]); else enterDrillDown(opt.members, 1, opt.name); }} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-none border-gray-50">
                                            <div className="flex justify-between items-center"><span className="font-bold text-gray-700">{opt.name}</span>{opt.count > 1 && (<span className="bg-indigo-100 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-bold">{opt.count}</span>)}</div>
                                            {opt.count === 1 ? (<div className="text-xs text-gray-400 mt-0.5">{opt.members[0].label}</div>) : (<div className="text-xs text-gray-400 mt-0.5 truncate">Wybierz województwo...</div>)}
                                        </li>
                                    );
                                }
                                return (
                                    <li key={`${opt.name}-${idx}`} onClick={() => { if (opt.isLeaf) handleSelectCity(opt.members[0]); else enterDrillDown(opt.members, drillLevel, opt.name); }} className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-none border-gray-50 flex justify-between items-center">
                                        <div><div className="text-sm font-bold text-gray-700">{opt.name}</div>{opt.isLeaf && (<div className="text-[10px] text-gray-400 italic">{opt.members[0].label}</div>)}</div>
                                        {!opt.isLeaf ? <ChevronRight size={16} className="text-gray-300" /> : <span className="text-indigo-600 text-xs font-bold">Wybierz</span>}
                                    </li>
                                );
                            })}
                        </ul>}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};