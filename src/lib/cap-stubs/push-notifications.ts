type PermissionState = 'prompt' | 'denied' | 'granted';
export const PushNotifications = {
    checkPermissions: async (): Promise<{ receive: PermissionState }> => ({ receive: 'denied' }),
    requestPermissions: async (): Promise<{ receive: PermissionState }> => ({ receive: 'denied' }),
    register: async () => {},
    addListener: async (_event?: string, _handler?: (info: unknown) => void) => ({ remove: async () => {} }),
    removeAllListeners: async () => {},
};
