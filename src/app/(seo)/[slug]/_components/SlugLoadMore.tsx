'use client';
import { useState, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { ServiceCardSSR } from '@/components/ui/ServiceCardSSR';
import type { Service } from '@/types';

interface SlugLoadMoreProps {
    slug: string;
    initialCount: number;
    hasMore: boolean;
}

export function SlugLoadMore({ slug, initialCount, hasMore: initialHasMore }: SlugLoadMoreProps) {
    const [extra, setExtra] = useState<Service[]>([]);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [isPending, startTransition] = useTransition();

    const loadMore = () => {
        startTransition(async () => {
            const offset = initialCount + extra.length;
            try {
                const res = await fetch(`/api/slug-services?slug=${encodeURIComponent(slug)}&offset=${offset}`);
                if (!res.ok) return;
                const data: Service[] = await res.json();
                setExtra(prev => [...prev, ...data]);
                setHasMore(data.length === 24);
            } catch {
                // silent
            }
        });
    };

    if (!hasMore && extra.length === 0) return null;

    return (
        <>
            {extra.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mt-4">
                    {extra.map((service) => (
                        <ServiceCardSSR key={service.publicId} service={service} priority={false} />
                    ))}
                </div>
            )}
            {hasMore && (
                <div className="flex justify-center mt-10">
                    <button
                        onClick={loadMore}
                        disabled={isPending}
                        className="flex items-center gap-2 px-8 py-3 bg-[#6366F1] text-white font-bold rounded-2xl hover:bg-[#4F46E5] transition-colors disabled:opacity-60"
                    >
                        {isPending && <Loader2 size={16} className="animate-spin" />}
                        Załaduj więcej
                    </button>
                </div>
            )}
        </>
    );
}
