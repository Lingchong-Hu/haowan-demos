/* whips — 汽车版 Tinder（三幕版）
   ① 滑：丰富卡片 + 实时读你 + 自适应发牌（专攻你还没想好的那根轴）
   ② 判断：抓出你滑动里的内在矛盾，用一句话逼你二选一（这一步才是判断高光）
   ③ 简报：人格命名 → 先试驾哪台 → 每台诚实短板 → 你没滑过的黑马 → 替你问销售的 3 个问题
   连了 key 走真实模型，没连退回本地启发式——两条通路输出同样的结构。 */
(function(){
const SLUG='whips';
const {DECK, CATALOG} = window.WHIPS;
const DIMS = ['body','size','vibe','power','price'];
const DIM_LABEL = {body:'车型', size:'尺寸', vibe:'气质', power:'动力', price:'定位'};
const MIN_SWIPE = 8;
const SEED = 6;              // 前 6 张固定多样化种子，之后自适应
let main;

/* ───────── 矛盾定义：右滑里同时踩到 A、B 两极 → 触发追问 ───────── */
const TENSIONS = [
  { id:'use', kicker:'玩乐 vs 家用',
    q:'这台车，主要是开给谁的？',
    A:{label:'周末的我', sub:'要的是开着爽、有调性', match:c=>['运动','复古'].includes(c.vibe)||c.body==='跑车', boost:['运动','复古','跑车'], word:'玩心' },
    B:{label:'一家人',   sub:'要的是坐得下、顾得周全', match:c=>c.vibe==='居家'||c.body==='MPV',               boost:['居家','MPV'], word:'家用' } },
  { id:'size', kicker:'灵活 vs 空间',
    q:'尺寸上，你更想要哪种安心？',
    A:{label:'小巧好停', sub:'市区灵活、停车不焦虑', match:c=>['小型','紧凑'].includes(c.size), boost:['小型','紧凑'], word:'灵活' },
    B:{label:'空间够大', sub:'装得下一切、坐得宽敞', match:c=>c.size==='大型'||c.body==='MPV', boost:['大型','MPV'], word:'大空间' } },
  { id:'power', kicker:'纯电 vs 燃油',
    q:'补能这件事，你更怕哪种麻烦？',
    A:{label:'要纯电', sub:'安静、零油费，能接受规划充电', match:c=>c.power==='纯电', boost:['纯电'], word:'纯电' },
    B:{label:'要省心', sub:'随加随走，不为充电操心',     match:c=>['燃油','混动'].includes(c.power), boost:['燃油','混动'], word:'随加随走' } },
  { id:'price', kicker:'性价比 vs 质感',
    q:'钱，你更甘心花在哪？',
    A:{label:'性价比', sub:'每一分都要花在刀刃上', match:c=>['经济','主流'].includes(c.price), boost:['经济','主流'], word:'性价比' },
    B:{label:'质感与面子', sub:'值得为品质多花一点', match:c=>['高端','豪华'].includes(c.price), boost:['高端','豪华'], word:'质感' } },
];

/* ───────── 车身侧影 SVG（颜色随车；type 微调车顶高度） ───────── */
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
    [car.body, car.size, car.vibe, car.power, car.price, car.range].filter(Boolean)
      .map(t=>GG.el('span',{class:'chip',style:{cursor:'default'}}, t)));
}
function hexA(hex,a){ const {r,g,b}=GG._rgb(hex); return `rgba(${r},${g},${b},${a})`; }

/* ───────── 引擎 ───────── */
// 右滑 +1 / 左滑 -0.6；矛盾取舍后给所选一极加权、对立一极减权
function weightsFrom(liked, disliked, resolution){
  const w = {};
  const add=(car,val)=>{ for(const d of DIMS){ const k=car[d]; w[k]=(w[k]||0)+val; } };
  liked.forEach(c=>add(c,1));
  disliked.forEach(c=>add(c,-0.6));
  if(resolution && resolution.side){
    const t = TENSIONS.find(x=>x.id===resolution.tensionId);
    if(t){
      const pole = t[resolution.side], other = t[resolution.side==='A'?'B':'A'];
      for(const v of pole.boost)  w[v] = (w[v]||0) + 1.6;   // 选中一极：加权
      for(const v of other.boost) w[v] = (w[v]||0) - 1.6;   // 对立一极：减权
    }
  }
  return w;
}
// 你反复右滑的属性值（去重排序）——既是"口味 DNA"也是 match 的命中基准
function tendenciesFrom(liked){
  const cnt = {};
  liked.forEach(c=>{ for(const d of DIMS){ cnt[c[d]]=(cnt[c[d]]||0)+1; } });
  return Object.entries(cnt).filter(([k,v])=>v>=2 || (v>=1 && liked.length<=3))
    .sort((a,b)=>b[1]-a[1]).slice(0,4)
    .map(([k,v])=>({ val:k, n:v, dim:DIMS.find(d=> [...DECK,...CATALOG].some(c=>c[d]===k)) }));
}
// 某车命中了用户哪几条核心信号 → match%（命中比例，可辩护）+ 命中数
function matchOf(car, core){
  const hits = core.filter(v=> DIMS.some(d=>car[d]===v)).length;
  const pct = core.length ? Math.round(GG.clamp(50 + hits/core.length*48, 50, 98)) : 70;
  return {pct, hits, total:core.length};
}

