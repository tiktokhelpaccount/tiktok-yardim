async function ready() {
  if (window.ChatSync) return window.ChatSync;
  if (window.ChatSyncReady) return window.ChatSyncReady;
  return new Promise((resolve) => {
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      if (window.ChatSync || n > 60) {
        clearInterval(t);
        resolve(window.ChatSync || null);
      }
    }, 50);
  });
}

function fmtTime(ts) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortId(id) {
  return String(id || "").slice(0, 8);
}

const setupPanel = document.getElementById("setup-panel");
const loginPanel = document.getElementById("login-panel");
const dashPanel = document.getElementById("dash-panel");
const liveBadge = document.getElementById("live-badge");
const notifyBtn = document.getElementById("notify-btn");
const logoutBtn = document.getElementById("logout-btn");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const sessionList = document.getElementById("session-list");
const sessionCount = document.getElementById("session-count");
const threadTitle = document.getElementById("thread-title");
const threadMeta = document.getElementById("thread-meta");
const threadMessages = document.getElementById("thread-messages");

let unsubSessions = null;
let unsubMessages = null;
let selectedId = null;
let seenMessageIds = new Set();
let notifyEnabled = false;

function show(view) {
  setupPanel.hidden = view !== "setup";
  loginPanel.hidden = view !== "login";
  dashPanel.hidden = view !== "dash";
  liveBadge.hidden = view !== "dash";
  notifyBtn.hidden = view !== "dash";
  logoutBtn.hidden = view !== "dash";
}

function authOk() {
  return sessionStorage.getItem("admin_ok") === "1";
}

function setAuth(ok) {
  if (ok) sessionStorage.setItem("admin_ok", "1");
  else sessionStorage.removeItem("admin_ok");
}

function renderSessions(rows) {
  sessionCount.textContent = `${rows.length} oturum`;
  sessionList.innerHTML = "";
  if (!rows.length) {
    sessionList.innerHTML = '<li class="session-empty">Henüz sohbet yok. Sitede bir sohbet başlatın.</li>';
    return;
  }

  rows.forEach((row) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "session-item" + (row.id === selectedId ? " is-active" : "");
    btn.dataset.sessionId = row.id;
    btn.innerHTML = `
      <strong>#${shortId(row.id)}</strong>
      <span>${escapeHtml(row.preview || "Mesaj yok")}</span>
      <em>${fmtTime(row.updatedAt)} · ${row.lastWho === "user" ? "ziyaretçi" : "bot"}</em>
    `;
    btn.addEventListener("click", () => openSession(row));
    li.appendChild(btn);
    sessionList.appendChild(li);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function appendThreadMessage(msg, announce) {
  if (!msg?.id || seenMessageIds.has(msg.id)) return;
  seenMessageIds.add(msg.id);

  const row = document.createElement("div");
  row.className = `chat-bubble chat-${msg.who === "user" ? "user" : "bot"}`;
  const meta = document.createElement("span");
  meta.className = "chat-meta";
  meta.textContent = `${msg.who === "user" ? "Ziyaretçi" : "Bot"} · ${fmtTime(msg.ts)}`;
  const body = document.createElement("p");
  body.textContent = msg.text || "";
  row.append(meta, body);
  threadMessages.appendChild(row);
  threadMessages.scrollTop = threadMessages.scrollHeight;

  if (announce && msg.who === "user" && notifyEnabled && document.hidden) {
    try {
      new Notification("Yeni ziyaretçi mesajı", {
        body: String(msg.text || "").slice(0, 120),
        tag: msg.id,
      });
    } catch {
      /* ignore */
    }
  }
}

function openSession(row) {
  selectedId = row.id;
  seenMessageIds = new Set();
  threadMessages.innerHTML = "";
  threadTitle.textContent = `Oturum #${shortId(row.id)}`;
  threadMeta.textContent = `${row.page || "/"} · ${fmtTime(row.updatedAt)}`;
  Array.from(sessionList.querySelectorAll(".session-item")).forEach((el) => {
    el.classList.toggle("is-active", el.dataset.sessionId === row.id);
  });

  if (unsubMessages) unsubMessages();
  unsubMessages = window.ChatSync.listenMessages(row.id, (msg) => {
    appendThreadMessage(msg, true);
  });
}

function startDash(sync) {
  show("dash");
  if (unsubSessions) unsubSessions();
  unsubSessions = sync.listenSessions((rows) => {
    renderSessions(rows);
    if (!selectedId && rows[0]) openSession(rows[0]);
  });
}

notifyBtn?.addEventListener("click", async () => {
  if (!("Notification" in window)) {
    notifyBtn.textContent = "Bildirim desteklenmiyor";
    return;
  }
  const perm = await Notification.requestPermission();
  notifyEnabled = perm === "granted";
  notifyBtn.textContent = notifyEnabled ? "Bildirimler açık" : "Bildirim reddedildi";
});

logoutBtn?.addEventListener("click", () => {
  setAuth(false);
  if (unsubSessions) unsubSessions();
  if (unsubMessages) unsubMessages();
  selectedId = null;
  show("login");
});

loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const pass = document.getElementById("admin-pass")?.value || "";
  if (!window.ChatSync?.checkAdminPassword(pass)) {
    loginError.hidden = false;
    loginError.textContent = "Şifre hatalı. firebase-config.js içindeki adminPassword ile aynı olmalı.";
    return;
  }
  loginError.hidden = true;
  setAuth(true);
  startDash(window.ChatSync);
});

const sync = await ready();
if (!sync || sync.needsSetup) {
  show("setup");
} else if (authOk()) {
  startDash(sync);
} else {
  show("login");
}
