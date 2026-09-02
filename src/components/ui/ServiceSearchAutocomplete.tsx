'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight } from 'lucide-react';
import { CATEGORIES_DATA } from '../../data/categories';

interface SuggestResult {
    phrase: string;
    category: string;
    count: number;
}

interface ServiceSearchAutocompleteProps {
    value: string;
    onChange: (val: string) => void;
    onSelect: (label: string, category: string) => void;
    placeholder?: string;
    inputClassName?: string;
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || '/api'}/public/search-suggest`;

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
    CATEGORIES_DATA.filter(c => c.id !== 'all').map(c => [c.id, c.name])
);

export const ServiceSearchAutocomplete = ({
    value,
    onChange,
    onSelect,
    placeholder = "Np. hydraulik, lekcje angielskiego...",
    inputClassName = "",
}: ServiceSearchAutocompleteProps) => {
    const [query, setQuery] = useState(value);
    const [results, setResults] = useState<SuggestResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selected, setSelected] = useState(() => value.length > 0);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value === query) return;
        setQuery(value);
        if (!value) {
            setSelected(false);
        } else {
            // Value set programmatically (e.g. from URL redirect) — don't open dropdown
            setSelected(true);
            setIsOpen(false);
        }
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
        if (selected || query.length < 2) {
            setResults([]);
            setIsOpen(false);
            setLoading(false);
            return;
        }
        setIsOpen(true);
        setLoading(true);
        setResults([]);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`${API_BASE}?query=${encodeURIComponent(query)}`);
                const json = await res.json() as { data: SuggestResult[] };
                setResults(json.data ?? []);
            } catch { setResults([]); }
            finally { setLoading(false); }
        }, 250);
        return () => clearTimeout(timer);
    }, [query, selected]);

    const dominantCategory = useMemo(() => {
        if (!results.length) return null;
        const tally: Record<string, number> = {};
        for (const r of results) tally[r.category] = (tally[r.category] ?? 0) + r.count;
        return Object.entries(tally).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    }, [results]);

    const handleSelect = (r: SuggestResult) => {
        setQuery(r.phrase);
        onChange(r.phrase);
        onSelect(r.phrase, r.category);
        setSelected(true);
        setIsOpen(false);
    };

    const basePhrase = results.length > 0 ? results[0].phrase.split(' ')[0] : '';

    const handleSearchAll = () => {
        setQuery(basePhrase);
        onChange(basePhrase);
        onSelect(basePhrase, '');
        setSelected(true);
        setIsOpen(false);
    };

    const handleSearchInCategory = (category: string) => {
        setQuery(basePhrase);
        onChange(basePhrase);
        onSelect(basePhrase, category);
        setSelected(true);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative w-full">
            <input
                type="text"
                value={query}
                onChange={e => {
                    setQuery(e.target.value);
                    onChange(e.target.value);
                    setSelected(false);
                }}
                onFocus={() => { if (!selected && query.length >= 2) setIsOpen(true); }}
                placeholder={placeholder}
                spellCheck={false}
                className={`w-full outline-none bg-transparent placeholder-gray-400 font-medium ${inputClassName}`}
            />
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-xl mt-3 overflow-hidden z-[100] border border-gray-100 min-w-[220px]"
                    >
                        <ul>
                            {basePhrase && dominantCategory && CATEGORY_LABELS[dominantCategory] && (
                                <li
                                    onClick={() => handleSearchInCategory(dominantCategory)}
                                    className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-100 flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Search size={13} className="text-indigo-500 shrink-0" />
                                        <span className="text-sm text-gray-800 font-medium truncate">
                                            {basePhrase} <span className="text-indigo-500">w: {CATEGORY_LABELS[dominantCategory]}</span>
                                        </span>
                                    </div>
                                    <ChevronRight size={13} className="text-indigo-400 shrink-0" />
                                </li>
                            )}
                            {basePhrase && (
                                <li
                                    onClick={handleSearchAll}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between gap-3 border-b border-gray-100"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Search size={13} className="text-gray-400 shrink-0" />
                                        <span className="text-sm text-gray-600 truncate">
                                            {basePhrase} <span className="text-gray-400">we wszystkich kategoriach</span>
                                        </span>
                                    </div>
                                    <ChevronRight size={13} className="text-gray-300 shrink-0" />
                                </li>
                            )}
                            {loading && [1, 2, 3].map(i => (
                                <li key={i} className="px-4 py-3 border-b last:border-none border-gray-50 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse shrink-0" />
                                        <div className={`h-3 rounded-full bg-gray-200 animate-pulse ${i === 1 ? 'w-32' : i === 2 ? 'w-24' : 'w-28'}`} />
                                    </div>
                                    <div className="w-12 h-4 rounded-full bg-gray-100 animate-pulse shrink-0" />
                                </li>
                            ))}
                            {!loading && results.map((r, i) => (
                                <li
                                    key={i}
                                    onClick={() => handleSelect(r)}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-none border-gray-50 flex items-center justify-between gap-3"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Search size={13} className="text-indigo-400 shrink-0" />
                                        <span className="text-sm text-gray-800 font-medium capitalize">{r.phrase}</span>
                                    </div>
                                    <span className="text-[10px] text-indigo-400 font-bold bg-indigo-50 px-2 py-0.5 rounded-full shrink-0">
                                        {r.count} {r.count === 1 ? 'usługa' : r.count < 5 ? 'usługi' : 'usług'}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
