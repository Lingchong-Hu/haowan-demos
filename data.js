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

  /* ───────────────────────── 03 whips ───────────────────────── */
  {
    id: "whips", no: "03", cat: "汽车",
    kicker: "汽车导购 · 个性化推荐",
    title: "汽车版 Tinder",
    subtitle: "左右滑几张车，学懂你的口味，从车库里精配 3 台 —— 把「逛车」变成「被读懂」",
    url: "demos/whips/", tags: ["滑卡学口味","可解释推荐","结果可截图分享","纯离线"],
    phoneHint: "左右滑卡片（或用 ❤ / ✕ 按钮），滑满 8 张看精配结果",
    sections: [
      { label: "是什么",   html: `<p>像刷交友软件一样<b>左右滑车</b>，滑着滑着它就读懂你的口味，再从车库精配 3 台。</p>` },
      { label: "程序逻辑", html: `<h3>一条「输入 → 读懂 → 结果」的弧线</h3>
        <div class="flow"><span class="step">滑 8+ 张（❤/✕）</span><span class="arr">→</span><span class="step">读出口味 DNA</span><span class="arr">→</span><span class="step">精配 3 台 + 理由</span><span class="arr">→</span><span class="step">存图 / 分享</span></div>
        <ul>
          <li><b>滑卡</b>：可拖拽、可用 ❤/✕ 按钮、可键盘 ← →</li>
          <li><b>口味 DNA</b>：统计右滑车型里各属性出现次数，提炼成画像</li>
          <li><b>精配</b>：每台给契合度 + 一句可追溯理由；再滑一组结果全变</li>
        </ul>
        <p style="margin-top:16px">背后的程序逻辑：右滑属性逐项加权打分、左滑反向惩罚、排序取前 3；理由直接引用你右滑里某属性的真实出现次数；结果是滑动集合的纯函数，口味编码进 URL，分享链接打开即复现；结果卡用 Canvas 现场合成分享图。<b>零外部依赖、纯离线。</b></p>` },
      { label: "商业模式", html: `<ul>
          <li><b>高意向线索变现</b>：选车高客单、高决策成本，「被读懂」的入口筛出真实意向，按线索 / 成交向经销商收费</li>
          <li><b>试驾 / 到店转化</b>：精配结果直接导向预约试驾；仿 Stitch Fix「造型费抵扣」设计「看车券」拉高到店</li>
          <li><b>订阅 / 会员</b>：持续推荐、换车提醒、保值估值等增值服务</li>
          <li><b>数据飞轮</b>：每次滑动都在优化匹配，越用越准、越准越粘 —— 这正是 Stitch Fix 的护城河</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>交互对标 Tinder（Match Group）</b>：「左右滑」本身就是被市场验证、自带病毒传播、且高度可商业化的偏好学习交互 —— 滑动即表态，越滑越懂。</li>
          <li><b>模式对标 Stitch Fix（美股 SFIX）</b>：填问卷学口味 → 造型师 + 数据精选 → <b>造型费可抵扣购买</b> → 数据飞轮。它在公开市场证明了「被读懂、被选」的个性化零售能规模化。</li>
          <li><b>落到汽车、已有人盈利</b>：Carvana（美股 CVNA）、英国 Auto Trader 与 Carwow 等，已靠把「高意向选车」转成成交 / 经销商线索赚钱。本 demo 把它们冷冰冰的「参数筛选器」换成<b>会读人的入口</b>。</li>
        </ul>
        <ul>
          <li><b>痛点真实</b>：买车决策重、信息过载，主流平台是货架式筛选器，没人帮你「读懂自己要什么」</li>
          <li><b>三段都被验证</b>：交互有 Tinder、模式有 Stitch Fix、汽车线上化盈利有 Carvana / Auto Trader / Carwow</li>
          <li><b>人群</b>：首购 / 换购的年轻消费者，习惯滑卡交互、愿意被「读懂」</li>
          <li><b>本地化</b>：可接入懂车帝 / 汽车之家式的车源与经销商线索体系，叠加微信内分享</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：车源价格数据是硬门槛；线索变现依赖经销商 BD；本 demo 为启发式占位，非真实模型</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 04 carsnap ───────────────────────── */
  {
    id: "carsnap", no: "04", cat: "汽车",
    kicker: "汽车导购 · 答题荐车",
    title: "答题荐车",
    subtitle: "答几个生活问题，给你三台真正合适的车 + 每台「为什么」",
    url: "demos/carsnap/", tags: ["引导式问答","可解释荐车","随答案变化","纯离线"],
    phoneHint: "依次答完几道选择题，看推荐与理由",
    sections: [
      { label: "是什么",   html: `<p>用一份「懂行朋友会问的几个问题」替代参数表，问完直接给三台车和理由。</p>` },
      { label: "程序逻辑", html: `<h3>引导式问答 → 打分 → 三台车</h3>
        <div class="flow"><span class="step">答 5 问</span><span class="arr">→</span><span class="step">匹配打分</span><span class="arr">→</span><span class="step">荐 3 车 + 理由</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>每道题对应一个偏好维度（预算 / 用途 / 人数 / 能源 / 风格）</li>
          <li>候选车按答案逐项加权打分，排序取前 3，理由引用你选的具体项</li>
          <li>换一组答案，推荐与理由随之变化，不是写死输出</li>
        </ul>
        <p style="margin-top:16px">引擎为本地规则匹配 + 加权评分，<b>零外部依赖、纯离线</b>。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>经销商线索</b>：高意向用户答完即有明确购车画像，按线索 / 到店 / 成交计费</li>
          <li><b>广告与置顶</b>：车型曝光、品牌专区（CarGurus / Edmunds 的主力收入）</li>
          <li><b>金融 / 保险导流</b>：购车贷款、车险比价分佣</li>
          <li><b>数据资产</b>：人群偏好沉淀，反哺厂商选品与投放</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>CarGurus（美股 CARG）/ TrueCar（美股 TRUE）/ Edmunds</b>：用算法 + 问答帮人缩小车型范围，靠经销商线索与广告盈利，模式已在美股验证。</li>
          <li><b>Carvana（美股 CVNA）</b>：把选车—买车搬到线上一条龙，证明汽车交易线上化可规模化。</li>
          <li><b>拍照识车一脉</b>：Google Lens、Blippar 的视觉识别能力，把「看到一台车想知道是啥」做成入口。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：普通人看不懂参数、怕被销售带节奏，需要中立的「懂行问几句」</li>
          <li><b>人群</b>：首购、预算有限、决策焦虑的大众消费者</li>
          <li><b>本地化</b>：接国内车源与经销商网络、新能源补贴政策</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：荐车准确度依赖真实车源与价格库；本 demo 用样例数据做启发式演示</li>
        </ul>` }
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

  /* ───────────────────────── 07 origin ───────────────────────── */
  {
    id: "origin", no: "07", cat: "金融",
    kicker: "个人理财 · 财务健康",
    title: "财务体检",
    subtitle: "答几道题，得一个财务健康分和最该做的下一步",
    url: "demos/origin/", tags: ["财务健康分","引用真实数字","可执行下一步","纯离线"],
    phoneHint: "填收入 / 储蓄 / 负债等，看健康分与建议",
    sections: [
      { label: "是什么",   html: `<p>像体检报告一样给你的财务打个分，并指出最该改善的一项。</p>` },
      { label: "程序逻辑", html: `<h3>问卷 → 健康分 → 下一步</h3>
        <div class="flow"><span class="step">答财务问卷</span><span class="arr">→</span><span class="step">算健康分</span><span class="arr">→</span><span class="step">分数 + 下一步</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>覆盖应急金、储蓄率、负债比、保险等维度，逐项打分加权成总分</li>
          <li>结果<b>引用你填的具体数字</b>（如储蓄率 12%），不是泛泛而谈</li>
          <li>下一步按最弱项给出，换答案分数与建议都变</li>
        </ul>
        <p style="margin-top:16px">本地评分模型，<b>零外部依赖、纯离线</b>；结果区带「非财务建议」声明。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>金融产品导流</b>：按薄弱项精准推荐储蓄 / 保险 / 还债工具，CPA / CPS 变现（Credit Karma 模式）</li>
          <li><b>订阅</b>：账户聚合、目标追踪、定期复检</li>
          <li><b>B 端</b>：作为银行 / 雇主福利的「财务健康」入口</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Credit Karma（被 Intuit 收购）</b>：免费给信用 / 财务评分，靠精准金融产品推荐变现，是「免费评分 → 导流」模式的标杆。</li>
          <li><b>Origin / Monarch / Rocket Money</b>：把收入、储蓄、负债聚合成财务全景与行动建议的订阅工具。</li>
          <li><b>NerdWallet（美股 NRDS）</b>：财务测评 + 内容 + 金融产品对比导流，公开市场盈利。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：多数人没有财务全景，焦虑却不知从何下手</li>
          <li><b>人群</b>：刚工作 / 成家、有理财焦虑的中青年</li>
          <li><b>本地化</b>：接国内储蓄 / 保险 / 公积金语境，避开投顾牌照红线</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：涉财需合规，本 demo 仅作交互展示、非财务建议</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 08 robo-core ───────────────────────── */
  {
    id: "robo-core", no: "08", cat: "金融",
    kicker: "财富管理 · 智能投顾",
    title: "智能配置",
    subtitle: "答几道风险题，资产配置饼图与增长曲线实时变化",
    url: "demos/robo-core/", tags: ["风险画像","实时配置","增长曲线","纯离线"],
    phoneHint: "拖动风险问卷，看饼图与曲线随之变化",
    sections: [
      { label: "是什么",   html: `<p>把「你能承受多大波动」翻译成一张资产配置饼图和一条增长曲线。</p>` },
      { label: "程序逻辑", html: `<h3>风险问卷 → 配置 → 饼图 + 曲线</h3>
        <div class="flow"><span class="step">答风险题</span><span class="arr">→</span><span class="step">算风险分</span><span class="arr">→</span><span class="step">饼图 + 增长曲线</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>问卷算出风险承受分，映射到股 / 债 / 现金 / 另类的配置比例</li>
          <li>饼图随答案<b>实时重画</b>，增长曲线按预期收益与波动模拟</li>
          <li>越激进股票占比越高、曲线越陡也越抖</li>
        </ul>
        <p style="margin-top:16px">本地配置模型 + 曲线模拟，<b>零外部依赖、纯离线</b>；带「非投资建议」声明。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>管理费（AUM）</b>：按资产规模收年费，是智能投顾主力收入（Betterment / Wealthfront 模式）</li>
          <li><b>增值订阅</b>：税务优化、目标规划、人工顾问加配</li>
          <li><b>B 端 / 白标</b>：给银行、券商提供智能投顾引擎</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Betterment / Wealthfront</b>：美国两大独立智能投顾，问卷定风险 → 自动配置 ETF 组合，各管理数百亿美元，靠管理费盈利。</li>
          <li><b>Vanguard Digital Advisor / Schwab Intelligent Portfolios</b>：传统巨头的低费率智能投顾，规模更大。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：普通人不会做资产配置，传统理财门槛高、不透明</li>
          <li><b>人群</b>：有结余、想省心理财的中青年</li>
          <li><b>本地化</b>：国内需基金投顾牌照，可与持牌机构合作落地</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：涉投资强监管，本 demo 仅作交互展示、非投资建议</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 09 oboe ───────────────────────── */
  {
    id: "oboe", no: "09", cat: "教育",
    kicker: "教育 · AI 生成课程",
    title: "秒变一门课",
    subtitle: "输入任意主题，立刻生成一门有章节、有测验的结构化迷你课",
    url: "demos/oboe/", tags: ["主题即课程","章节 + 测验","结构化输出","纯离线"],
    phoneHint: "输入一个想学的主题，看生成的课程大纲",
    sections: [
      { label: "是什么",   html: `<p>把「我想学 X」一句话变成一门带章节和小测的迷你课。</p>` },
      { label: "程序逻辑", html: `<h3>主题 → 大纲 → 章节 + 测验</h3>
        <div class="flow"><span class="step">输入主题</span><span class="arr">→</span><span class="step">生成大纲</span><span class="arr">→</span><span class="step">章节 + 每章测验</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>任意主题都拆成 ≥3 个章节，每章给要点 + 至少 1 道测验</li>
          <li>用主题关键词驱动模板化结构，<b>换主题课程内容随之变</b></li>
          <li>测验可作答、给反馈，形成最小学习闭环</li>
        </ul>
        <p style="margin-top:16px">本地结构化生成（模板 + 主题填充），<b>零外部依赖、纯离线</b>。</p>` },
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
    subtitle: "答对升难度、答错降难度，结尾给一个预测分",
    url: "demos/adaptive-quiz/", tags: ["难度自适应","预测分","即时反馈","纯离线"],
    phoneHint: "连续答题，留意难度随对错变化",
    sections: [
      { label: "是什么",   html: `<p>题目难度随你的对错实时调整，最后预测你的水平分。</p>` },
      { label: "程序逻辑", html: `<h3>答题 → 自适应 → 预测分</h3>
        <div class="flow"><span class="step">答题</span><span class="arr">→</span><span class="step">难度自适应</span><span class="arr">→</span><span class="step">收敛 + 预测分</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>每题维护一个能力估计：答对上调、答错下调，下一题按当前难度出</li>
          <li>难度<b>真的随对错变化</b>，逐步收敛到你的水平</li>
          <li>结尾据答题轨迹给出预测分</li>
        </ul>
        <p style="margin-top:16px">本地简化版 IRT / CAT 逻辑，<b>零外部依赖、纯离线</b>。</p>` },
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
    subtitle: "答几个偏好，生成逐时行程，地图标点与行程一一对应",
    url: "demos/mindtrip/", tags: ["逐时行程","交互地图","偏好驱动","纯离线"],
    phoneHint: "选目的地与偏好，看行程表与地图标点",
    sections: [
      { label: "是什么",   html: `<p>说清楚去哪、玩几天、喜欢啥，它就排出逐时行程并在地图上标好点。</p>` },
      { label: "程序逻辑", html: `<h3>偏好 → 排程 → 行程 + 地图</h3>
        <div class="flow"><span class="step">答偏好</span><span class="arr">→</span><span class="step">排行程</span><span class="arr">→</span><span class="step">逐时表 + 地图标点</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>按天数 / 节奏 / 兴趣从景点库选点并排序成逐时表</li>
          <li>每个行程项<b>在地图上有对应标点</b>，一一映射</li>
          <li>换偏好 → 行程与标点都变</li>
        </ul>
        <p style="margin-top:16px">本地排程算法 + 内置地图渲染，<b>零外部依赖、纯离线</b>。</p>` },
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
          <li><b>本地化</b>：接高德 / 大众点评 POI 与国内预订生态</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：POI 时效与可预订性是关键；本 demo 用样例景点演示</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 16 ollie ───────────────────────── */
  {
    id: "ollie", no: "16", cat: "餐饮",
    kicker: "餐饮 · 智能食谱",
    title: "冰箱出菜谱",
    subtitle: "勾一勾手头有的食材，告诉你现在就能做的菜",
    url: "demos/ollie/", tags: ["现有食材匹配","缺料最少","换料换菜","纯离线"],
    phoneHint: "勾选你有的食材，看现在能做的菜",
    sections: [
      { label: "是什么",   html: `<p>勾选冰箱里现有的食材，给你「现在就能做」的菜（最多缺一两样）。</p>` },
      { label: "程序逻辑", html: `<h3>勾食材 → 匹配 → 能做的菜</h3>
        <div class="flow"><span class="step">勾食材</span><span class="arr">→</span><span class="step">匹配菜谱</span><span class="arr">→</span><span class="step">现在能做的菜</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>菜谱按「所需食材被满足的比例」排序</li>
          <li>只出你选的食材能做的（最多缺 1–2 样并标出）</li>
          <li><b>换食材 → 菜变</b></li>
        </ul>
        <p style="margin-top:16px">本地集合匹配 + 覆盖度评分，<b>零外部依赖、纯离线</b>。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>生鲜导购</b>：缺的食材一键加购，对接生鲜电商 CPS（Yummly / Samsung Food 模式）</li>
          <li><b>订阅</b>：营养偏好、家庭菜单、减脂食谱</li>
          <li><b>智能厨房</b>：与电器联动（一键发送到烤箱 / 菜谱投屏）</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>SuperCook</b>：经典「按现有食材找菜谱」工具，海量食材匹配，靠广告 / 导流。</li>
          <li><b>Samsung Food（原 Whisk）</b>：食谱 + 购物清单 + 智能厨房生态，三星收购后做平台。</li>
          <li><b>Yummly（被 Whirlpool 收购）</b>：个性化食谱推荐 + 一键购齐，硬件 + 食谱变现。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：「冰箱有货却不知做啥」「不想为一道菜买一堆料」</li>
          <li><b>人群</b>：在家做饭的上班族、家庭主厨、减脂人群</li>
          <li><b>本地化</b>：接中餐菜谱与盒马 / 叮咚买菜生态</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：菜谱库覆盖度决定体验；本 demo 用样例菜谱演示</li>
        </ul>` }
    ]
  },

  /* ───────────────────────── 17 mealplan ───────────────────────── */
  {
    id: "mealplan", no: "17", cat: "餐饮",
    kicker: "健康饮食 · 膳食规划",
    title: "7 天饮食计划",
    subtitle: "答份饮食问卷，生成 7 天计划 + 按品类归并的购物清单",
    url: "demos/mealplan/", tags: ["7 天计划","购物清单归并","随偏好变","纯离线"],
    phoneHint: "选饮食偏好，看周计划与购物清单",
    sections: [
      { label: "是什么",   html: `<p>填饮食偏好和目标，给你一周吃什么 + 一张整理好的采购清单。</p>` },
      { label: "程序逻辑", html: `<h3>问卷 → 排餐 → 计划 + 清单</h3>
        <div class="flow"><span class="step">答饮食问卷</span><span class="arr">→</span><span class="step">排 7 天餐</span><span class="arr">→</span><span class="step">周计划 + 购物清单</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li>按口味 / 忌口 / 目标从菜谱库排满 7 天三餐，<b>随偏好变化</b></li>
          <li>把所有菜的食材汇总，<b>按品类归并</b>成购物清单</li>
        </ul>
        <p style="margin-top:16px">本地排餐 + 清单聚合，<b>零外部依赖、纯离线</b>。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>订阅</b>：个性餐单、营养追踪、家庭份量（Eat This Much / PlateJoy 模式）</li>
          <li><b>生鲜 / 净菜导购</b>：购物清单一键下单分佣</li>
          <li><b>B 端</b>：健身房 / 营养师 / 保险的健康管理工具</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Eat This Much</b>：自动生成符合热量 / 宏量目标的膳食计划，订阅制。</li>
          <li><b>PlateJoy（被 Everyday Health 收购）</b>：个性化餐单 + 购物清单，订阅 + 与零售 / 保险合作。</li>
          <li><b>Mealime / Lifesum</b>：周餐计划 + 采购清单的高留存健康 App。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：「这周吃什么」决策疲劳 + 想吃得健康却没规划</li>
          <li><b>人群</b>：减脂 / 健身 / 家庭备餐人群</li>
          <li><b>本地化</b>：接中餐菜系与国内生鲜配送</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：营养建议需专业背书；本 demo 为规则化演示，非营养处方</li>
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
    kicker: "宠物医疗 · AI 兽医",
    title: "AI 兽医",
    subtitle: "不一上来就甩通用建议 —— 先反问澄清，再给针对性建议",
    url: "demos/pet-vet/", tags: ["先反问澄清","针对性建议","可解释","纯离线"],
    phoneHint: "描述宠物症状，先回答它的追问",
    sections: [
      { label: "是什么",   html: `<p>像真兽医一样，先问清楚（多大、多久、有没有别的症状）再给建议，而不是模板话术。</p>` },
      { label: "程序逻辑", html: `<h3>描述 → 反问澄清 → 建议</h3>
        <div class="flow"><span class="step">描述症状</span><span class="arr">→</span><span class="step">反问澄清</span><span class="arr">→</span><span class="step">针对性建议</span><span class="arr">→</span><span class="step">分享</span></div>
        <ul>
          <li><b>至少反问一次</b>澄清关键信息，再给建议</li>
          <li>建议随澄清答案变化，不是开局甩通用话</li>
          <li>含「非诊断」声明与就医提示</li>
        </ul>
        <p style="margin-top:16px">本地对话状态机 + 规则，<b>零外部依赖、纯离线</b>。</p>` },
      { label: "商业模式", html: `<ul>
          <li><b>订阅问诊</b>：无限在线咨询 + 应急（Pawp / Dutch 模式）</li>
          <li><b>导诊与处方</b>：导向线下医院、处方药 / 保健品配送</li>
          <li><b>分诊降本</b>：先 AI 澄清再转真人，提升兽医效率</li>
        </ul>` },
      { label: "市场分析", html: `<p class="mk-bench"><b>对标 · 谁已靠这套盈利</b></p>
        <ul>
          <li><b>Pawp</b>：宠物在线兽医 + 应急基金，月费订阅模式。</li>
          <li><b>Vetster / Airvet</b>：宠物视频问诊平台，按次 / 订阅收费。</li>
          <li><b>Dutch.com</b>：远程宠物诊疗 + 处方配送，订阅制。</li>
        </ul>
        <ul>
          <li><b>痛点</b>：半夜宠物不舒服、去医院前想先问问、怕过度医疗</li>
          <li><b>人群</b>：宠物主人，尤其异地 / 夜间场景</li>
          <li><b>本地化</b>：接国内宠物医院与互联网诊疗规范</li>
          <li style="color:var(--ink-soft)"><b>风险（如实说）</b>：诊疗需持证兽医，本 demo 仅作交互展示、非诊断</li>
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
    subtitle: "剪刀石头布，但对手是一个拼命想给你建模的 AI——这一次，被猜中是你输",
    url: "demos/unmask/",
    tags: ["反建模博弈", "实时自适应预测器", "可预测度仪表", "强裂变战报", "纯前端无后端"],
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
            <span class="step">你出手</span><span class="arr">→</span>
            <span class="step">AI 押注你这手</span><span class="arr">→</span>
            <span class="step">出克制手</span><span class="arr">→</span>
            <span class="step">揭示 + 记分</span><span class="arr">→</span>
            <span class="step">复盘它抓到的规律</span>
          </div>
          <p style="margin-top:14px">核心是一个<b>真实的自适应预测器（不是大模型，是一套在线学习的算法）</b>：
          频率偏好、一阶/二阶马尔可夫连招、"急着扳回上一局"、连续重复——5 个预测器并行，
          按各自<b>近期命中率动态加权、自动切换</b>最准的那个来押你。</p>
          <ul>
            <li>它出的手克制你 = <b>被看穿</b>；你克制它 = 骗过它；同手 = 平。</li>
            <li><b>可预测度 = 被看穿率</b>，<b>33% 是真随机基线</b>；越高说明它越摸透你。</li>
            <li>终局复盘把它抓到的规律摊开给你看：你的偏手、下意识连招、被看穿后的反应、它主要靠哪招识破你。</li>
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

  /* ── 加新 demo：复制上面一段，改 id / no / cat / 内容 / url，即出现在首页 ── */
];
