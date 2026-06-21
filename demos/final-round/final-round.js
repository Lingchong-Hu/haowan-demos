/* final-round — 模拟面试即时反馈。
   选岗 → AI 随机出一道行为面试题 → 用户写回答 → 提交 → thinking →
   结构化三项反馈（STAR 完整度 / 具体性 / 改进建议），全部针对用户实际答案内容。
   纯文字、零外部依赖、零语音：「语速」用字数/句长近似。 */
(function(){
const SLUG = 'final-round';
const { ROLES } = window.FINAL_ROUND;
let main;
let state = { role:null, question:null, qIdx:-1 };

/* ---------------- 分析引擎 ----------------
   读用户的回答文本，启发式判定四要素 / 具体性 / 改进建议。
   关键：所有结论都引用从答案里真实抽到的片段或数字，不同回答 → 不同反馈。 */

// STAR 四要素的触发关键词
const STAR = [
  { key:'S', label:'情境 Situation', desc:'交代背景',
    kw:['当时','背景','项目','那时','一开始','起初','面临','场景','客户','公司','团队负责','遇到'] },
  { key:'T', label:'任务 Task', desc:'你的目标 / 职责',
    kw:['负责','目标','需要','任务','要求','指标','kpi','KPI','希望','期望','我的职责','要做到','要解决'] },
  { key:'A', label:'行动 Action', desc:'你具体做了什么',
    kw:['我','采取','推动','做了','方案','于是','因此','我们','决定','设计','搭建','优化','沟通','拉','复盘','调整','分析','落地','上线'] },
  { key:'R', label:'结果 Result', desc:'可衡量的成果',
    kw:['结果','最终','提升','下降','增长','达成','超额','完成','带来','收益','转化','拿下','成交','省','降低','上涨','回升'] },
];

function sentences(text){
  return text.split(/[。！？!?\n;；]+/).map(s=>s.trim()).filter(Boolean);
}

// 抽取答案里所有「具体数字 / 量化表达」，返回真实片段（用于引用）
function extractNumbers(text){
  const out = [];
  // 百分比、倍数、金额（万/亿/元/k）、绝对数字带量词、时间量
  const re = /(\d+(?:\.\d+)?\s*%)|(\d+(?:\.\d+)?\s*(?:倍|万|亿|个百分点|pp))|((?:￥|\$)?\s*\d+(?:\.\d+)?\s*(?:元|块|w|W|k|K|万元|亿元))|(\d+(?:\.\d+)?\s*(?:天|周|个月|月|年|小时|分钟|人|位|名|单|条|次|版|轮))/g;
  let m;
  while((m = re.exec(text)) !== null){
    const hit = m[0].replace(/\s+/g,'');
    if(hit && !out.includes(hit)) out.push(hit);
    if(out.length >= 8) break;
  }
  return out;
}

function analyze(text){
  const clean = (text||'').trim();
  const chars = clean.replace(/\s/g,'').length;
  const sents = sentences(clean);
  const sentCount = sents.length;
  const avgLen = sentCount ? Math.round(chars / sentCount) : chars;
  const longest = sents.reduce((m,s)=> Math.max(m, s.replace(/\s/g,'').length), 0);

  // —— STAR 四要素判定 ——
  const present = {};   // key -> 命中的第一个关键词（用于"读了"的证据）
  STAR.forEach(part=>{
    const hitKw = part.kw.find(k=> clean.includes(k));
    if(hitKw) present[part.key] = hitKw;
  });
  // Result 额外条件：含数字更算"有结果"；只有"我"很弱，需配动词上下文已在 kw 体现
  const numbers = extractNumbers(clean);
  if(numbers.length && !present.R) present.R = numbers[0];
  const presentKeys = STAR.filter(p=> present[p.key]);
  const missingKeys = STAR.filter(p=> !present[p.key]);

  // —— 评分 ——
  // STAR 完整度：每要素 25 分，过短打折
  let starPct = presentKeys.length * 25;
  if(chars < 40) starPct = Math.min(starPct, 35);          // 太短，要素再多也虚
  starPct = GG.clamp(Math.round(starPct), 0, 100);

  // 具体性：数字数量 + 字数 + 句子结构
  let specPct = 18;
  specPct += Math.min(numbers.length, 4) * 16;             // 每个量化 +16，封顶 64
  if(chars >= 80) specPct += 10;
  if(chars >= 180) specPct += 8;
  if(sentCount >= 3) specPct += 6;
  if(chars < 30) specPct = Math.min(specPct, 20);
  specPct = GG.clamp(Math.round(specPct), 0, 100);

  // 综合
  const overall = GG.clamp(Math.round(starPct*0.5 + specPct*0.4 + Math.min(100, chars/2.4)*0.1), 0, 100);

  return { clean, chars, sentCount, avgLen, longest, present, presentKeys, missingKeys, numbers,
           starPct, specPct, overall };
}

/* ---------------- 反馈文案（针对性，非模板） ---------------- */

function starFeedback(a){
  const have = a.presentKeys.map(p=>p.key).join('');
  if(a.presentKeys.length === 0){
    return `这段回答里我没能识别出清晰的 STAR 结构——背景、任务、行动、结果都比较模糊。建议改成「当时…（背景）→ 我要…（任务）→ 我做了…（行动）→ 最终…（结果）」的骨架重讲一遍。`;
  }
  const haveTxt = a.presentKeys.map(p=> `${p.label.split(' ')[0]}（你用了"${snippet(a.present[p.key])}"这类表述）`).join('、');
  if(a.missingKeys.length === 0){
    return `STAR 四要素都讲到了：${haveTxt}。结构很完整，面试官能顺着背景→行动→结果听下来。继续保持，再把每一段压实即可。`;
  }
  const missTxt = a.missingKeys.map(p=> `${p.label.split(' ')[0]}（${p.desc}）`).join('、');
  return `你已经讲清了 ${a.presentKeys.length} 个要素：${haveTxt}；但还缺 ${missTxt}。面试官最容易追问的就是缺的这块——尤其要补上「${a.missingKeys[0].label.split(' ')[0]}」，否则故事会显得不完整。`;
}
function snippet(s){ s=String(s); return s.length>6 ? s.slice(0,6) : s; }

function specFeedback(a){
  if(a.numbers.length === 0){
    const tail = a.chars < 50 ? '而且整段偏短，' : '';
    return `整段回答里我没有找到任何量化数据，${tail}全是定性描述。面试官很难判断你的贡献有多大。哪怕加一个数字也好——比如"提升了多少 %""带来了几万""压缩到几天"，立刻就有说服力。`;
  }
  const quoted = a.numbers.slice(0,4).map(n=>`「${n}」`).join('、');
  const more = a.numbers.length > 4 ? `（共 ${a.numbers.length} 处量化）` : '';
  let body = `具体性不错，你引用了真实数字：${quoted}${more}，这正是面试官想听的。`;
  if(a.numbers.length === 1){
    body += ` 不过全文只有这一个数据点，可以再补一两个（比如投入侧的资源、对比基线），让成果更立体。`;
  } else {
    body += ` 多个量化让你的成果可信。下一步可以补一句"对比之前/同期"的基线，数字会更有冲击力。`;
  }
  if(a.chars < 60) body += ` 另外整段还可以再展开一点。`;
  return body;
}

function adviceFeedback(a){
  const tips = [];
  // 1) 先补最关键的缺失要素
  if(a.missingKeys.length){
    const m0 = a.missingKeys[0];
    if(m0.key==='R') tips.push('结尾一定要落到一个可量化的结果（数字 / 百分比 / 金额），别停在"做了什么"。');
    else if(m0.key==='S') tips.push('开头先用一句话交代背景与处境，让面试官知道这件事的难度和上下文。');
    else if(m0.key==='T') tips.push('明确点出"我的目标 / 我负责的部分"，把个人职责从团队里拎出来。');
    else if(m0.key==='A') tips.push('把"我具体做了哪几步"讲细，用"我决定…、我推动…"凸显你的主导动作。');
  }
  // 2) 数字
  if(a.numbers.length === 0) tips.push('至少补一个量化指标——这是结构化面试拿高分的关键。');
  // 3) 篇幅 / 句长
  if(a.chars < 50) tips.push(`目前约 ${a.chars} 字，偏短；行为题理想回答约 150–300 字，建议展开行动细节。`);
  else if(a.chars > 600) tips.push(`目前约 ${a.chars} 字，偏长；建议砍掉枝节，突出"关键决策 + 结果"。`);
  if(a.longest >= 60) tips.push(`有句子长达 ${a.longest} 字，口述时容易绕；拆成几句短句会更清楚（这也影响"语速"观感）。`);
  // 4) 兜底正向
  if(!tips.length) tips.push('结构和数据都到位了，临场把语气放稳、控制好节奏，就是一段很强的回答。');

  return { lead: tips[0], all: tips.slice(0,3) };
}

/* ---------------- AI 通路（连了 key 用真实模型出题 + 反馈，没连退回本地题库 + 启发式分析） ---------------- */
const FR_FB_SYS = [
  '你是资深面试教练。读候选人对一道行为面试题的回答，按 STAR 框架打分并给针对性反馈。',
  '只输出严格 JSON（不要 markdown、不要前言）：',
  '{ "star_present":["命中的要素，取值只能是 S/T/A/R"], "star_pct":0到100, "spec_pct":0到100, "overall":0到100,',
  '  "numbers":["从回答里摘到的量化片段(逐字)"], "star_feedback":"针对回答的 STAR 结构点评(2到3句)",',
  '  "spec_feedback":"针对具体性/数据的点评(2到3句)", "advice":["可执行的改进建议",2到3条] }',
  '反馈必须针对候选人实际写的内容、引用其中的细节，不同回答给不同反馈；全部简体中文。'
].join('\n');

async function pickQuestion(role){
  if(GG.llm.connected()){
    GG.clear(main); const s = GG.el('div'); main.appendChild(s);
    const think = GG.thinking(s, ['AI 正在为「'+role.label+'」出题…'], 900);
    try{
      const [r] = await Promise.all([
        GG.llm.json('你是资深面试官。为指定岗位出一道高质量的行为面试题（STAR 类、考察真实经历、一句话提问）。只输出 JSON：{"question":"..."}',
          '岗位：'+role.label, {max_tokens:200}),
        think ]);
      if(r && r.question) return String(r.question);
    }catch(e){ GG.toast(GG.llm.errMsg(e)); await think; }
  }
  return localPick(role);
}
function localPick(role){
  let idx = Math.floor(GG.rng(Date.now())()*role.questions.length);
  if(idx === state.qIdx && role.questions.length > 1) idx = (idx+1) % role.questions.length;
  state.qIdx = idx;
  return role.questions[idx];
}

async function aiAnalyze(role, question, answerText){
  const obj = await GG.llm.json(FR_FB_SYS,
    '岗位：'+role.label+'\n面试题：'+question+'\n候选人回答：\n'+answerText, {max_tokens:900});
  const clean = (answerText||'').trim();
  const present = Array.isArray(obj.star_present) ? obj.star_present : [];
  const cl = n => GG.clamp(parseInt(n,10)||0, 0, 100);
  return {
    clean, chars: clean.replace(/\s/g,'').length, sentCount: sentences(clean).length,
    numbers: (Array.isArray(obj.numbers)?obj.numbers:[]).map(String).filter(Boolean),
    present: {}, presentKeys: STAR.filter(p=> present.includes(p.key)),
    missingKeys: STAR.filter(p=> !present.includes(p.key)),
    starPct: cl(obj.star_pct), specPct: cl(obj.spec_pct), overall: cl(obj.overall),
    _ai: true, _starFb: String(obj.star_feedback||''), _specFb: String(obj.spec_feedback||''),
    _advice: (Array.isArray(obj.advice)?obj.advice:[]).map(String).filter(Boolean)
  };
}

/* ---------------- 流程 ---------------- */
function start(){
  main = GG.mountShell(SLUG);
  state = { role:null, question:null, qIdx:-1 };
  intro();
}

function intro(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '选个岗位，进入模拟面试'),
    GG.el('p', null, 'AI 出一道行为面试题，你用文字作答，立刻拿到结构化反馈：STAR 完整度、具体性、和一条可执行的改进建议——全部针对你写的内容。')
  ));
  main.appendChild(GG.llm.bar());
  main.appendChild(GG.el('div',{class:'section-t'}, '应聘岗位'));
  const grid = GG.el('div',{class:'stack'});
  ROLES.forEach(role=>{
    grid.appendChild(GG.el('div',{class:'opt', onClick:()=>chooseRole(role)},
      GG.el('span',{style:{fontSize:'24px', flex:'none'}}, role.emoji),
      GG.el('div',{style:{flex:'1'}},
        GG.el('div',{style:{fontWeight:'650', fontSize:'17px'}}, role.label),
        GG.el('div',{class:'small muted'}, `${role.questions.length} 道行为面试题题库 · 随机抽题`)
      ),
      GG.el('span',{class:'muted'}, '→')
    ));
  });
  main.appendChild(grid);
}

