import { logger } from '../utils/logger';
import { tokenUtils } from '../utils/tokenUtils';
import { secureStorage } from '../utils/secureStorage';


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mylokalni.pl/api';

const handleFatalError = (): void => {
    tokenUtils.clearAll();
    // Zamiast window.location.href (hard reload) — event pozwala React sam wyczyścić
    // stan i nawigować. Na iOS hard reload zostawia natywne elementy (tab bar, CTA, NavBar)
    // widoczne przez cały czas ładowania nowej strony.
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:logout-required'));
    }
};

let _refreshingToken: Promise<string | null> | null = null;

export const refreshAccessToken = (): Promise<string | null> => {
    if (_refreshingToken) return _refreshingToken;

    _refreshingToken = (async () => {
        try {
            const rt = await secureStorage.getRefreshToken();
            const body: Record<string, string> = {};
            if (rt) body.refreshToken = rt;
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });
            const result = await response.json() as { token?: string; refreshToken?: string };
            if (response.ok && result.token) {
                tokenUtils.set(result.token);
                if (result.refreshToken) {
                    await secureStorage.setRefreshToken(result.refreshToken);
                }
                return result.token;
            }
            return null;
        } catch {
            return null;
        } finally {
            _refreshingToken = null;
        }
    })();

    return _refreshingToken;
};

const request = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
    // Użyj tokenUtils zamiast surowego localStorage
    const token = tokenUtils.get();

    const hasBody = options.body !== null && options.body !== undefined;
    const headers: Record<string, string> = {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(options.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
        ...options,
        headers,
        credentials: 'include',
    };

    let response = await fetch(`${API_URL}${endpoint}`, config);

    if (response.status === 401) {
        logger.info('apiClient: token wygasł, próba odświeżenia');
        const newToken = await refreshAccessToken();

        if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(`${API_URL}${endpoint}`, { ...config, headers });
        } else {
            logger.warn('apiClient: odświeżanie nie powiodło się, wylogowuję');
            handleFatalError();
            return response;
        }
    }

    return response;
};

// Callable function + named methods — supports both apiClient(url) and apiClient.get(url)
function apiClientFn(endpoint: string): Promise<Response> {
    return request(endpoint, { method: 'GET' });
}

apiClientFn.get = (endpoint: string) =>
    request(endpoint, { method: 'GET' });

apiClientFn.post = (endpoint: string, body: Record<string, unknown>) =>
    request(endpoint, { method: 'POST', body: JSON.stringify(body) });

apiClientFn.patch = (endpoint: string, body: Record<string, unknown>) =>
    request(endpoint, { method: 'PATCH', body: JSON.stringify(body) });

apiClientFn.put = (endpoint: string, body: Record<string, unknown>) =>
    request(endpoint, { method: 'PUT', body: JSON.stringify(body) });

apiClientFn.delete = (endpoint: string, body?: Record<string, unknown>) =>
    request(endpoint, { method: 'DELETE', ...(body ? { body: JSON.stringify(body) } : {}) });

// Dla multipart/form-data (upload) — bez Content-Type, fetch ustawi go sam z boundary.
// FormData jest replayable (referencja pozostaje ważna), więc obsługujemy 401 tak samo jak request().
apiClientFn.postFormData = async (endpoint: string, body: FormData, signal?: AbortSignal): Promise<Response> => {
    const token = tokenUtils.get();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body,
        credentials: 'include',
        signal,
    });

    if (response.status === 401) {
        logger.info('apiClient.postFormData: token wygasł, próba odświeżenia');
        const newToken = await refreshAccessToken();
        if (newToken) {
            headers['Authorization'] = `Bearer ${newToken}`;
            response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers,
                body,
                credentials: 'include',
                signal,
            });
        } else {
            logger.warn('apiClient.postFormData: odświeżanie nie powiodło się, wylogowuję');
            handleFatalError();
        }
    }

    return response;
};

apiClientFn.request = request;

export const apiClient = apiClientFn;
