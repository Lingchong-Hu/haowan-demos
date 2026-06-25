/* sonar — 外贸询盘操盘手 / Inquiry radar for foreign trade
   贴一封外国买家询盘 → AI 判断买家真实度 / 意图 / 砍价空间 + 起草买家语言的回复 + 报价策略。
   卖点：AI 时代特有——以前靠资深双语业务员的「人肉判断 + 写邮件」，
        现在 AI 7×24 多语种操盘，中小外贸厂也能有「金牌业务员」级别的首轮响应。
   引擎走全站共享连接器 GG.llm；未连接时给示例样张，不空白。 */
(function(){
const SLUG = 'sonar';

const TYPES = {
  real_importer:  {label:'真实进口商', color:'#2d9e7b', icon:'🎯'},
  reseller:       {label:'分销 / 贸易商', color:'#3b5bdb', icon:'🏬'},
  tire_kicker:    {label:'随便问问', color:'#8a8a93', icon:'🪧'},
  scam_risk:      {label:'疑似诈骗', color:'#d64545', icon:'🚨'},
  competitor_probe:{label:'同行套价', color:'#d4882b', icon:'🕵️'}
};

const EXAMPLES = [
  {em:'📦', label:'认真的德国买家',
   text:`Dear Sales Team,

We are Müller Haushalt GmbH, a kitchenware distributor based in Cologne, Germany (mueller-haushalt.de). We saw your stainless steel vacuum flask (model VF-500) and are interested.

Could you please quote your FOB price for 5,000 pcs? We will also need CE and LFGB certificates. Please advise the lead time and whether OEM logo printing is possible.

Looking forward to your reply.
Best regards,
Thomas Berger, Purchasing`},
  {em:'🕵️', label:'像同行套价',
   text:`Hi,
Please send me your complete price list and your factory address. Also what is your lowest price for everything? Need it today.
Thanks`},
  {em:'🚨', label:'诈骗味很重',
   text:`URGENT BUSINESS!! We want to order 50,000 units IMMEDIATELY for a government project. Please send your company bank account so we transfer the deposit today. My agent will contact you on WhatsApp for the rest. God bless.`},
  {em:'💬', label:'其实不是询盘',
   text:`Hello friend, how are you today? I really like the photos on your Instagram page, you have a nice factory. Have a good day!`}
];

const SYS = [
  '你是「Sonar 外贸询盘操盘手」：帮中国外贸业务员分析一封外国买家询盘，判断买家成色与意图，并起草专业回复与报价策略。',
  '只输出严格 JSON（单个对象），不要 markdown 代码块、不要任何前言或解释文字。',
  'JSON 结构：',
  '{',
  '  "is_inquiry": boolean,        // 这是否是一封真正的商业询盘 / 采购意向',
  '  "buyer_type": string,         // 只能是：real_importer | reseller | tire_kicker | scam_risk | competitor_probe',
  '  "score": number,              // 0-100，真实成交意向分（越高越值得优先投入）',
  '  "summary": string,            // 一句简体中文：这是个什么买家、值不值得认真对待',
  '  "signals": [                  // 3-6 条判断依据',
  '    {"label": string, "good": boolean}   // good=true 正向信号；false=风险/可疑信号；label 用简体中文',
  '  ],',
  '  "hidden_need": string,        // 简体中文：买家没明说、但其实最在意的点（交期/认证/MOQ/价格/账期/质量等）',
  '  "nego_room": string,          // 简体中文：砍价空间与报价建议（要不要留余地、报高还是报实）',
  '  "reply_lang": string,         // 建议回复语言（如 English / Deutsch）',
  '  "reply_draft": string,        // 用【买家语言】写的专业回复邮件草稿，包含称呼、要点回应与引导下一步；不要中文',
  '  "reply_strategy": string,     // 简体中文：这封回复为什么这么写、价格如何锚定、留了哪些钩子',
  '  "next_step": string           // 简体中文：业务员下一步该做的一件最关键的动作',
  '}',
  '硬规则：',
  '1) buyer_type 必须取上面 5 个枚举值之一，且与 signals、score 自洽。',
  '2) 风险信号要点名具体证据：如「索要工厂地址但无公司信息」「催促打款+只给 WhatsApp」「无抬头无数量的群发」等。',
  '3) reply_draft 必须用买家的语言（看不出就用 English），语气专业、简洁、有推进力；针对这封询盘的具体内容回应，不要通用模板。',
  '4) 对 scam_risk / competitor_probe，回复要稳妥试探、先要资质/细节再报价，绝不直接把完整价目表和工厂地址给出去。',
  '5) 若输入根本不是询盘（寒暄、夸赞、广告、闲聊），is_inquiry=false，buyer_type 给 tire_kicker，其余字段可简略；不要硬编一封报价。',
  '6) 除 reply_draft 用买家语言外，其余说明字段一律简体中文。'
].join('\n');

function normalize(d){
  d = d || {};
  const bt = TYPES[d.buyer_type] ? d.buyer_type : 'tire_kicker';
  let score = parseInt(d.score,10); if(isNaN(score)) score = 0; score = GG.clamp(score,0,100);
  return {
    is_inquiry: !!d.is_inquiry,
    buyer_type: bt,
    score,
    summary: d.summary ? String(d.summary) : '',
    signals: Array.isArray(d.signals) ? d.signals.filter(s=>s&&s.label).map(s=>({
      label:String(s.label), good:!!s.good })).slice(0,6) : [],
    hidden_need: d.hidden_need ? String(d.hidden_need) : '',
    nego_room: d.nego_room ? String(d.nego_room) : '',
    reply_lang: d.reply_lang ? String(d.reply_lang) : 'English',
    reply_draft: d.reply_draft ? String(d.reply_draft) : '',
    reply_strategy: d.reply_strategy ? String(d.reply_strategy) : '',
    next_step: d.next_step ? String(d.next_step) : ''
  };
}

/* 评分环 SVG */
function gauge(score, color){
  const r=44, c=2*Math.PI*r, off=c*(1-score/100), size=110;
  return GG.el('div',{class:'sn-gauge', html:
    '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'">'+
    '<circle cx="55" cy="55" r="'+r+'" fill="none" stroke="var(--line)" stroke-width="9"/>'+
    '<circle cx="55" cy="55" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="9" stroke-linecap="round" '+
      'stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" transform="rotate(-90 55 55)"/>'+
    '<text x="55" y="51" text-anchor="middle" font-size="30" font-weight="800" fill="'+color+'">'+score+'</text>'+
    '<text x="55" y="71" text-anchor="middle" font-size="11" fill="var(--ink-3)">意向分</text>'+
    '</svg>'});
}

/* ════════════════════════ UI ════════════════════════ */
let main, taEl, resultMount;

function intro(){
  main = GG.mountShell(SLUG);

  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '一封询盘，先看清是不是真买家'),
    GG.el('p',{class:'sn-lede'},
      '把外国买家发来的询盘贴进去——AI 先判断这是真进口商、贸易商、随便问问、还是同行套价/诈骗，'+
      '点出他没明说的真实在意点和砍价空间，再用买家的语言起草一封专业回复，附上报价策略。')
  ));

  main.appendChild(GG.llm.bar(()=>{}));

  taEl = GG.el('textarea',{class:'field', style:{minHeight:'150px'},
    placeholder:'把买家的询盘原文粘到这里…（英文、德文、阿语都行）'});

  main.appendChild(GG.el('div',{class:'sn-eg-label'}, '没有现成询盘？点个例子直接跑 ↓'));
  const egs = GG.el('div',{class:'sn-egs'});
  EXAMPLES.forEach(e=> egs.appendChild(
    GG.el('button',{class:'sn-eg', onClick:()=>{ taEl.value=e.text; run(e.text); }},
      GG.el('span',{class:'em'}, e.em), e.label)));
  main.appendChild(egs);

  main.appendChild(GG.el('div',{class:'sn-inwrap'}, taEl));
  main.appendChild(GG.el('button',{class:'btn primary lg block sn-go',
    onClick:()=>run(taEl.value)}, '📡 分析这封询盘'));

  resultMount = GG.el('div'); main.appendChild(resultMount);

  main.appendChild(GG.el('div',{class:'sn-chain', html:
    '出海四步：选品 → 定价/选市场 → 上架本地化 → <b style="color:var(--accent)">询盘成交（你在这）</b>'}));
}

