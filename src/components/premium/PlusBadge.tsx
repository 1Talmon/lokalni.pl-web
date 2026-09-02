import { Sparkles } from 'lucide-react';

interface PlusBadgeProps {
    className?: string;
}

/** Dyskretna odznaka Plus — pokazywana przy nazwie wykonawcy */
export const PlusBadge = ({ className = '' }: PlusBadgeProps) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-black text-amber-600 uppercase tracking-widest ${className}`}>
        <Sparkles size={9} className="text-amber-500" />
        Plus
    </span>
);
