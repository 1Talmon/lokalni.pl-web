'use client';
import { memo } from 'react';
import { Star, Edit2 } from 'lucide-react';

interface ServiceBookingPanelProps {
    price: number | string;
    priceUnit: string;
    rating: number;
    isMine: boolean;
    isRemoteService: boolean;
    userLocation: string;
    city: string;
    ctaLabel: string;
    onCTA: () => void;
    onEdit: () => void;
}

export const ServiceBookingPanel = memo(({
    price, priceUnit, rating, isMine, isRemoteService, userLocation, city,
    ctaLabel, onCTA, onEdit,
}: ServiceBookingPanelProps) => (
    <div className="hidden lg:block self-stretch">
        <div className="sticky top-[93px] bg-white border border-slate-100 rounded-3xl p-6 shadow-xl shadow-slate-200/50">
            <div className="flex justify-between items-start mb-5">
                <div>
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400 block mb-1">Cena</span>
                    <div>
                        <span className="text-3xl font-black text-slate-900">{price} zł</span>
                        <span className="text-slate-400 font-medium"> / {priceUnit}</span>
                    </div>
                </div>
                {rating > 0 && (
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2.5 py-1.5 rounded-xl">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span className="text-sm font-black text-amber-600">{rating}</span>
                    </div>
                )}
            </div>
            <div className="border border-slate-100 rounded-2xl mb-5 overflow-hidden divide-y divide-slate-100">
                <div className="p-3 bg-slate-50/60">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">Termin</label>
                    <div className="text-sm font-semibold text-slate-700">Wybierz datę w kolejnym kroku</div>
                </div>
                <div className="p-3 bg-white">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-0.5">
                        {isRemoteService ? 'Tryb' : 'Lokalizacja'}
                    </label>
                    <div className={`text-sm font-semibold ${isRemoteService ? 'text-indigo-600' : 'text-slate-700'}`}>
                        {isRemoteService ? '🌍 Zdalnie / Online' : (userLocation || city)}
                    </div>
                </div>
            </div>
            {!isMine ? (
                <button
                    onClick={onCTA}
                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95 transition-all mb-3"
                >
                    {ctaLabel}
                </button>
            ) : (
                <button
                    onClick={onEdit}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mb-3 active:scale-95"
                >
                    <Edit2 size={20} /> Edytuj ogłoszenie
                </button>
            )}
            <p className="text-center text-xs text-slate-400">Nie ponosisz opłat w tym kroku.</p>
        </div>
    </div>
));

ServiceBookingPanel.displayName = 'ServiceBookingPanel';
