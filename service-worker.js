// ===== 버전 관리 캐시 이름
const CACHE_VERSION = "v6";
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

// fetch 이벤트: 네트워크 우선 → 캐시 fallback
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // 네트워크 성공하면 캐시에 업데이트
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 가져오기
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // 캐시에도 없으면 오프라인 페이지로
          return caches.match(`./offline.html?v=${CACHE_VERSION}`);
        });
      })
  );
});