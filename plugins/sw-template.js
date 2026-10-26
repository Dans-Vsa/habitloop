/* habitloop service worker — generated at build time by plugins/service-worker.ts. */
const CACHE_PREFIX = 'habitloop-'
const CACHE = CACHE_PREFIX + __CACHE_VERSION__
const PRECACHE = __PRECACHE_FILES__

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    // Network first so a new deploy shows up, cached app shell when offline.
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(new URL('index.html', self.registration.scope).href).then((cached) => cached || Response.error()),
      ),
    )
    return
  }

  // Build assets have hashed names, so cache first is safe. ignoreVary: dev and
  // preview servers send `Vary: Origin`, which would make module scripts
  // (CORS requests with an Origin header) miss the precached copies.
  event.respondWith(
    caches.match(request, { ignoreVary: true }).then(
      (cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
          }
          return response
        }),
    ),
  )
})
