import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService, type AuthResult, type TwoFAChallengeResult, type SocialDobResult, type AuthSuccessResult } from '../services/authService';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { FacebookLogin } from '@capacitor-community/facebook-login';
import type { UserProfile } from '../types';

// --- LOCAL TYPES ---

interface AuthError extends Error {
    code?: string;
    errorMessage?: string;
}

interface GoogleInitConfig {
    client_id: string;
    callback: (response: { credential?: string }) => void | Promise<void>;
    auto_select: boolean;
    itp_support: boolean;
}

interface FacebookLoginResponse {
    authResponse?: { accessToken: string; userID: string };
    status: string;
}

type WindowWithSDKs = Window & typeof globalThis & {
    google?: { accounts: { id: {
        initialize: (config: GoogleInitConfig) => void;
        renderButton: (el: Element, config: Record<string, string>) => void;
        prompt: () => void;
    }}};
    FB?: {
        init: (config: Record<string, unknown>) => void;
        login: (cb: (r: FacebookLoginResponse) => void, opts: { scope: string }) => void;
    };
    fbAsyncInit?: () => void;
};

const iOSGoogleAuth = registerPlugin<{
    signIn: () => Promise<{ authentication: { idToken: string; accessToken: string } }>;
    signOut: () => Promise<void>;
}>('GoogleAuth');

export type AuthMode = 'login' | 'register' | 'verify' | 'forgot-password' | 'reset-password' | '2fa' | 'parental-pending' | 'social-dob';

interface UseAuthLogicParams {
    authMode: AuthMode;
    setAuthMode: (mode: AuthMode) => void;
    onLoginSuccess: (userData: UserProfile | null) => void;
}

