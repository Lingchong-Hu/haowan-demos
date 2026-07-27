/* landed — 到岸价 & 市场利润对比 / Landed cost & market profit compare
   输入产品（品名 + 出厂成本¥ + 重量kg）+ 选目标市场 → AI 估算各国到岸总成本
   （关税/VAT/平台佣金/物流）+ 建议零售价 + 毛利率，并给「先打哪个市场」的结论。
   卖点：AI 时代特有——以前要查各国 HS 编码税率、人工算到岸价，现在一句话出多国利润对比。
   引擎走全站共享连接器 GG.llm；未连接时给示例样张，不空白。税率为 AI 估算，仅供参考。 */
(function(){
const SLUG = 'landed';

const MARKETS = [
  {key:GG.T('美国','United States'), flag:'🇺🇸', cur:'USD'},
  {key:GG.T('德国','Germany'), flag:'🇩🇪', cur:'EUR'},
  {key:GG.T('英国','United Kingdom'), flag:'🇬🇧', cur:'GBP'},
  {key:GG.T('日本','Japan'), flag:'🇯🇵', cur:'JPY'},
  {key:GG.T('中东','Middle East'), flag:'🇦🇪', cur:'AED'},
  {key:GG.T('巴西','Brazil'), flag:'🇧🇷', cur:'BRL'},
  {key:GG.T('东南亚','Southeast Asia'), flag:'🌏', cur:'USD'},
];
const MKT = Object.fromEntries(MARKETS.map(m=>[m.key,m]));
const DEFAULT_MARKETS = [GG.T('美国','United States'),GG.T('德国','Germany'),GG.T('日本','Japan')];

const EXAMPLES = [
  {em:'🔋', name:GG.T('迷你充电宝','Mini Power Bank'), cost:'35', weight:'0.2'},
  {em:'🧴', name:GG.T('保温杯','Insulated Tumbler'), cost:'28', weight:'0.45'},
  {em:'🪑', name:GG.T('折叠露营椅','Folding Camp Chair'), cost:'90', weight:'2.5'},
];

/* 成本构成色（与图例对应） */
const SEG = [
  {key:'cost',     label:GG.T('出厂成本','Ex-factory'), color:'#2c5fa8'},
  {key:'shipping', label:GG.T('物流头程','Freight'), color:'#5b8def'},
  {key:'duty',     label:GG.T('关税','Duty'),     color:'#d4882b'},
  {key:'vat',      label:GG.T('VAT/税','VAT/Tax'),   color:'#c2562e'},
  {key:'platform', label:GG.T('平台佣金','Platform fee'), color:'#8a8a93'},
  {key:'profit',   label:GG.T('毛利','Profit'),     color:'#2d9e7b'}
];

const SYS = [
  '你是「Landed 到岸价 & 市场利润测算」：根据产品出厂成本与重量，为每个目标市场估算到岸总成本、建议零售价与毛利率。',
  '只输出严格 JSON（单个对象），不要 markdown 代码块、不要任何前言或解释文字。',
  'JSON 结构：',
  '{',
  '  "is_product": boolean,',
  GG.T('  "product": string,            // 产品名（简体中文）',
       '  "product": string,            // product name (in English)'),
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
  GG.T('      "note": string            // 简体中文：该市场定价/合规/税的一句关键提示',
       '      "note": string            // in English: one key tip on pricing/compliance/tax for this market'),
  '    }',
  '  ],',
  GG.T('  "verdict": string             // 简体中文：综合建议先打哪个市场、为什么（结合利润与门槛）',
       '  "verdict": string             // in English: which market to enter first and why (margin + barriers)'),
  '}',
  '硬规则：',
  '1) markets 必须与给定市场严格对应、同序、数量一致。',
  '2) 税率/费率给出符合该市场常识的估计：欧盟 VAT 约 19-21%、英国 20%、日本消费税 10%、美国无联邦 VAT 但有销售税与关税、巴西综合税负很高、平台佣金常约 15%。',
  '3) 各金额要自洽：landed_cost_rmb 应≈ 出厂成本+物流+关税+进口税；margin_pct 应≈ (建议零售折人民币×(1-平台佣金) - landed_cost)/建议零售折人民币。',
  '4) 数字给合理整数或一位小数，不要给出夸张精确度；这是估算。',
  '5) 若输入不是实物商品，is_product=false，markets 空数组。',
  GG.T('6) note/verdict/product 用简体中文。','6) Write note/verdict/product in English.')
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
    GG.el('h1', null, GG.T('同一个产品，先打哪个国家最赚','Same product — which country pays off first?')),
    GG.el('p',{class:'ld-lede'},
      GG.T('填上产品的出厂成本和重量、选几个目标市场——AI 估算各国的到岸总成本（关税、VAT、平台佣金、物流）、建议零售价和毛利率，一眼看出先打哪个市场最划算。',
        'Enter your product\'s ex-factory cost and weight, pick a few target markets — AI estimates each country\'s total landed cost (duty, VAT, platform fees, freight), a suggested retail price and gross margin, so you can see at a glance where to launch first.'))
  ));

  main.appendChild(GG.llm.bar(()=>{}));

  nameEl   = GG.el('input',{class:'field', placeholder:GG.T('如 迷你充电宝','e.g. Mini power bank')});
  costEl   = GG.el('input',{class:'field', type:'number', placeholder:'35', value:''});
  weightEl = GG.el('input',{class:'field', type:'number', placeholder:'0.2', value:''});
  main.appendChild(GG.el('div',{class:'ld-form'},
    GG.el('div',{class:'ld-f'}, GG.el('label',null,GG.T('产品名','Product name')), nameEl),
    GG.el('div',{class:'ld-f'}, GG.el('label',null,GG.T('出厂成本 ¥/件','Ex-factory cost ¥/unit')), costEl),
    GG.el('div',{class:'ld-f'}, GG.el('label',null,GG.T('重量 kg/件','Weight kg/unit')), weightEl)));

  main.appendChild(GG.el('div',{class:'ld-pick-h'}, GG.T('目标市场（可多选）','Target markets (pick several)')));
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
      GG.el('span', null, e.em), e.name+GG.T('（¥'+e.cost+'）',' (¥'+e.cost+')'))));
  main.appendChild(egs);

  main.appendChild(GG.el('button',{class:'btn primary lg block ld-go', onClick:run}, GG.T('🚢 算各国到岸价 & 利润','🚢 Compare landed cost & profit')));

  resultMount = GG.el('div'); main.appendChild(resultMount);

  main.appendChild(GG.el('div',{class:'ld-chain', html:
    GG.T('出海四步：选品 → <b style="color:var(--accent)">定价/选市场（你在这）</b> → 上架本地化 → 询盘成交',
      'Go-global in four steps: pick a product → <b style="color:var(--accent)">price & pick markets (you are here)</b> → localize listings → close inquiries')}));
}

