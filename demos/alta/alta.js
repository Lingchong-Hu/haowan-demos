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

/* ---------- AI 通路（连了 key 让模型从你勾选的单品里搭整套并解释；没连退回本地契合度引擎） ----------
   只能用用户真实勾选的单品 key；必选部位（上装/下装/鞋）缺一就退回本地，绝不漏搭。 */
const ALTA_SYS = '你是私人穿搭师。用户给你 ta 衣橱里现有的单品（每行 key｜名称/部位/正式度1-5/风格标签）和今天的场合，请只用这些单品搭一整套：上装、下装、鞋必选；外套、配饰按场合需要可选。只输出严格 JSON：{"reason":"一句话整体搭配思路，要点明场合","items":[{"slot":"上装/下装/外套/鞋/配饰 之一","key":"必须是用户单品列表里的 key","why":"选它的理由,18字内"}],"tip":"一条额外造型小贴士"}。只能用用户提供的 key，每个部位最多一件，全部简体中文。';

async function getOutfit(occ, useAI){
  if(useAI){
    try{
      const chosen = WARDROBE.filter(w=> picked.has(w.key));
      const items = chosen.map(w=>`${w.key}｜${w.label}/${w.slot}/正式度${w.formality}/${w.styleTags.join('·')}`).join('\n');
      const obj = await GG.llm.json(ALTA_SYS, `场合：${occ.label}（${occ.emoji}）。\n我衣橱里现有：\n${items}`, {max_tokens:800});
      const seenSlot = new Set(); const outfit = {}; const reasons = [];
      (Array.isArray(obj.items)?obj.items:[]).forEach(it=>{
        const w = BY_KEY[it.key];
        if(!w || !picked.has(w.key) || seenSlot.has(w.slot)) return;   // key 必须真实勾选 + 每部位最多一件
        seenSlot.add(w.slot); outfit[w.slot] = w;
        reasons.push({slot:w.slot, item:w, hits:w.styleTags.filter(t=> occ.want.styleTags.includes(t)), why:String(it.why||'').trim()});
      });
      if(REQUIRED.every(s=> outfit[s])){                                // 必选部位齐才采用
        reasons.sort((a,b)=> SLOTS.indexOf(a.slot)-SLOTS.indexOf(b.slot));
        return {outfit, reasons, rline:String(obj.reason||'').trim()||reasonLine(occ,reasons),
                tip:String(obj.tip||'').trim(), _ai:true};
      }
    }catch(e){ GG.toast(GG.llm.errMsg(e)); }
  }
  const r = buildOutfit(occ);
  return {outfit:r.outfit, reasons:r.reasons, rline:reasonLine(occ, r.reasons), tip:'', _ai:false};
}

/* 正式度匹配刻度（纯本地）：这套平均正式度 marker vs 场合理想区间 band */
function formalityScale(reasons, occ){
  const items = reasons.map(r=>r.item).filter(Boolean);
  if(!items.length) return null;
  const avg = items.reduce((a,it)=>a+(it.formality||3),0)/items.length;
  const [lo,hi] = occ.want.form;
  const pct = v => ((GG.clamp(v,1,5)-1)/4)*100;
  const labels = ['极休闲','休闲','适中','正式','极正式'];
  const inBand = avg>=lo && avg<=hi;
  return GG.el('div',{class:'card pad', style:{marginTop:'12px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '正式度匹配'),
    GG.el('div',{style:{position:'relative', height:'30px', margin:'14px 0 6px'}},
      GG.el('div',{style:{position:'absolute', top:'13px', left:'0', right:'0', height:'4px', borderRadius:'2px', background:'var(--line)'}}),
      GG.el('div',{style:{position:'absolute', top:'10px', left:pct(lo)+'%', width:(pct(hi)-pct(lo))+'%', height:'10px', borderRadius:'5px', background:'var(--accent-soft)', border:'1px solid var(--accent)'}}),
      GG.el('div',{style:{position:'absolute', top:'2px', left:'calc('+pct(avg)+'% - 9px)', width:'18px', height:'18px', borderRadius:'50%', background:'var(--accent)', border:'2px solid #fff', boxShadow:'var(--sh-1)'}})
    ),
    GG.el('div',{class:'row', style:{justifyContent:'space-between'}},
      labels.map(l=>GG.el('span',{class:'small muted', style:{fontSize:'11px'}}, l))),
    GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}},
      `这套平均正式度 ${avg.toFixed(1)}/5，${occ.label}的理想区间是 ${lo}–${hi}。`+
      (inBand?'正好落在区间内 ✓' : (avg<lo?'比场合偏休闲了一点。':'比场合偏正式了一点。')))
  );
}

