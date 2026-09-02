'use client';
import React, { memo } from 'react';
import { Globe, MapPin, Star, Clock, CreditCard, MessageCircle } from 'lucide-react';
import { ImageWithSkeleton } from './ui/ImageWithSkeleton';
import { UserAvatar } from './ui/UserAvatar';
import type { Service } from '../types';
import { isRemoteService } from '../utils/serviceUtils';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { usePlatform } from '../hooks/usePlatform';

interface ServiceCardProps {
    service: Service;
    onServiceClick: (service: Service) => void;
    onStartChat: (service: Service) => void;
}

const ServiceCard = memo(({ service, onServiceClick, onStartChat }: ServiceCardProps) => {
    const { isNative } = usePlatform();
    const isOffer = (service.type || 'offer') === 'offer';
    const isRemote = isRemoteService(service);    // czy usługa jest zdalna
    const isUserActive = service.isOnline;         // czy wykonawca jest teraz aktywny

    const handleCardClick = () => {
        onServiceClick(service);
    };

    return (
        <div
            onClick={handleCardClick}
            className={`relative bg-white rounded-3xl overflow-hidden shadow-lg md:transition-[transform,box-shadow] md:duration-300 md:hover:-translate-y-2 md:hover:shadow-2xl md:hover:z-30 cursor-pointer md:transform-gpu md:will-change-transform ${service.isMine ? 'ring-2 ring-[#6366F1]' : ''}`}
        >
            <div className="relative h-48 w-full bg-gray-200">
                <ImageWithSkeleton src={service.image} alt={service.title} />

                <div className="absolute top-3 left-3 right-12 flex flex-wrap gap-1.5 z-10 items-start pointer-events-none">
                    {isRemote ? (
                        <div className="bg-black/80 backdrop-blur text-white px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[10px] md:text-xs font-semibold flex items-center gap-1 shadow-sm shrink-0 max-w-full">
                            <Globe size={10} className="shrink-0" />
                            <span className="truncate">Zdalnie</span>
                        </div>
                    ) : (
                        <div className="bg-black/80 backdrop-blur text-white px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[10px] md:text-xs font-semibold flex items-center gap-1 shadow-sm shrink-0 max-w-full">
                            <MapPin size={10} className="shrink-0" />
                            <span className="truncate">{service.city}</span>
                            {service.radius > 0 ? ` +${service.radius}km` : ''}
                        </div>
                    )}
                    <div className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[10px] md:text-xs font-semibold flex items-center gap-1 shadow-sm shrink-0 ${isOffer ? 'bg-indigo-500 text-white' : 'bg-violet-600 text-white'}`}>
                        {isOffer ? 'Oferta' : 'Zlecenie'}
                    </div>
                </div>

                <div className="absolute bottom-3 right-3 z-10">
                    <div className="bg-white px-3 py-2 md:px-4 md:py-3 rounded-xl shadow-lg text-right">
                        <div className="font-bold text-lg md:text-xl text-gray-900">{service.price} zł</div>
                        <div className="text-[10px] md:text-xs text-gray-500">{service.priceUnit}</div>
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-5">
                <div className="flex items-start justify-between mb-2 md:mb-3">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="relative">
                            <UserAvatar
                                src={service.provider.avatar}
                                name={service.provider.name}
                                size={36}
                                className="rounded-full border-2 border-white shadow"
                            />
                            {isUserActive && (
                                <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-green-500" />
                            )}
                        </div>
                        <div>
                            <div className="font-bold text-sm md:text-base text-gray-900">{service.provider.name}</div>
                            <div className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1">
                                <Clock size={10} /> {service.deliveryTime}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-1 md:px-3 md:py-1.5 rounded-lg">
                        <Star size={12} fill="currentColor" />
                        <span className="font-bold text-xs md:text-sm">{service.rating}</span>
                    </div>
                </div>

                <h3 className="font-bold text-base md:text-lg text-gray-900 mb-1 md:mb-2 line-clamp-1">{service.title}</h3>
                <p className="text-gray-600 text-xs md:text-sm mb-3 md:mb-4 line-clamp-2 min-h-[32px] md:min-h-[40px]">{service.description}</p>

                <div className="flex gap-2 md:gap-3">
                    <button
                        onClick={e => { e.stopPropagation(); if (isNative) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => {}); onServiceClick(service); }}
                        className={`flex-1 text-white py-2.5 md:py-3 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-colors active:scale-95 ${isOffer ? 'bg-gray-900 hover:bg-gray-800' : 'bg-[#6366F1] hover:bg-[#4F46E5]'}`}
                    >
                        <CreditCard size={16} /> {isOffer ? 'Zarezerwuj' : 'Zgłoś się'}
                    </button>
                    <button
                        onClick={e => { e.stopPropagation(); if (isNative) Haptics.impact({ style: ImpactStyle.Light }).catch(() => {}); onStartChat(service); }}
                        aria-label={`Napisz do ${service.provider.name}`}
                        className="w-10 md:w-12 bg-gray-100 border border-gray-200 rounded-xl hover:bg-gray-200 flex items-center justify-center transition-colors active:scale-95"
                    >
                        <MessageCircle size={18} className="text-gray-700" />
                    </button>
                </div>
            </div>
        </div>
    );
});

ServiceCard.displayName = 'ServiceCard';

export { ServiceCard };
