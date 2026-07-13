/* ═══════════════════════════════════════════════════════════════════════════
   好玩的东西 · 站点数据（唯一内容来源）
   ───────────────────────────────────────────────────────────────────────────
   ▸ 加一个新 demo：往 PROJECTS 数组里加一条对象即可。
       · 首页（index.html）只展示 featured:true 的「精选」；其余全部进 demos.html 浏览页。
       · demos.html 顶部按 cat（行业，如 汽车/时尚/金融/教育/医疗/母婴…）chip 筛选。
   ▸ 暂未上线的 demo：把 url 留空字符串 ""，卡片会显示「即将上线」且不可点。
   ▸ 详情页用 project.html?id=<你的 id> 访问；首页 / 浏览页卡片都会自动指过去。
   ▸ sections 里的 html 支持任意 HTML（含下面用到的 .flow / .step / .arr 步骤条）。
   ───────────────────────────────────────────────────────────────────────────
   字段：{ id, no, cat, featured?, kicker, title, subtitle, url, tags[], phoneHint, sections[] }
   ★ 详情页固定四段（顺序勿乱，atelier 为标准模板）：
       1) 是什么    —— 一句话讲清这是个什么产品
       2) 程序逻辑  —— 交互弧（.flow 步骤条）+ 背后的程序逻辑
       3) 商业模式  —— 怎么赚钱、盈利点、护城河
       4) 市场分析  —— 首块「对标 · 谁已靠这套盈利」落到真实企业（带股票代码），再给 痛点/人群/本地化/风险（如实说）
   ═══════════════════════════════════════════════════════════════════════════ */

window.SITE = {
  brand: "好玩的东西",
  hero: {
    kicker: "意图 → 落地 · Iterant AI",
    title: "把真实需求，<br>落成能交付的产品",
    lede: "我们是一支精英敏捷团队：一半握着需求、市场与客户，一半用 AI 把它快速、完整、可问责地落地。" +
          "下面这些能亲手点的 demo，是能力的样张；几篇思考，是我们怎么看意图、数据、安全与人性。" +
          "与其用一页文档说服你，不如让你亲手点几下。",
    pills: ["✦ 全套界面可点击", "✦ 真实状态流转", "✦ 手机 / 微信内可打开"]
  },

  // 自我介绍（来自个人网站，可随时改）
  author: {
    name: "Lingchong Hu · 胡凌冲",
    role: "Founder, Iterant AI",
    blurb: "我们在实验新时代的 AI 组织架构，带着团队学习并创造新的 AI 开发流程。" +
           "更想用实打实的现金收入去验证产品的价值，而不是靠宏大的叙事去换一笔巨额投资。" +
           "真正值钱的，是把需求落地的能力——它的落地性、稳定性与自动化程度，" +
           "考验的是一支团队能不能把 AI 大模型的原生能力，结构化地接到具体的行业需求上。",
    facts: ["Iterant AI 创始人", "Penn · MCIT '25", "Philadelphia"],
    site: "https://lingchong-hu.github.io/",
    siteLabel: "个人网站 ↗"
  },

  // 思考类页面
  // ▸ featured:true 的才在首页「一些思考」展示；其余仍是上线页面，靠各篇内部的相互链接访问。
  thoughts: [
    {
      kicker: "Thinking · 意图",
      title: "意图，才是下一个输入",
      desc: "脑机接口、眼动、语音、肌电……炫酷的新输入设备，都败给了同一件事——习惯的惯性。真正的胜负手不在换设备，在读懂你此刻想做什么。这就是 intnt。",
      href: "thoughts/intent.html",
      play: "thoughts/intent-play.html",
      featured: true
    },
    {
      kicker: "Thinking · 数据",
      title: "你的数据，预言你的明天",
      desc: "每一次点击、停留、深夜的搜索，都是一次「意图的泄露」。把碎片拼起来，就能在你开口之前知道你要什么——这就是预测式商业，和它那条很细的边界。",
      href: "thoughts/data-future.html",
      play: "thoughts/data-future-play.html"
    },
    {
      kicker: "Thinking · 安全",
      title: "当攻防都变便宜",
      desc: "你过去的安全感，多半是「攻击你不划算」撑起来的。AI 把攻击成本打到地板，也把防御成本打到地板——危险的不是技术，是天平倒向谁。",
      href: "thoughts/safety.html",
      play: "thoughts/safety-play.html"
    },
    {
      kicker: "Thinking · 人性",
      title: "需求，挖到人性那一层",
      desc: "用户嘴上要的，从来不是 ta 真正要的。把需求一层层挖到底层人性，你会发现：表层千变万化，底层就那么几根弦——而 AI 改变的，是拨弦的方式，不是弦本身。",
      href: "thoughts/human-needs.html",
      play: "thoughts/human-needs-play.html"
    },
    {
      kicker: "Thinking · 组织",
      title: "AI 时代的组织架构",
      desc: "代码变便宜后，胜负手是「需求洞察 + 完整交付」的结合——而这两样几乎从不长在同一个人身上。为什么律所的结构，恰好是这个时代最对的答案。",
      href: "thoughts/ai-org.html",
      // play：互动版（explorable）。卡片默认进互动版，并显示「✦ 互动版」角标；无此字段则只进 href 原文。
      play: "thoughts/ai-org-play.html"
    },
    {
      kicker: "Thinking · 流程",
      title: "可问责的开发流程",
      desc: "「为它负责」到底是什么意思？从 AI 生成到敢交付，中间那道坎，用「自己懂」还是「独立验证」来跨——这是我们每个项目都在反复做的判断。",
      href: "thoughts/dev-process.html",
      play: "thoughts/dev-process-play.html",
      featured: true
    }
  ],

  // 联系 / 留下想法
  // ▸ wechatId：填你的微信号（主推，手机/电脑都能复制后搜索添加）
  // ▸ email：填长期邮箱（school 邮箱 10 月过期，已换个人 Gmail）
  // ▸ linkedin：领英主页链接；留空则整行隐藏
  // ▸ formUrl：留空（默认）= 按钮直接打开内置留言面板（assets/feedback.js → Worker /feedback，
  //            后台在 tools/数据后台.html 看）；填了第三方表单链接则改为跳转该表单
  // ▸ wechatQR：可选——把微信二维码图片存为 assets/wechat-qr.png 就会额外显示一张图
  contact: {
    intro: "看完有什么想法、想做的，或者有具体需求——欢迎直接找我，或者留下你的需求，我会一条条看。",
    wechatId: "Linchhlc2001",
    email: "hulingchong302@gmail.com",
    linkedin: "https://www.linkedin.com/in/lingchong-hu",
    formUrl: "",
    formLabel: "说说你的想法 / 留下需求",
    wechatQR: "assets/wechat-qr.png"
  }
};

