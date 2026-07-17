/* journey.js — demo 页里的「🧭 继续旅程」：让人从任何一个 demo 随时滚回引导式旅程。
   只在 URL 含 /demos/<slug>/ 的页面出现（思考页、旅程本身、后台都不挂）。
   由 feedback.js 自动加载（data-gg-j 防重）；零依赖、纯注入，不动任何 demo 的代码。
   三级目录与旅程一致：这个 demo 的讲述 → 项目目录（四方向） → 大厅。
   另职责：demo 页大屏自适应——高分辨率下整体 zoom 放大，别缩在屏幕一角
   （满屏 100vh 布局的 demo 除外，zoom 会让它们出滚动条）。 */
(function () {
  'use strict';
  if (window.__GGJ) return; window.__GGJ = 1;

  var m = location.pathname.match(/^(.*)\/demos\/([^/]+)\//);
  if (!m) return;
  var base = m[1] || '';
  var slug = m[2];
  var J = base + '/explore-a.html';

  /* —— 大屏自适应 zoom（满屏布局的 demo 跳过） —— */
  var NOZOOM = { atelier: 1, concierge: 1, 'mood-journal': 1, 'style-dna': 1 };
  function fit() {
    if (NOZOOM[slug]) return;
    var w = window.innerWidth;
    var z = w >= 2300 ? '1.4' : w >= 1800 ? '1.25' : w >= 1500 ? '1.12' : '';
    if (document.body) document.body.style.zoom = z;
  }
  window.addEventListener('resize', fit);

  var css =
    '.gg-j-btn{position:fixed;bottom:22px;left:20px;z-index:9997;display:inline-flex;align-items:center;gap:8px;' +
    'padding:14px 21px;border:0;border-radius:999px;cursor:pointer;' +
    'background:#b4542e;color:#fff;font:700 15px/1 -apple-system,"Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;' +
    /* 按钮本体不做入场动画（可见性是硬功能，不赌动画环境）；脉冲光圈纯装饰 */
    'box-shadow:0 8px 24px rgba(140,60,20,.35);transition:transform .15s,box-shadow .15s}' +
    '.gg-j-btn::after{content:"";position:absolute;inset:0;border-radius:999px;pointer-events:none;' +
    'animation:gg-j-ring 1.8s .6s ease-out 3}' +
    '.gg-j-btn:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(140,60,20,.45)}' +
    '@keyframes gg-j-ring{0%{box-shadow:0 0 0 0 rgba(180,84,46,.5)}100%{box-shadow:0 0 0 20px rgba(180,84,46,0)}}' +
    '.gg-j-panel{position:fixed;bottom:78px;left:18px;z-index:9998;width:min(300px,calc(100vw - 36px));' +
    'background:#fffdfa;border:1px solid rgba(120,90,60,.22);border-radius:16px;padding:14px;' +
    'box-shadow:0 12px 34px rgba(80,50,20,.2);' +
    'font:14.5px/1.5 -apple-system,"Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;color:#2b2320}' +
    '.gg-j-panel .hd{font-weight:700;font-size:13px;color:#8a7563;letter-spacing:.03em;margin:2px 2px 10px}' +
    '.gg-j-panel a{display:flex;align-items:center;gap:9px;padding:11px 12px;border-radius:11px;' +
    'text-decoration:none;color:#2b2320;font-weight:560}' +
    '.gg-j-panel a:hover{background:#f5ede3}' +
    '.gg-j-panel a .em{flex:none}' +
    '.gg-j-panel a .s{display:block;font-weight:400;font-size:12px;color:#8a7563;margin-top:1px}' +
    '@media(min-width:1500px){.gg-j-btn{bottom:26px;left:26px;padding:16px 25px;font-size:16.5px}' +
    '.gg-j-panel{bottom:88px;left:24px;width:min(330px,calc(100vw - 48px));font-size:15.5px}}' +
    '@media(max-width:520px){.gg-j-btn{bottom:16px;left:14px;padding:12px 17px;font-size:14px}' +
    '.gg-j-panel{bottom:64px;left:14px}}';

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  var btn = document.createElement('button');
  btn.className = 'gg-j-btn';
  btn.type = 'button';
  btn.innerHTML = '🧭 <span>继续旅程</span>';
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

  function mount() { document.body.appendChild(btn); fit(); }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
