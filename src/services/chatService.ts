// src/services/chatService.ts
import { apiClient } from './apiClient';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiChatSession {
  id: string;
  servicePublicId: string;
  serviceTitle: string;
  serviceType: 'offer' | 'request';
  otherPartyUid: string;
  otherPartyName: string;
  otherPartyAvatar: string | null;
  otherPartyOnline: boolean;
  otherPartyLastSeen: string | null;
  otherPartyStatus: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: number;
  isProvider?: boolean;
}

export interface ApiMessageBooking {
  id: string | number;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed' | 'reviewed';
  serviceType: 'offer' | 'request';
  serviceTitle: string;
  serviceImage: string | null;
  date: string | null;
  time: string | null;
  address: string | null;
  addressLat?: number;
  addressLng?: number;
  notes: string | null;
  message: string | null;
  proposedPrice?: number;
  availableFrom?: string;
  price: number;
  priceUnit: string;
  isMine: boolean;
  servicePublicId?: string | null;
  clientReviewed?: boolean;
  createdAt: string;
  seriesId?: string | null;
  seriesBookings?: Array<{ id: number; date: string; time?: string; status: string }> | null;
}

export interface ApiMessage {
  id: string;
  sessionId: string;
  sender: 'me' | 'other';
  text: string | null;
  image: string | null;
  video: string | null;
  videoThumbnail: string | null;
  bookingData: ApiMessageBooking | null;
  sentAt: string;
  timeLabel: string;
  read: boolean;
  isDeletedForAll: boolean;
  likedBy: string[];
  isLikedByMe: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Bezpieczny JSON parse — obsługuje Capacitor mock (json() zwraca już obiekt) i pusty body
async function safeJson<T = Record<string, unknown>>(res: Response): Promise<T> {
  try {
    return await res.json() as T;
  } catch {
    if (!res.ok) throw new Error(`Błąd serwera (${res.status})`);
    return {} as T;
  }
}

function errMsg(json: Record<string, unknown>, fallback: string): string {
  return (json?.message as string) || (json?.error as string) || fallback;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const chatService = {
  async getSessions(): Promise<ApiChatSession[]> {
    const res = await apiClient.get('/chats');
    const json = await safeJson<{ data?: ApiChatSession[] }>(res);
    if (!res.ok) throw new Error(errMsg(json as Record<string, unknown>, 'Błąd pobierania czatów'));
    return json.data ?? [];
  },

  async getMessages(sessionId: string, limit = 50, before?: string): Promise<ApiMessage[]> {
    const qs = `limit=${limit}${before ? `&before=${before}` : ''}`;
    const res = await apiClient.get(`/chats/${sessionId}/messages?${qs}`);
    const json = await safeJson<{ data?: ApiMessage[] }>(res);
    if (!res.ok) throw new Error(errMsg(json as Record<string, unknown>, `Błąd ${res.status}`));
    return json.data ?? [];
  },

  async startChat(
    servicePublicId: string,
    initialMessage?: string,
  ): Promise<{ id: string; servicePublicId: string; otherPartyUid: string; existing?: boolean }> {
    const res = await apiClient.post('/chats', {
      servicePublicId,
      ...(initialMessage ? { initialMessage } : {}),
    });
    const json = await safeJson<Record<string, unknown>>(res);
    if (!res.ok) throw new Error(errMsg(json, `Błąd tworzenia czatu (${res.status})`));
    return json as { id: string; servicePublicId: string; otherPartyUid: string; existing?: boolean };
  },

  async sendMessage(
    sessionId: string,
    text?: string,
    image?: string,
    video?: string,
    file?: { url: string; name: string; mime: string },
    videoThumbnail?: string,
  ): Promise<ApiMessage> {
    const res = await apiClient.post(`/chats/${sessionId}/messages`, {
      ...(text           ? { text }           : {}),
      ...(image          ? { image }          : {}),
      ...(video          ? { video }          : {}),
      ...(videoThumbnail ? { videoThumbnail } : {}),
      ...(file           ? { fileUrl: file.url, fileName: file.name, fileMime: file.mime } : {}),
    });
    const json = await safeJson<Record<string, unknown>>(res);
    if (!res.ok) throw new Error(errMsg(json, 'Błąd wysyłania wiadomości'));
    return json as unknown as ApiMessage;
  },

  async reactToMessage(sessionId: string, msgId: string): Promise<{ likedBy: string[] }> {
    const res = await apiClient.post(`/chats/${sessionId}/messages/${msgId}/react`, {});
    const json = await safeJson<{ likedBy: string[] }>(res);
    if (!res.ok) throw new Error(errMsg(json as Record<string, unknown>, 'Błąd reakcji'));
    return json;
  },

  async markRead(sessionId: string): Promise<void> {
    try {
      await apiClient.post(`/chats/${sessionId}/read`, {});
    } catch {
      // cicha porażka
    }
  },
};
