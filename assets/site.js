/* ════════════════════════════════════════════════════════════════
   好玩的东西 · 站点交互增强（渐进增强 / progressive enhancement）
   职责：把顶栏在窄屏折叠成可访问的「汉堡」下拉菜单。
   - 同步给 <html> 加 .nav-ready，避免移动端菜单「先展开再收起」的闪烁。
   - 无 JS 时 .nav-links 在窄屏回退为自动换行的链接行（见 style.css），仍可用。
   - 幂等：重复执行不会重复插入按钮。
   ════════════════════════════════════════════════════════════════ */
(function () {
  // 1) 尽早标记（同步执行，先于首屏绘制）——消除 FOUC
  document.documentElement.classList.add('nav-ready');

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var navs = document.querySelectorAll('.nav');
    Array.prototype.forEach.call(navs, function (nav, i) {
      var wrap = nav.querySelector('.wrap') || nav;
      var links = nav.querySelector('.nav-links');
      if (!links) return;
      if (wrap.querySelector('.nav-toggle')) return;        // 已注入过
      if (!links.id) links.id = 'nav-menu-' + (i + 1);

      // 2) 注入无障碍汉堡按钮
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'nav-toggle';
      btn.setAttribute('aria-label', '打开菜单');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', links.id);
      btn.innerHTML = '<span></span><span></span><span></span>';
      wrap.appendChild(btn);                                // flex 末尾 = 视觉靠右

      function setOpen(open) {
        btn.setAttribute('aria-expanded', String(open));
        btn.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
        links.classList.toggle('open', open);
      }

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        setOpen(btn.getAttribute('aria-expanded') !== 'true');
      });
      // 点菜单里的链接后收起
      links.addEventListener('click', function (e) {
        if (e.target.closest('a')) setOpen(false);
      });
      // 点页面其它地方收起
      document.addEventListener('click', function (e) {
        if (!nav.contains(e.target)) setOpen(false);
      });
      // Esc 收起
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' || e.key === 'Esc') setOpen(false);
      });
      // 回到桌面宽度时复位
      var mq = window.matchMedia('(min-width: 721px)');
      var onMq = function () { if (mq.matches) setOpen(false); };
      if (mq.addEventListener) mq.addEventListener('change', onMq);
      else if (mq.addListener) mq.addListener(onMq);
    });
  });
})();
