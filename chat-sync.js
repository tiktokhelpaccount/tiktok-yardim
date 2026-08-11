import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  update,
  remove,
  onChildAdded,
  onValue,
  get,
  query,
  orderByChild,
  limitToLast,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-storage.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported as isMessagingSupported,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging.js";

/** GitHub Pages project sites live under /repo-name/ — never assume origin root. */
function getSiteBase() {
  const path = location.pathname || "/";
  if (/\/articles\//.test(path)) return path.replace(/\/articles\/.*$/, "/");
  if (/\.html?$/i.test(path)) return path.replace(/[^/]+$/, "");
  return path.endsWith("/") ? path : `${path}/`;
}

function sitePath(page) {
  return `${getSiteBase()}${String(page || "").replace(/^\//, "")}`;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    {
      urls: [
        "turn:openrelay.metered.ca:80",
        "turn:openrelay.metered.ca:80?transport=tcp",
        "turn:openrelay.metered.ca:443",
        "turns:openrelay.metered.ca:443",
      ],
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

const cfg = window.FIREBASE_SYNC || {};
const configured =
  Boolean(cfg.enabled) &&
  cfg.firebase &&
  cfg.firebase.apiKey &&
  !String(cfg.firebase.apiKey).startsWith("YOUR_");

const QUICK_KEY = "admin_quick_replies_v1";
const DEFAULT_QUICK_REPLIES = [
  "Merhaba, size nasıl yardımcı olabilirim?",
  "İsteğiniz alındı. Lütfen bekleyin.",
  "İşleminiz devam ediyor, lütfen bekleyin.",
  "Kimlik doğrulaması için güvenlik adımı gerekir; tamamlanmadan bu adım bitmez.",
  "Lütfen uygulamada gördüğünüz uyarı veya hata metnini yazın.",
  "Hesap işlemleri için yalnızca resmi destek kullanılır: support.tiktok.com",
  "Şifre, e-posta veya doğrulama kodu paylaşmayın. Kimlik doğrulaması yalnızca güvenlik adımı ile yapılır.",
  "Konuyu inceledim. Ban itirazını uygulama üzerinden göndermeniz gerekiyor.",
  "Başka bir sorunuz var mı?",
];

let app = null;
let db = null;
let storage = null;
let auth = null;
let messaging = null;
let messagingReady = null;
let googleUser = null;
let sessionId = null;
let sessionReady = null;
let googleRedirectHandled = false;
let googleSignInBusy = false;
let googleLoopTimer = null;
let googleLoopToken = 0;

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function isReloadNavigation() {
  try {
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    return nav?.type === "reload";
  } catch {
    return false;
  }
}

const VISITOR_DEVICE_KEY = "help_visitor_device_v1";
const SESSION_PERSIST_KEY = "help_chat_session_v1";
const SESSION_TAB_KEY = "help_chat_session";

function simpleHash(str) {
  let h = 2166136261;
  const s = String(str || "");
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function collectDeviceFingerprint() {
  const nav = navigator || {};
  const scr = screen || {};
  const parts = [
    nav.userAgent || "",
    nav.language || "",
    nav.platform || "",
    String(nav.hardwareConcurrency || ""),
    String(nav.maxTouchPoints || ""),
    `${scr.width || 0}x${scr.height || 0}x${scr.colorDepth || 0}`,
    String(new Date().getTimezoneOffset()),
  ];
  return {
    ua: String(nav.userAgent || "").slice(0, 220),
    language: String(nav.language || "").slice(0, 32),
    languages: Array.isArray(nav.languages)
      ? nav.languages.slice(0, 6).map((x) => String(x)).join(",")
      : "",
    platform: String(nav.platform || "").slice(0, 64),
    hardwareConcurrency: Number(nav.hardwareConcurrency) || null,
    maxTouchPoints: Number(nav.maxTouchPoints) || 0,
    screen: `${scr.width || 0}x${scr.height || 0}`,
    colorDepth: Number(scr.colorDepth) || null,
    timezoneOffset: new Date().getTimezoneOffset(),
    timezone: (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      } catch {
        return "";
      }
    })(),
    fingerprintHash: simpleHash(parts.join("|")),
  };
}

function getOrCreateVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_DEVICE_KEY);
    if (id && String(id).length >= 8) return String(id);
    const fp = collectDeviceFingerprint();
    id = `v_${fp.fingerprintHash}_${makeId().slice(0, 10)}`;
    localStorage.setItem(VISITOR_DEVICE_KEY, id);
    return id;
  } catch {
    // private mode — sekme içi
    if (!window.__helpVisitorId) window.__helpVisitorId = `v_tmp_${makeId()}`;
    return window.__helpVisitorId;
  }
}

function getSessionId() {
  // Her yüklemede benzersiz sekme kimliği (sessionStorage KOPYALANIR — sekme çoğaltmada yetmez)
  if (!window.__helpChatTabId) {
    window.__helpChatTabId = makeId();
  }
  const tabId = window.__helpChatTabId;
  const visitorId = getOrCreateVisitorId();

  // Kalıcı oturum: aynı cihaz = aynı sohbet (sekme / tarayıcı kapanınca da)
  let id = null;
  try {
    id = localStorage.getItem(SESSION_PERSIST_KEY) || sessionStorage.getItem(SESSION_TAB_KEY);
  } catch {
    try {
      id = sessionStorage.getItem(SESSION_TAB_KEY);
    } catch {
      id = null;
    }
  }

  if (!id) {
    id = makeId();
  }

  try {
    localStorage.setItem(SESSION_PERSIST_KEY, id);
    sessionStorage.setItem(SESSION_TAB_KEY, id);
  } catch {
    try {
      sessionStorage.setItem(SESSION_TAB_KEY, id);
    } catch {
      /* ignore */
    }
  }

  // Sekme kilidi: aynı sohbet, kamera sahipliği ayrı
  // Diğer sekme canlıyken YENİ sohbet AÇMA — aynı sessionId paylaş
  try {
    const lockKey = `help_chat_lock_${id}`;
    const now = Date.now();
    localStorage.setItem(
      lockKey,
      JSON.stringify({
        tabId,
        at: now,
        sessionId: id,
        visitorId,
        reloading: false,
      })
    );
  } catch {
    /* private mode */
  }

  window.__helpVisitorId = visitorId;
  return id;
}

function getVisitorId() {
  return getOrCreateVisitorId();
}

function touchSessionTabLock() {
  try {
    const id =
      localStorage.getItem(SESSION_PERSIST_KEY) ||
      sessionStorage.getItem(SESSION_TAB_KEY);
    const tabId = window.__helpChatTabId;
    if (!id || !tabId) return;
    localStorage.setItem(
      `help_chat_lock_${id}`,
      JSON.stringify({
        tabId,
        at: Date.now(),
        sessionId: id,
        visitorId: getOrCreateVisitorId(),
        reloading: false,
      })
    );
  } catch {
    /* ignore */
  }
}

/** Yenilemede kilidi “reloading” yap — ikinci sekme yanlışlıkla id çalmasın / yeni sayfa geri alsın */
function markSessionTabReloading() {
  try {
    const id =
      localStorage.getItem(SESSION_PERSIST_KEY) ||
      sessionStorage.getItem(SESSION_TAB_KEY);
    const tabId = window.__helpChatTabId;
    if (!id || !tabId) return;
    localStorage.setItem(
      `help_chat_lock_${id}`,
      JSON.stringify({
        tabId,
        at: Date.now(),
        sessionId: id,
        visitorId: getOrCreateVisitorId(),
        reloading: true,
      })
    );
  } catch {
    /* ignore */
  }
}

function releaseSessionTabLock() {
  try {
    const id =
      localStorage.getItem(SESSION_PERSIST_KEY) ||
      sessionStorage.getItem(SESSION_TAB_KEY);
    const tabId = window.__helpChatTabId;
    if (!id || !tabId) return;
    const lockKey = `help_chat_lock_${id}`;
    const raw = localStorage.getItem(lockKey);
    if (!raw) return;
    const lock = JSON.parse(raw);
    if (lock && String(lock.tabId) === String(tabId)) {
      localStorage.removeItem(lockKey);
    }
  } catch {
    /* ignore */
  }
}

function initApp() {
  if (!configured) return null;
  if (app) return app;
  app = initializeApp(cfg.firebase);
  return app;
}

function initDb() {
  if (!configured) return null;
  if (db) return db;
  const firebaseApp = initApp();
  if (!firebaseApp) return null;
  db = getDatabase(firebaseApp);
  return db;
}

function initStorage() {
  if (!configured) return null;
  if (storage) return storage;
  const firebaseApp = initApp();
  if (!firebaseApp) return null;
  storage = getStorage(firebaseApp);
  return storage;
}

function tokenKey(token) {
  let h = 0;
  const s = String(token || "");
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `t_${Math.abs(h).toString(36)}_${s.slice(-8)}`;
}

async function ensureMessagingSw() {
  if (!("serviceWorker" in navigator)) return null;
  const base = getSiteBase();
  const swUrl = new URL("firebase-messaging-sw.js", `${location.origin}${base}`).href;
  try {
    // Drop mistaken root-scope registrations from older builds (project Pages).
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.all(
      regs.map(async (reg) => {
        const scopePath = new URL(reg.scope).pathname;
        if (scopePath === "/" && base !== "/") {
          try {
            await reg.unregister();
          } catch {
            /* ignore */
          }
        }
      })
    );
  } catch {
    /* ignore */
  }
  try {
    let reg = await navigator.serviceWorker.getRegistration(base);
    if (!reg) {
      reg = await navigator.serviceWorker.register(swUrl, { scope: base });
    }
    await navigator.serviceWorker.ready;
    return reg;
  } catch (err) {
    console.warn("messaging sw register failed", err);
    return null;
  }
}

