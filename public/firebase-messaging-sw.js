// Firebase Messaging Service Worker
// This file handles background notifications when the app is not in focus

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);

  const { title, body, icon } = payload.notification || {};
  const { complaintId, type, action } = payload.data || {};

  // Customize notification options
  const notificationTitle = title || 'Civic Complaint Update';
  const notificationOptions = {
    body: body || 'You have a new update on your complaint',
    icon: icon || '/icons/notification-icon.png',
    badge: '/icons/badge-icon.png',
    tag: `complaint-${complaintId}`,
    requireInteraction: true,
    data: {
      complaintId,
      type,
      action,
      url: `${self.location.origin}/complaints/${complaintId}`
    },
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png'
      }
    ]
  };

  // Show the notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received:', event);

  const { complaintId, action, url } = event.notification.data || {};

  event.notification.close();

  if (event.action === 'view' || !event.action) {
    // Open the complaint details page
    const targetUrl = url || `${self.location.origin}/complaints/${complaintId}`;
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if the app is already open
          for (const client of clientList) {
            if (client.url.includes('/complaints/') && 'focus' in client) {
              client.postMessage({
                type: 'NAVIGATE_TO_COMPLAINT',
                complaintId: complaintId
              });
              return client.focus();
            }
          }
          
          // If no existing window, open a new one
          if (clients.openWindow) {
            return clients.openWindow(targetUrl);
          }
        })
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification (already done above)
    console.log('Notification dismissed');
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[firebase-messaging-sw.js] Notification closed:', event);
  
  // Optional: Track notification dismissal analytics
  // You can send this data to your analytics service
});

// Handle push events (for additional customization)
self.addEventListener('push', (event) => {
  console.log('[firebase-messaging-sw.js] Push event received:', event);
  
  // Firebase messaging handles this automatically, but you can add custom logic here
  // if needed for special notification types
});
