/* oboe — 输入任意主题 → 秒变一门结构化迷你课程：
   课程标题 + 5 章（每章 2~3 条学习要点 + 1~2 道即时判分单选测验）。
   "AI" = 本地模板引擎：把主题词注入章节标题/要点/题目，按主题 hash 选要点与题目 → 不同主题不同课。 */
(function(){
const SLUG='oboe';
const {SAMPLES, INTROS, CHAPTERS, QUIZZES} = window.OBOE;
let main;

/* ---------- 文案注入 ---------- */
const inj = (t, topic, n)=> String(t).replace(/\{topic\}/g, topic).replace(/\{n\}/g, n);

// 课程标题：按主题 hash 在几种句式里挑一种
const TITLE_FORMS = [
  t=>`${t} · 速成迷你课`,
  t=>`${t}：从入门到上手`,
  t=>`5 章学会 ${t}`,
  t=>`${t} 极速通关课`
];
function courseTitle(topic){ return TITLE_FORMS[GG.hash('t'+topic)%TITLE_FORMS.length](topic); }
function courseIntro(topic){ return inj(GG.pick(INTROS, GG.hash('i'+topic)), topic); }

/* 按主题种子从数组挑要点（取 2~3 条，稳定但随主题变） */
function pickPoints(points, topic, key){
  const seed = GG.hash(topic+'|'+key);
  const shuffled = GG.shuffle(points, seed);
  const count = 2 + (seed % 2);           // 2 或 3 条
  return shuffled.slice(0, Math.min(count, points.length));
}

/* 按主题为某一章选 1~2 道题 */
function pickQuizzes(quizKinds, topic, key){
  const seed = GG.hash(topic+'|q|'+key);
  const wantTwo = (seed % 3 !== 0) && quizKinds.length>=2;  // 约 2/3 概率出 2 道
  const kinds = wantTwo ? quizKinds.slice(0,2) : [quizKinds[0]];
  return kinds.map((kind,ki)=>{
    const bank = QUIZZES[kind] || [];
    const q = bank[GG.hash(topic+'|'+key+'|'+kind+ki) % bank.length];
    return {kind, q};
  });
}

/* ---------- 构建整门课 ---------- */
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

/* ---------- 测验交互节点：点对变绿、错的变红 + 显示解析 ---------- */
function quizNode(quiz, idx){
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
        // 选中项着色
        btn.style.borderColor = right ? '#2e9e7b' : '#e8543f';
        btn.style.background  = right ? 'rgba(46,158,123,.12)' : 'rgba(232,84,63,.12)';
        btn.style.color       = right ? '#1f7a5d' : '#b53a2c';
        btn.style.fontWeight  = '600';
        // 错选时把正确项也标绿
        if(!right){ const c=optEls[quiz.correct];
          c.style.borderColor='#2e9e7b'; c.style.background='rgba(46,158,123,.12)'; c.style.color='#1f7a5d'; }
        // 锁定其余
        optEls.forEach(e=>{ e.disabled=true; e.style.cursor='default'; });
        explain.style.display='block';
        explain.innerHTML = (right?'✅ 答对了！':'❌ 不对。') + '<br>'+
          '<span style="opacity:.85">解析：</span>'+quiz.why;
      }
    },
      GG.el('span',{style:{fontWeight:'700', marginRight:'8px', color:'var(--ink-3)'}}, 'ABCD'[oi]),
      text);
    optEls.push(btn); optWrap.appendChild(btn);
  });
  return GG.el('div',{class:'card pad', style:{background:'#fbfbf9'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '测验 '+(idx+1)),
    GG.el('div',{style:{fontWeight:'650', fontSize:'15.5px', lineHeight:'1.55'}}, quiz.q),
    optWrap,
    explain
  );
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.topic){ showCourse(st.topic, true); return; }
  intro();
}

