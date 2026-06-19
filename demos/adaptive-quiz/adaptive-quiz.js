/* adaptive-quiz — 自适应测验。
   选科目 → 从难度 3 起连续答题；答对→难度+1(封顶5)、答错→难度-1(封底1)，难度实时可见。
   答满 8 题 → 预测分(百分制+等级) + 难度轨迹折线图。 */
(function(){
const SLUG='adaptive-quiz';
const QUIZ = window.QUIZ;
const TOTAL = 8;          // 总题数
const START_LEVEL = 3;    // 起始难度（中等）
const MIN_L=1, MAX_L=5;
let main;

/* 星级显示当前难度 */
function stars(level){
  return '★'.repeat(level) + '☆'.repeat(MAX_L-level);
}
const LEVEL_NAME = {1:'入门', 2:'基础', 3:'中等', 4:'进阶', 5:'高难'};

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.subj && Array.isArray(st.trace)){
    showResult(st.subj, st.trace, st.correct, true);
    return;
  }
  intro();
}

function intro(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '自适应测验：题目跟着你变难'),
    GG.el('p', null, `从「中等」难度起步，答对一题就升级、答错就降级——难度始终在追你的真实水平。答满 ${TOTAL} 题，给你一个预测分和难度轨迹。`)
  ));
  main.appendChild(GG.el('div',{class:'section-t'}, '选一个科目开始'));
  const grid = GG.el('div',{class:'stack'});
  Object.keys(QUIZ).forEach(key=>{
    const s = QUIZ[key];
    grid.appendChild(GG.el('button',{class:'card pad', style:{
        display:'flex', alignItems:'center', gap:'14px', cursor:'pointer', textAlign:'left',
        border:'1px solid var(--line)', background:'var(--surface)', width:'100%'
      }, onClick:()=>play(key)},
      GG.el('span',{style:{fontSize:'30px', flex:'none'}}, s.emoji),
      GG.el('div',{style:{flex:'1'}},
        GG.el('div',{style:{fontSize:'18px', fontWeight:'700'}}, s.name),
        GG.el('div',{class:'small muted', style:{marginTop:'2px'}}, `${s.bank.length} 道题库 · 难度 1~5 分级`)),
      GG.el('span',{class:'pill', style:{color:'var(--accent)', fontWeight:'700'}}, '开始 →')
    ));
  });
  main.appendChild(grid);
}

/* 从指定难度桶里抽一道还没出过的题；若该桶用尽则就近找 */
function drawQuestion(bank, level, usedIdx){
  const order = [0,1,-1,2,-2,3,-3,4,-4];   // 优先目标难度，再就近
  for(const d of order){
    const lv = level + d;
    if(lv<MIN_L || lv>MAX_L) continue;
    const cand = [];
    for(let i=0;i<bank.length;i++){
      if(bank[i].level===lv && !usedIdx.has(i)) cand.push(i);
    }
    if(cand.length){
      const i = cand[Math.floor(Math.random()*cand.length)];
      usedIdx.add(i);
      return i;
    }
  }
  return -1;
}

