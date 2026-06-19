/* pet-vet — 会反问澄清的 AI 兽医。
   流程：选物种(可选)+症状 → 先反问澄清问题（必经，绝不一上来给建议）→ 逐题收答案
        → 全部答完才生成建议，建议里引用用户的澄清回答 → 三级语气分级 + 分享卡。
   不同症状 / 不同澄清答案 → 不同建议。 */
(function(){
const SLUG='pet-vet';
const { SPECIES, LEVELS, SYMPTOMS } = window.PETVET;
let main;

function speciesLabel(sp){
  const s = SPECIES.find(s=>s.v===sp);
  return s ? s.label : '🐾 宠物';
}

function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.k && SYMPTOMS[st.k] && st.a){
    replay(st.sp||'unknown', st.k, st.a);
    return;
  }
  intro();
}

/* ---------- 第一步：选物种 + 症状 ---------- */
function intro(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '它怎么不舒服？'),
    GG.el('p', null, '选物种、点一个症状。我不会一上来就甩通用建议——会像真兽医一样先反问你几个澄清问题，再根据你的回答给出「在家护理 / 建议就医 / 尽快急诊」的明确判断。')
  ));

  // 物种（可选）
  let species = 'unknown';
  main.appendChild(GG.el('div',{class:'section-t'}, '① 选个物种（可选）'));
  const spRow = GG.el('div',{class:'chips', style:{marginBottom:'6px'}});
  function paintSp(){
    GG.clear(spRow);
    SPECIES.forEach(s=>{
      spRow.appendChild(GG.el('button',{
        class:'chip'+(s.v===species?' on':''),
        onClick:()=>{ species=s.v; paintSp(); }
      }, s.label));
    });
  }
  paintSp();
  main.appendChild(spRow);

  // 症状
  main.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'20px'}}, '② 选一个主要症状'));
  const grid = GG.el('div',{style:{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'12px', marginTop:'4px'}});
  Object.keys(SYMPTOMS).forEach(key=>{
    const s = SYMPTOMS[key];
    grid.appendChild(GG.el('button',{class:'card pad', style:{
        cursor:'pointer', textAlign:'left', border:'1px solid var(--line)', background:'var(--surface)'
      }, onClick:()=>runFlow(species, key)},
      GG.el('div',{style:{fontSize:'30px', lineHeight:'1'}}, s.emoji),
      GG.el('div',{style:{fontWeight:'700', fontSize:'18px', marginTop:'8px'}}, s.label),
      GG.el('div',{style:{fontSize:'13px', marginTop:'4px', color:'var(--ink-3)'}}, s.blurb)
    ));
  });
  main.appendChild(grid);
}

/* ---------- 第二步：逐题反问澄清（必经，不答完不给建议） ---------- */
function runFlow(species, key){
  const sym = SYMPTOMS[key];
  const ans = {};               // qid -> v
  GG.clear(main);

  const head = GG.el('div',{class:'hero', style:{paddingBottom:'6px'}},
    GG.el('h1',{style:{fontSize:'22px'}}, sym.emoji+' '+speciesLabel(species)+' · '+sym.label),
    GG.el('p',{style:{fontSize:'15px'}}, '在给建议前，我先确认几件事 👇'));
  const prog = GG.el('div',{class:'prog', style:{marginTop:'12px'}}, GG.el('i',{style:{width:'0%'}}));
  const counter = GG.el('div',{class:'muted small', style:{marginTop:'8px'}});
  const card = GG.el('div',{class:'card pad', style:{marginTop:'16px'}});
  main.appendChild(head);
  main.appendChild(prog);
  main.appendChild(counter);
  main.appendChild(card);
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'16px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '← 换个症状')));

  const total = sym.questions.length;
  function render(){
    const idx = Object.keys(ans).length;     // 已答题数
    if(idx >= total){ finish(species, key, ans); return; }
    const q = sym.questions[idx];
    GG.$('i', prog).style.width = Math.round(idx/total*100)+'%';
    counter.textContent = `澄清问题 ${idx+1} / ${total}　·　答完才会给建议`;
    GG.clear(card);
    card.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'0'}}, 'AI 兽医反问'));
    card.appendChild(GG.el('div',{style:{fontSize:'20px', fontWeight:'650', lineHeight:'1.4'}}, q.q));
    const opts = GG.el('div',{class:'stack', style:{gap:'10px', marginTop:'18px'}});
    q.opts.forEach(o=>{
      opts.appendChild(GG.el('button',{class:'opt', style:{
          display:'flex', alignItems:'center', gap:'12px', cursor:'pointer',
          padding:'14px 16px', textAlign:'left', width:'100%', fontSize:'16px'
        }, onClick:()=>{ ans[q.id]=o.v; render(); }},
        GG.el('span',{class:'dot'}),
        GG.el('span', null, o.label)));
    });
    card.appendChild(opts);
  }
  render();
}

