import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Jeden wzór wiersza dla całych Ustawień (jak „Hasło dostępu”):
 * ikona + tytuł + opis po lewej, akcja po prawej.
 */
export const SettingsRow = ({ icon: Icon, title, description, action, tone = 'default' }: {
    icon: LucideIcon;
    title: ReactNode;
    description?: ReactNode;
    action?: ReactNode;
    tone?: 'default' | 'danger';
}) => (
    <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tone === 'danger' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-600'}`}>
                <Icon size={18} />
            </div>
            <div className="min-w-0">
                <h4 className="font-bold text-gray-900 text-sm">{title}</h4>
                {description && <p className="text-xs text-gray-400">{description}</p>}
            </div>
        </div>
        {action}
    </div>
);

/** Przełącznik iOS-style (wcześniej lokalny w BiometricSection). */
export const SettingsToggle = ({ enabled, onToggle, disabled, label }: { enabled: boolean; onToggle: () => void; disabled?: boolean; label?: string }) => (
    <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        onClick={onToggle}
        disabled={disabled}
        className={`relative w-12 h-7 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-50 ${enabled ? 'bg-[#6366F1]' : 'bg-gray-200'}`}
    >
        <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
);