function play(subjKey){
  const subj = QUIZ[subjKey];
  const bank = subj.bank;
  let level = START_LEVEL;
  const usedIdx = new Set();
  const trace = [];   // 每题：{level(题目难度), correct(bool)}
  let qNum = 0;

  GG.clear(main);
  const head = GG.el('div',{class:'hero', style:{paddingBottom:'4px'}},
    GG.el('h1',{style:{fontSize:'22px'}}, subj.emoji+' '+subj.name+' · 自适应测验'));
  main.appendChild(head);

  // 顶部状态条：进度 + 当前难度（醒目，体现“难度在变”）
  const statusBar = GG.el('div',{class:'card pad', style:{marginBottom:'16px', display:'flex',
    justifyContent:'space-between', alignItems:'center', gap:'12px', flexWrap:'wrap',
    background:'linear-gradient(160deg,var(--accent-soft),#fff 70%)'}});
  const progEl = GG.el('div',{class:'small muted'});
  const levelEl = GG.el('div',{style:{textAlign:'right'}});
  statusBar.appendChild(progEl); statusBar.appendChild(levelEl);
  main.appendChild(statusBar);

  const qBox = GG.el('div'); main.appendChild(qBox);

  function renderStatus(flash){
    progEl.innerHTML = `第 <b style="color:var(--ink-2)">${qNum+1}</b> / ${TOTAL} 题`;
    levelEl.innerHTML =
      `<div class="small muted" style="margin-bottom:2px">当前难度 · ${LEVEL_NAME[level]}</div>` +
      `<div style="font-size:22px;letter-spacing:2px;color:var(--accent);font-weight:700">${stars(level)}</div>`;
    if(flash){ // 难度变化时给个动效，让“变”看得见
      levelEl.animate(
        [{transform:'scale(1.18)'},{transform:'scale(1)'}],
        {duration:380, easing:'cubic-bezier(.2,.7,.2,1)'});
    }
  }

  function nextQuestion(){
    if(qNum>=TOTAL){
      GG.encodeState({subj:subjKey, trace, correct:trace.filter(t=>t.correct).length});
      showResult(subjKey, trace, trace.filter(t=>t.correct).length, false);
      return;
    }
    renderStatus(false);
    const qi = drawQuestion(bank, level, usedIdx);
    if(qi<0){ // 题库耗尽（理论上不会，TOTAL 远小于题量），提前结算
      GG.encodeState({subj:subjKey, trace, correct:trace.filter(t=>t.correct).length});
      showResult(subjKey, trace, trace.filter(t=>t.correct).length, false);
      return;
    }
    const item = bank[qi];
    renderQ(item);
  }

  function renderQ(item){
    GG.clear(qBox);
    const card = GG.el('div',{class:'card pad'},
      GG.el('div',{class:'row', style:{justifyContent:'space-between', marginBottom:'10px'}},
        GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', padding:'3px 10px',
          borderRadius:'999px', fontSize:'12px', fontWeight:'700'}}, `难度 ${item.level} · ${LEVEL_NAME[item.level]}`),
        GG.el('span',{class:'small muted'}, stars(item.level))
      ),
      GG.el('h3',{style:{fontSize:'20px', margin:'4px 0 16px', lineHeight:'1.5'}}, item.q)
    );
    const opts = GG.el('div',{class:'stack'});
    let locked = false;
    item.options.forEach((text, i)=>{
      const opt = GG.el('button',{class:'opt', style:{
          display:'flex', alignItems:'center', gap:'12px', cursor:'pointer', textAlign:'left',
          width:'100%', padding:'14px 16px', fontSize:'16px'},
        onClick:()=>choose(i, opt, item, card)},
        GG.el('span',{class:'dot'}),
        GG.el('span',{style:{flex:'1'}}, text));
      opts.appendChild(opt);
    });
    card.appendChild(opts);
    qBox.appendChild(card);

    function choose(i, optEl, item, card){
      if(locked) return; locked = true;
      const right = (i===item.answer);
      // 标注对错
      GG.$$('.opt', opts).forEach((el, idx)=>{
        el.style.cursor='default';
        if(idx===item.answer){ el.style.borderColor='var(--good)'; el.style.background='rgba(46,158,123,.10)'; }
        if(idx===i && !right){ el.style.borderColor='var(--bad)'; el.style.background='rgba(216,80,63,.10)'; }
      });
      trace.push({level:item.level, correct:right});
      // 反馈条 + 难度变化提示
      const prevLevel = level;
      level = GG.clamp(level + (right?1:-1), MIN_L, MAX_L);
      const moved = level!==prevLevel;
      const dirTxt = right
        ? (moved? `答对！下一题难度升到 ${LEVEL_NAME[level]}（${stars(level)}）↑` : `答对！难度已封顶 ${LEVEL_NAME[level]}`)
        : (moved? `答错。下一题难度降到 ${LEVEL_NAME[level]}（${stars(level)}）↓` : `答错。难度已是最低 ${LEVEL_NAME[level]}`);
      card.appendChild(GG.el('div',{class:'card', style:{marginTop:'14px', padding:'12px 14px',
        borderColor: right?'var(--good)':'var(--bad)',
        background: right?'rgba(46,158,123,.07)':'rgba(216,80,63,.07)',
        color: right?'var(--good)':'var(--bad)', fontWeight:'600'}},
        (right?'✓ ':'✕ ') + dirTxt));
      // 顶部状态条同步刷新（先把难度更新动效演出来）
      renderStatus(moved);
      qNum++;
      card.appendChild(GG.el('div',{class:'center', style:{marginTop:'14px'}},
        GG.el('button',{class:'btn primary lg', onClick:nextQuestion},
          qNum>=TOTAL? '看我的预测分 →' : `下一题（第 ${qNum+1}/${TOTAL}）→`)));
    }
  }

  renderStatus(false);
  nextQuestion();
}

/* ---------- 评分 ---------- */
function grade(trace){
  const n = trace.length || 1;
  const correct = trace.filter(t=>t.correct).length;
  const acc = correct/n;
  const reached = Math.max(...trace.map(t=>t.level));       // 到达的最高难度
  const avgL = trace.reduce((a,t)=>a+t.level,0)/n;          // 平均作答难度
  // 预测分：正确率为主(60)，到达难度(28)，平均难度(12)
  let score = acc*60 + ((reached-1)/(MAX_L-1))*28 + ((avgL-1)/(MAX_L-1))*12;
  score = Math.round(GG.clamp(score, 0, 100));
  let grade, gloss;
  if(score>=85){ grade='A'; gloss='水平拔尖：你不仅答得准，还能稳住在高难度区间。'; }
  else if(score>=70){ grade='B'; gloss='掌握扎实：难题也能接住，再冲一冲就够到顶尖。'; }
  else if(score>=55){ grade='C'; gloss='基础稳固：在中等难度站得住，向上还有清晰空间。'; }
  else if(score>=40){ grade='D'; gloss='正在打地基：先把基础题做熟，难度自然会跟着抬上去。'; }
  else { grade='E'; gloss='起步阶段：别急，系统已把难度降到适合你的区间，逐题来。'; }
  return {correct, n, acc, reached, avgL, score, grade, gloss};
}

