/**
 * Service Worker para PWA del Backoffice
 *
 * Estrategia:
 * - Cache-first para assets estáticos
 * - Network-first para API check-in con offline queue
 * - Background sync cuando vuelve conexión
 */

const CACHE_NAME = "wedding-backoffice-v1";
const STATIC_CACHE_URLS = [
  "/backoffice",
  "/backoffice/scanner",
  "/favicon.ico",
];

// ============================================
// INSTALL - Pre-cache de assets críticos
// ============================================
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching static assets");
      return cache.addAll(STATIC_CACHE_URLS);
    }),
  );

  // Activar inmediatamente
  self.skipWaiting();
});

// ============================================
// ACTIVATE - Limpiar caches viejos
// ============================================
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
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

  // Tomar control de todos los clientes inmediatamente
  self.clients.claim();
});

// ============================================
// FETCH - Estrategias de caching
// ============================================
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. API Check-in → Network-first con offline queue
  if (url.pathname.includes("/api/check-in")) {
    event.respondWith(handleCheckInRequest(request));
    return;
  }

  // 2. API Sync → Solo online
  if (url.pathname.includes("/api/check-in/sync")) {
    event.respondWith(fetch(request));
    return;
  }

  // 3. Next.js assets → Cache-first
  if (url.pathname.startsWith("/_next/static")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // 4. Backoffice pages → Network-first con cache fallback
  if (url.pathname.startsWith("/backoffice")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 5. Todo lo demás → Network-first
  event.respondWith(fetch(request));
});

// ============================================
// BACKGROUND SYNC - Sincronizar cuando vuelve conexión
// ============================================
self.addEventListener("sync", (event) => {
  console.log("[SW] Sync event triggered:", event.tag);

  if (event.tag === "sync-check-ins") {
    event.waitUntil(notifyClientsToSync());
  }
});

// ============================================
// MESSAGE - Comunicación con el cliente
// ============================================
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log("[SW] Cache cleared");
      }),
    );
  }
});

// ============================================
// HELPERS
// ============================================

/**
 * Network-first: Intenta red, fallback a cache
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);

    // Si es exitoso, actualizar cache
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", request.url);
    const cached = await caches.match(request);

    if (cached) {
      return cached;
    }

    // Si no hay cache, devolver error offline
    return new Response("Offline", { status: 503 });
  }
}

/**
 * Cache-first: Usa cache si existe, sino red
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);

    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    return new Response("Offline", { status: 503 });
  }
}

/**
 * Handle check-in request con offline queue
 */
async function handleCheckInRequest(request) {
  try {
    // Intentar request normal
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log("[SW] Check-in failed (offline), queuing...");

    // Si es POST (crear check-in), guardar para sync
    if (request.method === "POST") {
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

        // Responder que se guardó localmente
        return new Response(
          JSON.stringify({
            success: true,
            queued: true,
            offline: true,
            message:
              "Guardado localmente. Se sincronizará cuando haya conexión.",
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (err) {
        console.error("[SW] Error queuing check-in:", err);
      }
    }

    // Si no se pudo guardar, devolver error
    return new Response(
      JSON.stringify({
        success: false,
        error: "Sin conexión y no se pudo guardar localmente",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

/**
 * Notificar a todos los clientes para que sincronicen
 */
async function notifyClientsToSync() {
  const clients = await self.clients.matchAll();

  clients.forEach((client) => {
    client.postMessage({
      type: "SYNC_CHECK_INS",
    });
  });
}
