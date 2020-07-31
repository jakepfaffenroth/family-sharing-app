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
  event.waitUntil(clients.openWindow(process.env.VUE_APP_SERVER + '/' + guestId + '/guest'));
});
