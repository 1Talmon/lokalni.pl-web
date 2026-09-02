// src/services/serviceService.ts
import { apiClient } from './apiClient';
import { normalizeMediaUrl } from '../utils/normalizeUrl';

interface ApiErrorPayload {
  code?: string;
  message?: string;
  error?: string;
  fields?: Record<string, string[]>;
}

function extractApiError(json: ApiErrorPayload, fallback: string): string {
  if (json?.code === 'VALIDATION_ERROR' && json.fields) {
    const first = Object.values(json.fields)[0];
    if (first?.[0]) return first[0];
  }
  return json?.message || json?.error || fallback;
}

export interface ApiService {
  publicId: string;
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  rating: number;
  reviewsCount: number;
  city: string;
  location: { lat: number; lng: number } | null;
  category: string;
  radius: number;
  type: 'offer' | 'request';
  isRemote: boolean;
  provider: {
    uid: string;
    imie: string;
    nazwisko: string;
    profilowe: string | null;
    online: boolean;
    isPremium: boolean;
  };
  address: string | null;
  image: string | null;
  images: string[];
  isOnline: boolean;
  deliveryTime: string | null;
  bookings: number;
  isMine: boolean;
  isFavorite: boolean;
  createdAt: string;
  distanceKm: number | null;
  views?: number;
  durationMinutes?: number;
  videos?: Array<{ url: string; thumbnailUrl: string | null }>;
}

export interface ServicesQuery {
  page?: number;
  limit?: number;
  type?: 'all' | 'offer' | 'request';
  category?: string;
  city?: string;
  query?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'rating' | 'distance' | 'verified';
  onlineOnly?: boolean;
  userLat?: number;
  userLng?: number;
}

export interface ServicesMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateServicePayload {
  title: string;
  description: string;
  price: number;
  priceUnit: string;
  category: string;
  type: 'offer' | 'request';
  city: string;
  radius: number;
  isRemote: boolean;
  deliveryTime?: string;
  durationMinutes?: number;
  images: string[];
  videos?: Array<{ url: string; thumbnailUrl?: string | null }>;
  address?: string;
  addressLat?: number;
  addressLng?: number;
}

// Konwertuje ApiService na format kompatybilny z typem Service frontend
export function mapApiService(s: ApiService) {
  type ProviderPayload = { uid?: string; imie?: string; nazwisko?: string; profilowe?: string | null; online?: boolean; isPremium?: boolean };
  const p: ProviderPayload = s.provider ?? {};
  return {
    publicId: s.publicId,
    title: s.title,
    description: s.description,
    price: String(s.price),
    priceUnit: s.priceUnit,
    rating: s.rating,
    distance: '0',
    city: s.city || '',
    location: s.location ?? undefined,
    category: s.category,
    radius: s.radius,
    type: s.type,
    isRemote: s.isRemote,
    provider: {
      uid: p.uid || '',
      name: `${p.imie || ''} ${p.nazwisko || ''}`.trim(),
      avatar: normalizeMediaUrl(p.profilowe) || '',
      responseRate: '100%',
      isPremium: p.isPremium ?? false,
    },
    address: s.address ?? undefined,
    image: normalizeMediaUrl(s.image) || '',
    images: (s.images ?? []).map(u => normalizeMediaUrl(u) || u),
    isOnline: p.online ?? false,
    deliveryTime: s.deliveryTime || '',
    durationMinutes: s.durationMinutes ?? 60,
    bookings: s.bookings,
    isMine: s.isMine,
    isFavorite: s.isFavorite,
    phoneNumber: '',
    distanceKm: s.distanceKm ?? null,
    views: s.views ?? 0,
    createdAt: s.createdAt,
    videos: s.videos ?? [],
  };
}

export const serviceService = {
  async getServices(params: ServicesQuery = {}): Promise<{ data: ReturnType<typeof mapApiService>[]; meta: ServicesMeta }> {
    const qs = new URLSearchParams();
    if (params.page)      qs.set('page', String(params.page));
    if (params.limit)     qs.set('limit', String(params.limit));
    if (params.type && params.type !== 'all') qs.set('type', params.type);
    if (params.category && params.category !== 'all') qs.set('category', params.category);
    if (params.city)      qs.set('city', params.city);
    if (params.query)     qs.set('query', params.query);
    if (params.sort)      qs.set('sort', params.sort);
    if (params.onlineOnly) qs.set('onlineOnly', 'true');
    if (params.userLat !== null && params.userLat !== undefined) qs.set('userLat', String(params.userLat));
    if (params.userLng !== null && params.userLng !== undefined) qs.set('userLng', String(params.userLng));

    const endpoint = `/services${qs.toString() ? `?${qs}` : ''}`;
    const res = await apiClient.get(endpoint);
    if (!res.ok) throw new Error('Błąd pobierania usług');
    const json = await res.json();
    return {
      data: (json.data as ApiService[]).map(mapApiService),
      meta: json.meta,
    };
  },

  async getMyServices(): Promise<ReturnType<typeof mapApiService>[]> {
    const res = await apiClient.get('/users/me/services');
    if (!res.ok) throw new Error('Błąd pobierania Twoich usług');
    const json = await res.json();
    return (json.data as ApiService[]).map(mapApiService);
  },

  async getArchivedServices(): Promise<ReturnType<typeof mapApiService>[]> {
    const res = await apiClient.get('/users/me/services?archived=true');
    if (!res.ok) throw new Error('Błąd pobierania archiwalnych usług');
    const json = await res.json();
    return (json.data as ApiService[]).map(mapApiService);
  },

  async trackEvent(eventType: 'favorite' | 'search', category?: string): Promise<void> {
    if (!category || category === 'all') return;
    apiClient.post('/events', { event_type: eventType, category }).catch(() => {});
  },

  async getRecommendedServices(): Promise<{ data: ReturnType<typeof mapApiService>[]; source: 'personalized' | 'trending' }> {
    const res = await apiClient.get('/services/recommended?_v=2');
    if (!res.ok) return { data: [], source: 'trending' };
    const json = await res.json();
    return {
      data: (json.data as ApiService[]).map(mapApiService),
      source: json.source ?? 'trending',
    };
  },

  async restoreService(publicId: string): Promise<void> {
    const res = await apiClient.post(`/services/${publicId}/restore`, {});
    if (!res.ok) throw new Error('Błąd przywracania usługi');
  },

  async getService(publicId: string): Promise<ReturnType<typeof mapApiService>> {
    const res = await apiClient.get(`/services/${publicId}`);
    if (!res.ok) throw new Error('Błąd pobierania usługi');
    const json = await res.json();
    return mapApiService(json.data ?? json);
  },

  async createService(payload: CreateServicePayload): Promise<{ publicId: string }> {
    const res = await apiClient.post('/services', payload as unknown as Record<string, unknown>);
    const json = await res.json();
    if (!res.ok) throw new Error(extractApiError(json, 'Błąd tworzenia usługi'));
    return json;
  },

  async updateService(publicId: string, payload: Partial<CreateServicePayload>): Promise<void> {
    const res = await apiClient.patch(`/services/${publicId}`, payload as unknown as Record<string, unknown>);
    const json = await res.json();
    if (!res.ok) throw new Error(extractApiError(json, 'Błąd aktualizacji usługi'));
  },

  async deleteService(publicId: string): Promise<void> {
    const res = await apiClient.delete(`/services/${publicId}`);
    if (!res.ok) throw new Error('Błąd usuwania usługi');
  },

  async uploadServiceImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('context', 'service');
    const res = await apiClient.postFormData('/upload/image', formData);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Błąd uploadu zdjęcia');
    return json.url as string;
  },
};
