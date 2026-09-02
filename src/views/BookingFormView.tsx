'use client';
import Image from 'next/image';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { useRouter } from 'next/navigation';
import { AddressAutocomplete } from '../components/ui/AddressAutocomplete';
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, FileText, Loader2, Globe, MessageSquare, Banknote, CheckCircle, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Service } from '../types';
import { isRemoteService } from '../utils/serviceUtils';
import { CATEGORIES_DATA } from '../data/categories';
import { authService } from '../services/authService';
import { UserAvatar } from '../components/ui/UserAvatar';
import { useNativeNavBar } from '../hooks/useNativeNavBar';
import { useSwipeBack } from '../hooks/useSwipeBack';
interface BookingFormViewProps {
    service: Service | null;
    onBack: () => void;
    userLocation: string;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isSubmitting: boolean;
}

const MONTHS_PL  = ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'];
const DAYS_PL    = ['Pn','Wt','Śr','Cz','Pt','So','Nd'];

const fmtDate = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

const todayDate   = fmtDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
const todayNative = new Date().toISOString().split('T')[0];

const BookingFormView = ({ service, onBack, userLocation: _userLocation, onSubmit, isSubmitting }: BookingFormViewProps) => {
    const [step, setStep]                 = useState<1 | 2>(1);
    const [kbHeight, setKbHeight] = useState(0);
    const notesRef = useRef<HTMLTextAreaElement>(null);
    const [addressValue, setAddressValue] = useState('');
    const [addressCoords, setAddressCoords] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;
        let showH: Awaited<ReturnType<typeof Keyboard.addListener>> | undefined;
        let hideH: Awaited<ReturnType<typeof Keyboard.addListener>> | undefined;
        Keyboard.addListener('keyboardWillShow', info => {
            setKbHeight(info.keyboardHeight);
        }).then(h => { showH = h; });
        Keyboard.addListener('keyboardWillHide', () => setKbHeight(0)).then(h => { hideH = h; });
        return () => { showH?.remove(); hideH?.remove(); };
    }, []);

    const [calDate, setCalDate]           = useState(new Date());
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedHour, setSelectedHour] = useState('');
    const [busyDays, setBusyDays]           = useState<string[]>([]);
    const [partialDays, setPartialDays]     = useState<string[]>([]);
    const [slots, setSlots]                 = useState<string[] | null>(null);
    const [calError, setCalError]           = useState(false);
    const [hoursError, setHoursError]       = useState(false);
    const [slotDuration, setSlotDuration]   = useState<number>(service?.durationMinutes ?? 60);

    const y = calDate.getFullYear();
    const m = calDate.getMonth();

    const isRequest = service?.type === 'request';

    const { daysInMonth, offset } = useMemo(() => {
        const days = new Date(y, m + 1, 0).getDate();
        const raw  = new Date(y, m, 1).getDay();
        return { daysInMonth: days, offset: raw === 0 ? 6 : raw - 1 };
    }, [y, m]);

    useEffect(() => {
        if (!service || isRequest) return;
        setCalError(false);
        setBusyDays([]);
        setPartialDays([]);
        if (!service.provider.isPremium) return;
        let ok = true;
        authService.getProviderAvailability(service.provider.uid, y, m + 1)
            .then(d => { if (ok) { setBusyDays(d?.busyDays ?? []); setPartialDays(d?.partialDays ?? []); } })
            .catch(() => { if (ok) setCalError(true); });
        return () => { ok = false; };
    }, [y, m, service, isRequest]);

    useEffect(() => {
        if (!selectedDate || !service || isRequest) return;
        let ok = true;
        setSlots(null);
        setHoursError(false);
        authService.getServiceTakenHours(service.publicId!, selectedDate)
            .then(d => {
                if (!ok) return;
                setSlots(d?.availableHours ?? []);
                if (d?.durationMinutes) setSlotDuration(d.durationMinutes);
            })
            .catch(() => { if (ok) setHoursError(true); });
        return () => { ok = false; };
    }, [selectedDate, service, isRequest]);

    const handleDayClick = useCallback((ds: string) => {
        if (ds < todayDate || busyDays.includes(ds)) return;
        setSelectedDate(prev => prev === ds ? '' : ds);
        setSelectedHour('');
    }, [busyDays]);

    const router = useRouter();

    const handleNativeBack = useCallback(() => {
        if (step === 2) setStep(1);
        else onBack();
    }, [step, onBack]);

    const { isNativeNavActive } = useNativeNavBar({
        shareUrl:     '',
        showFavorite: false,
        showShare:    false,
        onBack:       handleNativeBack,
    });

    useSwipeBack(true, handleNativeBack);

    if (!service) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-gray-500 text-sm font-medium">Nie wybrano usługi.</p>
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl text-sm font-bold text-gray-700 border border-gray-100 shadow-sm hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft size={15} /> Wróć do strony głównej
                </button>
            </div>
        );
    }

    const isRemote = isRemoteService(service);
    const category = CATEGORIES_DATA.find(c => c.id === service.category);

    const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(e);
    };

    const selectedDateLabel = selectedDate
        ? new Date(selectedDate + 'T00:00').toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' })
        : '';

    return (
        <>
        <div className="pb-20 selection:bg-indigo-500 selection:text-white" style={{ paddingBottom: kbHeight > 0 ? kbHeight + 80 : undefined }}>
            <div className={`max-w-5xl mx-auto px-4 md:px-6 ${isNativeNavActive ? 'pt-[76px]' : 'pt-[60px] pb-8 lg:py-8'}`}>

                {!isNativeNavActive && (
                    <button
                        onClick={onBack}
                        type="button"
                        className="hidden lg:flex mb-6 items-center gap-2 bg-white px-4 py-2.5 rounded-2xl text-[10px] font-black shadow-sm border border-gray-100 text-gray-700 uppercase tracking-wider transition-all active:scale-95 hover:bg-gray-50"
                    >
                        <ArrowLeft size={13} strokeWidth={3} /> Wróć
                    </button>
                )}

                {/* ── MOBILE: kompaktowa karta usługi na górze ── */}
                <div className="lg:hidden mb-5">
                    <div className="flex items-center gap-3 bg-white rounded-[1.75rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="w-20 h-20 shrink-0">
                            <Image src={service.image} alt={service.title} width={80} height={80} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 py-3 pr-1">
                            <p className="font-black text-gray-900 text-sm leading-tight truncate">{service.title}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                                <UserAvatar src={service.provider.avatar} name={service.provider.name} size={16} className="rounded-full shrink-0" />
                                <p className="text-xs text-gray-400 font-medium truncate">{service.provider.name}</p>
                            </div>
                            {category && (
                                <span className="inline-block mt-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-lg uppercase tracking-wide">
                                    {category.name}
                                </span>
                            )}
                        </div>
                        <div className="shrink-0 pr-4 text-right">
                            <p className="font-black text-gray-900 text-base leading-none">{service.price}</p>
                            <p className="text-[11px] text-gray-400 font-medium mt-0.5">{service.priceUnit}</p>
                        </div>
                    </div>
                </div>

                {/* ── TYTUŁ desktop ── */}
                <div className="hidden lg:block mb-6">
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                        {isRequest ? 'Aplikuj do zlecenia' : 'Zarezerwuj termin'}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">
                        {isRequest
                            ? 'Wyślij ofertę do zleceniodawcy — ustalicie szczegóły przez chat'
                            : 'Wyślij prośbę o rezerwację — wykonawca potwierdzi dostępność'}
                    </p>
                </div>

                {/* ── TYTUŁ mobile ── */}
                <div className="lg:hidden mb-4">
                    <p className="text-xl font-black text-gray-900">
                        {isRequest ? 'Aplikuj do zlecenia' : 'Zarezerwuj termin'}
                    </p>
                    <p className="text-sm text-gray-400 font-medium mt-0.5">
                        {isRequest
                            ? 'Wyślij ofertę — ustalicie szczegóły przez chat'
                            : 'Wykonawca potwierdzi dostępność'}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:items-start">

                    {/* ── FORMULARZ ── */}
                    <div className="lg:order-2">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 md:p-8">

                            {/* Stepper */}
                            {!isRequest && (
                                <div className="flex items-center gap-3 mb-6">
                                    {(['Termin', 'Szczegóły'] as const).map((label, i) => {
                                        const n = (i + 1) as 1 | 2;
                                        const active = step === n;
                                        const done   = step > n;
                                        return (
                                            <div key={n} className="flex items-center gap-2 flex-1">
                                                <div className={`flex items-center gap-2 ${active || done ? 'text-indigo-600' : 'text-gray-300'}`}>
                                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 transition-all ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : done ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                                                        {done ? <CheckCircle size={14} /> : n}
                                                    </div>
                                                    <span className={`text-xs font-black tracking-wide ${active ? 'text-indigo-600' : done ? 'text-indigo-400' : 'text-gray-300'}`}>{label}</span>
                                                </div>
                                                {i === 0 && <div className={`flex-1 h-0.5 mx-1 rounded-full transition-all ${done ? 'bg-indigo-300' : 'bg-gray-100'}`} />}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <form onSubmit={handleFormSubmit} className="space-y-4">

                                {isRequest ? (
                                    /* ── ZLECENIE ── */
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                <MessageSquare size={15} className="text-indigo-400" /> Wiadomość do zleceniodawcy
                                            </label>
                                            <textarea
                                                name="message"
                                                required
                                                minLength={10}
                                                maxLength={2000}
                                                rows={5}
                                                defaultValue={`Dzień dobry! Chciałbym zgłosić się do Państwa zlecenia: "${service.title}". Mam doświadczenie w tego rodzaju pracach i jestem dostępny w najbliższym czasie. Proszę o kontakt w celu ustalenia szczegółów.`}
                                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:bg-white transition-all resize-none text-gray-700 text-sm placeholder:text-gray-400"
                                                onFocus={e => { const t = e.target; setTimeout(() => t.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350); }}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                <Banknote size={15} className="text-indigo-400" /> Proponowana cena (opcjonalnie)
                                            </label>
                                            <div className="relative">
                                                <input
                                                    name="proposed_price"
                                                    type="number"
                                                    min="1"
                                                    placeholder={`Budżet zleceniodawcy: ${service.price} ${service.priceUnit}`}
                                                    className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:bg-white transition-all pr-12 text-gray-700 placeholder:text-gray-400"
                                                />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">zł</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                <CalendarIcon size={15} className="text-indigo-400" /> Kiedy możesz zacząć (opcjonalnie)
                                            </label>
                                            <input
                                                name="available_from"
                                                type="date"
                                                min={todayNative}
                                                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:bg-white transition-all text-gray-700 placeholder:text-gray-400"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className={`w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95'}`}
                                        >
                                            {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Wysyłanie...</> : 'Wyślij ofertę'}
                                        </button>

                                        <p className="text-center text-xs text-gray-400">
                                            Wysyłając ofertę, wyrażasz zainteresowanie zleceniem. Brak zobowiązań finansowych.
                                        </p>
                                    </>
                                ) : (
                                    <AnimatePresence mode="wait" initial={false}>
                                        {step === 1 ? (
                                            <motion.div
                                                key="step1"
                                                initial={{ opacity: 0, x: -16 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -16 }}
                                                transition={{ duration: 0.18 }}
                                                className="space-y-4"
                                            >
                                                {/* Kalendarz */}
                                                <div className="rounded-2xl border border-gray-100 overflow-hidden">
                                                    <div className="flex items-center justify-between px-3 py-3 bg-gray-50 border-b border-gray-100">
                                                        <button type="button" onClick={() => setCalDate(new Date(y, m - 1))}
                                                            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 active:scale-90 transition-all">
                                                            <ChevronLeft size={20} />
                                                        </button>
                                                        <div className="text-center">
                                                            <div className="font-black text-gray-900 text-base">{MONTHS_PL[m]}</div>
                                                            <div className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">{y}</div>
                                                        </div>
                                                        <button type="button" onClick={() => setCalDate(new Date(y, m + 1))}
                                                            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 active:scale-90 transition-all">
                                                            <ChevronRight size={20} />
                                                        </button>
                                                    </div>

                                                    <div className="p-2 md:p-4 bg-white">
                                                        <div className="grid grid-cols-7 gap-1 mb-1">
                                                            {DAYS_PL.map((d) => (
                                                                <div key={d} className="text-center text-[10px] font-black uppercase py-1 text-gray-300">{d}</div>
                                                            ))}
                                                        </div>

                                                        <div className="grid grid-cols-7 gap-1">
                                                            {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} className="aspect-square" />)}
                                                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                                                const day = i + 1;
                                                                const ds  = fmtDate(y, m, day);
                                                                const isPast      = ds < todayDate;
                                                                const isBusy      = busyDays.includes(ds);
                                                                const isPartial   = !isBusy && partialDays.includes(ds);
                                                                const isAvailable = !isPast && !isBusy;
                                                                const isSelected  = ds === selectedDate;
                                                                const isToday     = ds === todayDate;

                                                                return (
                                                                    <button
                                                                        key={ds}
                                                                        type="button"
                                                                        disabled={!isAvailable}
                                                                        onClick={() => handleDayClick(ds)}
                                                                        className={[
                                                                            'aspect-square rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-px relative transition-all active:scale-95',
                                                                            isSelected  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : '',
                                                                            isAvailable && !isSelected && !isPartial ? 'bg-green-50 text-green-800 hover:bg-green-100 border border-green-200 cursor-pointer' : '',
                                                                            isAvailable && !isSelected && isPartial ? 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-200 cursor-pointer' : '',
                                                                            !isAvailable ? 'text-gray-200 cursor-not-allowed' : '',
                                                                            isToday && !isSelected ? 'ring-2 ring-indigo-400 ring-offset-1' : '',
                                                                        ].join(' ')}
                                                                    >
                                                                        <span className="leading-none">{day}</span>
                                                                        <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-transparent' : isPartial ? 'bg-orange-400' : isAvailable ? 'bg-green-400' : 'bg-transparent'}`} />
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>

                                                        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-4 flex-wrap">
                                                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">
                                                                <div className="w-3 h-3 bg-green-50 border border-green-200 rounded-full" /> Dostępny
                                                            </span>
                                                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">
                                                                <div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded-full" /> Częściowo zajęty
                                                            </span>
                                                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-gray-400">
                                                                <div className="w-3 h-3 rounded-full bg-gray-100" /> Niedostępny
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {calError && (
                                                    <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-xs font-medium">
                                                        <AlertTriangle size={14} className="shrink-0" />
                                                        Nie udało się pobrać dostępności wykonawcy. Możesz wybrać dowolny termin — wykonawca potwierdzi dostępność.
                                                    </div>
                                                )}

                                                {/* Wybór godziny — pojawia się po wyborze dnia */}
                                                <AnimatePresence>
                                                    {selectedDate && (
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 8 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            exit={{ opacity: 0, y: 4 }}
                                                            transition={{ duration: 0.18 }}
                                                        >
                                                            <div className="flex items-center gap-2 mb-3 px-1">
                                                                <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                                                                    <CheckCircle size={12} className="text-indigo-600" />
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-700 capitalize">{selectedDateLabel}</span>
                                                            </div>

                                                            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-3 md:p-4">
                                                                <div className="flex items-center justify-between mb-3">
                                                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                                                        <Clock size={11} /> Godzina
                                                                        <span className="font-medium normal-case tracking-normal text-gray-300">(opcjonalnie)</span>
                                                                    </p>
                                                                    <span className="text-[10px] font-bold text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-lg">
                                                                        {slotDuration >= 60
                                                                            ? `${Math.floor(slotDuration / 60)}h${slotDuration % 60 > 0 ? ` ${slotDuration % 60}min` : ''}`
                                                                            : `${slotDuration} min`}
                                                                    </span>
                                                                </div>
                                                                <AnimatePresence mode="wait" initial={false}>
                                                                {slots === null ? (
                                                                    <motion.div key="loading"
                                                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                                        transition={{ duration: 0.15 }}
                                                                        className="flex items-center justify-center py-6">
                                                                        <Loader2 size={20} className="animate-spin text-indigo-400" />
                                                                    </motion.div>
                                                                ) : slots.length === 0 ? (
                                                                    <motion.div key="empty"
                                                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                                        transition={{ duration: 0.15 }}
                                                                        className="flex items-center justify-center py-6 text-sm text-gray-400 font-medium">
                                                                        Brak dostępnych terminów tego dnia
                                                                    </motion.div>
                                                                ) : (
                                                                    <motion.div key="slots"
                                                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                                                        transition={{ duration: 0.15 }}
                                                                        className="grid grid-cols-3 md:grid-cols-4 gap-2">
                                                                        {slots.map(h => {
                                                                            const isSelected = h === selectedHour;
                                                                            return (
                                                                                <button key={h} type="button"
                                                                                    onClick={() => setSelectedHour(prev => prev === h ? '' : h)}
                                                                                    className={[
                                                                                        'py-3.5 rounded-xl text-sm font-bold text-center flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95',
                                                                                        isSelected
                                                                                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                                                            : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 shadow-sm',
                                                                                    ].join(' ')}>
                                                                                    <span className="leading-none">{h}</span>
                                                                                    <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-transparent' : 'bg-green-400'}`} />
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </motion.div>
                                                                )}
                                                                </AnimatePresence>
                                                                {hoursError && (
                                                                    <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-700 text-xs font-medium">
                                                                        <AlertTriangle size={14} className="shrink-0" />
                                                                        Nie udało się pobrać zajętych godzin. Część może być już zajęta.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                <button
                                                    type="button"
                                                    disabled={!selectedDate}
                                                    onClick={() => setStep(2)}
                                                    className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                                                        selectedDate
                                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95'
                                                            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                                    }`}
                                                >
                                                    Dalej <ChevronRight size={18} />
                                                </button>
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="step2"
                                                initial={{ opacity: 0, x: 16 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 16 }}
                                                transition={{ duration: 0.18 }}
                                                className="space-y-4"
                                            >
                                                {/* ── KROK 2: SZCZEGÓŁY ── */}

                                                <button
                                                    type="button"
                                                    onClick={() => setStep(1)}
                                                    className="w-full flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3.5 text-left hover:bg-indigo-100 transition-colors group active:scale-95"
                                                >
                                                    <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-indigo-200 transition-colors">
                                                        <CalendarIcon size={16} className="text-indigo-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-indigo-400">Wybrany termin</p>
                                                        <p className="text-sm font-bold text-indigo-700 capitalize truncate">
                                                            {selectedDateLabel}{selectedHour ? `, ${selectedHour}` : ''}
                                                        </p>
                                                    </div>
                                                    <ChevronRight size={14} className="text-indigo-300 group-hover:text-indigo-500 shrink-0 transition-colors" />
                                                </button>

                                                <input type="hidden" name="date" value={selectedDate} onChange={() => {}} />
                                                <input type="hidden" name="time" value={selectedHour} onChange={() => {}} />

                                                {!isRemote && service!.radius === 0 && (
                                                    /* Stacjonarna — adres z usługi, klient nie wpisuje */
                                                    <>
                                                        <input type="hidden" name="address" value={service!.address ?? ''} onChange={() => {}} />
                                                        <input type="hidden" name="addressLat" value={service!.addressLat ?? service!.location?.lat ?? ''} onChange={() => {}} />
                                                        <input type="hidden" name="addressLng" value={service!.addressLng ?? service!.location?.lng ?? ''} onChange={() => {}} />
                                                    </>
                                                )}
                                                {!isRemote && service!.radius > 0 && (
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                            <MapPin size={15} className="text-indigo-400" /> Twój adres <span className="text-red-400">*</span>
                                                        </label>
                                                        <AddressAutocomplete
                                                            value={addressValue}
                                                            onChange={v => { setAddressValue(v); setAddressCoords(null); }}
                                                            onSelect={(label, lat, lng) => { setAddressValue(label); setAddressCoords({ lat, lng }); }}
                                                            placeholder="Ulica, numer domu, miasto"
                                                            className="p-4 bg-gray-50 border border-gray-100 rounded-2xl focus-within:ring-2 focus-within:ring-[#6366F1]/20 focus-within:bg-white transition-all"
                                                            inputClassName="text-sm placeholder:text-gray-400"
                                                        />
                                                        <input type="hidden" name="address" value={addressValue} onChange={() => {}} />
                                                        <input type="hidden" name="addressLat" value={addressCoords?.lat ?? ''} onChange={() => {}} />
                                                        <input type="hidden" name="addressLng" value={addressCoords?.lng ?? ''} onChange={() => {}} />
                                                    </div>
                                                )}

                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                        <FileText size={15} className="text-indigo-400" /> Uwagi dla wykonawcy
                                                    </label>
                                                    <textarea
                                                        ref={notesRef}
                                                        name="notes"
                                                        rows={3}
                                                        maxLength={1000}
                                                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-[#6366F1]/20 focus:bg-white transition-all resize-none text-gray-700 text-sm placeholder:text-gray-400"
                                                        placeholder="Np. kod do domofonu, piętro, specyficzne wymagania..."
                                                        onFocus={() => setTimeout(() => notesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350)}
                                                    />
                                                </div>

                                                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                                                    <div className="flex justify-between text-sm text-gray-600">
                                                        <span>Cena usługi</span>
                                                        <span className="font-semibold text-gray-900">{service.price} {service.priceUnit}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={isSubmitting}
                                                    className={`w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700 active:scale-95'}`}
                                                >
                                                    {isSubmitting ? <><Loader2 className="animate-spin" size={20} /> Wysyłanie...</> : 'Wyślij prośbę o rezerwację'}
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                )}
                            </form>
                        </div>
                    </div>

                    {/* ── KARTA USŁUGI — tylko desktop ── */}
                    <div className="hidden lg:block lg:order-1 lg:sticky lg:top-8">
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="relative h-48">
                                <Image src={service.image} alt={service.title} fill className="object-cover" sizes="400px" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                {category && (
                                    <span className="absolute top-4 left-4 px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-xl text-[10px] font-black text-indigo-600 uppercase tracking-wider">
                                        {category.name}
                                    </span>
                                )}
                                <div className="absolute bottom-4 left-4 right-4">
                                    <h3 className="font-black text-white text-lg leading-tight line-clamp-2">{service.title}</h3>
                                </div>
                            </div>
                            <div className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="relative shrink-0">
                                        <UserAvatar src={service.provider.avatar} name={service.provider.name} size={40} className="rounded-2xl border border-gray-100" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                                            {isRequest ? 'Zleceniodawca' : 'Wykonawca'}
                                        </p>
                                        <p className="font-bold text-gray-900 text-sm">{service.provider.name}</p>
                                    </div>
                                    <div className="ml-auto text-right">
                                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                                            {isRequest ? 'Budżet' : 'Cena'}
                                        </p>
                                        <p className="font-black text-gray-900">{service.price} <span className="font-normal text-gray-400 text-sm">{service.priceUnit}</span></p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-sm text-gray-500">
                                    {isRemote
                                        ? <><Globe size={14} className="text-indigo-400 shrink-0" /> Usługa zdalna / Online</>
                                        : <><MapPin size={14} className="text-indigo-400 shrink-0" /> {service.city}</>
                                    }
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-4">
                                {isRequest ? 'Jak to działa?' : 'Co się dzieje po wysłaniu?'}
                            </p>
                            <div className="space-y-3">
                                {(isRequest ? [
                                    { n: 1, title: 'Wysyłasz ofertę', desc: 'Zleceniodawca widzi Twoją propozycję i wycenę.' },
                                    { n: 2, title: 'Rozmowa przez chat', desc: 'Możecie ustalić szczegóły i warunki.' },
                                    { n: 3, title: 'Realizacja', desc: 'Uzgodniony termin, płatność po wykonaniu.' },
                                ] : [
                                    { n: 1, title: 'Wysyłasz prośbę', desc: 'Wykonawca dostaje powiadomienie.' },
                                    { n: 2, title: 'Wykonawca potwierdza', desc: 'Zazwyczaj w ciągu 24 godzin.' },
                                    { n: 3, title: 'Spotykacie się', desc: 'Płatność odbywa się po realizacji.' },
                                ]).map(({ n, title, desc }) => (
                                    <div key={n} className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-[10px] font-black text-indigo-500">{n}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 leading-tight">{title}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default BookingFormView;
