'use client';
import { Heart, MapPin, Star, Globe } from 'lucide-react';
import { Service } from '@/types';
import { CATEGORIES_DATA } from '@/data/categories';
import { isRemoteService } from '@/utils/serviceUtils';

interface Props {
    services: Service[];
    onServiceClick: (s: Service) => void;
    onRemove: (publicId: string) => void;
    addToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning' | 'custom') => void;
}

export const FavoritesListView = ({ services, onServiceClick, onRemove, addToast }: Props) => (
    <div className="max-w-5xl mx-auto py-8 px-4 md:px-6 pb-32 min-h-screen">

        {/* Nagłówek — spójny z GrafikView / ChatListView */}
        <div className="mb-6">
            <p className="text-2xl font-bold text-gray-900 mb-1">Ulubione</p>
            <p className="text-sm text-gray-500 font-medium">
                {services.length > 0
                    ? `${services.length} ${services.length === 1 ? 'zapisana usługa' : services.length < 5 ? 'zapisane usługi' : 'zapisanych usług'}`
                    : 'Brak zapisanych usług'}
            </p>
        </div>

        {/* Empty state */}
        {services.length === 0 ? (
            <div className="flex flex-col items-center text-center pt-16">
                <div className="w-16 h-16 bg-rose-50 rounded-3xl border border-rose-100 flex items-center justify-center mb-4">
                    <Heart size={28} className="text-rose-300" />
                </div>
                <p className="font-bold text-gray-700 mb-1">Brak ulubionych</p>
                <p className="text-sm text-gray-500 max-w-xs">
                    Kliknij serduszko na ogłoszeniu żeby je tutaj zapisać.
                </p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map(service => {
                    const cat = CATEGORIES_DATA.find(c => c.id === service.category);
                    const remote = isRemoteService(service);
                    return (
                        <div key={service.publicId} className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col">

                            {/* Zdjęcie */}
                            <div
                                className="relative h-44 overflow-hidden cursor-pointer shrink-0"
                                onClick={() => onServiceClick(service)}
                            >
                                <img
                                    src={service.image}
                                    alt={service.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />

                                {/* Typ */}
                                <div className="absolute top-3 left-3">
                                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-sm ${service.type === 'request' ? 'bg-violet-600' : 'bg-indigo-500'}`}>
                                        {service.type === 'request' ? 'Zlecenie' : 'Oferta'}
                                    </span>
                                </div>

                                {/* Rating */}
                                {service.rating > 0 && (
                                    <div className="absolute top-3 right-12 bg-slate-900/60 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                                        <Star size={10} className="fill-amber-400 text-amber-400" />
                                        <span className="text-white font-black text-[11px]">{service.rating}</span>
                                    </div>
                                )}

                                {/* Usuń z ulubionych */}
                                <button
                                    onClick={e => { e.stopPropagation(); onRemove(service.publicId ?? ''); addToast?.('Usunięto z ulubionych'); }}
                                    className="absolute top-2.5 right-2.5 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:bg-rose-50 transition-colors active:scale-90"
                                    aria-label="Usuń z ulubionych"
                                >
                                    <Heart size={15} className="fill-rose-500 text-rose-500" />
                                </button>

                                {/* Cena */}
                                <div className="absolute bottom-3 left-3">
                                    <div className="bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl shadow-sm">
                                        <span className="font-black text-slate-900 text-sm">{service.price} <span className="font-medium text-slate-400 text-xs">{service.priceUnit || 'zł'}</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* Treść */}
                            <div
                                className="p-4 flex flex-col flex-1 cursor-pointer"
                                onClick={() => onServiceClick(service)}
                            >
                                {cat && (
                                    <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-wider rounded-lg mb-2 self-start border border-indigo-100/60">
                                        {cat.name}
                                    </span>
                                )}
                                <h4 className="font-bold text-slate-900 text-[14px] leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2 mb-auto pb-3">
                                    {service.title}
                                </h4>
                                <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-auto">
                                    {remote
                                        ? <><Globe size={11} className="text-indigo-400 shrink-0" /><span className="text-indigo-500 font-semibold">Online</span></>
                                        : <><MapPin size={11} className="text-indigo-300 shrink-0" /><span>{service.city}</span></>
                                    }
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
);
