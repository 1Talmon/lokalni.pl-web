'use client';
import React, { useState, useEffect } from 'react';
import { LoadingScreen } from '../../../../components/ui/LoadingScreen';

export default function PublicProfileContent() {
    const [Client, setClient] = useState<React.ElementType | null>(null);
    useEffect(() => {
        import('../../../profile/[uid]/PublicProfileClient').then(m => setClient(() => m.default));
    }, []);
    if (!Client) return <LoadingScreen isVisible={true} />;
    return <Client />;
}
