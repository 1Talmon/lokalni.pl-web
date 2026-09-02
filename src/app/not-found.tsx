import Link from 'next/link';

import type { Metadata } from 'next';
export const metadata: Metadata = {
    title: 'Strona nie znaleziona | MyLokalni.pl',
    robots: { index: false, follow: false },
};

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#F4F4F9] flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
                <p className="text-7xl font-black text-indigo-600 mb-4">404</p>
                <h1 className="text-2xl font-black text-gray-900 mb-2">Strona nie istnieje</h1>
                <p className="text-gray-500 text-sm mb-8">
                    Szukana strona została przeniesiona lub nie istnieje.
                </p>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl text-sm hover:bg-indigo-700 transition-colors"
                >
                    Strona główna
                </Link>
            </div>
        </div>
    );
}
