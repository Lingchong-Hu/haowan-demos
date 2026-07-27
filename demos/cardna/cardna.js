/* cardna —— 购车品味 DNA（whips 滑动 + carsnap 答题 合并版）
   ① 滑：隐式品味（你被什么吸引）  ② 答：显式约束 + 购买意图（预算/座位/能源/时间线/首购）
   ③ 合成「购车品味 DNA」：滑出来的“向往” × 答出来的“现实” → 揪出两者的 gap（核心洞察）
   ④ 精配（隐式品味 + 预算/座位硬约束）+ 诚实短板 + 黑马 + 替你问销售的问题
   ⑤「车企/平台眼里的你」：匿名人群 + 数据价值 + 知情同意开关（把双边商业模式演出来）
   连了 key 走真实模型，没连退回本地启发式。 */
(function(){
const SLUG='cardna';
const {DECK, CATALOG, QUIZ} = window.CARDNA;
const DIMS = ['body','size','vibe','power','price'];
const DIM_LABEL = {body:GG.T('车型','Type'), size:GG.T('尺寸','Size'), vibe:GG.T('气质','Vibe'), power:GG.T('动力','Power'), price:GG.T('定位','Tier')};
// i18n：维度值/用途/价值档保持中文作内部键（查表与比较依赖它们），仅在显示层经 TV() 翻译
const VAL_EN = {
  '掀背':'Hatchback','轿车':'Sedan','跑车':'Sports car','皮卡':'Pickup','旅行车':'Wagon',
  '小型':'Small','紧凑':'Compact','中型':'Midsize','大型':'Full-size',
  '运动':'Sporty','复古':'Retro','居家':'Family','优雅':'Refined','极简':'Minimalist','硬派':'Rugged','均衡':'Balanced',
  '燃油':'Gas','纯电':'EV','混动':'Hybrid','不限':'Any',
  '经济':'Budget','主流':'Mainstream','高端':'Premium','豪华':'Luxury',
  '通勤':'commuting','玩乐':'weekend fun','家用':'family use','多人':'a full house',
  '极高':'Very high','高':'High','中等':'Medium','很低':'Very low'
};
const TV = v => GG.T(v, VAL_EN[v]);
// range 形如 '13–18 万' / '130 万 +'，priceK 依赖其中文原文解析，英文只在显示层转换
function rangeT(r){
  if(!GG.EN) return r;
  const m=String(r).match(/^(\d+)(?:–(\d+))?\s*万\s*(\+?)$/); if(!m) return r;
  const k=n=>{ const v=parseInt(n,10)*10; return v>=1000 ? (v/1000)+'M' : v+'k'; };
  return m[2] ? `¥${parseInt(m[1],10)*10}–${k(m[2])}${m[3]}` : `¥${k(m[1])}${m[3]}`;
}
// 用每台车 range 里的“起步价（万）”做精确预算匹配，不再用粗糙的 4 档
function priceK(car){ const m=String(car.range||'').match(/\d+/g); return m?parseInt(m[0],10):99; }
const MIN_SWIPE = 6;
const SEED = 5;
let main;

/* ───────── 视觉小工具 ───────── */
function carSVG(color, type){
  const tall = (type==='SUV'||type==='MPV'||type==='皮卡');
  const low  = (type==='跑车');
  const roofY = low ? 30 : (tall ? 14 : 24);
  const glassTop = low ? 33 : (tall ? 18 : 28);
  return `<svg viewBox="0 0 220 96" width="100%" style="display:block">
    <ellipse cx="110" cy="86" rx="92" ry="7" fill="rgba(0,0,0,.10)"/>
    <path d="M14 62 Q16 46 36 44 L66 ${roofY+18} Q80 ${roofY} 108 ${roofY-1} L150 ${roofY+1}
             Q168 ${roofY+6} 182 46 L202 50 Q210 52 210 60 L210 66 Q210 70 204 70 L22 70 Q14 70 14 62 Z"
          fill="${color}"/>
    <path d="M72 ${roofY+16} Q84 ${glassTop} 106 ${glassTop} L130 ${glassTop+1} L146 46 Z"
          fill="rgba(255,255,255,.34)"/>
    <circle cx="62" cy="70" r="15" fill="#1c1c22"/><circle cx="62" cy="70" r="6.5" fill="#cfcfd6"/>
    <circle cx="162" cy="70" r="15" fill="#1c1c22"/><circle cx="162" cy="70" r="6.5" fill="#cfcfd6"/>
  </svg>`;
}
function chips(car){
  return GG.el('div',{class:'chips', style:{marginTop:'10px'}},
    [TV(car.body), TV(car.size), TV(car.vibe), TV(car.power), TV(car.price), rangeT(car.range)].filter(Boolean)
      .map(t=>GG.el('span',{class:'chip',style:{cursor:'default'}}, t)));
}
function hexA(hex,a){ const {r,g,b}=GG._rgb(hex); return `rgba(${r},${g},${b},${a})`; }

/* ───────── 引擎 ───────── */
function swipeWeights(liked, disliked){
  const w = {};
  const add=(car,val)=>{ for(const d of DIMS){ w[car[d]]=(w[car[d]]||0)+val; } };
  liked.forEach(c=>add(c,1));
  disliked.forEach(c=>add(c,-0.6));
  return w;
}
function tendenciesFrom(liked){
  const cnt = {};
  liked.forEach(c=>{ for(const d of DIMS){ cnt[c[d]]=(cnt[c[d]]||0)+1; } });
  return Object.entries(cnt).filter(([k,v])=>v>=2 || (v>=1 && liked.length<=3))
    .sort((a,b)=>b[1]-a[1]).slice(0,5)
    .map(([k,v])=>({ val:k, n:v, dim:DIMS.find(d=> [...DECK,...CATALOG].some(c=>c[d]===k)) }));
}
function domOf(liked, dim){
  const cnt={}; liked.forEach(c=> cnt[c[dim]]=(cnt[c[dim]]||0)+1);
  const e=Object.entries(cnt).sort((a,b)=>b[1]-a[1]);
  return e.length? e[0][0] : null;
}
function parseQuiz(answers){
  const get=(qid)=> answers[qid] || null;
  const o={};
  QUIZ.forEach(q=>{ o[q.id]=get(q.id); });
  return {
    budgetCap:   o.budget ? o.budget.cap : null,      // 预算上限（万）；999 = 不封顶
    budgetLabel: o.budget ? o.budget.bl  : GG.T('不限','No limit'),
    budgetTop:   o.budget ? o.budget.cap >= 999 : false,
    seatNeed:   o.seats  ? o.seats.seat  : 1,
    useWord:    o.seats  ? o.seats.use   : '',
    energyPref: o.energy ? o.energy.energy : null,
    intent:     o.timeline ? o.timeline.intent : 0,
    intentLabel: o.timeline ? o.timeline.intentLabel : GG.T('纯逛逛','Just browsing'),
    first:      o.first ? !!o.first.first : false,
  };
}
function scoreCatalog(liked, disliked, quiz){
  const w = swipeWeights(liked, disliked);
  return CATALOG.map(car=>{
    let s=0; for(const d of DIMS) s += (w[car[d]]||0);          // 隐式品味（滑出来的）
    let inBudget=true, seatFit=true;
    if(quiz.budgetCap){ const pk=priceK(car);
      if(pk<=quiz.budgetCap) s+=6; else { s-=Math.min(45,(pk-quiz.budgetCap)*0.6); inBudget=false; } }
    if(quiz.seatNeed>1){ if(car.seats>=quiz.seatNeed) s+=4; else { s-=16; seatFit=false; } }
    if(quiz.energyPref && car.power===quiz.energyPref) s+=8;
    return {car, s, inBudget, seatFit};
  }).sort((a,b)=> b.s - a.s);
}
function pickWildcard(scored, top3ids, top1){
  const diff = c => ['body','size','power'].filter(d=>c[d]!==top1[d]).length;
  const cand = scored.find(x=> !top3ids.has(x.car.id) && x.inBudget && x.seatFit && diff(x.car)>=2);
  return (cand || scored.find(x=>!top3ids.has(x.car.id)) || {}).car;
}
function matchOf(car, core){
  const hits = core.filter(v=> DIMS.some(d=>car[d]===v)).length;
  const pct = core.length ? Math.round(GG.clamp(52 + hits/core.length*44, 52, 98)) : 70;
  return {pct, hits, total:core.length};
}

// 向往 vs 现实：滑出来的品味 vs 答出来的约束
function gapInsight(liked, quiz){
  const out = [];
  // 预算差：只在「真超预算」且「不是最高/不封顶档」时才提，避免一边封顶选项一边怪人好高骛远
  const pks = liked.map(priceK);
  const asp = pks.length ? Math.round(pks.reduce((a,b)=>a+b,0)/pks.length) : null;
  if(asp && quiz.budgetCap && !quiz.budgetTop && asp > quiz.budgetCap*1.08){
    out.push({ kind:'budget',
      title:GG.T('眼睛比钱包高了一截','Your eyes run ahead of your wallet'),
      body:GG.T(`你右滑的车起步价平均约 ${asp} 万，而你的预算是 ${quiz.budgetLabel}——差着约 ${Math.max(1, asp-quiz.budgetCap)} 万。下面的推荐我已按你的预算来，但你的“向往款”也一并标出来，心里有数。`,
        `The cars you swiped right on start around ¥${asp*10}k on average, but your budget is ${quiz.budgetLabel} — a gap of roughly ¥${Math.max(1, asp-quiz.budgetCap)*10}k. The picks below stick to your budget, with your "dream pick" flagged too, so you know exactly where you stand.`) });
  }
  // 玩乐 vs 家用
  const domVibe = domOf(liked,'vibe');
  const playful = ['运动','复古'].includes(domVibe) || liked.some(c=>c.body==='跑车');
  if(playful && ['家用','多人'].includes(quiz.useWord)){
    out.push({ kind:'usage',
      title:GG.T('嘴上要家用，手却很诚实','You say family car — your thumb says otherwise'),
      body:GG.T(`你说主要"${quiz.useWord}"，可右滑里运动、跑车的影子不少。这台车要么是给全家的妥协，要么你该认真问自己：是不是还想给自己留一点玩心？`,
        `You said it's mainly for ${TV(quiz.useWord)}, yet sporty picks and sports cars kept showing up in your right swipes. Either this car is a compromise for the family, or ask yourself honestly: do you still want to keep a little fun for yourself?`) });
  }
  // 尺寸矛盾
  const smallN = liked.filter(c=>['小型','紧凑'].includes(c.size)).length;
  const bigN   = liked.filter(c=>c.size==='大型'||c.body==='MPV').length;
  if(smallN>=1 && bigN>=1 && Math.min(smallN,bigN)>=1 && out.length<2){
    out.push({ kind:'size',
      title:GG.T('你在“好停”和“够大”之间摇摆','Torn between easy-to-park and big-enough'),
      body:GG.T(`小车和大车你都右滑了——这俩是反着拉的。等真去看车，先想清楚：是市区好停更重要，还是空间够大更重要。`,
        `You swiped right on both small cars and big ones — and those pull in opposite directions. Before you hit the showroom, decide which matters more: easy city parking, or serious space.`) });
  }
  return out;
}

/* ── 人格 ── */
const VIBE_PERSONA = {
  '运动':{name:GG.T('热血操控派','Hot-Blooded Driver'), read:GG.T('你的右滑几乎都带着"开起来要爽"的执念——动力、姿态、贴地感，是你的及格线。','Nearly every right swipe carries one obsession — it has to feel great to drive. Power, stance, road feel: that is your baseline.')},
  '复古':{name:GG.T('情怀玩家','Nostalgia Collector'),   read:GG.T('你买的不只是工具，是一段调性。线条、年代感、那点不实用的浪漫，才让你心动。','You are not buying a tool, you are buying a mood. Lines, period charm, that impractical bit of romance — that is what moves you.')},
  '居家':{name:GG.T('务实居家派','Practical Family Type'), read:GG.T('你看车先看"全家用着顺不顺"——空间、省心、好养，比零百加速重要。','You judge a car by how well the whole family lives with it — space, peace of mind and easy upkeep beat 0–100 times.')},
  '优雅':{name:GG.T('品质优雅派','Quiet Sophisticate'), read:GG.T('你要的是低调的体面：安静、平顺、有气质，不张扬但经得起细看。','You want understated class: quiet, smooth, graceful — nothing flashy, but it rewards a closer look.')},
  '极简':{name:GG.T('科技极简派','Tech Minimalist'), read:GG.T('你被安静座舱、干净大屏和零油费吸引——一台车该聪明、克制、没有多余按钮。','You are drawn to hushed cabins, clean screens and zero gas bills — a car should be smart, restrained, with no extra buttons.')},
  '硬派':{name:GG.T('荒野硬核派','Off-Grid Hardcore'), read:GG.T('柏油路框不住你，你右滑的全是能上山下河、能装能扛的家伙。','Asphalt cannot contain you — everything you swiped right on can climb, ford, haul and take a beating.')},
};
function personaLocal(liked, quiz, gaps){
  const domVibe = domOf(liked,'vibe');
  const base = Object.assign({}, VIBE_PERSONA[domVibe] || {name:GG.T('均衡理性派','Balanced Rationalist'), read:GG.T('你的口味挺均衡，没有偏执取向，更看重整体的合适。','Your taste is well-rounded — no single obsession, just an eye for the overall fit.')});
  if(gaps.some(g=>g.kind==='budget')) base.read += GG.T(' 而且你的眼光比预算高半档——典型的"向往型买家"。',' And your eye runs half a tier above your budget — a classic aspirational buyer.');
  else if(quiz.first) base.read += GG.T(' 作为人生第一台车，你更想一步到位、不留遗憾。',' As your first-ever car, you want to get it right in one go — no regrets.');
  return base;
}

/* ── 替你问销售的问题 ── */
const Q_BANK = {
  '纯电':GG.T('实际续航能打几折？快充到 80% 要多久？冬天衰减大不大？','How does real-world range compare to the rated figure? How long to fast-charge to 80%? How bad is the winter drop-off?'),
  '混动':GG.T('亏电状态下油耗多少？动力电池质保几年 / 多少公里？','What is the fuel economy with a depleted battery? How many years / kilometers is the traction battery warranty?'),
  '燃油':GG.T('保养周期和单次费用大概多少？这具发动机烧机油吗？','What is the service interval and typical cost per visit? Does this engine burn oil?'),
  '豪华':GG.T('三年保值率大概多少？常见大额维修项贵不贵？','What is the three-year resale value? Are the common big-ticket repairs expensive?'),
  '高端':GG.T('三年保值率怎么样？整车与三电质保各多久？','How is the three-year resale value? How long are the vehicle and battery/powertrain warranties?'),
  'MPV':GG.T('二排座椅怎么放倒？三排坐成年人长途挤不挤？','How do the second-row seats fold? Can adults handle the third row on long trips?'),
  '皮卡':GG.T('我所在城市对皮卡有没有限行 / 限高规定？','Does my city restrict pickups — road bans or height limits?'),
  '跑车':GG.T('后排和后备箱日常够用吗？市区路面颠不颠？','Are the back seats and trunk usable day to day? How rough is the ride on city streets?'),
  '大型':GG.T('我的车位 / 小区限高，它停得下吗？','Will it actually fit my parking spot and clear my garage height limit?'),
  'SUV':GG.T('后排放倒后是不是纯平？后备箱实际能装多少？','Do the rear seats fold fully flat? How much can the trunk really hold?'),
};
function questionsFor(picks, quiz){
  const seen=new Set(), out=[];
  for(const p of picks){ for(const d of DIMS){ const q=Q_BANK[p.car[d]];
    if(q && !seen.has(q)){ seen.add(q); out.push(q); } if(out.length>=3) break; } if(out.length>=3) break; }
  const fb=[GG.T('真实落地价（含购置税、保险、上牌）是多少？','What is the real out-the-door price — tax, insurance and registration included?'),
            quiz.first?GG.T('新手首保、三电/整车质保和道路救援怎么算？','How do the first service, vehicle and battery warranties, and roadside assistance work for a first-time owner?'):GG.T('有哪些现金 / 置换 / 金融优惠可争取？','What cash, trade-in or financing incentives can I push for?'),
            GG.T('是现车还是要等？交付周期多久？','Is it in stock or on order? How long is delivery?')];
  for(const q of fb){ if(out.length>=3) break; if(!seen.has(q)){ seen.add(q); out.push(q); } }
  return out.slice(0,3);
}

/* ── 车企眼里的你：匿名人群 + 数据价值（示意） ── */
function cohortOf(liked, quiz){
  const domVibe = domOf(liked,'vibe') || '均衡';
  const power = quiz.energyPref || domOf(liked,'power') || '不限';
  const chips = [
    quiz.first ? GG.T('首购','First-time buyer') : GG.T('增换购','Upgrading / adding'),
    quiz.budgetCap ? quiz.budgetLabel : GG.T('预算不限','No budget cap'),
    GG.T(`${domVibe}·${power}倾向`, `${TV(domVibe)} · ${TV(power)} leaning`),
    quiz.intentLabel,
  ];
  // 价值分档（示意）：意图 × 首购
  let tier, lead, why;
  if(quiz.intent>=2){
    tier = quiz.first ? '极高' : '高';
    lead = quiz.first ? GG.T('¥150–400 / 条','¥150–400 / lead') : GG.T('¥120–300 / 条','¥120–300 / lead');
    why = quiz.first
      ? GG.T('3 个月内必入 + 人生首购 = 还没有品牌忠诚、谁先触达谁占位，车企最想要的就是这种人。','Buying within 3 months + first car ever = no brand loyalty yet, and whoever reaches them first wins. Exactly the buyer automakers want most.')
      : GG.T('3 个月内必入的高意向在库买家，离成交最近，线索最值钱。','A high-intent, in-market buyer closing within 3 months — nearest to a sale, so the lead is worth the most.');
  } else if(quiz.intent===1){
    tier='中等'; lead=GG.T('¥30–120 / 条','¥30–120 / lead'); why=GG.T('半年内的潜在买家，适合提前种草、持续触达，等他靠近购买再撮合。','A prospect within six months — worth seeding early and nurturing, then matching once they get close to buying.');
  } else {
    tier='很低'; lead='≈ ¥0'; why=GG.T('目前还只是逛逛，没有购买意向——对线索生意几乎没价值，但能进趋势样本。','Just browsing for now with no intent to buy — nearly worthless as a lead, but still useful in the trends sample.');
  }
  return {chips, tier, lead, why, domVibe, power};
}

/* ───────── AI 通路 ───────── */
const SYS = '你是懂车又敢说真话的购车顾问。用户先在一堆车里左右滑（右滑=喜欢，采集隐式品味），再答了几道题（预算/座位/能源/时间线/是否首购，是显式约束与购买意图）。请据此精配，并把"向往 vs 现实"的张力说透。只输出严格 JSON：'+
  '{"persona":{"name":"4到6字人格名","read":"读懂 ta 的一段话，60字内"},'+
  '"gap":"一句话点出 ta 滑出来的品味和答出来的约束之间最大的矛盾，没有就说哪里很一致，40字内",'+
  '"picks":[{"id":"候选库id","reason":"为什么推荐，结合品味与预算，35字内","caveat":"最该提醒的真实短板，20字内"}],'+
  '"wildcard":{"id":"一台 ta 没右滑但更对路的车","reason":"35字内"},'+
  '"questions":["替 ta 去店里追问销售的3个问题"]}。'+
  'picks 正好 3 台、id 来自候选库且不重复、必须在预算内、座位够；wildcard 同样来自候选库。'+
  '【硬规则】只有当 ta 右滑的车明显超过所给预算时，才可在 persona/gap 里提“向往 vs 现实/超预算”；'+
  '若 ta 选的是最高/不封顶预算档，绝不能说 ta 好高骛远或要妥协——ta 买得起，正常夸并推荐即可。'+
  GG.T('全部简体中文。','【输出语言】所有用户可见字段（persona.name、persona.read、gap、picks[].reason、picks[].caveat、wildcard.reason、questions）一律用地道、自然的英文输出，车型名用官方英文名；id 保持候选库原样。');

function localBrief(liked, disliked, quiz){
  const scored = scoreCatalog(liked, disliked, quiz);
  const tend = tendenciesFrom(liked);
  const core = tend.map(t=>t.val);
  const top3 = scored.slice(0,3).map(x=>x.car);
  const ids = new Set(top3.map(c=>c.id));
  const wc = pickWildcard(scored, ids, top3[0]);
  const gaps = gapInsight(liked, quiz);
  const picks = top3.map(car=>{ const m=matchOf(car,core);
    return {car, match:m.pct, hits:m.hits, total:m.total, reason:reasonLocal(car,tend,quiz), caveat:car.caveat}; });
  return {
    picks,
    wildcard: wc ? {car:wc, reason:wildReasonLocal(wc, liked, quiz)} : null,
    tendencies: tend, gaps,
    persona: personaLocal(liked, quiz, gaps),
    questions: questionsFor(picks, quiz),
    _ai:false
  };
}
const BODY_WORD = {'SUV':GG.T('空间灵活','flexible space'),'MPV':GG.T('能装能坐','room for people and cargo'),'轿车':GG.T('好开省心','easy, fuss-free driving'),'掀背':GG.T('小巧好停','a compact, park-anywhere footprint'),'旅行车':GG.T('能装又有格调','cargo room with real style'),'跑车':GG.T('纯粹好玩','pure fun'),'皮卡':GG.T('能拉能扛','hauling muscle')};
function reasonLocal(car, tend, quiz){
  const hits = tend.filter(t=> DIMS.some(d=>car[d]===t.val)).slice(0,3).map(t=>t.val);
  const inB = quiz.budgetCap ? (priceK(car)<=quiz.budgetCap) : true;
  const hitStr = hits.map(TV).join(GG.T('、',', '));
  if(hits.length) return GG.T(`${inB?'在你预算内，':''}又正中你反复右滑的 ${hits.join('、')}。`,
    (inB?'Fits your budget, and it ':'It ')+`nails the ${hitStr} you kept swiping right on.`);
  // 没命中品味（多半被预算/座位压住）：诚实说它胜在哪，按车型区分
  return GG.T(`预算框住了你的"向往"，这台胜在${BODY_WORD[car.body]||'好上手'}，是更落地的选择。`,
    `Your budget reins in the "dream" picks — this one wins on ${BODY_WORD[car.body]||GG.T('好上手','being easy to live with')}, the more grounded call.`);
}
function wildReasonLocal(car, liked, quiz){
  const tend = tendenciesFrom(liked);
  const hits = tend.filter(t=> DIMS.some(d=>car[d]===t.val)).map(t=>t.val).slice(0,3);
  const hitStr = hits.length? hits.join('、') : '你的整体口味';
  const hitStrEn = hits.length? hits.map(TV).join(', ') : 'your overall taste';
  const over = quiz.budgetCap && priceK(car) > quiz.budgetCap;
  if(over) return GG.T(`你没右滑过它：它在 ${hitStr} 上其实最懂你，只是略超你的预算——最像你"向往"的那台，想清楚要不要再加一点。`,
    `You never swiped right on it, but on ${hitStrEn} it actually gets you best — just a touch over budget. It's the closest thing to your "dream car"; decide whether it's worth stretching for.`);
  return GG.T(`你没右滑过它，但它在 ${hitStr} 上和你最合拍，还卡在你预算里——容易被你划过去的一台。`,
    `You never swiped right on it, yet on ${hitStrEn} it matches you best — and it squeezes into your budget. Exactly the kind of car that's easy to flick past.`);
}

async function getBrief(liked, disliked, quiz, useAI){
  const local = localBrief(liked, disliked, quiz);
  if(useAI && liked.length){
    try{
      const fmt = c=>`${c.body}/${c.size}/${c.vibe}/${c.power}/${c.price}/${c.range}/${c.seats}座`;
      const cat = CATALOG.map(c=>`${c.id}|${c.name}：${fmt(c)} · 短板：${c.caveat}`).join('\n');
      const likeStr = liked.map(c=>`${c.name}(${fmt(c)})`).join('、') || '无';
      const dislikeStr = disliked.map(c=>c.name).join('、') || '无';
      const qz = `预算上限：${quiz.budgetLabel}${quiz.budgetTop?'（已是最高/不封顶档：ta 买得起豪华，绝不要说 ta 超预算或好高骛远）':''}；座位需求：≥${quiz.seatNeed}（${quiz.useWord||'未填'}）；能源：${quiz.energyPref||'不限'}；时间线：${quiz.intentLabel}；${quiz.first?'人生首购':'增换购'}`;
      const obj = await GG.llm.json(SYS, `右滑(喜欢)：${likeStr}\n左滑(不喜欢)：${dislikeStr}\n问卷：${qz}\n\n候选车库：\n${cat}`, {max_tokens:1100});
      const core = local.tendencies.map(t=>t.val);
      const seen=new Set();
      const picks = (Array.isArray(obj.picks)?obj.picks:[]).map(p=>{
        const car=CATALOG.find(c=>c.id===p.id); if(!car||seen.has(car.id)) return null;
        if(quiz.budgetCap && priceK(car)>quiz.budgetCap) return null;                 // 预算硬约束
        if(quiz.seatNeed>1 && car.seats<quiz.seatNeed) return null;                   // 座位硬约束
        seen.add(car.id); const m=matchOf(car,core);
        return {car, match:m.pct, hits:m.hits, total:m.total,
          reason:String(p.reason||'').trim()||reasonLocal(car,local.tendencies,quiz),
          caveat:String(p.caveat||'').trim()||car.caveat};
      }).filter(Boolean);
      for(const lp of local.picks){ if(picks.length>=3) break; if(!seen.has(lp.car.id)){ seen.add(lp.car.id); picks.push(lp); } }
      let wildcard = local.wildcard;
      const wcCar = obj.wildcard && CATALOG.find(c=>c.id===obj.wildcard.id);
      if(wcCar && !seen.has(wcCar.id)) wildcard = {car:wcCar, reason:String(obj.wildcard.reason||'').trim()||wildReasonLocal(wcCar,liked,quiz)};
      const persona = (obj.persona&&obj.persona.name)? {name:String(obj.persona.name).trim(), read:String(obj.persona.read||'').trim()} : local.persona;
      const questions = (Array.isArray(obj.questions)?obj.questions:[]).map(q=>String(q||'').trim()).filter(Boolean).slice(0,3);
      const gaps = local.gaps.slice();
      if(obj.gap && String(obj.gap).trim() && !gaps.length) gaps.push({kind:'ai', title:GG.T('AI 看到的张力','The tension the AI sees'), body:String(obj.gap).trim()});
      if(picks.length) return {picks:picks.slice(0,3), wildcard, tendencies:local.tendencies, gaps, persona,
        questions:questions.length?questions:local.questions, _ai:true};
    }catch(e){ GG.toast(GG.llm.errMsg(e)); }
  }
  return local;
}

/* ───────── 流程 ───────── */
function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.l){
    const byId=id=>DECK.find(c=>c.id===id);
    const liked=(st.l||[]).map(byId).filter(Boolean), disliked=(st.d||[]).map(byId).filter(Boolean);
    const answers={};
    if(st.q) QUIZ.forEach(q=>{ const k=st.q[q.id]; const o=q.options.find(op=>op.key===k); if(o) answers[q.id]=o; });
    if(Object.keys(answers).length===QUIZ.length){ showResult(liked, disliked, answers, true); return; }
  }
  intro();
}

