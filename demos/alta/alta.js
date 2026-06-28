/* alta — 把你「买过的衣服」变成会搭配的数字衣橱。
   ① 授权连接淘宝（演示：模拟订单）→ 自动导入你买过的服饰当衣橱；
   ② 上传一件你想穿的单品 → AI 以它为核心配整套；
   ③ 选场合 → AI 出整套 look + 缺的单品「直接给购买链接」（导购分佣闭环）。
   契合度 / 成套 / 缺口排序全本地确定性；连 key 再叠 AI 搭配与话术。 */
(function(){
const SLUG='alta';
const {WARDROBE, OCCASIONS} = window.ALTA;
const SLOTS = ['上装','下装','外套','鞋','配饰'];
const REQUIRED = ['上装','下装','鞋'];           // 必须凑齐；外套/配饰按场合可选
const BY_KEY = Object.fromEntries(WARDROBE.map(w=>[w.key, w]));
// 「连接淘宝」演示导入的一组「买过的服饰订单」（覆盖各部位、够搭多种场合）
const PURCHASES = ['tee_white','shirt_silk','knit','jeans','trousers','skirt_aline',
  'blazer','trench','loafers','sneakers','heels','tote','watch'];
let main;
let picked = new Set();   // 「你拥有的」单品 key（由淘宝导入填充）
let uploads = [];         // 你上传的「想搭的」单品（钉死所在部位）{key,label,slot,formality,styleTags,img,_upload}
let imported = false;     // 是否已连接淘宝导入
let pendingImg = null;    // 刚上传、待指定部位的照片 dataURL

/* ---------- 契合度引擎 ---------- */
// 单件对某场合的契合分（场合不同 → 同一件得分不同 → 不同场合选出不同件）
function fit(item, occ){
  const w = occ.want;
  let s = 0;
  const [lo,hi] = w.form;
  if(item.formality >= lo && item.formality <= hi) s += 5;
  else s += 5 - Math.min(5, (item.formality<lo ? lo-item.formality : item.formality-hi)*2.2);
  const hits = (item.styleTags||[]).filter(t=> w.styleTags.includes(t));
  s += hits.length * 2.4;
  const isSporty = (item.styleTags||[]).includes('运动');
  if(w.sporty){ if(isSporty) s += 4; else s -= 1.5; }
  else if(isSporty) s -= 2;
  return s;
}

// 从已拥有单品里，按场合给每个 slot 选最佳一件 → 整套
function buildOutfit(occ){
  const chosen = WARDROBE.filter(w=> picked.has(w.key));
  const outfit = {};
  const reasons = [];
  for(const slot of SLOTS){
    const pool = chosen.filter(w=> w.slot===slot);
    if(!pool.length) continue;
    const ranked = pool.map(w=>({w, s:fit(w, occ)})).sort((a,b)=> b.s - a.s);
    const best = ranked[0];
    if(slot==='外套'){
      const wantOuter = occ.want.needOuter || 0;
      if(wantOuter < 0.45 && best.s < 7) continue;
    }
    if(slot==='配饰' && best.s < 4) continue;
    outfit[slot] = best.w;
    reasons.push({slot, item:best.w, score:best.s, hits:best.w.styleTags.filter(t=> occ.want.styleTags.includes(t))});
  }
  return {outfit, reasons};
}

// 把「上传的想搭单品」钉进它的部位，覆盖该部位的自动挑选
function applyPins(outfit, reasons, occ){
  uploads.forEach(up=>{
    const i = reasons.findIndex(r=> r.slot===up.slot);
    const rec = {slot:up.slot, item:up, hits:[], pinned:true, why:'你上传的、最想穿的，这套就以它为核心'};
    if(i>=0) reasons[i] = rec; else reasons.push(rec);
    outfit[up.slot] = up;
  });
  reasons.sort((a,b)=> SLOTS.indexOf(a.slot)-SLOTS.indexOf(b.slot));
}

function haveItems(){ return WARDROBE.filter(w=> picked.has(w.key)).concat(uploads); }
function missingRequired(){
  const have = haveItems();
  return REQUIRED.filter(slot=> !have.some(w=> w.slot===slot));
}

// 一句话理由（引用场合 + 命中的风格）
function reasonLine(occ, reasons){
  const top = reasons.filter(r=>['上装','下装','鞋'].includes(r.slot) && !r.pinned).slice(0,3)
    .map(r=> r.item.label).join(' + ');
  const flavor = {
    work:'通勤要利落得体', date:'约会走优雅路线', interview:'面试求最正式稳妥',
    sport:'运动图轻便透气', weekend:'出游主打轻松好动', wedding:'婚礼宾客要精致不抢镜'
  }[occ.key] || (occ.label+'场合');
  return top ? `${flavor}，所以挑了 ${top}。` : `${flavor}，按你现有的单品配了这一套。`;
}

/* ---------- AI 通路（连了 key 让模型从你拥有的单品里搭整套并解释；没连退回本地契合度引擎） ---------- */
const ALTA_SYS = '你是私人穿搭师。用户给你 ta 衣橱里现有的单品（每行 key｜名称/部位/正式度1-5/风格标签）和今天的场合，请只用这些单品搭一整套：上装、下装、鞋必选；外套、配饰按场合需要可选。只输出严格 JSON：{"reason":"一句话整体搭配思路，要点明场合","items":[{"slot":"上装/下装/外套/鞋/配饰 之一","key":"必须是用户单品列表里的 key","why":"选它的理由,18字内"}],"tip":"一条额外造型小贴士"}。只能用用户提供的 key，每个部位最多一件，全部简体中文。';

async function getOutfit(occ, useAI){
  let outfit=null, reasons=null, rline='', tip='', ai=false;
  if(useAI){
    try{
      const chosen = WARDROBE.filter(w=> picked.has(w.key));
      const items = chosen.map(w=>`${w.key}｜${w.label}/${w.slot}/正式度${w.formality}/${w.styleTags.join('·')}`).join('\n');
      const pinNote = uploads.length ? `\n我特别想穿这几件（请围绕它们搭，这些部位别再给：${uploads.map(u=>u.slot).join('、')}）。` : '';
      const obj = await GG.llm.json(ALTA_SYS, `场合：${occ.label}（${occ.emoji}）。\n我衣橱里现有：\n${items}${pinNote}`, {max_tokens:800});
      const seenSlot = new Set(); const o = {}; const rs = [];
      (Array.isArray(obj.items)?obj.items:[]).forEach(it=>{
        const w = BY_KEY[it.key];
        if(!w || !picked.has(w.key) || seenSlot.has(w.slot)) return;
        seenSlot.add(w.slot); o[w.slot] = w;
        rs.push({slot:w.slot, item:w, hits:w.styleTags.filter(t=> occ.want.styleTags.includes(t)), why:String(it.why||'').trim()});
      });
      if(REQUIRED.every(s=> o[s] || uploads.some(u=>u.slot===s))){     // 必选部位齐（AI 或上传填上）才采用
        outfit=o; reasons=rs; rline=String(obj.reason||'').trim(); tip=String(obj.tip||'').trim(); ai=true;
      }
    }catch(e){ GG.toast(GG.llm.errMsg(e)); }
  }
  if(!outfit){ const r = buildOutfit(occ); outfit=r.outfit; reasons=r.reasons; ai=false; }
  applyPins(outfit, reasons, occ);
  if(!rline) rline = reasonLine(occ, reasons);
  if(uploads.length) rline = '以你上传的单品为核心，' + rline;
  return {outfit, reasons, rline, tip, _ai:ai};
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

/* ---------- ＋1：缺口雷达 → 带购买链接的推荐（导购分佣闭环） ----------
   数字衣橱（Whering / Cladwell）真正变现的是「补一件就成套」的导购。
   从你「没买过」的单品里，找补哪一件能让最多场合升级 → 直接给淘宝购买链接。 */
const SLOT_W = {'上装':1, '下装':1, '鞋':1, '外套':0.7, '配饰':0.45};

function outfitScore(keys, occ){
  let s = 0;
  for(const slot of SLOTS){
    const pool = WARDROBE.filter(w=> keys.has(w.key) && w.slot===slot);
    if(!pool.length) continue;
    const best = Math.max(...pool.map(w=> fit(w, occ)));
    if(slot==='外套'){
      const wantOuter = occ.want.needOuter || 0;
      if(wantOuter < 0.45 && best < 7) continue;
    }
    if(slot==='配饰' && best < 4) continue;
    s += best * (SLOT_W[slot] || 1);
  }
  return s;
}

function wardrobeGaps(curOcc){
  const owned = new Set(picked);
  const base = {};
  OCCASIONS.forEach(o=> base[o.key] = outfitScore(owned, o));
  return WARDROBE.filter(w=> !owned.has(w.key)).map(w=>{
    const withIt = new Set(owned); withIt.add(w.key);
    let total = 0; const ups = [];
    OCCASIONS.forEach(o=>{
      const d = outfitScore(withIt, o) - base[o.key];
      if(d > 0.4){
        const cur = !!(curOcc && o.key===curOcc.key);
        total += d * (cur ? 2.2 : 1);
        ups.push({occ:o, gain:d, cur});
      }
    });
    ups.sort((a,b)=> (b.cur-a.cur) || (b.gain-a.gain));
    return {w, total, ups};
  }).filter(x=> x.ups.length).sort((a,b)=> b.total - a.total);
}

// 淘宝搜同款链接（演示：通用关键词搜索，不含任何个人信息）
function taobaoLink(item){
  const kw = [item.label].concat((item.styleTags||[]).slice(0,1)).join(' ');
  return 'https://s.taobao.com/search?q=' + encodeURIComponent(kw);
}
function buyLink(item, cls){
  const a = GG.el('a',{class:cls||'btn', style:{textDecoration:'none', whiteSpace:'nowrap'}}, '🛒 去淘宝看同款 →');
  a.href = taobaoLink(item); a.target='_blank'; a.rel='noopener';
  return a;
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

// 带购买链接的推荐卡：主推荐（大买按钮）+ 升级场合 + 一键试搭 + 次选（小看同款）
function gapCard(occ){
  const gaps = wardrobeGaps(occ);
  const card = GG.el('div',{class:'card pad', style:{marginTop:'16px', borderTop:'3px solid var(--accent)'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '🛒 补这一件，升级更多场合 · AI 帮你挑 + 直达购买'));
  if(!gaps.length){
    card.appendChild(GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}},
      '你买过的这些衣服，已经能把各个场合都接住了 ✓ 暂时没有明显缺口。'));
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
  card.appendChild(GG.el('div',{class:'row', style:{gap:'10px', marginTop:'12px', flexWrap:'wrap'}},
    buyLink(top.w, 'btn primary'),
    GG.el('button',{class:'btn', onClick:()=>{ picked.add(top.w.key); GG.toast('已把「'+top.w.label+'」加入试搭'); showResult(occ, false); }},
      '＋ 先在这套里试搭')));
  if(gaps.length>1){
    const moreWrap = GG.el('div',{style:{marginTop:'14px'}},
      GG.el('div',{class:'small muted', style:{marginBottom:'6px'}}, '也可以补：'));
    gaps.slice(1,3).forEach(g=>{
      moreWrap.appendChild(GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center', gap:'8px', padding:'6px 0'}},
        GG.el('span',{style:{fontSize:'14px'}}, g.w.emoji+' '+g.w.label+'　',
          GG.el('span',{class:'small muted'}, '升级 '+g.ups.length+' 个场合')),
        buyLink(g.w, 'btn ghost')));
    });
    card.appendChild(moreWrap);
  }
  card.appendChild(GG.el('p',{class:'small muted', style:{margin:'12px 0 0', lineHeight:'1.55'}},
    '🔗 演示：链接跳转淘宝搜索同类商品；真实产品可接「带返佣的商品直链」，搭配即导购（CPS 分成）。'));
  if(GG.llm.connected()){
    gapPitch(top, occNames).then(p=>{ if(p) pitchEl.textContent = '✨ '+p; }).catch(()=>{});
  }
  return card;
}

/* ---------- 品牌欢迎门面（与 nl-home / insure-need 同一套 .gate 样式，颜色取本 demo 的 --accent） ---------- */
const GATE_CSS = `
.gate{ max-width:460px; margin:8px auto 0; border:1px solid var(--line); border-radius:20px; overflow:hidden; background:var(--surface); box-shadow:var(--sh-1); }
.gate-head{ padding:28px 24px 24px; text-align:center; color:#fff; background:linear-gradient(150deg, var(--accent), color-mix(in srgb, var(--accent) 60%, #0c2c40)); }
.gate-glyph{ font-size:44px; line-height:1; }
.gate-name{ font-size:22px; font-weight:800; margin-top:10px; letter-spacing:.5px; }
.gate-tag{ font-size:13.5px; opacity:.92; margin-top:6px; }
.gate-body{ padding:22px 22px 24px; }
.gate-hook{ font-size:18px; font-weight:800; color:var(--ink-1,#1d1d1f); text-align:center; line-height:1.5; }
.gate-sub{ font-size:13.5px; color:var(--ink-2); line-height:1.7; margin:10px 0 18px; text-align:center; }
.gate-cta{ display:block; width:100%; box-sizing:border-box; padding:14px; border:none; border-radius:14px; background:var(--accent); color:#fff; font-size:16px; font-weight:700; cursor:pointer; transition:.15s; }
.gate-cta:hover{ filter:brightness(1.05); transform:translateY(-1px); }
.gate-priv{ font-size:11.5px; color:var(--ink-soft,#8a8a93); text-align:center; margin-top:14px; line-height:1.55; }
.alta-src{ display:flex; gap:14px; align-items:flex-start; padding:16px; border:1px solid var(--line); border-radius:14px; background:var(--surface); }
.alta-src .ic{ font-size:30px; flex:none; width:40px; text-align:center; }
.alta-thumb{ width:46px; height:46px; border-radius:10px; overflow:hidden; flex:none; border:1px solid var(--line); }
.alta-thumb img{ width:100%; height:100%; object-fit:cover; display:block; }
`;
function injectGate(){ if(GG.$('#gate-style')) return; document.head.appendChild(GG.el('style',{id:'gate-style', html:GATE_CSS})); }
function welcome(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'gate'},
    GG.el('div',{class:'gate-head'},
      GG.el('div',{class:'gate-glyph'}, '👗'),
      GG.el('div',{class:'gate-name'}, '场合穿搭'),
      GG.el('div',{class:'gate-tag'}, '连淘宝 + 上传 · AI 配整套')),
    GG.el('div',{class:'gate-body'},
      GG.el('div',{class:'gate-hook'}, '把你买过的衣服，变成会搭配的衣橱。'),
      GG.el('p',{class:'gate-sub'}, '授权连接淘宝，自动把你买过的服饰导入成数字衣橱；再传一件最近想穿的，AI 以它为核心配整套，缺的单品直接给购买链接。'),
      GG.el('button',{class:'gate-cta', onClick:()=>{ GG.clear(main); sourceStage(); }}, '👗 开始搭配 →'),
      GG.el('div',{class:'gate-priv'}, '🔒 只读服饰订单、不读支付信息、不上传服务器 · 演示使用模拟订单数据')
    )
  ));
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  injectGate();
  const st = GG.decodeState();
  if(st && st.p && st.o){
    picked = new Set(st.p.filter(k=> BY_KEY[k]));
    imported = picked.size>0;
    const occ = OCCASIONS.find(o=> o.key===st.o);
    if(occ && picked.size){ showResult(occ, true); return; }
  }
  welcome();
}

