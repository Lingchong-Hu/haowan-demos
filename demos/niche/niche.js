/* niche — 蓝海选品雷达 / Niche radar for going-global sourcing
   输入一个品类方向 + 选目标市场 → AI 综合海外需求趋势与差评缺口，
   给 3-4 个「被忽视的细分蓝海」+ 机会分 + 需求/竞争标签 + 切入角度 + 风险。
   卖点：AI 时代特有——以前靠人工扒榜单、逐条读差评找缺口，现在 AI 把趋势+评论缺口综合成蓝海清单。
   引擎走全站共享连接器 GG.llm；未连接时给示例样张，不空白。 */
(function(){
const SLUG = 'niche';

const REGIONS = ['北美','欧洲','日本','中东','东南亚','拉美'];
const DEFAULT_REGION = '北美';

const EXAMPLES = [
  {em:'🐾', label:'宠物用品'},
  {em:'🏕️', label:'露营户外'},
  {em:'🍳', label:'厨房小工具'},
  {em:'💪', label:'家用健身'},
  {em:'👶', label:'母婴用品'},
];

const DEMAND_C = {'高':'#2d9e7b','中':'#d4882b','低':'#8a8a93'};
const COMP_C   = {'蓝海':'#2d9e7b','中等':'#d4882b','红海':'#d64545'};

const SYS = [
  '你是「Niche 蓝海选品雷达」：帮跨境卖家在一个大品类里，找出海外市场被忽视、竞争还没杀红的细分机会。',
  '只输出严格 JSON（单个对象），不要 markdown 代码块、不要任何前言或解释文字。',
  'JSON 结构：',
  '{',
  '  "is_category": boolean,       // 输入是否是一个可做选品的产品品类/方向',
  '  "category_core": string,      // 一句简体中文提炼这个方向',
  '  "market_note": string,        // 一句简体中文：这个大类在该目标市场的现状（饱和度/趋势）',
  '  "niches": [                   // 3-4 个细分蓝海机会，按机会分从高到低',
  '    {',
  '      "name": string,           // 细分品类/产品名（简体中文，具体到能去 1688 找到的程度）',
  '      "emoji": string,          // 一个贴切 emoji',
  '      "opportunity": number,    // 机会分 0-100',
  '      "demand": "高"|"中"|"低", // 海外需求信号强度',
  '      "competition": "蓝海"|"中等"|"红海",  // 当前竞争烈度',
  '      "gap": string,            // 简体中文：海外用户没被满足的痛点（常来自差评高频抱怨）',
  '      "evidence": string,       // 简体中文：这个判断的信号来源（如 亚马逊差评高频抱怨X / TikTok某趋势 / 某场景兴起）',
  '      "angle": string,          // 简体中文：差异化切入角度（怎么做得比现有产品好）',
  '      "risk": string            // 简体中文：主要风险（认证/专利/巨头/季节性等）',
  '    }',
  '  ],',
  '  "verdict": string             // 简体中文：综合建议先打哪个细分、为什么',
  '}',
  '硬规则：',
  '1) niches 给 3-4 个，必须是真正「细分」的机会，不要把大类原样复述；具体到卖家能照着去找货。',
  '2) gap 要像来自真实差评/抱怨（如「现有产品太吵」「尺寸不适合大型犬」「续航虚标」），不要泛泛而谈。',
  '3) demand / competition / opportunity 三者要自洽：蓝海+高需求→机会分高。',
  '4) evidence 说清信号从哪来，体现是「综合趋势+评论缺口」而非凭空臆造；但不要编造精确数字。',
  '5) 若输入不是一个能做选品的品类（如人名、一句闲聊），is_category=false，niches 给空数组。',
  '6) 全部说明字段用简体中文（emoji 除外）。'
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
    GG.el('h1', null, '一个大类，扫出还没杀红的蓝海'),
    GG.el('p',{class:'nc-lede'},
      '给一个品类方向、选个目标市场——AI 综合海外需求趋势和差评里的缺口，'+
      '帮你找出被现有卖家忽视的细分机会：机会分、需求与竞争烈度、用户在抱怨什么、你该怎么切。')
  ));

  main.appendChild(GG.llm.bar(()=>{}));

  main.appendChild(GG.el('div',{class:'nc-pick-h'}, '① 目标市场'));
  const picks = GG.el('div',{class:'nc-picks'});
  REGIONS.forEach(r=>{
    const chip = GG.el('div',{class:'nc-mchip'+(r===region?' on':''),
      onClick:()=>{ region=r; GG.$$('.nc-mchip',picks).forEach(c=>c.classList.remove('on')); chip.classList.add('on'); }},
      r);
    picks.appendChild(chip);
  });
  main.appendChild(picks);

  inEl = GG.el('input',{class:'field', placeholder:'② 输入一个品类方向，如「宠物用品」「露营户外」'});
  main.appendChild(GG.el('div',{class:'nc-inrow'}, inEl,
    GG.el('button',{class:'btn primary', onClick:()=>run(inEl.value)}, '🧭 扫描蓝海')));

  main.appendChild(GG.el('div',{class:'nc-eg-label'}, '点个例子直接扫 ↓'));
  const egs = GG.el('div',{class:'nc-egs'});
  EXAMPLES.forEach(e=> egs.appendChild(
    GG.el('button',{class:'nc-eg', onClick:()=>{ inEl.value=e.label; run(e.label); }},
      GG.el('span',{class:'em'}, e.em), e.label)));
  main.appendChild(egs);

  resultMount = GG.el('div'); main.appendChild(resultMount);

  main.appendChild(GG.el('div',{class:'nc-chain', html:
    '出海四步：<b style="color:var(--accent)">选品（你在这）</b> → 定价/选市场 → 上架本地化 → 询盘成交'}));
}

