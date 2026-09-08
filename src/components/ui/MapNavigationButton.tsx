'use client';
import { Navigation } from 'lucide-react';

interface MapNavigationButtonProps {
    lat: number;
    lng: number;
    label?: string | null;
    buttonClassName?: string;
    iconClassName?: string;
    iconSize?: number;
}

export const MapNavigationButton = ({
    lat, lng, label, buttonClassName = '', iconClassName = '', iconSize = 15,
}: MapNavigationButtonProps) => {
    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={buttonClassName}
            title={label ? `Nawiguj do: ${label}` : 'Nawiguj'}
            aria-label={label ? `Nawiguj do: ${label}` : 'Nawiguj'}
        >
            <Navigation size={iconSize} className={iconClassName} />
        </button>
    );
};
