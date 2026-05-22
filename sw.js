const CACHE_NAME = 'freightledger-v1';
const ASSETS = [
  'index.html',
  'manifest.json',
  'icon-512.svg',
  'icon-192.svg',
  'icon-maskable.svg'
];

// Install Service Worker and Cache Core Assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate and Clean Up Old Cache Profiles
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept Network Requests with Offline Offline Fallback Handling
self.addEventListener('fetch', e => {
  // Only intercept standard web requests (http/https)
  if (!e.request.url.startsWith(self.location.origin)) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // If valid network response, clone it to dynamic storage
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network is down, look for local asset file match
        return caches.match(e.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fall back completely to main index dashboard if route mismatches offline
          return caches.match('index.html');
        });
      })
  );
});
