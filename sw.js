const CACHE_NAME = 'deudores-pro-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  // Recursos externos que queremos cachear
  'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700;14..32,800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalación: precacheamos los recursos esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cache abierto');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activación: limpiamos cachés viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia de caché: cache-first, luego red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Devuelve la respuesta cacheada si existe
      if (cachedResponse) {
        return cachedResponse;
      }
      // Si no está en caché, intenta obtenerla de la red
      return fetch(event.request).then((networkResponse) => {
        // Clona la respuesta y la guarda en caché para futuras visitas offline
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Si falla la red y no hay caché, podrías devolver una página de error
        // Por ahora, simplemente devolvemos una respuesta vacía
        return new Response('', { status: 504, statusText: 'Sin conexión' });
      });
    })
  );
});