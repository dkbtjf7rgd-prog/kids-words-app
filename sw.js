// Kids Words — service worker.
// Страница всегда берётся из сети (чтобы обновления с GitHub сразу доходили до телефона),
// а сохранённая копия используется только без интернета.
const CACHE_NAME = 'kids-words-v3';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Внешние запросы (база, перевод, словарь, шрифты) не трогаем
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  // Сначала сеть, при ошибке — копия из кэша
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
      )
  );
});
