const CACHE_NAME = 'kasuku-cache-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://i.postimg.cc/8cYFbspt/Kasuku-logo.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);

    // Moodle offline package strategy: Cache first, then network
    if (url.pathname.startsWith('/uploads/moodle/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                const cachedResponse = await cache.match(event.request);
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                try {
                    const networkResponse = await fetch(event.request);
                    if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                        const responseToCache = networkResponse.clone();
                        cache.put(event.request, responseToCache);
                    }
                    return networkResponse;
                } catch (error) {
                    console.error('Fetch failed for Moodle package:', error);
                    // Optionally, return a fallback asset
                }
            })
        );
        return;
    }

    // Default strategy for other assets
    event.respondWith(
      caches.match(event.request).then((response) => {
        if (response) {
          return response; // Return from cache
        }
        
        return fetch(event.request).then((response) => {
            if (!response || (response.status !== 200 && response.type !== 'opaque')) {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          }
        );
      })
    );
});
