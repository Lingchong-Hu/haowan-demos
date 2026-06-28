/* clause-risk — 合同风险「签前军师」
   贴条款 → 选你是哪一方 → 标红真实命中片段 → 倾斜度裁决（该不该签）
          → 底线必改 / 能争取 分级 → 缺失的保护条款 → 一键生成可发出去的改约邮件。
   签名点：① 标红的永远是用户 textarea 里的真实文本片段（正则 matchAll / AI 返回强制 indexOf 校验）；
          ② 同一条款随“你站哪一方”翻转解读（弱势侧=坑，强势侧=盾）；③ 裁决/分级/缺失/邮件全本地可算，连 key 仅升级。 */
(function(){
const SLUG = 'clause-risk';
const { RISK_PATTERNS, ROLES, CHECKLIST, SAMPLES } = window.CLAUSE_RISK;
const LEVEL_COLOR = { '高':'#d64545', '中':'#d98a2b', '低':'#2e8b8b' };
const LEVEL_RANK  = { '高':3, '中':2, '低':1 };
const ROLE_BY_ID  = id => ROLES.find(r=>r.id===id) || ROLES[0];
let main, textarea, state = { text:'', hits:[], role:ROLES[0] };

/* ───────────── 引擎：在用户真实文本里找命中片段 ───────────── */
function scan(text){
  const hits = [];
  for(const p of RISK_PATTERNS){
    p.re.lastIndex = 0;
    for(const m of text.matchAll(p.re)){
      const frag = m[0];
      if(!frag || !frag.trim()) continue;
      hits.push({ start:m.index, end:m.index+frag.length, frag, pat:p });
    }
  }
  return dedupe(hits);
}
function dedupe(hits){
  hits.sort((a,b)=> a.start-b.start || (b.end-b.start)-(a.end-a.start) || LEVEL_RANK[b.pat.level]-LEVEL_RANK[a.pat.level]);
  const kept = []; let lastEnd = -1;
  for(const h of hits){ if(h.start >= lastEnd){ kept.push(h); lastEnd = h.end; } }
  return kept;
}

function esc(s){ return s.replace(/[&<>]/g, c=> c==='&'?'&amp;':c==='<'?'&lt;':'&gt;'); }
function highlight(text, hits){
  let out = '', cur = 0;
  hits.forEach((h,i)=>{
    out += esc(text.slice(cur, h.start));
    const col = LEVEL_COLOR[h.pat.level] || '#d64545';
    out += `<mark id="hit-${i}" class="cr-mark" style="background:${col}22;color:${col};`+
           `border-bottom:2px solid ${col};border-radius:3px;padding:0 2px;font-weight:600;scroll-margin-top:80px">`+
           esc(h.frag)+`</mark>`;
    cur = h.end;
  });
  out += esc(text.slice(cur));
  return out;
}

/* ───────────── AI 通路（连 key 用真实模型找风险，没连退本地正则） ───────────── */
const CR_SYS = [
  '你是合同风险审阅助手（仅作演示、不构成法律意见）。读用户贴的合同/条款全文，找出对“出条款的弱势相对方”不利或有坑的条款。',
  '只输出严格 JSON（不要 markdown、不要前言）：',
  '{ "risks":[ {"frag":"从原文逐字摘录的风险片段(必须是原文里出现过的连续子串，一字不改)",',
  '  "level":"高|中|低","label":"风险点名称(简短)","plain":"用大白话解释这条为什么是坑","rewrite":"给用户的改写/谈判建议"} ] }',
  '规则：frag 必须逐字来自原文、能在原文里直接搜到；没有明显风险就返回 {"risks":[]}；最多 12 条；全部简体中文。'
].join('\n');

async function getHits(text, useAI){
  if(useAI){
    try{
      const obj = await GG.llm.json(CR_SYS, '合同/条款全文：\n'+text, {max_tokens:1800});
      const hits = aiHits(text, obj);
      hits._ai = true;
      return hits;
    }catch(e){ GG.toast(GG.llm.errMsg(e)); }
  }
  return scan(text);
}
function aiHits(text, obj){
  const risks = Array.isArray(obj && obj.risks) ? obj.risks : [];
  const raw = [];
  for(const r of risks){
    const frag = String(r.frag||'').trim();
    if(!frag) continue;
    const idx = text.indexOf(frag);
    if(idx < 0) continue;                       // 不是原文真实子串 → 丢弃，绝不凭空标红
    const level = ['高','中','低'].includes(r.level) ? r.level : '中';
    raw.push({ start:idx, end:idx+frag.length, frag,
      pat:{ level, label:String(r.label||'风险点'), plain:String(r.plain||''), rewrite:String(r.rewrite||''), favors:'drafter' } });
  }
  return dedupe(raw);
}

/* ───────────── 判断层：倾斜裁决 / 分级 / 缺失条款 / 改约邮件 ───────────── */
function verdictOf(hits, role){
  const score = hits.reduce((s,h)=> s + (LEVEL_RANK[h.pat.level]||1), 0);
  const tilt = hits.length ? GG.clamp(Math.round(34 + score*4), 10, 95) : 0;
  if(role.stance === 'strong'){
    // 这些条款都偏向出条款方 → 对“我（强势方）”是盾
    if(!hits.length) return { tilt:0, side:'你', tag:'比较中性', cls:'ok',
      line:'没扫到明显偏向任何一方的格式条款，这份纸相对平衡。' };
    const hi = hits.filter(h=>h.pat.level==='高').length;
    if(score>=8 || hi>=2) return { tilt, side:'你', tag:'对你有利，但偏霸王', cls:'warn',
      line:`这份合同明显向你倾斜；但有 ${hi} 条可能因显失公平 / 违法而无效，反而成为你的合规隐患。` };
    return { tilt, side:'你', tag:'向你倾斜 · 基本稳', cls:'ok',
      line:'条款总体对你有利，合规风险不大；个别地方建议留点余地以防被认定霸王。' };
  }
  // 弱势侧：偏向对方 = 对我是坑
  if(!hits.length) return { tilt:0, side:role.opp, tag:'未见明显失衡', cls:'ok',
    line:'没扫到常见的坑，但重要条款仍建议人工复核——没标红不等于绝对安全。' };
  const hi = hits.filter(h=>h.pat.level==='高').length;
  if(tilt>=70 || hi>=2) return { tilt, side:role.opp, tag:'先别急着签', cls:'bad',
    line:`这份合同明显偏向${role.opp}，有 ${hi} 条是底线，必须先改掉再谈签字。` };
  if(tilt>=45) return { tilt, side:role.opp, tag:'谈了再签', cls:'warn',
    line:`整体可谈，但有几处要争取到合理为止，别原样签。` };
  return { tilt, side:role.opp, tag:'基本可签 · 留意小项', cls:'ok',
    line:'没有致命条款，注意几处小项、能改则改即可。' };
}

// 缺失的保护条款（话题相关却没写到）
function missingOf(text, role){
  const out = [];
  for(const c of CHECKLIST){
    if(c.stance && c.stance !== role.stance) continue;
    if(c.relevant && !c.relevant.some(k=> text.includes(k))) continue;
    if(c.any.some(k=> text.includes(k))) continue;   // 已覆盖
    out.push(c);
  }
  return out;
}

// 把命中分成 底线必改 / 能争取 / 留意
function tiersOf(hits){
  return {
    deal: hits.filter(h=>h.pat.level==='高'),
    push: hits.filter(h=>h.pat.level==='中'),
    note: hits.filter(h=>h.pat.level==='低')
  };
}

// 生成可发出去的改约邮件 / 谈判清单
function buildScript(text, hits, role, missing){
  const t = tiersOf(hits);
  const q = s => '“'+String(s).replace(/\s+/g,' ').trim()+'”';
  if(role.stance === 'strong'){
    const L = [];
    L.push(`【内部备忘 · 对方大概率会盯住的点 + 你的让步底线】`);
    L.push('');
    if(t.deal.length){
      L.push('对方最可能要求删改（这些条款偏强势、有被判无效的风险）：');
      t.deal.forEach((h,i)=> L.push(`${i+1}. ${h.pat.label} —— ${q(h.frag)}\n   守不住时的退路：${h.pat.rewrite}`));
      L.push('');
    }
    if(t.push.length){
      L.push('可适度让步换签约：');
      t.push.forEach((h,i)=> L.push(`${i+1}. ${h.pat.label} —— ${h.pat.rewrite}`));
      L.push('');
    }
    L.push('谈判建议：把上面高风险条款主动改成对等版本，既降低被判无效的风险，也更容易让对方爽快签字。');
    return L.join('\n');
  }
  // 弱势侧：一封能直接发出去的改约请求
  const L = [];
  L.push(`主题：关于合同条款的几点修改请求`);
  L.push('');
  L.push(`您好，在正式签署前，我想就以下几点与您确认 / 调整：`);
  L.push('');
  if(t.deal.length){
    L.push(`【必须调整（否则我无法签署）】`);
    t.deal.forEach((h,i)=> L.push(`${i+1}. ${h.pat.label}：现条款 ${q(h.frag)} 对我方风险过大。建议改为：${h.pat.rewrite}`));
    L.push('');
  }
  if(t.push.length){
    L.push(`【希望争取】`);
    t.push.forEach((h,i)=> L.push(`${i+1}. ${h.pat.label}：${h.pat.rewrite}`));
    L.push('');
  }
  if(missing.length){
    L.push(`【建议补充（合同里目前没有）】`);
    missing.forEach((c,i)=> L.push(`${i+1}. ${c.label}：${c.suggest}`));
    L.push('');
  }
  if(!t.deal.length && !t.push.length && !missing.length){
    L.push('整体没有发现明显不利条款。若方便，希望就以下惯例条款再确认一次：违约救济是否对等、争议解决地点、以及合同终止后的数据处理。');
    L.push('');
  }
  L.push(`以上几点达成一致后，我可以尽快签署。谢谢！`);
  return L.join('\n');
}

const POLISH_SYS = '你在帮用户润色一封“合同改约请求”邮件。把下面的草稿改得更专业、礼貌、有理有据、口吻不卑不亢，'+
  '但要点不增不减、不要编造新的条款。直接输出邮件正文（含主题行），简体中文，不要任何前言或解释。';

/* ───────────── 流程 ───────────── */
function start(){
  main = GG.mountShell(SLUG);
  injectStyles();
  // 可复现链接：?#s={text,roleId}
  const st = GG.decodeState();
  if(st && st.text){
    state.role = ROLE_BY_ID(st.roleId);
    state.text = st.text;
    state.hits = scan(st.text);
    const stage = GG.el('div'); main.appendChild(stage);
    showResult(stage);
    return;
  }
  intro();
}

function intro(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '把合同贴进来，我替你拿主意'),
    GG.el('p', null, '不只标红风险，更告诉你：这份纸偏向谁、该不该签、哪几条是底线、还缺哪些保护，最后给你一封能直接发出去的改约邮件。')
  ));
  main.appendChild(GG.llm.bar());

  // 选边
  main.appendChild(GG.el('div',{class:'cr-rolewrap'},
    GG.el('div',{class:'cr-rolelead'}, '① 你在这份合同里是哪一方？'),
    roleRow(r=>{ state.role = r; })
  ));

  textarea = GG.el('textarea',{ class:'cr-input',
    placeholder:'② 在此粘贴你的合同 / 协议 / 条款全文…（也可点下方按钮填入示例）' });
  textarea.value = state.text || '';
  main.appendChild(GG.el('div',{class:'cr-talead'}, '② 贴上合同全文'));
  main.appendChild(textarea);

  const sampleBtns = SAMPLES.map(s=> GG.el('button',{class:'btn', style:{fontSize:'13px'},
    onClick:()=>{ textarea.value = s.text; const r=ROLE_BY_ID(s.role); state.role=r; markRole(r); textarea.focus(); }},
    '填入'+s.label));
  main.appendChild(GG.el('div',{class:'row', style:{justifyContent:'center', gap:'10px', marginTop:'16px', flexWrap:'wrap'}},
    ...sampleBtns,
    GG.el('button',{class:'btn primary lg', onClick:runCheck}, '⚖️ 体检合同 →')
  ));
  const disc = GG.disclaimer(SLUG);
  if(disc) main.appendChild(GG.el('div',{style:{marginTop:'16px'}}, disc));
}

