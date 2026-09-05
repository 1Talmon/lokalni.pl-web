'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ClientPortal } from '../../components/ui/ClientPortal';
import {
    Camera, Settings,
    ShieldCheck, ClipboardList,
    Eye, Layout, LogOut, Copy,
    Tag, Megaphone, Sparkles, Gift, Check, Loader2, Trash2
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { readNavState } from '../../utils/navState';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { NativeNav } from '@/plugins/NativeNav';
import { Share } from '@capacitor/share';
import { usePlatform } from '@/hooks/usePlatform';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { CameraSource } from '@capacitor/camera';
import { Service, UserProfile } from '@/types';
import { authService } from '@/services/authService';
import { apiClient } from '@/services/apiClient';
import { getCroppedImg, type PixelCrop } from '@/utils/cropImage';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CertEntry } from './components/Settings/CertificateSection';

// IMPORTY KOMPONENTÓW
import { DashboardHome } from './components/DashboardHome';
import { ServicesSection } from './components/ServicesSection';
import { ReservationsSection } from './components/ReservationsSection';
import { SettingsSection } from './components/SettingsSection';
import { PostsSection, type PostMedia } from './components/PostSection';

// IMPORTY UI
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { BottomSheetHandle } from '../../components/ui/BottomSheetHandle';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { PremiumGate } from '../../components/premium/PremiumGate';
import { PremiumUpgradeModal } from '../../components/premium/PremiumUpgradeModal';

// IMPORTY DETALI
import { EarningsDetail } from './subviews/EarningsDetail';
import { ReviewsDetail } from './subviews/ReviewsDetail';
import { AnalyticsDetail } from './subviews/AnalyticsDetail';

// IMPORTY MODALI
import { CertificatePreviewModal } from '../../components/modals/CertificatePreviewModal';
import { AvatarEditModal } from '../../components/modals/AvatarEditModal';
import { lockScroll, unlockScroll } from '../../utils/scrollLock';
import { dataUrlToFile } from '../../utils/imageUtils';
import { tokenUtils } from '@/utils/tokenUtils';

// DEFINICJA TYPU DLA TABÓW I WIDOKÓW
type ActiveTab = 'dashboard' | 'services' | 'orders' | 'posts' | 'settings';
type DetailView = 'none' | 'earnings' | 'reviews' | 'analytics';

