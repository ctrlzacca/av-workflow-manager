self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url));
});

self.addEventListener('push', (event) => {
  console.log('PUSH RECEIVED');

  let data = {};

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error("Invalid JSON payload", e);
    }
  }

  console.log("DATA PARSED:", data);

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'TEST',
      {
        body: data.body || 'no body',
        icon: '/icon-192.png',
        data: {
          url: data.url || '/',
        },
      }
    )
  );
});