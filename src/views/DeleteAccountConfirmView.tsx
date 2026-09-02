'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, XCircle, Home } from 'lucide-react';
import { authService } from '../services/authService';
import type { ToastType } from '../types';

export const DeleteAccountConfirmView = ({ addToast }: { addToast?: (msg: string, type?: ToastType) => void }) => {
    const searchParams = useSearchParams()
    const router = useRouter();
    ;
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Trwa usuwanie Twojego konta...');
    
    const requestStarted = useRef(false);

    useEffect(() => {
        const confirmDeletion = async () => {
            if (requestStarted.current) return;

            const queryParams = searchParams;
            const token = queryParams.get('token');

            if (!token) {
                setStatus('error');
                setMessage('Nie odnaleziono klucza autoryzacyjnego w linku.');
                return;
            }

            requestStarted.current = true;

            try {
                await authService.confirmAccountDeletion(token);
                
                // --- PANCERNE CZYSZCZENIE DANYCH ---
                const keysToRemove = [
                    'userToken',
                    'user_profile',
                    'is_logged_in',
                    'user_favorites',
                    'user_bookings',
                    'user_chats',
                    'user_location'
                ];
                
                keysToRemove.forEach(key => localStorage.removeItem(key));
                
                // Opcjonalnie: sessionStorage.clear() jeśli tam coś przechowujesz
                sessionStorage.clear();

                setStatus('success');
                setMessage('Twoje konto oraz wszystkie powiązane dane zostały trwale usunięte z naszego systemu oraz z tej przeglądarki.');
                
                if (addToast) addToast("Konto zostało usunięte.", "success");
                
            } catch (error: unknown) {
                setStatus('error');
                setMessage((error as Error).message || 'Klucz wygasł lub wystąpił błąd podczas komunikacji z serwerem.');
                if (addToast) addToast("Błąd usuwania konta.", "error");
            }
        };

        confirmDeletion();
    }, [searchParams, addToast]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-20">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-xl border border-gray-100 text-center"
            >
                <div className="mb-8 flex justify-center">
                    {status === 'loading' && (
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                            <Loader2 size={40} className="animate-spin" />
                        </div>
                    )}
                    {status === 'success' && (
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                            <CheckCircle2 size={40} />
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
                            <XCircle size={40} />
                        </div>
                    )}
                </div>

                <h1 className="text-2xl font-black text-gray-900 mb-4">
                    {status === 'loading' && "Przetwarzanie..."}
                    {status === 'success' && "Konto usunięte"}
                    {status === 'error' && "Wystąpił błąd"}
                </h1>

                <div className={`text-sm font-medium mb-10 leading-relaxed px-4 ${status === 'error' ? 'text-rose-500 bg-rose-50 py-4 rounded-2xl border border-rose-100' : 'text-gray-500'}`}>
                    {message}
                </div>

                <button 
                    onClick={() => router.push('/')}
                    className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Home size={18} />
                    Wróć do strony głównej
                </button>
            </motion.div>
        </div>
    );
};