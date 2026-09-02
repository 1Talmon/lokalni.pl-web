type PermissionState = 'prompt' | 'denied' | 'granted';
export const LocalNotifications = {
    requestPermissions: async (): Promise<{ display: PermissionState }> => ({ display: 'denied' }),
    schedule: async (_opts?: unknown) => {},
    cancel: async (_opts?: unknown) => {},
    addListener: async (_event?: string, _handler?: (info: unknown) => void) => ({ remove: async () => {} }),
};