/* 第一步：导入衣橱（连接淘宝 + 上传想搭的） */
function sourceStage(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '把你买过的衣服导进来'),
    GG.el('p', null, '连接淘宝，自动把你买过的服饰变成数字衣橱；再传一件最近想穿的，我以它为核心配整套。')
  ));

  // 待指定部位的上传照片
  if(pendingImg){
    const pick = GG.el('div',{class:'card pad', style:{marginTop:'16px', borderLeft:'3px solid var(--accent)'}},
      GG.el('div',{class:'row', style:{gap:'12px', alignItems:'center'}},
        GG.el('div',{class:'alta-thumb', style:{width:'56px', height:'56px'}}, GG.el('img',{src:pendingImg})),
        GG.el('div',{style:{flex:'1'}},
          GG.el('div',{style:{fontWeight:'700'}}, '这件穿在哪个部位？'),
          GG.el('div',{class:'small muted'}, '选好我就把它当成「最想穿的」，配整套时围着它搭。'))),
      GG.el('div',{class:'chips', style:{marginTop:'12px'}},
        SLOTS.map(slot=> GG.el('span',{class:'chip', onClick:()=>{
          uploads.push({key:'up_'+(uploads.length+1)+'_'+slot, label:'上传的'+slot, slot, formality:3, warmth:1, styleTags:[], img:pendingImg, _upload:true});
          pendingImg=null; GG.toast('已加入：你想搭的'+slot); sourceStage();
        }}, slot))),
      GG.el('div',{class:'center', style:{marginTop:'10px'}},
        GG.el('button',{class:'btn ghost', onClick:()=>{ pendingImg=null; sourceStage(); }}, '取消'))
    );
    main.appendChild(pick);
  }

  // 动作卡 A：连接淘宝
  const taoBody = imported
    ? GG.el('div',{style:{flex:'1'}},
        GG.el('div',{style:{fontWeight:'700'}}, '✓ 已连接淘宝，导入 '+[...picked].length+' 件服饰'),
        GG.el('div',{class:'small muted', style:{marginTop:'2px'}}, '下面是你的数字衣橱，可点 × 删掉不想要的。'),
        GG.el('button',{class:'btn ghost', style:{marginTop:'10px', padding:'4px 12px', fontSize:'13px'},
          onClick:()=>{ picked.clear(); imported=false; sourceStage(); }}, '重新导入'))
    : GG.el('div',{style:{flex:'1'}},
        GG.el('div',{style:{fontWeight:'700'}}, '连接淘宝，自动导入买过的衣服'),
        GG.el('div',{class:'small muted', style:{marginTop:'2px', lineHeight:'1.6'}},
          '🔒 只读服饰类订单、不读支付/地址信息、不上传服务器。'),
        GG.el('div',{class:'small', style:{margin:'2px 0 0', color:'var(--ink-soft,#8a8a93)'}}, '（演示：使用模拟订单数据）'),
        GG.el('button',{class:'btn primary', style:{marginTop:'12px'}, onClick:importTaobao}, '🛒 连接并导入 →'));
  main.appendChild(GG.el('div',{class:'alta-src', style:{marginTop:'18px'}},
    GG.el('div',{class:'ic'}, '🛒'), taoBody));

  // 动作卡 B：上传想搭的单品
  const fileIn = GG.el('input',{type:'file', style:{display:'none'}});
  fileIn.accept = 'image/*';
  fileIn.addEventListener('change', e=> onFile(e.target.files && e.target.files[0]));
  main.appendChild(GG.el('div',{class:'alta-src', style:{marginTop:'12px'}},
    GG.el('div',{class:'ic'}, '📷'),
    GG.el('div',{style:{flex:'1'}},
      GG.el('div',{style:{fontWeight:'700'}}, '上传一件你最想穿的'),
      GG.el('div',{class:'small muted', style:{marginTop:'2px', lineHeight:'1.6'}}, '有今天就想穿的单品？传张照片，我以它为核心把整套配好。'),
      GG.el('button',{class:'btn', style:{marginTop:'12px'}, onClick:()=> fileIn.click()}, '📷 选择照片上传'),
      fileIn)));

  // 已有单品展示
  const have = haveItems();
  if(have.length){
    const box = GG.el('div',{class:'card pad', style:{marginTop:'16px'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '你的数字衣橱（'+have.length+' 件）'));
    if(uploads.length){
      const upRow = GG.el('div',{class:'row', style:{gap:'10px', flexWrap:'wrap', marginBottom:'10px'}});
      uploads.forEach((u,idx)=>{
        upRow.appendChild(GG.el('div',{class:'row', style:{gap:'8px', alignItems:'center', padding:'6px 10px 6px 6px', border:'1px solid var(--accent)', borderRadius:'999px', background:'var(--accent-soft)'}},
          GG.el('div',{class:'alta-thumb', style:{width:'32px', height:'32px'}}, GG.el('img',{src:u.img})),
          GG.el('span',{class:'small', style:{fontWeight:'700', color:'var(--accent)'}}, '想搭 · '+u.slot),
          GG.el('span',{style:{cursor:'pointer', color:'var(--ink-3)', fontWeight:'700'}, onClick:()=>{ uploads.splice(idx,1); sourceStage(); }}, '×')));
      });
      box.appendChild(upRow);
    }
    const chips = GG.el('div',{class:'chips'});
    WARDROBE.filter(w=> picked.has(w.key)).forEach(w=>{
      chips.appendChild(GG.el('span',{class:'chip on', onClick:()=>{ picked.delete(w.key); sourceStage(); }},
        w.emoji+' '+w.label+'　×'));
    });
    if(picked.size) box.appendChild(chips);
    main.appendChild(box);
  }

  // 底部 CTA
  const miss = missingRequired();
  const footer = GG.el('div',{class:'center', style:{marginTop:'20px'}});
  const tip = GG.el('div',{class:'small muted center', style:{marginBottom:'10px'}},
    have.length ? (miss.length? '还差：'+miss.join(' / ')+'（搭整套至少要上装/下装/鞋，连一下淘宝就齐了）' : '衣橱齐了，去选场合 →')
                : '先连接淘宝导入，或上传一件想搭的');
  footer.appendChild(tip);
  footer.appendChild(GG.el('button',{class:'btn primary lg', disabled: miss.length>0,
    onClick: miss.length? null : occasionStage}, '选场合，开始搭配 →'));
  main.appendChild(footer);
}