function detectTension(liked){
  let best=null;
  for(const t of TENSIONS){
    const a = liked.filter(t.A.match).length, b = liked.filter(t.B.match).length;
    const m = Math.min(a,b);
    if(m>=1){ const score = m*2 - Math.abs(a-b)*0.3;
      if(!best || score>best.score) best={tension:t, a, b, score}; }
  }
  return best;   // {tension,a,b,score} 或 null
}

// 本地打分 → 排序后的候选
function scoreCatalog(liked, disliked, resolution){
  const w = weightsFrom(liked, disliked, resolution);
  const out = CATALOG.map(car=>{ let s=0; for(const d of DIMS) s += (w[car[d]]||0); return {car, s}; })
    .sort((a,b)=> b.s - a.s);
  return out;
}

// 黑马：没在前 3、却与 Top1 明显不同方向、又能接住你"真正在乎"的那台
function pickWildcard(scored, top3ids, top1){
  const diff = c => ['body','size','power'].filter(d=>c[d]!==top1[d]).length;
  const cand = scored.find(x=> !top3ids.has(x.car.id) && x.s>0 && diff(x.car)>=2);
  return (cand || scored.find(x=>!top3ids.has(x.car.id)) || {}).car;
}

// 替你问销售的问题：从推荐车的属性反推疑点
const Q_BANK = {
  '纯电':'实际续航能打几折？快充到 80% 要多久？冬天衰减大不大？',
  '混动':'亏电状态下油耗多少？动力电池质保几年 / 多少公里？',
  '燃油':'保养周期和单次费用大概多少？这具发动机烧机油吗？',
  '豪华':'三年保值率大概多少？常见的大额维修项贵不贵？',
  '高端':'三年保值率怎么样？整车质保和三电（如有）质保各多久？',
  'MPV':'二排座椅怎么放倒？三排坐成年人长途挤不挤？',
  '皮卡':'我所在城市对皮卡有没有限行 / 限高 / 报废年限规定？',
  '跑车':'后排和后备箱日常够用吗？市区路面颠不颠？',
  '大型':'我的车位 / 小区限高，它进得去、停得下吗？',
  'SUV':'后排放倒后是不是纯平？后备箱实际能装多少？',
};
function questionsFor(picks){
  const seen=new Set(), out=[];
  for(const p of picks){ for(const d of DIMS){ const q=Q_BANK[p.car[d]];
    if(q && !seen.has(q)){ seen.add(q); out.push(q); } if(out.length>=3) break; } if(out.length>=3) break; }
  const fb=['这台车真实的落地价（含购置税、保险、上牌）是多少？',
            '现在有哪些可争取的现金 / 置换 / 金融优惠？',
            '是现车还是要等？交付周期多久？'];
  for(const q of fb){ if(out.length>=3) break; if(!seen.has(q)){ seen.add(q); out.push(q); } }
  return out.slice(0,3);
}

// 人格命名（本地启发式）：有主导气质就按气质，气质打平就按"取舍"来命名
const VIBE_PERSONA = {
  '运动':{name:'热血操控派', read:'你的右滑几乎都带着"开起来要爽"的执念——动力、姿态、贴地感，是你给一台车的及格线。'},
  '复古':{name:'情怀玩家',   read:'你买的不只是代步工具，是一段调性。线条、年代感、那一点不实用的浪漫，才让你心动。'},
  '居家':{name:'务实居家派', read:'你看车先看"全家用着顺不顺"——空间、省心、好养，比零百加速重要得多。'},
  '优雅':{name:'品质优雅派', read:'你要的是低调的体面：安静、平顺、有气质，不张扬但经得起细看。'},
  '极简':{name:'科技极简派', read:'你被安静的座舱、干净的大屏和零油费吸引——一台车应该聪明、克制、没有多余按钮。'},
  '硬派':{name:'荒野硬核派', read:'柏油路框不住你，你右滑的全是能上山下河、能装能扛的家伙。'},
};
const RES_PERSONA = {
  use:{ A:{name:'纯粹玩家',   read:'比起实用，你更在乎一台车带来的情绪——开着爽、看着喜欢，比什么都重要。'},
        B:{name:'务实居家派', read:'你把"全家用得顺"放在第一位，再心动的玩具也得先给日子让位。'} },
  size:{ A:{name:'灵巧都市派', read:'你要一台在城里游刃有余的车——好停、好开、不为尺寸焦虑。'},
         B:{name:'空间至上派', read:'你的底线是"装得下、坐得宽"，宁可大一点，也不愿出行时捉襟见肘。'} },
  power:{ A:{name:'科技尝鲜派', read:'安静、零油费、聪明的座舱——你愿意为电动化体验接受一点补能的规划。'},
          B:{name:'省心务实派', read:'你不想为充电操心，随加随走的确定性，比那点油费更值钱。'} },
  price:{ A:{name:'精打细算派', read:'你对预算有清醒的边界，每一分都要花得明明白白。'},
          B:{name:'品质至上派', read:'你愿意为质感和体验多花一点——一步到位，比将就更划算。'} },
};
function personaLocal(liked, resolution){
  const vibeCnt={}; liked.forEach(c=> vibeCnt[c.vibe]=(vibeCnt[c.vibe]||0)+1);
  const sorted = Object.entries(vibeCnt).sort((a,b)=>b[1]-a[1]);
  const domVibe = (sorted[0]||[''])[0];
  const maxVibe = sorted.length? sorted[0][1] : 0;
  const clearVibe = maxVibe>=2 && (sorted.length<2 || sorted[0][1]>sorted[1][1]);
  const res = resolution && resolution.side
    ? TENSIONS.find(t=>t.id===resolution.tensionId)[resolution.side] : null;
  // 最有戏：右滑里玩心很重，掏钱却选了"家用"
  const playfulN = liked.filter(c=>['运动','复古'].includes(c.vibe)||c.body==='跑车').length;
  if(playfulN>=2 && resolution && resolution.tensionId==='use' && resolution.side==='B'){
    return {name:'藏起玩心的实用派',
      read:'你右滑里全是运动、复古的影子，可真要掏钱，你选了"顾全家"。骨子里你把那点玩心收好了，先让这台车把日子过稳。'};
  }
  if(clearVibe){
    const base = Object.assign({}, VIBE_PERSONA[domVibe] || {name:'均衡理性派', read:'你的口味很均衡，没有偏执的取向，更看重整体的合适。'});
    if(res) base.read += ` 而在"${res.label}"和它的对立面之间，你选了前者——这成了我给你挑车的指针。`;
    return base;
  }
  // 气质没拉开差距 → 用刚才的取舍来定调，更准
  if(res) return Object.assign({}, RES_PERSONA[resolution.tensionId][resolution.side]);
  return {name:'均衡理性派', read:'你的口味挺均衡，没有偏执的取向——更看重整体的合适，而不是某一项的极致。'};
}

