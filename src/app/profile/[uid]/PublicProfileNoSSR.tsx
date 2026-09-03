'use client';
import React, { useState, useEffect } from 'react';

export default function PublicProfileNoSSR() {
    const [Wrapper, setWrapper] = useState<React.ElementType | null>(null);
    useEffect(() => {
        import('./PublicProfileWrapper').then(m => setWrapper(() => m.default));
    }, []);
    if (!Wrapper) return null;
    return React.createElement(Wrapper);
}
