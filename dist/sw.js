// Service Worker untuk Web Push Notifications

const CACHE_NAME = 'raporkita-cache-v2';

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  let title = '📢 Notifikasi Rapor Kita';
  let options = {
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Buka Aplikasi'
      },
      {
        action: 'close',
        title: 'Tutup'
      }
    ]
  };

  if (event.data) {
    try {
      const data = event.data.json();
      title = data.title || title;
      options = {
        ...options,
        body: data.body || 'Ada pembaruan terbaru di aplikasi Anda.',
        tag: data.tag || 'default',
        data: data.data || {}
      };
    } catch (e) {
      // Jika bukan JSON, gunakan text
      options.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag);
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open the app when user clicks notification
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if app is already open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === '/' || client.url.includes('/')) {
          return client.focus();
        }
      }
      // If not open, open new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});

// Fetch event - for offline support
self.addEventListener('fetch', (event) => {
  // Hanya cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip API calls
  if (event.request.url.includes('/api/') || event.request.url.includes('/db/')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => cache.match(event.request)).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Return offline page or cached response
          return new Response('Offline - cached version not available');
        });
    })
  );
});

// Periodic Background Sync - untuk sync rapor data setiap 15 menit
self.addEventListener('periodicsync', (event) => {
  console.log('Periodic sync triggered:', event.tag);

  if (event.tag === 'sync-rapor-cache') {
    event.waitUntil(
      self.clients
        .matchAll({ type: 'window', includeUncontrolled: true })
        .then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: 'PERIODIC_SYNC',
              tag: 'sync-rapor-cache'
            });
          });
        })
    );
  }
});
