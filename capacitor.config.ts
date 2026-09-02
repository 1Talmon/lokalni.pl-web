import type { CapacitorConfig } from '@capacitor/cli';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnvVar(key: string): string {
  if (process.env[key]) return process.env[key]!;
  try {
    const raw = readFileSync(resolve(__dirname, '.env'), 'utf8');
    const match = raw.split('\n').find(l => l.startsWith(key + '='));
    return match ? match.slice(key.length + 1).trim() : '';
  } catch { return ''; }
}

const config: CapacitorConfig = {
  appId: 'com.lokalni.app',
  appName: 'MyLokalni',
  webDir: 'dist',
  plugins: {
    PushNotifications: {
      presentationOptions: ['alert', 'badge', 'sound'],
    },
    CapacitorHttp: {
      // enabled: true WYŁĄCZONE — auto-patching wrappuje window.fetch i XMLHttpRequest
      // przez natywny bridge zanim nasz kod się uruchomi. originalFetch w main.tsx
      // przechwytuje Capacitor's wersję, nie prawdziwy WKWebView fetch — przez co
      // uploady plików File (video, duże zdjęcia) wiszą. Zamiast tego używamy
      // CapacitorHttp.request() ręcznie w monkey-patchu dla JSON, a FormData/XHR
      // idzie prawdziwym natywnym fetch bez ingerencji Capacitora.
      enabled: false,
    },
    Keyboard: {
      resize: 'none',
      resizeOnFullScreen: true,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: loadEnvVar('VITE_GOOGLE_CLIENT_ID'),
      forceCodeForRefreshToken: true,
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#ffffff',
    },
  },
  ios: {
    backgroundColor: '#F4F4F9'
  }
};

export default config;