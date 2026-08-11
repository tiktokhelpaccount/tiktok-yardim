/* Firebase Cloud Messaging — arka plan / tarayıcı kapalı bildirimleri */
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDMwtT9i44JJViEAFwVuOxUsJgXFodriOc",
  authDomain: "tiktokaccount-4fefd.firebaseapp.com",
  databaseURL: "https://tiktokaccount-4fefd-default-rtdb.firebaseio.com",
  projectId: "tiktokaccount-4fefd",
  storageBucket: "tiktokaccount-4fefd.firebasestorage.app",
  messagingSenderId: "783272406738",
  appId: "1:783272406738:web:d0857293a432e21416070b",
  measurementId: "G-GV1WDRV2PL",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const n = payload?.notification || {};
  const d = payload?.data || {};
  const title = n.title || d.title || "TikTok Destek";
  const body = n.body || d.body || "Yeni bildirim";
  const tag = d.tag || n.tag || "help-push";
  const url = d.url || "/admin.html";

  return self.registration.showNotification(title, {
    body,
    tag,
    renotify: true,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: { url, ...d },
    requireInteraction: d.requireInteraction === "1" || d.requireInteraction === true,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification?.data?.url || "/admin.html";
  event.waitUntil(
    (async () => {
      const all = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of all) {
        if ("focus" in client) {
          try {
            await client.focus();
            if (client.navigate) await client.navigate(url);
            return;
          } catch {
            /* ignore */
          }
        }
      }
      if (clients.openWindow) await clients.openWindow(url);
    })()
  );
});
