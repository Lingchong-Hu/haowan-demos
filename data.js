/* ═══════════════════════════════════════════════════════════════════════════
   好玩的东西 · 站点数据（唯一内容来源）
   ───────────────────────────────────────────────────────────────────────────
   ▸ 加一个新 demo：往 PROJECTS 数组里加一条对象即可，首页卡片 + 详情页自动生成。
   ▸ 暂未上线的 demo：把 url 留空字符串 ""，卡片会显示「即将上线」且不可点。
   ▸ 详情页用 project.html?id=<你的 id> 访问；首页卡片会自动指过去。
   ▸ sections 里的 html 支持任意 HTML（含下面用到的 .flow / .step / .arr 步骤条）。
   ═══════════════════════════════════════════════════════════════════════════ */

window.SITE = {
  brand: "好玩的东西",
  hero: {
    kicker: "可亲手体验的产品原型 · 思考 · 自我介绍",
    title: "把想法做成<br>能点开就玩的东西",
    lede: "这里收集我做的一些可交互产品 Demo——不是截图，是真能点的应用；" +
          "每个都附上程序逻辑、商业模式与市场分析，方便判断它的现实可行性。" +
          "另有一些关于 AI 组织架构与开发流程的思考。",
    pills: ["✦ 全套界面可点击", "✦ 真实状态流转", "✦ 手机 / 微信内可打开"]
  },

  // 自我介绍（来自个人网站，可随时改）
  author: {
    name: "Lingchong Hu · 胡凌冲",
    role: "Founder, Iterant AI",
    blurb: "在「意图」与「软件」的接缝处构建产品。下面这些 demo 多是周末把一个想法快速做成可点闭环的产物——" +
           "与其用一页文档说服你，不如让你亲手点几下。",
    facts: ["Iterant AI 创始人", "Penn · MCIT '25", "Philadelphia"],
    site: "https://lingchong-hu.github.io/",
    siteLabel: "个人网站 ↗"
  },

  // 思考类页面（文案后续补充，先占位）
  thoughts: [
    {
      kicker: "Thinking · 组织",
      title: "AI 时代的组织架构",
      desc: "当 agent 成为团队成员，团队该怎么搭？角色、权责、人与 AI 的协作边界——一些正在成形的思考。",
      href: "thoughts/ai-org.html"
    },
    {
      kicker: "Thinking · 流程",
      title: "AI 原生的开发流程",
      desc: "从需求到上线，用 AI 重写每一环：规格即代码、demo 优先、人来把关有后果的那一步。",
      href: "thoughts/dev-process.html"
    }
  ],

  // 联系 / 留下想法
  // ▸ wechatId：填你的微信号（主推，手机/电脑都能复制后搜索添加）
  // ▸ email：填长期邮箱（school 邮箱 10 月过期，建议换个人邮箱）
  // ▸ formUrl：去 腾讯问卷(wj.qq.com) 或 金数据(jinshuju.net) 建个表单，把链接填这里；留空则按钮显示「即将开放」
  // ▸ wechatQR：可选——把微信二维码图片存为 assets/wechat-qr.png 就会额外显示一张图
  contact: {
    intro: "看完有什么想法、想做的，或者有具体需求——欢迎直接找我，或者留下你的需求，我会一条条看。",
    wechatId: "在这里填你的微信号",
    email: "在这里填长期邮箱",
    formUrl: "",
    formLabel: "说说你的想法 / 留下需求",
    wechatQR: "assets/wechat-qr.png"
  }
};

window.PROJECTS = [
  /* ───────────────────────────── Project 01 ───────────────────────────── */
  {
    id: "atelier",
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

  /* ───────────────────────────── Project 02 ───────────────────────────── */
  {
    id: "guardian",
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
  }

  /* ── 加新 demo：复制上面一段，改 id / no / 内容 / url，即出现在首页 ── */
];