function intro(){
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, GG.T('你的购车品味 DNA','Your Car-Taste DNA')),
    GG.el('p', null, GG.T(`先滑几张车读你的"眼缘"，再答 5 题锁定预算与用途。两股信号合成你的购车品味画像——帮你选车，也让你看清"向往"和"现实"差在哪。`,
      `Swipe through a few cars so we can read your gut taste, then answer 5 quick questions to lock in budget and use case. The two signals combine into your car-taste profile — helping you pick a car, and showing exactly where "dream" and "reality" part ways.`))
  ));
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'22px'}},
    GG.el('button',{class:'btn primary lg', onClick:swipeStage}, GG.T('开始 · 先滑车 →','Start · swipe some cars →'))
  ));
  main.appendChild(GG.llm.bar());
}

/* ── 实时读你 ── */
function liveRead(liked){
  const cnt={}; DIMS.forEach(d=>cnt[d]={});
  liked.forEach(c=>DIMS.forEach(d=> cnt[d][c[d]]=(cnt[d][c[d]]||0)+1 ));
  const lead={}, decided={};
  DIMS.forEach(d=>{ const e=Object.entries(cnt[d]).sort((a,b)=>b[1]-a[1]);
    lead[d]= e.length? e[0][0]:null; decided[d]= e.length && e[0][1]>=2 && (e.length<2||e[0][1]>e[1][1]); });
  const cell = GG.el('div',{style:{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'6px'}});
  DIMS.forEach(d=>{ const on=decided[d];
    cell.appendChild(GG.el('div',{style:{textAlign:'center', padding:'6px 2px', borderRadius:'8px',
      border:'1px solid '+(on?'var(--accent)':'var(--line)'), background:on?'var(--accent-soft)':'var(--surface)', transition:'.2s'}},
      GG.el('div',{style:{fontSize:'10.5px', color:'var(--ink-3)'}}, DIM_LABEL[d]),
      GG.el('div',{style:{fontSize:'13px', fontWeight:'680', marginTop:'2px', color:on?'var(--accent)':'var(--ink-3)'}}, on?TV(lead[d]):'…'))); });
  const sure=DIMS.filter(d=>decided[d]).map(d=>lead[d]);
  const unsure=DIMS.filter(d=>!decided[d]).map(d=>DIM_LABEL[d]);
  let line;
  if(!liked.length) line=GG.T('还没右滑——先挑几台心动的，我开始读你。',"No right swipes yet — pick a few you like and I'll start reading you.");
  else if(!sure.length) line=GG.T('信号还浅，再多滑几张我就摸清你的偏好。',"The signal's still faint — a few more swipes and I'll have your taste mapped.");
  else line=GG.T(`正在读你：偏 ${sure.slice(0,3).join(' · ')}`, `Reading you: leaning ${sure.slice(0,3).map(TV).join(' · ')}`)+(unsure.length?GG.T(`，${unsure.slice(0,2).join('、')}还没想好。`, `; still undecided on ${unsure.slice(0,2).join(', ').toLowerCase()}.`):GG.T('，画像挺清晰了。',' — the picture is pretty clear.'));
  return GG.el('div',null, cell, GG.el('div',{class:'small', style:{marginTop:'8px', textAlign:'center', color:'var(--ink-2)', minHeight:'18px'}}, line));
}

