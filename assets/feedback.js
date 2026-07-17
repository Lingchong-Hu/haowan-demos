/* ════════════════════════════════════════════════════════════════════════
   assets/feedback.js — 访问统计 + 「留下想法」浮动留言组件（渐进增强 / 自包含）
   ────────────────────────────────────────────────────────────────────────
   干两件事：
   1) 访问统计：页面打开时 POST /hit {slug, ev:'view'}（每会话每页只报一次）。
      slug 自动从 URL 推断：demos/<x>/ → x；thoughts/<x>.html → th-x；
      project.html?id=x → detail-x；门户页 → page-home / page-demos / …
   2) 留言入口：右下角浮动「💬 留下想法」，点开是一个两输入框的迷你表单
      （场景/需求 + 选填联系方式）→ POST /feedback。这是把「看得高兴」变成
      「写下需求」的主通道——问的是"你的场景是什么"，不是"觉得怎么样"。

   接入方式（三选一，都只要一行）：
      · GG 系 demo：shared/app.js 已自动加载本文件，什么都不用做
      · 门户页 / 独立 demo / 思考页：<script defer src="…/assets/feedback.js"></script>
      · 手动开面板（如首页联系区按钮）：window.GGFB.open()
   细节：
      · 在 iframe 里（project.html 手机框预览）只报 view，不渲染按钮，免得双按钮
      · 后端挂了不破页面：按钮照常显示，提交失败时给出加微信的兜底
      · 请求用 text/plain 发 JSON —— 免 CORS 预检，worker 端直接 parse
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  if (window.GGFB) return;

  // 本地预览（tools/serve.py 带 mock 接口）走同源；线上走 Cloudflare Worker
  var LOCAL = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  var API = LOCAL ? '' : 'https://api.interantai.com';
  var WECHAT = 'Linchhlc2001'; // 兜底联系方式，与 data.js contact.wechatId 保持一致

  /* ---------------- slug ---------------- */
  function sanitize(s) {
    s = String(s).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '').slice(0, 40);
    return /^[a-z0-9]/.test(s) ? s : 'page';
  }
  function pageSlug() {
    var p = location.pathname, m;
    if ((m = p.match(/\/demos\/([a-z0-9-]+)\//))) return m[1];
    if ((m = p.match(/\/demos\/([a-z0-9-]+)\.html$/))) return m[1];
    if ((m = p.match(/\/thoughts\/([a-z0-9-]+)\.html$/))) return sanitize('th-' + m[1]);
    var f = (p.split('/').pop() || 'index.html').replace(/\.html?$/, '') || 'index';
    if (f === 'project') {
      var id = new URLSearchParams(location.search).get('id') || 'unknown';
      return sanitize('detail-' + id);
    }
    if (f === 'index') return 'page-home';
    return sanitize('page-' + f);
  }
  var SLUG = pageSlug();

  /* ---------------- 上报 ---------------- */
  function post(path, data) {
    // text/plain：CORS 安全类型，免预检；worker 端 readBody 不看 Content-Type
    return fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data),
      keepalive: true,
    });
  }
  function hit(ev) {
    try {
      var k = 'gg-hit:' + ev + ':' + SLUG;
      if (sessionStorage.getItem(k)) return;
      sessionStorage.setItem(k, '1');
      post('/hit', { slug: SLUG, ev: ev }).catch(function () {});
    } catch (e) {}
  }

  hit('view');

  // iframe 内（project.html 的手机框）只统计，不渲染按钮
  var IN_IFRAME = false;
  try { IN_IFRAME = window.self !== window.top; } catch (e) { IN_IFRAME = true; }

  /* ---------------- 文案 ---------------- */
  function T() {
    var en = window.LANG === 'en';
    return en ? {
      btn: '💬 Leave a thought',
      title: 'What if this ran on your business?',
      ph: 'One line about your use case / need / gripe…',
      phc: 'WeChat / email (optional — leave it if you want a reply)',
      send: 'Send',
      note: 'If you leave contact info, I reply within 48h.',
      ok: 'Got it, thank you! 🙏',
      okSub: 'If you left contact info, I’ll get back to you soon.',
      fail: 'Failed to send — you can reach me on WeChat: ' + WECHAT,
      short: 'Say a bit more so I can actually help :)',
      close: 'Close',
    } : {
      btn: '💬 留下想法',
      title: '这个如果用在你的业务上会怎样？',
      ph: '一句话说说你的场景 / 需求 / 吐槽都行…',
      phc: '微信 / 邮箱（选填，想收到回复就留）',
      send: '发送',
      note: '留了联系方式的，48 小时内回你。',
      ok: '收到，谢谢！🙏',
      okSub: '留了联系方式的话，我会尽快回你。',
      fail: '发送失败了——可以直接加微信：' + WECHAT,
      short: '多写几个字，我才知道怎么帮你 :)',
      close: '关闭',
    };
  }

  /* ---------------- 样式 ---------------- */
  var STYLE =
    /* 按钮做成主色实心大按钮 + 出场后轻脉冲 3 次引导注意（用户反馈原版太不起眼） */
    '.gg-fb-btn{position:fixed;bottom:22px;right:20px;z-index:9998;display:inline-flex;' +
    'align-items:center;gap:7px;font:600 14.5px var(--sans,-apple-system,system-ui,sans-serif);' +
    'color:#fff;background:var(--accent,#b4542e);border:0;' +
    'border-radius:999px;padding:13px 20px;cursor:pointer;line-height:1;' +
    'box-shadow:0 4px 18px rgba(0,0,0,.18);-webkit-tap-highlight-color:transparent;' +
    'transition:filter .18s,transform .12s,box-shadow .18s;opacity:0;' +
    'animation:gg-fb-in .3s ease .4s forwards,gg-fb-pulse 2.2s ease 1.2s 3}' +
    '@keyframes gg-fb-in{to{opacity:1}}' +
    '@keyframes gg-fb-pulse{0%,100%{box-shadow:0 4px 18px rgba(0,0,0,.18)}' +
    '45%{box-shadow:0 4px 18px rgba(0,0,0,.18),0 0 0 9px color-mix(in srgb,var(--accent,#b4542e) 22%,transparent)}}' +
    '.gg-fb-btn:hover{filter:brightness(1.08);box-shadow:0 6px 22px rgba(0,0,0,.24)}' +
    '.gg-fb-btn:active{transform:scale(.95)}' +
    '.gg-fb-panel{position:fixed;bottom:18px;right:18px;z-index:9999;width:min(340px,calc(100vw - 36px));' +
    'background:var(--card,#fffdfa);border:1px solid var(--line,#ded3c6);border-radius:16px;' +
    'padding:18px;box-shadow:0 8px 40px rgba(0,0,0,.14);' +
    'font-family:var(--sans,-apple-system,system-ui,sans-serif);color:var(--ink,#2b2320)}' +
    '.gg-fb-panel h4{margin:0 0 12px;font-size:15px;font-weight:600;line-height:1.4;padding-right:24px}' +
    '.gg-fb-panel textarea,.gg-fb-panel input{width:100%;box-sizing:border-box;' +
    'font:400 13.5px var(--sans,-apple-system,system-ui,sans-serif);color:var(--ink,#2b2320);' +
    'background:var(--bg,#f7f3ee);border:1px solid var(--line,#ded3c6);border-radius:10px;' +
    'padding:10px 12px;outline:none;margin-bottom:8px}' +
    '.gg-fb-panel textarea{min-height:76px;resize:vertical}' +
    '.gg-fb-panel textarea:focus,.gg-fb-panel input:focus{border-color:var(--accent-soft,#c98a5a)}' +
    '.gg-fb-send{width:100%;border:0;border-radius:10px;padding:11px 0;cursor:pointer;' +
    'font:600 14px var(--sans,-apple-system,system-ui,sans-serif);color:#fff;' +
    'background:var(--accent,#b4542e);transition:opacity .18s}' +
    '.gg-fb-send:disabled{opacity:.55;cursor:default}' +
    '.gg-fb-note{margin:8px 0 0;font-size:12px;line-height:1.5;color:var(--ink-soft,#6b6058)}' +
    '.gg-fb-x{position:absolute;top:12px;right:12px;border:0;background:none;cursor:pointer;' +
    'font-size:16px;line-height:1;color:var(--ink-soft,#6b6058);padding:4px}' +
    '.gg-fb-ok{text-align:center;padding:10px 0 6px}' +
    '.gg-fb-ok .big{font-size:15px;font-weight:600;margin-bottom:6px}' +
    '.gg-fb-ok .sub{font-size:12.5px;color:var(--ink-soft,#6b6058);line-height:1.5}' +
    '.gg-fb-err{margin:0 0 8px;font-size:12.5px;line-height:1.5;color:var(--accent,#b4542e)}' +
    '@media(max-width:520px){.gg-fb-btn{bottom:16px;right:14px;padding:12px 17px;font-size:13.5px}' +
    '.gg-fb-panel{bottom:14px;right:14px}}';

  function injectStyle() {
    if (document.getElementById('gg-fb-style')) return;
    var s = document.createElement('style');
    s.id = 'gg-fb-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  /* ---------------- UI ---------------- */
  var btn = null, panel = null;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function closePanel() {
    if (panel) { panel.remove(); panel = null; }
    if (btn) btn.style.display = '';
  }

  function openPanel() {
    if (panel) return;
    injectStyle();
    hit('open');
    var t = T();
    if (btn) btn.style.display = 'none';

    panel = el('div', 'gg-fb-panel');
    var x = el('button', 'gg-fb-x', '✕');
    x.setAttribute('aria-label', t.close);
    x.onclick = closePanel;

    var h = el('h4', '', t.title);
    var err = el('p', 'gg-fb-err', '');
    err.style.display = 'none';
    var ta = el('textarea');
    ta.placeholder = t.ph;
    ta.maxLength = 1000;
    var ct = el('input');
    ct.placeholder = t.phc;
    ct.maxLength = 120;
    var send = el('button', 'gg-fb-send', t.send);
    var note = el('p', 'gg-fb-note', t.note);

    /* 成功后的收尾：留了联系方式→直接道谢；没留→追问一步（需求侧同学想聊聊） */
    function showOk() {
      panel.innerHTML = '';
      panel.appendChild(x);
      var ok = el('div', 'gg-fb-ok',
        '<div class="big">' + t.ok + '</div><div class="sub">' + t.okSub + '</div>');
      panel.appendChild(ok);
      setTimeout(closePanel, 2600);
    }
    function showContactAsk(origText) {
      var en = window.LANG === 'en';
      panel.innerHTML = '';
      panel.appendChild(x);
      var h2 = el('h4', '', en ? 'Got it! One more thing —' : '收到！🙏 再多问一句——');
      var sub = el('p', 'gg-fb-note', en
        ? 'Care to leave a contact? Someone on our demand side would love to talk through your scenario. No sales pitch — just a real conversation.'
        : '愿意留个联系方式吗？我们需求侧的同学想和你聊聊你的场景——不推销，就是真的想懂你这行。');
      sub.style.margin = '0 0 10px';
      var ct2 = el('input');
      ct2.placeholder = en ? 'WeChat / email' : '微信 / 邮箱';
      ct2.maxLength = 120;
      var yes = el('button', 'gg-fb-send', en ? 'Leave it — talk to me' : '留下，等你们来聊 →');
      var no = el('button', 'gg-fb-note', en ? 'Maybe later' : '这次先不了');
      no.style.cssText = 'display:block;margin:8px auto 0;background:none;border:0;cursor:pointer;text-decoration:underline';
      yes.onclick = function () {
        var v = ct2.value.trim();
        if (!v) { ct2.focus(); return; }
        yes.disabled = true;
        post('/feedback', { slug: SLUG, text: '[补充联系方式] ' + origText.slice(0, 40), contact: v })
          .catch(function () {})
          .then(function () { showOk(); });
      };
      no.onclick = showOk;
      panel.appendChild(h2); panel.appendChild(sub); panel.appendChild(ct2);
      panel.appendChild(yes); panel.appendChild(no);
      ct2.focus();
    }

    send.onclick = function () {
      var text = ta.value.trim();
      if (text.length < 2) {
        err.textContent = t.short; err.style.display = ''; ta.focus(); return;
      }
      send.disabled = true; err.style.display = 'none';
      post('/feedback', { slug: SLUG, text: text, contact: ct.value.trim() })
        .then(function (r) { return r.json(); })
        .then(function (r) {
          if (!r || !r.ok) throw new Error((r && r.error) || 'fail');
          ct.value.trim() ? showOk() : showContactAsk(text);
        })
        .catch(function () {
          send.disabled = false;
          err.textContent = t.fail; err.style.display = '';
        });
    };

    panel.appendChild(x);
    panel.appendChild(h);
    panel.appendChild(err);
    panel.appendChild(ta);
    panel.appendChild(ct);
    panel.appendChild(send);
    panel.appendChild(note);
    document.body.appendChild(panel);
    ta.focus();
  }

  function mountBtn() {
    if (IN_IFRAME || btn) return;
    injectStyle();
    btn = el('button', 'gg-fb-btn', T().btn);
    btn.onclick = openPanel;
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountBtn);
  } else {
    mountBtn();
  }

  window.GGFB = { open: openPanel, slug: SLUG };

  /* 自动加载划线标注组件（notes.js）+ 旅程罗盘（journey.js，仅 demo 页自挂）
     ——和 shared/app.js 加载本文件同一个套路 */
  (function () {
    var cur = (document.currentScript && document.currentScript.src) || '';
    if (!cur) {
      var ss = document.querySelectorAll('script[src*="feedback.js"]');
      if (ss.length) cur = ss[ss.length - 1].src;
    }
    if (!cur) return;
    [['notes.js', 'data-gg-nt'], ['journey.js', 'data-gg-j']].forEach(function (it) {
      if (document.querySelector('script[' + it[1] + ']')) return;
      var s = document.createElement('script');
      s.defer = true;
      s.src = cur.replace(/feedback\.js.*$/, it[0]);
      s.setAttribute(it[1], '1');
      document.head.appendChild(s);
    });
  })();
})();
