/* niche — 蓝海选品雷达 / Niche radar for going-global sourcing
   输入一个品类方向 + 选目标市场 → AI 综合海外需求趋势与差评缺口，
   给 3-4 个「被忽视的细分蓝海」+ 机会分 + 需求/竞争标签 + 切入角度 + 风险。
   卖点：AI 时代特有——以前靠人工扒榜单、逐条读差评找缺口，现在 AI 把趋势+评论缺口综合成蓝海清单。
   引擎走全站共享连接器 GG.llm；未连接时给示例样张，不空白。 */
(function(){
const SLUG = 'niche';

const REGIONS = [
  GG.T('北美','North America'), GG.T('欧洲','Europe'), GG.T('日本','Japan'),
  GG.T('中东','Middle East'), GG.T('东南亚','Southeast Asia'), GG.T('拉美','Latin America')
];
const DEFAULT_REGION = GG.T('北美','North America');

const EXAMPLES = [
  {em:'🐾', label:GG.T('宠物用品','Pet supplies')},
  {em:'🏕️', label:GG.T('露营户外','Camping & outdoor')},
  {em:'🍳', label:GG.T('厨房小工具','Kitchen gadgets')},
  {em:'💪', label:GG.T('家用健身','Home fitness')},
  {em:'👶', label:GG.T('母婴用品','Mom & baby')},
];

/* demand/competition 是机器枚举值（两种语言下 LLM 都返回中文枚举，见 SYS 规则 6），
   查表/比较一律用原值；展示时经 DEMAND_L/COMP_L 映射 */
const DEMAND_C = {'高':'#2d9e7b','中':'#d4882b','低':'#8a8a93'};
const COMP_C   = {'蓝海':'#2d9e7b','中等':'#d4882b','红海':'#d64545'};
const DEMAND_L = {'高':GG.T('高','High'),'中':GG.T('中','Medium'),'低':GG.T('低','Low')};
const COMP_L   = {'蓝海':GG.T('蓝海','Blue ocean'),'中等':GG.T('中等','Moderate'),'红海':GG.T('红海','Red ocean')};

const SYS = [
  '你是「Niche 蓝海选品雷达」：帮跨境卖家在一个大品类里，找出海外市场被忽视、竞争还没杀红的细分机会。',
  '只输出严格 JSON（单个对象），不要 markdown 代码块、不要任何前言或解释文字。',
  'JSON 结构：',
  '{',
  '  "is_category": boolean,       // 输入是否是一个可做选品的产品品类/方向',
  GG.T('  "category_core": string,      // 一句简体中文提炼这个方向',
       '  "category_core": string,      // one English line distilling this direction'),
  GG.T('  "market_note": string,        // 一句简体中文：这个大类在该目标市场的现状（饱和度/趋势）',
       '  "market_note": string,        // in English: one line on this category\'s state in the target market (saturation/trend)'),
  '  "niches": [                   // 3-4 个细分蓝海机会，按机会分从高到低',
  '    {',
  GG.T('      "name": string,           // 细分品类/产品名（简体中文，具体到能去 1688 找到的程度）',
       '      "name": string,           // niche/product name (in English, specific enough to source on 1688)'),
  '      "emoji": string,          // 一个贴切 emoji',
  '      "opportunity": number,    // 机会分 0-100',
  '      "demand": "高"|"中"|"低", // 海外需求信号强度',
  '      "competition": "蓝海"|"中等"|"红海",  // 当前竞争烈度',
  GG.T('      "gap": string,            // 简体中文：海外用户没被满足的痛点（常来自差评高频抱怨）',
       '      "gap": string,            // in English: the unmet overseas pain point (often from high-frequency review complaints)'),
  GG.T('      "evidence": string,       // 简体中文：这个判断的信号来源（如 亚马逊差评高频抱怨X / TikTok某趋势 / 某场景兴起）',
       '      "evidence": string,       // in English: where the signal comes from (e.g. frequent Amazon review complaints about X / a TikTok trend / a rising use case)'),
  GG.T('      "angle": string,          // 简体中文：差异化切入角度（怎么做得比现有产品好）',
       '      "angle": string,          // in English: the differentiated entry angle (how to beat existing products)'),
  GG.T('      "risk": string            // 简体中文：主要风险（认证/专利/巨头/季节性等）',
       '      "risk": string            // in English: the main risk (certification/patents/big brands/seasonality etc.)'),
  '    }',
  '  ],',
  GG.T('  "verdict": string             // 简体中文：综合建议先打哪个细分、为什么',
       '  "verdict": string             // in English: which niche to attack first and why'),
  '}',
  '硬规则：',
  '1) niches 给 3-4 个，必须是真正「细分」的机会，不要把大类原样复述；具体到卖家能照着去找货。',
  '2) gap 要像来自真实差评/抱怨（如「现有产品太吵」「尺寸不适合大型犬」「续航虚标」），不要泛泛而谈。',
  '3) demand / competition / opportunity 三者要自洽：蓝海+高需求→机会分高。',
  '4) evidence 说清信号从哪来，体现是「综合趋势+评论缺口」而非凭空臆造；但不要编造精确数字。',
  '5) 若输入不是一个能做选品的品类（如人名、一句闲聊），is_category=false，niches 给空数组。',
  GG.T('6) 全部说明字段用简体中文（emoji 除外）。',
       '6) Write all descriptive fields (category_core / market_note / name / gap / evidence / angle / risk / verdict) in English; keep demand and competition EXACTLY as the enum values 高/中/低 and 蓝海/中等/红海.')
].join('\n');

function buildUser(cat, region){
  return '目标市场：'+region+'\n大品类/方向：'+cat;
}

function normalize(d){
  d = d || {};
  const arr = Array.isArray(d.niches) ? d.niches : [];
  return {
    is_category: !!d.is_category,
    category_core: d.category_core ? String(d.category_core) : '',
    market_note: d.market_note ? String(d.market_note) : '',
    niches: arr.filter(n=>n&&n.name).map(n=>({
      name:String(n.name),
      emoji:(n.emoji&&String(n.emoji))||'📦',
      opportunity:GG.clamp(parseInt(n.opportunity,10)||0,0,100),
      demand:DEMAND_C[n.demand]?n.demand:'中',
      competition:COMP_C[n.competition]?n.competition:'中等',
      gap:n.gap?String(n.gap):'',
      evidence:n.evidence?String(n.evidence):'',
      angle:n.angle?String(n.angle):'',
      risk:n.risk?String(n.risk):''
    })).sort((a,b)=>b.opportunity-a.opportunity).slice(0,4),
    verdict: d.verdict ? String(d.verdict) : ''
  };
}

/* ════════════════════════ UI ════════════════════════ */
let main, inEl, resultMount, region;

function intro(){
  main = GG.mountShell(SLUG);
  region = DEFAULT_REGION;

  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, GG.T('一个大类，扫出还没杀红的蓝海','One big category — surface the blue oceans before they turn red')),
    GG.el('p',{class:'nc-lede'},
      GG.T('给一个品类方向、选个目标市场——AI 综合海外需求趋势和差评里的缺口，帮你找出被现有卖家忽视的细分机会：机会分、需求与竞争烈度、用户在抱怨什么、你该怎么切。',
        'Give it a category direction and pick a target market — AI combines overseas demand trends with review gaps to surface niches existing sellers overlook: opportunity score, demand and competition heat, what buyers complain about, and how you should enter.'))
  ));

  main.appendChild(GG.llm.bar(()=>{}));

  main.appendChild(GG.el('div',{class:'nc-pick-h'}, GG.T('① 目标市场','① Target market')));
  const picks = GG.el('div',{class:'nc-picks'});
  REGIONS.forEach(r=>{
    const chip = GG.el('div',{class:'nc-mchip'+(r===region?' on':''),
      onClick:()=>{ region=r; GG.$$('.nc-mchip',picks).forEach(c=>c.classList.remove('on')); chip.classList.add('on'); }},
      r);
    picks.appendChild(chip);
  });
  main.appendChild(picks);

  inEl = GG.el('input',{class:'field', placeholder:GG.T('② 输入一个品类方向，如「宠物用品」「露营户外」','② Enter a category direction, e.g. "pet supplies" or "camping & outdoor"')});
  main.appendChild(GG.el('div',{class:'nc-inrow'}, inEl,
    GG.el('button',{class:'btn primary', onClick:()=>run(inEl.value)}, GG.T('🧭 扫描蓝海','🧭 Scan for niches'))));

  main.appendChild(GG.el('div',{class:'nc-eg-label'}, GG.T('点个例子直接扫 ↓','Tap an example to scan right away ↓')));
  const egs = GG.el('div',{class:'nc-egs'});
  EXAMPLES.forEach(e=> egs.appendChild(
    GG.el('button',{class:'nc-eg', onClick:()=>{ inEl.value=e.label; run(e.label); }},
      GG.el('span',{class:'em'}, e.em), e.label)));
  main.appendChild(egs);

  resultMount = GG.el('div'); main.appendChild(resultMount);

  main.appendChild(GG.el('div',{class:'nc-chain', html:
    GG.T('出海四步：<b style="color:var(--accent)">选品（你在这）</b> → 定价/选市场 → 上架本地化 → 询盘成交',
      'Go-global in four steps: <b style="color:var(--accent)">pick a product (you are here)</b> → price & pick markets → localize listings → close inquiries')}));
}

