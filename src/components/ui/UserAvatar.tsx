'use client';
import { useState } from 'react';
import { normalizeMediaUrl } from '../../utils/normalizeUrl';

const DEFAULT_AVATAR = '/default-profile-picture.webp';

interface UserAvatarProps {
    src?: string | null;
    name: string;
    size?: number;
    className?: string;
}

export const UserAvatar = ({ src, name, size = 36, className = 'rounded-full' }: UserAvatarProps) => {
    const [primaryFailed, setPrimaryFailed] = useState(false);
    const [fallbackFailed, setFallbackFailed] = useState(false);
    const normalized = normalizeMediaUrl(src) || src || null;

    const base = `shrink-0 overflow-hidden ${className}`;

    if (normalized && !primaryFailed) {
        return (
            <img
                src={normalized}
                alt={name}
                style={{ width: size, height: size }}
                className={`${base} object-cover`}
                onError={() => setPrimaryFailed(true)}
            />
        );
    }

    if (!fallbackFailed) {
        return (
            <img
                src={DEFAULT_AVATAR}
                alt={name}
                style={{ width: size, height: size }}
                className={`${base} object-cover`}
                onError={() => setFallbackFailed(true)}
            />
        );
    }

    const initials = name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
    return (
        <div
            style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
            className={`${base} bg-[#6366F1] text-white font-black select-none flex items-center justify-center`}
        >
            {initials}
        </div>
    );
};
