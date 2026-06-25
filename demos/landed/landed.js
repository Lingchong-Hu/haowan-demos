/* landed — 到岸价 & 市场利润对比 / Landed cost & market profit compare
   输入产品（品名 + 出厂成本¥ + 重量kg）+ 选目标市场 → AI 估算各国到岸总成本
   （关税/VAT/平台佣金/物流）+ 建议零售价 + 毛利率，并给「先打哪个市场」的结论。
   卖点：AI 时代特有——以前要查各国 HS 编码税率、人工算到岸价，现在一句话出多国利润对比。
   引擎走全站共享连接器 GG.llm；未连接时给示例样张，不空白。税率为 AI 估算，仅供参考。 */
(function(){
const SLUG = 'landed';

const MARKETS = [
  {key:'美国', flag:'🇺🇸', cur:'USD'},
  {key:'德国', flag:'🇩🇪', cur:'EUR'},
  {key:'英国', flag:'🇬🇧', cur:'GBP'},
  {key:'日本', flag:'🇯🇵', cur:'JPY'},
  {key:'中东', flag:'🇦🇪', cur:'AED'},
  {key:'巴西', flag:'🇧🇷', cur:'BRL'},
  {key:'东南亚', flag:'🌏', cur:'USD'},
];
const MKT = Object.fromEntries(MARKETS.map(m=>[m.key,m]));
const DEFAULT_MARKETS = ['美国','德国','日本'];

const EXAMPLES = [
  {em:'🔋', name:'迷你充电宝', cost:'35', weight:'0.2'},
  {em:'🧴', name:'保温杯', cost:'28', weight:'0.45'},
  {em:'🪑', name:'折叠露营椅', cost:'90', weight:'2.5'},
];

/* 成本构成色（与图例对应） */
const SEG = [
  {key:'cost',     label:'出厂成本', color:'#2c5fa8'},
  {key:'shipping', label:'物流头程', color:'#5b8def'},
  {key:'duty',     label:'关税',     color:'#d4882b'},
  {key:'vat',      label:'VAT/税',   color:'#c2562e'},
  {key:'platform', label:'平台佣金', color:'#8a8a93'},
  {key:'profit',   label:'毛利',     color:'#2d9e7b'}
];

const SYS = [
  '你是「Landed 到岸价 & 市场利润测算」：根据产品出厂成本与重量，为每个目标市场估算到岸总成本、建议零售价与毛利率。',
  '只输出严格 JSON（单个对象），不要 markdown 代码块、不要任何前言或解释文字。',
  'JSON 结构：',
  '{',
  '  "is_product": boolean,',
  '  "product": string,            // 产品名（简体中文）',
  '  "cost_rmb": number,           // 出厂成本（人民币，沿用输入）',
  '  "markets": [                  // 严格按给定市场、同序',
  '    {',
  '      "market": string,         // 市场名，与输入一致',
  '      "currency": string,       // 当地货币代码（USD/EUR/JPY…）',
  '      "duty_pct": number,       // 进口关税估计（百分数，如 5 表示 5%）',
  '      "vat_pct": number,        // 增值税/销售税估计（百分数）',
  '      "platform_fee_pct": number, // 平台佣金估计（百分数，如亚马逊约 15）',
  '      "shipping_rmb": number,   // 头程+尾程物流估计（人民币/件）',
  '      "landed_cost_rmb": number,// 到岸总成本（人民币/件，含成本+物流+关税+税，不含平台佣金）',
  '      "suggest_price_local": number, // 建议零售价（当地货币）',
  '      "suggest_price_rmb": number,   // 建议零售价折合人民币',
  '      "margin_pct": number,     // 毛利率（百分数，已扣平台佣金后相对零售价）',
  '      "note": string            // 简体中文：该市场定价/合规/税的一句关键提示',
  '    }',
  '  ],',
  '  "verdict": string             // 简体中文：综合建议先打哪个市场、为什么（结合利润与门槛）',
  '}',
  '硬规则：',
  '1) markets 必须与给定市场严格对应、同序、数量一致。',
  '2) 税率/费率给出符合该市场常识的估计：欧盟 VAT 约 19-21%、英国 20%、日本消费税 10%、美国无联邦 VAT 但有销售税与关税、巴西综合税负很高、平台佣金常约 15%。',
  '3) 各金额要自洽：landed_cost_rmb 应≈ 出厂成本+物流+关税+进口税；margin_pct 应≈ (建议零售折人民币×(1-平台佣金) - landed_cost)/建议零售折人民币。',
  '4) 数字给合理整数或一位小数，不要给出夸张精确度；这是估算。',
  '5) 若输入不是实物商品，is_product=false，markets 空数组。',
  '6) note/verdict/product 用简体中文。'
].join('\n');

function buildUser(name, cost, weight, keys){
  const lines = keys.map(k=>`- ${k}（货币 ${MKT[k].cur}）`).join('\n');
  return '产品：'+name+'\n出厂成本：人民币 '+cost+' 元/件\n重量：约 '+weight+' kg/件\n\n目标市场（按此顺序）：\n'+lines;
}

function num(v){ const n=parseFloat(v); return isNaN(n)?0:n; }
function normalize(d){
  d = d || {};
  const arr = Array.isArray(d.markets) ? d.markets : [];
  return {
    is_product: !!d.is_product,
    product: d.product ? String(d.product) : '',
    cost_rmb: num(d.cost_rmb),
    markets: arr.filter(m=>m&&m.market).map(m=>{
      const meta = MKT[m.market]||{flag:'🌐',cur:''};
      return {
        market:String(m.market), flag:meta.flag,
        currency:m.currency?String(m.currency):meta.cur,
        duty_pct:num(m.duty_pct), vat_pct:num(m.vat_pct), platform_fee_pct:num(m.platform_fee_pct),
        shipping_rmb:num(m.shipping_rmb), landed_cost_rmb:num(m.landed_cost_rmb),
        suggest_price_local:num(m.suggest_price_local), suggest_price_rmb:num(m.suggest_price_rmb),
        margin_pct:num(m.margin_pct), note:m.note?String(m.note):''
      };
    }),
    verdict: d.verdict ? String(d.verdict) : ''
  };
}

/* 从字段反推成本构成（用于瀑布条；保证非负、和=零售价折人民币） */
function segments(m, cost){
  const price = m.suggest_price_rmb || m.landed_cost_rmb*1.4 || 1;
  const ship = Math.max(0, m.shipping_rmb);
  const duty = Math.max(0, cost*m.duty_pct/100);
  const vat  = Math.max(0, (cost+ship+duty)*m.vat_pct/100);
  const plat = Math.max(0, price*m.platform_fee_pct/100);
  const used = cost+ship+duty+vat+plat;
  const profit = Math.max(0, price-used);
  return {cost, shipping:ship, duty, vat, platform:plat, profit, total:Math.max(price,used)};
}

/* ════════════════════════ UI ════════════════════════ */
let main, nameEl, costEl, weightEl, resultMount, selected;

function intro(){
  main = GG.mountShell(SLUG);
  selected = new Set(DEFAULT_MARKETS);

  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '同一个产品，先打哪个国家最赚'),
    GG.el('p',{class:'ld-lede'},
      '填上产品的出厂成本和重量、选几个目标市场——AI 估算各国的到岸总成本'+
      '（关税、VAT、平台佣金、物流）、建议零售价和毛利率，一眼看出先打哪个市场最划算。')
  ));

  main.appendChild(GG.llm.bar(()=>{}));

  nameEl   = GG.el('input',{class:'field', placeholder:'如 迷你充电宝'});
  costEl   = GG.el('input',{class:'field', type:'number', placeholder:'35', value:''});
  weightEl = GG.el('input',{class:'field', type:'number', placeholder:'0.2', value:''});
  main.appendChild(GG.el('div',{class:'ld-form'},
    GG.el('div',{class:'ld-f'}, GG.el('label',null,'产品名'), nameEl),
    GG.el('div',{class:'ld-f'}, GG.el('label',null,'出厂成本 ¥/件'), costEl),
    GG.el('div',{class:'ld-f'}, GG.el('label',null,'重量 kg/件'), weightEl)));

  main.appendChild(GG.el('div',{class:'ld-pick-h'}, '目标市场（可多选）'));
  const picks = GG.el('div',{class:'ld-picks'});
  MARKETS.forEach(m=>{
    const chip = GG.el('div',{class:'ld-mchip'+(selected.has(m.key)?' on':''),
      onClick:()=>{ if(selected.has(m.key)) selected.delete(m.key); else selected.add(m.key); chip.classList.toggle('on'); }},
      GG.el('span',{class:'fl'}, m.flag), GG.el('span', null, m.key));
    picks.appendChild(chip);
  });
  main.appendChild(picks);

  const egs = GG.el('div',{class:'ld-egs'});
  EXAMPLES.forEach(e=> egs.appendChild(
    GG.el('button',{class:'ld-eg', onClick:()=>{ nameEl.value=e.name; costEl.value=e.cost; weightEl.value=e.weight; run(); }},
      GG.el('span', null, e.em), e.name+'（¥'+e.cost+'）')));
  main.appendChild(egs);

  main.appendChild(GG.el('button',{class:'btn primary lg block ld-go', onClick:run}, '🚢 算各国到岸价 & 利润'));

  resultMount = GG.el('div'); main.appendChild(resultMount);

  main.appendChild(GG.el('div',{class:'ld-chain', html:
    '出海四步：选品 → <b style="color:var(--accent)">定价/选市场（你在这）</b> → 上架本地化 → 询盘成交'}));
}

