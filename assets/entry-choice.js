/* ════════════════════════════════════════════════════════════════════════
   assets/entry-choice.js — 首页入口「双模式选择」:🧭 旅程式浏览 vs 🗺️ 自由探索
   ────────────────────────────────────────────────────────────────────────
   只在 index.html 挂载。访客「直接从外部进入」时弹全屏双卡选择:
       🧭 旅程式浏览 → explore-a.html(引导式,一步步讲)
       🗺️ 自由探索   → 关闭浮层,留在经典整站
   什么时候【不】弹(全部静默跳过):
       · 本会话已选过(sessionStorage['gg-entry-mode'])
       · 站内跳转来的(同源 referrer)——尤其从 explore-a 明确退出回来的,
         还会自动记为 free,整个会话不再打扰
       · URL 带 hash(#projects 等深链,人家是冲着某一节来的)
       · 在 iframe 里
   交互:Esc / 点遮罩 = 视同「自由探索」(绝不强迫);选择只记本会话。
   打点:entry-choice-shown / entry-choice-journey / entry-choice-free(/hit 通道)。
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (window.__GGEC) return; window.__GGEC = 1;

  var KEY = 'gg-entry-mode';
  var IN_IFRAME = false;
  try { IN_IFRAME = window.self !== window.top; } catch (e) { IN_IFRAME = true; }

  var sameOrigin = false, fromJourney = false;
  try {
    var ref = document.referrer || '';
    if (ref) {
      var u = new URL(ref);
      sameOrigin = u.origin === location.origin;
      fromJourney = sameOrigin && /explore-a\.html/i.test(u.pathname);
    }
  } catch (e) {}

  try {
    if (fromJourney && !sessionStorage.getItem(KEY)) sessionStorage.setItem(KEY, 'free');
    if (IN_IFRAME || location.hash || sameOrigin || sessionStorage.getItem(KEY)) return;
  } catch (e) { return; }   /* storage 不可用的极端环境:宁可不弹,不打扰 */

  /* ---------------- 打点(沿用 feedback.js 的 /hit 通道与去重) ---------------- */
  var LOCAL = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  var API = LOCAL ? '' : 'https://api.interantai.com';
  function hit(slug) {
    try {
      var k = 'gg-ec-hit:' + slug;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
      fetch(API + '/hit', { method: 'POST', headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ slug: slug, ev: 'view' }), keepalive: true }).catch(function () {});
    } catch (e) {}
  }

  /* ---------------- 文案(自带中英,读 window.LANG) ---------------- */
  var en = window.LANG === 'en';
  var T = en ? {
    title: 'How would you like to browse?',
    jH: '🧭 Guided tour', jP: 'I walk you through the team, demos and essays — step by step, no getting lost.', jGo: 'Take the tour →',
    fH: '🗺️ Free roam', fP: 'The classic site: all demos, essays and team, browse at your own pace.', fGo: 'Browse freely →',
    note: 'Switch anytime — the tour hub has a free-roam exit. Remembered for this visit only.'
  } : {
    title: '接下来的几分钟，你想怎么逛？',
    jH: '🧭 旅程式浏览', jP: '我带着你逛——团队、项目、思考,一步步讲给你听,走不丢。', jGo: '带我逛 →',
    fH: '🗺️ 自由探索', fP: '经典整站自己翻——全部 Demo、思考、团队,一览无余。', fGo: '自己逛 →',
    note: '两种随时可以互换——旅程大厅里就有「自由探索」出口。这个选择只在本次访问内记住。'
  };

  var css =
    '.gg-ec-scrim{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;' +
    'padding:20px;background:rgba(43,35,32,.46);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);' +
    'animation:gg-ec-fade .28s ease both}' +
    '@keyframes gg-ec-fade{from{opacity:0}}' +
    '.gg-ec-card{background:var(--bg,#f7f3ee);border:1px solid var(--line,#ded3c6);border-radius:22px;' +
    'max-width:640px;width:100%;padding:30px 28px 22px;box-shadow:0 24px 70px rgba(40,25,10,.35);' +
    'font-family:var(--sans,-apple-system,"Noto Sans SC","Microsoft YaHei",system-ui,sans-serif);color:var(--ink,#2b2320);' +
    'animation:gg-ec-rise .34s cubic-bezier(.2,.8,.25,1) both}' +
    '@keyframes gg-ec-rise{from{opacity:0;transform:translateY(26px) scale(.97)}}' +
    '.gg-ec-card h2{margin:0 2px 18px;font:600 clamp(20px,3.4vw,26px)/1.35 Georgia,"Noto Serif SC",serif}' +
    '.gg-ec-opts{display:grid;grid-template-columns:1fr 1fr;gap:14px}' +
    '@media(max-width:560px){.gg-ec-opts{grid-template-columns:1fr}}' +
    '.gg-ec-opt{text-align:left;background:var(--card,#fffdfa);border:1px solid var(--line,#ded3c6);border-radius:16px;' +
    'padding:18px 17px 15px;cursor:pointer;font-family:inherit;color:inherit;transition:transform .2s,border-color .2s,box-shadow .2s}' +
    '.gg-ec-opt:hover,.gg-ec-opt:focus-visible{transform:translateY(-3px);border-color:var(--accent-soft,#c98a5a);' +
    'box-shadow:0 12px 30px rgba(63,44,28,.14);outline:none}' +
    '.gg-ec-opt h3{margin:0 0 6px;font:600 17px/1.35 inherit}' +
    '.gg-ec-opt p{margin:0;font-size:13px;line-height:1.6;color:var(--ink-soft,#6b6058)}' +
    '.gg-ec-opt .go{margin-top:11px;font:600 13.5px inherit;color:var(--accent,#b4542e)}' +
    '.gg-ec-note{margin:16px 2px 0;font-size:12px;line-height:1.6;color:var(--ink-soft,#6b6058);text-align:center}' +
    '@media (prefers-reduced-motion:reduce){.gg-ec-scrim,.gg-ec-card{animation:none}}';

  function mount() {
    if (!document.body) return;
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    var scrim = document.createElement('div');
    scrim.className = 'gg-ec-scrim';
    scrim.innerHTML =
      '<div class="gg-ec-card" role="dialog" aria-modal="true" aria-label="' + T.title + '">' +
      '<h2>' + T.title + '</h2>' +
      '<div class="gg-ec-opts">' +
      '<button type="button" class="gg-ec-opt" data-mode="journey"><h3>' + T.jH + '</h3><p>' + T.jP + '</p><div class="go">' + T.jGo + '</div></button>' +
      '<button type="button" class="gg-ec-opt" data-mode="free"><h3>' + T.fH + '</h3><p>' + T.fP + '</p><div class="go">' + T.fGo + '</div></button>' +
      '</div><p class="gg-ec-note">' + T.note + '</p></div>';

    function choose(mode) {
      try { sessionStorage.setItem(KEY, mode); } catch (e) {}
      hit('entry-choice-' + mode);
      if (mode === 'journey') { location.href = 'explore-a.html'; return; }
      scrim.remove();
      document.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') choose('free'); }

    scrim.addEventListener('click', function (e) {
      var btn = e.target.closest('.gg-ec-opt');
      if (btn) return choose(btn.dataset.mode);
      if (e.target === scrim) choose('free');      /* 点遮罩 = 不强迫,自由探索 */
    });
    document.addEventListener('keydown', onKey);

    document.body.appendChild(scrim);
    hit('entry-choice-shown');
    var first = scrim.querySelector('.gg-ec-opt');
    if (first) first.focus();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
