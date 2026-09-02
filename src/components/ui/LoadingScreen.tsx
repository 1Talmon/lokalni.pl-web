'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface LoadingScreenProps {
    isVisible: boolean;
    message?: string;
}

export const LoadingScreen = ({ isVisible, message = "Ładowanie..." }: LoadingScreenProps) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    key="global-loader"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="fixed inset-0 z-[9999] bg-white"
                >
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                        <motion.div
                            animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="relative flex items-center justify-center"
                        >
                            <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl animate-pulse" />
                            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center relative z-10 border border-indigo-100">
                                <Sparkles className="text-indigo-600" size={36} />
                            </div>
                            <div className="absolute inset-[-8px] border-2 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                        </motion.div>
                        <h2 className="mt-10 text-2xl font-black text-gray-900 tracking-tight">
                            MyLokalni<span className="text-indigo-600">.</span>
                        </h2>
                        <p className="text-gray-400 text-sm font-medium mt-2">{message}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
