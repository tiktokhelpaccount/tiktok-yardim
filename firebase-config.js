/* Firebase canlı panel ayarları.
   Kurulum adımları: admin.html sayfasında yazıyor.
   enabled: true yapmadan mesajlar sunucuya gitmez. */
window.FIREBASE_SYNC = {
  enabled: false,
  adminPassword: "degistir-bu-sifreyi",
  firebase: {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
  },
};