/* ───────── AI 通路（结构与本地一致：persona / picks+caveat / wildcard / questions） ───────── */
const WHIPS_SYS = '你是懂车又敢说真话的购车顾问。用户在一堆车里左右滑（右滑=喜欢、左滑=不喜欢），我还检测到 ta 滑动里的一个内在矛盾并让 ta 当场做了取舍。请据此从【候选车库】精配，并把闭环说透。只输出严格 JSON：'+
  '{"persona":{"name":"4到6字人格名","read":"读懂 ta 的一段话，必须点名那个矛盾和 ta 的取舍，60字内"},'+
  '"picks":[{"id":"候选库id","match":契合度数字60到98,"reason":"为什么推荐，引用 ta 的取舍，35字内","caveat":"这台最该提醒 ta 的一个真实短板，20字内"}],'+
  '"wildcard":{"id":"一台 ta 没右滑、但你认为按 ta 真正在乎的更对路的车","reason":"为什么它反而更合适，35字内"},'+
  '"questions":["替 ta 去店里该追问销售的3个问题，针对推荐车的短板或疑点"]}。'+
  'picks 必须正好 3 台、id 来自候选库且不重复；wildcard 的 id 也来自候选库、且尽量不同方向；全部简体中文。';

function localRecs(liked, disliked, resolution){
  const scored = scoreCatalog(liked, disliked, resolution);
  const tendencies = tendenciesFrom(liked);
  const core = tendencies.map(t=>t.val);
  const top3raw = scored.slice(0,3).map(x=>x.car);
  const top3ids = new Set(top3raw.map(c=>c.id));
  const wc = pickWildcard(scored, top3ids, top3raw[0]);
  const picks = top3raw.map(car=>{
    const m = matchOf(car, core);
    return {car, match:m.pct, hits:m.hits, total:m.total, reason:reasonLocal(car, tendencies, resolution), caveat:car.caveat};
  });
  const res = resolution && resolution.side ? TENSIONS.find(t=>t.id===resolution.tensionId)[resolution.side] : null;
  const wildcard = wc ? { car:wc, reason: wildReasonLocal(wc, liked, res, tendencies) } : null;
  return { picks, wildcard, tendencies, persona:personaLocal(liked, resolution),
           questions:questionsFor(picks), _ai:false };
}
function reasonLocal(car, tendencies, resolution){
  const hits = tendencies.filter(t=> DIMS.some(d=>car[d]===t.val)).slice(0,3);
  const res = resolution && resolution.side ? TENSIONS.find(t=>t.id===resolution.tensionId)[resolution.side] : null;
  let head = res ? `合你选的"${res.label}"，` : '';
  if(hits.length) return `${head}又正中你反复右滑的 ${hits.map(t=>t.val).join('、')}。`;
  return `${head}是你没拒绝的方向里综合最高的一台。`;
}
function wildReasonLocal(car, liked, res, tendencies){
  const hits = (tendencies||[]).filter(t=> DIMS.some(d=>car[d]===t.val)).map(t=>t.val).slice(0,3);
  const hitStr = hits.length ? hits.join('、') : '你的整体口味';
  if(res){
    const fitsRes = res.boost.some(v=> DIMS.some(d=>car[d]===v));
    if(fitsRes) return `你没右滑过它：它既接住了你要的"${res.word}"，又正中你常滑的 ${hitStr}——很容易被你划过去的一台。`;
    return `你没右滑过它：它在 ${hitStr} 上其实最贴你，只是在"${res.word}"上走了另一条路。如果这点没那么非要不可，它反而最划算——值得你确认下。`;
  }
  return `你没右滑过它，但它在 ${hitStr} 上和你的口味最合拍，是值得多看一眼的那张牌。`;
}

