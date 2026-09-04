'use client';
import React, { useState, useEffect } from 'react';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';

export default function ServiceDetailsContent() {
    const [Client, setClient] = useState<React.ElementType | null>(null);
    useEffect(() => {
        import('../../../service/[slug]/ServiceDetailsClient').then(m => setClient(() => m.default));
    }, []);
    if (!Client) return <LoadingScreen isVisible={true} />;
    return <Client />;
}
