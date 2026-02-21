/**
 * Service Worker for Backoffice PWA
 *
 * Strategy:
 * - Network-first with cache fallback for HTML/assets (offline resilience)
 * - Intercepts /api/check-in POST for offline queue
 * - Background sync when connection returns
 */

const CACHE_VERSION = "v1";
const CACHE_NAME = `wedding-backoffice-${CACHE_VERSION}`;

// Routes that should be cached for offline access
const CACHE_URLS = [
  "/backoffice/scanner",
  "/manifest.json",
  // QR Scanner vendor files (critical for camera to work offline)
  "/vendor/qr-scanner/qr-scanner.min.js",
  "/vendor/qr-scanner/qr-scanner-worker.min.js",
];

// ============================================
// INSTALL - Activate immediately and precache critical routes
// ============================================
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Precaching critical routes:", CACHE_URLS);
      return cache
        .addAll(CACHE_URLS)
        .then(() => {
          console.log("[SW] ✅ All critical routes cached successfully");
        })
        .catch((err) => {
          console.warn("[SW] ⚠️ Precache failed for some URLs:", err);
          // Don't fail install if precache fails
        });
    }),
  );

  self.skipWaiting();
});

// ============================================
// ACTIVATE - Clean old caches and take control
// ============================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete any cache not matching current version
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          }),
      );
    }),
  );

  self.clients.claim();
});

// ============================================
// FETCH - Network-first with cache fallback
// ============================================
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Special handling: POST to /api/check-in (offline queue)
  if (request.method === "POST" && url.pathname === "/api/check-in") {
    event.respondWith(handleCheckInRequest(request));
    return;
  }

  // Skip API routes (except check-in) - always network only
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // Vendor files (QR scanner, etc): Cache-first (rarely change)
  if (url.pathname.startsWith("/vendor/")) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // For HTML/assets: Network-first with cache fallback
  event.respondWith(networkFirstStrategy(request));
});

// ============================================
// BACKGROUND SYNC - Sincronizar cuando vuelve conexión
// ============================================
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-check-ins") {
    event.waitUntil(notifyClientsToSync());
  }
});

// ============================================
// MESSAGE - Comunicación con el cliente
// ============================================
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ============================================
// HELPERS
// ============================================

/**
 * Cache-first strategy
 * - Try cache first
 * - If cache hit, return immediately
 * - If cache miss, fetch from network and cache
 * - Best for static assets that rarely change (vendor files)
 */
async function cacheFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    console.log("[SW] Cache hit (cache-first):", request.url);
    return cachedResponse;
  }

  // Cache miss, fetch from network
  try {
    console.log("[SW] Cache miss, fetching from network:", request.url);
    const networkResponse = await fetch(request);

    // Cache for future use
    if (request.method === "GET" && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed and no cache
    console.error("[SW] Cache miss + network failed:", request.url);
    return new Response("Offline and resource not cached", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
}

/**
 * Network-first strategy with cache fallback
 * - Try network first
 * - If network succeeds, update cache and return response
 * - If network fails, return cached version
 * - If no cache exists, return error
 */
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Only cache successful GET requests
    if (request.method === "GET" && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    console.log("[SW] Network failed, trying cache:", request.url);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // No cache available
    return new Response(
      JSON.stringify({
        error: "Offline and no cached version available",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

/**
 * Intercept POST to /api/check-in
 * - Online: pass through normally
 * - Offline: notify client to save in IndexedDB
 */
async function handleCheckInRequest(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    console.log("[SW] Check-in failed (offline), queuing...");

    try {
      const body = await request.clone().text();

      // Notificar al cliente para guardar en IndexedDB
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        client.postMessage({
          type: "QUEUE_CHECK_IN",
          data: {
            url: request.url,
            body: JSON.parse(body),
            timestamp: Date.now(),
          },
        });
      });

      // Registrar background sync para cuando vuelva la conexión
      const registration = await self.registration;
      if ("sync" in registration) {
        await registration.sync.register("sync-check-ins");
      }

      return new Response(
        JSON.stringify({
          success: true,
          queued: true,
          offline: true,
          message: "Saved locally. Will sync when connection returns.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (err) {
      console.error("[SW] Error queuing check-in:", err);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Offline and could not save locally",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

/**
 * Notify all clients to sync pending check-ins
 */
async function notifyClientsToSync() {
  const clients = await self.clients.matchAll();

  clients.forEach((client) => {
    client.postMessage({
      type: "SYNC_CHECK_INS",
    });
  });
}