async function run(cat){
  cat = (cat||'').trim();
  if(!cat){ GG.toast('先输入一个品类，或点个例子'); return; }

  GG.clear(resultMount);
  const stage = GG.el('div'); resultMount.appendChild(stage);
  stage.scrollIntoView({behavior:'smooth', block:'center'});

  if(!GG.llm.connected()){
    GG.clear(stage);
    stage.appendChild(renderResult(SAMPLE, false));
    stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'14px'}},
      GG.el('p',{class:'nc-lede', style:{textAlign:'center', margin:'0 auto'}},
        '👆 这是离线示例样张。点上方「连接 AI 升级」填一个 Anthropic Key，'+
        '即可对你想做的品类、你选的市场，扫出真实的蓝海清单。')));
    GG.toast('未连接 AI，先看示例样张');
    return;
  }

  const t = GG.thinking(stage, ['扫描这个大类…','对照海外需求趋势…','翻差评里的缺口…','圈出还没杀红的蓝海…'], 1900);
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
      GG.el('span',{class:'nc-oppl'}, '机会分'))));

  const meter = GG.el('div',{class:'nc-meter'});
  meter.appendChild(GG.el('span', {style:{width:n.opportunity+'%', background:DEMAND_C[n.demand]}}));
  card.appendChild(meter);

  card.appendChild(GG.el('div',{class:'nc-tags'},
    GG.el('span',{class:'nc-tag demand',
      style:{background:'rgba(45,158,123,.12)', color:DEMAND_C[n.demand]}}, '需求 '+n.demand),
    GG.el('span',{class:'nc-tag comp',
      style:{background:'rgba(0,0,0,.04)', color:COMP_C[n.competition]}}, n.competition)));

  const rows = GG.el('div',{class:'nc-rows'});
  if(n.gap) rows.appendChild(row('用户缺口', n.gap));
  if(n.evidence) rows.appendChild(row('信号来源', n.evidence));
  if(n.angle) rows.appendChild(row('切入角度', n.angle));
  if(n.risk) rows.appendChild(row('风险', n.risk, true));
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
    GG.el('div',{class:'k'}, '方向 · '+region),
    GG.el('div',{class:'v'}, d.category_core || '你的品类')));
  if(d.market_note) card.appendChild(GG.el('div',{class:'nc-marknote'}, '🌐 '+d.market_note));

  const list = GG.el('div',{class:'nc-list'});
  d.niches.forEach(n=> list.appendChild(nicheCard(n)));
  card.appendChild(list);

  if(d.verdict) card.appendChild(GG.el('div',{class:'nc-verdict'},
    GG.el('b', null, '先打哪个'), d.verdict));

  card.appendChild(GG.el('div',{class:'nc-bottom'},
    GG.el('button',{class:'btn primary', onClick:()=>GG.copyText(fullText(d))}, '📝 复制蓝海清单'),
    GG.el('button',{class:'btn', onClick:()=>GG.copyLink()}, '🔗 复制链接'),
    GG.el('button',{class:'btn', onClick:()=>{ GG.clear(resultMount); inEl.focus();
      inEl.scrollIntoView({behavior:'smooth',block:'center'}); }}, '↻ 换个品类')));
  return card;
}

