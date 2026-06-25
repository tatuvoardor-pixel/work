/* WORK Service Worker v0.2 */
const CACHE='work-v0.2';
const FILES=['./','./index.html','./bio-bridge.js'];

self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const url=e.request.url;
  const isCodigo=url.endsWith('.html')||url.endsWith('.js')||url.endsWith('/');
  if(isCodigo){
    e.respondWith(
      fetch(e.request).then(r=>{
        const c=r.clone();
        caches.open(CACHE).then(cache=>cache.put(e.request,c));
        return r;
      }).catch(()=>caches.match(e.request))
    );
  }else{
    e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));
  }
});
