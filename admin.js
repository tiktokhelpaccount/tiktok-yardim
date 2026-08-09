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
const hideCameraBtn = document.getElementById("hide-camera-btn");
const reopenCameraBtn = document.getElementById("reopen-camera-btn");
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
      Boolean(visible && /kayıt yapılıyor|Canlı ·/i.test(statusText || ""))
    );
  }
  // Popup açıkken yeniden aç butonu gizle; gizli ama oturum varsa göster
  if (reopenCameraBtn) {
    const sessionActive = Boolean(adminCall);
    reopenCameraBtn.hidden = visible || !sessionActive;
  }
}

function hideCameraPopup() {
  if (adminCameraBox) adminCameraBox.hidden = true;
  if (reopenCameraBtn) reopenCameraBtn.hidden = !adminCall;
}

function showCameraPopup() {
  if (!adminCall && downloadRecordingBtn?.hidden) return;
  if (adminCameraBox) adminCameraBox.hidden = false;
  if (reopenCameraBtn) reopenCameraBtn.hidden = true;
}

function clearRecordingLink() {
  if (!downloadRecordingBtn) return;
  if (downloadRecordingBtn.href?.startsWith("blob:")) {
    URL.revokeObjectURL(downloadRecordingBtn.href);
  }
  downloadRecordingBtn.removeAttribute("href");
  downloadRecordingBtn.hidden = true;
}

function forceDownloadFromUrl(url, name) {
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

  // contentDisposition=attachment ile iframe indirmeyi tetikler
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;width:0;height:0;border:0;visibility:hidden";
  iframe.src = url;
  document.body.appendChild(iframe);
  window.setTimeout(() => iframe.remove(), 120000);

  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    /* ignore */
  }

  window.setTimeout(() => {
    try {
      downloadRecordingBtn?.click();
    } catch {
      /* ignore */
    }
  }, 300);

  setCameraUi(true, "Kayıt otomatik indiriliyor (Storage)…");
  sendHint.hidden = false;
  sendHint.textContent = `Kayıt indiriliyor: ${fileName}`;
  window.setTimeout(() => {
    if (sendHint.textContent.includes("Kayıt")) sendHint.hidden = true;
  }, 5000);
}

