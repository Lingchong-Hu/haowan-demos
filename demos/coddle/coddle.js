/* coddle —— 双轨育儿陪伴：
   👶 宝宝轨：选观察 + 写一句 + 滑月龄 → 个性化指引 + 发育里程碑「正常范围」（可点：会了/还没）
   🤱 妈妈轨：选关注 + 写一句 + 滑产后天数 → 产后指引 + 就医红线 + 附近服务导流
   贯穿：写了备注先「被接住」（共情）再给干货；连 key 才叠加 AI 个性化层；滑块即时重渲染。 */
(function(){
const SLUG='coddle';
const C = window.CODDLE;
const { TOPICS, bandOf, MOM_TOPICS, MOM_STAGES, stageOf, servicesFor, empathyFor } = C;

let main;
let state = { track:null, topicId:null, note:'', months:6, days:14, marks:{} };

/* ───────── 本地存档：成长记录（每条问询）+ 里程碑标记 ───────── */
const STORE_KEY = 'coddle_store';
let log = [];
function loadStore(){ try{ const s = JSON.parse(localStorage.getItem(STORE_KEY)||'{}'); return (s&&typeof s==='object')? s : {}; }catch(e){ return {}; } }
function saveStore(){ try{ localStorage.setItem(STORE_KEY, JSON.stringify({ log, marks:state.marks })); }catch(e){} }

/* ───────── 启动 ───────── */
function start(){
  main = GG.mountShell(SLUG);
  injectCSS();
  const store = loadStore();
  log = Array.isArray(store.log)? store.log : [];
  const st = GG.decodeState();
  if(st && st.tk){
    state.track  = st.tk;
    state.topicId= st.t || null;
    state.note   = st.n || '';
    state.months = (st.m==null? 6 : st.m)|0;
    state.days   = (st.d==null? 14: st.d)|0;
    state.marks  = st.k || store.marks || {};
    if(state.topicId){ renderTool(); return; }
  } else {
    state.marks = store.marks || {};
  }
  welcome();
}

/* 存入成长记录（每点一次「记入」存一条快照） */
function saveEntry(){
  const isMom = state.track==='mom', topic = curTopic();
  const ageText = isMom ? dayLabel(state.days) : (state.months+' 个月');
  const stageLabel = isMom ? stageOf(state.days).label : bandOf(state.months).label;
  const d = new Date();
  const pad = n=> (n<10?'0':'')+n;
  const dateText = d.getFullYear()+'.'+pad(d.getMonth()+1)+'.'+pad(d.getDate());
  log.push({ id:'e'+d.getTime()+'_'+log.length, track:state.track, topicId:state.topicId,
    emoji:topic.emoji, label:topic.label, note:state.note.trim(), ageText, stageLabel, dateText, ts:d.getTime() });
  saveStore();
}
function updateLogCount(){ const b=GG.$('.cd-log-btn', main); if(b) b.textContent = '📔'+(log.length?' '+log.length:''); }

function babyTopic(id){ return TOPICS.find(t=>t.id===id); }
function momTopic(id){ return MOM_TOPICS.find(t=>t.id===id); }
function curTopic(){ return state.track==='mom' ? momTopic(state.topicId) : babyTopic(state.topicId); }

/* ───────── 首屏：干净的「欢迎」门面（双轨）───────── */
function welcome(){
  GG.clear(main);
  const head = GG.el('div',{class:'cd-top'},
    GG.el('div',{class:'cd-glyph'}, '🍼'),
    GG.el('div',{class:'cd-brand'}, 'Coddle 育儿陪伴'),
    GG.el('div',{class:'cd-tag'}, '照顾宝宝的人，也需要被照顾'));

  const track = (key, emoji, title, sub)=> GG.el('button',{class:'cd-track', onClick:()=>enterTrack(key)},
    GG.el('span',{class:'cd-tk-ic'}, emoji),
    GG.el('span',{class:'cd-tk-txt'},
      GG.el('span',{class:'cd-tk-t'}, title),
      GG.el('span',{class:'cd-tk-s'}, sub)),
    GG.el('span',{class:'cd-tk-go'}, '→'));

  const body = GG.el('div',{class:'cd-body'},
    GG.el('div',{class:'cd-hook', html:'凌晨三点，只有你和宝宝醒着——<b>记一句，我陪你想办法</b>'}),
    GG.el('div',{class:'cd-feats'},
      feat('👶', '宝宝怎么了 · 按月龄给指引，看发育是否在正常范围'),
      feat('🤱', '我自己怎么办 · 产后恢复、情绪、母乳，按阶段陪你过'),
      feat('🏪', '需要搭把手时 · 帮你找附近催乳 / 月子 / 修复 / 月嫂')),
    GG.el('div',{class:'cd-tracks'},
      track('baby','👶','宝宝怎么了','夜醒·吃奶·辅食·大运动·情绪·语言'),
      track('mom','🤱','照顾我自己（产后）','母乳·恶露伤口·情绪·身体修复·月子·睡眠')));

  main.appendChild(GG.el('div',{class:'cd-gate'},
    GG.el('div',{class:'cd-card'}, head, body),
    log.length ? GG.el('button',{class:'cd-gate-log', onClick:renderLog},
      '📔 我的成长记录（已记 '+log.length+' 条）', GG.el('span',{class:'cd-gate-log-go'}, '→')) : null,
    GG.el('div',{class:'cd-priv'},
      GG.el('span', null, '🔒'),
      GG.el('span', null, '记录只留在你的浏览器本机，不上传服务器；演示环境不收集账号信息，附近商家为演示数据。'))));
}
function feat(ic, t){ return GG.el('div',{class:'cd-feat'}, GG.el('span',{class:'ic'}, ic), t); }

function enterTrack(key){
  state.track = key;
  state.topicId = null;
  state.note = '';
  renderTool();
}

/* ───────── 工具主体（两轨共用骨架）───────── */
function renderTool(){
  GG.clear(main);
  const isMom = state.track==='mom';

  // 轨道切换
  const pill = (key, label)=> GG.el('button',{
    class:'cd-seg'+(state.track===key?' on':''),
    onClick:()=>{ if(state.track!==key) enterTrack(key); }
  }, label);
  main.appendChild(GG.el('div',{class:'cd-segwrap'},
    pill('baby','👶 宝宝'),
    pill('mom','🤱 妈妈 · 产后'),
    GG.el('button',{class:'cd-log-btn', title:'成长记录', onClick:renderLog}, '📔'+(log.length?' '+log.length:'')),
    GG.el('button',{class:'cd-home', title:'回首页', onClick:welcome}, '⌂')));

  main.appendChild(GG.el('div',{class:'cd-lead'},
    isMom ? '选一个产后关注、说一句你的情况，再滑动产后天数 —— 同一件事，阶段不同，答案不同。'
          : '选一个方面、说一句你看到的，再滑动宝宝月龄 —— 同一种情况，月龄不同，指引完全不同。'));

  // ① 选主题
  const topics = isMom ? MOM_TOPICS : TOPICS;
  main.appendChild(GG.el('div',{class:'cd-step'}, isMom ? '① 你想聊哪方面？' : '① 想了解宝宝哪方面？'));
  const grid = GG.el('div',{class:'cd-chips'});
  topics.forEach(t=>{
    const active = state.topicId===t.id;
    grid.appendChild(GG.el('button',{class:'cd-chip'+(active?' active':''),
      onClick:()=>{ state.topicId=t.id; renderTool(); }}, t.emoji+' '+t.label));
  });
  main.appendChild(grid);

  if(!state.topicId){
    main.appendChild(GG.el('p',{class:'cd-muted', style:{marginTop:'14px'}}, '👆 先选一类，再继续。'));
    return;
  }
  const topic = curTopic();

  // ② 说一句
  main.appendChild(GG.el('div',{class:'cd-step'}, '② 说一句当下的情况（可选）'));
  main.appendChild(GG.el('input',{type:'text', value:state.note, placeholder:topic.placeholder, class:'cd-input',
    onInput:(e)=>{ state.note=e.target.value; updateGuide(); }}));

  // ③ 滑块
  if(isMom){
    main.appendChild(GG.el('div',{class:'cd-step'}, '③ 现在产后多少天了？（拖动看指引怎么变）'));
    const big = GG.el('span',{class:'cd-big'}, dayLabel(state.days));
    const stg = GG.el('span',{class:'cd-pill'}, stageOf(state.days).label);
    main.appendChild(GG.el('div',{class:'cd-row'}, big, stg));
    const slider = GG.el('input',{type:'range', min:'0', max:'180', step:'1', value:String(state.days), class:'cd-slider',
      onInput:(e)=>{ state.days=parseInt(e.target.value,10); big.textContent=dayLabel(state.days); stg.textContent=stageOf(state.days).label; updateGuide(); }});
    main.appendChild(slider);
    main.appendChild(scaleRow(['出生','满月','3 月','6 月']));
  }else{
    main.appendChild(GG.el('div',{class:'cd-step'}, '③ 宝宝月龄（拖动看指引怎么变）'));
    const big = GG.el('span',{class:'cd-big'}, state.months+' 个月');
    const bnd = GG.el('span',{class:'cd-pill'}, bandOf(state.months).label);
    main.appendChild(GG.el('div',{class:'cd-row'}, big, bnd));
    const slider = GG.el('input',{type:'range', min:'0', max:'36', step:'1', value:String(state.months), class:'cd-slider',
      onInput:(e)=>{ state.months=parseInt(e.target.value,10); big.textContent=state.months+' 个月'; bnd.textContent=bandOf(state.months).label; updateGuide(); }});
    main.appendChild(slider);
    main.appendChild(scaleRow(['出生','1 岁','2 岁','3 岁']));
  }

  // ④ 指引容器
  main.appendChild(GG.el('div',{id:'guideBox', class:'cd-guidebox'}));
  updateGuide();
}

function dayLabel(d){ const w=Math.floor(d/7); return '产后 '+d+' 天'+(w>0?'（第 '+(w+1)+' 周）':''); }
function scaleRow(labels){
  const r = GG.el('div',{class:'cd-scale'});
  labels.forEach(l=> r.appendChild(GG.el('span', null, l)));
  return r;
}

/* ───────── 指引重渲染（滑块/备注变都走这里）───────── */
function updateGuide(){
  const box = GG.$('#guideBox', main);
  if(!box) return;
  GG.clear(box);
  const isMom = state.track==='mom';
  const topic = curTopic();

  // 持久化
  GG.encodeState({ tk:state.track, t:state.topicId, n:state.note, m:state.months, d:state.days, k:state.marks });

  // 0) 写了备注 → 先「被接住」
  if(state.note.trim()){
    box.appendChild(GG.el('div',{class:'cd-echo'},
      GG.el('div',{class:'cd-echo-q'}, '“'+state.note.trim()+'”'),
      GG.el('div',{class:'cd-echo-a'}, '💛 '+empathyFor(topic.id))));
  }

  const cell = isMom ? topic.byStage[stageOf(state.days).id] : topic.byBand[bandOf(state.months).id];
  const stageLabel = isMom ? stageOf(state.days).label : bandOf(state.months).label;
  const headRight = isMom ? dayLabel(state.days).replace('产后 ','') : state.months+' 个月';

  const sectionRow = (title, text)=> GG.el('div',{class:'cd-sec'},
    GG.el('div',{class:'cd-sec-t'}, title),
    GG.el('p',{class:'cd-sec-p'}, text));

  const inner = GG.el('div',null,
    GG.el('div',{class:'cd-result-head'},
      GG.el('h3', null, topic.emoji+' '+topic.label),
      GG.el('span',{class:'cd-pill solid'}, stageLabel)),
    // 宝宝发育里程碑（仅发育类主题）
    (!isMom && topic.milestones) ? milestoneTimeline(topic) : null,
    sectionRow(isMom?'这个阶段的情况':'这个阶段的典型表现', cell.read),
    sectionRow('给你的指引', cell.guide),
    sectionRow('小贴士', cell.tip),
    // 教学视频（占位，保留位置）
    topic.video ? videoFrame(topic, stageLabel) : null,
    // 妈妈轨：就医红线
    (isMom && topic.redflag) ? GG.el('div',{class:'cd-redflag'},
      GG.el('div',{class:'cd-rf-t'}, '⚠️ 这些情况要就医'),
      GG.el('p',{class:'cd-rf-p'}, topic.redflag)) : null
  );

  // shareSpec
  const shareSpec = {
    slug: SLUG,
    title: (isMom?'产后指引 · ':'月龄指引 · ')+topic.label,
    subtitle: stageLabel,
    tags: [topic.label, stageLabel],
    note: cell.guide,
    rows: [
      { label:isMom?'情况':'典型表现', value:cell.read },
      { label:'建议', value:cell.guide },
      { label:'小贴士', value:cell.tip },
    ],
    copyText: [
      '【'+(isMom?'产后指引 · ':'月龄指引 · ')+topic.label+'】',
      stageLabel,
      state.note.trim()? '你写的：“'+state.note.trim()+'”' : null,
      '· '+(isMom?'情况':'典型表现')+'：'+cell.read,
      '· 建议：'+cell.guide,
      '· 小贴士：'+cell.tip,
      isMom&&topic.redflag? '· 就医红线：'+topic.redflag : null,
      '', '—— Coddle 育儿陪伴 · Demo  '+location.href
    ].filter(Boolean).join('\n')
  };

  box.appendChild(GG.resultCard(SLUG, inner, shareSpec));

  // 记入成长记录（每条问询存一笔，攒成成长路径）
  const recBtn = GG.el('button',{class:'cd-rec-btn', onClick:()=>{
    saveEntry(); recBtn.textContent='✓ 已记入成长记录'; recBtn.disabled=true; updateLogCount();
    GG.toast('已记入成长记录 ✓');
  }}, '＋ 记入这一条');
  box.appendChild(GG.el('div',{class:'cd-rec-row'},
    recBtn,
    GG.el('button',{class:'cd-rec-link', onClick:renderLog}, '📔 成长记录'+(log.length?'（'+log.length+'）':''))));

  // 妈妈轨：附近服务导流
  if(isMom && topic.needs) mountServices(box, topic);

  // 连了 key 才出现：AI 个性化层（按需，避免每次滑动都调 API）
  mountAdvice(box, topic, isMom);

  box.appendChild(GG.el('p',{class:'cd-muted center', style:{marginTop:'10px'}},
    isMom? '↑ 拖动上面的「产后天数」—— 同一件事，阶段不同，指引会明显变化。'
         : '↑ 拖动上面的「月龄」—— 同一种情况，指引会随月龄明显改变。'));
}

/* ───────── 宝宝发育里程碑：正常范围 + 可点「会了/还没」───────── */
function milestoneTimeline(topic){
  const m = state.months, MAX=36;
  const pct = x => (Math.max(0,Math.min(MAX,x))/MAX*100);
  const wrap = GG.el('div',{class:'cd-tl'});
  wrap.appendChild(GG.el('div',{class:'cd-tl-cap'}, '🧭 发育里程碑 · 看看是不是在正常范围（点一下告诉我「会了 / 还没」）'));

  // 顶部时间轴 + 当前月龄 playhead
  const axis = GG.el('div',{class:'cd-tl-axis'});
  axis.appendChild(GG.el('div',{class:'cd-tl-line'}));
  const head = GG.el('div',{class:'cd-tl-head', style:{left:pct(m)+'%'}},
    GG.el('div',{class:'cd-tl-head-dot'}),
    GG.el('div',{class:'cd-tl-head-lbl'}, m+'月'));
  axis.appendChild(head);
  wrap.appendChild(axis);

  let flagged = 0;
  topic.milestones.forEach(ms=>{
    const key = topic.id+':'+ms.key;
    const mark = state.marks[key]; // 'yes' | 'no' | undefined
    const mid = (ms.lo+ms.hi)/2;
    // 行：标签 + 范围带（带当前月点）+ 状态
    const band = GG.el('div',{class:'cd-ms-track'},
      GG.el('div',{class:'cd-ms-band', style:{left:pct(ms.lo)+'%', width:(pct(ms.hi)-pct(ms.lo))+'%'}}),
      GG.el('div',{class:'cd-ms-now', style:{left:pct(m)+'%'}}));

    let stat, cls;
    if(mark==='yes'){ stat='✓ 已达成'; cls='ok'; }
    else if(mark==='no'){
      if(m>=ms.hi){ stat='已超过常见窗口 · 可和儿保医生聊聊'; cls='warn'; flagged++; }
      else if(m>=ms.lo){ stat='还在正常窗口，别急'; cls='soft'; }
      else { stat='还没到，正常'; cls='mut'; }
    } else {
      stat = (m<ms.lo)?('常在 '+ms.lo+'–'+ms.hi+' 月'):(m<ms.hi?('正值窗口 '+ms.lo+'–'+ms.hi+' 月'):('多在 '+ms.lo+'–'+ms.hi+' 月达成'));
      cls='mut';
    }

    const toggle = (val)=>{ state.marks[key] = (state.marks[key]===val? undefined : val); saveStore(); updateGuide(); };
    const row = GG.el('div',{class:'cd-ms'+(mid<=m?' reached':'')},
      GG.el('div',{class:'cd-ms-name'}, ms.label),
      band,
      GG.el('div',{class:'cd-ms-act'},
        GG.el('button',{class:'cd-ms-btn'+(mark==='yes'?' on ok':''), onClick:()=>toggle('yes')}, '会了'),
        GG.el('button',{class:'cd-ms-btn'+(mark==='no'?' on no':''), onClick:()=>toggle('no')}, '还没')),
      GG.el('div',{class:'cd-ms-stat '+cls}, stat));
    wrap.appendChild(row);
  });

  if(flagged>0){
    wrap.appendChild(GG.el('div',{class:'cd-tl-note warn'},
      '有 '+flagged+' 项已超过多数宝宝的窗口。每个孩子节奏不同，多数仍是正常的；若你不放心，下次儿保体检时和医生聊聊最稳妥。'));
  }else{
    wrap.appendChild(GG.el('div',{class:'cd-tl-note'},
      '发育有个体差异，范围是「多数宝宝」的窗口，不是及格线。落在窗口内就别太焦虑。'));
  }
  return wrap;
}

/* ───────── 成长记录视图（时间线 + 删除 + 导出）───────── */
function fmtDate(ts){ const d=new Date(ts); const p=n=>(n<10?'0':'')+n; return d.getFullYear()+'.'+p(d.getMonth()+1)+'.'+p(d.getDate()); }
function reachedMilestones(){
  const out=[];
  Object.keys(state.marks||{}).forEach(k=>{ if(state.marks[k]==='yes'){
    const i=k.indexOf(':'); const tid=k.slice(0,i), mk=k.slice(i+1);
    const arr=C.MILESTONES[tid]; const m=arr&&arr.find(x=>x.key===mk); if(m) out.push(m.label); } });
  return out;
}
function entryRow(e){
  return GG.el('div',{class:'cd-log-item'},
    GG.el('div',{class:'cd-log-dot'+(e.track==='mom'?' mom':'')}),
    GG.el('div',{class:'cd-log-body'},
      GG.el('div',{class:'cd-log-metarow'}, e.dateText+'　'+(e.track==='mom'?'🤱 产后':'👶 宝宝')),
      GG.el('div',{class:'cd-log-mainrow'}, e.emoji+' '+e.label, GG.el('span',{class:'cd-log-age'}, e.ageText)),
      e.note ? GG.el('div',{class:'cd-log-noterow'}, '“'+e.note+'”')
             : GG.el('div',{class:'cd-log-noterow muted'}, '（没写备注）')),
    GG.el('button',{class:'cd-log-del', title:'删除', onClick:()=>{ log=log.filter(x=>x.id!==e.id); saveStore(); renderLog(); }}, '✕'));
}
function clearBtn(){
  let armed=false;
  const b=GG.el('button',{class:'cd-clear-btn', onClick:()=>{
    if(!armed){ armed=true; b.textContent='再点一次确认清空'; b.classList.add('arm');
      setTimeout(()=>{ armed=false; b.textContent='清空'; b.classList.remove('arm'); },2600); return; }
    log=[]; saveStore(); GG.toast('已清空成长记录'); renderLog();
  }}, '清空');
  return b;
}
function renderLog(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'cd-segwrap'},
    GG.el('button',{class:'cd-seg', onClick:()=> state.track?renderTool():welcome()}, '← 返回'),
    GG.el('div',{class:'cd-log-title'}, '📔 成长记录'),
    GG.el('button',{class:'cd-home', title:'回首页', onClick:welcome}, '⌂')));

  if(!log.length){
    main.appendChild(GG.el('div',{class:'cd-log-empty'},
      GG.el('div',{class:'cd-log-empty-ic'}, '🌱'),
      GG.el('p',{style:{fontWeight:'700', fontSize:'16px', margin:'6px 0'}}, '还没有记录'),
      GG.el('p',{class:'cd-muted'}, '在指引页点「＋ 记入这一条」，把每一次用心都存下来，慢慢攒成一条成长路径。'),
      GG.el('button',{class:'cd-ai-btn', style:{marginTop:'12px'}, onClick:()=> state.track?renderTool():welcome()}, '去记第一笔 →')));
    return;
  }

  const sorted = log.slice().sort((a,b)=>b.ts-a.ts);
  main.appendChild(GG.el('div',{class:'cd-log-summary'},
    GG.el('div', null, GG.el('b',{style:{fontSize:'18px'}}, log.length+' 次记录'),
      GG.el('span',{class:'cd-muted'}, '　自 '+fmtDate(sorted[sorted.length-1].ts))),
    GG.el('div',{class:'cd-muted', style:{marginTop:'3px'}}, '每一条都是你用心陪伴的印记 —— 导出成一张「成长路径」，留作纪念。')));

  main.appendChild(GG.el('div',{class:'cd-log-actions'},
    GG.el('button',{class:'cd-export-btn', onClick:exportGrowthPath}, '🌱 导出成长路径（图片）'),
    clearBtn()));

  const list = GG.el('div',{class:'cd-log-list'});
  sorted.forEach(e=> list.appendChild(entryRow(e)));
  main.appendChild(list);
}

