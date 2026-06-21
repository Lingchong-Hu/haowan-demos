/* ubie — 医疗症状自助分诊。选主诉 → 自适应 yes/no 追问（带分支）→ 自护/远程/急诊三级建议。 */
(function(){
const SLUG='ubie';
const {FLOWS, LEVELS, THRESH} = window.UBIE;
let main;

/* ---------- AI 个性化解读（分诊分级仍由本地规则给出，连了 key 再叠加一段贴合你回答的解读） ---------- */
const UBIE_SYS = '你是健康科普助手（仅科普、非诊断、不开药）。根据用户的分诊主诉、关键回答和已得出的分级，给一段个性化、好懂的解读。语气稳、不制造焦虑、不下确诊。只输出严格 JSON：{"reading":"个性化解读(150到250字，说明可能的常见方向、以及为什么是这个分级)","watch":["在家可观察/缓解的点",2到4条],"escalate":["出现哪些情况要尽快就医",2到3条]}';

function aiReading(sysPrompt, userText, escalateTitle){
  const out = GG.el('div',{class:'card pad', style:{display:'none', marginTop:'4px', background:'#fbfbf9', lineHeight:'1.7'}});
  let loaded=false, busy=false;
  const btn = GG.el('button',{class:'btn', onClick:async()=>{
    if(busy) return;
    if(loaded){ out.style.display = out.style.display==='none'?'block':'none'; return; }
    busy=true; const old=btn.textContent; btn.textContent='AI 解读中…'; out.style.display='block';
    GG.clear(out); out.appendChild(GG.el('div',{class:'muted small'}, 'AI 正在生成个性化解读…'));
    try{
      const r = await GG.llm.json(sysPrompt, userText, {max_tokens:700});
      GG.clear(out);
      if(r.reading) out.appendChild(GG.el('p',{style:{margin:'0 0 8px', lineHeight:'1.7'}}, String(r.reading)));
      if(Array.isArray(r.watch) && r.watch.length){
        out.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'6px'}}, '注意观察'));
        out.appendChild(GG.el('ul',{style:{margin:'4px 0 0', paddingLeft:'20px', lineHeight:'1.7'}}, r.watch.map(x=>GG.el('li',null,String(x)))));
      }
      if(Array.isArray(r.escalate) && r.escalate.length){
        out.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'10px'}}, escalateTitle||'出现这些尽快就医'));
        out.appendChild(GG.el('ul',{style:{margin:'4px 0 0', paddingLeft:'20px', lineHeight:'1.7'}}, r.escalate.map(x=>GG.el('li',null,String(x)))));
      }
      loaded=true; btn.textContent='✨ 收起 AI 解读';
    }catch(e){ GG.clear(out); out.appendChild(GG.el('div',{class:'muted small'}, GG.llm.errMsg(e))); btn.textContent=old; }
    busy=false;
  }}, '✨ AI 个性化解读');
  return GG.el('div', null, GG.el('div',{class:'center', style:{margin:'4px 0'}}, btn), out);
}

/* ---------- 分支引擎 ----------
   按 questions 顺序遍历：
   - 基础题（无 onlyIfYes）：始终提问。
   - 跟进题（有 onlyIfYes）：仅当其父题已被「触发」时才提问。
       默认父题答 yes 触发；invertParent:true 时父题答 no 触发（如「还能喝水吗?」答否 → 追问乏力）。
   计分：每个被触发的 yes 累加 severity；任一 redFlag 的 yes → 直接急诊级。
*/
function buildEngine(flowKey){
  const flow = FLOWS[flowKey];
  const qs = flow.questions;
  const answers = {};      // id -> true/false（true 表示「触发方向」命中）
  const asked = [];        // 已问过的题（按顺序）

  function triggered(q){
    if(!q.onlyIfYes) return true;            // 基础题
    const pa = answers[q.onlyIfYes];
    if(pa === undefined) return false;       // 父题还没答 → 暂不出现
    return q.invertParent ? pa === false : pa === true;
  }
  // 找下一道「应当提问且还没问过」的题
  function next(){
    for(const q of qs){
      if(asked.includes(q.id)) continue;
      if(triggered(q)) return q;
    }
    return null;
  }
  // 记录答案；yesLabel/noLabel 仅影响显示，yes 永远代表「这道题的肯定回答」
  function answer(q, yes){ answers[q.id] = yes; asked.push(q.id); }

  function score(){
    let total=0, redHit=null;
    const yesQs=[];
    for(const q of qs){
      if(answers[q.id] !== true) continue;   // 只有肯定回答计分
      yesQs.push(q);
      total += (q.severity||0);
      if(q.redFlag && !redHit) redHit = q;
    }
    let level;
    if(redHit) level = LEVELS.emergency;
    else if(total >= THRESH.tele) level = LEVELS.telehealth;
    else level = LEVELS.selfcare;
    return {level, total, yesQs, redHit};
  }
  return {flow, next, answer, score, answers, asked, qs};
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.k && FLOWS[st.k] && st.a){
    replayFromState(st.k, st.a);
    return;
  }
  intro();
}

