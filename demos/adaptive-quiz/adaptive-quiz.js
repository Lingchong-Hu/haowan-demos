/* adaptive-quiz — 自适应测验。
   选科目 → 从难度 3 起连续答题；答对→难度+1(封顶5)、答错→难度-1(封底1)，难度实时可见。
   答满 8 题 → 预测分 + 难度轨迹 + ＋1：能力边界定位 + 专项攻顶（只挑边界难度连答 5 道）。 */
(function(){
const SLUG='adaptive-quiz';
const QUIZ = window.QUIZ;
const TOTAL = 8;          // 总题数
const START_LEVEL = 3;    // 起始难度（中等）
const MIN_L=1, MAX_L=5;
let main;

/* ---------- AI 通路（连了 key 可输入任意主题，AI 按当前难度现场出题；否则用本地题库） ---------- */
function aqSys(topic, level){
  return '你是出题老师。就主题「'+topic+'」出一道四选一单选题，难度等级 '+level+'/5（1 最易、5 最难），'+
    '题目真实准确、有区分度，四个选项里只有一个正确。只输出严格 JSON：'+
    '{"q":"题干","options":["A","B","C","D"],"answer":正确选项下标0到3}。全部简体中文。';
}
async function genQuestion(topic, level, asked){
  const avoid = [...asked].slice(-6).join(' / ');
  const o = await GG.llm.json(aqSys(topic, level),
    '难度 '+level+'/5。'+(avoid?('不要重复这些题：'+avoid+'。'):'')+'现在出一道。', {max_tokens:600});
  const options = (Array.isArray(o.options)?o.options:[]).map(String).filter(Boolean).slice(0,4);
  const q = String(o.q||'');
  if(!q || options.length<2) throw new Error('bad');
  let answer = parseInt(o.answer,10); if(isNaN(answer)||answer<0||answer>=options.length) answer=0;
  asked.add(q);
  return { q, options, answer, level };
}

/* 星级显示当前难度 */
function stars(level){
  return '★'.repeat(level) + '☆'.repeat(MAX_L-level);
}
const LEVEL_NAME = {1:'入门', 2:'基础', 3:'中等', 4:'进阶', 5:'高难'};

/* ---------- 品牌欢迎门面（与 nl-home / insure-need 同一套 .gate 样式，颜色取本 demo 的 --accent） ---------- */
const GATE_CSS = `
.gate{ max-width:460px; margin:8px auto 0; border:1px solid var(--line); border-radius:20px; overflow:hidden; background:var(--surface); box-shadow:var(--sh-1); }
.gate-head{ padding:28px 24px 24px; text-align:center; color:#fff; background:linear-gradient(150deg, var(--accent), color-mix(in srgb, var(--accent) 60%, #0c2c40)); }
.gate-glyph{ font-size:44px; line-height:1; }
.gate-name{ font-size:22px; font-weight:800; margin-top:10px; letter-spacing:.5px; }
.gate-tag{ font-size:13.5px; opacity:.92; margin-top:6px; }
.gate-body{ padding:22px 22px 24px; }
.gate-hook{ font-size:18px; font-weight:800; color:var(--ink-1,#1d1d1f); text-align:center; line-height:1.5; }
.gate-sub{ font-size:13.5px; color:var(--ink-2); line-height:1.7; margin:10px 0 18px; text-align:center; }
.gate-cta{ display:block; width:100%; box-sizing:border-box; padding:14px; border:none; border-radius:14px; background:var(--accent); color:#fff; font-size:16px; font-weight:700; cursor:pointer; transition:.15s; }
.gate-cta:hover{ filter:brightness(1.05); transform:translateY(-1px); }
.gate-priv{ font-size:11.5px; color:var(--ink-soft,#8a8a93); text-align:center; margin-top:14px; line-height:1.55; }
`;
function injectGate(){ if(GG.$('#gate-style')) return; document.head.appendChild(GG.el('style',{id:'gate-style', html:GATE_CSS})); }
function welcome(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'gate'},
    GG.el('div',{class:'gate-head'},
      GG.el('div',{class:'gate-glyph'}, '🧠'),
      GG.el('div',{class:'gate-name'}, '自适应测验'),
      GG.el('div',{class:'gate-tag'}, '题目跟着你的水平变难')),
    GG.el('div',{class:'gate-body'},
      GG.el('div',{class:'gate-hook'}, '你的真实水平，到底在哪一档？'),
      GG.el('p',{class:'gate-sub'}, '从「中等」起步，答对升级、答错降级——难度始终追着你。8 题后给你预测分、难度轨迹，再定位你的能力边界、专项攻顶。'),
      GG.el('button',{class:'gate-cta', onClick:()=>{ GG.clear(main); intro(); }}, '🧠 开始测验 →'),
      GG.el('div',{class:'gate-priv'}, '🔒 纯本地题库即可玩 · 连 AI 可任意主题出题 · 作答只留在这台浏览器')
    )
  ));
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  injectGate();
  const st = GG.decodeState();
  if(st && st.subj && Array.isArray(st.trace)){
    showResult(st.subj, st.trace, st.correct, true);
    return;
  }
  welcome();
}