async function run(){
  const name=(nameEl.value||'').trim(), cost=costEl.value, weight=weightEl.value;
  if(!name){ GG.toast('先填产品名，或点个例子'); return; }
  if(!num(cost)){ GG.toast('填一下出厂成本（¥/件）'); return; }
  const keys = MARKETS.map(m=>m.key).filter(k=>selected.has(k));
  if(!keys.length){ GG.toast('先选至少一个目标市场'); return; }

  GG.clear(resultMount);
  const stage = GG.el('div'); resultMount.appendChild(stage);
  stage.scrollIntoView({behavior:'smooth', block:'center'});

  if(!GG.llm.connected()){
    GG.clear(stage);
    stage.appendChild(renderResult(SAMPLE, false));
    stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'14px'}},
      GG.el('p',{class:'ld-lede', style:{textAlign:'center', margin:'0 auto'}},
        '👆 这是离线示例样张。点上方「连接 AI 升级」填一个 Anthropic Key，'+
        '即可对你的产品成本、你选的市场，估算真实的到岸价与利润对比。')));
    GG.toast('未连接 AI，先看示例样张');
    return;
  }

  const t = GG.thinking(stage, ['核对成本与重量…','查各国关税与税率…','加上物流与平台佣金…','算到岸价与毛利…'], 1900);
  let data;
  try{
    const [obj] = await Promise.all([GG.llm.json(SYS, buildUser(name,cost,weight,keys), {max_tokens:2600}), t]);
    data = normalize(obj);
  }catch(err){
    GG.clear(stage); stage.appendChild(renderError(err)); return;
  }
  GG.clear(stage);
  stage.appendChild(data.is_product && data.markets.length ? renderResult(data, true) : renderNotProduct());
  stage.scrollIntoView({behavior:'smooth', block:'start'});
}