let roleBtns = [];
function roleRow(onPick){
  roleBtns = [];
  const row = GG.el('div',{class:'cr-roles'});
  ROLES.forEach(r=>{
    const b = GG.el('button',{class:'cr-role'+(r.id===state.role.id?' on':''),
      onClick:()=>{ state.role=r; markRole(r); onPick && onPick(r); }},
      GG.el('span',{class:'cr-role-em'}, r.emoji), r.label);
    b._role = r; roleBtns.push(b); row.appendChild(b);
  });
  return row;
}
function markRole(r){ roleBtns.forEach(b=> b.classList.toggle('on', b._role.id===r.id)); }

async function runCheck(){
  const text = (textarea.value||'').trim();
  if(!text){ GG.toast('先贴一段合同文本，或点“填入示例”'); return; }
  state.text = text;

  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  const useAI = GG.llm.connected();
  const think = GG.thinking(stage, ['通读条款全文…',
    useAI ? 'AI 逐句审阅、定位风险…' : '匹配常见风险句式…',
    `站在「${state.role.label}」的立场评估倾斜度…`,
    '排底线、查缺失、起草改约邮件…'], useAI?2100:1700);

  let hits;
  if(useAI){ const [h] = await Promise.all([getHits(text, true), think]); hits = h; }
  else { await think; hits = scan(text); }
  state.hits = hits;
  GG.clear(stage);
  showResult(stage);
}

