import { useQuery } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { ProviderProfile } from '../types';
import { normalizeMediaUrl } from '../utils/normalizeUrl';

interface PublicProfileResponse {
  imie: string;
  nazwisko: string;
  profilowe: string | null;
  bio: string | null;
  online: boolean;
  statusAktywnosci: string;
  email: string | null;
  telefon: string | null;
  uid: string | null;
  deleted?: boolean;
  reviewsCount?: number;
  avgRating?: number;
  servicesCount?: number;
  joinedYear?: number | null;
  joinedAt?: string | null;
  isPremium?: boolean;
  zdjecieTla?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  website?: string | null;
}

export const usePublicProfile = (uid: string | undefined) => {
  const { data, isPending, isError, error } = useQuery<PublicProfileResponse>({
    queryKey: ['public-profile', uid],
    queryFn: () => authService.fetchPublicProfile(uid!),
    enabled: !!uid,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  // Mapowanie danych
  const profile: ProviderProfile | null = data ? {
    uid: uid || '',
    name: `${data.imie || ''} ${data.nazwisko || ''}`.trim() || "Użytkownik",
    avatar: normalizeMediaUrl(data.profilowe) || null,
    description: data.bio || "Ten użytkownik jeszcze nie dodał opisu.",
    responseRate: "100%",
    joinedDate: data.joinedYear ? `Dołączył w ${data.joinedYear}` : "Użytkownik MyLokalni",
    joinedAt: data.joinedAt ?? null,
    reviewsCount: data.reviewsCount ?? 0,
    rating: data.avgRating ?? 0,
    avgRating: data.avgRating ?? 0,
    reviews: [],
    is_me: false,
    deleted: data.deleted ?? false,
    isPremium: data.isPremium ?? false,
    zdjecieTla: data.zdjecieTla ?? null,
    servicesCount: data.servicesCount ?? 0,
    email: data.email,
    telefon: data.telefon,
    facebook: data.facebook ?? null,
    instagram: data.instagram ?? null,
    tiktok: data.tiktok ?? null,
    website: data.website ?? null,
  } : null;

  return {
    profile,
    isLoading: isPending,
    isError,
    isOnline: data?.online ?? false,
    activityStatus: data?.statusAktywnosci ?? "",
    error
  };
};