/* ---------- ＋1：衣橱缺口雷达（补一件，升级更多场合） ----------
   数字衣橱 App（Whering / Cladwell）真正变现的是「补一件就成套」的导购。
   原 demo 只用你「有的」搭完就停；这里再走一步：从你「没勾」的单品里，
   找出补哪一件能让最多场合的整套升级。纯本地确定性，连 key 再叠一句造型话术。*/

// 各部位在「缺口价值」里的权重：核心骨架(上装/下装/鞋)最重，外套次之，配饰最轻
// → 优先补「让这身去对场合」的核心单品，而不是一件能给多场合从 0 加分的百搭配饰
const SLOT_W = {'上装':1, '下装':1, '鞋':1, '外套':0.7, '配饰':0.45};

// 给定单品 key 集合 + 场合，按与 buildOutfit 相同的纳入规则，算这套的加权契合总分
function outfitScore(keys, occ){
  let s = 0;
  for(const slot of SLOTS){
    const pool = WARDROBE.filter(w=> keys.has(w.key) && w.slot===slot);
    if(!pool.length) continue;
    const best = Math.max(...pool.map(w=> fit(w, occ)));
    if(slot==='外套'){
      const wantOuter = occ.want.needOuter || 0;
      if(wantOuter < 0.45 && best < 7) continue;   // 不太需要外套且这件也不亮眼 → 不计入
    }
    if(slot==='配饰' && best < 4) continue;
    s += best * (SLOT_W[slot] || 1);
  }
  return s;
}

// 扫描所有「没勾」的单品，返回按总提升排序的缺口候选 [{w, total, ups:[{occ,gain,cur}]}]
// curOcc = 用户当前正在看的场合，加权，让推荐既切合眼前这套、又兼顾跨场合通用性
function wardrobeGaps(curOcc){
  const owned = new Set(picked);
  const base = {};
  OCCASIONS.forEach(o=> base[o.key] = outfitScore(owned, o));
  return WARDROBE.filter(w=> !owned.has(w.key)).map(w=>{
    const withIt = new Set(owned); withIt.add(w.key);
    let total = 0; const ups = [];
    OCCASIONS.forEach(o=>{
      const d = outfitScore(withIt, o) - base[o.key];
      if(d > 0.4){                                  // 真能让这个场合更到位才算
        const cur = !!(curOcc && o.key===curOcc.key);
        total += d * (cur ? 2.2 : 1);               // 当前场合权重更高
        ups.push({occ:o, gain:d, cur});
      }
    });
    ups.sort((a,b)=> (b.cur-a.cur) || (b.gain-a.gain));   // 当前场合排最前
    return {w, total, ups};
  }).filter(x=> x.ups.length).sort((a,b)=> b.total - a.total);
}

const GAP_SYS = '你是私人衣橱顾问。用户给你 ta 最该补的一件单品和补上后能升级的场合，请用一句话(26字内)说明为什么值得补、怎么搭，要点到场合；务实不浮夸，别劝人买大牌。只输出严格 JSON：{"pitch":"一句话"}。简体中文。';
async function gapPitch(top, occNames){
  try{
    const w = top.w;
    const obj = await GG.llm.json(GAP_SYS,
      `最该补：${w.label}（${w.slot}，正式度${w.formality}/5，风格${w.styleTags.join('·')}）。补上后升级场合：${occNames.join('、')}。`,
      {max_tokens:160});
    return String(obj.pitch||'').trim();
  }catch(e){ return ''; }
}

