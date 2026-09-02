import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { normalizeMediaUrl } from '../utils/normalizeUrl';

export interface ApiBooking {
  id: number | string;
  servicePublicId: string;
  serviceType: 'offer' | 'request';
  type?: 'offer' | 'request';
  serviceTitle: string;
  serviceImage: string | null;
  feedImageUrl: string | null;
  providerUid: string;
  providerName: string;
  providerAvatar: string | null;
  clientName: string;
  clientAvatar: string | null;
  chatId: string | null;
  price: number;
  priceUnit: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed' | 'reviewed';
  createdAt: string;
  date: string | null;
  time: string | null;
  address: string | null;
  addressLat?: number;
  addressLng?: number;
  notes: string | null;
  message: string | null;
  proposedPrice?: number;
  availableFrom?: string;
  isMine: boolean;
}

export interface BookingEvent {
  booking: ApiBooking;
  isOutgoing: boolean;
  otherPartyName: string;
  otherPartyAvatar: string;
}

async function fetchBookings(): Promise<ApiBooking[]> {
  const [outRes, inRes] = await Promise.all([
    apiClient.get('/bookings?limit=50'),
    apiClient.get('/bookings/incoming?limit=50'),
  ]);
  if (!outRes.ok) throw new Error(`Błąd pobierania rezerwacji (${outRes.status})`);
  if (!inRes.ok) throw new Error(`Błąd pobierania przychodzących rezerwacji (${inRes.status})`);
  const [outJson, inJson] = await Promise.all([outRes.json(), inRes.json()]);
  const outgoing: ApiBooking[] = outJson.data ?? [];
  const incoming: ApiBooking[] = inJson.data ?? [];
  // deduplicate by id
  const seen = new Set<number | string>();
  const all: ApiBooking[] = [];
  for (const b of [...outgoing, ...incoming]) {
    if (!seen.has(b.id)) {
      seen.add(b.id);
      all.push({
        ...b,
        serviceImage: normalizeMediaUrl(b.serviceImage),
        providerAvatar: normalizeMediaUrl(b.providerAvatar),
      });
    }
  }
  return all;
}

export function useBookings(isLoggedIn: boolean) {
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: fetchBookings,
    enabled: isLoggedIn,
    staleTime: 1000 * 30,
    refetchInterval: 30000,
  });

  const events: BookingEvent[] = bookings.map(b => ({
    booking: b,
    isOutgoing: b.isMine,
    otherPartyName: b.isMine ? b.providerName : b.clientName,
    otherPartyAvatar: b.isMine ? (b.providerAvatar || '') : (b.clientAvatar || ''),
  }));

  const pendingIncoming  = events.filter(e => !e.isOutgoing && e.booking.status === 'pending');
  const acceptedIncoming = events.filter(e => !e.isOutgoing && e.booking.status === 'accepted');
  const pendingOutgoing  = events.filter(e => e.isOutgoing  && e.booking.status === 'pending');
  const acceptedOutgoing = events.filter(e => e.isOutgoing  && e.booking.status === 'accepted');
  const accepted         = events.filter(e => e.booking.status === 'accepted');
  const history          = events.filter(e => ['declined', 'cancelled', 'completed', 'reviewed'].includes(e.booking.status));

  const byDate: Record<string, BookingEvent[]> = {};
  accepted.forEach(ev => {
    const date = ev.booking.date || ev.booking.availableFrom || '';
    if (!date) return;
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(ev);
  });

  return { all: events, pendingIncoming, acceptedIncoming, pendingOutgoing, acceptedOutgoing, accepted, history, byDate, isLoading };
}
