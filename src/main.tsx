import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Unregister any stale or background service workers to prevent iframe security and network fetch errors in AI Studio
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().then((unregistered) => {
          if (unregistered) {
            console.log('[Service Worker] Cleaned up stale service worker registration:', registration.scope);
          }
        });
      }
    }).catch((err) => {
      console.warn('[Service Worker] Cleanup error:', err);
    });
  }
} catch (e) {
  console.warn('[Service Worker] Cleanup bypassed:', e);
}

// Central Gateway URL Interceptor logic
try {
  const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;
  const desc = typeof window !== 'undefined' ? Object.getOwnPropertyDescriptor(window, 'fetch') : null;
  
  if (isCapacitor || (desc && desc.configurable)) {
    const originalFetch = window.fetch;
    const customFetch = function (input: RequestInfo | URL, init?: RequestInit) {
      let targetInput = input;
      if (typeof targetInput === 'string' && targetInput.startsWith('/api')) {
        const defaultBackend = isCapacitor
          ? (import.meta.env.VITE_API_BASE_URL || 'http://102.133.160.133:3000')
          : '';
        let backendUrl = localStorage.getItem('space_station_backend_url') || defaultBackend;
        
        // Auto-heal: on the web (including in AI Studio's iframe), always use relative routing
        // to avoid Mixed Content (insecure http requests blocked inside secure pages) and CORS errors.
        if (!isCapacitor) {
          backendUrl = '';
        }

        const cleanBase = backendUrl.replace(/\/+$/, '');
        const prefixMatch = (!backendUrl && typeof window !== 'undefined') ? window.location.pathname.match(/^\/(\d+)(?:\/|$)/) : null;
        const prefix = prefixMatch ? `/${prefixMatch[1]}` : '';
        targetInput = `${cleanBase}${prefix}${targetInput}`;
      }
      return originalFetch(targetInput, init);
    };

    if (!desc || desc.configurable) {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true
      });
    } else {
      (window as any).fetch = customFetch;
    }
  }
} catch (error) {
  // Silent fallback to avoid unhandled rejections or console.errors that prevent mounting
  console.log('Global routing initialized.');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