/* ───────────── 结果（可在不重扫的情况下按立场重渲染） ───────────── */
function showResult(stage){
  GG.clear(stage);
  const { text, hits, role } = state;
  const verdict = verdictOf(hits, role);
  const tiers = tiersOf(hits);
  const missing = missingOf(text, role);

  // ── 立场切换条（同一份合同，换个身份重看）──
  stage.appendChild(GG.el('div',{class:'cr-switch'},
    GG.el('span',{class:'cr-switch-lead'}, '以谁的立场看：'),
    ...ROLES.map(r=> GG.el('button',{class:'cr-chip'+(r.id===role.id?' on':''),
      onClick:()=>{ if(r.id===role.id) return; state.role=r; GG.encodeState({text, roleId:r.id}); showResult(stage); }},
      r.emoji+' '+r.label))
  ));

  // ── 裁决横幅（hero）──
  stage.appendChild(verdictBanner(verdict, hits));
  stage.appendChild(GG.el('div',{style:{margin:'10px 0 0'}}, GG.llm.badge(!!hits._ai)));

  if(!hits.length){
    stage.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'16px'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '原文'),
      GG.el('div',{class:'cr-doc', style:docStyle(), html: highlight(text, hits)})));
    if(missing.length) stage.appendChild(missingCard(missing));
    stage.appendChild(scriptCard(text, hits, role, missing));
    appendShare(verdict, hits, role, stage);
    appendRedo(stage);
    return;
  }

  const strong = role.stance === 'strong';

  // ── 底线必改 / 能争取 / 留意 （强势侧重命名为“偏向你的条款”）──
  if(strong){
    if(hits.length) stage.appendChild(tierBlock(
      '🛡 偏向你的条款', '这些条款对你（出条款方）有利；标⚠️ 的偏霸王，有被判无效的风险，建议主动改对等。',
      hits.sort((a,b)=>LEVEL_RANK[b.pat.level]-LEVEL_RANK[a.pat.level]), role, {shield:true}));
  } else {
    if(tiers.deal.length) stage.appendChild(tierBlock(
      '🚫 签字前必须改掉 · 底线', `这些条款明显偏向${role.opp}，原样签会让你很被动。`, tiers.deal, role, {}));
    if(tiers.push.length) stage.appendChild(tierBlock(
      '🤝 能争取就争取', '不算致命，但谈下来对你更划算。', tiers.push, role, {}));
    if(tiers.note.length) stage.appendChild(tierBlock(
      '👀 留意即可', '影响较小，知道有这回事即可。', tiers.note, role, {compact:true}));
  }

  // ── 缺失的保护条款 ──
  if(missing.length) stage.appendChild(missingCard(missing));

  // ── 标红原文 ──
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '原文（命中片段已标红，点上方条目可跳转）'),
    GG.el('div',{class:'cr-doc', style:docStyle(), html: highlight(text, hits)})));

  // ── 改约邮件 ──
  stage.appendChild(scriptCard(text, hits, role, missing));

  appendShare(verdict, hits, role, stage);
  appendRedo(stage);
}

