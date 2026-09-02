'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { KeyRound, ShieldCheck, Loader2, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';

const passwordFeedbackVariants: Variants = {
    hidden: { opacity: 0, height: 0, marginTop: 0 },
    visible: {
        opacity: 1,
        height: 'auto',
        marginTop: 15,
        transition: {
            height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
            marginTop: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
            opacity: { duration: 0.2, delay: 0.1 }
        }
    },
    exit: {
        opacity: 0,
        height: 0,
        marginTop: 0,
        transition: {
            height: { duration: 0.25, ease: "easeInOut" },
            marginTop: { duration: 0.25, ease: "easeInOut" },
            opacity: { duration: 0.15 }
        }
    }
};

export const PasswordSection = ({
                                    isChangingPassword,
                                    setIsChangingPassword,
                                    passwordData,
                                    setPasswordData,
                                    handlePasswordChange,
                                    isPasswordLoading,
                                    hasPasswordMethod
                                }: {
    isChangingPassword: boolean;
    setIsChangingPassword: (v: boolean) => void;
    passwordData: { oldPassword: string; newPassword: string; confirmPassword: string };
    setPasswordData: (v: { oldPassword: string; newPassword: string; confirmPassword: string }) => void;
    handlePasswordChange: (e: React.FormEvent) => void;
    isPasswordLoading: boolean;
    hasPasswordMethod: boolean;
}) => {
    const [showOldPass, setShowOldPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);

    const passwordRequirements = [
        { label: '8 znaków', met: passwordData.newPassword.length >= 8 },
        { label: 'Duże i małe litery', met: /[a-z]/.test(passwordData.newPassword) && /[A-Z]/.test(passwordData.newPassword) },
        { label: 'Cyfry', met: /\d/.test(passwordData.newPassword) },
        { label: 'Znak specjalny', met: /[^A-Za-z0-9]/.test(passwordData.newPassword) },
    ];

    const score = passwordRequirements.filter(req => req.met).length;
    const passwordsMatch = passwordData.newPassword === passwordData.confirmPassword && passwordData.confirmPassword.length > 0;
    const isSameAsOld = hasPasswordMethod && passwordData.oldPassword === passwordData.newPassword && passwordData.newPassword.length > 0;

    const getStrengthColor = (s: number) => {
        switch (s) {
            case 0: return 'bg-rose-500';
            case 1: return 'bg-rose-400';
            case 2: return 'bg-amber-400';
            case 3: return 'bg-emerald-400';
            case 4: return 'bg-emerald-500';
            default: return 'bg-gray-200';
        }
    };

    const handleTogglePasswordPanel = () => {
        if (isChangingPassword) {
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            setShowOldPass(false);
            setShowNewPass(false);
        }
        setIsChangingPassword(!isChangingPassword);
    };

    return (
        <div className="overflow-visible">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <KeyRound size={18} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">
                            {hasPasswordMethod ? "Hasło dostępu" : "Zabezpiecz konto hasłem"}
                        </h4>
                        <p className="text-xs text-gray-400">
                            {hasPasswordMethod
                                ? "Zmień swoje hasło regularnie dla bezpieczeństwa."
                                : "Ustaw hasło, aby móc logować się również adresem e-mail."}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleTogglePasswordPanel}
                    className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${isChangingPassword ? 'bg-gray-100 text-gray-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                >
                    {isChangingPassword ? "Anuluj" : (hasPasswordMethod ? "Zmień hasło" : "Ustaw hasło")}
                </button>
            </div>

            <AnimatePresence initial={false}>
                {isChangingPassword && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{
                            height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                            opacity: { duration: 0.25 }
                        }}
                        className="overflow-visible"
                    >
                        <div className="pt-6 pb-4 overflow-visible">
                            <form onSubmit={handlePasswordChange} className="space-y-4 overflow-visible">
                                {hasPasswordMethod && (
                                    <div className="relative">
                                        <input
                                            type={showOldPass ? "text" : "password"}
                                            placeholder="Obecne hasło"
                                            required
                                            className="w-full bg-gray-50 rounded-xl p-4 text-sm border-none focus:ring-2 focus:ring-indigo-100 outline-none transition-all ring-inset pr-12 font-medium"
                                            value={passwordData.oldPassword}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                        />
                                        <button type="button" onClick={() => setShowOldPass(!showOldPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showOldPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <input
                                            type={showNewPass ? "text" : "password"}
                                            placeholder={hasPasswordMethod ? "Nowe hasło" : "Utwórz hasło"}
                                            required
                                            className="w-full bg-gray-50 rounded-xl p-4 text-sm border-none focus:ring-2 focus:ring-indigo-100 outline-none transition-all ring-inset pr-12 font-medium"
                                            value={passwordData.newPassword}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        />
                                        <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                            {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showNewPass ? "text" : "password"}
                                            placeholder="Powtórz hasło"
                                            required
                                            className="w-full bg-gray-50 rounded-xl p-4 text-sm border-none focus:ring-2 focus:ring-indigo-100 outline-none transition-all ring-inset font-medium"
                                            value={passwordData.confirmPassword}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {passwordData.newPassword.length > 0 && (
                                        <motion.div key="password-feedback-settings" variants={passwordFeedbackVariants} initial="hidden" animate="visible" exit="exit" className="overflow-visible w-full">
                                            <div className="flex flex-col gap-3">
                                                <div className="flex gap-0.5 h-1.5 px-1">
                                                    {[0, 1, 2].map((level) => (
                                                        <div key={level} className={`flex-1 h-full rounded-full transition-all duration-500 ${(level < 2 ? score > level : score >= 4) ? getStrengthColor(score) : 'bg-gray-200/50'}`} />
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 pl-1">
                                                    {passwordRequirements.map((req, index) => (
                                                        <div key={index} className="flex items-center gap-1.5 text-xs">
                                                            <div className={`flex items-center justify-center w-4 h-4 rounded-full ${req.met ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                                                {req.met ? <Check size={10} strokeWidth={3} /> : <div className="w-1 h-1 bg-gray-300 rounded-full" />}
                                                            </div>
                                                            <span className={req.met ? 'text-gray-600 font-medium' : 'text-gray-400'}>{req.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                {isSameAsOld && <div className="flex items-center gap-2 text-rose-500 text-[11px] font-bold pl-1 mt-1"><AlertCircle size={14} />Nowe hasło nie może być takie samo jak obecne</div>}
                                                {passwordData.confirmPassword.length > 0 && !passwordsMatch && <div className="flex items-center gap-2 text-rose-500 text-[11px] font-bold pl-1 mt-1"><AlertCircle size={14} />Hasła nie są identyczne</div>}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    type="submit"
                                    disabled={isPasswordLoading || score < 4 || !passwordsMatch || isSameAsOld}
                                    className="group relative overflow-hidden w-full py-4 bg-[#6366F1] text-white rounded-2xl text-[13px] font-bold transition-all hover:bg-[#4F46E5] active:scale-95 shadow-xl shadow-indigo-100 disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {/* Treść przycisku */}
                                    <div className="flex items-center gap-2 relative z-10">
                                        {isPasswordLoading ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : (
                                            <>
                                                <ShieldCheck size={18} strokeWidth={2.5} />
                                                <span className="uppercase tracking-[0.1em] text-[11px] font-black">
                                                    {hasPasswordMethod ? "Zatwierdź zmianę hasła" : "Ustaw hasło dostępu"}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Efekt Shimmer (Błysk) */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};