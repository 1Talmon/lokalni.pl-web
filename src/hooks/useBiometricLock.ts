// Biometric lock is a native-only feature. On web: always unlocked.
export const isLoggedInFromStorage = () => localStorage.getItem('is_logged_in') === 'true';

export const useBiometricLock = () => ({
    locked: false,
    verify: async () => {},
    verifying: false,
    forceUnlock: () => {},
});