function fullText(d){
  const L=['【'+(d.category_core||'选品')+' · '+region+'】蓝海清单'];
  if(d.market_note) L.push(d.market_note);
  d.niches.forEach((n,i)=>{
    L.push('');
    L.push((i+1)+'. '+n.emoji+' '+n.name+'（机会分 '+n.opportunity+'｜需求'+n.demand+'｜'+n.competition+'）');
    if(n.gap) L.push('   缺口：'+n.gap);
    if(n.angle) L.push('   切入：'+n.angle);
    if(n.risk) L.push('   风险：'+n.risk);
  });
  if(d.verdict){ L.push(''); L.push('先打哪个：'+d.verdict); }
  L.push(''); L.push('—— Niche 蓝海选品雷达 · 好玩的东西  '+location.href);
  return L.join('\n');
}

function renderNotCategory(){
  const card = GG.el('div',{class:'card pad'});
  card.appendChild(GG.el('div',{class:'nc-oops'},
    GG.el('div',{class:'big'}, '🤔'),
    GG.el('h3', null, '这不太像一个能做选品的品类'),
    GG.el('p', null, '换一个产品方向试试，比如「宠物用品」「露营户外」「厨房小工具」。')));
  return card;
}

function renderError(err){
  const card = GG.el('div',{class:'card pad'});
  card.appendChild(GG.el('div',{class:'nc-oops'},
    GG.el('div',{class:'big'}, '🔌'),
    GG.el('h3', null, '这次没成功'),
    GG.el('p', null, GG.llm.errMsg(err)+'。点上方「连接 AI」检查 Key，或重试。')));
  card.appendChild(GG.el('div',{class:'center', style:{marginTop:'12px'}},
    GG.el('button',{class:'btn primary', onClick:()=>run(inEl.value)}, '重试')));
  return card;
}

/* ── 离线示例样张 / 开发自检 ── */
const SAMPLE = {
  is_category:true, category_core:'宠物用品（北美市场）',
  market_note:'北美宠物大类整体已是红海，但细分场景（大型犬、养宠出行、智能喂养）仍有结构性缺口。',
  niches:[
    { name:'静音慢食碗（大型犬专用）', emoji:'🐕', opportunity:86, demand:'高', competition:'蓝海',
      gap:'现有慢食碗多为小型犬尺寸，大型犬主人抱怨「碗太浅、狗一拱就翻、塑料有异味」。',
      evidence:'亚马逊慢食碗差评高频出现 too small / flips over / smell；大型犬养护内容在 TikTok 持续走高。',
      angle:'做加重防滑底 + 食品级不锈钢 + 大容量深槽，主打「大型犬也不翻、无异味」。',
      risk:'需做食品接触材料合规（FDA）；注意避开已有的防翻结构专利。' },
    { name:'宠物出行安全座椅', emoji:'🚗', opportunity:79, demand:'高', competition:'中等',
      gap:'自驾带宠出行普及，但多数宠物座椅「不防撞、固定不牢、清洗麻烦」。',
      evidence:'北美 road trip with dog 场景内容爆发；现有产品差评集中在安全带兼容与清洗。',
      angle:'强调碰撞测试 + 可拆洗内衬 + 通用安全带卡扣，走「安全」差异化。',
      risk:'宣称安全需有测试背书，否则有责任风险；体积大、头程运费高。' },
    { name:'可视化智能喂食器（摄像头款）', emoji:'📷', opportunity:72, demand:'中', competition:'中等',
      gap:'基础定时喂食器已红海，但「能看到、能对话、卡粮报警」的中端价位段仍稀。',
      evidence:'差评抱怨「卡粮没提醒」「APP 卡顿」；独居养宠人群对远程看护需求上升。',
      angle:'把摄像头+卡粮检测做稳、APP 不卡，卡在巨头高价位与杂牌低质之间的中端。',
      risk:'涉摄像头需 FCC + 数据隐私合规；软件维护成本高，是长期投入。' }
  ],
  verdict:'优先「静音慢食碗（大型犬）」：开发轻、合规简单、缺口清晰且竞争最蓝；用它打开类目后，再上更重的宠物出行座椅。'
};
window.NICHE_DEV = {
  render: (d)=>{ GG.clear(resultMount); resultMount.appendChild(renderResult(normalize(d||SAMPLE), false)); },
  notcat: ()=>{ GG.clear(resultMount); resultMount.appendChild(renderNotCategory()); },
  sample: SAMPLE, normalize
};

GG.login(SLUG, {co:'远帆跨境', dept:'跨境运营部', name:'林悦',
  email:'lin.yue@yuanfan-cb.com', workspace:'选品雷达工作台',
  sub:'登录进入你的「选品雷达工作台」——一个大类，扫出还没杀红的细分蓝海。'}, intro);
})();
