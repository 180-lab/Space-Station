import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept relative fetch calls to dynamically rewrite them for native Android APK / iOS builds
try {
  if (typeof window !== 'undefined' && window.location) {
    const urlParams = new URL(window.location.href).searchParams;
    if (urlParams.has('reset') || urlParams.has('clear') || urlParams.has('reset_backend') || urlParams.has('clear_backend')) {
      localStorage.removeItem('space_station_backend_url');
      console.log('[Connection Recovery] Cleared custom game server IP/URL via query parameters.');
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', cleanUrl);
    }
  }
} catch (error) {
  console.warn('[Connection Recovery] Bypassed parameter check:', error);
}

try {
  const originalFetch = window.fetch.bind(window);
  const customFetch = function (input: RequestInfo | URL, init?: RequestInit) {
    let urlStr = '';
    if (typeof input === 'string') {
      urlStr = input;
    } else if (input instanceof URL) {
      urlStr = input.pathname + input.search;
    } else if (input && typeof (input as any).url === 'string') {
      urlStr = (input as any).url;
    }

    const isAbsoluteUrl = urlStr.startsWith('http://') || urlStr.startsWith('https://') || urlStr.startsWith('//');
    if ((urlStr.startsWith('/api') || urlStr.includes('/api/')) && !isAbsoluteUrl) {
      // Determine if we are running inside a native mobile webview context
      const isNativeMobile = typeof window !== 'undefined' && (
        (window as any).Capacitor || 
        (window as any).AndroidBridge || 
        window.location.protocol === 'file:' ||
        window.location.protocol.startsWith('capacitor') ||
        window.location.origin.startsWith('capacitor') ||
        // If we are on localhost but not on port 3000, we are inside an emulator/webview (e.g. Capacitor's local web server on port 80/8100/etc.)
        (window.location.hostname === 'localhost' && window.location.port !== '3000') ||
        // If we have a mobile user agent and are not running on standard Cloud Run domain
        (!window.location.hostname.endsWith('.run.app') && /android|iphone|ipad|ipod|wv|capacitor/i.test(navigator.userAgent))
      );

      const envVars = (import.meta as any).env || {};
      const fallbackCloudUrl = envVars.VITE_API_BASE_URL || 'https://space-station-commander.onrender.com';
      const cleanCloudBase = fallbackCloudUrl.endsWith('/') ? fallbackCloudUrl.slice(0, -1) : fallbackCloudUrl;

      // Helper function to dynamically add skip-warning headers for tunnels
      const applyTunnelBypasses = (headersObj: Headers, url: string) => {
        if (url.includes('ngrok')) {
          headersObj.set('ngrok-skip-browser-warning', 'true');
        }
        if (url.includes('loca.lt') || url.includes('localtunnel')) {
          headersObj.set('Bypass-Tunnel-Reminder', 'true');
        }
      };

      const customUrl = localStorage.getItem('space_station_backend_url');
      if (customUrl) {
        const cleanApiBase = customUrl.endsWith('/') ? customUrl.slice(0, -1) : customUrl;
        const finalUrl = cleanApiBase + (urlStr.startsWith('/') ? urlStr : '/' + urlStr);
        console.log(`[Global Fetch Interceptor] Custom URL Rewrite: ${urlStr} -> ${finalUrl}`);
        
        let targetRequest: RequestInfo | URL = finalUrl;
        if (input instanceof Request) {
          targetRequest = new Request(finalUrl, input);
        }
        
        // Setup short timeout (e.g. 3.5s) using AbortController so dead or slow tunnels do not freeze the UI/app
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn(`[Fetch Interceptor] Request to custom local URL timed out after 3500ms: ${finalUrl}`);
          controller.abort();
        }, 3500);

        let updatedInit = init || {};
        const headers = new Headers(updatedInit.headers || {});
        applyTunnelBypasses(headers, finalUrl);
        updatedInit = { ...updatedInit, headers, signal: controller.signal };
        
        // Dynamic handler for active connection failures/errors to restore functionality on device
        const runFallback = () => {
          if (isNativeMobile) {
            const fallbackUrl = cleanCloudBase + (urlStr.startsWith('/') ? urlStr : '/' + urlStr);
            console.log(`[Fetch Interceptor Native Fallback] Routing failed custom endpoint to hosted cloud server: ${fallbackUrl}`);
            let fallbackReq: RequestInfo | URL = fallbackUrl;
            if (input instanceof Request) {
              fallbackReq = new Request(fallbackUrl, input);
            }
            const fallbackHeaders = new Headers(init?.headers || {});
            applyTunnelBypasses(fallbackHeaders, fallbackUrl);
            const fallbackInit = { ...(init || {}), headers: fallbackHeaders };
            return originalFetch(fallbackReq, fallbackInit);
          } else {
            return originalFetch(input, init);
          }
        };

        return originalFetch(targetRequest, updatedInit).then(response => {
          clearTimeout(timeoutId);
          if (response.status === 502 || response.status === 503 || response.status === 504) {
            console.warn(`[Fetch Interceptor] Custom gateway error (${response.status}) on ${finalUrl}. Invoking fallback.`);
            return runFallback();
          }
          return response;
        }).catch(err => {
          clearTimeout(timeoutId);
          console.warn(`[Fetch Interceptor] Connection failed or timed out to custom URL ${finalUrl}:`, err);
          return runFallback();
        });
      }

      // Only prepend the hosted backend URL if we are running on a native device/emulator
      if (isNativeMobile) {
        const finalUrl = cleanCloudBase + (urlStr.startsWith('/') ? urlStr : '/' + urlStr);
        console.log(`[Native Fetch Interceptor] Rewriting endpoint: ${urlStr} -> ${finalUrl}`);
        
        let targetRequest: RequestInfo | URL = finalUrl;
        if (input instanceof Request) {
          targetRequest = new Request(finalUrl, input);
        }
        
        let updatedInit = init || {};
        const headers = new Headers(updatedInit.headers || {});
        applyTunnelBypasses(headers, finalUrl);
        updatedInit = { ...updatedInit, headers };
        
        return originalFetch(targetRequest, updatedInit);
      }
    }
    return originalFetch(input, init);
  };

  Object.defineProperty(window, 'fetch', {
    value: customFetch,
    writable: true,
    configurable: true,
  });
} catch (error) {
  console.warn('[Fetch Interceptor] Gracefully bypassed window.fetch interception:', error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Register Service Worker for Progressive Web App (PWA) and Trusted Web Activity (TWA) support
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('[Service Worker] PWA/TWA Service Worker registered side-by-side with Scope:', reg.scope))
        .catch((err) => console.warn('[Service Worker] PWA/TWA Service Worker register bypassed:', err));
    });
  }
} catch (error) {
  console.warn('[Service Worker] Initialization failed:', error);
}