async function getRecs(liked, disliked, resolution, useAI){
  if(useAI && liked.length){
    try{
      const fmt = c=>`${c.body}/${c.size}/${c.vibe}/${c.power}/${c.price}/${c.range}`;
      const cat = CATALOG.map(c=>`${c.id}|${c.name}：${fmt(c)} · 短板：${c.caveat}`).join('\n');
      const likeStr = liked.map(c=>`${c.name}(${fmt(c)})`).join('、') || '无';
      const dislikeStr = disliked.map(c=>c.name).join('、') || '无';
      let resStr = '（未检测到明显矛盾）';
      if(resolution && resolution.side){ const t=TENSIONS.find(x=>x.id===resolution.tensionId), p=t[resolution.side];
        resStr = `在「${t.kicker}」之间，ta 选了「${p.label}——${p.sub}」`; }
      const obj = await GG.llm.json(WHIPS_SYS,
        `右滑(喜欢)：${likeStr}\n左滑(不喜欢)：${dislikeStr}\n矛盾取舍：${resStr}\n\n候选车库：\n${cat}`,
        {max_tokens:1100});
      const local = localRecs(liked, disliked, resolution);
      const core = local.tendencies.map(t=>t.val);
      const seen = new Set();
      const picks = (Array.isArray(obj.picks)?obj.picks:[]).map(p=>{
        const car = CATALOG.find(c=> c.id===p.id);
        if(!car || seen.has(car.id)) return null; seen.add(car.id);
        const m = matchOf(car, core);
        return {car, match:Math.round(GG.clamp(parseInt(p.match,10)|| m.pct, 58, 98)),
                hits:m.hits, total:m.total,
                reason:String(p.reason||'').trim()||reasonLocal(car, local.tendencies, resolution),
                caveat:String(p.caveat||'').trim()||car.caveat};
      }).filter(Boolean);
      // 不足 3 台用本地补齐
      for(const lp of local.picks){ if(picks.length>=3) break;
        if(!seen.has(lp.car.id)){ seen.add(lp.car.id); picks.push(lp); } }
      // wildcard
      let wildcard = local.wildcard;
      const wcCar = obj.wildcard && CATALOG.find(c=>c.id===obj.wildcard.id);
      if(wcCar && !seen.has(wcCar.id)){
        const res = resolution&&resolution.side ? TENSIONS.find(t=>t.id===resolution.tensionId)[resolution.side]:null;
        wildcard = {car:wcCar, reason:String(obj.wildcard.reason||'').trim()||wildReasonLocal(wcCar, liked, res, local.tendencies)};
      }
      const questions = (Array.isArray(obj.questions)?obj.questions:[]).map(q=>String(q||'').trim()).filter(Boolean).slice(0,3);
      const persona = (obj.persona && obj.persona.name)
        ? {name:String(obj.persona.name).trim(), read:String(obj.persona.read||'').trim()}
        : local.persona;
      if(picks.length){
        return { picks:picks.slice(0,3), wildcard, tendencies:local.tendencies, persona,
                 questions: questions.length?questions:local.questions, _ai:true };
      }
    }catch(e){ GG.toast(GG.llm.errMsg(e)); }
  }
  return localRecs(liked, disliked, resolution);
}

/* ───────── 流程 ───────── */
function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.l){
    const byId = id=> DECK.find(c=>c.id===id);
    const liked=(st.l||[]).map(byId).filter(Boolean), disliked=(st.d||[]).map(byId).filter(Boolean);
    showResult(liked, disliked, st.r||null, true);
    return;
  }
  intro();
}

function intro(){
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '左右滑，找到你的本命车'),
    GG.el('p', null, `向右滑 ❤ 喜欢，向左滑 ✕ 不喜欢。滑满 ${MIN_SWIPE} 张，我边滑边读你，揪出口味里的矛盾，最后给一份能带去店里的购车简报。`)
  ));
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'22px'}},
    GG.el('button',{class:'btn primary lg', onClick:swipeStage}, '开始滑车 →')
  ));
  main.appendChild(GG.llm.bar());
}

/* ── 实时读你：5 维 mini 读出 + 一句自然语言 ── */
function liveRead(liked){
  const cnt={}; DIMS.forEach(d=>cnt[d]={});
  liked.forEach(c=>DIMS.forEach(d=> cnt[d][c[d]]=(cnt[d][c[d]]||0)+1 ));
  const lead={}, decided={};
  DIMS.forEach(d=>{
    const e=Object.entries(cnt[d]).sort((a,b)=>b[1]-a[1]);
    lead[d]= e.length? e[0][0] : null;
    decided[d]= e.length && e[0][1]>=2 && (e.length<2 || e[0][1]>e[1][1]);
  });
  const cellWrap = GG.el('div',{style:{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:'6px'}});
  DIMS.forEach(d=>{
    const on = decided[d];
    cellWrap.appendChild(GG.el('div',{style:{textAlign:'center', padding:'6px 2px', borderRadius:'8px',
        border:'1px solid '+(on?'var(--accent)':'var(--line)'),
        background:on?'var(--accent-soft)':'var(--surface)', transition:'.2s'}},
      GG.el('div',{style:{fontSize:'10.5px', color:'var(--ink-3)', letterSpacing:'.02em'}}, DIM_LABEL[d]),
      GG.el('div',{style:{fontSize:'13px', fontWeight:'680', marginTop:'2px',
        color:on?'var(--accent)':'var(--ink-3)'}}, on? lead[d] : '…')));
  });
  // 自然语言
  const sure = DIMS.filter(d=>decided[d]).map(d=>lead[d]);
  const unsure = DIMS.filter(d=>!decided[d]).map(d=>DIM_LABEL[d]);
  let line;
  if(!liked.length) line = '还没右滑——先挑几台你心动的，我开始读你。';
  else if(!sure.length) line = '信号还浅，再多滑几张我就摸清你的偏好。';
  else line = `正在读你：偏 ${sure.slice(0,3).join(' · ')}` + (unsure.length? `，${unsure.slice(0,2).join('、')}还没想好。` : '，画像已经挺清晰了。');
  return GG.el('div',null, cellWrap,
    GG.el('div',{class:'small', style:{marginTop:'8px', textAlign:'center', color:'var(--ink-2)', minHeight:'18px'}}, line));
}