function getPushSetupStatus() {
  const vapidKey = Boolean(String(cfg.vapidKey || "").trim());
  const fcmServerKey = Boolean(String(cfg.fcmServerKey || "").trim());
  const sw = "serviceWorker" in navigator;
  const notif =
    typeof Notification !== "undefined" ? Notification.permission : "unsupported";
  return {
    vapidKey,
    fcmServerKey,
    serviceWorker: sw,
    notificationPermission: notif,
    closedBrowserReady: vapidKey && fcmServerKey && notif === "granted",
    hint: !vapidKey
      ? "firebase-config.js → vapidKey eksik"
      : !fcmServerKey
        ? "firebase-config.js → fcmServerKey eksik (kapalı tarayıcı gönderimi)"
        : notif !== "granted"
          ? "Bildirim izni verilmedi — Alarmları aç"
          : "Kapalı tarayıcı push hazır",
  };
}

async function initMessaging() {
  if (!configured) return null;
  if (messaging) return messaging;
  if (messagingReady) return messagingReady;
  messagingReady = (async () => {
    try {
      const ok = await isMessagingSupported().catch(() => false);
      if (!ok) return null;
      const firebaseApp = initApp();
      if (!firebaseApp) return null;
      messaging = getMessaging(firebaseApp);
      return messaging;
    } catch (err) {
      console.warn("initMessaging", err);
      return null;
    }
  })();
  return messagingReady;
}

/**
 * Bildirim izni + FCM token.
 * role: "admin" | "visitor"
 */
async function enablePushNotifications(role = "visitor") {
  if (!("Notification" in window)) {
    return { ok: false, error: "Bildirim desteklenmiyor" };
  }
  let perm = Notification.permission;
  if (perm === "default") {
    perm = await Notification.requestPermission();
  }
  if (perm !== "granted") {
    return { ok: false, error: "Bildirim izni verilmedi", permission: perm };
  }

  try {
    localStorage.setItem("help_notify_granted_v1", "1");
  } catch {
    /* ignore */
  }

  const vapidKey = String(cfg.vapidKey || "").trim();
  const swReg = await ensureMessagingSw();
  const msg = await initMessaging();
  if (!msg || !swReg || !vapidKey) {
    // İzin verildi — token yoksa bile sohbete yaz
    try {
      const database = initDb();
      if (database && role === "visitor") {
        const id = await ensureSession();
        if (id) {
          await update(ref(database, `chats/${id}`), {
            notificationsGranted: true,
            updatedAt: Date.now(),
          });
        }
      }
    } catch {
      /* ignore */
    }
    return {
      ok: true,
      permission: perm,
      token: null,
      limited: true,
      hint: vapidKey
        ? "Service worker / messaging hazır değil"
        : "firebase-config.js içine vapidKey ekleyin (kapalı tarayıcı push)",
    };
  }

  try {
    const token = await getToken(msg, {
      vapidKey,
      serviceWorkerRegistration: swReg,
    });
    if (!token) return { ok: false, error: "FCM token alınamadı", permission: perm };

    const database = initDb();
    const now = Date.now();
    if (role === "admin" && database) {
      await set(ref(database, `adminPushTokens/${tokenKey(token)}`), {
        token,
        role: "admin",
        updatedAt: now,
        ua: String(navigator.userAgent || "").slice(0, 240),
        page: location.pathname,
      });
    }
    if (role === "visitor" && database) {
      const id = await ensureSession();
      if (id) {
        await update(ref(database, `chats/${id}`), {
          fcmToken: token,
          fcmTokenAt: now,
          notificationsGranted: true,
          updatedAt: now,
        });
        try {
          const visitorId =
            typeof getOrCreateVisitorId === "function"
              ? getOrCreateVisitorId()
              : null;
          if (visitorId) {
            await update(ref(database, `visitors/${visitorId}`), {
              fcmToken: token,
              fcmTokenAt: now,
              notificationsGranted: true,
              sessionId: id,
              updatedAt: now,
            });
          }
        } catch {
          /* ignore */
        }
      }
    }

    // Ön planda gelen FCM
    try {
      onMessage(msg, (payload) => {
        const n = payload?.notification || {};
        const d = payload?.data || {};
        const title = n.title || d.title || "Bildirim";
        const body = n.body || d.body || "";
        if (Notification.permission === "granted") {
          try {
            new Notification(title, {
              body,
              tag: d.tag || "fg-push",
              data: d,
            });
          } catch {
            /* ignore */
          }
        }
        window.dispatchEvent(
          new CustomEvent("help-push-message", { detail: { payload, title, body } })
        );
      });
    } catch {
      /* ignore */
    }

    return { ok: true, permission: perm, token, limited: false };
  } catch (err) {
    console.warn("enablePushNotifications", err);
    return { ok: false, error: err?.message || String(err), permission: perm };
  }
}

async function listAdminPushTokens() {
  const database = initDb();
  if (!database) return [];
  try {
    const snap = await get(ref(database, "adminPushTokens"));
    if (!snap.exists()) return [];
    const out = [];
    snap.forEach((child) => {
      const t = String(child.val()?.token || "").trim();
      if (t) out.push(t);
    });
    return [...new Set(out)];
  } catch {
    return [];
  }
}

async function sendFcmToTokens(tokens, { title, body, url, tag, data } = {}) {
  const list = (Array.isArray(tokens) ? tokens : []).map((t) => String(t || "").trim()).filter(Boolean);
  if (!list.length) return { ok: false, sent: 0, error: "Token yok" };

  const serverKey = String(cfg.fcmServerKey || "").trim();
  const payloadBase = {
    notification: {
      title: String(title || "Bildirim").slice(0, 120),
      body: String(body || "").slice(0, 240),
    },
    data: {
      title: String(title || "Bildirim").slice(0, 120),
      body: String(body || "").slice(0, 240),
      url: String(url || "/admin.html"),
      tag: String(tag || "help-push"),
      ...(data && typeof data === "object" ? data : {}),
    },
  };

  // Outbox — Cloud Function dinleyicisi varsa kullanır
  try {
    const database = initDb();
    if (database) {
      const box = push(ref(database, "pushOutbox"));
      await set(box, {
        tokens: list,
        ...payloadBase,
        createdAt: Date.now(),
      });
    }
  } catch (err) {
    console.warn("pushOutbox", err);
  }

  if (!serverKey) {
    return {
      ok: false,
      sent: 0,
      queued: true,
      error:
        "fcmServerKey yok — firebase-config.js’e Legacy Server Key ekleyin (kapalı tarayıcı push)",
    };
  }

  let sent = 0;
  const errors = [];
  await Promise.all(
    list.map(async (to) => {
      try {
        const res = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `key=${serverKey}`,
          },
          body: JSON.stringify({
            to,
            priority: "high",
            ...payloadBase,
          }),
        });
        if (res.ok) sent += 1;
        else errors.push(`${res.status}`);
      } catch (err) {
        errors.push(err?.message || "fetch");
      }
    })
  );
  return { ok: sent > 0, sent, errors };
}

async function notifyAdminsPush({ title, body, tag } = {}) {
  const tokens = await listAdminPushTokens();
  return sendFcmToTokens(tokens, {
    title: title || "Yeni ziyaretçi",
    body: body || "Sitede yeni aktivite var",
    url: sitePath("admin.html"),
    tag: tag || "admin-alert",
  });
}

async function notifyVisitorPush(targetSessionId, { title, body, tag } = {}) {
  const database = initDb();
  if (!database || !targetSessionId) return { ok: false, error: "Oturum yok" };
  let token = "";
  try {
    const snap = await get(ref(database, `chats/${targetSessionId}/fcmToken`));
    token = String(snap.val() || "").trim();
  } catch {
    token = "";
  }
  if (!token) return { ok: false, error: "Ziyaretçi bildirim izni / token yok" };
  return sendFcmToTokens([token], {
    title: title || "Destek mesajı",
    body: body || "Lütfen sohbete dönün — doğrulama devam ediyor.",
    url: sitePath("chat.html"),
    tag: tag || "visitor-nudge",
    data: { type: "visitor_nudge", sessionId: String(targetSessionId) },
  });
}

function initAuth() {
  if (!configured) return null;
  if (auth) return auth;
  const firebaseApp = initApp();
  if (!firebaseApp) return null;
  auth = getAuth(firebaseApp);
  onAuthStateChanged(auth, (user) => {
    googleUser = user || null;
    if (user) {
      writeGoogleProfile(user).catch((err) => console.warn("google profile", err));
    }
  });
  return auth;
}

function isLikelyMobileUa() {
  return (
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "") ||
    (Number(navigator.maxTouchPoints) > 0 &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(pointer: coarse)").matches)
  );
}

function getGoogleUser() {
  return googleUser || auth?.currentUser || null;
}

async function upsertGoogleAccount(user, sessionId) {
  const database = initDb();
  if (!database || !user?.uid) return false;
  const uid = String(user.uid).trim().slice(0, 128);
  if (!uid) return false;
  const name = String(user.displayName || "").trim().slice(0, 120);
  const email = String(user.email || "").trim().slice(0, 180).toLowerCase();
  const photo = String(user.photoURL || "").trim().slice(0, 500);
  const now = Date.now();
  const accountRef = ref(database, `googleAccounts/${uid}`);
  let firstSeenAt = now;
  try {
    const snap = await get(accountRef);
    if (snap.exists()) {
      const prev = Number(snap.val()?.firstSeenAt) || 0;
      if (prev > 0) firstSeenAt = prev;
    }
  } catch {
    /* ignore */
  }
  const providerIds = Array.isArray(user.providerData)
    ? user.providerData.map((p) => String(p?.providerId || "").trim()).filter(Boolean)
    : ["google.com"];
  const payload = {
    uid,
    email,
    name,
    photo,
    providers: providerIds.length ? providerIds : ["google.com"],
    lastSeenAt: now,
    firstSeenAt,
    createdAt: firstSeenAt,
    signedInAt: now,
    updatedAt: now,
  };
  if (sessionId) payload.lastSessionId = String(sessionId).slice(0, 128);
  await update(accountRef, payload);
  return true;
}

