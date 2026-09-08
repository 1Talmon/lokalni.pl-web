'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/providers/AppProvider';
import { ServiceCard } from '@/components/ui/ServiceCard';
import type { Service } from '@/types';

interface SlugPageClientProps {
    services: Service[];
    h1: string;
    slug: string;
    hasMore: boolean;
    totalCount: number;
}

export function SlugPageClient({ services: initial, h1, slug, hasMore: initialHasMore, totalCount }: SlugPageClientProps) {
    const { actions } = useApp();
    const [services, setServices] = useState<Service[]>(initial);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [loading, setLoading] = useState(false);

    const loadMore = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/slug-services?slug=${encodeURIComponent(slug)}&offset=${services.length}`);
            if (!res.ok) throw new Error('fetch failed');
            const data = await res.json() as Service[];
            setServices(prev => [...prev, ...data]);
            setHasMore(data.length === 24);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 pt-6 pb-4">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{h1}</h1>
                {totalCount > 0 && (
                    <p className="text-sm text-gray-500 mt-1">{totalCount} {totalCount === 1 ? 'oferta' : totalCount < 5 ? 'oferty' : 'ofert'}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {services.map((service) => (
                    <ServiceCard
                        key={service.publicId}
                        service={service}
                        onServiceClick={actions.onServiceClick}
                        onStartChat={actions.startChat}
                    />
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center mt-10">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-[#6366F1] text-white font-bold rounded-2xl hover:bg-[#4F46E5] transition-colors disabled:opacity-60"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Załaduj więcej
                    </button>
                </div>
            )}
        </div>
    );
}
