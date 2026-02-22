
const CACHE_NAME = 'ramadhan-tracker-v5';
const RUNTIME_CACHE = 'runtime-cache-v1';

// URL yang harus di-cache di awal
const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1'
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
      caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Strategi Caching Otomatis)
self.addEventListener('fetch', (event) => {
  // Hanya proses request GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. API Caching (Stale-While-Revalidate Strategy)
  // Cache API Al-Quran dan Aladhan agar bisa offline
  if (url.hostname.includes('api.alquran.cloud') || url.hostname.includes('api.aladhan.com')) {
      event.respondWith(
          caches.open(RUNTIME_CACHE).then(cache => {
              return cache.match(event.request).then(cachedResponse => {
                  const fetchPromise = fetch(event.request).then(networkResponse => {
                      if (networkResponse.ok) {
                           cache.put(event.request, networkResponse.clone());
                      }
                      return networkResponse;
                  }).catch(() => {
                      // Jika fetch gagal (offline), kembalikan cachedResponse (bisa undefined jika belum pernah cache)
                      return cachedResponse; 
                  });
                  // Jika ada di cache, kembalikan cache dulu, lalu update di background (stale-while-revalidate)
                  // Namun untuk API Quran text yang statis, Cache-First lebih baik untuk performa
                  if(url.hostname.includes('api.alquran.cloud')) {
                      return cachedResponse || fetchPromise;
                  }
                  
                  // Untuk jadwal sholat, lebih baik Network-First atau Stale-While-Revalidate
                  return fetchPromise || cachedResponse;
              })
          })
      );
      return;
  }

  // 2. Handle Request Navigasi (HTML/Halaman Utama)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./index.html') || caches.match('/index.html');
        })
    );
    return;
  }

  // 3. Handle Aset Statis (Cache First)
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) return cachedResponse;
        
        return fetch(event.request).then(response => {
             // Cache opaque response (CDN) dan valid response
             if (!response || (response.status !== 200 && response.type !== 'opaque')) {
                 return response;
             }
             const responseClone = response.clone();
             caches.open(CACHE_NAME).then(cache => {
                 cache.put(event.request, responseClone);
             });
             return response;
        });
    })
  );
});
