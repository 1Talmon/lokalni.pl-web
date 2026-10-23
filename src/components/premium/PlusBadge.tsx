import { Sparkles } from 'lucide-react';

interface PlusBadgeProps {
    className?: string;
}

/** Dyskretna odznaka Plus — pokazywana przy nazwie wykonawcy */
export const PlusBadge = ({ className = '' }: PlusBadgeProps) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 border border-violet-200 rounded-lg text-[10px] font-black text-violet-600 uppercase tracking-widest ${className}`}>
        <Sparkles size={9} className="text-violet-500" />
        Plus
    </span>
);
