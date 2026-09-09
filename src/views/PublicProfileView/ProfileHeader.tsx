'use client';
import { ClientPortal } from '../../components/ui/ClientPortal';
import {
    ArrowLeft, MapPin, Star, ShieldCheck,
    MessageCircle, Calendar, CheckCircle, Share2,
} from 'lucide-react';
import { ProviderProfile, Service } from '../../types';
import { polishPlural } from '../../utils/helpers';
import { PlusBadge } from '../../components/premium/PlusBadge';

interface ProfileHeaderProps {
    provider: ProviderProfile;
    fullName: string;
    providerIsPremium: boolean;
    avatarUrl: string | null;
    bgImageUrl: string | null;
    isActiveNow: boolean;
    computedActivityStatus: string;
    allServices: Service[];
    providerServices: Service[];
    isAnyModalOpen: boolean;
    isReportOpen: boolean;
    onBack: () => void;
    onStartChat: (service: Service) => void;
    onShare: () => void;
    onLongPressStart: (url: string) => void;
    onLongPressMove: () => void;
    onLongPressCancel: () => void;
    onOpenViewer: (url: string) => void;
}

export function ProfileHeader({
    provider,
    fullName,
    providerIsPremium,
    avatarUrl,
    bgImageUrl,
    isActiveNow,
    computedActivityStatus,
    allServices,
    providerServices,
    isAnyModalOpen,
    isReportOpen,
    onBack,
    onStartChat,
    onShare,
    onLongPressStart,
    onLongPressMove,
    onLongPressCancel,
    onOpenViewer,
}: ProfileHeaderProps) {
    return (
        <>
            {/* Pasek nawigacji — portaled do body żeby transform motion.div nie tworzył
                nowego containing block dla position:fixed */}
            <ClientPortal>
                <div
                    className="fixed left-0 right-0 z-[99999] lg:hidden flex items-center justify-between px-4 h-12 pointer-events-none"
                    style={{ top: 'var(--total-nav-h, 73px)' }}
                >
                    <button
                        onClick={onBack}
                        type="button"
                        aria-label="Wróć"
                        className="pointer-events-auto flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-2xl border border-slate-100 shadow-sm hover:bg-white transition-all active:scale-95 focus:outline-none"
                        style={(isAnyModalOpen || isReportOpen) ? { opacity: 0.35, filter: 'blur(2px)', pointerEvents: 'none', transition: 'opacity 0.2s, filter 0.2s' } : { transition: 'opacity 0.2s, filter 0.2s' }}
                    >
                        <ArrowLeft size={15} strokeWidth={2.5} className="text-slate-700" />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Wróć</span>
                    </button>
                    <button
                        onClick={onShare}
                        type="button"
                        aria-label="Udostępnij profil"
                        className="pointer-events-auto p-2.5 bg-white/90 hover:bg-white backdrop-blur-sm rounded-2xl border border-slate-100 shadow-sm text-slate-600 transition-all active:scale-95"
                        style={isAnyModalOpen ? { opacity: 0.35, filter: 'blur(2px)', pointerEvents: 'none', transition: 'opacity 0.2s, filter 0.2s' } : { transition: 'opacity 0.2s, filter 0.2s' }}
                    >
                        <Share2 size={20} />
                    </button>
                </div>
            </ClientPortal>

            {/* Tło */}
            <div
                className="h-52 md:h-64 relative overflow-hidden"
                style={bgImageUrl ? { cursor: 'pointer', userSelect: 'none' } : undefined}
                onTouchStart={bgImageUrl ? () => onLongPressStart(bgImageUrl) : undefined}
                onTouchMove={bgImageUrl ? onLongPressMove : undefined}
                onTouchEnd={bgImageUrl ? onLongPressCancel : undefined}
                onContextMenu={bgImageUrl ? (e) => e.preventDefault() : undefined}
                onClick={bgImageUrl ? () => onOpenViewer(bgImageUrl) : undefined}
            >
                {providerIsPremium && provider.zdjecieTla ? (
                    <img
                        src={provider.zdjecieTla as string}
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                        alt="Background"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-500 via-slate-600 to-indigo-700" />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/40 via-slate-900/10 to-slate-900/30 pointer-events-none" />
            </div>

            {/* Header card wrapper */}
            <div className="max-w-[1200px] mx-auto px-4 md:px-6 relative">
                {/* Przycisk wróć — tylko desktop */}
                <div className="hidden lg:block absolute -top-36 left-6 z-30">
                    <button
                        onClick={onBack}
                        type="button"
                        aria-label="Wróć do poprzedniej strony"
                        className="flex items-center gap-2 bg-white/90 hover:bg-white backdrop-blur-md px-4 py-2.5 rounded-2xl text-[10px] font-black shadow-lg transition-all active:scale-95 text-slate-700 border border-white/50 uppercase tracking-wider"
                    >
                        <ArrowLeft size={13} strokeWidth={3} /> Wróć
                    </button>
                </div>

                {/* HEADER CARD */}
                <div className="bg-white rounded-3xl p-5 md:p-7 shadow-xl shadow-slate-200/50 border border-slate-100/80 flex flex-col md:flex-row items-center justify-between gap-5 -mt-14 relative z-20">
                    <div className="flex flex-col md:flex-row items-center gap-5 w-full md:w-auto">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                            <div
                                className="w-24 h-24 md:w-[100px] md:h-[100px] rounded-3xl overflow-hidden ring-4 ring-white shadow-lg relative bg-slate-100"
                                style={avatarUrl ? { cursor: 'pointer', userSelect: 'none' } : undefined}
                                onTouchStart={avatarUrl ? () => onLongPressStart(avatarUrl) : undefined}
                                onTouchMove={avatarUrl ? onLongPressMove : undefined}
                                onTouchEnd={avatarUrl ? onLongPressCancel : undefined}
                                onContextMenu={avatarUrl ? (e) => e.preventDefault() : undefined}
                                onClick={avatarUrl ? () => onOpenViewer(avatarUrl) : undefined}
                            >
                                <img
                                    src={avatarUrl || '/default-profile-picture.webp'}
                                    className="w-full h-full object-cover pointer-events-none"
                                    alt="Avatar"
                                    fetchPriority="high"
                                    decoding="async"
                                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/default-profile-picture.webp'; }}
                                />
                            </div>
                            {isActiveNow && (
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-[3px] border-white shadow-sm" />
                            )}
                        </div>

                        {/* Info */}
                        <div className="text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                                <h1 className="text-2xl md:text-[28px] font-black text-slate-900 tracking-tight leading-tight">{fullName}</h1>
                                {providerIsPremium && <PlusBadge />}
                                <div className="relative group/shield cursor-help">
                                    <ShieldCheck size={22} className="text-indigo-500 fill-indigo-50 shrink-0" />
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-bold rounded-xl opacity-0 group-hover/shield:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-50">
                                        Profil zweryfikowany
                                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                                    </div>
                                </div>
                            </div>

                            {/* Tagi statusu */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors ${
                                    isActiveNow ? "bg-green-50 text-green-700 border-green-100" : "bg-slate-50 text-slate-500 border-slate-100"
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isActiveNow ? "bg-green-500" : "bg-slate-300"}`} />
                                    {computedActivityStatus}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-50 text-slate-500 border border-slate-100">
                                    <MapPin size={11} /> {providerServices[0]?.city || provider.city || 'Polska'}
                                </span>
                            </div>

                            {/* Mini stats */}
                            <div className="flex items-center justify-center md:justify-start gap-4 mt-3">
                                <div className="flex items-center gap-1">
                                    <Star size={13} className="fill-amber-400 text-amber-400" />
                                    <span className="text-sm font-black text-slate-900">
                                        {(provider.avgRating ?? 0) > 0 ? Number(provider.avgRating).toFixed(1) : '–'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold">({provider.reviewsCount ?? 0})</span>
                                </div>
                                <div className="w-px h-3 bg-slate-200" />
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                                    <CheckCircle size={12} className="text-indigo-400" />
                                    <span>{provider.reviewsCount ?? 0} {polishPlural(provider.reviewsCount ?? 0, 'realizacja', 'realizacje', 'realizacji')}</span>
                                </div>
                                <div className="w-px h-3 bg-slate-200" />
                                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-semibold">
                                    <Calendar size={12} className="text-slate-400" />
                                    <span>{provider.joinedAt
                                        ? `od ${new Date(provider.joinedAt).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
                                        : provider.joinedYear ? `od ${provider.joinedYear}` : '–'
                                    }</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="w-full md:w-auto shrink-0 flex items-center gap-2">
                        <button
                            onClick={() => allServices.length > 0 && onStartChat(allServices[0])}
                            className="flex-1 md:flex-none bg-[#6366F1] text-white px-8 py-3.5 rounded-2xl font-black text-sm hover:bg-[#4F46E5] hover:shadow-lg hover:shadow-indigo-300/40 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <MessageCircle size={17} /> Napisz wiadomość
                        </button>
                        <button
                            onClick={onShare}
                            aria-label="Udostępnij profil"
                            className="hidden lg:flex w-12 h-12 shrink-0 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 items-center justify-center transition-all active:scale-95 shadow-sm"
                        >
                            <Share2 size={18} className="text-slate-600" />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
