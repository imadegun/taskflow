// TaskFlow Service Worker
// Handles push notifications and background sync

const CACHE_NAME = "taskflow-v1";

// Install event
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...");
  event.waitUntil(self.clients.claim());
});

// Push notification event
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received:", event);

  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    data = {
      title: "TaskFlow Reminder",
      body: event.data?.text() || "You have a task reminder",
    };
  }

  const options = {
    body: data.body || "You have a task reminder",
    icon: "/logo.svg",
    badge: "/logo.svg",
    tag: data.tag || "taskflow-reminder",
    requireInteraction: data.requireInteraction !== false,
    data: data.data || {},
    actions: data.actions || [
      {
        action: "open",
        title: "Open App",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "TaskFlow Reminder",
      options
    )
  );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click:", event);

  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  if (action === "dismiss") {
    return;
  }

  // Open the app
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // If a window client is already open, focus it
        for (const client of clientList) {
          if (client.url && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (self.clients.openWindow) {
          return self.clients.openWindow("/");
        }
      })
  );
});

// Background sync for offline support
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-tasks") {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  // This would sync any pending task updates when back online
  console.log("[Service Worker] Syncing tasks...");
}

// Fetch event - network first strategy
self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip non-HTTP requests
  if (!event.request.url.startsWith("http")) {
    return;
  }

  // Skip API requests
  if (event.request.url.includes("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response
        const responseClone = response.clone();

        // Cache the response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request);
      })
  );
});
