'use client';
import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { tokenUtils } from '../utils/tokenUtils';
import { apiClient } from '../services/apiClient';
import type { UserProfile } from '../types';

interface VerifyLinkResponse {
  status?: string;
  token?: string;
  message?: string;
  data?: UserProfile | null;
  user?: UserProfile | null;
}

interface VerifyEmailViewProps {
  onLoginSuccess: (userData: UserProfile | null) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const VerifyEmailView = ({ onLoginSuccess, addToast }: VerifyEmailViewProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  // Ref zapobiegający podwójnemu wywołaniu w React Strict Mode
  const verificationStarted = useRef(false);

  useEffect(() => {
    // 1. Jeśli ktoś wejdzie "z palca" bez tokenu - od razu go wyrzucamy bez komunikatu lub z jednym
    if (!token) {
      router.push('/auth');
      return;
    }

    // 2. Blokada przed podwójnym uruchomieniem
    if (verificationStarted.current) return;
    verificationStarted.current = true;

    const performVerification = async () => {
      try {
        // Czyścimy starą sesję
        localStorage.removeItem('user_profile');
        localStorage.removeItem('is_logged_in');

        const result = await apiClient.get(`/auth/verify-link?token=${token}`) as unknown as VerifyLinkResponse;

        if (result.status === 'success' || result.token) {
          if (result.token) {
            tokenUtils.set(result.token);
          }
          // refreshToken jest wyłącznie w httpOnly cookie — nie czytamy z body
          localStorage.setItem('pending_tour', '1');
          onLoginSuccess(result.data ?? result.user ?? null);
          addToast("Konto zostało aktywowane pomyślnie!", "success");
          router.push('/');
        } else {
          addToast(result.message || "Link weryfikacyjny wygasł.", "error");
          router.push('/auth');
        }
      } catch {
        addToast("Wystąpił błąd podczas weryfikacji.", "error");
        router.push('/auth');
      }
    };

    performVerification();
  }, [token, router, onLoginSuccess, addToast]);

  return <LoadingScreen isVisible={true} />;
};