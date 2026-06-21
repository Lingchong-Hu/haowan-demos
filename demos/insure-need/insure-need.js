/* insure-need — 答几个生活问题 → 建议保额 + 推荐险种 + 一句理由。
   引擎：需求法简化。寿险缺口 = 收入替代 + 负债房贷 + 子女教育 − 已有保额（下限 0）。
   收入替代年数随 年龄/是否有小孩 调整；重疾 ≈ 3~5 年收入。所有结果引用真实输入。 */
(function(){
const SLUG='insure-need';
const {PRODUCTS, PRIO} = window.INSURE;
let main;

/* ---------- 表单状态 ---------- */
const DEF = { age:32, income:30, deps:1, kids:1, debt:80, have:50 };
const Q = [
  { key:'age',    label:'你的年龄',                 unit:'岁',   min:18, max:70, step:1,  hint:'越年轻、要养家的年头越长' },
  { key:'income', label:'你的年收入（税后）',        unit:'万元', min:0,  max:300, step:1, hint:'家庭主要靠你赚多少' },
  { key:'deps',   label:'需要靠你供养的人数',        unit:'人',   min:0,  max:6,  step:1,  hint:'父母 / 配偶 / 子女等' },
  { key:'kids',   label:'其中未成年子女数',          unit:'个',   min:0,  max:5,  step:1,  hint:'有小孩要备一笔教育金' },
  { key:'debt',   label:'房贷及其他负债余额',        unit:'万元', min:0,  max:1000,step:5,  hint:'你走后家人要替你还的钱' },
  { key:'have',   label:'你已有的寿险/身故类保额',   unit:'万元', min:0,  max:1000,step:5,  hint:'公司团险 + 自己买的合计' },
];

/* ---------- 引擎 ---------- */
function engine(s){
  const age = GG.clamp(+s.age||0, 18, 70);
  const income = Math.max(0, +s.income||0);
  const deps = Math.max(0, +s.deps||0);
  const kids = Math.max(0, +s.kids||0);
  const debt = Math.max(0, +s.debt||0);
  const have = Math.max(0, +s.have||0);

  // 收入替代年数：基准随年龄递减（年轻=要养家更久），有小孩 + 供养人多再加成
  let years = GG.clamp(Math.round((62 - age) * 0.55), 3, 22); // 大致到 60 出头退休前的工作年数打折
  if(kids>0)  years += Math.min(6, 2 + kids);       // 有娃，把孩子拉扯大需要更长替代
  if(deps>kids) years += Math.min(3, deps - kids);  // 还有其他大人要养
  years = GG.clamp(years, 3, 28);

  const incomePart = income * years;                // 收入替代
  const eduPart    = kids * 60;                      // 每个孩子约备 60 万教育/成长金
  const debtPart   = debt;                           // 负债全额兜底
  const need = incomePart + eduPart + debtPart;      // 总需求
  const gap  = Math.max(0, Math.round(need - have)); // 寿险缺口（下限 0）

  // 重疾 ≈ 3~5 年收入：有娃/负债重 → 取高档
  let ciMul = 3;
  if(kids>0) ciMul += 1;
  if(debt >= income*3 && income>0) ciMul += 1;
  ciMul = GG.clamp(ciMul, 3, 5);
  const ci = Math.round(income * ciMul) || 30;      // 收入为 0 时给个兜底基数

  return { age, income, deps, kids, debt, have, years, incomePart, eduPart, debtPart, need, gap, ci, ciMul };
}

// 险种优先级（随家庭情况变）
function recommend(r){
  const lifePrio = r.gap > 0 ? (r.gap >= 100 || r.deps>0 ? 'must' : 'strong')
                             : (r.deps>0 ? 'option' : 'skip');
  const ciPrio   = r.income>0 ? (r.kids>0 || r.deps>0 ? 'must' : 'strong') : 'strong';
  const medPrio  = 'must';                                   // 几乎人人必配
  const accPrio  = r.deps>0 || r.debt>0 ? 'strong' : 'option';
  return [
    { p:PRODUCTS.life,    prio:lifePrio, amount: r.gap>0 ? `约 ¥${r.gap} 万` : '已基本充足' },
    { p:PRODUCTS.ci,      prio:ciPrio,   amount: `约 ¥${r.ci} 万（≈${r.ciMul} 年收入）` },
    { p:PRODUCTS.medical, prio:medPrio,  amount: '百万级（按年续）' },
    { p:PRODUCTS.accident,prio:accPrio,  amount: r.deps>0||r.debt>0 ? '¥50~100 万' : '¥30~50 万' },
  ];
}

// 一句理由，引用具体输入
function reason(r){
  const bits = [];
  if(r.kids>0) bits.push(`${r.kids} 个未成年子女`);
  else if(r.deps>0) bits.push(`${r.deps} 位需供养的家人`);
  if(r.debt>0) bits.push(`¥${r.debt} 万负债/房贷`);
  const ctx = bits.length ? `你有 ${bits.join(' + ')}` : `你目前无人供养、也几乎无负债`;

  if(r.gap > 0){
    const haveTxt = r.have>0 ? `现有保额仅 ¥${r.have} 万` : `目前没有身故类保障`;
    return `${ctx}，${haveTxt}：按 ${r.years} 年收入替代 + 负债 + 教育金算，寿险缺口约 ¥${r.gap} 万，先补上这块再谈其他。`;
  }
  return `${ctx}，已有 ¥${r.have} 万保额已覆盖测算需求（¥${r.need} 万），寿险无需再加；把预算放在重疾与医疗的持续保障上更划算。`;
}

/* ---------- AI 顾问层（附加：需求法计算永远本地确定性，连了 key 才叠加个性化点评） ---------- */
const INSURE_SYS = '你是中立、不推销具体产品的保险规划师。下面是用户用需求法算出的保障缺口与家庭情况。请给出个性化、可执行的投保建议与提醒。只输出严格 JSON：{"summary":"一句话总体点评","tips":["3条具体的投保/避坑建议，引用其家庭情况与缺口"],"watch":"一句话最该注意的点，如健康告知或预算分配"}。不要推荐具体保险公司或产品名，全部简体中文。';
function aiAdvice(r){
  const user = `寿险缺口：¥${r.gap}万（需求¥${r.need}万 − 已有¥${r.have}万）\n重疾建议：¥${r.ci}万（≈${r.ciMul}年收入）\n年龄${r.age}、年收入¥${r.income}万、供养${r.deps}人（其中未成年子女${r.kids}）、负债¥${r.debt}万`;
  return GG.llm.json(INSURE_SYS, user, {max_tokens:700});
}
function bullets(arr){
  return GG.el('ul',{class:'small', style:{margin:'4px 0 0', paddingLeft:'20px', color:'var(--ink-2)', lineHeight:'1.7'}},
    arr.map(t=>GG.el('li', null, t)));
}
function mountAdvice(stage, r){
  if(!GG.llm.connected()) return;
  const body = GG.el('div', null, GG.el('p',{class:'small muted', style:{margin:'0'}}, 'AI 正在结合你的情况给出建议…'));
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', borderLeft:'3px solid var(--accent)'}},
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '✨ AI 保险顾问点评'),
      GG.llm.badge(true)),
    body));
  aiAdvice(r).then(obj=>{
    GG.clear(body);
    if(obj.summary) body.appendChild(GG.el('p',{style:{margin:'0 0 10px', fontWeight:'600'}}, String(obj.summary)));
    const tips = (Array.isArray(obj.tips)?obj.tips:[]).map(String).filter(Boolean);
    if(tips.length){ body.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'4px'}}, '投保建议')); body.appendChild(bullets(tips)); }
    if(obj.watch) body.appendChild(GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}}, '⚠︎ '+String(obj.watch)));
    if(!tips.length && !obj.summary) body.appendChild(GG.el('p',{class:'small muted', style:{margin:'0'}}, '这次没生成出建议，缺口测算不受影响。'));
  }).catch(e=>{ GG.clear(body);
    body.appendChild(GG.el('p',{class:'small muted', style:{margin:'0'}}, 'AI 建议没拿到（'+(e&&e.code||'NET')+'），你的缺口测算不受影响。')); });
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.v){ showResult(Object.assign({}, DEF, st.v), true); return; }
  intro();
}

