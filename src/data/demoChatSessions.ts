/**
 * Demo data — widoczna tylko gdy użytkownik nie ma jeszcze żadnych czatów w localStorage.
 * Usuń ten plik gdy API będzie gotowe i zastąp prawdziwymi danymi.
 */
import type { ChatSession } from '../types';

// Daty względem dziś (maj 2026)
const D1 = '2026-05-26'; // pon, za tydzień
const D2 = '2026-06-03'; // wt, za 2 tygodnie
const D3 = '2026-06-10'; // śr, za 3 tygodnie
const D4 = '2026-05-22'; // czw, za 3 dni

export const DEMO_CHAT_SESSIONS: ChatSession[] = [
    // (dane poniżej)
    // ── 1. Ktoś zarezerwował moją usługę → zaakceptowane (fioletowa kropka w kalendarzu)
    {
        serviceId: 1,
        serviceTitle: 'Koszenie trawników i ogród',
        providerName: 'Adam Nowak',
        providerAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        lastMessage: '📅 Prośba o rezerwację',
        timestamp: '10:30',
        unread: 0,
        messages: [
            {
                id: 2001,
                sender: 'other',
                time: '10:30',
                bookingData: {
                    id: 'demo_booking_1',
                    serviceType: 'offer',
                    serviceTitle: 'Koszenie trawników i ogród',
                    serviceImage: 'https://images.unsplash.com/photo-1592419044706-39796d40f98c?auto=format&fit=crop&w=600&q=80',
                    providerName: 'Adam Nowak',
                    providerAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
                    price: '30',
                    priceUnit: 'za godzinę',
                    status: 'accepted',
                    createdAt: '10:30',
                    date: D1,
                    time: '09:00',
                    address: 'ul. Lipowa 12, Warszawa',
                    notes: 'Proszę zabrać też nożyce do żywopłotu.',
                },
            },
            { id: 2002, sender: 'me',    time: '10:45', text: 'Zaakceptowałem — do zobaczenia w poniedziałek!' },
            { id: 2003, sender: 'other', time: '10:47', text: 'Super, dziękuję! Do zobaczenia 😊' },
        ],
    },

    // ── 2. Ja zarezerwowałem usługę → zaakceptowane (zielona kropka w kalendarzu)
    {
        serviceId: 2,
        serviceTitle: 'Mobilne mycie i sprzątanie aut',
        providerName: 'Anna W.',
        providerAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        lastMessage: '📅 Prośba o rezerwację',
        timestamp: 'Wczoraj',
        unread: 0,
        messages: [
            {
                id: 2011,
                sender: 'me',
                time: 'Wczoraj, 14:20',
                bookingData: {
                    id: 'demo_booking_2',
                    serviceType: 'offer',
                    serviceTitle: 'Mobilne mycie i sprzątanie aut',
                    serviceImage: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&w=600&q=80',
                    providerName: 'Anna W.',
                    providerAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
                    price: '80',
                    priceUnit: 'za usługę',
                    status: 'accepted',
                    createdAt: 'Wczoraj',
                    date: D2,
                    time: '11:00',
                    address: 'ul. Marszałkowska 4, Kraków',
                },
            },
            { id: 2012, sender: 'other', time: 'Wczoraj, 14:35', text: 'Potwierdzone! Będę punktualnie 🚗' },
        ],
    },

    // ── 3. Oczekująca prośba o zlecenie skierowana do mnie (Przychodzące)
    {
        serviceId: 42,
        serviceTitle: 'Awaryjne otwieranie drzwi',
        providerName: 'Krzysztof W.',
        providerAvatar: 'https://randomuser.me/api/portraits/men/28.jpg',
        lastMessage: '📋 Aplikacja do zlecenia',
        timestamp: 'Dziś, 08:12',
        unread: 1,
        messages: [
            {
                id: 2021,
                sender: 'other',
                time: '08:12',
                bookingData: {
                    id: 'demo_booking_3',
                    serviceType: 'request',
                    serviceTitle: 'Awaryjne otwieranie drzwi',
                    serviceImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80',
                    providerName: 'Krzysztof W.',
                    providerAvatar: 'https://randomuser.me/api/portraits/men/28.jpg',
                    price: '150',
                    priceUnit: 'za usługę',
                    status: 'pending',
                    createdAt: '08:12',
                    message: 'Dzień dobry! Chciałbym zgłosić się do zlecenia. Mam 10 lat doświadczenia i jestem dostępny od zaraz.',
                    proposedPrice: '140',
                    availableFrom: D4,
                },
            },
        ],
    },

    // ── 4. Moja oczekująca prośba o rezerwację (Wychodzące)
    {
        serviceId: 4,
        serviceTitle: 'DJ na Twoją imprezę',
        providerName: 'Kamil (DJ Mike)',
        providerAvatar: 'https://randomuser.me/api/portraits/men/85.jpg',
        lastMessage: '📅 Prośba o rezerwację',
        timestamp: 'Dziś, 11:00',
        unread: 0,
        messages: [
            {
                id: 2031,
                sender: 'me',
                time: '11:00',
                bookingData: {
                    id: 'demo_booking_4',
                    serviceType: 'offer',
                    serviceTitle: 'DJ na Twoją imprezę',
                    serviceImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80',
                    providerName: 'Kamil (DJ Mike)',
                    providerAvatar: 'https://randomuser.me/api/portraits/men/85.jpg',
                    price: '150',
                    priceUnit: 'za godzinę',
                    status: 'pending',
                    createdAt: '11:00',
                    date: D3,
                    time: '20:00',
                    address: 'ul. Festiwalowa 5, Wrocław',
                    notes: 'Urodziny — 50 osób, muzyka pop i latin.',
                },
            },
            { id: 2032, sender: 'other', time: '11:15', text: 'Cześć! Sprawdzam dostępność i odezwę się do końca dnia 👍' },
        ],
    },
];

/**
 * Seed synchroniczny — uruchamia się przy imporcie modułu, PRZED wszystkimi hookami React.
 * Dzięki temu wszystkie usePersistedState('user_chats') odczytają dane przy pierwszym renderze.
 */
try {
    const stored = localStorage.getItem('user_chats');
    const isEmpty = !stored || stored === '[]' || stored === 'null';
    if (isEmpty) {
        localStorage.setItem('user_chats', JSON.stringify(DEMO_CHAT_SESSIONS));
    }
} catch { /* SSR lub brak dostępu do localStorage */ }
