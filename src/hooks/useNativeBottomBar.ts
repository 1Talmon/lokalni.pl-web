// Web stub — BottomBar is an iOS-only native plugin.
interface Options {
    price: string;
    unit:  string;
    label: string;
    enabled?: boolean;
    visible?: boolean;
    collapsed?: boolean;
    onAction: () => void;
}

export function useNativeBottomBar(_opts: Options) {
    return { isNativeBottomBarActive: false };
}
