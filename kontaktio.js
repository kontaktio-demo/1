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

  const SITE_THEME = {
    headerBg: "linear-gradient(135deg,#0f172a 0%,#111827 100%)",
    headerText: "#ffffff",
    widgetBg: "#0f172a",
    inputBg: "#111827",
    inputText: "#e2e8f0",
    buttonBg: "linear-gradient(135deg,#10b981 0%,#059669 100%)",
    buttonText: "#0a0e17",
    botBubbleBg: "#111827",
    botBubbleText: "#e2e8f0",
    userBubbleBg: "linear-gradient(135deg,#10b981 0%,#059669 100%)",
    userBubbleText: "#0a0e17",
    radius: 18
  };

  const ensureStyles = () => {
    if (document.getElementById("kontaktio-styles")) return;

    const style = document.createElement("style");
    style.id = "kontaktio-styles";
    style.innerHTML = `
      @keyframes kontaktio-pulse {
        0%,100% { box-shadow: 0 10px 30px rgba(0,0,0,.45), 0 0 0 0 rgba(16,185,129,.45); }
        70%     { box-shadow: 0 10px 30px rgba(0,0,0,.45), 0 0 0 14px rgba(16,185,129,0); }
      }
      @keyframes kontaktio-pop-in {
        0%   { opacity: 0; transform: translateY(16px) scale(.96); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      @keyframes kontaktio-bubble-in {
        0%   { opacity: 0; transform: translateY(8px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes kontaktio-typing {
        0%,80%,100% { transform: translateY(0); opacity: .35; }
        40%         { transform: translateY(-4px); opacity: 1; }
      }

      .kontaktio-launcher {
        position: fixed;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        user-select: none;
        z-index: 2147483000;
        background: linear-gradient(135deg,#10b981 0%,#059669 100%);
        color: #0a0e17;
        border: 1px solid rgba(16,185,129,.45);
        box-shadow: 0 10px 30px rgba(0,0,0,.45), 0 0 24px rgba(16,185,129,.28);
        transform: translateZ(0);
        transition: transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s ease, background .25s ease;
        animation: kontaktio-pulse 2.6s ease-out infinite;
        font-family: 'Outfit', sans-serif;
      }
      .kontaktio-launcher:hover {
        transform: translateY(-2px) scale(1.06);
        box-shadow: 0 14px 38px rgba(0,0,0,.5), 0 0 32px rgba(16,185,129,.45);
      }
      .kontaktio-launcher:active {
        transform: translateY(0) scale(.98);
      }
      .kontaktio-launcher svg {
        width: 26px;
        height: 26px;
        stroke: currentColor;
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }
      .kontaktio-launcher__badge {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #34d399;
        border: 2px solid #0a0e17;
        box-shadow: 0 0 10px rgba(52,211,153,.7);
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
        background: #0f172a;
        color: #e2e8f0;
        border: 1px solid rgba(16,185,129,.18);
        box-shadow: 0 24px 60px rgba(0,0,0,.55), 0 0 50px rgba(16,185,129,.08);
        transform: translateZ(0);
        font-family: 'Outfit', sans-serif;
      }
      .kontaktio-widget.kontaktio-open {
        display: flex;
        animation: kontaktio-pop-in .32s cubic-bezier(.22,1,.36,1) both;
      }

      .kontaktio-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 16px;
        font-weight: 700;
        font-size: 14px;
        letter-spacing: .3px;
        color: #ffffff;
        background: linear-gradient(135deg,#0f172a 0%,#111827 100%);
        border-bottom: 1px solid rgba(16,185,129,.18);
        position: relative;
      }
      .kontaktio-header::after {
        content: "";
        position: absolute;
        left: 0; right: 0; bottom: -1px;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(16,185,129,.5), transparent);
      }
      .kontaktio-header-left {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }
      .kontaktio-header-avatar {
        width: 34px;
        height: 34px;
        flex-shrink: 0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg,#10b981 0%,#059669 100%);
        color: #0a0e17;
        box-shadow: 0 4px 14px rgba(16,185,129,.35);
      }
      .kontaktio-header-avatar svg {
        width: 18px; height: 18px; stroke: currentColor; fill: none;
        stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
      }
      .kontaktio-header-text { min-width: 0; }
      .kontaktio-header-title {
        font-weight: 700;
        font-size: 14px;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .kontaktio-header-sub {
        margin-top: 2px;
        font-weight: 500;
        font-size: 12px;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .kontaktio-header-sub::before {
        content: "";
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #34d399;
        box-shadow: 0 0 8px rgba(52,211,153,.7);
      }

      .kontaktio-close {
        border: none;
        background: rgba(255,255,255,.06);
        color: #e2e8f0;
        cursor: pointer;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        border-radius: 50%;
        transition: background .2s ease, color .2s ease, transform .2s ease;
      }
      .kontaktio-close:hover { background: rgba(16,185,129,.18); color: #ffffff; transform: rotate(90deg); }
      .kontaktio-close svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }

      .kontaktio-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background:
          radial-gradient(1200px 600px at 100% 0%, rgba(16,185,129,.06), transparent 60%),
          radial-gradient(900px 500px at 0% 100%, rgba(16,185,129,.04), transparent 55%),
          #0f172a;
        scrollbar-width: thin;
        scrollbar-color: rgba(16,185,129,.25) transparent;
      }
      .kontaktio-messages::-webkit-scrollbar { width: 6px; }
      .kontaktio-messages::-webkit-scrollbar-track { background: transparent; }
      .kontaktio-messages::-webkit-scrollbar-thumb { background: rgba(16,185,129,.25); border-radius: 4px; }
      .kontaktio-messages::-webkit-scrollbar-thumb:hover { background: rgba(16,185,129,.45); }

      .kontaktio-row {
        display: flex;
        margin: 10px 0;
        animation: kontaktio-bubble-in .28s cubic-bezier(.22,1,.36,1) both;
      }
      .kontaktio-row.user { justify-content: flex-end; }
      .kontaktio-row.bot { justify-content: flex-start; }

      .kontaktio-bubble {
        max-width: 82%;
        padding: 10px 14px;
        white-space: pre-wrap;
        line-height: 1.45;
        font-size: 14px;
        box-shadow: 0 4px 16px rgba(0,0,0,.25);
        border: 1px solid transparent;
      }
      .kontaktio-row.bot  .kontaktio-bubble { border-color: rgba(255,255,255,.04); }
      .kontaktio-row.user .kontaktio-bubble { box-shadow: 0 6px 20px rgba(16,185,129,.25); }

      .kontaktio-typing {
        display: inline-flex;
        gap: 4px;
        padding: 12px 14px;
        background: #111827;
        border: 1px solid rgba(255,255,255,.04);
        border-radius: 18px;
        box-shadow: 0 4px 16px rgba(0,0,0,.25);
      }
      .kontaktio-typing span {
        width: 6px; height: 6px; border-radius: 50%;
        background: #34d399;
        animation: kontaktio-typing 1.2s ease-in-out infinite;
      }
      .kontaktio-typing span:nth-child(2) { animation-delay: .15s; }
      .kontaktio-typing span:nth-child(3) { animation-delay: .3s; }

      .kontaktio-quick {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        padding: 0 16px 12px 16px;
        background: #0f172a;
      }
      .kontaktio-quick button {
        cursor: pointer;
        border: 1px solid rgba(16,185,129,.25);
        background: rgba(16,185,129,.08);
        color: #e2e8f0;
        padding: 8px 14px;
        font-size: 12px;
        border-radius: 999px;
        line-height: 1.1;
        transition: background .2s ease, border-color .2s ease, transform .2s ease, color .2s ease;
        font-family: 'Outfit', sans-serif;
        font-weight: 500;
      }
      .kontaktio-quick button:hover {
        background: rgba(16,185,129,.18);
        border-color: rgba(16,185,129,.5);
        color: #ffffff;
        transform: translateY(-1px);
      }

      .kontaktio-inputwrap {
        display: flex;
        gap: 8px;
        padding: 12px 16px 16px 16px;
        background: #0f172a;
        border-top: 1px solid rgba(16,185,129,.12);
      }

      .kontaktio-input {
        flex: 1;
        background: #111827;
        color: #e2e8f0;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 999px;
        padding: 10px 16px;
        font-size: 14px;
        outline: none;
        transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
        font-family: 'Outfit', sans-serif;
      }
      .kontaktio-input::placeholder { color: #64748b; }
      .kontaktio-input:focus {
        border-color: rgba(16,185,129,.55);
        box-shadow: 0 0 0 3px rgba(16,185,129,.12);
      }

      .kontaktio-send {
        border: none;
        border-radius: 999px;
        padding: 0 16px;
        min-width: 44px;
        height: 40px;
        cursor: pointer;
        font-weight: 700;
        font-size: 13px;
        background: linear-gradient(135deg,#10b981 0%,#059669 100%);
        color: #0a0e17;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        box-shadow: 0 6px 20px rgba(16,185,129,.3);
        transition: transform .2s ease, box-shadow .2s ease, opacity .2s ease, background .2s ease;
        font-family: 'Outfit', sans-serif;
      }
      .kontaktio-send:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 26px rgba(16,185,129,.42);
      }
      .kontaktio-send:active { transform: translateY(0); }
      .kontaktio-send:disabled { opacity: .6; cursor: not-allowed; transform: none; box-shadow: none; }
      .kontaktio-send svg { width: 14px; height: 14px; stroke: currentColor; fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }

      .kontaktio-muted {
        color: #94a3b8;
        font-size: 12px;
        padding: 10px 16px 0 16px;
        background: #0f172a;
      }

      @media (max-width: 480px) {
        .kontaktio-widget { width: calc(100vw - 24px); }
      }

      @media (prefers-reduced-motion: reduce) {
        .kontaktio-launcher,
        .kontaktio-widget.kontaktio-open,
        .kontaktio-row,
        .kontaktio-typing span,
        .kontaktio-close { animation: none !important; transition: none !important; }
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
        headerBg: SITE_THEME.headerBg,
        headerText: SITE_THEME.headerText,
        widgetBg: SITE_THEME.widgetBg,
        inputBg: SITE_THEME.inputBg,
        inputText: SITE_THEME.inputText,
        buttonBg: SITE_THEME.buttonBg,
        buttonText: SITE_THEME.buttonText,
        botBubbleBg: SITE_THEME.botBubbleBg,
        botBubbleText: SITE_THEME.botBubbleText,
        userBubbleBg: SITE_THEME.userBubbleBg,
        userBubbleText: SITE_THEME.userBubbleText,
        radius: Number(theme.radius ?? SITE_THEME.radius),
        position: theme.position === "left" ? "left" : "right"
      },
      launcher_icon: cfg.launcher_icon || "",
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

    const ICONS = {
      chat: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>',
      close: '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      send: '<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
      avatar: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>'
    };

    const svgEl = (markup) => {
      const wrap = document.createElement("span");
      wrap.innerHTML = markup;
      return wrap.firstChild;
    };

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

    const showTyping = () => {
      const wrap = document.getElementById(messagesId);
      if (!wrap) return null;
      const row = el("div", { class: "kontaktio-row bot", "data-typing": "1" }, [
        el("div", { class: "kontaktio-typing" }, [
          el("span"), el("span"), el("span")
        ])
      ]);
      wrap.appendChild(row);
      scrollToBottom();
      return row;
    };

    const hideTyping = (node) => {
      if (node && node.parentNode) node.parentNode.removeChild(node);
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
        const btn = el("button", { type: "button" }, [String(q)]);
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
      if (widget) {
        widget.classList.add("kontaktio-open");
        widget.setAttribute("aria-hidden", "false");
      }

      const launcher = document.getElementById(launcherId);
      if (launcher) launcher.setAttribute("aria-expanded", "true");

      scrollToBottom();
      const input = document.getElementById(inputId);
      if (input) setTimeout(() => input.focus(), 80);
    };

    const closeWidget = () => {
      isOpen = false;
      saveOpenState(false);

      const widget = document.getElementById(widgetId);
      if (widget) {
        widget.classList.remove("kontaktio-open");
        widget.setAttribute("aria-hidden", "true");
      }

      const launcher = document.getElementById(launcherId);
      if (launcher) launcher.setAttribute("aria-expanded", "false");
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

      const sendBtn = document.querySelector(`#${rootId} .kontaktio-send`);
      if (sendBtn) sendBtn.disabled = true;

      const input = document.getElementById(inputId);
      if (input) input.value = "";

      pushMessage("user", msg);

      const typingNode = showTyping();

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

        hideTyping(typingNode);

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
        hideTyping(typingNode);
        pushMessage("bot", "Brak polaczenia. Sprobuj ponownie za chwile.");
      } finally {
        isSending = false;
        if (sendBtn) sendBtn.disabled = false;
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

      const launcher = el("div", {
        id: launcherId,
        class: "kontaktio-launcher",
        role: "button",
        tabindex: "0",
        "aria-label": "Otworz czat z asystentem",
        "aria-expanded": "false",
        "aria-controls": widgetId
      }, [svgEl(ICONS.chat), el("span", { class: "kontaktio-launcher__badge", "aria-hidden": "true" })]);

      launcher.style.width = "60px";
      launcher.style.height = "60px";
      launcher.style.borderRadius = "999px";
      launcher.style.bottom = `${offsetY}px`;
      launcher.style[pos] = `${offsetX}px`;

      launcher.addEventListener("click", toggleWidget);
      launcher.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleWidget();
        }
      });

      const widget = el("div", {
        id: widgetId,
        class: "kontaktio-widget",
        role: "dialog",
        "aria-label": "Asystent czatu",
        "aria-hidden": "true"
      }, []);

      widget.style.borderRadius = `${Math.max(12, Number(cfg.theme.radius || 18))}px`;
      widget.style.bottom = `${offsetY + 76}px`;
      widget.style[pos] = `${offsetX}px`;

      const closeBtn = el("button", {
        class: "kontaktio-close",
        type: "button",
        "aria-label": "Zamknij czat"
      }, [svgEl(ICONS.close)]);
      closeBtn.addEventListener("click", closeWidget);

      const headerLeft = el("div", { class: "kontaktio-header-left" }, [
        el("div", { class: "kontaktio-header-avatar", "aria-hidden": "true" }, [svgEl(ICONS.avatar)]),
        el("div", { class: "kontaktio-header-text" }, [
          el("div", { class: "kontaktio-header-title" }, [cfg.company.name || "Asystent"]),
          el("div", { class: "kontaktio-header-sub" }, [cfg.welcome_hint || "Odpowiadamy zwykle w kilka minut"])
        ])
      ]);

      const header = el("div", { class: "kontaktio-header" }, [headerLeft, closeBtn]);

      const muted = el("div", { id: mutedId, class: "kontaktio-muted" }, [""]);
      muted.style.display = "none";

      const messages = el("div", { id: messagesId, class: "kontaktio-messages", role: "log", "aria-live": "polite" }, []);
      const quick = el("div", { id: quickId, class: "kontaktio-quick" }, []);
      const input = el("input", {
        id: inputId,
        class: "kontaktio-input",
        placeholder: "Napisz wiadomosc...",
        type: "text",
        autocomplete: "off",
        "aria-label": "Wiadomosc"
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          sendMessage(input.value);
        }
      });

      const sendBtn = el("button", {
        class: "kontaktio-send",
        type: "button",
        "aria-label": "Wyslij wiadomosc"
      }, [svgEl(ICONS.send)]);
      sendBtn.addEventListener("click", () => sendMessage(input.value));

      const inputWrap = el("div", { class: "kontaktio-inputwrap" }, [input, sendBtn]);

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