function swipeStage(){
  GG.clear(main);
  const liked=[], disliked=[], shown=[], remaining=DECK.slice();
  let current=null;
  const counter=GG.el('div',{class:'small muted center', style:{marginTop:'4px'}});
  const readWrap=GG.el('div',{style:{maxWidth:'420px', margin:'10px auto 0'}});
  const deckBox=GG.el('div',{style:{position:'relative', height:'400px', margin:'14px auto 0', maxWidth:'380px'}});
  const hintBox=GG.el('div',{class:'center small muted', style:{marginTop:'6px'}}, GG.T('拖动卡片，或用按钮 / 键盘 ← → ','Drag the card, or use the buttons / arrow keys ← → '));
  const doneWrap=GG.el('div',{class:'center', style:{marginTop:'14px', minHeight:'48px'}});
  const circ=c=>({width:'70px',height:'70px',borderRadius:'50%',fontSize:'25px',borderColor:c,color:c});
  const btnRow=GG.el('div',{class:'row', style:{justifyContent:'center', gap:'22px', marginTop:'14px'}},
    GG.el('button',{class:'btn lg', style:circ('#e8543f'), title:GG.T('不喜欢 (←)','Pass (←)'), onClick:()=>act(false)}, '✕'),
    GG.el('button',{class:'btn lg', style:circ('#2e9e7b'), title:GG.T('喜欢 (→)','Like (→)'),   onClick:()=>act(true)}, '❤'));

  main.appendChild(GG.el('div',{class:'hero', style:{paddingBottom:'0'}},
    GG.el('div',{class:'small', style:{color:'var(--accent)', fontWeight:'700'}}, GG.T('第 1 步 / 共 2 步 · 滑出眼缘','Step 1 of 2 · Swipe your gut picks')),
    GG.el('h1',{style:{fontSize:'22px', marginTop:'6px'}}, GG.T('左右滑，读你的"眼缘"','Swipe left or right — we read what catches your eye'))));
  main.appendChild(counter); main.appendChild(readWrap); main.appendChild(deckBox);
  main.appendChild(btnRow); main.appendChild(hintBox); main.appendChild(doneWrap);

  function deal(){
    if(!remaining.length) return null;
    if(shown.length<SEED) return remaining.shift();
    const lc={}; DIMS.forEach(d=>lc[d]={});
    liked.forEach(c=>DIMS.forEach(d=> lc[d][c[d]]=(lc[d][c[d]]||0)+1 ));
    const undecided={}; DIMS.forEach(d=>{ const e=Object.entries(lc[d]).sort((a,b)=>b[1]-a[1]);
      undecided[d]=!(e.length && e[0][1]>=2 && (e.length<2||e[0][1]>e[1][1])); });
    const shownVal={}; shown.forEach(c=>DIMS.forEach(d=> shownVal[c[d]]=(shownVal[c[d]]||0)+1 ));
    let best=null, bi=0;
    remaining.forEach((c,i)=>{ let info=0; for(const d of DIMS){ if(undecided[d]) info+=1/(1+(shownVal[c[d]]||0)); }
      if(!best||info>best.info){ best={car:c,info}; bi=i; } });
    remaining.splice(bi,1); return best.car;
  }
  function updateCounter(){
    const n=liked.length+disliked.length;
    counter.textContent=GG.T(`已滑 ${n}　·　❤ ${liked.length}　✕ ${disliked.length}`,`Swiped ${n}　·　❤ ${liked.length}　✕ ${disliked.length}`)+(n<MIN_SWIPE?GG.T(`　（再滑 ${MIN_SWIPE-n} 张进下一步）`,`　(swipe ${MIN_SWIPE-n} more to move on)`):'');
    GG.clear(readWrap); readWrap.appendChild(liveRead(liked));
    if(n>=MIN_SWIPE && !GG.$('#go', main)){
      doneWrap.appendChild(GG.el('button',{id:'go', class:'btn primary lg', onClick:finish}, GG.T('下一步 · 答 5 题 →','Next · answer 5 questions →'))); }
  }
  function renderTop(){
    GG.clear(deckBox);
    if(!current) current=deal();
    if(!current){ finish(); return; }
    const next=remaining[0];
    if(next) deckBox.appendChild(makeCard(next,1));
    const top=makeCard(current,0); deckBox.appendChild(top); attachDrag(top,current);
  }
  function makeCard(car, depth){
    const el=GG.el('div',{class:'card', style:{position:'absolute', inset:'0', padding:'16px', display:'flex', flexDirection:'column',
      transform:`scale(${1-depth*0.04}) translateY(${depth*12}px)`, zIndex:String(10-depth), transition:'transform .18s',
      boxShadow:'var(--sh-2)', cursor:depth===0?'grab':'default', background:`linear-gradient(160deg, ${hexA(car.color,.12)}, #fff 48%)`}},
      GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'flex-start'}},
        GG.el('h3',{style:{fontSize:'20px'}}, car.name),
        GG.el('span',{style:{flex:'none', background:'#fff', border:'1px solid var(--line)', color:'var(--ink-2)', borderRadius:'999px', padding:'3px 10px', fontSize:'12.5px', fontWeight:'600', whiteSpace:'nowrap'}}, rangeT(car.range))),
      GG.el('div',{style:{flex:'1', display:'flex', alignItems:'center', justifyContent:'center', padding:'4px 0'}, html:carSVG(car.color,car.body)}),
      GG.el('p',{style:{margin:'0', fontSize:'15px', color:'var(--ink)', fontWeight:'560'}}, '“'+car.scene+'”'),
      chips(car));
    const like=GG.el('div',{style:tag('#2e9e7b','left')}, GG.T('❤ 喜欢','❤ Like')); const nope=GG.el('div',{style:tag('#e8543f','right')}, GG.T('✕ 算了','✕ Pass'));
    el._like=like; el._nope=nope; el.appendChild(like); el.appendChild(nope); return el;
  }
  function tag(color, side){ return {position:'absolute', top:'16px', [side==='left'?'right':'left']:'16px', border:`3px solid ${color}`, color, fontWeight:'800', fontSize:'18px', padding:'4px 12px', borderRadius:'10px', transform:'rotate(-12deg)', opacity:'0', transition:'opacity .1s', pointerEvents:'none'}; }
  function attachDrag(el, car){
    let sx=0, dx=0, dragging=false;
    const down=e=>{ dragging=true; el.style.transition='none'; el.style.cursor='grabbing'; sx=(e.touches?e.touches[0].clientX:e.clientX);
      window.addEventListener('pointermove',move); window.addEventListener('pointerup',up); };
    const move=e=>{ if(!dragging)return; dx=e.clientX-sx; el.style.transform=`translate(${dx}px,0) rotate(${dx/18}deg)`;
      el._like.style.opacity=dx>30?Math.min(1,dx/120):0; el._nope.style.opacity=dx<-30?Math.min(1,-dx/120):0; };
    const up=()=>{ if(!dragging)return; dragging=false; el.style.cursor='grab';
      window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up);
      if(Math.abs(dx)>110){ fly(el, dx>0, ()=>register(car, dx>0)); }
      else { el.style.transition='transform .2s'; el.style.transform=''; el._like.style.opacity=0; el._nope.style.opacity=0; } };
    el.addEventListener('pointerdown', down);
  }
  function fly(el, right, cb){ el.style.transition='transform .32s ease, opacity .32s';
    el.style.transform=`translate(${right?520:-520}px,-40px) rotate(${right?30:-30}deg)`; el.style.opacity='0'; setTimeout(cb,200); }
  function register(car, liked_){ (liked_?liked:disliked).push(car); shown.push(car); current=null; updateCounter(); renderTop(); }
  function act(right){ if(!current) return; const top=GG.$$('.card', deckBox).find(c=>c.style.zIndex==='10');
    if(top){ top._like.style.opacity=right?1:0; top._nope.style.opacity=right?0:1; fly(top,right,()=>register(current,right)); } else register(current,right); }
  function keyh(e){ if(e.key==='ArrowRight') act(true); else if(e.key==='ArrowLeft') act(false); }
  window.addEventListener('keydown', keyh);
  function finish(){ window.removeEventListener('keydown', keyh); quizStage(liked, disliked); }
  updateCounter(); renderTop();
}

