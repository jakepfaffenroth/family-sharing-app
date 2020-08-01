let guestId;

self.addEventListener('push', (event) => {
  const data = event.data.json();
  guestId = data.guestId;

  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
  });
});

self.addEventListener('notificationclick', (event) => {
  event.waitUntil(clients.openWindow('http://localhost:3400/' + guestId + '/guest'));
});
