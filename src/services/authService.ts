// src/services/authService.ts
import { apiClient } from './apiClient';
import { logger } from '../utils/logger';
import { tokenUtils } from '../utils/tokenUtils';
import { normalizeMediaUrl } from '../utils/normalizeUrl';
import { dataUrlToFile } from '../utils/imageUtils';
import { secureStorage } from '../utils/secureStorage';
import { Capacitor } from '@capacitor/core';
import type { UserProfile } from '../types';

// Ustawiamy adres API (zostawiamy dla metod publicznych)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.mylokalni.pl/api';

// --- AUTH TYPES ---

interface RawUserPayload {
    uid?: string;
    imie?: string;
    nazwisko?: string;
    name?: string;
    email?: string;
    profilowe?: string;
    avatar?: string;
    telefon?: string;
    bio?: string | null;
    linkPolecajacy?: string;
    link_polecajacy?: string;
    liczbaPoleconych?: number;
    liczba_poleconych?: number;
    ustawionehaslo?: boolean;
    rekomendacje?: unknown[];
    confidential?: boolean;
    isPremium?: boolean;
    facebook?: string | null;
    instagram?: string | null;
    tiktok?: string | null;
    website?: string | null;
    zdjecieTla?: string | null;
}

interface RawAuthPayload extends RawUserPayload {
    token?: string;
    refreshToken?: string;
    needs_2fa?: boolean;
    temp_token?: string;
    method?: string;
    data?: RawUserPayload;
    user?: RawUserPayload;
    avatarurl?: string;
    [key: string]: unknown;
}

export interface TwoFAChallengeResult {
    needs_2fa: true;
    temp_token: string;
    method: 'totp' | 'email';
}

export interface SocialDobResult {
    needs_dob: true;
    temp_token: string;
}

export interface AuthSuccessResult {
    user: UserProfile;
}

export type AuthResult = TwoFAChallengeResult | SocialDobResult | AuthSuccessResult;

export interface RegisterData {
    email: string;
    password: string;
    imie: string;
    nazwisko: string;
    telefon: string;
    zgodaRegulamin: boolean;
    zgodaNewsletter: boolean;
    kodPolecajacy?: string;
    dateOfBirth?: string;
    parentalEmail?: string;
}

// Interfejs dla danych aktualizacji profilu
export interface ProfileUpdateData {
    name: string;
    phone: string;
}

