'use client';
import { useState, useEffect } from 'react';

export default function ServiceDetailsContent() {
    const [Client, setClient] = useState<React.ElementType | null>(null);
    useEffect(() => {
        import('../../../service/[slug]/ServiceDetailsClient').then(m => setClient(() => m.default));
    }, []);
    if (!Client) return null;
    return <Client />;
}