async function run(cat){
  cat = (cat||'').trim();
  if(!cat){ GG.toast(GG.T('先输入一个品类，或点个例子','Enter a category first, or tap an example')); return; }

  GG.clear(resultMount);
  const stage = GG.el('div'); resultMount.appendChild(stage);
  stage.scrollIntoView({behavior:'smooth', block:'center'});

  if(!GG.llm.connected()){
    GG.clear(stage);
    stage.appendChild(renderResult(SAMPLE, false));
    stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'14px'}},
      GG.el('p',{class:'nc-lede', style:{textAlign:'center', margin:'0 auto'}},
        GG.T('👆 这是离线示例样张。点上方「连接 AI 升级」填一个 Anthropic Key，即可对你想做的品类、你选的市场，扫出真实的蓝海清单。',
          '👆 This is an offline sample. Click "Connect AI" above and add an Anthropic key to scan a real niche list for your category and your market.'))));
    GG.toast(GG.T('未连接 AI，先看示例样张','AI not connected — showing a sample for now'));
    return;
  }

  const t = GG.thinking(stage, [GG.T('扫描这个大类…','Scanning the category…'),GG.T('对照海外需求趋势…','Checking overseas demand trends…'),GG.T('翻差评里的缺口…','Mining review gaps…'),GG.T('圈出还没杀红的蓝海…','Circling the blue-ocean niches…')], 1900);
  let data;
  try{
    const [obj] = await Promise.all([GG.llm.json(SYS, buildUser(cat, region), {max_tokens:2600}), t]);
    data = normalize(obj);
  }catch(err){
    GG.clear(stage); stage.appendChild(renderError(err)); return;
  }
  GG.clear(stage);
  stage.appendChild(data.is_category && data.niches.length ? renderResult(data, true) : renderNotCategory());
  stage.scrollIntoView({behavior:'smooth', block:'start'});
}

