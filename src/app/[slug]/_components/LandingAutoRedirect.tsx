'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
    keyword: string;
    city: string | null;
}

export function LandingAutoRedirect({ keyword, city }: Props) {
    const router = useRouter();
    useEffect(() => {
        const params = new URLSearchParams();
        if (keyword) params.set('q', keyword);
        if (city) params.set('city', city);
        router.replace(`/?${params}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return null;
}