function intro(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '自适应测验：题目跟着你变难'),
    GG.el('p', null, `从「中等」难度起步，答对升级、答错降级——难度始终在追你的真实水平。答满 ${TOTAL} 题，给你预测分、难度轨迹，还会定位你的「能力边界」，再针对边界难度专项攻顶。`)
  ));
  main.appendChild(GG.llm.bar());

  // ✨ AI 任意主题出题
  const topicInput = GG.el('input',{class:'field', type:'text',
    placeholder:'输入任意主题让 AI 出题，如：宋词 / 机器学习 / 红楼梦'});
  topicInput.addEventListener('keydown', e=>{ if(e.key==='Enter') goAI(); });
  function goAI(){
    const t = topicInput.value.trim();
    if(!t){ GG.toast('先输入一个主题'); topicInput.focus(); return; }
    if(!GG.llm.connected()){ GG.toast('先连接 AI 才能用任意主题出题'); return; }
    play(null, t);
  }
  main.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'10px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '✨ AI 出题（任意主题）'),
    topicInput,
    GG.el('button',{class:'btn primary block', style:{marginTop:'12px'}, onClick:goAI}, '用 AI 给我出题 →')
  ));

  main.appendChild(GG.el('div',{class:'section-t'}, '或选一个内置科目'));
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

