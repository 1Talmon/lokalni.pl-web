'use client';
import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '../../utils/logger';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    context?: string;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        logger.error(
            `ErrorBoundary [${this.props.context ?? 'App'}]: ${error.message}`,
            info.componentStack
        );
        if (error.message.includes('Failed to fetch dynamically imported module')) {
            window.location.reload();
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback !== undefined) return this.props.fallback;

            return (
                <div className="min-h-[60vh] flex items-center justify-center bg-[#F4F4F9] p-6">
                    <div className="bg-white rounded-3xl p-10 max-w-sm w-full text-center shadow-xl border border-slate-100">
                        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <AlertTriangle size={28} className="text-rose-500" />
                        </div>
                        <h2 className="text-xl font-black text-slate-900 mb-2 tracking-tight">
                            Coś poszło nie tak
                        </h2>
                        <p className="text-slate-500 text-sm leading-relaxed mb-6">
                            Wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę lub wróć do strony głównej.
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={15} /> Odśwież stronę
                            </button>
                            <button
                                onClick={() => { window.location.href = '/'; }}
                                className="w-full bg-slate-50 text-slate-600 border border-slate-100 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-slate-100 transition-all active:scale-95"
                            >
                                Wróć na stronę główną
                            </button>
                        </div>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="text-[11px] text-slate-400 cursor-pointer font-mono">
                                    Szczegóły błędu (dev)
                                </summary>
                                <pre className="mt-2 text-[10px] text-rose-500 bg-rose-50 p-3 rounded-xl overflow-auto max-h-40 font-mono">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
