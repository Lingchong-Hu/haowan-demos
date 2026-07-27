/* loka — 出海本地化引擎 / Localization for going-global
   一段中文产品描述 + 选目标市场 → AI 为每个市场各生成「像本地人写的」listing
   （母语标题 + 卖点 + 关键词）+ 文化适配角度 + 合规提示 + 本地化坑。
   卖点：AI 时代特有——以前要养各市场母语文案团队，现在边际成本趋零，长尾中小工厂也能精品出海。
   引擎走全站共享连接器 GG.llm（连一次 key 全站通用）；未连接时给本地示例样张，不空白。 */
(function(){
const SLUG = 'loka';

/* 目标市场清单（key 与 AI 返回的 market 对齐；flag/plat 前端补全） */
const MARKETS = [
  {key:GG.T('美国','United States'),  flag:'🇺🇸', plat:'Amazon US',        lang:'英语'},
  {key:GG.T('德国','Germany'),  flag:'🇩🇪', plat:'Amazon DE',        lang:'德语'},
  {key:GG.T('日本','Japan'),  flag:'🇯🇵', plat:GG.T('Amazon JP / 乐天','Amazon JP / Rakuten'),  lang:'日语'},
  {key:GG.T('英国','United Kingdom'),  flag:'🇬🇧', plat:'Amazon UK',        lang:'英语'},
  {key:GG.T('法国','France'),  flag:'🇫🇷', plat:'Amazon FR',        lang:'法语'},
  {key:GG.T('中东','Middle East'),  flag:'🇦🇪', plat:'Noon / Amazon AE', lang:'阿拉伯语·英语'},
  {key:GG.T('巴西','Brazil'),  flag:'🇧🇷', plat:'Mercado Livre',    lang:'葡萄牙语'},
  {key:GG.T('东南亚','Southeast Asia'),flag:'🌏',  plat:'Shopee / Lazada',  lang:'英语·当地语'},
];
const MKT = Object.fromEntries(MARKETS.map(m=>[m.key,m]));
const DEFAULT_MARKETS = [GG.T('美国','United States'),GG.T('德国','Germany'),GG.T('日本','Japan')];

const EXAMPLES = [
  {em:'🔋', label:GG.T('迷你充电宝','Mini Power Bank'),
   text:GG.T('10000mAh 迷你充电宝，支持 22.5W 超级快充，金属磨砂机身，自带 LED 数显电量，三口同时输出（USB-C + 双 USB-A），轻巧适合出差旅行通勤随身携带。',
     '10000mAh mini power bank with 22.5W super-fast charging, matte metal body, built-in LED battery display, three simultaneous outputs (USB-C + dual USB-A), light and compact for business trips, travel and daily commuting.')},
  {em:'🧴', label:GG.T('保温杯','Insulated Tumbler'),
   text:GG.T('316 食品级不锈钢真空保温杯，500ml，24 小时保温保冷，一键弹盖单手开合，三层防漏密封设计，莫兰迪多色可选，送礼自用都合适。',
     '316 food-grade stainless steel vacuum insulated tumbler, 500ml, keeps drinks hot or cold for 24 hours, one-hand push-button flip lid, triple leak-proof seal, multiple Morandi colors — great as a gift or for everyday use.')},
  {em:'🦵', label:GG.T('发热护膝','Heated Knee Brace'),
   text:GG.T('石墨烯电加热护膝，USB 充电，三档智能控温，远红外理疗缓解老寒腿关节酸痛，弹性绑带男女通用，发热片可拆卸整件可水洗。',
     'Graphene heated knee brace, USB-powered, 3-level smart temperature control, far-infrared therapy to soothe sore, cold-sensitive knee joints, unisex elastic straps, removable heating pad and fully washable wrap.')},
  {em:'🪑', label:GG.T('折叠露营椅','Folding Camp Chair'),
   text:GG.T('超轻铝合金折叠露营椅，承重 150kg，一秒收纳进背包，透气牛津布坐垫带杯架，户外野营钓鱼徒步沙滩通用。',
     'Ultralight aluminum folding camp chair, 150kg load capacity, packs into a backpack in one second, breathable Oxford-cloth seat with cup holder — for camping, fishing, hiking and the beach.')},
];

const SYS = [
  '你是「Loka 出海本地化引擎」：把一段中文产品描述，为指定的每个海外市场，各生成一份「像本地人写的」电商 listing，并指出文化适配与合规要点。',
  '只输出严格 JSON（单个对象），不要 markdown 代码块、不要任何前言或解释文字。',
  'JSON 结构：',
  '{',
  '  "is_product": boolean,   // 输入是否真的在描述一个可销售的实物商品',
  GG.T('  "product_core": string,  // 用一句简体中文提炼这到底是什么产品',
       '  "product_core": string,  // one short English sentence distilling what this product really is'),
  '  "markets": [             // 必须严格按用户给定的市场列表、相同顺序，一个不多一个不少',
  '    {',
  GG.T('      "market": string,        // 市场名，与输入完全一致（如 美国）',
       '      "market": string,        // market name, exactly as given in the input (e.g. United States)'),
  '      "platform": string,      // 推荐主战场平台（如 Amazon US）',
  '      "title": string,         // 用【该市场母语】写的 listing 标题，符合当地电商标题习惯',
  GG.T('      "title_zh": string,      // 上面标题的简体中文回译，让中文卖家看懂 AI 写了什么',
       '      "title_zh": string,      // English back-translation of the title above, so the seller can see what the AI wrote'),
  GG.T('      "angle": string,         // 简体中文：这个市场主打什么卖点角度、为什么（抓住当地买家心理与平台习惯）',
       '      "angle": string,         // in English: which selling angle to lead with in this market and why (local buyer psychology + platform habits)'),
  '      "bullets": [string],     // 恰好 3 条用【该市场母语】写的卖点 bullet',
  '      "keywords": [string],    // 4-5 个该市场买家真实会搜的关键词（母语，小写）',
  GG.T('      "compliance": string,    // 简体中文：进这个市场、这个品类需要的认证/合规要点（按品类给真实相关的）',
       '      "compliance": string,    // in English: certifications / compliance essentials for this market and category (real, category-specific)'),
  GG.T('      "pitfall": string        // 简体中文：一个最容易踩的本地化坑（单位/尺码/小数写法/颜色忌讳/语言习惯等）',
       '      "pitfall": string        // in English: the single most likely localization pitfall (units / sizing / decimal format / color taboos / language habits)'),
  '    }',
  '  ]',
  '}',
  '硬规则：',
  '1) markets 数组必须与用户给定的市场严格对应、同序、数量一致。',
  GG.T('2) title / bullets / keywords 必须是该市场母语（美国/英国/东南亚=英语、德国=德语、日本=日语、法国=法语、巴西=葡萄牙语、中东=阿拉伯语或英语），且符合当地电商文案风格——绝不要中式直译。',
       '2) title / bullets / keywords must be in each market\'s native language (United States/United Kingdom/Southeast Asia = English, Germany = German, Japan = Japanese, France = French, Brazil = Portuguese, Middle East = Arabic or English), in authentic local e-commerce copy style — never a literal translation.'),
  '3) 不同市场的标题与角度要明显不同，体现真实的文化、买家心理与平台差异（如美国重场景/生活方式、德国重参数精确与合规、日本重细节与安心感）。',
  '4) compliance 要贴合这个具体品类：电子/电池→FCC、CE、PSE、UN38.3、能效标签；食品接触→FDA、LFGB；纺织→成分标签 等；别给放之四海皆准的废话。',
  '5) 若输入根本不是在描述一个实物商品（如心情、风景、一段闲聊、广告口号），把 is_product 设为 false，markets 给空数组；绝不硬编。',
  GG.T('6) 除 title / bullets / keywords 用各自母语外，其余说明字段一律用简体中文。',
       '6) Except title / bullets / keywords (each market\'s native language), write every other explanation field in English.')
].join('\n');

function buildUser(text, keys){
  const lines = keys.map(k=>`- ${k}（母语：${MKT[k].lang}；平台参考：${MKT[k].plat}）`).join('\n');
  return '目标市场（请严格按此顺序、用各自母语生成）：\n'+lines+'\n\n'+GG.T('中文产品描述：','Product description:')+'\n'+text;
}

/* ---- 规整 + 兜底 ---- */
function normalize(d){
  d = d || {};
  const arr = Array.isArray(d.markets) ? d.markets : [];
  return {
    is_product: !!d.is_product,
    product_core: d.product_core ? String(d.product_core) : '',
    markets: arr.filter(m=>m&&m.market).map(m=>{
      const meta = MKT[m.market] || {flag:'🌐', plat:''};
      return {
        market: String(m.market),
        flag: meta.flag,
        platform: m.platform ? String(m.platform) : meta.plat,
        title: m.title ? String(m.title) : '',
        title_zh: m.title_zh ? String(m.title_zh) : '',
        angle: m.angle ? String(m.angle) : '',
        bullets: Array.isArray(m.bullets) ? m.bullets.filter(Boolean).map(String).slice(0,4) : [],
        keywords: Array.isArray(m.keywords) ? m.keywords.filter(Boolean).map(String).slice(0,6) : [],
        compliance: m.compliance ? String(m.compliance) : '',
        pitfall: m.pitfall ? String(m.pitfall) : ''
      };
    })
  };
}

/* ════════════════════════════════════════════════════════════════════════
   UI
   ════════════════════════════════════════════════════════════════════════ */
let main, taEl, resultMount, selected;

function intro(){
  main = GG.mountShell(SLUG);
  selected = new Set(DEFAULT_MARKETS);

  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, GG.T('一件商品，原生上架每个国家','One product, native listings in every country')),
    GG.el('p',{class:'lk-lede'},
      GG.T('贴一段中文产品描述、选几个目标市场——AI 为每个国家各写一版「像本地人写的」listing：'+
      '母语标题、当地买家吃的卖点角度、真实搜索关键词，还顺手提醒你要过哪些认证、会踩哪些本地化的坑。',
        'Paste a product description and pick a few target markets — AI writes a native-sounding listing for each country: '+
        'a native-language title, the selling angles local buyers actually respond to, real search keywords, plus the certifications you\'ll need and the localization pitfalls to dodge.'))
  ));

  // 共享 AI 连接条
  main.appendChild(GG.llm.bar(()=>{}));

  // 市场选择
  main.appendChild(GG.el('div',{class:'lk-pick-h'}, GG.T('① 选目标市场（可多选）','① Pick target markets (multi-select)')));
  const picks = GG.el('div',{class:'lk-picks'});
  MARKETS.forEach(m=>{
    const chip = GG.el('div',{class:'lk-mchip'+(selected.has(m.key)?' on':''),
      onClick:()=>{
        if(selected.has(m.key)) selected.delete(m.key); else selected.add(m.key);
        chip.classList.toggle('on');
      }},
      GG.el('span',{class:'fl'}, m.flag),
      GG.el('span', null, m.key),
      GG.el('span',{class:'pl'}, m.plat));
    picks.appendChild(chip);
  });
  main.appendChild(picks);

  // 输入
  taEl = GG.el('textarea',{class:'field',
    placeholder:GG.T('② 把你的产品描述粘到这里…（中文即可，越具体越好）','② Paste your product description here… (the more specific, the better)')});

  main.appendChild(GG.el('div',{class:'lk-eg-label'}, GG.T('懒得想？点个例子直接跑 ↓','No ideas? Tap an example to run it ↓')));
  const egs = GG.el('div',{class:'lk-egs'});
  EXAMPLES.forEach(e=> egs.appendChild(
    GG.el('button',{class:'lk-eg', onClick:()=>{ taEl.value=e.text; run(e.text); }},
      GG.el('span',{class:'em'}, e.em), e.label)));
  main.appendChild(egs);

  main.appendChild(GG.el('div',{class:'lk-inwrap'}, taEl));
  main.appendChild(GG.el('button',{class:'btn primary lg block lk-go',
    onClick:()=>run(taEl.value)}, GG.T('🌐 生成多国 listing','🌐 Generate multi-market listings')));

  resultMount = GG.el('div'); main.appendChild(resultMount);

  // 价值链串联
  main.appendChild(GG.el('div',{class:'lk-chain', html:
    GG.T('出海四步：<b>选品</b> → <b>定价/选市场</b> → <b style="color:var(--accent)">本地化上架（你在这）</b> → <b>询盘成交</b>',
      'Go-global in four steps: <b>pick a product</b> → <b>price &amp; pick markets</b> → <b style="color:var(--accent)">localize listings (you are here)</b> → <b>close inquiries</b>')}));
}

