export const Capacitor = {
    isNativePlatform: () => false,
    getPlatform: () => 'web',
    isPluginAvailable: () => false,
};
export const CapacitorHttp = { request: async () => ({ status: 0, data: null, headers: {} }) };
export const registerPlugin = <T>(_name: string, _impl?: unknown): T =>
    new Proxy({} as object, { get: () => async () => {} }) as unknown as T;
export type PluginListenerHandle = { remove: () => Promise<void> };
