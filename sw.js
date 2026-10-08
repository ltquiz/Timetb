const CACHE_NAME='9a-timetable-v5';
const APP_ROOT=new URL('./',self.registration.scope);
const APP_SHELL=[
 APP_ROOT.href,
 new URL('index.html',APP_ROOT).href,
 new URL('manifest.json',APP_ROOT).href,
 new URL('icons/icon-192.png',APP_ROOT).href,
 new URL('icons/icon-512.png',APP_ROOT).href
];

self.addEventListener('install',event=>{
    event.waitUntil((async()=>{
        const cache=await caches.open(CACHE_NAME);
        await cache.addAll(APP_SHELL);
        await self.skipWaiting();
    })());
});

self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(key=>key.startsWith('9a-timetable-')&&key!==CACHE_NAME).map(key=>caches.delete(key)));
  await self.clients.claim();
 })());
});

self.addEventListener('fetch',event=>{
 const request=event.request;
 const requestUrl=new URL(request.url);
 if(request.method!=='GET'||requestUrl.origin!==self.location.origin)return;

 event.respondWith((async()=>{
  const cache=await caches.open(CACHE_NAME);
  if(request.mode==='navigate'){
   try{
    const response=await fetch(request);
    if(response.ok)await cache.put(request,response.clone());
    return response;
   }catch{
    const fallback=await cache.match(request,{ignoreSearch:true})||await cache.match(APP_ROOT.href);
    return fallback||new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><body><h1>You are offline</h1><p>Reconnect to load the timetable.</p></body></html>',{
     status:503,
     headers:{'Content-Type':'text/html; charset=utf-8'}
    });
   }
  }

  const cached=await cache.match(request,{ignoreSearch:true});
  if(cached)return cached;
  try{
   const response=await fetch(request);
   if(response.ok)await cache.put(request,response.clone());
   return response;
  }catch{
   return new Response('',{status:504,statusText:'Gateway Timeout'});
  }
 })());
});
