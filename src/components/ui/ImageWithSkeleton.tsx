'use client';
import { useState, memo } from 'react';
import Image from 'next/image';
import { cardImageUrl } from '../../utils/normalizeUrl';

// Card photo: loads the small `_thumb.webp` variant (same URL the SSR shell already fetched, so it
// comes from the browser cache) and falls back to the full photo if a thumbnail is missing.
// `unoptimized`: on Cloudflare Pages /_next/image doesn't resize, it only re-downloads the file.
export const ImageWithSkeleton = memo(({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [useFull, setUseFull] = useState(false);
    const thumb = cardImageUrl(src) ?? src;
    const current = useFull ? src : thumb;

    return (
        <div className="absolute inset-0 w-full h-full bg-gray-200">
            {current && (
                <Image
                    src={current}
                    alt={alt}
                    fill
                    unoptimized
                    priority={priority}
                    loading={priority ? 'eager' : 'lazy'}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => { if (!useFull && thumb !== src) setUseFull(true); }}
                    // Above-the-fold photos show immediately (no fade) — a faded-in image delays LCP
                    className={`object-cover block ${priority ? '' : `transition-opacity duration-500 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}`}
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                />
            )}
        </div>
    );
}, (prev, next) => prev.src === next.src && prev.priority === next.priority);