function nicheCard(n){
  const card = GG.el('div',{class:'nc-card'});
  card.appendChild(GG.el('div',{class:'nc-ch'},
    GG.el('span',{class:'nc-em'}, n.emoji),
    GG.el('span',{class:'nc-nm'}, n.name),
    GG.el('div',{class:'nc-opp'},
      GG.el('span',{class:'nc-oppn', style:{color:DEMAND_C[n.demand]}}, n.opportunity),
      GG.el('span',{class:'nc-oppl'}, GG.T('机会分','Opportunity score')))));

  const meter = GG.el('div',{class:'nc-meter'});
  meter.appendChild(GG.el('span', {style:{width:n.opportunity+'%', background:DEMAND_C[n.demand]}}));
  card.appendChild(meter);

  card.appendChild(GG.el('div',{class:'nc-tags'},
    GG.el('span',{class:'nc-tag demand',
      style:{background:'rgba(45,158,123,.12)', color:DEMAND_C[n.demand]}}, GG.T('需求 ','Demand ')+(DEMAND_L[n.demand]||n.demand)),
    GG.el('span',{class:'nc-tag comp',
      style:{background:'rgba(0,0,0,.04)', color:COMP_C[n.competition]}}, COMP_L[n.competition]||n.competition)));

  const rows = GG.el('div',{class:'nc-rows'});
  if(n.gap) rows.appendChild(row(GG.T('用户缺口','Review gap'), n.gap));
  if(n.evidence) rows.appendChild(row(GG.T('信号来源','Evidence'), n.evidence));
  if(n.angle) rows.appendChild(row(GG.T('切入角度','Angle'), n.angle));
  if(n.risk) rows.appendChild(row(GG.T('风险','Risk'), n.risk, true));
  card.appendChild(rows);
  return card;
}
function row(lbl, txt, risk){
  return GG.el('div',{class:'nc-row'+(risk?' risk':'')},
    GG.el('span',{class:'lbl'}, lbl), GG.el('span',{class:'txt'}, txt));
}

