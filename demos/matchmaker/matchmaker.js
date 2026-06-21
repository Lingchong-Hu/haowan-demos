/* matchmaker — 对话式精配。逐题作答 → 只返回 1 个候选人 + 可追溯到你答案的理由。
   规则：界面与分享卡绝不出现兼容性分数 / 匹配度百分比。 */
(function(){
const SLUG='matchmaker';
const { QUESTIONS, CANDIDATES } = window.MATCHMAKER;

// 按维度生成"对上的点"句子模板：引用用户那条 option 的 label。
// 用一个 helper 取某题某 key 的 label 文本。
function labelOf(qid, key){
  const q = QUESTIONS.find(x=>x.id===qid);
  const o = q && q.options.find(x=>x.key===key);
  return o ? o.label : '';
}
function dimOf(qid){ const q = QUESTIONS.find(x=>x.id===qid); return q ? q.dim : ''; }

// 命中某维度时的可追溯理由：直接引用「用户选的 label」+「候选人在该维度的取向」。
function reasonSentence(qid, userKey, name){
  const yours = labelOf(qid, userKey);
  const cand  = labelOf(qid, userKey); // 命中=同一 key，candidate label 等同用户 label
  switch(qid){
    case 'weekend':
      return `你的理想周末是「${yours}」，${name} 的周末也正是这样过的。`;
    case 'comm':
      return `你看重的沟通是「${yours}」，${name} 恰好就是这种相处方式。`;
    case 'value':
      return `你最希望对方「${yours}」，而这正是 ${name} 身上最被人记住的一点。`;
    case 'deal':
      return `你最受不了的是「${yours}」，${name} 也把这条列为自己的雷点——你俩的底线对上了。`;
    case 'pace':
      return `关系节奏上你想要「${yours}」，${name} 想要的节奏和你一致。`;
    case 'self':
      return `你给自己贴的标签是「${yours}」，${name} 也是同一挂的。`;
    default:
      return `你们在「${dimOf(qid)}」上选了同一个答案：「${yours}」。`;
  }
}

/* ---------- 引擎 ---------- */
// answers: {qid:key}. 内部算分排序选 top1（界面不显示分数）。
function match(answers){
  const seed = QUESTIONS.map(q=>answers[q.id]||'').join('|'); // 输入决定种子
  const scored = CANDIDATES.map((c, idx)=>{
    const hits = [];
    for(const q of QUESTIONS){
      const ak = answers[q.id];
      if(ak && c.picks[q.id]===ak) hits.push(q.id);
    }
    // 雷点(deal)对上额外加权——底线一致更关键
    let score = hits.length;
    if(hits.includes('deal')) score += 0.5;
    if(hits.includes('value')) score += 0.25;
    // 同分时用基于输入的稳定微扰打破平手，保证"不同输入→不同人"且可复现
    const jitter = GG.rng(seed+'#'+c.name)()*0.4;
    return { c, hits, score: score + jitter, base: hits.length, idx };
  }).sort((a,b)=> b.score - a.score);

  const best = scored[0];
  // 取命中维度生成理由；若命中不足 3 条，用"互补"句补足到至少 3 条且仍引用用户答案。
  const reasons = best.hits.map(qid=> ({ qid, text: reasonSentence(qid, answers[qid], best.c.name) }));
  if(reasons.length < 3){
    // 用用户答过、但该候选取向不同的维度，做"互补/参考"句，仍然引用用户选的 label
    for(const q of QUESTIONS){
      if(reasons.length>=3) break;
      if(best.hits.includes(q.id)) continue;
      const ak = answers[q.id]; if(!ak) continue;
      reasons.push({ qid:q.id, text:
        `你在「${q.dim}」选了「${labelOf(q.id, ak)}」，${best.c.name} 的取向略有不同，但 TA 说这种差异反而聊得起来。` });
    }
  }
  // 共同标签：候选人 tags + 命中维度名，作为分享标签
  const commonTags = best.c.tags.slice();
  return { cand: best.c, reasons: reasons.slice(0,4), seed };
}

/* ---------- AI 通路（候选人选择永远本地确定性；连了 key 让 AI 写更走心的理由 + 破冰开场白） ----------
   AI 只负责"措辞"，不改人选；严禁出现任何匹配度/分数/百分比。 */
const MM_SYS = '你是温暖、走心的红娘。系统已从候选库里为用户选定了唯一一位 TA（不可更换）。下面给你 TA 的资料、用户的问卷答案、以及你俩答案完全对上的维度。请写出"你们为什么对得上"的理由，以及一句可直接发出去的破冰开场白。只输出严格 JSON：{"reasons":["3到4条理由，每条引用用户的具体答案+TA的特点，温暖具体，35字内"],"icebreaker":"一句自然、不油腻、可直接发出去的破冰开场白"}。绝对不要出现任何匹配度、分数、百分比或数字评分。全部简体中文。';

async function getMatch(answers, useAI){
  const local = match(answers);
  if(useAI){
    try{
      const c = local.cand;
      const userAns = QUESTIONS.map(q=>{ const ak=answers[q.id]; return ak? `${q.dim}：${labelOf(q.id, ak)}` : null; }).filter(Boolean).join('\n');
      const hitDims = QUESTIONS.filter(q=> c.picks[q.id]===answers[q.id]).map(q=>q.dim);
      const user = `TA 资料：${c.name}，${c.age} 岁，${c.city}。简介：${c.bio}。标签：${(c.tags||[]).join('、')}\n\n用户的问卷答案：\n${userAns}\n\n你俩答案完全对上的维度：${hitDims.join('、') || '（没有完全一致的，靠互补聊得来）'}`;
      const obj = await GG.llm.json(MM_SYS, user, {max_tokens:700});
      const reasons = (Array.isArray(obj.reasons)?obj.reasons:[]).map(String).map(s=>s.trim()).filter(Boolean).slice(0,4).map(text=>({text}));
      if(reasons.length){
        return { cand:c, reasons, icebreaker:String(obj.icebreaker||'').trim(), _ai:true };
      }
    }catch(e){ GG.toast(GG.llm.errMsg(e)); }
  }
  return { cand:local.cand, reasons:local.reasons, icebreaker:'', _ai:false };
}

/* ---------- 流程 ---------- */
let main;

function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.a){
    showResult(st.a, true);
    return;
  }
  intro();
}