export function useAuthLogic({ authMode, setAuthMode, onLoginSuccess }: UseAuthLogicParams) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const codeInputsRef = useRef<(HTMLInputElement | null)[]>([]);
    const googleButtonRef = useRef<HTMLDivElement>(null);

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptNewsletter, setAcceptNewsletter] = useState(false);
    const [termsError, setTermsError] = useState(false);
    const [firstNameError, setFirstNameError] = useState('');
    const [lastNameError, setLastNameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [apiError, setApiError] = useState('');
    const [apiSuccess, setApiSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const [isResending, setIsResending] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [twoFaMethod, setTwoFaMethod] = useState<'totp' | 'email'>('email');
    const [socialDobToken, setSocialDobToken] = useState('');
    const [referralCode, setReferralCode] = useState(() => localStorage.getItem('referral_code') || '');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [parentalEmail, setParentalEmail] = useState('');
    const [dateOfBirthError, setDateOfBirthError] = useState('');
    const [parentalEmailError, setParentalEmailError] = useState('');
    const [acceptAgeConfirmation, setAcceptAgeConfirmation] = useState(false);
    const [ageConfirmationError, setAgeConfirmationError] = useState(false);
    const [socialChildEmail, setSocialChildEmail] = useState('');

    const calculateAge = (dob: string): number => {
        const d = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - d.getFullYear();
        const m = today.getMonth() - d.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
        return age;
    };
    const isMinor = dateOfBirth ? calculateAge(dateOfBirth) < 16 : false;

    // Autofocus pierwszego pola kodu po przejściu do trybu 2FA/verify.
    // Timeout 420ms = exit animation (350ms) + margines — AnimatePresence mode="wait"
    // montuje nowe inputy dopiero po zakończeniu wyjścia poprzedniego widoku.
    useEffect(() => {
        if (authMode === '2fa' || authMode === 'verify') {
            const t = setTimeout(() => codeInputsRef.current[0]?.focus(), 420);
            return () => clearTimeout(t);
        }
    }, [authMode]);

    const handle2FAOrSuccess = (result: AuthResult) => {
        if ((result as SocialDobResult).needs_dob) {
            const r = result as SocialDobResult;
            setSocialDobToken(r.temp_token);
            setDateOfBirth('');
            setParentalEmail('');
            setAuthMode('social-dob');
            return;
        }
        if ((result as TwoFAChallengeResult).needs_2fa) {
            const r = result as TwoFAChallengeResult;
            setTempToken(r.temp_token);
            setTwoFaMethod(r.method === 'totp' ? 'totp' : 'email');
            setVerificationCode(['', '', '', '', '', '']);
            setAuthMode('2fa');
            if (r.method === 'email') setResendTimer(60);
            return;
        }
        onLoginSuccess((result as { user: UserProfile }).user);
    };

    // Google & Facebook SDK init (web only — native uses plugin)
    useEffect(() => {
        if (Capacitor.isNativePlatform()) return;

        const scriptGoogle = document.createElement('script');
        scriptGoogle.src = "https://accounts.google.com/gsi/client";
        scriptGoogle.async = true;
        scriptGoogle.defer = true;
        scriptGoogle.onload = () => {
            const win = window as WindowWithSDKs;
            if (win.google?.accounts?.id) {
                win.google.accounts.id.initialize({
                    client_id: '1020493448098-nprs538u47hv37a9sb6c9qbvpr98bid7.apps.googleusercontent.com',
                    callback: async (response: { credential?: string }) => {
                        if (response.credential) {
                            setIsLoading(true);
                            try {
                                const result = await authService.loginWithGoogle(response.credential);
                                handle2FAOrSuccess(result);
                            } catch (error: unknown) {
                                const e = error as AuthError;
                                if (e.code === 'ACCOUNT_EXISTS') {
                                    setApiError(e.message);
                                    setAuthMode('login');
                                } else {
                                    setApiError(e.message);
                                }
                            } finally {
                                setIsLoading(false);
                            }
                        }
                    },
                    auto_select: false,
                    itp_support: true
                });
                if (googleButtonRef.current) {
                    win.google.accounts.id.renderButton(
                        googleButtonRef.current,
                        { theme: "outline", size: "large", width: "100%" }
                    );
                }
            }
        };
        document.body.appendChild(scriptGoogle);

        (window as WindowWithSDKs).fbAsyncInit = function () {
            (window as WindowWithSDKs).FB?.init({ appId: '1082296997226159', cookie: true, xfbml: true, version: 'v18.0' });
        };
        const scriptFB = document.createElement('script');
        scriptFB.src = "https://connect.facebook.net/pl_PL/sdk.js";
        scriptFB.async = true;
        scriptFB.defer = true;
        document.body.appendChild(scriptFB);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- SDK scripts load once; handle2FAOrSuccess captured via closure intentionally
    }, [onLoginSuccess]);

    // URL params → mode detection
    useEffect(() => {
        const token = searchParams.get('token');
        const modeParam = searchParams.get('mode');
        if (modeParam === 'forgot-password') setAuthMode('forgot-password');
        else if (token && authMode !== 'reset-password') setAuthMode('reset-password');
    }, [searchParams, authMode, setAuthMode]);

    // Silent session check — runs once on mount only.
    // onLoginSuccess ref prevents stale closure without re-triggering the effect
    // on every parent re-render (which would show the "Zalogowano" toast twice).
    const onLoginSuccessRef = useRef(onLoginSuccess);
    useEffect(() => { onLoginSuccessRef.current = onLoginSuccess; });

    useEffect(() => {
        let isMounted = true;
        const check = async () => {
            if (authService.isAuthenticated()) {
                try {
                    const user = await authService.fetchUserProfile();
                    if (user && isMounted) onLoginSuccessRef.current(user);
                } catch { /* best-effort */ }
            }
        };
        check();
        return () => { isMounted = false; };
    }, []);

    // Resend timer countdown
    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => setResendTimer(p => p - 1), 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    const passwordRequirements = [
        { label: '8 znaków', met: password.length >= 8 },
        { label: 'Duże i małe litery', met: /[a-z]/.test(password) && /[A-Z]/.test(password) },
        { label: 'Cyfry', met: /\d/.test(password) },
        { label: 'Znak specjalny', met: /[^A-Za-z0-9]/.test(password) },
    ];
    const passwordStrength = { score: passwordRequirements.filter(r => r.met).length };

    const getStrengthColor = (score: number) => {
        const colors = ['bg-rose-500', 'bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-500'];
        return colors[score] ?? 'bg-gray-200';
    };

    const validateEmailLogic = (val: string) => {
        if (!val) return true;
        return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(val);
    };

    const handleNameChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!/\d/.test(e.target.value)) setter(e.target.value);
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target;
        const val = input.value;
        const cursorPosition = input.selectionStart || 0;
        if (!val) { setPhoneNumber(''); setPhoneError(''); return; }
        const cleanDigits = val.replace(/\D/g, '');
        if (cleanDigits.length > 9) {
            const restorePos = Math.max(0, cursorPosition - 1);
            window.requestAnimationFrame(() => { phoneInputRef.current?.setSelectionRange(restorePos, restorePos); });
            return;
        }
        const digitsBeforeCursor = val.slice(0, cursorPosition).replace(/\D/g, '').length;
        let formatted = '';
        for (let i = 0; i < cleanDigits.length; i++) {
            if (i === 3 || i === 6) formatted += '-';
            formatted += cleanDigits[i];
        }
        setPhoneNumber(formatted);
        if (phoneError) setPhoneError('');
        window.requestAnimationFrame(() => {
            if (!phoneInputRef.current) return;
            let newCursorPos = 0, digitsSeen = 0;
            for (let i = 0; i < formatted.length; i++) {
                if (/\d/.test(formatted[i])) digitsSeen++;
                if (digitsSeen === digitsBeforeCursor) {
                    newCursorPos = i + 1;
                    if (formatted[newCursorPos] === '-') newCursorPos++;
                    break;
                }
            }
            if (digitsBeforeCursor === 0) newCursorPos = 0;
            phoneInputRef.current.setSelectionRange(newCursorPos, newCursorPos);
        });
    };

    const handlePhoneKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            const input = e.target as HTMLInputElement;
            const cursorPos = input.selectionStart || 0;
            if (cursorPos > 0 && input.value[cursorPos - 1] === '-') {
                e.preventDefault();
                const val = input.value;
                const newVal = val.slice(0, cursorPos - 2) + val.slice(cursorPos - 1);
                handlePhoneChange({ target: { value: newVal, selectionStart: cursorPos - 2 } } as unknown as React.ChangeEvent<HTMLInputElement>);
            }
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (emailError) setEmailError('');
        if (apiError) setApiError('');
        if (apiSuccess) setApiSuccess('');
    };

    const handlePhoneBlur = () => {
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length > 0 && digits.length < 9) setPhoneError('Podaj pełny numer telefonu (9 cyfr)');
    };

    const handleEmailBlur = () => {
        if (email && !validateEmailLogic(email)) setEmailError('Nieprawidłowy adres email');
    };

    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newCode = [...verificationCode];
        newCode[index] = value.slice(-1);
        setVerificationCode(newCode);
        if (value && index < 5) codeInputsRef.current[index + 1]?.focus();
    };

    const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
            codeInputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const nums = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!nums.length) return;
        const newCode = [...verificationCode];
        for (let i = 0; i < nums.length; i++) newCode[i] = nums[i];
        setVerificationCode(newCode);
        const focusTarget = nums.length === 6 ? 5 : Math.min(nums.length, 5);
        codeInputsRef.current[focusTarget]?.focus();
    };

    const handleGoogleLogin = async () => {
        setApiError('');
        if (Capacitor.getPlatform() === 'ios') {
            setIsLoading(true);
            try {
                const result = await iOSGoogleAuth.signIn();
                if (!result?.authentication?.idToken) throw new Error('Brak tokenu Google');
                const authResult = await authService.loginWithGoogle(result.authentication.idToken);
                handle2FAOrSuccess(authResult);
            } catch (error: unknown) {
                const e = error as AuthError;
                if (e.code === 'ACCOUNT_EXISTS') {
                    setApiError(e.message);
                    setAuthMode('login');
                } else {
                    const msg = e?.message || e?.errorMessage || String(e) || '';
                    const isCanceled = msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('anulo');
                    if (!isCanceled) setApiError(msg || 'Błąd logowania Google');
                }
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (Capacitor.getPlatform() === 'android') {
            setIsLoading(true);
            try {
                const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
                await GoogleAuth.initialize({
                    clientId: '1020493448098-nprs538u47hv37a9sb6c9qbvpr98bid7.apps.googleusercontent.com',
                    scopes: ['profile', 'email'],
                    grantOfflineAccess: false,
                });
                const googleUser = await GoogleAuth.signIn() as unknown as { authentication: { idToken: string; accessToken: string } } | null;
                const idToken = googleUser?.authentication.idToken;
                if (!idToken) throw new Error('Brak tokenu Google');
                const result = await authService.loginWithGoogle(idToken);
                handle2FAOrSuccess(result);
            } catch (error: unknown) {
                const e = error as AuthError;
                if (e.code === 'ACCOUNT_EXISTS') {
                    setApiError(e.message);
                    setAuthMode('login');
                } else {
                    const msg = e?.message || e?.errorMessage || String(e) || '';
                    const isCanceled = msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('anulo');
                    if (!isCanceled) setApiError(msg || 'Błąd logowania Google');
                }
            } finally {
                setIsLoading(false);
            }
            return;
        }
        const btn = googleButtonRef.current?.querySelector('div[role="button"]') as HTMLElement;
        if (btn) btn.click();
        else (window as WindowWithSDKs).google?.accounts?.id?.prompt();
    };

    const handleFacebookLogin = async () => {
        setApiError('');
        if (Capacitor.isNativePlatform()) {
            setIsLoading(true);
            try {
                const result = await FacebookLogin.login({ permissions: ['public_profile', 'email'] });
                const token = result?.accessToken?.token;
                if (!token) return; // anulowano lub brak tokenu — cicha rezygnacja
                const authResult = await authService.loginWithFacebook(token);
                handle2FAOrSuccess(authResult);
            } catch (error: unknown) {
                const e = error as AuthError;
                if (e.code === 'ACCOUNT_EXISTS') {
                    setApiError(e.message);
                    setAuthMode('login');
                } else {
                    const msg = e?.message || e?.errorMessage || String(e) || '';
                    const isCanceled = msg.toLowerCase().includes('cancel') || msg.toLowerCase().includes('anulo');
                    if (!isCanceled) setApiError(msg || 'Błąd logowania Facebook');
                }
            } finally {
                setIsLoading(false);
            }
            return;
        }
        try {
            (window as WindowWithSDKs).FB?.login((response: FacebookLoginResponse) => {
                if (response.authResponse && response.status === 'connected') {
                    setIsLoading(true);
                    authService.loginWithFacebook(response.authResponse.accessToken)
                        .then(result => handle2FAOrSuccess(result))
                        .catch((err: unknown) => {
                            const e = err as AuthError;
                            if (e.code === 'ACCOUNT_EXISTS') {
                                setApiError(e.message);
                                setAuthMode('login');
                            } else {
                                setApiError(e.message);
                            }
                        })
                        .finally(() => setIsLoading(false));
                }
            }, { scope: 'public_profile,email' });
        } catch (error: unknown) {
            setApiError('Błąd SDK Facebook: ' + (error as AuthError).message);
        }
    };

    const handleLogin = async () => {
        setIsLoading(true); setApiError('');
        try {
            const result = await authService.login(email.trim(), password.trim());
            handle2FAOrSuccess(result);
        } catch (error: unknown) {
            const e = error as AuthError;
            if (e.message === "Konto nie jest zweryfikowane. Sprawdź e-mail.") {
                try {
                    setAuthMode('verify');
                    await authService.resendVerificationCode(email.trim());
                    setResendTimer(60); setApiError('');
                } catch (resendError: unknown) {
                    setApiError("Błąd ponownego wysyłania kodu: " + (resendError as AuthError).message);
                }
            } else {
                setApiError(e.message || 'Nieprawidłowy email lub hasło.');
            }
        } finally { setIsLoading(false); }
    };

    const handleVerify2FA = async () => {
        setIsLoading(true); setApiError('');
        try {
            const result = await authService.verify2FA(tempToken, verificationCode.join(''));
            handle2FAOrSuccess(result);
        } catch (error: unknown) {
            // temp_token pozostaje ważny po stronie serwera — używamy tego samego co wysłaliśmy
            setVerificationCode(['', '', '', '', '', '']);
            codeInputsRef.current[0]?.focus();
            setApiError((error as AuthError).message || 'Nieprawidłowy kod.');
        } finally { setIsLoading(false); }
    };

    const handleResend2FA = async () => {
        if (resendTimer > 0 || isResending) return;
        setIsResending(true); setApiError('');
        try {
            await authService.resend2FACode(tempToken);
            setResendTimer(60);
            setVerificationCode(['', '', '', '', '', '']);
        } catch (error: unknown) {
            setApiError((error as AuthError).message || 'Błąd wysyłania kodu.');
        } finally { setIsResending(false); }
    };

    const handleRegister = async () => {
        setIsLoading(true); setApiError('');
        const cleanDigits = phoneNumber.replace(/\D/g, '');
        const formattedPhone = `48-${cleanDigits.slice(0, 3)}-${cleanDigits.slice(3, 6)}-${cleanDigits.slice(6, 9)}`;
        try {
            const result = await authService.register({
                email: email.trim(), password: password.trim(),
                imie: firstName.trim(), nazwisko: lastName.trim(),
                telefon: formattedPhone, zgodaRegulamin: acceptTerms,
                zgodaNewsletter: acceptNewsletter, kodPolecajacy: referralCode.trim() || undefined,
                dateOfBirth: dateOfBirth || undefined,
                parentalEmail: parentalEmail.trim() || undefined,
            });
            if (result.parentalConsentRequired) {
                setAuthMode('parental-pending');
            } else {
                setAuthMode('verify');
            }
            setResendTimer(60);
        } catch (error: unknown) { setApiError((error as AuthError).message); }
        finally { setIsLoading(false); }
    };

    const handleCompleteSocialDob = async () => {
        setIsLoading(true); setApiError('');
        setDateOfBirthError(''); setParentalEmailError('');
        if (!dateOfBirth) { setDateOfBirthError('Podaj datę urodzenia'); setIsLoading(false); return; }
        const age = calculateAge(dateOfBirth);
        if (age < 13) { setDateOfBirthError('Rejestracja jest dostępna od 13. roku życia'); setIsLoading(false); return; }
        if (age < 16 && !parentalEmail) { setParentalEmailError('Adres email rodzica jest wymagany'); setIsLoading(false); return; }
        if (age < 16 && !validateEmailLogic(parentalEmail)) { setParentalEmailError('Nieprawidłowy adres email rodzica'); setIsLoading(false); return; }
        try {
            const result = await authService.completeSocialLogin(socialDobToken, dateOfBirth, parentalEmail || undefined);
            if ((result as { parentalConsentRequired?: boolean }).parentalConsentRequired) {
                setSocialChildEmail((result as { childEmail?: string }).childEmail ?? '');
                setAuthMode('parental-pending');
                setResendTimer(60);
            } else {
                onLoginSuccess((result as AuthSuccessResult).user);
            }
        } catch (error: unknown) {
            setApiError((error as { message?: string }).message || 'Błąd serwera.');
        } finally { setIsLoading(false); }
    };

    const handleResendParentalConsent = async () => {
        if (resendTimer > 0 || isResending) return;
        setIsResending(true); setApiError('');
        try {
            await authService.resendParentalConsent(socialChildEmail || email.trim());
            setResendTimer(60);
        } catch (error: unknown) {
            setApiError((error as AuthError).message || 'Błąd wysyłania.');
        } finally { setIsResending(false); }
    };

    const handleResendCode = async () => {
        if (resendTimer > 0 || isResending) return;
        setIsResending(true); setApiError('');
        try { await authService.resendVerificationCode(email.trim()); setResendTimer(60); }
        catch (error: unknown) { setApiError((error as AuthError).message); }
        finally { setIsResending(false); }
    };

    const handleVerify = async () => {
        setIsLoading(true); setApiError('');
        try {
            await authService.verifyEmail(email.trim(), verificationCode.join(''));
            localStorage.setItem('pending_tour', '1');
            setAuthMode('login'); setApiError(''); setApiSuccess('Konto zweryfikowane! Zaloguj się.');
        } catch (error: unknown) { setApiError((error as AuthError).message); }
        finally { setIsLoading(false); }
    };

    const handleRequestReset = async () => {
        setIsLoading(true); setApiError(''); setApiSuccess('');
        try { await authService.requestPasswordReset(email.trim()); setApiSuccess('Link do resetowania hasła został wysłany na Twój e-mail.'); }
        catch (error: unknown) { setApiError((error as AuthError).message || 'Wystąpił błąd podczas wysyłania.'); }
        finally { setIsLoading(false); }
    };

    const handleConfirmReset = async () => {
        const token = searchParams.get('token');
        if (!token) { setApiError("Brak tokena resetującego. Kliknij w link z maila ponownie."); return; }
        setIsLoading(true); setApiError(''); setApiSuccess('');
        try {
            await authService.confirmPasswordReset(token, password.trim());
            setApiSuccess('Hasło zmienione pomyślnie. Możesz się zalogować.');
            setTimeout(() => { setAuthMode('login'); setApiSuccess(''); setPassword(''); router.replace('/auth'); }, 2000);
        } catch (error: unknown) {
            const e = error as AuthError;
            const msg = e.message.toLowerCase();
            setApiError(msg.includes('token') || msg.includes('expired') || msg.includes('wygasł') || msg.includes('nieprawidłowy')
                ? 'Twój link do resetowania hasła wygasł.' : e.message || 'Nie udało się zmienić hasła.');
        } finally { setIsLoading(false); }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setApiError(''); setApiSuccess(''); setFirstNameError(''); setLastNameError(''); setPasswordError('');
        setDateOfBirthError(''); setParentalEmailError('');
        if (authMode === 'register') {
            let hasError = false;
            const digits = phoneNumber.replace(/\D/g, '');
            if (digits.length !== 9) { setPhoneError('Podaj pełny numer telefonu (9 cyfr)'); hasError = true; }
            if (!email) { setEmailError('Adres email jest wymagany'); hasError = true; }
            else if (!validateEmailLogic(email)) { setEmailError('Nieprawidłowy adres email'); hasError = true; }
            if (!firstName) { setFirstNameError('Podaj imię'); hasError = true; }
            if (!lastName) { setLastNameError('Podaj nazwisko'); hasError = true; }
            if (!password) { setPasswordError('Podaj hasło'); hasError = true; }
            if (!acceptTerms) { setApiError('Musisz zaakceptować Regulamin i Politykę Prywatności'); setTermsError(true); hasError = true; }
            else { setTermsError(false); }
            if (dateOfBirth) {
                const age = calculateAge(dateOfBirth);
                if (age < 13) { setDateOfBirthError('Rejestracja jest dostępna od 13. roku życia'); hasError = true; }
                else if (age < 16 && !parentalEmail) { setParentalEmailError('Adres email rodzica jest wymagany'); hasError = true; }
                else if (age < 16 && !validateEmailLogic(parentalEmail)) { setParentalEmailError('Nieprawidłowy adres email rodzica'); hasError = true; }
            } else if (!acceptAgeConfirmation) {
                setAgeConfirmationError(true);
                hasError = true;
            }
            if (!hasError) handleRegister();
        } else if (authMode === 'social-dob') {
            handleCompleteSocialDob();
        } else if (authMode === 'verify') {
            handleVerify();
        } else if (authMode === '2fa') {
            handleVerify2FA();
        } else if (authMode === 'forgot-password') {
            if (!email) { setEmailError('Podaj adres email'); return; }
            handleRequestReset();
        } else if (authMode === 'reset-password') {
            if (!password) { setPasswordError('Podaj nowe hasło'); return; }
            if (password.length < 8) { setPasswordError('Hasło jest za krótkie'); return; }
            if (!confirmPassword) { setConfirmPasswordError('Potwierdź nowe hasło'); return; }
            if (password !== confirmPassword) { setConfirmPasswordError('Hasła nie są identyczne'); return; }
            handleConfirmReset();
        } else {
            let hasError = false;
            if (!email) { setEmailError('Adres email jest wymagany'); hasError = true; }
            if (!password) { setPasswordError('Podaj hasło'); hasError = true; }
            if (!hasError) handleLogin();
        }
    };

    const getTitle = () => {
        const titles: Record<AuthMode, string> = {
            login: 'Witaj ponownie!', register: 'Stwórz konto', verify: 'Potwierdź e-mail',
            'forgot-password': 'Reset hasła', 'reset-password': 'Nowe hasło', '2fa': 'Weryfikacja dwuetapowa',
            'parental-pending': 'Czekamy na zgodę', 'social-dob': 'Jeszcze jeden krok',
        };
        return titles[authMode] ?? '';
    };

    const getDescription = () => {
        const twoFaDesc = twoFaMethod === 'totp'
            ? 'Podaj kod z aplikacji uwierzytelniającej'
            : `Wysłaliśmy 6-cyfrowy kod na adres ${email}`;
        const descriptions: Record<AuthMode, string> = {
            login: 'Zaloguj się, aby kontynuować', register: 'Zacznij korzystać z Lokalnych za darmo',
            verify: `Wysłaliśmy kod na adres ${email}`, 'forgot-password': 'Podaj e-mail, aby otrzymać link',
            'reset-password': 'Ustaw nowe hasło', '2fa': twoFaDesc,
            'parental-pending': `Link z prośbą o zgodę wysłaliśmy na adres ${parentalEmail}`,
            'social-dob': 'Podaj datę urodzenia, aby ukończyć rejestrację',
        };
        return descriptions[authMode] ?? '';
    };

    const handleBackToLogin = () => {
        
        setApiError(''); setApiSuccess('');
        setAuthMode('login');
        router.replace('/auth');
    };

    const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleNameChange(setFirstName)(e);
        if (e.target.value) setFirstNameError('');
    };
    const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleNameChange(setLastName)(e);
        if (e.target.value) setLastNameError('');
    };
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (e.target.value) setPasswordError('');
        if (confirmPasswordError) setConfirmPasswordError('');
    };

    const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfirmPassword(e.target.value);
        if (confirmPasswordError) setConfirmPasswordError('');
    };
    const handleAcceptTermsChange = (checked: boolean) => {
        setAcceptTerms(checked);
        if (checked) setTermsError(false);
    };

    const handleAcceptAgeConfirmationChange = (checked: boolean) => {
        setAcceptAgeConfirmation(checked);
        if (checked) setAgeConfirmationError(false);
    };

    return {
        // Refs
        phoneInputRef, codeInputsRef, googleButtonRef,
        // Fields
        email, setEmail, password, setPassword, confirmPassword, firstName, lastName, phoneNumber,
        showPassword, setShowPassword, verificationCode,
        acceptTerms, setAcceptTerms, acceptNewsletter, setAcceptNewsletter,
        // Errors
        termsError, firstNameError, lastNameError, passwordError, confirmPasswordError, phoneError, emailError,
        apiError, setApiError, apiSuccess,
        // Loading
        isLoading, resendTimer, isResending,
        // Computed
        passwordRequirements, passwordStrength,
        // Handlers
        handleGoogleLogin, handleFacebookLogin, handleSubmit, handleResendCode,
        handleFirstNameChange, handleLastNameChange,
        handlePasswordChange, handleConfirmPasswordChange, handleAcceptTermsChange,
        handlePhoneChange, handlePhoneKeyDown,
        handleEmailChange, handlePhoneBlur, handleEmailBlur,
        handleCodeChange, handleCodeKeyDown, handlePaste,
        getStrengthColor, getTitle, getDescription, handleBackToLogin,
        // 2FA
        tempToken, twoFaMethod, handleVerify2FA, handleResend2FA,
        // Referral
        referralCode, setReferralCode,
        // Parental consent
        dateOfBirth, setDateOfBirth, parentalEmail, setParentalEmail,
        dateOfBirthError, parentalEmailError, isMinor,
        handleResendParentalConsent, handleCompleteSocialDob,
        // Age confirmation
        acceptAgeConfirmation, ageConfirmationError, handleAcceptAgeConfirmationChange,
    };
}
