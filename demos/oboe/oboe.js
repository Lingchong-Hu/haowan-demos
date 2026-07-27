/* oboe — 输入任意主题 → 秒变一门结构化迷你课，并在学完后给「掌握度报告」。
   对标 Oboe(oboe.fyi)/NotebookLM/可汗：它们的价值在"学会"，不止"生成内容"。
   +1 = 结课掌握度：跟踪每章答题 → 算掌握度 → 揪出薄弱章 → 重点回顾 + 重做错题（答对实时回升）。
   纯本地可玩；连 key 才用真实模型出课 + 针对薄弱点重讲。 */
(function(){
const SLUG='oboe';
const {SAMPLES, INTROS, CHAPTERS, QUIZZES} = window.OBOE;
let main;
let course = null;       // 当前课程
let progress = null;     // 掌握度跟踪

/* ---------- AI 通路（连了 key 用真实模型，没连退回本地模板引擎） ---------- */
const OBOE_SYS = [
  '你是课程设计引擎：把用户给的主题做成一门结构化迷你课。',
  '只输出严格 JSON（不要 markdown、不要前言）：',
  '{ "title":"课程标题", "intro":"2到3句课程简介", "chapters":[ { "title":"章节标题",',
  '  "points":["要点(完整一句话)", ...2到3条], "quizzes":[ {"q":"单选题干",',
  '  "opts":["选项A","选项B","选项C","选项D"], "correct":0, "why":"解析(为什么对)"} ] (每章1到2道) } ] }',
  '规则：正好 5 个章节；内容真实准确、紧扣主题、循序渐进；correct 是正确项在 opts 里的下标(0-3)；'+
    GG.T('全部简体中文。',
         'All user-facing text — title, intro, chapter titles, points, quiz questions, options, and explanations — must be written in natural English.')
].join('\n');

async function getCourse(topic, useAI){
  if(useAI){
    try{
      const obj = await GG.llm.json(OBOE_SYS, '主题：'+topic, {max_tokens:2200});
      const c = normalizeCourse(obj, topic);
      if(c.chapters.length){ c._ai = true; return c; }
    }catch(e){ GG.toast(GG.llm.errMsg(e)); }
  }
  return buildCourse(topic);
}

function normalizeCourse(obj, topic){
  obj = obj||{};
  const chapters = (Array.isArray(obj.chapters)?obj.chapters:[]).slice(0,6).map((ch,i)=>{
    const points = (Array.isArray(ch.points)?ch.points:[]).map(String).filter(Boolean).slice(0,4);
    const quizzes = (Array.isArray(ch.quizzes)?ch.quizzes:[]).slice(0,2).map(q=>{
      const opts = (Array.isArray(q.opts)?q.opts:[]).map(String).filter(Boolean).slice(0,4);
      while(opts.length<2) opts.push('—');
      let correct = parseInt(q.correct,10); if(isNaN(correct)||correct<0||correct>=opts.length) correct=0;
      return { q:String(q.q||''), opts, correct, why:String(q.why||'') };
    }).filter(q=>q.q);
    return { n:i+1, title:String(ch.title||GG.T('第 '+(i+1)+' 章','Chapter '+(i+1))), points, quizzes };
  }).filter(ch=>ch.points.length||ch.quizzes.length);
  const quizTotal = chapters.reduce((s,c)=>s+c.quizzes.length,0);
  return { topic, title:String(obj.title||courseTitle(topic)),
           intro:String(obj.intro||courseIntro(topic)), chapters, quizTotal };
}

/* 加分 feature：连了 AI 时，每条要点可「✦ 深入」让模型就地展开讲透 + 举例 */
function pointNode(topic, chTitle, text, ai){
  if(!ai) return GG.el('li',{style:{marginBottom:'6px'}}, text);
  const out = GG.el('div',{class:'small', style:{display:'none', marginTop:'8px', padding:'10px 12px',
    borderRadius:'10px', background:'var(--accent-soft)', color:'var(--ink-2)', lineHeight:'1.6'}});
  let loaded=false, busy=false;
  const btn = GG.el('button',{class:'btn ghost', style:{marginLeft:'8px', padding:'2px 10px', fontSize:'12px'},
    onClick:async()=>{
      if(busy) return;
      if(loaded){ out.style.display = out.style.display==='none'?'block':'none'; return; }
      busy=true; const old=btn.textContent; btn.textContent=GG.T('展开中…','Expanding…'); out.style.display='block'; out.textContent=GG.T('AI 正在展开…','AI is expanding this point…');
      try{
        const r = await GG.llm.json(
          '你是讲解助手。针对给定主题里的某个学习要点，用 2到3 句把它讲透，并举一个具体例子。只输出 JSON：{"detail":"..."}'+
            GG.T('', ' Write the "detail" value in natural English.'),
          '主题：'+topic+'\n章节：'+chTitle+'\n要点：'+text, {max_tokens:400});
        out.textContent = r.detail || GG.T('（没有更多内容）','(Nothing more to show)'); loaded=true; btn.textContent=GG.T('✦ 收起','✦ Collapse');
      }catch(e){ out.textContent = GG.llm.errMsg(e); btn.textContent=old; }
      busy=false;
    }}, GG.T('✦ 深入','✦ Go deeper'));
  return GG.el('li',{style:{marginBottom:'10px'}}, GG.el('span', null, text), btn, out);
}

/* ---------- 文案注入 ---------- */
const inj = (t, topic, n)=> String(t).replace(/\{topic\}/g, topic).replace(/\{n\}/g, n);

const TITLE_FORMS = [
  t=>GG.T(`${t} · 速成迷你课`, `${t} · Crash Mini-Course`),
  t=>GG.T(`${t}：从入门到上手`, `${t}: From Zero to Hands-On`),
  t=>GG.T(`5 章学会 ${t}`, `${t} in 5 Chapters`),
  t=>GG.T(`${t} 极速通关课`, `The ${t} Speedrun Course`)
];
function courseTitle(topic){ return TITLE_FORMS[GG.hash('t'+topic)%TITLE_FORMS.length](topic); }
function courseIntro(topic){ return inj(GG.pick(INTROS, GG.hash('i'+topic)), topic); }

function pickPoints(points, topic, key){
  const seed = GG.hash(topic+'|'+key);
  const shuffled = GG.shuffle(points, seed);
  const count = 2 + (seed % 2);
  return shuffled.slice(0, Math.min(count, points.length));
}
function pickQuizzes(quizKinds, topic, key){
  const seed = GG.hash(topic+'|q|'+key);
  const wantTwo = (seed % 3 !== 0) && quizKinds.length>=2;
  const kinds = wantTwo ? quizKinds.slice(0,2) : [quizKinds[0]];
  return kinds.map((kind,ki)=>{
    const bank = QUIZZES[kind] || [];
    const q = bank[GG.hash(topic+'|'+key+'|'+kind+ki) % bank.length];
    return {kind, q};
  });
}

function buildCourse(topic){
  const chapters = CHAPTERS.map((proto, i)=>{
    const n = i+1;
    return {
      n,
      title: inj(proto.titleT, topic, n),
      points: pickPoints(proto.points, topic, proto.key).map(p=>inj(p, topic, n)),
      quizzes: pickQuizzes(proto.quizKinds, topic, proto.key).map(({kind,q})=>({
        kind,
        q: inj(q.q, topic, n),
        opts: q.opts.map(o=>inj(o, topic, n)),
        correct: q.correct,
        why: inj(q.why, topic, n)
      }))
    };
  });
  const quizTotal = chapters.reduce((s,c)=>s+c.quizzes.length, 0);
  return { topic, title:courseTitle(topic), intro:courseIntro(topic), chapters, quizTotal };
}

/* ---------- ＋1：掌握度跟踪 ---------- */
function resetProgress(c){
  progress = { chapters:{}, total:0, answered:0, correct:0, _onChange:null };
  c.chapters.forEach(ch=>{
    progress.chapters[ch.n] = { n:ch.n, title:ch.title, points:ch.points, total:ch.quizzes.length, answered:0, correct:0, missed:[] };
    progress.total += ch.quizzes.length;
  });
}
function recordAnswer(chN, quiz, correct){
  const cp = progress.chapters[chN]; if(!cp) return;
  cp.answered++; progress.answered++;
  if(correct){ cp.correct++; progress.correct++; }
  else cp.missed.push(quiz);
  if(typeof progress._onChange==='function') progress._onChange();
}
// 重做错题答对：从薄弱里划掉、掌握度回升（不重复计入总题数）
function recordRetry(chN, quiz){
  const cp = progress.chapters[chN]; if(!cp) return;
  const i = cp.missed.indexOf(quiz);
  if(i>=0){ cp.missed.splice(i,1); cp.correct++; progress.correct++; }
}

/* ---------- 测验交互节点：点对变绿、错的变红 + 显示解析 + 上报结果 ---------- */
function quizNode(quiz, idx, chN, isRetry, onDone){
  const explain = GG.el('div',{class:'small', style:{
    display:'none', marginTop:'10px', padding:'10px 12px', borderRadius:'10px',
    background:'var(--accent-soft)', color:'var(--ink-2)', lineHeight:'1.6'}});
  let answered=false;
  const optEls=[];
  const optWrap = GG.el('div',{class:'stack', style:{gap:'8px', marginTop:'10px'}});
  quiz.opts.forEach((text, oi)=>{
    const btn = GG.el('button',{class:'btn block', style:{
      textAlign:'left', justifyContent:'flex-start', whiteSpace:'normal', lineHeight:'1.5'},
      onClick:()=>{
        if(answered) return; answered=true;
        const right = oi===quiz.correct;
        btn.style.borderColor = right ? '#2e9e7b' : '#e8543f';
        btn.style.background  = right ? 'rgba(46,158,123,.12)' : 'rgba(232,84,63,.12)';
        btn.style.color       = right ? '#1f7a5d' : '#b53a2c';
        btn.style.fontWeight  = '600';
        if(!right){ const c=optEls[quiz.correct];
          c.style.borderColor='#2e9e7b'; c.style.background='rgba(46,158,123,.12)'; c.style.color='#1f7a5d'; }
        optEls.forEach(e=>{ e.disabled=true; e.style.cursor='default'; });
        explain.style.display='block';
        explain.innerHTML = (right?GG.T('✅ 答对了！','✅ Correct!'):GG.T('❌ 不对。','❌ Not quite.')) + '<br>'+
          '<span style="opacity:.85">'+GG.T('解析：','Why: ')+'</span>'+quiz.why;
        if(isRetry){ if(right) recordRetry(chN, quiz); }
        else recordAnswer(chN, quiz, right);
        if(typeof onDone==='function') onDone(right);
      }
    },
      GG.el('span',{style:{fontWeight:'700', marginRight:'8px', color:'var(--ink-3)'}}, 'ABCD'[oi]),
      text);
    optEls.push(btn); optWrap.appendChild(btn);
  });
  return GG.el('div',{class:'card pad', style:{background:'#fbfbf9'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, (isRetry?GG.T('重做 · ','Retry · '):GG.T('测验 ','Quiz '))+(idx+1)),
    GG.el('div',{style:{fontWeight:'650', fontSize:'15.5px', lineHeight:'1.55'}}, quiz.q),
    optWrap,
    explain
  );
}

/* ---------- ＋1：掌握度报告 ---------- */
function masteryColor(pct){ return pct>=80?'var(--good)':pct>=50?'var(--warn)':'var(--bad)'; }
function masteryVerdict(pct, answered){
  if(!answered) return GG.T('还没答题——往上做几道测验，再回来看你掌握得怎么样。','No answers yet — scroll up, take a few quizzes, then come back to see how you did.');
  if(pct>=80) return GG.T('🟢 学得扎实，这门课基本拿下了。','🟢 Solid work — you have pretty much got this course down.');
  if(pct>=50) return GG.T('🟡 框架有了，下面标出的薄弱章再过一遍就稳了。','🟡 The framework is there — one more pass over the weak chapters flagged below and you are set.');
  return GG.T('🔴 还需要再学一轮——重点看下面标红的章节，做完错题掌握度会回升。','🔴 Time for another round — focus on the chapters flagged in red below; retrying missed questions will bring your mastery back up.');
}

const REVIEW_SYS = '你是学习教练。学员在某主题某章节的测验上答错了，需要你针对他没掌握的点，用 2到3 句把这章的核心重新讲清楚（直白、给一个具体例子或记忆抓手）。只输出严格 JSON：{"reteach":"..."}。'+
  GG.T('简体中文。','Write the "reteach" value in natural English.');

function weakCard(cp){
  const card = GG.el('div',{class:'card pad', style:{marginBottom:'14px', borderLeft:'3px solid var(--warn)', background:'#fffaf2'}},
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center'}},
      GG.el('div',{style:{fontWeight:'680', fontSize:'15px'}}, GG.T('📌 重点回顾 · '+cp.title.replace(/^第 \d+ 章 · /,'第'+cp.n+'章 · '), '📌 Review · '+cp.title.replace(/^Chapter \d+ · /,'Ch. '+cp.n+' · '))),
      GG.el('span',{class:'small', style:{color:'var(--warn)', fontWeight:'700'}},
        cp.answered<cp.total ? GG.T('还没测完','Quiz unfinished') : GG.T(cp.missed.length+' 题没答对', cp.missed.length+' missed'))));
  // 离线：把这章要点再亮一遍 + 错题解析
  card.appendChild(GG.el('div',{class:'small muted', style:{margin:'8px 0 4px'}}, GG.T('再记一遍这几点：','Lock in these points one more time:')));
  card.appendChild(GG.el('ul',{style:{margin:'0', paddingLeft:'20px', lineHeight:'1.65', fontSize:'14px', color:'var(--ink-2)'}},
    cp.points.map(p=> GG.el('li',{style:{marginBottom:'4px'}}, p))));
  // 连了 AI：针对薄弱点重讲一版
  if(GG.llm.connected() && cp.missed.length){
    const out = GG.el('div',{class:'small', style:{display:'none', marginTop:'8px', padding:'10px 12px',
      borderRadius:'10px', background:'#fff', border:'1px solid var(--line)', color:'var(--ink-2)', lineHeight:'1.6'}});
    let loaded=false, busy=false;
    const btn = GG.el('button',{class:'btn ghost', style:{marginTop:'10px', padding:'4px 12px', fontSize:'13px'},
      onClick:async()=>{
        if(busy) return;
        if(loaded){ out.style.display = out.style.display==='none'?'block':'none'; return; }
        busy=true; const old=btn.textContent; btn.textContent=GG.T('AI 重讲中…','AI re-teaching…'); out.style.display='block'; out.textContent=GG.T('AI 正在针对你的薄弱点重讲…','AI is re-teaching this chapter around your weak spots…');
        try{
          const r = await GG.llm.json(REVIEW_SYS,
            '主题：'+course.topic+'\n章节：'+cp.title+'\n你答错的题：'+cp.missed[0].q, {max_tokens:400});
          out.textContent = r.reteach || GG.T('（没有更多内容）','(Nothing more to show)'); loaded=true; btn.textContent=GG.T('✦ 收起重讲','✦ Hide re-teach');
        }catch(e){ out.textContent = GG.llm.errMsg(e); btn.textContent=old; }
        busy=false;
      }}, GG.T('✦ AI 给你重讲这章','✦ Have AI re-teach this chapter'));
    card.appendChild(btn); card.appendChild(out);
  }
  return card;
}

function buildReport(slot){
  GG.clear(slot);
  const total = progress.total, answered = progress.answered, correct = progress.correct;
  const pct = total ? Math.round(correct/total*100) : 0;   // 以全部题为分母：未答=没掌握
  const col = masteryColor(answered? pct : 0);

  slot.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'14px', paddingBottom:'0'}},
    GG.el('h1',{style:{fontSize:'23px'}}, GG.T('📊 你的掌握度报告','📊 Your Mastery Report'))));

  slot.appendChild(GG.el('div',{class:'card pad', style:{margin:'12px 0 16px', background:'linear-gradient(160deg,var(--accent-soft),#fff 60%)'}},
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center', gap:'14px', flexWrap:'wrap'}},
      GG.el('div',{style:{flex:'1', minWidth:'160px'}},
        GG.el('div',{class:'section-t', style:{marginTop:'0'}}, course.title),
        GG.el('div',{class:'small muted'}, GG.T('答对 '+correct+' / '+total+' 题'+(answered<total?'（还有 '+(total-answered)+' 题没答）':''),
                                               correct+' / '+total+' correct'+(answered<total?' ('+(total-answered)+' unanswered)':'')))),
      GG.el('div',{style:{textAlign:'center', flex:'none'}},
        GG.el('div',{style:{fontSize:'42px', fontWeight:'800', lineHeight:'1', color:col}}, String(answered?pct:0)),
        GG.el('div',{class:'small muted'}, GG.T('掌握度','Mastery')))),
    GG.el('div',{style:{marginTop:'12px', fontSize:'15px', fontWeight:'600', color:col, lineHeight:'1.5'}}, masteryVerdict(pct, answered))
  ));

  // 各章掌握度
  const chCard = GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, GG.T('各章掌握度','Mastery by Chapter')));
  Object.values(progress.chapters).forEach(cp=>{
    const cpct = cp.total? Math.round(cp.correct/cp.total*100):0;
    const ccol = masteryColor(cp.answered? cpct : 0);
    const status = cp.answered<cp.total ? GG.T('还没测完','Quiz unfinished') : (cp.missed.length? GG.T('待复习','Needs review') : GG.T('已掌握','Mastered'));
    chCard.appendChild(GG.el('div',{style:{margin:'12px 0 0'}},
      GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'baseline', gap:'8px'}},
        GG.el('div',{style:{fontWeight:'600', fontSize:'14px'}}, GG.T('第'+cp.n+'章 · '+cp.title.replace(/^第 \d+ 章 · /,''), 'Ch. '+cp.n+' · '+cp.title.replace(/^Chapter \d+ · /,''))),
        GG.el('span',{class:'small', style:{color:ccol, fontWeight:'700', flex:'none'}}, status+' · '+cp.correct+'/'+cp.total)),
      GG.el('div',{class:'bar', style:{marginTop:'6px'}}, GG.el('i',{style:{width:(cp.answered?cpct:0)+'%', background:ccol}}))));
  });
  slot.appendChild(chCard);

  // 薄弱点回顾
  const weak = Object.values(progress.chapters).filter(cp=>cp.missed.length || cp.answered<cp.total);
  if(weak.length){
    slot.appendChild(GG.el('div',{class:'section-t'}, GG.T('🎯 该重点复习的','🎯 What to Review First')));
    weak.forEach(cp=> slot.appendChild(weakCard(cp)));
  } else if(answered>0){
    slot.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', borderLeft:'3px solid var(--good)', background:'#f1faf6'}},
      GG.el('div',{style:{fontWeight:'700'}}, GG.T('🎉 全章掌握，这门课你拿下了！','🎉 Every chapter mastered — you own this course!')),
      GG.el('p',{class:'small muted', style:{margin:'6px 0 0'}}, GG.T('截图存档，或换个主题再学一门。','Screenshot it for your records, or pick a new topic and learn another one.'))));
  }

  // 重做错题
  const allMissed = Object.values(progress.chapters).flatMap(cp=> cp.missed.map(q=>({chN:cp.n, q})));
  if(allMissed.length){
    const reqWrap = GG.el('div',{class:'card pad', style:{marginBottom:'16px'}});
    reqWrap.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'0'}}, GG.T('🔁 重做错题（'+allMissed.length+'）','🔁 Retry Missed Questions ('+allMissed.length+')')));
    reqWrap.appendChild(GG.el('p',{class:'small muted', style:{margin:'0 0 6px'}}, GG.T('答对就从薄弱里划掉，掌握度实时回升。','Get one right and it comes off your weak list — your mastery recovers in real time.')));
    const reqStack = GG.el('div',{class:'stack'});
    allMissed.forEach((m,i)=> reqStack.appendChild(quizNode(m.q, i, m.chN, true, (right)=>{ if(right) setTimeout(()=>buildReport(slot), 700); })));
    reqWrap.appendChild(reqStack);
    slot.appendChild(reqWrap);
  }

  // 分享卡（掌握度）
  const shareSpec = {
    slug:SLUG,
    title: GG.T(course.topic+' · 掌握度 '+(answered?pct:0), course.topic+' · Mastery '+(answered?pct:0)),
    subtitle: GG.T(course.chapters.length+' 章 · 答对 '+correct+'/'+total, course.chapters.length+' chapters · '+correct+'/'+total+' correct'),
    tags: [course.topic, answered?(pct>=80?GG.T('已掌握','Mastered'):(pct>=50?GG.T('巩固中','Consolidating'):GG.T('再学一轮','Needs another round'))):GG.T('待测','Untested')],
    note: masteryVerdict(pct, answered),
    rows: Object.values(progress.chapters).map(cp=>({label:GG.T('第'+cp.n+'章','Ch. '+cp.n), value:(cp.answered<cp.total?GG.T('还没测完','Quiz unfinished'):(cp.missed.length?GG.T('待复习','Needs review'):GG.T('已掌握','Mastered')))+' · '+cp.correct+'/'+cp.total}))
  };
  slot.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, GG.T('截图分享你的掌握度 ↓','Screenshot and share your mastery ↓')), shareSpec));

  slot.scrollIntoView({behavior:'smooth', block:'start'});
}

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
      GG.el('div',{class:'gate-glyph'}, '📚'),
      GG.el('div',{class:'gate-name'}, GG.T('秒变一门课','Instant Mini-Course')),
      GG.el('div',{class:'gate-tag'}, GG.T('任何主题 · 秒生一门微课','Any topic · a micro-course in seconds'))),
    GG.el('div',{class:'gate-body'},
      GG.el('div',{class:'gate-hook'}, GG.T('想学点什么？给我一个主题。','What do you want to learn? Give me a topic.')),
      GG.el('p',{class:'gate-sub'}, GG.T('输入任意主题，当场拆成一门有章节、有要点、能答题的迷你课；学完再给你一张「掌握度报告」，揪出最没学透的那几章。',
        'Type any topic and it instantly becomes a structured mini-course — chapters, key points, quizzes. Finish it and you get a Mastery Report that pinpoints the chapters you have not fully nailed.')),
      GG.el('button',{class:'gate-cta', onClick:()=>{ GG.clear(main); intro(); }}, GG.T('📚 开始上课 →','📚 Start Learning →')),
      GG.el('div',{class:'gate-priv'}, GG.T('🔒 纯本地可玩 · 连不连 AI 都能用 · 学习记录只留在这台浏览器','🔒 Runs fully in your browser · works with or without AI · your learning history stays on this device'))
    )
  ));
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  injectGate();
  const st = GG.decodeState();
  if(st && st.topic){ showCourse(st.topic, true); return; }
  welcome();
}