async function run(text){
  text = (text||'').trim();
  if(!text){ GG.toast(GG.T('先贴一段产品描述，或点个例子','Paste a product description first, or tap an example')); return; }
  const keys = MARKETS.map(m=>m.key).filter(k=>selected.has(k));
  if(!keys.length){ GG.toast(GG.T('先选至少一个目标市场','Pick at least one target market')); return; }

  GG.clear(resultMount);
  const stage = GG.el('div'); resultMount.appendChild(stage);
  stage.scrollIntoView({behavior:'smooth', block:'center'});

  // 未连接 AI → 给示例样张（不空白），并提示连接
  if(!GG.llm.connected()){
    GG.clear(stage);
    stage.appendChild(renderResult(SAMPLE, false));
    stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'14px'}},
      GG.el('p',{class:'lk-lede', style:{textAlign:'center', margin:'0 auto'}},
        GG.T('👆 这是离线示例样张。点上方「连接 AI 升级」填一个 Anthropic Key，'+
        '即可对你自己的产品、你选的市场，生成真实的多国 listing。',
          '👆 This is an offline sample. Click "Connect AI" above and add an Anthropic key to generate real multi-market listings for your own product and your chosen markets.'))));
    GG.toast(GG.T('未连接 AI，先看示例样张','AI not connected — showing a sample for now'));
    return;
  }

  const t = GG.thinking(stage, [GG.T('读懂这个产品…','Understanding the product…'),GG.T('切换到各国买家视角…','Switching to local buyer mindsets…'),GG.T('按当地习惯改写标题与卖点…','Rewriting titles and bullets for each locale…'),GG.T('核对认证与本地化坑…','Checking certifications and pitfalls…')], 1900);
  let data;
  try{
    const [obj] = await Promise.all([GG.llm.json(SYS, buildUser(text, keys), {max_tokens:3200}), t]);
    data = normalize(obj);
  }catch(err){
    GG.clear(stage); stage.appendChild(renderError(err)); return;
  }
  GG.clear(stage);
  stage.appendChild(data.is_product && data.markets.length ? renderResult(data, true) : renderNotProduct());
  stage.scrollIntoView({behavior:'smooth', block:'start'});
}