export const authService = {
    // --- REJESTRACJA ---
    async register(data: RegisterData): Promise<{ success: boolean; parentalConsentRequired?: boolean }> {
        const kodPolecajacy = data.kodPolecajacy?.trim() || localStorage.getItem('referral_code') || undefined;
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, kodPolecajacy }),
        });
        const result = await response.json();
        if (response.ok && result.status === 'parental_consent_required') {
            localStorage.removeItem('referral_code');
            return { success: true, parentalConsentRequired: true };
        }
        if (response.ok && (result.status === 'success' || result.info === 'success')) {
            localStorage.removeItem('referral_code');
            return { success: true };
        }
        throw new Error(result.message || result.error || result.info || 'Błąd rejestracji');
    },

    // --- ZGODA RODZICIELSKA ---
    async resendParentalConsent(email: string): Promise<void> {
        const response = await fetch(`${API_URL}/auth/parental-consent/resend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Błąd ponownego wysyłania');
        }
    },

    // --- LOGOWANIE GOOGLE ---
    async loginWithGoogle(idToken: string): Promise<AuthResult> {
        const response = await fetch(`${API_URL}/auth/social/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: idToken }),
            credentials: 'include',
        });

        const result: RawAuthPayload = await response.json();
        if (response.status === 409 && result.code === 'ACCOUNT_EXISTS') {
            throw Object.assign(new Error('Konto z tym adresem email już istnieje. Zaloguj się hasłem.'), { code: 'ACCOUNT_EXISTS' });
        }
        if (!response.ok) throw new Error(result.message as string || 'Błąd logowania Google');

        if (result.needs_dob) {
            return { needs_dob: true, temp_token: result.temp_token as string };
        }
        if (result.needs_2fa) {
            return { needs_2fa: true, temp_token: result.temp_token as string, method: result.method as 'totp' | 'email' };
        }
        return this.handleAuthSuccess(result);
    },

    // --- LOGOWANIE FACEBOOK ---
    async loginWithFacebook(accessToken: string): Promise<AuthResult> {
        const response = await fetch(`${API_URL}/auth/social/facebook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: accessToken }),
            credentials: 'include',
        });

        const result: RawAuthPayload = await response.json();
        if (response.status === 409 && result.code === 'ACCOUNT_EXISTS') {
            throw Object.assign(new Error('Konto z tym adresem email już istnieje. Zaloguj się hasłem.'), { code: 'ACCOUNT_EXISTS' });
        }
        if (!response.ok) throw new Error(result.message as string || 'Błąd logowania Facebook');

        if (result.needs_dob) {
            return { needs_dob: true, temp_token: result.temp_token as string };
        }
        if (result.needs_2fa) {
            return { needs_2fa: true, temp_token: result.temp_token as string, method: result.method as 'totp' | 'email' };
        }
        return this.handleAuthSuccess(result);
    },

    // --- DOKOŃCZENIE REJESTRACJI SOCIAL (DOB) ---
    async completeSocialLogin(tempToken: string, dateOfBirth: string, parentalEmail?: string): Promise<{ success: boolean; parentalConsentRequired?: boolean; childEmail?: string } | AuthSuccessResult> {
        const response = await fetch(`${API_URL}/auth/social/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ temp_token: tempToken, dateOfBirth, parentalEmail }),
            credentials: 'include',
        });
        const result: RawAuthPayload = await response.json();
        if (!response.ok) throw new Error(result.message as string || 'Błąd rejestracji.');
        if (result.status === 'parental_consent_required') {
            return { success: true, parentalConsentRequired: true, childEmail: result.childEmail as string | undefined };
        }
        return this.handleAuthSuccess(result);
    },

    // --- LOGOWANIE STANDARDOWE — obsługa 2FA ---
    async login(email: string, password: string): Promise<AuthResult> {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
        });

        const result: RawAuthPayload = await response.json();

        if (!response.ok) {
            const errorMessage = result.message || result.info || result.error || 'Błąd logowania';
            throw new Error(errorMessage as string);
        }

        // 2FA wymagane — zwracamy specjalny obiekt
        if (result.needs_2fa) {
            return { needs_2fa: true, temp_token: result.temp_token as string, method: result.method as 'totp' | 'email' };
        }

        return this.handleAuthSuccess(result, email);
    },

    // --- 2FA CHALLENGE ---
    async verify2FA(tempToken: string, code: string): Promise<AuthResult> {
        const response = await fetch(`${API_URL}/auth/2fa/challenge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ temp_token: tempToken, code }),
            credentials: 'include',
        });
        const result: RawAuthPayload = await response.json();
        if (!response.ok) {
            // temp_token pozostaje ważny — frontend używa tego samego, który wysłał
            throw new Error(result.error as string || 'Nieprawidłowy kod.');
        }
        return this.handleAuthSuccess(result);
    },

    async resend2FACode(tempToken: string) {
        const response = await fetch(`${API_URL}/auth/2fa/challenge/resend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ temp_token: tempToken }),
        });
        if (!response.ok) throw new Error('Błąd wysyłania kodu.');
    },

    // --- 2FA SETUP ---
    async get2FAStatus(): Promise<{ totp_enabled: boolean; email_2fa_enabled: boolean }> {
        const response = await apiClient.get('/auth/2fa/status');
        if (!response.ok) throw new Error('Błąd pobierania statusu 2FA.');
        return response.json();
    },

    async setup2FATOTP(): Promise<{ qr_code: string; secret: string }> {
        const response = await apiClient.post('/auth/2fa/totp/setup', {});
        if (!response.ok) throw new Error('Błąd konfiguracji TOTP.');
        return response.json();
    },

    async enable2FATOTP(code: string) {
        const response = await apiClient.post('/auth/2fa/totp/enable', { code });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || result.message || 'Nieprawidłowy kod.');
        return result;
    },

    async enable2FAEmail() {
        const response = await apiClient.post('/auth/2fa/email/enable', {});
        if (!response.ok) throw new Error('Błąd włączania 2FA email.');
    },

    async disable2FA(payload: { code?: string; password?: string }) {
        const response = await apiClient.post('/auth/2fa/disable', payload);
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || result.message || 'Błąd wyłączania 2FA.');
        return result;
    },

    // --- WSPÓLNA OBSŁUGA SUKCESU (ZAKTUALIZOWANE MAPOWANIE) ---
    handleAuthSuccess(result: RawAuthPayload, fallbackEmail?: string): AuthSuccessResult {
        if (result.token) tokenUtils.set(result.token);
        if (result.refreshToken && Capacitor.isNativePlatform()) {
            secureStorage.setRefreshToken(result.refreshToken).catch(() => {});
        }

        const userData: RawUserPayload = result.data || result.user || result;

        let fullName = "";

        if (userData.imie && userData.nazwisko) {
            fullName = `${userData.imie} ${userData.nazwisko}`;
        } else if (userData.imie) {
            fullName = userData.imie;
        } else if (userData.name) {
            fullName = userData.name;
        } else if (result.imie) {
            fullName = `${result.imie} ${result.nazwisko || ''}`.trim();
        } else {
            fullName = userData.email || result.email || fallbackEmail || "Użytkownik";
        }

        const email = userData.email || result.email || fallbackEmail;

        const frontendUser: UserProfile = {
            uid: userData.uid || result.uid || "",
            name: fullName,
            imie: userData.imie || "",
            nazwisko: userData.nazwisko || "",
            email: email ?? '',
            avatar: normalizeMediaUrl(userData.profilowe || userData.avatar || result.avatarurl) || "",
            phone: userData.telefon || result.telefon || "",
            bio: userData.bio || undefined,
            linkPolecajacy: userData.linkPolecajacy || userData.link_polecajacy || "",
            liczbaPoleconych: userData.liczbaPoleconych ?? userData.liczba_poleconych ?? 0,
            ustawionehaslo: userData.ustawionehaslo || false,
            rekomendacje: (userData.rekomendacje as { tytul: string; opis: string; napisPrzycisku: string; akcja: string }[]) || [],
            confidential: userData.confidential || false,
            isPremium: userData.isPremium,
            facebook: userData.facebook ?? null,
            instagram: userData.instagram ?? null,
            tiktok: userData.tiktok ?? null,
            website: userData.website ?? null,
            zdjecieTla: userData.zdjecieTla ?? null,
        };

        localStorage.setItem('user_profile', JSON.stringify(frontendUser));
        localStorage.setItem('is_logged_in', 'true');

        return { user: frontendUser };
    },

    // --- WYLOGOWANIE ---
    async logout() {
        try {
            const rt = await secureStorage.getRefreshToken();
            const body: Record<string, string> = {};
            if (rt) body.refreshToken = rt;
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });
            await secureStorage.removeRefreshToken();
        } catch (e) {
            logger.warn("Błąd wylogowania z API", e);
        } finally {
            tokenUtils.clearAll();
        }
    },

    // --- POBIERANIE PROFILU (Bez zmian) ---
    async fetchUserProfile() {
        try {
            const response = await apiClient.get('/users/me');

            if (!response.ok) return null;

            const result = await response.json();
            const authData = this.handleAuthSuccess(result);
            return authData.user;
        } catch (error) {
            logger.error("Błąd odświeżania profilu", error);
            return null;
        }
    },

    // --- POBIERANIE PUBLICZNEGO PROFILU (Bez zmian) ---
    async fetchPublicProfile(uid: string) {
        try {
            const response = await fetch(`${API_URL}/users/${uid}/profile`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                if (response.status === 404) return null;
                if (response.status === 410) return { deleted: true };
                throw new Error('Błąd pobierania profilu');
            }

            return await response.json();
        } catch (error) {
            logger.error("Błąd API (public profile)", error);
            throw error;
        }
    },

    // --- AKTUALIZACJA DANYCH (Bez zmian) ---
    async updateProfileData(data: ProfileUpdateData) {
        const nameParts = data.name.trim().split(' ');
        const imie = nameParts[0];
        const nazwisko = nameParts.slice(1).join(' ');

        const payload = {
            imie: imie,
            nazwisko: nazwisko,
            telefon: data.phone
        };

        const response = await apiClient.patch('/users/me', payload);

        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Błąd aktualizacji danych');

        const currentUser = this.getCurrentUser();
        const updatedUser = {
            ...currentUser,
            name: data.name,
            phone: data.phone
        };
        localStorage.setItem('user_profile', JSON.stringify(updatedUser));

        return updatedUser;
    },

    // --- ZMIANA AVATARA — upload przez POST /upload/image → URL → PATCH /users/me/avatar ---
    async updateAvatar(fileOrBase64: File | string) {
        const file = typeof fileOrBase64 === 'string'
            ? dataUrlToFile(fileOrBase64, 'avatar.jpg')
            : fileOrBase64;

        // 2. Upload pliku → dostajemy URL z CDN
        const formData = new FormData();
        formData.append('file', file);
        formData.append('context', 'avatar');

        const uploadRes = await apiClient.postFormData('/upload/image', formData);
        const uploadResult = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadResult.error || 'Błąd uploadu zdjęcia');

        const avatarUrl: string = normalizeMediaUrl(uploadResult.url) || uploadResult.url;

        // 2. Zapisz URL w profilu
        const response = await apiClient.patch('/users/me/avatar', { avatarUrl });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || result.message || 'Błąd zmiany zdjęcia');

        const currentUser = this.getCurrentUser();
        const updatedUser = { ...currentUser, avatar: avatarUrl, profilowe: avatarUrl };
        localStorage.setItem('user_profile', JSON.stringify(updatedUser));
        return updatedUser;
    },

    // --- ZMIANA NUMERU TELEFONU (DODANO) ---
    async changePhoneNumber(nowyNumerTelefonu: string) {
        const response = await apiClient.patch('/users/me/phone', { nowyNumerTelefonu });
        const result = await response.json();

        if (!response.ok) throw new Error(result.message || 'Błąd zmiany numeru telefonu');

        // Aktualizacja lokalnego stanu użytkownika, by UI odświeżyło się od razu
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            const updatedUser = { ...currentUser, phone: nowyNumerTelefonu };
            localStorage.setItem('user_profile', JSON.stringify(updatedUser));
        }

        return result;
    },

    // --- NOWE METODY OBSŁUGI HASŁA ---

    // Zmiana hasła dla użytkowników, którzy je już posiadają
    async changePassword(currentPassword: string, newPassword: string) {
        const response = await apiClient.post('/auth/password/change', {
            currentPassword,
            newPassword
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Błąd zmiany hasła');
        return result;
    },

    // Ustawienie pierwszego hasła (np. dla kont Google/FB)
    async setFirstPassword(password: string) {
        const response = await apiClient.post('/auth/password/set', {
            password
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Błąd ustawiania hasła');

        // Aktualizujemy lokalny profil, aby odzwierciedlić posiadanie hasła
        const currentUser = this.getCurrentUser();
        if (currentUser) {
            const updatedUser = { ...currentUser, ustawionehaslo: true };
            localStorage.setItem('user_profile', JSON.stringify(updatedUser));
        }
        return result;
    },

    // --- POMOCNICZE (Bez zmian) ---
    getToken() { return tokenUtils.get(); },
    isAuthenticated() { return !!tokenUtils.get() && !tokenUtils.isExpired(tokenUtils.get()); },
    getCurrentUser() {
        const userStr = localStorage.getItem('user_profile');
        if (!userStr) return null;
        try { return JSON.parse(userStr); } catch { return null; }
    },

    // --- SPRAWDZANIE HASŁA (Bez zmian) ---
    async checkPasswordStrength(password: string) {
        try {
            const res = await fetch(`${API_URL}/auth/password/check`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({password})
            });
            return await res.json();
        } catch { return { score: 0 }; }
    },

    // --- WERYFIKACJA (Bez zmian) ---
    async verifyEmail(email: string, kod: string) {
        const response = await fetch(`${API_URL}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, kod }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Błąd weryfikacji');
        return result;
    },

    async resendVerificationCode(email: string) {
        const response = await fetch(`${API_URL}/auth/verify/resend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Błąd wysyłania kodu');
        return result;
    },

    // --- REFRESH TOKEN ---
    async refreshToken() {
        try {
            const rt = await secureStorage.getRefreshToken();
            const body: Record<string, string> = {};
            if (rt) body.refreshToken = rt;
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });
            const result = await response.json();
            if (response.ok && result.token) {
                tokenUtils.set(result.token);
                // refreshToken jest wyłącznie w httpOnly cookie — nie czytamy z body
                return result.token;
            }
            return null;
        } catch {
            return null;
        }
    },

    // --- RESET HASŁA (Bez zmian) ---
    async requestPasswordReset(email: string) {
        const response = await fetch(`${API_URL}/auth/password/reset/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Błąd resetu.');
        return result;
    },

    async confirmPasswordReset(token: string, newPassword: string) {
        const response = await fetch(`${API_URL}/auth/password/reset/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, newPassword }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Błąd zmiany hasła.');
        return result;
    },

    // --- USUWANIE KONTA (Bez zmian) ---
    async requestAccountDeletion() {
        const response = await apiClient.post('/auth/account/delete/request', {});
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Błąd inicjacji usuwania konta');
        return result;
    },

    async confirmAccountDeletion(token: string) {
        const response = await fetch(`${API_URL}/auth/account/delete/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Błąd usuwania konta');
        return result;
    },

    // --- TERMINARZ (DOSTĘPNOŚĆ) - NOWE METODY ---

    // Pobieranie zajętych dni dla danego miesiąca
    async getAvailability(year: number, month: number) {
        const response = await apiClient.get(`/users/me/availability?year=${year}&month=${month}`);
        if (!response.ok) throw new Error(`Błąd pobierania grafiku (${response.status})`);
        return response.json();
    },

    // Aktualizacja dostępności
    async updateAvailability(daysOff: string[], daysOn: string[]) {
        const response = await apiClient.put('/users/me/availability', {
            daysOff,
            daysOn
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Błąd aktualizacji kalendarza');
        return result;
    },

    // Dostępność konkretnego wykonawcy (do formularza rezerwacji)
    async getProviderAvailability(uid: string, year: number, month: number) {
        const response = await apiClient.get(`/users/${uid}/availability?year=${year}&month=${month}`);
        if (!response.ok) throw new Error(`Błąd pobierania dostępności (${response.status})`);
        return response.json();
    },

    // Oznaczenie rezerwacji jako zakończonej przez wykonawcę
    // Backend: inkrementuje licznik wykonanych zleceń, wysyła powiadomienie do klienta
    async completeBooking(bookingId: string) {
        const response = await apiClient.post(`/bookings/${bookingId}/complete`, {});
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || 'Błąd zakończenia rezerwacji');
        }
        return response.json();
    },

    // Oznaczenie rezerwacji jako ocenionej (po wystawieniu opinii)
    async markBookingReviewed(bookingId: string) {
        const response = await apiClient.post(`/bookings/${bookingId}/reviewed`, {});
        if (!response.ok) return;
        return response.json();
    },

    // Godziny pracy wykonawcy — prosta lista string[] (np. ["08:00","09:00"])
    async getWorkingHours(): Promise<string[] | null> {
        try {
            const response = await apiClient.get('/users/me/hours-list');
            if (!response.ok) return [];
            const data = await response.json();
            const hours = data?.hours;
            // Zawsze zwróć tablicę (nigdy undefined/obiekt)
            return Array.isArray(hours) ? hours : [];
        } catch {
            return [];
        }
    },

    async updateWorkingHours(hours: string[]): Promise<void> {
        const response = await apiClient.post('/users/me/hours-list', { hours });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || 'Błąd zapisu godzin pracy');
        }
    },

    async getBufferMinutes(): Promise<number> {
        try {
            const response = await apiClient.get('/users/me/buffer');
            if (!response.ok) return 0;
            const data = await response.json();
            return data?.bufferMinutes ?? 0;
        } catch {
            return 0;
        }
    },

    async updateBufferMinutes(bufferMinutes: number): Promise<void> {
        const response = await apiClient.put('/users/me/buffer', { bufferMinutes });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error((err as { message?: string }).message || 'Błąd zapisu przerwy');
        }
    },

    // Backend zwraca { slots: string[], durationMinutes: number }
    async getServiceTakenHours(servicePublicId: string, date: string) {
        const response = await apiClient.get(`/services/${servicePublicId}/availability?date=${date}`);
        if (!response.ok) throw new Error(`Błąd pobierania godzin (${response.status})`);
        const data = await response.json();
        return { availableHours: data.slots ?? [], takenHours: [], durationMinutes: data.durationMinutes ?? 60 };
    },

    async getCertificates() {
        const response = await apiClient.get('/users/me/certificates');
        if (!response.ok) throw new Error('Błąd pobierania certyfikatów');
        const data = await response.json();
        return data.data as Array<{ id: string; name: string; fileType: 'image' | 'pdf' | null; url: string | null; status: 'verified' | 'pending' }>;
    },

    async addCertificate(payload: { name: string; fileType: 'image' | 'pdf' | null; url: string | null }) {
        const response = await apiClient.post('/users/me/certificates', payload);
        if (!response.ok) throw new Error('Błąd dodawania certyfikatu');
        return response.json() as Promise<{ id: string; name: string; fileType: 'image' | 'pdf' | null; url: string | null; status: 'verified' | 'pending' }>;
    },

    async updateCertificateName(id: string, name: string) {
        const response = await apiClient.patch(`/users/me/certificates/${id}`, { name });
        if (!response.ok) throw new Error('Błąd aktualizacji nazwy');
    },

    async deleteCertificate(id: string) {
        const response = await apiClient.delete(`/users/me/certificates/${id}`);
        if (!response.ok) throw new Error('Błąd usuwania certyfikatu');
    },
};