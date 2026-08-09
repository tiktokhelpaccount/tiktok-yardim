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
  const result = document.getElementById("appeal-result");
  const retryBtn = document.getElementById("retry-btn");

  function buildAppealSummary() {
    const reason = form?.querySelector('[name="reason"]')?.value || "Belirtilmedi";
    const defense = (form?.querySelector('[name="defense"]')?.value || "").trim();
    return {
      kicker: "Kontrol özeti",
      title: "İtiraz hazırlığınız tamam",
      body:
        `Neden: ${reason}. ` +
        (defense
          ? `Notunuz kaydedildi (yalnızca bu cihazda): “${defense.slice(0, 120)}${defense.length > 120 ? "…" : ""}”. `
          : "Savunma notu eklemediniz. ") +
        "Şimdi TikTok uygulamasından veya support.tiktok.com üzerinden resmi itirazı gönderin. Bu sayfa hiçbir hesabı etkilemez.",
    };
  }

  function showResult() {
    if (!result) return;
    const pick = buildAppealSummary();
    document.getElementById("result-kicker").textContent = pick.kicker;
    document.getElementById("result-title").textContent = pick.title;
    document.getElementById("result-body").textContent = pick.body;
    result.hidden = false;
    result.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    showResult();
  });

  retryBtn?.addEventListener("click", () => {
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    showResult();
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
    if (sync?.enabled) {
      sync.pushMessage(who, text).catch(() => {});
      return;
    }
    if (window.ChatSyncReady) {
      window.ChatSyncReady.then((readySync) => {
        if (readySync?.enabled) readySync.pushMessage(who, text).catch(() => {});
      });
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
      seedChat(box, quick);
      busy = true;
      appendMessage(
        box,
        "bot",
        "Sohbet sıfırlandı. Ban, izlenme veya görünürlük için kısayolları kullanın; hesap durumu kontrolü için ‘Hesabım kısıtlandı’ yazın."
      );
      busy = false;
    });

    quick?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-quick]");
      if (!btn) return;
      send(btn.getAttribute("data-quick") || btn.textContent || "");
    });

    seedChat(box, quick);
    busy = true;
    appendMessage(
      box,
      "bot",
      "Merhaba. Ben Yardım Asistanı. Ban, izlenme düşüşü veya görünürlük sorunlarında rehberlere yönlendirebilirim.\n\nHesap durumu kontrolü için ‘Hesabım kısıtlandı’ yazın veya aşağıdaki kısayolları kullanın. Şifre / e-posta istemem."
    );
    busy = false;

    if (window.ChatSync?.listenIncomingSupport) {
      window.ChatSync.listenIncomingSupport((msg) => {
        appendMessage(box, "admin", msg.text || "", {
          sync: false,
          type: msg.type === "loading" ? "loading" : "text",
        });
      });
    } else {
      let n = 0;
      const t = setInterval(() => {
        n += 1;
        if (window.ChatSync?.listenIncomingSupport) {
          clearInterval(t);
          window.ChatSync.listenIncomingSupport((msg) => {
            appendMessage(box, "admin", msg.text || "", {
              sync: false,
              type: msg.type === "loading" ? "loading" : "text",
            });
          });
        } else if (n > 80) {
          clearInterval(t);
        }
      }, 50);
    }
  }

  document.querySelectorAll("[data-chat-root]").forEach(wireChat);

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