function marketCard(m){
  const card = GG.el('div',{class:'lk-mcard'});
  card.appendChild(GG.el('div',{class:'lk-mhead'},
    GG.el('span',{class:'lk-flag'}, m.flag),
    GG.el('span',{class:'lk-mname'}, m.market),
    m.platform ? GG.el('span',{class:'lk-plat'}, m.platform) : null));

  if(m.angle) card.appendChild(GG.el('div',{class:'lk-angle'},
    GG.el('b', null, GG.T('主打角度','Key angle')), m.angle));

  if(m.title) card.appendChild(GG.el('div',{class:'lk-title'}, m.title));
  if(m.title_zh) card.appendChild(GG.el('div',{class:'lk-title-zh'}, '↳ '+m.title_zh));

  if(m.bullets.length){
    const ul = GG.el('ul',{class:'lk-bul'});
    m.bullets.forEach(b=> ul.appendChild(GG.el('li', null, b)));
    card.appendChild(ul);
  }
  if(m.keywords.length){
    const kw = GG.el('div',{class:'lk-kw'});
    m.keywords.forEach(k=> kw.appendChild(GG.el('span',{class:'lk-kwt'}, k)));
    card.appendChild(kw);
  }

  const notes = GG.el('div',{class:'lk-notes'});
  if(m.compliance) notes.appendChild(GG.el('div',{class:'lk-note comp'},
    GG.el('span',{class:'ic'}, '⚠️'), GG.el('span', null, [GG.el('b',null,GG.T('合规：','Compliance: ')), m.compliance])));
  if(m.pitfall) notes.appendChild(GG.el('div',{class:'lk-note pit'},
    GG.el('span',{class:'ic'}, '💡'), GG.el('span', null, [GG.el('b',null,GG.T('本地化坑：','Localization pitfall: ')), m.pitfall])));
  card.appendChild(notes);

  card.appendChild(GG.el('button',{class:'btn ghost lk-mcopy',
    onClick:()=>GG.copyText(cardText(m))}, GG.T('复制本国文案','Copy this listing')));
  return card;
}

