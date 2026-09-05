import { Service, UserProfile, ToastNotification, NotificationItem, ToastType } from './index';
import type { ApiChatSession } from '../services/chatService';

export type ActiveModal = 'none' | 'chat_detail' | 'add_service' | 'report' | 'support';
export type SortBy = 'rating' | 'price-low' | 'distance' | 'verified';
export type FilterType = 'all' | 'offer' | 'request';
export type ReportType = 'service' | 'profile' | 'review';

export interface HomeProps {
    services: Service[];
    activeCategory: string;
    searchQuery: string;
    searchDisplay: string;  // tekst widoczny w input (może różnić się od searchQuery)
    location: string;
    filterType: FilterType;
    sortBy: SortBy;
    loadedCount: number;
    favorites: string[];
    isLoggedIn: boolean;
    showOnlineOnly: boolean;
}

export interface AppState {
    isLoggedIn: boolean;
    userProfile: UserProfile | null;
    freshUser: UserProfile | null | undefined;
    unreadNotifications: number;
    hasUnreadMessages: boolean;
    notificationList: NotificationItem[];
    showNotifications: boolean;
    location: string;
    favorites: string[];
    chatSessions: ApiChatSession[];
    selectedService: Service | null;
    isBookingLoading: boolean;
    servicesLoading: boolean;
    toasts: ToastNotification[];
    isLoadingApp?: boolean;       // true podczas startup silent refresh (token restore po odświeżeniu strony)
    activeModal: ActiveModal;
    currentChatId: string | null; // UUID sesji z backendu
    currentChatServiceId: string | null;
    initialChatText: string;
    editingServiceId: string | null;
    editingServiceFull: Service | null;
    allServices: Service[];
    reportData: { type: ReportType; id: number | string } | null;
    supportContext: { bookingId?: number; category?: string } | null;
    activeSupportTicketId: string | null;
    myDashboardServices: Service[];
    favServices: Service[];
    homeProps: HomeProps;
    isFullScreen: boolean;
    isNavLoading: boolean;
}

export interface HomeActions {
    setActiveCategory: (cat: string) => void;
    setSearchQuery: (q: string) => void;
    setSearchDisplay: (v: string) => void;
    setLocation: (loc: string) => void;
    setLocationCoords: (coords: { lat: number; lng: number } | null) => void;
    setFilterType: (f: FilterType) => void;
    setSortBy: (s: SortBy) => void;
    setLoadedCount: React.Dispatch<React.SetStateAction<number>>;
    setShowOnlineOnly: (v: boolean) => void;
    onToggleFavorite: (publicId: string) => void;
}

export interface AppActions {
    addToast: (message: string, type?: ToastType) => void;
    handleLogout: () => Promise<void>;
    removeToast: (id: number) => void;
    onServiceClick: (s: Service) => void | Promise<void>;
    toggleFavorite: (publicId: string) => void;
    handleLoginSuccess: (u: UserProfile | null) => void;
    handleNotificationClick: () => void;
    handleNotificationItemClick: (id: number, chatId?: string, type?: string, bookingId?: string | null, bookingTab?: string | null, servicePublicId?: string | null) => Promise<void>;
    onMarkAllRead: () => Promise<void>;
    getCurrentViewName: () => string;
    changeView: (v: string) => void;
    openAddServiceModal: () => void;
    openEditServiceModal: (s: Service) => void;
    deleteService: (publicId: string) => void;
    startChat: (s: Service, msg?: string) => Promise<void>;
    openReportModal: (type: ReportType, id: number | string) => void;
    openSupportModal: (context?: { bookingId?: number; category?: string }) => void;
    openSupportTicket: (id: string) => void;
    closeSupportTicket: () => void;
    handleBookingSubmit: (e: React.FormEvent) => Promise<void>;
    homeActions: HomeActions;
    usePublicProfileHook: (uid?: string) => unknown;
    handleServiceSubmit: (data: unknown) => Promise<void>;
    handleSendMessage: (text: string | null, imageUrl: string | null) => Promise<void>;
    setSelectedService: (s: Service | null) => void;
    setShowNotifications: (v: boolean) => void;
    setCurrentChatId: (id: string | null) => void;
    setActiveModal: (modal: ActiveModal) => void;
    handleAvatarUpdate: (url: string) => Promise<void>;
    handleBookingAction: (chatId: string | null, bookingId: number | string, action: 'accept' | 'decline' | 'cancel' | 'complete') => Promise<void>;
    handleBookingReschedule: (chatId: string | null, bookingId: number | string, newDate: string, newTime?: string) => void | Promise<void>;
    handleCreateBookingForClient: (sessionId: string, date: string, time: string | undefined, servicePublicId: string, recurrence?: { interval: 'weekly' | 'biweekly' | 'monthly'; count: number }) => Promise<void>;
    handleUpgradeToPremium: () => void;
    setNavLoading: (v: boolean) => void;
}
