'use client';
import { useState, useEffect } from 'react';
import { ShieldCheck, Wallet, AlertCircle } from 'lucide-react';
import { BiometricAuth, BiometryType } from '@aparajita/capacitor-biometric-auth';
import { usePlatform } from '../../../../hooks/usePlatform';
import { logger } from '../../../../utils/logger';

const ENABLED_KEY = 'biometric_lock_enabled';
const SESSION_KEY = 'biometric_session_ok';
const EARNINGS_METHOD_KEY = 'earnings_unlock_method';

const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
        onClick={onToggle}
        className={`relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0 ${enabled ? 'bg-[#6366F1]' : 'bg-gray-200'}`}
    >
        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
);

export const BiometricSection = () => {
    const { isNative, isIos } = usePlatform();
    const [available, setAvailable] = useState(false);
    const [hardwarePresent, setHardwarePresent] = useState(false);
    const [lockEnabled, setLockEnabled] = useState(() => localStorage.getItem(ENABLED_KEY) === 'true');
    const [earningsBiometric, setEarningsBiometric] = useState(() => localStorage.getItem(EARNINGS_METHOD_KEY) === 'biometric');

    const checkAvailability = () => {
        BiometricAuth.checkBiometry().then((result) => {
            logger.error('[BiometricSection] checkBiometry:', JSON.stringify(result));
            const hw = result.biometryType !== BiometryType.none;
            const ok = result.isAvailable || result.strongBiometryIsAvailable;
            setHardwarePresent(hw);
            setAvailable(ok);
            if (ok && localStorage.getItem(EARNINGS_METHOD_KEY) === null) {
                localStorage.setItem(EARNINGS_METHOD_KEY, 'biometric');
                setEarningsBiometric(true);
            }
        }).catch((err) => {
            logger.error('[BiometricSection] checkBiometry error:', err);
        });
    };

    useEffect(() => {
        if (!isNative) return;
        checkAvailability();
        // Odśwież gdy apka wraca z tła (np. użytkownik zmienił uprawnienia w Ustawieniach iOS)
        const onVisible = () => { if (!document.hidden) checkAvailability(); };
        document.addEventListener('visibilitychange', onVisible);
        return () => document.removeEventListener('visibilitychange', onVisible);
    }, [isNative]);

    if (!isNative) return null;

    // Sprzęt Face ID/Touch ID jest, ale uprawnienia nie są przyznane lub nie jest skonfigurowany
    if (!available && hardwarePresent) {
        const label = isIos ? 'Face ID' : 'Biometria';

        return (
            <div className="pt-8 border-t border-gray-50">
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-2xl">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0 mt-0.5">
                        <AlertCircle size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 text-sm">{label} — brak dostępu</h4>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                            {isIos
                                ? 'Włącz dostęp do Face ID w Ustawieniach iOS'
                                : 'Włącz uprawnienia do biometrii w Ustawieniach systemu'}
                        </p>
                        <button
                            onClick={() => { window.open('app-settings:', '_system'); }}
                            className="mt-2 text-xs font-bold text-amber-700 underline underline-offset-2"
                        >
                            Otwórz Ustawienia
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!available) return null;

    const biometryLabel = isIos ? 'Face ID / Touch ID' : 'Biometria / Odcisk palca';
    const earningsLabel = isIos ? 'Zarobki przez Face ID' : 'Zarobki przez biometrię';
    const earningsDesc  = isIos ? 'Zamiast hasła używaj biometrii do odblokowania zarobków' : 'Zamiast hasła używaj odcisku palca lub twarzy';

    const handleLockToggle = async () => {
        const next = !lockEnabled;
        if (next) {
            try {
                await BiometricAuth.authenticate({ reason: 'Włącz blokadę biometryczną' });
            } catch { return; }
        }
        localStorage.setItem(ENABLED_KEY, String(next));
        setLockEnabled(next);
        if (!next) sessionStorage.setItem(SESSION_KEY, 'true');
    };

    const handleEarningsToggle = async () => {
        const next = !earningsBiometric;
        if (next) {
            try {
                await BiometricAuth.authenticate({ reason: isIos ? 'Włącz Face ID dla zarobków' : 'Włącz biometrię dla zarobków' });
            } catch { return; }
        }
        localStorage.setItem(EARNINGS_METHOD_KEY, next ? 'biometric' : 'password');
        setEarningsBiometric(next);
    };

    return (
        <div className="space-y-0 pt-8 border-t border-gray-50">
            {/* Blokada aplikacji */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">Blokada biometryczna</h4>
                        <p className="text-xs text-gray-400">Wymagaj {biometryLabel} przy każdym uruchomieniu</p>
                    </div>
                </div>
                <Toggle enabled={lockEnabled} onToggle={handleLockToggle} />
            </div>

            {/* Odblokowanie zarobków */}
            <div className="flex items-center justify-between gap-4 pt-6">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <Wallet size={18} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">{earningsLabel}</h4>
                        <p className="text-xs text-gray-400">{earningsDesc}</p>
                    </div>
                </div>
                <Toggle enabled={earningsBiometric} onToggle={handleEarningsToggle} />
            </div>
        </div>
    );
};