function intro(){
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, GG.T('输入一个主题，秒变一门课','Type a topic, get a course in seconds')),
    GG.el('p', null, GG.T('任何想学的东西——一门技能、一个概念、一种手艺，都即时拆成有章节、有要点、能答题的迷你课；学完还会给你一张「掌握度报告」，告诉你哪几章没学透、要重点复习。',
      'Anything you want to learn — a skill, a concept, a craft — instantly becomes a mini-course with chapters, key points, and quizzes. Finish it and you get a Mastery Report showing which chapters you have not fully nailed and where to focus your review.'))
  ));
  main.appendChild(GG.llm.bar());

  const input = GG.el('input',{class:'field', type:'text',
    placeholder:GG.T('比如：Python 编程 / 咖啡冲煮 / 唐诗鉴赏…','e.g. Python programming / Coffee brewing / Tang poetry…'),
    style:{marginTop:'20px', fontSize:'16px'}});
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') go(); });

  const chipRow = GG.el('div',{class:'chips', style:{marginTop:'12px'}},
    SAMPLES.map(s=> GG.el('span',{class:'chip', onClick:()=>{ input.value=s; go(); }}, s)));

  function go(){
    const v = (input.value||'').trim();
    if(!v){ GG.toast(GG.T('先输入一个主题吧','Type a topic first')); input.focus(); return; }
    showCourse(v, false);
  }

  main.appendChild(input);
  main.appendChild(GG.el('div',{class:'small muted', style:{marginTop:'8px'}}, GG.T('或点一个示例主题：','Or tap a sample topic:')));
  main.appendChild(chipRow);
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'22px'}},
    GG.el('button',{class:'btn primary lg', onClick:go}, GG.T('✨ 生成我的迷你课 →','✨ Build My Mini-Course →'))));
  setTimeout(()=>input.focus(), 60);
}

