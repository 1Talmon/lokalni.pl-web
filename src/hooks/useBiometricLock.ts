import { useState, useEffect, useRef } from 'react';
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth';
import { usePlatform } from './usePlatform';
import { logger } from '../utils/logger';

const ENABLED_KEY = 'biometric_lock_enabled';
const SESSION_KEY = 'biometric_session_ok';
const BG_LOCK_AFTER = 30_000;

export const isLoggedInFromStorage = () => localStorage.getItem('is_logged_in') === 'true';

const isEnabled = () => localStorage.getItem(ENABLED_KEY) === 'true';
const isSessionOk = () => sessionStorage.getItem(SESSION_KEY) === 'true';

export const useBiometricLock = () => {
    const { isNative } = usePlatform();

    const [locked, setLocked] = useState(
        () => isNative && isEnabled() && isLoggedInFromStorage() && !isSessionOk()
    );
    const [verifying, setVerifying] = useState(false);
    const hiddenAt = useRef<number | null>(null);

    const verify = async () => {
        if (verifying) return;
        setVerifying(true);
        try {
            logger.error('[useBiometricLock] calling authenticate...');
            await BiometricAuth.authenticate({
                reason: 'Zweryfikuj tożsamość, aby otworzyć MyLokalni.pl',
                cancelTitle: 'Anuluj',
            });
            logger.error('[useBiometricLock] authenticate SUCCESS');
            sessionStorage.setItem(SESSION_KEY, 'true');
            setLocked(false);
        } catch (err) {
            logger.error('[useBiometricLock] authenticate failed/cancelled:', err);
        } finally {
            setVerifying(false);
        }
    };

    // Odblokuj bez biometrii (gdy sesja wygasła podczas blokady)
    const forceUnlock = () => {
        sessionStorage.removeItem(SESSION_KEY);
        setLocked(false);
    };

    useEffect(() => {
        if (!isNative) return;
        const onVisibility = () => {
            if (document.hidden) {
                hiddenAt.current = Date.now();
            } else {
                const t = hiddenAt.current;
                hiddenAt.current = null;
                if (t && Date.now() - t > BG_LOCK_AFTER && isEnabled() && isLoggedInFromStorage()) {
                    sessionStorage.removeItem(SESSION_KEY);
                    setLocked(true);
                }
            }
        };
        document.addEventListener('visibilitychange', onVisibility);
        return () => document.removeEventListener('visibilitychange', onVisibility);
    }, [isNative]);

    return { locked, verify, verifying, forceUnlock };
};