function swipeStage(){
  GG.clear(main);
  const liked=[], disliked=[];
  const shown=[];                         // 已展示的 car（顺序）
  const remaining = DECK.slice();         // 待发牌池
  let current=null;

  const counter = GG.el('div',{class:'small muted center', style:{marginTop:'4px'}});
  const readWrap = GG.el('div',{style:{maxWidth:'420px', margin:'10px auto 0'}});
  const deckBox = GG.el('div',{style:{position:'relative', height:'430px', margin:'14px auto 0', maxWidth:'380px'}});
  const hintBox = GG.el('div',{class:'center small muted', style:{marginTop:'6px'}}, '拖动卡片，或用下方按钮 / 键盘 ← → ');
  const doneBtnWrap = GG.el('div',{class:'center', style:{marginTop:'14px', minHeight:'48px'}});
  const btnRow = GG.el('div',{class:'row', style:{justifyContent:'center', gap:'22px', marginTop:'14px'}},
    GG.el('button',{class:'btn lg', style:circBtn('#e8543f'), title:'不喜欢 (←)', onClick:()=>act(false)}, '✕'),
    GG.el('button',{class:'btn lg', style:circBtn('#2e9e7b'), title:'喜欢 (→)',   onClick:()=>act(true)}, '❤'));

  main.appendChild(GG.el('div',{class:'hero', style:{paddingBottom:'0'}}, GG.el('h1',{style:{fontSize:'22px'}}, '滑出你的口味')));
  main.appendChild(counter);
  main.appendChild(readWrap);
  main.appendChild(deckBox);
  main.appendChild(btnRow);
  main.appendChild(hintBox);
  main.appendChild(doneBtnWrap);

  function circBtn(c){ return {width:'72px',height:'72px',borderRadius:'50%',fontSize:'26px',borderColor:c,color:c}; }

  // 自适应取下一张：种子阶段按顺序；之后挑"最能补足你还没想好那根轴"的牌
  function deal(){
    if(!remaining.length) return null;
    if(shown.length < SEED) return remaining.shift();
    // 各维信号 & 各值已展示次数
    const lc={}; DIMS.forEach(d=>lc[d]={});
    liked.forEach(c=>DIMS.forEach(d=> lc[d][c[d]]=(lc[d][c[d]]||0)+1 ));
    const undecided = {};
    DIMS.forEach(d=>{ const e=Object.entries(lc[d]).sort((a,b)=>b[1]-a[1]);
      undecided[d] = !(e.length && e[0][1]>=2 && (e.length<2||e[0][1]>e[1][1])); });
    const shownVal={}; shown.forEach(c=>DIMS.forEach(d=> shownVal[c[d]]=(shownVal[c[d]]||0)+1 ));
    let best=null, bi=0;
    remaining.forEach((c,i)=>{
      let info=0; for(const d of DIMS){ if(undecided[d]) info += 1/(1+(shownVal[c[d]]||0)); }
      if(!best || info>best.info){ best={car:c, info}; bi=i; }
    });
    remaining.splice(bi,1);
    return best.car;
  }

  function updateCounter(){
    const n = liked.length+disliked.length;
    counter.textContent = `已滑 ${n}　·　❤ ${liked.length}　✕ ${disliked.length}` +
      (n<MIN_SWIPE? `　（再滑 ${MIN_SWIPE-n} 张出结果）`:'');
    GG.clear(readWrap); readWrap.appendChild(liveRead(liked));
    if(n>=MIN_SWIPE && !GG.$('#go', main)){
      doneBtnWrap.appendChild(GG.el('button',{id:'go', class:'btn primary lg', onClick:finish}, '✨ 看我的购车简报 →'));
    }
  }

  function renderTop(){
    GG.clear(deckBox);
    if(!current){ current = deal(); }
    if(!current){ finish(); return; }
    const next = remaining[0] || (shown.length<SEED?null:null);
    // 底层垫一张（视觉层叠）
    if(next){ const under = makeCard(next, 1); deckBox.appendChild(under); }
    const topEl = makeCard(current, 0);
    deckBox.appendChild(topEl);
    attachDrag(topEl, current);
  }

  function makeCard(car, depth){
    const el = GG.el('div',{class:'card', style:{
      position:'absolute', inset:'0', padding:'16px 16px 14px', display:'flex', flexDirection:'column',
      transform:`scale(${1-depth*0.04}) translateY(${depth*12}px)`, zIndex:String(10-depth),
      transition:'transform .18s', boxShadow:'var(--sh-2)', cursor:depth===0?'grab':'default',
      background:`linear-gradient(160deg, ${hexA(car.color,.12)}, #fff 48%)`
    }},
      GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'flex-start'}},
        GG.el('h3',{style:{fontSize:'20px'}}, car.name),
        GG.el('span',{class:'pill', style:{background:'#fff', border:'1px solid var(--line)', color:'var(--ink-2)',
          borderRadius:'999px', padding:'3px 10px', fontSize:'12.5px', fontWeight:'600', whiteSpace:'nowrap'}}, car.range)),
      GG.el('div',{style:{flex:'1', display:'flex', alignItems:'center', justifyContent:'center', padding:'4px 0'},
        html:carSVG(car.color, car.body)}),
      GG.el('p',{style:{margin:'0 0 2px', fontSize:'15px', color:'var(--ink)', fontWeight:'560'}}, '“'+car.scene+'”'),
      GG.el('p',{class:'small muted', style:{margin:'2px 0 0'}}, car.blurb),
      chips(car));
    const like = GG.el('div',{style:tagStyle('#2e9e7b','left')}, '❤ 喜欢');
    const nope = GG.el('div',{style:tagStyle('#e8543f','right')}, '✕ 算了');
    el._like=like; el._nope=nope; el.appendChild(like); el.appendChild(nope);
    return el;
  }
  function tagStyle(color, side){
    return {position:'absolute', top:'16px', [side==='left'?'right':'left']:'16px',
      border:`3px solid ${color}`, color, fontWeight:'800', fontSize:'18px',
      padding:'4px 12px', borderRadius:'10px', transform:'rotate(-12deg)', opacity:'0',
      transition:'opacity .1s', pointerEvents:'none'};
  }

  function attachDrag(el, car){
    let sx=0, dx=0, dragging=false;
    const down=e=>{ dragging=true; el.style.transition='none'; el.style.cursor='grabbing';
      sx=(e.touches?e.touches[0].clientX:e.clientX);
      window.addEventListener('pointermove',move); window.addEventListener('pointerup',up); };
    const move=e=>{ if(!dragging)return; dx=e.clientX-sx;
      el.style.transform=`translate(${dx}px,0) rotate(${dx/18}deg)`;
      el._like.style.opacity = dx>30? Math.min(1, dx/120):0;
      el._nope.style.opacity = dx<-30? Math.min(1, -dx/120):0; };
    const up=()=>{ if(!dragging)return; dragging=false; el.style.cursor='grab';
      window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up);
      if(Math.abs(dx)>110){ fly(el, dx>0, ()=>register(car, dx>0)); }
      else { el.style.transition='transform .2s'; el.style.transform=''; el._like.style.opacity=0; el._nope.style.opacity=0; } };
    el.addEventListener('pointerdown', down);
  }
  function fly(el, right, cb){
    el.style.transition='transform .32s ease, opacity .32s';
    el.style.transform=`translate(${right?520:-520}px, -40px) rotate(${right?30:-30}deg)`;
    el.style.opacity='0';
    setTimeout(cb, 200);
  }
  function register(car, liked_){
    (liked_?liked:disliked).push(car); shown.push(car);
    current = null; updateCounter(); renderTop();
  }
  function act(right){
    if(!current) return;
    const top = GG.$$('.card', deckBox).find(c=>c.style.zIndex==='10');
    if(top){ top._like.style.opacity = right?1:0; top._nope.style.opacity = right?0:1;
      fly(top, right, ()=>register(current, right)); }
    else register(current, right);
  }
  function keyh(e){ if(e.key==='ArrowRight') act(true); else if(e.key==='ArrowLeft') act(false); }
  window.addEventListener('keydown', keyh);

  function finish(){
    window.removeEventListener('keydown', keyh);
    // 抓矛盾 → 先追问，再出结果
    const t = detectTension(liked);
    if(t){ tensionStage(liked, disliked, t); }
    else { commit(liked, disliked, null); }
  }

  updateCounter(); renderTop();
}

