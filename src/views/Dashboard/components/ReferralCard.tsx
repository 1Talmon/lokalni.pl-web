'use client';
import { useState } from 'react';
import { Copy, Share2, Users, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ReferralCardProps {
    link: string;
    liczbaPoleconych?: number;
}

export const ReferralCard = ({ link, liczbaPoleconych }: ReferralCardProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Dołącz do MyLokalni.pl',
                    text: 'Sprawdź MyLokalni.pl — znajdź lokalnych wykonawców lub zaoferuj swoje usługi!',
                    url: link,
                });
            } catch {
                // user cancelled
            }
        } else {
            handleCopy();
        }
    };

    const shortLink = link.replace(/^https?:\/\//, '');

    return (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white rounded-[2rem] border border-gray-100 shadow-sm px-5 py-4">
            {/* Icon + label */}
            <div className="flex items-center gap-3 shrink-0">
                <div className="w-9 h-9 bg-indigo-50 text-[#6366F1] rounded-xl flex items-center justify-center">
                    <Users size={17} />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900 leading-none">Zaproś znajomych</p>
                    {!!liczbaPoleconych && liczbaPoleconych > 0 ? (
                        <p className="text-[10px] font-bold text-emerald-500 mt-0.5">{liczbaPoleconych} {liczbaPoleconych === 1 ? 'osoba dołączyła' : liczbaPoleconych < 5 ? 'osoby dołączyły' : 'osób dołączyło'}</p>
                    ) : (
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">Twój unikalny link</p>
                    )}
                </div>
            </div>

            {/* Link pill */}
            <button
                onClick={handleCopy}
                className="flex-1 flex items-center gap-2 min-w-0 bg-gray-50 hover:bg-gray-100 rounded-2xl px-4 py-2.5 border border-gray-100 transition-colors group cursor-pointer"
            >
                <span className="text-xs font-mono text-gray-400 truncate flex-1 text-left">{shortLink}</span>
                <AnimatePresence mode="wait">
                    {copied ? (
                        <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="shrink-0">
                            <Check size={13} className="text-emerald-500" />
                        </motion.div>
                    ) : (
                        <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="shrink-0">
                            <Copy size={13} className="text-gray-300 group-hover:text-[#6366F1] transition-colors" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </button>

            {/* Share button */}
            <button
                onClick={handleShare}
                className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-2xl text-xs font-bold transition-all active:scale-95 shadow-xl shadow-indigo-100"
            >
                <Share2 size={14} /> Udostępnij
            </button>
        </div>
    );
};
