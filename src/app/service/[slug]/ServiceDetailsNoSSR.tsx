'use client';
import dynamic from 'next/dynamic';
const ServiceDetailsWrapper = dynamic(() => import('./ServiceDetailsWrapper'), { ssr: false });
export default function ServiceDetailsNoSSR() {
    return <ServiceDetailsWrapper />;
}
