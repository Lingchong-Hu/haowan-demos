/* notebooklm — 喂资料替你消化。
   粘贴资料 → 本地检索引擎抽取学习指南（句子抽取，非生成）+ 基于资料原文的问答。
   引擎要点：切句 → 去停用词分词 → 词频 → 句子打分。
     · 摘要 = 取得分最高的若干原句（原样保留）。
     · 推荐问题 = 由高频词模板化生成。
     · 问答 = 问题分词与各句做关键词重叠打分，取最相关句 → 原样引用「根据原文：«…»」；命中不足则诚实说没提到。
   换资料 → 词频与句库重建 → 指南与答案都跟着变。 */
(function(){
const SLUG='notebooklm';
const {SAMPLE, STOP} = window.NOTEBOOKLM;
let main, engine=null;

/* ---------- 文本处理 ---------- */
// 切句：按中文句末标点 / 换行断句，保留较有信息量的句子。
function splitSentences(text){
  const raw = String(text)
    .replace(/\r/g,'')
    .split(/(?<=[。！？!?；;\n])/);
  const out=[];
  for(let s of raw){
    s = s.replace(/\n+/g,'').trim();
    // 去掉句子里残留的引导标点
    s = s.replace(/^[，、。！？!?；;：:\s]+/,'').trim();
    if(s.replace(/[^一-鿿a-zA-Z0-9]/g,'').length >= 6) out.push(s);
  }
  return out;
}
// 关键词切分：中文按 2~3 字滑窗 + 连续字母数字串；去停用词与单字噪声。
function tokenize(s){
  const toks=[];
  // 英文/数字词
  (s.match(/[a-zA-Z0-9]{2,}/g)||[]).forEach(w=>toks.push(w.toLowerCase()));
  // 中文：取连续汉字串，做 2gram + 3gram
  (s.match(/[一-鿿]{2,}/g)||[]).forEach(run=>{
    for(let i=0;i<run.length-1;i++){
      const bi = run.slice(i,i+2);
      if(!STOP.has(bi)) toks.push(bi);
      if(i<run.length-2){ const tri=run.slice(i,i+3); if(!STOP.has(tri)) toks.push(tri); }
    }
  });
  // 过滤纯停用词碎片
  return toks.filter(t=> !STOP.has(t));
}

/* ---------- 引擎：基于该资料构建（换资料即重建） ---------- */
function buildEngine(text){
  const sentences = splitSentences(text);
  // 全局词频（去停用词）
  const freq = {};
  const sentTokens = sentences.map(s=>{
    const ts = tokenize(s);
    ts.forEach(t=> freq[t]=(freq[t]||0)+1);
    return ts;
  });
  // 句子得分 = 句中各词词频之和 / 句长惩罚（避免长句通吃）
  const scored = sentences.map((s,i)=>{
    const ts = sentTokens[i];
    let sum=0; ts.forEach(t=> sum += freq[t]);
    const score = ts.length ? sum / Math.sqrt(ts.length) : 0;
    return {s, i, ts, score};
  });
  // 高频词（用于推荐问题 / 主旨），按频次取前若干、且至少出现 2 次的多字词
  const topWords = Object.entries(freq)
    .filter(([w,c])=> c>=2 && w.length>=2)
    .sort((a,b)=> b[1]-a[1] || b[0].length-a[0].length)
    .map(([w])=>w);
  // 去掉互相包含的冗余词（保留更具体的）
  const keyWords=[];
  for(const w of topWords){
    if(keyWords.some(k=> k.includes(w) || w.includes(k))) continue;
    keyWords.push(w);
    if(keyWords.length>=8) break;
  }
  return {sentences, sentTokens, freq, scored, keyWords};
}

// 摘要：取得分最高的 n 句，按原文顺序还原（更连贯）
function summarize(eng, n){
  const top = eng.scored.slice().sort((a,b)=> b.score-a.score).slice(0, n);
  return top.sort((a,b)=> a.i-b.i).map(x=> x.s);
}

// 主旨一句：全局最高分句
function gist(eng){
  const best = eng.scored.slice().sort((a,b)=> b.score-a.score)[0];
  return best ? best.s : '';
}

// 推荐问题：用高频关键词套模板（确实来自资料的词）
function suggestQuestions(eng){
  const tpl = w => [`什么是${w}？`, `${w}有什么作用？`, `如何${w}？`, `${w}和什么有关？`, `为什么会${w}？`];
  const qs=[]; const used=new Set();
  for(const w of eng.keyWords){
    // 给每个词挑一个模板（按词序错开，制造多样性）
    const t = tpl(w)[ (qs.length) % 5 ];
    if(used.has(t)) continue; used.add(t); qs.push(t);
    if(qs.length>=5) break;
  }
  return qs;
}

// 问答：问题分词 vs 各句关键词重叠打分，取最相关句原样引用
function answer(eng, q){
  const qt = tokenize(q);
  if(!qt.length) return {ok:false, reason:'empty'};
  const ranked = eng.scored.map(item=>{
    let overlap=0; const hitSet=new Set();
    for(const t of qt){
      if(item.ts.includes(t)){ overlap += 1 + (eng.freq[t]>=2?0.3:0); hitSet.add(t); }
    }
    // 还奖励问题词作为子串出现在句子里（覆盖切词边界）
    for(const t of qt){ if(!hitSet.has(t) && item.s.includes(t)){ overlap += 0.6; hitSet.add(t); } }
    return {s:item.s, i:item.i, overlap, hits:[...hitSet]};
  }).filter(r=> r.overlap>0).sort((a,b)=> b.overlap-a.overlap || a.i-b.i);

  if(!ranked.length) return {ok:false, reason:'none'};
  // 取最相关 1~2 句（第二句须达到首句相关度的一定比例，避免拼凑无关句）
  const picks=[ranked[0]];
  if(ranked[1] && ranked[1].overlap >= ranked[0].overlap*0.6) picks.push(ranked[1]);
  return {ok:true, quotes: picks.map(p=>p.s), hits: ranked[0].hits};
}

/* ---------- UI ---------- */
function start(){
  main = GG.mountShell(SLUG);
  engine = null;
  intro();
}

function intro(){
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '喂它一份资料，替你消化'),
    GG.el('p', null, '粘贴任意一段中文资料（文章、笔记、说明）。我会就着这份资料替你抽出学习指南，并基于原文回答你的问题——每个答案都引用资料里的原句。')
  ));

  const ta = GG.el('textarea',{
    id:'src', class:'card',
    placeholder:'在此粘贴你的资料……（也可点下方「用示例资料」）',
    style:{width:'100%', minHeight:'220px', padding:'16px', fontSize:'15px',
      lineHeight:'1.7', borderRadius:'var(--r)', resize:'vertical', marginTop:'18px',
      fontFamily:'inherit', color:'var(--ink-1)'}
  });
  ta.value='';
  main.appendChild(ta);

  const counter = GG.el('div',{class:'small muted', style:{marginTop:'8px'}}, '已输入 0 字');
  ta.addEventListener('input', ()=>{ counter.textContent = '已输入 '+ta.value.replace(/\s/g,'').length+' 字'; });
  main.appendChild(counter);

  main.appendChild(GG.el('div',{class:'row', style:{marginTop:'16px', flexWrap:'wrap'}},
    GG.el('button',{class:'btn primary lg', onClick:()=>{
      const text = ta.value.trim();
      if(text.replace(/\s/g,'').length < 40){ GG.toast('资料太短，至少粘 40 字'); return; }
      digest(text);
    }}, '✨ 替我消化这份资料 →'),
    GG.el('button',{class:'btn lg', onClick:()=>{
      ta.value = SAMPLE; counter.textContent = '已输入 '+SAMPLE.replace(/\s/g,'').length+' 字';
      GG.toast('已填入示例资料');
    }}, '📄 用示例资料')
  ));
}

