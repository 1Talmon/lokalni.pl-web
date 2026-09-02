'use client';
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function RCodePage() {
    const params = useParams();
    const code = params?.code as string | undefined;
    const router = useRouter();

    useEffect(() => {
        if (code) router.replace(`/invite/${code}`);
        else router.replace('/');
    }, [code, router]);

    return null;
}
