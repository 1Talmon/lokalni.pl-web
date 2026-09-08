export const NativeBottomNav = null;

interface Options {
    isLoggedIn: boolean;
    currentView: string;
    onChangeView: (view: string) => void;
    onAddClick: () => void;
    hasUnreadMessages: boolean;
    hideNavigation: boolean;
}

export function useNativeBottomNav(_opts: Options) {
    return { isNativeNavActive: false };
}
