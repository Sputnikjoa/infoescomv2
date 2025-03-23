// public/service-worker.js

self.addEventListener('push', (event) => {
    const payload = event.data ? event.data.json() : {};
    const title = payload.title || 'Nuevo comunicado';
    const options = {
      body: payload.body || 'Tienes un nuevo comunicado en una de tus áreas suscritas.',
      icon: '/CircleIcon.png', 
      badge: '/badge.png',
    };
  
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  });
  
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
      clients.openWindow('http://localhost:5173/feed') 
    );
  });