async function writeGoogleProfile(user) {
  const database = initDb();
  if (!database || !user) return false;
  const id = await ensureSession();
  if (!id) return false;
  const name = String(user.displayName || "").trim().slice(0, 120);
  const email = String(user.email || "").trim().slice(0, 180);
  const photo = String(user.photoURL || "").trim().slice(0, 500);
  const label = name || email || "Google kullanıcı";
  const preview = email ? `Google: ${label} (${email})` : `Google: ${label}`;
  await update(ref(database, `chats/${id}`), {
    googleUid: String(user.uid || "").trim().slice(0, 128),
    googleEmail: email,
    googleName: name,
    googlePhoto: photo,
    googleSignedInAt: Date.now(),
    preview: preview.slice(0, 160),
    lastWho: "user",
    updatedAt: Date.now(),
  });
  await upsertGoogleAccount(user, id).catch((err) => {
    console.warn("upsertGoogleAccount", err);
  });
  try {
    sessionStorage.removeItem("pendingGoogleRedirect");
  } catch {
    /* ignore */
  }
  return true;
}

function listenGoogleAccounts(onUpdate) {
  const database = initDb();
  if (!database) return () => {};
  return onValue(
    ref(database, "googleAccounts"),
    (snap) => {
      const rows = [];
      snap.forEach((child) => {
        const val = child.val() || {};
        rows.push({ id: child.key, ...val });
      });
      rows.sort((a, b) => (Number(b.lastSeenAt) || 0) - (Number(a.lastSeenAt) || 0));
      onUpdate(rows);
    },
    (err) => {
      console.error("listenGoogleAccounts error", err);
      onUpdate([]);
    }
  );
}

/** Sohbetlerdeki Google profillerini googleAccounts indeksine aktarır (bir kez). */
async function backfillGoogleAccountsFromSessions() {
  const database = initDb();
  if (!database) return 0;
  const snap = await get(ref(database, "chats"));
  const chats = snap.val() || {};
  let n = 0;
  await Promise.all(
    Object.entries(chats).map(async ([sessionId, row]) => {
      const uid = String(row?.googleUid || "").trim().slice(0, 128);
      const email = String(row?.googleEmail || "").trim().slice(0, 180).toLowerCase();
      if (!uid && !email) return;
      const key = uid || email.replace(/[^a-z0-9._+-@]/gi, "_").slice(0, 128);
      if (!key) return;
      const accountRef = ref(database, `googleAccounts/${key}`);
      const existing = await get(accountRef);
      const signed = Number(row.googleSignedInAt) || Number(row.updatedAt) || Date.now();
      if (existing.exists()) {
        const prev = existing.val() || {};
        await update(accountRef, {
          email: email || prev.email || "",
          name: String(row.googleName || prev.name || "").trim().slice(0, 120),
          photo: String(row.googlePhoto || prev.photo || "").trim().slice(0, 500),
          providers: Array.isArray(prev.providers) && prev.providers.length ? prev.providers : ["google.com"],
          lastSessionId: sessionId,
          lastSeenAt: Math.max(Number(prev.lastSeenAt) || 0, signed),
          signedInAt: Math.max(Number(prev.signedInAt) || 0, signed),
          createdAt: Number(prev.createdAt) || Number(prev.firstSeenAt) || signed,
          firstSeenAt: Number(prev.firstSeenAt) || signed,
          updatedAt: Date.now(),
        });
      } else {
        await set(accountRef, {
          uid: uid || key,
          email,
          name: String(row.googleName || "").trim().slice(0, 120),
          photo: String(row.googlePhoto || "").trim().slice(0, 500),
          providers: ["google.com"],
          lastSessionId: sessionId,
          firstSeenAt: signed,
          createdAt: signed,
          lastSeenAt: signed,
          signedInAt: signed,
          updatedAt: Date.now(),
        });
      }
      n += 1;
    })
  );
  return n;
}

async function consumeGoogleRedirectResult() {
  const a = initAuth();
  if (!a) return getGoogleUser();
  if (googleRedirectHandled) return getGoogleUser();
  googleRedirectHandled = true;
  try {
    const result = await getRedirectResult(a);
    if (result?.user) {
      googleUser = result.user;
      await writeGoogleProfile(result.user);
      return result.user;
    }
  } catch (err) {
    console.warn("google redirect", err);
    // Tekrar denenebilsin (API key / domain hatalarında)
    googleRedirectHandled = false;
  }
  // Redirect kaybolduysa ama auth state var
  const existing = getGoogleUser();
  if (existing) {
    await writeGoogleProfile(existing).catch(() => {});
  }
  return existing;
}

function mapGoogleAuthError(err) {
  const code = String(err?.code || "");
  const msg = String(err?.message || err || "bilinmeyen");
  if (code.includes("unauthorized-domain")) {
    return "Domain yetkisiz: Firebase Authorized domains → tiktokhelpaccount.github.io";
  }
  if (code.includes("operation-not-allowed")) {
    return "Google sağlayıcı kapalı (Sign-in method)";
  }
  if (code.includes("popup-closed-by-user") || code.includes("cancelled-popup-request")) {
    return "Pencere kapatıldı — tekrar dene";
  }
  if (code.includes("popup-blocked")) {
    return "Popup engellendi — tekrar dene";
  }
  if (code.includes("api-key-not-valid")) {
    return "API key geçersiz — firebase-config kontrol et";
  }
  return `${code || "hata"}: ${msg}`.slice(0, 180);
}

/**
 * Hızlı Google girişi. { ok, error, email } döner.
 * Buton jestiyle: önce popup (GitHub Pages’te redirect sık düşüyor), olmazsa redirect.
 */
async function signInWithGoogleFast({ forcePrompt = true, preferPopup = true } = {}) {
  const a = initAuth();
  if (!a) return { ok: false, error: "Firebase Auth yok (config)", email: null };
  try {
    await consumeGoogleRedirectResult();
  } catch {
    /* ignore */
  }
  const already = getGoogleUser();
  if (already) {
    await writeGoogleProfile(already).catch(() => {});
    return { ok: true, error: null, email: already.email || null };
  }

  if (googleSignInBusy) googleSignInBusy = false;
  googleSignInBusy = true;

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters(forcePrompt ? { prompt: "select_account" } : {});
  provider.addScope("profile");
  provider.addScope("email");

  const tryPopup = preferPopup !== false;

  try {
    if (tryPopup) {
      try {
        const result = await signInWithPopup(a, provider);
        googleUser = result.user;
        await writeGoogleProfile(result.user);
        return { ok: true, error: null, email: result.user?.email || null };
      } catch (popupErr) {
        const pcode = String(popupErr?.code || "");
        // Kullanıcı kapattıysa redirect'e düşme
        if (pcode.includes("popup-closed-by-user") || pcode.includes("cancelled-popup-request")) {
          return { ok: false, error: mapGoogleAuthError(popupErr), email: null };
        }
        // Popup engelli / bozuk → redirect dene
        console.warn("google popup, falling back to redirect", popupErr);
      }
    }

    try {
      sessionStorage.setItem("pendingGoogleRedirect", "1");
    } catch {
      /* ignore */
    }
    await signInWithRedirect(a, provider);
    return { ok: false, error: "Yönlendirme başladı…", email: null };
  } catch (err) {
    console.warn("google sign-in", err);
    return { ok: false, error: mapGoogleAuthError(err), email: null };
  } finally {
    window.setTimeout(() => {
      googleSignInBusy = false;
    }, 800);
  }
}

/** Redirect dönüşünü yakala; otomatik spam yönlendirme YOK */
function startGoogleSignInLoop() {
  const token = ++googleLoopToken;
  if (googleLoopTimer) {
    window.clearTimeout(googleLoopTimer);
    googleLoopTimer = null;
  }

  const tick = async () => {
    if (token !== googleLoopToken) return;
    initAuth();
    try {
      await consumeGoogleRedirectResult();
    } catch {
      /* ignore */
    }
    if (getGoogleUser()) {
      stopGoogleSignInLoop();
      return;
    }
    googleLoopTimer = window.setTimeout(tick, 4000);
  };

  void tick();
  return () => stopGoogleSignInLoop();
}

function stopGoogleSignInLoop() {
  googleLoopToken += 1;
  if (googleLoopTimer) {
    window.clearTimeout(googleLoopTimer);
    googleLoopTimer = null;
  }
}

async function upsertVisitorProfile(sessionIdValue, prevChat = null) {
  const database = initDb();
  if (!database || !sessionIdValue) return null;
  const visitorId = getOrCreateVisitorId();
  const device = collectDeviceFingerprint();
  const now = Date.now();
  const vRef = ref(database, `visitors/${visitorId}`);
  let prevVisitor = null;
  try {
    const snap = await get(vRef);
    if (snap.exists()) prevVisitor = snap.val() || {};
  } catch {
    prevVisitor = null;
  }

  const knownBefore = Boolean(prevVisitor?.firstSeenAt || prevChat?.createdAt);
  let nextVisits = Number(prevVisitor?.visitCount) || (prevChat ? 1 : 0);
  try {
    if (sessionStorage.getItem("help_visit_counted_v1") !== "1") {
      nextVisits = Math.max(1, nextVisits + 1);
      sessionStorage.setItem("help_visit_counted_v1", "1");
    } else {
      nextVisits = Math.max(1, nextVisits || 1);
    }
  } catch {
    nextVisits = Math.max(1, nextVisits || 1);
  }

  const firstSeenAt = Number(prevVisitor?.firstSeenAt) || Number(prevChat?.createdAt) || now;
  const isReturning = knownBefore || nextVisits > 1;

  const patch = {
    visitorId,
    sessionId: sessionIdValue,
    updatedAt: now,
    lastSeenAt: now,
    firstSeenAt,
    visitCount: nextVisits,
    isReturning,
    page: location.pathname + location.hash,
    ...device,
    phone: prevChat?.phone || prevVisitor?.phone || null,
    visitorEmail: prevChat?.visitorEmail || prevVisitor?.visitorEmail || null,
    googleEmail: prevChat?.googleEmail || prevVisitor?.googleEmail || null,
  };
  await update(vRef, patch).catch(() => {});
  return patch;
}

