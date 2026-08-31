import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Star, CheckCircle, MapPin, Globe, Banknote, ArrowLeft, AtSign, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getProfile, getProfileServices, getProfileReviews } from '@/lib/api';
import { getCategoryName } from '@/lib/categories';
import { createServiceUrl, polishPlural, formatRating } from '@/lib/helpers';
import type { Review, Service } from '@/lib/types';

interface Props {
  params: Promise<{ uid: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { uid } = await params;
  const profile = await getProfile(uid);
  if (!profile) return {};

  const name = profile.imie && profile.nazwisko ? `${profile.imie} ${profile.nazwisko}` : profile.name;
  const desc = profile.description
    ? profile.description.slice(0, 160)
    : `${name} — specjalista na Lokalni.pl. ${profile.servicesCount ? `${profile.servicesCount} usług` : ''} ${profile.avgRating ? `• Ocena ${formatRating(profile.avgRating)}/5` : ''}`.trim();

  return {
    title: `${name} — specjalista`,
    description: desc,
    openGraph: {
      title: `${name} — Lokalni.pl`,
      description: desc,
      images: profile.profilowe ? [{ url: profile.profilowe, width: 400, height: 400 }] : [],
    },
    alternates: {
      canonical: `https://mylokalni.pl/profile/${uid}`,
    },
  };
}

const StarRow = ({ rating, count }: { rating: number; count: number }) => (
  <div className="flex items-center gap-1.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={13} className={i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
    ))}
    <span className="text-sm font-bold text-gray-800">{formatRating(rating)}</span>
    <span className="text-sm text-gray-400">({polishPlural(count, 'opinia', 'opinie', 'opinii')})</span>
  </div>
);

const ServiceCard = ({ service }: { service: Service }) => (
  <Link
    href={`/service/${createServiceUrl(service.title, service.publicId)}`}
    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
  >
    <div className="relative h-36 w-full">
      <Image src={service.image} alt={service.title} fill className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      {service.rating > 0 && (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-0.5">
          <Star size={10} className="fill-amber-400 text-amber-400" />
          <span className="text-xs font-bold text-white">{formatRating(service.rating)}</span>
        </div>
      )}
    </div>
    <div className="p-4">
      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">{getCategoryName(service.category)}</p>
      <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-snug mb-2">{service.title}</h3>
      <div className="flex items-center justify-between">
        <span className="text-sm font-black text-indigo-600">{service.price} {service.priceUnit}</span>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          {service.isRemote ? <Globe size={11} /> : <MapPin size={11} />}
          {service.isRemote ? 'Zdalnie' : service.city}
        </span>
      </div>
    </div>
  </Link>
);

const ReviewCard = ({ review }: { review: Review }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
    <div className="flex items-center gap-3 mb-3">
      {review.userAvatar ? (
        <Image src={review.userAvatar} alt={review.userName ?? ''} width={36} height={36} className="rounded-full object-cover" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
          {(review.userName ?? 'A')[0].toUpperCase()}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800">{review.userName ?? 'Anonimowy'}</p>
        {review.serviceTitle && <p className="text-xs text-gray-400 truncate">{review.serviceTitle}</p>}
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={11} className={i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
        ))}
      </div>
    </div>
    {review.text && <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>}
  </div>
);

