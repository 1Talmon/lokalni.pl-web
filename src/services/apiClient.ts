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

export type RefreshOutcome = 'ok' | 'unauthorized' | 'error';

let _refreshing: Promise<RefreshOutcome> | null = null;

/** The one place that refreshes the session: start-up, 401 retries, the WebSocket and downloads all wait on the
 *  same call. Two parallel refreshes with one refresh token look like theft to the API (rotation) → logout.
 *  'unauthorized' = the API refused the session; 'error' = network/server trouble (keep the user signed in). */
export const refreshSession = (): Promise<RefreshOutcome> => {
    if (_refreshing) return _refreshing;

    _refreshing = (async (): Promise<RefreshOutcome> => {
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
            if (response.status === 401 || response.status === 403) return 'unauthorized';
            if (!response.ok) return 'error';
            const result = await response.json() as { token?: string; refreshToken?: string };
            if (!result.token) return 'error';
            tokenUtils.set(result.token);
            if (result.refreshToken) await secureStorage.setRefreshToken(result.refreshToken);
            return 'ok';
        } catch {
            return 'error';
        } finally {
            _refreshing = null;
        }
    })();

    return _refreshing;
};

export const refreshAccessToken = async (): Promise<string | null> =>
    (await refreshSession()) === 'ok' ? tokenUtils.get() : null;

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
        // sent before the session was restored (or by a parallel refresh) → just retry with the new token
        const current = tokenUtils.get();
        const outcome = current && current !== token ? 'ok' : await refreshSession();

        if (outcome === 'ok') {
            headers['Authorization'] = `Bearer ${tokenUtils.get()}`;
            response = await fetch(`${API_URL}${endpoint}`, { ...config, headers });
        } else if (outcome === 'unauthorized') {
            logger.warn('apiClient: sesja odrzucona, wylogowuję');
            handleFatalError();
            return response;
        } else {
            // no network / server hiccup — keep the session, this request just fails
            return response;
        }
    }

    // maintenance mode (panel): let the banner explain why changes are refused
    if (response.status === 503 && typeof window !== 'undefined') {
        response.clone().json().then((b: { code?: string; error?: string }) => {
            if (b?.code === 'MAINTENANCE') window.dispatchEvent(new CustomEvent('mylokalni:maintenance', { detail: b.error }));
        }).catch(() => {});
    }

    return response;
};

// Callable function + named methods — supports both apiClient(url) and apiClient.get(url)
function apiClientFn(endpoint: string): Promise<Response> {
    return request(endpoint, { method: 'GET' });
}

apiClientFn.get = (endpoint: string, init?: Pick<RequestInit, 'signal'>) =>
    request(endpoint, { method: 'GET', ...init });

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
        const current = tokenUtils.get();
        const outcome = current && current !== token ? 'ok' : await refreshSession();
        if (outcome === 'ok') {
            headers['Authorization'] = `Bearer ${tokenUtils.get()}`;
            response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers,
                body,
                credentials: 'include',
                signal,
            });
        } else if (outcome === 'unauthorized') {
            logger.warn('apiClient.postFormData: sesja odrzucona, wylogowuję');
            handleFatalError();
        }
    }

    return response;
};

apiClientFn.request = request;

// Typed JSON wrappers — parsują response i rzucają Error przy !ok.
// Użyj zamiast .get()/.post() gdy chcesz od razu dostać wpisany T bez ręcznego .json().
apiClientFn.getJson = async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
    const res = await request(endpoint, { method: 'GET', ...init });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, string>;
        throw new Error(err.message ?? err.error ?? 'Błąd API');
    }
    return res.json() as Promise<T>;
};

apiClientFn.postJson = async <T>(endpoint: string, body: Record<string, unknown>): Promise<T> => {
    const res = await request(endpoint, { method: 'POST', body: JSON.stringify(body) });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, string>;
        throw new Error(err.message ?? err.error ?? 'Błąd API');
    }
    return res.json() as Promise<T>;
};

apiClientFn.patchJson = async <T>(endpoint: string, body: Record<string, unknown>): Promise<T> => {
    const res = await request(endpoint, { method: 'PATCH', body: JSON.stringify(body) });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, string>;
        throw new Error(err.message ?? err.error ?? 'Błąd API');
    }
    return res.json() as Promise<T>;
};

apiClientFn.deleteJson = async <T>(endpoint: string, body?: Record<string, unknown>): Promise<T> => {
    const res = await request(endpoint, { method: 'DELETE', ...(body ? { body: JSON.stringify(body) } : {}) });
    if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, string>;
        throw new Error(err.message ?? err.error ?? 'Błąd API');
    }
    return res.json() as Promise<T>;
};

export const apiClient = apiClientFn;