function verdictBanner(v, hits){
  const col = v.cls==='bad' ? '#d64545' : v.cls==='warn' ? '#d98a2b' : '#2e8b8b';
  const cnt = { '高':0,'中':0,'低':0 }; hits.forEach(h=> cnt[h.pat.level]++);
  const meterFill = GG.el('div',{class:'cr-meter-fill', style:{width:'0%', background:col}});
  const banner = GG.el('div',{class:'cr-verdict', style:{borderColor:col+'55', background:col+'0d'}},
    GG.el('div',{class:'cr-vtag', style:{background:col}}, v.tag),
    GG.el('div',{class:'cr-vline'}, v.line),
    GG.el('div',{class:'cr-meter-lab'},
      GG.el('span', null, v.tilt ? `倾斜度 ${v.tilt}% · 向${v.side}` : '未见明显倾斜'),
      GG.el('span',{class:'cr-vcnt'}, hits.length
        ? ['高','中','低'].filter(l=>cnt[l]).map(l=>cnt[l]+l).join(' / ') + ' 风险'
        : '0 风险')
    ),
    GG.el('div',{class:'cr-meter'}, meterFill)
  );
  // 动画填充
  setTimeout(()=>{ meterFill.style.width = (v.tilt||2)+'%'; }, 60);
  return banner;
}

