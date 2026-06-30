const CACHE_NAME = 'space-station-v1';

// Active immediate upgrade upon installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Passive fetch handler allowing full online multiplayer network socket and fetch transparency
// Bypasses non-GET methods and /api/ requests to prevent body loss bugs on modern WebView/Chrome
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }
  event.respondWith(fetch(event.request));
});