window.PROJECTS = [
  /* ───────────────────────────── Project 01 ───────────────────────────── */
  {
    id: "atelier", cat: "时尚", featured: true,
    no: "01",
    kicker: "个人造型 / 时尚零售",
    title: "高端个人造型平台",
    subtitle: "Stitch Fix 模式 · 专属造型师为你寄一盒，留下喜欢的，退回其余",
    url: "demos/atelier/",
    tags: ["三端闭环", "规则匹配推荐", "订阅 + 抵扣造型费", "数据飞轮"],
    phoneHint: "建议在手机 / 微信中打开，体验最佳",
    sections: [
      {
        label: "是什么",
        html: `<p>把"没时间逛街、又想穿得好"的人，交给一位懂他的<b>专属造型师</b>。
          用户填一份风格问卷，造型师据此挑选若干单品寄到家；
          试穿后<b>留下喜欢的、退回其余</b>，造型费可全额抵扣购买。
          把"逛店挑选"变成"被人懂、被人选"。</p>`
      },
      {
        label: "程序逻辑",
        html: `<h3>三个端，一套闭环</h3>
          <ul>
            <li><b>客户端（秀场）</b>：风格问卷 → 预约 Fix → 预览候选 → 收货 → 逐件留/退 + 反馈 → 结算</li>
            <li><b>造型师端（选品台）</b>：看用户画像，挑 6 件 + 写整体寄语 + 逐件"为什么选它"</li>
            <li><b>运营端（履约）</b>：库存与发货看板，推进送达 → 退货回库存</li>
          </ul>
          <p style="margin-top:14px">核心是一条权威的 <b>Fix 状态机</b>，每一步只能由后台动作推进：</p>
          <div class="flow">
            <span class="step">预约</span><span class="arr">→</span>
            <span class="step">选品中</span><span class="arr">→</span>
            <span class="step">可预览</span><span class="arr">→</span>
            <span class="step">已发货</span><span class="arr">→</span>
            <span class="step">送达试穿</span><span class="arr">→</span>
            <span class="step">结算 / 退货</span>
          </div>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            推荐引擎为"规则匹配"：按 尺码 + 预算 + 品类 + 排除项 过滤候选，
            叠加人工造型师精选——先证明运营闭环成立，再谈真模型。</p>`
      },
      {
        label: "商业模式",
        html: `<ul>
            <li><b>造型费抵扣</b>：每次收造型费，购买时全额抵扣 —— 提高到店转化与客单</li>
            <li><b>留全享折扣</b>：鼓励整盒留下，拉高单次 GMV</li>
            <li><b>订阅复购</b>：单次 / 每月 / 每季，稳定的高客单复购现金流</li>
            <li><b>数据飞轮</b>：每一次留/退 + 反馈都在优化下一次匹配，越用越准、越准越粘</li>
          </ul>`
      },
      {
        label: "市场分析",
        html: `<ul>
            <li><b>对标</b>：美股 Stitch Fix 已验证"造型师 + 数据"个人化零售模式的规模化可行性</li>
            <li><b>国内空白</b>：电商是货架式自助；高端人群"要穿得好但没精力挑"几乎无人服务</li>
            <li><b>人群</b>：一二线中产 / 新中产，愿为"被懂、省时间、有品味"付费</li>
            <li><b>本地化</b>：微信 / 支付宝支付、手机号登录、家族品牌目录，贴合国内消费习惯</li>
          </ul>`
      }
    ]
  },

  /* ───────────────────────────── intnt（产品本体，精选）───────────────────────────── */
  {
    id: "intnt", cat: "效率", featured: true,
    no: "00",
    kicker: "我们的产品 · intnt model",
    title: "intnt · 意图模型",
    subtitle: "不换设备、不改习惯——从你当下的上下文 + 长期行为里读出此刻的意图，把原本要好几步的操作压成一步。",
    url: "",
    tags: ["意图识别", "上下文 + 记忆", "数据存本地", "榨干键鼠效率"]
  },

  /* ───────────────────────────── Project 02 ───────────────────────────── */
  {
    id: "guardian", cat: "养老",
    no: "02",
    kicker: "智慧养老 / 适老化",
    title: "远程守护 · Snug",
    subtitle: "象印的「无感」× Snug 的「主动报平安」× 中国国情 —— 让独居老人有尊严地被守护",
    url: "demos/guardian/",
    tags: ["双轨信号", "四级升级阶梯", "信号聚合中台", "To-G/B 落地"],
    phoneHint: "多角色沙盘，用页内控制台推进剧情",
    sections: [
      {
        label: "是什么",
        html: `<p>回应一对矛盾：<b>老人不想被监控，子女又想安心</b>。
          平时通过家里的日常信号（用水、用电、开门）<b>无感守护</b>，绝不打扰老人；
          只有信号安静到一定程度，才<b>温柔地请老人"报个平安"</b>；
          仍无回应，才一级级请人兜底。老人端永远看不到"监控 / 活动数据 / 被监护"这些字眼。</p>`
      },
      {
        label: "程序逻辑",
        html: `<h3>双轨信号 + 四级升级（一套纯函数状态机）</h3>
          <p>被动信号（水表 / 电表 / 门磁 / 红外 / 烟感 / 水壶）为主，手表手环为增强。
            信号沉默到阈值才切换到"请老人主动确认"，再不行才逐级升级：</p>
          <div class="flow">
            <span class="step">L0 安好</span><span class="arr">→</span>
            <span class="step">L1 留意</span><span class="arr">→</span>
            <span class="step">L2 请报平安</span><span class="arr">→</span>
            <span class="step">L3 子女联系</span><span class="arr">→</span>
            <span class="step">L4 邻居/物业</span><span class="arr">→</span>
            <span class="step">L5 社区网格员</span><span class="arr">→</span>
            <span class="step">L6 120</span>
          </div>
          <p style="margin-top:14px">四个角色端联动演示：</p>
          <ul>
            <li><b>老人端</b>：关怀模式（超大字 + 语音播报 + 亲情号直拨），只见"陪伴"不见"监控"</li>
            <li><b>子女端</b>：一周生活节律图 + 状态卡 + 升级中心 + 健康档案</li>
            <li><b>社区网格员端</b>：中国特色的"人兜底"一层</li>
            <li><b>设备信号台</b>：可视化被动信号源的在线与活动</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            安全不变量写进状态机：<b>任何对外联系（邻居/网格员/120）都必须子女手动触发，系统绝不自动外联</b>；
            老人一句"我很好"任意级别秒复位。</p>`
      },
      {
        label: "商业模式",
        html: `<ul>
            <li><b>做中台，不做硬件</b>：聚合社区/街道<b>已铺设的存量设备</b>，边际成本低，差异化在"分级不惊扰 + 双端叙事"</li>
            <li><b>第一付费方 = 街道 / 居委 + 家床服务商</b>：他们有财政预算与 KPI，子女端/网格员端就是其管理界面（To-G/B）</li>
            <li><b>C 端免费体验 + 增值</b>：关怀模式硬件加配、健康档案云存等，不背 C 端获客大成本</li>
          </ul>`
      },
      {
        label: "市场分析",
        html: `<ul>
            <li><b>政策红利</b>：上海《养老科技创新行动方案 2024–2027》一举覆盖"安全监护 + 健康服务"两类重点产品</li>
            <li><b>官方背书通道</b>：进《智慧健康养老推广目录》（经信委+民政局+卫健委三委联合）= 进街道采购清单</li>
            <li><b>已验证模式</b>：普陀智能水表/烟感 + 一键通急救已落地守护独居老人——不教育市场，只升级已验证的模式</li>
            <li><b>风险（如实说）</b>：数据合规是硬门槛、网格员可调度性需 BD 验证、政府回款慢决策链长</li>
          </ul>`
      }
    ]
  },

  /* ───────────────────────── 05 style-dna ───────────────────────── */
  {
    id: "style-dna", no: "05", cat: "时尚",
    kicker: "时尚 · 个人色彩诊断",
    title: "自拍色彩诊断",
    subtitle: "一张自拍，从真实像素取色，给你色彩季型 + 专属配色板",
    url: "demos/style-dna/", tags: ["真实像素取色","色彩季型","可存图分享","本地处理"],
    phoneHint: "上传自拍或选样片，看季型与配色板（照片只在本地处理）",
    sections: [
      { label: "是什么",   html: `<p>把线下要花几百块的「个人色彩诊断」做成一张自拍就能玩的版本 —— 真实取色、给季型、给配色板。</p>` },
      { label: "程序逻辑", html: `<h3>上传 → 取色 → 季型 + 配色板</h3>
        <div class="flow"><span class="step">上传 / 选样片</span><span class="arr">→</span><span class="step">像素量化取色</span><span class="arr">→</span><span class="step">季型 + 配色板</span><span class="arr">→</span><span class="step">存图</span></div>
        <ul>
          <li><b>真实取色</b>：把照片缩到小图、按色相量化直方图，取人口最多的若干主色</li>
          <li><b>判冷暖深浅</b>：用整体色调（人口加权 R−B）+ 肤色区域微调，落到四季型</li>
          <li><b>生成配色板</b>：按冷暖 + 深浅在 HSL 空间生成推荐色，再取最近中文名 —— <b>换张照片配色就变</b></li>
        </ul>
        <p style="margin-top:16px">全部在浏览器本地完成，<b>照片不上传、纯离线</b>。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>诊断引流 + 增值</b>：免费出季型，付费解锁完整配色手册 / 妆容建议（House of Colour 的线上化版本）</li>
          <li><b>导购分佣</b>：按配色板推荐单品，电商 CPS 分成</li>
          <li><b>订阅</b>：随季更新衣橱配色、出门搭配提醒</li>
          <li><b>B 端</b>：给彩妆 / 服饰品牌做「适合你的色号」选品入口</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>House of Colour</b>：做「四季色彩诊断」的连锁加盟品牌，全球数百名顾问按次收费，证明色彩诊断本身就是一门生意。</li>
          <li><b>韩国个人色彩诊断（퍼스널컬러）</b>：成熟付费服务，单次咨询常达数百元，门店遍地。</li>
          <li><b>Style DNA / Drape 等 App</b>：把色彩与穿搭诊断做成订阅制工具。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：「我适合什么颜色」高频且模糊，线下诊断贵、门槛高</li>
          <li><b>人群</b>：关注穿搭与妆容的年轻女性为主，社交分享意愿强</li>
          <li><b>本地化</b>：接小红书种草生态、彩妆国货色号库</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：单张自拍受光线 / 滤镜影响大，专业诊断仍需标准光与人工；本 demo 为像素启发式，非专业结论</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 06 alta ───────────────────────── */
  {
    id: "alta", no: "06", cat: "时尚",
    kicker: "时尚 · AI 穿搭",
    title: "场合穿搭",
    subtitle: "连淘宝导入你买过的衣服 + 上传想穿的 → AI 配整套，缺的直接给购买链接",
    url: "demos/alta/", tags: ["连购物记录导入","上传想搭的","AI 整套 look","带链接导购"],
    phoneHint: "连淘宝导入衣橱 + 选场合，看整套 + 购买链接",
    sections: [
      { label: "是什么",   html: `<p>不用手动一件件录衣橱：<b>授权连接淘宝等</b>，自动把你买过的服饰导入成数字衣橱；再<b>上传一件最近想穿的</b>，AI 以它为核心、按「今天去哪」配出整套 look，<b>缺的单品直接给购买链接</b>——搭配即导购，一条闭环。</p>
        <p class="small" style="color:var(--ink-soft)">demo 用模拟订单数据演示授权导入；真实产品走电商开放授权 + 带返佣的商品直链。</p>` },
      { label: "程序逻辑", html: `<h3>导入买过的 + 上传想穿的 → AI 整套 + 购买链接</h3>
        <div class="flow"><span class="step">连淘宝导入</span><span class="arr">→</span><span class="step">上传想搭的</span><span class="arr">→</span><span class="step">选场合</span><span class="arr">→</span><span class="step">AI 出整套</span><span class="arr">→</span><span class="step">缺的给链接</span></div>
        <ul>
          <li><b>授权导入</b>：读取购物记录里的服饰订单 → 自动识别部位 / 风格，省掉手动录入（演示用模拟订单）</li>
          <li><b>上传想搭的</b>：传一件最想穿的单品，钉死所在部位，AI 围着它把整套配好</li>
          <li>按场合在你的单品里挑出上装 + 下装 + 鞋 + 配饰成套，<b>换场合就换一套</b>，附正式度匹配刻度</li>
          <li><b>带链接推荐</b>：扫出补哪一件能升级最多场合（核心位权重高于配饰），<b>直接给淘宝同款链接</b> + 一键试搭</li>
        </ul>
        <p style="margin-top:16px">成套与缺口排序<b>全本地确定性</b>；连了 AI key 再让模型搭配 + 写导购话术。隐私：只读服饰类订单、不读支付信息、不上传。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>导购分佣（核心）</b>：搭配里缺的单品直接挂带返佣的商品链接，搭配即下单，CPS 分成</li>
          <li><b>订阅</b>：无限搭配、衣橱分析、缺件提醒（Whering / Cladwell 模式）</li>
          <li><b>二手 / 租赁</b>：低频单品导向闲置与租衣平台</li>
          <li><b>数据资产</b>：真实衣橱与搭配偏好，是品牌选品的稀缺数据</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Whering / Acloset / Indyx</b>：数字衣橱 App，把衣橱拍进手机、AI 出搭配，靠订阅与导购盈利，用户已数百万级。</li>
          <li><b>Stitch Fix（美股 SFIX）</b>：造型师 + 数据出整套搭配的个性化零售，公开市场验证。</li>
          <li><b>Cladwell</b>：胶囊衣橱 + 每日穿搭推荐的订阅工具。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：「衣柜满了却没衣服穿」，搭配决策天天发生</li>
          <li><b>人群</b>：注重穿搭、衣物多但缺搭配力的都市人群</li>
          <li><b>本地化</b>：接淘宝 / 京东购物记录授权、小红书穿搭灵感、国内电商 SKU</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：读取购物记录需用户授权、涉隐私合规；搭配审美主观；本 demo 用模拟订单演示</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 07 fortuna（合并 origin 体检 + robo-core 配置）─────────── */
  {
    id: "fortuna", no: "07", cat: "金融", featured: true,
    kicker: "个人财富 · AI 财务管家",
    title: "AI 财务管家",
    subtitle: "财务体检 → 设目标 → 资产配置 + 蒙特卡洛达成概率 + 行动计划，一条闭环",
    url: "demos/fortuna/", tags: ["财务体检","目标驱动","蒙特卡洛","风险配置","纯离线"],
    phoneHint: "填快照 → 设目标 → 看达成概率随目标/期限/定投实时变化",
    sections: [
      { label: "是什么",   html: `<p>把「财务体检」和「智能投顾」打通成一条闭环：先用几项数字给你算出财务健康分与<b>可投资余力</b>，再让你定一个目标（买房/退休/教育/应急），系统按你的风险画像给出资产配置，并用<b>蒙特卡洛模拟跑 1000 次市场情景</b>，告诉你「在 N 年内攒够的概率有多大」，最后给一份按理财金字塔排序的行动计划。</p>
        <p class="small" style="color:var(--ink-soft)">改目标 / 期限 / 每月定投 / 风险，达成概率与扇形带即时重算。</p>` },
      { label: "程序逻辑", html: `<h3>体检 → 目标 → 配置 → 蒙特卡洛 → 行动</h3>
        <div class="flow"><span class="step">财务快照</span><span class="arr">→</span><span class="step">健康分 + 风险画像</span><span class="arr">→</span><span class="step">设目标</span><span class="arr">→</span><span class="step">配置 + 达成概率</span><span class="arr">→</span><span class="step">行动计划</span></div>
        <ul>
          <li><b>体检</b>：储蓄率/负债比/应急金/支出占比加权成健康分；算出净资产与每月可投余力</li>
          <li><b>风险画像</b>：承受「意愿」（问卷）× 承受「能力」（年龄/期限/应急金/负债客观推算），取较低者为上限 → C1~C5</li>
          <li><b>蒙特卡洛</b>：用配置的预期收益与波动跑 1000 条路径，给出达成概率与 p10/p50/p90 扇形带（同样输入 → 同样结果，可复现）</li>
          <li><b>行动计划</b>：按「应急金 → 还高息债 → 配置定投 → 加保障」金字塔排序，引用你的真实数字</li>
        </ul>
        <p style="margin-top:16px">评分、配置、蒙特卡洛<b>全本地确定性计算、零外部依赖</b>；连了 AI key 再叠加一段合规解读。结果区强制「非投资建议」声明。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>管理费（AUM）+ 增值订阅</b>：目标规划、税务优化、人工顾问加配（Betterment / Wealthfront 模式）</li>
          <li><b>金融产品导流</b>：按薄弱项精准对接储蓄 / 保险 / 还债工具，CPA / CPS 变现（Credit Karma 模式）</li>
          <li><b>B 端 / 白标</b>：作为银行、券商、雇主福利的「财务健康 + 投顾」引擎</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Betterment / Wealthfront</b>：美国两大独立智能投顾，问卷定风险 → 自动配置，Wealthfront 的 Path 正是「目标 + 蒙特卡洛达成概率」这套，各管理数百亿美元。</li>
          <li><b>Origin / Monarch / Rocket Money</b>：把收入、储蓄、负债、目标聚合成财务全景与规划的订阅工具。</li>
          <li><b>Credit Karma（Intuit 收购）/ NerdWallet（NRDS）</b>：免费评分/测评 → 金融产品导流，公开市场验证的变现路径。</li>
          <li><b>蚂蚁财富「帮你投」/ 理财魔方</b>：国内基金投顾，目标式陪伴 + 组合配置。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：体检知道分数却不知怎么动手；投顾给了配置却不回答「我到底能不能达成目标」——两件事一向是割裂的</li>
          <li><b>人群</b>：有结余、有目标（买房/养娃/退休）、想省心又想看清概率的中青年</li>
          <li><b>本地化</b>：国内需基金投顾牌照，与持牌机构合作落地；接公积金/保险/储蓄语境</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：涉投资强监管，本 demo 仅为产品原型与测算、非投资建议；市场假设为简化模型，不预示未来收益</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 09 oboe ───────────────────────── */
  {
    id: "oboe", no: "09", cat: "教育",
    kicker: "教育 · AI 生成课程",
    title: "秒变一门课",
    subtitle: "输入任意主题 → 生成有章节、有测验的迷你课，学完还给你一张「掌握度报告」：哪几章没学透、要重点复习",
    url: "demos/oboe/", tags: ["主题即课程","章节 + 测验","掌握度报告","重做错题"],
    phoneHint: "生成课程 → 做测验 → 点「看掌握度报告」",
    sections: [
      { label: "是什么",   html: `<p>把「我想学 X」一句话变成一门带章节和小测的迷你课——<b>并在学完后告诉你真的掌握了多少</b>。生成内容只是开始，<b>学会</b>才是目的。</p>` },
      { label: "程序逻辑", html: `<h3>主题 → 大纲 → 章节 + 测验 → 掌握度报告</h3>
        <div class="flow"><span class="step">输入主题</span><span class="arr">→</span><span class="step">生成大纲</span><span class="arr">→</span><span class="step">章节 + 每章测验</span><span class="arr">→</span><span class="step">掌握度报告</span><span class="arr">→</span><span class="step">重做错题</span></div>
        <ul>
          <li>任意主题都拆成 5 个章节，每章给要点 + 1~2 道即时判分测验</li>
          <li><b>＋1：结课掌握度</b>——跟踪每章答题 → 算掌握度（如 6/8=75%）→ 揪出待复习的薄弱章 → 重点回顾</li>
          <li><b>重做错题</b>：答对就从薄弱里划掉，掌握度实时回升（对标 Oboe / 可汗的「学会」闭环，而非只生成内容）</li>
        </ul>
        <p style="margin-top:16px">本地结构化生成 + 掌握度全在浏览器算，<b>纯离线可玩</b>；连自己的 key 才用真实模型出课、并针对薄弱点重讲。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>订阅</b>：无限生成课程、保存学习路径、进度追踪（Oboe / Duolingo 模式）</li>
          <li><b>B 端培训</b>：企业按主题秒出内训微课，按席位收费</li>
          <li><b>内容市场</b>：优质生成课二次分发、创作者分成</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Oboe（oboe.fyi）</b>：同名产品，正是「输入任意主题 → 即时生成一门 AI 课程」，本 demo 复刻其核心交互。</li>
          <li><b>Coursera（美股 COUR）/ Udemy（美股 UDMY）</b>：在线课程平台，证明「把知识打包成结构化课程」是规模化生意。</li>
          <li><b>Duolingo（美股 DUOL）</b>：把学习做成结构化关卡 + 订阅，盈利且高留存。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：碎片学习需求强，但「找/做一门结构化课」成本高</li>
          <li><b>人群</b>：终身学习者、备考者、企业培训</li>
          <li><b>本地化</b>：接国内职业技能 / 考证内容，叠加社群打卡</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：生成内容的准确性与深度需人工把关；本 demo 为模板化演示</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 10 adaptive-quiz ───────────────────────── */
  {
    id: "adaptive-quiz", no: "10", cat: "教育",
    kicker: "教育 · 自适应学习",
    title: "自适应测验",
    subtitle: "答对升难度、答错降难度，结尾给预测分，并定位你的「能力边界」、针对边界难度专项攻顶",
    url: "demos/adaptive-quiz/", tags: ["难度自适应","预测分","能力边界定位","专项攻顶"],
    phoneHint: "连续答题 → 看预测分 → 点「专项攻顶」练边界难度",
    sections: [
      { label: "是什么",   html: `<p>题目难度随你的对错实时调整，最后不只给预测分，<b>还告诉你卡在哪一档、该专项练哪个难度</b>——诊断不止于一个分数。</p>` },
      { label: "程序逻辑", html: `<h3>答题 → 自适应 → 预测分 + 能力定位 + 专项攻顶</h3>
        <div class="flow"><span class="step">答题</span><span class="arr">→</span><span class="step">难度自适应</span><span class="arr">→</span><span class="step">预测分</span><span class="arr">→</span><span class="step">能力边界</span><span class="arr">→</span><span class="step">专项攻顶 ×5</span></div>
        <ul>
          <li>每题维护一个能力估计：答对上调、答错下调，下一题按当前难度出，逐步收敛到你的水平</li>
          <li><b>＋1：能力定位</b>——从难度轨迹算出你「稳定接住到难度 X、边界在难度 X+1」（自适应降级会末尾重测低难，故按"答对过的最高难度"定边界，恒不矛盾）</li>
          <li><b>＋1：专项攻顶</b>——只挑你边界难度连答 5 道（难度固定不再自适应），看能否突破，对标 Riiid 的「弱项专练」</li>
        </ul>
        <p style="margin-top:16px">本地简化版 IRT / CAT 逻辑 + 边界定位全在浏览器算，<b>纯离线</b>；连 key 才让 AI 按难度现场出任意主题的题。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>订阅备考</b>：自适应刷题 + 预测分 + 弱项专练（Riiid / Santa 模式）</li>
          <li><b>B 端</b>：给学校 / 机构做分层测评与诊断</li>
          <li><b>认证测评</b>：把预测分接入正式考试备考链路</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Riiid「Santa」（韩国/日本）</b>：AI 自适应刷 TOEIC，按预测分推题，订阅制盈利、用户数百万。</li>
          <li><b>GRE / GMAT 计算机自适应考试（ETS / GMAC）</b>：答对加难、答错减难的 CAT 机制，是标准化考试的成熟范式。</li>
          <li><b>Duolingo（美股 DUOL）</b>：用自适应与预测模型做个性化练习与留存。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：题海无效、不知道自己卡在哪一档</li>
          <li><b>人群</b>：考证 / 留学 / K12 备考人群</li>
          <li><b>本地化</b>：接国内考研 / 公考 / 四六级题库</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：预测精度依赖大题库与真实作答数据；本 demo 为简化演示</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 11 final-round ───────────────────────── */
  {
    id: "final-round", no: "11", cat: "招聘",
    kicker: "招聘 · AI 模拟面试",
    title: "模拟面试",
    subtitle: "选个岗位，AI 出题，针对你的真实回答给结构化反馈",
    url: "demos/final-round/", tags: ["模拟面试","STAR 反馈","针对真实回答","纯离线"],
    phoneHint: "选岗位、答一题，看三维结构化反馈",
    sections: [
      { label: "是什么",   html: `<p>选岗位 → AI 出面试题 → 针对你答的内容给 STAR / 具体性 / 改进三项反馈。</p>` },
      { label: "程序逻辑", html: `<h3>选岗 → 出题 → 结构化反馈</h3>
        <div class="flow"><span class="step">选岗位</span><span class="arr">→</span><span class="step">AI 出题</span><span class="arr">→</span><span class="step">STAR / 具体性 / 建议</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>不同岗位出不同题</li>
          <li>反馈是三项结构化打分，且<b>针对你实际答的内容</b>（引用你写的句子），不是通用模板</li>
          <li>给可操作的改写建议</li>
        </ul>
        <p style="margin-top:16px">本地文本启发式（结构 / 关键词 / 长度等信号），<b>零外部依赖、纯离线</b>。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>C 端订阅</b>：无限模拟、岗位题库、表达报告（Final Round / Yoodli 模式）</li>
          <li><b>B 端初筛</b>：给企业做标准化 AI 面试与评分（HireVue 模式）</li>
          <li><b>校招合作</b>：高校就业中心、培训机构分发</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Final Round AI</b>：同名产品，面试模拟 + 实时辅导，订阅制，本 demo 复刻其「出题—答题—反馈」内核。</li>
          <li><b>Yoodli</b>：AI 口才 / 面试教练，按表达质量给结构化反馈，订阅盈利。</li>
          <li><b>HireVue</b>：企业级 AI 面试评估，被大量大厂用于初筛，B 端付费。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：面试紧张、缺反馈、没人陪练</li>
          <li><b>人群</b>：应届生、跳槽者、转行人群</li>
          <li><b>本地化</b>：接国内行业面试题、中文表达评估</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：评估公平性受关注；本 demo 为启发式反馈，不评判真人能力</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 12 clause-risk ───────────────────────── */
  {
    id: "clause-risk", no: "12", cat: "法律",
    kicker: "法律科技 · 签前军师",
    title: "合同签前军师",
    subtitle: "贴条款 + 选你是哪一方 → 该不该签、哪几条是底线、还缺哪些保护，最后给你一封能直接发的改约邮件",
    url: "demos/clause-risk/", tags: ["选边读倾斜","倾斜度裁决","底线/争取分级","缺失条款检测","一键改约邮件"],
    phoneHint: "选立场、贴条款，看倾斜裁决与改约邮件",
    sections: [
      { label: "是什么",   html: `<p>它不只标红风险，更替你拿主意：先选你是租客 / 乙方 / 求职者…哪一方，再读这份纸<b>偏向谁、该不该签</b>，把风险切成<b>「底线必改」和「能争取」</b>，揪出<b>本该有却没写的保护条款</b>，最后一键生成一封<b>可直接发出去的改约邮件</b>。</p>` },
      { label: "程序逻辑", html: `<h3>选边 → 标红 → 倾斜裁决 → 底线/缺失 → 改约邮件</h3>
        <div class="flow"><span class="step">选你是哪一方</span><span class="arr">→</span><span class="step">标红真实片段</span><span class="arr">→</span><span class="step">倾斜度裁决</span><span class="arr">→</span><span class="step">底线/争取 + 缺失条款</span><span class="arr">→</span><span class="step">一键改约邮件</span></div>
        <ul>
          <li>标红的永远是你那段文字里的<b>真实句子</b>（正则 matchAll；连 AI 也强制在原文里能搜到才标），<b>绝不凭空标红</b></li>
          <li>同一条款<b>随立场翻转解读</b>：对弱势签字方是「坑」，对出条款的强势方就是「盾」——切换身份，裁决与邮件实时重算</li>
          <li>倾斜度 + 一句话裁决（先别签 / 谈了再签 / 可签）；风险分成底线必改与能争取</li>
          <li>「缺失条款」补判正则看不到的：本该有的<b>责任上限、对等解除权、对方违约责任、数据删除</b>等</li>
        </ul>
        <p style="margin-top:16px">判断层<b>全本地可算、纯离线</b>；连 API Key 后用真实模型抽取风险、并润色改约邮件。带「非法律建议」声明。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>企业订阅</b>：法务 / 销售合同自动初审，按席位 / 用量收费（LawGeex / Spellbook 模式）</li>
          <li><b>CLM 中台</b>：合同起草—审查—签署—归档全流程（Ironclad 模式）</li>
          <li><b>C / SMB 端</b>：个人 / 小企业的「签前体检」轻量订阅</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>LawGeex</b>：AI 自动审合同、对照公司标准标风险，企业付费，是合同审查 AI 的代表。</li>
          <li><b>Spellbook / Robin AI</b>：起草与审查合同的 AI 助手，订阅制，融资活跃。</li>
          <li><b>Luminance / Ironclad</b>：法律 AI 与合同全生命周期管理（CLM），服务大量企业法务，估值达独角兽级。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：普通人 / 小企业看不懂合同、请律师贵，签前缺把关</li>
          <li><b>人群</b>：中小企业、自由职业者、个人签约场景</li>
          <li><b>本地化</b>：接中国合同法语境与常见格式条款库</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：法律判断需专业人士，本 demo 仅作交互展示、非法律建议</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 13 ubie ───────────────────────── */
  {
    id: "ubie", no: "13", cat: "医疗",
    kicker: "数字医疗 · 症状自查",
    title: "症状自助分诊",
    subtitle: "描述症状，自适应追问，给「自护 / 远程 / 急诊」三级建议，并告诉你该挂哪个科、整理一张给医生的就诊速览卡",
    url: "demos/ubie/", tags: ["自适应追问","三级分诊","该挂哪个科","就诊速览卡"],
    phoneHint: "选主诉 → 回答追问 → 看分级 + 挂号科室 + 速览卡",
    sections: [
      { label: "是什么",   html: `<p>描述不舒服 → 它像分诊护士一样追问 → 给出该自己观察、远程问诊、还是赶紧去急诊，<b>并接着告诉你「该挂哪个科」、生成一张能带去医院给医生看的速览卡</b>——分级之后，真正解决"那我现在去哪、怎么说"。</p>` },
      { label: "程序逻辑", html: `<h3>主诉 → 追问 → 三级建议 + 该挂哪个科 + 速览卡</h3>
        <div class="flow"><span class="step">描述症状</span><span class="arr">→</span><span class="step">自适应追问</span><span class="arr">→</span><span class="step">三级建议</span><span class="arr">→</span><span class="step">该挂哪个科</span><span class="arr">→</span><span class="step">就诊速览卡</span></div>
        <ul>
          <li>不同主诉 / 不同 yes-no 走出<b>不同追问路径</b>（决策树），据回答给紧急度分级</li>
          <li><b>＋1：该挂哪个科</b>——按主诉与分级导诊（如 胸痛→心血管内科 / 急诊走胸痛中心、头痛→神经内科），对标 Ubie「症状→科室」的核心价值</li>
          <li><b>＋1：就诊速览卡</b>——把主诉 / 关键症状 / 红旗 / 想问医生的问题整理成可一键复制的卡片，带去医院或发给在线医生（解决"面诊说不清"）</li>
        </ul>
        <p style="margin-top:16px">本地决策树 + 规则 + 导诊全在浏览器算，<b>纯离线</b>；连 key 才叠加 AI 个性化解读。导诊与速览卡均为 routing / 整理，<b>非诊断</b>，带「非医疗诊断」声明。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>分诊导流</b>：把用户导向远程问诊 / 线下科室，按问诊 / 转化分成（K Health 模式）</li>
          <li><b>B 端</b>：作为医院 / 保险 / 药企的智能分诊入口（Ubie / Ada 与机构合作模式）</li>
          <li><b>降本</b>：减少不必要的门急诊挤兑，对医保 / 保险有价值</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Ubie（日本）</b>：同名 AI 症状自查与分诊，覆盖大量用户、与医院和药企合作，本 demo 复刻其交互。</li>
          <li><b>Ada Health（德国）</b>：AI 症状评估，全球数千万次评估，与保险 / 医疗机构合作。</li>
          <li><b>K Health（美国）</b>：症状自查 + 远程问诊一体，订阅 + 问诊收费。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：「这病要不要去医院」高频焦虑，自己搜易吓自己</li>
          <li><b>人群</b>：普通家庭、慢病人群、医疗资源紧张地区</li>
          <li><b>本地化</b>：接国内互联网医院与分级诊疗政策</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：医疗强监管、安全第一，本 demo 仅作交互展示、非医疗诊断</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 14 nl-home ───────────────────────── */
  {
    id: "nl-home", no: "14", cat: "房产",
    kicker: "房产科技 · 自然语言找房",
    title: "一句话找房",
    subtitle: "用大白话描述梦想的家，约束被真正解析过滤；再照实说你这份心愿单哪条最该松、松开能多几套",
    url: "demos/nl-home/", tags: ["自然语言解析","约束过滤","心愿取舍雷达","松开重搜解锁更多","纯离线"],
    phoneHint: "输入一句话需求，看匹配房源与「哪条最该松」",
    sections: [
      { label: "是什么",   html: `<p>把「两室、预算 300 万、地铁附近、次新」这种人话解析成筛选条件并真去过滤房源；<b>更进一步</b>——别家只给匹配或报「0 结果」，这里照实告诉你这份心愿单内部在打架：<b>哪一条最该松、松开它能多几套</b>，预算还给「再加 X 万解锁 N 套」的最实在台阶，一键松开即重搜。</p>` },
      { label: "程序逻辑", html: `<h3>一句话 → 解析约束 → 匹配 + 心愿取舍雷达</h3>
        <div class="flow"><span class="step">输入一句话</span><span class="arr">→</span><span class="step">解析约束</span><span class="arr">→</span><span class="step">过滤 + 匹配理由</span><span class="arr">→</span><span class="step">哪条最该松(松开重搜)</span></div>
        <ul>
          <li>从自由文本里抽取卧室数 / 预算 / 城市 / 房龄等约束；<b>违背硬约束的房源不出现</b>（真过滤，不是摆设）</li>
          <li><b>取舍雷达</b>：对每条硬约束做反事实模拟——松开它能多解锁几套；预算给「再加 X 万 → +N 套」的最便宜台阶；荐最划算的一条让步，一键松开重搜实时重算</li>
          <li>再点破「你列了 N 个『最好有』，但没一套全中，最多命中 M 个」——分清硬筛选与加分项</li>
        </ul>
        <p style="margin-top:16px">本地轻量 NLP（关键词 + 数值抽取）+ 过滤 + 取舍模拟，<b>判断层全本地、纯离线</b>；连 key 仅用真实模型升级解析。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>经纪 / 房源导流</b>：高意向需求按线索 / 成交计费（Zillow / Rightmove 模式）</li>
          <li><b>置顶与广告</b>：房源曝光、经纪人会员</li>
          <li><b>金融导流</b>：房贷 / 装修 / 保险分佣</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Zillow（美股 ZG）/ Redfin（美股 RDFN）</b>：北美最大在线房产平台，已上线自然语言搜索，靠经纪导流与广告盈利。</li>
          <li><b>Rightmove（英股 RMV）</b>：英国房产门户，高利润率的线索 / 会员模式。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：传统找房要逐项勾筛选器，表达不出「我想要的感觉」</li>
          <li><b>人群</b>：购房 / 租房的城市人群</li>
          <li><b>本地化</b>：接贝壳 / 安居客式房源与城市数据</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：房源真实性与时效是命门；本 demo 用样例房源做解析演示</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 15 mindtrip ───────────────────────── */
  {
    id: "mindtrip", no: "15", cat: "旅行",
    kicker: "旅行 · AI 行程规划",
    title: "行程 + 地图",
    subtitle: "想去哪打哪 → AI 补全当地去处，本地引擎排出懂行的逐时行程 + 交互地图",
    url: "demos/mindtrip/", tags: ["任意城市","懂行排程","交互地图","就地微调"],
    phoneHint: "输入城市 + 特殊要求，看懂行的逐时行程与地图标点",
    sections: [
      { label: "是什么",   html: `<p>打字输入<b>任意城市</b>（再写上「带 3 岁娃和腿脚不便的爸妈」这种特殊要求），AI 补全当地最值得去的去处，本地引擎把它们排成<b>懂行的逐时行程</b>——餐厅落饭点、寺庙/自然在白天、夜市/夜景在晚上，按片区分天、串成顺路，并一一画进地图。生成后还能就地 📌锁定 / ↻换一个 / ✕删除。</p>
        <p class="small" style="color:var(--ink-soft)">没连 AI 时，内置京都 / 里斯本 / 清迈 / 雷克雅未克 4 城可离线秒出。</p>` },
      { label: "程序逻辑", html: `<h3>城市 → AI 补点 → 本地懂行排程 → 行程 + 地图</h3>
        <div class="flow"><span class="step">输入城市 + 要求</span><span class="arr">→</span><span class="step">AI 补全 POI</span><span class="arr">→</span><span class="step">懂行排程</span><span class="arr">→</span><span class="step">逐时表 + 地图</span><span class="arr">→</span><span class="step">就地微调</span></div>
        <ul>
          <li><b>AI 只负责「找点」</b>：按城市与你的特殊要求，列出带类型 / 营业时段 / 片区 / 相对坐标的去处</li>
          <li><b>排程是本地引擎（可复现、不靠 AI）</b>：按时段亲和排饭点 / 白天 / 夜晚，避免「晚上逛寺庙」；把全部点串成顺路链再切成每天，每天天然是一个相邻片区</li>
          <li>每个行程项<b>在地图上有对应编号标点</b>，点条目 ⇄ 点图钉双向高亮；地图按天分段着色</li>
          <li>就地 <b>锁定 / 换一个 / 删除 / 换一批</b>，即时重排</li>
        </ul>
        <p style="margin-top:16px">分工清晰：AI 管「长尾知识」，本地引擎管「确定性的排程与渲染」，<b>地图为内置 inline SVG、零外部依赖</b>。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>预订佣金</b>：行程里的酒店 / 门票 / 交通直接挂预订，CPS 分成（OTA 模式）</li>
          <li><b>订阅</b>：高级规划、多人协作、离线行程</li>
          <li><b>目的地营销</b>：景区 / 文旅局付费曝光</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Mindtrip（mindtrip.ai）</b>：同名 AI 旅行规划平台，行程 + 交互地图一体，融资活跃，本 demo 复刻其核心体验。</li>
          <li><b>Layla / Wonderplan / Roam Around</b>：AI 行程生成器，导流预订变现。</li>
          <li><b>Booking / Expedia（美股 EXPE）</b>：OTA 巨头，证明把「规划→预订」转化成佣金是巨大生意。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：做攻略费时费力，攻略与地图割裂</li>
          <li><b>人群</b>：自由行、家庭游、深度游人群</li>
          <li><b>本地化</b>：把 AI 补的 POI 接上高德 / 大众点评的真实坐标 / 营业时间 / 评分与国内预订生态</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：AI 补的 POI 需与真实营业时效 / 可预订性核对；本 demo 的坐标为相对示意、地图为抽象底图</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 18 insure-need ───────────────────────── */
  {
    id: "insure-need", no: "18", cat: "保险",
    kicker: "保险科技 · 保额测算",
    title: "该买多少保",
    subtitle: "答几个生活问题，算出建议保额与险种；再把保额翻译成「一年大概多少钱、占你收入几成、钱不够先买哪个」",
    url: "demos/insure-need/", tags: ["需求法测算","保费预算体检","占收入%vs双十线","钱不够先买哪个","纯离线"],
    phoneHint: "填年龄 / 收入 / 家庭 / 负债，看保额 + 保费体检",
    sections: [
      { label: "是什么",   html: `<p>回答几个关于收入、家庭、负债的问题，用「需求法」算出该买多少保额、买哪类险；<b>更进一步</b>——别家只给保额（靠卖产品赚钱、不肯说成本），这里把保额翻译成<b>估算年保费、占你收入几成（对照「双十原则」健康线≤10%）、钱不够先买哪个</b>，还点破反常识真相「先保大人再保小孩」。</p>` },
      { label: "程序逻辑", html: `<h3>生活问题 → 测算缺口 → 险种 + 保费预算体检</h3>
        <div class="flow"><span class="step">答 6 个问题</span><span class="arr">→</span><span class="step">需求法算缺口</span><span class="arr">→</span><span class="step">险种优先级 + ¥/年</span><span class="arr">→</span><span class="step">占收入% + 先买哪个</span></div>
        <ul>
          <li>需求法：寿险缺口 = 收入替代 + 负债 + 子女教育 − 已有保额；重疾 ≈ 3~5 年收入，<b>随年龄/家庭/收入/负债实时变</b></li>
          <li><b>保费预算体检</b>：把保额按年龄估成年保费 → 占年收入百分比 vs「双十原则」健康线（保费≤收入 10%）→ 偏重就给「医疗意外先兜底→定寿杠杆最高→重疾最贵后补」的投保顺序</li>
          <li>有娃则点破「先保大人再保小孩」——你才是孩子最大的保单</li>
        </ul>
        <p style="margin-top:16px">保额/缺口本地确定性即时算（DIME 思路），<b>纯离线</b>；保费为粗略估算仅示意、<b>强免责</b>；连 key 才叠加 AI 个性化点评。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>投保佣金</b>：测完导向比价 / 投保，按保单分佣（Policygenius / Ladder 模式）</li>
          <li><b>线索分发</b>：高意向用户给保险公司 / 经纪</li>
          <li><b>B 端</b>：作为银行 / 平台的保险测算插件</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Policygenius</b>：在线保险测算 + 比价 + 投保，靠保单佣金盈利。</li>
          <li><b>Ladder / Ethos / Haven Life</b>：纯线上人寿，几分钟测额 + 出单，DTC 模式。</li>
          <li><b>Lemonade（美股 LMND）</b>：AI 驱动的保险公司，公开市场上市，证明保险科技可规模化。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：「我到底该买多少、买什么」普遍懵，怕被业务员忽悠</li>
          <li><b>人群</b>：成家立业、有房贷与子女责任的中青年</li>
          <li><b>本地化</b>：接国内重疾 / 寿险 / 医疗险产品与监管口径</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：涉保险需合规与精算，本 demo 仅作交互展示、非保险建议</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 19 matchmaker ───────────────────────── */
  {
    id: "matchmaker", no: "19", cat: "约会",
    kicker: "婚恋 · AI 红娘",
    title: "对话式精配",
    subtitle: "不给你一墙人，只给一个人 + 一段可追溯的「为什么是 TA」",
    url: "demos/matchmaker/", tags: ["唯一候选","可追溯理由","无兼容性分数","纯离线"],
    phoneHint: "答几个问题，看唯一推荐与理由",
    sections: [
      { label: "是什么",   html: `<p>不堆资料卡，只精配一个人，并讲清楚理由引用了你哪句回答。</p>` },
      { label: "程序逻辑", html: `<h3>答题 → 精配 → 唯一候选 + 理由</h3>
        <div class="flow"><span class="step">答几问</span><span class="arr">→</span><span class="step">精配</span><span class="arr">→</span><span class="step">唯一候选 + 理由</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li><b>只返回一个</b>候选，不给一墙人</li>
          <li>理由<b>引用你答案里的具体点</b>，可追溯</li>
          <li>刻意<b>不出现兼容性百分比分数</b>，避免把人量化成数字</li>
        </ul>
        <p style="margin-top:16px">本地匹配 + 理由生成，<b>零外部依赖、纯离线</b>。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>会员订阅</b>：高质量精配、看谁喜欢你（Hinge / CMB 模式）</li>
          <li><b>真人红娘增值</b>：AI 初配 + 人工深配的高客单服务（Tawkify 模式）</li>
          <li><b>线下活动</b>：精配人群的相亲 / 社交活动</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Hinge（Match Group）</b>：主打「为被删除而设计」，每天少量精选 + 给出共同点，付费会员模式。</li>
          <li><b>Coffee Meets Bagel</b>：每天限量推荐、质量优先，订阅盈利。</li>
          <li><b>Tawkify</b>：真人红娘付费服务，一次只引荐一位、附匹配理由 —— 证明「精配 + 理由」愿意被高价买单。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：滑卡疲劳、海量低质匹配、不知道「为什么是 TA」</li>
          <li><b>人群</b>：认真找对象、厌倦快餐式约会的人群</li>
          <li><b>本地化</b>：接国内婚恋实名与线下相亲场景</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：婚恋涉真实关系与安全，需严格审核；本 demo 用虚拟候选演示</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 20 pet-health ───────────────────────── */
  {
    id: "pet-health", no: "20", cat: "宠物",
    kicker: "宠物医疗 · 拍照自检",
    title: "宠物拍照自检",
    subtitle: "拍眼睛 / 皮肤，给健康分 + 观察项 + 是否就医",
    url: "demos/pet-health/", tags: ["拍照分析","健康分","观察项","纯离线"],
    phoneHint: "拍/选宠物照片，看健康分与观察建议",
    sections: [
      { label: "是什么",   html: `<p>给猫狗的眼睛 / 皮肤拍张照，得到一个健康分、几条观察项、要不要去医院。</p>` },
      { label: "程序逻辑", html: `<h3>拍照 → 分析 → 健康报告</h3>
        <div class="flow"><span class="step">拍/选照片</span><span class="arr">→</span><span class="step">分析</span><span class="arr">→</span><span class="step">健康分 + 观察项 + 是否就医</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>全链路：拍照 → 分析 → 报告</li>
          <li>给健康分 + 观察项 + 就医建议</li>
          <li>含「非诊断」声明</li>
        </ul>
        <p style="margin-top:16px">本地图像启发式 + 规则报告，<b>零外部依赖、纯离线</b>。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>订阅</b>：定期自检、健康档案、异常提醒（TTcare 模式）</li>
          <li><b>导诊分成</b>：异常导向线上 / 线下宠物医院</li>
          <li><b>带货</b>：按问题推荐宠粮 / 护理 / 保健品</li>
          <li><b>保险</b>：与宠物保险联动核保 / 理赔</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>TTcare（韩国）</b>：手机拍宠物眼睛 / 皮肤做 AI 健康检测，已商业化、获多国上市与奖项。</li>
          <li><b>Petriage</b>：宠物症状评估 + 分诊，与诊所合作的订阅服务。</li>
          <li><b>Dinbeat / Scout 等</b>：宠物健康监测设备 + 数据服务。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：宠物不会说话、看病贵，主人焦虑且缺早筛手段</li>
          <li><b>人群</b>：养猫养狗的年轻主人，情感投入高</li>
          <li><b>本地化</b>：接国内宠物医院与宠物电商生态</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：宠物医疗判断需兽医，本 demo 仅作交互展示、非诊断</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 21 pet-vet ───────────────────────── */
  {
    id: "pet-vet", no: "21", cat: "宠物",
    kicker: "宠物医疗 · 兽医病历 Scribe",
    title: "AI 兽医病历助手",
    subtitle: "贴一段问诊速记 → SOAP 病历 + 鉴别诊断 + 给主人的出院医嘱 + 费用预估，把文书时间还给看诊",
    url: "demos/pet-vet/", tags: ["问诊→病历","SOAP/鉴别诊断","出院医嘱+费用","示例离线兜底","连 key 真模型"],
    phoneHint: "点一个示例病例或贴速记 → 生成全套文书",
    sections: [
      { label: "是什么",   html: `<p>兽医最恨写病历——一天 2~3 小时耗在文书上。这是给<b>执业兽医</b>的「<b>AI Scribe</b>」：把一段口语问诊速记，30 秒整理成一摞规范文书。<b>AI 起草、兽医复核</b>，不替代临床判断。</p>` },
      { label: "程序逻辑", html: `<h3>一段速记 → 四件套文书</h3>
        <div class="flow"><span class="step">问诊速记</span><span class="arr">→</span><span class="step">SOAP 病历</span><span class="arr">→</span><span class="step">鉴别诊断排序</span><span class="arr">→</span><span class="step">出院医嘱</span><span class="arr">→</span><span class="step">费用预估</span></div>
        <ul>
          <li><b>SOAP</b>：主诉病史 / 客观检查 / 评估 / 计划，严格区分客观与推断</li>
          <li><b>鉴别诊断</b>：按可能性（高/中/低）排序 + 支持依据 + 推荐检查，仅提示供兽医判断</li>
          <li><b>出院医嘱</b>：把术语翻成给主人的大白话（护理 / 用药 / 复诊 / 回诊红线）</li>
          <li><b>费用预估</b>：按推荐检查列出区间合计，每段都可一键复制进院内系统</li>
        </ul>
        <p style="margin-top:16px">4 个示例病例<b>纯离线</b>即出完整文书（兜底 + 演示）；任意速记连 BYOK 后由真实模型生成同结构。用药只给类别/原则不写精确剂量，强免责。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>按兽医 / 诊所订阅（SaaS）</b>：每天省下 2~3 小时文书，直接换算成多看的诊次——付费意愿极强</li>
          <li><b>嵌入诊所管理系统（PIMS）</b>：病历 / 医嘱 / 估价单一键回填，按席位收费</li>
          <li><b>增值</b>：客户沟通话术、随访提醒、保险理赔材料自动生成</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Scribenote / Talkatoo / ScribbleVet</b>：兽医专用 AI 病历 Scribe，按月订阅，正是当下兽医圈的爆款赛道。</li>
          <li><b>人医已验证</b>：Abridge、Nuance DAX 等环境式 AI 病历在医生端已规模化收费——兽医端是同一痛点的平移。</li>
          <li><b>痛点真实</b>：文书负担是兽医 burnout 头号来源，写病历直接挤占看诊与营收。</li>
        </ul>
        <ul>
          <li><b>人群</b>：中小宠物医院、连锁诊所、独立执业兽医</li>
          <li><b>本地化</b>：对接国内宠物医院 HIS、中文病历规范与常见病种库</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：诊疗须持证兽医负责，本工具仅出<b>草稿</b>供复核；本 demo 为交互展示、非诊断</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 22 coddle ───────────────────────── */
  {
    id: "coddle", no: "22", cat: "母婴",
    kicker: "母婴 · 育儿指引",
    title: "按月龄育儿指引",
    subtitle: "随口记一条，按宝宝月龄给出个性化指引 —— 同一条记录，不同月龄不同建议",
    url: "demos/coddle/", tags: ["月龄自适应","个性化指引","随手记录","纯离线"],
    phoneHint: "记一条 + 选月龄，看对应指引",
    sections: [
      { label: "是什么",   html: `<p>把「今天宝宝怎么了」随手记下，它按当前月龄给针对性建议。</p>` },
      { label: "程序逻辑", html: `<h3>记录 + 月龄 → 匹配 → 个性化指引</h3>
        <div class="flow"><span class="step">记一条 + 选月龄</span><span class="arr">→</span><span class="step">匹配月龄规则</span><span class="arr">→</span><span class="step">个性化指引</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>同一条记录，<b>在不同月龄给出不同指引</b>（如「夜醒」在 3 月 vs 9 月建议不同）</li>
          <li>按月龄发育里程碑匹配建议</li>
        </ul>
        <p style="margin-top:16px">本地月龄规则库匹配，<b>零外部依赖、纯离线</b>。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>订阅</b>：成长记录 + 个性化指引 + 里程碑提醒（Huckleberry / Wonder Weeks 模式）</li>
          <li><b>母婴电商</b>：按月龄推荐用品 / 辅食 / 玩具</li>
          <li><b>内容 / 课程</b>：阶段性育儿课与专家问答</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Huckleberry</b>：婴儿睡眠 / 作息记录 + AI 个性化指引，订阅制、广受欢迎。</li>
          <li><b>The Wonder Weeks</b>：按月龄解读宝宝发育跃进的付费 App，全球畅销。</li>
          <li><b>BabyCenter</b>：按周 / 按月推送育儿内容的超大母婴平台，广告 + 电商变现。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：育儿信息海量但不分阶段，家长无所适从</li>
          <li><b>人群</b>：0–3 岁宝宝的父母</li>
          <li><b>本地化</b>：接国内育儿规范与母婴电商</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：育儿建议需专业把关，本 demo 仅作交互展示、非医疗建议</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 23 mood-journal ───────────────────────── */
  {
    id: "mood-journal", no: "23", cat: "心理",
    kicker: "心理健康 · 情绪记录",
    title: "心情日记",
    subtitle: "写下心情，多条记录汇成情绪曲线 + 触发词云",
    url: "demos/mood-journal/", tags: ["情绪曲线","触发词云","趋势洞察","纯离线"],
    phoneHint: "写几条心情记录，看曲线与词云",
    sections: [
      { label: "是什么",   html: `<p>随手记心情，攒几条就画出你的情绪曲线和高频触发词。</p>` },
      { label: "程序逻辑", html: `<h3>记录 → 汇总 → 曲线 + 词云</h3>
        <div class="flow"><span class="step">写多条心情</span><span class="arr">→</span><span class="step">分析</span><span class="arr">→</span><span class="step">情绪曲线 + 触发词云</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>多条记录按时间汇成<b>情绪曲线</b></li>
          <li>从文字里抽高频词做<b>触发词云</b></li>
          <li>记录越多，趋势与触发越清晰</li>
        </ul>
        <p style="margin-top:16px">本地情感打分 + 词频统计，<b>零外部依赖、纯离线</b>；带「非心理诊断」声明。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>订阅</b>：长期趋势、提醒、导出、深度洞察（Daylio / Reflectly 模式）</li>
          <li><b>数字疗法 / B 端</b>：接入 AI 对话疏导、EAP 与保险（Wysa / Woebot 模式）</li>
          <li><b>内容</b>：冥想 / 情绪管理课</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Daylio</b>：极简心情 + 习惯记录，生成情绪趋势图，订阅制、用户数千万。</li>
          <li><b>How We Feel / Reflectly</b>：情绪日记 App，做趋势与洞察，订阅盈利。</li>
          <li><b>Wysa / Woebot</b>：把情绪追踪 + AI 对话做成数字心理健康，并切入 B 端 / 保险。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：情绪起伏说不清、想了解自己却没工具</li>
          <li><b>人群</b>：关注心理健康、自我觉察的年轻人</li>
          <li><b>本地化</b>：接国内心理健康内容与隐私合规</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：涉心理健康需谨慎，本 demo 仅作交互展示、非心理诊断或治疗</li>
        </ul>` }
    ]
  },

  /* ───────────────────────────── Project 24 ───────────────────────────── */
  {
    id: "dinner", no: "24", cat: "餐饮",
    kicker: "餐饮 · AIGC / 非结构化抽取",
    title: "今天吃什么",
    subtitle: "粘贴一段美食帖 → AI 现场把它变成一份今晚能照做的图文菜谱",
    url: "demos/dinner/",
    tags: ["非结构化→结构化", "严格 JSON 契约", "边界不崩兜底", "纯前端 SVG 图解", "一键分享卡"],
    phoneHint: "点示例 chip 或贴一段帖子直接跑（需连接 AI 引擎）",
    sections: [
      {
        label: "是什么",
        html: `<p>把刷到的<b>一段美食帖</b>（探店、brunch、家常菜、深夜放毒……）当场变成
          <b>一份能照着做的菜谱</b>：粘贴或点选一段真实帖子文案，AI 从<b>这段具体内容</b>里抽出菜品意图，
          生成结构化字段，前端渲染成图文并茂、份量火候清楚的菜谱。核心卖点是
          「<b>任意非结构化输入 → 可靠、边界不崩的结构化成品</b>」——这套能力换个领域就是简历、票据、合同的解析。</p>`
      },
      {
        label: "程序逻辑",
        html: `<h3>一段口语化文案 → 严格结构化菜谱</h3>
          <div class="flow">
            <span class="step">粘贴 / 点选帖子</span><span class="arr">→</span>
            <span class="step">LLM 抽取菜品意图</span><span class="arr">→</span>
            <span class="step">严格 JSON 契约</span><span class="arr">→</span>
            <span class="step">前端 SVG 图文渲染</span><span class="arr">→</span>
            <span class="step">一键分享卡</span>
          </div>
          <p style="margin-top:14px">两条工程死线（验收下限，必须真在工作、不是 fake output）：</p>
          <ul>
            <li><b>内容真跟着帖子变</b>：换两段不同的帖子，产出的菜谱必须明显不同、且确实源自各自内容——不是从固定列表抽一道糊弄。</li>
            <li><b>边界不崩</b>：贴一段根本不是食物的内容，优雅兜底「这条看起来不是吃的」并给示例入口，绝不硬编一道菜。</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            解耦设计：<b>LLM 只负责「内容真实跟着帖子变」</b>（强制只返回严格 JSON、前端安全解析并对失败兜底），
            <b>前端只负责「长得不丑」</b>——食材 emoji、8 类步骤图标、构图化盘子主视觉全用纯 SVG/CSS，不用真实照片、不假装图像生成。
            还有 4 个一键示例 chip 解决零冷启动。</p>`
      },
      {
        label: "商业模式",
        html: `<ul>
            <li><b>导购抽成（最肥）</b>：菜谱 → 一键生成购物清单 → 跳生鲜电商 / 即时零售下单，按 GMV 抽佣</li>
            <li><b>订阅</b>：收藏夹、营养换算、批量周计划、去广告（菜谱 App 通行的付费墙）</li>
            <li><b>品牌 / 调味料植入</b>：步骤里的产品位、品牌定制菜谱（原生广告，不打断体验）</li>
            <li><b>可转发性即增长</b>：每张分享卡都带「用户那一份」+ 克制水印 CTA，输出自带获客</li>
          </ul>`
      },
      {
        label: "市场分析",
        html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
          <ul>
            <li><b>Samsung Food（前 Whisk，三星 005930.KS）</b>：把任意网页/社媒里的菜谱一键导入成结构化菜谱并自动生成购物清单——和「非结构化 → 结构化」几乎是同一招。</li>
            <li><b>Cookpad（东证 2193）</b>：全球最大菜谱社区之一，订阅制盈利、已上市。</li>
            <li><b>HelloFresh（ETR:HFG）</b>：菜谱 → 食材配送，规模化盈利，验证「照着做」需求的商业价值。</li>
            <li><b>Instacart（NASDAQ:CART）</b>：菜谱 → 一键加购 → 即时配送，跑通了导购抽成闭环。</li>
          </ul>
          <ul>
            <li><b>痛点</b>：刷到馋的帖子，真要做却没头绪——食材、步骤、份量散落在一段口语化文案里，截图存着再没打开</li>
            <li><b>人群</b>：爱刷美食内容、想自己下厨的年轻人与厨房新手</li>
            <li><b>本地化</b>：贴合小红书 / 抖音文案口吻，微信内可打开转发，中式食材与火候词汇</li>
            <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：内容真实性依赖 LLM，需做兜底与抽检；公开链接须走后端代理（服务端持 key + 限流 + 每日花费上限）防滥用与控成本</li>
          </ul>`
      }
    ]
  },

  /* ───────────────────────────── Project 25 ───────────────────────────── */
  {
    id: "unmask", no: "25", cat: "游戏",
    kicker: "游戏 · 隐私博弈 / 行为建模",
    title: "不被看穿",
    subtitle: "剪刀石头布，但对手是一个实时给你建模的 AI——出手前它就把「它眼中的你」摆出来、封盘下注，被猜中是你输",
    url: "demos/unmask/",
    tags: ["反建模博弈", "出手前亮实时画像", "封盘下注后揭概率", "AI 读心师侧写", "强裂变战报"],
    phoneHint: "建议手机 / 微信打开，连续出手别让它猜中",
    sections: [
      {
        label: "是什么",
        html: `<p>把整套"被了解"的前提<b>反过来玩</b>：你和一个实时给你建模的 AI 玩剪刀石头布，
          它每一手都先押注你会出什么、再出克制你的手。<b>被它命中 = 你输。</b>
          屏幕顶部一根「<b>可预测度</b>」仪表实时显示它把你看穿了几成；你的唯一目标是保持不可预测、撑过它的预测。
          对"隐私焦虑"的人极有共鸣——你终于能跟那个想懂你的系统正面博弈一场，
          而它会让你发现：<b>原来我这么有规律。</b></p>`
      },
      {
        label: "程序逻辑",
        html: `<h3>把"采集"本身变成对抗机制——张力即玩法</h3>
          <div class="flow">
            <span class="step">看「它眼中的你」</span><span class="arr">→</span>
            <span class="step">AI 🔒 封盘下注</span><span class="arr">→</span>
            <span class="step">你出手</span><span class="arr">→</span>
            <span class="step">揭示它赌你出什么</span><span class="arr">→</span>
            <span class="step">复盘 + 读心师侧写</span>
          </div>
          <p style="margin-top:14px">核心是一个<b>真实的自适应预测器（不是大模型，是一套在线学习的算法）</b>：
          频率偏好、一阶/二阶马尔可夫连招、"急着扳回上一局"、连续重复——5 个预测器并行，
          按各自<b>近期命中率动态加权、自动切换</b>最准的那个来押你。</p>
          <ul>
            <li>它出的手克制你 = <b>被看穿</b>；你克制它 = 骗过它；同手 = 平。</li>
            <li><b>出手前先演给你看</b>：「它眼中的你」实时画像（偏手 / 连招 / 输了就改）+ 它现在最信哪条线 + 🔒 封盘下注；你出手后才揭晓它<b>赌你出什么的概率分布</b>（看得见它懂你，却没法白嫖）。</li>
            <li><b>可预测度 = 被看穿率</b>，<b>33% 是真随机基线</b>；越高说明它越摸透你。它高把握下你还能骗过 = 破防高光。</li>
            <li>终局复盘 + <b>读心师侧写</b>：把偏手、下意识连招、被看穿后的反应写成一段第二人称侧写（连 key 由真实模型重写，没 key 走本地兜底）。</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            母题是反讽式的——你越想藏，越暴露自己的模式；不需要任何事后合规话术，对抗本身就是玩法。纯前端、无需后端。</p>`
      },
      {
        label: "商业模式",
        html: `<ul>
            <li><b>裂变即增长</b>：每局产出一张"可预测度 %"战报，晒"我只被看穿 31%"天然想转发——可转发性是命门</li>
            <li><b>微信小游戏</b>：轻量、即点即玩、社交场景原生，开发成本低、传播性强</li>
            <li><b>留存层</b>：排行榜（谁最不可预测）、好友对战、赛季/段位、AI 难度档</li>
            <li><b>飞轮</b>：玩家为了赢会暴露大量<b>真实决策模式</b>，这本身就是另一种高质量行为画像（与推荐/风控同源能力）</li>
          </ul>`
      },
      {
        label: "市场分析",
        html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
          <ul>
            <li><b>腾讯 微信小游戏（00700.HK）</b>：「跳一跳」等病毒级小游戏验证了"轻量 + 社交裂变"在微信里的爆发力。</li>
            <li><b>Akinator（Elokence）</b>：「我能猜中你想的人」靠纯猜心玩法做成全球病毒级产品，广告 / 内购变现。</li>
            <li><b>AppLovin（NASDAQ:APP）</b>：休闲游戏 + 广告变现规模化盈利，印证轻量玩法的商业天花板。</li>
            <li><b>Voodoo</b>：超休闲游戏发行王者，专吃"一句话讲清、十秒上手、强分享"的玩法。</li>
          </ul>
          <ul>
            <li><b>痛点</b>：人人都被算法建模、被预测，却无处发力——这游戏给"反向博弈"一个情绪出口</li>
            <li><b>人群</b>：关注隐私、爱心理博弈的年轻人；微信里随手转发的泛用户</li>
            <li><b>本地化</b>：微信小程序原生场景，开发简单、强裂变（晒战报）；中文交互、即点即玩</li>
            <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：单局体验短，留存要靠排行榜 / 对战 / 赛季补足；玩法新颖但需快速验证次留与分享率</li>
          </ul>`
      }
    ]
  },

  /* ═══════════ 出海 / 外贸 · AI 时代特有的跨境商业模式（价值链：选品 → 定价 → 上架 → 成交）═══════════ */

  /* ───────────────────────── 26 niche（选品）───────────────────────── */
  {
    id: "niche", no: "26", cat: "跨境电商",
    kicker: "出海选品 · 蓝海雷达",
    title: "蓝海选品雷达",
    subtitle: "给一个品类方向 → AI 综合海外需求趋势与差评缺口，扫出还没杀红的细分蓝海",
    url: "demos/niche/",
    tags: ["趋势+差评缺口","机会分排序","需求/竞争烈度","切入角度+风险","需连接 AI"],
    phoneHint: "选目标市场 + 输入一个大类（点示例直接扫，连接 AI 体验最佳）",
    sections: [
      {
        label: "是什么",
        html: `<p>选品是出海的胜负手。给一个大类方向（如「宠物用品」「露营户外」），
          AI 把<b>海外需求趋势</b>和<b>差评里反复出现的抱怨</b>综合起来，
          帮你圈出被现有卖家忽视的<b>细分蓝海</b>：每个机会给机会分、需求与竞争烈度、用户到底在抱怨什么、你该怎么切、有哪些坑。
          把「凭感觉跟卖」变成「照着缺口做差异化」。</p>`
      },
      {
        label: "程序逻辑",
        html: `<h3>大类 → 综合信号 → 细分蓝海清单</h3>
          <div class="flow">
            <span class="step">输入品类 + 市场</span><span class="arr">→</span>
            <span class="step">对照需求趋势</span><span class="arr">→</span>
            <span class="step">翻差评找缺口</span><span class="arr">→</span>
            <span class="step">机会分排序 + 切入角度</span>
          </div>
          <ul>
            <li>每个细分给<b>机会分 + 需求强度 + 竞争烈度（蓝海/中等/红海）</b>，三者自洽</li>
            <li>「用户缺口」要像来自真实差评（太吵、尺寸不合、续航虚标…），不是泛泛而谈</li>
            <li>每条配<b>信号来源 + 差异化切入 + 风险</b>，最后给「先打哪个」的结论</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            引擎为 live LLM，强制严格 JSON、前端规整兜底；输入不是品类则礼貌拒绝，不硬编。</p>`
      },
      {
        label: "商业模式",
        html: `<ul>
            <li><b>SaaS 订阅</b>：选品工具按月/席位收费，跨境卖家的刚需高频工具</li>
            <li><b>数据报告</b>：细分赛道深度报告、趋势榜单付费</li>
            <li><b>C2M 反向定制</b>：把验证过的蓝海需求对接工厂，按成交分佣</li>
            <li><b>数据飞轮</b>：哪些蓝海真的跑出来 → 反哺机会评分越来越准</li>
          </ul>`
      },
      {
        label: "市场分析",
        html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
          <ul>
            <li><b>Jungle Scout / Helium 10 / AMZScout</b>：亚马逊选品与市场分析工具，订阅制盈利、卖家几乎人手一个。</li>
            <li><b>卖家精灵 / 船长 BI / Sorftime</b>：国内跨境选品 SaaS，已验证「选品工具」在中国卖家里的付费意愿。</li>
            <li><b>Exploding Topics / Glimpse</b>：趋势发现订阅工具，证明「提前发现需求」本身值钱。</li>
          </ul>
          <ul>
            <li><b>AI 时代特有</b>：以前靠人工扒销量榜 + 逐条读差评找缺口，慢且零散；现在 AI 把趋势信号与评论缺口<b>一次综合成蓝海清单</b></li>
            <li><b>痛点</b>：90% 卖家死在选品——要么跟卖红海打价格战，要么拍脑袋押错</li>
            <li><b>人群</b>：亚马逊/独立站/Temu 半托管卖家、想做品牌出海的工厂</li>
            <li><b>本地化</b>：接 1688 货源、各平台真实评论与销量数据可大幅提升准度</li>
            <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：评分准度依赖真实评论/销量数据接入；本 demo 为启发式演示，不构成选品决策依据</li>
          </ul>`
      }
    ]
  },

  /* ───────────────────────── 27 landed（定价 / 选市场）───────────────────────── */
  {
    id: "landed", no: "27", cat: "跨境电商",
    kicker: "出海定价 · 到岸价测算",
    title: "到岸价 & 利润对比",
    subtitle: "输入出厂成本 → AI 估各国到岸价（关税/VAT/平台佣金/物流）+ 毛利率，一眼看出先打哪国",
    url: "demos/landed/",
    tags: ["多国到岸价","成本瀑布条","毛利率对比","先打哪个市场","需连接 AI"],
    phoneHint: "填成本+重量、选市场（点示例直接算，连接 AI 体验最佳）",
    sections: [
      {
        label: "是什么",
        html: `<p>同一个产品，卖到不同国家的真实利润可能天差地别——关税、增值税、平台佣金、头程物流各不相同。
          填上<b>出厂成本和重量</b>、选几个目标市场，AI 估算每个国家的<b>到岸总成本、建议零售价和毛利率</b>，
          用一根成本瀑布条把钱花在哪看得清清楚楚，直接告诉你<b>先打哪个市场最划算</b>。
          把「闷头铺货」变成「先算账再下场」。</p>`
      },
      {
        label: "程序逻辑",
        html: `<h3>成本 + 市场 → 到岸价拆解 → 利润对比</h3>
          <div class="flow">
            <span class="step">填成本/重量</span><span class="arr">→</span>
            <span class="step">查各国税率费率</span><span class="arr">→</span>
            <span class="step">加物流+佣金</span><span class="arr">→</span>
            <span class="step">毛利率对比 + 结论</span>
          </div>
          <ul>
            <li>每个市场拆出<b>关税% / VAT% / 平台佣金% / 物流</b>，算出到岸成本与建议零售</li>
            <li><b>成本瀑布条</b>：出厂/物流/关税/税/佣金/毛利各占多少一目了然</li>
            <li>自动标出<b>毛利率最高</b>的市场为「★ 最划算」，并给综合选市场建议</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            引擎为 live LLM，给出符合常识的税率估计并保证各金额自洽；结果区标注「税率为估算、仅供参考」。</p>`
      },
      {
        label: "商业模式",
        html: `<ul>
            <li><b>SaaS 定价工具</b>：到岸价/利润测算订阅，跨境卖家选市场必备</li>
            <li><b>物流 & 清关导流</b>：算完一键比价头程/尾程、报关，按单分佣</li>
            <li><b>VAT / 合规代办转介</b>：欧盟 VAT 注册、各国合规对接，转介佣金</li>
            <li><b>API 输出</b>：把到岸价能力做成 API，嵌进 ERP / 独立站后台</li>
          </ul>`
      },
      {
        label: "市场分析",
        html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
          <ul>
            <li><b>Zonos</b>：专做跨境「到岸价（landed cost）」与关税预估的 API/SaaS，是这条赛道的代表。</li>
            <li><b>Avalara（原 NYSE:AVLR，被 Vista 私有化）</b>：税务合规自动化巨头，验证「自动算税」是大生意。</li>
            <li><b>Easyship / Flexport / FlavorCloud</b>：跨境物流报价与清关平台，靠物流履约与佣金盈利。</li>
          </ul>
          <ul>
            <li><b>AI 时代特有</b>：以前要查目的国 HS 编码税率、逐项人工算到岸价；现在<b>一句话出多国利润对比</b>，把「选市场」从经验活变成秒级决策</li>
            <li><b>痛点</b>：很多卖家定价拍脑袋，等回款才发现某个市场根本不赚钱</li>
            <li><b>人群</b>：多平台/多国铺货的卖家、要决定「先打哪国」的品牌出海团队</li>
            <li><b>本地化</b>：接实时汇率、各国最新税率与平台费率、真实物流报价可做成生产级</li>
            <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：税率/费率为 AI 估算，实务以海关与平台规则为准；精确测算需接权威税率库</li>
          </ul>`
      }
    ]
  },

  /* ───────────────────────── 28 loka（上架本地化 · 精选）───────────────────────── */
  {
    id: "loka", no: "28", cat: "跨境电商", featured: true,
    kicker: "出海上架 · 本地化引擎",
    title: "出海本地化引擎",
    subtitle: "一段中文产品描述 → 为每个国家各生成「像本地人写的」listing + 文化适配 + 合规提示",
    url: "demos/loka/",
    tags: ["多市场原生 listing","母语标题+卖点+关键词","文化适配角度","合规+本地化坑","需连接 AI"],
    phoneHint: "选目标市场 + 贴产品描述（点示例直接跑，连接 AI 体验最佳）",
    sections: [
      {
        label: "是什么",
        html: `<p>出海最贵的从来不是翻译，是<b>本地化</b>——美国买家吃生活方式、德国买家要参数与合规、日本买家重细节与安心感。
          贴一段中文产品描述、选几个目标市场，AI 为每个国家各写一版<b>「像本地人写的」listing</b>：
          母语标题、当地买家真正吃的卖点角度、真实搜索关键词，还顺手提醒你<b>要过哪些认证、会踩哪些本地化的坑</b>（单位、尺码、小数写法、颜色忌讳）。
          一件商品，原生上架每个国家。</p>`
      },
      {
        label: "程序逻辑",
        html: `<h3>一段中文 → 多国原生 listing</h3>
          <div class="flow">
            <span class="step">贴产品 + 选市场</span><span class="arr">→</span>
            <span class="step">切到各国买家视角</span><span class="arr">→</span>
            <span class="step">母语改写标题/卖点</span><span class="arr">→</span>
            <span class="step">合规 + 本地化坑</span>
          </div>
          <ul>
            <li>每个市场一张卡：<b>主打角度（中文说明）+ 母语标题（带中文回译）+ 3 条母语卖点 + 母语关键词</b></li>
            <li>同一产品，<b>美/德/日的标题与角度明显不同</b>——体现真实文化与平台差异，不是中式直译</li>
            <li>每张卡附<b>该品类的合规要点</b>（FCC/CE/PSE/LFGB…）和一个最容易踩的<b>本地化坑</b></li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            引擎为 live LLM，强制严格 JSON、按所选市场同序返回、前端规整兜底；非实物商品则礼貌拒绝。</p>`
      },
      {
        label: "商业模式",
        html: `<ul>
            <li><b>SaaS 订阅</b>：按 SKU × 市场数计费，工厂/卖家把整套海外文案外包给 AI</li>
            <li><b>一键铺货 + 成交分佣</b>：生成即接各平台上架，按 GMV 抽佣</li>
            <li><b>增值</b>：A/B 多版本标题、关键词广告投放、合规认证代办转介</li>
            <li><b>数据飞轮</b>：哪种角度在哪个市场转化高 → 反哺生成，越用越懂当地</li>
          </ul>`
      },
      {
        label: "市场分析",
        html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
          <ul>
            <li><b>Weglot / Smartling / Lokalise</b>：本地化（不止翻译）SaaS，服务大量出海企业，订阅制规模化盈利。</li>
            <li><b>Shopify Markets（NASDAQ/NYSE:SHOP）</b>：内置多市场本地化与 Translate & Adapt，把「一店卖全球」做成平台能力。</li>
            <li><b>Helium 10 / Intentwise</b>：Amazon listing 与关键词优化工具，验证「listing 优化」是卖家持续付费项。</li>
          </ul>
          <ul>
            <li><b>AI 时代特有</b>：以前要为每个市场养母语文案/本地化团队，成本高到只有大品牌玩得起；AI 把边际成本打到趋零，<b>长尾中小工厂也能精品出海</b></li>
            <li><b>痛点</b>：机翻 listing 一眼假、转化低、还容易因合规/文化忌讳被下架或差评</li>
            <li><b>人群</b>：亚马逊/独立站/TikTok Shop 卖家、想做品牌的外贸工厂</li>
            <li><b>本地化</b>：可接各平台标题规则、当地关键词热度、合规库，做成生产级一键上架</li>
            <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：母语文案仍需当地人抽检把关；合规信息须以目的国官方为准；公开链接应走后端代理控成本与防滥用</li>
          </ul>`
      }
    ]
  },

  /* ───────────────────────── 29 sonar（询盘成交）───────────────────────── */
  {
    id: "sonar", no: "29", cat: "外贸",
    kicker: "外贸成交 · 询盘操盘",
    title: "外贸询盘操盘手",
    subtitle: "贴一封外国买家询盘 → AI 判真伪意图 + 砍价空间 + 用买家语言起草回复 + 报价策略",
    url: "demos/sonar/",
    tags: ["买家成色评分","真伪/诈骗识别","隐藏需求洞察","母语回复草稿","需连接 AI"],
    phoneHint: "把询盘原文贴进去（点示例直接跑，连接 AI 体验最佳）",
    sections: [
      {
        label: "是什么",
        html: `<p>外贸业务员每天被询盘淹没，真买家、贸易商、随便问问、同行套价、诈骗混在一起。
          把买家发来的询盘贴进去，AI 先给<b>意向分</b>和<b>买家类型</b>，列出正向信号与风险信号，
          点破他<b>没明说但最在意的点</b>（交期？认证？账期？）和<b>砍价空间</b>，
          再用<b>买家的语言</b>起草一封专业回复，并解释这封信的报价策略和钩子。
          让中小外贸厂也有「金牌业务员」级别的首轮响应。</p>`
      },
      {
        label: "程序逻辑",
        html: `<h3>一封询盘 → 成色判断 → 回复 + 策略</h3>
          <div class="flow">
            <span class="step">贴询盘</span><span class="arr">→</span>
            <span class="step">评分 + 风险信号</span><span class="arr">→</span>
            <span class="step">推断隐藏需求</span><span class="arr">→</span>
            <span class="step">母语回复 + 报价策略</span>
          </div>
          <ul>
            <li><b>意向分环</b> + 5 类买家标签（真实进口商/贸易商/随便问问/同行套价/疑似诈骗），与信号自洽</li>
            <li>风险信号<b>点名具体证据</b>：如「要工厂地址但无公司信息」「催打款只给 WhatsApp」</li>
            <li>对诈骗/套价，回复策略是<b>先要资质细节再报价</b>，绝不直接甩完整价目表和工厂地址</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            引擎为 live LLM，强制严格 JSON、前端规整兜底；reply_draft 用买家语言、针对这封询盘具体内容，非通用模板。</p>`
      },
      {
        label: "商业模式",
        html: `<ul>
            <li><b>SaaS 订阅</b>：按业务员席位收费，询盘自动分级 + 一键起草回复</li>
            <li><b>按成交分佣</b>：高意向询盘优先跟进，跑通转化后抽成</li>
            <li><b>B 端集成</b>：做成阿里国际站 / 外贸 CRM / 邮箱的插件，嵌进现有工作流</li>
            <li><b>数据飞轮</b>：哪类询盘真成交 → 反哺评分模型与话术，越用越准</li>
          </ul>`
      },
      {
        label: "市场分析",
        html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
          <ul>
            <li><b>阿里巴巴国际站（NYSE:BABA / 09988.HK）</b>：已上线 AI 生意助手帮外贸商写开发信、答询盘，验证「AI 替业务员」的真实需求。</li>
            <li><b>OKKI（小满科技）/ 孚盟 / 询盘云</b>：外贸 CRM/SCRM，把询盘管理与跟进做成订阅制生意。</li>
            <li><b>Apollo.io / Lusha / Clay</b>：B2B 线索情报与打分，证明「给线索评级」是规模化付费项。</li>
          </ul>
          <ul>
            <li><b>AI 时代特有</b>：以前判断买家成色、识破套价/诈骗、写多语种回复，全靠资深双语业务员的经验；现在 AI<b>7×24 多语种操盘</b>，把金牌业务员的判断力复制给每个小厂</li>
            <li><b>痛点</b>：询盘真假难辨、回复慢错失商机、新手业务员容易被同行套走底价</li>
            <li><b>人群</b>：中小外贸工厂、SOHO、阿里国际站/展会获客的外贸团队</li>
            <li><b>本地化</b>：接邮箱/国际站询盘流、企业资信查询、汇率与报价库可做成生产级</li>
            <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：买家真伪最终需结合资信核验；回复仍应由业务员把关后发出；公开使用应走后端代理保护 Key 与控成本</li>
          </ul>`
      }
    ]
  },

  /* ───────────────────────── 30 ping（留学生身份合规 · 人出海）───────────────────────── */
  {
    id: "ping", no: "30", cat: "留学",
    kicker: "留学服务 · 身份合规导航",
    title: "PING 留学生身份合规导航",
    subtitle: "一句话描述身份 → 个性化合规路线图（标权威出处+错过后果）+ 2026 政策风险雷达 + 家长「安心卡」",
    url: "demos/ping/",
    tags: ["自然语言输入","状态机路线图","权威出处可验证","家长安心卡可导出","需连接 AI"],
    phoneHint: "点示例 profile 或一句话描述（连接 AI 体验最佳；未连接走内置规则引擎也不白屏）",
    sections: [
      {
        label: "是什么",
        html: `<p>留学生的身份合规——F-1 在读 → OPT 申请 → OPT 在用 → STEM 延期 → H-1B 衔接——
          散落在一堆吓人的官方页面里，错一步可能丢身份。PING 不是产品，是一个<b>「交付保证」演示</b>：
          学生用<b>一句话</b>描述情况，立刻得到一张<b>个性化路线图</b>（每条都标权威出处 + 「错过的后果」）、
          一块 2026 政策风险雷达，再一键生成给家长的<b>「安心卡」</b>（绿/黄/红 + 一句话 + 下一节点）。
          它证明的不是「AI 能答移民问题」，而是<b>把判断负担从学生身上卸下来</b>——
          工具替他把散落的权威信息收敛成可决策结论，并附出处让他能验证。</p>`
      },
      {
        label: "程序逻辑",
        html: `<h3>一句话 → 定位 → 可决策画面</h3>
          <div class="flow">
            <span class="step">一句话/选 profile</span><span class="arr">→</span>
            <span class="step">LLM 定位合规阶段</span><span class="arr">→</span>
            <span class="step">路线图+出处+后果</span><span class="arr">→</span>
            <span class="step">政策雷达</span><span class="arr">→</span>
            <span class="step">家长安心卡</span>
          </div>
          <ul>
            <li>一条<b>状态机时间线</b>高亮你当前所处那一格；下方「必须做的 2-3 件事」每条 = 动作 + 时间窗 + <b>错过的后果</b>（克制的红线）+ <b>可点击官方出处</b>（uscis.gov / ICE SEVP / DHS）</li>
            <li>风险雷达每条 = 「这条政策对你意味着什么 + 你能做的对冲动作」，不是干巴巴的新闻</li>
            <li>家长安心卡<b>只给状态不给细节</b>（贯彻「状态而非内容」+ 学生控制权），可一键导出图片</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            引擎为 live LLM（model claude-sonnet-4-6，强制严格 JSON、前端规整兜底）；内置一层<b>明确标注为「示意」的接地规则集</b>
            （OPT 90/60 天窗口、失业 90/150 天上限、STEM +24 月 + E-Verify + I-983、H-1B cap-gap 等），
            <b>API 失败/未连接时回退到这套确定性规则引擎，永不白屏</b>。</p>`
      },
      {
        label: "商业模式",
        html: `<ul>
            <li><b>家长付费的「安心订阅」</b>：主使用者是学生，主付费方是家长——买的是「孩子身份在轨道上」的确定性（保险心智）</li>
            <li><b>关键节点提醒</b>：到期前自动提醒（OPT 窗口 / STEM 递交 / cap-gap），把一次性查询变成持续续费</li>
            <li><b>持证律师 / ISSS 转介</b>：复杂个案降级为「找律师」并按转介计费，AI 只做信息收敛不越界给法律意见</li>
            <li><b>B 端</b>：留学中介 / 学校 ISSS / 雇主 HR 的白标合规助手</li>
          </ul>`
      },
      {
        label: "市场分析",
        html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
          <ul>
            <li><b>Boundless / VisaNation / Lawfully</b>：移民流程数字化与个案追踪工具，验证「把吓人的移民流程产品化」有真实付费。</li>
            <li><b>Sprintax / Glacier</b>：留学生报税 SaaS，证明「留学生合规刚需 + 学校/机构渠道」可规模化。</li>
            <li><b>Chegg（NYSE:CHGG）/ 各大留学中介</b>：留学服务付费成熟；家长为「孩子的确定性」付费意愿极强。</li>
          </ul>
          <ul>
            <li><b>AI 时代特有</b>：以前学生要自己拼接 USCIS / ICE / 学校散落的权威信息、或花高价问律师；AI 把它<b>收敛成个性化、带出处、可决策的画面</b>，把判断负担卸下来</li>
            <li><b>痛点</b>：身份链条复杂、错一步丢身份、信息散且吓人、家长远在国内只想知道「孩子还好吗」</li>
            <li><b>人群</b>：STEM 硕博 / 刚进 OPT 的中国留学生（用）+ 家长（付费）</li>
            <li><b>本地化</b>：中文为主、术语保留英文；微信内可打开转发安心卡；接学校 ISSS / 持证律师网络</li>
            <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：移民合规高度敏感，必须「信息参考、非法律建议」、绝不代填代办、结论挂官方出处；规则与政策变动频繁需持续维护、复杂个案务必转人类律师；本 demo 内置规则为示意，以官方为准</li>
          </ul>`
      }
    ]
  },

  /* ───────────────────────── 31 concierge（精选 · 首页卡片直达实时 demo，不走详情页）───────────────────────── */
  {
    id: "concierge", no: "31", cat: "短租民宿", featured: true, direct: true,
    kicker: "短租托管 · AI 访客管家",
    title: "AI 访客管家",
    subtitle: "把客人随口一问变成收入与口碑——查实时房态加住收款、故障派单、例外转人工，多语种 7×24",
    url: "demos/concierge/",
    tags: ["加住 upsell · 收款", "故障分诊 · 派单", "例外转人工", "多语种 · 7×24"],
    sections: []
  },

  /* ───────────────────────── 32 probe（外贸下厂 · 询盘结构化探针）───────────────────────── */
  {
    id: "probe", no: "32", cat: "外贸",
    kicker: "外贸下厂 · 询盘结构化",
    title: "询盘结构化探针",
    subtitle: "贴一封英文买家询盘 → 按 9 大类拆出「采购缺口清单」+ 一张「下厂询价单」；价格/规格/认证这些只有你能定的，留白等你，绝不替你猜",
    url: "demos/probe/",
    tags: ["9 大类缺口核对","逐项标原文证据","留白只等你的判断","判断存成你的标准 · 复利","一键下厂 RFQ","需连接 AI"],
    phoneHint: "贴买家询盘原文（点示例直接跑；连接 AI 体验最佳，未连接看离线样张不空白）",
    sections: [
      {
        label: "是什么",
        html: `<p>做外贸、手里有工厂也有客户的人，每天收到买家英文询盘，信息散、缺得到处都是。探针把一封询盘拆成两屏：
          ①<b>采购缺口清单</b>——按 9 大类（品类规格 / 数量交期 / 认证合规 / 包装唛头 / 物流条款 / 价格条款 / 质保售后 / 单证 / 沟通）逐项核对，
          标出「已明确 / 含糊 / 没提 / 需你定」，每条都附<b>原文证据</b>；
          ②<b>工厂简报骨架 · 留白版</b>——把已知的填进去，<b>价格、品类专属规格、认证编号这些只有你的经验能定的地方，精准留白</b>。
          它的本分是<b>炫你的判断、当你的凭证</b>，绝不替你编一个看起来对、其实是猜的数字。</p>`
      },
      {
        label: "程序逻辑",
        html: `<h3>一封询盘 → 缺口核对 → 留白简报 + 下厂询价单</h3>
          <div class="flow">
            <span class="step">贴询盘</span><span class="arr">→</span>
            <span class="step">9 大类逐项核对</span><span class="arr">→</span>
            <span class="step">标证据 + 留白</span><span class="arr">→</span>
            <span class="step">存成你的标准</span><span class="arr">→</span>
            <span class="step">一键下厂 RFQ</span>
          </div>
          <ul>
            <li>9 大类 35 字段写死在前端 = <b>结构事实源</b>；模型只回<b>字面出现</b>的信息，没出现一律算「缺」，<b>绝不补全</b></li>
            <li><b>红线在代码层强制</b>：价格 / FOB / CIF / DDP 永远是留白、绝不出数字；不点名不推荐任何工厂；品类专属规格 / 认证只列候选，把「这一类真正的强制项」标成「需你定」</li>
            <li><b>判断捕获 → 复利</b>：留白可填，填完「存为我的标准」→ 下次同类询盘自动预填、缺口当场减少。你不可替代的判断，变成会复利、且归你的资产</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            引擎为 live LLM，强制严格 JSON、前端按本体规整兜底；未连接 AI 时首屏即渲染离线样张，不白屏。</p>`
      },
      {
        label: "商业模式",
        html: `<ul>
            <li><b>SaaS 订阅</b>：按业务员 / 采购席位收费，询盘自动拆解 + 一键生成下厂询价单</li>
            <li><b>判断资产沉淀</b>：你存的每条标准都留在你这边，越用缺口越少、响应越快——迁移成本即护城河</li>
            <li><b>B 端集成</b>：做成阿里国际站 / 外贸 CRM / 邮箱插件，嵌进现有下单流程</li>
            <li><b>数据飞轮</b>：哪些留白最常被补、哪类询盘最终成交 → 反哺核对清单与询价模板</li>
          </ul>`
      },
      {
        label: "市场分析",
        html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
          <ul>
            <li><b>阿里巴巴国际站 RFQ（NYSE:BABA / 09988.HK）</b>：买家发 RFQ、平台结构化分发给工厂报价，验证「把询盘结构化成可报价单」的真实需求。</li>
            <li><b>SAP Ariba（NYSE:SAP）/ Coupa / Jaggaer</b>：采购寻源 SaaS，把 RFQ / 比价 / 供应商管理做成规模化订阅生意。</li>
            <li><b>Scoutbee / Tealbook / Keelvar</b>：AI 寻源与供应商情报，证明「用 AI 给采购流程做判断辅助」是规模化付费项。</li>
          </ul>
          <ul>
            <li><b>AI 时代特有</b>：以前把一封乱询盘拆成「缺什么、该问工厂什么」全靠老业务员的经验；现在 AI 把核对清单自动化，但<b>关键判断（定价、选规格、点工厂）仍只交给人</b>——AI 做结构，人做判断</li>
            <li><b>痛点</b>：询盘信息缺得到处都是、新人下厂前漏问导致来回返工、老师傅的判断留不下来全在脑子里</li>
            <li><b>人群</b>：有工厂和客户资源的外贸 SOHO / 中小工厂业务 / 采购中间商</li>
            <li><b>本地化</b>：接邮箱 / 国际站询盘流、品类规格库与认证库、汇率与报价库可做成生产级</li>
            <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：探针只做结构化与缺口提示，<b>绝不替任何一方定价或指定供应商</b>；最终规格、认证、报价必须由有经验的人拍板；公开使用应走后端代理保护 Key 与控成本</li>
          </ul>`
      }
    ]
  },

  /* ───────────────────────── 33–35 AnyHome 三件套（留学生租房中介 · 内部工具，直达实时 demo）───────────────────────── */
  {
    id: "anyhome-listing-card", no: "33", cat: "留学租房", direct: true,
    kicker: "留学生租房中介 · 房源物料",
    title: "房源物料生成器",
    subtitle: "把 StreetEasy 复制来的房源文字，5 分钟变成一张 AnyHome 品牌的中英双语推荐卡——通勤、周边、关键条款都呈现好，guarantor 显著标出，一键导图发学生",
    url: "demos/anyhome-listing-card/",
    tags: ["粘文字 → 双语房源卡", "通勤标草稿 · 可现场改", "guarantor 显著标出", "缺失标「待补」绝不编造", "一键导出 PNG"],
    sections: []
  },
  {
    id: "anyhome-intake", no: "34", cat: "留学租房", direct: true,
    kicker: "留学生租房中介 · 需求前台",
    title: "需求结构化前台",
    subtitle: "学生自助引导式录入，15 题带分支：没有美国信用就自动追问 guarantor、人在国内就标时差跟进；填完产出一张干净的 lead 卡交给中介团队",
    url: "demos/anyhome-intake/",
    tags: ["15 题引导式问答", "分支追问 · 帮你理清", "无信用 → 追问 guarantor", "在国内 → 标时差跟进", "lead 卡一键复制", "24/7 自助 · 无需 key"],
    sections: []
  },
  {
    id: "anyhome-checklist", no: "35", cat: "留学租房", direct: true,
    kicker: "留学生租房中介 · 签约材料",
    title: "签约材料清单生成",
    subtitle: "按学生情况（有无美国信用 / 收入 / 担保人）生成个性化、中英双语的签约材料 checklist，每条都附「为什么需要」，省掉一遍遍口头解释",
    url: "demos/anyhome-checklist/",
    tags: ["按身份分支生成", "中英双语对照", "每条附「为什么需要」", "US guarantor / service / 预付", "标注以房东要求为准"],
    sections: []
  },

  /* ───────────────────────── 36 cardna（whips + carsnap 合并旗舰） ───────────────────────── */
  {
    id: "cardna", no: "36", cat: "汽车", featured: true,
    kicker: "汽车导购 · 品味画像引擎",
    title: "购车品味 DNA",
    subtitle: "先滑车读「眼缘」，再答题锁「现实」，两股信号合成你的购车品味画像 —— 帮你选车，也让车企看见匿名的「在库买家」",
    url: "demos/cardna/", tags: ["滑动×问卷 双信号","向往 vs 现实","可解释精配","车企眼里的你","默认私有 · 按项授权","纯离线"],
    phoneHint: "先左右滑车（滑满 6 张），再答 5 题，看你的购车品味 DNA + 「车企眼里的你」面板",
    sections: [
      { label: "是什么", html: `<p>把「汽车版 Tinder」的<b>左右滑</b>和「答题荐车」的<b>问卷</b>合成一个产品。滑动采集你的<b>隐式品味</b>（被什么吸引），问卷采集<b>显式约束 + 购买意图</b>（预算 / 座位 / 能源 / 时间线 / 是否首购）。两股信号汇成一份<b>「购车品味 DNA」</b>——既帮你选车，也把「向往」和「现实」的差距摊给你看。</p>` },
      { label: "程序逻辑", html: `<h3>隐式 × 显式，两路信号交叉校准</h3>
        <div class="flow"><span class="step">滑 6+ 张（❤/✕）</span><span class="arr">→</span><span class="step">答 5 题（约束+意图）</span><span class="arr">→</span><span class="step">合成品味 DNA</span><span class="arr">→</span><span class="step">向往 vs 现实</span><span class="arr">→</span><span class="step">精配 + 车企眼里的你</span></div>
        <ul>
          <li><b>滑动（System 1）</b>：自适应发牌——前几张铺开试探，之后专挑你还没拿定的那根轴；右侧「实时读你」边滑边更新画像</li>
          <li><b>问卷（System 2）</b>：预算 / 座位是<b>硬约束</b>，时间线 + 首购是<b>意图分级</b>（纯逛逛 / 半年内 / 3 个月内必入）</li>
          <li><b>向往 vs 现实</b>：右滑车均价 vs 预算档（差几万）、「嘴上家用、手却滑性能」、尺寸摇摆——交叉信号里的<b>矛盾</b>才是最值钱的洞察</li>
          <li><b>精配</b>：隐式品味打分 + 预算/座位硬约束 + 能源偏好；每台给契合度、可追溯理由、<b>诚实短板</b>，外加一台预算内的「黑马」和替你问销售的 3 个问题</li>
        </ul>
        <p style="margin-top:16px">背后：右滑属性逐项加权、左滑反向惩罚；预算超档重罚、座位不够重罚，把「现实」压进排序；理由直接引用你右滑里某属性的真实次数；全部状态编码进 URL，分享链接打开即复现。<b>零外部依赖、纯离线</b>；连上自带 key 则升级为真实模型生成文案。</p>` },
      { label: "商业模式", html: `<h3>双边：消费端免费圈人，B2B 端靠「被读懂的高意向」变现</h3>
        <ul>
          <li><b>消费端（免费）</b>：好玩的品味测试 + 荐车 + 决策简报，低门槛把人提前圈进来</li>
          <li><b>B2B 第一层 · 聚合洞察</b>：匿名趋势报告（如「一线首购正从硬派转极简」）卖给车企做产品 / 营销定位——真聚合、无个人、可重复卖</li>
          <li><b>B2B 第二层 · 知情同意的暖线索</b>：用户主动点头，才把对口销售引荐给他；带完整品味画像的高意向线索，单价远高于冷线索</li>
          <li><b>绝不卖原始个人数据</b>：默认私有、按项授权、随时可关——合规不是成本，是车企敢签约的前提，也是护城河</li>
          <li><b>数据飞轮</b>：每次滑动 / 答题都在优化画像，越用越准——Stitch Fix 的护城河同构</li>
        </ul>
        <p style="margin-top:16px">demo 里的<b>「车企眼里的你」面板</b>把这套直接演出来：你属于哪个匿名人群、对车企意味着什么价值、平台会怎么用、你能逐项开关共享——把双边模式和知情同意一次讲清。</p>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>模式对标 Stitch Fix（美股 SFIX）</b>：问卷 + 数据学口味 → 个性化精选 → 数据飞轮。证明了「被读懂、被选」的个性化零售能规模化。</li>
          <li><b>下漏斗对标 汽车之家 / 懂车帝 / 易车</b>：正在比配置、要留资的人——线索单价已被打很贵，且被巨头垄断。</li>
        </ul>
        <ul>
          <li><b>差异化楔子 = 上漏斗 pre-intent</b>：还没买、6–18 个月后才买的人，处于「形成品味」阶段——对传统线索生意太早、太软、没人好好变现。本品用「好玩的品味测试」提前一年把他们圈住，画像随其靠近购买而成熟，最后交付的是<b>早就在养的、带品味的暖线索</b>。</li>
          <li><b>价值发动机 = 意图分级</b>：车企买的不是「10 万个品味」，是「其中 3 个月内要买、且气质匹配新车型的那 8000 人」；「首购 + 高意向」尤其值钱（还没品牌忠诚，谁先触达谁占位）。</li>
          <li><b>合规即护城河</b>：PIPL 下卖个人信息要单独同意、匿名化须为真匿名——默认私有 + 聚合洞察 + opt-in 撮合，既安全又比灰色数据更可签约。</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：买车低频，画像「活着」的留存是最难的产品题；真车源 / 价格数据是硬门槛；线索变现依赖车企 / 经销商 BD；本 demo 金额为示意、引擎为启发式占位，非真实模型。</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 37 deposit-letter（留学生租房 · 押金异议函）───────────────────────── */
  {
    id: "deposit-letter", no: "37", cat: "留学租房", featured: true,
    kicker: "留学生租房 · 押金追索",
    title: "把押金追回来",
    subtitle: "房东赌你离境后不会追。选州 + 填退房日期与扣款清单 → 州法时限核查（超期即双倍/三倍筹码）+ 逐项扣款异议 + 一封引用法条、可直接寄出的英文 demand letter，附小额法庭升级路径",
    url: "demos/deposit-letter/",
    tags: ["8 州押金法规则库 · 法条锚定","法定截止日时间线","超期 = 攻守互换","逐项异议 · 信函实时重写","英文 demand letter","小额法庭升级路径","纯离线"],
    phoneHint: "点内置案例直接看时限裁决与信函；改任意一项立场，信当场重写（全程本地，不上传）",
    sections: [
      {
        label: "是什么",
        html: `<p>留学生租房最大的结构性弱点是<b>「离境即归零」</b>——人回国了，押金扣多少只能认多少，房东最大的底气就是赌你不会追。
          但每个州的押金法都给房东上了一条硬时限：<b>超过法定天数不退还、不给逐项扣款清单，很多州直接触发双倍甚至三倍赔偿</b>——攻守当场互换。
          这个工具做三件事：①按你的州核出<b>法定截止日时间线</b>（大多数人根本不知道这条线存在）；②把房东的扣款清单摆上<b>逐项异议台</b>（正常磨损不可扣 / 无凭据要求出示发票）；
          ③生成一封<b>引用州法条文、可直接寄出的英文 demand letter</b>，附小额法庭升级路径——包括人已回国怎么办。</p>`
      },
      {
        label: "程序逻辑",
        html: `<h3>州规则库 → 时限核查 → 逐项异议 → 信函 + 升级路径</h3>
          <div class="flow">
            <span class="step">选州 + 填事实</span><span class="arr">→</span>
            <span class="step">法定截止日核查</span><span class="arr">→</span>
            <span class="step">逐项扣款异议</span><span class="arr">→</span>
            <span class="step">英文 demand letter</span><span class="arr">→</span>
            <span class="step">小额法庭路径</span>
          </div>
          <ul>
            <li><b>法条锚死幻觉</b>：8 个留学生大州（PA/NY/MA/CA/IL/TX/WA/NJ）的法定天数、条文号、罚则倍数、小额法庭上限全部<b>写死在前端规则库</b>——AI 绝不生成法条，连输出里带「§」的行都会被代码丢弃</li>
            <li><b>时间线即裁决</b>：退房日 → 法定截止日 → 今天，超期区间标红——四种情形（超期未理 / 清单迟到 / 未到期 / 按时收到）各给对应策略</li>
            <li><b>异议台实时联动</b>：每笔扣款选立场（认了 / 正常磨损 / 拿凭据来），<b>信函当场重写</b>、争议金额实时重算</li>
            <li><b>UPL 红线</b>：self-help 文书定位（LegalZoom 模式）——按事实套用公开法条模板，不判断个案胜负，界面明示 not legal advice</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            时限计算、信函模板、升级路径<b>全本地生成、纯离线可用</b>；连 API Key 后 AI 只做一件事：把你的中文补充说明润成信中的正式英文事实段。</p>`
      },
      {
        label: "商业模式",
        html: `<ul>
            <li><b>按次 / 订阅</b>：单封信按次收费（对比律师 $200–400 定价空间巨大），订阅解锁退房时间线提醒、证据保管、后续跟进信（LegalZoom / DoNotPay 自助文书模式）</li>
            <li><b>唯一攻击「离境即归零」总根源的杠杆</b>：其他工具帮你避坑，这个工具把已经被扣的钱追回来——付费意愿最直接（真金白银 vs 风险预防）</li>
            <li><b>节令闭环</b>：5–8 月毕业退房季集中爆发；与签前核对、入住证据工具串成全生命周期产品</li>
            <li><b>扩州即扩市场</b>：规则库逐州上线，边际成本近零；同一引擎可扩加拿大 / 英国 / 澳洲留学生市场</li>
          </ul>`
      },
      {
        label: "市场分析",
        html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
          <ul>
            <li><b>LegalZoom（NASDAQ:LZ）/ Rocket Lawyer</b>：自助法律文书证明「结构化 self-help、不做个案判断」是规模化订阅生意。</li>
            <li><b>DoNotPay</b>：消费维权自动化文书（罚单申诉、押金追索正是其经典场景），订阅制，证明 C 端愿为「帮我要回钱」付费。</li>
            <li><b>小额法庭代书服务</b>：美国各州长期存在的付费代书生态，验证 demand letter 这一环节本身就有市场。</li>
          </ul>
          <ul>
            <li><b>结构性痛点</b>：留学生离境后追索能力归零、不知道州法时限存在、不敢/不会写正式英文函——房东吃定这三点</li>
            <li><b>人群</b>：每年数十万在美中国留学生，毕业退房季集中；押金 $1,500–3,000，被扣金额往往数百至上千美元</li>
            <li><b>AI 时代特有</b>：以前这活只有律师或懂行的学长能干；规则库 + 模板把它变成 2 分钟自助——<b>法条是死的（规则库），事实是你的（表单），AI 只做润色</b></li>
            <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：UPL 边界必须守住——只做文书工具不做法律判断；演示规则库为简化摘要，生产级需逐州法条核校与更新机制；跨境执行（房东拒不履行判决）仍是现实难点</li>
          </ul>`
      }
    ]
  },

  /* ───────────────────────── 38 order-check（华人餐饮供应链 · 订单-送货单核对）───────────────────────── */
  {
    id: "order-check", no: "38", cat: "餐饮供应链", featured: true,
    kicker: "华人餐饮供应链 · 晚间事后审计",
    title: "晚上三分钟，对一下单",
    subtitle: "中餐馆的采购跑在微信语音和手写送货单上：厨师订、帮厨收、老板付，中间零核对。把昨晚的订货记录和今天的送货单贴进来——没订的货、订三到二、悄悄涨的价，逐项标出来，明早给销售的对账消息一键生成",
    url: "demos/order-check/",
    tags: ["微信订货×送货单 逐项核对","零行为改变 · 事后审计","没订到货 / 订送不符 / 价格异常","近四周价格记忆","规格歧义提醒（虾的 size）","一键对账消息","纯离线可玩"],
    phoneHint: "点内置案例直接看核对结果；差异话术永远是「是不是搬错/写错」，不做指控（全程本地，不上传）",
    sections: [
      {
        label: "是什么",
        html: `<p>全美数万家中餐馆的采购跑在微信语音 + 手写送货单 + 纸质月结上，主流餐饮 SaaS 不做中文、不懂微信订货、不认手写单。
          最要命的结构是<b>订-收-付三点分离</b>：厨师晚上微信订货、帮厨早上七点收货、老板月底付钱——三个人之间<b>没有任何核对环节</b>，差异就藏在这条缝里。
          这个工具的关键设计是<b>零行为改变</b>：绝不要求收货时称重对单（改变早上七点帮厨的动作 = 产品死亡），
          而是打烊后把微信订货记录和送货单放到一起，<b>三分钟事后审计</b>：没订的货上了单、订三箱到两箱、油悄悄涨了 10%、订虾没说 size——逐项标出，明早给销售的对账消息一键生成。</p>`
      },
      {
        label: "程序逻辑",
        html: `<h3>订货语料 → 送货单行项 → 确定性比对 → 对账消息</h3>
          <div class="flow">
            <span class="step">贴微信 + 送货单</span><span class="arr">→</span>
            <span class="step">抽订货项</span><span class="arr">→</span>
            <span class="step">逐项比对</span><span class="arr">→</span>
            <span class="step">价格记忆核查</span><span class="arr">→</span>
            <span class="step">明早对账消息</span>
          </div>
          <ul>
            <li><b>五类结果</b>：没订到货（红·要钱的）/ 规格发错（红）/ 订送不符（琥珀·影响明天出菜）/ 价格异常（紫·对比近四周价格记忆，带走势小图）/ 订货习惯提醒（订虾没说 16/20 还是 21/25——这个口子每次都可能漏）</li>
            <li><b>对照台</b>：左边微信气泡（语音转文字样式还原）、右边黄色复写纸质感的送货单，同号图钉双向跳转——每条差异都有原文可查</li>
            <li><b>话术红线</b>：差异 ≠ 指控。生成的对账消息永远是「是不是搬错车 / 单子写错了」，给对方台阶、把账对清——绝不做回扣暗示，判断留给老板</li>
            <li><b>敏感区红线</b>：严格停留在采购侧，不碰营收、不碰税务——既是合规边界也是老板敢用的前提</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            解析层为本地词典引擎（中餐采购高频品类 + 中文数量词 + 规格正则），比对为确定性计算，<b>纯离线可玩</b>；连 API Key 后用真实模型解析任意格式（抽取结果强制回原文核验），<b>数量金额的比对永远在本地算</b>。真实产品为拍照 → OCR → 低置信度进人工复核。</p>`
      },
      {
        label: "商业模式",
        html: `<ul>
            <li><b>订阅（复购型）</b>：按店/月收费——这是横向核对引擎第一次踩中<b>日频刚需</b>：订货日频 + 对账月频 + 持续经营买方，频次结构远优于低频消费场景</li>
            <li><b>付费意愿验证点</b>：对账差异通常每月数百至上千美元真金白银——工具费一晚上就赚回来，ROI 一句话讲得清</li>
            <li><b>数据副产品</b>：核对累积出同供应商同品价格曲线 → 自然长出「采购价格监测」（系列 Demo 06），无需额外录入</li>
            <li><b>渠道假设</b>：配送商销售每天物理穿行数十家餐馆——「账目经得起核对」对诚实配送商是销售武器，存在渠道主动分发可能</li>
          </ul>`
      },
      {
        label: "市场分析",
        html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
          <ul>
            <li><b>MarginEdge / xtraCHEF（Toast 收购）</b>：美国餐饮发票数字化与成本管理 SaaS，按店月费，证明「把纸质单据变成可核对数据」是成熟付费品类。</li>
            <li><b>Toast（NYSE:TOST）</b>：餐饮垂直 SaaS 巨头，验证按店订阅 + 增值模块的规模化路径。</li>
            <li><b>国内美菜 / 蜀海 / 快驴</b>：重资本供应链绞肉机——本品明确不做交易、只做核对层，避开其战场。</li>
          </ul>
          <ul>
            <li><b>双重忽视缝隙</b>：主流 SaaS 不做中文不懂微信订货不认手写单；国内玩家出不来——全美数万家中餐馆 + 数百家区域华人配送商就运转在这条缝里</li>
            <li><b>同构复用</b>：非结构化对话抽取承诺 → 与正式文档比对 → 差异清单——同一引擎第三次成立（询盘、租房之后），首次承载复购型商业模式</li>
            <li><b>本地化入口</b>：区域配送商销售代表、大费城中餐协会——demo 可步行验证</li>
            <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：中英混排 + 手写送货单 OCR 是硬骨头（缓解：低置信度进人工复核，不追求全自动）；规格歧义（如虾的 size 标准）需真实语料打磨；本 demo 从已识别文本开始、价格记忆为演示数据</li>
          </ul>`
      }
    ]
  },

  /* ───────────────────────── 39 statement-recon（华人餐饮供应链 · 月结对账核销）───────────────────────── */
  {
    id: "statement-recon", no: "39", cat: "餐饮供应链",
    kicker: "华人餐饮供应链 · 月结核销",
    title: "月底这笔账，核完再付",
    subtitle: "把这个月的送货单堆和配送商 statement 放上核销台：对上的逐笔打勾变淡，剩下的就是问题——重复计费、没见过单子的收费、金额不符、说好没兑现的 credit。核完给你一个数：该付多少，而不是账单要多少",
    url: "demos/statement-recon/",
    tags: ["送货单堆 × statement 逐笔核销","重复计费 / 无单收费 / 金额不符","微信承诺的 credit 追兑现","三个大数字：要多少/争议/该付","对账消息 · 表达付款意愿","纯离线可玩"],
    phoneHint: "点内置案例直接看核销结果；差异话术永远是「核清就结」，维护供应关系（全程本地，不上传）",
    sections: [
      {
        label: "是什么",
        html: `<p>月结是华人餐饮供应链里<b>唯一一次钱和单据对面的机会</b>——但一张张翻单子核对是一晚上的活，所以多数老板扫一眼总数就付了。
          差异恰恰藏在这一步：<b>同一单号收两次、statement 上有收费但送货单堆里没这张单、单子 $301 账上 $321、微信里说好的 credit 到月底没兑现</b>。
          这个工具把送货单堆和 statement 放上核销台：<b>对上的逐笔打勾变淡，剩下没勾掉的就是该问的</b>；
          最后给三个大数字——Statement 要多少、核出多少争议、<b>这个月该付多少</b>——和一条「核清就结」的对账消息。</p>`
      },
      {
        label: "程序逻辑",
        html: `<h3>单据堆 → 逐笔核销 → 争议汇总 → 该付金额 + 对账消息</h3>
          <div class="flow">
            <span class="step">贴单堆 + statement</span><span class="arr">→</span>
            <span class="step">按单号逐笔核销</span><span class="arr">→</span>
            <span class="step">credit 追兑现</span><span class="arr">→</span>
            <span class="step">该付金额</span><span class="arr">→</span>
            <span class="step">对账消息</span>
          </div>
          <ul>
            <li><b>四类争议 + 一类留底</b>：重复计费（同单号两笔）/ 无单收费（要求出示签收单）/ 金额不符（以签收单为准）/ <b>说好的 credit 没兑现</b>（微信承诺 vs statement 的 credit 行——与 Demo 04 闭环：晚间审计发现的差异，月结时追兑现）/ 未入账留底（月底的单下月该出现）</li>
            <li><b>核销的视觉本质</b>：左边送货单堆（小票卡片），右边 statement（账本行）——对上的打勾变淡，问题行高亮，缺失的 credit 画出「这里本该有一行」的虚线占位</li>
            <li><b>话术红线</b>：录重、忘挂 credit 是月结常态，不是罪证——消息永远是「核一下再结」+ 明确付款意愿（先按核清的数结，差的确认后补），把账对明白、把关系处长远</li>
            <li><b>敏感区红线</b>：严格采购侧，不碰营收、不碰税务</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            解析与核销为本地确定性引擎，<b>纯离线可玩</b>；连 API Key 后用真实模型解析任意格式（整行回原文核验），核销匹配永远在本地算。真实产品为拍照 → OCR → <b>低置信度字段进人工复核队列</b>——中英混排手写单是硬骨头，不追求全自动。</p>`
      },
      {
        label: "商业模式",
        html: `<ul>
            <li><b>与 Demo 04 打包订阅</b>：日审计（订单核对）+ 月核销（statement 对账）是同一条信任链的两端——日频留存 + 月频出真金白银的价值时刻</li>
            <li><b>付费意愿最硬的一环</b>：对账差异通常每月数百至上千美元——「这个月该付 $4,800 而不是 $5,575」这句话本身就是定价依据</li>
            <li><b>结构平移</b>：yzh 短租托管的 Invoice OCR + 人工复核 + ledger 层直接平移——受托中间层的「可解释对账」母题跨行业成立</li>
            <li><b>争议汇总页即谈判工具</b>：老板拿着核销记录跟配送商谈账，工具成为月底结账仪式的一部分——嵌入越深，替换成本越高</li>
          </ul>`
      },
      {
        label: "市场分析",
        html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
          <ul>
            <li><b>MarginEdge / xtraCHEF（Toast 收购）</b>：发票数字化 + 对账是其核心付费模块，按店月费，品类已被验证。</li>
            <li><b>Bill.com（NYSE:BILL）/ Ramp</b>：中小企业应付账款自动化，证明「对账 + 付款前核验」是大生意。</li>
            <li><b>AppZen / Stampli</b>：AI 发票审核，B 端付费成熟。</li>
          </ul>
          <ul>
            <li><b>订-收-付三点分离的月度总账</b>：厨师订、帮厨收、老板付——月结 statement 是三点分离积累一个月后的总对账时刻，也是差异唯一可能被发现的时刻</li>
            <li><b>双重忽视缝隙</b>：主流 AP 工具不认中英混排手写送货单、不懂「微信里说好的 credit」这种口头账——这正是华人供应链的日常</li>
            <li><b>与 Demo 04 的闭环</b>：晚间审计发现「白洋葱 $22 没订」→ 销售微信答应冲掉 → 月底核销追这笔 credit 兑没兑现——一条差异从发现到闭环全程留痕</li>
            <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：手写单 OCR 是硬骨头（低置信度进人工复核，成本模型要算清）；credit 承诺散落在语音和口头里，覆盖率有限；本 demo 从已识别文本开始、金额为演示数据</li>
          </ul>`
      }
    ]
  },

  /* ───────────────────────── 40 price-pulse（华人餐饮供应链 · 采购价格透明面板）───────────────────────── */
  {
    id: "price-pulse", no: "40", cat: "餐饮供应链",
    kicker: "华人餐饮供应链 · 价格记忆",
    title: "悄悄涨的价，摆到台面上",
    subtitle: "Demo 04/05 的数据副产品：每晚拍的送货单攒三个月，自动长成每个品的 12 周价格曲线——跳涨、爬价、量价分解，异常自己浮出来，一个字不用录。⛔ 明确不做「回扣检测」：数据只呈现异常，判断永远留给老板",
    url: "demos/price-pulse/",
    tags: ["零录入 · 送货单自动累积","12 周价格曲线 + 基准带","跳涨 / 爬价 / 量价分解","爬价对人的记忆免疫","谈价弹药 · 中性话术","⛔ 不做回扣检测","纯离线"],
    phoneHint: "切换两家店看两种状态（有事 / 干净）；点品类 chip 换曲线，点异常条目跳到对应曲线",
    sections: [
      {
        label: "是什么",
        html: `<p>最阴险的涨价不是跳涨，是<b>爬价</b>：每周涨一点，单看哪周都"正常"，十二周下来贵了一成——<b>它对人的记忆免疫，这正是它的设计</b>。
          这块面板是 Demo 04/05 的<b>数据副产品</b>：老板每晚拍的送货单，攒三个月自动长成每个品的价格曲线，<b>零录入</b>。
          三类异常自己浮出来：<b>跳涨</b>（本周对前四周均 +8%）、<b>爬价</b>（单周不超阈值、12 周累计 +10%）、<b>量价分解</b>（支出涨了，拆开看是量还是价）。
          伦理红线写在产品脸上：<b>不做「回扣检测」</b>——数据只能呈现异常，不能证明动机；错误的指控毁掉的是后厨。异常摆到台面上，判断永远留给老板。</p>`
      },
      {
        label: "程序逻辑",
        html: `<h3>送货单累积 → 价格记忆 → 三类异常 → 谈价弹药</h3>
          <div class="flow">
            <span class="step">每晚送货单照片</span><span class="arr">→</span>
            <span class="step">自动累积价格库</span><span class="arr">→</span>
            <span class="step">阈值检测</span><span class="arr">→</span>
            <span class="step">曲线 + 异常清单</span><span class="arr">→</span>
            <span class="step">中性谈价话术</span>
          </div>
          <ul>
            <li><b>阈值公开可查</b>（写进页脚）：跳涨 = 本周对前四周均价 +8%；爬价 = 12 周累计 +10% 且多数周环比上行、单周从未超 8%；量价分解 = 支出 +20% 时拆成量与价两部分中性呈现</li>
            <li><b>曲线即证据</b>：12 周折线 + 前 8 周均价 ±8% 的基准灰带——爬价的品，整条线从带内爬出带外，一眼看懂「为什么每晚核对抓不到它」</li>
            <li><b>正向对冲</b>：主动降价的品标绿色「值得记住」——面板不是猎巫工具，价格纪律好的供应商值得把量给他</li>
            <li><b>动机词汇红线在代码层</b>：连 AI 润色的小结，任何含「回扣 / 偷 / 贪 / 吃差价」的输出行都被正则丢弃；开口话术全部中性（「市场是都这样吗？帮我看看」）</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            检测与小结全部本地确定性计算，<b>纯离线</b>；连 API Key 后 AI 只润色小结文字——不新增数字、过同一道词汇红线。V1 明确不做跨餐馆比价（需多家数据，网络效应留待后期）。</p>`
      },
      {
        label: "商业模式",
        html: `<ul>
            <li><b>订阅增值层</b>：Demo 04（日审计）+ 05（月核销）的用户免费解锁——数据副产品零边际成本，却是续费理由最直观的一屏</li>
            <li><b>粘性即护城河</b>：价格记忆随使用时间增值——用满一年的店，换工具等于扔掉自己一年的价格资产</li>
            <li><b>谈价弹药 = 可量化 ROI</b>：「把异常品谈回基准价 ≈ 年省 $X」——工具自己算出自己的价值</li>
            <li><b>后期网络效应（V2）</b>：多店匿名聚合后可做区域价格基准——「同城中餐馆花生油都在 $46–48」，那是另一个量级的产品，V1 克制不碰</li>
          </ul>`
      },
      {
        label: "市场分析",
        html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
          <ul>
            <li><b>MarginEdge</b>：其「price alert / price movers」正是发票数据副产品的价格监测，是续费卖点之一。</li>
            <li><b>xtraCHEF（Toast）</b>：发票行项数据自动生成价格趋势，按店月费。</li>
            <li><b>Datassential / NielsenIQ</b>：食材价格情报本身就是可售卖的数据生意——多店聚合后的 V2 方向已被验证。</li>
          </ul>
          <ul>
            <li><b>为什么现在没人给中餐馆做</b>：前提是把中英混排手写送货单变成结构化数据——主流工具卡在 OCR 这一步，而这正是 Demo 04/05 的存量产出</li>
            <li><b>伦理校准即差异化</b>：市面上「防内鬼」话术的工具会毁掉老板与后厨的信任、也会被后厨抵制——「采购透明化、判断留给人」的定位既是底线也是可被采纳的前提</li>
            <li><b>与前两个 demo 的关系</b>：04 抓当晚、05 核当月、06 看三个月——三个时间尺度覆盖同一条采购信任链，订阅打包顺理成章</li>
            <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：价值依赖 04/05 的数据积累，冷启动期面板是空的（需设计首月体验）；阈值需真实语料调参（本 demo 为演示数据）；规格混淆会污染价格曲线（已在 04 做规格感知，仍需人工复核兜底）</li>
          </ul>`
      }
    ]
  },

  /* ── 加新 demo：复制上面一段，改 id / no / cat / 内容 / url，即出现在首页 ── */
];

/* ═══════════════════════════════════════════════════════════════════════════
   英文镜像（EN mirror）—— 与上方中文一一对应，仅文案翻译，结构/id/no/url 一致。
   切换机制见 assets/i18n.js（新访客默认英文）。加新 demo 时，两处都要加。
   ═══════════════════════════════════════════════════════════════════════════ */
window.SITE_EN = {
  brand: "好玩的东西 · Playground",
  hero: {
    kicker: "Intent → Delivery · Iterant AI",
    title: "Real needs,<br>shipped into real products",
    lede: "We are a lean, elite team: half of us own the demand side — requirements, market insight, and client relationships — half of us use AI to deliver fast, completely, and accountably. The clickable demos below are proof of capability; the essays are how we think about intent, data, security, and human nature. A page of copy is no substitute for clicking through yourself.",
    pills: ["✦ Fully interactive interfaces", "✦ Real state transitions", "✦ Works on mobile and WeChat"]
  },

  author: {
    name: "Lingchong Hu · 胡凌冲",
    role: "Founder, Iterant AI",
    blurb: "We are experimenting with new AI-native org structures, teaching the team new AI development workflows as we go. I would rather validate product value with real revenue than exchange a grand narrative for a large check. What's actually worth something is the ability to take a requirement all the way to delivery — the completeness, stability, and degree of automation is what reveals whether a team can connect the raw capability of large AI models, in a structured way, to concrete industry needs.",
    facts: ["Founder, Iterant AI", "Penn · MCIT '25", "Philadelphia"],
    site: "https://lingchong-hu.github.io/",
    siteLabel: "Personal site ↗"
  },

  thoughts: [
    {
      kicker: "Thinking · Intent",
      title: "Intent is the next input",
      desc: "Brain-computer interfaces, eye tracking, voice, EMG — every flashy new input modality runs into the same wall: the weight of habit. The real game isn't swapping hardware; it's reading what you actually want to do right now. That's intnt.",
      href: "thoughts/intent.html",
      play: "thoughts/intent-play.html",
      featured: true
    },
    {
      kicker: "Thinking · Data",
      title: "Your data predicts your tomorrow",
      desc: "Every click, every dwell, every late-night search is a leak of intent. Stitch the fragments together and you can know what someone wants before they ask. That's predictive commerce — and the very thin line that runs through it.",
      href: "thoughts/data-future.html",
      play: "thoughts/data-future-play.html"
    },
    {
      kicker: "Thinking · Security",
      title: "When attack and defense both get cheap",
      desc: "Most of the security you've enjoyed was underwritten by one fact: attacking you wasn't worth it. AI has floored the cost of attack — and also the cost of defense. The danger isn't the technology; it's which side the scales tip toward.",
      href: "thoughts/safety.html",
      play: "thoughts/safety-play.html"
    },
    {
      kicker: "Thinking · Human nature",
      title: "Requirements, dug down to human nature",
      desc: "What users say they want is never what they actually want. Peel the requirement back layer by layer and you find: the surface varies endlessly, but there are only a handful of strings underneath. AI changes how those strings get plucked — not the strings themselves.",
      href: "thoughts/human-needs.html",
      play: "thoughts/human-needs-play.html"
    },
    {
      kicker: "Thinking · Org design",
      title: "Org structure for the AI era",
      desc: "Once code gets cheap, the decisive edge is the combination of 'deep demand insight + complete delivery' — and those two things almost never live in the same person. Why the structure of a law firm turns out to be exactly the right answer for this moment.",
      href: "thoughts/ai-org.html",
      play: "thoughts/ai-org-play.html"
    },
    {
      kicker: "Thinking · Process",
      title: "Accountable development",
      desc: "What does 'owning it' actually mean? Between AI-generated output and something you dare to ship, there is a gap. Whether you cross it by 'understanding it yourself' or by 'independent verification' — that is the judgment call we make on every project.",
      href: "thoughts/dev-process.html",
      play: "thoughts/dev-process-play.html",
      featured: true
    }
  ],

  contact: {
    intro: "If any of this sparked an idea, a question, or a concrete need — reach out directly, or leave your thoughts here and I'll read every one.",
    wechatId: "Linchhlc2001",
    email: "hulingchong302@gmail.com",
    linkedin: "https://www.linkedin.com/in/lingchong-hu",
    formUrl: "",
    formLabel: "Share your thoughts / leave a request",
    wechatQR: "assets/wechat-qr.png"
  }
};

window.PROJECTS_EN = [
{
  id: "atelier", cat: "Fashion", featured: true,
  no: "01",
  kicker: "Personal Styling / Fashion Retail",
  title: "Premium Personal Styling Platform",
  subtitle: "The Stitch Fix model · a dedicated stylist curates a box for you — keep what you love, return the rest",
  url: "demos/atelier/",
  tags: ["Three-sided closed loop", "Rule-based matching", "Subscription + styling fee credit", "Data flywheel"],
  phoneHint: "Best experienced on mobile / WeChat",
  sections: [
    {
      label: "What it is",
      html: `<p>For people who have no time to shop but want to dress well — we hand them a <b>dedicated stylist</b> who truly gets them.
        Users fill out a style profile; the stylist selects a curated set of pieces and ships them home.
        After trying everything on, <b>keep what you love, return the rest</b> — and the styling fee credits toward any purchase.
        It turns "browsing racks" into "being understood and chosen for."</p>`
    },
    {
      label: "How it works",
      html: `<h3>Three sides, one closed loop</h3>
        <ul>
          <li><b>Client side (the runway)</b>: style quiz → book a Fix → preview candidates → receive box → keep/return each piece + leave feedback → settle</li>
          <li><b>Stylist side (the curation desk)</b>: review client profile, pick 6 items + write an overall note + explain each pick</li>
          <li><b>Ops side (fulfillment)</b>: inventory and shipping dashboard, track delivery → return items to stock</li>
        </ul>
        <p style="margin-top:14px">The core is a strict <b>Fix state machine</b> — each step can only advance via a backend action:</p>
        <div class="flow">
          <span class="step">Booked</span><span class="arr">→</span>
          <span class="step">Styling</span><span class="arr">→</span>
          <span class="step">Preview ready</span><span class="arr">→</span>
          <span class="step">Shipped</span><span class="arr">→</span>
          <span class="step">Try-on</span><span class="arr">→</span>
          <span class="step">Settle / Return</span>
        </div>
        <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
          The recommendation engine is rule-based matching: filter candidates by size + budget + category + exclusions,
          then layer in the stylist's human curation — prove the operational loop works first, model later.</p>`
    },
    {
      label: "Business model",
      html: `<ul>
          <li><b>Styling fee credit</b>: charge a styling fee upfront, credit it in full against any purchase — boosts conversion and order value</li>
          <li><b>Keep-all discount</b>: incentivize keeping the entire box, lifting per-Fix GMV</li>
          <li><b>Subscription</b>: one-time / monthly / quarterly cadences — steady, high-AOV recurring revenue</li>
          <li><b>Data flywheel</b>: every keep/return decision and piece of feedback sharpens the next match — the longer you use it, the better it gets</li>
        </ul>`
    },
    {
      label: "Market",
      html: `<ul>
          <li><b>Benchmarks</b>: Stitch Fix (SFIX) has already validated the scalability of stylist-plus-data personalized retail</li>
          <li><b>Market gap</b>: Chinese e-commerce is a self-serve shelf; premium shoppers who "want to dress well but have no bandwidth to shop" are almost entirely unserved</li>
          <li><b>Who</b>: tier-1/2 middle and upper-middle class — willing to pay for being understood, saving time, and having taste</li>
          <li><b>Localization</b>: WeChat / Alipay payments, phone-number login, curated brand catalog — fits domestic consumer habits</li>
        </ul>`
    }
  ]
},
{
  id: "intnt", cat: "Productivity", featured: true,
  no: "00",
  kicker: "Our product · intnt model",
  title: "intnt · Intent Model",
  subtitle: "No new device, no new habits — reads your intent from real-time context and long-term behavior, collapsing multi-step actions into one.",
  url: "",
  tags: ["Intent recognition", "Context + memory", "Data stays local", "Squeeze every bit from keyboard and mouse"]
},
{
  id: "guardian", cat: "Eldercare",
  no: "02",
  kicker: "Smart Eldercare / Age-friendly Tech",
  title: "Remote Guardian · Snug",
  subtitle: "Zojirushi's 'invisible' check-in × Snug's proactive safety ping × China's realities — dignified protection for seniors living alone",
  url: "demos/guardian/",
  tags: ["Dual-track signals", "Four-level escalation ladder", "Signal aggregation hub", "To-G/B deployment"],
  phoneHint: "Multi-role sandbox — use the in-page console to advance the scenario",
  sections: [
    {
      label: "What it is",
      html: `<p>It resolves a core tension: <b>seniors don't want to be watched; adult children can't stop worrying</b>.
        Day-to-day, routine home signals (water, electricity, door) provide <b>invisible protection</b> — zero intrusion on the senior's life.
        Only when signals go quiet long enough does the system <b>gently ask the senior to check in</b>.
        If there's still no response, escalation kicks in, one level at a time.
        The senior's interface never shows the words "surveillance," "activity data," or "under care."</p>`
    },
    {
      label: "How it works",
      html: `<h3>Dual-track signals + four-level escalation (a pure-function state machine)</h3>
        <p>Passive signals (water meter / electricity meter / door sensor / PIR / smoke detector / kettle) are primary; smartwatch/band data is supplementary.
          Only when signals fall silent past a threshold does the system switch to "ask the senior to confirm they're okay" — and only if that fails does it escalate:</p>
        <div class="flow">
          <span class="step">L0 All good</span><span class="arr">→</span>
          <span class="step">L1 Watch</span><span class="arr">→</span>
          <span class="step">L2 Request check-in</span><span class="arr">→</span>
          <span class="step">L3 Family contact</span><span class="arr">→</span>
          <span class="step">L4 Neighbor/building mgmt</span><span class="arr">→</span>
          <span class="step">L5 Community grid officer</span><span class="arr">→</span>
          <span class="step">L6 Emergency services</span>
        </div>
        <p style="margin-top:14px">Four role dashboards work in tandem:</p>
        <ul>
          <li><b>Senior</b>: care mode (extra-large text + voice readout + one-tap family call) — they see "companionship," never "monitoring"</li>
          <li><b>Family</b>: weekly activity rhythm chart + status card + escalation center + health record</li>
          <li><b>Community grid officer</b>: China's distinctly local human-safety-net layer</li>
          <li><b>Device signal console</b>: live visualization of passive signal sources and activity</li>
        </ul>
        <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
          Safety invariants are baked into the state machine: <b>any outreach to third parties (neighbor / grid officer / emergency services) requires manual family approval — the system never contacts anyone automatically</b>.
          A single "I'm fine" from the senior resets any level instantly.</p>`
    },
    {
      label: "Business model",
      html: `<ul>
          <li><b>Platform, not hardware</b>: aggregate <b>existing deployed devices</b> in communities and districts — low marginal cost; differentiation is in "graduated non-intrusion + dual-narrative UX"</li>
          <li><b>Primary payer = district offices / neighborhood committees + home-care service providers</b>: they have government budgets and KPIs; the family and grid-officer dashboards are simply their management interface (To-G/B)</li>
          <li><b>Free consumer tier + upsell</b>: care-mode hardware add-ons, health record cloud storage, etc. — no heavy C-side acquisition cost</li>
        </ul>`
    },
    {
      label: "Market",
      html: `<ul>
          <li><b>Policy tailwind</b>: Shanghai's "Smart Eldercare Innovation Action Plan 2024–2027" explicitly covers both "safety monitoring" and "health services" — two of our core product pillars</li>
          <li><b>Official endorsement pathway</b>: listing in the Smart Healthy Eldercare Promotion Catalog (jointly issued by MIIT + MCA + NHC) = entry into district procurement lists</li>
          <li><b>Proven model</b>: Putuo District's smart water meters / smoke detectors + one-key emergency calling already protect seniors living alone — we're upgrading a validated approach, not educating a new market</li>
          <li><b>Risks (honest)</b>: data compliance is a hard gate; grid-officer availability needs BD validation; government payment cycles are slow and decision chains are long</li>
        </ul>`
    }
  ]
},
{
  id: "style-dna", no: "05", cat: "Fashion",
  kicker: "Fashion · Personal Color Analysis",
  title: "Selfie Color Analysis",
  subtitle: "One selfie — sample real pixels, get your color season and a personalized palette",
  url: "demos/style-dna/", tags: ["Real pixel sampling","Color season","Save & share image","Local processing"],
  phoneHint: "Upload a selfie or pick a sample — see your season and palette (photo processed locally only)",
  sections: [
    { label: "What it is",   html: `<p>A selfie-powered version of the "personal color analysis" session that costs hundreds offline — real pixel sampling, your color season, your palette.</p>` },
    { label: "How it works", html: `<h3>Upload → sample → season + palette</h3>
      <div class="flow"><span class="step">Upload / pick sample</span><span class="arr">→</span><span class="step">Pixel quantization</span><span class="arr">→</span><span class="step">Season + palette</span><span class="arr">→</span><span class="step">Save image</span></div>
      <ul>
        <li><b>Real pixel sampling</b>: downsample the photo, build a hue-quantized histogram, extract the dominant colors by population</li>
        <li><b>Warm/cool + depth</b>: derive overall tone (population-weighted R−B) + skin-region refinement, map to one of the four seasons</li>
        <li><b>Generate palette</b>: produce recommended colors in HSL space by warmth and depth, then match each to the nearest Chinese color name — <b>swap photos and the palette changes</b></li>
      </ul>
      <p style="margin-top:16px">Everything runs in the browser locally — <b>photo never leaves your device, fully offline</b>.</p>` },
    { label: "Business model", html: `<ul>
        <li><b>Diagnosis as top-of-funnel</b>: free season result, paid unlock for full palette guide / makeup recommendations (online version of the House of Colour model)</li>
        <li><b>Affiliate commerce</b>: recommend items by palette, earn e-commerce CPS commission</li>
        <li><b>Subscription</b>: seasonal wardrobe palette updates, daily outfit pairing reminders</li>
        <li><b>B2B</b>: "find your shade" discovery widget for cosmetics and apparel brands</li>
      </ul>` },
    { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
      <ul>
        <li><b>House of Colour</b>: a franchise chain built entirely on four-season color analysis — hundreds of consultants worldwide charging per session, proof that color diagnosis is a standalone business.</li>
        <li><b>Korean personal color diagnosis (퍼스널컬러)</b>: a mature paid service with per-session fees often reaching several hundred yuan and studios on every block.</li>
        <li><b>Style DNA / Drape and similar apps</b>: color and styling diagnosis packaged as subscription tools.</li>
      </ul>
      <ul>
        <li><b>Pain</b>: "what colors suit me" is a high-frequency, fuzzy question; in-person diagnosis is expensive and high-barrier</li>
        <li><b>Who</b>: primarily young women interested in fashion and makeup, with strong social-sharing intent</b></li>
        <li><b>Localization</b>: plugs into Xiaohongshu seeding ecosystem and domestic cosmetics shade libraries</li>
        <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: a single selfie is sensitive to lighting and filters; professional diagnosis still requires standardized light and a trained eye — this demo is pixel heuristics, not a clinical result</li>
      </ul>` }
  ]
},
{
    id: "alta", no: "06", cat: "Fashion",
    kicker: "Fashion · AI Styling",
    title: "Outfit for Every Occasion",
    subtitle: "Import your Taobao purchase history + upload a piece you want to wear → AI builds a complete look, with buy links for whatever's missing",
    url: "demos/alta/", tags: ["Import purchase history","Upload a piece to anchor","AI full-look styling","Buy links included"],
    phoneHint: "Import your wardrobe from Taobao + pick an occasion, see a complete look + buy links",
    sections: [
      { label: "What it is",   html: `<p>No need to log items one by one: <b>connect Taobao</b> and your purchase history becomes a digital wardrobe automatically. Then <b>upload one piece you want to wear</b> and AI builds a complete look around it — occasion by occasion — <b>with direct buy links for anything you're missing</b>. Styling becomes shopping in one closed loop.</p>
        <p class="small" style="color:var(--ink-soft)">Demo uses simulated order data to demonstrate the import flow; the real product uses open e-commerce auth with affiliate-linked product URLs.</p>` },
      { label: "How it works", html: `<h3>Import history + upload anchor piece → AI full look + buy links</h3>
        <div class="flow"><span class="step">Connect Taobao</span><span class="arr">→</span><span class="step">Upload anchor piece</span><span class="arr">→</span><span class="step">Pick occasion</span><span class="arr">→</span><span class="step">AI full look</span><span class="arr">→</span><span class="step">Buy links for gaps</span></div>
        <ul>
          <li><b>Authorized import</b>: reads clothing orders from purchase history → auto-identifies garment type and style, no manual entry needed (demo uses simulated orders)</li>
          <li><b>Upload anchor piece</b>: pin one item to its slot; AI builds the rest of the outfit around it</li>
          <li>Picks tops + bottoms + shoes + accessories from your wardrobe per occasion — <b>switch occasion, swap look</b> — with a formality-match gauge</li>
          <li><b>Buy-link recommendations</b>: identifies which missing piece unlocks the most occasions (core slots weighted above accessories), <b>links directly to Taobao equivalents</b> + one-click try-on</li>
        </ul>
        <p style="margin-top:16px">Look assembly and gap ranking are <b>fully deterministic and local</b>; add an AI key to let the model style and write the shopping copy. Privacy: reads clothing orders only — no payment data, no uploads.</p>` },
      { label: "Business model", html: `<ul>
          <li><b>Affiliate commerce (core)</b>: missing items carry affiliate links — styling triggers purchase, CPS commission</li>
          <li><b>Subscription</b>: unlimited styling, wardrobe analysis, gap alerts (Whering / Cladwell model)</li>
          <li><b>Resale / rental</b>: low-frequency items routed to secondhand and clothing-rental platforms</li>
          <li><b>Data asset</b>: real wardrobe composition and styling preferences — rare signal for brand merchandising</li>
        </ul>` },
      { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
        <ul>
          <li><b>Whering / Acloset / Indyx</b>: digital wardrobe apps that let users photograph their closet, get AI outfit suggestions, and monetize via subscription and affiliate — millions of users.</li>
          <li><b>Stitch Fix (SFIX)</b>: stylist + data → personalized outfit delivery, publicly traded and market-validated.</li>
          <li><b>Cladwell</b>: capsule wardrobe + daily outfit recommendation subscription tool.</li>
        </ul>
        <ul>
          <li><b>Pain</b>: 'full closet, nothing to wear' — outfit decisions happen every single day</li>
          <li><b>Who</b>: style-conscious urbanites with plenty of clothes but weak coordination instincts</li>
          <li><b>Localization</b>: Taobao / JD purchase-history auth, Xiaohongshu style inspiration, domestic e-commerce SKUs</li>
          <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: reading purchase history requires user consent and privacy compliance; styling taste is subjective; this demo uses simulated orders</li>
        </ul>` }
    ]
  },
  {
    id: "fortuna", no: "07", cat: "Finance", featured: true,
    kicker: "Personal Finance · AI Wealth Manager",
    title: "AI Wealth Manager",
    subtitle: "Financial health check → set a goal → asset allocation + Monte Carlo probability of success + action plan, in one closed loop",
    url: "demos/fortuna/", tags: ["Financial health check","Goal-driven","Monte Carlo","Risk allocation","Fully offline"],
    phoneHint: "Fill in a snapshot → set a goal → watch probability update live as you adjust target / timeline / monthly contributions",
    sections: [
      { label: "What it is",   html: `<p>One closed loop that connects 'financial health check' and 'robo-advisor': a few numbers produce a health score and your <b>investable surplus</b>, then you set a goal (home / retirement / education / emergency fund), the system builds an asset allocation from your risk profile, and runs <b>1,000 Monte Carlo market scenarios</b> to tell you 'what's the probability of hitting this in N years' — finishing with a prioritized action plan ordered by the financial pyramid.</p>
        <p class="small" style="color:var(--ink-soft)">Change the goal, timeline, monthly contribution, or risk tolerance — probability and the fan chart recalculate instantly.</p>` },
      { label: "How it works", html: `<h3>Health check → goal → allocation → Monte Carlo → action</h3>
        <div class="flow"><span class="step">Financial snapshot</span><span class="arr">→</span><span class="step">Health score + risk profile</span><span class="arr">→</span><span class="step">Set goal</span><span class="arr">→</span><span class="step">Allocation + probability</span><span class="arr">→</span><span class="step">Action plan</span></div>
        <ul>
          <li><b>Health check</b>: savings rate / debt ratio / emergency fund / expense ratio weighted into a health score; computes net worth and monthly investable surplus</li>
          <li><b>Risk profile</b>: subjective 'willingness' (questionnaire) × objective 'capacity' (age / timeline / emergency fund / debt), capped at the lower of the two → C1–C5</li>
          <li><b>Monte Carlo</b>: runs 1,000 paths using the allocation's expected return and volatility; produces probability of success and a p10/p50/p90 fan chart (deterministic — same inputs, same results)</li>
          <li><b>Action plan</b>: ordered by the 'emergency fund → pay down high-interest debt → invest regularly → add protection' pyramid, referencing your actual numbers</li>
        </ul>
        <p style="margin-top:16px">Scoring, allocation, and Monte Carlo are <b>fully deterministic, local, zero external dependencies</b>; add an AI key to layer on compliant plain-language interpretation. Output section enforces a 'not investment advice' disclaimer.</p>` },
      { label: "Business model", html: `<ul>
          <li><b>AUM fee + premium subscription</b>: goal planning, tax optimization, human advisor add-on (Betterment / Wealthfront model)</li>
          <li><b>Financial product referrals</b>: precisely matched to weak spots — savings accounts, insurance, debt payoff tools — CPA / CPS monetization (Credit Karma model)</li>
          <li><b>B2B / white-label</b>: financial health + advisory engine for banks, brokerages, and employer benefits programs</li>
        </ul>` },
      { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
        <ul>
          <li><b>Betterment / Wealthfront</b>: the two leading US independent robo-advisors — questionnaire-driven risk profiling → automated allocation. Wealthfront's Path product is exactly the 'goal + Monte Carlo probability' framework; together they manage tens of billions.</li>
          <li><b>Origin / Monarch / Rocket Money</b>: subscription tools that aggregate income, savings, debt, and goals into a full financial picture and planning workflow.</li>
          <li><b>Credit Karma (Intuit) / NerdWallet (NRDS)</b>: free score / assessment → financial product referrals — a publicly validated monetization path.</li>
          <li><b>Ant Wealth 'Help You Invest' / Licai Mofang</b>: domestic fund advisory, goal-based accompaniment + portfolio allocation.</li>
        </ul>
        <ul>
          <li><b>Pain</b>: a health check gives you a score but not a next step; an advisor gives you an allocation but never answers 'can I actually hit my goal' — these two have always been separate</li>
          <li><b>Who</b>: mid-career adults with surplus income, a concrete goal (home / kids / retirement), and a desire for clarity without complexity</li>
          <li><b>Localization</b>: requires fund advisory license domestically — partner with licensed institutions; adapt for housing fund / insurance / savings context</li>
          <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: investing is heavily regulated — this demo is a product prototype and calculator only, not investment advice; market assumptions are simplified models and do not predict future returns</li>
        </ul>` }
    ]
  },
  {
    id: "oboe", no: "09", cat: "Education",
    kicker: "Education · AI Course Generation",
    title: "Topic to Course in Seconds",
    subtitle: "Enter any topic → get a mini-course with chapters and quizzes, then a 'mastery report' at the end showing which chapters need more work",
    url: "demos/oboe/", tags: ["Topic becomes a course","Chapters + quizzes","Mastery report","Retry weak questions"],
    phoneHint: "Generate a course → take quizzes → tap 'View Mastery Report'",
    sections: [
      { label: "What it is",   html: `<p>Turn 'I want to learn X' into a structured mini-course with chapters and quizzes — <b>then tell you how much you actually retained</b>. Generated content is just the start; <b>real learning</b> is the goal.</p>` },
      { label: "How it works", html: `<h3>Topic → outline → chapters + quizzes → mastery report</h3>
        <div class="flow"><span class="step">Enter topic</span><span class="arr">→</span><span class="step">Generate outline</span><span class="arr">→</span><span class="step">Chapters + quizzes</span><span class="arr">→</span><span class="step">Mastery report</span><span class="arr">→</span><span class="step">Retry weak questions</span></div>
        <ul>
          <li>Any topic is broken into 5 chapters; each chapter gets key points + 1–2 instantly graded quiz questions</li>
          <li><b>+1: end-of-course mastery</b> — tracks answers per chapter → computes mastery (e.g. 6/8 = 75%) → surfaces weak chapters → focus review</li>
          <li><b>Retry wrong answers</b>: get one right and it's removed from your weak list; mastery score rises in real time (mirrors the Oboe / Khan Academy 'actually learned' loop, not just content generation)</li>
        </ul>
        <p style="margin-top:16px">Local structured generation and mastery tracking run entirely in the browser — <b>works fully offline</b>; add your own key to use a real model for course content and targeted re-explanation of weak spots.</p>` },
      { label: "Business model", html: `<ul>
          <li><b>Subscription</b>: unlimited course generation, saved learning paths, progress tracking (Oboe / Duolingo model)</li>
          <li><b>B2B training</b>: enterprises generate micro-courses on any topic in seconds — seat-based pricing</li>
          <li><b>Content marketplace</b>: high-quality generated courses redistributed with creator revenue share</li>
        </ul>` },
      { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
        <ul>
          <li><b>Oboe (oboe.fyi)</b>: the namesake product — exactly 'enter any topic → instantly generate an AI course.' This demo replicates its core interaction.</li>
          <li><b>Coursera (COUR) / Udemy (UDMY)</b>: online course platforms that prove 'packaging knowledge into structured courses' is a scalable business.</li>
          <li><b>Duolingo (DUOL)</b>: structured lesson-based learning + subscription — profitable with strong retention.</li>
        </ul>
        <ul>
          <li><b>Pain</b>: demand for bite-sized learning is high, but the cost of 'finding or building a structured course' is also high</li>
          <li><b>Who</b>: lifelong learners, exam preppers, corporate training teams</li>
          <li><b>Localization</b>: connect to domestic vocational / certification content; add community check-in features</li>
          <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: accuracy and depth of generated content require human review; this demo uses templatized generation</li>
        </ul>` }
    ]
  },
  {
    id: "adaptive-quiz", no: "10", cat: "Education",
    kicker: "Education · Adaptive Learning",
    title: "Adaptive Quiz",
    subtitle: "Right answer moves difficulty up, wrong answer brings it down — finish with a predicted score, your exact 'ability boundary,' and a targeted ceiling-breaker drill",
    url: "demos/adaptive-quiz/", tags: ["Adaptive difficulty","Predicted score","Ability boundary detection","Ceiling-breaker drill"],
    phoneHint: "Answer questions → see predicted score → tap 'Ceiling-Breaker Drill' to target your boundary",
    sections: [
      { label: "What it is",   html: `<p>Question difficulty adjusts in real time based on your answers, and at the end you get more than a predicted score — <b>you find out exactly where you're stuck and which difficulty level to drill next</b>. Diagnosis goes beyond a single number.</p>` },
      { label: "How it works", html: `<h3>Answer → adaptive → predicted score + ability boundary + ceiling-breaker</h3>
        <div class="flow"><span class="step">Answer</span><span class="arr">→</span><span class="step">Adaptive difficulty</span><span class="arr">→</span><span class="step">Predicted score</span><span class="arr">→</span><span class="step">Ability boundary</span><span class="arr">→</span><span class="step">Ceiling-breaker ×5</span></div>
        <ul>
          <li>An ability estimate is maintained per question: correct → adjust up, wrong → adjust down; next question is drawn at current difficulty, converging to your true level</li>
          <li><b>+1: ability boundary</b> — derives from the difficulty trajectory: 'you consistently handle up to difficulty X; your boundary is difficulty X+1' (since adaptive downgrading re-tests lower difficulties at the end, boundary is pegged to the highest difficulty you've answered correctly — always consistent)</li>
          <li><b>+1: ceiling-breaker drill</b> — five consecutive questions fixed at your boundary difficulty (no further adaptation), to see if you can break through — modeled on Riiid's 'targeted weak-point practice'</li>
        </ul>
        <p style="margin-top:16px">Simplified IRT / CAT logic and boundary detection run entirely in the browser — <b>fully offline</b>; add a key to have AI generate on-demand questions at any difficulty for any topic.</p>` },
      { label: "Business model", html: `<ul>
          <li><b>Exam prep subscription</b>: adaptive drilling + predicted score + weak-spot targeting (Riiid / Santa model)</li>
          <li><b>B2B</b>: diagnostic and leveling assessments for schools and training institutions</li>
          <li><b>Certification testing</b>: wire the predicted score into formal exam prep pipelines</li>
        </ul>` },
      { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
        <ul>
          <li><b>Riiid 'Santa' (Korea/Japan)</b>: AI adaptive TOEIC drilling — recommends questions by predicted score, subscription-based, millions of users.</li>
          <li><b>GRE / GMAT Computer Adaptive Test (ETS / GMAC)</b>: harder after correct, easier after wrong — CAT is the established paradigm for high-stakes standardized tests.</li>
          <li><b>Duolingo (DUOL)</b>: uses adaptive and predictive models for personalized practice and retention.</li>
        </ul>
        <ul>
          <li><b>Pain</b>: grinding through endless questions with no idea which difficulty level you're actually stuck at</li>
          <li><b>Who</b>: exam preppers for professional certifications, overseas study, and K–12 testing</li>
          <li><b>Localization</b>: connect to domestic postgrad entrance / civil service / CET-4&6 question banks</li>
          <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: prediction accuracy depends on large question banks and real response data; this demo is a simplified prototype</li>
        </ul>` }
    ]
  },
{
    id: "final-round", no: "11", cat: "Hiring",
    kicker: "Hiring · AI Mock Interview",
    title: "Mock Interview",
    subtitle: "Pick a role, get AI-generated questions, receive structured feedback on your actual answer",
    url: "demos/final-round/", tags: ["Mock interview","STAR feedback","Feedback on your real answer","Fully offline"],
    phoneHint: "Pick a role, answer one question, see three-dimension structured feedback",
    sections: [
      { label: "What it is",   html: `<p>Pick a role → AI generates an interview question → get three-part STAR / specificity / improvement feedback keyed to what you actually said.</p>` },
      { label: "How it works", html: `<h3>Pick role → Generate question → Structured feedback</h3>
        <div class="flow"><span class="step">Pick role</span><span class="arr">→</span><span class="step">AI question</span><span class="arr">→</span><span class="step">STAR / Specificity / Suggestion</span><span class="arr">→</span><span class="step">Share</span></div>
        <ul>
          <li>Different roles surface different questions</li>
          <li>Feedback is three structured scores <b>grounded in what you actually wrote</b> (quotes your own sentences) — not a generic template</li>
          <li>Delivers actionable rewrite suggestions</li>
        </ul>
        <p style="margin-top:16px">Local text heuristics (structure / keywords / length signals), <b>zero external dependencies, fully offline</b>.</p>` },
      { label: "Business model", html: `<ul>
          <li><b>B2C subscription</b>: unlimited mock sessions, role question bank, expression reports (Final Round AI / Yoodli model)</li>
          <li><b>B2B screening</b>: standardized AI interviews and scoring for employers (HireVue model)</li>
          <li><b>Campus partnerships</b>: university career centers, training institutions</li>
        </ul>` },
      { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
        <ul>
          <li><b>Final Round AI</b>: same-name product — interview simulation + real-time coaching on subscription; this demo replicates its question → answer → feedback core loop.</li>
          <li><b>Yoodli</b>: AI communication / interview coach, structured feedback on delivery quality, subscription revenue.</li>
          <li><b>HireVue</b>: enterprise AI interview assessment used by large employers for initial screening, B2B paid.</li>
        </ul>
        <ul>
          <li><b>Pain</b>: interview anxiety, no feedback loop, no practice partner</li>
          <li><b>Who</b>: new graduates, career switchers, job hoppers</li>
          <li><b>Localization</b>: integrate domestic industry question banks and Chinese expression scoring</li>
          <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: assessment fairness under scrutiny; this demo uses heuristic feedback and makes no judgment on real human ability</li>
        </ul>` }
    ]
  },
  {
    id: "clause-risk", no: "12", cat: "Legal",
    kicker: "Legal Tech · Pre-sign Advisor",
    title: "Contract Pre-sign Advisor",
    subtitle: "Paste a clause + pick your side → sign or not, which lines are non-negotiable, what protection is missing, then get a ready-to-send redline email",
    url: "demos/clause-risk/", tags: ["Side-aware reading","Tilt verdict","Must-fix / Nice-to-have tiering","Missing clause detection","One-click redline email"],
    phoneHint: "Pick your side, paste a clause — see the tilt verdict and redline email",
    sections: [
      { label: "What it is",   html: `<p>It does more than flag red flags — it makes the call for you: first pick whether you are the tenant / vendor / job applicant… whichever side, then it reads the document to judge <b>who it favors and whether you should sign</b>, splits risks into <b>'must-fix' and 'worth pushing for'</b>, surfaces <b>protections that should be there but aren't</b>, and generates a <b>ready-to-send redline email</b> with one click.</p>` },
      { label: "How it works", html: `<h3>Pick side → Highlight → Tilt verdict → Must-fix / Missing → Redline email</h3>
        <div class="flow"><span class="step">Pick your side</span><span class="arr">→</span><span class="step">Highlight real text</span><span class="arr">→</span><span class="step">Tilt verdict</span><span class="arr">→</span><span class="step">Must-fix / Nice-to-have + Missing clauses</span><span class="arr">→</span><span class="step">One-click redline email</span></div>
        <ul>
          <li>Highlights are always <b>real sentences from your pasted text</b> (regex matchAll; even AI is forced to verify the string exists in the source before marking it) — <b>never fabricated highlights</b></li>
          <li>The same clause <b>flips interpretation with your side</b>: a trap for the weaker signing party becomes a shield for the party that drafted it — switch roles and the verdict and email recalculate instantly</li>
          <li>Tilt score + one-line verdict (hold off / negotiate first / safe to sign); risks split into must-fix and nice-to-have</li>
          <li>'Missing clauses' catches what regex can't see: <b>liability caps, reciprocal termination rights, counterparty breach remedies, data deletion</b> — protections that should be standard but aren't there</li>
        </ul>
        <p style="margin-top:16px">Logic layer is <b>fully local, fully offline</b>; connect an API key to use a real model for risk extraction and email polishing. Includes a 'not legal advice' disclaimer.</p>` },
      { label: "Business model", html: `<ul>
          <li><b>Enterprise subscription</b>: automated first-pass review of legal / sales contracts, priced per seat or usage (LawGeex / Spellbook model)</li>
          <li><b>CLM platform</b>: full contract lifecycle — draft, review, sign, archive (Ironclad model)</li>
          <li><b>B2C / SMB</b>: lightweight 'pre-sign checkup' subscription for individuals and small businesses</li>
        </ul>` },
      { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
        <ul>
          <li><b>LawGeex</b>: AI auto-reviews contracts against company standards and flags risk — enterprise paid, a flagship in AI contract review.</li>
          <li><b>Spellbook / Robin AI</b>: AI assistants for drafting and reviewing contracts, subscription model, actively fundraising.</li>
          <li><b>Luminance / Ironclad</b>: legal AI and full-lifecycle CLM serving large corporate legal teams, valued at unicorn level.</li>
        </ul>
        <ul>
          <li><b>Pain</b>: individuals and small businesses can't parse contracts; hiring a lawyer is expensive; no gatekeeper before signing</li>
          <li><b>Who</b>: SMBs, freelancers, individuals signing contracts</li>
          <li><b>Localization</b>: integrate Chinese contract law context and standard boilerplate clause library</li>
          <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: legal judgment requires a professional; this demo is an interactive showcase only — not legal advice</li>
        </ul>` }
    ]
  },
  {
    id: "ubie", no: "13", cat: "Health",
    kicker: "Digital Health · Symptom Check",
    title: "Symptom Self-triage",
    subtitle: "Describe your symptoms, answer adaptive follow-ups, get a 3-tier care recommendation — plus which department to see and a visit summary card for your doctor",
    url: "demos/ubie/", tags: ["Adaptive follow-up","3-tier triage","Which department to see","Visit summary card"],
    phoneHint: "Pick chief complaint → answer follow-ups → see tier + department + summary card",
    sections: [
      { label: "What it is",   html: `<p>Describe what's wrong → it asks follow-up questions like a triage nurse → tells you whether to self-monitor, use a telemedicine service, or go to the ER right now, <b>then tells you which department to book and generates a summary card you can bring to the hospital or share with an online doctor</b> — because after the triage tier, the real question is 'where do I go and what do I say?'</p>` },
      { label: "How it works", html: `<h3>Chief complaint → Follow-ups → 3-tier recommendation + Department + Summary card</h3>
        <div class="flow"><span class="step">Describe symptoms</span><span class="arr">→</span><span class="step">Adaptive follow-ups</span><span class="arr">→</span><span class="step">3-tier recommendation</span><span class="arr">→</span><span class="step">Which department</span><span class="arr">→</span><span class="step">Visit summary card</span></div>
        <ul>
          <li>Different chief complaints / yes-no answers branch into <b>different follow-up paths</b> (decision tree), urgency tier assigned from responses</li>
          <li><b>+1: Which department</b> — routes by complaint and tier (e.g. chest pain → Cardiology / ER chest pain center; headache → Neurology), matching Ubie's core 'symptom → department' value</li>
          <li><b>+1: Visit summary card</b> — organizes chief complaint / key symptoms / red flags / questions to ask the doctor into a one-tap-copy card to bring to the hospital or send to an online doctor (solves 'can't explain it clearly in person')</li>
        </ul>
        <p style="margin-top:16px">Local decision tree + rules + routing all run in browser, <b>fully offline</b>; connecting an API key adds AI-personalized interpretation. Routing and the summary card are navigation / organization only — <b>not a diagnosis</b>. Includes a 'not a medical diagnosis' disclaimer.</p>` },
      { label: "Business model", html: `<ul>
          <li><b>Triage-to-consult funnel</b>: route users to telemedicine or in-person departments, revenue share per consult / conversion (K Health model)</li>
          <li><b>B2B</b>: intelligent triage entry point for hospitals / insurers / pharma (Ubie / Ada Health institutional partnership model)</li>
          <li><b>Cost reduction</b>: reduce unnecessary ER overload — valuable to public health insurance and private insurers</li>
        </ul>` },
      { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
        <ul>
          <li><b>Ubie (Japan)</b>: the namesake AI symptom checker and triage tool, large user base, partnerships with hospitals and pharma — this demo replicates its interaction model.</li>
          <li><b>Ada Health (Germany)</b>: AI symptom assessment, tens of millions of assessments globally, partnered with insurers and health systems.</li>
          <li><b>K Health (USA)</b>: symptom checker + telemedicine in one product, subscription plus per-consult revenue.</li>
        </ul>
        <ul>
          <li><b>Pain</b>: 'Do I need to go to the hospital?' is a high-frequency anxiety moment — self-searching online tends to terrify rather than inform</li>
          <li><b>Who</b>: ordinary families, chronic condition patients, underserved areas</li>
          <li><b>Localization</b>: integrate with domestic internet hospitals and tiered-care policy</li>
          <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: healthcare is heavily regulated; safety first — this demo is an interactive showcase only, not a medical diagnosis</li>
        </ul>` }
    ]
  },
  {
    id: "nl-home", no: "14", cat: "Real Estate",
    kicker: "PropTech · Natural Language Search",
    title: "Find a Home in Plain English",
    subtitle: "Describe your dream home in your own words — constraints are actually parsed and filtered; then see honestly which wish-list item to drop and how many more listings that unlocks",
    url: "demos/nl-home/", tags: ["Natural language parsing","Constraint filtering","Wish-list trade-off radar","Relax & re-search to unlock more","Fully offline"],
    phoneHint: "Type a one-sentence need, see matched listings and 'what to drop'",
    sections: [
      { label: "What it is",   html: `<p>Parses 'two bedrooms, budget ¥3M, near a subway stop, not too old' into real filter criteria and actually runs them against listings. <b>Goes further</b> — instead of just showing matches or returning '0 results', it tells you honestly when your wish list is fighting itself: <b>which single item to relax, and how many more listings that opens up</b>. Budget gets the most actionable version: 'add ¥Xk and unlock N more listings' — one tap to relax and re-search.</p>` },
      { label: "How it works", html: `<h3>One sentence → Parse constraints → Match + Wish-list trade-off radar</h3>
        <div class="flow"><span class="step">Type one sentence</span><span class="arr">→</span><span class="step">Parse constraints</span><span class="arr">→</span><span class="step">Filter + match reason</span><span class="arr">→</span><span class="step">What to drop (relax & re-search)</span></div>
        <ul>
          <li>Extracts bedrooms / budget / city / age and other constraints from free text; <b>listings that violate hard constraints are hidden</b> (real filtering, not cosmetic)</li>
          <li><b>Trade-off radar</b>: counterfactual simulation on each hard constraint — how many listings does relaxing it unlock; budget gets the cheapest step ('add ¥Xk → +N listings'); recommends the single best concession, one tap to relax and re-run</li>
          <li>Also surfaces 'you listed N nice-to-haves but no listing hits all of them — the best match hits M' — cleanly separates hard filters from bonus points</li>
        </ul>
        <p style="margin-top:16px">Lightweight local NLP (keyword + numeric extraction) + filtering + trade-off simulation — <b>logic layer fully local, fully offline</b>; API key only used to upgrade parsing with a real model.</p>` },
      { label: "Business model", html: `<ul>
          <li><b>Agent / listing lead-gen</b>: high-intent demand billed per lead or transaction (Zillow / Rightmove model)</li>
          <li><b>Featured placement and ads</b>: listing exposure, agent memberships</li>
          <li><b>Financial referrals</b>: mortgage / renovation / insurance commission</li>
        </ul>` },
      { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
        <ul>
          <li><b>Zillow (ZG) / Redfin (RDFN)</b>: the largest online real estate platforms in North America, both have shipped natural language search, monetized through agent lead-gen and advertising.</li>
          <li><b>Rightmove (RMV)</b>: UK property portal with a high-margin lead / membership model.</li>
        </ul>
        <ul>
          <li><b>Pain</b>: traditional search forces users to tick filters one by one — impossible to express 'the vibe I'm looking for'</li>
          <li><b>Who</b>: urban home buyers and renters</li>
          <li><b>Localization</b>: integrate Beike / Anjuke-style listings and city-level datasets</li>
          <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: listing accuracy and freshness are existential; this demo uses sample listings for parsing demonstration only</li>
        </ul>` }
    ]
  },
{
    id: "mindtrip", no: "15", cat: "Travel",
    kicker: "Travel · AI Itinerary Planner",
    title: "Itinerary + Map",
    subtitle: "Tell it where you want to go → AI fills in the local highlights, a smart local engine builds an expert hour-by-hour itinerary + interactive map",
    url: "demos/mindtrip/", tags: ["Any city","Expert scheduling","Interactive map","Edit on the fly"],
    phoneHint: "Enter a city + special requirements, see an expert hour-by-hour itinerary with map pins",
    sections: [
      { label: "What it is",   html: `<p>Type any <b>city</b> (add requirements like "traveling with a 3-year-old and elderly parents with limited mobility"), and AI fills in the best local spots. A local engine then arranges them into an <b>expert hour-by-hour itinerary</b> — restaurants at mealtimes, temples and nature in the daytime, night markets and scenic spots in the evening — clustered by neighborhood, routed efficiently, and plotted on a map. Afterward you can 📌 pin / ↻ swap / ✕ remove any item on the spot.</p>
        <p class="small" style="color:var(--ink-soft)">Without an AI connection, four built-in cities — Kyoto, Lisbon, Chiang Mai, Reykjavik — load instantly offline.</p>` },
      { label: "How it works", html: `<h3>City → AI fills POIs → Local smart scheduler → Itinerary + Map</h3>
        <div class="flow"><span class="step">Enter city + requirements</span><span class="arr">→</span><span class="step">AI fills POIs</span><span class="arr">→</span><span class="step">Smart scheduling</span><span class="arr">→</span><span class="step">Hour-by-hour list + Map</span><span class="arr">→</span><span class="step">Edit on the fly</span></div>
        <ul>
          <li><b>AI handles only "finding spots"</b>: given the city and your requirements, it returns places with type, operating hours, neighborhood, and relative coordinates</li>
          <li><b>Scheduling is a local engine (deterministic, no AI)</b>: time-slot affinity places meals, daytime, and evening stops correctly — no "temple visit at midnight"; all stops are chained into an efficient route then split into days, each day naturally covering one contiguous neighborhood</li>
          <li>Every itinerary item has a <b>numbered pin on the map</b>; clicking an entry or a pin cross-highlights the other; the map is color-coded by day</li>
          <li>Pin / swap / remove / regenerate a full set — <b>instant re-scheduling</b></li>
        </ul>
        <p style="margin-top:16px">Clear division of labor: AI handles "long-tail local knowledge," the local engine handles "deterministic scheduling and rendering." <b>The map is an inline SVG with zero external dependencies.</b></p>` },
      { label: "Business model", html: `<ul>
          <li><b>Booking commissions</b>: hotels, tickets, and transport inside the itinerary link directly to booking — CPS revenue share (OTA model)</li>
          <li><b>Subscription</b>: advanced planning, multi-person collaboration, offline itineraries</li>
          <li><b>Destination marketing</b>: paid placement for attractions and tourism boards</li>
        </ul>` },
      { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
        <ul>
          <li><b>Mindtrip (mindtrip.ai)</b>: the eponymous AI travel planning platform combining itineraries with an interactive map; actively fundraising. This demo recreates its core experience.</li>
          <li><b>Layla / Wonderplan / Roam Around</b>: AI itinerary generators that monetize via booking referrals.</li>
          <li><b>Booking / Expedia (EXPE)</b>: OTA giants that prove converting "planning → booking" into commissions is a massive business.</li>
        </ul>
        <ul>
          <li><b>Pain</b>: building a travel plan is time-consuming, and itineraries are always disconnected from maps</li>
          <li><b>Who</b>: independent travelers, family trips, deep-dive explorers</li>
          <li><b>Localization</b>: connect AI-generated POIs to real coordinates, hours, ratings, and booking ecosystems via Amap / Dianping</li>
          <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: AI-generated POIs need verification against actual operating status and bookability; coordinates in this demo are relative approximations and the map is an abstract schematic</li>
        </ul>` }
    ]
  },
  {
    id: "insure-need", no: "18", cat: "Insurance",
    kicker: "InsurTech · Coverage Calculator",
    title: "How Much Coverage Do You Need",
    subtitle: "Answer a few lifestyle questions, get recommended coverage amounts and policy types — then translated into 'roughly how much per year, what % of your income, and what to buy first if budget is tight'",
    url: "demos/insure-need/", tags: ["Needs-based calculation","Premium budget check","% of income vs 10/10 rule","What to buy first","Fully offline"],
    phoneHint: "Enter age / income / family / liabilities, see coverage amounts + premium health check",
    sections: [
      { label: "What it is",   html: `<p>Answer a few questions about income, family situation, and debts. The "needs method" calculates how much coverage you should have and what types to buy. But we go <b>further</b> — most tools stop at coverage amounts (because they profit from selling products and won't discuss costs). Here we translate that into an <b>estimated annual premium, what % of your income that is (benchmarked against the "10/10 rule" — healthy if ≤10%), and which policy to buy first if budget is limited</b>. We also surface the counterintuitive truth: "insure the adults before the kids."</p>` },
      { label: "How it works", html: `<h3>Lifestyle questions → Coverage gap → Policy priorities + Premium budget check</h3>
        <div class="flow"><span class="step">Answer 6 questions</span><span class="arr">→</span><span class="step">Needs method gap calc</span><span class="arr">→</span><span class="step">Policy priority + ¥/yr</span><span class="arr">→</span><span class="step">% of income + what to buy first</span></div>
        <ul>
          <li>Needs method: life insurance gap = income replacement + debts + children's education − existing coverage; critical illness ≈ 3–5 years of income — <b>updates in real time with age, family, income, and liabilities</b></li>
          <li><b>Premium budget check</b>: converts coverage into an estimated annual premium → % of annual income vs the "10/10 rule" threshold (premium ≤ 10% of income) → if over-weighted, suggests the sequence "medical/accident first for baseline → term life for highest leverage → critical illness last as it's most expensive"</li>
          <li>If children are in the picture, calls out "insure the adults first" — you are the child's most important policy</li>
        </ul>
        <p style="margin-top:16px">Coverage gaps are calculated locally and deterministically (DIME method), <b>fully offline</b>. Premiums are rough estimates only — <b>strong disclaimer applies</b>. Connect an API key to add AI-personalized commentary.</p>` },
      { label: "Business model", html: `<ul>
          <li><b>Policy commissions</b>: post-calculation, route users to comparison / purchase — revenue share per policy (Policygenius / Ladder model)</li>
          <li><b>Lead generation</b>: high-intent users referred to insurers or brokers</li>
          <li><b>B2B</b>: embedded as an insurance calculator widget for banks and platforms</li>
        </ul>` },
      { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
        <ul>
          <li><b>Policygenius</b>: online insurance needs assessment + comparison + purchase, profitable on policy commissions.</li>
          <li><b>Ladder / Ethos / Haven Life</b>: fully online life insurance — needs assessment and policy issuance in minutes, DTC model.</li>
          <li><b>Lemonade (LMND)</b>: AI-driven insurer, publicly listed, proving InsurTech is scalable.</li>
        </ul>
        <ul>
          <li><b>Pain</b>: most people have no idea how much coverage to buy or what type — and fear being oversold by agents</li>
          <li><b>Who</b>: young-to-middle-aged adults with mortgages and dependent children</li>
          <li><b>Localization</b>: map to domestic critical illness / life / medical insurance products and regulatory categories</li>
          <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: insurance products require compliance and actuarial sign-off; this demo is an interactive illustration only, not insurance advice</li>
        </ul>` }
    ]
  },
  {
    id: "matchmaker", no: "19", cat: "Dating",
    kicker: "Dating · AI Matchmaker",
    title: "Conversational Precision Matching",
    subtitle: "No wall of profiles — just one person + a traceable 'why this person'",
    url: "demos/matchmaker/", tags: ["Single candidate","Traceable reasoning","No compatibility score","Fully offline"],
    phoneHint: "Answer a few questions, see a single recommendation with reasoning",
    sections: [
      { label: "What it is",   html: `<p>No stacks of profile cards — just one precision match, with a clear explanation of which of your answers informed it.</p>` },
      { label: "How it works", html: `<h3>Answer questions → Precision match → Single candidate + Reasoning</h3>
        <div class="flow"><span class="step">Answer a few questions</span><span class="arr">→</span><span class="step">Precision match</span><span class="arr">→</span><span class="step">Single candidate + Reasoning</span><span class="arr">→</span><span class="step">Share</span></div>
        <ul>
          <li><b>Returns only one</b> candidate — no wall of profiles</li>
          <li>Reasoning <b>cites specific points from your answers</b> — fully traceable</li>
          <li>Deliberately <b>no compatibility percentage score</b> — people aren't numbers</li>
        </ul>
        <p style="margin-top:16px">Local matching + reasoning generation. <b>Zero external dependencies, fully offline.</b></p>` },
      { label: "Business model", html: `<ul>
          <li><b>Subscription</b>: premium matches, see who likes you (Hinge / Coffee Meets Bagel model)</li>
          <li><b>Human matchmaker upsell</b>: AI first-pass + human deep-match as a high-ticket service (Tawkify model)</li>
          <li><b>In-person events</b>: social and dating events for precision-matched groups</li>
        </ul>` },
      { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
        <ul>
          <li><b>Hinge (Match Group)</b>: built "to be deleted" — small daily curated suggestions with shared-interest callouts; paid subscription model.</li>
          <li><b>Coffee Meets Bagel</b>: limited daily recommendations, quality over quantity; subscription revenue.</li>
          <li><b>Tawkify</b>: paid human matchmaking service — one introduction at a time, with a written match rationale — proving people will pay a premium for "precision + reasoning."</li>
        </ul>
        <ul>
          <li><b>Pain</b>: swipe fatigue, overwhelming low-quality matches, no idea "why this person"</li>
          <li><b>Who</b>: serious relationship seekers tired of casual dating apps</li>
          <li><b>Localization</b>: connect to domestic real-name dating verification and offline matchmaking scenarios</li>
          <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: dating involves real relationships and safety; strict vetting required; this demo uses fictional candidates for illustration</li>
        </ul>` }
    ]
  },
  {
    id: "pet-health", no: "20", cat: "Pets",
    kicker: "Pet Health · Photo Self-Check",
    title: "Pet Photo Health Check",
    subtitle: "Photograph eyes or skin, get a health score + observations + whether to see a vet",
    url: "demos/pet-health/", tags: ["Photo analysis","Health score","Observations","Fully offline"],
    phoneHint: "Take or upload a pet photo, see health score and observation suggestions",
    sections: [
      { label: "What it is",   html: `<p>Snap a photo of your cat's or dog's eyes or skin, get a health score, a few observations, and a recommendation on whether to visit a vet.</p>` },
      { label: "How it works", html: `<h3>Photo → Analysis → Health report</h3>
        <div class="flow"><span class="step">Take/upload photo</span><span class="arr">→</span><span class="step">Analyze</span><span class="arr">→</span><span class="step">Health score + Observations + See a vet?</span><span class="arr">→</span><span class="step">Share</span></div>
        <ul>
          <li>End-to-end: photo → analysis → report</li>
          <li>Returns health score + observations + vet recommendation</li>
          <li>Includes a "not veterinary advice" disclaimer</li>
        </ul>
        <p style="margin-top:16px">Local image heuristics + rule-based report. <b>Zero external dependencies, fully offline.</b></p>` },
      { label: "Business model", html: `<ul>
          <li><b>Subscription</b>: regular self-checks, health records, anomaly alerts (TTcare model)</li>
          <li><b>Referral fees</b>: flag anomalies and route to online or offline pet clinics</li>
          <li><b>Commerce</b>: recommend food, grooming products, or supplements based on findings</li>
          <li><b>Insurance</b>: integrate with pet insurance for underwriting and claims</li>
        </ul>` },
      { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
        <ul>
          <li><b>TTcare (South Korea)</b>: AI pet health screening via smartphone photos of eyes and skin — commercially live, launched in multiple countries, award-winning.</li>
          <li><b>Petriage</b>: pet symptom assessment + triage, subscription service partnered with clinics.</li>
          <li><b>Dinbeat / Scout and others</b>: pet health monitoring hardware + data services.</li>
        </ul>
        <ul>
          <li><b>Pain</b>: pets can't speak, vet bills are high, owners are anxious and lack early screening tools</li>
          <li><b>Who</b>: young cat and dog owners with high emotional investment in their pets</li>
          <li><b>Localization</b>: connect to domestic pet clinic networks and pet e-commerce ecosystems</li>
          <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: pet health decisions require a licensed veterinarian; this demo is an interactive illustration only, not a diagnosis</li>
        </ul>` }
    ]
  },
{
    id: "pet-vet", no: "21", cat: "Pets",
    kicker: "Veterinary · Clinical Scribe",
    title: "AI Veterinary Scribe",
    subtitle: "Paste a quick consult note → SOAP record + differential diagnosis + client discharge instructions + fee estimate — give vets their time back",
    url: "demos/pet-vet/", tags: ["Consult note → record","SOAP / differentials","Discharge instructions + fees","Offline fallback examples","Live model with BYOK"],
    phoneHint: "Pick a sample case or paste a consult note → generate the full document set",
    sections: [
      { label: "What it is",   html: `<p>Vets hate charting — 2–3 hours a day lost to paperwork. This is an <b>AI Scribe</b> for <b>licensed veterinarians</b>: turn a rough spoken consult note into a full set of structured records in 30 seconds. <b>AI drafts, vet reviews</b> — it never replaces clinical judgment.</p>` },
      { label: "How it works", html: `<h3>One consult note → four-piece document set</h3>
        <div class="flow"><span class="step">Consult note</span><span class="arr">→</span><span class="step">SOAP record</span><span class="arr">→</span><span class="step">Ranked differentials</span><span class="arr">→</span><span class="step">Discharge instructions</span><span class="arr">→</span><span class="step">Fee estimate</span></div>
        <ul>
          <li><b>SOAP</b>: Chief complaint / objective findings / assessment / plan — objective and inferred clearly separated</li>
          <li><b>Differentials</b>: Ranked by likelihood (high / moderate / low) with supporting evidence and recommended workup — advisory only, for vet review</li>
          <li><b>Discharge instructions</b>: Medical language converted into plain-language owner handouts (home care / medications / follow-up / red flags)</li>
          <li><b>Fee estimate</b>: Itemised range totals by recommended workup — every section one-click copyable into the practice system</li>
        </ul>
        <p style="margin-top:16px">Four sample cases render the complete document set <b>fully offline</b> (fallback + demo); any consult note with BYOK generates the same structure via the live model. Drug entries give category/principle only — no exact dosing — with a prominent disclaimer.</p>` },
      { label: "Business model", html: `<ul>
          <li><b>Per-vet / per-clinic subscription (SaaS)</b>: Saving 2–3 hours of charting per day translates directly into additional appointments — strong willingness to pay</li>
          <li><b>Embedded in practice management systems (PIMS)</b>: One-click back-fill of records, discharge notes, and estimates; per-seat pricing</li>
          <li><b>Add-ons</b>: Client communication scripts, follow-up reminders, automated insurance claim preparation</li>
        </ul>` },
      { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
        <ul>
          <li><b>Scribenote / Talkatoo / ScribbleVet</b>: Vet-specific AI clinical scribes on monthly subscriptions — already the breakout segment in veterinary practice tech.</li>
          <li><b>Human medicine has validated the model</b>: Ambient AI scribes like Abridge and Nuance DAX are charging at scale on the physician side — veterinary is the same pain point one step over.</li>
          <li><b>Pain is real</b>: Charting burden is the number-one driver of vet burnout; time spent on records directly cannibalises appointment capacity and revenue.</li>
        </ul>
        <ul>
          <li><b>Who</b>: Independent clinics, small-to-mid chains, solo-practitioner vets</li>
          <li><b>Localization</b>: Integrates with domestic veterinary HIS, Chinese-language record standards, and local disease prevalence libraries</li>
          <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: Clinical responsibility rests with the licensed vet; this tool produces <b>drafts for review only</b>. This demo is an interactive showcase — not veterinary advice.</li>
        </ul>` }
    ]
  },

  {
    id: "coddle", no: "22", cat: "Parenting",
    kicker: "Parenting · Age-by-age Guidance",
    title: "Month-by-month Baby Guide",
    subtitle: "Log a note, get personalised guidance matched to your baby's age — same entry, different advice at different stages",
    url: "demos/coddle/", tags: ["Age-adaptive","Personalised guidance","Quick logging","Fully offline"],
    phoneHint: "Log a note + select age, see the matched guidance",
    sections: [
      { label: "What it is",   html: `<p>Jot down 'what's going on with baby today' and get targeted advice matched to their current age.</p>` },
      { label: "How it works", html: `<h3>Log + age → match → personalised guidance</h3>
        <div class="flow"><span class="step">Log a note + select age</span><span class="arr">→</span><span class="step">Match age rules</span><span class="arr">→</span><span class="step">Personalised guidance</span><span class="arr">→</span><span class="step">Share</span></div>
        <ul>
          <li>The same entry produces <b>different guidance at different ages</b> (e.g. 'night waking' at 3 months vs 9 months calls for different responses)</li>
          <li>Recommendations aligned to developmental milestones by month</li>
        </ul>
        <p style="margin-top:16px">Matched against a local age-rule library — <b>zero external dependencies, fully offline</b>.</p>` },
      { label: "Business model", html: `<ul>
          <li><b>Subscription</b>: Growth log + personalised guidance + milestone reminders (Huckleberry / Wonder Weeks model)</li>
          <li><b>Mother-and-baby commerce</b>: Age-matched product, food, and toy recommendations</li>
          <li><b>Content / courses</b>: Stage-specific parenting courses and expert Q&A</li>
        </ul>` },
      { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
        <ul>
          <li><b>Huckleberry</b>: Baby sleep and routine tracking with AI personalised guidance — subscription model, widely loved.</li>
          <li><b>The Wonder Weeks</b>: Paid app that explains developmental leaps by age; a global bestseller.</li>
          <li><b>BabyCenter</b>: Massive parenting platform delivering weekly and monthly content; advertising and commerce monetisation.</li>
        </ul>
        <ul>
          <li><b>Pain</b>: Parenting information is endless but not age-staged — parents are overwhelmed</li>
          <li><b>Who</b>: Parents of babies aged 0–3</li>
          <li><b>Localization</b>: Integrates with domestic parenting standards and mother-and-baby commerce</li>
          <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: Parenting guidance requires professional oversight. This demo is an interactive showcase — not medical advice.</li>
        </ul>` }
    ]
  },

  {
    id: "mood-journal", no: "23", cat: "Mental Health",
    kicker: "Mental Health · Mood Tracking",
    title: "Mood Journal",
    subtitle: "Write how you feel — a few entries build your mood curve and trigger word cloud",
    url: "demos/mood-journal/", tags: ["Mood curve","Trigger word cloud","Trend insights","Fully offline"],
    phoneHint: "Write a few mood entries, see the curve and word cloud",
    sections: [
      { label: "What it is",   html: `<p>Log your mood as you go — a handful of entries is enough to draw your emotional curve and surface your most frequent triggers.</p>` },
      { label: "How it works", html: `<h3>Log → aggregate → curve + word cloud</h3>
        <div class="flow"><span class="step">Write multiple moods</span><span class="arr">→</span><span class="step">Analyse</span><span class="arr">→</span><span class="step">Mood curve + trigger word cloud</span><span class="arr">→</span><span class="step">Share</span></div>
        <ul>
          <li>Multiple entries charted chronologically into a <b>mood curve</b></li>
          <li>High-frequency words extracted from your writing into a <b>trigger word cloud</b></li>
          <li>The more you log, the clearer the patterns and triggers</li>
        </ul>
        <p style="margin-top:16px">Local sentiment scoring and word-frequency analysis — <b>zero external dependencies, fully offline</b>. Includes a 'not a mental-health service' disclaimer.</p>` },
      { label: "Business model", html: `<ul>
          <li><b>Subscription</b>: Long-term trends, reminders, export, deeper insights (Daylio / Reflectly model)</li>
          <li><b>Digital therapeutics / B2B</b>: AI conversation coaching, EAP and insurance integrations (Wysa / Woebot model)</li>
          <li><b>Content</b>: Meditation and emotional-wellbeing courses</li>
        </ul>` },
      { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
        <ul>
          <li><b>Daylio</b>: Minimal mood and habit tracker that generates emotional trend charts — subscription model, tens of millions of users.</li>
          <li><b>How We Feel / Reflectly</b>: Mood-journal apps with trend and insight features; subscription revenue.</li>
          <li><b>Wysa / Woebot</b>: Mood tracking paired with AI conversation, expanded into B2B and insurance.</li>
        </ul>
        <ul>
          <li><b>Pain</b>: Emotional swings are hard to articulate; people want self-awareness but lack the tools</li>
          <li><b>Who</b>: Young adults focused on mental wellness and self-reflection</li>
          <li><b>Localization</b>: Aligned with domestic mental-health content and privacy compliance</li>
          <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: Mental-health content requires care. This demo is an interactive showcase — not a mental-health service, diagnosis, or treatment.</li>
        </ul>` }
    ]
  },

  {
    id: "dinner", no: "24", cat: "Food",
    kicker: "Food · AIGC / Unstructured Extraction",
    title: "What's for Dinner",
    subtitle: "Paste a food post → AI turns it on the spot into a step-by-step recipe you can cook tonight",
    url: "demos/dinner/",
    tags: ["Unstructured → structured", "Strict JSON contract", "Graceful boundary fallback", "Pure front-end SVG illustration", "One-tap share card"],
    phoneHint: "Click an example chip or paste a post and run it (AI engine required)",
    sections: [
      {
        label: "What it is",
        html: `<p>Take <b>any food post</b> you scrolled past — a restaurant write-up, brunch shot, home-cook recipe, late-night drool post — and turn it into
          <b>a recipe you can actually cook</b>: paste or select a real post, AI extracts the dish intent from <b>that specific content</b>,
          generates structured fields, and the front end renders a clearly formatted recipe with ingredients, quantities, and timing. The core value is
          '<b>arbitrary unstructured input → reliable, boundary-stable structured output</b>' — the same capability applied to a different domain becomes résumé, receipt, or contract parsing.</p>`
      },
      {
        label: "How it works",
        html: `<h3>Casual post copy → strict structured recipe</h3>
          <div class="flow">
            <span class="step">Paste / select post</span><span class="arr">→</span>
            <span class="step">LLM extracts dish intent</span><span class="arr">→</span>
            <span class="step">Strict JSON contract</span><span class="arr">→</span>
            <span class="step">Front-end SVG render</span><span class="arr">→</span>
            <span class="step">One-tap share card</span>
          </div>
          <p style="margin-top:14px">Two hard engineering requirements (acceptance floor — must actually work, not fake output):</p>
          <ul>
            <li><b>Output genuinely tracks the input</b>: Swap two different posts and the recipes must be clearly distinct and traceable to their respective source — not a random pick from a fixed list.</li>
            <li><b>Boundaries don't break</b>: Paste something that has nothing to do with food, and the app gracefully returns 'this doesn't look like food' with sample entry points — it never hard-codes a dish.</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            Decoupled design: <b>LLM handles only 'output genuinely tracks the input'</b> (forced to return strict JSON; front end parses safely and catches failures gracefully).
            <b>Front end handles only 'looks good'</b> — ingredient emojis, 8 step-type icons, and a composed plate hero are all pure SVG/CSS; no real photos, no pretend image generation.
            Four one-click example chips eliminate cold-start friction.</p>`
      },
      {
        label: "Business model",
        html: `<ul>
            <li><b>Commerce referrals (highest margin)</b>: Recipe → one-tap shopping list → link to grocery delivery or on-demand retail; commission on GMV</li>
            <li><b>Subscription</b>: Saved recipes, nutrition conversion, bulk weekly meal plans, ad-free (the standard paywall for recipe apps)</li>
            <li><b>Brand / ingredient placement</b>: Sponsored product slots in method steps, brand-custom recipe sets (native advertising, non-intrusive)</li>
            <li><b>Shareability as growth</b>: Every share card carries the user's own recipe version plus a restrained watermark CTA — distribution built into the output</li>
          </ul>`
      },
      {
        label: "Market",
        html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
          <ul>
            <li><b>Samsung Food (formerly Whisk, Samsung 005930.KS)</b>: Imports any webpage or social post into a structured recipe and auto-generates a shopping list — nearly identical to the 'unstructured → structured' move here.</li>
            <li><b>Cookpad (TSE 2193)</b>: One of the world's largest recipe communities; subscription monetisation; publicly listed.</li>
            <li><b>HelloFresh (ETR:HFG)</b>: Recipe → ingredient delivery at scale; validates the commercial value of the 'follow-along' use case.</li>
            <li><b>Instacart (NASDAQ:CART)</b>: Recipe → one-tap cart → same-day delivery; proves the commerce-referral loop works end to end.</li>
          </ul>
          <ul>
            <li><b>Pain</b>: You see something that looks delicious, but turning a casual post into an actual meal is friction — ingredients, steps, and quantities are buried in conversational copy, and that screenshot never gets opened again</li>
            <li><b>Who</b>: Food-content enthusiasts and kitchen newcomers who want to cook what they see</li>
            <li><b>Localization</b>: Tuned to the tone of Xiaohongshu / Douyin posts; shareable in WeChat; Chinese ingredients and cooking-temperature vocabulary</li>
            <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: Output accuracy depends on the LLM — needs fallback logic and spot-checking. Public endpoints require a server-side proxy (server-held key + rate limiting + daily spend cap) to prevent abuse and control costs.</li>
          </ul>`
      }
    ]
  },
{
    id: "unmask", no: "25", cat: "Games",
    kicker: "Games · Privacy Showdown / Behavior Modeling",
    title: "Don't Get Read",
    subtitle: "Rock-paper-scissors, but your opponent is an AI modeling you in real time — it shows you 'how it sees you' before you move, locks in its bet, and winning means staying unreadable",
    url: "demos/unmask/",
    tags: ["anti-modeling showdown", "live profile revealed before you move", "probability unveiled after lock-in", "AI mind-reader profile", "viral battle report"],
    phoneHint: "Best on mobile / WeChat — keep throwing and don't let it read you",
    sections: [
      {
        label: "What it is",
        html: `<p>The whole premise of 'being known' — <b>flipped into a game</b>: you play rock-paper-scissors against an AI that models you in real time,
          placing a bet on your next move before countering it. <b>Getting called = you lose.</b>
          A '<b>Predictability</b>' gauge at the top of the screen shows live how well it has you figured out; your only goal is to stay unpredictable and outlast its predictions.
          Deeply resonant for anyone with privacy anxiety — you finally get to go head-to-head with the system that wants to understand you,
          and it will show you: <b>I'm more predictable than I thought.</b></p>`
      },
      {
        label: "How it works",
        html: `<h3>Turn 'data collection' into the adversarial mechanic — tension is the gameplay</h3>
          <div class="flow">
            <span class="step">See 'how it sees you'</span><span class="arr">→</span>
            <span class="step">AI 🔒 locks in bet</span><span class="arr">→</span>
            <span class="step">You move</span><span class="arr">→</span>
            <span class="step">Reveal what it bet you'd throw</span><span class="arr">→</span>
            <span class="step">Debrief + mind-reader profile</span>
          </div>
          <p style="margin-top:14px">The core is a <b>real adaptive predictor (not an LLM — an online-learning algorithm)</b>:
          move-frequency bias, first/second-order Markov sequences, 'rushing to reverse the last round', repeating the same throw — 5 predictors running in parallel,
          <b>dynamically weighted by recent hit rate, auto-switching</b> to whichever is most accurate at the moment.</p>
          <ul>
            <li>Its throw beats yours = <b>read</b>; you beat it = fooled it; tie = draw.</li>
            <li><b>Shows its hand before you move</b>: a live 'how it sees you' profile (favorite move / combo patterns / loss-induced changes) + which line it trusts most right now + 🔒 locked bet; only after you throw does it reveal <b>the probability distribution of what it bet you'd play</b> (you can see how well it knows you, but can't exploit that knowledge for free).</li>
            <li><b>Predictability = read rate</b>, <b>33% is the true-random baseline</b>; higher means it has you more figured out. Fooling it when it's highly confident = a signature breakthrough moment.</li>
            <li>End-of-game debrief + <b>mind-reader profile</b>: favorite throws, unconscious combos, and post-loss reactions written as a second-person psychological portrait (with an API key the key section is rewritten by a live model; without it, a local fallback kicks in).</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            The meta-irony: the harder you try to hide, the more you expose your patterns. No post-hoc compliance language needed — the confrontation is the mechanic. Fully front-end, no backend required.</p>`
      },
      {
        label: "Business model",
        html: `<ul>
            <li><b>Virality as growth</b>: every game generates a 'Predictability %' battle card — sharing 'I was only read 31% of the time' is intrinsically shareable; shareability is the critical lever</li>
            <li><b>WeChat Mini Game</b>: lightweight, instant-play, native to social contexts; low dev cost, high virality</li>
            <li><b>Retention layer</b>: leaderboards (who's most unpredictable), friend battles, seasons / ranks, AI difficulty settings</li>
            <li><b>Flywheel</b>: players trying to win expose a wealth of <b>genuine decision-making patterns</b> — itself a high-quality behavioral profile (same capabilities that power recommendation and risk engines)</li>
          </ul>`
      },
      {
        label: "Market",
        html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
          <ul>
            <li><b>Tencent WeChat Mini Games (00700.HK)</b>: viral hits like 'Jump' proved 'lightweight + social virality' can explode inside WeChat.</li>
            <li><b>Akinator (Elokence)</b>: 'I can guess who you're thinking of' became a global viral product on pure mind-reading gameplay, monetizing via ads and in-app purchases.</li>
            <li><b>AppLovin (NASDAQ:APP)</b>: casual games + ad monetization at scale, validating the commercial ceiling for lightweight gameplay.</li>
            <li><b>Voodoo</b>: the hyper-casual game publishing king, built on mechanics that can be explained in one sentence, learned in ten seconds, and shared compulsively.</li>
          </ul>
          <ul>
            <li><b>Pain</b>: everyone is being modeled and predicted by algorithms with no way to fight back — this game gives 'playing offense' an emotional outlet</li>
            <li><b>Who</b>: privacy-conscious users and psychology-game fans; general WeChat users who share on impulse</li>
            <li><b>Localization</b>: native WeChat Mini Program context, simple to build, strong virality (battle card sharing); Chinese UI, instant play</li>
            <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: single-session experience is short — retention needs leaderboards / friend battles / seasons to compensate; mechanic is novel but needs rapid validation of D2 retention and share rate</li>
          </ul>`
      }
    ]
  },

{
    id: "niche", no: "26", cat: "Cross-border",
    kicker: "Cross-border Selection · Blue-ocean Radar",
    title: "Blue-ocean Product Radar",
    subtitle: "Give a category direction → AI combines overseas demand trends and review gaps to surface untapped niches before they turn red",
    url: "demos/niche/",
    tags: ["trend + review gap", "opportunity score ranking", "demand / competition intensity", "entry angle + risks", "AI connection required"],
    phoneHint: "Pick a target market + enter a broad category (click an example to scan instantly; best with AI connected)",
    sections: [
      {
        label: "What it is",
        html: `<p>Product selection is where cross-border wins and losses are decided. Give a broad category (e.g. 'pet supplies', 'camping & outdoor'),
          and AI combines <b>overseas demand trends</b> with <b>recurring complaints buried in reviews</b>
          to surface <b>niche blue oceans</b> that existing sellers are overlooking: each opportunity gets an opportunity score, demand and competition intensity, what users are actually complaining about, how to enter, and what pitfalls to watch.
          It turns 'gut-feel copycat selling' into 'differentiate around proven gaps.'</p>`
      },
      {
        label: "How it works",
        html: `<h3>Broad category → combined signals → niche blue-ocean shortlist</h3>
          <div class="flow">
            <span class="step">Enter category + market</span><span class="arr">→</span>
            <span class="step">Cross-reference demand trends</span><span class="arr">→</span>
            <span class="step">Mine reviews for gaps</span><span class="arr">→</span>
            <span class="step">Opportunity score ranking + entry angles</span>
          </div>
          <ul>
            <li>Each niche gets an <b>opportunity score + demand strength + competition intensity (blue ocean / medium / red ocean)</b>, all internally consistent</li>
            <li>'User gaps' read like real reviews (too loud, wrong size, battery life overstated…) — not vague generalizations</li>
            <li>Each entry includes <b>signal sources + differentiation angle + risks</b>, with a closing call on which to target first</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            Powered by a live LLM with strict JSON enforced and front-end normalization fallback; non-category inputs are politely rejected, nothing is hardcoded.</p>`
      },
      {
        label: "Business model",
        html: `<ul>
            <li><b>SaaS subscription</b>: product-selection tool billed monthly / per seat — a must-have, high-frequency tool for cross-border sellers</li>
            <li><b>Data reports</b>: paid deep-dive reports and trend rankings for specific niches</li>
            <li><b>C2M reverse sourcing</b>: match validated blue-ocean demand to factories, earning commission on transactions</li>
            <li><b>Data flywheel</b>: track which blue oceans actually take off → feed results back to sharpen opportunity scoring over time</li>
          </ul>`
      },
      {
        label: "Market",
        html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
          <ul>
            <li><b>Jungle Scout / Helium 10 / AMZScout</b>: Amazon product-selection and market-analysis tools on subscription, practically standard issue for sellers.</li>
            <li><b>Seller Sprite / Captain BI / Sorftime</b>: domestic cross-border selection SaaS, validating willingness to pay among Chinese sellers.</li>
            <li><b>Exploding Topics / Glimpse</b>: trend-discovery subscription tools, proving that 'spotting demand early' is valuable in its own right.</li>
          </ul>
          <ul>
            <li><b>AI-era advantage</b>: before, you had to manually scrape sales charts and read reviews one by one to find gaps — slow and fragmented; AI now combines trend signals and review gaps <b>into a blue-ocean shortlist in one pass</b></li>
            <li><b>Pain</b>: 90% of sellers die at product selection — either slugging it out in red-ocean price wars or making blind bets</li>
            <li><b>Who</b>: Amazon / DTC / Temu semi-managed sellers, factories looking to build a cross-border brand</li>
            <li><b>Localization</b>: connecting 1688 sourcing data and real review / sales data from each platform would substantially improve accuracy</li>
            <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: scoring accuracy depends on real review and sales data feeds; this demo is a heuristic illustration and should not be used as the basis for sourcing decisions</li>
          </ul>`
      }
    ]
  },

{
    id: "landed", no: "27", cat: "Cross-border",
    kicker: "Cross-border Pricing · Landed Cost Calculator",
    title: "Landed Cost & Margin Comparison",
    subtitle: "Enter your factory cost → AI estimates landed cost per country (tariff / VAT / platform commission / freight) + gross margin, so you can see at a glance which market to enter first",
    url: "demos/landed/",
    tags: ["multi-country landed cost", "cost waterfall bar", "gross margin comparison", "which market to enter first", "AI connection required"],
    phoneHint: "Fill in cost + weight, select markets (click an example to calculate instantly; best with AI connected)",
    sections: [
      {
        label: "What it is",
        html: `<p>The same product can yield wildly different real margins across countries — tariffs, VAT, platform commissions, and freight all vary.
          Enter your <b>factory cost and weight</b>, select a few target markets, and AI estimates each country's <b>total landed cost, suggested retail price, and gross margin</b>,
          laying out exactly where the money goes in a cost waterfall bar — then tells you straight which market offers the best return to enter first.
          It turns 'list everywhere and hope' into 'run the numbers before you commit.'</p>`
      },
      {
        label: "How it works",
        html: `<h3>Cost + markets → landed cost breakdown → margin comparison</h3>
          <div class="flow">
            <span class="step">Enter cost / weight</span><span class="arr">→</span>
            <span class="step">Look up each country's tax rates and fees</span><span class="arr">→</span>
            <span class="step">Add freight + commission</span><span class="arr">→</span>
            <span class="step">Gross margin comparison + recommendation</span>
          </div>
          <ul>
            <li>Each market breaks out <b>tariff% / VAT% / platform commission% / freight</b> to produce landed cost and suggested retail</li>
            <li><b>Cost waterfall bar</b>: factory cost / freight / tariff / tax / commission / gross margin — each slice visible at a glance</li>
            <li>Automatically flags the <b>highest-margin</b> market as '★ Best pick' and provides an overall market-selection recommendation</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            Powered by a live LLM that generates common-sense rate estimates and keeps all figures internally consistent; results are labeled 'tax rates are estimates — for reference only.'</p>`
      },
      {
        label: "Business model",
        html: `<ul>
            <li><b>SaaS pricing tool</b>: landed cost / margin calculator on subscription — essential for cross-border sellers choosing which market to enter</li>
            <li><b>Freight & customs referral</b>: calculate then instantly compare first-mile / last-mile options and customs clearance, earning commission per shipment</li>
            <li><b>VAT / compliance referral</b>: EU VAT registration, country-specific compliance filing, referral fees</li>
            <li><b>API output</b>: package the landed-cost engine as an API and embed it in ERP systems or DTC store backends</li>
          </ul>`
      },
      {
        label: "Market",
        html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
          <ul>
            <li><b>Zonos</b>: the definitive cross-border 'landed cost' and duty-estimation API / SaaS — the category benchmark.</li>
            <li><b>Avalara (formerly NYSE:AVLR, taken private by Vista)</b>: tax-compliance automation giant, validating that 'automated tax calculation' is a large business.</li>
            <li><b>Easyship / Flexport / FlavorCloud</b>: cross-border freight quoting and customs-clearance platforms, profitable on logistics fulfillment and commissions.</li>
          </ul>
          <ul>
            <li><b>AI-era advantage</b>: before, you had to look up HS code tariff rates for the destination country and manually calculate landed cost line by line; now <b>multi-country margin comparison comes out in seconds</b>, turning 'market selection' from tribal knowledge into an instant decision</li>
            <li><b>Pain</b>: many sellers price by gut feel and only discover a market isn't profitable once payments come in</li>
            <li><b>Who</b>: multi-platform / multi-country sellers, brand go-global teams deciding which country to enter first</li>
            <li><b>Localization</b>: connecting real-time FX rates, up-to-date tax and platform fee schedules, and live freight quotes would turn this into a production-grade tool</li>
            <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: tax and fee rates are AI estimates — defer to official customs and platform rules for actual operations; precise calculations require integration with authoritative tax-rate databases</li>
          </ul>`
      }
    ]
  },

{
    id: "loka", no: "28", cat: "Cross-border", featured: true,
    kicker: "Cross-border Listing · Localization Engine",
    title: "Cross-border Localization Engine",
    subtitle: "One Chinese product description → generates a 'sounds like a local wrote it' listing for each country + cultural adaptation + compliance notes",
    url: "demos/loka/",
    tags: ["native listing per market", "local-language title + bullets + keywords", "cultural angle adaptation", "compliance + localization pitfalls", "AI connection required"],
    phoneHint: "Select target markets + paste your product description (click an example to run instantly; best with AI connected)",
    sections: [
      {
        label: "What it is",
        html: `<p>Going global, the expensive part was never translation — it's <b>localization</b>. US buyers respond to lifestyle angles; German buyers want specs and compliance; Japanese buyers care about detail and reassurance.
          Paste a Chinese product description, select a few target markets, and AI writes a <b>'sounds like a local wrote it' listing</b> for each country:
          a local-language title, the benefit angles that actually land with buyers there, real search keywords — plus a heads-up on <b>which certifications you need to clear and which localization traps to avoid</b> (units, sizing, decimal conventions, color taboos).
          One product, natively listed in every market.</p>`
      },
      {
        label: "How it works",
        html: `<h3>One Chinese description → native listings for multiple markets</h3>
          <div class="flow">
            <span class="step">Paste product + select markets</span><span class="arr">→</span>
            <span class="step">Shift to each country's buyer perspective</span><span class="arr">→</span>
            <span class="step">Rewrite title / bullets in local language</span><span class="arr">→</span>
            <span class="step">Compliance + localization pitfalls</span>
          </div>
          <ul>
            <li>One card per market: <b>headline angle (explained in Chinese) + local-language title (with Chinese back-translation) + 3 local-language bullets + local-language keywords</b></li>
            <li>Same product, <b>clearly different titles and angles for US / Germany / Japan</b> — reflects real cultural and platform differences, not Chinese-style direct translation</li>
            <li>Each card includes <b>key compliance requirements for that category</b> (FCC / CE / PSE / LFGB…) and the single most common <b>localization pitfall</b> to avoid</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            Powered by a live LLM with strict JSON enforced, results returned in the same order as selected markets, with front-end normalization fallback; non-physical-product inputs are politely rejected.</p>`
      },
      {
        label: "Business model",
        html: `<ul>
            <li><b>SaaS subscription</b>: billed per SKU × number of markets — factories and sellers outsource their entire overseas copywriting to AI</li>
            <li><b>List and earn on transaction</b>: generate listing then push directly to each platform for one-click listing, earning a cut of GMV</li>
            <li><b>Upsells</b>: A/B multi-version title testing, keyword ad placement, compliance certification referrals</li>
            <li><b>Data flywheel</b>: track which angles convert best in which markets → feed results back to the generator, making it smarter about each locale over time</li>
          </ul>`
      },
      {
        label: "Market",
        html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
          <ul>
            <li><b>Weglot / Smartling / Lokalise</b>: localization (not just translation) SaaS serving a large base of globally expanding companies, profitable at scale on subscriptions.</li>
            <li><b>Shopify Markets (NASDAQ/NYSE:SHOP)</b>: built-in multi-market localization and Translate & Adapt, turning 'one store, sell everywhere' into a platform capability.</li>
            <li><b>Helium 10 / Intentwise</b>: Amazon listing and keyword optimization tools, proving that 'listing optimization' is a sustained paid line item for sellers.</li>
          </ul>
          <ul>
            <li><b>AI-era advantage</b>: before, you needed a native copywriting or localization team per market — costs so high that only large brands could afford it; AI drives marginal cost to near zero, <b>letting small and mid-size factories go global with premium-quality listings</b></li>
            <li><b>Pain</b>: machine-translated listings are an instant tell, convert poorly, and risk takedowns or bad reviews for compliance failures or cultural missteps</li>
            <li><b>Who</b>: Amazon / DTC / TikTok Shop sellers, foreign-trade factories looking to build a brand</li>
            <li><b>Localization</b>: connecting platform-specific title rules, local keyword search volume, and compliance databases would enable production-grade one-click listing</li>
            <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: local-language copy should still be spot-checked by a native speaker; compliance information must defer to official regulations in the destination country; public-facing links should route through a backend proxy to control costs and prevent abuse</li>
          </ul>`
      }
    ]
  },
{
    id: "sonar", no: "29", cat: "Foreign Trade",
    kicker: "Foreign Trade · Inquiry Command",
    title: "Trade Inquiry Commander",
    subtitle: "Paste a buyer inquiry → AI scores intent + negotiation room + drafts a reply in the buyer's language + pricing strategy",
    url: "demos/sonar/",
    tags: ["Buyer quality score", "Fraud / scam detection", "Hidden-need insight", "Native-language reply draft", "AI connection required"],
    phoneHint: "Paste the original inquiry (click an example to run instantly; best with AI connected)",
    sections: [
      {
        label: "What it is",
        html: `<p>Trade reps are buried in inquiries every day — real importers, middlemen, tire-kickers, competitor price-fishing, and scammers all mixed together.
          Paste the buyer's inquiry and the AI first gives an <b>intent score</b> and <b>buyer type</b>, lists positive signals and red flags,
          surfaces what the buyer <b>hasn't said but cares most about</b> (lead time? certifications? payment terms?) and <b>negotiation room</b>,
          then drafts a professional reply <b>in the buyer's language</b> and explains the pricing strategy and hooks behind it.
          Gives every small factory a 'star salesperson' level first-round response.</p>`
      },
      {
        label: "How it works",
        html: `<h3>One inquiry → quality read → reply + strategy</h3>
          <div class="flow">
            <span class="step">Paste inquiry</span><span class="arr">→</span>
            <span class="step">Score + risk signals</span><span class="arr">→</span>
            <span class="step">Infer hidden needs</span><span class="arr">→</span>
            <span class="step">Native reply + pricing strategy</span>
          </div>
          <ul>
            <li><b>Intent score ring</b> + 5 buyer labels (genuine importer / middleman / tire-kicker / competitor price-fishing / suspected scam), consistent with signals</li>
            <li>Risk signals <b>cite specific evidence</b>: e.g. 'asked for factory address but gave no company info,' 'payment urgency via WhatsApp only'</li>
            <li>For scams / price-fishing, the reply strategy is <b>request credentials before quoting</b> — never lead with a full price list or factory address</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            Powered by a live LLM with strict JSON enforcement and frontend fallback normalization; reply_draft uses the buyer's language and addresses the specific inquiry — not a generic template.</p>`
      },
      {
        label: "Business model",
        html: `<ul>
            <li><b>SaaS subscription</b>: per-rep seat pricing, auto-triage of inquiries + one-click reply drafting</li>
            <li><b>Conversion commission</b>: prioritize high-intent inquiries, take a cut once deals close</li>
            <li><b>B2B integration</b>: plugin for Alibaba International / trade CRM / email clients, embedded in existing workflows</li>
            <li><b>Data flywheel</b>: which inquiry types actually close → feeds back into the scoring model and reply playbook, gets sharper over time</li>
          </ul>`
      },
      {
        label: "Market",
        html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
          <ul>
            <li><b>Alibaba International (NYSE:BABA / 09988.HK)</b>: already ships an AI trade assistant that drafts outreach and replies for exporters — validates real demand for 'AI replacing the sales rep.'</li>
            <li><b>OKKI / Fumao / Xunpanyun</b>: foreign-trade CRM/SCRM platforms that turned inquiry management and follow-up into a subscription business.</li>
            <li><b>Apollo.io / Lusha / Clay</b>: B2B lead intelligence and scoring — prove that 'grading leads' is a scalable paid feature.</li>
          </ul>
          <ul>
            <li><b>AI-era edge</b>: reading buyer quality, spotting price-fishing or scams, and writing multilingual replies used to require a seasoned bilingual rep; now AI does it <b>7×24 in any language</b>, putting that judgment in the hands of every small factory</li>
            <li><b>Pain</b>: real buyers are hard to tell from noise, slow replies lose deals, junior reps easily leak floor prices to competitors</li>
            <li><b>Who</b>: small and mid-size export factories, SOHOs, trade teams sourcing leads via Alibaba International or trade shows</li>
            <li><b>Localization</b>: email / Alibaba inbox integration, business credit lookup, FX rates and price-book can all be built to production grade</li>
            <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: buyer authenticity ultimately requires credit verification; replies should still be reviewed by a rep before sending; public deployment should use a backend proxy to protect the API key and control costs</li>
          </ul>`
      }
    ]
  },

  {
    id: "ping", no: "30", cat: "Study Abroad",
    kicker: "Study Abroad · Status Compliance Navigation",
    title: "PING — Student Status Compliance Navigator",
    subtitle: "Describe your situation in one sentence → personalized compliance roadmap (with authoritative sources + consequences of missing deadlines) + 2026 policy risk radar + parent 'peace-of-mind card'",
    url: "demos/ping/",
    tags: ["Natural-language input", "State-machine roadmap", "Verifiable authoritative sources", "Exportable parent card", "AI connection required"],
    phoneHint: "Click a sample profile or describe in one sentence (best with AI connected; falls back to built-in rule engine without it — never blank)",
    sections: [
      {
        label: "What it is",
        html: `<p>Student visa compliance — F-1 enrolled → OPT application → OPT active → STEM extension → H-1B bridge —
          is scattered across a maze of intimidating official pages where one missed step can cost you your status. PING is not a product; it is a <b>'delivery proof' demo</b>:
          the student describes their situation in <b>one sentence</b> and instantly receives a <b>personalized roadmap</b> (each item linked to an authoritative source + 'consequence of missing it'),
          a 2026 policy risk radar, and a one-tap <b>'peace-of-mind card'</b> for parents (green / yellow / red + one sentence + next checkpoint).
          What it proves is not 'AI can answer immigration questions' — it is that the tool <b>takes the burden of judgment off the student</b>:
          it consolidates scattered authoritative information into an actionable, verifiable picture.</p>`
      },
      {
        label: "How it works",
        html: `<h3>One sentence → locate status → actionable view</h3>
          <div class="flow">
            <span class="step">One sentence / select profile</span><span class="arr">→</span>
            <span class="step">LLM locates compliance stage</span><span class="arr">→</span>
            <span class="step">Roadmap + sources + consequences</span><span class="arr">→</span>
            <span class="step">Policy radar</span><span class="arr">→</span>
            <span class="step">Parent peace-of-mind card</span>
          </div>
          <ul>
            <li>A <b>state-machine timeline</b> highlights your current stage; the '2–3 required actions' below each item include action + time window + <b>consequence of missing it</b> (calibrated red line) + <b>clickable official source</b> (uscis.gov / ICE SEVP / DHS)</li>
            <li>Each radar item explains 'what this policy means for you + what you can do to hedge' — not just raw news</li>
            <li>The parent card <b>shows status, not details</b> (student stays in control), exportable as an image with one tap</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            Powered by a live LLM (claude-sonnet-4-6, strict JSON enforcement with frontend fallback); backed by an <b>explicitly labeled 'reference-only' rule set</b>
            (OPT 90/60-day unemployment windows, 90/150-day caps, STEM +24 months + E-Verify + I-983, H-1B cap-gap, etc.).
            <b>If the API is unavailable or not connected, the app falls back to this deterministic rule engine — it never goes blank.</b>
            All output is information for reference only, not legal advice, and never claims to fill or submit government forms on the user's behalf; official sources (uscis.gov, ICE/SEVP) take precedence.</p>`
      },
      {
        label: "Business model",
        html: `<ul>
            <li><b>'Peace-of-mind' subscription paid by parents</b>: the student uses it, the parent pays — they are buying certainty that their child's status is on track (insurance mindset)</li>
            <li><b>Critical-milestone alerts</b>: auto-reminders before deadlines (OPT window / STEM filing / cap-gap) turn a one-time lookup into recurring renewals</li>
            <li><b>Licensed attorney / ISSS referral</b>: complex cases escalate to 'consult a lawyer' with a referral fee; AI handles information consolidation only, never crosses into legal advice</li>
            <li><b>B2B</b>: white-label compliance assistant for study-abroad agencies, university ISSS offices, and employer HR teams</li>
          </ul>`
      },
      {
        label: "Market",
        html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
          <ul>
            <li><b>Boundless / VisaNation / Lawfully</b>: digital immigration workflow and case-tracking tools — validate that 'productizing the scary immigration process' has real paying demand.</li>
            <li><b>Sprintax / Glacier</b>: student tax-filing SaaS — prove that 'student compliance as a subscription via school/institution channels' scales.</li>
            <li><b>Chegg (NYSE:CHGG) / major study-abroad agencies</b>: paid study-abroad services are mature; parents' willingness to pay for certainty around their child is very strong.</li>
          </ul>
          <ul>
            <li><b>AI-era edge</b>: students used to piece together USCIS / ICE / school information themselves or pay lawyers by the hour; AI now <b>consolidates it into a personalized, sourced, actionable view</b> and removes the burden of judgment</li>
            <li><b>Pain</b>: the status chain is complex, one misstep costs status, information is scattered and intimidating, parents back home just want to know 'is my kid OK'</li>
            <li><b>Who</b>: STEM graduate students / Chinese international students newly on OPT (users) + their parents (payers)</li>
            <li><b>Localization</b>: Chinese-primary with English terms preserved; shareable via WeChat; connectable to university ISSS offices and licensed attorney networks</li>
            <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: immigration compliance is highly sensitive — output must be 'information for reference, not legal advice'; this tool never claims to fill or submit government forms; official sources always take precedence; rules and policies change frequently and require ongoing maintenance; complex cases must be referred to a human attorney; the built-in rule set in this demo is illustrative only</li>
          </ul>`
      }
    ]
  },

  {
    id: "concierge", no: "31", cat: "Short-stay", featured: true, direct: true,
    kicker: "Short-stay Management · AI Guest Concierge",
    title: "AI Guest Concierge",
    subtitle: "Turn every offhand guest question into revenue and reviews — check live availability and upsell extended stays, triage maintenance requests, escalate exceptions to a human, multilingual 7×24",
    url: "demos/concierge/",
    tags: ["Stay extension upsell · payment", "Maintenance triage · dispatch", "Exception escalation to human", "Multilingual · 7×24"],
    sections: []
  },

  {
    id: "probe", no: "32", cat: "Foreign Trade",
    kicker: "Foreign Trade · Inquiry Structuring",
    title: "Inquiry Gap Probe",
    subtitle: "Paste an English buyer inquiry → extract a '9-category gap checklist' + one 'factory RFQ brief'; price / spec / certifications — the things only you can decide — are left blank for your call, never guessed",
    url: "demos/probe/",
    tags: ["9-category gap audit", "Evidence cited per item", "Blanks reserved for your judgment", "Save judgments as your standard · compound", "One-tap factory RFQ", "AI connection required"],
    phoneHint: "Paste the buyer inquiry (click an example to run; best with AI connected; offline sample renders without AI so it's never blank)",
    sections: [
      {
        label: "What it is",
        html: `<p>If you work in foreign trade with both factory and buyer relationships, you receive English inquiries every day full of scattered, missing information. Probe breaks one inquiry into two screens:
          ① <b>Gap checklist</b> — 9 categories (product specs / quantity & lead time / certifications & compliance / packaging & marks / logistics terms / price terms / warranty & after-sales / documents / communication), each item audited and marked 'confirmed / vague / not mentioned / your call,' with <b>source evidence</b> from the original text;
          ② <b>Factory brief skeleton — blank edition</b> — known items filled in, <b>price, category-specific specs, certification numbers — anything only your experience can determine — left precisely blank</b>.
          Its job is to <b>showcase your judgment and serve as your evidence</b>, never to fabricate a number that looks right but is actually a guess.</p>`
      },
      {
        label: "How it works",
        html: `<h3>One inquiry → gap audit → blank brief + factory RFQ</h3>
          <div class="flow">
            <span class="step">Paste inquiry</span><span class="arr">→</span>
            <span class="step">9-category audit</span><span class="arr">→</span>
            <span class="step">Flag evidence + leave blanks</span><span class="arr">→</span>
            <span class="step">Save as your standard</span><span class="arr">→</span>
            <span class="step">One-tap factory RFQ</span>
          </div>
          <ul>
            <li>9 categories, 35 fields hard-coded in the frontend = <b>structural source of truth</b>; the model only returns information <b>literally present</b> in the text — anything absent is treated as missing, <b>never filled in</b></li>
            <li><b>Red lines enforced at the code layer</b>: price / FOB / CIF / DDP are always blank — no numbers ever; no factory is named or recommended; category-specific specs and certifications list candidates only, with 'truly mandatory items for this category' marked 'your call'</li>
            <li><b>Judgment capture → compound value</b>: blanks can be filled in; hit 'save as my standard' → next similar inquiry auto-pre-fills, gaps shrink over time. Your irreplaceable judgment becomes a compounding, portable asset</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            Powered by a live LLM with strict JSON enforcement and frontend ontology-based fallback normalization; when AI is not connected, an offline sample renders on first load — never blank.</p>`
      },
      {
        label: "Business model",
        html: `<ul>
            <li><b>SaaS subscription</b>: per-rep / per-buyer seat pricing, auto-structured inquiries + one-tap factory RFQ generation</li>
            <li><b>Judgment asset accumulation</b>: every standard you save stays with you — the more you use it, the fewer gaps remain and the faster you respond; switching cost is the moat</li>
            <li><b>B2B integration</b>: plugin for Alibaba International / trade CRM / email clients, embedded in existing order workflows</li>
            <li><b>Data flywheel</b>: which blanks get filled most, which inquiry types close → feeds back into the audit checklist and RFQ templates</li>
          </ul>`
      },
      {
        label: "Market",
        html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
          <ul>
            <li><b>Alibaba International RFQ (NYSE:BABA / 09988.HK)</b>: buyers post RFQs, the platform structures and routes them to factories for quotes — validates real demand for 'turning an inquiry into a quotable brief.'</li>
            <li><b>SAP Ariba (NYSE:SAP) / Coupa / Jaggaer</b>: procurement sourcing SaaS that turned RFQ / benchmarking / supplier management into a scaled subscription business.</li>
            <li><b>Scoutbee / Tealbook / Keelvar</b>: AI sourcing and supplier intelligence — prove that 'AI-assisted judgment in procurement workflows' is a scalable paid category.</li>
          </ul>
          <ul>
            <li><b>AI-era edge</b>: turning a messy inquiry into 'what's missing, what to ask the factory' used to require a veteran rep; now AI automates the checklist, but <b>critical judgment (pricing, spec selection, factory choice) stays with the human</b> — AI does structure, humans do judgment</li>
            <li><b>Pain</b>: inquiries arrive full of holes, new reps forget to ask before factory visits causing expensive back-and-forth, veteran knowledge never gets written down and lives only in someone's head</li>
            <li><b>Who</b>: foreign-trade SOHOs with factory and buyer networks / small factory sales reps / procurement middlemen</li>
            <li><b>Localization</b>: email / Alibaba inbox integration, category spec libraries and certification databases, FX rates and price-book can all be built to production grade</li>
            <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: Probe only does structuring and gap flagging — <b>it never sets a price or names a supplier for either party</b>; final specs, certifications, and pricing must be signed off by an experienced person; public deployment should use a backend proxy to protect the API key and control costs</li>
          </ul>`
      }
    ]
  },
{
    id: "anyhome-listing-card", no: "33", cat: "Student Housing", direct: true,
    kicker: "Student Housing Agency · Listing Materials",
    title: "Listing Card Generator",
    subtitle: "Paste a StreetEasy listing in plain text, get a branded AnyHome bilingual (EN/ZH) recommendation card in 5 minutes — commute time, neighborhood highlights, and key lease terms all laid out, guarantor requirement prominently flagged, one-click export to send students.",
    url: "demos/anyhome-listing-card/",
    tags: ["Paste text → bilingual listing card", "Commute drafted on the spot · edit live", "Guarantor prominently flagged", "Missing info labeled 'TBD' — never fabricated", "One-click PNG export"],
    sections: []
  },
  {
    id: "anyhome-intake", no: "34", cat: "Student Housing", direct: true,
    kicker: "Student Housing Agency · Lead Intake",
    title: "Structured Needs Intake",
    subtitle: "A self-guided 15-question flow with branching logic: no U.S. credit triggers an automatic follow-up on guarantor options; based abroad flags timezone-aware follow-up. On completion, it produces a clean lead card ready to hand off to your team.",
    url: "demos/anyhome-intake/",
    tags: ["15-question guided flow", "Branching follow-ups · clarifies automatically", "No credit → guarantor follow-up", "Abroad → timezone follow-up flagged", "Lead card one-click copy", "24/7 self-serve · no API key needed"],
    sections: []
  },
  {
    id: "anyhome-checklist", no: "35", cat: "Student Housing", direct: true,
    kicker: "Student Housing Agency · Lease Documents",
    title: "Signing Checklist Generator",
    subtitle: "Generates a personalized, bilingual (EN/ZH) lease document checklist based on the student's profile — U.S. credit history, income, guarantor — with a 'why you need this' explanation for every item, so you stop repeating yourself on every call.",
    url: "demos/anyhome-checklist/",
    tags: ["Branching by profile", "Bilingual side-by-side", "Every item explained", "US guarantor / service / prepayment covered", "Note: landlord requirements take precedence"],
    sections: []
  },
  {
    id: "cardna", no: "36", cat: "Auto", featured: true,
    kicker: "Car Buying · Taste Profile Engine",
    title: "Car Buying DNA",
    subtitle: "Swipe cars to capture gut feel, then answer questions to lock in reality — two signals fuse into your car-buying taste profile. Helps you pick the right car, and lets automakers see the anonymous 'in-market buyer' you represent.",
    url: "demos/cardna/", tags: ["Swipe × survey dual signal","Aspiration vs. reality","Explainable matching","How automakers see you","Private by default · opt-in sharing","Fully offline"],
    phoneHint: "Swipe left/right on cars first (at least 6), then answer 5 questions to see your Car Buying DNA + the 'How Automakers See You' panel.",
    sections: [
      { label: "What it is", html: `<p>A product that fuses the <b>left/right swipe</b> of 'automotive Tinder' with the <b>questionnaire</b> of quiz-based car recommendations. Swiping captures your <b>implicit taste</b> (what draws your eye); the quiz captures <b>explicit constraints + purchase intent</b> (budget / seats / powertrain / timeline / first-time buyer). Both signals merge into a <b>'Car Buying DNA'</b> profile — helping you choose a car while surfacing the gap between what you <b>aspire to</b> and what your <b>reality</b> actually allows.</p>` },
      { label: "How it works", html: `<h3>Implicit × Explicit — two signals, cross-calibrated</h3>
        <div class="flow"><span class="step">Swipe 6+ cards (❤/✕)</span><span class="arr">→</span><span class="step">Answer 5 questions (constraints + intent)</span><span class="arr">→</span><span class="step">Synthesize taste DNA</span><span class="arr">→</span><span class="step">Aspiration vs. reality</span><span class="arr">→</span><span class="step">Matched picks + how automakers see you</span></div>
        <ul>
          <li><b>Swipe (System 1)</b>: Adaptive card dealing — early cards cast a wide net to probe preferences; later cards zero in on the axes you're still undecided on. The live 'Reading You' panel on the right updates your profile with every swipe.</li>
          <li><b>Quiz (System 2)</b>: Budget and seats are <b>hard constraints</b>; timeline and first-time buyer status are <b>intent tiers</b> (just browsing / within 6 months / must buy within 3 months).</li>
          <li><b>Aspiration vs. Reality</b>: Average price of right-swiped cars vs. your budget tier (gap in dollars); 'says family car, hand keeps swiping performance'; size preferences that flip — the <b>contradictions</b> in the cross-signal data are the most valuable insight.</li>
          <li><b>Matched Picks</b>: Implicit taste score + hard constraints on budget/seats + powertrain preference. Each pick gets a fit score, a traceable rationale, and an <b>honest caveat</b>, plus one budget-friendly dark-horse pick and 3 questions to ask a salesperson on your behalf.</li>
        </ul>
        <p style="margin-top:16px">Under the hood: right-swipe attributes are weighted cumulatively; left-swipes apply a reverse penalty. Going over budget or falling short on seats incurs a heavy penalty, forcing 'reality' into the ranking. Rationales cite the actual count of a specific attribute in your right-swipe history. All state is encoded in the URL — share the link and the full session is reproduced. <b>Zero external dependencies, fully offline</b>; connect your own key to upgrade to real model-generated copy.</p>` },
      { label: "Business model", html: `<h3>Two-sided: free on consumer side, monetized B2B on high-intent audiences</h3>
        <ul>
          <li><b>Consumer side (free)</b>: An entertaining taste quiz + car recommendations + a decision brief — low barrier, pulls people in well before they're ready to buy.</li>
          <li><b>B2B Layer 1 · Aggregate Insights</b>: Anonymous trend reports (e.g., 'first-time buyers in Tier-1 cities shifting from rugged to minimalist') sold to automakers for product and marketing positioning — truly aggregated, no personal data, infinitely resellable.</li>
          <li><b>B2B Layer 2 · Informed-consent warm leads</b>: Only when a user explicitly opts in does the platform introduce them to a matched dealer or brand; a high-intent lead that arrives with a full taste profile commands a price far above a cold lead.</li>
          <li><b>Never sell raw personal data</b>: Private by default, opt-in per item, revocable anytime — compliance is not a cost center, it's the reason automakers will sign the contract, and the moat.</li>
          <li><b>Data flywheel</b>: Every swipe and quiz answer sharpens the profile; the longer users engage, the more accurate it gets — same structural moat as Stitch Fix.</li>
        </ul>
        <p style="margin-top:16px">The <b>'How Automakers See You' panel</b> in the demo makes this tangible: which anonymous audience segment you belong to, what that means for an automaker, how the platform would use it, and which data points you can toggle on or off — explaining the two-sided model and informed consent in a single view.</p>` },
      { label: "Market", html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
        <ul>
          <li><b>Model benchmark: Stitch Fix (NASDAQ: SFIX)</b>: Quiz + data to learn taste → personalized curation → data flywheel. Proof that 'understood and selected for' personalized retail can scale.</li>
          <li><b>Lower-funnel benchmark: Autohome / Dongchedi / Yiche</b>: Users actively comparing specs and ready to leave contact info — lead prices are already high, and these platforms dominate the space.</li>
        </ul>
        <ul>
          <li><b>Differentiation wedge = upper-funnel pre-intent</b>: People who aren't buying yet — 6–18 months out — are still forming their taste. Too early and too soft for the traditional lead business, so nobody monetizes them well. This product captures them a year early with an entertaining taste quiz; the profile matures as they approach purchase, delivering <b>warm leads that have been cultivated from the start, taste profile included</b>.</li>
          <li><b>Value engine = intent tiering</b>: Automakers aren't buying '100,000 taste profiles' — they're buying 'the 8,000 of those who plan to buy within 3 months and whose profile matches our new model.' First-time buyers with high intent are especially valuable (no brand loyalty yet — whoever reaches them first wins).</li>
          <li><b>Compliance as moat</b>: Under PIPL, selling personal data requires separate consent, and anonymization must be genuine. Private by default + aggregate insights + opt-in matching is both safer and more contractable than grey-market data.</li>
          <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: Car purchases are infrequent — keeping profiles 'alive' long enough to convert is the hardest product problem. Real vehicle inventory and pricing data is a hard dependency. Lead monetization depends on BD with automakers and dealers. Dollar figures in the demo are illustrative; the matching engine is a heuristic placeholder, not a real model.</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 37 deposit-letter (EN mirror) ───────────────────────── */
  {
    id: "deposit-letter", no: "37", cat: "Student Housing", featured: true,
    kicker: "International Student Housing · Deposit Recovery",
    title: "Get Your Deposit Back",
    subtitle: "Your landlord is betting you won't pursue it after leaving the country. Pick your state, enter move-out date and deductions → statutory deadline check (overdue = 2×/3× leverage) + line-item disputes + a demand letter citing the statute, ready to mail, with a small-claims escalation path",
    url: "demos/deposit-letter/",
    tags: ["8-state deposit-law rulebook","Statutory deadline timeline","Overdue = leverage flips","Line-item disputes · live letter rewrite","English demand letter","Small-claims escalation","Fully offline"],
    phoneHint: "Tap a built-in case to see the deadline verdict and letter; change any stance and the letter rewrites instantly (all local, never uploaded)",
    sections: [
      {
        label: "What it is",
        html: `<p>The structural weakness of student renting is that <b>recourse drops to zero the day you fly home</b> — whatever the landlord deducts, you eat. His biggest leverage is betting you won't pursue it.
          But every state's deposit law puts a hard clock on landlords: <b>miss the statutory deadline to refund or itemize, and many states trigger double or even treble damages</b> — the leverage flips instantly.
          This tool does three things: ① computes your <b>statutory deadline timeline</b> for your state (most tenants never knew this line existed); ② puts the landlord's deduction list on a <b>line-item dispute desk</b> (normal wear and tear isn't deductible; undocumented charges get a demand for receipts);
          ③ generates a <b>demand letter citing the statute, ready to mail</b>, plus a small-claims escalation path — including what to do if you've already left the country.</p>`
      },
      {
        label: "How it works",
        html: `<h3>State rulebook → deadline check → line-item disputes → letter + escalation</h3>
          <div class="flow">
            <span class="step">Pick state + facts</span><span class="arr">→</span>
            <span class="step">Deadline check</span><span class="arr">→</span>
            <span class="step">Dispute line items</span><span class="arr">→</span>
            <span class="step">Demand letter</span><span class="arr">→</span>
            <span class="step">Small-claims path</span>
          </div>
          <ul>
            <li><b>Statutes anchor out hallucination</b>: statutory days, citations, damage multipliers, and small-claims limits for 8 states (PA/NY/MA/CA/IL/TX/WA/NJ) are <b>hard-coded in a front-end rulebook</b> — the AI never generates law; any AI output line containing "§" is dropped by code</li>
            <li><b>The timeline is the verdict</b>: move-out → statutory deadline → today, with the overdue span in red — four scenarios (ignored past deadline / late list / still in window / list on time) each get their own strategy</li>
            <li><b>Live dispute desk</b>: pick a stance per deduction (accept / normal wear / show me receipts) and <b>the letter rewrites on the spot</b>, disputed totals recomputed live</li>
            <li><b>UPL red line</b>: positioned as a self-help document tool (the LegalZoom model) — applies public statute templates to your facts, never judges your case, clearly labeled not legal advice</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            Deadline math, letter template, and escalation path are <b>fully local and offline</b>; connect an API key and the AI does exactly one thing: polish your Chinese factual notes into a formal English paragraph for the letter.</p>`
      },
      {
        label: "Business model",
        html: `<ul>
            <li><b>Per-letter / subscription</b>: charge per letter (vs. $200–400 for an attorney, huge pricing room); subscription unlocks move-out timeline reminders, evidence vault, follow-up letters (LegalZoom / DoNotPay self-help playbook)</li>
            <li><b>The only lever aimed at the root cause</b> — "leaving = forfeiting": other tools help you avoid traps; this one claws back money already taken. Willingness to pay is the most direct kind (real dollars vs. risk prevention)</li>
            <li><b>Seasonal loop</b>: May–August graduation move-outs concentrate demand; chains with pre-signing and move-in evidence tools into a full-lifecycle product</li>
            <li><b>Each new state is near-zero marginal cost</b>: the same engine extends to Canada / UK / Australia student markets</li>
          </ul>`
      },
      {
        label: "Market",
        html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
          <ul>
            <li><b>LegalZoom (NASDAQ:LZ) / Rocket Lawyer</b>: self-help legal documents prove that structured self-help — no case-by-case judgment — scales as a subscription business.</li>
            <li><b>DoNotPay</b>: consumer-rights automation; security-deposit recovery is one of its classic scenarios — proof consumers pay to "get my money back".</li>
            <li><b>Small-claims document-prep services</b>: a long-standing paid ecosystem in most states, validating the demand-letter step as a market of its own.</li>
          </ul>
          <ul>
            <li><b>Structural pain</b>: recourse evaporates after departure; tenants don't know statutory deadlines exist; drafting a formal English demand letter feels out of reach — landlords count on all three</li>
            <li><b>Audience</b>: hundreds of thousands of Chinese students in the US; deposits run $1,500–3,000 and wrongful deductions routinely run hundreds to over a thousand dollars</li>
            <li><b>AI-era specific</b>: this used to require a lawyer or a well-connected senior classmate; a rulebook + template turns it into 2-minute self-service — <b>the law is fixed (rulebook), the facts are yours (form), AI only polishes prose</b></li>
            <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: the UPL boundary must hold — document tool, never legal judgment; the demo rulebook is a simplified summary and production needs per-state legal review with an update pipeline; cross-border enforcement of judgments remains a real-world hurdle</li>
          </ul>`
      }
    ]
  },

  /* ───────────────────────── 40 price-pulse (EN mirror) ───────────────────────── */
  {
    id: "price-pulse", no: "40", cat: "Restaurant Supply",
    kicker: "Chinese Restaurant Supply Chain · Price Memory",
    title: "Quiet Price Creep, On the Table",
    subtitle: "The data byproduct of Demos 04/05: three months of nightly delivery-slip photos grow into a 12-week price curve for every item — spikes, creep, and spend decomposition surface on their own, zero data entry. ⛔ Explicitly NOT a 'kickback detector': the data shows anomalies; judgment stays with the owner",
    url: "demos/price-pulse/",
    tags: ["Zero entry · slips accumulate","12-week curves + baseline band","Spike / creep / spend split","Creep is immune to human memory","Negotiation ammo · neutral scripts","⛔ No kickback detection","Fully offline"],
    phoneHint: "Switch between two stores (busy / clean); tap item chips to change curves, tap findings to jump to them",
    sections: [
      {
        label: "What it is",
        html: `<p>The most insidious price increase isn't a spike — it's <b>creep</b>: a little each week, every week looks "normal," and twelve weeks later you're paying 10% more. <b>It's immune to human memory — that's the design.</b>
          This panel is the <b>data byproduct</b> of Demos 04/05: the delivery slips an owner photographs every night grow, over three months, into a price curve for every item — <b>zero data entry</b>.
          Three anomaly types surface on their own: <b>spikes</b> (this week vs. prior-4-week average +8%), <b>creep</b> (no single week over threshold, +10% cumulative over 12 weeks), and <b>spend decomposition</b> (spending rose — split it into quantity vs. price).
          The ethical line is printed on the product's face: <b>no "kickback detection."</b> Data can show anomalies; it cannot prove motive — and a false accusation destroys your kitchen. Anomalies go on the table; judgment stays with the owner.</p>`
      },
      {
        label: "How it works",
        html: `<h3>Slip accumulation → price memory → three anomaly types → negotiation ammo</h3>
          <div class="flow">
            <span class="step">Nightly slip photos</span><span class="arr">→</span>
            <span class="step">Auto price library</span><span class="arr">→</span>
            <span class="step">Threshold checks</span><span class="arr">→</span>
            <span class="step">Curves + findings</span><span class="arr">→</span>
            <span class="step">Neutral scripts</span>
          </div>
          <ul>
            <li><b>Public thresholds</b> (printed in the footer): spike = +8% vs. prior-4-week average; creep = +10% over 12 weeks with mostly-rising weeks and no single week over 8%; spend split = decompose a +20% spend change into quantity and price, presented neutrally</li>
            <li><b>The curve is the evidence</b>: a 12-week line against a gray baseline band (first-8-week average ±8%) — a creeping item visibly climbs out of the band, showing at a glance why nightly checks can't catch it</li>
            <li><b>Positive counterweight</b>: items trending down get a green "worth remembering" — this is not a witch-hunt panel; a supplier with price discipline deserves more volume</li>
            <li><b>Motive-word red line in code</b>: even the AI-polished summary drops any output line containing kickback/steal/skim vocabulary; every suggested script is neutral ("is the market like this everywhere? help me take a look")</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            Detection and summaries are fully local and deterministic, <b>offline-first</b>; with an API key the AI only polishes the summary prose — no new numbers, same vocabulary red line. V1 deliberately skips cross-restaurant benchmarking (needs multi-store data; saved for later).</p>`
      },
      {
        label: "Business model",
        html: `<ul>
            <li><b>Subscription value layer</b>: free unlock for Demo 04 (daily audit) + 05 (monthly recon) subscribers — a zero-marginal-cost byproduct that doubles as the most visual renewal argument</li>
            <li><b>Stickiness is the moat</b>: price memory appreciates with tenure — a store one year in would be throwing away a year of its own price assets by switching</li>
            <li><b>Negotiation ammo = self-quantifying ROI</b>: "talk anomalous items back to baseline ≈ $X/year saved" — the tool computes its own value</li>
            <li><b>Network effects later (V2)</b>: anonymized multi-store aggregation enables regional price benchmarks — a different magnitude of product that V1 deliberately doesn't touch</li>
          </ul>`
      },
      {
        label: "Market",
        html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
          <ul>
            <li><b>MarginEdge</b>: its "price alerts / price movers" is exactly this — price monitoring as an invoice-data byproduct, and a renewal driver.</li>
            <li><b>xtraCHEF (Toast)</b>: invoice line items auto-generate price trends, per-store monthly fees.</li>
            <li><b>Datassential / NielsenIQ</b>: food price intelligence is a sellable data business in its own right — validating the V2 aggregation direction.</li>
          </ul>
          <ul>
            <li><b>Why nobody serves Chinese restaurants yet</b>: the prerequisite is turning mixed handwritten slips into structured data — mainstream tools stall at OCR, which is precisely what Demos 04/05 already produce</li>
            <li><b>Ethical calibration as differentiation</b>: "catch-the-insider" positioning destroys owner-kitchen trust and gets sabotaged by the kitchen — "purchasing transparency, judgment stays human" is both the ethical floor and the adoption prerequisite</li>
            <li><b>Relation to the other two</b>: 04 catches tonight, 05 reconciles the month, 06 watches the quarter — three time scales over one purchasing trust chain; the bundle sells itself</li>
            <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: value depends on 04/05 data accumulation — the panel is empty during cold start (first-month experience needs design); thresholds need tuning on real corpus (demo data here); spec confusion pollutes curves (04 is spec-aware, human review still backstops)</li>
          </ul>`
      }
    ]
  },

  /* ───────────────────────── 39 statement-recon (EN mirror) ───────────────────────── */
  {
    id: "statement-recon", no: "39", cat: "Restaurant Supply",
    kicker: "Chinese Restaurant Supply Chain · Monthly Reconciliation",
    title: "Reconcile Before You Pay",
    subtitle: "Put the month's pile of delivery slips and the distributor's statement on one desk: matched lines get checked off and fade, what's left is the problem — duplicate charges, billed-with-no-slip, amount mismatches, promised credits that never landed. It ends with one number: what you should pay, not what the statement asks",
    url: "demos/statement-recon/",
    tags: ["Slip pile × statement, line by line","Duplicates / no-slip charges / mismatches","Chases WeChat-promised credits","Three big numbers: asked/disputed/pay","Recon message · signals intent to pay","Fully offline"],
    phoneHint: "Tap a built-in case to see the reconciliation; the wording is always \"let's verify then settle\" — relationship-preserving (all local, never uploaded)",
    sections: [
      {
        label: "What it is",
        html: `<p>Month-end is <b>the only moment when money and paperwork face each other</b> in the Chinese restaurant supply chain — but checking slip by slip takes a whole evening, so most owners glance at the total and pay.
          That's exactly where the discrepancies live: <b>the same invoice billed twice, charges with no slip in your pile, a $301 slip billed as $321, a credit promised on WeChat that never landed</b>.
          This tool puts the slip pile and the statement on a reconciliation desk: <b>matched lines get checked off and fade; whatever's left is what you ask about</b>.
          It ends with three big numbers — what the statement asks, how much is disputed, <b>what you should pay this month</b> — plus a "verify-then-settle" message ready to send.</p>`
      },
      {
        label: "How it works",
        html: `<h3>Document pile → line-by-line matching → dispute summary → pay amount + message</h3>
          <div class="flow">
            <span class="step">Paste pile + statement</span><span class="arr">→</span>
            <span class="step">Match by invoice #</span><span class="arr">→</span>
            <span class="step">Chase promised credits</span><span class="arr">→</span>
            <span class="step">Pay amount</span><span class="arr">→</span>
            <span class="step">Recon message</span>
          </div>
          <ul>
            <li><b>Four dispute types + one keep-on-file</b>: duplicate billing (same invoice # twice) / billed with no slip (ask for the signed slip) / amount mismatch (the signed slip governs) / <b>promised credit not honored</b> (WeChat promises vs. the statement's credit lines — closing the loop with Demo 04: what the evening audit finds, the monthly recon chases) / not-yet-billed (month-end slips should appear next cycle)</li>
            <li><b>The visual essence of reconciliation</b>: slip pile (receipt cards) on the left, statement (ledger rows) on the right — matches fade with a check, problem rows highlight, and missing credits get a dashed "a credit line belongs here" placeholder</li>
            <li><b>Wording red line</b>: double-entry and forgotten credits are month-end routine, not evidence of wrongdoing — the message is always "let's verify then settle" plus explicit intent to pay (settle the clean amount now, top up after confirmation). Clear books, long relationships</li>
            <li><b>Scope red line</b>: strictly purchasing-side; never revenue, never taxes</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            Parsing and matching are a deterministic local engine, <b>fully playable offline</b>; connect an API key to parse any format with a real model (whole lines verified against the originals) — the matching math always runs locally. The real product is photo → OCR → <b>low-confidence fields to a human-review queue</b>; mixed handwritten slips are genuinely hard and full automation is not the promise.</p>`
      },
      {
        label: "Business model",
        html: `<ul>
            <li><b>Bundled subscription with Demo 04</b>: daily audit + monthly reconciliation are two ends of the same trust chain — daily-frequency retention plus a monthly moment where real dollars surface</li>
            <li><b>The hardest-money step</b>: reconciliation gaps typically run hundreds to over a thousand dollars a month — "you should pay $4,800, not $5,575" is the pricing pitch in one sentence</li>
            <li><b>Structural transplant</b>: yzh's short-stay Invoice-OCR + human-review + ledger layer moves over directly — the fiduciary-middle-layer motif of explainable reconciliation holds across industries</li>
            <li><b>The dispute summary is a negotiation tool</b>: owners bring the recon record to the month-end settle-up — the deeper the ritual embeds, the higher the switching cost</li>
          </ul>`
      },
      {
        label: "Market",
        html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
          <ul>
            <li><b>MarginEdge / xtraCHEF (acquired by Toast)</b>: invoice digitization + reconciliation is their core paid module, per-store monthly fees.</li>
            <li><b>Bill.com (NYSE:BILL) / Ramp</b>: SMB accounts-payable automation — "reconcile before paying" is a proven big business.</li>
            <li><b>AppZen / Stampli</b>: AI invoice auditing, mature B2B willingness to pay.</li>
          </ul>
          <ul>
            <li><b>The monthly ledger of a three-way split</b>: chef orders, prep cook receives, owner pays — the monthly statement is where a month of that separation accumulates, and the only moment discrepancies can surface</li>
            <li><b>Doubly-ignored niche</b>: mainstream AP tools can't read mixed handwritten Chinese slips and don't understand "the credit promised on WeChat" — which is daily reality in this supply chain</li>
            <li><b>Loop with Demo 04</b>: evening audit finds the unordered $22 onions → the rep promises a credit on WeChat → month-end recon chases whether it landed — one discrepancy, fully tracked from discovery to closure</li>
            <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: handwritten-slip OCR is hard (human-review queue has a cost model to get right); credit promises scatter across voice notes and hallway talk, coverage is bounded; this demo starts from recognized text with demo amounts</li>
          </ul>`
      }
    ]
  },

  /* ───────────────────────── 38 order-check (EN mirror) ───────────────────────── */
  {
    id: "order-check", no: "38", cat: "Restaurant Supply", featured: true,
    kicker: "Chinese Restaurant Supply Chain · Evening Audit",
    title: "Three Minutes a Night, Check the Slip",
    subtitle: "Chinese-restaurant purchasing runs on WeChat voice notes and handwritten delivery slips: the chef orders, the prep cook receives, the owner pays — with zero reconciliation in between. Paste last night's order chat and today's slip: items nobody ordered, 3 ordered but 2 delivered, prices that quietly crept up — all flagged, with tomorrow's reconciliation message to your rep generated in one click",
    url: "demos/order-check/",
    tags: ["WeChat orders × delivery slip","Zero behavior change · after-hours audit","Unordered / short-shipped / price spikes","4-week price memory","Spec-ambiguity nudges (shrimp size)","One-click recon message","Fully offline"],
    phoneHint: "Tap a built-in case to see the audit; the generated wording is always \"was this loaded on the wrong truck?\" — never an accusation (all local, never uploaded)",
    sections: [
      {
        label: "What it is",
        html: `<p>Tens of thousands of US Chinese restaurants purchase over WeChat voice notes + handwritten delivery slips + paper monthly statements. Mainstream restaurant SaaS doesn't speak Chinese, doesn't understand WeChat ordering, can't read the slips.
          The killer structure is <b>order-receive-pay split across three people</b>: the chef orders at night, the prep cook signs at 7am, the owner pays at month-end — with <b>no reconciliation step anywhere</b>. The discrepancies live in that gap.
          The key design constraint is <b>zero behavior change</b>: never ask anyone to weigh and check at receiving (changing the 7am routine = product death).
          Instead, after closing, put the WeChat order log and the delivery slip side by side for a <b>three-minute after-hours audit</b>: items nobody ordered, 3 cases ordered but 2 billed, oil up 10% quietly, shrimp ordered without a size — each flagged, with tomorrow morning's message to the sales rep generated in one click.</p>`
      },
      {
        label: "How it works",
        html: `<h3>Order corpus → slip line items → deterministic diff → recon message</h3>
          <div class="flow">
            <span class="step">Paste chat + slip</span><span class="arr">→</span>
            <span class="step">Extract order items</span><span class="arr">→</span>
            <span class="step">Line-by-line diff</span><span class="arr">→</span>
            <span class="step">Price-memory check</span><span class="arr">→</span>
            <span class="step">Morning message</span>
          </div>
          <ul>
            <li><b>Five outcomes</b>: unordered items billed (red · costs money) / wrong spec shipped (red) / order-delivery mismatch (amber · affects tomorrow's menu) / price anomaly (violet · vs. 4-week price memory, with sparkline) / ordering-habit nudge (shrimp ordered without 16/20 vs 21/25 — a gap that leaks every time)</li>
            <li><b>Collation desk</b>: WeChat bubbles (voice-note-transcript styling) on the left, a yellow-carbon-paper delivery slip on the right, numbered pins jumping both ways — every finding quotes the originals</li>
            <li><b>Wording red line</b>: a discrepancy is not an accusation. The generated message always reads "wrong truck? typo on the slip?" — face-saving, account-clearing, and never a kickback insinuation. Judgment stays with the owner</li>
            <li><b>Scope red line</b>: strictly purchasing-side. Never touches revenue, never touches taxes — that's both the compliance boundary and the reason owners dare to use it</li>
          </ul>
          <p style="margin-top:12px;font-size:14px;color:var(--ink-soft)">
            Parsing is a local dictionary engine (high-frequency Chinese-restaurant SKUs + Chinese numerals + spec regex); the diff is deterministic math, <b>fully playable offline</b>. Connect an API key to parse any format with a real model (extractions verified against the originals) — <b>the number comparison always runs locally</b>. The real product is photo → OCR → low-confidence fields to human review.</p>`
      },
      {
        label: "Business model",
        html: `<ul>
            <li><b>Subscription (repeat-use)</b>: per store per month — the first time this horizontal diff engine lands on a <b>daily-frequency need</b>: daily ordering + monthly reconciliation + a going-concern buyer, a far better frequency structure than low-frequency consumer plays</li>
            <li><b>Willingness-to-pay checkpoint</b>: reconciliation gaps typically run hundreds to over a thousand dollars a month in real money — the tool pays for itself in one evening</li>
            <li><b>Data byproduct</b>: audits accumulate per-supplier per-item price curves → "purchase price monitoring" (series Demo 06) grows out naturally, no extra data entry</li>
            <li><b>Channel hypothesis</b>: distributor sales reps physically walk through dozens of restaurants daily — "my invoices survive an audit" is a sales weapon for honest distributors; a channel-led distribution path exists</li>
          </ul>`
      },
      {
        label: "Market",
        html: `<p class="mk-bench"><b>Benchmarks · who already profits from this</b></p>
          <ul>
            <li><b>MarginEdge / xtraCHEF (acquired by Toast)</b>: US restaurant invoice digitization and cost management SaaS, per-store monthly fees — proof that "turning paper slips into checkable data" is a mature paid category.</li>
            <li><b>Toast (NYSE:TOST)</b>: the restaurant vertical-SaaS giant, validating per-store subscription + add-on modules at scale.</li>
            <li><b>Meicai / Shuhai / KuaiLv (China)</b>: capital-heavy supply-chain grinders — this product deliberately stays out of transactions and owns only the reconciliation layer.</li>
          </ul>
          <ul>
            <li><b>Doubly-ignored niche</b>: mainstream SaaS skips Chinese/WeChat/handwriting; Chinese domestic players can't come over — tens of thousands of US Chinese restaurants and hundreds of regional Chinese distributors run inside this crack</li>
            <li><b>Same engine, third time</b>: extract commitments from unstructured chat → diff against a formal document → discrepancy list (after trade inquiries and student housing) — and the first time it carries a repeat-purchase business model</li>
            <li><b>Local entry points</b>: regional distributor sales reps, the Greater Philadelphia Chinese restaurant association — walkable validation</li>
            <li style="color:var(--ink-soft)"><b>Risks (honest)</b>: mixed Chinese-English handwritten slip OCR is genuinely hard (mitigation: low-confidence fields go to human review, no full-automation promise); spec ambiguity (shrimp size standards) needs real corpus polishing; this demo starts from recognized text and the price memory is demo data</li>
          </ul>`
      }
    ]
  },
];

/* 据当前语言切换数据源（window.LANG 由 assets/i18n.js 在 <head> 里提前设好） */
if (window.LANG === 'en' && window.SITE_EN && window.PROJECTS_EN) {
  window.SITE = window.SITE_EN;
  window.PROJECTS = window.PROJECTS_EN;
}
