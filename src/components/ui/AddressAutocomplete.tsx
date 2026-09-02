'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin } from 'lucide-react';

interface AddressResult {
    label: string;
    lat: number;
    lng: number;
}

interface AddressAutocompleteProps {
    value: string;
    onChange: (val: string) => void;
    onSelect: (label: string, lat: number, lng: number) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    disabled?: boolean;
    city?: string;
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/public/address`;

export const AddressAutocomplete = ({
    value,
    onChange,
    onSelect,
    placeholder = "Wpisz ulicę i numer...",
    className = "",
    inputClassName = "",
    disabled = false,
    city,
}: AddressAutocompleteProps) => {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<AddressResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value === query) return;
        setQuery(value);
        if (value) setSelected(true); // programmatic set (e.g. edit modal) — don't trigger search
    }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (selected) return;
        const timer = setTimeout(async () => {
            if (query.length < 3) { setResults([]); setIsOpen(false); return; }
            try {
                const cityParam = city?.trim() ? `&city=${encodeURIComponent(city.trim())}` : '';
                const res = await fetch(`${API_BASE}?query=${encodeURIComponent(query)}${cityParam}`);
                const json = await res.json() as { data: AddressResult[] };
                setResults(json.data ?? []);
                if ((json.data ?? []).length > 0) setIsOpen(true);
            } catch { setResults([]); }
        }, 350);
        return () => clearTimeout(timer);
    }, [query, selected, city]);

    const handleSelect = (r: AddressResult) => {
        setQuery(r.label);
        onChange(r.label);
        onSelect(r.label, r.lat, r.lng);
        setSelected(true);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className={`relative w-full ${className}`}>
            <input
                type="text"
                value={query}
                disabled={disabled}
                onChange={e => {
                    setQuery(e.target.value);
                    onChange(e.target.value);
                    setSelected(false);
                }}
                onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                onBlur={() => {
                    setTimeout(() => {
                        if (!selected && results.length > 0) handleSelect(results[0]);
                        setIsOpen(false);
                    }, 150);
                }}
                placeholder={placeholder}
                spellCheck={false}
                className={`w-full outline-none bg-transparent placeholder-gray-400 font-medium text-gray-900 ${inputClassName}`}
            />
            <AnimatePresence>
                {isOpen && results.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-xl mt-3 overflow-hidden z-[100] border border-gray-100 max-h-52 overflow-y-auto custom-scrollbar min-w-[220px]"
                    >
                        <ul>
                            {results.map((r, i) => (
                                <li
                                    key={i}
                                    onClick={() => handleSelect(r)}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-none border-gray-50 flex items-start gap-3"
                                >
                                    <MapPin size={14} className="text-indigo-400 mt-0.5 shrink-0" />
                                    <span className="text-sm text-gray-700">{r.label}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
