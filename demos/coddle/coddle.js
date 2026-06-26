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

/* ───────── 启动 ───────── */
function start(){
  main = GG.mountShell(SLUG);
  injectCSS();
  const st = GG.decodeState();
  if(st && st.tk){
    state.track  = st.tk;
    state.topicId= st.t || null;
    state.note   = st.n || '';
    state.months = (st.m==null? 6 : st.m)|0;
    state.days   = (st.d==null? 14: st.d)|0;
    state.marks  = st.k || {};
    if(state.topicId){ renderTool(); return; }
  }
  welcome();
}

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
      track('baby','👶','记录宝宝','夜醒·吃奶·辅食·大运动·情绪·语言'),
      track('mom','🤱','照顾我自己（产后）','母乳·恶露伤口·情绪·身体修复·月子·睡眠')));

  main.appendChild(GG.el('div',{class:'cd-gate'},
    GG.el('div',{class:'cd-card'}, head, body),
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
    GG.el('button',{class:'cd-home', title:'回首页', onClick:welcome}, '⌂')));

  main.appendChild(GG.el('div',{class:'cd-lead'},
    isMom ? '选一个产后关注、随手写一句，再滑动产后天数 —— 同一件事，阶段不同，答案不同。'
          : '选一类观察、写句备注，再滑动宝宝月龄 —— 同一条记录，月龄不同，指引完全不同。'));

  // ① 选主题
  const topics = isMom ? MOM_TOPICS : TOPICS;
  main.appendChild(GG.el('div',{class:'cd-step'}, isMom ? '① 你想聊哪方面？' : '① 这条记的是哪方面？'));
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

  // ② 备注
  main.appendChild(GG.el('div',{class:'cd-step'}, '② 随手写一句（可选）'));
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
      state.note.trim()? '记录：“'+state.note.trim()+'”' : null,
      '· '+(isMom?'情况':'典型表现')+'：'+cell.read,
      '· 建议：'+cell.guide,
      '· 小贴士：'+cell.tip,
      isMom&&topic.redflag? '· 就医红线：'+topic.redflag : null,
      '', '—— Coddle 育儿陪伴 · Demo  '+location.href
    ].filter(Boolean).join('\n')
  };

  box.appendChild(GG.resultCard(SLUG, inner, shareSpec));

  // 妈妈轨：附近服务导流
  if(isMom && topic.needs) mountServices(box, topic);

  // 连了 key 才出现：AI 个性化层（按需，避免每次滑动都调 API）
  mountAdvice(box, topic, isMom);

  box.appendChild(GG.el('p',{class:'cd-muted center', style:{marginTop:'10px'}},
    isMom? '↑ 拖动上面的「产后天数」—— 同一件事，阶段不同，指引会明显变化。'
         : '↑ 拖动上面的「月龄」—— 同一条记录，指引会随月龄明显改变。'));
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

    const toggle = (val)=>{ state.marks[key] = (state.marks[key]===val? undefined : val); updateGuide(); };
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
  /* AI 层 */
  .cd-ai{margin-top:12px;border-left:3px solid ${a};background:var(--bg-soft,#faf8fb);border-radius:10px;padding:12px 13px}
  .cd-ai-cap{font-size:13px;font-weight:760;color:var(--ink,#2b2630)}
  .cd-ai-btn{margin-top:2px;padding:9px 14px;border-radius:10px;border:1.5px solid ${a};background:var(--surface,#fff);color:${a};font-size:13px;font-weight:700;cursor:pointer}
  .cd-ai-btn:disabled{opacity:.6;cursor:default}
  .cd-ai-sum{margin:8px 0 0;font-weight:640;line-height:1.55;color:var(--ink,#2b2630)}
  .cd-ai-ul{margin:6px 0 0;padding-left:20px;color:var(--ink-2,#5a545f);line-height:1.7;font-size:13.5px}
  `;
  document.head.appendChild(GG.el('style',{id:'cd-style', html:css}));
}

start();
})();
