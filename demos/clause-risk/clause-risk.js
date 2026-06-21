/* clause-risk — 合同条款风险高亮。贴条款 → 体检 → 标红命中片段 + 逐条大白话解释 + 改写建议。
   签名点：标红的必须是用户 textarea 里的真实文本片段；每条解释/改写逐条对应被标红的片段。 */
(function(){
const SLUG = 'clause-risk';
const { RISK_PATTERNS, SAMPLE } = window.CLAUSE_RISK;
const LEVEL_COLOR = { '高':'#d64545', '中':'#d98a2b', '低':'#2e8b8b' };
const LEVEL_RANK  = { '高':3, '中':2, '低':1 };
let main, textarea;

/* ---------- 引擎：在用户真实文本里找命中片段 ---------- */
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
  // 按起点排序；重叠时保留更早/更长（更高风险优先）的一段，避免同一片段标多次
  hits.sort((a,b)=> a.start-b.start || (b.end-b.start)-(a.end-a.start) || LEVEL_RANK[b.pat.level]-LEVEL_RANK[a.pat.level]);
  const kept = [];
  let lastEnd = -1;
  for(const h of hits){
    if(h.start >= lastEnd){ kept.push(h); lastEnd = h.end; }
  }
  return kept; // 每个元素 = 一处真实命中的片段（升序、不重叠）
}

/* 用命中片段把原文包成 <mark>，其余原样转义 */
function esc(s){ return s.replace(/[&<>]/g, c=> c==='&'?'&amp;':c==='<'?'&lt;':'&gt;'); }
function highlight(text, hits){
  let out = '', cur = 0;
  hits.forEach((h,i)=>{
    out += esc(text.slice(cur, h.start));
    const col = LEVEL_COLOR[h.pat.level] || '#d64545';
    out += `<mark id="hit-${i}" class="cr-mark" style="background:${col}22;color:${col};`+
           `border-bottom:2px solid ${col};border-radius:3px;padding:0 2px;font-weight:600;cursor:pointer;scroll-margin-top:80px">`+
           esc(h.frag)+`</mark>`;
    cur = h.end;
  });
  out += esc(text.slice(cur));
  return out;
}

/* ---------- AI 通路（连了 key 用真实模型找风险，没连退回本地正则引擎） ---------- */
const CR_SYS = [
  '你是合同风险审阅助手（仅作演示、不构成法律意见）。读用户贴的合同/条款全文，找出对用户不利或有坑的条款。',
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

// 把 AI 返回的风险片段在原文里定位成 hits（必须是真实子串），再按 scan 的规则去重排序
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
      pat:{ level, label:String(r.label||'风险点'), plain:String(r.plain||''), rewrite:String(r.rewrite||'') } });
  }
  raw.sort((a,b)=> a.start-b.start || (b.end-b.start)-(a.end-a.start) || LEVEL_RANK[b.pat.level]-LEVEL_RANK[a.pat.level]);
  const kept=[]; let lastEnd=-1;
  for(const h of raw){ if(h.start>=lastEnd){ kept.push(h); lastEnd=h.end; } }
  return kept;
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  intro();
}

function intro(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '把合同条款贴进来，我替你体检'),
    GG.el('p', null, '逐句扫描常见的坑：最终解释权、概不退还、单方变更、自动续费、无限责任、视为同意…… 命中的原文会被标红，并逐条给出大白话解释和改写建议。')
  ));
  main.appendChild(GG.llm.bar());
  textarea = GG.el('textarea',{
    class:'cr-input',
    placeholder:'在此粘贴你的合同 / 协议 / 条款全文…（也可点下方按钮填入示例）',
    style:{
      width:'100%', minHeight:'260px', marginTop:'18px', padding:'14px 16px',
      border:'1px solid var(--line)', borderRadius:'var(--r)', background:'var(--surface)',
      color:'var(--ink-1, #1d1d1f)', fontSize:'15px', lineHeight:'1.7', resize:'vertical',
      fontFamily:'inherit', boxSizing:'border-box'
    }
  });
  main.appendChild(textarea);
  main.appendChild(GG.el('div',{class:'row', style:{justifyContent:'center', gap:'14px', marginTop:'18px', flexWrap:'wrap'}},
    GG.el('button',{class:'btn', onClick:()=>{ textarea.value = SAMPLE; textarea.focus(); }}, '填入示例合同'),
    GG.el('button',{class:'btn primary lg', onClick:runCheck}, '🔍 体检合同 →')
  ));
  const disc = GG.disclaimer(SLUG);
  if(disc) main.appendChild(GG.el('div',{style:{marginTop:'16px'}}, disc));
}