/* ② 矛盾追问：抓出来 + 逼你二选一 */
function tensionStage(liked, disliked, det){
  GG.clear(main);
  const t = det.tension;
  const wrap = GG.el('div');
  main.appendChild(wrap);

  const exA = liked.filter(t.A.match).slice(0,2).map(c=>c.name).join('、');
  const exB = liked.filter(t.B.match).slice(0,2).map(c=>c.name).join('、');

  wrap.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'18px'}},
    GG.el('div',{class:'small', style:{color:'var(--accent)', fontWeight:'700', letterSpacing:'.04em'}}, '⚡ 等一下，我注意到一个矛盾'),
    GG.el('h1',{style:{fontSize:'23px', marginTop:'8px'}}, t.q)));

  wrap.appendChild(GG.el('div',{class:'card pad', style:{margin:'4px 0 18px', background:'var(--accent-soft)', borderColor:'transparent'}},
    GG.el('p',{style:{margin:'0', fontSize:'15px', color:'var(--ink-2)', lineHeight:'1.7'}},
      `你右滑里既有「${exA||t.A.label}」这种偏「${t.A.word}」的，又有「${exB||t.B.label}」这种偏「${t.B.word}」的——这两边其实在往相反方向拉。先帮我定一下：这台车，更想满足哪一个？`)));

  const choose = side => commit(liked, disliked, {tensionId:t.id, side});
  const poleCard = (side)=>{ const p=t[side];
    return GG.el('div',{class:'opt', style:{padding:'18px', alignItems:'flex-start', flexDirection:'column', gap:'4px'}, onClick:()=>choose(side)},
      GG.el('div',{style:{fontSize:'17px', fontWeight:'680'}}, p.label),
      GG.el('div',{class:'small muted'}, p.sub)); };

  main.appendChild(GG.el('div',{class:'stack', style:{maxWidth:'460px', margin:'0 auto'}},
    poleCard('A'), poleCard('B'),
    GG.el('div',{class:'center', style:{marginTop:'4px'}},
      GG.el('button',{class:'btn ghost small', style:{color:'var(--ink-3)'}, onClick:()=>commit(liked,disliked,null)}, '其实两个都想要 / 拿不准 →'))));
}