export const UserProfileView = ({
                                    user, isLoggedIn, myServices, onLogout, onAvatarChange, onAddService, onEditService, onDeleteService, addToast, onBookingAction, onReschedule, onUpgrade, onOpenChat, onOpenSupport, onOpenTicket
                                }: {
    user: UserProfile | null,
    isLoggedIn: boolean,
    myServices: Service[],
    onLogin: () => void,
    onLogout: () => void,
    onAvatarChange: (newUrl: string) => void,
    onAddService: () => void,
    onEditService: (s: Service) => void,
    onDeleteService: (publicId: string) => void,
    addToast?: (msg: string, type?: import('@/types').ToastType) => void,
    onBookingAction?: (chatId: string | null, bookingId: number | string, action: 'accept' | 'decline' | 'cancel' | 'complete') => Promise<void>,
    onReschedule?: (chatId: string | null, bookingId: number | string, newDate: string, newTime?: string) => void,
    onUpgrade?: () => void,
    onOpenChat?: (chatId: string) => void,
    onOpenSupport?: () => void,
    onOpenTicket?: (id: string) => void,
}) => {
    const { isNative } = usePlatform();
    const router = useRouter();
    const queryClient = useQueryClient();
    const pathname = usePathname();

    const contentAnchorRef = useRef<HTMLDivElement>(null);
    const mobileNavRef = useRef<HTMLDivElement>(null);
    const desktopScrollAnchorRef = useRef<HTMLDivElement>(null);
    const profileCardRef = useRef<HTMLDivElement>(null);
    const sidebarSpacerRef = useRef<HTMLDivElement>(null);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // NAPRAWA TYPU USERDATA
    const userData = user;
    const currentPhone = userData?.phone || "";

    const isPremium = !!(userData?.isPremium);
    const [showPlusModal, setShowPlusModal] = useState(false);

    const hasBio = !!(userData?.bio || userData?.opis || userData?.biografia);
    const hasSocial = !!(userData?.instagram || userData?.facebook || userData?.tiktok || userData?.web || userData?.socialLinks?.fb || userData?.socialLinks?.ig || userData?.socialLinks?.tt || userData?.socialLinks?.web);
    const hasPhoto = !!(userData?.profilowe || userData?.avatar);
    const hasPhone = !!currentPhone;
    const hasPasswordMethod = userData?.ustawionehaslo === true;
    const settingsBadge = !hasBio || !hasSocial || !hasPasswordMethod || !hasPhoto || !hasPhone;

    const searchParams = useSearchParams();
    const navState = useRef(readNavState<{ openTab?: ActiveTab; openDetail?: DetailView; bookingTab?: 'incoming' | 'outgoing' | 'history' }>(pathname));
    const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
        const tabParam = searchParams.get('tab') as ActiveTab | null;
        const stateTab = tabParam || navState.current?.openTab;
        if (stateTab) return stateTab;
        if (typeof window === 'undefined') return 'dashboard';
        return (sessionStorage.getItem('nav_active_tab_/dashboard') as ActiveTab | null) || 'dashboard';
    });
    useEffect(() => {
        sessionStorage.setItem('nav_active_tab_/dashboard', activeTab);
    }, [activeTab]);
    useEffect(() => {
        const tabParam = searchParams.get('tab') as ActiveTab | null;
        const openTab = tabParam || navState.current?.openTab;
        if (openTab && openTab !== 'dashboard') {
            setActiveTab(openTab);
            setTimeout(() => scrollToNav(), 300);
        }
    }, [searchParams, pathname]);
    const [detailView, setDetailView] = useState<DetailView>(() => navState.current?.openDetail ?? 'none');

    // Jeśli user jest już w cache (localStorage) — startujemy bez loading screen
    const [isAppLoading, setIsAppLoading] = useState(!user);

    useEffect(() => {
        const saved = sessionStorage.getItem('nav_scroll_/dashboard');
        if (!saved) return;
        const y = parseInt(saved, 10);
        sessionStorage.removeItem('nav_scroll_/dashboard');
        let r2 = 0;
        const r1 = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => window.scrollTo(0, y)); });
        return () => { cancelAnimationFrame(r1); cancelAnimationFrame(r2); };
    }, []);

    useEffect(() => {
        if (!user || !isAppLoading) return;
        const avatarUrl = userData?.profilowe || userData?.avatar;
        let shown = false;
        const showTimer = setTimeout(() => { shown = true; }, 250);
        const done = () => {
            clearTimeout(showTimer);
            if (shown) setTimeout(() => setIsAppLoading(false), 150);
            else setIsAppLoading(false);
        };
        if (avatarUrl) {
            const img = new Image();
            img.src = avatarUrl;
            img.onload = done;
            img.onerror = done;
        } else {
            done();
        }
        return () => clearTimeout(showTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally runs only on user change; isAppLoading in deps would cause loop
    }, [user]);

    const scrollToNav = () => {
        const tabNavEl = mobileNavRef.current;
        if (!tabNavEl) return;
        if (tabNavEl.offsetHeight > 0) {
            // Mobile: tab nav widoczny — scrollIntoView z scroll-margin-top
            tabNavEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // Desktop: tab nav ukryty (lg:hidden) — scrolluj do gridu treści
            const contentEl = contentAnchorRef.current;
            if (!contentEl) return;
            const navEl = document.querySelector('[data-fixed-nav]') as HTMLElement | null;
            const navH = navEl ? navEl.getBoundingClientRect().height : 73;
            const contentTop = contentEl.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: contentTop - navH - 20, behavior: 'smooth' });
        }
    };

    const handleTabChange = (tab: string) => {
        if (tab === activeTab) return;
        if (isNative) Haptics.impact({ style: ImpactStyle.Light });
        setActiveTab(tab as ActiveTab);
        if (tab === 'dashboard') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            requestAnimationFrame(() => scrollToNav());
        }
    };

    useSwipeBack(activeTab === 'settings' && detailView === 'none', () => handleTabChange('dashboard'));

    const handleOpenDetail = (view: DetailView) => {
        if (view === 'none') return handleBackToDashboard();
        if (isNative) Haptics.impact({ style: ImpactStyle.Light });
        setDetailView(view);
        requestAnimationFrame(() => scrollToNav());
    };

    const handleBackToDashboard = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setDetailView('none');
    };

    const [accountType, _setAccountType] = useState<'private' | 'business'>(userData?.accountType || 'private');
    const currentUid = userData?.uid;

    const [newPostContent, setNewPostContent] = useState("");

    const { data: postsData, refetch: refetchPosts } = useQuery({
        queryKey: ['my-posts'],
        queryFn: async () => {
            const res = await apiClient.get('/users/me/posts');
            if (!res.ok) return { posts: [] };
            return res.json() as Promise<{ posts: { id: number; content: string; image?: string; video?: string; date: string }[] }>;
        },
        enabled: isLoggedIn,
        staleTime: 30_000,
    });
    const posts = postsData?.posts ?? [];

    const uploadVideoForPost = (file: File): Promise<string | null> =>
        new Promise((resolve) => {
            const token = tokenUtils.get();
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mylokalni.pl/api';
            const xhr = new XMLHttpRequest();
            xhr.open('POST', `${apiUrl}/upload/video`);
            if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.withCredentials = true;
            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try { const p = JSON.parse(xhr.responseText); resolve(p?.url ?? null); } catch { resolve(null); }
                } else { resolve(null); }
            };
            xhr.onerror = () => resolve(null);
            const fd = new FormData();
            fd.append('file', file);
            xhr.send(fd);
        });

    const handlePublishPost = async (media?: PostMedia) => {
        if (!newPostContent.trim() && !media) return;
        const content = newPostContent;
        try {
            let imageUrl: string | undefined;
            let videoUrl: string | undefined;
            if (media?.type === 'image') {
                const fd = new FormData();
                fd.append('file', dataUrlToFile(media.dataUrl, 'post.jpg'));
                fd.append('context', 'service');
                const uploadRes = await apiClient.postFormData('/upload/image', fd);
                if (uploadRes.ok) {
                    const { url } = await uploadRes.json() as { url: string };
                    imageUrl = url;
                } else {
                    const errBody = await uploadRes.json().catch(() => ({})) as { message?: string };
                    addToast?.(`Błąd uploadu zdjęcia: ${uploadRes.status} ${errBody?.message ?? ''}`, "error");
                    return;
                }
            } else if (media?.type === 'video') {
                addToast?.('Przesyłanie wideo...', 'info');
                videoUrl = await uploadVideoForPost(media.file) ?? undefined;
                if (!videoUrl) {
                    addToast?.('Błąd uploadu wideo. Spróbuj ponownie.', 'error');
                    return;
                }
            }
            const res = await apiClient.post('/users/me/posts', {
                content,
                ...(imageUrl ? { imageUrl } : {}),
                ...(videoUrl ? { videoUrl } : {}),
            });
            if (!res.ok) throw new Error('post failed');
            setNewPostContent('');
            await refetchPosts();
            queryClient.invalidateQueries({ queryKey: ['user-feed', currentUid] });
            addToast?.('Post opublikowany!', 'success');
        } catch (err: unknown) {
            addToast?.((err as Error)?.message || 'Błąd publikacji posta', 'error');
        }
    };

    const handleUpdatePost = async (id: number, content: string, image?: string) => {
        if (!content.trim() && !image) return;
        try {
            let imageUrl: string | undefined;
            if (image) {
                const fd = new FormData();
                fd.append('file', dataUrlToFile(image, 'post.jpg'));
                fd.append('context', 'service');
                const uploadRes = await apiClient.postFormData('/upload/image', fd);
                if (uploadRes.ok) {
                    const { url } = await uploadRes.json() as { url: string };
                    imageUrl = url;
                }
            }
            const res = await apiClient.patch(`/users/me/posts/${id}`, { content, ...(imageUrl ? { imageUrl } : {}) });
            if (!res.ok) throw new Error('update failed');
            await refetchPosts();
            addToast?.("Zaktualizowano", "success");
        } catch {
            addToast?.("Błąd aktualizacji", "error");
        }
    };

    const handleDeletePost = async (id: number) => {
        try {
            await apiClient.delete(`/users/me/posts/${id}`);
            await refetchPosts();
            addToast?.("Usunięto", "success");
        } catch {
            addToast?.("Błąd usuwania", "error");
        }
    };

    const [copiedInvite, setCopiedInvite] = useState(false);

    const buildInviteUrl = () => {
        const code = userData?.linkPolecajacy;
        if (!code) return null;
        const origin = window.location.origin.replace(/^(capacitor|https?):\/\/localhost(:\d+)?/, 'https://mylokalni.pl');
        return `${origin}/r/${code}`;
    };

    const handleShareInvite = async () => {
        const url = buildInviteUrl();
        if (!url) return;
        if (isNative) {
            Haptics.impact({ style: ImpactStyle.Light });
            try { await Share.share({ title: 'Dołącz do MyLokalni.pl', text: 'Zarejestruj się przez mój link!', url }); } catch { /* anulowane */ }
            return;
        }
        try { await navigator.clipboard.writeText(url); } catch {
            const ta = document.createElement('textarea');
            ta.value = url; ta.style.cssText = 'position:fixed;left:-9999px';
            document.body.appendChild(ta); ta.focus(); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta);
        }
        setCopiedInvite(true);
        setTimeout(() => setCopiedInvite(false), 2000);
        addToast?.('Link skopiowany!', 'success');
    };

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
    useEffect(() => {
        if (activeTab === 'settings' && userData && !hasPasswordMethod) {
            setIsChangingPassword(true);
        }
    }, [activeTab, userData, hasPasswordMethod]);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [imgVersion, setImgVersion] = useState<number | null>(null);
    const [isImgLoading, setIsImgLoading] = useState(false);
    const imgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [prevAvatar, setPrevAvatar] = useState<string | null>(userData?.avatar || null);
    const [avatarFailed, setAvatarFailed] = useState(false);

    useEffect(() => {
        if (userData?.avatar && userData.avatar !== prevAvatar) {
            setAvatarFailed(false);
            if (!userData.avatar.startsWith('data:')) setIsImgLoading(true);
            else setPrevAvatar(userData.avatar);
        }
    }, [userData?.avatar, prevAvatar]);

    useEffect(() => { setDetailView('none'); }, [activeTab]);

    const [imageToCrop, setImageToCrop] = useState<string | null>(null);
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);
    const [selectedCert, setSelectedCert] = useState<CertEntry | null>(null);
    const [showAvatarSheet, setShowAvatarSheet] = useState(false);
    const { sheetDragProps: avatarSheetDragProps, startDrag: startAvatarDrag, backdropOpacity: avatarBackdropOpacity, triggerClose: avatarTriggerClose, handleClose: avatarHandleClose } = useBottomSheet(() => setShowAvatarSheet(false), showAvatarSheet);

    useEffect(() => {
        if (showAvatarSheet) lockScroll();
        else unlockScroll();
        return () => unlockScroll();
    }, [showAvatarSheet]);

    useEffect(() => {
        if (!showAvatarSheet) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); avatarTriggerClose(); } };
        window.addEventListener('keydown', onKey, true);
        return () => window.removeEventListener('keydown', onKey, true);
    }, [showAvatarSheet, avatarTriggerClose]);

    const [dashBgUrl, setDashBgUrl] = useState<string | null>(userData?.zdjecieTla ?? null);
    const [dashBgUploading, setDashBgUploading] = useState(false);
    const dashBgInputRef = useRef<HTMLInputElement>(null);
    const avatarGalleryInputRef = useRef<HTMLInputElement>(null);
    const avatarCameraInputRef = useRef<HTMLInputElement>(null);

    const zdjecieTla = userData?.zdjecieTla ?? null;
    useEffect(() => {
        setDashBgUrl(zdjecieTla);
    }, [zdjecieTla]);

    useEffect(() => {
        const spacer = sidebarSpacerRef.current;
        const sidebar = sidebarRef.current;
        if (!spacer || !sidebar) return;

        let isFixed = false;

        const update = (isResize = false) => {
            const rect = spacer.getBoundingClientRect();
            const navH = parseFloat(
                getComputedStyle(document.documentElement).getPropertyValue('--total-nav-h')
            ) || 73;
            const shouldFix = rect.top <= navH + 20;

            if (shouldFix && !isFixed) {
                isFixed = true;
                sidebar.style.position = 'fixed';
                sidebar.style.top = `calc(var(--total-nav-h, 73px) + 20px)`;
                sidebar.style.width = `${spacer.offsetWidth}px`;
                sidebar.style.left = `${rect.left}px`;
            } else if (!shouldFix && isFixed) {
                isFixed = false;
                sidebar.style.position = '';
                sidebar.style.top = '';
                sidebar.style.width = '';
                sidebar.style.left = '';
            } else if (isFixed && isResize) {
                sidebar.style.width = `${spacer.offsetWidth}px`;
                sidebar.style.left = `${spacer.getBoundingClientRect().left}px`;
            }
        };

        update();
        const onScroll = () => update(false);
        const onResize = () => update(true);
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onResize);
            if (isFixed) {
                sidebar.style.position = '';
                sidebar.style.top = '';
                sidebar.style.width = '';
                sidebar.style.left = '';
            }
        };
    }, []);

    const handleCopyLink = () => {
        if (currentUid) {
            const origin = window.location.origin.replace(/^(capacitor|https?):\/\/localhost(:\d+)?/, 'https://mylokalni.pl');
            navigator.clipboard.writeText(`${origin}/profile/${currentUid}`);
            if (addToast) addToast("Skopiowano link!", "success");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => { setImageToCrop(reader.result as string); };
        }
    };

    const handleAvatarSourceSelect = (source: CameraSource) => {
        setShowAvatarSheet(false);
        if (source === CameraSource.Camera) {
            avatarCameraInputRef.current?.click();
        } else {
            avatarGalleryInputRef.current?.click();
        }
    };

    const handleAvatarClick = () => {
        if (isNative) {
            setShowAvatarSheet(true);
        }
    };

    const handleSaveCroppedImage = async (croppedAreaPixels: PixelCrop) => {
        if (!imageToCrop || !croppedAreaPixels) return;
        setIsProcessing(true);
        try {
            const croppedImageBase64 = await getCroppedImg(imageToCrop, croppedAreaPixels);
            // Upload → CDN URL (nie ustawiaj base64 optimistycznie — za duże dla localStorage)
            const updatedUser = await authService.updateAvatar(croppedImageBase64);
            if (updatedUser?.avatar) onAvatarChange(updatedUser.avatar);
            setImgVersion(Date.now());
            await queryClient.invalidateQueries({queryKey: ['my-profile']});
            await queryClient.invalidateQueries({queryKey: ['public-profile', currentUid]});
            if (addToast) addToast("Zdjęcie zmienione", "success");
            setImageToCrop(null);
        } catch {
            if (addToast) addToast("Błąd zmiany zdjęcia", "error");
        } finally { setIsProcessing(false); }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) return addToast?.("Hasła nie pasują", "error");
        setIsPasswordLoading(true);
        try {
            if (hasPasswordMethod) await authService.changePassword(passwordData.oldPassword, passwordData.newPassword);
            else await authService.setFirstPassword(passwordData.newPassword);
            setIsChangingPassword(false);
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
            if (addToast) addToast("Hasło zmienione", "success");
        } catch (error: unknown) {
            addToast?.((error as Error).message, "error");
        } finally { setIsPasswordLoading(false); }
    };

    const handlePhoneChange = async (newPhone: string) => {
        try {
            await authService.changePhoneNumber(newPhone);
            await queryClient.invalidateQueries({queryKey: ['public-profile', currentUid]});
            if (addToast) addToast("Numer zmieniony", "success");
        } catch (error: unknown) {
            addToast?.((error as Error).message, "error");
            throw error;
        }
    };

    const { data: certificates = [], isLoading: isCertsLoading } = useQuery({
        queryKey: ['my-certificates'],
        queryFn: () => authService.getCertificates(),
        enabled: isLoggedIn,
        staleTime: 60_000,
    });

    const handleAddCertificate = async (payload: Omit<CertEntry, 'id' | 'status'>): Promise<CertEntry> => {
        const saved = await authService.addCertificate(payload);
        queryClient.invalidateQueries({ queryKey: ['my-certificates'] });
        return saved;
    };

    const handleUpdateCertificateName = async (id: string, name: string): Promise<void> => {
        await authService.updateCertificateName(id, name);
        queryClient.invalidateQueries({ queryKey: ['my-certificates'] });
    };

    const handleDeleteCertificate = async (id: string): Promise<void> => {
        await authService.deleteCertificate(id);
        queryClient.invalidateQueries({ queryKey: ['my-certificates'] });
    };

    const uploadDashBg = async (dataUrlOrFile: string | File) => {
        setDashBgUploading(true);
        try {
            const file = typeof dataUrlOrFile === 'string'
                ? dataUrlToFile(dataUrlOrFile, 'background.jpg')
                : dataUrlOrFile;
            const fd = new FormData();
            fd.append('file', file);
            fd.append('context', 'service');
            const uploadRes = await apiClient.postFormData('/upload/image', fd);
            if (!uploadRes.ok) throw new Error('upload failed');
            const { url } = await uploadRes.json() as { url: string };
            const saveRes = await apiClient.patch('/users/me/background', { imageUrl: url });
            if (!saveRes.ok) throw new Error('save failed');
            setDashBgUrl(url);
            queryClient.invalidateQueries({ queryKey: ['public-profile', currentUid] });
            queryClient.invalidateQueries({ queryKey: ['my-profile'] });
            addToast?.('Tło zaktualizowane', 'success');
        } catch {
            addToast?.('Błąd przesyłania tła', 'error');
        } finally {
            setDashBgUploading(false);
        }
    };

    const handleDashBgClick = () => {
        if (dashBgUploading) return;
        dashBgInputRef.current?.click();
    };

    const handleDashBgChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        await uploadDashBg(file);
    };

    const handleDashBgRemove = async () => {
        setDashBgUploading(true);
        try {
            const res = await apiClient.patch('/users/me/background', { imageUrl: null });
            if (!res.ok) throw new Error('remove failed');
            setDashBgUrl(null);
            queryClient.invalidateQueries({ queryKey: ['public-profile', currentUid] });
            queryClient.invalidateQueries({ queryKey: ['my-profile'] });
            addToast?.('Tło usunięte', 'success');
        } catch {
            addToast?.('Błąd usuwania tła', 'error');
        } finally {
            setDashBgUploading(false);
        }
    };

    const handleRequestAccountDeletion = async () => {
        setIsDeletingAccount(true);
        try {
            await authService.requestAccountDeletion();
            if (addToast) addToast("Sprawdź e-mail, aby potwierdzić usunięcie", "success");
        } catch (error: unknown) {
            if (addToast) addToast((error as Error).message || "Błąd usuwania", "error");
        } finally {
            setIsDeletingAccount(false);
        }
    };

    const listVariants: Variants = {
        hidden: { opacity: 0, y: 6 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 0 }
    };

    if (!isLoggedIn || !user) return null;

    const avatarSource = userData?.profilowe || userData?.avatar || null;
    const currentAvatarUrl = (avatarFailed || !avatarSource)
        ? null
        : avatarSource.startsWith('data:')
            ? avatarSource
            : imgVersion
                ? `${avatarSource}${avatarSource.includes('?') ? '&' : '?'}v=${imgVersion}`
                : avatarSource;

    const handlePlusUpgrade = () => {
        setShowPlusModal(false);
        onUpgrade?.();
    };

    return (
        <>
            <LoadingScreen isVisible={isAppLoading} message="Przygotowujemy Twój pulpit..." />
            <PremiumUpgradeModal
                isOpen={showPlusModal}
                onClose={() => setShowPlusModal(false)}
                onSuccess={handlePlusUpgrade}
            />

            <motion.div
                initial={isAppLoading ? { opacity: 0 } : false}
                animate={{ opacity: isAppLoading ? 0 : 1 }}
                transition={{ duration: 0.25 }}
                style={{
                    scrollbarGutter: 'stable',
                    // Usuwamy stąd dynamiczne paddingTop, bo Tailwind zrobi to lepiej klasami
                }}
                className="max-w-7xl mx-auto px-4 md:px-6 md:pt-10 pt-3 pb-32 min-h-screen font-sans antialiased text-left"
            >
                {/* --- NAGŁÓWEK --- */}
                <div ref={profileCardRef} className="bg-white px-5 pb-5 pt-[5.25rem] md:px-8 md:pb-8 md:pt-[6.5rem] rounded-[2.5rem] shadow-sm flex flex-col md:flex-row md:items-start gap-5 md:gap-8 border border-gray-50 relative mb-2 md:mb-12 z-[30]">
                    {/* Cover banner */}
                    <div className="absolute top-0 left-0 right-0 h-16 md:h-20 rounded-t-[2.5rem] overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-indigo-100 flex items-center justify-end px-4">
                            {!isPremium && (
                                <button onClick={() => setShowPlusModal(true)} className="flex items-center gap-1.5 text-[10px] font-black text-indigo-400 hover:text-indigo-600 uppercase tracking-widest transition-colors opacity-70 hover:opacity-100">
                                    <Sparkles size={11} /> Dodaj zdjęcie tła
                                </button>
                            )}
                        </div>
                        {isPremium && dashBgUrl && (
                            <img src={dashBgUrl} className="absolute inset-0 w-full h-full object-cover" alt="" />
                        )}
                        {isPremium && (
                            <div className="absolute bottom-2 right-3 flex gap-2 z-10">
                                <button
                                    onClick={handleDashBgClick}
                                    disabled={dashBgUploading}
                                    className="flex items-center gap-1.5 bg-black/40 backdrop-blur-sm text-white text-[11px] font-bold px-3 py-1.5 rounded-xl hover:bg-black/60 transition-colors active:scale-95 disabled:opacity-60"
                                >
                                    {dashBgUploading
                                        ? <><Loader2 size={12} className="animate-spin" /> Przesyłanie...</>
                                        : <><Camera size={12} /> Zmień tło</>
                                    }
                                </button>
                                {dashBgUrl && !dashBgUploading && (
                                    <button
                                        onClick={handleDashBgRemove}
                                        aria-label="Usuń zdjęcie tła"
                                        className="bg-black/40 backdrop-blur-sm text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-black/60 transition-colors active:scale-95"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </div>
                        )}
                        <input ref={dashBgInputRef} type="file" accept="image/*" className="hidden" onChange={handleDashBgChange} />
                    </div>

                    <div className="absolute top-[4.5rem] right-4 lg:hidden z-40 flex flex-col items-center gap-2">
                        <button onClick={() => handleTabChange('settings')} className="relative p-2.5 bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100 active:scale-95 transition-all shadow-sm border border-gray-100">
                            <Settings size={20} />
                            {settingsBadge && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                                </span>
                            )}
                        </button>
                        {currentUid && (
                            <button
                                onClick={async () => {
                                    if (Capacitor.isNativePlatform()) { sessionStorage.setItem('nav_scroll_' + window.location.pathname, String(window.scrollY)); await NativeNav.push().catch(() => {}); }
                                    router.push(`/profile/${currentUid}`);
                                }}
                                className="p-2.5 bg-gray-50 text-gray-500 rounded-full hover:bg-gray-100 active:scale-95 transition-all shadow-sm border border-gray-100 flex items-center justify-center"
                            >
                                <Eye size={20} />
                            </button>
                        )}
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-start gap-5 md:gap-0 w-full md:w-auto">
                        <div className="relative group shrink-0">
                            {!hasPhoto && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 z-30">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white" />
                                </span>
                            )}
                            <div className="w-20 h-20 md:w-32 md:h-32 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-md relative">
                                {isImgLoading && <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-full" />}
                                {currentAvatarUrl ? (
                                    <img
                                        key={currentAvatarUrl}
                                        src={currentAvatarUrl}
                                        fetchPriority="high"
                                        onLoadStart={() => {
                                            imgTimerRef.current = setTimeout(() => setIsImgLoading(true), 250);
                                        }}
                                        onLoad={() => {
                                            if (imgTimerRef.current) clearTimeout(imgTimerRef.current);
                                            setIsImgLoading(false);
                                            setPrevAvatar(avatarSource);
                                        }}
                                        onError={() => { setIsImgLoading(false); setAvatarFailed(true); }}
                                        className="w-full h-full object-cover relative z-10 pointer-events-none"
                                        alt=""
                                    />
                                ) : (
                                    <img src="/default-profile-picture.webp" className="w-full h-full object-cover" alt="" />
                                )}
                            </div>
                            {isNative ? (
                                <button
                                    onClick={handleAvatarClick}
                                    className="absolute bottom-1 right-1 p-2 md:p-2.5 bg-[#6366F1] text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform z-20"
                                >
                                    <Camera size={14} className="md:w-[18px] md:h-[18px]"/>
                                </button>
                            ) : (
                                <label className="absolute bottom-1 right-1 p-2 md:p-2.5 bg-[#6366F1] text-white rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform z-20">
                                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden"/>
                                    <Camera size={14} className="md:w-[18px] md:h-[18px]"/>
                                </label>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 text-left md:hidden">
                            <h2 className="text-xl font-bold text-gray-900 leading-tight flex items-center gap-2 mb-1">
                                <span className="truncate">{userData?.imie ? `${userData.imie} ${userData.nazwisko || ''}` : userData?.name}</span>
                                {accountType === 'business' && <ShieldCheck size={20} className="text-blue-600 fill-blue-50 shrink-0" />}
                            </h2>
                            <p className="text-gray-500 text-xs font-medium truncate mb-2">{userData?.email}</p>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 w-full text-center md:text-left">
                        <div className="hidden md:block">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight flex items-center justify-center md:justify-start gap-2 mb-2">
                                {userData?.imie ? `${userData.imie} ${userData.nazwisko || ''}` : userData?.name}
                                {accountType === 'business' && <ShieldCheck size={24} className="text-blue-600 fill-blue-50" />}
                            </h2>
                            <p className="text-gray-500 text-sm md:text-base font-medium mb-5">{userData?.email}</p>
                        </div>

                        <div className="hidden md:flex flex-wrap gap-3 justify-center md:justify-start">
                            <button
                                onClick={async () => {
                                    if (!currentUid) return;
                                    if (Capacitor.isNativePlatform()) { sessionStorage.setItem('nav_scroll_' + window.location.pathname, String(window.scrollY)); await NativeNav.push().catch(() => {}); }
                                    router.push(`/profile/${currentUid}`);
                                }}
                                className="text-xs font-bold px-4 py-2.5 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-all flex items-center gap-2 shadow-sm"
                            >
                                <Eye size={14}/> Podgląd publiczny
                            </button>
                            <button onClick={handleCopyLink} className="text-xs font-bold px-4 py-2.5 rounded-xl text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-all flex items-center gap-2 shadow-sm">
                                <Copy size={14}/> Skopiuj link
                            </button>
                        </div>
                    </div>

                </div>

                {/* Marker dla scrolla desktopowego — tuż za kartą profilu */}
                <div ref={desktopScrollAnchorRef} className="hidden lg:block" />

                {/* --- TAB NAV --- */}
                <div ref={mobileNavRef} className="lg:hidden mb-6" style={{ scrollMarginTop: 'calc(var(--nav-content-h, 73px) + env(safe-area-inset-top, 0px) + 8px)' }}>
                    <div className="bg-white/95 backdrop-blur-sm shadow-sm border border-gray-100 rounded-3xl p-1.5">
                        <div className="flex w-full overflow-x-auto no-scrollbar gap-1.5 items-center">
                            {(['dashboard', 'orders', 'services', 'posts'] as ActiveTab[]).map(tab => {
                                const labels: Record<ActiveTab, string> = {
                                    dashboard: 'Pulpit',
                                    orders: 'Rezerwacje',
                                    services: 'Usługi',
                                    posts: 'Posty',
                                    settings: 'Ustawienia'
                                };

                                return (
                                    <MobileTabBtn
                                        key={tab}
                                        active={activeTab === tab}
                                        onClick={() => handleTabChange(tab)}
                                        label={labels[tab]}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div ref={contentAnchorRef} className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative mt-6">
                    <div ref={sidebarSpacerRef} className="hidden lg:block lg:col-span-3">
                    <div
                        ref={sidebarRef}
                        className="flex flex-col gap-6 z-[20]"
                    >
                        <nav className="hidden lg:flex bg-white p-3 rounded-[2rem] shadow-sm border border-gray-100 flex-col gap-1 overflow-hidden">
                            <NavBtn active={activeTab === 'dashboard'} onClick={() => handleTabChange('dashboard')} icon={<Layout size={20}/>} label="Pulpit" />
                            <NavBtn active={activeTab === 'orders'} onClick={() => handleTabChange('orders')} icon={<ClipboardList size={20}/>} label="Rezerwacje" />
                            <NavBtn active={activeTab === 'services'} onClick={() => handleTabChange('services')} icon={<Tag size={20}/>} label="Moje Usługi" />
                            <NavBtn active={activeTab === 'posts'} onClick={() => handleTabChange('posts')} icon={<Megaphone size={20}/>} label="Posty" />
                            <div className="h-px bg-gray-100 my-2 hidden lg:block" />
                            <NavBtn active={activeTab === 'settings'} onClick={() => handleTabChange('settings')} icon={<Settings size={20}/>} label="Ustawienia" badge={settingsBadge} />
                            <div className="h-px bg-gray-100 my-1" />
                            {!isPremium ? (
                                <button onClick={() => setShowPlusModal(true)} className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-black bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-300 hover:to-amber-400 active:scale-95 transition-all shadow-md shadow-amber-100">
                                    <Sparkles size={16} className="shrink-0" /> Kup MyLokalni Plus
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 px-5 py-2 text-xs font-black text-amber-600">
                                    <Sparkles size={13} /> MyLokalni Plus aktywny
                                </div>
                            )}
                            <button onClick={onLogout} className="flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"><LogOut size={20}/> <span>Wyloguj</span></button>
                        </nav>

                        {userData?.linkPolecajacy && (() => {
                            const inviteUrl = buildInviteUrl();
                            return (
                            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-5">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                                            <Gift size={16} className="text-indigo-500" />
                                        </div>
                                        <h4 className="text-sm font-black text-gray-900">Zaproś znajomych</h4>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mb-3 leading-relaxed">Udostępnij link znajomym i pomóż im odkryć Lokalnych.</p>
                                <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 mb-3">
                                    <p className="text-xs text-indigo-500 font-semibold truncate">{inviteUrl}</p>
                                </div>
                                <button
                                    onClick={handleShareInvite}
                                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                                        copiedInvite
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                                    }`}
                                >
                                    {copiedInvite ? <Check size={14} /> : isNative ? <Gift size={14} /> : <Copy size={14} />}
                                    {copiedInvite ? 'Skopiowano!' : isNative ? 'Udostępnij link' : 'Kopiuj link'}
                                </button>
                            </div>
                            );
                        })()}
                    </div>
                    </div>

                    <div className="lg:col-span-9 lg:self-start w-full relative flex flex-col overflow-hidden">
                        <div className="relative w-full min-h-[85vh]">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab + detailView}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    variants={listVariants}
                                    transition={{ duration: 0.2 }}
                                    className="w-full flex-grow flex flex-col"
                                >
                                        <div className="w-full h-full">
                                            {activeTab === 'dashboard' && (
                                                <>
                                                    {detailView === 'none' && <DashboardHome servicesCount={myServices.length} onNavigate={handleTabChange} onOpenDetail={handleOpenDetail} user={user} addToast={addToast} />}
                                                    {detailView === 'earnings' && <EarningsDetail onBack={handleBackToDashboard} />}
                                                    {detailView === 'reviews' && <ReviewsDetail onBack={handleBackToDashboard} />}
                                                    {detailView === 'analytics' && <AnalyticsDetail onBack={handleBackToDashboard} />}
                                                </>
                                            )}
                                            {activeTab === 'services' && <ServicesSection myServices={myServices} onAddService={onAddService} onEditService={onEditService} setServiceToDelete={onDeleteService} addToast={addToast} />}
                                            {activeTab === 'orders' && <ReservationsSection isLoggedIn={isLoggedIn} initialTab={navState.current?.bookingTab} initialBookingId={searchParams.get('bookingId') ? Number(searchParams.get('bookingId')) : undefined} onBookingAction={onBookingAction} onReschedule={onReschedule} addToast={addToast} onOpenChat={onOpenChat} />}
                                            {activeTab === 'posts' && (
                                                <PremiumGate isPremium={isPremium} onUpgrade={() => setShowPlusModal(true)} featureName="Aktualności (Posty)" mode="overlay">
                                                    <PostsSection newPostContent={newPostContent} setNewPostContent={setNewPostContent} posts={posts} onPublish={handlePublishPost} onDeletePost={handleDeletePost} onUpdatePost={handleUpdatePost} isLoggedIn={isLoggedIn} userData={userData} />
                                                </PremiumGate>
                                            )}
                                            {activeTab === 'settings' && (
                                                <div className="pt-2">
                                                    <SettingsSection
                                                        isChangingPassword={isChangingPassword}
                                                        setIsChangingPassword={setIsChangingPassword}
                                                        passwordData={passwordData}
                                                        setPasswordData={setPasswordData}
                                                        handlePasswordChange={handlePasswordChange}
                                                        isPasswordLoading={isPasswordLoading}
                                                        hasPasswordMethod={hasPasswordMethod}
                                                        currentPhone={currentPhone}
                                                        onPhoneChange={handlePhoneChange}
                                                        onRequestDeletion={handleRequestAccountDeletion}
                                                        isDeletingAccount={isDeletingAccount}
                                                        isPremium={isPremium}
                                                        onUpgradeToPremium={() => setShowPlusModal(true)}
                                                        hasBio={hasBio}
                                                        hasSocial={hasSocial}
                                                        hasPhone={hasPhone}
                                                        userData={userData}
                                                        addToast={addToast}
                                                        certificates={certificates}
                                                        isCertsLoading={isCertsLoading}
                                                        onCertAdd={handleAddCertificate}
                                                        onCertUpdateName={handleUpdateCertificateName}
                                                        onCertDelete={handleDeleteCertificate}
                                                        onOpenSupport={onOpenSupport}
                                                        onOpenTicket={onOpenTicket}
                                                    />
                                                    <button onClick={onLogout} className="lg:hidden w-full mt-6 p-4 bg-red-50 text-red-500 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
                                                        <LogOut size={20}/> Wyloguj się
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </motion.div>

            <AvatarEditModal image={imageToCrop} onClose={() => setImageToCrop(null)} onSave={handleSaveCroppedImage} isProcessing={isProcessing} />

            {/* Hidden file inputs for avatar selection on native */}
            <input ref={avatarGalleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <input ref={avatarCameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />

            {/* Action sheet — wybór źródła zdjęcia (tylko iOS) */}
            <ClientPortal>
                {showAvatarSheet ? (
                    <div className="fixed inset-0 z-[400]">
                        {/* Backdrop — fades in real time with drag gesture */}
                        <motion.div
                            style={{ opacity: avatarBackdropOpacity }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={avatarHandleClose}
                        />
                        {/* Sheet */}
                        <motion.div
                            {...avatarSheetDragProps}
                            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                                <BottomSheetHandle onPointerDown={startAvatarDrag} compact />
                                <div className="px-4" style={{ paddingBottom: 'calc(var(--native-cta-h, var(--bottom-nav-total-h, env(safe-area-inset-bottom))) + 1.5rem)' }}>
                                    <p
                                        className="text-center text-[11px] font-black uppercase tracking-widest text-gray-400 mb-4 cursor-grab active:cursor-grabbing"
                                        style={{ touchAction: 'none' }}
                                        onPointerDown={startAvatarDrag}
                                    >Zdjęcie profilowe</p>
                                    <button
                                        onClick={() => handleAvatarSourceSelect(CameraSource.Camera)}
                                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                    >
                                        <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center">
                                            <Camera size={22} className="text-[#6366F1]" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-900">Zrób zdjęcie</p>
                                            <p className="text-xs text-gray-400">Użyj aparatu</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleAvatarSourceSelect(CameraSource.Photos)}
                                        className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                    >
                                        <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#6366F1]"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-900">Wybierz z galerii</p>
                                            <p className="text-xs text-gray-400">Zdjęcia i albumy</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={avatarHandleClose}
                                        className="w-full mt-2 py-4 rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm active:bg-gray-200 transition-colors"
                                    >
                                        Anuluj
                                    </button>
                                </div>
                        </motion.div>
                    </div>
                ) : null}
            </ClientPortal>

            <CertificatePreviewModal cert={selectedCert} onClose={() => setSelectedCert(null)} />
        </>
    );

    function NavBtn({ active, onClick, icon, label, badge }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: boolean }) {
        return (
            <button onClick={onClick} className={`relative flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${active ? 'bg-indigo-50 text-[#6366F1]' : 'text-gray-400 hover:bg-gray-50'}`}>
                {icon} <span>{label}</span>
                {badge && (
                    <span className="absolute top-3.5 right-3 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                    </span>
                )}
            </button>
        );
    }

    function MobileTabBtn({ active, onClick, label, badge }: { active: boolean, onClick: () => void, label: string, badge?: boolean }) {
        return (
            <button onClick={onClick} className={`relative flex-1 min-w-fit px-2 py-3.5 rounded-full text-[11px] font-bold transition-[background-color,color,box-shadow] active:scale-95 ${active ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}>
                {label}
                {badge && (
                    <span className="absolute top-1 right-1.5 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                )}
            </button>
        );
    }
};