function intro(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '哪里不舒服？'),
    GG.el('p', null, '选一个主要症状，我会像分诊护士一样一步步追问——你的每个回答都会决定下一题问什么，最后给出「自护 / 远程问诊 / 尽快就医」三级里的一条明确建议。')
  ));
  main.appendChild(GG.llm.bar());
  const grid = GG.el('div',{style:{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'12px', marginTop:'18px'}});
  Object.keys(FLOWS).forEach(key=>{
    const f = FLOWS[key];
    grid.appendChild(GG.el('button',{class:'card pad', style:{
        cursor:'pointer', textAlign:'left', border:'1px solid var(--line)', background:'var(--surface)'
      }, onClick:()=>runFlow(key)},
      GG.el('div',{style:{fontSize:'30px', lineHeight:'1'}}, f.emoji),
      GG.el('div',{style:{fontWeight:'700', fontSize:'18px', marginTop:'8px'}}, key),
      GG.el('div',{class:'muted', style:{fontSize:'13px', marginTop:'4px', color:'var(--ink-3)'}}, f.blurb)
    ));
  });
  main.appendChild(grid);
}

function runFlow(key){
  const eng = buildEngine(key);
  GG.clear(main);

  // 题目区
  const head = GG.el('div',{class:'hero', style:{paddingBottom:'6px'}},
    GG.el('h1',{style:{fontSize:'22px'}}, FLOWS[key].emoji+' '+key+' · 分诊追问'));
  const prog = GG.el('div',{class:'prog', style:{marginTop:'10px'}}, GG.el('i',{style:{width:'0%'}}));
  const counter = GG.el('div',{class:'muted small', style:{marginTop:'8px', color:'var(--ink-3)', fontSize:'13px'}});
  const card = GG.el('div',{class:'card pad', style:{marginTop:'16px'}});
  main.appendChild(head);
  main.appendChild(prog);
  main.appendChild(counter);
  main.appendChild(card);
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'16px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '← 换个症状')));

  function render(){
    const q = eng.next();
    if(!q){ finish(eng, key); return; }
    const done = eng.asked.length;
    GG.$('i', prog).style.width = Math.min(100, 16 + done*16)+'%';
    counter.textContent = `第 ${done+1} 题　·　已回答 ${done} 题（题目会随你的回答变化）`;
    GG.clear(card);
    card.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '请回答'));
    card.appendChild(GG.el('div',{style:{fontSize:'20px', fontWeight:'650', lineHeight:'1.4'}}, q.q));
    const yesLab = q.yesLabel || '是';
    const noLab  = q.noLabel || '否';
    card.appendChild(GG.el('div',{class:'row', style:{gap:'14px', marginTop:'18px'}},
      GG.el('button',{class:'btn lg', style:{flex:'1', borderColor:'var(--accent)', color:'var(--accent)', fontWeight:'700'},
        onClick:()=>{ eng.answer(q, true); render(); }}, yesLab),
      GG.el('button',{class:'btn lg', style:{flex:'1'}, onClick:()=>{ eng.answer(q, false); render(); }}, noLab)
    ));
  }
  render();
}

async function finish(eng, key){
  GG.encodeState({k:key, a:eng.answers});
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  await GG.thinking(stage, ['汇总你的回答…','比对分诊红旗标准…','计算严重度评分…','给出分级建议…'], 1500);
  showResult(eng, key, stage);
}

// 从分享链接复现：重放答案，无过场
function replayFromState(key, savedAnswers){
  const eng = buildEngine(key);
  // 按引擎顺序重放，确保分支一致
  let q;
  while((q = eng.next())){
    const v = savedAnswers[q.id];
    if(v === undefined) break;     // 链接里缺这题（结构变化）→ 停
    eng.answer(q, v === true);
  }
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  showResult(eng, key, stage);
}

