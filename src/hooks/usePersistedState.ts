import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';

const safeParse = <T>(raw: string, fallback: T): T => {
    try {
        const parsed: unknown = JSON.parse(raw);
        // Blokuje prototype pollution — odrzuca obiekty z __proto__ lub constructor
        if (
            typeof parsed === 'object' &&
            parsed !== null &&
            (Object.prototype.hasOwnProperty.call(parsed, '__proto__') ||
             Object.prototype.hasOwnProperty.call(parsed, 'constructor') ||
             Object.prototype.hasOwnProperty.call(parsed, 'prototype'))
        ) {
            logger.warn('usePersistedState: potencjalny atak prototype pollution, ignoruję klucz');
            return fallback;
        }
        return parsed as T;
    } catch {
        return fallback;
    }
};

export function usePersistedState<T>(
    key: string,
    initialValue: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [state, setState] = useState<T>(() => {
        if (typeof window === 'undefined') return initialValue;
        try {
            const item = window.localStorage.getItem(key);
            return item ? safeParse(item, initialValue) : initialValue;
        } catch (error) {
            logger.error('usePersistedState read error', error);
            return initialValue;
        }
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            logger.error('usePersistedState write error', error);
        }
    }, [key, state]);

    return [state, setState];
}
