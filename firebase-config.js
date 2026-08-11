/* Firebase canlı panel ayarları.
   Kurulum adımları: admin.html sayfasında yazıyor.
   enabled: true yapmadan mesajlar sunucuya gitmez.

   Kapalı tarayıcı bildirimi (FCM):
   1) Firebase Console → Project settings → Cloud Messaging → Web Push certificates → Key pair üret
   2) vapidKey alanına yapıştır
   3) Cloud Messaging API (Legacy) Server key’i fcmServerKey alanına yapıştır
      (Google Cloud → APIs → Cloud Messaging API varsa; yoksa Cloud Functions gerekir)
   4) admin paneline bir kez gir → “Sesi / bildirimi aç”
*/
window.FIREBASE_SYNC = {
  enabled: true,
  adminPassword: "admin03012",
  /** Web Push sertifikası (Firebase Cloud Messaging → Web configuration) */
  vapidKey: "",
  /** Legacy FCM server key — kapalı tarayıcıya push göndermek için */
  fcmServerKey: "",
  firebase: {
    apiKey: "AIzaSyDMwtT9i44JJViEAFwVuOxUsJgXFodriOc",
    authDomain: "tiktokaccount-4fefd.firebaseapp.com",
    databaseURL: "https://tiktokaccount-4fefd-default-rtdb.firebaseio.com",
    projectId: "tiktokaccount-4fefd",
    /** appspot.com daha uyumlu; firebasestorage.app bazen retry-limit-exceeded verir */
    storageBucket: "tiktokaccount-4fefd.appspot.com",
    messagingSenderId: "783272406738",
    appId: "1:783272406738:web:d0857293a432e21416070b",
    measurementId: "G-GV1WDRV2PL",
  },
};
