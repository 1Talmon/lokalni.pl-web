'use client';
import { motion, useTransform, useMotionValue, MotionValue } from 'framer-motion';
import { Home, MessageSquare, Plus, CalendarDays, Heart } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { usePlatform } from '../../hooks/usePlatform';

// Center of each tab's column as % of total nav width (grid-cols-5, col 3 = + button skipped)
const TAB_CENTERS = [10, 30, 70, 90];

// gray-400 → #6366F1 interpolation (t: 0 = gray, 1 = indigo)
function interpColor(t: number): string {
    const r = Math.round(156 - 57 * t);
    const g = Math.round(163 - 61 * t);
    const b = Math.round(175 + 66 * t);
    return `rgb(${r},${g},${b})`;
}

interface BottomNavProps {
    currentView: string;
    onChangeView: (view: string) => void;
    onAddClick: () => void;
    hasUnreadMessages: boolean;
    scrollProgress?: MotionValue<number>;
}

const SwipeIndicator = ({ scrollProgress }: { scrollProgress: MotionValue<number> }) => {
    const left = useTransform(scrollProgress, (p) => {
        const clamped = Math.max(0, Math.min(3, p));
        const idx = Math.min(2, Math.floor(clamped));
        const frac = clamped - idx;
        return `${TAB_CENTERS[idx] + (TAB_CENTERS[idx + 1] - TAB_CENTERS[idx]) * frac}%`;
    });
    return (
        <motion.div
            style={{ left, x: '-50%' }}
            className="absolute top-0 w-8 h-0.5 bg-[#6366F1] rounded-full pointer-events-none"
        />
    );
};

export const BottomNav = ({ currentView, onChangeView, onAddClick, hasUnreadMessages, scrollProgress }: BottomNavProps) => {
    const { isNative } = usePlatform();

    // Fallback keeps hooks call-count stable when scrollProgress is undefined (web)
    const fallback = useMotionValue(0);
    const p = scrollProgress ?? fallback;

    const c0 = useTransform(p, (v) => interpColor(Math.max(0, 1 - Math.abs(v - 0))));
    const c1 = useTransform(p, (v) => interpColor(Math.max(0, 1 - Math.abs(v - 1))));
    const c2 = useTransform(p, (v) => interpColor(Math.max(0, 1 - Math.abs(v - 2))));
    const c3 = useTransform(p, (v) => interpColor(Math.max(0, 1 - Math.abs(v - 3))));

    const tap = (fn: () => void, style: ImpactStyle = ImpactStyle.Light) => () => {
        if (isNative) Haptics.impact({ style });
        fn();
    };

    const baseClass = 'w-full min-h-[56px] lg:min-h-[48px] flex flex-col items-center justify-center gap-1 active:opacity-60';

    return (
        <nav className="relative w-full px-6 pt-3 pb-0 lg:px-6 lg:pt-2 lg:pb-0 lg:mx-auto lg:mb-6 lg:w-[95%] lg:max-w-lg lg:rounded-2xl lg:bg-white lg:shadow-2xl lg:border lg:border-gray-200">
            {scrollProgress && <SwipeIndicator scrollProgress={scrollProgress} />}
            <div className="grid grid-cols-5 items-center">
                <motion.button
                    data-tour="nav-home"
                    onClick={tap(() => onChangeView('home'))}
                    style={scrollProgress ? { color: c0 } : undefined}
                    className={`${baseClass} ${!scrollProgress ? (currentView === 'home' ? 'text-[#6366F1]' : 'text-gray-400') : ''}`}
                >
                    <Home size={22} />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Home</span>
                </motion.button>

                <motion.button
                    data-tour="nav-chat"
                    onClick={tap(() => onChangeView('chat'))}
                    style={scrollProgress ? { color: c1 } : undefined}
                    className={`${baseClass} relative ${!scrollProgress ? (currentView === 'chat' ? 'text-[#6366F1]' : 'text-gray-400') : ''}`}
                >
                    <MessageSquare size={22} />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Czat</span>
                    {hasUnreadMessages && <span className="absolute top-0 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />}
                </motion.button>

                <div className="flex items-center justify-center">
                    <motion.button
                        data-tour="nav-add"
                        whileTap={{ scale: 0.88 }}
                        onClick={tap(onAddClick, ImpactStyle.Medium)}
                        className="w-16 h-16 lg:w-14 lg:h-14 bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] rounded-full flex items-center justify-center -mt-12 lg:-mt-9 border-4 border-white shadow-xl shadow-indigo-200"
                    >
                        <Plus size={28} className="text-white" />
                    </motion.button>
                </div>

                <motion.button
                    data-tour="nav-calendar"
                    onClick={tap(() => onChangeView('calendar'))}
                    style={scrollProgress ? { color: c2 } : undefined}
                    className={`${baseClass} ${!scrollProgress ? (currentView === 'calendar' ? 'text-[#6366F1]' : 'text-gray-400') : ''}`}
                >
                    <CalendarDays size={22} />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Grafik</span>
                </motion.button>

                <motion.button
                    data-tour="nav-favorites"
                    onClick={tap(() => onChangeView('favorites'))}
                    style={scrollProgress ? { color: c3 } : undefined}
                    className={`${baseClass} ${!scrollProgress ? (currentView === 'favorites' ? 'text-[#6366F1]' : 'text-gray-400') : ''}`}
                >
                    <Heart size={22} />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Ulubione</span>
                </motion.button>
            </div>
        </nav>
    );
};
