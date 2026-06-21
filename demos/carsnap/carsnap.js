/* carsnap —— 答 5 题 → thinking → 荐 1~3 台车，每台给引用答案的可解释理由。 */
(function(){
const SLUG='carsnap';
const {QUESTIONS, AXES, CARS} = window.CARSNAP;
let main;

const PRICE_LABEL = {1:'15 万内', 2:'15~25 万', 3:'25~40 万', 4:'40 万+'};

/* 车身侧影 SVG（颜色随车；body 微调车顶高度，参考 whips 的画法但自建） */
function carSVG(color, body){
  const tall = (body==='SUV'||body==='MPV');
  const low  = (body==='轿车');
  const roofY = low ? 28 : (tall ? 14 : 22);
  const glassTop = low ? 31 : (tall ? 18 : 26);
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
    [PRICE_LABEL[car.priceTier], car.body, car.seats+'座', car.energy, ...car.strengths]
      .map(t=>GG.el('span',{class:'chip',style:{cursor:'default'}}, t)));
}

/* ---------- 引擎 ---------- */
// answers: {questionId: optionObj}
function recommend(answers){
  // 1) 累加需求画像
  const need = {}; AXES.forEach(a=>need[a]=0);
  let budget = 4, bodyPref = null, energyPref = null, seatNeed = 1;
  for(const q of QUESTIONS){
    const o = answers[q.id]; if(!o) continue;
    if(o.axes) for(const k in o.axes) need[k]=(need[k]||0)+o.axes[k];
    if(o.budget) budget = o.budget;
    if(o.bodyPref) bodyPref = o.bodyPref;
    if(o.energyPref) energyPref = o.energyPref;
    if(o.seatNeed) seatNeed = Math.max(seatNeed, o.seatNeed);
  }
  const needNorm = AXES.reduce((s,a)=>s+need[a],0) || 1;

  // 2) 逐车打分
  const scored = CARS.map(car=>{
    let s = 0;
    // axes 点积（核心契合）
    for(const a of AXES) s += (need[a]||0) * (car.axes[a]||0);
    // 硬偏好加成 / 惩罚
    let budgetFit = true;
    if(car.priceTier <= budget) s += 6;                 // 在预算内：奖励
    else { s -= (car.priceTier-budget)*14; budgetFit=false; } // 超预算：重罚
    if(bodyPref && car.body===bodyPref) s += 8;
    if(energyPref && car.energy===energyPref) s += 12;
    let seatFit = car.seats >= seatNeed;
    if(seatFit) s += 5; else s -= 16;                    // 座位不够：重罚
    return {car, s, budgetFit, seatFit};
  }).sort((a,b)=>b.s-a.s);

  const maxS = scored[0].s || 1;
  const top = scored.slice(0,3).map(x=>({
    car:x.car, raw:x.s,
    match: Math.round(GG.clamp(60 + (x.s/Math.max(1,maxS))*38, 60, 98))
  }));

  return {top, need, needNorm, budget, bodyPref, energyPref, seatNeed, answers};
}

// 找出用户在该题选了什么（用于理由文案）
function ansLabel(answers, id){ const o=answers[id]; return o? o.label : ''; }

// 为某台车生成"逐条引用答案"的理由
function reasonFor(car, ctx){
  const a = ctx.answers, parts = [];
  // 预算
  if(car.priceTier <= ctx.budget) parts.push(`你选了「预算 ${PRICE_LABEL[ctx.budget]}」，它落在这一档内`);
  // 能源
  if(ctx.energyPref && car.energy===ctx.energyPref) parts.push(`你想要「${ctx.energyPref}」，正好是 ${ctx.energyPref}`);
  // 车型 / 用途
  if(ctx.bodyPref && car.body===ctx.bodyPref){
    const useO = a.use, seatO = a.seat;
    const why = (seatO && seatO.bodyPref===ctx.bodyPref) ? ansLabel(a,'seat') : ansLabel(a,'use');
    parts.push(`你选了「${why}」，这台 ${car.body} 正合适`);
  }
  // 座位
  if(a.seat && a.seat.seatNeed>=6 && car.seats>=a.seat.seatNeed) parts.push(`满足你「${ansLabel(a,'seat')}」的座位需求`);
  // 最看重的点 → 命中车的对应能力
  if(a.care){
    const careAxis = Object.keys(a.care.axes||{})[0]; // 该选项主推的轴
    if(careAxis && (car.axes[careAxis]||0)>=4){
      parts.push(`你最看重「${ansLabel(a,'care')}」，它在这点上很强（${car.strengths.join('、')}）`);
    }
  }
  // 用途轴兜底（若上面没覆盖用途）
  if(!parts.some(p=>p.includes('用途')) && a.use && !(ctx.bodyPref && car.body===ctx.bodyPref)){
    const useAxis = Object.keys(a.use.axes||{}).sort((x,y)=>a.use.axes[y]-a.use.axes[x])[0];
    if(useAxis && (car.axes[useAxis]||0)>=4) parts.push(`贴合你「${ansLabel(a,'use')}」的用车场景`);
  }
  if(!parts.length) return '综合你这几个选择，它的整体契合度最高。';
  return '因为' + parts.slice(0,3).join('；') + '。';
}

/* ---------- AI 通路（连了 key 让模型读你的答案、从车库里荐车并逐条解释；没连退回本地点积打分） ----------
   硬约束（预算、座位）始终在本地强制：AI 选的车若超预算 / 座位不够 → 直接丢弃，绝不破。 */
const CS_SYS = '你是懂车的购车顾问。用户回答了几道选车问题，下面给你 ta 的回答和完整车库（每行 车名｜价位档/车型/座位/能源 + 强项）。请从车库里挑 1~3 台最合适的，理由要逐条引用 ta 的回答（预算/用途/座位/能源/最看重）。绝不推荐超预算或座位不够的车。只输出严格 JSON：{"picks":[{"name":"必须与车库里的车名完全一致","match":契合度数字60到98,"reason":"为什么推荐，引用 ta 的回答，50字内"}]}。按契合度从高到低，全部简体中文。';

async function getRecs(answers, useAI){
  const ctx = recommend(answers);
  if(useAI){
    try{
      const lib = CARS.map(c=>`${c.name}｜${PRICE_LABEL[c.priceTier]}/${c.body}/${c.seats}座/${c.energy} · 强项：${c.strengths.join('、')}`).join('\n');
      const ans = [
        `预算上限：${PRICE_LABEL[ctx.budget]}`,
        `用途：${ansLabel(answers,'use')}`,
        `座位：${ansLabel(answers,'seat')}（至少 ${ctx.seatNeed} 座）`,
        `能源：${ctx.energyPref||'不限'}`,
        `最看重：${ansLabel(answers,'care')}`,
      ].join('\n');
      const obj = await GG.llm.json(CS_SYS, `用户回答：\n${ans}\n\n车库：\n${lib}`, {max_tokens:900});
      const seen = new Set();
      const picks = (Array.isArray(obj.picks)?obj.picks:[]).map(p=>{
        const car = CARS.find(c=> c.name===p.name);             // 车名必须完全匹配，否则丢弃
        if(!car || seen.has(car.name)) return null;
        if(car.priceTier > ctx.budget) return null;             // 硬约束：超预算丢弃
        if(car.seats < ctx.seatNeed) return null;               // 硬约束：座位不够丢弃
        seen.add(car.name);
        return {car, match: Math.round(GG.clamp(parseInt(p.match,10)||80, 60, 98)), reason:String(p.reason||'').trim()};
      }).filter(Boolean);
      if(picks.length){ ctx._aiTop = picks.slice(0,3); ctx._ai = true; }
    }catch(e){ GG.toast(GG.llm.errMsg(e)); }
  }
  return ctx;
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.a){
    // 还原 answers：{qid: optionKey}
    const answers = {};
    for(const q of QUESTIONS){
      const k = st.a[q.id];
      const o = q.options.find(op=>op.key===k);
      if(o) answers[q.id]=o;
    }
    if(Object.keys(answers).length===QUESTIONS.length){ showResult(answers, true); return; }
  }
  intro();
}

