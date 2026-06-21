/* origin — 财务体检。填 6 项数字 → thinking → 财务健康分(0~100) + 分项条 + 引用真实数字的下一步。 */
(function(){
const SLUG='origin';
const {FIELDS, DIM_LABEL, GRADES} = window.ORIGIN;
let main;

/* ---------- 工具 ---------- */
const yuan = n => '¥'+GG.fmt(Math.round(n));
const pctStr = n => (Math.round(n*1000)/10)+'%';      // 0.234 -> 23.4%
function gradeOf(score){ for(const g of GRADES) if(score>=g.min) return g; return GRADES[GRADES.length-1]; }

/* ---------- 引擎：把 6 个数字映射成 4 个分项 + 总分 + 下一步 ---------- */
function analyze(v){
  const {income, expense, savings, debt, emFund, age} = v;
  const surplus = income - expense;                    // 每月结余
  const savingRate = income>0 ? surplus/income : 0;    // 储蓄率
  const debtRatio  = income>0 ? debt/(income*12) : (debt>0?9:0); // 负债 / 年收入
  const spendRatio = income>0 ? expense/income : 1;    // 支出占收入

  // 各分项映射到 0~100（越高越健康）
  // 储蓄率：0% -> 0 分，30%+ -> 100 分
  const sSaving = GG.clamp(savingRate/0.30*100, 0, 100);
  // 负债/年收入：0 -> 100 分，>=4 倍 -> 0 分
  const sDebt   = GG.clamp((1 - debtRatio/4)*100, 0, 100);
  // 应急金：0 个月 -> 0，6 个月+ -> 100
  const sEmerg  = GG.clamp(emFund/6*100, 0, 100);
  // 支出占比：<=50% -> 100，>=100% -> 0
  const sSpend  = GG.clamp((1 - (spendRatio-0.5)/0.5)*100, 0, 100);

  const dims = [
    {key:'savingRate', label:DIM_LABEL.savingRate, score:sSaving, weight:0.30, raw:savingRate},
    {key:'debtRatio',  label:DIM_LABEL.debtRatio,  score:sDebt,   weight:0.25, raw:debtRatio},
    {key:'emergency',  label:DIM_LABEL.emergency,  score:sEmerg,  weight:0.25, raw:emFund},
    {key:'spendRatio', label:DIM_LABEL.spendRatio, score:sSpend,  weight:0.20, raw:spendRatio},
  ];
  const total = Math.round(dims.reduce((a,d)=>a+d.score*d.weight, 0));

  // 下一步：按最弱分项优先，引用用户真实数字
  const sorted = dims.slice().sort((a,b)=>a.score-b.score);
  const steps = sorted.slice(0,3).map(d=>stepFor(d, v, {surplus, savingRate, spendRatio, debtRatio}));

  return {total, dims, steps, surplus, savingRate, spendRatio, debtRatio, grade:gradeOf(total)};
}

// 针对某个最弱分项，生成引用真实数字的具体建议
function stepFor(d, v, m){
  const {income, expense, savings, debt, emFund} = v;
  switch(d.key){
    case 'savingRate':
      if(m.surplus<=0)
        return `【储蓄率】你每月支出 ${yuan(expense)} ≥ 收入 ${yuan(income)}，结余为负（${pctStr(m.savingRate)}）。先从最大头支出砍起，把结余做回正值是第一步。`;
      return `【储蓄率】你每月结余 ${yuan(m.surplus)}（储蓄率 ${pctStr(m.savingRate)}）。距离健康线 20% 还差一点，建议把可省的支出再压 ${yuan(Math.max(0, income*0.2 - m.surplus))}/月。`;
    case 'emergency':
      return `【应急金】你的存款 ${yuan(savings)} 只够撑 ${emFund} 个月（健康线 3~6 个月）。建议把它从 ${emFund} 个月先提到 3 个月，约需再攒 ${yuan(Math.max(0,(3-emFund)*expense))}。`;
    case 'debtRatio':
      if(debt<=0) return `【负债比】你目前没有负债，这一项很健康，保持就好。`;
      return `【负债比】你的负债 ${yuan(debt)} 约为年收入的 ${(Math.round(m.debtRatio*10)/10)} 倍（健康线 ≤2 倍）。优先还利率最高的那笔，把负债比压到年收入 2 倍以内。`;
    case 'spendRatio':
      return `【支出占比】你每月支出 ${yuan(expense)} 占收入的 ${pctStr(m.spendRatio)}（健康线 ≤70%）。锁定 1~2 项可砍的固定开销，把占比降到 70% 以下。`;
  }
}

/* ---------- AI 顾问层（附加：评分引擎永远本地确定性计算，连了 key 才叠加个性化点评） ---------- */
const ORIGIN_SYS = '你是务实、不贩卖焦虑的理财规划师。下面是用户的财务体检结果（含真实数字与各分项得分）。请给出个性化、可立即执行的建议。只输出严格 JSON：{"summary":"一句话总体点评，客观、以鼓励为主","actions":["3条具体、可执行、引用其数字的行动建议"],"watch":"一句话最该警惕的风险点"}。全部简体中文，金额用人民币，不要空话套话。';
function aiAdvice(v, R){
  const dims = R.dims.map(d=>`${d.label} ${Math.round(d.score)}分`).join('、');
  const user = `财务健康分：${R.total}（${R.grade.tag}）\n月收入¥${Math.round(v.income)}、月支出¥${Math.round(v.expense)}、每月结余¥${Math.round(R.surplus)}（储蓄率${pctStr(R.savingRate)}）\n存款¥${Math.round(v.savings)}、负债¥${Math.round(v.debt)}、应急金${v.emFund}个月、年龄${v.age}\n分项得分：${dims}`;
  return GG.llm.json(ORIGIN_SYS, user, {max_tokens:700});
}
function bullets(arr){
  return GG.el('ul',{class:'small', style:{margin:'4px 0 0', paddingLeft:'20px', color:'var(--ink-2)', lineHeight:'1.7'}},
    arr.map(t=>GG.el('li', null, t)));
}
function mountAdvice(stage, v, R){
  if(!GG.llm.connected()) return;
  const body = GG.el('div', null, GG.el('p',{class:'small muted', style:{margin:'0'}}, 'AI 正在结合你的数字给出建议…'));
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', borderLeft:'3px solid var(--accent)'}},
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '✨ AI 理财规划师点评'),
      GG.llm.badge(true)),
    body));
  aiAdvice(v, R).then(obj=>{
    GG.clear(body);
    if(obj.summary) body.appendChild(GG.el('p',{style:{margin:'0 0 10px', fontWeight:'600'}}, String(obj.summary)));
    const actions = (Array.isArray(obj.actions)?obj.actions:[]).map(String).filter(Boolean);
    if(actions.length){ body.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'4px'}}, '行动建议')); body.appendChild(bullets(actions)); }
    if(obj.watch) body.appendChild(GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}}, '⚠︎ '+String(obj.watch)));
    if(!actions.length && !obj.summary) body.appendChild(GG.el('p',{class:'small muted', style:{margin:'0'}}, '这次没生成出建议，评分与下一步不受影响。'));
  }).catch(e=>{ GG.clear(body);
    body.appendChild(GG.el('p',{class:'small muted', style:{margin:'0'}}, 'AI 建议没拿到（'+(e&&e.code||'NET')+'），你的评分与下一步不受影响。')); });
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.v){ showResult(st.v, true); return; }
  intro();
}

