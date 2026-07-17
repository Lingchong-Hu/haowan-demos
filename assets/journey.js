/* journey.js — demo 页里的「🧭 旅程罗盘」：让人从任何一个 demo 随时滚回引导式旅程。
   只在 URL 含 /demos/<slug>/ 的页面出现（思考页、旅程本身、后台都不挂）。
   由 feedback.js 自动加载（data-gg-j 防重）；零依赖、纯注入，不动任何 demo 的代码。
   三级目录与旅程一致：这个 demo 的讲述 → 项目目录（四方向） → 大厅。 */
(function () {
  'use strict';
  if (window.__GGJ) return; window.__GGJ = 1;

  var m = location.pathname.match(/^(.*)\/demos\/([^/]+)\//);
  if (!m) return;
  var base = m[1] || '';
  var slug = m[2];
  var J = base + '/explore-a.html';

  var css =
    '.gg-j-btn{position:fixed;bottom:22px;left:20px;z-index:9997;display:inline-flex;align-items:center;gap:7px;' +
    'padding:11px 16px;border:1px solid rgba(120,90,60,.25);border-radius:999px;cursor:pointer;' +
    'background:rgba(255,253,250,.94);backdrop-filter:blur(6px);color:#6b4a2f;font:600 13.5px/1 -apple-system,"Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;' +
    'box-shadow:0 4px 16px rgba(80,50,20,.13);transition:transform .15s,box-shadow .15s}' +
    '.gg-j-btn:hover{transform:translateY(-2px);box-shadow:0 7px 22px rgba(80,50,20,.2)}' +
    '.gg-j-panel{position:fixed;bottom:70px;left:18px;z-index:9998;width:min(280px,calc(100vw - 36px));' +
    'background:#fffdfa;border:1px solid rgba(120,90,60,.22);border-radius:16px;padding:14px;' +
    'box-shadow:0 12px 34px rgba(80,50,20,.2);' +
    'font:14px/1.5 -apple-system,"Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;color:#2b2320}' +
    '.gg-j-panel .hd{font-weight:700;font-size:13px;color:#8a7563;letter-spacing:.03em;margin:2px 2px 10px}' +
    '.gg-j-panel a{display:flex;align-items:center;gap:9px;padding:10px 11px;border-radius:11px;' +
    'text-decoration:none;color:#2b2320;font-weight:560}' +
    '.gg-j-panel a:hover{background:#f5ede3}' +
    '.gg-j-panel a .em{flex:none}' +
    '.gg-j-panel a .s{display:block;font-weight:400;font-size:12px;color:#8a7563;margin-top:1px}' +
    '@media(max-width:520px){.gg-j-btn{bottom:16px;left:14px;padding:10px 14px;font-size:13px}' +
    '.gg-j-panel{bottom:62px;left:14px}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.className = 'gg-j-btn';
  btn.type = 'button';
  btn.innerHTML = '🧭 <span>旅程</span>';
  btn.title = '回到引导式旅程';

  var panel = null;
  function closePanel() { if (panel) { panel.remove(); panel = null; } }
  function openPanel() {
    if (panel) return closePanel();
    panel = document.createElement('div');
    panel.className = 'gg-j-panel';
    panel.innerHTML =
      '<div class="hd">🧭 继续你的旅程</div>' +
      '<a href="' + J + '#story/' + encodeURIComponent(slug) + '"><span class="em">←</span><span>回到这个 demo 的讲述<span class="s">从这里能滚回它的行业和方向</span></span></a>' +
      '<a href="' + J + '#dirs"><span class="em">📂</span><span>项目目录<span class="s">四个方向 · 挑下一个听</span></span></a>' +
      '<a href="' + J + '"><span class="em">⌂</span><span>旅程大厅</span></a>';
    document.body.appendChild(panel);
  }

  btn.addEventListener('click', function (e) { e.stopPropagation(); openPanel(); });
  document.addEventListener('pointerdown', function (e) {
    if (panel && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) closePanel();
  });

  function mount() { document.body.appendChild(btn); }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
