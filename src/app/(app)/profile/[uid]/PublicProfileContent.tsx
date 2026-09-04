'use client';
import { useState, useEffect } from 'react';

export default function PublicProfileContent() {
    const [Client, setClient] = useState<React.ElementType | null>(null);
    useEffect(() => {
        import('../../../profile/[uid]/PublicProfileClient').then(m => setClient(() => m.default));
    }, []);
    if (!Client) return null;
    return <Client />;
}
