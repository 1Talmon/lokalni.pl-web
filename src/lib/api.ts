import type { Service, ProviderProfile, Review } from './types';

const API = 'https://api.mylokalni.pl/api';

const fetchApi = async <T>(path: string, revalidate = 3600): Promise<T | null> => {
  try {
    const res = await fetch(`${API}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
};

export const getService = (publicId: string) =>
  fetchApi<Service>(`/services/${publicId}`);

export const getServiceReviews = async (publicId: string): Promise<Review[]> =>
  (await fetchApi<Review[]>(`/services/${publicId}/reviews?limit=50`)) ?? [];

export const getProfile = (uid: string) =>
  fetchApi<ProviderProfile>(`/users/${uid}/profile`);

export const getProfileServices = async (uid: string): Promise<Service[]> =>
  (await fetchApi<Service[]>(`/users/${uid}/services?limit=50`)) ?? [];

export const getProfileReviews = async (uid: string): Promise<Review[]> =>
  (await fetchApi<Review[]>(`/users/${uid}/reviews?limit=50`)) ?? [];
