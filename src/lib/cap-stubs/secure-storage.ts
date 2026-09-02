export const SecureStoragePlugin = {
    get: async ({ key }: { key: string }) => ({ value: localStorage.getItem(key) }),
    set: async ({ key, value }: { key: string; value: string }) => { localStorage.setItem(key, value); return { value: true }; },
    remove: async ({ key }: { key: string }) => { localStorage.removeItem(key); return { value: true }; },
    clear: async () => { localStorage.clear(); return { value: true }; },
    keys: async () => ({ value: Object.keys(localStorage) }),
};