async function chooseRole(role){
  state.role = role;
  state.question = await pickQuestion(role);   // 连了 AI 现出题，否则本地题库
  askStage();
}

async function nextQuestion(){
  state.question = await pickQuestion(state.role);
  askStage();
}

function askStage(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'row', style:{justifyContent:'space-between', marginTop:'18px'}},
    GG.el('span',{class:'kpi'}, GG.el('span',{class:'pill'}, `${state.role.emoji} ${state.role.label}`)),
    GG.el('button',{class:'btn ghost small', style:{padding:'6px 12px'}, onClick:start}, '↺ 换岗位')
  ));
  main.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'12px', background:'linear-gradient(160deg,var(--accent-soft),#fff 62%)'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '🎤 面试官提问'),
    GG.el('div',{style:{fontSize:'19px', fontWeight:'600', lineHeight:'1.45'}}, state.question)
  ));

  const ta = GG.el('textarea',{class:'field', placeholder:'用 STAR 结构作答：当时的背景 / 你的目标 / 你具体做了什么 / 最终的（量化）结果…', style:{marginTop:'16px', minHeight:'180px'}});
  const counter = GG.el('div',{class:'small muted', style:{marginTop:'6px', textAlign:'right'}}, '0 字');
  ta.addEventListener('input', ()=>{
    const n = ta.value.replace(/\s/g,'').length;
    counter.textContent = `${n} 字` + (n>0 && n<40 ? '　· 偏短，再展开一点会更有说服力' : '');
  });
  main.appendChild(GG.el('label',{class:'label', style:{marginTop:'16px'}}, '你的回答'));
  main.appendChild(ta);
  main.appendChild(counter);

  const submit = GG.el('button',{class:'btn primary lg block', style:{marginTop:'14px'}, onClick:()=>{
    if(ta.value.replace(/\s/g,'').length < 4){ GG.toast('先写下你的回答再提交～'); ta.focus(); return; }
    runFeedback(ta.value);
  }}, '提交，获取反馈 →');
  main.appendChild(submit);
  setTimeout(()=>ta.focus(), 60);
}