function intro(){
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '答几个问题，帮你挑那台车'),
    GG.el('p', null, `不懂参数也没关系。回答 ${QUESTIONS.length} 道单选题——预算、用途、坐几人、能源、最看重什么，我就从车库里给你精选 1~3 台，并逐条说清为什么推荐。`)
  ));
  main.appendChild(GG.llm.bar());
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn primary lg', onClick:quiz}, '开始答题 →')
  ));
}

function quiz(){
  GG.clear(main);
  const answers = {};
  let qi = 0;

  const progWrap = GG.el('div',{class:'prog', style:{margin:'6px 0 18px'}}, GG.el('i'));
  const stage = GG.el('div');
  main.appendChild(GG.el('div',{class:'hero', style:{paddingBottom:'4px'}}, GG.el('h1',{style:{fontSize:'22px'}}, '答题荐车')));
  main.appendChild(progWrap);
  main.appendChild(stage);

  function renderQ(){
    const q = QUESTIONS[qi];
    GG.$('i', progWrap).style.width = (qi/QUESTIONS.length*100)+'%';
    GG.clear(stage);
    stage.appendChild(GG.el('div',{class:'small muted', style:{marginBottom:'4px'}}, `第 ${qi+1} / ${QUESTIONS.length} 题`));
    stage.appendChild(GG.el('h2',{style:{fontSize:'21px', margin:'0 0 16px'}}, q.q));
    const opts = GG.el('div',{class:'stack'});
    q.options.forEach(o=>{
      const chosen = answers[q.id] && answers[q.id].key===o.key;
      const card = GG.el('div',{class:'opt'+(chosen?' on':''), onClick:()=>choose(o)},
        GG.el('span',{class:'dot'}),
        GG.el('span',{style:{fontSize:'16px'}}, o.label)
      );
      opts.appendChild(card);
    });
    stage.appendChild(opts);
    // 上一题
    if(qi>0){
      stage.appendChild(GG.el('div',{style:{marginTop:'18px'}},
        GG.el('button',{class:'btn', onClick:()=>{ qi--; renderQ(); }}, '← 上一题')));
    }
  }
  function choose(o){
    answers[QUESTIONS[qi].id] = o;
    // 短暂高亮后进下一题
    renderQ();
    setTimeout(()=>{
      if(qi < QUESTIONS.length-1){ qi++; renderQ(); }
      else finish();
    }, 230);
  }
  function finish(){
    GG.$('i', progWrap).style.width = '100%';
    GG.encodeState({a: Object.fromEntries(QUESTIONS.map(q=>[q.id, answers[q.id].key]))});
    showResult(answers, false);
  }
  renderQ();
}

