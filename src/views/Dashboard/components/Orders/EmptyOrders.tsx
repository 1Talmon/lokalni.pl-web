import React from 'react';
import { History, Search, Inbox } from 'lucide-react';

interface EmptyOrdersProps {
    viewMode: 'provider' | 'client';
    activeTab: 'current' | 'history';
}

export const EmptyOrders = ({ viewMode, activeTab }: EmptyOrdersProps) => {
    const isProvider = viewMode === 'provider';
    const isHistory = activeTab === 'history';

    const getContent = () => {
        if (isHistory) {
            return {
                title: "Historia jest pusta",
                description: isProvider
                    ? "Nie zrealizowałeś jeszcze żadnych zleceń. Twoja historia pojawi się tutaj po zakończeniu prac."
                    : "Nie masz jeszcze żadnych archiwalnych zamówień. Wszystkie zakończone usługi znajdziesz w tym miejscu.",
                Icon: History,
                color: isProvider ? "text-indigo-300" : "text-emerald-300"
            };
        }

        return {
            title: isProvider ? "Brak nowych zleceń" : "Brak zamówionych usług",
            description: isProvider
                ? "Obecnie nie masz żadnych aktywnych zadań w toku. Czekaj na nowych klientów!"
                : "Nie masz obecnie żadnych aktywnych rezerwacji. Znajdź usługę i umów się z fachowcem.",
            Icon: isProvider ? Inbox : Search,
            color: isProvider ? "text-indigo-300" : "text-emerald-300"
        };
    };

    const { title, description, Icon, color } = getContent();

    return (
        <div className="py-24 text-center bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-100 mx-auto w-full transition-all duration-300">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Icon size={32} className={color} />
            </div>
            <h4 className="text-xl font-bold text-gray-900 tracking-tight">
                {title}
            </h4>
            <p className="text-sm text-gray-400 mt-2 max-w-xs mx-auto font-medium leading-relaxed px-6">
                {description}
            </p>
        </div>
    );
};