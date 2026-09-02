'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Star, ShieldCheck } from 'lucide-react';

export const InviteView = () => {
    const params = useParams();
    const code = params?.code as string | undefined;
    const router = useRouter();

    useEffect(() => {
        if (code && /^[a-zA-Z0-9_-]{3,32}$/.test(code)) localStorage.setItem('referral_code', code);
    }, [code]);

    const handleRegister = () => {
        router.push('/auth');
    };

    return (
        <div className="min-h-screen bg-[#F4F4F9] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    <div className="w-9 h-9 bg-[#6366F1] rounded-xl flex items-center justify-center">
                        <MapPin size={18} className="text-white" strokeWidth={2.5} />
                    </div>
                    <span className="text-xl font-black text-gray-900 tracking-tight">MyLokalni.pl</span>
                </div>

                {/* Card */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    {/* Top banner */}
                    <div className="bg-[#6366F1] px-8 pt-8 pb-10 text-white text-center relative overflow-hidden">
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                            className="absolute -top-8 -right-8 w-32 h-32 rounded-full border-[20px] border-white/5 pointer-events-none"
                        />
                        <div className="w-16 h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
                            🎁
                        </div>
                        <h1 className="text-2xl font-black tracking-tight mb-2">Masz zaproszenie!</h1>
                        <p className="text-indigo-200 text-sm font-medium leading-relaxed">
                            Twój znajomy zaprasza Cię do MyLokalni.pl — platformy łączącej mieszkańców z lokalnymi wykonawcami.
                        </p>
                    </div>

                    {/* Features */}
                    <div className="px-8 py-6 space-y-4">
                        {[
                            { icon: <MapPin size={16} />, text: 'Znajdź sprawdzonych wykonawców w swojej okolicy' },
                            { icon: <Star size={16} />, text: 'Oceny i opinie od prawdziwych klientów' },
                            { icon: <ShieldCheck size={16} />, text: 'Bezpieczny kontakt i rezerwacje online' },
                        ].map(({ icon, text }) => (
                            <div key={text} className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-indigo-50 text-[#6366F1] rounded-xl flex items-center justify-center shrink-0">
                                    {icon}
                                </div>
                                <span className="text-sm font-medium text-gray-700">{text}</span>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="px-8 pb-8 space-y-3">
                        <button
                            onClick={handleRegister}
                            className="w-full bg-[#6366F1] text-white rounded-2xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#4F46E5] active:scale-95 transition-all shadow-xl shadow-indigo-100"
                        >
                            Dołącz za darmo <ArrowRight size={16} />
                        </button>
                        <button
                            onClick={() => router.push('/auth')}
                            className="w-full text-center text-xs text-gray-400 hover:text-gray-600 font-medium py-1.5 transition-colors"
                        >
                            Mam już konto — zaloguj się
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