// 连接淘宝（演示）：模拟授权 + 读取订单 → 导入
async function importTaobao(){
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  await GG.thinking(stage, [
    '正在向淘宝请求授权…（演示）',
    '读取你的服饰类订单…',
    '识别每件的部位与风格…',
    '整理进你的数字衣橱…'
  ], 1500);
  PURCHASES.forEach(k=> picked.add(k));
  imported = true;
  GG.toast('已从你的淘宝订单导入 '+PURCHASES.length+' 件服饰');
  sourceStage();
}

// 读取上传的照片 → 转 dataURL → 进入「指定部位」
function onFile(file){
  if(!file){ return; }
  if(!/^image\//.test(file.type)){ GG.toast('请选择一张图片'); return; }
  const reader = new FileReader();
  reader.onload = e=>{ pendingImg = e.target.result; sourceStage(); window.scrollTo(0,0); };
  reader.onerror = ()=> GG.toast('图片读取失败，换一张试试');
  reader.readAsDataURL(file);
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
    GG.el('button',{class:'btn ghost', onClick:sourceStage}, '← 改衣橱')
  ));
}

// 整套里一件的「图标格」：上传的显示照片缩略图，其余显示 emoji
function itemThumb(item){
  if(item.img) return GG.el('div',{class:'alta-thumb'}, GG.el('img',{src:item.img}));
  return GG.el('div',{style:{fontSize:'34px', flex:'none', width:'46px', textAlign:'center'}}, item.emoji);
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
      `翻你买过的 ${[...picked].length} 件单品${uploads.length?'、加上你想搭的':''}…`,
      useAI?'AI 逐件挑、组一整套…':'逐个部位算契合度…',
      '组出一整套、找还差哪件…'
    ], useAI?1900:1500);
    const [r] = await Promise.all([getOutfit(occ, useAI), think]); res = r;
  } else {
    res = await getOutfit(occ, useAI);
  }
  const {reasons, rline, tip} = res;
  GG.clear(stage);

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, `${occ.emoji} ${occ.label}　这套穿`)));
  stage.appendChild(GG.el('div',{class:'center', style:{margin:'0 0 12px'}}, GG.llm.badge(!!res._ai)));

  // 整套展示：每个部位一行
  const list = GG.el('div',{class:'stack'});
  reasons.forEach(r=>{
    const it = r.item;
    list.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'14px', alignItems:'center'}},
      itemThumb(it),
      GG.el('div',{style:{flex:'1', minWidth:'0'}},
        GG.el('div',{class:'row', style:{justifyContent:'space-between', gap:'8px', flexWrap:'wrap'}},
          GG.el('div',{class:'row', style:{gap:'8px'}},
            GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', fontWeight:'700', padding:'3px 10px', borderRadius:'999px', fontSize:'12px'}}, r.slot),
            GG.el('h3',{style:{fontSize:'18px'}}, it.label)),
          r.pinned ? GG.el('span',{class:'pill', style:{background:'var(--accent-soft)', color:'var(--accent)', fontWeight:'700', padding:'3px 10px', borderRadius:'999px', fontSize:'12px'}}, '📷 你想搭的')
                   : (r.hits && r.hits.length? GG.el('span',{class:'small muted'}, '契合：'+r.hits.slice(0,2).join('、')) : null)
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
    subtitle:'从你买过的衣服搭出',
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
  stage.appendChild(gapCard(occ));   // ＋1：缺的单品，AI 推荐 + 购买链接
  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '截图分享这套穿搭 ↓'), shareSpec));

  // 换场合 → 立刻重算出不同整套
  const others = GG.el('div',{class:'card pad', style:{marginTop:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '同一衣橱，换个场合试试'),
    GG.el('div',{class:'chips'},
      OCCASIONS.filter(o=> o.key!==occ.key).map(o=>
        GG.el('span',{class:'chip', onClick:()=> showResult(o, false)}, o.emoji+' '+o.label)))
  );
  stage.appendChild(others);

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'16px'}},
    GG.el('button',{class:'btn ghost', onClick:()=>{ location.hash=''; sourceStage(); }}, '↻ 改衣橱重来')
  ));
}

start();
})();