async function run(){
  const name=(nameEl.value||'').trim(), cost=costEl.value, weight=weightEl.value;
  if(!name){ GG.toast(GG.T('先填产品名，或点个例子','Enter a product name, or tap an example')); return; }
  if(!num(cost)){ GG.toast(GG.T('填一下出厂成本（¥/件）','Enter the ex-factory cost (¥/unit)')); return; }
  const keys = MARKETS.map(m=>m.key).filter(k=>selected.has(k));
  if(!keys.length){ GG.toast(GG.T('先选至少一个目标市场','Pick at least one target market')); return; }

  GG.clear(resultMount);
  const stage = GG.el('div'); resultMount.appendChild(stage);
  stage.scrollIntoView({behavior:'smooth', block:'center'});

  if(!GG.llm.connected()){
    GG.clear(stage);
    stage.appendChild(renderResult(SAMPLE, false));
    stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'14px'}},
      GG.el('p',{class:'ld-lede', style:{textAlign:'center', margin:'0 auto'}},
        GG.T('👆 这是离线示例样张。点上方「连接 AI 升级」填一个 Anthropic Key，即可对你的产品成本、你选的市场，估算真实的到岸价与利润对比。',
          '👆 This is an offline sample. Click "Connect AI" above and add an Anthropic key to get a real landed-cost and profit comparison for your product and your markets.'))));
    GG.toast(GG.T('未连接 AI，先看示例样张','AI not connected — showing a sample for now'));
    return;
  }

  const t = GG.thinking(stage, [GG.T('核对成本与重量…','Checking cost and weight…'),GG.T('查各国关税与税率…','Looking up duties and tax rates…'),GG.T('加上物流与平台佣金…','Adding freight and platform fees…'),GG.T('算到岸价与毛利…','Computing landed cost and margin…')], 1900);
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
    isBest ? GG.el('span',{class:'ld-best-badge'}, GG.T('★ 最划算','★ Best pick')) : null,
    GG.el('div',{class:'ld-margin'},
      GG.el('span',{class:'ld-mn-pct', style:{color: m.margin_pct>=30?'#2d9e7b':(m.margin_pct>=15?'#d4882b':'#d64545')}},
        Math.round(m.margin_pct)+'%'),
      GG.el('span',{class:'ld-mn-l'}, GG.T('毛利率','Gross margin')))));

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
      GG.el('div',{class:'pl'}, GG.T('建议零售（≈¥'+Math.round(m.suggest_price_rmb)+'）','Suggested retail (≈¥'+Math.round(m.suggest_price_rmb)+')'))),
    GG.el('div',{class:'ld-price'},
      GG.el('div',{class:'pv'}, '¥'+Math.round(m.landed_cost_rmb)),
      GG.el('div',{class:'pl'}, GG.T('到岸成本/件','Landed cost / unit'))),
    GG.el('div',{class:'ld-price'},
      GG.el('div',{class:'pv'}, m.duty_pct+'% / '+m.vat_pct+'%'),
      GG.el('div',{class:'pl'}, GG.T('关税 / VAT','Duty / VAT')))));

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
    [GG.el('b', null, d.product||GG.T('你的产品','Your product')),
     GG.T('　出厂成本 ¥'+d.cost_rmb+'/件　·　对比 '+d.markets.length+' 个市场',
       '　Ex-factory ¥'+d.cost_rmb+'/unit　·　'+d.markets.length+' markets compared')]));

  const best = d.markets.reduce((a,b)=> b.margin_pct>(a?a.margin_pct:-1)?b:a, null);
  const list = GG.el('div',{class:'ld-list'});
  d.markets.forEach(m=> list.appendChild(marketCard(m, d.cost_rmb, best && m===best)));
  card.appendChild(list);

  if(d.verdict) card.appendChild(GG.el('div',{class:'ld-verdict'},
    GG.el('b', null, GG.T('先打哪个市场','Where to launch first')), d.verdict));

  card.appendChild(GG.el('div',{class:'ld-disc'},
    GG.T('⚠︎ 税率/费率/物流均为 AI 估算，仅供选市场参考；实际以海关 HS 编码、目的国税务与平台最新规则为准。',
      '⚠︎ Duties, fees and freight are AI estimates for market-selection reference only. Verify against the customs HS code, destination-country tax rules and the platform\'s latest policies.')));

  card.appendChild(GG.el('div',{class:'ld-bottom'},
    GG.el('button',{class:'btn primary', onClick:()=>GG.copyText(fullText(d))}, GG.T('📝 复制对比','📝 Copy comparison')),
    GG.el('button',{class:'btn', onClick:()=>GG.copyLink()}, GG.T('🔗 复制链接','🔗 Copy link')),
    GG.el('button',{class:'btn', onClick:()=>{ GG.clear(resultMount); nameEl.focus();
      nameEl.scrollIntoView({behavior:'smooth',block:'center'}); }}, GG.T('↻ 换个产品','↻ Try another product'))));
  return card;
}

