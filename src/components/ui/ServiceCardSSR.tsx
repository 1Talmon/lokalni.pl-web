import Image from 'next/image';
import Link from 'next/link';
import { Globe, MapPin, Star } from 'lucide-react';
import { createServiceUrl } from '@/utils/helpers';
import type { Service } from '@/types';

interface ServiceCardSSRProps {
    service: Service;
    priority?: boolean;
}

export function ServiceCardSSR({ service, priority = false }: ServiceCardSSRProps) {
    const href = `/service/${createServiceUrl(service.title, service.publicId ?? '')}`;
    const isRemote = !!service.isRemote;
    const isOffer = (service.type || 'offer') === 'offer';
    const image = service.image || service.images?.[0] || service.provider?.avatar || '';
    const rating = Number(service.rating) || 0;

    return (
        <Link
            href={href}
            className="relative bg-white rounded-3xl overflow-hidden shadow-lg md:transition-[transform,box-shadow] md:duration-300 md:hover:-translate-y-2 md:hover:shadow-2xl md:hover:z-30 md:transform-gpu md:will-change-transform block"
        >
            <div className="relative h-48 w-full bg-gray-200">
                {image ? (
                    <Image
                        src={image}
                        alt={`${service.title}${service.city ? ` w ${service.city}` : ''}`}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover"
                        priority={priority}
                        quality={85}
                    />
                ) : (
                    <div className="w-full h-full bg-gray-100" />
                )}

                <div className="absolute top-3 left-3 right-12 flex flex-wrap gap-1.5 z-10 items-start pointer-events-none">
                    {isRemote ? (
                        <span className="bg-black/80 backdrop-blur text-white px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 shadow-sm shrink-0">
                            <Globe size={10} className="shrink-0" />Zdalnie
                        </span>
                    ) : (
                        <span className="bg-black/80 backdrop-blur text-white px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 shadow-sm shrink-0 max-w-full">
                            <MapPin size={10} className="shrink-0" />
                            <span className="truncate">{service.city}</span>
                        </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold shadow-sm shrink-0 ${isOffer ? 'bg-indigo-500 text-white' : 'bg-violet-600 text-white'}`}>
                        {isOffer ? 'Oferta' : 'Zlecenie'}
                    </span>
                </div>

                {service.price && (
                    <div className="absolute bottom-3 right-3 z-10 bg-white px-3 py-2 rounded-xl shadow-sm text-right">
                        <div className="font-bold text-lg text-gray-900">{service.price} zł</div>
                        {service.priceUnit && <div className="text-[10px] text-gray-500">{service.priceUnit}</div>}
                    </div>
                )}
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {service.provider?.avatar ? (
                            <Image
                                src={service.provider.avatar}
                                alt={service.provider.name}
                                width={36}
                                height={36}
                                className="rounded-full border-2 border-white shadow object-cover shrink-0"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                <span className="text-[#6366F1] font-bold text-sm">
                                    {service.provider?.name?.charAt(0)?.toUpperCase() ?? '?'}
                                </span>
                            </div>
                        )}
                        <span className="font-bold text-sm text-gray-900">{service.provider?.name}</span>
                    </div>
                    {rating > 0 && (
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-1 rounded-lg shrink-0">
                            <Star size={12} fill="currentColor" />
                            <span className="font-bold text-xs">{rating.toFixed(1)}</span>
                        </div>
                    )}
                </div>

                <h3 className="font-bold text-base text-gray-900 mb-1 line-clamp-1">{service.title}</h3>
                <p className="text-gray-600 text-xs mb-3 line-clamp-2 min-h-[32px]">{service.description}</p>

                <span className={`inline-flex items-center justify-center w-full text-white py-2.5 rounded-xl font-bold text-sm ${isOffer ? 'bg-gray-900' : 'bg-[#6366F1]'}`}>
                    {isOffer ? 'Zarezerwuj' : 'Zgłoś się'}
                </span>
            </div>
        </Link>
    );
}
