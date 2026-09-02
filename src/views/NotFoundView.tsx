'use client';
import { useRouter } from 'next/navigation';
import { Home, AlertCircle } from 'lucide-react';

const NotFoundView = () => {
    const router = useRouter();

    return (
        <div className="fixed inset-0 z-[999999] bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
            <div className="flex flex-col items-center">
                <div className="bg-red-50 p-6 rounded-full mb-6 animate-bounce">
                    <AlertCircle size={64} className="text-red-500" />
                </div>

                <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-2">404</h1>
                <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Ups! Ta strona nie istnieje.</h2>

                <p className="text-gray-500 max-w-md mb-8 leading-relaxed">
                    Wygląda na to, że adres, który wpisałeś, jest nieprawidłowy lub strona została przeniesiona.
                </p>

                <button
                    onClick={() => router.push('/')}
                    className="bg-[#6366F1] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#4F46E5] active:scale-95 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                >
                    <Home size={20} /> Wróć na stronę główną
                </button>
            </div>
        </div>
    );
};
export default NotFoundView;