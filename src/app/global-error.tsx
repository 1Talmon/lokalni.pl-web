'use client';
import { useEffect, useState } from 'react';
import { isChunkLoadError, canReloadForChunkError, reloadOnceForChunkError } from '../utils/chunkReload';

// Last-resort boundary for errors in the root layout itself — replaces the whole document.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const [chunkReloading] = useState(() => isChunkLoadError(error) && canReloadForChunkError());
    useEffect(() => {
        console.error('[GlobalError]', error);
        if (chunkReloading) reloadOnceForChunkError();
    }, [error, chunkReloading]);

    return (
        <html lang="pl">
            <body>
                {!chunkReloading && (
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
                )}
            </body>
        </html>
    );
}
