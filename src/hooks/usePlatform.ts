import { Capacitor } from '@capacitor/core';

const platform = Capacitor.getPlatform();

export const usePlatform = () => ({
    isNative: Capacitor.isNativePlatform(),
    isIos: platform === 'ios',
    isAndroid: platform === 'android',
    isWeb: platform === 'web',
});