function renderResult(d, fromAI){
  const card = GG.el('div',{class:'card pad result'});
  card.appendChild(GG.llm.badge(fromAI));
  card.appendChild(GG.el('div',{class:'nc-core', style:{marginTop:'10px'}},
    GG.el('div',{class:'k'}, GG.T('方向 · ','Direction · ')+region),
    GG.el('div',{class:'v'}, d.category_core || GG.T('你的品类','Your category'))));
  if(d.market_note) card.appendChild(GG.el('div',{class:'nc-marknote'}, '🌐 '+d.market_note));

  const list = GG.el('div',{class:'nc-list'});
  d.niches.forEach(n=> list.appendChild(nicheCard(n)));
  card.appendChild(list);

  if(d.verdict) card.appendChild(GG.el('div',{class:'nc-verdict'},
    GG.el('b', null, GG.T('先打哪个','Where to start')), d.verdict));

  card.appendChild(GG.el('div',{class:'nc-bottom'},
    GG.el('button',{class:'btn primary', onClick:()=>GG.copyText(fullText(d))}, GG.T('📝 复制蓝海清单','📝 Copy niche list')),
    GG.el('button',{class:'btn', onClick:()=>GG.copyLink()}, GG.T('🔗 复制链接','🔗 Copy link')),
    GG.el('button',{class:'btn', onClick:()=>{ GG.clear(resultMount); inEl.focus();
      inEl.scrollIntoView({behavior:'smooth',block:'center'}); }}, GG.T('↻ 换个品类','↻ Try another category'))));
  return card;
}

function fullText(d){
  const L=[GG.T('【'+(d.category_core||'选品')+' · '+region+'】蓝海清单',
    '['+(d.category_core||'Sourcing')+' · '+region+'] Blue-ocean niche list')];
  if(d.market_note) L.push(d.market_note);
  d.niches.forEach((n,i)=>{
    L.push('');
    L.push(GG.T((i+1)+'. '+n.emoji+' '+n.name+'（机会分 '+n.opportunity+'｜需求'+n.demand+'｜'+n.competition+'）',
      (i+1)+'. '+n.emoji+' '+n.name+' (opportunity '+n.opportunity+' | demand '+(DEMAND_L[n.demand]||n.demand)+' | '+(COMP_L[n.competition]||n.competition)+')'));
    if(n.gap) L.push(GG.T('   缺口：','   Gap: ')+n.gap);
    if(n.angle) L.push(GG.T('   切入：','   Angle: ')+n.angle);
    if(n.risk) L.push(GG.T('   风险：','   Risk: ')+n.risk);
  });
  if(d.verdict){ L.push(''); L.push(GG.T('先打哪个：','Start with: ')+d.verdict); }
  L.push(''); L.push(GG.T('—— Niche 蓝海选品雷达 · 好玩的东西  ','—— Niche Radar · Playground  ')+location.href);
  return L.join('\n');
}

function renderNotCategory(){
  const card = GG.el('div',{class:'card pad'});
  card.appendChild(GG.el('div',{class:'nc-oops'},
    GG.el('div',{class:'big'}, '🤔'),
    GG.el('h3', null, GG.T('这不太像一个能做选品的品类','That doesn\'t look like a sourceable product category')),
    GG.el('p', null, GG.T('换一个产品方向试试，比如「宠物用品」「露营户外」「厨房小工具」。','Try a product direction instead, like "pet supplies", "camping & outdoor" or "kitchen gadgets".'))));
  return card;
}

function renderError(err){
  const card = GG.el('div',{class:'card pad'});
  card.appendChild(GG.el('div',{class:'nc-oops'},
    GG.el('div',{class:'big'}, '🔌'),
    GG.el('h3', null, GG.T('这次没成功','That didn\'t work')),
    GG.el('p', null, GG.llm.errMsg(err)+GG.T('。点上方「连接 AI」检查 Key，或重试。','. Click "Connect AI" above to check your key, or retry.'))));
  card.appendChild(GG.el('div',{class:'center', style:{marginTop:'12px'}},
    GG.el('button',{class:'btn primary', onClick:()=>run(inEl.value)}, GG.T('重试','Retry'))));
  return card;
}