function fullText(d){
  const L=[GG.T('【'+(d.product||'产品')+'】各国到岸价 & 利润对比（出厂 ¥'+d.cost_rmb+'）',
    '['+(d.product||'Product')+'] Landed cost & profit by market (ex-factory ¥'+d.cost_rmb+')')];
  d.markets.forEach(m=>{
    L.push('');
    L.push(GG.T(m.flag+' '+m.market+'：毛利率 '+Math.round(m.margin_pct)+'%　到岸成本 ¥'+Math.round(m.landed_cost_rmb)+
      '　建议零售 '+fmtLocal(m.suggest_price_local,m.currency)+'（≈¥'+Math.round(m.suggest_price_rmb)+'）',
      m.flag+' '+m.market+': margin '+Math.round(m.margin_pct)+'%　landed cost ¥'+Math.round(m.landed_cost_rmb)+
      '　suggested retail '+fmtLocal(m.suggest_price_local,m.currency)+' (≈¥'+Math.round(m.suggest_price_rmb)+')'));
    L.push(GG.T('  关税'+m.duty_pct+'% / VAT'+m.vat_pct+'% / 平台'+m.platform_fee_pct+'%',
      '  Duty '+m.duty_pct+'% / VAT '+m.vat_pct+'% / Platform '+m.platform_fee_pct+'%'));
    if(m.note) L.push('  '+m.note);
  });
  if(d.verdict){ L.push(''); L.push(GG.T('先打哪个：','Launch first: ')+d.verdict); }
  L.push(''); L.push(GG.T('（税率为 AI 估算，仅供参考）','(Rates are AI estimates, for reference only)'));
  L.push(GG.T('—— Landed 到岸价对比 · 好玩的东西  ','—— Landed Cost Compare · Playground  ')+location.href);
  return L.join('\n');
}