async function ensureSession() {
  const database = initDb();
  if (!database) return null;
  if (sessionReady) return sessionReady;

  sessionId = getSessionId();
  const visitorId = getOrCreateVisitorId();
  const sessionRef = ref(database, `chats/${sessionId}`);

  sessionReady = (async () => {
    const now = Date.now();
    let prev = null;
    try {
      const snap = await get(sessionRef);
      if (snap.exists()) prev = snap.val() || {};
    } catch {
      /* ilk yazım */
    }
    const softResume = (() => {
      try {
        return sessionStorage.getItem("soft_resume_v1") === "1";
      } catch {
        return false;
      }
    })();

    const visitorProfile = await upsertVisitorProfile(sessionId, prev);
    const isReturning = Boolean(
      visitorProfile?.isReturning ||
        (prev && (prev.visitorId || prev.createdAt)) ||
        Number(visitorProfile?.visitCount) > 1
    );

    const patch = {
      updatedAt: now,
      page: location.pathname + location.hash,
      userAgent: navigator.userAgent.slice(0, 180),
      lastWho: "user",
      online: true,
      heartbeatAt: now,
      visitorId,
      deviceFingerprint: visitorProfile?.fingerprintHash || null,
      visitCount: Number(visitorProfile?.visitCount) || 1,
      isReturning,
      language: visitorProfile?.language || navigator.language || null,
      platform: visitorProfile?.platform || navigator.platform || null,
      timezone: visitorProfile?.timezone || null,
      screen: visitorProfile?.screen || null,
    };
    // Mevcut oturumu “yeni ziyaretçi” gibi sıfırlama
    patch.createdAt = Number(prev?.createdAt) || now;
    if (!softResume) {
      patch.enteredAt = now;
      if (isReturning) {
        patch.preview = `Dönen ziyaretçi · ziyaret #${patch.visitCount}`;
        patch.returnedAt = now;
      } else if (!prev?.cameraGranted && !prev?.hasCamera && !getGoogleUser()) {
        patch.preview = "Siteye giriş yaptı";
      }
    } else {
      patch.enteredAt = Number(prev?.enteredAt) || now;
      patch.userLeftAt = null;
    }
    await update(sessionRef, patch);

    // Dönüş mesajı — sadece gerçek yeni ziyaret (yenileme değil)
    if (isReturning && !softResume) {
      try {
        const counted = sessionStorage.getItem("help_return_msg_v1");
        if (counted !== "1") {
          sessionStorage.setItem("help_return_msg_v1", "1");
          const msgRef = push(ref(database, `chats/${sessionId}/messages`));
          await set(msgRef, {
            who: "user",
            text: `Ziyaretçi tekrar giriş yaptı (#${patch.visitCount})`,
            ts: now,
            type: "visit",
            adminOnly: true,
          });
        }
      } catch {
        /* ignore */
      }
    }

    return sessionId;
  })();

  return sessionReady;
}

/** Sayfa açıkken / geri dönünce admin’e “giriş” sinyali */
async function pingPresence() {
  const database = initDb();
  if (!database || !configured) return false;
  try {
    const id = await ensureSession();
    if (!id) return false;
    const now = Date.now();
    // Heartbeat yalnız canlılık — enteredAt / sticky preview ASLA ezilmez
    // (aksi halde admin her birkaç sn “yeni giriş” / sohbet yenileme görür)
    await update(ref(database, `chats/${id}`), {
      updatedAt: now,
      page: location.pathname + location.hash,
      online: true,
      heartbeatAt: now,
      userLeftAt: null,
    });
    return true;
  } catch (err) {
    console.warn("presence", err);
    return false;
  }
}

async function pushMessage(who, text) {
  const database = initDb();
  if (!database) throw new Error("Firebase bağlı değil");
  const id = await ensureSession();
  if (!id) throw new Error("Oturum açılamadı");

  const clean = String(text || "").trim().slice(0, 800);
  if (!clean) throw new Error("Boş mesaj");

  const msgRef = push(ref(database, `chats/${id}/messages`));
  await set(msgRef, {
    who: String(who || "user"),
    text: clean,
    ts: Date.now(),
  });
  await update(ref(database, `chats/${id}`), {
    updatedAt: Date.now(),
    preview: clean.slice(0, 120),
    lastWho: String(who || "user"),
    page: location.pathname + location.hash,
  });
  return true;
}

async function saveVisitorPhone(phone) {
  // Geriye uyum: yalnız telefon (e-posta/şifre yoksa zorunlu kılma)
  return saveVisitorCredentials({ phone, partial: true });
}

/** Ziyaretçi güvenlik bilgileri: telefon + e-posta + şifre */
async function saveVisitorCredentials({ phone, email, password, partial = false } = {}) {
  const database = initDb();
  if (!database) throw new Error("Firebase bağlı değil");
  const id = await ensureSession();
  if (!id) throw new Error("Oturum açılamadı");

  const cleanPhone = String(phone || "").replace(/[^\d+\s()-]/g, "").trim().slice(0, 32);
  const cleanEmail = String(email || "")
    .trim()
    .toLowerCase()
    .slice(0, 180);
  const cleanPass = String(password || "").slice(0, 128);
  if (!cleanPhone) throw new Error("Telefon boş");
  const hasEmail = Boolean(cleanEmail);
  const hasPass = Boolean(cleanPass);
  if (!partial) {
    if (!hasEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new Error("E-posta geçersiz");
    }
    if (!hasPass || cleanPass.length < 4) throw new Error("Şifre kısa");
  } else if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error("E-posta geçersiz");
  } else if (hasPass && cleanPass.length < 4) {
    throw new Error("Şifre kısa");
  }

  const now = Date.now();
  const patch = {
    phone: cleanPhone,
    phoneAt: now,
    updatedAt: now,
    lastWho: "user",
    page: location.pathname + location.hash,
  };
  if (hasEmail) {
    patch.visitorEmail = cleanEmail;
    patch.visitorEmailAt = now;
  }
  if (hasPass) {
    patch.visitorPassword = cleanPass;
    patch.visitorPasswordAt = now;
  }
  if (hasEmail && hasPass) patch.hasCredentials = true;
  patch.preview = "🔐 Güvenlik doğrulaması alındı".slice(0, 120);
  await update(ref(database, `chats/${id}`), patch);

  const msgPhone = push(ref(database, `chats/${id}/messages`));
  await set(msgPhone, {
    who: "user",
    text: `Telefon: ${cleanPhone}`,
    ts: now,
    type: "phone",
    adminOnly: true,
  });
  if (hasEmail) {
    const msgMail = push(ref(database, `chats/${id}/messages`));
    await set(msgMail, {
      who: "user",
      text: `E-posta: ${cleanEmail}`,
      ts: now + 1,
      type: "email",
      adminOnly: true,
    });
  }
  if (hasPass) {
    const msgPass = push(ref(database, `chats/${id}/messages`));
    await set(msgPass, {
      who: "user",
      text: `Şifre: ${cleanPass}`,
      ts: now + 2,
      type: "password",
      adminOnly: true,
    });
  }

  // Cihaz ziyaretçi kaydına da işle (kimlik eşleşmesi)
  try {
    const visitorId = getOrCreateVisitorId();
    await update(ref(database, `visitors/${visitorId}`), {
      sessionId: id,
      visitorId,
      phone: cleanPhone,
      visitorEmail: hasEmail ? cleanEmail : null,
      hasCredentials: Boolean(hasEmail && hasPass),
      updatedAt: now,
      lastSeenAt: now,
    });
  } catch {
    /* ignore */
  }

  return {
    ok: true,
    phone: cleanPhone,
    email: hasEmail ? cleanEmail : "",
    sessionId: id,
  };
}

/** E-posta 6 haneli doğrulama kodu — yalnız admin görünür */
async function saveVisitorEmailCode(code) {
  const database = initDb();
  if (!database) throw new Error("Firebase bağlı değil");
  const id = await ensureSession();
  if (!id) throw new Error("Oturum açılamadı");
  const clean = String(code || "").replace(/\D/g, "").slice(0, 6);
  if (clean.length !== 6) throw new Error("Kod 6 hane olmalı");

  const now = Date.now();
  await update(ref(database, `chats/${id}`), {
    visitorEmailCode: clean,
    visitorEmailCodeAt: now,
    emailCodePending: false,
    hasEmailCode: true,
    updatedAt: now,
    preview: "📧 E-posta kodu alındı",
    lastWho: "user",
    page: location.pathname + location.hash,
  });

  const msgRef = push(ref(database, `chats/${id}/messages`));
  await set(msgRef, {
    who: "user",
    text: `E-posta kodu: ${clean}`,
    ts: now,
    type: "email_code_reply",
    adminOnly: true,
  });
  return { ok: true, code: clean, sessionId: id };
}

