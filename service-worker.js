// ===== 버전 관리 캐시 이름
const CACHE_VERSION = "v5";
const CACHE_NAME = `supplement-calendar-cache-${CACHE_VERSION}`;

// ===== 설치 시 반드시 캐싱할 필수 리소스
const ASSETS_TO_PRECACHE = [
  "./",
  "index.html",
  "offline.html",
  "style.css",
  "script.js",
  ".manifest.json",
  "icons/192.png",
  "icons/512.png"
  ];

// — 설치 (install) 이벤트 —
// 핵심 리소스를 미리 캐싱
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_PRECACHE))
      .then(() => self.skipWaiting())
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

// — fetch 이벤트 —
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cached) => {
        if (cached) return cached;

        return fetch(event.request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return caches.match("./offline.html");
            }
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            return response;
          })
          .catch(() => {
            // 네트워크도 실패하면 offline.html 리턴
            return caches.match("./offline.html");
          });
      })
  );
});