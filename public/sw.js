const CACHE_NAME = 'pulsetrack-v3';
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(['/']))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(caches.open(CACHE_NAME).then(async c => { const cached = await c.match(e.request); try { const fresh = await fetch(e.request); if (fresh.ok) c.put(e.request, fresh.clone()); return fresh; } catch { return cached || c.match('/'); } }));
});
