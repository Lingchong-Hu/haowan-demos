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
  // ▸ formUrl：去 腾讯问卷(wj.qq.com) 或 金数据(jinshuju.net) 建个表单，把链接填这里；留空则按钮显示「即将开放」
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
    subtitle: "同一个衣橱，换个场合就给你换一整套搭配",
    url: "demos/alta/", tags: ["数字衣橱","场合自适应","整套 look","纯离线"],
    phoneHint: "选衣橱单品 + 一个场合，看整套搭配",
    sections: [
      { label: "是什么",   html: `<p>把你的衣橱数字化，按「今天去哪」一键给出整套穿搭。</p>` },
      { label: "程序逻辑", html: `<h3>衣橱 + 场合 → 整套搭配</h3>
        <div class="flow"><span class="step">选单品</span><span class="arr">→</span><span class="step">选场合</span><span class="arr">→</span><span class="step">规则成套</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>每件单品带风格 / 正式度 / 色系标签</li>
          <li>场合（通勤 / 约会 / 运动 / 正式…）设定正式度与色调约束</li>
          <li>按约束在衣橱里挑出上装 + 下装 + 鞋 + 配饰成套，<b>换场合就换一套</b></li>
        </ul>
        <p style="margin-top:16px">本地规则匹配，<b>零外部依赖、纯离线</b>。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>订阅</b>：无限搭配、衣橱分析、缺件提醒（Whering / Cladwell 模式）</li>
          <li><b>导购分佣</b>：「补一件就成套」直接挂电商链接，CPS 分成</li>
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
          <li><b>本地化</b>：接小红书穿搭灵感、国内电商 SKU</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：录入衣橱有摩擦成本；搭配审美主观；本 demo 为规则演示</li>
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
    kicker: "法律科技 · 合同审查",
    title: "合同风险高亮",
    subtitle: "贴一段条款，自动标红风险点、用大白话解释、给改写",
    url: "demos/clause-risk/", tags: ["风险标红","大白话解释","逐条改写","纯离线"],
    phoneHint: "粘贴一段合同条款，看标红与改写",
    sections: [
      { label: "是什么",   html: `<p>把一段合同贴进去，自动标出风险条款、讲人话、并给更安全的改写。</p>` },
      { label: "程序逻辑", html: `<h3>贴条款 → 扫描 → 标红 + 改写</h3>
        <div class="flow"><span class="step">贴条款</span><span class="arr">→</span><span class="step">扫描风险</span><span class="arr">→</span><span class="step">标红 + 解释 + 改写</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>用风险模式库扫描你贴的<b>真实文本片段</b>（单方解除、自动续约、无限责任、管辖等）</li>
          <li>标红的就是你那段文字里的句子，解释与改写<b>逐条对应</b></li>
          <li>换一段合同，命中的风险点随文本变化</li>
        </ul>
        <p style="margin-top:16px">本地规则 / 模式匹配，<b>零外部依赖、纯离线</b>；带「非法律建议」声明。</p>` },
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
    subtitle: "描述症状，自适应追问，最后给「自护 / 远程 / 急诊」三级建议",
    url: "demos/ubie/", tags: ["自适应追问","三级分诊","可解释","纯离线"],
    phoneHint: "选主诉、回答追问，看分诊建议",
    sections: [
      { label: "是什么",   html: `<p>描述不舒服 → 它像分诊护士一样追问 → 给出该自己观察、还是远程问诊、还是赶紧去急诊。</p>` },
      { label: "程序逻辑", html: `<h3>主诉 → 追问 → 三级建议</h3>
        <div class="flow"><span class="step">描述症状</span><span class="arr">→</span><span class="step">自适应追问</span><span class="arr">→</span><span class="step">病因分级 + 三级建议</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>不同主诉 / 不同 yes-no 走出<b>不同追问路径</b>（决策树）</li>
          <li>据回答收敛可能方向，给紧急度评估</li>
          <li>末尾必给「自护 / 远程问诊 / 急诊」三级建议</li>
        </ul>
        <p style="margin-top:16px">本地决策树 + 规则，<b>零外部依赖、纯离线</b>；带「非医疗诊断」声明。</p>` },
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
    subtitle: "用大白话描述梦想的家，约束被真正解析并用于过滤",
    url: "demos/nl-home/", tags: ["自然语言解析","约束过滤","匹配理由","纯离线"],
    phoneHint: "输入一句话需求，看解析出的约束与匹配房源",
    sections: [
      { label: "是什么",   html: `<p>把「两室、预算 300 万、地铁附近、次新」这种人话解析成筛选条件并真去过滤房源。</p>` },
      { label: "程序逻辑", html: `<h3>一句话 → 解析约束 → 匹配房源</h3>
        <div class="flow"><span class="step">输入一句话</span><span class="arr">→</span><span class="step">解析约束</span><span class="arr">→</span><span class="step">过滤 + 匹配理由</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>从自由文本里抽取卧室数 / 预算 / 城市 / 房龄等约束</li>
          <li><b>违背约束的房源不出现</b>（真过滤，不是摆设）</li>
          <li>每套给「为什么匹配」，引用你说的条件</li>
        </ul>
        <p style="margin-top:16px">本地轻量 NLP（关键词 + 数值抽取）+ 过滤，<b>零外部依赖、纯离线</b>。</p>` },
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
    subtitle: "答几个生活问题，算出建议保额与险种 + 一句理由",
    url: "demos/insure-need/", tags: ["保额测算","随家庭变化","可解释","纯离线"],
    phoneHint: "填年龄 / 收入 / 家庭 / 负债，看保额建议",
    sections: [
      { label: "是什么",   html: `<p>回答几个关于收入、家庭、负债的问题，告诉你大概该买多少保额、买哪类险。</p>` },
      { label: "程序逻辑", html: `<h3>生活问题 → 测算 → 保额 + 险种</h3>
        <div class="flow"><span class="step">答生活问题</span><span class="arr">→</span><span class="step">测算需求</span><span class="arr">→</span><span class="step">保额 / 险种 + 理由</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>按收入替代 / 负债覆盖 / 家庭责任等规则估算保额</li>
          <li>建议<b>随年龄 / 家庭 / 收入 / 负债变化</b>，并给一句理由</li>
        </ul>
        <p style="margin-top:16px">本地测算模型（如 DIME 思路），<b>零外部依赖、纯离线</b>；带「非保险建议」声明。</p>` },
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

  /* ── 加新 demo：复制上面一段，改 id / no / cat / 内容 / url，即出现在首页 ── */
];
