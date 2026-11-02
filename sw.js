/* KTN POS – service worker: ทำให้เปิดแอปได้แม้ไม่มีอินเทอร์เน็ต */
const CACHE='ktn-pos-v9';
const SHELL=['./','./index.html','./manifest.json','./icon-180.png','./icon-192.png','./icon-512.png','./order.html',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(SHELL.map(u=>c.add(new Request(u,{mode:u.startsWith('http')?'cors':'same-origin'})).catch(()=>{})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url);
  // ข้อมูลจาก Google Apps Script ต้องสดเสมอ ไม่เก็บแคช
  if(url.hostname.includes('script.google')||url.hostname.includes('googleusercontent')) return;
  // หน้าแอป: ใช้เน็ตก่อน (ได้เวอร์ชันใหม่) ถ้าออฟไลน์ใช้แคช
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(r=>{const cp=r.clone();caches.open(CACHE).then(c=>c.put('./index.html',cp));return r}).catch(()=>caches.match('./index.html')));
    return;
  }
  // ไฟล์อื่น (ฟอนต์, ไลบรารี QR, ไอคอน): ใช้แคชก่อน แล้วอัปเดตเบื้องหลัง
  e.respondWith(caches.match(req).then(hit=>{
    const net=fetch(req).then(r=>{if(r&&(r.ok||r.type==='opaque')){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp))}return r}).catch(()=>hit);
    return hit||net;
  }));
});
