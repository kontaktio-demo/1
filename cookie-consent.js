(function () {
  'use strict';

  var COOKIE_NAME = 'dm_cookie_consent';
  var COOKIE_DAYS = 365;

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }

  function getConsent() {
    var raw = getCookie(COOKIE_NAME);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function saveConsent(consent) {
    setCookie(COOKIE_NAME, JSON.stringify(consent), COOKIE_DAYS);
  }

  function injectStyles() {
    if (document.getElementById('cookie-consent-styles')) return;
    var style = document.createElement('style');
    style.id = 'cookie-consent-styles';
    style.textContent = [
      '.cc-overlay{position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .4s ease;pointer-events:none}',
      '.cc-overlay.cc-visible{opacity:1;pointer-events:auto}',
      '.cc-banner{width:100%;max-width:720px;background:#111827;border:1px solid rgba(16,185,129,.2);border-radius:20px 20px 0 0;padding:28px 32px 24px;color:#e2e8f0;font-family:"Outfit",sans-serif;transform:translateY(100%);transition:transform .5s cubic-bezier(.22,1,.36,1)}',
      '.cc-overlay.cc-visible .cc-banner{transform:translateY(0)}',
      '.cc-title{font-size:1.15rem;font-weight:700;color:#fff;margin-bottom:8px}',
      '.cc-desc{font-size:.9rem;color:#94a3b8;line-height:1.65;margin-bottom:20px}',
      '.cc-desc a{color:#10b981;text-decoration:underline}',
      '.cc-buttons{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:0}',
      '.cc-btn{padding:11px 24px;border-radius:999px;font-weight:600;font-size:.88rem;border:none;cursor:pointer;transition:all .25s ease;font-family:"Outfit",sans-serif}',
      '.cc-btn:hover{transform:translateY(-1px)}',
      '.cc-btn--accept{background:#10b981;color:#0a0e17;box-shadow:0 4px 20px rgba(16,185,129,.25)}',
      '.cc-btn--accept:hover{background:#34d399}',
      '.cc-btn--reject{background:rgba(255,255,255,.08);color:#e2e8f0;border:1px solid rgba(255,255,255,.12)}',
      '.cc-btn--reject:hover{background:rgba(255,255,255,.14)}',
      '.cc-btn--settings{background:transparent;color:#10b981;border:1px solid rgba(16,185,129,.3)}',
      '.cc-btn--settings:hover{background:rgba(16,185,129,.08)}',
      '.cc-details{display:none;margin-top:20px;padding-top:20px;border-top:1px solid rgba(255,255,255,.08)}',
      '.cc-details.cc-open{display:block}',
      '.cc-category{display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.05)}',
      '.cc-category:last-child{border-bottom:none}',
      '.cc-cat-info{flex:1}',
      '.cc-cat-name{font-size:.95rem;font-weight:600;color:#fff}',
      '.cc-cat-desc{font-size:.82rem;color:#94a3b8;margin-top:2px}',
      '.cc-toggle{position:relative;width:44px;height:24px;flex-shrink:0;margin-left:16px}',
      '.cc-toggle input{opacity:0;width:0;height:0;position:absolute}',
      '.cc-toggle-track{position:absolute;inset:0;border-radius:12px;background:rgba(255,255,255,.12);cursor:pointer;transition:background .25s ease}',
      '.cc-toggle input:checked+.cc-toggle-track{background:#10b981}',
      '.cc-toggle-thumb{position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .25s ease;pointer-events:none}',
      '.cc-toggle input:checked~.cc-toggle-thumb{transform:translateX(20px)}',
      '.cc-toggle input:disabled+.cc-toggle-track{opacity:.5;cursor:default}',
      '.cc-save-wrap{margin-top:16px;text-align:right}',
      '@media(max-width:600px){.cc-banner{padding:20px 18px 18px;border-radius:16px 16px 0 0}.cc-buttons{flex-direction:column}.cc-btn{width:100%;text-align:center}}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function createBanner() {
    var overlay = document.createElement('div');
    overlay.className = 'cc-overlay';
    overlay.id = 'cookieConsent';

    overlay.innerHTML = [
      '<div class="cc-banner">',
      '  <div class="cc-title">🍪 Ta strona używa plików cookies</div>',
      '  <div class="cc-desc">Używamy cookies, aby zapewnić prawidłowe działanie strony, analizować ruch i personalizować treści. Możesz zaakceptować wszystkie, odrzucić opcjonalne lub dostosować swoje preferencje. Więcej informacji w naszej <a href="/polityka-prywatnosci/">Polityce Prywatności</a>.</div>',
      '  <div class="cc-buttons">',
      '    <button class="cc-btn cc-btn--accept" id="ccAcceptAll">Akceptuję wszystkie</button>',
      '    <button class="cc-btn cc-btn--reject" id="ccRejectAll">Tylko niezbędne</button>',
      '    <button class="cc-btn cc-btn--settings" id="ccToggleSettings">Dostosuj wybór</button>',
      '  </div>',
      '  <div class="cc-details" id="ccDetails">',
      '    <div class="cc-category">',
      '      <div class="cc-cat-info">',
      '        <div class="cc-cat-name">Niezbędne</div>',
      '        <div class="cc-cat-desc">Wymagane do prawidłowego działania strony. Nie można ich wyłączyć.</div>',
      '      </div>',
      '      <label class="cc-toggle">',
      '        <input type="checkbox" checked disabled>',
      '        <span class="cc-toggle-track"></span>',
      '        <span class="cc-toggle-thumb"></span>',
      '      </label>',
      '    </div>',
      '    <div class="cc-category">',
      '      <div class="cc-cat-info">',
      '        <div class="cc-cat-name">Analityczne</div>',
      '        <div class="cc-cat-desc">Pomagają zrozumieć, jak użytkownicy korzystają ze strony.</div>',
      '      </div>',
      '      <label class="cc-toggle">',
      '        <input type="checkbox" id="ccAnalytics">',
      '        <span class="cc-toggle-track"></span>',
      '        <span class="cc-toggle-thumb"></span>',
      '      </label>',
      '    </div>',
      '    <div class="cc-category">',
      '      <div class="cc-cat-info">',
      '        <div class="cc-cat-name">Marketingowe</div>',
      '        <div class="cc-cat-desc">Służą do personalizacji reklam i śledzenia aktywności.</div>',
      '      </div>',
      '      <label class="cc-toggle">',
      '        <input type="checkbox" id="ccMarketing">',
      '        <span class="cc-toggle-track"></span>',
      '        <span class="cc-toggle-thumb"></span>',
      '      </label>',
      '    </div>',
      '    <div class="cc-save-wrap">',
      '      <button class="cc-btn cc-btn--accept" id="ccSavePrefs">Zapisz preferencje</button>',
      '    </div>',
      '  </div>',
      '</div>'
    ].join('\n');

    document.body.appendChild(overlay);

    var acceptBtn = document.getElementById('ccAcceptAll');
    var rejectBtn = document.getElementById('ccRejectAll');
    var settingsBtn = document.getElementById('ccToggleSettings');
    var saveBtn = document.getElementById('ccSavePrefs');
    var details = document.getElementById('ccDetails');
    var analyticsInput = document.getElementById('ccAnalytics');
    var marketingInput = document.getElementById('ccMarketing');

    function closeBanner() {
      overlay.classList.remove('cc-visible');
      setTimeout(function () { overlay.style.display = 'none'; }, 500);
    }

    acceptBtn.addEventListener('click', function () {
      saveConsent({ necessary: true, analytics: true, marketing: true });
      closeBanner();
    });

    rejectBtn.addEventListener('click', function () {
      saveConsent({ necessary: true, analytics: false, marketing: false });
      closeBanner();
    });

    settingsBtn.addEventListener('click', function () {
      details.classList.toggle('cc-open');
      settingsBtn.textContent = details.classList.contains('cc-open') ? 'Ukryj opcje' : 'Dostosuj wybór';
    });

    saveBtn.addEventListener('click', function () {
      saveConsent({
        necessary: true,
        analytics: analyticsInput.checked,
        marketing: marketingInput.checked
      });
      closeBanner();
    });

    var existing = getConsent();
    if (existing) {
      if (analyticsInput) analyticsInput.checked = !!existing.analytics;
      if (marketingInput) marketingInput.checked = !!existing.marketing;
    }

    return overlay;
  }

  function showBanner() {
    var overlay = document.getElementById('cookieConsent') || createBanner();
    overlay.style.display = 'flex';
    void overlay.offsetHeight;
    overlay.classList.add('cc-visible');
  }

  window.openCookieSettings = function () {
    showBanner();
    var details = document.getElementById('ccDetails');
    if (details && !details.classList.contains('cc-open')) {
      details.classList.add('cc-open');
      var settingsBtn = document.getElementById('ccToggleSettings');
      if (settingsBtn) settingsBtn.textContent = 'Ukryj opcje';
    }
  };

  injectStyles();
  var consent = getConsent();
  if (!consent) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        setTimeout(showBanner, 800);
      });
    } else {
      setTimeout(showBanner, 800);
    }
  }
})();