function intro(){
  const s = Object.assign({}, DEF);

  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '你，到底该买多少保？'),
    GG.el('p', null, '别再被销售牵着走。答 6 个生活问题，用「需求法」当场算出你的寿险缺口、重疾额度，以及该先配哪几个险种 —— 还告诉你为什么。连上 AI 还会多一份个性化点评。')
  ));
  main.appendChild(GG.llm.bar());

  const form = GG.el('div',{class:'stack', style:{marginTop:'20px'}});
  Q.forEach(q=>{
    const valEl = GG.el('span',{style:{fontWeight:'700', color:'var(--accent)', fontVariantNumeric:'tabular-nums'}},
      String(s[q.key]) + ' ' + q.unit);
    const range = GG.el('input',{
      type:'range', min:q.min, max:q.max, step:q.step, value:s[q.key],
      style:{width:'100%', accentColor:'var(--accent)', cursor:'pointer'},
      onInput:e=>{ s[q.key]=+e.target.value; valEl.textContent = e.target.value + ' ' + q.unit; syncKids(); }
    });
    range.dataset.k = q.key;
    const block = GG.el('div',{class:'card pad'},
      GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'baseline'}},
        GG.el('label',{class:'label', style:{marginBottom:'0'}}, q.label),
        valEl),
      range,
      GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}}, q.hint)
    );
    block.dataset.key = q.key;
    form.appendChild(block);
  });
  main.appendChild(form);

  // 未成年子女数不超过供养人数
  function syncKids(){
    const kidsR = GG.$('input[data-k="kids"]', form);
    if(+s.kids > +s.deps){
      s.kids = +s.deps;
      kidsR.value = s.kids;
      const blk = form.querySelector('[data-key="kids"]');
      blk.querySelector('span').textContent = s.kids + ' 个';
    }
  }

  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'22px'}},
    GG.el('button',{class:'btn primary lg', onClick:()=>{ syncKids(); showResult(Object.assign({}, s), false); }},
      '🛡️ 算我的保额建议 →')
  ));
}

