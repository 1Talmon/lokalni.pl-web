'use client';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error('[GlobalError]', error);
    }, [error]);

    return (
        <html lang="pl">
            <body>
                <div className="min-h-screen bg-[#F4F4F9] flex items-center justify-center p-6">
                    <div className="text-center max-w-sm">
                        <p className="text-5xl mb-4">⚠️</p>
                        <h1 className="text-2xl font-black text-gray-900 mb-2">Coś poszło nie tak</h1>
                        <p className="text-gray-500 text-sm mb-8">
                            Wystąpił nieoczekiwany błąd. Spróbuj ponownie.
                        </p>
                        <button
                            onClick={reset}
                            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl text-sm hover:bg-indigo-700 transition-colors"
                        >
                            Spróbuj ponownie
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
