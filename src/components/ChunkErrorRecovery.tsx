'use client';
import { useEffect } from 'react';
import { isChunkLoadError, reloadOnceForChunkError } from '../utils/chunkReload';

// Catches chunk failures that never reach a React error boundary
// (router prefetch / lazy import promises rejected outside render).
export function ChunkErrorRecovery() {
    useEffect(() => {
        const onRejection = (e: PromiseRejectionEvent) => {
            if (isChunkLoadError(e.reason)) reloadOnceForChunkError();
        };
        const onError = (e: ErrorEvent) => {
            if (isChunkLoadError(e.error)) reloadOnceForChunkError();
        };
        window.addEventListener('unhandledrejection', onRejection);
        window.addEventListener('error', onError);
        return () => {
            window.removeEventListener('unhandledrejection', onRejection);
            window.removeEventListener('error', onError);
        };
    }, []);
    return null;
}