function tierBlock(title, sub, list, role, opt){
  const wrap = GG.el('div',{class:'cr-tier', style:{marginTop:'18px'}},
    GG.el('div',{class:'cr-tier-h'}, title, GG.el('span',{class:'cr-tier-n'}, list.length)),
    GG.el('p',{class:'small muted', style:{margin:'2px 0 10px'}}, sub));
  const stack = GG.el('div',{class:'stack'});
  list.forEach((h)=>{
    const col = LEVEL_COLOR[h.pat.level] || '#d64545';
    const i = state.hits.indexOf(h);
    const warnShield = opt.shield && h.pat.level==='高';
    stack.appendChild(GG.el('div',{class:'card pad', style:{borderLeft:`4px solid ${col}`}},
      GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'flex-start', gap:'10px', flexWrap:'wrap'}},
        GG.el('div',{class:'row', style:{gap:'8px', flexWrap:'wrap'}},
          GG.el('span',{class:'cr-lv', style:{background:col}},
            opt.shield ? (warnShield?'⚠ 偏霸王':'对你有利') : h.pat.level+'风险'),
          GG.el('h3',{class:'cr-cl-t'}, h.pat.label)
        ),
        i>=0 ? GG.el('button',{class:'btn', style:{padding:'4px 10px', fontSize:'12px'},
          onClick:()=>{ const t=GG.$('#hit-'+i, main); if(t){ t.scrollIntoView({behavior:'smooth', block:'center'});
            t.style.outline=`2px solid ${col}`; setTimeout(()=>t.style.outline='',1200);} }}, '定位原文 ↑') : null
      ),
      GG.el('blockquote',{class:'cr-quote', style:{background:`${col}14`, borderLeft:`3px solid ${col}`}},
        '原文：“'+h.frag.replace(/\s+/g,' ').trim()+'”'),
      opt.compact ? null : GG.el('p',{class:'small cr-pl'}, GG.el('strong',null,'大白话：'), h.pat.plain),
      GG.el('p',{class:'small cr-pl'},
        GG.el('strong',{style:{color:col}}, opt.shield ? '改对等的话：' : '改写建议：'), h.pat.rewrite)
    ));
  });
  wrap.appendChild(stack);
  return wrap;
}

