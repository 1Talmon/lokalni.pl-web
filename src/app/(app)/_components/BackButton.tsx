'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function BackButton() {
    const router = useRouter();
    return (
        <button
            onClick={() => {
                if (window.history.length > 1) {
                    router.back();
                } else {
                    router.push('/');
                }
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-600 active:scale-95"
        >
            <ArrowLeft size={24} />
        </button>
    );
}
