/**
 * tokenUtils — in-memory JWT store (XSS-safe).
 *
 * Access tokens are NEVER written to localStorage. They live only in this
 * module-level variable for the lifetime of the tab/process. On page refresh
 * the token is gone; useAppLogic does a silent refresh via the httpOnly
 * refreshToken cookie to restore it.
 */

import { logger } from './logger';

interface JWTPayload {
    exp?: number;
    iat?: number;
    sub?: string;
    uid?: string;
    email?: string;
}

let _memToken: string | null = null;

const isValidJWTFormat = (token: string): boolean => {
    const parts = token.split('.');
    return parts.length === 3 && parts.every(p => p.length > 0);
};

const decodePayload = (token: string): JWTPayload | null => {
    try {
        if (!isValidJWTFormat(token)) return null;
        const payload = token.split('.')[1];
        const padded = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(
            payload.length + (4 - payload.length % 4) % 4, '='
        );
        return JSON.parse(atob(padded)) as JWTPayload;
    } catch {
        logger.warn('tokenUtils: nie można zdekodować tokenu');
        return null;
    }
};

export const tokenUtils = {
    /** Store access token in memory only — never persisted to localStorage. */
    set(token: string): void {
        _memToken = token;
    },

    /** Read access token from memory. Returns null on page refresh (expected). */
    get(): string | null {
        if (!_memToken) return null;
        if (!isValidJWTFormat(_memToken)) {
            logger.warn('tokenUtils: nieprawidłowy format tokenu w pamięci');
            _memToken = null;
            return null;
        }
        return _memToken;
    },

    /** Clear the in-memory token (called on logout). */
    clear(): void {
        _memToken = null;
    },

    /** Clear ALL auth state: in-memory token + localStorage auth flags. */
    clearAll(): void {
        _memToken = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('user_profile');
            localStorage.removeItem('is_logged_in');
        }
        logger.info('tokenUtils: sesja wyczyszczona');
    },

    isValid(token: string | null): boolean {
        if (!token || typeof token !== 'string') return false;
        return isValidJWTFormat(token);
    },

    isExpired(token: string | null): boolean {
        if (!token) return true;
        const payload = decodePayload(token);
        if (!payload?.exp) return false;
        return Date.now() / 1000 > payload.exp - 30;
    },

    getExpiryDate(token: string | null): Date | null {
        if (!token) return null;
        const payload = decodePayload(token);
        if (!payload?.exp) return null;
        return new Date(payload.exp * 1000);
    },

    getUid(token: string | null): string | null {
        if (!token) return null;
        const payload = decodePayload(token);
        return payload?.uid ?? payload?.sub ?? null;
    },

    getIfFresh(): string | null {
        const token = this.get();
        if (!token) return null;
        if (this.isExpired(token)) {
            logger.info('tokenUtils: token wygasł');
            return null;
        }
        return token;
    },
};
