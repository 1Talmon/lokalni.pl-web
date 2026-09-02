'use client';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail as MailIcon, Lock, ArrowLeft, Phone, AlertCircle, Loader2, Check, Eye, EyeOff, RotateCw, CheckCircle, Gift, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useAuthLogic, type AuthMode } from '../hooks/useAuthLogic';
import { AuthSidePanel } from './auth/AuthSidePanel';
import { expandVariants, pageVariants, passwordFeedbackVariants } from './auth/authVariants';
import { lockScroll, unlockScroll } from '../utils/scrollLock';

const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const FacebookIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
    </svg>
);

interface AuthViewProps {
    authMode: AuthMode;
    setAuthMode: (mode: AuthMode) => void;
    onLoginSuccess: (userData: import('../types').UserProfile | null) => void;
    onGoBack: () => void;
}

const AuthView = ({ authMode, setAuthMode, onLoginSuccess, onGoBack }: AuthViewProps) => {
    useEffect(() => {
        lockScroll();
        return () => unlockScroll();
    }, []);

    const {
        phoneInputRef, codeInputsRef, googleButtonRef,
        email, password, confirmPassword, firstName, lastName, phoneNumber,
        showPassword, setShowPassword, verificationCode,
        acceptTerms, acceptNewsletter, setAcceptNewsletter,
        termsError, firstNameError, lastNameError, passwordError, confirmPasswordError, phoneError, emailError,
        apiError, setApiError, apiSuccess,
        isLoading, resendTimer, isResending,
        passwordRequirements, passwordStrength,
        handleGoogleLogin, handleFacebookLogin, handleSubmit, handleResendCode,
        handleFirstNameChange, handleLastNameChange,
        handlePasswordChange, handleConfirmPasswordChange, handleAcceptTermsChange,
        handlePhoneChange, handlePhoneKeyDown,
        handleEmailChange, handlePhoneBlur, handleEmailBlur,
        handleCodeChange, handleCodeKeyDown, handlePaste,
        getStrengthColor, getTitle, getDescription, handleBackToLogin,
        twoFaMethod, handleResend2FA,
        referralCode, setReferralCode,
        dateOfBirth, setDateOfBirth, parentalEmail, setParentalEmail,
        dateOfBirthError, parentalEmailError, isMinor, handleResendParentalConsent,
        acceptAgeConfirmation, ageConfirmationError, handleAcceptAgeConfirmationChange,
    } = useAuthLogic({ authMode, setAuthMode, onLoginSuccess });

    return (
        <div
            className="h-[100dvh] w-full bg-white flex relative z-[100] md:fixed md:inset-0 md:overflow-hidden"
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <div ref={googleButtonRef} style={{ display: 'none' }}></div>

            <AuthSidePanel />

            <div
                className="w-full md:w-1/2 bg-white md:bg-gray-50/50 overflow-y-auto h-full md:flex md:flex-col md:items-center scrollbar-hide"
            >
                <div className="w-full max-w-md mx-auto pt-12 pb-24 px-6 md:p-8 md:mx-0 md:my-auto">
                    <button onClick={onGoBack} className="mb-8 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium">
                        <ArrowLeft size={20} /> Wróć do strony głównej
                    </button>

                    <div className="bg-white md:p-10 md:rounded-3xl md:shadow-xl md:border md:border-gray-100 shadow-none border-none">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">{getTitle()}</h2>
                            <p className="text-gray-500">{getDescription()}</p>
                        </div>

                        {(authMode === 'login' || authMode === 'register') && (
                            <>
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <button type="button" onClick={handleGoogleLogin} className="bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm"><GoogleIcon /> Google</button>
                                    <button type="button" onClick={handleFacebookLogin} className="bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 text-sm"><FacebookIcon /> Facebook</button>
                                </div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="h-px bg-gray-200 flex-1"></div>
                                    <span className="text-gray-400 text-sm">lub email</span>
                                    <div className="h-px bg-gray-200 flex-1"></div>
                                </div>
                            </>
                        )}

                        <AnimatePresence>
                            {apiError && (
                                <motion.div variants={expandVariants} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm flex flex-col gap-1">
                                        <div className="flex items-center gap-2"><AlertCircle size={16} />{apiError}</div>
                                        {apiError.includes('wygasł') && (
                                            <button type="button" onClick={() => { setApiError(''); setAuthMode('forgot-password'); }} className="text-xs font-bold text-[#6366F1] hover:underline w-fit ml-6">
                                                Wyślij nową prośbę o reset hasła
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                            {apiSuccess && (
                                <motion.div variants={expandVariants} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm flex items-center gap-2">
                                        <CheckCircle size={16} />{apiSuccess}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {authMode === 'parental-pending' && (
                            <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6">
                                <div className="flex flex-col items-center gap-4 py-4">
                                    <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-4xl">
                                        👨‍👩‍👧
                                    </div>
                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-center w-full">
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            Wysłaliśmy prośbę o zgodę na adres:
                                        </p>
                                        <p className="font-bold text-gray-900 mt-1 break-all">{parentalEmail}</p>
                                        <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                                            Rodzic musi kliknąć w link w emailu, aby aktywować Twoje konto. Link jest ważny 72 godziny.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleResendParentalConsent}
                                        disabled={resendTimer > 0 || isResending}
                                        className={`text-sm font-bold flex items-center gap-2 transition-colors ${resendTimer > 0 ? 'text-gray-400' : 'text-[#6366F1] hover:text-[#4F46E5]'}`}
                                    >
                                        {isResending ? <Loader2 className="animate-spin" size={16} /> : <RotateCw size={16} />}
                                        {resendTimer > 0 ? `Wyślij ponownie za ${resendTimer}s` : 'Wyślij link ponownie'}
                                    </button>
                                </div>
                                <div className="pt-4 border-t border-gray-100 text-center">
                                    <button type="button" onClick={handleBackToLogin} className="text-[#6366F1] font-bold hover:underline text-sm">
                                        Wróć do logowania
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} noValidate className={`flex flex-col ${authMode === 'parental-pending' ? 'hidden' : ''}`}>
                            <AnimatePresence initial={false} mode="wait">
                                {authMode === '2fa' ? (
                                    <motion.div key="twofa-fields" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6 pb-4">
                                        <div className="flex justify-between gap-2">
                                            {verificationCode.map((digit, idx) => (
                                                <input
                                                    key={idx}
                                                    ref={el => { codeInputsRef.current[idx] = el; }}
                                                    type="text" maxLength={1} inputMode="numeric" value={digit}
                                                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                                                    onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                                                    onPaste={handlePaste}
                                                    className="w-full h-14 text-center text-2xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6366F1] outline-none transition-all"
                                                />
                                            ))}
                                        </div>
                                        {twoFaMethod === 'email' && (
                                            <div className="text-center">
                                                <button type="button" onClick={handleResend2FA} disabled={resendTimer > 0 || isResending}
                                                    className={`text-sm font-bold flex items-center justify-center gap-2 mx-auto transition-colors ${resendTimer > 0 ? 'text-gray-400' : 'text-[#6366F1] hover:text-[#4F46E5]'}`}>
                                                    {isResending ? <Loader2 className="animate-spin" size={16} /> : <RotateCw size={16} />}
                                                    {resendTimer > 0 ? `Wyślij ponownie za ${resendTimer}s` : 'Wyślij nowy kod'}
                                                </button>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : authMode === 'verify' ? (
                                    <motion.div key="verify-fields" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-6 pb-4">
                                        <div className="flex justify-between gap-2">
                                            {verificationCode.map((digit, idx) => (
                                                <input
                                                    key={idx}
                                                    ref={el => { codeInputsRef.current[idx] = el; }}
                                                    type="text" maxLength={1} inputMode="numeric" value={digit}
                                                    onChange={(e) => handleCodeChange(idx, e.target.value)}
                                                    onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                                                    onPaste={handlePaste}
                                                    className="w-full h-14 text-center text-2xl font-bold bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#6366F1] outline-none transition-all"
                                                />
                                            ))}
                                        </div>
                                        <div className="text-center">
                                            <button type="button" onClick={handleResendCode} disabled={resendTimer > 0 || isResending}
                                                className={`text-sm font-bold flex items-center justify-center gap-2 mx-auto transition-colors ${resendTimer > 0 ? 'text-gray-400' : 'text-[#6366F1] hover:text-[#4F46E5]'}`}>
                                                {isResending ? <Loader2 className="animate-spin" size={16} /> : <RotateCw size={16} />}
                                                {resendTimer > 0 ? `Wyślij ponownie za ${resendTimer}s` : 'Wyślij nowy kod'}
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : authMode === 'social-dob' ? (
                                    <motion.div key="social-dob-fields" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="flex flex-col gap-4">
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-xs text-indigo-700 leading-relaxed">
                                            Wymagamy daty urodzenia zgodnie z przepisami o ochronie danych (RODO). Informacja jest przechowywana bezpiecznie i nie jest widoczna publicznie.
                                        </div>
                                        <div>
                                            <div className={`relative rounded-xl border transition-all flex items-center bg-gray-50 ${dateOfBirthError ? 'border-red-300 bg-red-50' : 'border-gray-200 focus-within:ring-2 focus-within:ring-[#6366F1]'}`}>
                                                <Calendar className={`absolute left-4 z-10 ${dateOfBirthError ? 'text-red-400' : 'text-gray-400'}`} size={20} />
                                                <input
                                                    type="date"
                                                    value={dateOfBirth}
                                                    onChange={e => setDateOfBirth(e.target.value)}
                                                    max={new Date().toISOString().split('T')[0]}
                                                    required
                                                    className="w-full bg-transparent border-none outline-none py-3 pl-12 pr-4 text-gray-900"
                                                />
                                            </div>
                                            {dateOfBirthError && <div className="text-red-500 text-xs pl-4 font-medium mt-1 -ml-1">{dateOfBirthError}</div>}
                                        </div>
                                        <AnimatePresence>
                                            {isMinor && (
                                                <motion.div variants={expandVariants} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                                                    <div className="pb-1">
                                                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-3 text-xs text-indigo-700 leading-relaxed">
                                                            Masz mniej niż 16 lat — wymagamy zgody rodzica lub opiekuna prawnego. Podaj jego adres email.
                                                        </div>
                                                        <div className="relative">
                                                            <MailIcon className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 ${parentalEmailError ? 'text-red-400' : 'text-indigo-400'}`} size={20} />
                                                            <input
                                                                type="email"
                                                                value={parentalEmail}
                                                                onChange={e => setParentalEmail(e.target.value)}
                                                                className={`w-full border rounded-xl py-3 pl-12 pr-4 outline-none transition-all ${parentalEmailError ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-indigo-200 focus:ring-2 focus:ring-[#6366F1]'}`}
                                                                placeholder="Email rodzica / opiekuna"
                                                            />
                                                        </div>
                                                        {parentalEmailError && <div className="text-red-500 text-xs pl-4 font-medium mt-1 -ml-1">{parentalEmailError}</div>}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                ) : authMode === 'forgot-password' ? (
                                    <motion.div key="forgot-password-fields" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                                        <div className="relative">
                                            <MailIcon className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 ${emailError ? 'text-red-400' : 'text-gray-400'}`} size={20} />
                                            <input name="email" required type="email" value={email} onChange={handleEmailChange} onBlur={handleEmailBlur}
                                                autoComplete="email"
                                                autoCorrect="off"
                                                autoCapitalize="none"
                                                enterKeyHint="done"
                                                className={`w-full bg-gray-50 border rounded-xl py-3 pl-12 pr-4 outline-none transition-all ${emailError ? 'border-red-300 focus:ring-2 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-[#6366F1]'}`}
                                                placeholder="Adres email" />
                                            {emailError && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"><AlertCircle size={20} /></div>}
                                        </div>
                                        {emailError && <div className="text-red-500 text-xs pl-4 font-medium mt-1 -ml-1">{emailError}</div>}
                                    </motion.div>
                                ) : (
                                    <motion.div key="auth-fields" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                                        <AnimatePresence initial={false} mode="sync">
                                            {authMode === 'register' && (
                                                <motion.div variants={expandVariants} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                                                    <div className="flex flex-col gap-4 pb-4 p-1">
                                                        <div className="flex gap-4">
                                                            <div className="relative flex-1">
                                                                <div className="relative">
                                                                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 ${firstNameError ? 'text-red-400' : 'text-gray-400'}`} size={20} />
                                                                    <input name="firstName" required value={firstName}
                                                                        onChange={handleFirstNameChange}
                                                                        autoComplete="given-name"
                                                                        autoCorrect="off"
                                                                        autoCapitalize="words"
                                                                        enterKeyHint="next"
                                                                        className={`w-full border rounded-xl py-3 pl-12 pr-4 outline-none transition-all ${firstNameError ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-[#6366F1]'}`}
                                                                        placeholder="Imię" />
                                                                </div>
                                                                {firstNameError && <div className="text-red-500 text-xs pl-4 font-medium mt-1 -ml-1">{firstNameError}</div>}
                                                            </div>
                                                            <div className="relative flex-1">
                                                                <div className="relative">
                                                                    <User className={`absolute left-4 top-1/2 -translate-y-1/2 ${lastNameError ? 'text-red-400' : 'text-gray-400'}`} size={20} />
                                                                    <input name="lastName" required value={lastName}
                                                                        onChange={handleLastNameChange}
                                                                        autoComplete="family-name"
                                                                        autoCorrect="off"
                                                                        autoCapitalize="words"
                                                                        enterKeyHint="next"
                                                                        className={`w-full border rounded-xl py-3 pl-12 pr-4 outline-none transition-all ${lastNameError ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-[#6366F1]'}`}
                                                                        placeholder="Nazwisko" />
                                                                </div>
                                                                {lastNameError && <div className="text-red-500 text-xs pl-4 font-medium mt-1 -ml-1">{lastNameError}</div>}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className={`relative group rounded-xl border transition-all flex items-center bg-gray-50 py-3 ${phoneError ? 'border-red-300 bg-red-50' : 'border-gray-200 focus-within:ring-2 focus-within:ring-[#6366F1]'}`}>
                                                                <Phone className={`absolute left-4 z-10 ${phoneError ? 'text-red-400' : 'text-gray-400'}`} size={20} />
                                                                <div className="pl-12 pr-4 flex items-center w-full">
                                                                    <span className="text-gray-500 mr-1 select-none">+48</span>
                                                                    <input ref={phoneInputRef} type="tel" value={phoneNumber}
                                                                        onChange={handlePhoneChange} onKeyDown={handlePhoneKeyDown} onBlur={handlePhoneBlur}
                                                                        autoComplete="tel"
                                                                        enterKeyHint="next"
                                                                        className="w-full bg-transparent border-none outline-none p-0 text-gray-900 placeholder:text-gray-300"
                                                                        placeholder="000-000-000" />
                                                                </div>
                                                                {phoneError && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 z-20"><AlertCircle size={20} /></div>}
                                                            </div>
                                                            {phoneError && <div className="text-red-500 text-xs pl-4 font-medium mt-1 -ml-1">{phoneError}</div>}
                                                        </div>
                                                        <div>
                                                            <div className={`relative rounded-xl border transition-all flex items-center bg-gray-50 ${dateOfBirthError ? 'border-red-300 bg-red-50' : 'border-gray-200 focus-within:ring-2 focus-within:ring-[#6366F1]'}`}>
                                                                <Calendar className={`absolute left-4 z-10 ${dateOfBirthError ? 'text-red-400' : 'text-gray-400'}`} size={20} />
                                                                <input
                                                                    type="date"
                                                                    value={dateOfBirth}
                                                                    onChange={e => { setDateOfBirth(e.target.value); }}
                                                                    max={new Date().toISOString().split('T')[0]}
                                                                    className="w-full bg-transparent border-none outline-none py-3 pl-12 pr-4 text-gray-900 placeholder:text-gray-400"
                                                                    placeholder="Data urodzenia (opcjonalnie)"
                                                                />
                                                            </div>
                                                            {dateOfBirthError
                                                                ? <div className="text-red-500 text-xs pl-4 font-medium mt-1 -ml-1">{dateOfBirthError}</div>
                                                                : <div className="text-gray-400 text-xs pl-4 mt-1">Data urodzenia — wymagana tylko dla osób poniżej 16 lat</div>
                                                            }
                                                        </div>
                                                        <AnimatePresence>
                                                            {isMinor && (
                                                                <motion.div variants={expandVariants} initial="hidden" animate="visible" exit="exit" className="overflow-hidden -mx-1 px-1">
                                                                    <div className="pb-1">
                                                                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-2 text-xs text-indigo-700 leading-relaxed">
                                                                            Masz mniej niż 16 lat — zgodnie z RODO wymagamy zgody rodzica lub opiekuna prawnego. Podaj jego adres email, a wyślemy mu prośbę o potwierdzenie.
                                                                        </div>
                                                                        <div className="relative">
                                                                            <MailIcon className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 ${parentalEmailError ? 'text-red-400' : 'text-indigo-400'}`} size={20} />
                                                                            <input
                                                                                type="email"
                                                                                value={parentalEmail}
                                                                                onChange={e => setParentalEmail(e.target.value)}
                                                                                autoComplete="off"
                                                                                autoCorrect="off"
                                                                                autoCapitalize="none"
                                                                                enterKeyHint="done"
                                                                                className={`w-full border rounded-xl py-3 pl-12 pr-4 outline-none transition-all ${parentalEmailError ? 'border-red-300 bg-red-50' : 'bg-gray-50 border-indigo-200 focus:ring-2 focus:ring-[#6366F1]'}`}
                                                                                placeholder="Email rodzica / opiekuna"
                                                                            />
                                                                        </div>
                                                                        {parentalEmailError && <div className="text-red-500 text-xs pl-4 font-medium mt-1 -ml-1">{parentalEmailError}</div>}
                                                                    </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="flex flex-col gap-4 relative">
                                            {authMode !== 'reset-password' && (
                                                <div>
                                                    <div className="relative">
                                                        <MailIcon className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 ${emailError ? 'text-red-400' : 'text-gray-400'}`} size={20} />
                                                        <input name="email" required type="email" value={email} onChange={handleEmailChange} onBlur={handleEmailBlur}
                                                            autoComplete="email"
                                                            autoCorrect="off"
                                                            autoCapitalize="none"
                                                            enterKeyHint="next"
                                                            className={`w-full bg-gray-50 border rounded-xl py-3 pl-12 pr-4 outline-none transition-all ${emailError ? 'border-red-300 focus:ring-2 focus:ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-2 focus:ring-[#6366F1]'}`}
                                                            placeholder="Adres email" />
                                                        {emailError && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500"><AlertCircle size={20} /></div>}
                                                    </div>
                                                    {emailError && <div className="text-red-500 text-xs pl-4 font-medium mt-1 -ml-1">{emailError}</div>}
                                                </div>
                                            )}

                                            <div className="flex flex-col">
                                                <div className="relative">
                                                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 ${passwordError ? 'text-red-400' : 'text-gray-400'}`} size={20} />
                                                    <input name="password" required type={showPassword ? "text" : "password"} value={password}
                                                        onChange={handlePasswordChange}
                                                        autoComplete={authMode === 'register' || authMode === 'reset-password' ? 'new-password' : 'current-password'}
                                                        enterKeyHint={authMode === 'login' ? 'done' : 'next'}
                                                        className={`w-full bg-gray-50 border rounded-xl py-3 pl-12 pr-12 transition-all outline-none focus:outline-none focus:ring-2 ring-inset ${passwordError ? 'border-red-300 ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-[#6366F1] focus:bg-white'}`}
                                                        placeholder={authMode === 'reset-password' ? "Nowe hasło" : "Hasło"} />
                                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none z-20">
                                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                    </button>
                                                </div>
                                                {passwordError && <div className="text-red-500 text-xs pl-4 font-medium mt-1">{passwordError}</div>}

                                                <AnimatePresence>
                                                    {(authMode === 'register' || authMode === 'reset-password') && password.length > 0 && (
                                                        <motion.div key="password-feedback" variants={passwordFeedbackVariants} initial="hidden" animate="visible" exit="exit" className="overflow-hidden w-full">
                                                            <div className="flex flex-col gap-3">
                                                                <div className="flex gap-0.5 h-1.5 px-1">
                                                                    {[0, 1, 2].map(level => (
                                                                        <div key={level} className={`flex-1 h-full rounded-full transition-all duration-500 ${(level < 2 ? (passwordStrength?.score ?? 0) > level : (passwordStrength?.score ?? 0) >= 4) ? getStrengthColor(passwordStrength?.score ?? 0) : 'bg-gray-200/50'}`} />
                                                                    ))}
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-2 pl-1">
                                                                    {passwordRequirements.map((req, i) => (
                                                                        <div key={i} className="flex items-center gap-1.5 text-xs">
                                                                            <div className={`flex items-center justify-center w-4 h-4 rounded-full ${req.met ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                                                {req.met ? <Check size={10} strokeWidth={3} /> : <div className="w-1 h-1 bg-gray-300 rounded-full" />}
                                                                            </div>
                                                                            <span className={req.met ? 'text-gray-600 font-medium' : 'text-gray-400'}>{req.label}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <AnimatePresence>
                                                    {authMode === 'reset-password' && (
                                                        <motion.div key="confirm-password" variants={expandVariants} initial="hidden" animate="visible" exit="exit" className="overflow-hidden mt-4">
                                                            <div className="flex flex-col">
                                                                <div className="relative">
                                                                    <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 z-10 ${confirmPasswordError ? 'text-red-400' : 'text-gray-400'}`} size={20} />
                                                                                    <input
                                                                        name="confirmPassword"
                                                                        type={showPassword ? "text" : "password"}
                                                                        value={confirmPassword}
                                                                        onChange={handleConfirmPasswordChange}
                                                                        autoComplete="new-password"
                                                                        enterKeyHint="done"
                                                                        className={`w-full bg-gray-50 border rounded-xl py-3 pl-12 pr-12 transition-all outline-none focus:outline-none focus:ring-2 ring-inset ${confirmPasswordError ? 'border-red-300 ring-red-200 bg-red-50' : 'border-gray-200 focus:ring-[#6366F1] focus:bg-white'}`}
                                                                        placeholder="Powtórz nowe hasło"
                                                                    />
                                                                    {confirmPassword && (
                                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 z-10">
                                                                            {confirmPassword === password
                                                                                ? <Check size={18} className="text-emerald-500" strokeWidth={3} />
                                                                                : <AlertCircle size={18} className="text-red-400" />
                                                                            }
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {confirmPasswordError && <div className="text-red-500 text-xs pl-4 font-medium mt-1">{confirmPasswordError}</div>}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </div>

                                        <div className={`flex justify-end mt-2 mr-1 transition-opacity duration-300 ${authMode === 'login' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                            <button type="button" onClick={() => { setAuthMode('forgot-password'); setApiError(''); }} className="text-sm font-bold text-[#6366F1] hover:underline focus:outline-none">Zapomniałeś hasła?</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <AnimatePresence>
                                {authMode === 'register' && (
                                    <motion.div variants={expandVariants} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                                        <div className="mt-6 flex flex-col gap-4 p-1">
                                            <div className="relative">
                                                <Gift className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                                <input
                                                    type="text"
                                                    value={referralCode}
                                                    onChange={e => {
                                                        const val = e.target.value;
                                                        try {
                                                            const url = new URL(val);
                                                            const parts = url.pathname.split('/');
                                                            const idx = parts.findIndex(p => p === 'r' || p === 'invite' || p === 'ref');
                                                            if (idx !== -1 && parts[idx + 1]) { setReferralCode(parts[idx + 1].toUpperCase()); return; }
                                                        } catch { /* not a URL */ }
                                                        setReferralCode(val.toUpperCase());
                                                    }}
                                                    placeholder="Kod polecający (opcjonalnie)"
                                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 pl-12 pr-4 outline-none transition-all focus:ring-2 focus:ring-[#6366F1]"
                                                />
                                            </div>
                                            <AnimatePresence>
                                                {!dateOfBirth && (
                                                    <motion.div variants={expandVariants} initial="hidden" animate="visible" exit="exit" className="overflow-hidden">
                                                        <label className="flex items-start gap-3 cursor-pointer">
                                                            <div className="relative flex items-center pt-0.5">
                                                                <input type="checkbox" checked={acceptAgeConfirmation}
                                                                    onChange={(e) => handleAcceptAgeConfirmationChange(e.target.checked)}
                                                                    className={`peer h-5 w-5 cursor-pointer appearance-none rounded-md border bg-gray-50 checked:bg-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none ${ageConfirmationError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                                                                <Check className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" strokeWidth={4} />
                                                            </div>
                                                            <span className={`text-sm leading-tight ${ageConfirmationError ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                                                                Potwierdzam, że mam ukończone 13 lat
                                                            </span>
                                                        </label>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <div className="relative flex items-center pt-0.5">
                                                    <input type="checkbox" checked={acceptTerms}
                                                        onChange={(e) => handleAcceptTermsChange(e.target.checked)}
                                                        className={`peer h-5 w-5 cursor-pointer appearance-none rounded-md border bg-gray-50 checked:bg-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none ${termsError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`} />
                                                    <Check className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" strokeWidth={4} />
                                                </div>
                                                <span className={`text-sm leading-tight ${termsError ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                                                    Akceptuję <Link href="/regulamin" className="font-semibold text-[#6366F1]">Regulamin</Link> oraz <Link href="/polityka-prywatnosci" className="font-semibold text-[#6366F1]">Politykę Prywatności</Link>
                                                </span>
                                            </label>
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <div className="relative flex items-center pt-0.5">
                                                    <input type="checkbox" checked={acceptNewsletter} onChange={(e) => setAcceptNewsletter(e.target.checked)}
                                                        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-gray-300 bg-gray-50 checked:bg-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 outline-none" />
                                                    <Check className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" strokeWidth={4} />
                                                </div>
                                                <span className="text-sm text-gray-600 leading-tight">Chcę otrzymywać newsletter z informacjami o nowościach i promocjach</span>
                                            </label>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <button disabled={isLoading || ((authMode === 'register' || authMode === 'reset-password') && (passwordStrength?.score ?? 0) < 4)}
                                className="w-full bg-[#6366F1] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#4F46E5] shadow-lg shadow-indigo-200 transition-all active:scale-95 mt-7 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
                                {isLoading ? <><Loader2 className="animate-spin" /> Przetwarzanie...</> : (
                                    authMode === 'login' ? 'Zaloguj się' :
                                    authMode === 'register' ? 'Zarejestruj się' :
                                    authMode === 'social-dob' ? 'Kontynuuj' :
                                    authMode === '2fa' ? 'Potwierdź' :
                                    authMode === 'verify' ? 'Potwierdź kod' :
                                    authMode === 'forgot-password' ? 'Wyślij link' : 'Zmień hasło'
                                )}
                            </button>
                        </form>

                        {authMode !== 'parental-pending' && (
                            <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm">
                                <p className="text-gray-500">
                                    {authMode === '2fa' || authMode === 'verify' || authMode === 'forgot-password' || authMode === 'reset-password' || authMode === 'social-dob' ? (
                                        <button type="button" onClick={handleBackToLogin} className="text-[#6366F1] font-bold hover:underline">Wróć do logowania</button>
                                    ) : (
                                        <>{authMode === 'login' ? 'Nie masz jeszcze konta?' : 'Masz już konto?'}
                                        <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setApiError(''); }} className="text-[#6366F1] font-bold ml-2 hover:underline">
                                            {authMode === 'login' ? 'Zarejestruj się' : 'Zaloguj się'}
                                        </button></>
                                    )}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthView;
