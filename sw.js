/**
 * sw.js — service worker: ทำให้แอปเปิดได้แม้ไม่มีเน็ต
 *
 * กลยุทธ์: cache-first สำหรับไฟล์แอป (ไฟล์ static ทั้งหมด)
 * ไม่มีการแคชข้อมูลผู้ใช้ — ข้อมูลอยู่ใน localStorage ไม่เคยผ่าน network เลย
 */

/**
 * ขึ้นเลขนี้ทุกครั้งที่แก้ไฟล์ใน ASSETS
 * ถ้าไม่ขึ้น ผู้ใช้เดิมจะยังได้ไฟล์เก่าจากแคชต่อไปเพราะกลยุทธ์เป็น cache-first
 */
const CACHE = 'daisydays-v3';

const ASSETS = [
  '.',
  'index.html',
  'css/app.css',
  'js/app.js',
  'js/store.js',
  'js/cycle.js',
  'js/data.js',
  'manifest.json',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // ไฟล์ที่โหลดไม่ได้ไม่ควรทำให้ติดตั้งล้มทั้งชุด
      .then((c) => Promise.allSettled(ASSETS.map((u) => c.add(new Request(u, { cache: 'reload' })))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // ฟอนต์จาก Google ปล่อยให้เบราว์เซอร์จัดการ

  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) {
        // คืนของในแคชทันที แล้วอัปเดตเบื้องหลัง
        fetch(req).then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
        }).catch(() => { /* ออฟไลน์ — ไม่เป็นไร */ });
        return hit;
      }
      return fetch(req)
        .then((res) => {
          if (res && res.ok) caches.open(CACHE).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(() => caches.match('index.html')); // ขอหน้าอื่นตอนออฟไลน์ → คืนหน้าแอป
    }),
  );
});