/* ── 第 2 步：问卷 ── */
function quizStage(liked, disliked){
  GG.clear(main);
  const answers={}; let qi=0;
  const progWrap=GG.el('div',{class:'prog', style:{margin:'6px 0 18px'}}, GG.el('i'));
  const stage=GG.el('div');
  main.appendChild(GG.el('div',{class:'hero', style:{paddingBottom:'4px'}},
    GG.el('div',{class:'small', style:{color:'var(--accent)', fontWeight:'700'}}, GG.T('第 2 步 / 共 2 步 · 锁定现实','Step 2 of 2 · Pin down reality')),
    GG.el('h1',{style:{fontSize:'22px', marginTop:'6px'}}, GG.T('答 5 题，把预算和用途定下来','Answer 5 questions to lock in budget and use case'))));
  main.appendChild(progWrap); main.appendChild(stage);

  function renderQ(){
    const q=QUIZ[qi]; GG.$('i', progWrap).style.width=(qi/QUIZ.length*100)+'%';
    GG.clear(stage);
    stage.appendChild(GG.el('div',{class:'small muted', style:{marginBottom:'4px'}}, GG.T(`第 ${qi+1} / ${QUIZ.length} 题`,`Question ${qi+1} of ${QUIZ.length}`)));
    stage.appendChild(GG.el('h2',{style:{fontSize:'21px', margin:'0 0 16px'}}, q.q));
    const opts=GG.el('div',{class:'stack'});
    q.options.forEach(o=>{ const chosen=answers[q.id]&&answers[q.id].key===o.key;
      opts.appendChild(GG.el('div',{class:'opt'+(chosen?' on':''), onClick:()=>choose(o)},
        GG.el('span',{class:'dot'}), GG.el('span',{style:{fontSize:'16px'}}, o.label))); });
    stage.appendChild(opts);
    if(qi>0) stage.appendChild(GG.el('div',{style:{marginTop:'18px'}},
      GG.el('button',{class:'btn', onClick:()=>{ qi--; renderQ(); }}, GG.T('← 上一题','← Previous'))));
  }
  function choose(o){ answers[QUIZ[qi].id]=o; renderQ();
    setTimeout(()=>{ if(qi<QUIZ.length-1){ qi++; renderQ(); } else finish(); }, 220); }
  function finish(){ GG.$('i', progWrap).style.width='100%';
    GG.encodeState({l:liked.map(c=>c.id), d:disliked.map(c=>c.id), q:Object.fromEntries(QUIZ.map(q=>[q.id, answers[q.id].key]))});
    showResult(liked, disliked, answers, false); }
  renderQ();
}