function intro(){
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '输入一个主题，秒变一门课'),
    GG.el('p', null, '任何你想学的东西 —— 一门技能、一个概念、一种手艺，都能即时拆成一门有章节、有要点、还能答题自测的结构化迷你课。')
  ));

  const input = GG.el('input',{class:'field', type:'text',
    placeholder:'比如：Python 编程 / 咖啡冲煮 / 唐诗鉴赏…',
    style:{marginTop:'20px', fontSize:'16px'}});
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') go(); });

  const chipRow = GG.el('div',{class:'chips', style:{marginTop:'12px'}},
    SAMPLES.map(s=> GG.el('span',{class:'chip', onClick:()=>{ input.value=s; go(); }}, s)));

  function go(){
    const v = (input.value||'').trim();
    if(!v){ GG.toast('先输入一个主题吧'); input.focus(); return; }
    showCourse(v, false);
  }

  main.appendChild(input);
  main.appendChild(GG.el('div',{class:'small muted', style:{marginTop:'8px'}}, '或点一个示例主题：'));
  main.appendChild(chipRow);
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'22px'}},
    GG.el('button',{class:'btn primary lg', onClick:go}, '✨ 生成我的迷你课 →')));
  setTimeout(()=>input.focus(), 60);
}

async function showCourse(topic, fromLink){
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  if(!fromLink){
    await GG.thinking(stage, [
      `读取主题「${topic}」…`,
      '规划课程结构与章节…',
      `为「${topic}」编排学习要点…`,
      '出题、写解析中…'
    ], 1600);
  }else{
    GG.encodeState({topic});   // 保证从链接进来也回写 hash 状态
  }
  const course = buildCourse(topic);
  if(!fromLink) GG.encodeState({topic});

  GG.clear(stage);

  // 课程头卡
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px', paddingBottom:'0'}},
    GG.el('h1',{style:{fontSize:'26px'}}, '🎓 '+course.title)));
  stage.appendChild(GG.el('div',{class:'card pad', style:{
      margin:'14px 0 18px', background:`linear-gradient(160deg,var(--accent-soft),#fff 60%)`}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '课程简介'),
    GG.el('p',{style:{margin:'0', fontSize:'16px', lineHeight:'1.65'}}, course.intro),
    GG.el('div',{class:'row', style:{marginTop:'12px', gap:'8px', flexWrap:'wrap'}},
      GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', padding:'4px 11px', borderRadius:'999px', fontSize:'13px', fontWeight:'600'}}, course.chapters.length+' 个章节'),
      GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', padding:'4px 11px', borderRadius:'999px', fontSize:'13px', fontWeight:'600'}}, course.quizTotal+' 道测验'))
  ));

  // 章节
  course.chapters.forEach(ch=>{
    const block = GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
      GG.el('h3',{style:{fontSize:'19px', marginTop:'0'}}, ch.title),
      GG.el('div',{class:'section-t'}, '学习要点'),
      GG.el('ul',{style:{margin:'4px 0 0', paddingLeft:'20px', lineHeight:'1.7'}},
        ch.points.map(p=> GG.el('li',{style:{marginBottom:'6px'}}, p)))
    );
    const quizWrap = GG.el('div',{class:'stack', style:{marginTop:'14px'}});
    ch.quizzes.forEach((qz,i)=> quizWrap.appendChild(quizNode(qz, i)));
    block.appendChild(quizWrap);
    stage.appendChild(block);
  });

  // 分享卡
  const shareSpec = {
    slug:SLUG,
    title: topic+' · 速成迷你课',
    subtitle: course.chapters.length+' 章 · '+course.quizTotal+' 道测验',
    tags: [topic],
    note: course.intro,
    rows: course.chapters.map(ch=>({label:'第 '+ch.n+' 章', value: ch.title.replace(/^第 \d+ 章 · /,'')}))
  };
  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '截图分享你的迷你课 ↓'), shareSpec));

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '↻ 换一个主题')));
}

start();
})();
