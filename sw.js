// Never serve private shared data or RPC results from a cache.
const C='chocobite-original-shared-20261123-r3';
const F=['./','index.html','connect.html','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F))));
// A new version does not force itself over an active sale. Reload is the version boundary.
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(x=>x.startsWith('chocobite-')&&x!==C).map(x=>caches.delete(x))))));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.includes('/rest/')||u.pathname.includes('/auth/')||u.pathname.includes('/__'))return;
 const bundled=F.some(f=>new URL(f,self.registration.scope).pathname===u.pathname);
 if(!bundled&&e.request.mode!=='navigate')return;
 // A controlling worker serves one complete release, never mixed updated scripts.
 e.respondWith(caches.open(C).then(async c=>{
  const lookup=e.request.mode==='navigate'?(u.pathname.endsWith('/connect.html')?'connect.html':'index.html'):e.request;
  const cached=await c.match(lookup,{ignoreSearch:true});
  return cached||fetch(e.request);
 }));
});
