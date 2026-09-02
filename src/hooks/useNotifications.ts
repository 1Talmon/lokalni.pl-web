import { useQuery } from '@tanstack/react-query';
import { notificationService } from '../services/notificationService';

export const useNotifications = (isLoggedIn: boolean) => {
  // 1. Pobieranie liczników (badges)
  const { data: counts } = useQuery({
    queryKey: ['notification-counts'],
    queryFn: () => notificationService.fetchBadgeCounts(),
    enabled: isLoggedIn,
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  // 2. Pobieranie pełnej listy powiadomień — staleTime=0 żeby invalidacja zawsze odświeżała
  const { data: list } = useQuery({
    queryKey: ['notifications-list'],
    queryFn: () => notificationService.fetchNotifications(),
    enabled: isLoggedIn,
    staleTime: 0,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  return {
    unreadNotifications: counts?.unreadNotifications ?? 0,
    hasUnreadMessages: (counts?.unreadMessages ?? 0) > 0,
    notificationList: list ?? [],
  };
};