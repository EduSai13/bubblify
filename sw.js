// Network first, cache fallback: fresh files when online, full offline use otherwise.
const C='bubblify-v6',F=['./','index.html','css/styles.css','js/config.js','js/store.js','js/sheet.js','js/views.js','js/sheetui.js','js/results.js','js/lists.js','js/quiz.js','js/sync.js','js/splash.js','js/scanner.js','js/scanui.js','js/app.js','fonts/limelight-latin-400-normal.woff2','fonts/nova-mono-latin-400-normal.woff2','manifest.webmanifest','icon-192.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request)))});
