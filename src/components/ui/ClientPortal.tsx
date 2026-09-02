'use client';
import { useState, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function ClientPortal({ children, target }: { children: ReactNode; target?: Element | null }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);
    if (!mounted) return null;
    return createPortal(children, target ?? document.body);
}
