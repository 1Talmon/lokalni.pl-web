'use client';
import Link from 'next/link';
import { useApp } from '@/providers/AppProvider';
import { UserAvatar } from '@/components/ui/UserAvatar';

export function NavbarPublic() {
    const { state } = useApp();
    const profile = state.freshUser ?? state.userProfile;

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 px-6 py-4">
            <div className="flex justify-between items-center max-w-7xl mx-auto">
                <Link href="/" className="text-2xl font-black text-gray-900">
                    MyLokalni<span className="text-[#6366F1]">.</span>
                </Link>
                <div className="flex items-center gap-3">
                    {state.isLoggedIn && profile ? (
                        <Link href="/dashboard" aria-label="Mój profil">
                            <UserAvatar
                                src={profile.profilowe ?? profile.avatar ?? null}
                                name={profile.imie ?? profile.name ?? ''}
                                size={36}
                            />
                        </Link>
                    ) : (
                        <Link
                            href="/auth"
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            Zaloguj się
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