async function run(text){
  text = (text||'').trim();
  if(!text){ GG.toast('先贴一封询盘，或点个例子'); return; }

  GG.clear(resultMount);
  const stage = GG.el('div'); resultMount.appendChild(stage);
  stage.scrollIntoView({behavior:'smooth', block:'center'});

  if(!GG.llm.connected()){
    GG.clear(stage);
    stage.appendChild(renderResult(SAMPLE, false));
    stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'14px'}},
      GG.el('p',{class:'sn-lede', style:{textAlign:'center', margin:'0 auto'}},
        '👆 这是离线示例样张。点上方「连接 AI 升级」填一个 Anthropic Key，'+
        '即可对你收到的真实询盘做分析与起草回复。')));
    GG.toast('未连接 AI，先看示例样张');
    return;
  }

  const t = GG.thinking(stage, ['读这封询盘…','核对买家成色与风险信号…','推断他真正在意的点…','起草回复与报价策略…'], 1900);
  let data;
  try{
    const [obj] = await Promise.all([GG.llm.json(SYS, text, {max_tokens:2400}), t]);
    data = normalize(obj);
  }catch(err){
    GG.clear(stage); stage.appendChild(renderError(err)); return;
  }
  GG.clear(stage);
  stage.appendChild(renderResult(data, true));
  stage.scrollIntoView({behavior:'smooth', block:'start'});
}