/* 难度轨迹折线/柱图（inline SVG，对错用颜色区分） */
function traceSVG(trace){
  const W=560, H=170, padL=34, padR=14, padT=18, padB=26;
  const n = trace.length;
  const innerW = W-padL-padR, innerH = H-padT-padB;
  const x = i => padL + (n<=1?innerW/2 : innerW*i/(n-1));
  const y = lv => padT + innerH*(MAX_L-lv)/(MAX_L-MIN_L);
  let grid='';
  for(let lv=MIN_L; lv<=MAX_L; lv++){
    const yy=y(lv);
    grid += `<line x1="${padL}" y1="${yy}" x2="${W-padR}" y2="${yy}" stroke="var(--line-2)" stroke-width="1"/>`;
    grid += `<text x="${padL-8}" y="${yy+4}" text-anchor="end" font-size="11" fill="var(--ink-3)">${lv}</text>`;
  }
  let path=''; trace.forEach((t,i)=>{ path += (i?'L':'M') + x(i).toFixed(1)+' '+y(t.level).toFixed(1)+' '; });
  let dots=''; trace.forEach((t,i)=>{
    const c = t.correct? 'var(--good)':'var(--bad)';
    dots += `<circle cx="${x(i).toFixed(1)}" cy="${y(t.level).toFixed(1)}" r="6" fill="${c}" stroke="#fff" stroke-width="2"/>`;
    dots += `<text x="${x(i).toFixed(1)}" y="${H-8}" text-anchor="middle" font-size="10" fill="var(--ink-3)">${i+1}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="display:block">
    ${grid}
    <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" opacity=".85"/>
    ${dots}
  </svg>`;
}

async function showResult(subjKey, trace, correctCount, fromLink){
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  const subj = QUIZ[subjKey] || {name:'测验', emoji:'🧠'};
  const stage = GG.el('div'); main.appendChild(stage);
  if(!fromLink){
    await GG.thinking(stage, ['汇总你的作答…','分析难度轨迹…','结合到达难度与正确率…','算出你的预测分…'], 1500);
  }
  const r = grade(trace);
  GG.clear(stage);

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, '🎯 你的自适应测验结果')));

  // 大分数卡
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', textAlign:'center',
      background:'linear-gradient(160deg,var(--accent-soft),#fff 65%)'}},
    GG.el('div',{class:'small muted'}, subj.name+' · 预测水平分'),
    GG.el('div',{style:{fontSize:'56px', fontWeight:'800', color:'var(--accent)', lineHeight:'1.1', margin:'4px 0'}},
      String(r.score)),
    GG.el('div',{style:{fontSize:'20px', fontWeight:'700'}}, '等级 '+r.grade),
    GG.el('p',{class:'small', style:{margin:'10px auto 0', maxWidth:'440px', color:'var(--ink-2)'}}, r.gloss)
  ));

  // 关键指标
  const stat = GG.el('div',{class:'row', style:{gap:'12px', marginBottom:'16px', flexWrap:'wrap'}});
  [['正确率', Math.round(r.acc*100)+'%'],
   ['答对题数', r.correct+' / '+r.n],
   ['到达难度', stars(r.reached)],
   ['平均难度', r.avgL.toFixed(1)]
  ].forEach(([lab,val])=>{
    stat.appendChild(GG.el('div',{class:'card pad', style:{flex:'1', minWidth:'120px', textAlign:'center'}},
      GG.el('div',{class:'small muted'}, lab),
      GG.el('div',{style:{fontSize:'20px', fontWeight:'700', marginTop:'4px', color:'var(--ink-2)'}}, val)));
  });
  stage.appendChild(stat);

  // 难度轨迹图
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '难度轨迹（每题难度 · 绿=答对 红=答错）'),
    GG.el('div',{html:traceSVG(trace)}),
    GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}},
      '折线越往上走，说明你连续答对、系统把题不断调难；下探则是答错后系统主动降难帮你站稳。')
  ));

  const shareSpec = {
    slug:SLUG, title:'自适应测验结果',
    big:{value:r.score, label:'预测分'},
    subtitle: `${subj.name} · 正确率 ${Math.round(r.acc*100)}%`,
    rows:[
      {label:'等级', value:r.grade+'（'+LEVEL_NAME[Math.round(GG.clamp(r.avgL,1,5))]+'区间）'},
      {label:'答对题数', value:r.correct+' / '+r.n},
      {label:'到达难度', value:stars(r.reached)+`（${r.reached}/5）`},
      {label:'难度轨迹', value:trace.map(t=>t.level).join(' → ')},
    ],
    tags:[subj.name, '难度自适应', '等级'+r.grade],
    note: r.gloss,
  };

  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '截图分享你的预测分 ↓'), shareSpec));
  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '↻ 再测一次 / 换科目')
  ));
}

start();
})();
