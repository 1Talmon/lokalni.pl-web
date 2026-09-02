import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface NativeNavPlugin {
    push(options?: { fullScreen?: boolean }): Promise<void>;
    pop(options?: { fullScreen?: boolean }): Promise<void>;
    signalReady(): Promise<void>;
    setNavHeight(options: { height: number }): Promise<void>;
    enableSwipeBack(options?: { interactive?: boolean }): Promise<void>;
    disableSwipeBack(): Promise<void>;
    addListener(event: 'swipeBackStart',    handler: () => void): Promise<PluginListenerHandle>;
    addListener(event: 'swipeBackComplete', handler: () => void): Promise<PluginListenerHandle>;
    addListener(event: 'swipeBackCancel',   handler: () => void): Promise<PluginListenerHandle>;
}

export const NativeNav = registerPlugin<NativeNavPlugin>('NativeNav');
