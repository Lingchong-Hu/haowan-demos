/* ════════════════════════════════════════════════════════════════════════
   assets/likes.js — 画廊卡片「跨 IP 累计点赞」（渐进增强 / 自包含）
   ────────────────────────────────────────────────────────────────────────
   · 先 GET /api/likes 取全部赞数 + 「我赞过哪些」；只有后端可用时才挂按钮，
     未配置存储（503）/ 取不到 → 不显示按钮，页面照常（不破 UI）。
   · 给每张 .card[data-slug]（跳过「即将上线」的 .soon）右下角追加一个心形点赞按钮。
       — 用 appendChild 注入，避开「<a> 内直接写 <button> 会被浏览器解析纠正」的坑。
       — 按钮点击 preventDefault + stopPropagation，不会触发卡片跳转。
   · 点击：乐观更新（立即 +1/-1、心填充）→ POST 切换 → 用服务端真值校正；失败回滚。
   · 一个 IP 一票、可取消（再点一次取消，由服务端按 IP 哈希判定）。
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  // ⬇⬇⬇ 部署 Cloudflare Worker 后，把这里换成它的地址（见 cloudflare-worker/README.md）
  //     例：var LIKES_API = 'https://haowan-likes.xxx.workers.dev';
  //     正式站 lingchonghu.com 是纯静态(GitHub Pages)，必须填这个绝对地址点赞才会出现。
  //     留空时回退到同源 /api/likes（仅本地 dev server 用）。
  var LIKES_API = '';
  var API = LIKES_API || '/api/likes';
  var state = { counts: {}, mine: {}, ok: false };

  var HEART =
    '<svg class="gg-like-ic" viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M12 20.7C12 20.7 3.6 15.6 3.6 9.6 3.6 6.9 5.7 5 8.1 5c1.7 0 3.1 1 3.9 2.4C12.8 6 14.2 5 15.9 5c2.4 0 4.5 1.9 4.5 4.6 0 6-8.4 11.1-8.4 11.1z"/>' +
    '</svg>';

  var STYLE =
    '.gg-like{position:absolute;bottom:18px;right:18px;display:inline-flex;align-items:center;' +
    'gap:6px;font:500 13px var(--sans,-apple-system,system-ui,sans-serif);' +
    'color:var(--ink-soft,#6b6058);background:var(--card,#fffdfa);' +
    'border:1px solid var(--line,#ded3c6);border-radius:999px;padding:5px 11px 5px 9px;' +
    'cursor:pointer;line-height:1;z-index:3;-webkit-tap-highlight-color:transparent;' +
    'transition:color .18s,border-color .18s,background .18s,transform .12s;' +
    'opacity:0;animation:gg-like-in .25s ease forwards}' +
    '@keyframes gg-like-in{to{opacity:1}}' +
    '.gg-like:hover{border-color:var(--accent-soft,#c98a5a);color:var(--accent,#b4542e)}' +
    '.gg-like:active{transform:scale(.94)}' +
    '.gg-like:focus-visible{outline:2px solid var(--accent-soft,#c98a5a);outline-offset:2px}' +
    '.gg-like .gg-like-ic{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.8;' +
    'stroke-linejoin:round;transition:fill .18s,transform .2s}' +
    '.gg-like .gg-like-n{min-width:8px;text-align:left;font-variant-numeric:tabular-nums}' +
    '.gg-like.liked{color:var(--accent,#b4542e);border-color:var(--accent-soft,#c98a5a);' +
    'background:color-mix(in srgb,var(--accent,#b4542e) 8%,var(--card,#fffdfa))}' +
    '.gg-like.liked .gg-like-ic{fill:currentColor}' +
    '.gg-like.pop .gg-like-ic{animation:gg-like-pop .34s ease}' +
    '@keyframes gg-like-pop{0%{transform:scale(1)}40%{transform:scale(1.5)}100%{transform:scale(1)}}' +
    '@media(max-width:520px){.gg-like{bottom:14px;right:14px;padding:4px 10px 4px 8px;font-size:12.5px}}';

  function injectStyle() {
    if (document.getElementById('gg-like-style')) return;
    var s = document.createElement('style');
    s.id = 'gg-like-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
  }

  function fmt(n) {
    n = n || 0;
    return n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
  }

  function paint(btn) {
    var slug = btn.getAttribute('data-slug');
    var liked = !!state.mine[slug];
    btn.querySelector('.gg-like-n').textContent = fmt(state.counts[slug] || 0);
    btn.classList.toggle('liked', liked);
    btn.setAttribute('aria-pressed', liked ? 'true' : 'false');
    btn.setAttribute('aria-label', (liked ? '取消点赞 · ' : '点赞 · ') + (state.counts[slug] || 0));
  }

  function paintAll() {
    var nodes = document.querySelectorAll('.gg-like');
    Array.prototype.forEach.call(nodes, paint);
  }

  function toggle(slug, btn) {
    if (!state.ok || btn.dataset.busy) return;
    btn.dataset.busy = '1';

    var wasLiked = !!state.mine[slug];
    // 乐观更新
    state.mine[slug] = !wasLiked;
    state.counts[slug] = Math.max(0, (state.counts[slug] || 0) + (wasLiked ? -1 : 1));
    paint(btn);
    btn.classList.remove('pop');
    void btn.offsetWidth; // 重启动画
    btn.classList.add('pop');

    fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slug }),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok) {
          state.counts[slug] = d.count;
          state.mine[slug] = d.liked;
        } else {
          // 服务端拒绝 → 回滚
          state.mine[slug] = wasLiked;
          state.counts[slug] = Math.max(0, (state.counts[slug] || 0) + (wasLiked ? 1 : -1));
        }
        paint(btn);
      })
      .catch(function () {
        // 网络失败 → 回滚
        state.mine[slug] = wasLiked;
        state.counts[slug] = Math.max(0, (state.counts[slug] || 0) + (wasLiked ? 1 : -1));
        paint(btn);
      })
      .then(function () { delete btn.dataset.busy; });
  }

  function mountAll() {
    var cards = document.querySelectorAll('.card[data-slug]');
    Array.prototype.forEach.call(cards, function (card) {
      if (card.classList.contains('soon')) return;        // 「即将上线」不可玩，不挂
      if (card.querySelector(':scope > .gg-like')) return; // 幂等
      var slug = card.getAttribute('data-slug');
      if (!slug) return;

      var btn = document.createElement('button');
      btn.className = 'gg-like';
      btn.type = 'button';
      btn.setAttribute('data-slug', slug);
      btn.innerHTML = HEART + '<span class="gg-like-n">0</span>';
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        toggle(slug, btn);
      });

      if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
      card.appendChild(btn);
      paint(btn);
    });
  }

  function load() {
    fetch(API, { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!(d && d.ok)) return;            // 后端未就绪 → 不挂按钮，页面照常
        state.ok = true;
        state.counts = d.counts || {};
        state.mine = {};
        (d.mine || []).forEach(function (s) { state.mine[s] = true; });
        injectStyle();
        mountAll();
        paintAll();
      })
      .catch(function () { /* 取不到就静默，不显示点赞 */ });
  }

  if (document.readyState !== 'loading') load();
  else document.addEventListener('DOMContentLoaded', load);

  window.GG_LIKES = { reload: load, mountAll: mountAll };
})();