function cardText(m){
  const L=[m.flag+' '+m.market+(m.platform?'｜'+m.platform:'')];
  if(m.title) L.push(m.title);
  if(m.bullets.length){ L.push(''); m.bullets.forEach(b=>L.push('• '+b)); }
  if(m.keywords.length){ L.push(''); L.push(GG.T('关键词：','Keywords: ')+m.keywords.join(', ')); }
  if(m.compliance) L.push(GG.T('合规：','Compliance: ')+m.compliance);
  if(m.pitfall) L.push(GG.T('本地化坑：','Localization pitfall: ')+m.pitfall);
  return L.join('\n');
}

function renderResult(d, fromAI){
  const card = GG.el('div',{class:'card pad result'});
  card.appendChild(GG.llm.badge(fromAI));
  card.appendChild(GG.el('div',{class:'lk-core', style:{marginTop:'10px'}},
    GG.el('div',{class:'txt'},
      GG.el('div',{class:'k'}, GG.T('产品','Product')),
      GG.el('div',{class:'v'}, d.product_core || GG.T('你的产品','Your product')))));

  const grid = GG.el('div',{class:'lk-grid'});
  d.markets.forEach(m=> grid.appendChild(marketCard(m)));
  card.appendChild(grid);

  card.appendChild(GG.el('div',{class:'lk-bottom'},
    GG.el('button',{class:'btn primary', onClick:()=>GG.copyText(allText(d))}, GG.T('📝 复制全部 listing','📝 Copy all listings')),
    GG.el('button',{class:'btn', onClick:()=>GG.copyLink()}, GG.T('🔗 复制链接','🔗 Copy link')),
    GG.el('button',{class:'btn', onClick:()=>{ GG.clear(resultMount); taEl.focus();
      taEl.scrollIntoView({behavior:'smooth',block:'center'}); }}, GG.T('↻ 换个产品','↻ Try another product'))));
  return card;
}