function renderResult(d, fromAI){
  const T = TYPES[d.buyer_type];
  const card = GG.el('div',{class:'card pad result'});
  card.appendChild(GG.llm.badge(fromAI));

  // 头：评分环 + 类型 + 一句话
  card.appendChild(GG.el('div',{class:'sn-head'},
    gauge(d.score, T.color),
    GG.el('div',{class:'sn-headinfo'},
      GG.el('span',{class:'sn-type', style:{background:T.color}}, T.icon+' '+T.label),
      d.summary ? GG.el('div',{class:'sn-summary'}, d.summary) : null)));

  // 信号两栏（正向在前）
  if(d.signals.length){
    const wrap = GG.el('div',{class:'sn-sigs'});
    d.signals.slice().sort((a,b)=> (b.good?1:0)-(a.good?1:0)).forEach(s=>
      wrap.appendChild(GG.el('div',{class:'sn-sig '+(s.good?'good':'bad')},
        GG.el('span',{class:'ic'}, s.good?'✓':'⚠'), GG.el('span', null, s.label))));
    card.appendChild(wrap);
  }

  // 洞察卡
  const cards = GG.el('div',{class:'sn-cards'});
  if(d.hidden_need) cards.appendChild(GG.el('div',{class:'sn-ic'},
    GG.el('div',{class:'h'}, '💡 他真正在意'), GG.el('div',{class:'b'}, d.hidden_need)));
  if(d.nego_room) cards.appendChild(GG.el('div',{class:'sn-ic'},
    GG.el('div',{class:'h'}, '💰 砍价空间 / 报价'), GG.el('div',{class:'b'}, d.nego_room)));
  if(cards.children.length) card.appendChild(cards);

  // 回复草稿
  if(d.reply_draft){
    card.appendChild(GG.el('div',{class:'sn-mailhead'},
      GG.el('span', null, '✉️ 回复草稿'),
      GG.el('span',{class:'sn-maillang'}, d.reply_lang)));
    card.appendChild(GG.el('div',{class:'sn-mail'}, d.reply_draft));
    if(d.reply_strategy) card.appendChild(GG.el('div',{class:'sn-strategy'},
      GG.el('b', null, '为什么这样回'), d.reply_strategy));
  }

  // 下一步
  if(d.next_step) card.appendChild(GG.el('div',{class:'sn-next'},
    GG.el('span', null, '➡️'), GG.el('span', null, [GG.el('b',null,'下一步：'), ' '+d.next_step])));

  // 工具栏
  card.appendChild(GG.el('div',{class:'sn-bottom'},
    GG.el('button',{class:'btn primary', onClick:()=>GG.copyText(d.reply_draft||'')}, '📋 复制回复邮件'),
    GG.el('button',{class:'btn', onClick:()=>GG.copyText(fullText(d))}, '📝 复制完整分析'),
    GG.el('button',{class:'btn', onClick:()=>{ GG.clear(resultMount); taEl.focus();
      taEl.scrollIntoView({behavior:'smooth',block:'center'}); }}, '↻ 换一封')));
  return card;
}

