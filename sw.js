const CACHE_NAME = 'kids-words-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Установка SW
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Активация и очистка старого кэша
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. ИГНОРИРУЕМ внешние запросы (API, CDN)
  if (url.origin !== location.origin) {
    return;
  }

  // 2. ИГНОРИРУЕМ запросы к API Supabase
  if (url.pathname.startsWith('/rest/v1') || url.pathname.startsWith('/auth/v1')) {
    return;
  }

  // 3. Стратегия "Cache First" для статики
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
