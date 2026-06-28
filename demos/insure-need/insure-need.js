/* insure-need — 答几个生活问题 → 需求法算寿险缺口 + 重疾额度 + 险种优先级，再 +1「💰 保费预算体检」。
   引擎：寿险缺口 = 收入替代 + 负债 + 子女教育 − 已有保额（下限 0）；重疾 ≈ 3~5 年收入。
   +1：别家只给「该买多少保额」，靠卖产品赚钱、不肯说成本；这里把保额翻译成估算年保费 →
       占年收入百分比 vs「双十原则」健康线（≤10%）→ 钱不够先买哪个的投保顺序 + 反常识「先保大人再保小孩」。
   所有保额/缺口本地确定性即时算；保费为粗略估算仅示意（强免责）；连 key 才叠加 AI 个性化点评。 */
(function(){
const SLUG='insure-need';
const {PRODUCTS, PRIO} = window.INSURE;
let main;

/* ---------- 表单状态 ---------- */
const DEF = { age:32, income:30, deps:1, kids:1, debt:80, have:50 };
const Q = [
  { key:'age',    label:'你的年龄',                 unit:'岁',   min:18, max:70, step:1,  hint:'越年轻、要养家的年头越长（保费也越便宜）' },
  { key:'income', label:'你的年收入（税后）',        unit:'万元', min:0,  max:300, step:1, hint:'家庭主要靠你赚多少' },
  { key:'deps',   label:'需要靠你供养的人数',        unit:'人',   min:0,  max:6,  step:1,  hint:'父母 / 配偶 / 子女等' },
  { key:'kids',   label:'其中未成年子女数',          unit:'个',   min:0,  max:5,  step:1,  hint:'有小孩要备一笔教育金' },
  { key:'debt',   label:'房贷及其他负债余额',        unit:'万元', min:0,  max:1000,step:5,  hint:'你走后家人要替你还的钱' },
  { key:'have',   label:'你已有的寿险/身故类保额',   unit:'万元', min:0,  max:1000,step:5,  hint:'公司团险 + 自己买的合计' },
];

/* ---------- 缺口引擎 ---------- */
function engine(s){
  const age = GG.clamp(+s.age||0, 18, 70);
  const income = Math.max(0, +s.income||0);
  const deps = Math.max(0, +s.deps||0);
  const kids = Math.max(0, +s.kids||0);
  const debt = Math.max(0, +s.debt||0);
  const have = Math.max(0, +s.have||0);

  let years = GG.clamp(Math.round((62 - age) * 0.55), 3, 22);
  if(kids>0)  years += Math.min(6, 2 + kids);
  if(deps>kids) years += Math.min(3, deps - kids);
  years = GG.clamp(years, 3, 28);

  const incomePart = income * years;
  const eduPart    = kids * 60;
  const debtPart   = debt;
  const need = incomePart + eduPart + debtPart;
  const gap  = Math.max(0, Math.round(need - have));

  let ciMul = 3;
  if(kids>0) ciMul += 1;
  if(debt >= income*3 && income>0) ciMul += 1;
  ciMul = GG.clamp(ciMul, 3, 5);
  const ci = Math.round(income * ciMul) || 30;

  return { age, income, deps, kids, debt, have, years, incomePart, eduPart, debtPart, need, gap, ci, ciMul };
}

function recommend(r){
  const lifePrio = r.gap > 0 ? (r.gap >= 100 || r.deps>0 ? 'must' : 'strong')
                             : (r.deps>0 ? 'option' : 'skip');
  const ciPrio   = r.income>0 ? (r.kids>0 || r.deps>0 ? 'must' : 'strong') : 'strong';
  const medPrio  = 'must';
  const accPrio  = r.deps>0 || r.debt>0 ? 'strong' : 'option';
  return [
    { p:PRODUCTS.life,    prio:lifePrio, amount: r.gap>0 ? `约 ¥${r.gap} 万` : '已基本充足' },
    { p:PRODUCTS.ci,      prio:ciPrio,   amount: `约 ¥${r.ci} 万（≈${r.ciMul} 年收入）` },
    { p:PRODUCTS.medical, prio:medPrio,  amount: '百万级（按年续）' },
    { p:PRODUCTS.accident,prio:accPrio,  amount: r.deps>0||r.debt>0 ? '¥50~100 万' : '¥30~50 万' },
  ];
}

/* ---------- +1 保费引擎（粗略估算 · 元/年，仅示意） ----------
   费率随年龄上升；定寿杠杆最高最便宜、重疾最贵、医疗意外较平。 */
function premiums(r){
  const a = r.age;
  const lifeRate = 14 + Math.max(0, a-28) * 2.2;   // 元/万/年（定期寿险）
  const ciRate   = 95 + Math.max(0, a-28) * 10;    // 元/万/年（重疾，按定期到 70 估）
  const medFee   = Math.round(280 + Math.max(0, a-30) * 22);   // 百万医疗 平摊
  const accFee   = 260;                                         // 意外 平摊
  const life = r.gap>0 ? Math.round(r.gap * lifeRate) : 0;
  const ci   = Math.round(r.ci * ciRate);
  const total = life + ci + medFee + accFee;
  const byKey = { life, ci, medical:medFee, accident:accFee };
  const pct = r.income>0 ? (total / (r.income*10000) * 100) : null;   // 占年收入%
  return { life, ci, medical:medFee, accident:accFee, total, byKey, pct };
}
function fmtY(n){ return n>=10000 ? ('¥'+(n/10000).toFixed(n%10000?1:0)+' 万') : ('¥'+n.toLocaleString('zh-CN')); }
function premBand(pct){
  if(pct==null) return { t:'未填收入', c:'#8a8a93' };
  if(pct<=6)  return { t:'宽松', c:'#2e9e7b' };
  if(pct<=10) return { t:'合理', c:'#2e9e7b' };
  if(pct<=15) return { t:'偏重', c:'#d98a2b' };
  return { t:'吃力', c:'#d64545' };
}

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

/* ---------- AI 顾问层（附加） ---------- */
const INSURE_SYS = '你是中立、不推销具体产品的保险规划师。下面是用户用需求法算出的保障缺口与家庭情况。请给出个性化、可执行的投保建议与提醒。只输出严格 JSON：{"summary":"一句话总体点评","tips":["3条具体的投保/避坑建议，引用其家庭情况与缺口"],"watch":"一句话最该注意的点，如健康告知或预算分配"}。不要推荐具体保险公司或产品名，全部简体中文。';
function aiAdvice(r, pm){
  const user = `寿险缺口：¥${r.gap}万（需求¥${r.need}万 − 已有¥${r.have}万）\n重疾建议：¥${r.ci}万（≈${r.ciMul}年收入）\n年龄${r.age}、年收入¥${r.income}万、供养${r.deps}人（其中未成年子女${r.kids}）、负债¥${r.debt}万\n按建议全配估算年保费约¥${Math.round(pm.total)}元${pm.pct!=null?('（占年收入'+pm.pct.toFixed(1)+'%）'):''}`;
  return GG.llm.json(INSURE_SYS, user, {max_tokens:700});
}
function bullets(arr){
  return GG.el('ul',{class:'small', style:{margin:'4px 0 0', paddingLeft:'20px', color:'var(--ink-2)', lineHeight:'1.7'}},
    arr.map(t=>GG.el('li', null, t)));
}
function mountAdvice(stage, r, pm){
  if(!GG.llm.connected()) return;
  const body = GG.el('div', null, GG.el('p',{class:'small muted', style:{margin:'0'}}, 'AI 正在结合你的情况给出建议…'));
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', borderLeft:'3px solid var(--accent)'}},
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '✨ AI 保险顾问点评'),
      GG.llm.badge(true)),
    body));
  aiAdvice(r, pm).then(obj=>{
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
  injectStyles();
  const st = GG.decodeState();
  if(st && st.v){ showResult(Object.assign({}, DEF, st.v), true); return; }
  welcome();
}

/* 第 0 步：品牌欢迎门面 */
function welcome(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'in-gate'},
    GG.el('div',{class:'in-gate-head'},
      GG.el('div',{class:'in-gate-glyph'}, '🛡️'),
      GG.el('div',{class:'in-gate-name'}, '该买多少保'),
      GG.el('div',{class:'in-gate-tag'}, '别再被销售牵着走')),
    GG.el('div',{class:'in-gate-body'},
      GG.el('div',{class:'in-hook'}, '保险该买多少、一年花多少才合适？'),
      GG.el('p',{class:'in-sub'}, '答 6 个生活问题，用「需求法」当场算出你的寿险缺口、重疾额度、该先配哪几个险种——还会把保额翻译成「一年大概多少钱、占你收入几成、钱不够先买哪个」。'),
      GG.el('button',{class:'in-cta', onClick:intro}, '🛡️ 开始测算（约 1 分钟）→'),
      GG.el('div',{class:'in-priv'}, '🔒 纯本地测算 · 答案只在这台浏览器，不上传服务器 · 仅作参考，非保险销售建议')
    )
  ));
}