function intro(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '回答几道题，我只给你一个人'),
    GG.el('p', null, `不是滑不完的列表，也不算什么"匹配度"。${QUESTIONS.length} 道关于你的小问题，答完我会从候选库里，挑出最该认识你的那一位——并告诉你，为什么是 TA。`)
  ));
  main.appendChild(GG.llm.bar());
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'22px'}},
    GG.el('button',{class:'btn primary lg', onClick:()=>quiz()}, '开始回答 →')
  ));
}

function quiz(){
  GG.clear(main);
  const answers = {};
  let i = 0;

  const head = GG.el('div',{class:'hero', style:{paddingBottom:'4px'}});
  const prog = GG.el('div',{class:'prog', style:{marginTop:'14px'}}, GG.el('i',{style:{width:'0%'}}));
  const qWrap = GG.el('div',{style:{marginTop:'20px'}});
  const nav = GG.el('div',{class:'row', style:{justifyContent:'space-between', marginTop:'18px'}});

  main.appendChild(head);
  main.appendChild(prog);
  main.appendChild(qWrap);
  main.appendChild(nav);

  function render(){
    const q = QUESTIONS[i];
    GG.clear(head);
    head.appendChild(GG.el('div',{class:'small muted'}, `第 ${i+1} / ${QUESTIONS.length} 题　·　${q.dim}`));
    head.appendChild(GG.el('h1',{style:{fontSize:'24px', marginTop:'8px'}}, q.q));
    GG.$('i', prog).style.width = Math.round((i)/QUESTIONS.length*100)+'%';

    GG.clear(qWrap);
    const list = GG.el('div',{class:'stack'});
    q.options.forEach(o=>{
      const on = answers[q.id]===o.key;
      const opt = GG.el('div',{class:'opt'+(on?' on':''), onClick:()=>choose(q, o.key)},
        GG.el('div',{class:'dot'}),
        GG.el('div',{style:{fontSize:'15px'}}, o.label)
      );
      list.appendChild(opt);
    });
    qWrap.appendChild(list);

    GG.clear(nav);
    nav.appendChild(i>0
      ? GG.el('button',{class:'btn ghost', onClick:back}, '← 上一题')
      : GG.el('span'));
    nav.appendChild(GG.el('div',{class:'small muted'}, '选一个就自动进入下一题'));
  }

  function choose(q, key){
    answers[q.id] = key;
    render(); // 高亮所选
    setTimeout(()=>{
      if(i < QUESTIONS.length-1){ i++; render(); }
      else finish();
    }, 230);
  }
  function back(){ if(i>0){ i--; render(); } }

  function finish(){
    GG.encodeState({ a: answers });
    showResult(answers, false);
  }

  render();
}

