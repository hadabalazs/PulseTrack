const CACHE_NAME = 'pulsetrack-v5-medal-metals';
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(['/']))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('pulsetrack-') && k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(caches.open(CACHE_NAME).then(async c => {
    const cached = await c.match(e.request);
    if (cached && /\/(assets|medals)\//.test(new URL(e.request.url).pathname)) return cached;
    try { const fresh = await fetch(e.request); if (fresh.ok) await c.put(e.request, fresh.clone()); return fresh; }
    catch {
      if (cached) return cached;
      // Never return HTML for a missing 3D chunk; allow the image fallback to handle it.
      return e.request.mode === 'navigate' ? (await c.match('/')) || Response.error() : Response.error();
    }
  }));
});