function allText(d){
  const L=[GG.T('【'+(d.product_core||'产品')+'】多国 listing','['+(d.product_core||'Product')+'] Multi-market listings')];
  d.markets.forEach(m=>{ L.push(''); L.push('──── '+m.flag+' '+m.market+' ────'); L.push(cardText(m)); });
  L.push(''); L.push(GG.T('—— Loka 出海本地化 · 好玩的东西  ','—— Loka Go-Global Localization · Playground  ')+location.href);
  return L.join('\n');
}

function renderNotProduct(){
  const card = GG.el('div',{class:'card pad'});
  card.appendChild(GG.el('div',{class:'lk-oops'},
    GG.el('div',{class:'big'}, '🤔'),
    GG.el('h3', null, GG.T('这段不像一个能上架的商品','That doesn\'t look like a listable product')),
    GG.el('p', null, GG.T('我没从这段里读到具体的产品，就不硬编 listing 糊弄你了。换一段产品描述，或点上面的例子试试。','I couldn\'t find a concrete product in that text, so I won\'t fabricate a listing. Try a different product description, or tap an example above.'))));
  return card;
}

function renderError(err){
  const card = GG.el('div',{class:'card pad'});
  card.appendChild(GG.el('div',{class:'lk-oops'},
    GG.el('div',{class:'big'}, '🔌'),
    GG.el('h3', null, GG.T('这次没成功','That didn\'t work')),
    GG.el('p', null, GG.llm.errMsg(err)+GG.T('。点上方「连接 AI」检查 Key，或重试。','. Click "Connect AI" above to check your key, or retry.'))));
  card.appendChild(GG.el('div',{class:'center', style:{marginTop:'12px'}},
    GG.el('button',{class:'btn primary', onClick:()=>run(taEl.value)}, GG.T('重试','Retry'))));
  return card;
}

