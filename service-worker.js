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
// 네트워크 요청을 처리하면서 최신 캐시를 업데이트
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // 캐시가 있을 경우 캐시에서 응답
      if (cached) {
        // 네트워크 요청 후, 새 데이터를 캐시에 갱신
        fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
        }).catch(() => {}); // 네트워크 실패 시 무시
        return cached; // 캐시된 응답 반환
      }

      // 네트워크 요청 후, 응답이 없으면 offline.html로 대체
      return fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return caches.match("./offline.html");
          }
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone); // 캐시 업데이트
          });
          return response;
        })
        .catch(() => caches.match("./offline.html"));
    })
  );
});