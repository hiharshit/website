const CACHE_NAME = 'harshitsharma-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/404.html',
  '/css/style.min.css',
  '/js/main.js',
  '/js/layout.js',
  '/js/blog-data.js',
  '/js/theme-init.js',
  '/assets/fonts/inter-v20-latin-regular.woff2',
  '/assets/fonts/inter-v20-latin-500.woff2',
  '/assets/fonts/inter-v20-latin-600.woff2',
  '/assets/fonts/instrument-serif-v5-latin-regular.woff2',
  '/assets/fonts/instrument-serif-v5-latin-italic.woff2',
  '/assets/icons/favicon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  const isHtmlRequest = event.request.headers.get('accept')?.includes('text/html') ||
                        url.pathname.endsWith('.html') ||
                        url.pathname === '/' ||
                        !url.pathname.includes('.');

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetched = fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        } else if (response.status === 404 && isHtmlRequest) {
          return caches.match('/404.html');
        }
        return response;
      }).catch(() => {
        if (isHtmlRequest && !cached) {
          return caches.match('/404.html');
        }
        return cached;
      });
      
      return cached || fetched;
    })
  );
});

