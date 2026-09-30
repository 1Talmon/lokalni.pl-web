/** Przycisk akcji w wierszu — ten sam co „Zmień hasło”. */
export const settingsActionClass = (tone: 'default' | 'danger' | 'neutral' = 'default') =>
    `shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50 ${
        tone === 'danger' ? 'bg-rose-50 text-rose-500 hover:bg-rose-100'
        : tone === 'neutral' ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
    }`;
