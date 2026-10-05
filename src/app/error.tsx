'use client';
import { useEffect, useState } from 'react';
import { isChunkLoadError, canReloadForChunkError, reloadOnceForChunkError } from '../utils/chunkReload';

// Route-level boundary — rendered inside the root layout (no <html>/<body> here; see global-error.tsx).
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const [chunkReloading] = useState(() => isChunkLoadError(error) && canReloadForChunkError());
    useEffect(() => {
        console.error('[RouteError]', error);
        // Stale tab after a deploy — fetch the new build instead of showing an error
        if (chunkReloading) reloadOnceForChunkError();
    }, [error, chunkReloading]);

    if (chunkReloading) return null;

    return (
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
    );
}
