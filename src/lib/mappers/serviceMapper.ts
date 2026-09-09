import { normalizeMediaUrl } from '../../utils/normalizeUrl';
import type { Service } from '../../types';

export function mapServiceRaw(s: Record<string, unknown>): Service {
    const p = (s.provider ?? {}) as Record<string, unknown>;
    return {
        publicId: s.publicId as string,
        title: s.title as string,
        description: (s.description as string) ?? '',
        price: String(s.price ?? 0),
        priceUnit: (s.priceUnit as string) ?? '',
        rating: Number(s.rating) || 0,
        distance: '0',
        city: (s.city as string) ?? '',
        location: s.location as Service['location'],
        category: (s.category as string) ?? '',
        radius: Number(s.radius) || 0,
        type: (s.type as string) === 'request' ? 'request' : 'offer',
        isRemote: Boolean(s.isRemote),
        provider: {
            uid: (p.uid as string) ?? '',
            name: `${(p.imie as string) ?? ''} ${(p.nazwisko as string) ?? ''}`.trim(),
            avatar: normalizeMediaUrl(p.profilowe as string | null) ?? '',
            responseRate: '100%',
            isPremium: Boolean(p.isPremium),
        },
        address: (s.address as string) ?? undefined,
        image: normalizeMediaUrl(s.image as string | null) ?? '',
        images: ((s.images as string[]) ?? []).map(u => normalizeMediaUrl(u) ?? u),
        isOnline: Boolean(p.online),
        deliveryTime: (s.deliveryTime as string) ?? '',
        durationMinutes: (s.durationMinutes as number) ?? 60,
        bookings: Number(s.bookings) || 0,
        isMine: Boolean(s.isMine),
        isFavorite: Boolean(s.isFavorite),
        phoneNumber: '',
        distanceKm: (s.distanceKm as number | null) ?? null,
        views: (s.views as number) ?? 0,
        createdAt: (s.createdAt as string) ?? '',
        videos: (s.videos as Service['videos']) ?? [],
    };
}
