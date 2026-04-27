(function () {
  const scripts = Array.from(document.querySelectorAll("script[data-kontaktio]"));
  if (!scripts.length) return;

  if (window.__KontaktioBooted) return;
  window.__KontaktioBooted = true;

  const safeJsonParse = (s, fallback) => {
    try {
      return JSON.parse(s);
    } catch {
      return fallback;
    }
  };

  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class") node.className = v;
      else if (k === "style") node.setAttribute("style", v);
      else if (k.startsWith("on") && typeof v === "function")
        node.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined) node.setAttribute(k, String(v));
    });
    children.forEach((c) => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return node;
  };

  const ensureStyles = () => {
    if (document.getElementById("kontaktio-styles")) return;

    const style = document.createElement("style");
    style.id = "kontaktio-styles";
    style.innerHTML = `
      .kontaktio-launcher {
        position: fixed;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        user-select: none;
        z-index: 2147483000;
        box-shadow: 0 10px 30px rgba(0,0,0,.35), 0 0 20px rgba(16,185,129,.2);
        transform: translateZ(0);
        transition: transform .2s ease, box-shadow .2s ease;
      }
      .kontaktio-launcher:hover {
        transform: scale(1.06);
        box-shadow: 0 12px 36px rgba(0,0,0,.4), 0 0 28px rgba(16,185,129,.3);
      }

      .kontaktio-widget {
        position: fixed;
        display: none;
        flex-direction: column;
        overflow: hidden;
        z-index: 2147483000;
        width: 380px;
        max-width: calc(100vw - 24px);
        max-height: min(640px, calc(100vh - 120px));
        box-shadow: 0 16px 48px rgba(0,0,0,.45), 0 0 40px rgba(16,185,129,.06);
        transform: translateZ(0);
        border: 1px solid rgba(255,255,255,.06);
      }

      .kontaktio-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        font-weight: 700;
        font-size: 14px;
        letter-spacing: .3px;
      }

      .kontaktio-header-sub {
        margin-top: 2px;
        font-weight: 500;
        font-size: 12px;
        opacity: .8;
      }

      .kontaktio-close {
        border: none;
        background: rgba(255,255,255,.08);
        font-size: 16px;
        cursor: pointer;
        padding: 6px 10px;
        line-height: 1;
        opacity: .85;
        border-radius: 8px;
        transition: background .2s ease, opacity .2s ease;
      }
      .kontaktio-close:hover { opacity: 1; background: rgba(255,255,255,.14); }

      .kontaktio-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
      }
      .kontaktio-messages::-webkit-scrollbar { width: 5px; }
      .kontaktio-messages::-webkit-scrollbar-track { background: transparent; }
      .kontaktio-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,.1); border-radius: 4px; }

      .kontaktio-row {
        display: flex;
        margin: 10px 0;
      }
      .kontaktio-row.user { justify-content: flex-end; }
      .kontaktio-row.bot { justify-content: flex-start; }

      .kontaktio-bubble {
        max-width: 82%;
        padding: 10px 14px;
        white-space: pre-wrap;
        line-height: 1.4;
        font-size: 14px;
        box-shadow: 0 2px 12px rgba(0,0,0,.12);
      }

      .kontaktio-quick {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 0 16px 12px 16px;
      }

      .kontaktio-quick button {
        cursor: pointer;
        border: 1px solid rgba(16,185,129,.2);
        background: rgba(16,185,129,.06);
        color: #e2e8f0;
        padding: 8px 12px;
        font-size: 12px;
        border-radius: 999px;
        line-height: 1.1;
        transition: background .2s ease, border-color .2s ease;
        font-family: 'Outfit', sans-serif;
      }
      .kontaktio-quick button:hover {
        background: rgba(16,185,129,.14);
        border-color: rgba(16,185,129,.4);
      }

      .kontaktio-inputwrap {
        display: flex;
        gap: 8px;
        padding: 12px 16px 16px 16px;
        border-top: 1px solid rgba(255,255,255,.06);
      }

      .kontaktio-input {
        flex: 1;
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 999px;
        padding: 10px 14px;
        font-size: 14px;
        outline: none;
        transition: border-color .2s ease;
        font-family: 'Outfit', sans-serif;
      }
      .kontaktio-input:focus {
        border-color: rgba(16,185,129,.4);
      }

      .kontaktio-send {
        border: none;
        border-radius: 999px;
        padding: 10px 14px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: opacity .2s ease, transform .2s ease;
        font-family: 'Outfit', sans-serif;
      }
      .kontaktio-send:hover {
        opacity: .9;
        transform: translateY(-1px);
      }

      .kontaktio-muted {
        opacity: .6;
        font-size: 12px;
        padding: 10px 16px 0 16px;
      }

      @media (max-width: 480px) {
        .kontaktio-widget { width: calc(100vw - 24px); }
      }
    `;
    document.head.appendChild(style);
  };

  const normalizeClient = (cfg) => {
    const company = cfg.company || {};
    const theme = cfg.theme || {};

    return {
      id: cfg.id,
      status: cfg.status || "active",
      statusMessage: cfg.statusMessage || cfg.status_message || "",
      company: {
        name: company.name || "Asystent",
        email: company.email || "",
        phone: company.phone || "",
        address: company.address || "",
        hours: company.hours || ""
      },
      theme: {
        headerBg: theme.headerBg || "#111827",
        headerText: theme.headerText || "#ffffff",
        widgetBg: theme.widgetBg || "#0f172a",
        inputBg: theme.inputBg || "#111827",
        inputText: theme.inputText || "#e2e8f0",
        buttonBg: theme.buttonBg || "#10b981",
        buttonText: theme.buttonText || "#ffffff",
        botBubbleBg: theme.botBubbleBg || "#111827",
        botBubbleText: theme.botBubbleText || "#e2e8f0",
        userBubbleBg: theme.userBubbleBg || theme.buttonBg || "#10b981",
        userBubbleText: theme.userBubbleText || "#ffffff",
        radius: Number(theme.radius ?? 18),
        position: theme.position === "left" ? "left" : "right"
      },
      launcher_icon: cfg.launcher_icon || "💬",
      welcome_message: cfg.welcome_message || "",
      welcome_hint: cfg.welcome_hint || "",
      quick_replies: Array.isArray(cfg.quick_replies) ? cfg.quick_replies : [],
      auto_open_enabled: !!cfg.auto_open_enabled,
      auto_open_delay: Number(cfg.auto_open_delay ?? 15000)
    };
  };

  const buildKeys = (clientId) => ({
    history: `kontaktio-history-${clientId}`,
    session: `kontaktio-session-${clientId}`,
    open: `kontaktio-open-${clientId}`,
    autoOpened: `kontaktio-autoopened-${clientId}`
  });

  ensureStyles();

  scripts.forEach((script, idx) => {
    const CLIENT_ID = script.getAttribute("data-client") || "demo";
    const BACKEND = script.getAttribute("data-backend") || "";
    const baseUrl = BACKEND.replace(/\/+$/, "");

    if (!baseUrl) {
      console.error("[Kontaktio] Missing data-backend on script tag");
      return;
    }

    const keys = buildKeys(CLIENT_ID);

    let cfg = null;
    let isOpen = false;
    let isSending = false;

    const loadSessionId = () => {
      try {
        return localStorage.getItem(keys.session);
      } catch {
        return null;
      }
    };

    const saveSessionId = (sid) => {
      try {
        localStorage.setItem(keys.session, sid);
      } catch {}
    };

    const loadOpenState = () => {
      try {
        return localStorage.getItem(keys.open) === "1";
      } catch {
        return false;
      }
    };

    const saveOpenState = (open) => {
      try {
        localStorage.setItem(keys.open, open ? "1" : "0");
      } catch {}
    };

    const loadHistory = () => {
      try {
        return safeJsonParse(localStorage.getItem(keys.history) || "[]", []);
      } catch {
        return [];
      }
    };

    const saveHistory = (arr) => {
      try {
        localStorage.setItem(keys.history, JSON.stringify(arr || []));
      } catch {}
    };

    const markAutoOpened = () => {
      try {
        localStorage.setItem(keys.autoOpened, "1");
      } catch {}
    };

    const wasAutoOpened = () => {
      try {
        return localStorage.getItem(keys.autoOpened) === "1";
      } catch {
        return false;
      }
    };

    const fetchConfig = async () => {
      const res = await fetch(`${baseUrl}/config/${encodeURIComponent(CLIENT_ID)}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" }
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Config error ${res.status}: ${txt}`);
      }

      const data = await res.json();
      return normalizeClient(data);
    };

    const rootId = `kontaktio-root-${CLIENT_ID}-${idx}`;
    const launcherId = `kontaktio-launcher-${CLIENT_ID}-${idx}`;
    const widgetId = `kontaktio-widget-${CLIENT_ID}-${idx}`;
    const messagesId = `kontaktio-messages-${CLIENT_ID}-${idx}`;
    const inputId = `kontaktio-input-${CLIENT_ID}-${idx}`;
    const quickId = `kontaktio-quick-${CLIENT_ID}-${idx}`;
    const mutedId = `kontaktio-muted-${CLIENT_ID}-${idx}`;

    const getPos = () => {
      const offsetX = 20;
      const offsetY = 20;
      const pos = cfg?.theme?.position === "left" ? "left" : "right";
      return { pos, offsetX, offsetY };
    };

    const scrollToBottom = () => {
      const wrap = document.getElementById(messagesId);
      if (!wrap) return;
      wrap.scrollTop = wrap.scrollHeight;
    };

    const renderMessage = (role, text) => {
      const wrap = document.getElementById(messagesId);
      if (!wrap) return;

      const row = el("div", { class: `kontaktio-row ${role}` }, [
        el(
          "div",
          { class: "kontaktio-bubble" },
          [String(text || "")]
        )
      ]);

      const bubble = row.querySelector(".kontaktio-bubble");
      const r = Math.max(10, Number(cfg.theme.radius || 18));
      bubble.style.borderRadius = `${r}px`;
      bubble.style.background = role === "user" ? cfg.theme.userBubbleBg : cfg.theme.botBubbleBg;
      bubble.style.color = role === "user" ? cfg.theme.userBubbleText : cfg.theme.botBubbleText;

      wrap.appendChild(row);
      scrollToBottom();
    };

    const pushMessage = (role, text) => {
      renderMessage(role, text);

      const history = loadHistory();
      history.push({ role, text: String(text || ""), ts: Date.now() });
      saveHistory(history);
    };

    const setMuted = (text) => {
      const m = document.getElementById(mutedId);
      if (!m) return;
      m.textContent = text || "";
      m.style.display = text ? "block" : "none";
    };

    const renderQuickReplies = () => {
      const wrap = document.getElementById(quickId);
      if (!wrap) return;

      wrap.innerHTML = "";
      const items = (cfg.quick_replies || []).filter(Boolean).slice(0, 8);

      items.forEach((q) => {
        const btn = el("button", {}, [String(q)]);
        btn.addEventListener("click", () => {
          const input = document.getElementById(inputId);
          if (input) input.value = String(q);
          sendMessage(String(q));
        });
        wrap.appendChild(btn);
      });

      wrap.style.display = items.length ? "flex" : "none";
    };

    const openWidget = () => {
      isOpen = true;
      saveOpenState(true);

      const widget = document.getElementById(widgetId);
      if (widget) widget.style.display = "flex";

      scrollToBottom();
      const input = document.getElementById(inputId);
      if (input) input.focus();
    };

    const closeWidget = () => {
      isOpen = false;
      saveOpenState(false);

      const widget = document.getElementById(widgetId);
      if (widget) widget.style.display = "none";
    };

    const toggleWidget = () => {
      if (isOpen) closeWidget();
      else openWidget();
    };

    const sendMessage = async (text) => {
      const msg = String(text || "").trim();
      if (!msg) return;
      if (isSending) return;

      isSending = true;
      setMuted("");

      const input = document.getElementById(inputId);
      if (input) input.value = "";

      pushMessage("user", msg);

      const payload = {
        clientId: CLIENT_ID,
        message: msg,
        sessionId: loadSessionId()
      };

      try {
        const res = await fetch(`${baseUrl}/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          const errMsg =
            data?.statusMessage ||
            data?.error ||
            "Wystapil blad. Sprobuj ponownie za chwile.";
          pushMessage("bot", errMsg);
          return;
        }

        if (data.sessionId) saveSessionId(data.sessionId);

        const reply = data.reply || "-";
        pushMessage("bot", reply);
      } catch (e) {
        pushMessage("bot", "Brak polaczenia. Sprobuj ponownie za chwile.");
      } finally {
        isSending = false;
      }
    };

    const mount = async () => {
      const root = el("div", { id: rootId });
      document.body.appendChild(root);

      try {
        cfg = await fetchConfig();
      } catch (e) {
        console.error("[Kontaktio] Config load failed:", e);
        cfg = normalizeClient({
          id: CLIENT_ID,
          status: "unactive",
          statusMessage: "Asystent jest obecnie niedostepny.",
          company: { name: "Asystent" },
          theme: {}
        });
      }

      const { pos, offsetX, offsetY } = getPos();

      const launcher = el("div", { id: launcherId, class: "kontaktio-launcher" }, [
        el("div", {}, [cfg.launcher_icon || "💬"])
      ]);

      launcher.style.width = "56px";
      launcher.style.height = "56px";
      launcher.style.borderRadius = "999px";
      launcher.style.background = "#10b981";
      launcher.style.color = cfg.theme.buttonText;
      launcher.style.bottom = `${offsetY}px`;
      launcher.style[pos] = `${offsetX}px`;

      launcher.addEventListener("click", toggleWidget);

      const widget = el("div", { id: widgetId, class: "kontaktio-widget" }, []);

      widget.style.background = cfg.theme.widgetBg;
      widget.style.borderRadius = `${Math.max(12, Number(cfg.theme.radius || 18))}px`;
      widget.style.bottom = `${offsetY + 70}px`;
      widget.style[pos] = `${offsetX}px`;

      const closeBtn = el("button", { class: "kontaktio-close", type: "button" }, ["x"]);
      closeBtn.style.color = cfg.theme.headerText;
      closeBtn.addEventListener("click", closeWidget);

      const headerLeft = el("div", {}, [
        el("div", {}, [cfg.company.name || "Asystent"]),
        cfg.welcome_hint ? el("div", { class: "kontaktio-header-sub" }, [cfg.welcome_hint]) : el("div")
      ]);

      const header = el("div", { class: "kontaktio-header" }, [headerLeft, closeBtn]);
      header.style.background = cfg.theme.headerBg;
      header.style.color = cfg.theme.headerText;

      const muted = el("div", { id: mutedId, class: "kontaktio-muted" }, [""]);
      muted.style.display = "none";

      const messages = el("div", { id: messagesId, class: "kontaktio-messages" }, []);
      const quick = el("div", { id: quickId, class: "kontaktio-quick" }, []);
      const input = el("input", {
        id: inputId,
        class: "kontaktio-input",
        placeholder: "Napisz wiadomosc...",
        type: "text"
      });

      input.style.background = cfg.theme.inputBg;
      input.style.color = cfg.theme.inputText;

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          sendMessage(input.value);
        }
      });

      const sendBtn = el("button", { class: "kontaktio-send", type: "button" }, ["Wyslij"]);
      sendBtn.style.background = "#10b981";
      sendBtn.style.color = cfg.theme.buttonText;
      sendBtn.addEventListener("click", () => sendMessage(input.value));

      const inputWrap = el("div", { class: "kontaktio-inputwrap" }, [input, sendBtn]);
      inputWrap.style.background = cfg.theme.widgetBg;

      widget.appendChild(header);
      widget.appendChild(muted);
      widget.appendChild(messages);
      widget.appendChild(quick);
      widget.appendChild(inputWrap);

      root.appendChild(widget);
      root.appendChild(launcher);

      const history = loadHistory();
      history.forEach((m) => {
        if (!m || !m.role) return;
        renderMessage(m.role === "user" ? "user" : "bot", m.text || "");
      });

      if (cfg.status !== "active") {
        const msg =
          cfg.statusMessage ||
          "Asystent jest obecnie niedostepny. Skontaktuj sie z firma bezposrednio.";
        if (!history.length) pushMessage("bot", msg);
        setMuted("Asystent jest wylaczony.");
      } else if (!history.length) {
        if (cfg.welcome_message) pushMessage("bot", cfg.welcome_message);
      }

      renderQuickReplies();

      isOpen = loadOpenState();
      if (isOpen) openWidget();

      if (
        cfg.status === "active" &&
        cfg.auto_open_enabled &&
        !wasAutoOpened() &&
        !loadOpenState()
      ) {
        setTimeout(() => {
          markAutoOpened();
          openWidget();
        }, Math.max(0, cfg.auto_open_delay || 0));
      }
    };

    mount();
  });
})();
