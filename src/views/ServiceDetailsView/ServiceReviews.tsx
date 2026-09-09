'use client';
import Image from 'next/image';
import { memo } from 'react';
import { Star, Camera, CheckCircle, ThumbsUp, Flag, Trash2, Expand } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReviewForm } from '../../components/reviews/ReviewForm';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { polishPlural } from '../../utils/helpers';
import type { Review } from '../../types';

interface CanReviewData {
    canReview: boolean;
    bookingId?: number;
    servicePublicId?: string;
}

interface ServiceReviewsProps {
    displayReviews: Review[];
    reviews: Review[];
    visibleReviews: Review[];
    hasMoreReviews: boolean;
    reviewsVisible: number;
    reviewSort: 'newest' | 'highest' | 'lowest';
    showReviewForm: boolean;
    likedReviews: Set<number>;
    likeCounts: Record<number, number>;
    canReviewData: CanReviewData | null | undefined;
    isLoggedIn: boolean;
    isMine: boolean;
    rating: number;
    currentUserUid: string | null | undefined;
    reviewPhotos: string[];
    onChangeSortKey: (key: 'newest' | 'highest' | 'lowest') => void;
    onLoadMore: () => void;
    onToggleReviewForm: () => void;
    onReviewSubmit: (rating: number, text: string, imageUrl?: string | null) => Promise<void>;
    onToggleLike: (id: number) => void;
    onRequestDelete: (id: number) => void;
    onReportReview: (id: number) => void;
    onShowProviderProfile: () => void;
    onSetClientPhotosIndex: (i: number) => void;
    onSetClientPhotosInGrid: (v: boolean) => void;
    onSetClientPhotosOpen: (v: boolean) => void;
}

