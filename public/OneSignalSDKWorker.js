try {
  importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
} catch (e) {
  console.warn("OneSignal SW importScripts notice:", e);
}

const CACHE_VERSION = new URL(location).searchParams.get('v') ? `cbt-v${new URL(location).searchParams.get('v')}` : 'cbt-v1.2.0';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.jpg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION && cacheName.startsWith('cbt-')) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Cache Strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-http
  if (!url.protocol.startsWith('http')) return;
  
  // Version File: Network Only
  if (url.pathname.endsWith('app_config.json')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // API & Supabase requests: Network First (GET only for caching)
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(event.request));
    return;
  }
  
  // HTML & Navigation & Manifest: Network First
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname.endsWith('manifest.json')) {
    event.respondWith(networkFirst(event.request));
    return;
  }
  
  // JS & CSS: Stale While Revalidate
  if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(staleWhileRevalidate(event.request));
    return;
  }
  
  // Image: Cache First
  if (event.request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp)$/i)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }
  
  // Default fallback (Network First)
  event.respondWith(networkFirst(event.request));
});

// Strategy: Network First
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    if (request.mode === 'navigate') {
      const htmlCached = await caches.match('/index.html') || await caches.match('/');
      if (htmlCached) return htmlCached;
    }
    throw err;
  }
}

// Strategy: Cache First
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (err) {
    throw err;
  }
}

// Strategy: Stale While Revalidate
async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(err => console.warn('Fetch failed in staleWhileRevalidate', err));
  
  return cachedResponse || fetchPromise;
}

// Periodic Background Sync Handler (Every 15 minutes)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-rapor-cache' || event.tag === 'update-rapor-cache') {
    event.waitUntil(refreshCacheInBackground());
  }
});

async function refreshCacheInBackground() {
  try {
    const cache = await caches.open(CACHE_VERSION);
    const criticalUrls = ['/', '/index.html', '/manifest.json'];
    await Promise.all(
      criticalUrls.map(async (url) => {
        try {
          const res = await fetch(url, { cache: 'no-cache' });
          if (res.ok) {
            await cache.put(url, res);
          }
        } catch (e) {
          console.warn('Periodic background fetch error:', e);
        }
      })
    );
    console.log('SW: Periodic background cache updated successfully (15-min cycle).');
  } catch (err) {
    console.warn('SW: Error in refreshCacheInBackground:', err);
  }
}

// Push & Notification Event Handlers
self.addEventListener('push', (event) => {
  let data = { title: 'Rapor Kita Notification', body: 'Ada pembaruan terbaru di portal Rapor Kita.', url: '/' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'Pembaruan jadwal, presensi, & evaluasi siswa.',
    icon: 'https://img.icons8.com/fluency/192/000000/report-card.png',
    badge: 'https://img.icons8.com/fluency/192/000000/report-card.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Buka Rapor' },
      { action: 'close', title: 'Tutup' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Rapor Kita Portal', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let client of windowClients) {
        if (client.url.includes(location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