/* ── 离线示例样张 / 开发自检 ── */
const SAMPLE = {
  is_category:true, category_core:GG.T('宠物用品（北美市场）','Pet supplies (North America)'),
  market_note:GG.T('北美宠物大类整体已是红海，但细分场景（大型犬、养宠出行、智能喂养）仍有结构性缺口。','The North American pet category is a red ocean overall, but niche scenarios — large dogs, pet travel, smart feeding — still show structural gaps.'),
  niches:[
    { name:GG.T('静音慢食碗（大型犬专用）','Quiet slow-feeder bowl (for large dogs)'), emoji:'🐕', opportunity:86, demand:'高', competition:'蓝海',
      gap:GG.T('现有慢食碗多为小型犬尺寸，大型犬主人抱怨「碗太浅、狗一拱就翻、塑料有异味」。','Most slow feeders are sized for small dogs; large-dog owners complain "the bowl is too shallow, flips the moment the dog noses it, and the plastic smells".'),
      evidence:GG.T('亚马逊慢食碗差评高频出现 too small / flips over / smell；大型犬养护内容在 TikTok 持续走高。','Amazon slow-feeder negative reviews are full of "too small / flips over / smell"; large-dog care content keeps climbing on TikTok.'),
      angle:GG.T('做加重防滑底 + 食品级不锈钢 + 大容量深槽，主打「大型犬也不翻、无异味」。','Build a weighted non-slip base + food-grade stainless steel + deep large-capacity slots, positioned as "won\'t flip even for large dogs, zero odor".'),
      risk:GG.T('需做食品接触材料合规（FDA）；注意避开已有的防翻结构专利。','Needs food-contact material compliance (FDA); steer clear of existing anti-flip structure patents.') },
    { name:GG.T('宠物出行安全座椅','Pet car safety seat'), emoji:'🚗', opportunity:79, demand:'高', competition:'中等',
      gap:GG.T('自驾带宠出行普及，但多数宠物座椅「不防撞、固定不牢、清洗麻烦」。','Road-tripping with pets is going mainstream, but most pet seats are "not crash-rated, poorly secured, and a pain to clean".'),
      evidence:GG.T('北美 road trip with dog 场景内容爆发；现有产品差评集中在安全带兼容与清洗。','"Road trip with dog" content is exploding in North America; negative reviews of current products cluster on seat-belt compatibility and cleaning.'),
      angle:GG.T('强调碰撞测试 + 可拆洗内衬 + 通用安全带卡扣，走「安全」差异化。','Lead with crash testing + a removable washable liner + a universal seat-belt clip — differentiate on "safety".'),
      risk:GG.T('宣称安全需有测试背书，否则有责任风险；体积大、头程运费高。','Safety claims need test backing or you carry liability risk; the bulky size means high first-leg freight.') },
    { name:GG.T('可视化智能喂食器（摄像头款）','Smart pet feeder with camera'), emoji:'📷', opportunity:72, demand:'中', competition:'中等',
      gap:GG.T('基础定时喂食器已红海，但「能看到、能对话、卡粮报警」的中端价位段仍稀。','Basic timer feeders are a red ocean, but the mid-price tier with "see your pet, two-way talk, food-jam alerts" is still thin.'),
      evidence:GG.T('差评抱怨「卡粮没提醒」「APP 卡顿」；独居养宠人群对远程看护需求上升。','Reviews complain about "no alert when food jams" and "laggy app"; solo pet owners increasingly want remote check-ins.'),
      angle:GG.T('把摄像头+卡粮检测做稳、APP 不卡，卡在巨头高价位与杂牌低质之间的中端。','Nail a reliable camera + jam detection and a smooth app, and own the mid-tier between pricey big brands and low-quality no-names.'),
      risk:GG.T('涉摄像头需 FCC + 数据隐私合规；软件维护成本高，是长期投入。','Cameras require FCC + data-privacy compliance; software upkeep is costly — a long-term commitment.') }
  ],
  verdict:GG.T('优先「静音慢食碗（大型犬）」：开发轻、合规简单、缺口清晰且竞争最蓝；用它打开类目后，再上更重的宠物出行座椅。','Start with the quiet slow-feeder bowl for large dogs: light development, simple compliance, a clear review gap and the bluest competition. Use it to crack the category, then move up to the heavier pet car seat.')
};
window.NICHE_DEV = {
  render: (d)=>{ GG.clear(resultMount); resultMount.appendChild(renderResult(normalize(d||SAMPLE), false)); },
  notcat: ()=>{ GG.clear(resultMount); resultMount.appendChild(renderNotCategory()); },
  sample: SAMPLE, normalize
};

GG.login(SLUG, {co:GG.T('远帆跨境','Yuanfan Global'), dept:GG.T('跨境运营部','Cross-border Ops'), name:GG.T('林悦','Lin Yue'),
  email:'lin.yue@yuanfan-cb.com', workspace:GG.T('选品雷达工作台','Niche Radar Workbench'),
  sub:GG.T('登录进入你的「选品雷达工作台」——一个大类，扫出还没杀红的细分蓝海。','Sign in to your Niche Radar Workbench — one big category, scan out the niches nobody has crowded yet.')}, intro);
})();