function fullText(d){
  const T = TYPES[d.buyer_type];
  const L=['【询盘分析】'+T.icon+' '+T.label+'　意向分 '+d.score+'/100'];
  if(d.summary) L.push(d.summary);
  if(d.signals.length){ L.push(''); d.signals.forEach(s=>L.push((s.good?'✓ ':'⚠ ')+s.label)); }
  if(d.hidden_need) L.push('\n💡 他真正在意：'+d.hidden_need);
  if(d.nego_room) L.push('💰 砍价空间：'+d.nego_room);
  if(d.reply_draft){ L.push('\n✉️ 回复草稿（'+d.reply_lang+'）：'); L.push(d.reply_draft); }
  if(d.reply_strategy) L.push('\n策略：'+d.reply_strategy);
  if(d.next_step) L.push('➡️ 下一步：'+d.next_step);
  L.push('\n—— Sonar 外贸询盘操盘手 · 好玩的东西  '+location.href);
  return L.join('\n');
}

function renderError(err){
  const card = GG.el('div',{class:'card pad'});
  card.appendChild(GG.el('div',{class:'sn-oops'},
    GG.el('div',{class:'big'}, '🔌'),
    GG.el('h3', null, '这次没成功'),
    GG.el('p', null, GG.llm.errMsg(err)+'。点上方「连接 AI」检查 Key，或重试。')));
  card.appendChild(GG.el('div',{class:'center', style:{marginTop:'12px'}},
    GG.el('button',{class:'btn primary', onClick:()=>run(taEl.value)}, '重试')));
  return card;
}

/* ── 离线示例样张 / 开发自检 ── */
const SAMPLE = {
  is_inquiry:true, buyer_type:'real_importer', score:84,
  summary:'德国厨具分销商的正式询盘，有公司、有型号、有数量和认证要求——值得当 A 类客户优先跟进。',
  signals:[
    {label:'写明公司名与官网域名（Müller Haushalt GmbH / mueller-haushalt.de）', good:true},
    {label:'指名具体型号 VF-500，说明做过功课', good:true},
    {label:'给出明确数量 5000 pcs，问 FOB 价', good:true},
    {label:'主动要求 CE / LFGB 认证，是合规正规渠道', good:true},
    {label:'问 OEM 印 logo——有自有品牌、长期合作潜力', good:true},
    {label:'暂未提目标价与账期，需在回复中试探', good:false}
  ],
  hidden_need:'表面问价，真正在意的是「你能不能稳定供货、证照齐全、能贴他自己的牌」——交期与认证比单价更决定成交。',
  nego_room:'5000 pcs 属中等单，首报可在底价上留 8%-12% 余地；先报含认证、含 OEM 的「打包价」，把竞争从单价拉到综合方案，别一上来报地板价。',
  reply_lang:'English',
  reply_draft:`Dear Mr. Berger,

Thank you for your inquiry and your interest in our VF-500 stainless steel vacuum flask.

Yes, we can fully support your requirements:
• FOB Shenzhen price for 5,000 pcs: please see our quotation attached (valid 30 days).
• Certificates: CE and LFGB are both available; test reports can be sent for your review.
• OEM: custom logo printing and tailored packaging are welcome — MOQ for OEM is 3,000 pcs.
• Lead time: approx. 30 days after deposit and artwork confirmation.

To finalize the best price, could you let us know your target market and whether you need retail packaging? This helps us recommend the most cost-effective configuration.

We look forward to building a long-term partnership with Müller Haushalt GmbH.

Best regards,
[Your name] | [Company] | Sales`,
  reply_strategy:'先逐条接住他的硬需求（价/证/OEM/交期）建立专业信任；报价用「附件+30天有效期」制造紧迫又不暴露底价；反问目标市场与是否要零售包装，既能二次锚定价格、又把对话往长期合作引。',
  next_step:'核实公司官网与采购人真实性后，今天内发出含 CE/LFGB 报告的正式报价单，并把他标记为 A 类客户重点跟进。'
};
window.SONAR_DEV = {
  render: (d)=>{ GG.clear(resultMount); resultMount.appendChild(renderResult(normalize(d||SAMPLE), false)); },
  sample: SAMPLE, normalize
};

GG.login(SLUG, {co:'经纬国际贸易', dept:'外贸业务部', name:'张伟',
  email:'zhang.wei@jingwei-trade.com', workspace:'询盘操盘工作台',
  sub:'登录进入你的「询盘操盘工作台」——一封询盘，先看清是不是真买家。'}, intro);
})();
