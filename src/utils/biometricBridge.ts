// Biometric authentication is a native-only feature — no-op on web.
export const BiometricAuth = {
    authenticate: async (_opts?: unknown): Promise<void> => {
        throw new Error('Biometric authentication is not available on web.');
    },
    checkBiometry: async () => ({ isAvailable: false, biometryType: 0, reason: 'web' }),
};
