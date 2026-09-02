'use client';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint } from 'lucide-react';

interface AppLockProps {
    onVerify: () => void;
    verifying: boolean;
}

export const AppLock = ({ onVerify, verifying }: AppLockProps) => {
    useEffect(() => {
        onVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-once biometric verify, re-running on prop change would be incorrect
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center gap-8"
            style={{
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
            }}
        >
            <div className="w-24 h-24 bg-indigo-50 text-[#6366F1] rounded-[2.5rem] flex items-center justify-center shadow-lg shadow-indigo-100">
                <Fingerprint size={48} />
            </div>

            <div className="text-center space-y-1">
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">MyLokalni.pl</h2>
                <p className="text-sm font-medium text-gray-400">
                    Zweryfikuj tożsamość, aby kontynuować
                </p>
            </div>

            <button
                onClick={onVerify}
                disabled={verifying}
                className="px-10 py-4 bg-[#6366F1] text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-lg shadow-indigo-100 active:scale-[0.97] transition-all disabled:opacity-50"
            >
                {verifying ? 'Weryfikacja…' : 'Odblokuj'}
            </button>
        </motion.div>
    );
};