export const ServiceReviews = memo(({
    displayReviews, reviews, visibleReviews, hasMoreReviews, reviewsVisible, reviewSort,
    showReviewForm, likedReviews, likeCounts, canReviewData, isLoggedIn, isMine, rating,
    currentUserUid, reviewPhotos, onChangeSortKey, onLoadMore, onToggleReviewForm,
    onReviewSubmit, onToggleLike, onRequestDelete, onReportReview, onShowProviderProfile,
    onSetClientPhotosIndex, onSetClientPhotosInGrid, onSetClientPhotosOpen,
}: ServiceReviewsProps) => {
    const router = useRouter();

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">

            {/* Nagłówek */}
            <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                    <div className="flex items-center gap-3 mb-1.5">
                        <div className="w-1.5 h-7 bg-amber-400 rounded-full shrink-0" />
                        <h3 className="font-black text-2xl text-slate-900 tracking-tight">Opinie klientów</h3>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] pl-4">
                        {displayReviews.length} {displayReviews.length === 1 ? 'zweryfikowana recenzja' : displayReviews.length < 5 ? 'zweryfikowane recenzje' : 'zweryfikowanych recenzji'}
                    </p>
                </div>
                {isLoggedIn && !isMine && canReviewData?.canReview && (
                    <button
                        onClick={onToggleReviewForm}
                        className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all active:scale-95 ${
                            showReviewForm
                                ? 'bg-white border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 shadow-sm'
                                : 'bg-[#6366F1] text-white hover:bg-[#4F46E5] shadow-lg shadow-indigo-300/40'
                        }`}
                    >
                        <Star size={15} className={showReviewForm ? 'text-slate-500' : 'fill-white text-white'} />
                        {showReviewForm ? 'Anuluj' : 'Napisz opinię'}
                    </button>
                )}
            </div>

            {/* Formularz */}
            <ReviewForm
                isOpen={showReviewForm && isLoggedIn && !isMine && !!canReviewData?.canReview}
                onSubmit={onReviewSubmit}
                onCancel={onToggleReviewForm}
            />

            {/* Sortowanie */}
            {displayReviews.length > 1 && (
                <div className="flex w-full bg-slate-100 p-1 rounded-2xl gap-0.5 mb-6">
                    {([
                        { key: 'newest', label: 'Najnowsze' },
                        { key: 'highest', label: 'Najwyższe' },
                        { key: 'lowest', label: 'Najgorsze' },
                    ] as const).map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => onChangeSortKey(key)}
                            className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wide transition-all duration-200 ${reviewSort === key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}

            {/* Podsumowanie ratingu */}
            {reviews.length > 0 && rating > 0 && (
                <div className="bg-white rounded-3xl px-5 py-4 border border-slate-100 shadow-sm flex items-center gap-5 mb-6">
                    <div className="text-center pr-5 border-r border-slate-100 shrink-0">
                        <div className="text-[46px] font-black text-slate-900 leading-none tracking-tighter">{rating}</div>
                        <div className="flex gap-0.5 mt-1.5 justify-center">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} size={12} className={i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-100'} />
                            ))}
                        </div>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {reviews.length} {polishPlural(reviews.length, 'opinia', 'opinie', 'opinii')}
                        </p>
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[120px]">
                        {[5, 4, 3, 2, 1].map(stars => {
                            const count = reviews.filter(r => r.rating === stars).length;
                            const pct = Math.round((count / reviews.length) * 100);
                            return (
                                <div key={stars} className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 w-3 text-right shrink-0">{stars}</span>
                                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-[9px] text-slate-400 w-6 text-right shrink-0">{pct}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Zdjęcia od klientów */}
            {reviewPhotos.length > 0 && (
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Camera size={12} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Zdjęcia od klientów</span>
                        <span className="text-[10px] font-black text-slate-400">· {reviewPhotos.length}</span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {reviewPhotos.slice(0, 5).map((photo, i) => (
                            <div
                                key={i}
                                onClick={() => { onSetClientPhotosIndex(i); onSetClientPhotosInGrid(false); onSetClientPhotosOpen(true); }}
                                className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer group bg-slate-100"
                            >
                                <Image src={photo} fill className="object-cover object-center group-hover:scale-105 transition-transform duration-500" alt={`Zdjęcie ${i + 1}`} sizes="(max-width: 640px) 33vw, 16vw" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <Expand size={20} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                                </div>
                            </div>
                        ))}
                        {reviewPhotos.length > 5 && (
                            <div
                                onClick={() => { onSetClientPhotosInGrid(true); onSetClientPhotosOpen(true); }}
                                className="aspect-square rounded-2xl bg-slate-900 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-600 transition-colors duration-300 group"
                            >
                                <span className="text-white font-black text-xl group-hover:scale-110 transition-transform">+{reviewPhotos.length - 5}</span>
                                <span className="text-[9px] font-bold text-slate-500 group-hover:text-white/60 uppercase tracking-wider mt-1 transition-colors">Wszystkie</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Lista opinii */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reviews.length === 0 ? (
                    <div className="md:col-span-2 py-10 bg-slate-50 rounded-2xl text-center border border-slate-100">
                        <Star size={28} className="text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 font-semibold text-sm">Brak opinii dla tej usługi.</p>
                        <p className="text-slate-400 text-xs mt-1">Bądź pierwszy, który oceni!</p>
                    </div>
                ) : (
                    visibleReviews.map(review => {
                        const isLiked = likedReviews.has(review.id);
                        const likeCount = likeCounts[review.id] ?? review.likesCount ?? 0;
                        return (
                            <div key={review.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col">
                                <div className="p-6 flex items-start justify-between gap-4">
                                    {review.autoGenerated ? (
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center shrink-0">
                                                <CheckCircle size={20} className="text-slate-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="text-[15px] font-bold block truncate text-slate-900">Zweryfikowana realizacja</span>
                                                <span className="text-[11px] text-slate-400 mt-1 block">{review.date}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className={`flex items-center gap-4 min-w-0 ${review.userUid ? 'cursor-pointer group/reviewer' : ''}`}
                                            onClick={() => { if (!review.userUid) return; router.push(`/profile/${review.userUid}`); }}
                                        >
                                            <div className="relative shrink-0">
                                                <UserAvatar
                                                    src={review.userAvatar}
                                                    name={review.userName || '?'}
                                                    size={48}
                                                    className={`rounded-2xl transition-transform duration-200 ${review.userUid ? 'group-hover/reviewer:scale-105' : ''}`}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <span className={`text-[15px] font-bold block truncate transition-colors duration-150 ${review.userUid ? 'text-slate-900 group-hover/reviewer:text-indigo-600' : 'text-slate-900'}`}>
                                                    {review.userName}
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex gap-0.5">
                                                        {[1, 2, 3, 4, 5].map(i => (
                                                            <Star key={i} size={11} className={i <= review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-100'} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[11px] text-slate-400">{review.date}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {!review.autoGenerated && (
                                    <div className="px-6 pb-5 flex-1">
                                        <p className="text-[15px] text-slate-700 leading-relaxed">{review.text}</p>
                                    </div>
                                )}

                                {/* Odpowiedź właściciela */}
                                {review.ownerReply && !review.autoGenerated && (
                                    <div className="mx-6 mb-4 p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100/70">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Odpowiedź właściciela</p>
                                        <p className="text-[13px] text-slate-700 leading-relaxed">{review.ownerReply}</p>
                                    </div>
                                )}

                                <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between">
                                    {review.autoGenerated ? (
                                        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest px-2 py-1 bg-slate-50 rounded-lg">
                                            Opinia automatyczna
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => onToggleLike(review.id)}
                                            aria-pressed={isLiked}
                                            className={`flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all duration-200 active:scale-95 ${isLiked ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                                        >
                                            <ThumbsUp size={14} className={`transition-transform duration-200 ${isLiked ? 'fill-indigo-600 -translate-y-px' : ''}`} />
                                            {likeCount > 0
                                                ? <span className="text-[11px] font-bold">{likeCount}</span>
                                                : <span className="text-[11px] font-medium text-slate-400">Pomocna</span>
                                            }
                                        </button>
                                    )}
                                    {!review.autoGenerated && (
                                        review.userUid === currentUserUid
                                            ? (
                                                <button
                                                    onClick={() => onRequestDelete(review.id)}
                                                    aria-label="Usuń opinię"
                                                    className="text-slate-200 hover:text-rose-400 transition-colors p-2 rounded-xl hover:bg-rose-50 active:scale-90"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onReportReview(review.id)}
                                                    aria-label="Zgłoś opinię"
                                                    className="text-slate-200 hover:text-rose-400 transition-colors p-2 rounded-xl hover:bg-rose-50 active:scale-90"
                                                >
                                                    <Flag size={13} />
                                                </button>
                                            )
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Paginacja */}
            {reviews.length > 0 && (
                <div className="mt-8 flex flex-col items-center gap-3">
                    {hasMoreReviews ? (
                        <>
                            <button
                                onClick={onLoadMore}
                                className="group flex items-center gap-3 bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 px-8 py-3.5 rounded-2xl font-black text-sm transition-all duration-200 active:scale-95 shadow-sm"
                            >
                                {reviewsVisible <= 4 ? 'Pokaż więcej opinii' : 'Wczytaj kolejne'}
                                <span className="bg-slate-100 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-700 transition-colors px-2.5 py-0.5 rounded-lg text-xs font-black">
                                    +{Math.min(3, displayReviews.length - reviewsVisible)}
                                </span>
                            </button>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Pokazano {reviewsVisible} z {displayReviews.length} opinii
                            </p>
                        </>
                    ) : (
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-100">
                            <CheckCircle size={15} />
                            <span className="text-[12px] font-bold">Wyświetlono wszystkie opinie</span>
                        </div>
                    )}
                </div>
            )}

            <button
                onClick={onShowProviderProfile}
                className="w-full mt-5 py-3 border border-slate-200 rounded-2xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors text-sm"
            >
                Pokaż profil wykonawcy
            </button>
        </div>
    );
});

ServiceReviews.displayName = 'ServiceReviews';
