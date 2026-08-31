import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Star, MapPin, Globe, Clock, Banknote, CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getService, getServiceReviews } from '@/lib/api';
import { getCategoryName } from '@/lib/categories';
import { polishPlural, formatRating } from '@/lib/helpers';
import type { Review } from '@/lib/types';

interface Props {
  params: Promise<{ slug: string }>;
}

const getPublicId = (slug: string) => slug.split('-').pop() ?? slug;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(getPublicId(slug));
  if (!service) return {};

  const desc = service.description?.slice(0, 160) ?? '';
  const location = service.isRemote ? 'Zdalnie' : service.city;

  return {
    title: `${service.title} — ${location}`,
    description: desc,
    openGraph: {
      title: `${service.title} — Lokalni.pl`,
      description: desc,
      images: service.image ? [{ url: service.image, width: 1200, height: 630 }] : [],
      type: 'website',
    },
    alternates: {
      canonical: `https://mylokalni.pl/service/${slug}`,
    },
  };
}

const StarRow = ({ rating, count }: { rating: number; count: number }) => (
  <div className="flex items-center gap-1.5">
    {[1,2,3,4,5].map(i => (
      <Star
        key={i}
        size={14}
        className={i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
      />
    ))}
    <span className="text-sm font-bold text-gray-800">{formatRating(rating)}</span>
    <span className="text-sm text-gray-400">({polishPlural(count, 'opinia', 'opinie', 'opinii')})</span>
  </div>
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
      <div>
        <p className="text-sm font-bold text-gray-800">{review.userName ?? 'Anonimowy'}</p>
        <p className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <div className="ml-auto flex items-center gap-0.5">
        {[1,2,3,4,5].map(i => (
          <Star key={i} size={11} className={i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
        ))}
      </div>
    </div>
    {review.text && <p className="text-sm text-gray-600 leading-relaxed">{review.text}</p>}
    {review.ownerReply && (
      <div className="mt-3 bg-indigo-50 rounded-xl p-3 border-l-2 border-indigo-300">
        <p className="text-xs font-bold text-indigo-600 mb-1">Odpowiedź specjalisty</p>
        <p className="text-xs text-indigo-700 leading-relaxed">{review.ownerReply}</p>
      </div>
    )}
  </div>
);

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const publicId = getPublicId(slug);

  const [service, reviews] = await Promise.all([
    getService(publicId),
    getServiceReviews(publicId),
  ]);

  if (!service) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.description,
    image: service.image,
    url: `https://mylokalni.pl/service/${slug}`,
    provider: {
      '@type': 'Person',
      name: service.provider.name,
      image: service.provider.avatar ?? undefined,
      url: `https://mylokalni.pl/profile/${service.provider.uid}`,
    },
    areaServed: service.isRemote ? 'Polska' : service.city,
    serviceType: getCategoryName(service.category),
    offers: {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: 'PLN',
      priceSpecification: { '@type': 'PriceSpecification', price: service.price, priceCurrency: 'PLN', unitText: service.priceUnit },
    },
    ...(reviews.length > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: service.rating.toFixed(1),
        reviewCount: reviews.length,
        bestRating: '5',
        worstRating: '1',
      },
    }),
  };

  const allImages = [service.image, ...(service.images ?? [])].filter(Boolean);

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
            <span className="text-sm text-gray-500 truncate">{service.title}</span>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          {/* Hero image */}
          {allImages[0] && (
            <div className="relative w-full h-64 sm:h-80 rounded-2xl overflow-hidden shadow-md">
              <Image src={allImages[0]} alt={service.title} fill className="object-cover" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <span className="text-xs font-bold uppercase tracking-widest text-white/70 bg-black/30 rounded-full px-3 py-1 backdrop-blur-sm">
                  {getCategoryName(service.category)}
                </span>
              </div>
            </div>
          )}

          {/* Główna sekcja */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h1 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{service.title}</h1>

            {service.rating > 0 && (
              <div className="mb-4">
                <StarRow rating={service.rating} count={reviews.length} />
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-5">
              <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 rounded-xl px-3 py-2">
                <Banknote size={14} />
                <span className="text-sm font-bold">{service.price} {service.priceUnit}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 text-gray-600 rounded-xl px-3 py-2">
                {service.isRemote ? <Globe size={14} /> : <MapPin size={14} />}
                <span className="text-sm font-medium">{service.isRemote ? 'Zdalnie / Online' : service.city}</span>
              </div>
              {service.durationMinutes && (
                <div className="flex items-center gap-1.5 bg-gray-50 text-gray-600 rounded-xl px-3 py-2">
                  <Clock size={14} />
                  <span className="text-sm font-medium">{service.durationMinutes} min</span>
                </div>
              )}
            </div>

            {service.description && (
              <p className="text-gray-600 leading-relaxed text-sm">{service.description}</p>
            )}
          </div>

          {/* Specjalista */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Specjalista</h2>
            <Link href={`/profile/${service.provider.uid}`} className="flex items-center gap-4 group">
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                {service.provider.avatar ? (
                  <Image src={service.provider.avatar} alt={service.provider.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl">
                    {service.provider.name[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{service.provider.name}</p>
                  {service.provider.isVerified && (
                    <CheckCircle size={14} className="text-indigo-500 shrink-0" />
                  )}
                  {service.provider.isPremium && (
                    <span className="text-[10px] font-black bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">PRO</span>
                  )}
                </div>
                {service.provider.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{service.provider.description}</p>
                )}
              </div>
            </Link>
          </div>

          {/* Galeria dodatkowych zdjęć */}
          {allImages.length > 1 && (
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Galeria</h2>
              <div className="grid grid-cols-3 gap-2">
                {allImages.slice(1, 7).map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                    <Image src={img} alt={`${service.title} — zdjęcie ${i + 2}`} fill className="object-cover" />
                  </div>
                ))}
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
            <h2 className="text-xl font-black text-white mb-2">Umów się teraz</h2>
            <p className="text-indigo-200 text-sm mb-5">Pobierz aplikację Lokalni.pl i skontaktuj się ze specjalistą bezpośrednio</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://apps.apple.com/app/lokalni/id6741405160"
                className="inline-flex items-center justify-center gap-2 bg-white text-indigo-700 font-bold text-sm px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors"
              >
                App Store — iOS
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.lokalni.app"
                className="inline-flex items-center justify-center gap-2 bg-indigo-500 text-white font-bold text-sm px-6 py-3 rounded-xl hover:bg-indigo-400 transition-colors"
              >
                Google Play — Android
              </a>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