async function runFeedback(answerText){
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  const useAI = GG.llm.connected();
  const think = GG.thinking(stage, [
    '正在读你的回答…',
    '检测 STAR 四要素是否齐全…',
    '提取你提到的量化数据…',
    useAI ? 'AI 逐条点评、生成反馈…' : '评估篇幅 / 句长 / 语速…',
    '生成针对性反馈…',
  ], 2000);

  let a=null;
  if(useAI){ try{ a = await aiAnalyze(state.role, state.question, answerText); }catch(e){ GG.toast(GG.llm.errMsg(e)); } }
  await think;
  if(!a) a = analyze(answerText);
  GG.clear(stage);
  showResult(stage, a, answerText);
}

function bar(label, pct, color){
  return GG.el('div',{class:'bar-row'},
    GG.el('div',{class:'nm', style:{width:'92px'}}, label),
    GG.el('div',{class:'bar'}, GG.el('i',{style:{width:'0%', background:color||'var(--accent)'}})),
    GG.el('div',{class:'pct'}, pct+'%')
  );
}

function feedbackBlock(title, scoreLabel, pct, bodyNode, color){
  return GG.el('div',{class:'card pad'},
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'baseline'}},
      GG.el('div',{style:{fontWeight:'680', fontSize:'16px'}}, title),
      GG.el('div',{style:{fontWeight:'700', fontSize:'15px', color:color||'var(--accent)'}}, pct+' / 100')
    ),
    GG.el('div',{class:'bar', style:{margin:'10px 0 12px'}}, GG.el('i',{class:'fb-fill', dataset:{pct:String(pct)}, style:{width:'0%', background:color||'var(--accent)'}})),
    GG.el('div',{style:{fontSize:'14.5px', lineHeight:'1.6', color:'var(--ink-2)'}}, bodyNode)
  );
}

