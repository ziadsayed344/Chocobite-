// Never serve private shared data or RPC results from a cache.
const C='chocobite-original-shared-20261125-r18';
const F=['./','index.html','connect.html','manifest.json','customer.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F))));
// Only an explicit update click activates over open pages.
self.addEventListener('message',e=>{if(e.data?.type==='CB_APPLY_UPDATE')self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(x=>x.startsWith('chocobite-')&&x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.includes('/rest/')||u.pathname.includes('/auth/')||u.pathname.includes('/__'))return;
 const bundled=F.some(f=>new URL(f,self.registration.scope).pathname===u.pathname);
 if(!bundled&&e.request.mode!=='navigate')return;
 // A controlling worker serves one complete release, never mixed updated scripts.
 e.respondWith(caches.open(C).then(async c=>{
  const lookup=e.request.mode==='navigate'?(u.pathname.endsWith('/connect.html')?'connect.html':'index.html'):e.request;
  if(e.request.mode==='navigate'){try{const live=await fetch(e.request,{cache:'no-store'});if(live.ok){await c.put(lookup,live.clone());return live;}}catch{}}
  const cached=await c.match(lookup,{ignoreSearch:true});
  return cached||fetch(e.request);
 }));
});
// CB_PENDING_PUSH_V1. Generic alerts only, independent of staff login.
async function cbPushReceipt(receipt,stage){
 if(!receipt||!/^[0-9a-f-]{36}$/.test(receipt.id||'')||!/^[0-9a-f-]{36}$/.test(receipt.token||''))return;
 try{await fetch('https://plklrbadozamzxprglmk.supabase.co/rest/v1/rpc/cb_push_receipt',{method:'POST',headers:{'Content-Type':'application/json',apikey:'sb_publishable_hXBwJQh9QYl0XtCIf0eMcQ_d8WhtJfk',Authorization:'Bearer sb_publishable_hXBwJQh9QYl0XtCIf0eMcQ_d8WhtJfk'},body:JSON.stringify({p_id:receipt.id,p_token:receipt.token,p_stage:stage})});}catch{}
}
self.addEventListener('push',event=>{
 event.waitUntil((async()=>{let d={};try{d=event.data?.json()||{}}catch{}
 const receipt=d.receipt;const received=cbPushReceipt(receipt,'received');const test=d.title==='Chocobite: اختبار التنبيه';const worker=d.kind==='worker';
 const at=Date.parse(d.created_at),known=Number.isFinite(at),delayed=known&&Date.now()-at>120000;const timing=known?' وقت تسجيل الطلب: '+new Date(at).toLocaleString('ar-EG',{timeZone:'Africa/Cairo',month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})+' بتوقيت القاهرة.':'';
 try{await self.registration.showNotification(test?'Chocobite: اختبار التنبيه':worker?'Chocobite: أوردر عامل جديد':'Chocobite: طلب عميل جديد',{body:(delayed?'تنبيه متأخر. ':'')+(test?'ده اختبار إشعار فقط، مش طلب ولا بيع.':worker?'اتسجل أوردر جديد من العامل. افتح حساب المالك.':'فيه طلب جديد مستني مراجعتك. افتح حساب المالك.')+(test?'':timing),timestamp:known?at:Date.now(),icon:new URL('icon-192.png',self.registration.scope).href,dir:'rtl',lang:'ar',tag:typeof d.tag==='string'?d.tag:'cb-order',renotify:true,vibrate:[250,100,250],data:{url:new URL(worker?'connect.html?orders=1':'connect.html?pending=1',self.registration.scope).href,receipt}});
 await Promise.all([received,cbPushReceipt(receipt,'display')]);}catch(error){const name=['NotAllowedError','TypeError','AbortError','InvalidStateError'].includes(error?.name)?error.name:'UnknownError';await Promise.all([received,cbPushReceipt(receipt,'display_error:'+name)]);}
 })());
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{await cbPushReceipt(event.notification.data?.receipt,'click');const workerUrl=new URL('connect.html?orders=1',self.registration.scope).href;const url=event.notification.data?.url===workerUrl?workerUrl:new URL('connect.html?pending=1',self.registration.scope).href;const list=await clients.matchAll({type:'window',includeUncontrolled:true});for(const c of list){if(c.url.startsWith(self.registration.scope)&&'focus'in c){await c.navigate(url);return c.focus();}}return clients.openWindow(url);})());});
