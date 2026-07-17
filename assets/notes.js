/* ════════════════════════════════════════════════════════════════════════
   assets/notes.js — 划线标注：读者共同批注一篇内容（渐进增强 / 自包含）
   ────────────────────────────────────────────────────────────────────────
   玩法（像纸书页边的铅笔字）：
   1) 访客选中一段文字 → 浮出「✍️ 标注这句」→ 写一句看法提交 → 进后台待审队列
   2) 站长在 tools/数据后台.html 审核，通过即上线
   3) 上线后，所有人都会看到这句话下面有虚线；悬浮/点击就能看到大家的讨论

   接入：
     · 由 assets/feedback.js 自动加载本文件，页面什么都不用做
     · 自动模式：页面里有 <main> / <article> 就对它启用，slug 用 GGFB 的页面 slug
     · 手动模式（SPA，如 explore-a）：加载前设 window.GGNOTES_MANUAL = true，
       场景就绪后调 GGNOTES.arm(rootElement, slug) —— 可反复调用，旧场景自动失效
   接口：POST /note {slug,quote,comment,contact?}   GET /notes?slug=
   限制：v1 只能匹配「不跨标签」的选区；跨 <b>/<a> 的句子提交没问题，但上线后
         找不到原句就静默不画线（数据还在，后台能看到）。
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  if (window.GGNOTES) return;

  var LOCAL = /^(127\.0\.0\.1|localhost)$/.test(location.hostname);
  var API = LOCAL ? '' : 'https://api.interantai.com';

  var IN_IFRAME = false;
  try { IN_IFRAME = window.self !== window.top; } catch (e) { IN_IFRAME = true; }
  if (IN_IFRAME) { window.GGNOTES = { arm: function () {}, open: function () {} }; return; }

  function post(path, data) {
    return fetch(API + path, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },   /* 免 CORS 预检 */
      body: JSON.stringify(data),
      keepalive: true,
    });
  }
  function norm(s) { return String(s).replace(/\s+/g, ' ').trim(); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch];
    });
  }

  /* ---------------- 样式 ---------------- */
  var STYLE =
    'mark.gg-nt{background:none;color:inherit;cursor:pointer;' +
    'border-bottom:2px dashed var(--accent-soft,#c98a5a);padding-bottom:1px;' +
    'transition:background .15s}' +
    'mark.gg-nt:hover{background:color-mix(in srgb,var(--accent,#b4542e) 10%,transparent)}' +
    '.gg-nt-bubble{position:absolute;z-index:9997;font:600 12.5px var(--sans,-apple-system,system-ui,sans-serif);' +
    'color:#fff;background:var(--accent,#b4542e);border:0;border-radius:999px;padding:7px 13px;' +
    'cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.22);white-space:nowrap}' +
    '.gg-nt-pop{position:absolute;z-index:9998;width:min(300px,calc(100vw - 30px));' +
    'background:var(--card,#fffdfa);border:1px solid var(--line,#ded3c6);border-radius:13px;' +
    'padding:13px 14px;box-shadow:0 10px 36px rgba(0,0,0,.16);' +
    'font-family:var(--sans,-apple-system,system-ui,sans-serif);color:var(--ink,#2b2320)}' +
    '.gg-nt-pop .q{font-size:12px;color:var(--ink-soft,#6b6058);border-left:2px solid var(--accent-soft,#c98a5a);' +
    'padding-left:8px;margin-bottom:9px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;' +
    '-webkit-box-orient:vertical;overflow:hidden}' +
    '.gg-nt-pop .c{font-size:13.5px;line-height:1.65;padding:7px 0;border-top:1px dashed var(--line,#ded3c6)}' +
    '.gg-nt-pop .c:first-of-type{border-top:0}' +
    '.gg-nt-pop .c small{display:block;margin-top:2px;color:var(--ink-soft,#6b6058);font-size:11px}' +
    '.gg-nt-pop .add{display:block;margin-top:8px;font:600 12.5px inherit;color:var(--accent,#b4542e);' +
    'background:none;border:0;cursor:pointer;padding:0}' +
    '.gg-nt-panel{position:fixed;bottom:18px;right:18px;z-index:9999;width:min(340px,calc(100vw - 36px));' +
    'background:var(--card,#fffdfa);border:1px solid var(--line,#ded3c6);border-radius:16px;' +
    'padding:18px;box-shadow:0 8px 40px rgba(0,0,0,.14);' +
    'font-family:var(--sans,-apple-system,system-ui,sans-serif);color:var(--ink,#2b2320)}' +
    '.gg-nt-panel h4{margin:0 0 8px;font-size:14.5px;font-weight:600;padding-right:24px}' +
    '.gg-nt-panel .q{font-size:12.5px;color:var(--ink-soft,#6b6058);border-left:2px solid var(--accent-soft,#c98a5a);' +
    'padding-left:8px;margin-bottom:10px;line-height:1.5;max-height:60px;overflow:hidden}' +
    '.gg-nt-panel textarea,.gg-nt-panel input{width:100%;box-sizing:border-box;' +
    'font:400 13.5px var(--sans,-apple-system,system-ui,sans-serif);color:var(--ink,#2b2320);' +
    'background:var(--bg,#f7f3ee);border:1px solid var(--line,#ded3c6);border-radius:10px;' +
    'padding:9px 12px;outline:none;margin-bottom:8px}' +
    '.gg-nt-panel textarea{min-height:64px;resize:vertical}' +
    '.gg-nt-panel textarea:focus,.gg-nt-panel input:focus{border-color:var(--accent-soft,#c98a5a)}' +
    '.gg-nt-send{width:100%;border:0;border-radius:10px;padding:10px 0;cursor:pointer;' +
    'font:600 14px var(--sans,-apple-system,system-ui,sans-serif);color:#fff;background:var(--accent,#b4542e)}' +
    '.gg-nt-send:disabled{opacity:.55;cursor:default}' +
    '.gg-nt-x{position:absolute;top:10px;right:11px;border:0;background:none;cursor:pointer;' +
    'font-size:15px;color:var(--ink-soft,#6b6058);padding:4px}' +
    '.gg-nt-note{margin:7px 0 0;font-size:11.5px;line-height:1.5;color:var(--ink-soft,#6b6058)}' +
    '.gg-nt-ok{text-align:center;padding:8px 0 4px;font-size:14px;line-height:1.7}' +
    '.gg-nt-err{margin:0 0 8px;font-size:12.5px;color:var(--accent,#b4542e)}';

  function injectStyle() {
    if (document.getElementById('gg-nt-style')) return;
    var s = document.createElement('style');
    s.id = 'gg-nt-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  /* ---------------- 已上线标注：拉取 + 画线 ---------------- */
  var armed = [];                       /* [{root, slug}] 最新的在后面 */

  function render(root, slug) {
    fetch(API + '/notes?slug=' + encodeURIComponent(slug))
      .then(function (r) { return r.json(); })
      .then(function (r) {
        if (!r || !r.ok || !r.notes || !r.notes.length || !root.isConnected) return;
        injectStyle();
        /* 同一句话的多条讨论归成一组 */
        var groups = {};
        r.notes.forEach(function (n) { (groups[n.quote] = groups[n.quote] || []).push(n); });
        Object.keys(groups).forEach(function (q) { wrapQuote(root, q, groups[q], slug); });
      })
      .catch(function () {});
  }

  /* 在 root 的文本节点里找 quote 并包上 <mark>（v1：单文本节点内匹配） */
  function wrapQuote(root, quote, notes, slug) {
    var pattern = new RegExp(
      quote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+'));
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || n.nodeValue.length < quote.length / 2) return NodeFilter.FILTER_SKIP;
        var p = n.parentElement;
        if (!p || p.closest('mark.gg-nt,script,style,textarea,input,.ask,.gg-nt-panel')) return NodeFilter.FILTER_SKIP;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    var node;
    while ((node = walker.nextNode())) {
      var m = pattern.exec(node.nodeValue);
      if (!m) continue;
      var target = node.splitText(m.index);
      target.splitText(m[0].length);
      var mark = document.createElement('mark');
      mark.className = 'gg-nt';
      mark.title = notes.length + ' 条读者标注 · 点击查看';
      target.parentNode.replaceChild(mark, target);
      mark.appendChild(target);
      mark.addEventListener('click', function (e) { e.stopPropagation(); showPop(mark, quote, notes, slug); });
      mark.addEventListener('mouseenter', function () { showPop(mark, quote, notes, slug); });
      return;                            /* 每句只画第一处 */
    }
  }

  /* ---------------- 讨论气泡 ---------------- */
  var pop = null;
  function closePop() { if (pop) { pop.remove(); pop = null; } }
  function showPop(mark, quote, notes, slug) {
    closePop();
    injectStyle();
    pop = document.createElement('div');
    pop.className = 'gg-nt-pop';
    pop.innerHTML =
      '<div class="q">' + esc(quote) + '</div>' +
      notes.map(function (n) {
        var d = n.t ? new Date(n.t) : null;
        return '<div class="c">' + esc(n.comment) +
          (d ? '<small>' + (d.getMonth() + 1) + '月' + d.getDate() + '日 · 一位读者</small>' : '') + '</div>';
      }).join('') +
      '<button class="add">✍️ 我也想说两句</button>';
    document.body.appendChild(pop);
    var r = mark.getBoundingClientRect();
    var top = r.bottom + scrollY + 8;
    var left = Math.min(Math.max(10, r.left + scrollX), scrollX + innerWidth - pop.offsetWidth - 10);
    pop.style.top = top + 'px';
    pop.style.left = left + 'px';
    pop.querySelector('.add').onclick = function () { closePop(); openCompose(slug, quote); };
    pop.addEventListener('mouseleave', function () { setTimeout(closePop, 250); });
  }
  document.addEventListener('pointerdown', function (e) {
    if (pop && !pop.contains(e.target) && !e.target.closest('mark.gg-nt')) closePop();
  }, true);

  /* ---------------- 选中文字 → 标注气泡 ---------------- */
  var bubble = null;
  function closeBubble() { if (bubble) { bubble.remove(); bubble = null; } }
  document.addEventListener('mouseup', function () {
    setTimeout(function () {
      closeBubble();
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) return;
      var quote = norm(sel.toString());
      if (quote.length < 2 || quote.length > 300) return;
      var anchor = sel.anchorNode && sel.anchorNode.parentElement;
      if (!anchor) return;
      var hit = null;
      for (var i = armed.length - 1; i >= 0; i--) {
        if (armed[i].root.isConnected && armed[i].root.contains(anchor)) { hit = armed[i]; break; }
      }
      if (!hit || anchor.closest('.ask,.gg-nt-panel,textarea,input,button')) return;
      injectStyle();
      var rect = sel.getRangeAt(0).getBoundingClientRect();
      bubble = document.createElement('button');
      bubble.className = 'gg-nt-bubble';
      bubble.textContent = '✍️ 标注这句';
      document.body.appendChild(bubble);
      bubble.style.top = (rect.bottom + scrollY + 6) + 'px';
      bubble.style.left = Math.min(Math.max(10, rect.left + scrollX + rect.width / 2 - 45),
        scrollX + innerWidth - 110) + 'px';
      bubble.onclick = function () { closeBubble(); openCompose(hit.slug, quote); };
    }, 10);
  });
  document.addEventListener('scroll', closeBubble, true);

  /* ---------------- 提交面板 ---------------- */
  var panel = null;
  function closePanel() { if (panel) { panel.remove(); panel = null; } }
  function openCompose(slug, quote) {
    closePanel();
    injectStyle();
    panel = document.createElement('div');
    panel.className = 'gg-nt-panel';
    panel.innerHTML =
      '<button class="gg-nt-x" aria-label="关闭">✕</button>' +
      '<h4>给这句话留个标注</h4>' +
      '<div class="q">' + esc(quote) + '</div>' +
      '<p class="gg-nt-err" style="display:none"></p>' +
      '<textarea placeholder="你的看法 / 疑问 / 补充，一句就行…" maxlength="500"></textarea>' +
      '<input placeholder="微信 / 邮箱（选填，想深入聊就留）" maxlength="120" />' +
      '<button class="gg-nt-send">提交标注</button>' +
      '<p class="gg-nt-note">审核通过后，这句话下面会出现虚线，大家都能看到你的标注。</p>';
    document.body.appendChild(panel);
    var ta = panel.querySelector('textarea'), ct = panel.querySelector('input'),
        send = panel.querySelector('.gg-nt-send'), err = panel.querySelector('.gg-nt-err');
    panel.querySelector('.gg-nt-x').onclick = closePanel;
    send.onclick = function () {
      var comment = ta.value.trim();
      if (comment.length < 2) { err.textContent = '多写几个字嘛 :)'; err.style.display = ''; ta.focus(); return; }
      send.disabled = true; err.style.display = 'none';
      post('/note', { slug: slug, quote: quote, comment: comment, contact: ct.value.trim() })
        .then(function (r) { return r.json(); })
        .then(function (r) {
          if (!r || !r.ok) throw 0;
          panel.innerHTML = '<div class="gg-nt-ok">提交成功 ✓<br>' +
            '<span style="font-size:12.5px;color:var(--ink-soft,#6b6058)">审核通过后，这句话就会带上虚线，' +
            '所有读到这里的人都能看到你的标注。</span></div>';
          setTimeout(closePanel, 3200);
        })
        .catch(function () {
          send.disabled = false;
          err.textContent = '提交失败了，稍后再试试。'; err.style.display = '';
        });
    };
    ta.focus();
  }

  /* ---------------- 对外 API + 自动挂载 ---------------- */
  function arm(root, slug) {
    if (!root || !slug) return;
    armed = armed.filter(function (a) { return a.root.isConnected && a.root !== root; });
    armed.push({ root: root, slug: slug });
    render(root, slug);
  }
  window.GGNOTES = { arm: arm, open: openCompose };
  try { document.dispatchEvent(new CustomEvent('gg-notes-ready')); } catch (e) {}

  if (!window.GGNOTES_MANUAL) {
    var auto = function () {
      var root = document.querySelector('main') || document.querySelector('article');
      if (!root) return;
      var slug = (window.GGFB && window.GGFB.slug) || 'page';
      arm(root, slug);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto);
    else auto();
  }
})();
