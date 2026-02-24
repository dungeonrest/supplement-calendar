// ===== 버전 관리 캐시 이름
const CACHE_VERSION = "v11";
const CACHE_NAME = `supplement-calendar-cache-${CACHE_VERSION}`;

// ===== 설치 시 반드시 캐싱할 필수 리소스
const ASSETS_TO_PRECACHE = [
  "./",
  "/index.html",
  "/offline.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/icons/192.png",
  "/icons/512.png"
  ];

// — 설치 (install) 이벤트 —
// 핵심 리소스를 미리 캐싱
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_PRECACHE))
  );
});

// — 활성화 (activate) 이벤트 —
// 이전 캐시를 제거하고 새로운 버전 적용
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // 네비게이션 요청만 오프라인 fallback 대상으로
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/offline.html");
      })
    );
    return;
  }

  // CSS/JS/이미지 등 나머지는 기존 캐시/네트워크 흐름 유지
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return null; // 네트워크와 캐시 둘 다 없으면 null
        });
      })
  );
});