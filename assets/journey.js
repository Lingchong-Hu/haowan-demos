/* journey.js — 左下角「🧭 旅程罗盘」:让人从站内任何内容页随时回到引导式旅程。
   v2:不再只挂 demo 页,按上下文挂载——
     · /demos/<slug>/…      demo 页(原有):讲述 → 项目目录 → 大厅
     · /thoughts/<x>.html   思考原文/互动版:这篇的讲述 → 读思考 → 大厅
     · /ongoing/<x>.html    在建项目详情:讲述 → 在建项目支线 → 大厅
     · demos/thoughts/ongoing/team/project.html 经典站点页:大厅 → 逛项目 → 读思考
   index.html 不挂(已有导航入口 + 首访双模式选择浮层),旅程页本身与后台也不挂。
   由 feedback.js 自动加载(data-gg-j 防重);零依赖、纯注入,不动页面自身代码。
   另职责:demo 页大屏自适应 zoom(满屏 100vh 布局的 demo 除外)。 */
(function () {
  'use strict';
  if (window.__GGJ) return; window.__GGJ = 1;

  var path = location.pathname, m, mode = null, base = '', slug = '', sitePage = '';
  if ((m = path.match(/^(.*)\/demos\/([^/]+)\//))) {
    mode = 'demo'; base = m[1] || ''; slug = m[2];
  } else if ((m = path.match(/^(.*)\/ongoing\/([^/]+)\.html$/))) {
    mode = 'ongoing'; base = m[1] || ''; slug = m[2];
  } else if ((m = path.match(/^(.*)\/thoughts\/([^/]+)\.html$/))) {
    mode = 'thought'; base = m[1] || ''; slug = m[2].replace(/-play$/, '');
  } else if ((m = path.match(/^(.*)\/(demos|thoughts|ongoing|team|project)\.html$/))) {
    mode = 'site'; base = m[1] || ''; sitePage = m[2];
  }
  if (!mode) return;
  var J = base + '/explore-a.html';

  /* —— 大屏自适应 zoom(仅 demo 页;满屏布局的跳过) —— */
  var NOZOOM = { atelier: 1, concierge: 1, 'mood-journal': 1, 'style-dna': 1 };
  function fit() {
    if (mode !== 'demo' || NOZOOM[slug]) return;
    var w = window.innerWidth;
    var z = w >= 2300 ? '1.4' : w >= 1800 ? '1.25' : w >= 1500 ? '1.12' : '';
    if (document.body) document.body.style.zoom = z;
  }
  window.addEventListener('resize', fit);

  var css =
    '.gg-j-btn{position:fixed;bottom:22px;left:20px;z-index:9997;display:inline-flex;align-items:center;gap:8px;' +
    'padding:14px 21px;border:0;border-radius:999px;cursor:pointer;' +
    'background:#b4542e;color:#fff;font:700 15px/1 -apple-system,"Noto Sans SC","Microsoft YaHei",system-ui,sans-serif;' +
    /* 按钮本体不做入场动画(可见性是硬功能,不赌动画环境);脉冲光圈纯装饰 */
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

  /* 语言默认:手动选择 > 中国时区→中文 > 英文(navigator.language 不再参与) */
  function resolveSiteLang(){
    try{ var s = localStorage.getItem('site.lang'); if(s==='en'||s==='zh') return s; }catch(e){}
    try{
      var tz = (Intl.DateTimeFormat().resolvedOptions().timeZone) || '';
      if(/^Asia\/(Shanghai|Urumqi|Chongqing|Harbin|Kashgar|Hong_Kong|Macau|Taipei)$/i.test(tz)) return 'zh';
    }catch(e){}
    return 'en';
  }
  /* 注入挂件跟随正文语言；页面未声明时才退回全站默认。 */
  function resolveWidgetLang(){
    var lang = '';
    try { lang = (document.documentElement.lang || '').toLowerCase(); } catch (e) {}
    if (lang.indexOf('zh') === 0) return 'zh';
    if (lang.indexOf('en') === 0) return 'en';
    return resolveSiteLang();
  }
  var en = resolveWidgetLang() === 'en';
  function rewriteThoughtClassicLinks() {
    var ongoingList = mode === 'site' && sitePage === 'ongoing';
    if (mode !== 'thought' && mode !== 'ongoing' && !ongoingList) return;
    try {
      if (sessionStorage.getItem('gg-journey') !== '1') return;
    } catch (e) { return; }
    var nestedRoutes = {
      '../index.html':          ['../explore-a.html',          '旅程大厅', 'Tour hub'],
      '../index.html#projects': ['../explore-a.html#dirs',     '旅程项目', 'Projects (tour)'],
      '../index.html#thoughts': ['../explore-a.html#thoughts', '旅程思考', 'Essays (tour)'],
      '../index.html#about':    ['../explore-a.html#about',    '旅程团队', 'Team (tour)'],
      '../index.html#contact':  ['../explore-a.html#contact',  '去旅程里联系', 'Contact (tour)']
    };
    var rootRoutes = {
      'index.html':          ['explore-a.html',          '旅程大厅', 'Tour hub'],
      'index.html#projects': ['explore-a.html#dirs',     '旅程项目', 'Projects (tour)'],
      'index.html#thoughts': ['explore-a.html#thoughts', '旅程思考', 'Essays (tour)'],
      'index.html#about':    ['explore-a.html#about',    '旅程团队', 'Team (tour)'],
      'index.html#contact':  ['explore-a.html#contact',  '去旅程里联系', 'Contact (tour)'],
      'demos.html':          ['explore-a.html#dirs',     '旅程项目', 'Projects (tour)'],
      'thoughts.html':       ['explore-a.html#thoughts', '旅程思考', 'Essays (tour)'],
      'ongoing.html':        ['explore-a.html#ongoing',  '旅程在建项目', 'Ongoing projects (tour)']
    };
    var routes = ongoingList ? rootRoutes : nestedRoutes;
    Array.from(document.querySelectorAll('a[href]')).forEach(function (a) {
      var href = a.getAttribute('href');
      var route = routes[href];
      /* ongoing 详情正文里的思考内链,旅程会话内直接回到对应讲述场景;经典访客不改。 */
      if (!route && mode === 'ongoing') {
        var thought = href && href.match(/^\.\.\/thoughts\/([^/]+)\.html$/);
        if (thought) {
          a.setAttribute('href', '../explore-a.html#thought/' + encodeURIComponent(thought[1].replace(/-play$/, '')));
          return;
        }
      }
      if (!route) return;
      a.setAttribute('href', route[0]);
      a.textContent = route[en ? 2 : 1];
    });
  }
  var LABEL = mode === 'site'
    ? (en ? '🧭 <span>Guided tour</span>' : '🧭 <span>旅程式浏览</span>')
    : (en ? '🧭 <span>Back to tour</span>' : '🧭 <span>继续旅程</span>');
  function row(href, em, main, sub) {
    return '<a href="' + href + '"><span class="em">' + em + '</span><span>' + main +
      (sub ? '<span class="s">' + sub + '</span>' : '') + '</span></a>';
  }
  function panelHtml() {
    var hd = en ? '🧭 Continue your tour' : '🧭 继续你的旅程';
    if (mode === 'demo') return '<div class="hd">' + hd + '</div>' +
      row(J + '#story/' + encodeURIComponent(slug), '←',
        en ? 'Back to this demo’s story' : '回到这个 demo 的讲述',
        en ? 'Scroll back to its industry & track' : '从这里能滚回它的行业和方向') +
      row(J + '#dirs', '📂', en ? 'Project directory' : '项目目录', en ? '4 tracks · pick the next one' : '四个方向 · 挑下一个听') +
      row(J, '⌂', en ? 'Tour hub' : '旅程大厅');
    if (mode === 'thought') return '<div class="hd">' + hd + '</div>' +
      row(J + '#thought/' + encodeURIComponent(slug), '←',
        en ? 'Back to this essay’s story' : '回到这篇的讲述',
        en ? 'The guided version of this essay' : '这篇思考的旅程讲述场景') +
      row(J + '#thoughts', '💡', en ? 'All essays (tour)' : '读思考', en ? 'Pick the next one to hear' : '挑下一篇听') +
      row(J, '⌂', en ? 'Tour hub' : '旅程大厅');
    if (mode === 'ongoing') return '<div class="hd">' + hd + '</div>' +
      row(J + '#ongoing', '←',
        en ? 'Back to ongoing projects' : '回到在建项目的讲述',
        en ? 'See what is still being validated' : '继续看正在验证、还没做完的东西') +
      row(J, '⌂', en ? 'Tour hub' : '旅程大厅');
    return '<div class="hd">' + (en ? '🧭 Prefer being guided?' : '🧭 想被带着逛?') + '</div>' +
      row(J, '⌂', en ? 'Tour hub' : '旅程大厅', en ? 'Team, demos & essays, step by step' : '团队、项目、思考,一步步讲给你听') +
      row(J + '#dirs', '🧪', en ? 'Browse demos (tour)' : '逛项目', en ? '4 tracks, funnel to yours' : '四个方向,一步挑到你那行') +
      row(J + '#thoughts', '💡', en ? 'Essays (tour)' : '读思考');
  }

  var btn = document.createElement('button');
  btn.className = 'gg-j-btn';
  btn.type = 'button';
  btn.innerHTML = LABEL;
  btn.title = en ? 'Back to the guided tour' : '回到引导式旅程';

  var panel = null;
  function closePanel() { if (panel) { panel.remove(); panel = null; } }
  function openPanel() {
    if (panel) return closePanel();
    panel = document.createElement('div');
    panel.className = 'gg-j-panel';
    panel.innerHTML = panelHtml();
    document.body.appendChild(panel);
  }

  btn.addEventListener('click', function (e) { e.stopPropagation(); openPanel(); });
  document.addEventListener('pointerdown', function (e) {
    if (panel && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) closePanel();
  });

  function mount() { document.body.appendChild(btn); fit(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', rewriteThoughtClassicLinks, { once: true });
  } else {
    rewriteThoughtClassicLinks();
  }
  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();
