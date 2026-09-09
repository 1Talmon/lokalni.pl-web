'use client';
import { MapPin, Star, ChevronRight, Briefcase } from 'lucide-react';
import { Service } from '../../types';
import { CATEGORIES_DATA } from '../../data/categories';
import { normalizeMediaUrl } from '../../utils/normalizeUrl';

interface ProfileServicesProps {
    allServices: Service[];
    displayedServices: Service[];
    hasMoreServices: boolean;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onServiceClick: (service: Service) => void;
}

export function ProfileServices({
    allServices,
    displayedServices,
    hasMoreServices,
    isExpanded,
    onToggleExpand,
    onServiceClick,
}: ProfileServicesProps) {
    return (
        <div className="mt-14">
            <div className="flex items-center gap-3 mb-7 px-1">
                <div className="w-1.5 h-7 bg-indigo-500 rounded-full" />
                <div>
                    <h2 className="font-black text-2xl text-slate-900 tracking-tight leading-none">Usługi i cennik</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{allServices.length} aktywnych ofert</p>
                </div>
            </div>

            {allServices.length === 0 && (
                <div className="flex flex-col items-center justify-center py-14 rounded-3xl border border-dashed border-slate-200 text-center gap-3">
                    <Briefcase size={28} className="text-slate-300" />
                    <p className="text-sm font-bold text-slate-400">Brak aktywnych usług</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayedServices.map((service, idx) => (
                    <div
                        key={service.publicId || idx}
                        onClick={() => onServiceClick(service)}
                        className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/8 hover:-translate-y-1 transition-all duration-400 cursor-pointer flex flex-col"
                    >
                        <div className="relative h-52 w-full overflow-hidden rounded-t-3xl">
                            <img
                                src={normalizeMediaUrl(service.image) || service.image}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform"
                                alt={service.title}
                            />
                            {/* Cena */}
                            <div className="absolute bottom-3 left-3">
                                <div className="bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-2xl shadow-md">
                                    <span className="text-slate-900 font-black text-sm">{service.price} {service.priceUnit || "zł"}</span>
                                </div>
                            </div>
                            {/* Rating */}
                            {service.rating > 0 && (
                                <div className="absolute top-3 right-3">
                                    <div className="bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-xl flex items-center gap-1">
                                        <Star size={10} className="fill-amber-400 text-amber-400" />
                                        <span className="text-white font-black text-[11px]">{service.rating.toFixed(1)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-5 flex flex-col flex-1">
                            <span className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-wider rounded-lg self-start mb-2.5">
                                {CATEGORIES_DATA.find(c => c.id === service.category)?.name ?? service.category ?? "Premium"}
                            </span>
                            <h4 className="font-bold text-slate-900 text-[15px] leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2 mb-3">
                                {service.title}
                            </h4>
                            <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                                    <MapPin size={11} className="text-indigo-300" /> {service.city || "Gdańsk"}
                                </span>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {hasMoreServices && (
                <div className="mt-8 text-center">
                    <button
                        onClick={onToggleExpand}
                        className="inline-flex items-center gap-2.5 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 px-7 py-3.5 rounded-2xl text-sm font-black text-slate-700 transition-all active:scale-95 shadow-sm"
                    >
                        {isExpanded ? "Zwiń" : `Pokaż wszystkie (${allServices.length})`}
                        <ChevronRight size={16} className={`transition-transform ${isExpanded ? "rotate-90" : "-rotate-90 mt-px"}`} />
                    </button>
                </div>
            )}
        </div>
    );
}