function commit(liked, disliked, resolution){
  GG.encodeState({l: liked.map(c=>c.id), d: disliked.map(c=>c.id), r: resolution});
  showResult(liked, disliked, resolution, false);
}

/* ③ 决策简报 */
async function showResult(liked, disliked, resolution, fromLink){
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  const useAI = GG.llm.connected();
  let recs;
  if(!fromLink){
    const think = GG.thinking(stage, ['读取你的 '+liked.length+' 次右滑…',
      resolution?'结合你刚做的取舍重排…':'拆解车型 / 气质 / 动力倾向…',
      useAI?'AI 在写你的购车简报…':'生成购车简报…','挑出最对路的几台…'], useAI?2100:1600);
    const [r] = await Promise.all([getRecs(liked, disliked, resolution, useAI), think]); recs = r;
  } else { recs = await getRecs(liked, disliked, resolution, useAI); }
  const {picks, wildcard, tendencies, persona, questions} = recs;

  GG.clear(stage);
  const res = resolution && resolution.side ? TENSIONS.find(t=>t.id===resolution.tensionId)[resolution.side] : null;

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}}, GG.el('h1',{style:{fontSize:'24px'}}, '🚗 你的购车简报')));
  stage.appendChild(GG.el('div',{style:{margin:'0 0 12px'}}, GG.llm.badge(!!recs._ai)));

  // 人格
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', background:`linear-gradient(160deg,var(--accent-soft),#fff 62%)`}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '你是这样一类买车人'),
    GG.el('div',{style:{fontSize:'23px', fontWeight:'730', letterSpacing:'-.4px'}}, persona.name),
    GG.el('p',{style:{margin:'8px 0 0', fontSize:'15px', color:'var(--ink-2)', lineHeight:'1.7'}}, persona.read),
    res ? GG.el('div',{class:'chips', style:{marginTop:'12px'}},
            GG.el('span',{class:'chip', style:{cursor:'default', background:'var(--accent)', color:'#fff', borderColor:'var(--accent)'}}, '你的取舍：'+res.label),
            ...tendencies.map(t=>GG.el('span',{class:'chip',style:{cursor:'default'}}, t.val)))
        : GG.el('div',{class:'chips', style:{marginTop:'12px'}}, tendencies.map(t=>GG.el('span',{class:'chip',style:{cursor:'default'}}, t.val)))
  ));

  // 先试驾这台（Top1 高亮 CTA）
  const t1 = picks[0];
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', border:'2px solid var(--accent)', background:'#fff'}},
    GG.el('div',{class:'row', style:{gap:'8px', marginBottom:'8px'}},
      GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', fontWeight:'700', padding:'4px 11px', borderRadius:'999px', fontSize:'13px'}}, '👉 先去试驾这台'),
      GG.el('span',{class:'pill'}, '契合 '+t1.match+'%')),
    GG.el('div',{class:'row', style:{gap:'16px', alignItems:'center', flexWrap:'wrap'}},
      GG.el('div',{style:{width:'150px', flex:'none'}, html:carSVG(t1.car.color, t1.car.body)}),
      GG.el('div',{style:{flex:'1', minWidth:'200px'}},
        GG.el('h3',{style:{fontSize:'21px'}}, t1.car.name+' '),
        GG.el('span',{class:'small muted'}, t1.car.range),
        GG.el('p',{class:'small', style:{margin:'8px 0 0', color:'var(--ink-2)'}}, t1.reason),
        GG.el('p',{class:'small', style:{margin:'6px 0 0', color:'var(--warn)'}}, '⚠ 买它之前注意：'+t1.caveat)))
  ));

  // 另外 2 台 + 黑马
  stage.appendChild(GG.el('div',{class:'section-t'}, '其余候选 & 一台黑马'));
  const list = GG.el('div',{class:'stack'});
  picks.slice(1).forEach((r,i)=>{
    list.appendChild(pickRow('推荐 '+(i+2), r.car, r.match, r.reason, r.caveat));
  });
  if(wildcard && wildcard.car){
    list.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'16px', alignItems:'center', flexWrap:'wrap', borderStyle:'dashed'}},
      GG.el('div',{style:{width:'120px', flex:'none'}, html:carSVG(wildcard.car.color, wildcard.car.body)}),
      GG.el('div',{style:{flex:'1', minWidth:'200px'}},
        GG.el('div',{class:'row', style:{gap:'8px'}},
          GG.el('span',{class:'pill', style:{background:'#1d1d1f', color:'#fff', fontWeight:'700', padding:'4px 11px', borderRadius:'999px', fontSize:'13px'}}, '🐎 黑马'),
          GG.el('h3',{style:{fontSize:'18px'}}, wildcard.car.name),
          GG.el('span',{class:'small muted'}, wildcard.car.range)),
        GG.el('p',{class:'small', style:{margin:'8px 0 0', color:'var(--ink-2)'}}, wildcard.reason),
        GG.el('p',{class:'small', style:{margin:'6px 0 0', color:'var(--warn)'}}, '⚠ '+wildcard.car.caveat),
        chips(wildcard.car))));
  }
  stage.appendChild(list);

  // 对比表
  if(picks.length>1) stage.appendChild(compareTable(picks, tendencies, res));

  // 替你问销售的问题
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '🗣 替你问销售的 3 个问题'),
    GG.el('p',{class:'small muted', style:{margin:'0 0 10px'}}, '都是针对上面这几台的真实疑点——到店直接问，别被话术绕。'),
    GG.el('div',{class:'stack', style:{gap:'10px'}},
      ...questions.map((q,i)=> GG.el('div',{class:'row', style:{gap:'10px', alignItems:'flex-start'}},
        GG.el('span',{style:{flex:'none', width:'22px', height:'22px', borderRadius:'50%', background:'var(--accent-soft)', color:'var(--accent)', fontSize:'12px', fontWeight:'700', display:'grid', placeItems:'center'}}, String(i+1)),
        GG.el('span',{style:{fontSize:'14.5px', color:'var(--ink-2)'}}, q))))
  ));

  // 分享
  const shareSpec = {
    slug:SLUG, title:'我的购车简报 · '+persona.name,
    subtitle: (res? '取舍：'+res.label+'　·　':'') + '先试驾：'+t1.car.name,
    tags: tendencies.map(t=>t.val).concat(res?['↦ '+res.label]:[]),
    note: t1.car.name+' —— '+t1.reason,
    rows: picks.map((r,i)=>({label:(i===0?'⭐ ':'')+'推荐 '+(i+1), value:`${r.car.name}（契合 ${r.match}%）`}))
          .concat(wildcard&&wildcard.car? [{label:'🐎 黑马', value:wildcard.car.name}]:[]),
  };
  stage.appendChild(GG.resultCard(SLUG, GG.el('div',{class:'center muted small'}, '把这份简报存图带去店里 ↓'), shareSpec));
  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '↻ 换一组滑法')));
}

