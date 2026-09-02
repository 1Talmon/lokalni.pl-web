import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const APP_VERSION = (process.env.CF_PAGES_COMMIT_SHA || process.env.VITE_GIT_SHA || 'dev').slice(0, 7);

export default defineConfig(({ mode: _mode }) => ({
    server: {
        host: "::",
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
        },
    },
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    optimizeDeps: {
        include: [
            '@capacitor/core',
            '@capacitor/haptics',
            '@capacitor/keyboard',
            '@capacitor/share',
            '@capacitor/local-notifications',
            '@capacitor/status-bar',
        ],
    },
    define: {
        __APP_VERSION__: JSON.stringify(APP_VERSION),
    },
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks(id: string) {
                    if (id.includes('/node_modules/react-dom/') || id.includes('/node_modules/react/')) {
                        return 'vendor-react';
                    }
                    if (id.includes('/node_modules/react-router') || id.includes('/node_modules/@remix-run/')) {
                        return 'vendor-router';
                    }
                    if (id.includes('/node_modules/@tanstack/')) {
                        return 'vendor-query';
                    }
                    if (id.includes('/node_modules/framer-motion/')) {
                        return 'vendor-motion';
                    }
                },
            },
        },
    },
}));