function intro(){
  GG.clear(main);
  const s = Object.assign({}, DEF);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '答 6 个问题，算你该买多少保'),
    GG.el('p', null, '拖动下面的滑块，填上你的真实情况。用「需求法」当场算缺口、给优先级，再帮你看看一年要花多少、负担不负担得起。')
  ));

  const form = GG.el('div',{class:'stack', style:{marginTop:'18px'}});
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
      '估算年保费、做预算体检…'
    ], 1600);
  }
  const r = engine(s);
  const recs = recommend(r);
  const pm = premiums(r);
  const why = reason(r);
  GG.encodeState({v: s});
  GG.clear(stage);

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px', paddingBottom:'0'}},
    GG.el('h1',{style:{fontSize:'24px'}}, '🛡️ 你的保险配置建议')));
  stage.appendChild(GG.el('div',{style:{margin:'0 0 12px'}}, GG.llm.bar()));

  // 头部缺口卡
  const gapColor = r.gap>0 ? 'var(--accent)' : '#2e9e7b';
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px',
      background:`linear-gradient(160deg, var(--accent-soft), #fff 62%)`}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '你的寿险缺口'),
    GG.el('div',{style:{display:'flex', alignItems:'baseline', gap:'10px', flexWrap:'wrap'}},
      GG.el('div',{class:'bignum', style:{color:gapColor}}, r.gap>0 ? ('¥'+r.gap+' 万') : '已充足 ✓'),
      r.gap>0 ? GG.el('span',{class:'small muted'}, '（需求 ¥'+r.need+' 万 − 已有 ¥'+r.have+' 万）') : null),
    GG.el('p',{class:'small', style:{margin:'12px 0 0', color:'var(--ink-2)', lineHeight:'1.6'}}, why)
  ));

  // 「再补一点保额」沙盘
  if(r.gap>0){
    const maxAdd = Math.ceil(r.gap);
    const addVal = GG.el('span',{style:{fontWeight:'800', color:'var(--accent)'}}, '¥0 万');
    const remain = GG.el('div',{style:{fontSize:'15px', fontWeight:'600'}});
    const upd = x=>{
      const ng = Math.max(0, r.need - (r.have + x));
      GG.clear(remain);
      if(ng<=0){ remain.appendChild(GG.el('span',{style:{color:'#2e9e7b', fontWeight:'800', fontSize:'19px'}}, '✓ 缺口已补齐')); }
      else { remain.appendChild(document.createTextNode('剩余寿险缺口 '));
        remain.appendChild(GG.el('span',{style:{color:'var(--accent)', fontWeight:'800', fontSize:'20px'}}, '¥'+ng+' 万')); }
    };
    upd(0);
    stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '🎚 假如再补一点保额'),
      GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'baseline', marginBottom:'6px'}},
        GG.el('span',{class:'small muted'}, '再补寿险保额'), addVal),
      GG.el('input',{type:'range', min:'0', max:String(maxAdd), step:'1', value:'0',
        style:{width:'100%', accentColor:'var(--accent)', cursor:'pointer'},
        onInput:e=>{ const x=+e.target.value; addVal.textContent='¥'+x+' 万'; upd(x); }}),
      GG.el('div',{style:{marginTop:'12px'}}, remain),
      GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}}, '拖一拖看再加多少保额能把缺口补到 0（仅测算，不改上面的结果）。')
    ));
  }

  // 缺口构成拆解
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '缺口怎么算出来的'),
    GG.el('div',{class:'stack', style:{gap:'8px'}},
      partRow('收入替代', `${r.years} 年 × ¥${r.income} 万`, '¥'+r.incomePart+' 万'),
      partRow('子女教育准备', r.kids>0 ? `${r.kids} 个孩子 × ¥60 万` : '无未成年子女', '¥'+r.eduPart+' 万'),
      partRow('负债 / 房贷', r.debt>0 ? '需替家人偿还' : '无', '¥'+r.debtPart+' 万'),
      partRow('已有保额', r.have>0 ? '从需求中扣除' : '尚无', '− ¥'+r.have+' 万', true)
    )
  ));

  // 险种推荐（带 ¥/年）
  const order = {must:0, strong:1, option:2, skip:3};
  const sorted = recs.slice().sort((a,b)=>order[a.prio]-order[b.prio]);
  stage.appendChild(GG.el('div',{class:'section-t'}, '推荐险种 · 按优先级'));
  const list = GG.el('div',{class:'stack'});
  sorted.forEach(rec=>{
    const tagBg = rec.prio==='must' ? 'var(--accent)' : (rec.prio==='strong' ? '#2e9e7b'
                 : (rec.prio==='skip' ? '#b0b0b8' : '#8a8a93'));
    const yr = pm.byKey[rec.p.key];
    const yrTxt = (rec.p.key==='life' && r.gap<=0) ? '' : ('约 '+fmtY(yr)+'/年');
    list.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'14px', alignItems:'flex-start', flexWrap:'wrap'}},
      GG.el('span',{class:'pill', style:{background:tagBg, color:'#fff', fontWeight:'700', padding:'5px 12px',
          borderRadius:'999px', fontSize:'13px', flex:'none'}}, PRIO[rec.prio]),
      GG.el('div',{style:{flex:'1', minWidth:'200px'}},
        GG.el('div',{class:'row', style:{justifyContent:'space-between', gap:'10px', alignItems:'baseline'}},
          GG.el('h3',{style:{fontSize:'18px'}}, rec.p.name),
          GG.el('span',{style:{fontWeight:'700', color:'var(--ink-1)'}}, rec.amount)),
        GG.el('p',{class:'small muted', style:{margin:'6px 0 0', lineHeight:'1.55'}}, rec.p.desc),
        yrTxt ? GG.el('div',{class:'in-yr'}, '💸 估算保费 '+yrTxt) : null)
    ));
  });
  stage.appendChild(list);
  stage.appendChild(GG.el('div',{style:{height:'16px'}}));

  // +1：保费预算体检
  stage.appendChild(premiumCard(r, pm));

  // ✨ AI 点评
  mountAdvice(stage, r, pm);
  stage.appendChild(GG.el('div',{style:{height:'6px'}}));

  // 分享卡
  const tags = [];
  tags.push(r.age+' 岁');
  if(r.kids>0) tags.push(r.kids+' 娃'); else if(r.deps>0) tags.push('供养 '+r.deps+' 人'); else tags.push('暂无供养');
  if(r.debt>0) tags.push('负债 '+r.debt+' 万');
  tags.push('年收入 '+r.income+' 万');
  const shareSpec = {
    slug:SLUG, title:'你的保额建议', subtitle:'需求法测算 · 答 6 题即出',
    big:{ value:'¥'+r.gap+' 万', label:'寿险缺口' },
    bars: pm.pct!=null ? [{ label:'保费占年收入', pct: Math.min(100, Math.round(pm.pct)), color: premBand(pm.pct).c }] : [],
    rows: sorted.map(rec=>({ label: PRIO[rec.prio]+' · '+rec.p.name, value: rec.amount })),
    note: why + (pm.pct!=null? ` 按建议全配约 ${fmtY(pm.total)}/年，占收入 ${pm.pct.toFixed(1)}%。`:''),
    tags
  };
  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '把这张建议卡截图保存 ↓'), shareSpec));
  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '↻ 改改条件再算一次')
  ));
}

