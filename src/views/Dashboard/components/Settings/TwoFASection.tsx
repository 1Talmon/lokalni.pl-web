'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ShieldCheck, Smartphone, Mail, Loader2, AlertCircle, Eye, EyeOff, X, Check } from 'lucide-react';
import { authService } from '@/services/authService';
import type { ToastType } from '@/types';

type TwoFAStatus = { totp_enabled: boolean; email_2fa_enabled: boolean } | null;
type Phase = 'idle' | 'totp-setup-loading' | 'totp-qr' | 'disable-totp' | 'disable-email';

const expandVariants: Variants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: 'auto', transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
    exit:   { opacity: 0, height: 0,    transition: { duration: 0.22, ease: 'easeInOut' } },
};

export const TwoFASection = ({ addToast }: { addToast?: (msg: string, type?: ToastType) => void }) => {
    const [status, setStatus]       = useState<TwoFAStatus>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [phase, setPhase]         = useState<Phase>('idle');
    const [qrData, setQrData]       = useState<{ qr_code: string; secret: string } | null>(null);
    const [code, setCode]           = useState('');
    const [password, setPassword]   = useState('');
    const [showPass, setShowPass]   = useState(false);
    const [isBusy, setIsBusy]       = useState(false);
    const [error, setError]         = useState('');
    const codeRef                   = useRef<HTMLInputElement>(null);

    const isEnabled    = !!(status?.totp_enabled || status?.email_2fa_enabled);
    const activeMethod = status?.totp_enabled ? 'totp' : status?.email_2fa_enabled ? 'email' : null;

    useEffect(() => {
        authService.get2FAStatus()
            .then(s => setStatus(s))
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, []);

    const reset = () => { setPhase('idle'); setCode(''); setPassword(''); setError(''); setShowPass(false); setQrData(null); };

    const handleSetupTOTP = async () => {
        setPhase('totp-setup-loading'); setError('');
        try {
            const data = await authService.setup2FATOTP();
            setQrData(data);
            setPhase('totp-qr');
            setTimeout(() => codeRef.current?.focus(), 300);
        } catch (e: unknown) {
            setError((e as Error).message ||'Błąd konfiguracji');
            setPhase('idle');
        }
    };

    const handleEnableTOTP = async () => {
        if (code.replace(/\s/g, '').length < 6) return;
        setIsBusy(true); setError('');
        try {
            await authService.enable2FATOTP(code.replace(/\s/g, ''));
            setStatus({ totp_enabled: true, email_2fa_enabled: false });
            addToast?.('Weryfikacja TOTP włączona', 'success');
            reset();
        } catch (e: unknown) {
            setError((e as Error).message ||'Nieprawidłowy kod');
            setCode('');
            codeRef.current?.focus();
        } finally { setIsBusy(false); }
    };

    const handleEnableEmail = async () => {
        setIsBusy(true); setError('');
        try {
            await authService.enable2FAEmail();
            setStatus({ totp_enabled: false, email_2fa_enabled: true });
            addToast?.('Weryfikacja e-mail włączona', 'success');
            reset();
        } catch (e: unknown) {
            setError((e as Error).message ||'Błąd');
        } finally { setIsBusy(false); }
    };

    const handleDisable = async () => {
        setIsBusy(true); setError('');
        try {
            const payload = activeMethod === 'totp' ? { code: code.replace(/\s/g, '') } : { password };
            await authService.disable2FA(payload);
            setStatus({ totp_enabled: false, email_2fa_enabled: false });
            addToast?.('Weryfikacja dwuetapowa wyłączona', 'success');
            reset();
        } catch (e: unknown) {
            setError((e as Error).message ||'Błąd wyłączania');
        } finally { setIsBusy(false); }
    };

    if (isLoading) {
        return (
            <div className="pt-8 border-t border-gray-50 flex items-center gap-3 text-gray-400">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Ładowanie ustawień 2FA…</span>
            </div>
        );
    }

    const inDisablePhase = phase === 'disable-totp' || phase === 'disable-email';

    return (
        <div className="pt-8 border-t border-gray-50">
            {/* ── Nagłówek (zawsze widoczny) ── */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <ShieldCheck size={18} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">Weryfikacja dwuetapowa (2FA)</h4>
                        <p className="text-xs text-gray-400">
                            {isEnabled
                                ? activeMethod === 'totp' ? 'Aktywna · Aplikacja authenticatora' : 'Aktywna · Kod e-mail'
                                : 'Wyłączona · Zalecamy włączenie'}
                        </p>
                    </div>
                </div>

                {/* Przycisk akcji w nagłówku — jak w PasswordSection */}
                {isEnabled && phase === 'idle' && (
                    <button
                        onClick={() => { setPhase(activeMethod === 'totp' ? 'disable-totp' : 'disable-email'); setError(''); setTimeout(() => codeRef.current?.focus(), 200); }}
                        className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all"
                    >
                        Wyłącz 2FA
                    </button>
                )}
                {inDisablePhase && (
                    <button
                        onClick={reset}
                        className="shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
                    >
                        Anuluj
                    </button>
                )}
            </div>

            {/* ── Błąd globalny ── */}
            <AnimatePresence>
                {error && (
                    <motion.div variants={expandVariants} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                        <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium">
                            <AlertCircle size={14} className="mt-0.5 shrink-0" />{error}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── 2FA WYŁĄCZONE — wybór metody ── */}
            <AnimatePresence>
                {!isEnabled && phase === 'idle' && (
                    <motion.div variants={expandVariants} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                                onClick={handleSetupTOTP}
                                className="flex items-start gap-3 p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group active:scale-[0.98]"
                            >
                                <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 group-hover:border-indigo-200 flex items-center justify-center text-indigo-500 shrink-0 shadow-sm">
                                    <Smartphone size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Aplikacja authenticatora</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Google Authenticator, Authy itp.</p>
                                </div>
                            </button>
                            <button
                                onClick={handleEnableEmail}
                                disabled={isBusy}
                                className="flex items-start gap-3 p-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-left group active:scale-[0.98] disabled:opacity-60"
                            >
                                <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 group-hover:border-indigo-200 flex items-center justify-center text-indigo-500 shrink-0 shadow-sm">
                                    {isBusy ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">Kod e-mail</p>
                                    <p className="text-xs text-gray-400 mt-0.5">6-cyfrowy kod wysyłany na maila</p>
                                </div>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Ładowanie TOTP setup ── */}
            <AnimatePresence>
                {phase === 'totp-setup-loading' && (
                    <motion.div variants={expandVariants} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                        <div className="mt-4 flex items-center gap-3 text-gray-400 text-sm">
                            <Loader2 size={16} className="animate-spin" /> Generowanie kodu QR…
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── TOTP QR + weryfikacja ── */}
            <AnimatePresence>
                {phase === 'totp-qr' && qrData && (
                    <motion.div variants={expandVariants} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                        <div className="mt-4 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                <div className="flex flex-col items-center gap-2 shrink-0">
                                    <div className="w-40 h-40 rounded-2xl overflow-hidden border border-gray-200 bg-white p-2 shadow-sm">
                                        <img src={qrData.qr_code} alt="QR Code" className="w-full h-full object-contain" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Zeskanuj aparatem</p>
                                </div>
                                <div className="flex flex-col gap-3 flex-1 min-w-0">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900 mb-1">Jak skonfigurować?</p>
                                        <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
                                            <li>Pobierz aplikację Google Authenticator lub Authy</li>
                                            <li>Naciśnij „+" i wybierz „Skanuj kod QR"</li>
                                            <li>Zeskanuj kod z lewej strony</li>
                                            <li>Wpisz 6-cyfrowy kod z aplikacji poniżej</li>
                                        </ol>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Klucz ręczny</p>
                                        <div className="bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
                                            <span className="text-xs font-mono text-gray-700 break-all select-all">{qrData.secret}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kod z aplikacji</label>
                                <input
                                    ref={codeRef}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={code}
                                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    onKeyDown={e => { if (e.key === 'Enter') handleEnableTOTP(); }}
                                    placeholder="000000"
                                    className="w-full bg-gray-50 rounded-xl px-4 py-3.5 text-xl font-mono text-center tracking-[0.4em] border-none focus:ring-2 focus:ring-indigo-200 ring-inset outline-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={reset}
                                    className="px-5 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
                                >
                                    <X size={14} /> Anuluj
                                </button>
                                <button
                                    onClick={handleEnableTOTP}
                                    disabled={isBusy || code.length < 6}
                                    className="flex-1 py-3 rounded-xl bg-[#6366F1] text-white text-sm font-bold hover:bg-[#4F46E5] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    {isBusy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    Potwierdź i włącz
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Wyłączanie TOTP — podaj kod ── */}
            <AnimatePresence>
                {phase === 'disable-totp' && (
                    <motion.div variants={expandVariants} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                        <div className="mt-4 space-y-3">
                            <p className="text-sm text-gray-600">Podaj kod z aplikacji, aby wyłączyć weryfikację dwuetapową:</p>
                            <input
                                ref={codeRef}
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={code}
                                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                onKeyDown={e => { if (e.key === 'Enter') handleDisable(); }}
                                placeholder="000000"
                                className="w-full bg-gray-50 rounded-xl px-4 py-3.5 text-xl font-mono text-center tracking-[0.4em] border-none focus:ring-2 focus:ring-rose-200 ring-inset outline-none"
                            />
                            <button
                                onClick={handleDisable}
                                disabled={isBusy || code.length < 6}
                                className="w-full py-3 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {isBusy ? <Loader2 size={16} className="animate-spin" /> : null}
                                Wyłącz weryfikację
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Wyłączanie Email 2FA — podaj hasło ── */}
            <AnimatePresence>
                {phase === 'disable-email' && (
                    <motion.div variants={expandVariants} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                        <div className="mt-4 space-y-3">
                            <p className="text-sm text-gray-600">Potwierdź hasłem, aby wyłączyć weryfikację dwuetapową:</p>
                            <div className="relative">
                                <input
                                    ref={codeRef}
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleDisable(); }}
                                    placeholder="Twoje hasło"
                                    className="w-full bg-gray-50 rounded-xl px-4 py-3.5 pr-12 text-sm border-none focus:ring-2 focus:ring-rose-200 ring-inset outline-none font-medium"
                                />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <button
                                onClick={handleDisable}
                                disabled={isBusy || !password}
                                className="w-full py-3 rounded-xl bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {isBusy ? <Loader2 size={16} className="animate-spin" /> : null}
                                Wyłącz weryfikację
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