async function showResult(s, fromLink){
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  if(!fromLink){
    await GG.thinking(stage, [
      '读取你的年龄与收入…',
      '按需求法测算收入替代年数…',
      '叠加负债、子女教育、扣除已有保额…',
      '匹配险种优先级…'
    ], 1600);
  }
  const r = engine(s);
  const recs = recommend(r);
  const why = reason(r);
  GG.encodeState({v: s});
  GG.clear(stage);

  // 头部缺口卡
  const gapColor = r.gap>0 ? 'var(--accent)' : '#2e9e7b';
  const head = GG.el('div',{class:'card pad', style:{marginBottom:'16px',
      background:`linear-gradient(160deg, var(--accent-soft), #fff 62%)`}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '你的寿险缺口'),
    GG.el('div',{style:{display:'flex', alignItems:'baseline', gap:'10px', flexWrap:'wrap'}},
      GG.el('div',{class:'bignum', style:{color:gapColor}}, r.gap>0 ? ('¥'+r.gap+' 万') : '已充足 ✓'),
      r.gap>0 ? GG.el('span',{class:'small muted'}, '（需求 ¥'+r.need+' 万 − 已有 ¥'+r.have+' 万）') : null),
    GG.el('p',{class:'small', style:{margin:'12px 0 0', color:'var(--ink-2)', lineHeight:'1.6'}}, why)
  );

  // 缺口构成拆解（让"随输入变"看得见）
  const parts = GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '缺口怎么算出来的'),
    GG.el('div',{class:'stack', style:{gap:'8px'}},
      partRow('收入替代', `${r.years} 年 × ¥${r.income} 万`, '¥'+r.incomePart+' 万'),
      partRow('子女教育准备', r.kids>0 ? `${r.kids} 个孩子 × ¥60 万` : '无未成年子女', '¥'+r.eduPart+' 万'),
      partRow('负债 / 房贷', r.debt>0 ? '需替家人偿还' : '无', '¥'+r.debtPart+' 万'),
      partRow('已有保额', r.have>0 ? '从需求中扣除' : '尚无', '− ¥'+r.have+' 万', true)
    )
  );

  // 险种推荐
  const order = {must:0, strong:1, option:2, skip:3};
  const sorted = recs.slice().sort((a,b)=>order[a.prio]-order[b.prio]);
  const list = GG.el('div',{class:'stack'});
  sorted.forEach(rec=>{
    const tagBg = rec.prio==='must' ? 'var(--accent)' : (rec.prio==='strong' ? '#2e9e7b'
                 : (rec.prio==='skip' ? '#b0b0b8' : '#8a8a93'));
    list.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'14px', alignItems:'flex-start', flexWrap:'wrap'}},
      GG.el('span',{class:'pill', style:{background:tagBg, color:'#fff', fontWeight:'700', padding:'5px 12px',
          borderRadius:'999px', fontSize:'13px', flex:'none'}}, PRIO[rec.prio]),
      GG.el('div',{style:{flex:'1', minWidth:'220px'}},
        GG.el('div',{class:'row', style:{justifyContent:'space-between', gap:'10px', alignItems:'baseline'}},
          GG.el('h3',{style:{fontSize:'18px'}}, rec.p.name),
          GG.el('span',{style:{fontWeight:'700', color:'var(--ink-1)'}}, rec.amount)),
        GG.el('p',{class:'small muted', style:{margin:'6px 0 0', lineHeight:'1.55'}}, rec.p.desc))
    ));
  });

  // 标签：家庭情况
  const tags = [];
  tags.push(r.age+' 岁');
  if(r.kids>0) tags.push(r.kids+' 娃'); else if(r.deps>0) tags.push('供养 '+r.deps+' 人'); else tags.push('暂无供养');
  if(r.debt>0) tags.push('负债 '+r.debt+' 万');
  tags.push('年收入 '+r.income+' 万');

  const shareSpec = {
    slug:SLUG,
    title:'你的保额建议',
    subtitle:'需求法测算 · 答 6 题即出',
    big:{ value:'¥'+r.gap+' 万', label:'寿险缺口' },
    rows: sorted.map(rec=>({ label: PRIO[rec.prio]+' · '+rec.p.name, value: rec.amount })),
    note: why,
    tags
  };

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px', paddingBottom:'0'}},
    GG.el('h1',{style:{fontSize:'24px'}}, '🛡️ 你的保险配置建议')));
  stage.appendChild(head);
  stage.appendChild(parts);
  stage.appendChild(GG.el('div',{class:'section-t'}, '推荐险种 · 按优先级'));
  stage.appendChild(list);
  stage.appendChild(GG.el('div',{style:{height:'16px'}}));
  // ✨ 连了 key 才追加的 AI 保险点评（异步加载，缺口测算已在本地完成）
  mountAdvice(stage, r);
  stage.appendChild(GG.el('div',{style:{height:'6px'}}));
  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '把这张建议卡截图保存 ↓'), shareSpec));
  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '↻ 改改条件再算一次')
  ));
}

function partRow(label, detail, value, sub){
  return GG.el('div',{class:'row', style:{justifyContent:'space-between', gap:'10px', alignItems:'baseline'}},
    GG.el('div',null,
      GG.el('span',{style:{fontWeight:'560', color:'var(--ink-1)'}}, label),
      GG.el('span',{class:'small muted', style:{marginLeft:'8px'}}, detail)),
    GG.el('span',{style:{fontVariantNumeric:'tabular-nums', fontWeight:'650',
        color: sub ? '#8a8a93' : 'var(--ink-1)'}}, value)
  );
}

start();
})();