/* +1：保费预算体检卡 —— 总保费 + 占收入% vs 双十健康线 + 钱不够先买哪个 + 先保大人再保小孩 */
function premiumCard(r, pm){
  const band = premBand(pm.pct);
  const card = GG.el('div',{class:'card pad', style:{marginBottom:'16px', borderTop:'3px solid var(--accent)'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '💰 一年大概多少钱 · 保费预算体检'));

  // 总额 + 占比
  card.appendChild(GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'baseline', flexWrap:'wrap', gap:'8px'}},
    GG.el('div',{style:{display:'flex', alignItems:'baseline', gap:'8px'}},
      GG.el('span',{class:'bignum', style:{fontSize:'30px'}}, fmtY(pm.total)),
      GG.el('span',{class:'small muted'}, '/ 年（全配估算）')),
    pm.pct!=null ? GG.el('span',{class:'in-band', style:{background:band.c}}, '占年收入 '+pm.pct.toFixed(1)+'% · '+band.t) : null
  ));

  // 双十健康线刻度
  if(pm.pct!=null){
    const scaleMax = Math.max(16, Math.ceil(pm.pct*1.25));
    const pos = v => GG.clamp(v/scaleMax*100, 0, 100);
    card.appendChild(GG.el('div',{style:{position:'relative', height:'30px', margin:'14px 0 4px'}},
      GG.el('div',{class:'in-track'}),
      GG.el('div',{class:'in-fill', style:{width:pos(pm.pct)+'%', background:band.c}}),
      // 10% 健康线
      GG.el('div',{class:'in-line', style:{left:pos(10)+'%'}}),
      GG.el('div',{class:'in-line-lab', style:{left:pos(10)+'%'}}, '双十线 10%')
    ));
    card.appendChild(GG.el('p',{class:'small muted', style:{margin:'14px 0 0', lineHeight:'1.6'}},
      pm.pct<=10
        ? `保费占收入约 ${pm.pct.toFixed(1)}%，在「双十原则」的健康线（≤10%）以内，负担合理。`
        : `保费占收入约 ${pm.pct.toFixed(1)}%，超过了「双十原则」健康线（保费≤年收入 10%）。预算紧的话，按下面顺序分批配，别一次扛满。`));
  } else {
    card.appendChild(GG.el('p',{class:'small muted', style:{margin:'12px 0 0'}},
      '没填年收入，先按保额估了年保费。填上收入能看「保费占收入几成」是否在健康线内。'));
  }

  // 钱不够先买哪个
  const seq = [];
  seq.push({ n:'①', t:'百万医疗 + 意外', y:fmtY(pm.medical+pm.accident), d:'一年几百块就先兜住大病住院和意外，性价比最高，谁都先配。' });
  if(r.gap>0) seq.push({ n:'②', t:'定期寿险', y:fmtY(pm.life), d:`你是家庭顶梁柱，杠杆最高最便宜——${r.gap} 万保额一年也就这个数，先补缺口。` });
  seq.push({ n: r.gap>0?'③':'②', t:'重疾险', y:fmtY(pm.ci)+'，最贵', d:'确诊即赔，但保费最高。预算够再补足；紧的话先买定期重疾或先保 30~50 万。' });

  card.appendChild(GG.el('div',{class:'in-seq-h'}, '💡 钱不够，先买哪个'));
  const seqWrap = GG.el('div',{class:'stack', style:{gap:'8px'}});
  seq.forEach(x=> seqWrap.appendChild(GG.el('div',{class:'in-seq'},
    GG.el('span',{class:'in-seq-n'}, x.n),
    GG.el('div',{style:{flex:'1', minWidth:'0'}},
      GG.el('div',{class:'row', style:{justifyContent:'space-between', gap:'8px', alignItems:'baseline', flexWrap:'wrap'}},
        GG.el('span',{style:{fontWeight:'700'}}, x.t),
        GG.el('span',{class:'small', style:{color:'var(--accent)', fontWeight:'700', whiteSpace:'nowrap'}}, x.y+'/年')),
      GG.el('p',{class:'small muted', style:{margin:'3px 0 0', lineHeight:'1.55'}}, x.d))
  )));
  card.appendChild(seqWrap);

  // 反常识：先保大人再保小孩
  if(r.kids>0){
    card.appendChild(GG.el('div',{class:'in-myth'},
      GG.el('div',{class:'in-myth-t'}, '🧒 反常识：先保大人，再保小孩'),
      GG.el('p',{style:{margin:'4px 0 0', lineHeight:'1.6', fontSize:'13.5px'}},
        `很多家庭本能想先给 ${r.kids} 个孩子买齐——但你才是孩子最大的「保单」。大人（尤其顶梁柱）的寿险、重疾没配齐前，先补自己，钱要花在刀刃上。`)));
  }

  // 免责
  card.appendChild(GG.el('p',{class:'small', style:{margin:'12px 0 0', color:'#b0b0b8', lineHeight:'1.5'}},
    '＊保费为按年龄/保额的粗略估算，仅作量级示意；实际以产品条款、健康告知、保障期限为准。'));
  return card;
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