function renderNotProduct(){
  const card = GG.el('div',{class:'card pad'});
  card.appendChild(GG.el('div',{class:'ld-oops'},
    GG.el('div',{class:'big'}, '🤔'),
    GG.el('h3', null, GG.T('这不太像一个能算到岸价的实物商品','That doesn\'t look like a physical product we can price')),
    GG.el('p', null, GG.T('填一个具体产品（如「保温杯」）和它的出厂成本试试。','Try a specific product (like "insulated tumbler") with its ex-factory cost.'))));
  return card;
}

function renderError(err){
  const card = GG.el('div',{class:'card pad'});
  card.appendChild(GG.el('div',{class:'ld-oops'},
    GG.el('div',{class:'big'}, '🔌'),
    GG.el('h3', null, GG.T('这次没成功','That didn\'t work')),
    GG.el('p', null, GG.llm.errMsg(err)+GG.T('。点上方「连接 AI」检查 Key，或重试。','. Click "Connect AI" above to check your key, or retry.'))));
  card.appendChild(GG.el('div',{class:'center', style:{marginTop:'12px'}},
    GG.el('button',{class:'btn primary', onClick:run}, GG.T('重试','Retry'))));
  return card;
}

/* ── 离线示例样张 / 开发自检 ── */
const SAMPLE = {
  is_product:true, product:GG.T('迷你充电宝','Mini Power Bank'), cost_rmb:35,
  markets:[
    { market:GG.T('美国','United States'), flag:'🇺🇸', currency:'USD', duty_pct:0, vat_pct:7, platform_fee_pct:15,
      shipping_rmb:18, landed_cost_rmb:56, suggest_price_local:25.99, suggest_price_rmb:188,
      margin_pct:43, note:GG.T('无联邦增值税但各州销售税约 7%；锂电池走海运需 UN38.3，空运受限。','No federal VAT, but state sales tax runs about 7%. Lithium batteries need UN38.3 for sea freight; air freight is restricted.') },
    { market:GG.T('德国','Germany'), flag:'🇩🇪', currency:'EUR', duty_pct:3.7, vat_pct:19, platform_fee_pct:15,
      shipping_rmb:22, landed_cost_rmb:68, suggest_price_local:29.99, suggest_price_rmb:232,
      margin_pct:36, note:GG.T('欧盟 VAT 19% 吃掉不少利润，且需 CE + 电池法规登记，合规门槛高。','EU VAT of 19% eats a big chunk of profit, and CE marking plus battery-regulation registration make compliance demanding.') },
    { market:GG.T('日本','Japan'), flag:'🇯🇵', currency:'JPY', duty_pct:0, vat_pct:10, platform_fee_pct:12,
      shipping_rmb:20, landed_cost_rmb:60, suggest_price_local:3480, suggest_price_rmb:168,
      margin_pct:31, note:GG.T('消费税 10%；移动电源强制 PSE 认证，无 PSE 不得销售，先把证办了再上。','10% consumption tax. Power banks require mandatory PSE certification — no PSE, no sales. Get certified before listing.') }
  ],
  verdict:GG.T('优先美国：无关税、税率低、客单价撑得起，毛利率最高；德国利润也行但 VAT+合规重，适合站稳美国后再扩；日本必须先办 PSE。','Go US first: no duty, low taxes, price points that hold up, and the highest margin. Germany is profitable too, but heavy VAT and compliance make it a better second step once the US is solid. Japan requires PSE certification before anything else.')
};
window.LANDED_DEV = {
  render: (d)=>{ GG.clear(resultMount); resultMount.appendChild(renderResult(normalize(d||SAMPLE), false)); },
  notproduct: ()=>{ GG.clear(resultMount); resultMount.appendChild(renderNotProduct()); },
  sample: SAMPLE, normalize
};

GG.login(SLUG, {co:GG.T('远帆跨境','Yuanfan Global'), dept:GG.T('跨境运营部','Cross-border Ops'), name:GG.T('林悦','Lin Yue'),
  email:'lin.yue@yuanfan-cb.com', workspace:GG.T('到岸价测算工作台','Landed Cost Workbench'),
  sub:GG.T('登录进入你的「到岸价测算工作台」——输入成本，算清各国到岸价与利润。','Sign in to your Landed Cost Workbench — enter costs, see landed cost and profit for every market.')}, intro);
})();