function missingCard(missing){
  return GG.el('div',{class:'card pad', style:{marginTop:'18px', borderLeft:'4px solid #6b6f76'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '🧩 该有却没写的保护条款',
      GG.el('span',{class:'cr-tier-n', style:{background:'#6b6f76'}}, missing.length)),
    GG.el('p',{class:'small muted', style:{margin:'2px 0 12px'}},
      '正则只能看到“写了什么”；这些是按合同类型“本该有、却没在文本里找到”的保护，供你提醒对方补上（仅供参考）。'),
    GG.el('div',{class:'stack'}, ...missing.map(c=>
      GG.el('div',{class:'cr-miss'},
        GG.el('div',{class:'cr-miss-t'}, '缺：'+c.label),
        GG.el('p',{class:'small', style:{margin:'4px 0 6px', color:'var(--ink-2)'}}, c.msg),
        GG.el('p',{class:'small cr-pl', style:{margin:0}}, GG.el('strong',{style:{color:'#6b6f76'}},'建议补上：'), c.suggest)
      )))
  );
}

function scriptCard(text, hits, role, missing){
  const draft = buildScript(text, hits, role, missing);
  const strong = role.stance==='strong';
  const ta = GG.el('textarea',{class:'cr-mail', readonly:'', rows:'10'});
  ta.value = draft;
  const polishBtn = GG.llm.connected() ? GG.el('button',{class:'btn', onClick:async()=>{
    polishBtn.disabled = true; const old = polishBtn.textContent; polishBtn.textContent = '润色中…';
    try{ const out = await GG.llm.text(POLISH_SYS, draft, {max_tokens:1100});
      if(out && out.trim()){ ta.value = out.trim(); GG.toast('已用 AI 润色 ✓'); } }
    catch(e){ GG.toast(GG.llm.errMsg(e)); }
    finally{ polishBtn.disabled=false; polishBtn.textContent = old; }
  }}, '✨ 让 AI 润色得更得体') : null;
  return GG.el('div',{class:'card pad', style:{marginTop:'18px', borderLeft:'4px solid var(--accent)'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, strong ? '🗒 谈判备忘 · 让步底线' : '📧 改约邮件 · 复制就能发'),
    GG.el('p',{class:'small muted', style:{margin:'2px 0 10px'}}, strong
      ? '按上面的判断，自动整理出对方可能要求改的点和你的让步空间。'
      : `把底线、争取项和缺失条款，整理成一封发给${role.opp}的修改请求。改完一处，复制重发即可。`),
    ta,
    GG.el('div',{class:'row', style:{gap:'10px', marginTop:'10px', flexWrap:'wrap'}},
      GG.el('button',{class:'btn primary', onClick:()=>GG.copyText(ta.value)}, '📋 复制全文'),
      polishBtn
    )
  );
}

function appendShare(verdict, hits, role, stage){
  const tiers = tiersOf(hits);
  const top = hits.slice().sort((a,b)=> LEVEL_RANK[b.pat.level]-LEVEL_RANK[a.pat.level])[0];
  const shareSpec = {
    slug: SLUG,
    title: '合同签前体检 · '+verdict.tag,
    subtitle: '立场：'+role.label,
    big: { value: hits.length, label: '处风险' },
    bars: hits.length ? [{ label: verdict.tilt?('倾斜·向'+verdict.side):'倾斜度', pct: verdict.tilt }] : [],
    rows: [
      role.stance==='strong'
        ? { label:'偏向你', value: hits.length+' 处条款对你有利' }
        : { label:'底线必改', value: (tiers.deal.length||0)+' 处（高风险）' },
      role.stance==='strong' ? null : { label:'能争取', value: (tiers.push.length||0)+' 处' }
    ].filter(Boolean),
    note: hits.length
      ? (top ? `${verdict.line} 最该盯：${top.pat.label}。` : verdict.line)
      : verdict.line
  };
  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '截图分享这份签前体检 ↓'),
    shareSpec));
}

function appendRedo(stage){
  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; state={text:'',hits:[],role:state.role}; start(); }}, '↻ 换一份合同')
  ));
}

function docStyle(){
  return { marginTop:'10px', whiteSpace:'pre-wrap', wordBreak:'break-word',
    fontSize:'14px', lineHeight:'1.9', color:'var(--ink-1,#1d1d1f)',
    maxHeight:'420px', overflow:'auto', padding:'4px 2px' };
}