/* ---------- 样式（JS 注入，不动 index.html） ---------- */
function injectStyles(){
  if(GG.$('#in-style')) return;
  const css = `
  .in-gate{ max-width:460px; margin:8px auto 0; border:1px solid var(--line); border-radius:20px;
    overflow:hidden; background:var(--surface); box-shadow:var(--sh-1); }
  .in-gate-head{ padding:28px 24px 24px; text-align:center; color:#fff;
    background:linear-gradient(150deg, var(--accent), color-mix(in srgb, var(--accent) 60%, #0c2c40)); }
  .in-gate-glyph{ font-size:44px; line-height:1; }
  .in-gate-name{ font-size:22px; font-weight:800; margin-top:10px; letter-spacing:.5px; }
  .in-gate-tag{ font-size:13.5px; opacity:.92; margin-top:6px; }
  .in-gate-body{ padding:22px 22px 24px; }
  .in-hook{ font-size:18px; font-weight:800; color:var(--ink-1,#1d1d1f); text-align:center; line-height:1.5; }
  .in-sub{ font-size:13.5px; color:var(--ink-2); line-height:1.7; margin:10px 0 18px; text-align:center; }
  .in-cta{ display:block; width:100%; box-sizing:border-box; padding:14px; border:none; border-radius:14px;
    background:var(--accent); color:#fff; font-size:16px; font-weight:700; cursor:pointer; transition:.15s; }
  .in-cta:hover{ filter:brightness(1.05); transform:translateY(-1px); }
  .in-priv{ font-size:11.5px; color:var(--ink-soft,#8a8a93); text-align:center; margin-top:14px; line-height:1.55; }
  .in-yr{ display:inline-block; margin-top:8px; font-size:12.5px; font-weight:700; color:var(--accent);
    background:var(--accent-soft); border-radius:8px; padding:3px 10px; }
  .in-band{ color:#fff; font-weight:700; font-size:12.5px; padding:4px 12px; border-radius:999px; white-space:nowrap; }
  .in-track{ position:absolute; top:13px; left:0; right:0; height:6px; border-radius:3px; background:var(--line); }
  .in-fill{ position:absolute; top:13px; left:0; height:6px; border-radius:3px; transition:width .9s cubic-bezier(.2,.7,.2,1); }
  .in-line{ position:absolute; top:7px; width:2px; height:18px; background:#1d1d1f; opacity:.55; transform:translateX(-1px); }
  .in-line-lab{ position:absolute; top:-2px; font-size:10.5px; color:var(--ink-2); transform:translateX(-50%); white-space:nowrap; }
  .in-seq-h{ font-weight:800; font-size:15px; color:var(--ink-1,#1d1d1f); margin:18px 0 8px; }
  .in-seq{ display:flex; gap:12px; align-items:flex-start; padding:10px 12px; border:1px solid var(--line); border-radius:12px; background:var(--surface); }
  .in-seq-n{ flex:none; font-size:18px; font-weight:800; color:var(--accent); line-height:1.3; }
  .in-myth{ margin-top:16px; padding:14px 16px; border-radius:12px;
    background:linear-gradient(135deg, var(--accent-soft), #fff 75%); border:1px solid var(--accent); }
  .in-myth-t{ font-weight:800; font-size:14.5px; color:var(--ink-1,#1d1d1f); }
  `;
  document.head.appendChild(GG.el('style',{id:'in-style', html:css}));
}

start();
})();
