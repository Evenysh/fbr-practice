const APP_SHELL_CACHE = 'app-shell-v2';
const DYNAMIC_CACHE = 'dynamic-content-v1';

const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/icons/apple-touch-icon-152x152.png',
  '/icons/icon-32x32.png',
  '/icons/icon-48x48.png',
  '/icons/icon-64x64.png',
  '/icons/icon-128x128.png',
  '/icons/icon-256x256.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== APP_SHELL_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (url.origin !== location.origin) return;

  if (url.pathname.startsWith('/content/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        })
        .catch(() =>
          caches.match(event.request).then(
            (cachedResponse) => cachedResponse || caches.match('/content/home.html')
          )
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  const notification = event.notification;
  const action = event.action;

  if (action === 'snooze') {
    const reminderId = notification.data?.reminderId;

    event.waitUntil(
      fetch(`/snooze?reminderId=${reminderId}`, { method: 'POST' })
        .then(() => notification.close())
        .catch((err) => console.error('Snooze failed:', err))
    );
  } else {
    notification.close();
  }
});

self.addEventListener('push', (event) => {
  let data = { title: 'Новое уведомление', body: '', reminderId: null };

  if (event.data) {
    data = event.data.json();
  }

  const options = {
    body: data.body,
    icon: '/icons/icon-128x128.png',
    badge: '/icons/icon-48x48.png',
    data: { reminderId: data.reminderId }
  };

  if (data.reminderId) {
    options.actions = [
      { action: 'snooze', title: 'Отложить на 5 минут' }
    ];
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});