function colorFor(pct){ return pct>=75 ? 'var(--good)' : (pct>=45 ? 'var(--warn)' : 'var(--bad)'); }

/* STAR 四要素地图（2×2 宫格，✓/✗ + 命中证据）——区别于线性评分条的一眼概览 */
function starGrid(a){
  const presentSet = new Set(a.presentKeys.map(p=>p.key));
  const cells = STAR.map(p=>{
    const on = presentSet.has(p.key);
    const ev = a.present && a.present[p.key];
    return GG.el('div',{style:{border:'1px solid '+(on?'var(--accent)':'var(--line)'), borderRadius:'12px', padding:'11px 12px',
      background: on?'var(--accent-soft)':'#fbfbf9'}},
      GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center'}},
        GG.el('span',{style:{fontWeight:'700', fontSize:'14.5px', color:on?'var(--accent)':'var(--ink-3)'}}, p.label),
        GG.el('span',{style:{fontWeight:'800', fontSize:'16px', color:on?'#2e9e7b':'#c2536f'}}, on?'✓':'✗')),
      GG.el('p',{class:'small muted', style:{margin:'5px 0 0', lineHeight:'1.5'}},
        on ? (ev?('你提到「'+snippet(ev)+'…」'):'已讲到') : ('缺：'+p.desc)));
  });
  return GG.el('div',{class:'card pad'},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, 'STAR 四要素地图'),
    GG.el('div',{style:{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}, cells[0], cells[1], cells[2], cells[3]),
    GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}}, '绿勾=已讲到，红叉=缺这块；面试官最爱追问缺的那格。'));
}

