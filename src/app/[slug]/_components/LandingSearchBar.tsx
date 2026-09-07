'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { ALL_CITIES, CITY_DISPLAY, LANDING_SLUGS } from '@/lib/seo-data';

interface Props {
    defaultKeyword: string;
    defaultCity: string;
}

function toSlug(text: string): string {
    return text.toLowerCase()
        .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e').replace(/ł/g, 'l')
        .replace(/ń/g, 'n').replace(/ó/g, 'o').replace(/ś/g, 's').replace(/ź/g, 'z').replace(/ż/g, 'z')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function LandingSearchBar({ defaultKeyword, defaultCity }: Props) {
    const router = useRouter();
    const [keyword, setKeyword] = useState(defaultKeyword);
    const [city, setCity] = useState(defaultCity);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const kwSlug = toSlug(keyword.trim());
        const citySlug = city
            ? (Object.keys(CITY_DISPLAY).find(k => CITY_DISPLAY[k] === city) ?? toSlug(city))
            : null;

        if (citySlug && LANDING_SLUGS.has(`${kwSlug}-${citySlug}`)) {
            router.push(`/${kwSlug}-${citySlug}`);
        } else if (LANDING_SLUGS.has(kwSlug)) {
            router.push(`/${kwSlug}`);
        } else if (citySlug && LANDING_SLUGS.has(citySlug)) {
            router.push(`/${citySlug}`);
        } else {
            router.push(`/?q=${encodeURIComponent(keyword.trim())}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-6 bg-white rounded-2xl shadow-md p-2 flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2 flex-1 px-3 py-1">
                <Search size={18} className="text-gray-400 shrink-0" />
                <input
                    type="text"
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                    placeholder="Np. Hydraulik, Elektryk..."
                    className="flex-1 text-sm text-gray-900 placeholder-gray-400 outline-none bg-transparent"
                />
            </div>
            <div className="border-t sm:border-t-0 sm:border-l border-gray-100 px-3 py-1">
                <select
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="text-sm text-gray-700 outline-none bg-transparent w-full sm:w-40"
                >
                    <option value="">Cała Polska</option>
                    {ALL_CITIES.map(c => (
                        <option key={c} value={CITY_DISPLAY[c]}>{CITY_DISPLAY[c]}</option>
                    ))}
                </select>
            </div>
            <button
                type="submit"
                className="bg-[#6366F1] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shrink-0"
            >
                Szukaj
            </button>
        </form>
    );
}