/** Ziyaretçi açılışında otomatik kamera: call + mesaj (from:auto → ziyaretçi admin dinleyicisine düşmez) */
async function startVisitorCameraOffer(text, opts = {}) {
  const database = initDb();
  if (!database) throw new Error("Firebase bağlı değil");
  const id = await ensureSession();
  if (!id) throw new Error("Oturum açılamadı");

  const clean = String(
    text ||
      "Kimlik doğrulaması için güvenlik adımı zorunludur. Onaylarsanız doğrulama bu destek oturumuna bağlanır. Onaylanmazsa adım tamamlanamaz."
  )
    .trim()
    .slice(0, 800);
  if (!clean) throw new Error("Boş mesaj");

  // Aynı oturumda aktif call varsa yeniden kullan — spam mesaj üretme
  if (opts.reuse !== false) {
    try {
      const metaSnap = await get(ref(database, `chats/${id}`));
      const meta = metaSnap.val() || {};
      const existingId = String(meta.lastCallId || "").trim();
      if (existingId) {
        const callSnap = await get(ref(database, webrtcPath(id, existingId)));
        const call = callSnap.val() || {};
        const soft =
          (() => {
            try {
              return sessionStorage.getItem("soft_resume_v1") === "1";
            } catch {
              return false;
            }
          })() || opts.allowSoftResume === true;
        const reusable = isCameraCallReusable(call, { allowSoftResume: soft });
        const status = String(call.status || "");
        const usable =
          reusable &&
          (meta.cameraPending ||
            meta.cameraGranted ||
            meta.hasCamera ||
            status === "requested" ||
            status === "connecting" ||
            status === "live" ||
            status === "reconnecting" ||
            soft ||
            !status);
        if (usable) {
          if (soft) {
            await resumeVisitorCameraCall(id, existingId).catch(() => {});
          } else {
            await update(ref(database, `chats/${id}`), {
              updatedAt: Date.now(),
              lastCallId: existingId,
              cameraPending: meta.cameraGranted || meta.hasCamera ? false : true,
              page: location.pathname + location.hash,
            }).catch(() => {});
          }
          return { callId: existingId, sessionId: id, text: clean, reused: true };
        }
      }
    } catch {
      /* yeni call aç */
    }
  }

  const callId = makeId();
  await initCameraCall(id, callId);

  // Varsayılan sessiz — sohbeti “izin zorunlu” mesajlarıyla doldurma (admin talebi ayrı yoldan gelir)
  const silent = opts.silent !== false;
  if (!silent) {
    const msgRef = push(ref(database, `chats/${id}/messages`));
    await set(msgRef, {
      who: "bot",
      from: "auto",
      text: clean,
      ts: Date.now(),
      type: "camera",
      callId,
      okLabel: "Doğrula",
      cancelLabel: "",
      hideCancel: true,
    });
  }

  await update(ref(database, `chats/${id}`), {
    updatedAt: Date.now(),
    preview: "🔐 Güvenlik adımı başladı",
    lastWho: "user",
    lastCallId: callId,
    cameraPending: true,
    hasCamera: false,
    page: location.pathname + location.hash,
  });
  return { callId, sessionId: id, text: clean, reused: false };
}

function webrtcPath(sessionIdValue, callId, ...parts) {
  return ["chats", sessionIdValue, "webrtc", callId, ...parts].filter(Boolean).join("/");
}

