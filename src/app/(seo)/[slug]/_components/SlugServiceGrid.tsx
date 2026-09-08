import { ServiceCardSSR } from '@/components/ui/ServiceCardSSR';
import type { Service } from '@/types';

interface SlugServiceGridProps {
    services: Service[];
}

export function SlugServiceGrid({ services }: SlugServiceGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {services.map((service, i) => (
                <ServiceCardSSR key={service.publicId} service={service} priority={i < 3} />
            ))}
        </div>
    );
}