function marketCard(m, cost, isBest){
  const card = GG.el('div',{class:'ld-card'+(isBest?' best':'')});
  card.appendChild(GG.el('div',{class:'ld-ch'},
    GG.el('span',{class:'ld-fl'}, m.flag),
    GG.el('span',{class:'ld-mn'}, m.market),
    isBest ? GG.el('span',{class:'ld-best-badge'}, '★ 最划算') : null,
    GG.el('div',{class:'ld-margin'},
      GG.el('span',{class:'ld-mn-pct', style:{color: m.margin_pct>=30?'#2d9e7b':(m.margin_pct>=15?'#d4882b':'#d64545')}},
        Math.round(m.margin_pct)+'%'),
      GG.el('span',{class:'ld-mn-l'}, '毛利率'))));

  // 成本瀑布条
  const seg = segments(m, cost);
  const bar = GG.el('div',{class:'ld-bar'});
  SEG.forEach(s=>{
    const val = seg[s.key]||0;
    if(val<=0) return;
    bar.appendChild(GG.el('div',{class:'ld-seg', title:s.label+' ¥'+val.toFixed(1),
      style:{width:(val/seg.total*100)+'%', background:s.color}}));
  });
  card.appendChild(bar);

  const lg = GG.el('div',{class:'ld-legend'});
  SEG.forEach(s=>{
    const val = seg[s.key]||0; if(val<=0) return;
    lg.appendChild(GG.el('span',{class:'ld-lg'},
      GG.el('span',{class:'ld-dot', style:{background:s.color}}),
      s.label+' ¥'+Math.round(val)));
  });
  card.appendChild(lg);

  card.appendChild(GG.el('div',{class:'ld-prices'},
    GG.el('div',{class:'ld-price'},
      GG.el('div',{class:'pv'}, fmtLocal(m.suggest_price_local, m.currency)),
      GG.el('div',{class:'pl'}, '建议零售（≈¥'+Math.round(m.suggest_price_rmb)+'）')),
    GG.el('div',{class:'ld-price'},
      GG.el('div',{class:'pv'}, '¥'+Math.round(m.landed_cost_rmb)),
      GG.el('div',{class:'pl'}, '到岸成本/件')),
    GG.el('div',{class:'ld-price'},
      GG.el('div',{class:'pv'}, m.duty_pct+'% / '+m.vat_pct+'%'),
      GG.el('div',{class:'pl'}, '关税 / VAT'))));

  if(m.note) card.appendChild(GG.el('div',{class:'ld-note'}, '📌 '+m.note));
  return card;
}

