import Link from 'next/link';

export function LandingNavbar() {
    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                <Link href="/" className="text-2xl font-black text-gray-900">
                    MyLokalni<span className="text-[#6366F1]">.</span>
                </Link>
                <Link
                    href="/auth"
                    className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition-colors"
                >
                    Zaloguj się
                </Link>
            </div>
        </header>
    );
}