/* ───────────── 样式（JS 注入，不动 index.html） ───────────── */
function injectStyles(){
  if(GG.$('#cr-style')) return;
  const css = `
  .cr-input{ width:100%; min-height:240px; margin-top:8px; padding:14px 16px;
    border:1px solid var(--line); border-radius:var(--r); background:var(--surface);
    color:var(--ink-1,#1d1d1f); font-size:15px; line-height:1.7; resize:vertical;
    font-family:inherit; box-sizing:border-box; }
  .cr-rolewrap{ margin-top:18px; }
  .cr-rolelead,.cr-talead{ font-size:14px; font-weight:700; color:var(--ink-1,#1d1d1f); margin-bottom:8px; }
  .cr-talead{ margin-top:18px; }
  .cr-roles{ display:flex; flex-wrap:wrap; gap:8px; }
  .cr-role{ display:inline-flex; align-items:center; gap:6px; padding:8px 13px; border-radius:999px;
    border:1px solid var(--line); background:var(--surface); color:var(--ink-2);
    font-size:13.5px; cursor:pointer; transition:.15s; }
  .cr-role:hover{ border-color:var(--accent); }
  .cr-role.on{ border-color:var(--accent); background:var(--accent); color:#fff; font-weight:700; }
  .cr-role-em{ font-size:15px; }
  .cr-switch{ display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-bottom:14px; }
  .cr-switch-lead{ font-size:13px; color:var(--ink-2); margin-right:2px; }
  .cr-chip{ padding:5px 11px; border-radius:999px; border:1px solid var(--line);
    background:var(--surface); color:var(--ink-2); font-size:12.5px; cursor:pointer; transition:.15s; }
  .cr-chip:hover{ border-color:var(--accent); }
  .cr-chip.on{ border-color:var(--accent); background:var(--accent); color:#fff; font-weight:700; }
  .cr-verdict{ border:1.5px solid; border-radius:16px; padding:18px 18px 16px; margin-top:4px; }
  .cr-vtag{ display:inline-block; color:#fff; font-weight:800; font-size:15px;
    padding:5px 14px; border-radius:999px; }
  .cr-vline{ margin:12px 0 14px; font-size:15.5px; line-height:1.65; color:var(--ink-1,#1d1d1f); font-weight:600; }
  .cr-meter-lab{ display:flex; justify-content:space-between; align-items:baseline; gap:8px;
    font-size:12.5px; color:var(--ink-2); margin-bottom:6px; flex-wrap:wrap; }
  .cr-vcnt{ font-weight:700; }
  .cr-meter{ height:10px; border-radius:999px; background:rgba(0,0,0,.06); overflow:hidden; }
  .cr-meter-fill{ height:100%; border-radius:999px; transition:width .9s cubic-bezier(.2,.7,.2,1); }
  .cr-tier-h{ font-size:16px; font-weight:800; color:var(--ink-1,#1d1d1f); display:flex; align-items:center; gap:8px; }
  .cr-tier-n{ display:inline-flex; align-items:center; justify-content:center; min-width:22px; height:22px;
    padding:0 6px; border-radius:999px; background:var(--accent); color:#fff; font-size:12px; font-weight:700; }
  .cr-lv{ color:#fff; font-weight:700; padding:3px 10px; border-radius:999px; font-size:12px; white-space:nowrap; }
  .cr-cl-t{ font-size:16.5px; margin:0; }
  .cr-quote{ margin:10px 0 0; padding:8px 12px; border-radius:6px;
    color:var(--ink-1,#1d1d1f); font-size:13.5px; line-height:1.6; word-break:break-word; }
  .cr-pl{ margin:10px 0 0; color:var(--ink-2); line-height:1.7; }
  .cr-miss{ padding:12px 14px; border:1px dashed var(--line); border-radius:10px; background:var(--surface); }
  .cr-miss-t{ font-weight:700; font-size:14.5px; color:var(--ink-1,#1d1d1f); }
  .cr-mail{ width:100%; box-sizing:border-box; margin-top:4px; padding:13px 15px; min-height:200px;
    border:1px solid var(--line); border-radius:12px; background:var(--surface);
    color:var(--ink-1,#1d1d1f); font-size:13.5px; line-height:1.75; resize:vertical;
    font-family:ui-monospace,Menlo,Consolas,"Microsoft YaHei",monospace; }
  `;
  document.head.appendChild(GG.el('style',{id:'cr-style', html:css}));
}

start();
})();