function fmtLocal(v, cur){
  const sym = {USD:'$',EUR:'€',GBP:'£',JPY:'¥',AED:'AED ',BRL:'R$'}[cur] || (cur?cur+' ':'');
  return sym + (cur==='JPY' ? Math.round(v) : (Math.round(v*100)/100));
}

function renderResult(d, fromAI){
  const card = GG.el('div',{class:'card pad result'});
  card.appendChild(GG.llm.badge(fromAI));
  card.appendChild(GG.el('div',{class:'ld-core', style:{marginTop:'10px'}},
    [GG.el('b', null, d.product||'你的产品'), '　出厂成本 ¥'+d.cost_rmb+'/件　·　对比 '+d.markets.length+' 个市场']));

  const best = d.markets.reduce((a,b)=> b.margin_pct>(a?a.margin_pct:-1)?b:a, null);
  const list = GG.el('div',{class:'ld-list'});
  d.markets.forEach(m=> list.appendChild(marketCard(m, d.cost_rmb, best && m===best)));
  card.appendChild(list);

  if(d.verdict) card.appendChild(GG.el('div',{class:'ld-verdict'},
    GG.el('b', null, '先打哪个市场'), d.verdict));

  card.appendChild(GG.el('div',{class:'ld-disc'},
    '⚠︎ 税率/费率/物流均为 AI 估算，仅供选市场参考；实际以海关 HS 编码、目的国税务与平台最新规则为准。'));

  card.appendChild(GG.el('div',{class:'ld-bottom'},
    GG.el('button',{class:'btn primary', onClick:()=>GG.copyText(fullText(d))}, '📝 复制对比'),
    GG.el('button',{class:'btn', onClick:()=>GG.copyLink()}, '🔗 复制链接'),
    GG.el('button',{class:'btn', onClick:()=>{ GG.clear(resultMount); nameEl.focus();
      nameEl.scrollIntoView({behavior:'smooth',block:'center'}); }}, '↻ 换个产品')));
  return card;
}