async function digest(text){
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  await GG.thinking(stage, ['通读你的资料…','切句 · 统计关键词…','给每句打分、抽取要点…','整理学习指南…'], 1500);

  engine = buildEngine(text);
  const points = summarize(engine, Math.min(5, Math.max(3, Math.round(engine.sentences.length/4))));
  const theGist = gist(engine);
  const questions = suggestQuestions(engine);

  GG.clear(stage);
  renderResult(stage, text, points, theGist, questions);
}

function renderResult(stage, text, points, theGist, questions){
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, '📓 你的学习指南')));

  // 资料主旨
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', background:'linear-gradient(160deg,var(--accent-soft),var(--surface) 60%)'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '资料主旨'),
    GG.el('div',{style:{fontSize:'17px', fontWeight:'600', lineHeight:'1.6'}}, theGist),
    GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}}, `从你这 ${engine.sentences.length} 句资料里，按关键词密度抽出的核心句。`)
  ));

  // 学习指南要点（抽取自原文）
  const ptList = GG.el('div',{class:'stack'});
  points.forEach((p,i)=>{
    ptList.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'14px', alignItems:'flex-start'}},
      GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', fontWeight:'700', padding:'4px 11px', borderRadius:'999px', fontSize:'13px', flex:'none'}}, '要点 '+(i+1)),
      GG.el('div',{style:{flex:'1', lineHeight:'1.65', color:'var(--ink-1)'}}, p)
    ));
  });
  stage.appendChild(GG.el('div',{class:'section-t'}, '关键要点（直接抽自你的资料）'));
  stage.appendChild(ptList);

  // 问答区
  const qaBox = GG.el('div',{class:'card pad', style:{marginTop:'20px'}});
  qaBox.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '基于资料问答 · 答案引用原文'));

  const ansArea = GG.el('div',{style:{marginTop:'14px'}});

  const input = GG.el('input',{type:'text', class:'card',
    placeholder:'问点关于这份资料的问题……',
    style:{width:'100%', padding:'12px 14px', fontSize:'15px', borderRadius:'var(--r)', fontFamily:'inherit'}
  });
  const askBtn = GG.el('button',{class:'btn primary', onClick:()=>doAsk(input.value)}, '提问');
  input.addEventListener('keydown', e=>{ if(e.key==='Enter') doAsk(input.value); });

  // 推荐问题 chips
  qaBox.appendChild(GG.el('div',{class:'small muted', style:{marginBottom:'8px'}}, '试试这些问题（由资料高频词生成）：'));
  const chipRow = GG.el('div',{class:'chips', style:{marginBottom:'14px'}});
  questions.forEach(q=>{
    chipRow.appendChild(GG.el('span',{class:'chip', onClick:()=>{ input.value=q; doAsk(q); }}, q));
  });
  qaBox.appendChild(chipRow);
  qaBox.appendChild(GG.el('div',{class:'row', style:{gap:'10px'}}, input, askBtn));
  qaBox.appendChild(ansArea);
  stage.appendChild(qaBox);

  function doAsk(q){
    q = String(q||'').trim();
    if(!q){ GG.toast('先输入一个问题'); return; }
    const res = answer(engine, q);
    GG.clear(ansArea);
    const wrap = GG.el('div',{style:{marginTop:'16px', borderTop:'1px solid var(--line)', paddingTop:'14px'}});
    wrap.appendChild(GG.el('div',{class:'small', style:{color:'var(--ink-2)', marginBottom:'8px'}}, '问：'+q));
    if(res.ok){
      res.quotes.forEach(quote=>{
        wrap.appendChild(GG.el('div',{style:{
          margin:'8px 0', padding:'12px 14px', background:'var(--accent-soft)',
          borderLeft:'3px solid var(--accent)', borderRadius:'8px', lineHeight:'1.65'}},
          GG.el('span',{style:{color:'var(--accent)', fontWeight:'700'}}, '根据原文：'),
          GG.el('span',null, '«'+quote+'»')
        ));
      });
      wrap.appendChild(GG.el('div',{class:'small muted', style:{marginTop:'6px'}}, '以上为资料中与你的问题最相关的原句（原样引用，未改写）。'));
    } else {
      wrap.appendChild(GG.el('div',{style:{margin:'8px 0', padding:'12px 14px', background:'var(--accent-soft)', borderRadius:'8px', lineHeight:'1.65'}},
        '这份资料里没有提到相关内容，我无法据此回答。换个角度问问，或补充更多资料试试。'));
    }
    ansArea.appendChild(wrap);
  }

  // 分享卡：要点 → rows
  const shareSpec = {
    slug: SLUG,
    title: '学习指南',
    subtitle: '基于你的资料 · '+points.length+' 个要点',
    rows: points.map((p,i)=>({label:'要点'+(i+1), value:p})),
    note: theGist,
    tags: engine.keyWords.slice(0,5)
  };
  stage.appendChild(GG.el('div',{style:{marginTop:'22px'}},
    GG.resultCard(SLUG, GG.el('div',{class:'center muted small'}, '把这份学习指南存图 / 分享 ↓'), shareSpec)));

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:start}, '↻ 换一份资料')
  ));
}

start();
})();
