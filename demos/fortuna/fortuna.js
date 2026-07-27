/* fortuna — AI 财务管家：把「财务体检」和「智能配置」打通成目标驱动的闭环规划器。
   链路：财务快照 → 体检健康分 → 风险画像(意愿×能力) → 设目标(金额+期限)
        → 风险等级对应资产配置 → 蒙特卡洛(1000次)算目标达成概率 + p10/p50/p90 扇形带
        → 按理财金字塔排序的行动计划 → (连了 key)AI 顾问解读。
   引擎全本地、确定性、可复现(蒙特卡洛用输入做种子)；AI 仅叠加解读，没 key 也能完整玩。
   ⚠ 全程为产品原型演示与测算，非投资建议、不构成要约；市场假设为简化模型，不预示未来收益。 */
(function(){
const SLUG = 'fortuna';
const { SNAPSHOT, RISK_Q, ASSETS, LEVELS, GRADES, GOALS } = window.FORTUNA;
const N_PATHS = 1000;
let main;

/* ---------------- 工具 ---------------- */
const yuan = n => '¥'+GG.fmt(Math.round(n));
const enWan = n => n>=1e6 ? (n/1e6).toFixed(n>=1e7?0:1)+'M' : (n/1000).toFixed(0)+'k';
const wan  = n => GG.EN ? enWan(n) : (n/10000).toFixed(n>=1000000?0:1)+' 万';
const pctStr = n => (Math.round(n*1000)/10)+'%';
function gradeOf(s){ for(const g of GRADES) if(s>=g.min) return g; return GRADES[GRADES.length-1]; }
function levelOf(s){ let lv=LEVELS[0]; for(const l of LEVELS) if(s>=l.min) lv=l; return lv; }

/* ---------------- 引擎：体检快照 ---------------- */
function analyze(v){
  const surplus = v.income - v.expense;
  const savingRate = v.income>0 ? surplus/v.income : 0;
  const emMonths  = v.expense>0 ? v.cash/v.expense : (v.cash>0?99:0);
  const debtRatio = v.income>0 ? v.debt/(v.income*12) : (v.debt>0?9:0);
  const spendRatio= v.income>0 ? v.expense/v.income : 1;
  const netWorth  = v.cash + v.invested - v.debt;

  const sSaving = GG.clamp(savingRate/0.30*100, 0, 100);
  const sDebt   = GG.clamp((1 - debtRatio/4)*100, 0, 100);
  const sEmerg  = GG.clamp(emMonths/6*100, 0, 100);
  const sSpend  = GG.clamp((1 - (spendRatio-0.5)/0.5)*100, 0, 100);
  const dims = [
    { key:'savingRate', label:GG.T('储蓄率','Savings rate'),  score:sSaving, weight:0.30, raw:savingRate },
    { key:'debtRatio',  label:GG.T('负债比','Debt ratio'),  score:sDebt,   weight:0.25, raw:debtRatio },
    { key:'emergency',  label:GG.T('应急金','Emergency fund'),  score:sEmerg,  weight:0.25, raw:emMonths },
    { key:'spendRatio', label:GG.T('支出占比','Spending share'),score:sSpend,  weight:0.20, raw:spendRatio },
  ];
  const total = Math.round(dims.reduce((a,d)=>a+d.score*d.weight,0));
  return { surplus, savingRate, emMonths, debtRatio, spendRatio, netWorth, dims, total, grade:gradeOf(total) };
}

/* ---------------- 引擎：风险画像（意愿 × 能力） ---------------- */
function willingness(ans){
  let s=0,n=0; RISK_Q.forEach(q=>{ const o=q.options[ans[q.id]]; if(o){ s+=o.score; n++; } });
  return n? s/n : 50;
}
// 风险「能力」：客观推算（年龄越小、期限越长、应急金越足、负债越低 → 能力越高）
function capacity(v, horizonY, A){
  let c = 55;
  c += (33 - v.age);                              // 年龄
  c += GG.clamp((horizonY-2)*3.5, -14, 30);       // 投资期限
  c += GG.clamp((A.emMonths-3)*3, -15, 12);       // 应急缓冲
  c -= GG.clamp(A.debtRatio*12, 0, 22);           // 杠杆
  return GG.clamp(c, 0, 100);
}
function riskProfile(v, ans, horizonY, A){
  const w = willingness(ans);
  const cap = capacity(v, horizonY, A);
  // 取两者较低者为上限：不让人冒超过「胃口」或「家底」所能承受的险
  let score = 0.45*w + 0.55*cap;
  if(score > w+12) score = (score + w+12)/2;
  score = Math.round(GG.clamp(score, 0, 100));
  return { willingness:Math.round(w), capacity:Math.round(cap), score, level:levelOf(score) };
}

/* ---------------- 引擎：资产配置 ---------------- */
function allocation(score){
  const t = GG.clamp(score,0,100)/100;
  const raw = { stock:8+t*72, alt:4+t*16, bond:70-t*60, cash:18-t*16 };
  const tot = raw.stock+raw.alt+raw.bond+raw.cash;
  const out = {}; ASSETS.forEach(a=> out[a.key]=raw[a.key]/tot*100); return out;
}
function blended(alloc, field){ let r=0; ASSETS.forEach(a=> r+=alloc[a.key]/100*a[field]); return r; }

/* ---------------- 引擎：蒙特卡洛（可复现） ---------------- */
function gauss(rng){ let u=0,v=0; while(u===0)u=rng(); while(v===0)v=rng();
  return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function monteCarlo(initial, monthly, years, r, vol, target, seed){
  const months = Math.max(1, Math.round(years*12));
  const mMean = r/12, mVol = vol/Math.sqrt(12);
  const byYear = Array.from({length:years+1}, ()=> new Float64Array(N_PATHS));
  const rng = GG.rng(seed>>>0);
  let success = 0;
  for(let p=0;p<N_PATHS;p++){
    let val = initial; byYear[0][p] = val;
    for(let m=1;m<=months;m++){
      val = val*(1 + mMean + mVol*gauss(rng)) + monthly;
      if(val<0) val=0;
      if(m%12===0 && m/12<=years) byYear[m/12][p] = val;
    }
    if(months % 12 !== 0) byYear[years][p] = val;   // 收尾年
    if(val >= target) success++;
  }
  const pct = q => byYear.map(arr=>{ const a=Array.from(arr).sort((x,y)=>x-y); return a[Math.floor(q*(a.length-1))]; });
  return { prob:success/N_PATHS, p10:pct(0.10), p50:pct(0.50), p90:pct(0.90), years };
}

/* ---------------- 图：配置环形 ---------------- */
function donut(alloc){
  const W=200,R=84,IR=48,cx=W/2,cy=W/2; let a0=-Math.PI/2; const seg=[];
  ASSETS.forEach(a=>{ const f=alloc[a.key]/100; if(f<=0.0006) return;
    const a1=a0+f*Math.PI*2, large=(a1-a0)>Math.PI?1:0;
    const x0=cx+R*Math.cos(a0),y0=cy+R*Math.sin(a0), x1=cx+R*Math.cos(a1),y1=cy+R*Math.sin(a1);
    const xi1=cx+IR*Math.cos(a1),yi1=cy+IR*Math.sin(a1), xi0=cx+IR*Math.cos(a0),yi0=cy+IR*Math.sin(a0);
    seg.push(`<path d="M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${IR} ${IR} 0 ${large} 0 ${xi0} ${yi0} Z" fill="${a.color}"><title>${a.label} ${alloc[a.key].toFixed(1)}%</title></path>`);
    a0=a1; });
  return `<svg viewBox="0 0 ${W} ${W}" width="100%" style="display:block;max-width:210px;margin:0 auto">${seg.join('')}
    <text x="${cx}" y="${cy-4}" text-anchor="middle" font-size="12" fill="#8a8a93">${GG.T('权益占比','Equity share')}</text>
    <text x="${cx}" y="${cy+18}" text-anchor="middle" font-size="22" font-weight="800" fill="#1d1d1f">${Math.round(alloc.stock+alloc.alt)}%</text></svg>`;
}

/* ---------------- 图：蒙特卡洛扇形带 ---------------- */
function fanChart(mc, target){
  const years=mc.years, W=440,H=230,padL=46,padB=28,padT=14,padR=14;
  const plotW=W-padL-padR, plotH=H-padT-padB;
  const yMax = Math.max(mc.p90[years], target, 1) * 1.12;
  const X=i=>padL+plotW*(i/years), Y=val=>padT+plotH*(1-val/yMax);
  const line=arr=>{ let s=''; for(let i=0;i<=years;i++) s+=`${X(i)},${Y(arr[i])} `; return s.trim(); };
  let band=''; for(let i=0;i<=years;i++) band+=`${X(i)},${Y(mc.p90[i])} `;
  for(let i=years;i>=0;i--) band+=`${X(i)},${Y(mc.p10[i])} `;
  let grid=''; for(let g=0;g<=4;g++){ const val=yMax*g/4,y=Y(val);
    grid+=`<line x1="${padL}" y1="${y}" x2="${W-padR}" y2="${y}" stroke="#eee"/>`;
    grid+=`<text x="${padL-6}" y="${y+4}" text-anchor="end" font-size="10" fill="#a0a0a8">${GG.EN?enWan(val):(val/10000).toFixed(0)+'万'}</text>`; }
  let xlab=''; const step=Math.max(1,Math.round(years/5));
  for(let i=0;i<=years;i+=step) xlab+=`<text x="${X(i)}" y="${H-9}" text-anchor="middle" font-size="10" fill="#a0a0a8">${i}${GG.T('年','y')}</text>`;
  const ty=Y(target), acc='#1f9e8f';
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">${grid}
    <polygon points="${band}" fill="${acc}" opacity="0.13"/>
    <polyline points="${line(mc.p10)}" fill="none" stroke="${acc}" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.6"/>
    <polyline points="${line(mc.p90)}" fill="none" stroke="${acc}" stroke-width="1.2" stroke-dasharray="4 3" opacity="0.6"/>
    <polyline points="${line(mc.p50)}" fill="none" stroke="${acc}" stroke-width="2.6"/>
    <line x1="${padL}" y1="${ty}" x2="${W-padR}" y2="${ty}" stroke="#e8543f" stroke-width="1.4" stroke-dasharray="6 3"/>
    <text x="${W-padR}" y="${ty-5}" text-anchor="end" font-size="10.5" fill="#e8543f" font-weight="700">${GG.T('目标 ','Target ')}${GG.EN?enWan(target):(target/10000).toFixed(0)+'万'}</text>
    ${xlab}</svg>`;
}

/* ---------------- 目标默认值 ---------------- */
function defaultTarget(key, v){
  const annual = v.expense*12;
  if(key==='emergency') return Math.max(10000, Math.round(v.expense*6));
  if(key==='house')     return 800000;
  if(key==='edu')       return 600000;
  if(key==='retire')    return Math.max(1000000, Math.round(annual*25));   // 4% 法则
  return Math.max(500000, Math.round((v.cash+v.invested)*3));              // grow
}
function defaultHorizon(key, v){
  if(key==='emergency') return 1;
  if(key==='house')     return 5;
  if(key==='edu')       return 12;
  if(key==='retire')    return GG.clamp(60 - v.age, 5, 40);
  return 10;
}

/* ---------------- 状态 ---------------- */
let V = null;                 // 快照
let goalKey = 'house', target = 0, horizonY = 5, monthly = 0;
let willAns = { tolerance:2, reaction:2 };

/* ---------------- 流程 ---------------- */
function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.v && st.v.income!=null){
    V = st.v; goalKey = st.g||'house'; target = st.t||defaultTarget(goalKey,V);
    horizonY = st.h||defaultHorizon(goalKey,V); monthly = st.m!=null?st.m:Math.max(0,V.income-V.expense);
    willAns = st.w || willAns;
    plan(true); return;
  }
  intro();
}

function intro(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, GG.T('先给你的财务做次体检','First, a checkup for your finances')),
    GG.el('p', null, GG.T('填几项数字，我先算出你的财务健康分与可投资余力；下一步你定个目标（买房/退休/教育…），我用蒙特卡洛跑 1000 次市场情景，告诉你能不能攒够、该怎么配。全程本地计算、不上传。',
      'Enter a few numbers and I will score your financial health and investable surplus. Then pick a goal (home / retirement / education…) and I will run 1,000 Monte Carlo market scenarios to tell you whether you can get there — and how to allocate. Everything is computed locally; nothing is uploaded.'))
  ));
  main.appendChild(GG.llm.bar());

  const form = GG.el('div',{class:'stack', style:{marginTop:'18px'}});
  const inputs = {};
  SNAPSHOT.forEach(f=>{
    const inp = GG.el('input',{class:'field', type:'number', inputmode:'decimal', min:'0', placeholder:f.ph, value:''});
    inputs[f.key]=inp;
    form.appendChild(GG.el('div',{class:'card pad'},
      GG.el('label',{class:'label'}, GG.T(`${f.label}（${f.unit}）`, `${f.label} (${f.unit})`)), inp,
      GG.el('p',{class:'small muted', style:{margin:'7px 0 0'}}, f.hint)));
  });
  main.appendChild(form);

  const err = GG.el('p',{class:'small', style:{color:'#e8543f', textAlign:'center', minHeight:'20px', marginTop:'12px'}});
  main.appendChild(err);
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'4px'}},
    GG.el('button',{class:'btn primary lg', onClick:()=>{
      const v={};
      for(const f of SNAPSHOT){
        const raw=inputs[f.key].value.trim(), n=Number(raw);
        if(raw==='' || !isFinite(n) || n<0){ err.textContent=GG.T(`请把「${f.label}」填成一个 ≥0 的数字。`, `Please enter a number ≥ 0 for "${f.label}".`); inputs[f.key].focus(); return; }
        v[f.key]=n;
      }
      if(v.income<=0){ err.textContent=GG.T('月收入需要大于 0。','Monthly income must be greater than 0.'); inputs.income.focus(); return; }
      if(v.age<=0||v.age>100){ err.textContent=GG.T('年龄填一个 1~100 的数。','Please enter an age between 1 and 100.'); inputs.age.focus(); return; }
      err.textContent='';
      V=v; goalKey='house'; target=defaultTarget('house',v); horizonY=defaultHorizon('house',v);
      monthly=Math.max(0, v.income-v.expense); willAns={tolerance:2,reaction:2};
      plan(false);
    }}, GG.T('开始体检 →','Start the checkup →'))));
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'10px'}},
    GG.el('button',{class:'btn', onClick:()=>{
      const demo={income:22000,expense:13000,cash:90000,invested:160000,debt:180000,debtApr:7,age:31};
      SNAPSHOT.forEach(f=> inputs[f.key].value=demo[f.key]); err.textContent='';
    }}, GG.T('填个示例看看','Fill in a sample'))));
}

/* ---------------- 结果页：搭骨架 + live 联动 ---------------- */
let dyn = {};   // 动态区域引用

async function plan(fromLink){
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  const A = analyze(V);
  const stage = GG.el('div'); main.appendChild(stage);
  if(!fromLink){
    await GG.thinking(stage, [
      GG.T(`读取月收入 ${yuan(V.income)}、支出 ${yuan(V.expense)}…`, `Reading monthly income ${yuan(V.income)} and expenses ${yuan(V.expense)}…`),
      GG.T('算储蓄率、应急金、负债比，给财务体检打分…','Scoring savings rate, emergency fund and debt ratio for your checkup…'),
      GG.T('结合年龄与目标期限评估你的风险承受能力…','Assessing risk capacity from your age and goal horizon…'),
      GG.T('跑 1000 次市场情景，估算目标达成概率…','Running 1,000 market scenarios to estimate your odds…')
    ], 1500);
    GG.clear(stage);
  }

  // ① 体检快照
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'6px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, GG.T('🧭 你的财务方案','🧭 Your Financial Plan'))));
  const head = GG.el('div',{class:'card pad', style:{marginBottom:'14px',
      background:'linear-gradient(160deg,var(--accent-soft),#fff 64%)'}},
    GG.el('div',{class:'score-ring'},
      GG.el('div',{class:'bignum', style:{color:'var(--accent)'}}, String(A.total)),
      GG.el('div',null,
        GG.el('div',{style:{fontSize:'18px',fontWeight:'700'}}, GG.T('财务健康分 · ','Financial health score · ')+A.grade.tag),
        GG.el('p',{class:'small muted', style:{margin:'4px 0 0'}}, A.grade.desc))),
    GG.el('div',{class:'row', style:{gap:'8px',flexWrap:'wrap',marginTop:'12px'}},
      chip(GG.T('净资产 ','Net worth ')+yuan(A.netWorth)),
      chip(GG.T(`月结余 ${yuan(A.surplus)}（储蓄率 ${pctStr(A.savingRate)}）`, `Monthly surplus ${yuan(A.surplus)} (savings rate ${pctStr(A.savingRate)})`)),
      chip(GG.T('应急金 ','Emergency fund ')+ (A.emMonths>=99?GG.T('充足','ample'):A.emMonths.toFixed(1)+GG.T(' 个月',' months'))),
      chip(GG.T(`负债比 ${A.debtRatio.toFixed(1)}× 年收入`, `Debt at ${A.debtRatio.toFixed(1)}× annual income`))));
  stage.appendChild(head);

  // ② 目标
  const goalCard = GG.el('div',{class:'card pad', style:{marginBottom:'14px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, GG.T('① 你想攒成什么','① What are you saving for')));
  const goalChips = GG.el('div',{class:'chips'});
  GOALS.forEach(g=>{
    const c = GG.el('button',{class:'chip'+(g.key===goalKey?' on':''), type:'button', title:g.desc,
      onClick:()=>{ goalKey=g.key; target=defaultTarget(g.key,V); horizonY=defaultHorizon(g.key,V);
        GG.$$('.chip',goalChips).forEach(x=>x.classList.remove('on')); c.classList.add('on');
        tgtInput.value=target; horizInput.value=horizonY; horizVal.textContent=horizonY+GG.T(' 年',' yr'); recompute(); }},
      g.emoji+' '+g.label);
    goalChips.appendChild(c);
  });
  goalCard.appendChild(goalChips);
  const goalDesc = GG.el('p',{class:'small muted', style:{margin:'8px 0 12px'}}, '');
  goalCard.appendChild(goalDesc);
  // 目标金额 + 期限
  const tgtInput = GG.el('input',{class:'field', type:'number', min:'0', value:String(target), style:{maxWidth:'180px'},
    oninput:e=>{ target=Math.max(0,Number(e.target.value)||0); recompute(); }});
  const horizVal = GG.el('span',{style:{fontWeight:'700', color:'var(--accent)'}}, horizonY+GG.T(' 年',' yr'));
  const horizInput = GG.el('input',{type:'range', min:'1', max:'40', step:'1', value:String(horizonY),
    style:{width:'100%', accentColor:'var(--accent)', cursor:'pointer'},
    oninput:e=>{ horizonY=+e.target.value; horizVal.textContent=horizonY+GG.T(' 年',' yr'); recompute(); }});
  goalCard.appendChild(GG.el('div',{class:'row', style:{gap:'18px',flexWrap:'wrap',alignItems:'flex-end'}},
    GG.el('div',null, GG.el('label',{class:'label'},GG.T('目标金额（元）','Target amount (CNY)')), tgtInput),
    GG.el('div',{style:{flex:'1 1 200px',minWidth:'200px'}},
      GG.el('div',{class:'row', style:{justifyContent:'space-between'}}, GG.el('label',{class:'label'},GG.T('计划期限','Time horizon')), horizVal),
      horizInput)));
  stage.appendChild(goalCard);

  // ③ 风险画像
  const riskCard = GG.el('div',{class:'card pad', style:{marginBottom:'14px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, GG.T('② 你的风险画像','② Your risk profile')));
  RISK_Q.forEach(q=>{
    const lab = GG.el('div',{class:'small', style:{fontWeight:'600',margin:'6px 0 6px'}}, q.label);
    const opts = GG.el('div',{class:'chips'});
    q.options.forEach((o,i)=>{
      const c = GG.el('button',{class:'chip'+(willAns[q.id]===i?' on':''), type:'button',
        onClick:()=>{ willAns[q.id]=i; GG.$$('.chip',opts).forEach(x=>x.classList.remove('on')); c.classList.add('on'); recompute(); }}, o.label);
      opts.appendChild(c);
    });
    riskCard.appendChild(lab); riskCard.appendChild(opts);
  });
  dyn.riskReadout = GG.el('div',{class:'small', style:{margin:'10px 0 0', color:'var(--ink-2)'}});
  riskCard.appendChild(dyn.riskReadout);
  stage.appendChild(riskCard);

  // ④ 每月定投
  const surplus = Math.max(0, A.surplus);
  const mMax = Math.max(2000, Math.round(Math.max(surplus*2, V.income*0.5)/500)*500);
  monthly = GG.clamp(monthly, 0, mMax);
  const mVal = GG.el('span',{style:{fontWeight:'800',color:'var(--accent)'}}, yuan(monthly));
  const mInput = GG.el('input',{type:'range', min:'0', max:String(mMax), step:'500', value:String(monthly),
    style:{width:'100%', accentColor:'var(--accent)', cursor:'pointer'},
    oninput:e=>{ monthly=+e.target.value; mVal.textContent=yuan(monthly); recompute(); }});
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'14px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, GG.T('③ 每月能拿多少来投','③ How much can you invest monthly')),
    GG.el('div',{class:'row', style:{justifyContent:'space-between',alignItems:'baseline',marginBottom:'4px'}},
      GG.el('span',{class:'small muted'}, GG.T('每月定投','Monthly contribution')), mVal),
    mInput,
    GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}}, GG.T(`默认 = 你的月结余 ${yuan(A.surplus)}；可拖动看不同投入下的达成概率。`, `Default = your monthly surplus ${yuan(A.surplus)}; drag to see how the odds change with different contributions.`))));

  // ⑤ 达成概率（招牌）
  dyn.probCard = GG.el('div',{class:'card pad', style:{marginBottom:'14px', borderLeft:'3px solid var(--accent)'}});
  stage.appendChild(dyn.probCard);

  // ⑥ 配置
  dyn.allocCard = GG.el('div',{class:'card pad', style:{marginBottom:'14px'}});
  stage.appendChild(dyn.allocCard);

  // ⑦ 行动计划
  dyn.planCard = GG.el('div',{class:'card pad', style:{marginBottom:'14px'}});
  stage.appendChild(dyn.planCard);

  // ⑧ AI 解读 + 分享 + 底部
  dyn.aiBox = GG.el('div'); stage.appendChild(dyn.aiBox);
  dyn.shareBox = GG.el('div'); stage.appendChild(dyn.shareBox);
  stage.appendChild(GG.el('p',{class:'small muted', style:{margin:'14px 0 0', lineHeight:'1.6'}},
    GG.T('说明：本工具为产品原型演示与测算，非投资建议、不构成要约或承诺。资产预期收益/波动为简化模型假设，蒙特卡洛结果为概率测算，不预示未来真实收益。实际投资请咨询持牌顾问并以正式产品文件为准。',
      'Note: this tool is a product prototype for demonstration and estimation only — not investment advice, and no offer or promise. Expected returns/volatility are simplified model assumptions; Monte Carlo results are probabilistic estimates and do not predict actual future returns. For real investments, consult a licensed advisor and rely on official product documents.')));
  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'14px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; intro(); }}, GG.T('↻ 改快照重测','↻ Edit snapshot & retest'))));

  dyn.goalDesc = goalDesc; dyn.A = A;
  recompute();
}

function chip(txt){ return GG.el('span',{class:'pill', style:{background:'#fff',border:'1px solid var(--line)',
  borderRadius:'999px',padding:'5px 11px',fontSize:'12.5px',color:'var(--ink-2)'}}, txt); }

/* ---------------- 核心：重算（任一杠杆变动即调用） ---------------- */
function recompute(){
  const A = dyn.A;
  const RP = riskProfile(V, willAns, horizonY, A);
  // 应急金目标用低风险（货币基金），其余目标用风险画像配置
  const effScore = goalKey==='emergency' ? Math.min(RP.score, 12) : RP.score;
  const alloc = allocation(effScore);
  const r = blended(alloc,'r'), vol = blended(alloc,'vol');
  const emKeep = V.expense*3;
  const initial = goalKey==='emergency' ? V.cash : Math.max(0, V.cash - emKeep) + V.invested;
  const seed = GG.hash([V.income,V.expense,V.cash,V.invested,V.debt,V.age,goalKey,target,horizonY,monthly,RP.score].join('|'));
  const mc = monteCarlo(initial, monthly, horizonY, r, vol, target, seed);
  const g = GOALS.find(x=>x.key===goalKey);

  GG.encodeState({ v:V, g:goalKey, t:target, h:horizonY, m:monthly, w:willAns });
  if(dyn.goalDesc) dyn.goalDesc.textContent = g.desc + (goalKey==='emergency'?GG.T('（应急金建议放货币基金，故按低风险测算）',' (Emergency money belongs in a money-market fund, so this is modeled at low risk)'):'');

  // 风险读数
  GG.clear(dyn.riskReadout);
  dyn.riskReadout.appendChild(GG.el('span',null,
    GG.T(`承受意愿 ${RP.willingness} · 承受能力 ${RP.capacity}（年龄/期限/家底）→ 风险等级 `, `Willingness ${RP.willingness} · Capacity ${RP.capacity} (age/horizon/balance sheet) → risk level `)));
  dyn.riskReadout.appendChild(GG.el('span',{class:'pill', style:{background:'var(--accent)',color:'#fff',
    padding:'2px 9px',borderRadius:'999px',fontWeight:'700',fontSize:'12px'}}, RP.level.name+'·'+RP.level.tag));
  dyn.riskReadout.appendChild(GG.el('div',{class:'small muted', style:{marginTop:'4px'}}, RP.level.desc));

  // 达成概率
  const prob = Math.round(mc.prob*100);
  const probColor = prob>=75?'#2e9e7b':(prob>=45?'#e0922b':'#e8543f');
  const verdict = prob>=80?GG.T('很有把握','Very likely'):prob>=55?GG.T('大概率能成','Good odds'):prob>=30?GG.T('有点悬，需加力','Uncertain — needs a push'):GG.T('目前很难，得调整','Unlikely for now — adjust the plan');
  GG.clear(dyn.probCard);
  dyn.probCard.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'0'}}, GG.T('🎯 目标达成概率（蒙特卡洛 · 1000 次模拟）','🎯 Goal success probability (Monte Carlo · 1,000 runs)')));
  dyn.probCard.appendChild(GG.el('div',{class:'row', style:{alignItems:'baseline',gap:'10px',flexWrap:'wrap'}},
    GG.el('span',{style:{fontSize:'46px',fontWeight:'800',lineHeight:'1',color:probColor}}, prob+'%'),
    GG.el('div',null,
      GG.el('div',{style:{fontWeight:'700'}}, verdict),
      GG.el('div',{class:'small muted'}, GG.T(`在 ${horizonY} 年内攒够 ${yuan(target)}（${wan(target)}）的概率`, `Odds of reaching ${yuan(target)} (${wan(target)}) within ${horizonY} years`)))));
  dyn.probCard.appendChild(GG.el('div',{style:{margin:'10px 0 4px'}, html:fanChart(mc, target)}));
  dyn.probCard.appendChild(GG.el('div',{class:'row', style:{justifyContent:'space-between',flexWrap:'wrap',gap:'6px',marginTop:'2px'}},
    GG.el('span',{class:'small muted'}, GG.T('中位(p50)终值 ','Median (p50) ending value ')+yuan(mc.p50[horizonY])),
    GG.el('span',{class:'small muted'}, GG.T(`保守(p10) ${yuan(mc.p10[horizonY])} · 乐观(p90) ${yuan(mc.p90[horizonY])}`, `Conservative (p10) ${yuan(mc.p10[horizonY])} · Optimistic (p90) ${yuan(mc.p90[horizonY])}`))));
  dyn.probCard.appendChild(GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}},
    GG.T(`起投本金 ${yuan(initial)}（已为你留 3 个月应急现金）+ 每月定投 ${yuan(monthly)}，按 ${g.label} 对应配置预期年化 ${(r*100).toFixed(1)}%、波动 ${(vol*100).toFixed(0)}% 测算。`,
      `Starting principal ${yuan(initial)} (3 months of emergency cash already set aside) + ${yuan(monthly)} monthly, modeled on the ${g.label} allocation at ${(r*100).toFixed(1)}% expected annual return and ${(vol*100).toFixed(0)}% volatility.`)));

  // 配置
  GG.clear(dyn.allocCard);
  dyn.allocCard.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'0'}}, GG.T(`建议配置（按风险等级 ${RP.level.tag}）`, `Recommended allocation (risk level ${RP.level.tag})`)));
  dyn.allocCard.appendChild(GG.el('div',{style:{margin:'4px 0 8px'}, html:donut(alloc)}));
  const legend = GG.el('div',{class:'stack', style:{gap:'6px'}});
  ASSETS.forEach(a=> legend.appendChild(GG.el('div',{class:'row', style:{justifyContent:'space-between',alignItems:'center'}},
    GG.el('div',{class:'row', style:{gap:'8px',alignItems:'center'}},
      GG.el('span',{style:{width:'12px',height:'12px',borderRadius:'3px',background:a.color,display:'inline-block',flex:'none'}}),
      GG.el('span',{class:'small'}, a.label)),
    GG.el('span',{class:'small', style:{fontWeight:'700'}}, alloc[a.key].toFixed(1)+'%'))));
  dyn.allocCard.appendChild(legend);

  // 行动计划
  GG.clear(dyn.planCard);
  dyn.planCard.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'0'}}, GG.T('行动计划（按理财金字塔排序）','Action plan (ordered by the financial pyramid)')));
  const steps = planSteps(V, A, RP, r, prob);
  dyn.planCard.appendChild(GG.el('div',{class:'stack', style:{gap:'12px'}},
    steps.map((s,i)=> GG.el('div',{class:'row', style:{gap:'10px',alignItems:'flex-start'}},
      GG.el('span',{class:'pill', style:{background:'var(--accent)',color:'#fff',fontWeight:'700',padding:'4px 11px',
        borderRadius:'999px',fontSize:'13px',flex:'none'}}, String(i+1)),
      GG.el('p',{class:'small', style:{margin:'0',lineHeight:'1.65',color:'var(--ink)'}}, s)))));

  // AI 解读（按需）
  GG.clear(dyn.aiBox);
  if(GG.llm.connected()) dyn.aiBox.appendChild(aiAdviceCard({A, RP, alloc, r, vol, mc, prob, initial}));

  // 分享卡
  GG.clear(dyn.shareBox);
  const shareSpec = {
    slug:SLUG, title:GG.T('我的财务方案','My Financial Plan'),
    subtitle: GG.T(`${g.emoji} ${g.label} · ${horizonY} 年 · 风险 ${RP.level.tag}`, `${g.emoji} ${g.label} · ${horizonY} yr · risk ${RP.level.tag}`),
    big:{ value:prob+'%', label:GG.T('目标达成概率','Goal success probability') },
    rows: ASSETS.map(a=>({label:a.label, value:alloc[a.key].toFixed(0)+'%'})),
    note: GG.T(`${horizonY} 年攒够 ${wan(target)}的概率 ${prob}%；起投 ${yuan(initial)} + 每月 ${yuan(monthly)}，预期年化 ${(r*100).toFixed(1)}%（蒙特卡洛测算，非投资建议）。`,
      `${prob}% odds of reaching ${wan(target)} in ${horizonY} years; ${yuan(initial)} to start + ${yuan(monthly)}/month at ${(r*100).toFixed(1)}% expected annual return (Monte Carlo estimate — not investment advice).`),
    tags: [GG.T('健康分','Health ')+dyn.A.total, RP.level.name, GG.T('预期','Exp. ')+(r*100).toFixed(1)+'%'],
  };
  dyn.shareBox.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center small muted'}, GG.T('改目标/期限/风险/定投，概率与配置即时变化 · 截图分享 ↓','Tweak goal / horizon / risk / contribution — odds and allocation update live · Screenshot to share ↓')), shareSpec));
}

/* ---------------- 行动计划（金字塔顺序，引用真实数字） ---------------- */
function planSteps(v, A, RP, r, prob){
  const out = [];
  const emTarget = v.expense*6;
  // 1 应急金
  if(A.emMonths < 6){
    const need = Math.max(0, emTarget - v.cash);
    const toMonths = A.emMonths < 3 ? 3 : 6;
    out.push(GG.T(
      `【应急金先到位】你的存款能撑 ${A.emMonths>=99?'很久':A.emMonths.toFixed(1)+' 个月'}，先补到 ${toMonths} 个月（约 ${yuan(v.expense*toMonths)}），${need>0?'还差 '+yuan(need)+'，':''}放货币基金随取随用——这是任何投资的前提。`,
      `[Emergency fund first] Your savings cover ${A.emMonths>=99?'a very long time':A.emMonths.toFixed(1)+' months'}. Top it up to ${toMonths} months (about ${yuan(v.expense*toMonths)})${need>0?' — still '+yuan(need)+' to go —':';'} keep it in a money-market fund for instant access. This comes before any investing.`));
  }else{
    out.push(GG.T(`【应急金已达标】存款够撑 6 个月以上，抗风险底盘稳，可放心把余力拿去配置。`,
      `[Emergency fund in place] Your savings cover 6+ months of expenses — a solid safety base, so the surplus can confidently go into the portfolio.`));
  }
  // 2 高息负债
  if(v.debt>0 && v.debtApr>=5){
    out.push(GG.T(`【先还高息债】你的负债 ${yuan(v.debt)} 平均年化 ${v.debtApr}%——提前还它等于拿到 ${v.debtApr}% 的「无风险回报」，高于这套组合 ${(r*100).toFixed(1)}% 的预期收益，应优先于投资。`,
      `[Pay down high-interest debt first] Your ${yuan(v.debt)} of debt averages ${v.debtApr}% a year — prepaying it is a risk-free ${v.debtApr}% return, above this portfolio's ${(r*100).toFixed(1)}% expected return, so it takes priority over investing.`));
  }else if(v.debt>0){
    out.push(GG.T(`【低息负债可不急】负债 ${yuan(v.debt)} 年化仅 ${v.debtApr}%，低于组合预期 ${(r*100).toFixed(1)}%，按计划还款即可，不必挪用投资余力提前还。`,
      `[Low-interest debt can wait] The ${yuan(v.debt)} debt costs only ${v.debtApr}% a year — below the portfolio's ${(r*100).toFixed(1)}% expected return — so keep up scheduled payments rather than prepaying with investable money.`));
  }
  // 3 投资/配置
  out.push(GG.T(`【按 ${RP.level.tag} 配置定投】用每月可投 ${yuan(monthly)} 定投上面这套 ${RP.level.name}组合，初始可投入 ${yuan(goalKey==='emergency'?v.cash:Math.max(0,v.cash-v.expense*3)+v.invested)}；坚持定投、每年再平衡一次。`,
    `[Invest on the ${RP.level.tag} allocation] Put your ${yuan(monthly)} monthly budget into the ${RP.level.name} portfolio above, starting with ${yuan(goalKey==='emergency'?v.cash:Math.max(0,v.cash-v.expense*3)+v.invested)}; keep the contributions going and rebalance once a year.`));
  // 4 达成度提示
  if(prob < 60){
    out.push(GG.T(`【概率偏低，三个旋钮可调】当前达成概率 ${prob}%。可任选其一：拉长期限、调高每月定投、或在能力范围内提升风险等级——上面拖一拖就能看到概率变化。`,
      `[Odds are low — three dials to turn] Current success probability: ${prob}%. Pick any one: extend the horizon, raise the monthly contribution, or step up the risk level within your capacity — drag the controls above to watch the odds move.`));
  }else{
    out.push(GG.T(`【保障别落下】方案达成概率 ${prob}% 较稳。别忘了用少量预算配齐医疗/意外/定期寿险，避免一次意外击穿整个计划。`,
      `[Don't skip insurance] At ${prob}% the plan looks solid. Still, budget a little for health, accident and term life cover so one mishap can't wreck the whole plan.`));
  }
  return out;
}

/* ---------------- AI 顾问解读层 ---------------- */
const FORTUNA_SYS = '你是务实、合规、不贩卖焦虑的财务规划助理。下面是用户的财务快照、风险画像、目标与系统生成的配置和蒙特卡洛达成概率。请用通俗的话点评并给可执行建议。只输出严格 JSON：{"summary":"一句话总体判断，客观、以鼓励为主","actions":["3条具体、引用其数字、按先后顺序的行动建议"],"watch":"一句话最该警惕的风险"}。不要推荐任何具体基金/股票/产品名称或代码；点明这是测算、非投资建议；'+GG.T('全部简体中文，金额用人民币。','All user-visible fields (summary, actions, watch) must be written in English; amounts stay in CNY (¥).');
function aiUserText(C){
  const alloc = ASSETS.map(a=>`${a.label}${C.alloc[a.key].toFixed(0)}%`).join('、');
  const g = GOALS.find(x=>x.key===goalKey);
  return `财务健康分：${C.A.total}（${C.A.grade.tag}）\n净资产¥${Math.round(C.A.netWorth)}、月收入¥${Math.round(V.income)}、月支出¥${Math.round(V.expense)}、月结余¥${Math.round(C.A.surplus)}（储蓄率${pctStr(C.A.savingRate)}）\n存款¥${Math.round(V.cash)}（应急金${C.A.emMonths>=99?'充足':C.A.emMonths.toFixed(1)+'个月'}）、已投¥${Math.round(V.invested)}、负债¥${Math.round(V.debt)}@${V.debtApr}%、年龄${V.age}\n风险画像：意愿${C.RP.willingness}/能力${C.RP.capacity}→${C.RP.level.name}(${C.RP.level.tag})\n目标：${g.label} ${yuan(target)}、${horizonY}年；起投¥${Math.round(C.initial)}+每月¥${Math.round(monthly)}\n配置：${alloc}，预期年化${(C.r*100).toFixed(1)}%；蒙特卡洛达成概率${C.prob}%`;
}
function aiAdviceCard(C){
  const body = GG.el('div');
  const btn = GG.el('button',{class:'btn', onClick:()=>{
    btn.disabled=true; GG.clear(body); body.appendChild(GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}}, GG.T('AI 正在结合你的方案给出建议…','AI is reviewing your plan and drafting advice…')));
    GG.llm.json(FORTUNA_SYS, aiUserText(C), {max_tokens:760}).then(obj=>{
      GG.clear(body);
      if(obj.summary) body.appendChild(GG.el('p',{style:{margin:'0 0 10px',fontWeight:'600'}}, String(obj.summary)));
      const acts=(Array.isArray(obj.actions)?obj.actions:[]).map(String).filter(Boolean);
      if(acts.length){ body.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'4px'}}, GG.T('行动建议','Action items')));
        body.appendChild(GG.el('ul',{class:'small', style:{margin:'4px 0 0',paddingLeft:'20px',color:'var(--ink-2)',lineHeight:'1.7'}}, acts.map(t=>GG.el('li',null,t)))); }
      if(obj.watch) body.appendChild(GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}}, '⚠︎ '+String(obj.watch)));
      btn.disabled=false; btn.textContent=GG.T('↻ 重新解读','↻ Regenerate');
    }).catch(e=>{ GG.clear(body); body.appendChild(GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}},
      GG.T(`AI 解读没拿到（${e&&e.code||'NET'}），你的方案与测算不受影响。`, `AI commentary didn't come through (${e&&e.code||'NET'}) — your plan and projections are unaffected.`))); btn.disabled=false; });
  }}, GG.T('✨ AI 顾问解读这套方案','✨ Have the AI advisor review this plan'));
  return GG.el('div',{class:'card pad', style:{marginBottom:'14px', borderLeft:'3px solid var(--accent)'}},
    GG.el('div',{class:'row', style:{justifyContent:'space-between',alignItems:'center'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, GG.T('AI 财务顾问','AI Financial Advisor')),
      GG.llm.badge(true)),
    GG.el('p',{class:'small muted', style:{margin:'2px 0 8px'}}, GG.T('让 AI 用人话讲讲你这套方案，给点按先后顺序的实操建议（合规、不荐具体产品）。','Let AI walk through your plan in plain language and give prioritized, practical advice (compliant — no specific product picks).')),
    btn, body);
}

start();
})();
