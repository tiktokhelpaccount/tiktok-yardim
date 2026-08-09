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
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";

const cfg = window.FIREBASE_SYNC || {};
const configured =
  Boolean(cfg.enabled) &&
  cfg.firebase &&
  cfg.firebase.apiKey &&
  !String(cfg.firebase.apiKey).startsWith("YOUR_");

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

function checkAdminPassword(password) {
  return String(password || "") === String(cfg.adminPassword || "");
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

window.ChatSync = {
  enabled: configured,
  needsSetup: !configured,
  adminPasswordHintSet: Boolean(cfg.adminPassword && cfg.adminPassword !== "degistir-bu-sifreyi"),
  pushMessage,
  checkAdminPassword,
  listenSessions,
  listenMessages,
};

window.ChatSyncReady = Promise.resolve(window.ChatSync);