export default async function ProfilePage({ params }: Props) {
  const { uid } = await params;

  const [profile, services, reviews] = await Promise.all([
    getProfile(uid),
    getProfileServices(uid),
    getProfileReviews(uid),
  ]);

  if (!profile || profile.deleted) notFound();

  const displayName = profile.imie && profile.nazwisko
    ? `${profile.imie} ${profile.nazwisko}`
    : profile.name;

  const avatar = profile.profilowe ?? profile.avatar;
  const avgRating = profile.avgRating ?? 0;
  const reviewCount = reviews.length;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: displayName,
    image: avatar ?? undefined,
    url: `https://mylokalni.pl/profile/${uid}`,
    description: profile.description ?? undefined,
    ...(profile.city && { homeLocation: { '@type': 'Place', name: profile.city } }),
    ...(profile.facebook && { sameAs: [profile.facebook] }),
    ...(avgRating > 0 && reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: avgRating.toFixed(1),
        reviewCount,
        bestRating: '5',
        worstRating: '1',
      },
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen bg-gray-50">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5 text-gray-400 hover:text-indigo-600 transition-colors">
              <ArrowLeft size={16} />
              <span className="text-sm font-medium">Lokalni.pl</span>
            </Link>
            <span className="text-gray-200">/</span>
            <span className="text-sm text-gray-500 truncate">{displayName}</span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Hero / cover */}
          {profile.zdjecieTla && (
            <div className="relative w-full h-40 rounded-2xl overflow-hidden shadow-sm">
              <Image src={profile.zdjecieTla} alt="" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          )}

          {/* Karta profilu */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start gap-4">
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-md">
                {avatar ? (
                  <Image src={avatar} alt={displayName} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-3xl">
                    {displayName[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className="text-xl font-black text-gray-900">{displayName}</h1>
                  {profile.isVerified && <CheckCircle size={16} className="text-indigo-500 shrink-0" />}
                  {profile.isPremium && (
                    <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">PRO</span>
                  )}
                </div>
                {avgRating > 0 && reviewCount > 0 && (
                  <div className="mb-2">
                    <StarRow rating={avgRating} count={reviewCount} />
                  </div>
                )}
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  {profile.city && (
                    <span className="flex items-center gap-1"><MapPin size={11} />{profile.city}</span>
                  )}
                  {profile.servicesCount && (
                    <span>{polishPlural(profile.servicesCount, 'usługa', 'usługi', 'usług')}</span>
                  )}
                  {profile.joinedYear && (
                    <span>Na platformie od {profile.joinedYear}</span>
                  )}
                </div>
              </div>
            </div>

            {profile.description && (
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">{profile.description}</p>
            )}

            {/* Socials */}
            {(profile.instagram || profile.facebook || profile.website) && (
              <div className="mt-4 flex gap-2 flex-wrap">
                {profile.instagram && (
                  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-pink-500 transition-colors bg-gray-50 rounded-xl px-3 py-2">
                    <AtSign size={13} /> @{profile.instagram}
                  </a>
                )}
                {profile.facebook && (
                  <a href={profile.facebook} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 transition-colors bg-gray-50 rounded-xl px-3 py-2">
                    <ExternalLink size={13} /> Facebook
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-500 transition-colors bg-gray-50 rounded-xl px-3 py-2">
                    <Globe size={13} /> Strona WWW
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Usługi */}
          {services.length > 0 && (
            <div>
              <h2 className="text-lg font-black text-gray-900 mb-4">
                Usługi ({polishPlural(services.length, 'usługa', 'usługi', 'usług')})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map(s => <ServiceCard key={s.publicId} service={s} />)}
              </div>
            </div>
          )}

          {/* Opinie */}
          {reviews.length > 0 && (
            <div>
              <h2 className="text-lg font-black text-gray-900 mb-4">
                Opinie ({polishPlural(reviews.length, 'opinia', 'opinie', 'opinii')})
              </h2>
              <div className="space-y-3">
                {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-indigo-600 rounded-2xl p-6 text-center shadow-lg shadow-indigo-200">
            <h2 className="text-xl font-black text-white mb-2">Chcesz skontaktować się z {displayName.split(' ')[0]}?</h2>
            <p className="text-indigo-200 text-sm mb-5">Pobierz aplikację Lokalni.pl i pisz ze specjalistami bezpośrednio</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="https://apps.apple.com/app/lokalni/id6741405160"
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold text-sm px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors">
                App Store — iOS
              </a>
              <a href="https://play.google.com/store/apps/details?id=com.lokalni.app"
                className="inline-flex items-center justify-center gap-2 bg-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-indigo-400 transition-colors">
                Google Play — Android
              </a>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