function resetLiveVideoUi() {
  clearRecordingLink();
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
    // Yerel blob yedek; asıl indirme Storage URL ile yapılır
    if (blob.size && downloadRecordingBtn && downloadRecordingBtn.hidden) {
      const url = URL.createObjectURL(blob);
      downloadRecordingBtn.href = url;
      downloadRecordingBtn.download = `kamera-local-${shortId(state.sessionId)}.webm`;
      downloadRecordingBtn.hidden = false;
      downloadRecordingBtn.textContent = `Yerel yedek (${Math.round(blob.size / 1024)} KB)`;
    }
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
  if (adminCall?.callId === callId && adminCall?.sessionId === sessionId && adminCall?.pc) {
    showCameraPopup();
    return;
  }

  await stopAdminCall(false, { keepUi: true });
  resetLiveVideoUi();
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
    if (s === "connected") setCameraUi(true, "Canlı görüntü bağlı");
    if (s === "failed") setCameraUi(true, "Bağlantı başarısız — ağ/firewall");
    if (s === "disconnected") setCameraUi(true, "Bağlantı koptu…");
  };

  pc.oniceconnectionstatechange = () => {
    if (adminCall !== state) return;
    const s = pc.iceConnectionState;
    if (s === "connected" || s === "completed") {
      setCameraUi(true, "Canlı görüntü (ICE OK)");
    }
    if (s === "failed") {
      setCameraUi(true, "ICE başarısız — TURN denendi, ağ engeli olabilir");
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

    // Aktif canlı oturumdayken eski/geç recordingUrl indirme
    const isActive = data.status === "requested" || data.status === "live";
    if (
      !isActive &&
      (data.status === "ended" || callEnded) &&
      data.recordingUrl &&
      data.recordingUrl !== state.seenRecordingUrl
    ) {
      state.seenRecordingUrl = data.recordingUrl;
      forceDownloadFromUrl(
        data.recordingUrl,
        data.recordingName || `kamera-${shortId(sessionId)}.webm`
      );
    }

    if (data.status === "denied") {
      callEnded = true;
      setCameraUi(true, "Ziyaretçi kamerayı reddetti");
      await stopAdminCall(false, { keepUi: true });
      return;
    }
    if (data.status === "ended") {
      callEnded = true;
      try {
        state.unsubIce?.();
        state.unsubIce = null;
        state.pc?.close();
        state.pc = null;
        if (state.recorder && state.recorder.state !== "inactive") {
          try {
            state.recorder.stop();
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }
      if (adminRemoteVideo) adminRemoteVideo.srcObject = null;
      adminCameraBox?.classList.remove("is-recording");
      setCameraUi(
        true,
        data.recordingUrl
          ? "Kayıt indiriliyor…"
          : "Bağlantı kapandı · ziyaretçi kaydı yükleniyor…"
      );
      if (data.recordingUrl && data.recordingUrl !== state.seenRecordingUrl) {
        state.seenRecordingUrl = data.recordingUrl;
        forceDownloadFromUrl(
          data.recordingUrl,
          data.recordingName || `kamera-${shortId(sessionId)}.webm`
        );
      }
      return;
    }
    if (data.status === "requested") {
      clearRecordingLink();
      setCameraUi(true, "Ziyaretçi onayı bekleniyor…");
    }
    if (data.status === "live") {
      clearRecordingLink();
      setCameraUi(true, "Bağlanıyor · canlı video bekleniyor…");
    }
    // Bitmiş oturumun eski offer/answer'ına bağlanma
    if (callEnded) return;
    if (data.offer && !answered && state.pc) {
      answered = true;
      try {
        await state.pc.setRemoteDescription(
          data.offer instanceof RTCSessionDescription
            ? data.offer
            : new RTCSessionDescription(data.offer)
        );
        remoteReady = true;
        for (const cand of pendingVisitorIce.splice(0)) {
          await addVisitorIce(cand);
        }
        const answer = await state.pc.createAnswer();
        await state.pc.setLocalDescription(answer);
        await sync.writeCameraSignal(sessionId, callId, "answer", {
          type: answer.type,
          sdp: answer.sdp,
        });
        setCameraUi(true, "Yanıt gönderildi · video bekleniyor…");
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
  resetLiveVideoUi();
  if (reopenCameraBtn) reopenCameraBtn.hidden = true;
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
  const call = adminCall;
  if (!call) {
    setCameraUi(false);
    if (reopenCameraBtn) reopenCameraBtn.hidden = true;
    return;
  }
  setCameraUi(true, "Kapatıldı · ziyaretçi kaydı yükleniyor…");
  adminCameraBox?.classList.remove("is-recording");
  try {
    call.unsubIce?.();
    call.unsubIce = null;
    call.pc?.close();
    call.pc = null;
    if (call.recorder && call.recorder.state !== "inactive") {
      try {
        call.recorder.stop();
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
  if (adminRemoteVideo) adminRemoteVideo.srcObject = null;
  if (call.sessionId && call.callId && window.ChatSync) {
    await window.ChatSync.setCameraCallStatus(call.sessionId, call.callId, "ended").catch(() => {});
  }
  sendHint.hidden = false;
  sendHint.textContent =
    "Oturum sonlandırıldı. Ziyaretçi kaydı yüklenince otomatik iner. Gizlemek indirmez.";
  setCameraUi(true, "Kayıt yüklenmesi bekleniyor…");
  window.setTimeout(() => {
    if (sendHint.textContent.includes("Oturum sonlandırıldı")) sendHint.hidden = true;
  }, 4500);
});

hideCameraBtn?.addEventListener("click", () => {
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