function showResult(eng, key, stage){
  const {level, total, yesQs, redHit} = eng.score();
  GG.clear(stage);

  // 顶部
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'6px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, FLOWS[key].emoji+' '+key+' · 分诊结果')));

  // 三级条：高亮命中级
  const levels = [LEVELS.selfcare, LEVELS.telehealth, LEVELS.emergency];
  const ladder = GG.el('div',{style:{display:'flex', gap:'8px', margin:'16px 0'}});
  levels.forEach(L=>{
    const on = L.key===level.key;
    ladder.appendChild(GG.el('div',{class:'card', style:{
      flex:'1', textAlign:'center', padding:'12px 6px',
      border: on? ('2px solid '+L.color) : '1px solid var(--line)',
      background: on? L.soft : 'var(--surface)',
      opacity: on? '1':'.55'
    }},
      GG.el('div',{style:{fontSize:'22px'}}, L.emoji),
      GG.el('div',{style:{fontWeight: on?'800':'600', fontSize:'14px', marginTop:'4px', color: on? L.color : 'var(--ink-2)'}}, L.short),
      on? GG.el('div',{style:{fontSize:'11px', marginTop:'2px', color:L.color, fontWeight:'700'}}, '◀ 建议') : null
    ));
  });

  // 主结论卡
  const verdict = GG.el('div',{class:'card pad', style:{
      marginBottom:'16px', borderLeft:'5px solid '+level.color, background:level.soft}},
    GG.el('div',{class:'section-t', style:{marginTop:'0', color:level.color}}, '分诊建议'),
    GG.el('div',{style:{fontSize:'22px', fontWeight:'800', color:level.color}}, level.emoji+' '+level.name),
    GG.el('p',{style:{margin:'10px 0 0', color:'var(--ink-2)', fontSize:'15px', lineHeight:'1.6'}}, level.advice)
  );

  // 关键回答（促成判断的 yes）
  const reasonCard = GG.el('div',{class:'card pad', style:{marginBottom:'16px'}});
  reasonCard.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '促成这个判断的关键回答'));
  if(yesQs.length){
    const list = GG.el('div',{class:'stack', style:{gap:'8px', marginTop:'6px'}});
    yesQs.forEach(q=>{
      const isRed = q.redFlag;
      list.appendChild(GG.el('div',{class:'row', style:{gap:'10px', alignItems:'flex-start'}},
        GG.el('span',{class:'pill', style:{
            flex:'none', fontSize:'12px', padding:'2px 9px', borderRadius:'999px', fontWeight:'700',
            background: isRed? LEVELS.emergency.soft : 'var(--accent-soft)',
            color: isRed? LEVELS.emergency.color : 'var(--accent)'}},
          isRed? '🚩 红旗' : '＋'+(q.severity||0)),
        GG.el('span',{style:{fontSize:'14px', color:'var(--ink-2)', lineHeight:'1.5'}}, '你回答「是」：'+q.q)
      ));
    });
    reasonCard.appendChild(list);
    reasonCard.appendChild(GG.el('p',{class:'muted', style:{margin:'12px 0 0', fontSize:'13px', color:'var(--ink-3)'}},
      redHit ? '出现红旗信号 → 直接定为最高一级，不再按累计分判断。'
             : '累计严重度评分 '+total+'（达到 '+THRESH.tele+' 升为远程问诊）。'));
  } else {
    reasonCard.appendChild(GG.el('p',{class:'muted', style:{margin:'6px 0 0', color:'var(--ink-3)'}},
      '你对所有追问都回答「否」，没有触发任何加重信号，因此判为可在家自护观察。'));
  }

  // shareSpec
  const tags = yesQs.length ? yesQs.slice(0,6).map(q=> q.q.replace(/[？?].*$/,'').slice(0,10)) : ['无明显加重信号'];
  const shareSpec = {
    slug: SLUG,
    title: '分诊结果 · '+key,
    subtitle: level.emoji+' '+level.name,
    tags: tags,
    rows: yesQs.length
      ? yesQs.map(q=>({label: q.redFlag?'🚩 红旗':'症状', value: q.q.replace(/[？?]$/,'')}))
      : [{label:'结论', value:'所有追问均回答否，无加重信号'}],
    note: level.advice.length>60 ? level.advice.slice(0,58)+'…' : level.advice
  };

  stage.appendChild(ladder);
  stage.appendChild(verdict);
  stage.appendChild(reasonCard);

  // 连了 AI：在本地分诊之上叠加一段贴合你回答的个性化解读
  if(GG.llm.connected()){
    const userText = `主诉：${key}\n分诊结论：${level.name}\n用户回答"是"的关键问题：`+
      (yesQs.length ? yesQs.map(q=>q.q).join('；') : '对所有追问都回答否');
    stage.appendChild(aiReading(UBIE_SYS, userText, '出现这些尽快就医'));
  }

  // resultCard 因 registry disclaimer:true 会自动追加「非医疗建议」免责声明
  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small', style:{color:'var(--ink-3)'}}, '截图保存这次分诊结果 ↓'),
    shareSpec));
  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '↻ 重新分诊 / 换症状')));
}

start();
})();