/* ---------- 第三步：思考过场 → 生成建议 ---------- */
async function finish(species, key, ans){
  GG.encodeState({ sp:species, k:key, a:ans });
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  await GG.thinking(stage, ['读你的澄清回答…','比对常见病因与红旗信号…','判断紧急程度…','给出分级建议…'], 1500);
  showResult(species, key, ans, stage);
}

// 分享链接复现：无过场直接出结果
function replay(species, key, ans){
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  showResult(species, key, ans, stage);
}

function showResult(species, key, ans, stage){
  const sym = SYMPTOMS[key];
  const res = sym.rule(ans);
  const level = LEVELS[res.level];
  GG.clear(stage);

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'6px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, sym.emoji+' '+speciesLabel(species)+' · '+sym.label+' 建议')));

  // 三级条
  const order = [LEVELS.home, LEVELS.vet, LEVELS.er];
  const ladder = GG.el('div',{style:{display:'flex', gap:'8px', margin:'16px 0'}});
  order.forEach(L=>{
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
  stage.appendChild(ladder);

  // 主结论（引用用户的澄清回答）
  stage.appendChild(GG.el('div',{class:'card pad', style:{
      marginBottom:'16px', borderLeft:'5px solid '+level.color, background:level.soft}},
    GG.el('div',{class:'section-t', style:{marginTop:'0', color:level.color}}, '兽医建议'),
    GG.el('div',{style:{fontSize:'22px', fontWeight:'800', color:level.color}}, level.emoji+' '+level.name),
    GG.el('p',{style:{margin:'10px 0 0', color:'var(--ink-2)', fontSize:'15px', lineHeight:'1.7'}}, res.advice)
  ));

  // 你的澄清回答
  const qaCard = GG.el('div',{class:'card pad', style:{marginBottom:'16px'}});
  qaCard.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '你的澄清回答'));
  const list = GG.el('div',{class:'stack', style:{gap:'10px', marginTop:'6px'}});
  const rows = [];
  sym.questions.forEach(q=>{
    const o = q.opts.find(o=>o.v===ans[q.id]);
    const val = o ? o.label : '—';
    rows.push({ label: q.q.replace(/[？?].*$/,''), value: val });
    list.appendChild(GG.el('div',{class:'row', style:{gap:'10px', alignItems:'flex-start'}},
      GG.el('span',{class:'pill', style:{
          flex:'none', fontSize:'12px', padding:'2px 9px', borderRadius:'999px', fontWeight:'700',
          background:'var(--accent-soft)', color:'var(--accent)'}}, '问'),
      GG.el('span',{style:{fontSize:'14px', color:'var(--ink-2)', lineHeight:'1.5'}},
        q.q+'　→　',
        GG.el('b',{style:{color:'var(--ink-1)'}}, val))
    ));
  });
  qaCard.appendChild(list);
  qaCard.appendChild(GG.el('p',{class:'muted small', style:{margin:'12px 0 0'}},
    '建议正是根据上面这些回答分支得出——换个答案，结论就会变。'));
  stage.appendChild(qaCard);

  // shareSpec：物种+症状 / 关键澄清回答 / 核心建议
  const shareSpec = {
    slug: SLUG,
    title: 'AI 兽医建议',
    subtitle: speciesLabel(species)+' · '+sym.label+'　'+level.emoji+' '+level.name,
    tags: rows.map(r=> r.value.replace(/^[^一-龥a-zA-Z0-9]+/,'').slice(0,10)),
    rows: rows,
    note: res.advice.length>60 ? res.advice.slice(0,58)+'…' : res.advice
  };

  // resultCard 因 registry disclaimer:true 会自动追加「非医疗建议」免责声明
  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '截图保存这次问诊结果 ↓'),
    shareSpec));

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '↻ 重新问诊 / 换症状')));
}

start();
})();
