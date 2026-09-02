'use client';
import { useRef, useEffect, useState } from 'react';
import { ClientPortal } from '../ui/ClientPortal';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlatform } from '../../hooks/usePlatform';
import { Bell, User, MessageCircle, Info, Calendar } from 'lucide-react';
import { UserAvatar } from '../ui/UserAvatar';
import { UserProfile, NotificationItem } from '../../types';

interface NavbarProps {
    userProfile: UserProfile | null;
    isLoggedIn: boolean;
    unreadCount: number;
    notifications: NotificationItem[];
    showNotifications: boolean;
    onToggleNotifications: () => void;
    onCloseNotifications: () => void;
    onMarkAllRead: () => void;
    onNotificationClick: (id: number, chatId?: string, type?: string, bookingId?: string | null, bookingTab?: string | null, servicePublicId?: string | null) => void | Promise<void>;
    onProfileClick: () => void;
    onLogoClick: () => void;
}

export const Navbar = ({
    userProfile: _userProfile,
    isLoggedIn,
    unreadCount,
    notifications,
    showNotifications,
    onToggleNotifications,
    onCloseNotifications,
    onMarkAllRead,
    onNotificationClick,
    onProfileClick,
    onLogoClick
}: NavbarProps) => {
    const { isNative } = usePlatform();
    const notificationWrapperRef = useRef<HTMLDivElement>(null);
    const notificationPanelRef = useRef<HTMLDivElement>(null);
    const bellButtonRef = useRef<HTMLButtonElement>(null);
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [panelPos, setPanelPos] = useState<{ top: number; right: number } | null>(null);

    useEffect(() => {
        const updatePos = () => {
            if (!showNotifications || !bellButtonRef.current) return;
            const r = bellButtonRef.current.getBoundingClientRect();
            const isMobile = window.innerWidth < 768;
            if (isMobile) {
                setPanelPos({ top: r.bottom + 8, right: 16 });
            } else {
                const panelW = 320;
                const rightFromEdge = window.innerWidth - r.right;
                // nie wychodź poza lewy brzeg
                const clampedRight = Math.min(rightFromEdge, window.innerWidth - panelW - 16);
                setPanelPos({ top: r.bottom + 8, right: Math.max(clampedRight, 16) });
            }
        };
        updatePos();
        window.addEventListener('resize', updatePos);
        return () => window.removeEventListener('resize', updatePos);
    }, [showNotifications]);

    const getNotificationTime = (timeStr: string) => {
        try {
            const now = new Date();
            const date = new Date(timeStr);
            if (isNaN(date.getTime())) return timeStr;

            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const itemDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const diffInDays = Math.round((today.getTime() - itemDate.getTime()) / (1000 * 3600 * 24));

            const time = date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

            if (diffInDays === 0) return time;
            if (diffInDays === 1) return 'Wczoraj';
            if (diffInDays === 2) return 'Przedwczoraj';
            return date.toLocaleDateString('pl-PL');
        } catch {
            return timeStr;
        }
    };

    const getNotificationTypeInfo = (item: NotificationItem) => {
        const title = item.title.toLowerCase();
        if (item.chatId || title.includes('wiadomość')) {
            return { icon: <MessageCircle size={14} className="text-blue-500" /> };
        }
        if (title.includes('termin') || title.includes('rezerwacja')) {
            return { icon: <Calendar size={14} className="text-green-500" /> };
        }
        return { icon: <Info size={14} className="text-gray-400" /> };
    };

    useEffect(() => {
        // Zamykanie przy kliknięciu poza elementem
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const inWrapper = notificationWrapperRef.current?.contains(target);
            const inPanel = notificationPanelRef.current?.contains(target);
            if (!inWrapper && !inPanel) {
                onCloseNotifications();
            }
        };

        // Zamykanie przy scrollowaniu
        const handleScroll = () => {
            if (showNotifications) {
                onCloseNotifications();
            }
        };

        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, { passive: true }); // passive dla lepszej wydajności
        } else {
            setExpandedIds(new Set());
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll);
        };
    }, [showNotifications, onCloseNotifications]);

    return (
        <nav className={`sticky top-0 z-50 bg-white px-6 ${isNative ? 'pt-0 pb-3' : 'py-4'}`}>
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div onClick={onLogoClick} className="text-2xl font-black text-gray-900 cursor-pointer">
            MyLokalni<span className="text-[#6366F1]">.</span>
          </div>
          <div className="flex items-center gap-4">
            
            <div className="relative" ref={notificationWrapperRef}>
              {isLoggedIn && (
              <motion.button
                ref={bellButtonRef}
                whileTap={{ scale: 0.95 }}
                onClick={onToggleNotifications}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 relative"
              >
                < Bell size={20} className="text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
              </motion.button>
              )}
              
              <ClientPortal>
                  <AnimatePresence>
                  {showNotifications && (
                      <motion.div
                        ref={notificationPanelRef}
                        layout
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[200000]"
                        style={panelPos
                            ? { top: panelPos.top, right: panelPos.right, width: window.innerWidth < 768 ? window.innerWidth - 32 : 320 }
                            : { top: 80, right: 16, width: 320 }
                        }
                      >
                          <div className="px-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center" style={{ height: '48px' }}>
                              <h3 className="font-bold text-gray-800 text-sm">Powiadomienia</h3>
                              <button
                                  onClick={onMarkAllRead}
                                  className={`text-[11px] font-bold text-[#6366F1] hover:text-indigo-700 transition-all ${notifications.some(n => !n.read) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                              >
                                  Wyczyść wszystkie
                              </button>
                          </div>

                          <div className={notifications.filter(n => !n.read).length === 0 ? 'h-[100px] overflow-hidden' : 'max-h-[300px] overflow-y-auto'}>
                                  <AnimatePresence initial={false}>
                                      {notifications.filter(n => !n.read).length === 0 ? (
                                          <motion.div
                                              key="empty"
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              transition={{ duration: 0.2, delay: 0.05 }}
                                              className="py-4 flex flex-col items-center gap-2 text-gray-400"
                                          >
                                              <Bell size={28} className="opacity-20" />
                                              <p className="text-sm font-medium">Brak nowych powiadomień</p>
                                          </motion.div>
                                      ) : (
                                          notifications.filter(n => !n.read).map(item => {
                                              const typeInfo = getNotificationTypeInfo(item);
                                              return (
                                                  <motion.div
                                                      key={item.id}
                                                      layout
                                                      initial={{ opacity: 0, x: 8 }}
                                                      animate={{ opacity: 1, x: 0 }}
                                                      exit={{ opacity: 0, x: -8, height: 0, paddingTop: 0, paddingBottom: 0 }}
                                                      transition={{ duration: 0.18, ease: 'easeOut' }}
                                                      style={{ overflow: 'hidden' }}
                                                      onClick={() => {
                                                          const isLong = item.text.length > 80;
                                                          if (isLong && !expandedIds.has(item.id)) {
                                                              setExpandedIds(prev => new Set(prev).add(item.id));
                                                          } else {
                                                              onNotificationClick(item.id, item.chatId, item.type, item.bookingId, item.bookingTab, item.servicePublicId);
                                                          }
                                                      }}
                                                      className="px-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-indigo-50/40 active:bg-indigo-50 transition-colors cursor-pointer"
                                                  >
                                                      <div className="flex items-start gap-3">
                                                          <div className="relative shrink-0 mt-0.5">
                                                              {item.senderName ? (
                                                                  <UserAvatar
                                                                      src={item.senderAvatar}
                                                                      name={item.senderName}
                                                                      size={36}
                                                                      className="rounded-xl border border-gray-100"
                                                                  />
                                                              ) : (
                                                                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                                                                      {typeInfo.icon}
                                                                  </div>
                                                              )}
                                                              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#6366F1] rounded-full border-2 border-white" />
                                                          </div>

                                                          <div className="flex-1 min-w-0">
                                                              <div className="flex justify-between items-start gap-1">
                                                                  <span className="text-[13px] font-bold text-gray-900 truncate">
                                                                      {item.senderName ?? item.title}
                                                                  </span>
                                                                  <span className="text-[10px] text-gray-400 font-semibold whitespace-nowrap shrink-0">
                                                                      {getNotificationTime(item.time)}
                                                                  </span>
                                                              </div>
                                                              <p
                                                                  className="text-[12px] text-gray-500 mt-0.5 leading-relaxed overflow-hidden transition-[max-height] duration-300 ease-in-out"
                                                                  style={{ maxHeight: expandedIds.has(item.id) ? '20rem' : '2.4375rem' }}
                                                              >
                                                                  {item.text}
                                                              </p>
                                                          </div>
                                                      </div>
                                                  </motion.div>
                                              );
                                          })
                                      )}
                                  </AnimatePresence>
                          </div>
                      </motion.div>
                  )}
                  </AnimatePresence>
              </ClientPortal>
            </div>
            
            <motion.button 
              whileTap={{ scale: 0.95 }}
              onClick={onProfileClick}
              className="flex items-center gap-2 bg-gray-100 text-gray-900 px-4 py-2 rounded-full hover:bg-gray-200 border border-gray-200"
            >
              <User size={18} />
              <span className="hidden sm:inline font-medium">{isLoggedIn ? 'Profil' : 'Zaloguj się'}</span>
            </motion.button>
          </div>
        </div>
      </nav>
    );
};