function intro(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '90 秒，给你的财务做次体检'),
    GG.el('p', null, '填几项数字，我把它换算成一个 0~100 的财务健康分 + 4 个分项短板，并给出引用你自己数字的下一步。评分全程本地计算、不上传；连上 AI 后再多一份个性化点评。')
  ));
  main.appendChild(GG.llm.bar());

  const form = GG.el('div',{class:'stack', style:{marginTop:'22px'}});
  const inputs = {};
  FIELDS.forEach(f=>{
    const inp = GG.el('input',{class:'field', type:'number', inputmode:'decimal',
      min:'0', placeholder:f.ph, value:''});
    inputs[f.key] = inp;
    form.appendChild(GG.el('div',{class:'card pad'},
      GG.el('label',{class:'label'}, `${f.label}（${f.unit}）`),
      inp,
      GG.el('p',{class:'small muted', style:{margin:'7px 0 0'}}, f.hint)
    ));
  });
  main.appendChild(form);

  const err = GG.el('p',{class:'small', style:{color:'#e8543f', textAlign:'center', minHeight:'20px', marginTop:'12px'}});
  main.appendChild(err);

  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'4px'}},
    GG.el('button',{class:'btn primary lg', onClick:()=>{
      const v = {};
      for(const f of FIELDS){
        const raw = inputs[f.key].value.trim();
        const n = Number(raw);
        if(raw==='' || !isFinite(n) || n<0){ err.textContent = `请把「${f.label}」填成一个 ≥0 的数字。`; inputs[f.key].focus(); return; }
        v[f.key] = n;
      }
      if(v.income<=0){ err.textContent = '月收入需要大于 0 才能体检。'; inputs.income.focus(); return; }
      err.textContent='';
      GG.encodeState({v});
      showResult(v, false);
    }}, '开始体检 →')
  ));
  // 一键填示例，方便体验（仍走完整引擎，结果随之而变）
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'10px'}},
    GG.el('button',{class:'btn', onClick:()=>{
      const demo = {income:18000, expense:11000, savings:60000, debt:120000, emFund:2, age:29};
      FIELDS.forEach(f=> inputs[f.key].value = demo[f.key]);
      err.textContent='';
    }}, '填个示例看看')
  ));
}