/* focus = {level, count} 时进入「专项攻顶」：难度固定、连答 count 道、单独结算 */
function play(subjKey, aiTopic, focus){
  const ai = !!aiTopic;
  const isFocus = !!focus;
  const total = isFocus ? focus.count : TOTAL;
  const subj = ai ? {name:aiTopic, emoji:'🧠', bank:[]} : QUIZ[subjKey];
  const bank = subj.bank || [];
  const asked = new Set();
  let level = isFocus ? GG.clamp(focus.level, MIN_L, MAX_L) : START_LEVEL;
  const usedIdx = new Set();
  const trace = [];   // 每题：{level(题目难度), correct(bool)}
  let qNum = 0;

  GG.clear(main);
  const head = GG.el('div',{class:'hero', style:{paddingBottom:'4px'}},
    GG.el('h1',{style:{fontSize:'22px'}}, subj.emoji+' '+subj.name+' · '+
      (isFocus ? ('专项攻顶 · 难度 '+level+'（'+LEVEL_NAME[level]+'）') : ('自适应测验'+(ai?'（AI 出题）':'')))));
  main.appendChild(head);

  // 顶部状态条：进度 + 当前难度
  const statusBar = GG.el('div',{class:'card pad', style:{marginBottom:'16px', display:'flex',
    justifyContent:'space-between', alignItems:'center', gap:'12px', flexWrap:'wrap',
    background:'linear-gradient(160deg,var(--accent-soft),#fff 70%)'}});
  const progEl = GG.el('div',{class:'small muted'});
  const levelEl = GG.el('div',{style:{textAlign:'right'}});
  statusBar.appendChild(progEl); statusBar.appendChild(levelEl);
  main.appendChild(statusBar);

  const qBox = GG.el('div'); main.appendChild(qBox);

  function renderStatus(flash){
    progEl.innerHTML = `第 <b style="color:var(--ink-2)">${qNum+1}</b> / ${total} 题`;
    levelEl.innerHTML =
      `<div class="small muted" style="margin-bottom:2px">${isFocus?'专项 · 难度固定':'当前难度'} · ${LEVEL_NAME[level]}</div>` +
      `<div style="font-size:22px;letter-spacing:2px;color:var(--accent);font-weight:700">${stars(level)}</div>`;
    if(flash){
      levelEl.animate(
        [{transform:'scale(1.18)'},{transform:'scale(1)'}],
        {duration:380, easing:'cubic-bezier(.2,.7,.2,1)'});
    }
  }

  function finishQuiz(){
    const key = ai ? ('ai:'+aiTopic) : subjKey;
    if(isFocus){ challengeResult(key, focus.level, trace); return; }
    GG.encodeState({subj:key, trace, correct:trace.filter(t=>t.correct).length});
    showResult(key, trace, trace.filter(t=>t.correct).length, false);
  }
  async function nextQuestion(){
    if(qNum>=total){ finishQuiz(); return; }
    renderStatus(false);
    let item;
    if(ai){
      GG.clear(qBox);
      qBox.appendChild(GG.el('div',{class:'card pad'},
        GG.el('div',{class:'thinking', style:{padding:'30px 0'}},
          GG.el('div',{class:'spinner'}),
          GG.el('div',{class:'msg'}, 'AI 正在按「'+LEVEL_NAME[level]+'」难度出第 '+(qNum+1)+' 题…'))));
      try{ item = await genQuestion(aiTopic, level, asked); }
      catch(e){
        GG.toast(GG.llm.errMsg(e));
        if(!trace.length){ intro(); return; }
        finishQuiz(); return;
      }
    } else {
      const qi = drawQuestion(bank, level, usedIdx);
      if(qi<0){ finishQuiz(); return; }
      item = bank[qi];
    }
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
      GG.$$('.opt', opts).forEach((el, idx)=>{
        el.style.cursor='default';
        if(idx===item.answer){ el.style.borderColor='var(--good)'; el.style.background='rgba(46,158,123,.10)'; }
        if(idx===i && !right){ el.style.borderColor='var(--bad)'; el.style.background='rgba(216,80,63,.10)'; }
      });
      trace.push({level:item.level, correct:right});

      let moved = false;
      if(!isFocus){
        const prevLevel = level;
        level = GG.clamp(level + (right?1:-1), MIN_L, MAX_L);
        moved = level!==prevLevel;
        const dirTxt = right
          ? (moved? `答对！下一题难度升到 ${LEVEL_NAME[level]}（${stars(level)}）↑` : `答对！难度已封顶 ${LEVEL_NAME[level]}`)
          : (moved? `答错。下一题难度降到 ${LEVEL_NAME[level]}（${stars(level)}）↓` : `答错。难度已是最低 ${LEVEL_NAME[level]}`);
        card.appendChild(GG.el('div',{class:'card', style:{marginTop:'14px', padding:'12px 14px',
          borderColor: right?'var(--good)':'var(--bad)',
          background: right?'rgba(46,158,123,.07)':'rgba(216,80,63,.07)',
          color: right?'var(--good)':'var(--bad)', fontWeight:'600'}},
          (right?'✓ ':'✕ ') + dirTxt));
      } else {
        // 专项模式：难度固定，只给对错
        card.appendChild(GG.el('div',{class:'card', style:{marginTop:'14px', padding:'12px 14px',
          borderColor: right?'var(--good)':'var(--bad)',
          background: right?'rgba(46,158,123,.07)':'rgba(216,80,63,.07)',
          color: right?'var(--good)':'var(--bad)', fontWeight:'600'}},
          (right?'✓ 答对！':'✕ 答错。') + ` 难度保持 ${LEVEL_NAME[level]}`));
      }
      renderStatus(moved);
      qNum++;
      card.appendChild(GG.el('div',{class:'center', style:{marginTop:'14px'}},
        GG.el('button',{class:'btn primary lg', onClick:nextQuestion},
          qNum>=total? (isFocus?'看攻顶结果 →':'看我的预测分 →') : `下一题（第 ${qNum+1}/${total}）→`)));
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
  const reached = Math.max(...trace.map(t=>t.level));
  const avgL = trace.reduce((a,t)=>a+t.level,0)/n;
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

/* ＋1：从轨迹定位「稳定区 / 边界」。
   reached = 你答对过的最高难度（已证明的能力）；边界 = 再往上一级（自适应降级会在末尾重测低难，
   所以不能用"最低错题难度"当边界——那会得出"稳定到4却卡在3"的矛盾）。stable ≤ challenge 恒成立。 */
function abilityPos(trace){
  const correct = trace.filter(t=>t.correct);
  const wrong = trace.filter(t=>!t.correct);
  const reached = correct.length ? Math.max(...correct.map(t=>t.level)) : 0;
  if(reached===0){   // 一题没对
    const lowAttempt = GG.clamp(Math.min(...trace.map(t=>t.level)), MIN_L, 2);
    return { stable:MIN_L, challenge:lowAttempt, atTop:false, neverRight:true,
      verdict:`这一轮还没站稳——系统已把难度降到适合你的区间。先从 难度 1~2 把基础打牢，再一档档往上走。` };
  }
  const atTop = reached>=MAX_L;
  const stable = reached;
  const challenge = GG.clamp(reached + (atTop?0:1), MIN_L, MAX_L);
  let verdict;
  if(atTop)
    verdict = `你摸到了最高 难度 ${MAX_L}（${LEVEL_NAME[MAX_L]}）并答对——已经站上顶区。专项再测 5 道，确认你能稳定守住、而不是偶然碰对。`;
  else if(wrong.length)
    verdict = `你能稳定接住到 难度 ${stable}（${LEVEL_NAME[stable]}）；再往上的 难度 ${challenge}（${LEVEL_NAME[challenge]}）就是你现在的边界——把它练到稳，水平分会上一个台阶。`;
  else
    verdict = `你一路没失手，最高摸到 难度 ${stable}（${LEVEL_NAME[stable]}）。下一步直接挑战 难度 ${challenge}（${LEVEL_NAME[challenge]}），看看你的天花板在哪。`;
  return { stable, challenge, atTop, neverRight:false, verdict };
}
function posPill(label, val, col){
  return GG.el('div',{class:'card', style:{flex:'1', minWidth:'140px', padding:'10px 12px', borderColor:col, background:'#fff'}},
    GG.el('div',{class:'small muted'}, label),
    GG.el('div',{style:{fontWeight:'700', color:col, marginTop:'2px'}}, val));
}

function startChallenge(subjKey, level){
  if(typeof subjKey==='string' && subjKey.indexOf('ai:')===0){
    if(!GG.llm.connected()){ GG.toast('AI 出题需要先连接 AI'); return; }
    play(null, subjKey.slice(3), {level, count:5});
  } else {
    play(subjKey, null, {level, count:5});
  }
}

function challengeResult(key, level, trace){
  GG.clear(main);
  const got = trace.filter(t=>t.correct).length, n = trace.length || 1;
  const pass = got>=4 ? 'break' : got>=2 ? 'partial' : 'base';
  const col = pass==='break'?'var(--good)':pass==='partial'?'var(--warn)':'var(--bad)';
  const verdict = pass==='break'
      ? `突破了！难度 ${level}（${LEVEL_NAME[level]}）你已经拿下，下一步可以往 难度 ${Math.min(level+1,MAX_L)} 冲。`
    : pass==='partial'
      ? `${got}/${n}，难度 ${level}（${LEVEL_NAME[level]}）还差临门一脚——再来一轮，或回去把这一层的基础补补。`
      : `难度 ${level}（${LEVEL_NAME[level]}）暂时偏难，先回低一档练熟，再来攻这层。`;
  const subjName = (typeof key==='string'&&key.indexOf('ai:')===0)? key.slice(3) : (QUIZ[key]?QUIZ[key].name:'测验');
  const stage = GG.el('div'); main.appendChild(stage);
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'23px'}}, '🎯 专项攻顶结果')));
  stage.appendChild(GG.el('div',{class:'card pad', style:{textAlign:'center', marginBottom:'16px',
      background:'linear-gradient(160deg,var(--accent-soft),#fff 65%)'}},
    GG.el('div',{class:'small muted'}, subjName+' · 难度 '+level+'（'+LEVEL_NAME[level]+'）专项 5 题'),
    GG.el('div',{style:{fontSize:'50px', fontWeight:'800', color:col, lineHeight:'1.1', margin:'6px 0'}}, got+' / '+n),
    GG.el('div',{style:{fontSize:'17px', fontWeight:'700', color:col}}, pass==='break'?'突破 ✓':pass==='partial'?'接近':'再练'),
    GG.el('p',{style:{margin:'10px auto 0', maxWidth:'420px', color:'var(--ink-2)', lineHeight:'1.6'}}, verdict)));
  stage.appendChild(GG.el('div',{class:'row', style:{justifyContent:'center', gap:'12px', flexWrap:'wrap', marginTop:'4px'}},
    GG.el('button',{class:'btn primary', onClick:()=>startChallenge(key, level)}, '🔁 再攻一轮'),
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '↻ 换科目')));
}

