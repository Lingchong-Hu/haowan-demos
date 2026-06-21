/* ollie — 冰箱出菜谱。勾选「冰箱里有的」食材 → 算每道菜缺几样 → 只列缺料 ≤2 的菜，
   现在就能做（缺0）排最前，再按缺料数升序。换勾选 → 菜单变。 */
(function(){
const SLUG='ollie';
const {INGREDIENTS, RECIPES} = window.OLLIE;
const MAX_MISSING = 2;            // 最多额外缺 1~2 样
const LABEL = {};                 // key -> {label, emoji}
const BY_LABEL = {};              // label -> {label, emoji}（AI 返回的是名称而非 key）
INGREDIENTS.forEach(g=>g.items.forEach(it=>{ LABEL[it.key]=it; BY_LABEL[it.label]=it; }));
function resolveIng(x){ return LABEL[x] || BY_LABEL[x] || {label:String(x), emoji:''}; }

/* ---------- AI 通路（连了 key 让模型现想能做的菜，没连退回本地菜谱库匹配） ---------- */
const OLLIE_SYS = '你是家常菜助手。用户给出冰箱里现有的食材，你给出几道现在就能做、或只差一两样的家常菜。只输出严格 JSON：{"dishes":[{"name":"菜名","emoji":"一个食物emoji","minutes":分钟数,"blurb":"一句话简介","uses":["用到的、用户现有的食材"],"extra":["还需额外补的食材，最多2样，没有就[]"],"steps":["步骤",3到5条]}]}。优先用用户现有食材；extra 最多 2 项；给 3 到 6 道；全部简体中文。';

async function getDishes(useAI){
  if(useAI && selected.size){
    try{
      const sel = [...selected].map(k=> (LABEL[k]||{}).label || k);
      const obj = await GG.llm.json(OLLIE_SYS, '冰箱里现有：'+sel.join('、'), {max_tokens:1600});
      const dishes = normalizeDishes(obj);
      if(dishes.length){ dishes._ai = true; return dishes; }
    }catch(e){ GG.toast(GG.llm.errMsg(e)); }
  }
  return cook();
}
function normalizeDishes(obj){
  const arr = Array.isArray(obj && obj.dishes) ? obj.dishes : [];
  return arr.slice(0,8).map(d=>({
    r:{ name:String(d.name||''), emoji:d.emoji||'🍽️', minutes:parseInt(d.minutes,10)||10,
        blurb:String(d.blurb||''), steps:(Array.isArray(d.steps)?d.steps:[]).map(String).filter(Boolean) },
    have:(Array.isArray(d.uses)?d.uses:[]).map(String).filter(Boolean),
    missing:(Array.isArray(d.extra)?d.extra:[]).map(String).filter(Boolean).slice(0,2)
  })).filter(d=>d.r.name)
    .sort((a,b)=> a.missing.length-b.missing.length);
}

let main;
const selected = new Set();        // 已勾选的食材 key

/* ---------- 引擎 ---------- */
function cook(){
  const dishes = RECIPES.map(r=>{
    const missing = r.need.filter(k=> !selected.has(k));
    const have    = r.need.filter(k=> selected.has(k));
    return { r, missing, have };
  })
  // 只展示缺料 ≤2 的菜（绝不推荐需要一堆没勾选食材的菜）
  .filter(d=> d.missing.length <= MAX_MISSING)
  // 现在就能做（缺0）最前，然后按缺料数升序；同缺料数下用料多的更"实在"，排前
  .sort((a,b)=> a.missing.length - b.missing.length || b.have.length - a.have.length);
  return dishes;
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && Array.isArray(st.sel)){
    selected.clear();
    st.sel.forEach(k=>{ if(LABEL[k]) selected.add(k); });
    if(selected.size) { showResult(true); return; }
  }
  pick();
}

function pick(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '冰箱里有什么？'),
    GG.el('p', null, '勾选你现在手头有的食材，我就告诉你现在能做哪些菜——只用你选的，最多帮你补 1~2 样。')
  ));
  main.appendChild(GG.llm.bar());

  // 实时计数 + 出菜按钮
  const counter = GG.el('div',{class:'small muted center', style:{marginTop:'4px'}});
  const goWrap  = GG.el('div',{class:'center', style:{marginTop:'18px', minHeight:'52px'}});

  INGREDIENTS.forEach(group=>{
    main.appendChild(GG.el('div',{class:'section-t'}, group.cat));
    const chipsBox = GG.el('div',{class:'chips'});
    group.items.forEach(it=>{
      const chip = GG.el('button',{
        class:'chip'+(selected.has(it.key)?' on':''),
        type:'button',
        onClick:()=>{
          if(selected.has(it.key)) selected.delete(it.key);
          else selected.add(it.key);
          chip.classList.toggle('on');
          update();
        }
      }, it.emoji+' '+it.label);
      chipsBox.appendChild(chip);
    });
    main.appendChild(chipsBox);
  });

  main.appendChild(GG.el('div',{style:{marginTop:'22px'}}, counter));
  main.appendChild(goWrap);

  function update(){
    const n = selected.size;
    const doable = cook().length;
    counter.textContent = n
      ? `已选 ${n} 样食材 · 现在能配出 ${doable} 道菜`
      : '还没勾选食材——勾几样试试';
    GG.clear(goWrap);
    if(n){
      goWrap.appendChild(GG.el('button',{class:'btn primary lg', onClick:run},
        '🍳 看能做什么 →'));
    }
  }
  update();
}

async function run(){
  GG.encodeState({sel:[...selected]});
  showResult(false);
}