// 缺口卡片：主推荐 + 升级场合标签 + 一键试搭 + 次选
function gapCard(occ){
  const gaps = wardrobeGaps(occ);
  const card = GG.el('div',{class:'card pad', style:{marginTop:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '🛒 衣橱缺口 · 补一件，升级更多场合'));
  if(!gaps.length){
    card.appendChild(GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}},
      '你勾的这套衣橱，已经能把这些场合都接住了 ✓ 暂时没有明显缺口。'));
    return card;
  }
  const top = gaps[0];
  const occNames = top.ups.map(u=> u.occ.label);
  const pitchEl = GG.el('p',{style:{margin:'4px 0 0', color:'var(--ink-2)', lineHeight:'1.6'}},
    `补上${top.w.label}，${occNames.join('、')}都能更到位。`);
  card.appendChild(GG.el('div',{style:{display:'flex', gap:'14px', alignItems:'center', marginTop:'10px'}},
    GG.el('div',{style:{fontSize:'34px', flex:'none', width:'46px', textAlign:'center'}}, top.w.emoji),
    GG.el('div',{style:{flex:'1', minWidth:'0'}},
      GG.el('div',{class:'row', style:{gap:'8px', flexWrap:'wrap', alignItems:'center'}},
        GG.el('h3',{style:{fontSize:'17px'}}, '最该补：'+top.w.label),
        GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', padding:'2px 9px', borderRadius:'999px', fontSize:'12px', fontWeight:'700'}}, '升级 '+top.ups.length+' 个场合')),
      pitchEl)
  ));
  card.appendChild(GG.el('div',{class:'chips', style:{marginTop:'10px'}},
    top.ups.map(u=> GG.el('span',{class:'pill', style:{background:u.cur?'var(--accent)':'var(--accent-soft)', color:u.cur?'#fff':'var(--accent)', padding:'3px 10px', borderRadius:'999px', fontSize:'12px', fontWeight:u.cur?'700':'600'}},
      (u.cur?'▸ ':'')+u.occ.emoji+' '+u.occ.label))));
  card.appendChild(GG.el('div',{style:{marginTop:'12px'}},
    GG.el('button',{class:'btn', onClick:()=>{ picked.add(top.w.key); GG.toast('已把「'+top.w.label+'」加入试搭'); showResult(occ, false); }},
      '＋ 试搭这套（加上'+top.w.label+'）')));
  if(gaps.length>1){
    card.appendChild(GG.el('p',{class:'small muted', style:{margin:'12px 0 0'}},
      '其次可考虑：'+gaps.slice(1,3).map(g=> g.w.emoji+g.w.label).join('、')));
  }
  if(GG.llm.connected()){
    gapPitch(top, occNames).then(p=>{ if(p) pitchEl.textContent = '✨ '+p; }).catch(()=>{});
  }
  return card;
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
  main.appendChild(GG.llm.bar());
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
  const useAI = GG.llm.connected();
  let res;
  if(!fromLink){
    const think = GG.thinking(stage, [
      `锁定场合：${occ.label}…`,
      `翻你衣橱里的 ${picked.size} 件单品…`,
      useAI?'AI 逐件挑、组一整套…':'逐个部位算契合度…',
      '组出一整套…'
    ], useAI?1900:1500);
    const [r] = await Promise.all([getOutfit(occ, useAI), think]); res = r;
  } else {
    res = await getOutfit(occ, useAI);
  }
  const {outfit, reasons, rline, tip} = res;
  GG.clear(stage);

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, `${occ.emoji} ${occ.label}　这套穿`)));
  stage.appendChild(GG.el('div',{class:'center', style:{margin:'0 0 12px'}}, GG.llm.badge(!!res._ai)));

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
        ),
        r.why ? GG.el('p',{class:'small muted', style:{margin:'4px 0 0'}}, r.why) : null
      )
    ));
  });

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
  if(tip){
    stage.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'12px', borderLeft:'3px solid var(--accent)'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '✨ 造型师小贴士'),
      GG.el('p',{style:{margin:'0', color:'var(--ink-2)', lineHeight:'1.7'}}, tip)));
  }
  const fscale = formalityScale(reasons, occ);
  if(fscale) stage.appendChild(fscale);
  stage.appendChild(GG.el('div',{style:{height:'14px'}}));
  stage.appendChild(list);
  stage.appendChild(gapCard(occ));   // ＋1：补一件，升级更多场合
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