/* ── 结果：DNA + 荐车 + 车企眼里的你 ── */
async function showResult(liked, disliked, answers, fromLink){
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  const stage=GG.el('div'); main.appendChild(stage);
  const quiz=parseQuiz(answers);
  const useAI=GG.llm.connected();
  let brief;
  if(!fromLink){
    const think=GG.thinking(stage, [GG.T('读取你的 '+liked.length+' 次右滑…','Reading your '+liked.length+' right swipes…'),GG.T('对齐你答的预算 / 用途 / 时间线…','Aligning your budget / use case / timeline…'),
      useAI?GG.T('AI 合成你的购车品味 DNA…','AI is composing your car-taste DNA…'):GG.T('合成购车品味 DNA…','Composing your car-taste DNA…'),GG.T('算"向往 vs 现实"的差距…','Measuring the dream-vs-reality gap…')], useAI?2100:1700);
    const [b]=await Promise.all([getBrief(liked,disliked,quiz,useAI), think]); brief=b;
  } else { brief=await getBrief(liked,disliked,quiz,useAI); }
  const {picks, wildcard, tendencies, gaps, persona, questions}=brief;
  GG.clear(stage);

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}}, GG.el('h1',{style:{fontSize:'24px'}}, GG.T('🧬 你的购车品味 DNA','🧬 Your Car-Taste DNA'))));
  stage.appendChild(GG.el('div',{style:{margin:'0 0 12px'}}, GG.llm.badge(!!brief._ai)));

  // 人格 + 口味标签
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', background:`linear-gradient(160deg,var(--accent-soft),#fff 62%)`}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, GG.T('你是这样一类买车人','The kind of buyer you are')),
    GG.el('div',{style:{fontSize:'23px', fontWeight:'730', letterSpacing:'-.4px'}}, persona.name),
    GG.el('p',{style:{margin:'8px 0 0', fontSize:'15px', color:'var(--ink-2)', lineHeight:'1.7'}}, persona.read),
    GG.el('div',{class:'chips', style:{marginTop:'12px'}},
      GG.el('span',{class:'chip', style:{cursor:'default', background:'var(--accent)', color:'#fff', borderColor:'var(--accent)'}}, quiz.first?GG.T('首购','First-time buyer'):GG.T('增换购','Upgrading / adding')),
      GG.el('span',{class:'chip', style:{cursor:'default'}}, quiz.budgetCap?quiz.budgetLabel:GG.T('预算不限','No budget cap')),
      ...tendencies.slice(0,4).map(t=>GG.el('span',{class:'chip',style:{cursor:'default'}}, TV(t.val))))));

  // 向往 vs 现实
  gaps.forEach(g=> stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'14px', borderLeft:'4px solid var(--warn)'}},
    GG.el('div',{class:'row', style:{gap:'8px', marginBottom:'4px'}},
      GG.el('span',{style:{fontSize:'18px'}}, '⚖️'),
      GG.el('div',{style:{fontSize:'16px', fontWeight:'700'}}, GG.T('向往 vs 现实 · ','Dream vs reality · ')+g.title)),
    GG.el('p',{style:{margin:'2px 0 0', fontSize:'14.5px', color:'var(--ink-2)', lineHeight:'1.7'}}, g.body))));

  // 先试驾这台
  const t1=picks[0];
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', border:'2px solid var(--accent)'}},
    GG.el('div',{class:'row', style:{gap:'8px', marginBottom:'8px'}},
      GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', fontWeight:'700', padding:'4px 11px', borderRadius:'999px', fontSize:'13px'}}, GG.T('👉 先去试驾这台','👉 Test-drive this one first')),
      GG.el('span',{class:'pill'}, GG.T('契合 ','Match ')+t1.match+'%')),
    GG.el('div',{class:'row', style:{gap:'16px', alignItems:'center', flexWrap:'wrap'}},
      GG.el('div',{style:{width:'150px', flex:'none'}, html:carSVG(t1.car.color, t1.car.body)}),
      GG.el('div',{style:{flex:'1', minWidth:'200px'}},
        GG.el('h3',{style:{fontSize:'21px', display:'inline'}}, t1.car.name), GG.el('span',{class:'small muted'}, ' '+rangeT(t1.car.range)),
        GG.el('p',{class:'small', style:{margin:'8px 0 0', color:'var(--ink-2)'}}, t1.reason),
        GG.el('p',{class:'small', style:{margin:'6px 0 0', color:'var(--warn)'}}, GG.T('⚠ 买它之前注意：','⚠ Before you buy: ')+t1.caveat)))));

  // 其余 + 黑马
  stage.appendChild(GG.el('div',{class:'section-t'}, GG.T('其余候选 & 一台黑马','The other picks & one dark horse')));
  const list=GG.el('div',{class:'stack'});
  picks.slice(1).forEach((r,i)=> list.appendChild(pickRow(GG.T('推荐 ','Pick ')+(i+2), r.car, r.match, r.reason, r.caveat, 'var(--accent-soft)','var(--accent)')));
  if(wildcard && wildcard.car) list.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'16px', alignItems:'center', flexWrap:'wrap', borderStyle:'dashed'}},
    GG.el('div',{style:{width:'120px', flex:'none'}, html:carSVG(wildcard.car.color, wildcard.car.body)}),
    GG.el('div',{style:{flex:'1', minWidth:'200px'}},
      GG.el('div',{class:'row', style:{gap:'8px'}},
        GG.el('span',{class:'pill', style:{background:'#1d1d1f', color:'#fff', fontWeight:'700', padding:'4px 11px', borderRadius:'999px', fontSize:'13px'}}, GG.T('🐎 黑马','🐎 Dark horse')),
        GG.el('h3',{style:{fontSize:'18px'}}, wildcard.car.name), GG.el('span',{class:'small muted'}, rangeT(wildcard.car.range))),
      GG.el('p',{class:'small', style:{margin:'8px 0 0', color:'var(--ink-2)'}}, wildcard.reason),
      GG.el('p',{class:'small', style:{margin:'6px 0 0', color:'var(--warn)'}}, '⚠ '+wildcard.car.caveat), chips(wildcard.car))));
  stage.appendChild(list);

  // 替你问销售
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, GG.T('🗣 替你问销售的 3 个问题','🗣 3 questions to grill the dealer with')),
    GG.el('div',{class:'stack', style:{gap:'10px'}}, ...questions.map((q,i)=>GG.el('div',{class:'row', style:{gap:'10px', alignItems:'flex-start'}},
      GG.el('span',{style:{flex:'none', width:'22px', height:'22px', borderRadius:'50%', background:'var(--accent-soft)', color:'var(--accent)', fontSize:'12px', fontWeight:'700', display:'grid', placeItems:'center'}}, String(i+1)),
      GG.el('span',{style:{fontSize:'14.5px', color:'var(--ink-2)'}}, q))))));

  // 车企眼里的你
  stage.appendChild(b2bPanel(liked, quiz));

  // 分享 + 重来
  const shareSpec={ slug:SLUG, title:GG.T('我的购车品味 DNA · ','My Car-Taste DNA · ')+persona.name,
    subtitle:(quiz.first?GG.T('首购 · ','First car · '):'')+(quiz.budgetCap?quiz.budgetLabel+' · ':'')+GG.T('先试驾：','Test-drive first: ')+t1.car.name,
    tags:tendencies.slice(0,4).map(t=>TV(t.val)), note:t1.car.name+GG.T(' —— ',' — ')+t1.reason,
    rows:picks.map((r,i)=>({label:(i===0?'⭐ ':'')+GG.T('推荐 ','Pick ')+(i+1), value:GG.T(`${r.car.name}（契合 ${r.match}%）`,`${r.car.name} (match ${r.match}%)`)})).concat(wildcard&&wildcard.car?[{label:GG.T('🐎 黑马','🐎 Dark horse'), value:wildcard.car.name}]:[]) };
  stage.appendChild(GG.resultCard(SLUG, GG.el('div',{class:'center muted small'}, GG.T('存图带去店里，或分享你的购车 DNA ↓','Save the card for the dealership, or share your car DNA ↓')), shareSpec));
  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, GG.T('↻ 重新来一遍','↻ Start over'))));
}

