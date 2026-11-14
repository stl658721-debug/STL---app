const CACHE = 'stl-v2.0.0';
const APP_SHELL = [
  './', './index.html', './courier.html', './manifest.json', './icon.svg',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(APP_SHELL.map(u => c.add(u).catch(()=>{}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const net = fetch(e.request).then(res => {
        if(res && res.ok){
          const cl = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, cl));
        }
        return res;
      }).catch(()=>null);
      if(cached){ e.waitUntil(net); return cached; }
      return net.then(res => {
        if(res) return res;
        if(e.request.mode === 'navigate') return caches.match('./index.html');
        return new Response('Offline', {status:503});
      });
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({type:'window', includeUncontrolled:true}).then(cls => {
      for(const c of cls) if('focus' in c) return c.focus();
      if(self.clients.openWindow) return self.clients.openWindow('./index.html');
    })
  );
});