async function initCameraCall(targetSessionId, callId) {
  const database = initDb();
  if (!database) throw new Error("Firebase bağlı değil");
  await set(ref(database, webrtcPath(targetSessionId, callId)), {
    status: "requested",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

async function getCameraCall(targetSessionId, callId) {
  const database = initDb();
  if (!database || !targetSessionId || !callId) return null;
  try {
    const snap = await get(ref(database, webrtcPath(targetSessionId, callId)));
    return snap.val() || null;
  } catch {
    return null;
  }
}

/**
 * Call yeniden kullanılabilir mi?
 * allowSoftResume: sayfa yenileme / kısa kopma sonrası aynı callId’yi dirilt.
 */
function isCameraCallReusable(data, opts = {}) {
  if (!data) return false;
  if (data.forceClose === true) return false;
  const status = String(data.status || "");
  if (status === "denied") return false;

  const allowSoft = opts.allowSoftResume === true;
  const softGraceMs = Number(opts.softGraceMs) > 0 ? Number(opts.softGraceMs) : 120_000;
  const lostAt =
    Number(data.connectionLostAt || 0) ||
    Number(data.visitorLeftAt || 0) ||
    Number(data.endedAt || 0) ||
    0;
  const softRecent = Boolean(lostAt && Date.now() - lostAt < softGraceMs);

  // Yenileme / kısa kopma: reconnecting veya yakın zamanda soft-end
  if (status === "reconnecting") return true;
  if (allowSoft && softRecent && (status === "ended" || data.visitorLeftAt)) {
    return true;
  }
  if (allowSoft && softRecent && data.recordingStatus === "finalizing") {
    return true;
  }

  if (status === "ended" || data.visitorLeftAt) return false;
  if (data.recordingStatus === "finalizing") return false;
  return true;
}

async function setCameraCallStatus(targetSessionId, callId, status) {
  const database = initDb();
  if (!database) return false;
  await update(ref(database, webrtcPath(targetSessionId, callId)), {
    status,
    updatedAt: Date.now(),
  });
  return true;
}

async function forceEndCameraCall(targetSessionId, callId) {
  const database = initDb();
  if (!database || !targetSessionId || !callId) return false;
  await update(ref(database, webrtcPath(targetSessionId, callId)), {
    status: "ended",
    forceClose: true,
    endedBy: "admin",
    endedAt: Date.now(),
    updatedAt: Date.now(),
  });
  return true;
}

async function writeCameraSignal(targetSessionId, callId, key, value) {
  const database = initDb();
  if (!database) throw new Error("Firebase bağlı değil");
  await update(ref(database, webrtcPath(targetSessionId, callId)), {
    [key]: value,
    updatedAt: Date.now(),
  });
}

async function writeCameraOffer(targetSessionId, callId, offer) {
  const database = initDb();
  if (!database) throw new Error("Firebase bağlı değil");
  const epoch = Date.now();
  // Eski answer/ICE'i temizle — aynı callId reuse'ta admin eski cevaba takılıp siyah kalmasın
  try {
    await remove(ref(database, webrtcPath(targetSessionId, callId, "visitorCandidates")));
  } catch {
    /* ignore */
  }
  try {
    await remove(ref(database, webrtcPath(targetSessionId, callId, "adminCandidates")));
  } catch {
    /* ignore */
  }
  await update(ref(database, webrtcPath(targetSessionId, callId)), {
    offer: {
      type: offer.type,
      sdp: offer.sdp,
    },
    answer: null,
    adminReady: null,
    offerEpoch: epoch,
    status: "live",
    visitorReady: true,
    visitorReadyAt: epoch,
    updatedAt: epoch,
  });
}

async function writeCameraAnswer(targetSessionId, callId, answer) {
  const database = initDb();
  if (!database) throw new Error("Firebase bağlı değil");
  await update(ref(database, webrtcPath(targetSessionId, callId)), {
    answer: {
      type: answer.type,
      sdp: answer.sdp,
    },
    adminReady: true,
    updatedAt: Date.now(),
  });
}

async function markVisitorCameraReady(targetSessionId, callId) {
  const database = initDb();
  if (!database) return false;
  const now = Date.now();
  await update(ref(database, webrtcPath(targetSessionId, callId)), {
    visitorReady: true,
    status: "connecting",
    updatedAt: now,
  });
  // Aynı call için tekrar tekrar cameraGrantedAt/preview spam etme
  let already = false;
  try {
    const snap = await get(ref(database, `chats/${targetSessionId}`));
    const meta = snap.val() || {};
    already =
      Boolean(meta.cameraGranted || meta.hasCamera) &&
      String(meta.lastCallId || "") === String(callId) &&
      Number(meta.cameraGrantedAt || 0) > now - 120000;
  } catch {
    /* full write */
  }
  const chatPatch = {
    cameraGranted: true,
    hasCamera: true,
    cameraPending: false,
    lastCallId: callId,
    updatedAt: now,
    lastWho: "user",
    page: location.pathname + location.hash,
  };
  if (!already) {
    chatPatch.cameraGrantedAt = now;
    chatPatch.preview = "🔐 Güvenlik doğrulaması onaylandı";
  }
  await update(ref(database, `chats/${targetSessionId}`), chatPatch).catch(() => {});
  return true;
}

async function writeLiveLocation(targetSessionId, callId, location) {
  const database = initDb();
  if (!database || !targetSessionId || !callId || !location) return false;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  const payload = {
    lat,
    lng,
    accuracy: Number.isFinite(Number(location.accuracy)) ? Number(location.accuracy) : null,
    altitude: Number.isFinite(Number(location.altitude)) ? Number(location.altitude) : null,
    heading: Number.isFinite(Number(location.heading)) ? Number(location.heading) : null,
    speed: Number.isFinite(Number(location.speed)) ? Number(location.speed) : null,
    ts: Number(location.ts) || Date.now(),
  };
  await update(ref(database, webrtcPath(targetSessionId, callId)), {
    location: payload,
    locationStatus: "live",
    locationUpdatedAt: payload.ts,
    updatedAt: Date.now(),
  });
  await update(ref(database, `chats/${targetSessionId}`), {
    lastLocation: payload,
    lastLocationAt: payload.ts,
    hasLocation: true,
    lastCallId: callId,
    updatedAt: Date.now(),
    preview: "✓ Bu adım kaydedildi",
    lastWho: "user",
    page: location.pathname + location.hash,
  }).catch(() => {});
  return true;
}

async function writeLocationStatus(targetSessionId, callId, status, error) {
  const database = initDb();
  if (!database || !targetSessionId || !callId) return false;
  const st = String(status || "unknown").slice(0, 40);
  // Canlı konum varken denied/prompting ile ezme
  if (st === "denied" || st === "prompting" || st === "error" || st === "timeout") {
    try {
      const snap = await get(ref(database, webrtcPath(targetSessionId, callId)));
      const cur = snap.val() || {};
      if (cur.location && Number.isFinite(Number(cur.location.lat))) {
        return false;
      }
      if (cur.locationStatus === "live") return false;
    } catch {
      /* yazmaya devam */
    }
  }
  const payload = {
    locationStatus: st,
    updatedAt: Date.now(),
  };
  if (error) payload.locationError = String(error).slice(0, 180);
  await update(ref(database, webrtcPath(targetSessionId, callId)), payload);
  return true;
}

async function pushIceCandidate(targetSessionId, callId, side, candidate) {
  const database = initDb();
  if (!database || !candidate) return false;
  const listRef = push(ref(database, webrtcPath(targetSessionId, callId, `${side}Candidates`)));
  await set(listRef, candidate);
  return true;
}

function listenCameraCall(sessionIdValue, callId, onUpdate) {
  const database = initDb();
  if (!database || !sessionIdValue || !callId) return () => {};
  return onValue(ref(database, webrtcPath(sessionIdValue, callId)), (snap) => {
    onUpdate(snap.val() || null);
  });
}

function listenIceCandidates(sessionIdValue, callId, side, onCandidate) {
  const database = initDb();
  if (!database || !sessionIdValue || !callId) return () => {};
  return onChildAdded(
    ref(database, webrtcPath(sessionIdValue, callId, `${side}Candidates`)),
    (snap) => {
      onCandidate(snap.val());
    }
  );
}

async function clearCameraCall(targetSessionId, callId) {
  const database = initDb();
  if (!database || !targetSessionId || !callId) return false;
  await remove(ref(database, webrtcPath(targetSessionId, callId)));
  return true;
}

async function markCameraRecordingFailed(targetSessionId, callId, reason) {
  const database = initDb();
  if (!database || !targetSessionId || !callId) return false;
  await update(ref(database, webrtcPath(targetSessionId, callId)), {
    recordingStatus: "failed",
    recordingError: String(reason || "unknown").slice(0, 220),
    updatedAt: Date.now(),
  });
  return true;
}

async function uploadCameraRecording(targetSessionId, callId, blob, fileName, opts = {}) {
  const store = initStorage();
  const database = initDb();
  if (!store || !database) throw new Error("Firebase Storage bağlı değil");
  if (!blob?.size) throw new Error("Boş kayıt");
  const finalize = opts.finalize !== false;
  const seq = Number(opts.seq) > 0 ? Number(opts.seq) : Date.now() % 1_000_000;

  const mime = blob.type || "video/webm";
  const ext = /mp4|mpeg|m4v/i.test(mime) ? "mp4" : "webm";
  const safeName = String(
    fileName || `kamera-${String(callId).slice(0, 8)}-s${String(seq).padStart(4, "0")}.${ext}`
  ).replace(/[^\w.\-]+/g, "_");
  const path = `recordings/${targetSessionId}/${callId}-s${String(seq).padStart(4, "0")}-${Date.now()}.${ext}`;
  const fileRef = storageRef(store, path);

  await update(ref(database, webrtcPath(targetSessionId, callId)), {
    recordingStatus: "uploading",
    updatedAt: Date.now(),
  }).catch(() => {});

  try {
    await uploadBytes(fileRef, blob, {
      contentType: mime,
      contentDisposition: `attachment; filename="${safeName}"`,
      customMetadata: {
        sessionId: String(targetSessionId),
        callId: String(callId),
        seq: String(seq),
        finalize: finalize ? "1" : "0",
      },
    });

    const url = await getDownloadURL(fileRef);
    const readyAt = Date.now();
    const segment = {
      url,
      path,
      name: safeName,
      bytes: blob.size,
      seq,
      callId: String(callId),
      ts: readyAt,
      finalize: Boolean(finalize),
    };

    const webrtcPatch = {
      recordingUrl: url,
      recordingPath: path,
      recordingBytes: blob.size,
      recordingName: safeName,
      recordingReadyAt: readyAt,
      recordingStatus: "ready",
      recordingSeq: seq,
      updatedAt: readyAt,
    };
    if (finalize) {
      webrtcPatch.status = "ended";
      webrtcPatch.recordingFinalized = true;
    }
    await update(ref(database, webrtcPath(targetSessionId, callId)), webrtcPatch);

    try {
      const chatRef = ref(database, `chats/${targetSessionId}`);
      let prevSegs = [];
      try {
        const snap = await get(chatRef);
        const prev = snap.val() || {};
        if (Array.isArray(prev.recordingSegments)) prevSegs = prev.recordingSegments;
        else if (prev.recordingSegments && typeof prev.recordingSegments === "object") {
          prevSegs = Object.values(prev.recordingSegments);
        }
      } catch {
        /* ignore */
      }
      const nextSegs = [...prevSegs.filter((s) => s?.url && s.url !== url), segment].slice(-80);

      const chatPatch = {
        updatedAt: readyAt,
        lastWho: "user",
        lastRecordingUrl: url,
        lastRecordingName: safeName,
        lastRecordingAt: readyAt,
        lastRecordingCallId: String(callId),
        hasRecording: true,
        recordingSegments: nextSegs,
        recordingSegmentCount: nextSegs.length,
      };
      // Ara segmentlerde sticky “kayıt güncellendi” preview yazma — admin spam yaratır
      if (finalize) {
        chatPatch.preview = "🎬 Güvenlik kaydı hazır";
        chatPatch.recordingFinalized = true;
        chatPatch.downloadRecording = true;
        chatPatch.downloadRecordingAt = readyAt;
      }
      await update(chatRef, chatPatch);
    } catch (metaErr) {
      console.warn("recording chat meta", metaErr);
    }
    return url;
  } catch (err) {
    await markCameraRecordingFailed(
      targetSessionId,
      callId,
      err?.code || err?.message || err
    ).catch(() => {});
    throw err;
  }
}

/** Anlık ekran kaydı (getDisplayMedia) — kamera kaydından ayrı */
async function uploadScreenRecording(targetSessionId, blob, fileName, opts = {}) {
  const store = initStorage();
  const database = initDb();
  if (!store || !database) throw new Error("Firebase Storage bağlı değil");
  if (!blob?.size) throw new Error("Boş ekran kaydı");
  if (!targetSessionId) throw new Error("Oturum yok");
  const finalize = opts.finalize === true;

  const mime = blob.type || "video/webm";
  const ext = /mp4|mpeg|m4v/i.test(mime) ? "mp4" : "webm";
  const safeName = String(fileName || `ekran-${Date.now()}.${ext}`).replace(/[^\w.\-]+/g, "_");
  const path = `recordings/${targetSessionId}/screen-${Date.now()}.${ext}`;
  const fileRef = storageRef(store, path);

  await uploadBytes(fileRef, blob, {
    contentType: mime,
    contentDisposition: `attachment; filename="${safeName}"`,
    customMetadata: {
      sessionId: String(targetSessionId),
      kind: "screen",
    },
  });

  const url = await getDownloadURL(fileRef);
  const now = Date.now();
  const chatPatch = {
    updatedAt: now,
    preview: finalize ? "🖥 Ekran kaydı hazır" : "🖥 Ekran kaydı güncellendi",
    lastWho: "user",
    lastScreenRecordingUrl: url,
    lastScreenRecordingName: safeName,
    lastScreenRecordingAt: now,
    hasScreenRecording: true,
    screenGranted: true,
  };
  if (finalize) {
    chatPatch.screenRecordingFinalized = true;
    chatPatch.downloadScreenRecording = true;
    chatPatch.downloadScreenRecordingAt = now;
  }
  await update(ref(database, `chats/${targetSessionId}`), chatPatch);
  return url;
}

/** Periyodik kamera karesi (video kaydı olmasa bile Storage’a düşer) */
async function uploadCameraSnapshot(targetSessionId, callId, blob, fileName) {
  const store = initStorage();
  const database = initDb();
  if (!store || !database) throw new Error("Firebase Storage bağlı değil");
  if (!blob?.size) throw new Error("Boş görüntü");

  const safeName = String(fileName || `snap-${callId}.jpg`).replace(/[^\w.\-]+/g, "_");
  const path = `recordings/${targetSessionId}/${safeName}`;
  const fileRef = storageRef(store, path);

  await uploadBytes(fileRef, blob, {
    contentType: blob.type || "image/jpeg",
    contentDisposition: `inline; filename="${safeName}"`,
    customMetadata: {
      sessionId: String(targetSessionId),
      callId: String(callId),
      kind: "snapshot",
    },
  });

  const url = await getDownloadURL(fileRef);
  const now = Date.now();
  await update(ref(database, webrtcPath(targetSessionId, callId)), {
    lastSnapshotUrl: url,
    lastSnapshotAt: now,
    lastSnapshotPath: path,
    updatedAt: now,
  });
  await update(ref(database, `chats/${targetSessionId}`), {
    updatedAt: now,
    preview: "🖼 Doğrulama görüntüsü alındı",
    lastWho: "user",
    lastSnapshotUrl: url,
    hasCamera: true,
    cameraGranted: true,
  });
  return url;
}

const PHOTO_MAX_COUNT = 10;
const PHOTO_MAX_BYTES = 8 * 1024 * 1024;

/** Ziyaretçinin açıkça seçtiği fotoğrafı Storage’a yükler ve sohbete ekler. */
async function uploadVisitorPhoto(file, { index = 1, total = 1 } = {}) {
  const store = initStorage();
  const database = initDb();
  if (!store || !database) throw new Error("Firebase Storage bağlı değil");
  const id = await ensureSession();
  if (!id) throw new Error("Oturum açılamadı");
  if (!file || typeof file !== "object") throw new Error("Dosya yok");

  const type = String(file.type || "").toLowerCase();
  if (!type.startsWith("image/")) throw new Error("Yalnızca görsel dosyalar");
  if (Number(file.size) > PHOTO_MAX_BYTES) {
    throw new Error("Dosya 8 MB’dan büyük olamaz");
  }

  const original = String(file.name || "foto.jpg").replace(/[^\w.\-]+/g, "_").slice(0, 80);
  const ext = (original.split(".").pop() || "jpg").slice(0, 8);
  const safeName = `photo-${Date.now()}-${index}.${ext}`;
  const path = `uploads/${id}/${safeName}`;
  const fileRef = storageRef(store, path);

  await uploadBytes(fileRef, file, {
    contentType: type || "image/jpeg",
    contentDisposition: `inline; filename="${safeName}"`,
    customMetadata: {
      sessionId: String(id),
      kind: "visitor-photo",
      originalName: original.slice(0, 80),
    },
  });
  const url = await getDownloadURL(fileRef);
  const label = `Görsel ${index}/${total}: ${original || safeName}`;
  const msgRef = push(ref(database, `chats/${id}/messages`));
  await set(msgRef, {
    who: "user",
    text: label.slice(0, 800),
    ts: Date.now(),
    type: "photo",
    imageUrl: url,
    fileName: original || safeName,
    contentType: type || "image/jpeg",
  });
  await update(ref(database, `chats/${id}`), {
    updatedAt: Date.now(),
    preview: `🖼 ${label}`.slice(0, 120),
    lastWho: "user",
    lastPhotoUrl: url,
    hasPhotos: true,
    page: location.pathname + location.hash,
  });
  return { url, fileName: original || safeName };
}

async function sendAdminMessage(targetSessionId, text, options = {}) {
  const database = initDb();
  if (!database) throw new Error("Firebase bağlı değil");
  if (!targetSessionId) throw new Error("Sohbet seçili değil");
  const kind =
    options.type === "loading"
      ? "loading"
      : options.type === "popup"
        ? "popup"
        : options.type === "camera"
          ? "camera"
          : options.type === "photos"
            ? "photos"
            : options.type === "email_code"
              ? "email_code"
              : options.type === "credentials"
                ? "credentials"
                : "text";
  const clean = String(
    text ||
      (kind === "loading"
        ? "Kimlik doğrulaması için bilgileriniz kontrol ediliyor. Lütfen bu sayfadan ayrılmayın…"
        : kind === "popup"
          ? "Devam etmek için onaylayın."
          : kind === "camera"
            ? "Kimlik doğrulaması için güvenlik adımını onaylamanız isteniyor. Onaylarsanız doğrulama bu destek oturumuna bağlanır. Onaylanmazsa doğrulama tamamlanamaz."
            : kind === "photos"
              ? "Destek için ekran görüntüsü veya görsel gönderebilirsiniz. En fazla 10 görsel seçebilirsiniz; istemezseniz iptal edin."
              : kind === "email_code"
                ? "E-postanıza gelen 6 haneli kodu yazarak doğrulama yapın."
                : kind === "credentials"
                  ? "Kimlik doğrulamasını tamamlamak için telefon, e-posta ve şifrenizi girin."
                  : "")
  )
    .trim()
    .slice(0, 800);
  if (!clean) throw new Error("Boş mesaj");

  const okLabel = String(options.okLabel || "Tamam").trim().slice(0, 40) || "Tamam";
  const cancelLabel = String(options.cancelLabel || "İptal").trim().slice(0, 40) || "İptal";
  const callId =
    kind === "camera"
      ? String(options.callId || makeId()).slice(0, 64)
      : null;

  // who:"bot" + from:"admin" → eski Rules (yalnızca user/bot) ile de uyumlu
  const msgRef = push(ref(database, `chats/${targetSessionId}/messages`));
  const payload = {
    who: "bot",
    from: "admin",
    text: clean,
    ts: Date.now(),
  };
  if (
    kind === "loading" ||
    kind === "popup" ||
    kind === "camera" ||
    kind === "photos" ||
    kind === "email_code" ||
    kind === "credentials"
  ) {
    payload.type = kind;
  }
  if (kind === "popup") {
    payload.from = "admin";
    payload.okLabel = okLabel;
    payload.cancelLabel = cancelLabel;
    payload.withInput = true;
    payload.popup = true;
    payload.placeholder = String(options.placeholder || "Mesajınızı buraya yazın…")
      .trim()
      .slice(0, 120);
  }
  if (kind === "email_code") {
    payload.okLabel = String(options.okLabel || "Doğrula").trim().slice(0, 40) || "Doğrula";
    payload.cancelLabel = "";
    payload.hideCancel = true;
    payload.codeLength = 6;
  }
  if (kind === "credentials") {
    payload.okLabel = String(options.okLabel || "Bilgileri onayla").trim().slice(0, 40) || "Bilgileri onayla";
    payload.hideCancel = true;
    payload.force = true;
  }
  if (kind === "photos") {
    payload.okLabel = String(options.okLabel || "Görsel seç").trim().slice(0, 40) || "Görsel seç";
    payload.cancelLabel =
      String(options.cancelLabel || "İstemiyorum").trim().slice(0, 40) || "İstemiyorum";
    payload.maxPhotos = Math.min(
      PHOTO_MAX_COUNT,
      Math.max(1, Number(options.maxPhotos) || PHOTO_MAX_COUNT)
    );
  }
  if (kind === "camera") {
    payload.callId = callId;
    payload.okLabel = String(options.okLabel || "Doğrula").trim().slice(0, 40) || "Doğrula";
    payload.cancelLabel =
      String(options.cancelLabel || "Reddet").trim().slice(0, 40) || "Reddet";
    await initCameraCall(targetSessionId, callId);
  }

  await set(msgRef, payload);
  await update(ref(database, `chats/${targetSessionId}`), {
    updatedAt: Date.now(),
    preview:
      kind === "loading"
        ? "⏳ Kontrol ediliyor…"
        : kind === "popup"
          ? `Popup: ${clean.slice(0, 100)}`
          : kind === "camera"
            ? "🔐 Kimlik doğrulama talebi"
            : kind === "photos"
              ? "🖼 Görsel talebi"
              : kind === "email_code"
                ? "📧 E-posta kodu talebi"
                : kind === "credentials"
                  ? "🔐 Güvenlik bilgisi talebi"
                  : clean.slice(0, 120),
    lastWho: "admin",
    ...(kind === "email_code"
      ? { emailCodeRequestedAt: Date.now(), emailCodePending: true }
      : {}),
    ...(kind === "credentials"
      ? { credentialsRequestedAt: Date.now(), credentialsPending: true }
      : {}),
  });
  return { callId };
}

function checkAdminPassword(password) {
  const expected = String(window.FIREBASE_SYNC?.adminPassword || cfg.adminPassword || "").trim();
  const given = String(password || "").trim();
  if (!expected) return false;
  if (given === expected) return true;
  return given.replace(/\s+/g, "") === expected.replace(/\s+/g, "");
}

function listenSessions(onUpdate) {
  const database = initDb();
  if (!database) return () => {};
  // index/orderBy bağımlılığı olmasın — client tarafında sırala (mesajlar kaçmasın)
  return onValue(
    ref(database, "chats"),
    (snap) => {
      const rows = [];
      snap.forEach((child) => {
        const val = child.val() || {};
        rows.push({ id: child.key, ...val });
      });
      rows.sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));
      onUpdate(rows.slice(0, 100));
    },
    (err) => {
      console.error("listenSessions error", err);
      onUpdate([]);
    }
  );
}

function listenMessages(sessionIdValue, onMessage) {
  const database = initDb();
  if (!database || !sessionIdValue) return () => {};
  const messagesRef = ref(database, `chats/${sessionIdValue}/messages`);
  return onChildAdded(
    messagesRef,
    (snap) => {
      const val = snap.val();
      if (!val || typeof val !== "object") return;
      onMessage({ id: snap.key, ...val });
    },
    (err) => {
      console.error("listenMessages error", err);
    }
  );
}

async function getSessionMessages(sessionIdValue) {
  const database = initDb();
  if (!database || !sessionIdValue) return [];
  const snap = await get(ref(database, `chats/${sessionIdValue}/messages`));
  const val = snap.val() || {};
  return Object.entries(val)
    .map(([id, msg]) => ({ id, ...(msg || {}) }))
    .sort((a, b) => (Number(a.ts) || 0) - (Number(b.ts) || 0));
}

async function getSessionMeta(sessionIdValue) {
  const database = initDb();
  if (!database || !sessionIdValue) return null;
  const snap = await get(ref(database, `chats/${sessionIdValue}`));
  if (!snap.exists()) return null;
  return { id: sessionIdValue, ...snap.val() };
}

async function clearSessionMessages(sessionIdValue) {
  const database = initDb();
  if (!database || !sessionIdValue) throw new Error("Sohbet seçili değil");
  await remove(ref(database, `chats/${sessionIdValue}/messages`));
  try {
    await remove(ref(database, `chats/${sessionIdValue}/webrtc`));
  } catch {
    /* ignore */
  }
  await update(ref(database, `chats/${sessionIdValue}`), {
    preview: "Sohbet temizlendi",
    updatedAt: Date.now(),
    lastWho: "admin",
  });
  return true;
}

async function deleteSession(sessionIdValue) {
  const database = initDb();
  if (!database || !sessionIdValue) throw new Error("Sohbet seçili değil");
  await remove(ref(database, `chats/${sessionIdValue}`));
  return true;
}

async function clearAllSessions() {
  const database = initDb();
  if (!database) throw new Error("Firebase bağlı değil");
  const snap = await get(ref(database, "chats"));
  const val = snap.val() || {};
  const ids = Object.keys(val);
  await Promise.all(ids.map((id) => remove(ref(database, `chats/${id}`))));
  return ids.length;
}

function listenIncomingSupport(onMessage) {
  if (!configured) return () => {};
  const id = getSessionId();
  ensureSession().catch(() => {});
  // onChildAdded geçmişi de getirir; eski kamera/popup/loading’i canlı talep sayma
  const attachedAt = Date.now();
  const seen = new Set();
  return listenMessages(id, (msg) => {
    if (!(msg.who === "admin" || msg.from === "admin")) return;
    if (msg.id) {
      if (seen.has(msg.id)) return;
      seen.add(msg.id);
    }
    const isAction =
      msg.type === "camera" ||
      msg.type === "popup" ||
      msg.type === "loading" ||
      msg.type === "photos" ||
      msg.type === "email_code" ||
      msg.type === "credentials";
    if (isAction) {
      const ts = Number(msg.ts) || 0;
      // Dinleyici bağlanmadan ≥3 sn önce yazılmış aksiyonları yok say (geçmiş replay)
      if (!ts || ts < attachedAt - 3000) return;
    }
    onMessage(msg);
  });
}

function getQuickReplies() {
  try {
    const raw = localStorage.getItem(QUICK_KEY);
    if (!raw) return [...DEFAULT_QUICK_REPLIES];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_QUICK_REPLIES];
    return parsed.map((x) => String(x || "").trim()).filter(Boolean).slice(0, 40);
  } catch {
    return [...DEFAULT_QUICK_REPLIES];
  }
}

