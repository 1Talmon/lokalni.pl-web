'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Only strictly necessary storage is used (art. 399 ust. 3 PKE) — no consent needed, the banner is informational.
  const handleDismiss = () => {
    localStorage.setItem('cookie-consent', 'acknowledged');
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
                <h3 className="font-bold text-gray-900 text-lg mb-1">Pliki cookies</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  Używamy wyłącznie niezbędnych plików cookies i pamięci przeglądarki – do utrzymania logowania i zapamiętania Twoich ustawień. Nie stosujemy cookies analitycznych ani reklamowych. Szczegóły w{' '}
                  <Link href="/polityka-prywatnosci" className="text-[#6366F1] hover:underline font-medium">
                    Polityce prywatności
                  </Link>.
                </p>
                
                <button
                  onClick={handleDismiss}
                  className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 w-full sm:w-auto"
                >
                  Rozumiem
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;