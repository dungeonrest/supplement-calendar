// ===== 버전 관리 캐시 이름
const CACHE_VERSION = "v2";
const CACHE_NAME = `supplement-calendar-cache-${CACHE_VERSION}`;

// ===== 설치 시 반드시 캐싱할 필수 리소스
const ASSETS_TO_PRECACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./icons/192.png",
  "./icons/512.png",
  "./offline.html"
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
// 캐시 우선 (Cache First) → 네트워크 갱신
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // 1) 캐시가 있으면 즉시 반환
      if (cachedResponse) {
        return cachedResponse;
      }

      // 2) 캐시 없으면 네트워크 요청
      return fetch(event.request)
        .then((networkResponse) => {
          // 네트워크 응답이 유효하면 캐시에 추가
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // 네트워크도 실패 시 (OFFLINE)
          // 만약 원하는 오프라인 전용 페이지가 있다면 여기서 리턴
          return caches.match("./offline.html");
        });
    })
  );
});