function showResult(stage, a, answerText){
  const advice = a._ai ? { lead:(a._advice[0]||''), all:a._advice.slice(0,3) } : adviceFeedback(a);
  const starText = a._ai ? a._starFb : starFeedback(a);
  const specText = a._ai ? a._specFb : specFeedback(a);
  const starTags = a.presentKeys.map(p=> p.label.split(' ')[0]);

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px', paddingBottom:'4px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, '📋 你的面试反馈')));
  stage.appendChild(GG.el('div',{style:{marginBottom:'4px'}}, GG.llm.badge(!!a._ai)));
  stage.appendChild(GG.el('div',{class:'small muted', style:{marginBottom:'4px'}},
    `${state.role.emoji} ${state.role.label} · 共识别 ${a.presentKeys.length}/4 个 STAR 要素 · ${a.numbers.length} 处量化 · ${a.chars} 字`));

  // 你的回答回显（证明"读了"）
  stage.appendChild(GG.el('div',{class:'card pad', style:{margin:'14px 0', background:'#fbfbf9'}},
    GG.el('div',{class:'small muted', style:{marginBottom:'6px'}}, '你的回答'),
    GG.el('div',{style:{fontSize:'14.5px', lineHeight:'1.6', whiteSpace:'pre-wrap', color:'var(--ink-2)'}}, a.clean)
  ));

  // STAR 四要素地图（可视化概览）
  stage.appendChild(starGrid(a));
  stage.appendChild(GG.el('div',{style:{height:'12px'}}));

  const blocks = GG.el('div',{class:'stack'});
  blocks.appendChild(feedbackBlock('① STAR 完整度', '', a.starPct, fbNode(starText), colorFor(a.starPct)));
  blocks.appendChild(feedbackBlock('② 具体性（数据 / 细节）', '', a.specPct, fbNode(specText), colorFor(a.specPct)));
  // 改进建议块：列出最多 3 条可执行项
  const adviceInner = GG.el('div', null,
    GG.el('div',{style:{marginBottom:'6px'}}, '为你列出最该改的几点：'),
    GG.el('ul',{style:{margin:'0', paddingLeft:'20px'}}, advice.all.map(t=> GG.el('li',{style:{marginBottom:'4px'}}, t)))
  );
  blocks.appendChild(feedbackBlock('③ 改进建议', '', a.overall, adviceInner, colorFor(a.overall)));
  stage.appendChild(blocks);

  // 分享 / 结果卡
  const shareSpec = {
    slug: SLUG,
    title: '模拟面试反馈',
    subtitle: `${state.role.label} · ${state.question.slice(0, 22)}${state.question.length>22?'…':''}`,
    bars: [
      { label:'STAR 完整度', pct:a.starPct },
      { label:'具体性', pct:a.specPct },
      { label:'综合', pct:a.overall },
    ],
    note: advice.lead,
    tags: starTags.length ? starTags : ['STAR 待补全'],
  };

  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '截图分享这张面试反馈 ↓'),
    shareSpec
  ));

  // 加分 feature：连了 AI 时，一键看「按 STAR 改写的范例答案」（沿用你的真实经历）
  if(a._ai){
    const out = GG.el('div',{class:'card pad', style:{display:'none', marginTop:'4px', background:'#fbfbf9',
      lineHeight:'1.7', whiteSpace:'pre-wrap', color:'var(--ink-2)'}});
    let loaded=false, busy=false;
    const mb = GG.el('button',{class:'btn', onClick:async()=>{
      if(busy) return;
      if(loaded){ out.style.display = out.style.display==='none'?'block':'none'; return; }
      busy=true; const old=mb.textContent; mb.textContent='AI 改写中…'; out.style.display='block'; out.textContent='AI 正在按 STAR 改写一版范例…';
      try{
        const r = await GG.llm.json(
          '你是面试教练。基于候选人的原始回答，按 STAR 结构改写出一版更强的范例答案（150到300字，沿用其真实经历、补全缺失要素、加入合理量化）。只输出 JSON：{"model":"..."}',
          '岗位：'+state.role.label+'\n面试题：'+state.question+'\n原始回答：\n'+answerText, {max_tokens:800});
        out.textContent = r.model || '（无）'; loaded=true; mb.textContent='✦ 收起范例';
      }catch(e){ out.textContent = GG.llm.errMsg(e); mb.textContent=old; }
      busy=false;
    }}, '✦ 看 AI 改写的范例答案');
    stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'14px'}}, mb));
    stage.appendChild(out);
  }

  // 操作区
  stage.appendChild(GG.el('div',{class:'row', style:{justifyContent:'center', gap:'12px', marginTop:'18px', flexWrap:'wrap'}},
    GG.el('button',{class:'btn primary', onClick:nextQuestion}, '下一题 →'),
    GG.el('button',{class:'btn', onClick:askStage}, '↻ 重答这题'),
    GG.el('button',{class:'btn ghost', onClick:start}, '换岗位')
  ));

  // 进度条动画
  requestAnimationFrame(()=>{
    GG.$$('.fb-fill', stage).forEach(el=>{ el.style.width = (el.dataset.pct||0)+'%'; });
  });
}

// 把含「」标记的字符串渲染成节点（引用片段不必特殊高亮，纯文本即可，保留可读性）
function fbNode(text){ return text; }

start();
})();
