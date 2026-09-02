import { useQuery } from '@tanstack/react-query';
import { authService } from '../services/authService';
import { UserProfile } from '../types';

export const useMyProfile = (isLoggedIn: boolean) => {
    return useQuery<UserProfile>({
        queryKey: ['my-profile'],
        // POPRAWKA: Rzucamy błąd, jeśli user jest null, żeby wymusić isError w App.tsx
        queryFn: async () => {
            const user = await authService.fetchUserProfile();
            if (!user) {
                throw new Error("Błąd pobierania profilu lub wygasła sesja");
            }
            return user;
        },
        enabled: isLoggedIn,
        // Dane są "świeże" przez 1 minutę
        staleTime: 1000 * 60 * 1,
        // Wymusza sprawdzenie zmian na serwerze przy powrocie do aplikacji
        refetchOnWindowFocus: true,
        // Ponawia próbę 2 razy, jeśli się nie uda - wtedy wyloguje
        retry: 2
    });
};