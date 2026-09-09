import { apiClient } from '../../services/apiClient';
import { serviceService } from '../../services/serviceService';
import { dataUrlToFile } from '../../utils/imageUtils';
import type { UserProfile, ToastType } from '../../types';
import type { QueryClient } from '@tanstack/react-query';

export interface ServiceFormData {
    publicId?: string;
    title: string;
    description: string;
    price: string;
    priceUnit?: string;
    category: string;
    type: 'offer' | 'request';
    city?: string;
    isRemote?: boolean;
    radius?: number;
    deliveryTime?: string;
    durationMinutes?: number;
    images?: string[];
    videos?: Array<{ url: string; thumbnailUrl?: string | null }>;
    address?: string;
    addressLat?: number;
    addressLng?: number;
}

export interface ServiceApiPayload {
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
    videos: Array<{ url: string; thumbnailUrl?: string | null }>;
    address?: string;
    addressLat?: number;
    addressLng?: number;
}

interface ServiceSubmitDeps {
    addToast: (msg: string, type?: ToastType) => void;
    queryClient: QueryClient;
    refetchMyServices: () => void;
    userProfile: UserProfile | null;
    freshUser: UserProfile | null | undefined;
    setActiveModal: (m: 'none' | 'chat_detail' | 'add_service' | 'report' | 'support') => void;
}

export async function submitService(rawData: unknown, deps: ServiceSubmitDeps): Promise<void> {
    const { addToast, queryClient, refetchMyServices, userProfile, freshUser, setActiveModal } = deps;
    const data = rawData as ServiceFormData;
    try {
        const imageUrls: string[] = (await Promise.all(
            (data.images || []).slice(0, 5).map(async (imgUrl: string) => {
                if (imgUrl.startsWith('data:')) {
                    return await serviceService.uploadServiceImage(dataUrlToFile(imgUrl, 'image.jpg'));
                } else if (imgUrl.startsWith('http')) {
                    return imgUrl;
                }
                return null;
            })
        )).filter(Boolean) as string[];

        const payload: ServiceApiPayload = {
            title: data.title,
            description: data.description,
            price: parseFloat(data.price),
            priceUnit: data.priceUnit || 'za usługę',
            category: data.category,
            type: data.type,
            city: data.isRemote ? '' : (data.city || ''),
            radius: data.isRemote ? 0 : (data.radius ?? 20),
            isRemote: !!data.isRemote,
            deliveryTime: data.deliveryTime || undefined,
            durationMinutes: data.durationMinutes ?? undefined,
            images: imageUrls,
            videos: data.videos ?? [],
            address: data.address || undefined,
            addressLat: data.addressLat ?? undefined,
            addressLng: data.addressLng ?? undefined,
        };

        if (payload.address && !payload.addressLat) {
            try {
                const geoRes = await apiClient.get(`/public/address?query=${encodeURIComponent(payload.address)}`);
                const geoJson = await geoRes.json();
                if (geoJson.data?.[0]) {
                    payload.addressLat = geoJson.data[0].lat;
                    payload.addressLng = geoJson.data[0].lng;
                }
            } catch { /* geo lookup failed — proceed without coords */ }
        }

        if (data.publicId) {
            await serviceService.updateService(data.publicId, payload);
            addToast('Ogłoszenie zaktualizowane!');
        } else {
            await serviceService.createService(payload);
            addToast('Opublikowano!', 'success');
        }

        const uid = userProfile?.uid || freshUser?.uid;
        await Promise.all([
            refetchMyServices(),
            queryClient.invalidateQueries({ queryKey: ['services'] }),
            queryClient.invalidateQueries({ queryKey: ['public-profile', uid] }),
            queryClient.invalidateQueries({ queryKey: ['my-profile'] }),
            queryClient.invalidateQueries({ queryKey: ['recommended'] }),
            ...(data.publicId ? [queryClient.invalidateQueries({ queryKey: ['service'] })] : []),
        ]);
        setActiveModal('none');
    } catch (err: unknown) {
        addToast((err as Error).message || 'Błąd zapisu ogłoszenia', 'error');
    }
}