/* 难度轨迹折线图（inline SVG，对错用颜色区分） */
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
  const subj = QUIZ[subjKey] || {name:(typeof subjKey==='string'&&subjKey.indexOf('ai:')===0)?subjKey.slice(3):'测验', emoji:'🧠'};
  const stage = GG.el('div'); main.appendChild(stage);
  if(!fromLink){
    await GG.thinking(stage, ['汇总你的作答…','分析难度轨迹…','结合到达难度与正确率…','算出你的预测分…'], 1500);
  }
  const r = grade(trace);
  const ap = abilityPos(trace);
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

  // ＋1：能力定位
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', borderLeft:'4px solid var(--accent)'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '📍 你的能力定位'),
    GG.el('div',{class:'row', style:{gap:'10px', flexWrap:'wrap', margin:'4px 0 12px'}},
      posPill('稳定接住', '难度 '+ap.stable+' · '+LEVEL_NAME[ap.stable], 'var(--good)'),
      posPill('当前边界', '难度 '+ap.challenge+' · '+LEVEL_NAME[ap.challenge], 'var(--warn)')),
    GG.el('p',{style:{margin:'0', color:'var(--ink-2)', lineHeight:'1.6'}}, ap.verdict)
  ));

  // ＋1：专项攻顶
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', textAlign:'center',
      background:'linear-gradient(160deg,var(--accent-soft),#fff 70%)'}},
    GG.el('div',{style:{fontWeight:'700', fontSize:'16px', marginBottom:'4px'}}, '🎯 专项攻顶'),
    GG.el('div',{class:'small muted', style:{marginBottom:'12px'}},
      '只挑你边界「难度 '+ap.challenge+' · '+LEVEL_NAME[ap.challenge]+'」的题，连答 5 道，看你能不能突破'),
    GG.el('button',{class:'btn primary lg', onClick:()=>startChallenge(subjKey, ap.challenge)},
      '攻坚 难度 '+ap.challenge+' ×5 →')
  ));

  const shareSpec = {
    slug:SLUG, title:'自适应测验结果',
    big:{value:r.score, label:'预测分'},
    subtitle: `${subj.name} · 正确率 ${Math.round(r.acc*100)}%`,
    rows:[
      {label:'等级', value:r.grade+'（'+LEVEL_NAME[Math.round(GG.clamp(r.avgL,1,5))]+'区间）'},
      {label:'稳定接住', value:'难度 '+ap.stable+' · '+LEVEL_NAME[ap.stable]},
      {label:'当前边界', value:'难度 '+ap.challenge+' · '+LEVEL_NAME[ap.challenge]},
      {label:'难度轨迹', value:trace.map(t=>t.level).join(' → ')},
    ],
    tags:[subj.name, '难度自适应', '等级'+r.grade],
    note: ap.verdict,
  };

  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '截图分享你的预测分 ↓'), shareSpec));
  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '↻ 再测一次 / 换科目')
  ));
}

start();
})();