async function showCourse(topic, fromLink){
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  const useAI = GG.llm.connected();
  if(!fromLink){
    const think = GG.thinking(stage, [
      GG.T(`读取主题「${topic}」…`, `Reading your topic “${topic}”…`),
      useAI ? GG.T('AI 规划课程结构与章节…','AI is mapping out the course structure…') : GG.T('规划课程结构与章节…','Mapping out the course structure…'),
      GG.T(`为「${topic}」编排学习要点…`, `Arranging key points for “${topic}”…`),
      GG.T('出题、写解析中…','Writing quiz questions and explanations…')
    ], useAI ? 2200 : 1600);
    const [c] = await Promise.all([getCourse(topic, useAI), think]);
    course = c;
  }else{
    course = await getCourse(topic, useAI);
  }
  GG.encodeState({topic});
  resetProgress(course);

  GG.clear(stage);

  // 课程头卡
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px', paddingBottom:'0'}},
    GG.el('h1',{style:{fontSize:'26px'}}, '🎓 '+course.title)));
  stage.appendChild(GG.el('div',{class:'center', style:{marginBottom:'2px'}}, GG.llm.badge(!!course._ai)));
  stage.appendChild(GG.el('div',{class:'card pad', style:{
      margin:'14px 0 18px', background:`linear-gradient(160deg,var(--accent-soft),#fff 60%)`}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, GG.T('课程简介','About This Course')),
    GG.el('p',{style:{margin:'0', fontSize:'16px', lineHeight:'1.65'}}, course.intro),
    GG.el('div',{class:'row', style:{marginTop:'12px', gap:'8px', flexWrap:'wrap'}},
      GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', padding:'4px 11px', borderRadius:'999px', fontSize:'13px', fontWeight:'600'}}, GG.T(course.chapters.length+' 个章节', course.chapters.length+' chapters')),
      GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', padding:'4px 11px', borderRadius:'999px', fontSize:'13px', fontWeight:'600'}}, GG.T(course.quizTotal+' 道测验', course.quizTotal+' quizzes')))
  ));

  // 章节
  course.chapters.forEach(ch=>{
    const block = GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
      GG.el('h3',{style:{fontSize:'19px', marginTop:'0'}}, ch.title),
      GG.el('div',{class:'section-t'}, GG.T('学习要点','Key Points')),
      GG.el('ul',{style:{margin:'4px 0 0', paddingLeft:'20px', lineHeight:'1.7'}},
        ch.points.map(p=> pointNode(course.topic, ch.title, p, !!course._ai)))
    );
    const quizWrap = GG.el('div',{class:'stack', style:{marginTop:'14px'}});
    ch.quizzes.forEach((qz,i)=> quizWrap.appendChild(quizNode(qz, i, ch.n, false, null)));
    block.appendChild(quizWrap);
    stage.appendChild(block);
  });

  // ＋1：结课 → 掌握度报告（按钮随答题进度更新）
  const reportSlot = GG.el('div');
  const finishBtn = GG.el('button',{class:'btn primary lg block', onClick:()=>buildReport(reportSlot)});
  function refreshFinish(){
    finishBtn.textContent = GG.T('📊 看我的掌握度报告（已答 '+progress.answered+'/'+progress.total+'）',
                                 '📊 See My Mastery Report ('+progress.answered+'/'+progress.total+' answered)');
  }
  progress._onChange = refreshFinish; refreshFinish();
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', textAlign:'center', background:'linear-gradient(160deg,var(--accent-soft),#fff 70%)'}},
    GG.el('div',{style:{fontWeight:'700', fontSize:'16px', marginBottom:'4px'}}, GG.T('学完了？测测你真的掌握了多少','Finished? See how much you actually mastered')),
    GG.el('div',{class:'small muted', style:{marginBottom:'12px'}}, GG.T('做完上面的测验，这里给你每章掌握度 + 该重点复习哪几章','Complete the quizzes above to get chapter-by-chapter mastery plus exactly which chapters to review')),
    finishBtn));
  stage.appendChild(reportSlot);

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'4px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, GG.T('↻ 换一个主题','↻ Learn Another Topic'))));
}

start();
})();
