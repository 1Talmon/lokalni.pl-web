'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react'; // Usunąłem X z importów
import Link from 'next/link';

type WindowWithGtag = Window & typeof globalThis & { gtag?: (...args: unknown[]) => void };

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    if (typeof window !== 'undefined') {
      (window as WindowWithGtag).gtag?.('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      });
    }
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    if (typeof window !== 'undefined') {
      (window as WindowWithGtag).gtag?.('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
    }
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: '110%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '110%', opacity: 0 }}
          transition={{ type: 'spring', damping: 32, stiffness: 280 }}
          style={{ willChange: 'transform' }}
          data-cookie-banner
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[9999]"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-5 md:p-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 opacity-50 pointer-events-none" />
            
            <div className="flex items-start gap-4 relative z-10">
              <div className="bg-indigo-100 p-3 rounded-2xl text-[#6366F1] shrink-0">
                <ShieldCheck size={24} />
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-1">Prywatność i Cookies</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  Używamy cookies, aby zapewnić najlepszą jakość usług. Więcej informacji znajdziesz w naszej{' '}
                  <Link href="/polityka-prywatnosci" className="text-[#6366F1] hover:underline font-medium">
                    Polityce Prywatności
                  </Link>.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleAccept}
                    className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 flex-1"
                  >
                    Akceptuję
                  </button>
                  <button
                    onClick={handleDecline}
                    className="bg-gray-50 hover:bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95"
                  >
                    Odrzuć
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;