function ingTag(key, mode){
  // mode: 'have'（你选的，高亮）/ 'miss'（还差）
  const it = resolveIng(key);
  const base = {padding:'5px 11px', borderRadius:'999px', fontSize:'13px',
    display:'inline-flex', alignItems:'center', gap:'4px'};
  if(mode==='have'){
    return GG.el('span',{style:Object.assign({}, base,
      {background:'var(--accent)', color:'#fff', fontWeight:'600'})}, it.emoji+' '+it.label);
  }
  return GG.el('span',{style:Object.assign({}, base,
    {border:'1px dashed #d98b34', color:'#b9721f', background:'rgba(224,146,43,.08)'})},
    '还差 '+it.emoji+' '+it.label);
}

async function showResult(fromLink){
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);

  const useAI = GG.llm.connected();
  let dishes;
  if(!fromLink){
    const think = GG.thinking(stage, [
      '翻看你冰箱里的 '+selected.size+' 样食材…',
      useAI ? 'AI 现想能配出的菜…' : '比对菜谱所需配料…',
      '剔掉缺一堆料的菜…',
      '排出现在最该做的几道…'
    ], useAI?1900:1500);
    const [d] = await Promise.all([getDishes(useAI), think]); dishes = d;
  } else {
    dishes = await getDishes(useAI);
  }
  const nowCount = dishes.filter(d=> d.missing.length===0).length;
  const selLabels = [...selected].map(k=> LABEL[k] ? LABEL[k].label : k);

  GG.clear(stage);
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, '🍳 你冰箱能做的菜')));
  stage.appendChild(GG.el('div',{style:{margin:'0 0 6px'}}, GG.llm.badge(!!dishes._ai)));

  // 概览卡
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', background:`linear-gradient(160deg,var(--accent-soft),#fff 60%)`}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '基于你选的食材'),
    GG.el('div',{class:'chips', style:{marginBottom:'10px'}},
      selLabels.length ? selLabels.map(l=>GG.el('span',{class:'chip on', style:{cursor:'default'}}, l))
                       : [GG.el('span',{class:'small muted'}, '（没选食材）')]),
    GG.el('p',{class:'small muted', style:{margin:'0'}},
      dishes.length
        ? `共 ${dishes.length} 道可做：${nowCount} 道现在就能做` +
          (dishes.length-nowCount ? `，另有 ${dishes.length-nowCount} 道只差 1~2 样。` : '。')
        : '现有食材还凑不齐任何一道菜，再勾几样常见的（如油、盐、鸡蛋）试试。')
  ));

  // 菜列表
  if(dishes.length){
    const list = GG.el('div',{class:'stack'});
    dishes.forEach(d=>{
      const now = d.missing.length===0;
      const badge = now
        ? GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', fontWeight:'700', padding:'4px 11px', borderRadius:'999px', fontSize:'13px'}}, '✓ 现在能做')
        : GG.el('span',{class:'pill', style:{background:'rgba(224,146,43,.14)', color:'#b9721f', fontWeight:'700', padding:'4px 11px', borderRadius:'999px', fontSize:'13px'}}, '差 '+d.missing.length+' 样');

      list.appendChild(GG.el('div',{class:'card pad'},
        GG.el('div',{class:'row', style:{justifyContent:'space-between', flexWrap:'wrap', gap:'8px'}},
          GG.el('div',{class:'row', style:{gap:'10px'}},
            GG.el('span',{style:{fontSize:'26px'}}, d.r.emoji),
            GG.el('h3',{style:{fontSize:'19px'}}, d.r.name)),
          GG.el('div',{class:'row', style:{gap:'8px'}},
            badge,
            GG.el('span',{class:'pill', style:{padding:'4px 11px', borderRadius:'999px', fontSize:'13px', border:'1px solid var(--line)', color:'var(--ink-3)'}}, '⏱ '+d.r.minutes+' 分钟'))
        ),
        GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}}, d.r.blurb),
        // 用到的（你选的）食材高亮
        GG.el('div',{class:'chips', style:{marginTop:'10px'}},
          d.have.map(k=> ingTag(k,'have'))),
        // 缺的食材（≤2，明示）
        d.missing.length ? GG.el('div',{class:'chips', style:{marginTop:'8px'}},
          d.missing.map(k=> ingTag(k,'miss'))) : null,
        // 步骤
        GG.el('ol',{class:'small', style:{margin:'12px 0 0', paddingLeft:'20px', color:'var(--ink-2)', lineHeight:'1.7'}},
          d.r.steps.map(s=> GG.el('li', null, s)))
      ));
    });
    stage.appendChild(list);
  }

  // 分享
  const shareSpec = {
    slug: SLUG,
    title: '冰箱里能做的菜',
    subtitle: '选了 '+selected.size+' 样食材',
    tags: selLabels,
    note: dishes.length
      ? (nowCount ? `现在就能做 ${nowCount} 道，第一道：${dishes[0].r.name}` : `最近的一道：${dishes[0].r.name}（差 ${dishes[0].missing.length} 样）`)
      : '现有食材还凑不齐一道菜',
    rows: dishes.slice(0,6).map(d=>({
      label: d.missing.length===0 ? '✓ 现在能做' : ('差 '+d.missing.length+' 样'),
      value: d.r.name
    })),
  };

  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, dishes.length ? '截图分享你的冰箱菜单 ↓' : '换几样食材再试 ↓'),
    shareSpec));

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; pick(); }}, '↻ 改一下食材')
  ));
}

start();
})();
