const CACHE_NAME = 'space-station-v1';
const SESSION_CACHE_NAME = 'moonbase-user-session';

// Active immediate upgrade upon installation
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      // Start background poll on activation
      startBackgroundPoll();
    })
  );
});

// Passive fetch handler allowing full online multiplayer network socket and fetch transparency
// Bypasses non-GET methods and /api/ requests to prevent body loss bugs on modern WebView/Chrome
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }
  event.respondWith(fetch(event.request));
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SET_USER_ID') {
    const userId = event.data.userId;
    event.waitUntil(
      caches.open(SESSION_CACHE_NAME).then((cache) => {
        return cache.put('/userId', new Response(userId));
      }).then(() => {
        console.log('[SW] Successfully stored user ID in cache:', userId);
        startBackgroundPoll();
      })
    );
  }
});

let pollTimeout = null;
let knownAttackIds = new Set();

async function getUserIdFromCache() {
  try {
    const cache = await caches.open(SESSION_CACHE_NAME);
    const response = await cache.match('/userId');
    if (response) {
      const text = await response.text();
      return text ? text.trim() : null;
    }
  } catch (e) {
    console.warn('[SW] Error reading user ID cache:', e);
  }
  return null;
}

async function checkIncomingAttacks(userId) {
  try {
    // Call the server state endpoint
    const res = await fetch('/api/state', {
      headers: {
        'x-user-id': userId,
        'x-background-poll': 'true'
      }
    });
    
    if (!res.ok) {
      if (res.status === 401 || res.status === 404) {
        // Unauthenticated, clean up user ID
        const cache = await caches.open(SESSION_CACHE_NAME);
        await cache.delete('/userId');
      }
      return;
    }
    
    const data = await res.json();
    if (!data || !data.player || !data.fleets) return;
    
    const player = data.player;
    const fleets = data.fleets;
    const serverTime = data.serverTime || Date.now();
    const myPlanetIds = player.planets.map(p => p.id);
    
    // Find active attacks targeting player's planets or user ID
    const activeIncomingAttacks = fleets.filter(f => 
      f.missionType === 'attack' && 
      !f.isReturning && 
      f.arrivesAt > serverTime &&
      (f.targetId === player.id || myPlanetIds.includes(f.targetId))
    );
    
    if (activeIncomingAttacks.length === 0) {
      // Clear tracking if there are no active attacks
      knownAttackIds.clear();
      return;
    }
    
    // Check if we have visible windows open
    const clientsList = await self.clients.matchAll({ type: 'window' });
    const hasActiveVisibleClient = clientsList.some(c => c.visibilityState === 'visible');
    
    // If the user has a tab open and active, let the local React state show the toast and sound.
    if (hasActiveVisibleClient) {
      activeIncomingAttacks.forEach(f => knownAttackIds.add(f.id));
      return;
    }
    
    // Otherwise, the user is NOT actively in the game (tab is in background, minimized, or closed entirely)
    // We will show a system push notification!
    for (const f of activeIncomingAttacks) {
      if (!knownAttackIds.has(f.id)) {
        knownAttackIds.add(f.id);
        
        const targetPlanet = player.planets.find(p => p.id === f.targetId);
        const pName = targetPlanet ? targetPlanet.name : (f.targetName || "Station Core");
        const remainingSec = Math.round((f.arrivesAt - serverTime) / 1000);
        
        const title = `⚠️ TACTICAL ALERT!`;
        const body = `Hostile fleet from ${f.senderName} detected on attack trajectory to your station ${pName}! Arriving in ${remainingSec}s!`;
        
        await self.registration.showNotification(title, {
          body,
          icon: '/favicon.png',
          badge: '/favicon.png',
          tag: `attack-${f.id}`,
          renotify: true,
          requireInteraction: true,
          vibrate: [200, 100, 200, 100, 300]
        });
      }
    }
  } catch (err) {
    console.warn('[SW Background Attack Checker] Error:', err);
  }
}

function startBackgroundPoll() {
  if (pollTimeout) return;
  
  const poll = async () => {
    try {
      const userId = await getUserIdFromCache();
      if (userId) {
        await checkIncomingAttacks(userId);
      }
    } catch (e) {
      console.warn('[SW Background Poll] Loop error:', e);
    }
    // Poll every 8 seconds for real-time responsiveness when they are out of the game
    pollTimeout = setTimeout(poll, 8000);
  };
  
  poll();
}

// Start immediately on script load as a fallback
startBackgroundPoll();