async function showResult(answers, fromLink){
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  const useAI = GG.llm.connected();
  let res;
  if(!fromLink){
    const think = GG.thinking(stage, [
      '读你刚才的每一个选择…',
      '比对候选库里每个人的答案…',
      useAI ? '让 AI 把你们对上的点说清楚…' : '找你们真正对得上的那些点…',
      '只留一个最该认识你的人…',
    ], useAI?2000:1700);
    const [r] = await Promise.all([getMatch(answers, useAI), think]); res = r;
  } else {
    res = await getMatch(answers, useAI);
  }

  const { cand, reasons, icebreaker } = res;
  GG.clear(stage);

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, '💞 为你精配的，就这一位')));
  stage.appendChild(GG.el('div',{class:'center', style:{margin:'0 0 12px'}}, GG.llm.badge(!!res._ai)));

  // 候选人卡
  const profile = GG.el('div',{class:'card pad', style:{marginBottom:'16px',
      background:`linear-gradient(160deg,var(--accent-soft),var(--surface) 60%)`}},
    GG.el('div',{class:'row', style:{gap:'12px', flexWrap:'wrap'}},
      GG.el('h2',{style:{fontSize:'26px', fontWeight:'730'}}, cand.name),
      GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff',
        padding:'5px 13px', borderRadius:'999px', fontSize:'13px', fontWeight:'700'}},
        cand.age+' 岁'),
      GG.el('span',{class:'pill', style:{background:'var(--accent-soft)', color:'var(--accent)',
        padding:'5px 13px', borderRadius:'999px', fontSize:'13px', fontWeight:'600'}},
        cand.city)
    ),
    GG.el('p',{style:{margin:'12px 0 0', fontSize:'15px', color:'var(--ink-2)', lineHeight:'1.7'}}, cand.bio),
    GG.el('div',{class:'chips', style:{marginTop:'12px'}},
      cand.tags.map(t=> GG.el('span',{class:'chip', style:{cursor:'default'}}, t)))
  );
  stage.appendChild(profile);

  // 你们对上的点
  const why = GG.el('div',{class:'card pad'},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '你们对上的点'),
    GG.el('div',{class:'stack', style:{gap:'12px'}},
      reasons.map((r,idx)=> GG.el('div',{class:'row', style:{gap:'12px', alignItems:'flex-start'}},
        GG.el('span',{style:{flex:'none', width:'24px', height:'24px', borderRadius:'50%',
          background:'var(--accent)', color:'#fff', fontSize:'13px', fontWeight:'700',
          display:'flex', alignItems:'center', justifyContent:'center'}}, String(idx+1)),
        GG.el('div',{style:{fontSize:'15px', lineHeight:'1.65', color:'var(--ink)'}}, r.text)
      ))
    )
  );
  stage.appendChild(why);

  // ✨ AI 破冰开场白（连了 key 才有）
  if(icebreaker){
    stage.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'16px', borderLeft:'3px solid var(--accent)'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '✨ 不知道怎么开口？试试这句'),
      GG.el('p',{style:{margin:'0', fontSize:'15px', color:'var(--ink)', lineHeight:'1.7', fontStyle:'italic'}}, '“'+icebreaker+'”')));
  }

  // shareSpec：不放任何分数/百分比
  const shareSpec = {
    slug: SLUG,
    title: '为你精配：'+cand.name,
    subtitle: cand.age+' 岁 · '+cand.city,
    rows: reasons.map((r,idx)=> ({ label:'对上的点 '+(idx+1), value: r.text })),
    tags: cand.tags,
    note: cand.name+'——不是匹配度最高，是你的答案里，TA 一条条都接得住。',
  };

  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '把 TA 截图分享出去 ↓'),
    shareSpec));

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; main = GG.mountShell(SLUG); intro(); }},
      '↻ 换一组答案重新匹配')
  ));
}

start();
})();