async function showResult(answers, fromLink){
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  const useAI = GG.llm.connected();
  let ctx;
  if(!fromLink){
    const think = GG.thinking(stage, [
      '读取你的 '+QUESTIONS.length+' 个选择…',
      useAI?'AI 拆解你的用车需求…':'拆解预算 / 用途 / 座位需求…',
      '在车库 '+CARS.length+' 台里逐台匹配…',
      '挑出最懂你的几台…'
    ], useAI?2000:1600);
    const [c] = await Promise.all([getRecs(answers, useAI), think]); ctx = c;
  } else {
    ctx = await getRecs(answers, useAI);
  }
  const top = ctx._aiTop || ctx.top.map(t=>({car:t.car, match:t.match, reason:reasonFor(t.car, ctx)}));
  GG.clear(stage);

  // 你的需求画像（引用答案）
  const ansSummary = [
    `预算 ${PRICE_LABEL[ctx.budget]}`,
    ansLabel(answers,'use'),
    ansLabel(answers,'seat'),
    ctx.energyPref ? ctx.energyPref : '能源不限',
    '最看重：'+ (answers.care? answers.care.label.split(' · ')[0] : '—'),
  ].filter(Boolean);

  const profile = GG.el('div',{class:'card pad', style:{marginBottom:'16px', background:`linear-gradient(160deg,var(--accent-soft),#fff 60%)`}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '根据你的回答'),
    GG.el('div',{class:'chips'}, ansSummary.map(t=>GG.el('span',{class:'chip',style:{cursor:'default'}}, t)))
  );

  // 推荐列表
  const list = GG.el('div',{class:'stack'});
  top.forEach((r,i)=>{
    const car=r.car;
    list.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'16px', alignItems:'center', flexWrap:'wrap'}},
      GG.el('div',{style:{width:'132px', flex:'none'}, html:carSVG(car.color, car.body)}),
      GG.el('div',{style:{flex:'1', minWidth:'200px'}},
        GG.el('div',{class:'row', style:{justifyContent:'space-between'}},
          GG.el('div',{class:'row', style:{gap:'8px'}},
            GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', fontWeight:'700', padding:'4px 11px', borderRadius:'999px', fontSize:'13px'}}, '推荐 '+(i+1)),
            GG.el('h3',{style:{fontSize:'19px'}}, car.name)),
          GG.el('span',{class:'pill'}, '契合 '+r.match+'%')
        ),
        GG.el('p',{class:'small', style:{margin:'8px 0 0', color:'var(--ink-2)'}}, r.reason),
        GG.el('p',{class:'small muted', style:{margin:'4px 0 0'}}, car.blurb),
        chips(car)
      )
    ));
  });

  const top1 = top[0];
  const shareSpec = {
    slug:SLUG, title:'答题荐车结果',
    subtitle: top1.car.name,
    rows: top.map((r,i)=>({label:'推荐 '+(i+1), value:`${r.car.name}（契合 ${r.match}%）`})),
    tags: ansSummary,
    note: top1.car.name+' —— '+top1.reason,
  };

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}}, GG.el('h1',{style:{fontSize:'24px'}}, '🔑 给你挑了这几台')));
  stage.appendChild(GG.el('div',{style:{margin:'0 0 10px'}}, GG.llm.badge(!!ctx._ai)));
  stage.appendChild(profile);
  stage.appendChild(list);
  stage.appendChild(GG.resultCard(SLUG, GG.el('div',{class:'center muted small'}, '截图 / 分享你的荐车结果 ↓'), shareSpec));
  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '↻ 重新答题')
  ));
}

start();
})();