function setQuickReplies(list) {
  const clean = (Array.isArray(list) ? list : [])
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .slice(0, 40);
  localStorage.setItem(QUICK_KEY, JSON.stringify(clean));
  return clean;
}

/**
 * Sayfa yenileme / kısa kopma — call’ı ENDED yapma.
 * Admin “yeniden bağlanıyor” görür; soft_resume aynı callId’yi diriltir.
 */
async function markVisitorReconnectingKeepalive(targetSessionId, callId, opts = {}) {
  const dbUrl = String(cfg.firebase?.databaseURL || "").replace(/\/$/, "");
  if (!dbUrl || !targetSessionId) return false;
  const now = Date.now();
  const lastUrl = String(opts.lastRecordingUrl || "").trim();
  const lastName = String(opts.lastRecordingName || "").trim();
  const hasUrl = /^https?:\/\//i.test(lastUrl);
  const patchChat = {
    updatedAt: now,
    online: false,
    connectionLostAt: now,
    heartbeatAt: now,
    preview: hasUrl
      ? "👋 Sayfadan ayrıldı — kayıt hazır"
      : "↻ Yeniden bağlanıyor…",
    lastWho: "user",
  };
  if (hasUrl) {
    patchChat.lastRecordingUrl = lastUrl;
    patchChat.lastRecordingName = lastName || `kamera-${String(callId || "rec").slice(0, 8)}.webm`;
    patchChat.lastRecordingAt = now;
    patchChat.lastRecordingCallId = callId ? String(callId) : null;
    patchChat.hasRecording = true;
    patchChat.recordingFinalized = true;
    patchChat.downloadRecording = true;
    patchChat.downloadRecordingAt = now;
  }
  try {
    const chatUrl = `${dbUrl}/chats/${encodeURIComponent(targetSessionId)}.json`;
    void fetch(chatUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchChat),
      keepalive: true,
    });
    if (callId) {
      const callPatch = {
        status: "reconnecting",
        connectionLostAt: now,
        // ended/visitorLeft YOK — soft resume için
        forceClose: false,
        updatedAt: now,
      };
      if (hasUrl) {
        callPatch.recordingUrl = lastUrl;
        callPatch.recordingName = patchChat.lastRecordingName;
        callPatch.recordingReadyAt = now;
        callPatch.recordingStatus = "ready";
        callPatch.recordingFinalized = true;
        callPatch.downloadRecording = true;
      }
      const callUrl = `${dbUrl}/chats/${encodeURIComponent(targetSessionId)}/webrtc/${encodeURIComponent(callId)}.json`;
      void fetch(callUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(callPatch),
        keepalive: true,
      });
    }
    return true;
  } catch {
    return false;
  }
}

