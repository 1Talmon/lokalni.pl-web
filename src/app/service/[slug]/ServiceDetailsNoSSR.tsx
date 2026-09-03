'use client';
import React, { useState, useEffect } from 'react';

export default function ServiceDetailsNoSSR() {
    const [Wrapper, setWrapper] = useState<React.ElementType | null>(null);
    useEffect(() => {
        import('./ServiceDetailsWrapper').then(m => setWrapper(() => m.default));
    }, []);
    if (!Wrapper) return null;
    return React.createElement(Wrapper);
}