async function runCheck(){
  const text = (textarea.value||'').trim();
  if(!text){ GG.toast('先贴一段合同文本，或点“填入示例合同”'); return; }

  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  const useAI = GG.llm.connected();
  const think = GG.thinking(stage, ['通读条款全文…',
    useAI ? 'AI 逐句审阅、定位风险…' : '匹配常见风险句式…',
    '定位需要标红的片段…','整理大白话解释与改写建议…'], useAI?1900:1500);

  let hits;
  if(useAI){ const [h] = await Promise.all([getHits(text, true), think]); hits = h; }
  else { await think; hits = scan(text); }
  GG.clear(stage);
  showResult(text, hits, stage);
}

function showResult(text, hits, stage){
  // ── 概览 ──
  const high = hits.filter(h=>h.pat.level==='高').length;
  const head = GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, hits.length ? '⚖️ 体检完成' : '⚖️ 体检完成'),
    GG.el('p', null, hits.length
      ? `在你贴的文本里命中 ${hits.length} 处风险点${high?`（其中 ${high} 处高风险）`:''}，已在下方原文中标红。`
      : '未在你贴的文本里发现明显风险点。但这不代表合同绝对安全，重要条款仍建议人工复核。')
  );
  stage.appendChild(head);
  stage.appendChild(GG.el('div',{style:{margin:'0 0 4px'}}, GG.llm.badge(!!hits._ai)));

  if(!hits.length){
    stage.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'16px'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '原文'),
      GG.el('div',{class:'cr-doc', style:docStyle(), html: highlight(text, hits)})
    ));
    appendShare(text, hits, stage);
    appendRedo(stage);
    return;
  }

  // ── 标红原文 ──
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '原文（命中片段已标红，点条目可跳转）'),
    GG.el('div',{class:'cr-doc', style:docStyle(), html: highlight(text, hits)})
  ));

  // ── 逐条：引用被标红片段 + 大白话 + 改写 ──
  const list = GG.el('div',{class:'stack', style:{marginTop:'16px'}});
  hits.forEach((h,i)=>{
    const col = LEVEL_COLOR[h.pat.level] || '#d64545';
    list.appendChild(GG.el('div',{class:'card pad', style:{borderLeft:`4px solid ${col}`}},
      GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'flex-start', gap:'10px', flexWrap:'wrap'}},
        GG.el('div',{class:'row', style:{gap:'8px'}},
          GG.el('span',{style:{background:col, color:'#fff', fontWeight:'700', padding:'3px 10px', borderRadius:'999px', fontSize:'12px'}}, h.pat.level+'风险'),
          GG.el('h3',{style:{fontSize:'17px'}}, `${i+1}. ${h.pat.label}`)
        ),
        GG.el('button',{class:'btn', style:{padding:'4px 10px', fontSize:'12px'},
          onClick:()=>{ const t=GG.$('#hit-'+i, main); if(t){ t.scrollIntoView({behavior:'smooth', block:'center'});
            t.style.outline=`2px solid ${col}`; setTimeout(()=>t.style.outline='',1200);} }}, '定位原文 ↑')
      ),
      // 引用真实命中的子串
      GG.el('blockquote',{style:{margin:'10px 0 0', padding:'8px 12px', background:`${col}14`,
        borderLeft:`3px solid ${col}`, borderRadius:'6px', color:'var(--ink-1,#1d1d1f)', fontSize:'14px', lineHeight:'1.6'}},
        '原文：“'+h.frag.replace(/\s+/g,' ').trim()+'”'),
      GG.el('p',{class:'small', style:{margin:'10px 0 0', color:'var(--ink-2)', lineHeight:'1.7'}},
        GG.el('strong',null,'大白话：'), h.pat.plain),
      GG.el('p',{class:'small', style:{margin:'8px 0 0', color:'var(--ink-2)', lineHeight:'1.7'}},
        GG.el('strong',{style:{color:col}},'改写建议：'), h.pat.rewrite)
    ));
  });
  stage.appendChild(list);

  appendShare(text, hits, stage);
  appendRedo(stage);
}

function appendShare(text, hits, stage){
  const top = hits.slice().sort((a,b)=> LEVEL_RANK[b.pat.level]-LEVEL_RANK[a.pat.level])[0];
  const shareSpec = {
    slug: SLUG,
    title: '合同风险体检',
    big: { value: hits.length, label: '处风险' },
    rows: hits.slice(0,8).map(h=>({ label: h.pat.level, value: h.pat.label })),
    note: hits.length
      ? `最需要注意：${top.pat.label} —— ${top.pat.plain}`
      : '未发现明显风险点，但重要条款仍建议人工复核。'
  };
  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, hits.length ? '截图分享这份风险体检 ↓' : '截图保存这份体检 ↓'),
    shareSpec));
}

function appendRedo(stage){
  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ start(); }}, '↻ 换一份合同')
  ));
}

function docStyle(){
  return {
    marginTop:'10px', whiteSpace:'pre-wrap', wordBreak:'break-word',
    fontSize:'14px', lineHeight:'1.9', color:'var(--ink-1,#1d1d1f)',
    maxHeight:'420px', overflow:'auto', padding:'4px 2px'
  };
}

start();
})();
