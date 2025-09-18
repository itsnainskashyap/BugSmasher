const CACHE_NAME = 'onionpay-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event with navigation fallback
self.addEventListener('fetch', event => {
  // Handle navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/');
      })
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notification event
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  let notificationData = {};
  
  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData = {
        title: 'OnionPay Notification',
        body: event.data.text() || 'New payment update'
      };
    }
  }

  const options = {
    body: notificationData.body || 'New payment notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    data: notificationData.data || {},
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ],
    tag: 'payment-notification',
    renotify: true,
    requireInteraction: true
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'OnionPay Payment Update',
      options
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('Notification click received:', event);
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action !== 'close') {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync for offline payments
self.addEventListener('sync', event => {
  if (event.tag === 'payment-sync') {
    event.waitUntil(
      // Sync pending payments when back online
      syncPendingPayments()
    );
  }
});

async function syncPendingPayments() {
  try {
    // Get pending payments from IndexedDB and sync
    console.log('Syncing pending payments...');
  } catch (error) {
    console.error('Error syncing payments:', error);
  }
}