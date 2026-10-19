const VERSION = 'dov-1.3.0';
const FILES = ['./','index.html','style.css','app.js','data.js','manifest.webmanifest',
  'haffer-400.woff2','haffer-700.woff2',
  'logo-emerald.png','logo-white.png','icon-192.png','icon-512.png',
  'ico-Sebenapojeni.png','ico-Empatie.png','ico-Uprimnost.png',
  'ico-Navigovani_v_konverzaci.png','ico-Prace_s_konfliktem.png','ico-Interdependence.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(r => {
      const copy = r.clone();
      caches.open(VERSION).then(c => c.put(e.request, copy));
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