function fullText(d){
  const L=['【'+(d.product||'产品')+'】各国到岸价 & 利润对比（出厂 ¥'+d.cost_rmb+'）'];
  d.markets.forEach(m=>{
    L.push('');
    L.push(m.flag+' '+m.market+'：毛利率 '+Math.round(m.margin_pct)+'%　到岸成本 ¥'+Math.round(m.landed_cost_rmb)+
      '　建议零售 '+fmtLocal(m.suggest_price_local,m.currency)+'（≈¥'+Math.round(m.suggest_price_rmb)+'）');
    L.push('  关税'+m.duty_pct+'% / VAT'+m.vat_pct+'% / 平台'+m.platform_fee_pct+'%');
    if(m.note) L.push('  '+m.note);
  });
  if(d.verdict){ L.push(''); L.push('先打哪个：'+d.verdict); }
  L.push(''); L.push('（税率为 AI 估算，仅供参考）');
  L.push('—— Landed 到岸价对比 · 好玩的东西  '+location.href);
  return L.join('\n');
}

function renderNotProduct(){
  const card = GG.el('div',{class:'card pad'});
  card.appendChild(GG.el('div',{class:'ld-oops'},
    GG.el('div',{class:'big'}, '🤔'),
    GG.el('h3', null, '这不太像一个能算到岸价的实物商品'),
    GG.el('p', null, '填一个具体产品（如「保温杯」）和它的出厂成本试试。')));
  return card;
}

function renderError(err){
  const card = GG.el('div',{class:'card pad'});
  card.appendChild(GG.el('div',{class:'ld-oops'},
    GG.el('div',{class:'big'}, '🔌'),
    GG.el('h3', null, '这次没成功'),
    GG.el('p', null, GG.llm.errMsg(err)+'。点上方「连接 AI」检查 Key，或重试。')));
  card.appendChild(GG.el('div',{class:'center', style:{marginTop:'12px'}},
    GG.el('button',{class:'btn primary', onClick:run}, '重试')));
  return card;
}

/* ── 离线示例样张 / 开发自检 ── */
const SAMPLE = {
  is_product:true, product:'迷你充电宝', cost_rmb:35,
  markets:[
    { market:'美国', flag:'🇺🇸', currency:'USD', duty_pct:0, vat_pct:7, platform_fee_pct:15,
      shipping_rmb:18, landed_cost_rmb:56, suggest_price_local:25.99, suggest_price_rmb:188,
      margin_pct:43, note:'无联邦增值税但各州销售税约 7%；锂电池走海运需 UN38.3，空运受限。' },
    { market:'德国', flag:'🇩🇪', currency:'EUR', duty_pct:3.7, vat_pct:19, platform_fee_pct:15,
      shipping_rmb:22, landed_cost_rmb:68, suggest_price_local:29.99, suggest_price_rmb:232,
      margin_pct:36, note:'欧盟 VAT 19% 吃掉不少利润，且需 CE + 电池法规登记，合规门槛高。' },
    { market:'日本', flag:'🇯🇵', currency:'JPY', duty_pct:0, vat_pct:10, platform_fee_pct:12,
      shipping_rmb:20, landed_cost_rmb:60, suggest_price_local:3480, suggest_price_rmb:168,
      margin_pct:31, note:'消费税 10%；移动电源强制 PSE 认证，无 PSE 不得销售，先把证办了再上。' }
  ],
  verdict:'优先美国：无关税、税率低、客单价撑得起，毛利率最高；德国利润也行但 VAT+合规重，适合站稳美国后再扩；日本必须先办 PSE。'
};
window.LANDED_DEV = {
  render: (d)=>{ GG.clear(resultMount); resultMount.appendChild(renderResult(normalize(d||SAMPLE), false)); },
  notproduct: ()=>{ GG.clear(resultMount); resultMount.appendChild(renderNotProduct()); },
  sample: SAMPLE, normalize
};

GG.login(SLUG, {co:'远帆跨境', dept:'跨境运营部', name:'林悦',
  email:'lin.yue@yuanfan-cb.com', workspace:'到岸价测算工作台',
  sub:'登录进入你的「到岸价测算工作台」——输入成本，算清各国到岸价与利润。'}, intro);
})();