/* ───────── 导出「成长路径」纪念海报（Canvas）───────── */
function roundRect(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }
function fitText(ctx,s,maxW){ if(!s) return ''; if(ctx.measureText(s).width<=maxW) return s; let r=s; while(r.length>1 && ctx.measureText(r+'…').width>maxW) r=r.slice(0,-1); return r+'…'; }
function drawGrowthCanvas(){
  const acc='#d77a98', ink='#2b2630', ink2='#6a646f', ink3='#9a949f', cream='#fbf7f4';
  const F=(w,s)=> w+' '+s+'px -apple-system,"PingFang SC","Microsoft YaHei",sans-serif';
  const sorted=log.slice().sort((a,b)=>a.ts-b.ts);
  const shown=sorted.slice(-14);
  const reached=reachedMilestones();
  const anyBaby = shown.some(e=>e.track==='baby') || reached.length>0;
  const title = anyBaby ? '宝宝的成长路径' : '我的产后恢复之路';
  const W=720, scale=2, padX=46, headerH=164, rowH=80;
  const msH = reached.length ? 96 : 0;
  const H = headerH + 40 + shown.length*rowH + (msH? msH+14 : 0) + 64 + 56;
  const c=document.createElement('canvas'); c.width=W*scale; c.height=H*scale;
  const ctx=c.getContext('2d'); ctx.scale(scale,scale); ctx.textBaseline='alphabetic';
  ctx.fillStyle=cream; ctx.fillRect(0,0,W,H);
  // header
  const g=ctx.createLinearGradient(0,0,W,headerH); g.addColorStop(0,acc); g.addColorStop(1,'#e89ab6');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,headerH);
  ctx.fillStyle='#fff';
  ctx.font=F('800',40); ctx.fillText('🌱 '+title, padX, 76);
  const range = sorted.length ? (fmtDate(sorted[0].ts)+'  –  '+fmtDate(sorted[sorted.length-1].ts)) : '';
  ctx.globalAlpha=.96; ctx.font=F('500',20); ctx.fillText(range+'   ·   共 '+log.length+' 次用心记录', padX, 110);
  ctx.globalAlpha=.9; ctx.font=F('500',15); ctx.fillText('Coddle 育儿陪伴 · 成长记录', padX, 138);
  ctx.globalAlpha=1;
  // timeline
  const y = headerH + 40, lineX = padX + 8;
  ctx.strokeStyle='#ecdfe6'; ctx.lineWidth=2;
  ctx.beginPath(); ctx.moveTo(lineX, headerH+22); ctx.lineTo(lineX, y+(shown.length-1)*rowH+8); ctx.stroke();
  shown.forEach((e,i)=>{
    const cy=y+i*rowH, tx=lineX+24;
    ctx.fillStyle=acc; ctx.beginPath(); ctx.arc(lineX, cy, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(lineX, cy, 2.4, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle=ink3; ctx.font=F('600',14); ctx.fillText(e.dateText+'   '+(e.track==='mom'?'🤱 产后':'👶 宝宝'), tx, cy-12);
    ctx.fillStyle=ink; ctx.font=F('740',20); ctx.fillText(fitText(ctx, e.emoji+' '+e.label+'  ·  '+e.ageText, W-tx-padX), tx, cy+10);
    if(e.note){ ctx.fillStyle=ink2; ctx.font=F('400',16); ctx.fillText(fitText(ctx, '“'+e.note+'”', W-tx-padX), tx, cy+32); }
  });
  let by = y + shown.length*rowH + 6;
  if(msH){
    ctx.fillStyle='#fbeef4'; roundRect(ctx, padX, by, W-padX*2, msH-12, 14); ctx.fill();
    ctx.fillStyle=acc; ctx.font=F('740',18); ctx.fillText('🏆 这一路，'+(anyBaby?'宝宝':'你')+'学会了', padX+18, by+30);
    ctx.fillStyle=ink; ctx.font=F('600',17); ctx.fillText(fitText(ctx, reached.join('  ·  '), W-padX*2-36), padX+18, by+58);
    by += msH-12 + 14;
  }
  by += 36;
  ctx.textAlign='center';
  ctx.fillStyle=ink2; ctx.font=F('600',19);
  ctx.fillText(anyBaby?'每一次记录，都是你陪他长大的证明。':'每一次记录，都是你好好爱自己的证明。', W/2, by);
  ctx.fillStyle=ink3; ctx.font=F('500',13.5);
  ctx.fillText('由 Coddle 育儿陪伴生成 · 仅作交互演示，非医疗建议', W/2, H-22);
  ctx.textAlign='left';
  return c;
}
function exportGrowthPath(){
  if(!log.length){ GG.toast('还没有记录可导出'); return; }
  const c = drawGrowthCanvas(); c.className='cd-ov-canvas';
  const overlay = GG.el('div',{class:'cd-ov', onClick:(ev)=>{ if(ev.target===overlay) overlay.remove(); }},
    GG.el('div',{class:'cd-ov-card'},
      GG.el('div',{class:'cd-ov-h'}, '🌱 你的成长路径'),
      c,
      GG.el('div',{class:'cd-ov-row'},
        GG.el('button',{class:'cd-ai-btn', onClick:()=>GG.downloadCanvas(c,'成长路径')}, '⬇️ 存成图片'),
        GG.el('button',{class:'cd-seg', onClick:()=>GG.copyCanvas(c)}, '📷 复制图片'),
        GG.el('button',{class:'cd-seg', onClick:()=>overlay.remove()}, '关闭'))));
  document.body.appendChild(overlay);
}

/* ───────── 教学视频框（占位：保留教学视频位置，上线后替换为播放器）───────── */
function videoFrame(topic, stageLabel){
  return GG.el('div',{class:'cd-video', onClick:()=>GG.toast('教学视频即将上线（演示）')},
    GG.el('div',{class:'cd-video-frame'},
      GG.el('div',{class:'cd-video-soon'}, '即将上线'),
      GG.el('div',{class:'cd-video-play'}, '▶'),
      GG.el('div',{class:'cd-video-dur'}, '🎬 教学视频 · 约 2 分钟')),
    GG.el('div',{class:'cd-video-meta'},
      GG.el('div',{class:'cd-video-title'}, topic.video),
      GG.el('div',{class:'cd-video-sub'}, '为「'+stageLabel+'」准备 · 上线后点这里看「具体怎么做」')));
}

/* ───────── 妈妈轨：附近服务导流（演示商家）───────── */
function mountServices(box, topic){
  const list = servicesFor(topic.needs);
  if(!list.length) return;
  const sec = GG.el('div',{class:'cd-svc-sec'});
  sec.appendChild(GG.el('div',{class:'cd-svc-cap'},
    GG.el('span', null, '🏪 需要搭把手？附近这些可以帮你'),
    GG.el('span',{class:'cd-svc-tag'}, '演示商家')));
  list.forEach(s=>{
    sec.appendChild(GG.el('div',{class:'cd-svc'},
      GG.el('div',{class:'cd-svc-main'},
        GG.el('div',{class:'cd-svc-name'}, s.name),
        GG.el('div',{class:'cd-svc-blurb'}, s.blurb),
        GG.el('div',{class:'cd-svc-meta'},
          GG.el('span',{class:'cd-svc-pill'}, '★ '+s.rating),
          GG.el('span',{class:'cd-svc-pill'}, '📍 '+s.dist),
          GG.el('span',{class:'cd-svc-pill price'}, s.price))),
      GG.el('button',{class:'cd-svc-cta', onClick:()=>GG.toast('已发送咨询给「'+s.name+'」（演示）')}, '预约咨询')));
  });
  if(topic.id==='mood'){
    sec.appendChild(GG.el('div',{class:'cd-svc-help'},
      '如果情绪已经影响到吃饭睡觉、或出现伤害自己/宝宝的念头，请立刻联系家人并就医，或拨打 12320 卫生热线、当地心理援助热线——这不是矫情，是该被认真对待的求助。'));
  }
  box.appendChild(sec);
}

/* ───────── AI 个性化层（连 key 才出现，按需触发）───────── */
const CODDLE_SYS = '你是温柔、专业、不制造焦虑的育儿与产后陪伴顾问。家长会给出：场景是「宝宝(按月龄)」还是「妈妈产后(按产后天数)」、具体关注方面、阶段、以及一句记录。请针对这条具体记录与阶段给贴心、可执行的指引。只输出严格 JSON：{"summary":"一句温暖回应这条记录","advice":["3条针对性建议"],"tip":"一条小贴士"}。全部简体中文，温柔、具体、不堆砌；涉及健康时提醒必要情况找医生，但不诊断、不开药。';
function aiUser(topic, isMom){
  const stage = isMom ? stageOf(state.days).label : bandOf(state.months).label;
  return (isMom?'场景：妈妈产后\n关注：':'场景：宝宝\n观察：')+topic.label
    +'\n阶段：'+stage+(isMom?('（产后 '+state.days+' 天）'):('（'+state.months+' 个月）'))
    +'\n记录：“'+((state.note||'').trim()||'（没写备注）')+'”';
}
function renderAdvice(body, obj){
  GG.clear(body);
  if(obj.summary) body.appendChild(GG.el('p',{class:'cd-ai-sum'}, String(obj.summary)));
  const advice = (Array.isArray(obj.advice)?obj.advice:[]).map(String).filter(Boolean);
  if(advice.length) body.appendChild(GG.el('ul',{class:'cd-ai-ul'}, advice.map(t=>GG.el('li', null, t))));
  if(obj.tip) body.appendChild(GG.el('p',{class:'cd-muted', style:{margin:'10px 0 0'}}, '💡 '+String(obj.tip)));
  if(!advice.length && !obj.summary) body.appendChild(GG.el('p',{class:'cd-muted', style:{margin:'0'}}, '这次没生成出建议，上面的指引不受影响。'));
}
function mountAdvice(box, topic, isMom){
  if(!GG.llm || !GG.llm.connected()) return;
  const aiBody = GG.el('div');
  const aiBtn = GG.el('button',{class:'cd-ai-btn', onClick:()=>{
    aiBtn.disabled=true; GG.clear(aiBody);
    aiBody.appendChild(GG.el('p',{class:'cd-muted', style:{margin:'8px 0 0'}}, 'AI 正在针对你这条记录想建议…'));
    GG.llm.json(CODDLE_SYS, aiUser(topic,isMom), {max_tokens:700})
      .then(obj=>{ renderAdvice(aiBody,obj); aiBtn.disabled=false; aiBtn.textContent='↻ 重新生成'; })
      .catch(e=>{ GG.clear(aiBody); aiBody.appendChild(GG.el('p',{class:'cd-muted', style:{margin:'8px 0 0'}},
        'AI 建议没拿到（'+(e&&e.code||'NET')+'），上面的指引不受影响。')); aiBtn.disabled=false; });
  }}, '✨ 让 AI 针对你这条记录给建议');
  box.appendChild(GG.el('div',{class:'cd-ai'},
    GG.el('div',{class:'cd-row', style:{justifyContent:'space-between', alignItems:'center'}},
      GG.el('div',{class:'cd-ai-cap'}, 'AI 个性化指引'),
      GG.llm.badge(true)),
    GG.el('p',{class:'cd-muted', style:{margin:'2px 0 8px'}}, '结合你写的记录和当前阶段，让 AI 给更具体的建议。'),
    aiBtn, aiBody));
}

/* ───────── 作用域样式 ───────── */
function injectCSS(){
  if(GG.$('#cd-style')) return;
  const a='var(--accent)';
  const css = `
  .cd-gate{max-width:440px;margin:6px auto 0}
  .cd-card{background:var(--surface,#fff);border:1px solid var(--line,#eceaf0);border-radius:22px;overflow:hidden;box-shadow:0 18px 50px -28px rgba(80,40,90,.4)}
  .cd-top{position:relative;padding:30px 22px 22px;text-align:center;color:#fff;background:linear-gradient(135deg,${a},#e89ab6 130%)}
  .cd-glyph{font-size:42px;line-height:1}
  .cd-brand{font-size:22px;font-weight:820;margin-top:8px;letter-spacing:.5px}
  .cd-tag{font-size:13px;opacity:.92;margin-top:4px}
  .cd-body{padding:20px 18px 18px}
  .cd-hook{font-size:18px;line-height:1.5;text-align:center;color:var(--ink,#2b2630)}
  .cd-hook b{color:${a}}
  .cd-feats{margin:16px 0 4px;display:flex;flex-direction:column;gap:9px}
  .cd-feat{display:flex;gap:9px;align-items:flex-start;font-size:13.5px;color:var(--ink-2,#5a545f);line-height:1.45}
  .cd-feat .ic{flex:none;font-size:16px;line-height:1.3}
  .cd-tracks{margin-top:16px;display:flex;flex-direction:column;gap:11px}
  .cd-track{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:14px 15px;border-radius:15px;border:1.5px solid var(--line,#eceaf0);background:var(--surface,#fff);cursor:pointer;transition:.16s}
  .cd-track:hover{border-color:${a};background:var(--accent-soft,#fbeef4);transform:translateY(-1px)}
  .cd-tk-ic{font-size:26px;flex:none}
  .cd-tk-txt{display:flex;flex-direction:column;flex:1;min-width:0}
  .cd-tk-t{font-size:16px;font-weight:760;color:var(--ink,#2b2630)}
  .cd-tk-s{font-size:11.5px;color:var(--ink-3,#8b8590);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .cd-tk-go{font-size:20px;color:${a};flex:none;font-weight:700}
  .cd-priv{display:flex;gap:8px;align-items:flex-start;margin:14px 6px 0;font-size:11px;color:var(--ink-3,#9a949f);line-height:1.5}
  /* 工具骨架 */
  .cd-segwrap{display:flex;gap:8px;align-items:center;margin:2px 0 10px}
  .cd-seg{padding:7px 14px;border-radius:999px;border:1.5px solid var(--line,#eceaf0);background:var(--surface,#fff);font-size:14px;font-weight:640;cursor:pointer;color:var(--ink-2,#5a545f);transition:.15s}
  .cd-seg.on{background:${a};border-color:${a};color:#fff}
  .cd-home{margin-left:auto;width:34px;height:34px;border-radius:50%;border:1.5px solid var(--line,#eceaf0);background:var(--surface,#fff);cursor:pointer;font-size:16px;color:var(--ink-2,#5a545f)}
  .cd-lead{font-size:13.5px;color:var(--ink-2,#5a545f);line-height:1.5;margin-bottom:6px}
  .cd-step{font-size:13px;font-weight:760;color:var(--ink,#2b2630);margin:18px 0 9px}
  .cd-chips{display:flex;flex-wrap:wrap;gap:9px}
  .cd-chip{padding:8px 14px;border-radius:999px;border:1.5px solid var(--line,#eceaf0);background:var(--surface,#fff);font-size:14.5px;cursor:pointer;color:var(--ink,#2b2630);transition:.15s}
  .cd-chip:hover{border-color:${a}}
  .cd-chip.active{background:${a};border-color:${a};color:#fff}
  .cd-input{width:100%;padding:12px 14px;font-size:15px;border-radius:12px;border:1.5px solid var(--line,#e3e3e8);box-sizing:border-box;background:var(--surface,#fff);color:var(--ink,#2b2630)}
  .cd-input:focus{outline:none;border-color:${a}}
  .cd-row{display:flex;align-items:center;gap:10px;margin-bottom:7px}
  .cd-big{font-weight:840;font-size:22px;color:${a}}
  .cd-pill{padding:4px 12px;border-radius:999px;background:var(--accent-soft,#fbeef4);color:${a};font-weight:720;font-size:12.5px}
  .cd-pill.solid{background:${a};color:#fff}
  .cd-slider{width:100%;accent-color:${a};cursor:pointer}
  .cd-scale{display:flex;justify-content:space-between;margin-top:3px;font-size:11px;color:var(--ink-3,#9a949f)}
  .cd-guidebox{margin-top:18px}
  .cd-muted{font-size:12px;color:var(--ink-3,#9a949f);line-height:1.5}
  .cd-muted.center{text-align:center}
  /* 共情回应 */
  .cd-echo{background:linear-gradient(180deg,var(--accent-soft,#fbeef4),transparent);border-left:3px solid ${a};border-radius:10px;padding:11px 13px;margin-bottom:13px}
  .cd-echo-q{font-style:italic;color:var(--ink-2,#5a545f);font-size:13.5px}
  .cd-echo-a{margin-top:6px;font-size:14px;font-weight:600;color:var(--ink,#2b2630);line-height:1.5}
  /* 结果 */
  .cd-result-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap}
  .cd-result-head h3{font-size:19px;margin:0}
  .cd-sec{margin-bottom:12px}
  .cd-sec-t{font-size:13px;font-weight:760;color:${a};margin-bottom:3px}
  .cd-sec-p{margin:0;line-height:1.6;color:var(--ink,#2b2630);font-size:14.5px}
  .cd-redflag{margin-top:6px;background:#fff4f2;border:1px solid #ffd9d2;border-radius:12px;padding:11px 13px}
  .cd-rf-t{font-size:13px;font-weight:780;color:#c0392b;margin-bottom:4px}
  .cd-rf-p{margin:0;font-size:13px;line-height:1.55;color:#8a3326}
  /* 里程碑时间轴 */
  .cd-tl{margin:4px 0 16px;padding:13px;border:1px solid var(--line,#eceaf0);border-radius:14px;background:var(--bg-soft,#faf8fb)}
  .cd-tl-cap{font-size:12.5px;font-weight:700;color:var(--ink,#2b2630);line-height:1.45;margin-bottom:14px}
  .cd-tl-axis{position:relative;height:26px;margin:0 4px 4px}
  .cd-tl-line{position:absolute;top:18px;left:0;right:0;height:2px;background:var(--line,#e3dfe6)}
  .cd-tl-head{position:absolute;top:0;transform:translateX(-50%);text-align:center}
  .cd-tl-head-dot{width:10px;height:10px;border-radius:50%;background:${a};margin:14px auto 0;box-shadow:0 0 0 4px var(--accent-soft,#fbeef4)}
  .cd-tl-head-lbl{font-size:10px;color:${a};font-weight:760;margin-top:1px}
  .cd-ms{display:grid;grid-template-columns:58px 1fr auto;align-items:center;gap:8px;padding:6px 0;border-top:1px dashed var(--line,#ece8f0)}
  .cd-ms-name{font-size:12.5px;font-weight:640;color:var(--ink,#2b2630)}
  .cd-ms.reached .cd-ms-name{color:${a}}
  .cd-ms-track{position:relative;height:14px}
  .cd-ms-band{position:absolute;top:4px;height:6px;border-radius:6px;background:var(--accent-soft,#f3d9e6);border:1px solid ${a};opacity:.65}
  .cd-ms-now{position:absolute;top:0;width:2px;height:14px;background:${a};transform:translateX(-1px)}
  .cd-ms-act{display:flex;gap:4px}
  .cd-ms-btn{font-size:11px;padding:3px 8px;border-radius:999px;border:1px solid var(--line,#e3e3e8);background:var(--surface,#fff);cursor:pointer;color:var(--ink-2,#6a646f)}
  .cd-ms-btn.on.ok{background:#1f9e6f;border-color:#1f9e6f;color:#fff}
  .cd-ms-btn.on.no{background:#e6892b;border-color:#e6892b;color:#fff}
  .cd-ms-stat{grid-column:1 / -1;font-size:11px;margin-top:1px}
  .cd-ms-stat.ok{color:#1f9e6f}.cd-ms-stat.warn{color:#c0392b}.cd-ms-stat.soft{color:#b9742a}.cd-ms-stat.mut{color:var(--ink-3,#9a949f)}
  .cd-tl-note{font-size:11.5px;line-height:1.5;color:var(--ink-3,#8b8590);margin-top:10px}
  .cd-tl-note.warn{color:#8a3326;background:#fff4f2;border:1px solid #ffd9d2;border-radius:10px;padding:8px 10px}
  /* 服务导流 */
  .cd-svc-sec{margin-top:14px}
  .cd-svc-cap{display:flex;justify-content:space-between;align-items:center;font-size:14px;font-weight:740;color:var(--ink,#2b2630);margin-bottom:10px}
  .cd-svc-tag{font-size:10.5px;font-weight:600;color:var(--ink-3,#9a949f);border:1px solid var(--line,#e3e3e8);border-radius:999px;padding:2px 8px}
  .cd-svc{display:flex;align-items:center;gap:10px;padding:11px 13px;border:1px solid var(--line,#eceaf0);border-radius:13px;margin-bottom:9px;background:var(--surface,#fff)}
  .cd-svc-main{flex:1;min-width:0}
  .cd-svc-name{font-size:14px;font-weight:700;color:var(--ink,#2b2630)}
  .cd-svc-blurb{font-size:12px;color:var(--ink-2,#5a545f);margin:2px 0 6px;line-height:1.4}
  .cd-svc-meta{display:flex;flex-wrap:wrap;gap:6px}
  .cd-svc-pill{font-size:11px;color:var(--ink-3,#8b8590);background:var(--bg-soft,#f6f3f7);border-radius:6px;padding:2px 7px}
  .cd-svc-pill.price{color:${a};font-weight:700}
  .cd-svc-cta{flex:none;align-self:center;padding:9px 14px;border-radius:10px;border:none;background:${a};color:#fff;font-size:13px;font-weight:700;cursor:pointer}
  .cd-svc-help{font-size:12px;line-height:1.55;color:#8a3326;background:#fff4f2;border:1px solid #ffd9d2;border-radius:10px;padding:10px 12px;margin-top:2px}
  /* 教学视频框 */
  .cd-video{margin:4px 0 14px;border:1px solid var(--line,#eceaf0);border-radius:14px;overflow:hidden;cursor:pointer;background:var(--surface,#fff);transition:.15s}
  .cd-video:hover{border-color:${a};transform:translateY(-1px);box-shadow:0 10px 26px -18px rgba(80,40,90,.5)}
  .cd-video-frame{position:relative;aspect-ratio:16/9;background:linear-gradient(135deg,#3a2f3c,#7a5566);display:flex;align-items:center;justify-content:center}
  .cd-video-play{width:54px;height:54px;border-radius:50%;background:rgba(255,255,255,.94);color:${a};display:flex;align-items:center;justify-content:center;font-size:21px;padding-left:3px;box-shadow:0 6px 18px -6px rgba(0,0,0,.5)}
  .cd-video:hover .cd-video-play{transform:scale(1.08)}
  .cd-video-soon{position:absolute;top:9px;right:9px;font-size:10px;font-weight:700;color:#fff;background:rgba(0,0,0,.38);border:1px solid rgba(255,255,255,.55);border-radius:999px;padding:2px 9px}
  .cd-video-dur{position:absolute;bottom:9px;left:11px;font-size:11px;color:rgba(255,255,255,.92);text-shadow:0 1px 3px rgba(0,0,0,.4)}
  .cd-video-meta{padding:10px 13px}
  .cd-video-title{font-size:14px;font-weight:740;color:var(--ink,#2b2630)}
  .cd-video-sub{font-size:11.5px;color:var(--ink-3,#9a949f);margin-top:2px}
  /* AI 层 */
  .cd-ai{margin-top:12px;border-left:3px solid ${a};background:var(--bg-soft,#faf8fb);border-radius:10px;padding:12px 13px}
  .cd-ai-cap{font-size:13px;font-weight:760;color:var(--ink,#2b2630)}
  .cd-ai-btn{margin-top:2px;padding:9px 14px;border-radius:10px;border:1.5px solid ${a};background:var(--surface,#fff);color:${a};font-size:13px;font-weight:700;cursor:pointer}
  .cd-ai-btn:disabled{opacity:.6;cursor:default}
  .cd-ai-sum{margin:8px 0 0;font-weight:640;line-height:1.55;color:var(--ink,#2b2630)}
  .cd-ai-ul{margin:6px 0 0;padding-left:20px;color:var(--ink-2,#5a545f);line-height:1.7;font-size:13.5px}
  /* 成长记录入口 */
  .cd-log-btn{margin-left:auto;height:34px;padding:0 12px;border-radius:999px;border:1.5px solid ${a};background:var(--accent-soft,#fbeef4);color:${a};font-size:13px;font-weight:740;cursor:pointer}
  .cd-segwrap .cd-log-btn + .cd-home{margin-left:8px}
  .cd-gate-log{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;margin:12px 0 0;padding:11px;border-radius:13px;border:1.5px solid ${a};background:var(--surface,#fff);color:${a};font-size:13.5px;font-weight:720;cursor:pointer}
  .cd-gate-log:hover{background:var(--accent-soft,#fbeef4)}
  .cd-gate-log-go{font-size:16px}
  /* 记一笔 */
  .cd-rec-row{display:flex;gap:10px;align-items:center;margin-top:12px}
  .cd-rec-btn{flex:1;padding:11px;border-radius:12px;border:none;background:${a};color:#fff;font-size:14px;font-weight:740;cursor:pointer}
  .cd-rec-btn:disabled{background:#cdbcc5;cursor:default}
  .cd-rec-link{padding:11px 12px;border-radius:12px;border:1.5px solid var(--line,#eceaf0);background:var(--surface,#fff);color:var(--ink-2,#5a545f);font-size:13px;font-weight:640;cursor:pointer;white-space:nowrap}
  /* 成长记录视图 */
  .cd-log-title{font-size:16px;font-weight:800;color:var(--ink,#2b2630);margin:0 auto 0 8px}
  .cd-log-empty{text-align:center;padding:36px 18px;color:var(--ink-2,#5a545f)}
  .cd-log-empty-ic{font-size:46px}
  .cd-log-summary{background:linear-gradient(135deg,var(--accent-soft,#fbeef4),transparent);border-radius:14px;padding:14px 15px;margin-bottom:12px}
  .cd-log-actions{display:flex;gap:10px;margin-bottom:14px}
  .cd-export-btn{flex:1;padding:12px;border-radius:12px;border:none;background:${a};color:#fff;font-size:14px;font-weight:760;cursor:pointer;box-shadow:0 10px 24px -14px ${a}}
  .cd-clear-btn{padding:12px 14px;border-radius:12px;border:1.5px solid var(--line,#eceaf0);background:var(--surface,#fff);color:var(--ink-3,#9a949f);font-size:13px;cursor:pointer}
  .cd-clear-btn.arm{border-color:#c0392b;color:#c0392b}
  .cd-log-list{display:flex;flex-direction:column}
  .cd-log-item{display:flex;gap:11px;align-items:flex-start;padding:12px 2px;border-top:1px solid var(--line,#f0ecf2)}
  .cd-log-item:first-child{border-top:none}
  .cd-log-dot{flex:none;width:11px;height:11px;border-radius:50%;margin-top:5px;background:${a};box-shadow:0 0 0 4px var(--accent-soft,#fbeef4)}
  .cd-log-dot.mom{background:#c0567f;box-shadow:0 0 0 4px #f7e4ec}
  .cd-log-body{flex:1;min-width:0}
  .cd-log-metarow{font-size:11.5px;color:var(--ink-3,#9a949f)}
  .cd-log-mainrow{font-size:15px;font-weight:700;color:var(--ink,#2b2630);margin:2px 0;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .cd-log-age{font-size:11.5px;font-weight:640;color:${a};background:var(--accent-soft,#fbeef4);border-radius:999px;padding:2px 9px}
  .cd-log-noterow{font-size:13px;color:var(--ink-2,#5a545f);font-style:italic;line-height:1.45}
  .cd-log-noterow.muted{color:var(--ink-3,#bdb6c2);font-style:normal}
  .cd-log-del{flex:none;width:28px;height:28px;border-radius:50%;border:none;background:transparent;color:var(--ink-3,#bdb6c2);font-size:14px;cursor:pointer}
  .cd-log-del:hover{background:#fdeceabb;color:#c0392b}
  /* 导出弹层 */
  .cd-ov{position:fixed;inset:0;z-index:50;background:rgba(30,22,30,.55);display:flex;align-items:center;justify-content:center;padding:18px}
  .cd-ov-card{background:var(--surface,#fff);border-radius:18px;padding:16px;max-width:380px;width:100%;max-height:90vh;overflow:auto;box-shadow:0 30px 80px -30px rgba(0,0,0,.6)}
  .cd-ov-h{font-size:15px;font-weight:800;color:var(--ink,#2b2630);margin-bottom:10px}
  .cd-ov-canvas{width:100%;height:auto;border-radius:12px;border:1px solid var(--line,#eceaf0);display:block}
  .cd-ov-row{display:flex;gap:8px;margin-top:12px}
  .cd-ov-row .cd-ai-btn{flex:1}
  `;
  document.head.appendChild(GG.el('style',{id:'cd-style', html:css}));
}

start();
})();
