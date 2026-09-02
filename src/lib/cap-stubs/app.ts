export const App = {
    addListener: async (_event: string, _handler: (info: { url: string }) => void) => ({ remove: async () => {} }),
    removeAllListeners: async () => {},
    exitApp: async () => {},
    minimizeApp: async () => {},
    getLaunchUrl: async (): Promise<{ url: string } | null> => null,
    getInfo: async () => ({ id: '', name: '', build: '', version: '' }),
    getState: async () => ({ isActive: true }),
};
