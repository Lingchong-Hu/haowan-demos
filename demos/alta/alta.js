/* alta — 衣橱 + 场合 → 整套搭配。
   先勾选「我衣橱里有的」单品 → 选场合 → thinking → 从你勾的单品里按场合契合度
   每个部位各挑一件，组出整套 + 理由。换场合 → 重算 → 不同整套。 */
(function(){
const SLUG='alta';
const {WARDROBE, OCCASIONS} = window.ALTA;
const SLOTS = ['上装','下装','外套','鞋','配饰'];
const REQUIRED = ['上装','下装','鞋'];           // 必须凑齐；外套/配饰按场合可选
const BY_KEY = Object.fromEntries(WARDROBE.map(w=>[w.key, w]));
// "全选常见" 默认勾选的一组百搭单品
const COMMON = ['tee_white','shirt_ox','knit','jeans','trousers','chinos',
  'blazer','denim_jkt','loafers','sneakers','boots','watch','tote'];
let main;
let picked = new Set();   // 用户勾选的单品 key

/* ---------- 契合度引擎 ---------- */
// 单件对某场合的契合分（场合不同 → 同一件得分不同 → 不同场合选出不同件）
function fit(item, occ){
  const w = occ.want;
  let s = 0;
  // 1) 正式度落在理想区间得满分，越偏离扣得越多
  const [lo,hi] = w.form;
  if(item.formality >= lo && item.formality <= hi) s += 5;
  else s += 5 - Math.min(5, (item.formality<lo ? lo-item.formality : item.formality-hi)*2.2);
  // 2) 风格标签命中场合偏好
  const hits = item.styleTags.filter(t=> w.styleTags.includes(t));
  s += hits.length * 2.4;
  // 3) 运动场合强偏运动风，非运动场合轻微排斥运动单品
  const isSporty = item.styleTags.includes('运动');
  if(w.sporty){ if(isSporty) s += 4; else s -= 1.5; }
  else if(isSporty) s -= 2;
  // 4) 保暖偏好（婚礼/约会偏轻薄，这里仅作微调）
  return s;
}

// 从已勾选单品里，按场合给每个 slot 选最佳一件 → 整套
function buildOutfit(occ){
  const chosen = WARDROBE.filter(w=> picked.has(w.key));
  const outfit = {};
  const reasons = [];
  for(const slot of SLOTS){
    const pool = chosen.filter(w=> w.slot===slot);
    if(!pool.length) continue;
    const ranked = pool.map(w=>({w, s:fit(w, occ)})).sort((a,b)=> b.s - a.s);
    const best = ranked[0];
    // 外套：仅当场合偏好外套、或此件确实契合（分够高）才纳入
    if(slot==='外套'){
      const wantOuter = occ.want.needOuter || 0;
      if(wantOuter < 0.45 && best.s < 7) continue;   // 不太需要外套且这件也不亮眼 → 跳过
    }
    // 配饰：分太低就不强加
    if(slot==='配饰' && best.s < 4) continue;
    outfit[slot] = best.w;
    reasons.push({slot, item:best.w, score:best.s, hits:best.w.styleTags.filter(t=> occ.want.styleTags.includes(t))});
  }
  return {outfit, reasons};
}

function missingRequired(){
  const chosen = WARDROBE.filter(w=> picked.has(w.key));
  return REQUIRED.filter(slot=> !chosen.some(w=> w.slot===slot));
}

// 一句话理由（引用场合 + 命中的风格）
function reasonLine(occ, reasons){
  const top = reasons.filter(r=>['上装','下装','鞋'].includes(r.slot)).slice(0,3)
    .map(r=> r.item.label).join(' + ');
  const flavor = {
    work:'通勤要利落得体', date:'约会走优雅路线', interview:'面试求最正式稳妥',
    sport:'运动图轻便透气', weekend:'出游主打轻松好动', wedding:'婚礼宾客要精致不抢镜'
  }[occ.key] || (occ.label+'场合');
  return `${flavor}，所以挑了 ${top}。`;
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.p && st.o){
    picked = new Set(st.p.filter(k=> BY_KEY[k]));
    const occ = OCCASIONS.find(o=> o.key===st.o);
    if(occ && picked.size){ showResult(occ, true); return; }
  }
  pickStage();
}

/* 第一步：勾选衣橱单品（按部位分组，可多选） */
function pickStage(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '先告诉我，你衣橱里有什么'),
    GG.el('p', null, '按部位勾选你真实拥有的单品（可多选）。待会儿我只会从这些里给你搭整套。')
  ));

  const quick = GG.el('div',{class:'row', style:{justifyContent:'center', gap:'10px', marginTop:'14px', flexWrap:'wrap'}},
    GG.el('button',{class:'btn', onClick:()=>{ COMMON.forEach(k=>picked.add(k)); refresh(); }}, '⚡ 全选常见'),
    GG.el('button',{class:'btn ghost', onClick:()=>{ picked.clear(); refresh(); }}, '清空')
  );
  main.appendChild(quick);

  const groups = GG.el('div',{class:'stack', style:{marginTop:'18px'}});
  SLOTS.forEach(slot=>{
    const items = WARDROBE.filter(w=> w.slot===slot);
    const chipBox = GG.el('div',{class:'chips'},
      items.map(it=> chipFor(it))
    );
    groups.appendChild(GG.el('div',{class:'card pad'},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, slot),
      chipBox
    ));
  });
  main.appendChild(groups);

  const footer = GG.el('div',{class:'center', style:{marginTop:'20px'}});
  main.appendChild(footer);

  function chipFor(it){
    const el = GG.el('span',{class:'chip'+(picked.has(it.key)?' on':''),
      onClick:()=>{ picked.has(it.key)? picked.delete(it.key): picked.add(it.key); refresh(); }},
      it.emoji+' '+it.label);
    return el;
  }
  function refresh(){ pickStage(); }   // 简单整页重绘，状态在 picked 里

  // 底部 CTA + 缺件提示
  const miss = missingRequired();
  const tip = GG.el('div',{class:'small muted center', style:{marginBottom:'10px'}},
    picked.size? `已勾 ${picked.size} 件` + (miss.length? `　·　还差：${miss.join(' / ')}（搭整套至少要上装/下装/鞋）` : '　·　可以搭整套了')
               : '至少勾一件试试');
  footer.appendChild(tip);
  footer.appendChild(GG.el('button',{class:'btn primary lg', disabled: miss.length>0,
    onClick: miss.length? null : occasionStage}, '选场合，开始搭配 →'));
}