function pickRow(tag, car, match, reason, caveat, bg, fg){
  return GG.el('div',{class:'card pad', style:{display:'flex', gap:'16px', alignItems:'center', flexWrap:'wrap'}},
    GG.el('div',{style:{width:'120px', flex:'none'}, html:carSVG(car.color, car.body)}),
    GG.el('div',{style:{flex:'1', minWidth:'200px'}},
      GG.el('div',{class:'row', style:{justifyContent:'space-between'}},
        GG.el('div',{class:'row', style:{gap:'8px'}},
          GG.el('span',{class:'pill', style:{background:bg, color:fg, fontWeight:'700', padding:'4px 11px', borderRadius:'999px', fontSize:'13px'}}, tag),
          GG.el('h3',{style:{fontSize:'18px'}}, car.name), GG.el('span',{class:'small muted'}, rangeT(car.range))),
        GG.el('span',{class:'pill'}, GG.T('契合 ','Match ')+match+'%')),
      GG.el('p',{class:'small', style:{margin:'8px 0 0', color:'var(--ink-2)'}}, reason),
      caveat?GG.el('p',{class:'small', style:{margin:'6px 0 0', color:'var(--warn)'}}, '⚠ '+caveat):null, chips(car)));
}

/* ── 车企/平台眼里的你（匿名）+ 知情同意开关 ── */
function b2bPanel(liked, quiz){
  const co=cohortOf(liked, quiz);
  let agg=false, match=false;                       // 默认全关 = 完全私有
  const readout=GG.el('div',{style:{marginTop:'12px', padding:'12px 14px', borderRadius:'10px', background:'var(--bg)', border:'1px solid var(--line)', fontSize:'14px', color:'var(--ink-2)', lineHeight:'1.6'}});
  function paint(){
    let txt;
    if(!agg && !match) txt=GG.T('❌ 什么都看不到（完全私有，数据只在你这台设备）','❌ Nothing at all (fully private — your data never leaves this device)');
    else if(agg && !match) txt=GG.T('📊 仅你的匿名画像（计入人群趋势，不含身份、无法联系到你）','📊 Only your anonymous profile (counted into cohort trends — no identity, no way to contact you)');
    else if(!agg && match) txt=GG.T('📞 仅在你逐次确认后，可被引荐给对口销售（不进趋势库）','📞 Only after you confirm each time can you be introduced to a matching dealer (kept out of the trends pool)');
    else txt=GG.T('📊 匿名画像计入趋势 ＋ 📞 你确认后可被引荐给销售','📊 Anonymous profile counts toward trends + 📞 dealer intros only after you confirm');
    GG.clear(readout);
    readout.appendChild(GG.el('div',{style:{fontWeight:'700', color:'var(--ink)', marginBottom:'2px'}}, GG.T('车企 / 平台现在能看到：','What automakers / the platform can see right now:')));
    readout.appendChild(GG.el('div', null, txt));
  }
  function toggle(label, sub, getter, setter){
    const on=getter();
    const sw=GG.el('div',{style:{width:'42px', height:'24px', borderRadius:'999px', flex:'none', cursor:'pointer', transition:'.2s',
      background:on?'var(--accent)':'#cfcfd6', position:'relative'}});
    sw.appendChild(GG.el('div',{style:{position:'absolute', top:'2px', left:on?'20px':'2px', width:'20px', height:'20px', borderRadius:'50%', background:'#fff', transition:'.2s', boxShadow:'0 1px 3px rgba(0,0,0,.25)'}}));
    const row=GG.el('div',{class:'row', style:{justifyContent:'space-between', gap:'12px', alignItems:'flex-start', padding:'10px 0', borderTop:'1px solid var(--line-2)'}},
      GG.el('div', null, GG.el('div',{style:{fontSize:'14.5px', fontWeight:'600'}}, label), GG.el('div',{class:'small muted', style:{marginTop:'2px'}}, sub)),
      sw);
    sw.addEventListener('click', ()=>{ setter(!getter()); rebuild(); });
    return row;
  }
  let togglesBox=GG.el('div');
  function rebuild(){ GG.clear(togglesBox);
    togglesBox.appendChild(toggle(GG.T('计入匿名趋势洞察','Count me in anonymous trend insights'), GG.T('车企只看到聚合人群趋势（如"一线首购正从硬派转极简"），不含你的身份。','Automakers see only aggregate cohort trends (e.g. "tier-1 first-time buyers are shifting from rugged to minimalist") — never your identity.'), ()=>agg, v=>agg=v));
    togglesBox.appendChild(toggle(GG.T('我同意时可被引荐给销售','Introduce me to a dealer when I say yes'), GG.T('只有你点头，才把这台的对口销售引荐给你；随时可关。','Only when you give the nod do we introduce the right dealer for that car — switch it off anytime.'), ()=>match, v=>match=v));
    paint();
  }
  rebuild();

  return GG.el('div',{class:'card pad', style:{marginTop:'18px', background:'#0f1115', color:'#e7e7ea', borderColor:'#0f1115'}},
    GG.el('div',{style:{fontSize:'13px', fontWeight:'680', letterSpacing:'.04em', color:'#9aa', textTransform:'uppercase', marginBottom:'10px'}}, GG.T('🏢 车企 / 平台眼里的你（匿名）','🏢 How automakers / platforms see you (anonymous)')),
    GG.el('p',{style:{margin:'0 0 12px', fontSize:'14px', color:'#b9bcc6', lineHeight:'1.7'}}, GG.T('你刚生成的画像，在 B2B 端长这样。下面每一项默认私有——你可以逐项打开，看会发生什么。',"Here's what the profile you just generated looks like on the B2B side. Every item below is private by default — flip each one on to see what changes.")),
    GG.el('div',{class:'chips'}, co.chips.map(t=>GG.el('span',{style:{border:'1px solid #2c2f38', background:'#171a21', color:'#cfd2da', padding:'7px 13px', borderRadius:'999px', fontSize:'13px'}}, t))),
    GG.el('div',{style:{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px', marginTop:'14px'}},
      GG.el('div',{style:{background:'#171a21', borderRadius:'10px', padding:'12px 14px'}},
        GG.el('div',{style:{fontSize:'11.5px', color:'#9aa'}}, GG.T('对车企的价值','Value to automakers')),
        GG.el('div',{style:{fontSize:'19px', fontWeight:'730', marginTop:'3px', color: co.tier==='很低'?'#9aa':'#6fe0a8'}}, TV(co.tier)),
        GG.el('div',{style:{fontSize:'12px', color:'#b9bcc6', marginTop:'2px'}}, GG.T('暖线索 ','Warm lead ') + co.lead + GG.T('（示意）',' (illustrative)'))),
      GG.el('div',{style:{background:'#171a21', borderRadius:'10px', padding:'12px 14px'}},
        GG.el('div',{style:{fontSize:'11.5px', color:'#9aa'}}, GG.T('为什么值这个价',"Why it's worth that")),
        GG.el('div',{style:{fontSize:'12.5px', color:'#cfd2da', marginTop:'3px', lineHeight:'1.55'}}, co.why))),
    (function(){ const wrap=GG.el('div',{style:{marginTop:'6px'}}); wrap.appendChild(togglesBox); wrap.appendChild(readout); return wrap; })(),
    GG.el('p',{style:{margin:'12px 0 0', fontSize:'12px', color:'#8a8d96', lineHeight:'1.6'}},
      GG.T('这就是合规的玩法：默认私有、按项授权、随时可关。匿名聚合可卖洞察、知情同意可做撮合——绝不卖你的原始个人数据。金额为示意，仅演示数据如何变现。','This is the compliant playbook: private by default, per-item consent, revocable anytime. Anonymous aggregates can sell insights; informed consent can power matchmaking — your raw personal data is never sold. Figures are illustrative, purely to show how the data could be monetized.')));
}

start();
})();
