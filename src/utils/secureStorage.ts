// On web, the refresh token lives in an httpOnly cookie — no client-side storage needed.
// These methods are no-ops; they exist so call sites compile without changes.
export const secureStorage = {
    setRefreshToken: async (_token: string): Promise<void> => {},
    getRefreshToken: async (): Promise<string | null> => null,
    removeRefreshToken: async (): Promise<void> => {},
};
