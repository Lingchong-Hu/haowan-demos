/* ════════════════════════════════════════════════════════════════
   好玩的东西 · 门户国际化（i18n）——唯一语言事实源
   ───────────────────────────────────────────────────────────────
   ▸ 新访客按浏览器语言（中文浏览器→中文，其它→英文）；点顶栏 EN / 中文 切换并记住选择。
   ▸ 语言存 localStorage['site.lang']（手动选择永远优先）；切换时重载页面（最稳）。
   ▸ 本文件必须在 <head> 里「同步」加载，且早于 data.js 与页内渲染脚本，
     这样 window.LANG 在 data.js 决定用中/英数据时已就绪。
   ▸ 静态文案：给元素加 data-i18n="key"，本文件在 DOM ready 时替换 innerHTML。
   ▸ 动态文案（脚本里拼的、带数量的）：脚本里调用 window.t('key') 取词。
   ▸ data.js 末尾据 window.LANG 把 SITE/PROJECTS 换成 SITE_EN/PROJECTS_EN。
   ════════════════════════════════════════════════════════════════ */
(function () {
  var LANG;
  try { var s = localStorage.getItem('site.lang'); if (s === 'en' || s === 'zh') LANG = s; } catch (e) {}
  if (!LANG) {                                      // 无手动选择 → 按浏览器语言（中文→中文，其它→英文）
    var nav = (navigator.language || navigator.userLanguage || 'en').toLowerCase();
    LANG = nav.indexOf('zh') === 0 ? 'zh' : 'en';
  }
  window.LANG = LANG;
  document.documentElement.lang = (LANG === 'zh' ? 'zh-CN' : 'en');

  var T = {
    /* ── 顶栏 ── */
    'nav.brand':       { zh: '好玩的东西',   en: 'Playground' },
    'nav.featured':    { zh: '精选',         en: 'Featured' },
    'nav.allDemos':    { zh: '全部 Demo',    en: 'All Demos' },
    'nav.allThoughts': { zh: '全部思考',     en: 'All Essays' },
    'nav.thoughts':    { zh: '思考',         en: 'Essays' },
    'nav.about':       { zh: '关于',         en: 'About' },
    'nav.contact':     { zh: '联系',         en: 'Contact' },
    'nav.projects':    { zh: '项目',         en: 'Projects' },

    /* ── 页面标题 ── */
    'title.index':    { zh: '好玩的东西 · 项目 · 思考', en: 'Playground · Demos · Essays' },
    'title.demos':    { zh: '全部 Demo · 好玩的东西',   en: 'All Demos · Playground' },
    'title.project':  { zh: '项目 · 好玩的东西',        en: 'Project · Playground' },
    'title.thoughts': { zh: '全部思考 · 好玩的东西',    en: 'All Essays · Playground' },
    'title.team':     { zh: '团队 · 好玩的东西',        en: 'Team · Playground' },

    /* ── 首页 ── */
    'idx.proj.h2':      { zh: '有趣的 demo', en: 'Demos worth clicking' },
    'idx.proj.note':    { zh: '每个行业都在试新的 AI 商业模式——你看到你那行的变化了吗？进来探索一下',
                          en: 'Every industry is testing a new AI business model — do you see what is shifting in yours? Come explore.' },
    'idx.thoughts.h2':  { zh: '一些思考', en: 'A few essays' },
    'idx.thoughts.note':{ zh: '关于意图、数据、安全、人性，与 AI 到底怎么落地',
                          en: 'On intent, data, safety, human nature — and how AI actually ships.' },
    'idx.contact.h2':   { zh: '联系 · 留下你的想法', en: 'Contact · leave a note' },
    'idx.contact.note': { zh: '想合作、想做点什么、或有具体需求都欢迎',
                          en: 'Collaborations, ideas, or concrete needs — all welcome.' },
    'idx.about.team':   { zh: '查看完整团队 →', en: 'Meet the full team →' },
    'idx.footer.big':   { zh: '与其用一页文档说服你，不如让你亲手点几下',
                          en: 'Rather than sell you with a one-pager, let you click around.' },
    'idx.footer.p':     { zh: '这里的东西会持续增加。欢迎体验，也欢迎转发。',
                          en: 'More gets added over time. Come play — and feel free to share.' },
    'idx.footer.site':  { zh: '个人网站 ↗', en: 'Personal site ↗' },

    /* ── 免责声明 ── */
    'disc.full':  { zh: '说明：项目均为可点击产品原型（Demo），用于演示与可行性探讨，非生产系统——无真实后端、支付、物流与 AI 模型，数据为演示用途。',
                    en: 'Note: every project is a clickable product prototype (demo), for illustration and feasibility discussion — not a production system. No real backend, payments, logistics, or AI models; all data is for demo purposes.' },
    'disc.short': { zh: '可点击产品原型（Demo），用于演示与可行性探讨，非生产系统。数据为演示用途。',
                    en: 'A clickable product prototype (demo), for illustration and feasibility discussion — not a production system. Data is for demo purposes.' },

    /* ── 全部 Demo 页 ── */
    'demos.kicker':   { zh: '全部 Demo · 可亲手体验', en: 'All Demos · click any to try' },
    'demos.h1':       { zh: '全部 Demo', en: 'All Demos' },
    'demos.filterAll':{ zh: '全部', en: 'All' },
    'demos.empty':    { zh: '这个分类下暂时没有 Demo。', en: 'No demos in this category yet.' },
    'demos.back':     { zh: '← 回到首页', en: '← Home' },

    /* 卡片按钮 */
    'card.soon': { zh: '即将上线', en: 'Coming soon' },
    'card.try':  { zh: '亲手体验 ↗', en: 'Try it ↗' },
    'card.view': { zh: '查看 · 亲手体验 →', en: 'View · try it →' },

    /* ── 项目详情页 ── */
    'proj.back':        { zh: '← 全部项目', en: '← All projects' },
    'proj.backFull':    { zh: '← 回到全部项目', en: '← Back to all projects' },
    'proj.notFound':    { zh: '没找到这个项目', en: 'Project not found' },
    'proj.notFoundSub': { zh: '链接可能有误，回首页看看全部项目吧。', en: 'The link may be off — head home to browse all projects.' },
    'proj.loading':     { zh: '正在载入实时 Demo…', en: 'Loading live demo…' },
    'proj.fullscreen':  { zh: '全屏体验 ↗', en: 'Open full screen ↗' },
    'proj.copy':        { zh: '复制链接', en: 'Copy link' },
    'proj.copied':      { zh: '已复制 ✓', en: 'Copied ✓' },
    'proj.hint':        { zh: '建议在手机 / 微信中打开', en: 'Best viewed on mobile' },

    /* ── 全部思考页 ── */
    'th.kicker': { zh: '全部思考 · 关于 AI 怎么落地', en: 'All Essays · on shipping AI' },
    'th.h1':     { zh: '全部思考', en: 'All Essays' },
    'th.badge':  { zh: '✦ 互动版', en: '✦ interactive' },
    'th.play':   { zh: '边玩边读 →', en: 'Read + play →' },
    'th.read':   { zh: '阅读 →', en: 'Read →' },

    /* ── 联系卡片（首页脚本用）── */
    'c.wechat':  { zh: '微信', en: 'WeChat' },
    'c.copy':    { zh: '复制', en: 'Copy' },
    'c.copied':  { zh: '已复制 ✓', en: 'Copied ✓' },
    'c.email':   { zh: '邮箱', en: 'Email' },
    'c.profile': { zh: '查看主页 ↗', en: 'View profile ↗' },
    'c.soon':    { zh: '（即将开放）', en: '(coming soon)' },
    'c.emailMe': { zh: '发邮件 ✉', en: 'Email me ✉' },
    'c.subject': { zh: '关于你的项目，我有个想法', en: 'About your project — I have an idea' },

    /* ── 团队页（全静态）── */
    'team.back':   { zh: '← 回到首页', en: '← Home' },
    'team.kicker': { zh: '团队 · Iterant AI', en: 'Team · Iterant AI' },
    'team.h1':     { zh: '精英敏捷团队', en: 'An elite, agile team' },
    'team.lede':   { zh: '我们不是一支普通的开发团队。我们在<b>实验新时代的 AI 组织架构</b>——一半握着需求、市场与客户，一半把它快速、完整、可问责地落地；用<b>实打实的现金收入</b>去验证产品价值，而不是用一套宏大的叙事去换一笔投资。',
                     en: 'We are not an ordinary dev shop. We are <b>prototyping the org design of the AI era</b> — one half holds the needs, the market, and the customers; the other half ships it fast, whole, and accountably. We prove product value with <b>real cash revenue</b>, not by trading a grand narrative for a round of funding.' },

    'team.s1.h2': { zh: '我们在做什么', en: 'What we do' },
    'team.s1.p1': { zh: '我们带着团队，<b>学习并创造新的 AI 开发流程</b>——在 AI 把"造东西"打到地板价的今天，重新回答一个问题：一支团队该怎么组织，才能把 AI 的原生能力，稳稳地变成能交付、能负责的真实产品。',
                    en: 'We lead a team that <b>learns and invents new AI development processes</b> — in an age where AI has driven the cost of building things to the floor, we are re-answering one question: how should a team be organized so that AI native capability reliably becomes a deliverable, accountable, real product?' },
    'team.s1.p2': { zh: '这不是空谈方法论。它落在每一个具体项目里：怎么拆需求、怎么让 AI 写的代码有人能为它答话、怎么把一个人的经验变成全队的共识。我们把这套做法，写进了 <a href="thoughts/dev-process.html" style="color:var(--accent)">可问责的开发流程</a>。',
                    en: 'This is not methodology for its own sake. It lives in every concrete project: how to break needs down, how to make sure someone can answer for the code AI writes, how to turn one person&rsquo;s experience into the whole team&rsquo;s shared knowledge. We wrote this approach up in <a href="thoughts/dev-process.html" style="color:var(--accent)">An accountable development process</a>.' },

    'team.s2.h2': { zh: '我们怎么组队', en: 'How we team up' },
    'team.s2.p':  { zh: '一支精英敏捷团队，由两半焊在一起——这也是<a href="thoughts/ai-org.html" style="color:var(--accent)">为什么律所那套结构，恰好是 AI 时代最对的答案</a>。',
                    en: 'An elite, agile team, welded together from two halves — which is also <a href="thoughts/ai-org.html" style="color:var(--accent)">why the law-firm structure turns out to be the right answer for the AI era</a>.' },
    'team.role1.rn': { zh: '需求 · 市场 · 客户侧', en: 'Needs · market · customer side' },
    'team.role1.rk': { zh: '合伙人角色', en: 'The partner' },
    'team.role1.p':  { zh: '带来需求、市场与客户，以及打通一个新商业模式所需的资源和社会能力。听得懂客户真正要什么，并替整个结果负责。',
                       en: 'Brings the needs, the market, and the customers — plus the resources and social capital to open up a new business model. Actually hears what the customer wants, and owns the whole outcome.' },
    'team.role2.rn': { zh: '精英架构师 · 执行侧', en: 'Elite architect · execution side' },
    'team.role2.rk': { zh: '执行落地', en: 'Execution & delivery' },
    'team.role2.p':  { zh: '把它快速、完整、可问责地落地。一个真正顶尖的架构师，今天能独自扛起过去一整个团队才扛得动的完整产品。',
                       en: 'Ships it fast, whole, and accountably. A truly top architect can now single-handedly carry a complete product that used to take an entire team.' },
    'team.weld':  { zh: '两半各自登峰，再用<b>问责</b>焊成一个对结果负责的整体。<br>以前你要打一场硬仗，得找精英律师；今天你要把一个产品真正做成，得找精英架构师。',
                    en: 'Each half reaches its own peak, then they are welded by <b>accountability</b> into one whole that owns the result.<br>To win a hard fight you used to need an elite lawyer; to actually make a product real today, you need an elite architect.' },

    'team.s3.h2': { zh: '我们信什么', en: 'What we believe' },
    'team.b1': { zh: '<b>用现金收入验证价值，不用叙事换投资。</b>一个产品值不值钱，最诚实的答案是有没有人愿意为它付钱——而不是它的故事讲得多大。',
                 en: '<b>Prove value with cash revenue, not a narrative traded for funding.</b> The most honest answer to whether a product is worth anything is whether someone will pay for it — not how big its story is.' },
    'team.b2': { zh: '<b>真正值钱的，是落地性、稳定性、自动化程度。</b>demo 谁都能做；能交付、扛得住真实用户、市场变了能快速改对的完整产品，才是壁垒。',
                 en: '<b>What is truly valuable is deliverability, stability, and degree of automation.</b> Anyone can make a demo; the moat is a complete product that ships, holds up under real users, and can be changed correctly and fast when the market shifts.' },
    'team.b3': { zh: '<b>核心能力 = 把 AI 大模型的原生能力，结构化地接到具体行业需求上。</b>这道"结构化连接"的活，正是这个时代真正稀缺、也最考验一支团队的地方。',
                 en: '<b>Core capability = wiring the native power of large AI models, structurally, onto concrete industry needs.</b> That work of structural connection is exactly what is scarce in this era, and what tests a team most.' },

    'team.s4.h2': { zh: '成员', en: 'Members' },
    'team.m1.mr': { zh: '创始人 · 需求与架构', en: 'Founder · needs & architecture' },
    'team.m1.mb': { zh: '在「需求」与「落地」之间组织团队，带队学习并创造新的 AI 开发流程，对每一份交付的结果负责到底。',
                    en: 'Organizes the team between needs and delivery, leads it to learn and invent new AI dev processes, and owns every delivered result to the end.' },
    'team.m1.mt': { zh: '<span>Iterant AI 创始人</span><span>Penn · MCIT \'25</span><span>Philadelphia</span>',
                    en: '<span>Founder, Iterant AI</span><span>Penn · MCIT \'25</span><span>Philadelphia</span>' },
    'team.m1.link': { zh: '个人网站 ↗', en: 'Personal site ↗' },
    'team.m2.mr': { zh: '创始人 · 架构师', en: 'Founder · architect' },
    'team.m2.mb': { zh: '北师大-浸会（UIC）人工智能本科、专业第一名毕业，加州大学伯克利数据科学硕士。本科就为学校做了一款类 Rate My Professor 的评教产品「咋样」，在学生中一夜爆火（火到差点被教授告上法庭）。',
                    en: 'AI undergraduate at BNU-HKBU United International College (UIC), graduated first in the major; MS in Data Science at UC Berkeley. As an undergrad he built a Rate-My-Professor-style course-review product, Zayang, that went viral among students overnight — so viral a professor nearly took it to court.' },
    'team.m2.mt': { zh: '<span>UIC · AI 专业第一</span><span>UC Berkeley · 数据科学硕士</span>',
                    en: '<span>UIC · #1 in AI</span><span>UC Berkeley · MS Data Science</span>' },
    'team.m3.mr': { zh: '创始人 · 架构师', en: 'Founder · architect' },
    'team.m3.mb': { zh: '华盛顿大学（UW）生物化学 + 电子工程双学位，宾夕法尼亚大学（UPenn）电子工程硕士在读。横跨硬科学与工程，把复杂系统稳稳地落地。',
                    en: 'Double degree in Biochemistry and Electrical Engineering at the University of Washington (UW); MS in EE in progress at the University of Pennsylvania (UPenn). Spans hard science and engineering, landing complex systems reliably.' },
    'team.m3.mt': { zh: '<span>UW · Biochem + EE 双学位</span><span>UPenn · EE 硕士</span>',
                    en: '<span>UW · Biochem + EE double major</span><span>UPenn · MS EE</span>' },
    'team.m4.mr': { zh: '创始人 · 架构师', en: 'Founder · architect' },
    'team.m4.mb': { zh: '东北大学计算机本科，伊利诺伊大学（UIUC）计算机硕士、AI 博士；有公开发表的 AI 研究。把前沿的模型能力，落进真正能交付的产品里。',
                    en: 'CS undergraduate at Northeastern University; MS in CS and PhD in AI at the University of Illinois (UIUC), with published AI research. Lands frontier model capability into products that can actually be delivered.' },
    'team.m4.mt': { zh: '<span>东北大学 · 计算机</span><span>UIUC · 计算机硕士 / AI 博士</span>',
                    en: '<span>Northeastern Univ. · CS</span><span>UIUC · MS CS / PhD AI</span>' },

    'team.cta.p':   { zh: '有真实的需求要落地，或者想加入一支正在重写 AI 开发流程的团队？',
                      en: 'Have a real need to ship — or want to join a team rewriting how AI gets built?' },
    'team.cta.btn': { zh: '把你的需求讲给我们 →', en: 'Tell us what you need →' }
  };

  window.T = T;
  window.t = function (k) {
    var e = T[k];
    if (!e) return k;
    return (e[LANG] != null) ? e[LANG] : e.zh;
  };

  function apply() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (T[k]) el.innerHTML = (T[k][LANG] != null ? T[k][LANG] : T[k].zh);
    });

    // 顶栏语言切换按钮：高亮 + 绑定（切换即写 localStorage 并重载）
    document.querySelectorAll('[data-lang-btn]').forEach(function (b) {
      var v = b.getAttribute('data-lang-btn');
      b.classList.toggle('active', v === LANG);
      b.setAttribute('aria-pressed', String(v === LANG));
      if (!b.__wired) {
        b.__wired = 1;
        b.addEventListener('click', function () {
          try { localStorage.setItem('site.lang', v); } catch (e) {}
          location.reload();
        });
      }
    });
  }

  if (document.readyState !== 'loading') apply();
  else document.addEventListener('DOMContentLoaded', apply);
})();