async function showResult(v, fromLink){
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  if(!fromLink){
    await GG.thinking(stage, [
      `读取你的月收入 ${yuan(v.income)}…`,
      `算储蓄率、负债比、应急金充足度…`,
      `对照健康基准线打分…`,
      `挑出最该先动的短板…`
    ], 1600);
  }
  const R = analyze(v);
  GG.clear(stage);

  // 头部：总分 + 评级
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, '🩺 你的财务体检报告')));

  const head = GG.el('div',{class:'card pad', style:{marginBottom:'16px',
      background:`linear-gradient(160deg,var(--accent-soft),#fff 62%)`}},
    GG.el('div',{class:'score-ring'},
      GG.el('div',{class:'bignum', style:{color:'var(--accent)'}}, String(R.total)),
      GG.el('div',null,
        GG.el('div',{style:{fontSize:'19px', fontWeight:'700'}}, '财务健康分 · '+R.grade.tag),
        GG.el('p',{class:'small muted', style:{margin:'4px 0 0'}}, R.grade.desc)
      )
    ),
    GG.el('p',{class:'small', style:{margin:'12px 0 0', color:'var(--ink-2)'}},
      `按你填的：月收入 ${yuan(v.income)}、月支出 ${yuan(v.expense)}、每月结余 ${yuan(R.surplus)}（储蓄率 ${pctStr(R.savingRate)}）、存款 ${yuan(v.savings)}、负债 ${yuan(v.debt)}、应急金 ${v.emFund} 个月。`)
  );
  stage.appendChild(head);

  // 分项条
  const barsBox = GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '分项体检'));
  R.dims.forEach(d=>{
    barsBox.appendChild(GG.el('div',{class:'bar-row'},
      GG.el('div',{class:'nm'}, d.label),
      GG.el('div',{class:'bar'}, GG.el('i',{style:{width:'0%'}})),
      GG.el('div',{class:'pct'}, Math.round(d.score)+'')
    ));
  });
  stage.appendChild(barsBox);
  // 条形入场动画：下一帧再设宽度
  requestAnimationFrame(()=>{
    GG.$$('.bar > i', barsBox).forEach((i,idx)=> i.style.width = Math.round(R.dims[idx].score)+'%');
  });

  // 下一步行动
  const stepsBox = GG.el('div',{class:'card pad'},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '下一步，从最弱的短板开始'),
    GG.el('div',{class:'stack', style:{gap:'12px'}},
      R.steps.map((s,i)=> GG.el('div',{class:'row', style:{gap:'10px', alignItems:'flex-start'}},
        GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', fontWeight:'700',
          padding:'4px 11px', borderRadius:'999px', fontSize:'13px', flex:'none'}}, String(i+1)),
        GG.el('p',{class:'small', style:{margin:'0', color:'var(--ink)', lineHeight:'1.65'}}, s)
      ))
    )
  );
  stage.appendChild(stepsBox);

  // 🎚 「假如每月多存」杠杆：实时投影健康分（纯本地沙盘，不改上面的结果）
  const maxExtra = Math.max(2000, Math.round(v.income*0.4/500)*500);
  const extraVal = GG.el('span',{style:{fontWeight:'800', color:'var(--accent)'}}, '¥0');
  const proj = GG.el('div',{style:{fontSize:'15px', fontWeight:'600'}});
  function updateProj(extra){
    const nt = analyze(Object.assign({}, v, {expense: Math.max(0, v.expense - extra)})).total;
    const d = nt - R.total;
    GG.clear(proj);
    proj.appendChild(document.createTextNode('财务健康分 '+R.total+' → '));
    proj.appendChild(GG.el('span',{style:{fontWeight:'800', color: d>=0?'#2e9e7b':'#e8543f', fontSize:'22px'}}, String(nt)));
    proj.appendChild(GG.el('span',{class:'small muted', style:{marginLeft:'8px'}}, d>0?('+'+d+' 分'):(d<0?(d+' 分'):'持平')));
  }
  updateProj(0);
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'16px', marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '🎚 假如每月多存一点'),
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'baseline', marginBottom:'6px'}},
      GG.el('span',{class:'small muted'}, '每月少花、多存'), extraVal),
    GG.el('input',{type:'range', min:'0', max:String(maxExtra), step:'500', value:'0',
      style:{width:'100%', accentColor:'var(--accent)', cursor:'pointer'},
      onInput:e=>{ const x=+e.target.value; extraVal.textContent='¥'+GG.fmt(x); updateProj(x); }}),
    GG.el('div',{style:{marginTop:'12px'}}, proj),
    GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}}, '拖一拖看每月多存一点，健康分能到多少（仅测算，不改上面的结果）。')
  ));

  // ✨ 连了 key 才追加的 AI 理财点评（异步加载，评分/下一步已在本地完成）
  mountAdvice(stage, v, R);

  // 分享卡
  const shareSpec = {
    slug:SLUG,
    title:'我的财务健康分',
    big:{value:R.total, label:'分 · '+R.grade.tag},
    bars: R.dims.map(d=>({label:d.label, pct:d.score})),
    note: R.steps[0],
    tags: [
      '储蓄率'+pctStr(R.savingRate),
      '应急金'+v.emFund+'个月',
      '支出占比'+pctStr(R.spendRatio),
    ],
  };
  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '截图分享你的财务体检结果 ↓'),
    shareSpec));

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '↻ 改几个数字重测')
  ));
}

start();
})();
