'use client';
import { useRef } from 'react';
import { Navigation } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { ActionSheet, ActionSheetButtonStyle } from '@capacitor/action-sheet';

interface MapNavigationButtonProps {
    lat: number;
    lng: number;
    label?: string | null;
    buttonClassName?: string;
    iconClassName?: string;
    iconSize?: number;
}

const PREF_KEY = 'maps_app_pref';

function openMaps(platform: string, pref: 'apple' | 'google', lat: number, lng: number, q: string) {
    if (pref === 'apple') {
        window.open(`maps://?ll=${lat},${lng}&q=${q || `${lat},${lng}`}`, '_system');
    } else {
        const url = `https://maps.google.com/?q=${lat},${lng}`;
        if (platform === 'web') window.open(url, '_blank');
        else window.open(url, '_system');
    }
}

export const MapNavigationButton = ({
    lat, lng, label, buttonClassName = '', iconClassName = '', iconSize = 15,
}: MapNavigationButtonProps) => {
    const platform = Capacitor.getPlatform();
    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const didLongPress = useRef(false);
    const q = label ? encodeURIComponent(label) : '';

    const showPicker = async (saveChoice: boolean) => {
        if (platform !== 'ios') return;
        const result = await ActionSheet.showActions({
            title: label || 'Nawiguj do miejsca',
            message: saveChoice ? 'Wybór zostanie zapamiętany. Przytrzymaj przycisk aby zmienić.' : undefined,
            options: [
                { title: '🗺️ Apple Maps' },
                { title: '🌐 Google Maps' },
                { title: 'Anuluj', style: ActionSheetButtonStyle.Cancel },
            ],
        });
        if (result.index === 0) {
            if (saveChoice) localStorage.setItem(PREF_KEY, 'apple');
            openMaps(platform, 'apple', lat, lng, q);
        } else if (result.index === 1) {
            if (saveChoice) localStorage.setItem(PREF_KEY, 'google');
            openMaps(platform, 'google', lat, lng, q);
        }
    };

    const handleClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (didLongPress.current) { didLongPress.current = false; return; }

        if (platform === 'ios') {
            const saved = localStorage.getItem(PREF_KEY) as 'apple' | 'google' | null;
            if (saved) {
                openMaps(platform, saved, lat, lng, q);
            } else {
                await showPicker(true);
            }
        } else if (platform === 'android') {
            window.open(`geo:${lat},${lng}?q=${lat},${lng}${q ? `(${q})` : ''}`, '_system');
        } else {
            window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
        }
    };

    const handlePressStart = (_e: React.TouchEvent | React.MouseEvent) => {
        if (platform !== 'ios') return;
        didLongPress.current = false;
        longPressTimer.current = setTimeout(async () => {
            didLongPress.current = true;
            localStorage.removeItem(PREF_KEY);
            await showPicker(true);
        }, 500);
    };

    const handlePressEnd = () => {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            onTouchStart={handlePressStart}
            onTouchEnd={handlePressEnd}
            onMouseDown={handlePressStart}
            onMouseUp={handlePressEnd}
            onMouseLeave={handlePressEnd}
            className={buttonClassName}
            title="Nawiguj"
        >
            <Navigation size={iconSize} className={iconClassName} />
        </button>
    );
};
