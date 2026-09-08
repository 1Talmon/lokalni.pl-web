'use client';
import { useState, memo } from 'react';
import Image from 'next/image';

export const ImageWithSkeleton = memo(({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <div className="absolute inset-0 w-full h-full bg-gray-200">
            <Image
                src={src}
                alt={alt}
                fill
                priority={priority}
                loading={priority ? 'eager' : 'lazy'}
                onLoad={() => setIsLoaded(true)}
                className={`object-cover block transition-opacity duration-700 ease-in-out ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            />
        </div>
    );
}, (prev, next) => prev.src === next.src && prev.priority === next.priority);