/* 第二步：选场合 */
function occasionStage(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '今天去哪儿？'),
    GG.el('p', null, '同一个衣橱，换个场合，我会搭出不一样的整套。')
  ));
  const grid = GG.el('div',{class:'chips', style:{marginTop:'18px', justifyContent:'center'}});
  OCCASIONS.forEach(occ=>{
    grid.appendChild(GG.el('button',{class:'btn lg', style:{minWidth:'150px'},
      onClick:()=> showResult(occ, false)},
      occ.emoji+' '+occ.label));
  });
  main.appendChild(grid);
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn ghost', onClick:pickStage}, '← 改衣橱')
  ));
}

/* 第三步：thinking → 整套结果 */
async function showResult(occ, fromLink){
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  if(!fromLink){
    await GG.thinking(stage, [
      `锁定场合：${occ.label}…`,
      `翻你衣橱里的 ${picked.size} 件单品…`,
      '逐个部位算契合度…',
      '组出一整套…'
    ], 1500);
  }
  const {outfit, reasons} = buildOutfit(occ);
  GG.clear(stage);

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, `${occ.emoji} ${occ.label}　这套穿`)));

  // 整套展示：每个部位一行
  const list = GG.el('div',{class:'stack'});
  reasons.forEach(r=>{
    const it = r.item;
    list.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'14px', alignItems:'center'}},
      GG.el('div',{style:{fontSize:'34px', flex:'none', width:'46px', textAlign:'center'}}, it.emoji),
      GG.el('div',{style:{flex:'1', minWidth:'0'}},
        GG.el('div',{class:'row', style:{justifyContent:'space-between', gap:'8px', flexWrap:'wrap'}},
          GG.el('div',{class:'row', style:{gap:'8px'}},
            GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', fontWeight:'700', padding:'3px 10px', borderRadius:'999px', fontSize:'12px'}}, r.slot),
            GG.el('h3',{style:{fontSize:'18px'}}, it.label)),
          r.hits.length? GG.el('span',{class:'small muted'}, '契合：'+r.hits.slice(0,2).join('、')) : null
        )
      )
    ));
  });

  const rline = reasonLine(occ, reasons);
  const note = GG.el('div',{class:'card pad', style:{background:`linear-gradient(160deg,var(--accent-soft),#fff 60%)`}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '搭配理由'),
    GG.el('div',{style:{fontSize:'16px', fontWeight:'600'}}, rline)
  );

  GG.encodeState({p:[...picked], o:occ.key});

  const shareSpec = {
    slug:SLUG,
    title: occ.label+' 穿搭',
    subtitle:'从你的衣橱搭出',
    rows: reasons.map(r=>({label:r.slot, value:r.item.label})),
    tags: [occ.label],
    note: rline
  };

  stage.appendChild(note);
  stage.appendChild(GG.el('div',{style:{height:'14px'}}));
  stage.appendChild(list);
  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '截图分享这套穿搭 ↓'), shareSpec));

  // 换场合 → 立刻重算出不同整套（签名点）
  const others = GG.el('div',{class:'card pad', style:{marginTop:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '同一衣橱，换个场合试试'),
    GG.el('div',{class:'chips'},
      OCCASIONS.filter(o=> o.key!==occ.key).map(o=>
        GG.el('span',{class:'chip', onClick:()=> showResult(o, false)}, o.emoji+' '+o.label)))
  );
  stage.appendChild(others);

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'16px'}},
    GG.el('button',{class:'btn ghost', onClick:()=>{ location.hash=''; pickStage(); }}, '↻ 改衣橱重来')
  ));
}

start();
})();