/* ── 离线示例样张 / 开发自检（不伪造真实链路，仅供未连接时占位与无头验证） ── */
const SAMPLE = {
  is_product:true, product_core:GG.T('10000mAh 22.5W 快充迷你充电宝（金属机身 + LED 数显 + 三口输出）','Mini power bank, 10000mAh 22.5W fast charging (metal body + LED display + 3 outputs)'),
  markets:[
    { market:GG.T('美国','United States'), flag:'🇺🇸', platform:'Amazon US',
      title:'Mini Power Bank 10000mAh, 22.5W Fast Charging, USB-C Portable Charger with LED Display, 3 Outputs — for iPhone, Android, Travel',
      title_zh:GG.T('迷你充电宝 10000mAh，22.5W 快充，USB-C 便携，LED 数显，三口输出——适配 iPhone/安卓/旅行',''),
      angle:GG.T('美国买家先看「场景 + 痛点」：标题前置 Fast Charging 和容量，主打通勤出差「随手补电、不再焦虑」，正文重生活方式而非参数表。',
        'US buyers respond to scenario + pain point: lead the title with Fast Charging and capacity, sell the commute-and-travel promise of "top up anywhere, no battery anxiety", and write lifestyle copy rather than a spec sheet.'),
      bullets:[
        'FAST CHARGE ON THE GO — 22.5W tops up your phone to ~50% in just 30 minutes',
        'NEVER GUESS AGAIN — bright LED shows the exact battery % left',
        'CHARGE 3 AT ONCE — USB-C + dual USB-A for phone, earbuds & watch together'],
      keywords:['portable charger','power bank 10000mah','fast charging','usb c battery pack','travel charger'],
      compliance:GG.T('电子+锂电池：需 FCC 认证、UN38.3 空运报告；亚马逊要求上传电池安全测试文件，否则可能下架。',
        'Electronics + lithium battery: FCC certification and a UN38.3 air-transport report are required; Amazon asks for battery safety test documents, or the listing may be taken down.'),
      pitfall:GG.T('用场景化句子而非参数堆砌；容量标 mAh 没问题，但要标实际可用输出，夸大易被差评与退货。',
        'Write scenario-driven sentences instead of stacking specs; labeling capacity in mAh is fine, but state real usable output — overclaiming invites bad reviews and returns.') },
    { market:GG.T('德国','Germany'), flag:'🇩🇪', platform:'Amazon DE',
      title:'Powerbank 10000mAh mit 22,5W Schnellladung, USB-C, LED-Display, 3 Anschlüsse — Kompakt für Reisen',
      title_zh:GG.T('充电宝 10000mAh，22.5W 快充，USB-C，LED 显示，三接口——旅行紧凑型',
        'Power bank 10000mAh with 22.5W fast charging, USB-C, LED display, 3 ports — compact for travel'),
      angle:GG.T('德国买家重「参数精确 + 合规可查」：清楚列瓦数、接口、安全认证；小数用逗号（22,5W），描述要经得起较真。',
        'German buyers value precise specs + verifiable compliance: list wattage, ports and safety certifications clearly; use a comma for decimals (22,5W) and make every claim stand up to scrutiny.'),
      bullets:[
        '22,5W Schnellladung — lädt das Smartphone in ca. 30 Min auf 50 %',
        'Präzise LED-Anzeige der Restkapazität in Prozent',
        '3 Geräte gleichzeitig: USB-C + 2× USB-A, ideal für unterwegs'],
      keywords:['powerbank 10000mah','schnellladung','usb c powerbank','externer akku','powerbank klein'],
      compliance:GG.T('欧盟：需 CE + RoHS；新版 EU Battery Regulation 要求标注回收与电池信息；包装须符合德国 VerpackG 回收登记。',
        'EU: CE + RoHS required; the new EU Battery Regulation mandates recycling and battery information labeling; packaging must be registered under Germany\'s VerpackG.'),
      pitfall:GG.T('小数点写成逗号（22,5W）；德国消费者会查 Stiftung Warentest 测评，参数不实极易投诉退货。',
        'Write decimals with a comma (22,5W); German shoppers check Stiftung Warentest reviews, and inaccurate specs quickly lead to complaints and returns.') },
    { market:GG.T('日本','Japan'), flag:'🇯🇵', platform:GG.T('Amazon JP / 乐天','Amazon JP / Rakuten'),
      title:'モバイルバッテリー 10000mAh 22.5W 急速充電 USB-C LED残量表示 3ポート出力 軽量 旅行・出張に',
      title_zh:GG.T('移动电源 10000mAh 22.5W 急速充电 USB-C LED 残量显示 三口输出 轻量 旅行出差用',
        'Mobile battery 10000mAh, 22.5W rapid charging, USB-C, LED charge indicator, 3-port output, lightweight — for travel and business trips'),
      angle:GG.T('日本买家重「细节 + 安心感」：强调轻量、做工、PSE 认证与售后，语气礼貌克制，外包装与说明书质感是加分项。',
        'Japanese buyers prize detail + reassurance: emphasize light weight, build quality, PSE certification and after-sales support; keep the tone polite and restrained — premium packaging and manuals earn bonus points.'),
      bullets:[
        '22.5Wの急速充電でスマホを約30分で50%まで充電',
        'LEDで残量をひと目で確認、安心して持ち歩けます',
        'USB-C＋USB-A×2で最大3台を同時充電'],
      keywords:['モバイルバッテリー','大容量','急速充電','軽量','pse認証'],
      compliance:GG.T('日本：移动电源属电气用品，必须取得 PSE 圆形标志（电気用品安全法），无 PSE 不得在日销售。',
        'Japan: power banks fall under the Electrical Appliance Safety Act and must carry the round PSE mark — no PSE, no sales in Japan.'),
      pitfall:GG.T('必须 PSE 认证；数字用半角、文案用礼貌体；重视开箱体验，简陋包装会拉低评价。',
        'PSE certification is mandatory; use half-width digits and polite-form copy; unboxing matters — cheap packaging drags down reviews.') }
  ]
};
window.LOKA_DEV = {
  render: (d)=>{ GG.clear(resultMount); resultMount.appendChild(renderResult(normalize(d||SAMPLE), false)); },
  notproduct: ()=>{ GG.clear(resultMount); resultMount.appendChild(renderNotProduct()); },
  sample: SAMPLE, normalize
};

GG.login(SLUG, {co:GG.T('远帆跨境','Yuanfan Global'), dept:GG.T('跨境运营部','Cross-border Ops'), name:GG.T('林悦','Lin Yue'),
  email:'lin.yue@yuanfan-cb.com', workspace:GG.T('出海本地化工作台','Localization Workbench'),
  sub:GG.T('登录进入你的「出海本地化工作台」——一件商品，落地成多国母语 listing。','Sign in to your Localization Workbench — one product, native-language listings for every market.')}, intro);
})();
