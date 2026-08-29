"use strict";

// Bump this version whenever the offline shell changes. All URLs are derived
// from the worker's own location so the same file works under any Pages
// project subpath (for example /apply-opportunity-panel/).
const CACHE_VERSION = "apply-panel-static-2026-08-30-2";
const BASE_URL = new URL("./", self.location.href);
const localURL = (path) => new URL(path, BASE_URL).href;

const OFFLINE_URL = localURL("offline.html");
const PRECACHE_URLS = [
  localURL("./"),
  localURL("index.html"),
  OFFLINE_URL,
  localURL("manifest.webmanifest"),
  localURL("data/opportunities.js"),
  localURL("data/deadlines.js"),
  localURL("data/application-config.js"),
  localURL("assets/styles.css"),
  localURL("assets/app.js"),
  localURL("assets/pwa.js"),
  localURL("assets/icons/icon-192.png"),
  localURL("assets/icons/icon-512.png"),
  localURL("assets/icons/icon-maskable-512.png"),
  localURL("arzoo/index.html"),
  localURL("assets/arzoo.css"),
  localURL("assets/arzoo.js"),
  localURL("assets/images/frame-red.jpg"),
  localURL("assets/images/ronas-frame.jpg"),
  localURL("assets/images/toranj-detail.jpg"),
  localURL("assets/images/toranj-model.jpg"),
  localURL("report/index.html"),
  localURL("assets/report.css"),
  localURL("assets/report.js"),
  localURL("workspace/index.html"),
  localURL("assets/workspace.css"),
  localURL("assets/workspace.js"),
  localURL("checklists/index.html"),
  localURL("assets/checklists.css"),
  localURL("assets/checklists.js"),
  localURL("health/index.html"),
  localURL("assets/health.css"),
  localURL("assets/health.js")
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("apply-panel-") && key !== CACHE_VERSION)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isPublicLocalGet(requestURL, request) {
  if (request.method !== "GET") return false;
  if (requestURL.origin !== self.location.origin) return false;
  if (!requestURL.pathname.startsWith(BASE_URL.pathname)) return false;

  // Never persist query-bearing URLs, authentication endpoints, generated
  // health reports, or any API/private server path. Workspace/checklist pages
  // are static application shells; their user state remains only in localStorage.
  if (requestURL.search) return false;
  const relativePath = requestURL.pathname.slice(BASE_URL.pathname.length).toLowerCase();
  if (/(^|\/)(api|auth|login|logout|account|admin|private|application|applications|saved|reports)(\/|$)/.test(relativePath)) return false;
  return true;
}

function isStaticAsset(request) {
  return ["style", "script", "image", "font", "manifest"].includes(request.destination);
}

function isCacheable(response) {
  const cacheControl = response.headers.get("Cache-Control") || "";
  return response.ok && response.type === "basic" && !/(?:^|,)\s*(?:private|no-store)\b/i.test(cacheControl);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const requestURL = new URL(request.url);

  // External application pages, analytics, fonts, and every cross-origin
  // request bypass this worker completely and are never cached.
  if (!isPublicLocalGet(requestURL, request)) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (isCacheable(response)) {
          const cache = await caches.open(CACHE_VERSION);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(request, { ignoreSearch: true })) ||
          (await caches.match(OFFLINE_URL));
      }
    })());
    return;
  }

  // Opportunity data changes independently of the app shell: prefer a fresh
  // copy, but retain the last verified public dataset for offline use.
  if (requestURL.pathname.endsWith("/data/opportunities.js")) {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (isCacheable(response)) {
          const cache = await caches.open(CACHE_VERSION);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(request, { ignoreSearch: true })) ||
          new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    })());
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith((async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;

      try {
        const response = await fetch(request);
        if (isCacheable(response)) {
          const cache = await caches.open(CACHE_VERSION);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    })());
  }
});