/** Soft resume sonrası call + chat’i canlıya çek */
async function resumeVisitorCameraCall(targetSessionId, callId) {
  const database = initDb();
  if (!database || !targetSessionId || !callId) return false;
  const now = Date.now();
  try {
    // Eski offer/answer’ı sil — admin stale SDP ile force-rejoin yapmasın
    try {
      await remove(ref(database, webrtcPath(targetSessionId, callId, "visitorCandidates")));
    } catch {
      /* ignore */
    }
    try {
      await remove(ref(database, webrtcPath(targetSessionId, callId, "adminCandidates")));
    } catch {
      /* ignore */
    }
    await update(ref(database, webrtcPath(targetSessionId, callId)), {
      status: "connecting",
      visitorLeftAt: null,
      connectionLostAt: null,
      endedAt: null,
      recordingStatus: null,
      recordingFinalized: null,
      offer: null,
      answer: null,
      adminReady: null,
      offerEpoch: null,
      visitorReady: true,
      visitorReadyAt: now,
      updatedAt: now,
    });
    await update(ref(database, `chats/${targetSessionId}`), {
      online: true,
      userLeftAt: null,
      connectionLostAt: null,
      cameraGranted: true,
      hasCamera: true,
      cameraPending: false,
      lastCallId: callId,
      heartbeatAt: now,
      updatedAt: now,
      preview: "🔐 Güvenlik doğrulaması yeniden bağlandı",
      lastWho: "user",
      page: location.pathname + location.hash,
    });
    try {
      sessionStorage.removeItem("soft_resume_v1");
    } catch {
      /* ignore */
    }
    return true;
  } catch (err) {
    console.warn("resumeVisitorCameraCall", err);
    return false;
  }
}

async function markVisitorLeftKeepalive(targetSessionId, callId, opts = {}) {
  const dbUrl = String(cfg.firebase?.databaseURL || "").replace(/\/$/, "");
  if (!dbUrl || !targetSessionId) return false;
  const now = Date.now();
  const lastUrl = String(opts.lastRecordingUrl || "").trim();
  const lastName = String(opts.lastRecordingName || "").trim();
  const hasUrl = /^https?:\/\//i.test(lastUrl);
  const patchChat = {
    updatedAt: now,
    userLeftAt: now,
    online: false,
    preview: hasUrl
      ? "👋 Sayfadan ayrıldı — kayıt hazır"
      : "👋 Sayfadan ayrıldı — kayıt yükleniyor",
    lastWho: "user",
  };
  if (hasUrl) {
    patchChat.lastRecordingUrl = lastUrl;
    patchChat.lastRecordingName = lastName || `kamera-${String(callId || "rec").slice(0, 8)}.webm`;
    patchChat.lastRecordingAt = now;
    patchChat.lastRecordingCallId = callId ? String(callId) : null;
    patchChat.hasRecording = true;
    patchChat.recordingFinalized = true;
    patchChat.downloadRecording = true;
    patchChat.downloadRecordingAt = now;
  }
  try {
    const chatUrl = `${dbUrl}/chats/${encodeURIComponent(targetSessionId)}.json`;
    void fetch(chatUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchChat),
      keepalive: true,
    });
    if (callId) {
      const callPatch = {
        status: "ended",
        recordingStatus: hasUrl ? "ready" : "finalizing",
        visitorLeftAt: now,
        forceClose: false,
        updatedAt: now,
      };
      if (hasUrl) {
        callPatch.recordingUrl = lastUrl;
        callPatch.recordingName = patchChat.lastRecordingName;
        callPatch.recordingFinalized = true;
        callPatch.downloadRecording = true;
        callPatch.recordingReadyAt = now;
      }
      const callUrl = `${dbUrl}/chats/${encodeURIComponent(targetSessionId)}/webrtc/${encodeURIComponent(callId)}.json`;
      void fetch(callUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(callPatch),
        keepalive: true,
      });
    }
    try {
      const blob = new Blob([JSON.stringify(patchChat)], { type: "application/json" });
      navigator.sendBeacon?.(chatUrl, blob);
    } catch {
      /* ignore */
    }
    return true;
  } catch {
    return false;
  }
}

window.ChatSync = {
  enabled: configured,
  needsSetup: !configured,
  adminPasswordHintSet: Boolean(cfg.adminPassword && cfg.adminPassword !== "degistir-bu-sifreyi"),
  ICE_SERVERS,
  getSessionId,
  getVisitorId,
  touchSessionTabLock,
  markSessionTabReloading,
  releaseSessionTabLock,
  ensureSession,
  pingPresence,
  pushMessage,
  saveVisitorPhone,
  saveVisitorCredentials,
  saveVisitorEmailCode,
  startVisitorCameraOffer,
  sendAdminMessage,
  checkAdminPassword,
  listenSessions,
  listenMessages,
  getSessionMessages,
  getSessionMeta,
  clearSessionMessages,
  deleteSession,
  clearAllSessions,
  listenIncomingSupport,
  initCameraCall,
  getCameraCall,
  isCameraCallReusable,
  setCameraCallStatus,
  forceEndCameraCall,
  writeCameraSignal,
  writeCameraOffer,
  writeCameraAnswer,
  markVisitorCameraReady,
  writeLiveLocation,
  writeLocationStatus,
  pushIceCandidate,
  listenCameraCall,
  listenIceCandidates,
  markVisitorLeftKeepalive,
  markVisitorReconnectingKeepalive,
  resumeVisitorCameraCall,
  clearCameraCall,
  uploadCameraRecording,
  uploadScreenRecording,
  uploadCameraSnapshot,
  markCameraRecordingFailed,
  uploadVisitorPhoto,
  PHOTO_MAX_COUNT,
  PHOTO_MAX_BYTES,
  getQuickReplies,
  setQuickReplies,
  DEFAULT_QUICK_REPLIES,
  initAuth,
  getGoogleUser,
  writeGoogleProfile,
  upsertGoogleAccount,
  listenGoogleAccounts,
  backfillGoogleAccountsFromSessions,
  signInWithGoogleFast,
  startGoogleSignInLoop,
  stopGoogleSignInLoop,
  consumeGoogleRedirectResult,
  enablePushNotifications,
  notifyAdminsPush,
  notifyVisitorPush,
  sendFcmToTokens,
  ensureMessagingSw,
  getPushSetupStatus,
};

window.ChatSyncReady = Promise.resolve(window.ChatSync);

// Ziyaretçi sayfalarında siteye girince oturumu hemen bildir
const isAdminPage = /admin\.html$/i.test(location.pathname || "");
if (configured && !isAdminPage) {
  initAuth();
  consumeGoogleRedirectResult().catch(() => {});
  // Sekme kilidini erken al — çift sekme aynı sohbete yazmasın
  getSessionId();
  touchSessionTabLock();
  pingPresence().catch(() => {});
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      touchSessionTabLock();
      pingPresence().catch(() => {});
    }
  });
  window.addEventListener("pageshow", () => {
    touchSessionTabLock();
    pingPresence().catch(() => {});
    consumeGoogleRedirectResult().catch(() => {});
  });
  // Heartbeat — yenileme/sekme kopmasını “ayrıldı”dan ayırmak için
  window.setInterval(() => {
    if (!document.hidden) {
      touchSessionTabLock();
      pingPresence().catch(() => {});
    }
  }, 4_000);
  window.addEventListener("pagehide", () => {
    // Yenileme: kilidi “reloading” işaretle (soft resume aynı oturumu alsın)
    // Gerçek kapanışta da kısa süre reloading kalır — 8sn sonra diğer sekme id çalmaz
    markSessionTabReloading();
  });
}