function pickRow(tag, car, match, reason, caveat){
  return GG.el('div',{class:'card pad', style:{display:'flex', gap:'16px', alignItems:'center', flexWrap:'wrap'}},
    GG.el('div',{style:{width:'120px', flex:'none'}, html:carSVG(car.color, car.body)}),
    GG.el('div',{style:{flex:'1', minWidth:'200px'}},
      GG.el('div',{class:'row', style:{justifyContent:'space-between'}},
        GG.el('div',{class:'row', style:{gap:'8px'}},
          GG.el('span',{class:'pill', style:{background:'var(--accent-soft)', color:'var(--accent)', fontWeight:'700', padding:'4px 11px', borderRadius:'999px', fontSize:'13px'}}, tag),
          GG.el('h3',{style:{fontSize:'18px'}}, car.name),
          GG.el('span',{class:'small muted'}, car.range)),
        GG.el('span',{class:'pill'}, '契合 '+match+'%')),
      GG.el('p',{class:'small', style:{margin:'8px 0 0', color:'var(--ink-2)'}}, reason),
      caveat? GG.el('p',{class:'small', style:{margin:'6px 0 0', color:'var(--warn)'}}, '⚠ '+caveat):null,
      chips(car)));
}

/* 3 台横向对比：命中"核心信号 / 取舍"的格子高亮 */
function compareTable(picks, tendencies, res){
  const hit = new Set(tendencies.map(t=>t.val));
  if(res) res.boost.forEach(v=>hit.add(v));
  const cars = picks.map(p=>p.car);
  const gridCols = '54px repeat('+cars.length+',1fr)';
  const head = GG.el('div',{style:{display:'grid', gridTemplateColumns:gridCols, gap:'6px', alignItems:'end'}},
    GG.el('span',{class:'small muted'}, ''),
    ...cars.map(c=>GG.el('span',{class:'small', style:{fontWeight:'700', textAlign:'center', lineHeight:'1.2'}}, c.name)));
  const rows=[head];
  DIMS.concat(['range']).forEach(d=>{
    const label = d==='range'?'价位':DIM_LABEL[d];
    const cells = cars.map(c=>{ const v=c[d], on=hit.has(v);
      return GG.el('span',{class:'small', style:{textAlign:'center', padding:'5px 4px', borderRadius:'8px',
        background:on?'var(--accent-soft)':'transparent', color:on?'var(--accent)':'var(--ink-2)', fontWeight:on?'700':'500'}}, v); });
    rows.push(GG.el('div',{style:{display:'grid', gridTemplateColumns:gridCols, gap:'6px', alignItems:'center'}},
      GG.el('span',{class:'small muted'}, label), ...cells));
  });
  return GG.el('div',{class:'card pad', style:{marginTop:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '3 台横向对比'),
    GG.el('div',{class:'stack', style:{gap:'7px'}}, ...rows),
    GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}}, '高亮 = 命中你的核心偏好或刚才的取舍。'));
}

start();
})();
