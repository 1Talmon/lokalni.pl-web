'use client';
import dynamic from 'next/dynamic';
const PublicProfileWrapper = dynamic(() => import('./PublicProfileWrapper'), { ssr: false });
export default function PublicProfileNoSSR() {
    return <PublicProfileWrapper />;
}
