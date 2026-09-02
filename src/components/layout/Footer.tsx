'use client';
import Link from 'next/link';
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const AppleIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.68 4.04l-.07.28zM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
);

const GooglePlayIcon = () => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M3.18 23.76c.3.17.64.24.99.2l12.35-11.64L13.06 9l-9.88 14.76zM.54 1.96C.2 2.3 0 2.84 0 3.54v16.92c0 .7.2 1.24.54 1.58l.08.08L9.32 12v-.22L.62 1.88l-.08.08zM19.34 9.65l-2.37-1.4-3.27 3.07 3.27 3.07 2.4-1.42c.68-.4.68-1.05-.03-1.32zM4.17.24L16.52 11.88 13.06 15 3.18.44A1.15 1.15 0 0 1 4.17.24z"/>
    </svg>
);

export const Footer = ({ onOpenSupport }: { onOpenSupport?: () => void } = {}) => {
    const handleResetCookies = () => {
        localStorage.removeItem('cookie-consent');
        window.location.reload();
    };

    return (
        <footer className="bg-gray-900 text-gray-300 py-12 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* KOLUMNA 1: LOGO */}
                <div className="space-y-4">
                    <div className="text-2xl font-black text-white">
                        MyLokalni<span className="text-[#6366F1]">.</span>
                    </div>
                    <p className="text-sm opacity-60 leading-relaxed">
                        Znajdź sprawdzonych specjalistów w Twojej okolicy. Szybko, bezpiecznie i lokalnie.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-[#6366F1] transition-colors"><Facebook size={20} /></a>
                        <a href="#" className="hover:text-[#6366F1] transition-colors"><Instagram size={20} /></a>
                    </div>
                </div>

                {/* KOLUMNA 2: PLATFORMA */}
                <div>
                    <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Platforma</h4>
                    <ul className="space-y-2 text-sm">
                        <li><Link href="/jak-to-dziala" className="hover:text-white transition-colors">Jak to działa</Link></li>
                        <li><Link href="/o-nas" className="hover:text-white transition-colors">O nas</Link></li>
                        <li><Link href="/faq" className="hover:text-white transition-colors">Najczęstsze pytania</Link></li>
                    </ul>
                </div>

                {/* KOLUMNA 3: DOKUMENTY */}
                <div>
                    <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Wsparcie i prawo</h4>
                    <ul className="space-y-2 text-sm">
                        <li>
                            {onOpenSupport
                                ? <button onClick={onOpenSupport} className="hover:text-white transition-colors text-left">Centrum wsparcia</button>
                                : <Link href="/pomoc" className="hover:text-white transition-colors">Centrum wsparcia</Link>
                            }
                        </li>
                        <li><Link href="/regulamin" className="hover:text-white transition-colors">Regulamin serwisu</Link></li>
                        <li><Link href="/polityka-prywatnosci" className="hover:text-white transition-colors">Polityka prywatności</Link></li>
                        <li><Link href="/zasady-bezpieczenstwa" className="hover:text-white transition-colors">Zasady bezpieczeństwa</Link></li>
                    </ul>
                </div>

                {/* KOLUMNA 4: KONTAKT */}
                <div>
                    <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-widest">Kontakt</h4>
                    <ul className="space-y-3 text-sm">
                        <li>
                            <a href="mailto:kontakt@lokalni.pl" className="flex items-center gap-3 hover:text-white transition-colors">
                                <Mail size={16} className="text-[#6366F1]"/>
                                kontakt@lokalni.pl
                            </a>
                        </li>
                        <li>
                            <a href="tel:+48577481340" className="flex items-center gap-3 hover:text-white transition-colors">
                                <Phone size={16} className="text-[#6366F1]"/>
                                +48 577 481 340
                            </a>
                        </li>
                        <li className="flex items-center gap-3">
                            <MapPin size={16} className="text-[#6366F1]"/>
                            ul. Prosta 1, Warszawa
                        </li>
                    </ul>
                </div>
            </div>

            {/* PASEK: POBIERZ APLIKACJĘ */}
            <div className="max-w-7xl mx-auto mt-10 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-400">Mamy też aplikację mobilną — zabierz MyLokalni ze sobą.</p>
                <div className="flex gap-3 shrink-0">
                    <a href="#" className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 transition-colors border border-white/20 rounded-xl px-4 py-2.5 w-40">
                        <AppleIcon />
                        <div className="text-left leading-tight">
                            <div className="text-[9px] text-gray-400 uppercase tracking-widest">Pobierz w</div>
                            <div className="text-sm font-bold text-white">App Store</div>
                        </div>
                    </a>
                    <a href="#" className="inline-flex items-center gap-2.5 bg-white/10 hover:bg-white/20 transition-colors border border-white/20 rounded-xl px-4 py-2.5 w-40">
                        <GooglePlayIcon />
                        <div className="text-left leading-tight">
                            <div className="text-[9px] text-gray-400 uppercase tracking-widest">Pobierz w</div>
                            <div className="text-sm font-bold text-white">Google Play</div>
                        </div>
                    </a>
                </div>
            </div>

            {/* DOŁEK: COPYRIGHT */}
            <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs opacity-50">
                <div>© {new Date().getFullYear()} [PEŁNA NAZWA FIRMY] | NIP: [000-000-00-00] | Wszystkie prawa zastrzeżone.</div>
                <div className="flex gap-6">
                    <button
                        onClick={handleResetCookies}
                        className="hover:text-white transition-colors hover:underline"
                    >
                        Ustawienia cookies
                    </button>
                    <span>Usługi na wyciągnięcie ręki.</span>
                </div>
            </div>
        </footer>
    );
};
