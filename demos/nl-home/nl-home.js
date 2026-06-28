/* nl-home — 一句话找房，再 +1「🎯 心愿取舍雷达」。
   一句话描述想要的家 → 解析结构化约束（城市/卧室/预算/房龄/标签）→ 硬约束过滤 + 软标签排序 → 匹配房源 + 命中理由。
   +1：别家只给匹配或报「0 结果」；这里照实说你的心愿单内部在打架——
     对每条硬性要求（卧室/预算/房龄）做反事实模拟：松开它能多解锁几套；预算给「再加 X 万解锁 N 套」的最实在台阶；
     荐最划算的一条让步（一键松开重搜）；再点破「没有一套全中你的 N 个心愿，最多命中 M 个」。
   签名点：① 自然语言约束被真正解析并用于过滤，违背硬约束的房源绝不出现；② 取舍雷达全本地确定性即时算。 */
(function(){
const SLUG = 'nl-home';
const { LISTINGS, CITIES } = window.NLHOME;
let main;

const SAMPLES = [
  '我想在杭州找个两室一厅，预算300万以内，最好是次新房，离地铁近',
  '成都三室，总价不超过250万，要南北通透带精装的新房',
  '上海地铁口的两房，预算500万，有学区就更好',
  '北京三室，800万以内，房龄10年内，最好带阳台'
];

const CN_NUM = { 一:1, 二:2, 两:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9, 十:10 };
function cn2num(s){
  if(s==null) return null;
  if(/^\d+$/.test(s)) return parseInt(s,10);
  if(s.length===1 && CN_NUM[s]!=null) return CN_NUM[s];
  if(s.indexOf('十')>=0){
    const [a,b] = s.split('十');
    const tens = a==='' ? 1 : (CN_NUM[a]||parseInt(a,10)||0);
    const ones = b==='' ? 0 : (CN_NUM[b]||parseInt(b,10)||0);
    return tens*10 + ones;
  }
  return CN_NUM[s]!=null ? CN_NUM[s] : null;
}

/* ---------- 解析引擎：把一句话拆成结构化约束 ---------- */
function parseQuery(textRaw){
  const text = (textRaw||'').trim();
  const c = { city:null, beds:null, maxPrice:null, maxAge:null, tags:[], _ageNote:null };
  for(const city of CITIES){ if(text.indexOf(city)>=0){ c.city = city; break; } }
  const bedM = text.match(/([一二两三四五六七八九十\d]+)\s*(?:室|居|房)/);
  if(bedM){ const n = cn2num(bedM[1]); if(n) c.beds = n; }
  else if(/单间|一居室?|开间/.test(text)) c.beds = 1;

  const priceCtx = text.match(/(?:预算|总价|不超过|不高于)\s*([0-9]{2,5}|[一二两三四五六七八九十百千]+)\s*万?/);
  const priceCap = text.match(/([0-9]{2,5}|[一二两三四五六七八九十百千]+)\s*万?\s*(?:以内|以下|左右|封顶)/);
  const priceBare = text.match(/([0-9]{2,5})\s*万/);
  const parsePriceCN = s=>{
    if(/^\d+$/.test(s)) return parseInt(s,10);
    let total=0, cur=0;
    for(const ch of s){
      if(ch==='百'){ total += (cur||1)*100; cur=0; }
      else if(ch==='千'){ total += (cur||1)*1000; cur=0; }
      else if(CN_NUM[ch]!=null){ cur = CN_NUM[ch]; }
    }
    return total + cur;
  };
  const pm = priceCtx || priceCap || priceBare;
  if(pm){ const v = parsePriceCN(pm[1]); if(v>0) c.maxPrice = v; }

  const ageM = text.match(/(?:房龄)?\s*([一二两三四五六七八九十\d]+)\s*年\s*(?:内|以内)/);
  if(ageM){ const n = cn2num(ageM[1]); if(n){ c.maxAge = n; c._ageNote = '房龄≤'+n+'年'; } }
  else if(/次新/.test(text)){ c.maxAge = 5; c._ageNote = '次新（≤5年）'; }
  else if(/纯新|新房|新盘/.test(text)){ c.maxAge = 2; c._ageNote = '新房（≤2年）'; }

  const TAG_RULES = [
    ['地铁', /地铁|轨交|通勤/], ['学区', /学区|名校|学位/], ['南北通透', /南北通透|通透/],
    ['带阳台', /阳台/], ['精装', /精装|拎包|带装修/], ['小区新', /小区新|新小区|新社区/],
    ['高楼层', /高楼层|视野好/], ['低楼层', /低楼层|一楼|底层/]
  ];
  for(const [tag,re] of TAG_RULES){ if(re.test(text)) c.tags.push(tag); }
  return c;
}

/* ---------- 硬约束（city/beds/maxPrice/maxAge）逐项判定 ---------- */
const HARDKEYS = ['city','beds','maxPrice','maxAge'];
function passOne(h, c, key){
  if(key==='city')     return !c.city || h.city===c.city;
  if(key==='beds')     return c.beds==null || h.beds===c.beds;
  if(key==='maxPrice') return c.maxPrice==null || h.price<=c.maxPrice;
  if(key==='maxAge')   return c.maxAge==null || h.ageYears<=c.maxAge;
  return true;
}
function passHard(h, c){ return HARDKEYS.every(k=> passOne(h,c,k)); }
function passHardExcept(h, c, skip){ return HARDKEYS.filter(k=>k!==skip).every(k=> passOne(h,c,k)); }

/* ---------- 过滤 + 排序 ---------- */
function search(c){
  const survivors = LISTINGS.filter(h=> passHard(h,c));
  const scored = survivors.map(h=>{
    const hitTags = c.tags.filter(t=> h.tags.includes(t));
    return { h, hitTags, score: hitTags.length };
  }).sort((a,b)=> (b.score - a.score) || (a.h.price - b.h.price));
  let tightest = null;
  if(survivors.length===0){
    const counters = [];
    if(c.city)            counters.push(['城市='+c.city,        LISTINGS.filter(h=>h.city!==c.city).length]);
    if(c.beds)            counters.push([c.beds+'室',           LISTINGS.filter(h=>h.beds!==c.beds).length]);
    if(c.maxPrice!=null)  counters.push(['预算≤'+c.maxPrice+'万', LISTINGS.filter(h=>h.price>c.maxPrice).length]);
    if(c.maxAge!=null)    counters.push([(c._ageNote||('房龄≤'+c.maxAge+'年')), LISTINGS.filter(h=>h.ageYears>c.maxAge).length]);
    counters.sort((a,b)=> b[1]-a[1]);
    tightest = counters.length ? counters[0][0] : null;
  }
  return { scored, total: scored.length, tightest };
}

/* ---------- +1 取舍引擎：松开每条硬约束能多解锁几套 ---------- */
function relaxations(c){
  const baseN = LISTINGS.filter(h=> passHard(h,c)).length;
  const out = [];
  // 卧室：松成不限
  if(c.beds!=null){
    const n = LISTINGS.filter(h=> passHardExcept(h,c,'beds')).length;
    if(n>baseN) out.push({ key:'beds', kind:'drop', gain:n-baseN,
      label:'不限室数', from:c.beds+' 室',
      apply:cc=>{ cc.beds=null; cc._relax=(cc._relax||[]).concat('不限室数'); } });
  }
  // 房龄：松成不限
  if(c.maxAge!=null){
    const n = LISTINGS.filter(h=> passHardExcept(h,c,'maxAge')).length;
    if(n>baseN) out.push({ key:'maxAge', kind:'drop', gain:n-baseN,
      label:'放宽房龄', from:(c._ageNote||('≤'+c.maxAge+'年')),
      apply:cc=>{ cc.maxAge=null; cc._ageNote=null; cc._relax=(cc._relax||[]).concat('不限房龄'); } });
  }
  // 预算：找到刚好能解锁的下一档价格（最实在的加价台阶）
  if(c.maxPrice!=null){
    const over = LISTINGS.filter(h=> passHardExcept(h,c,'maxPrice') && h.price>c.maxPrice).sort((a,b)=>a.price-b.price);
    if(over.length){
      const next = over[0].price, bump = next - c.maxPrice;
      const unlocked = over.filter(h=> h.price<=next).length;
      out.push({ key:'maxPrice', kind:'price', gain:unlocked, priceTo:next, bump,
        label:'预算再加 '+bump+' 万', from:'≤'+c.maxPrice+'万→≤'+next+'万',
        apply:cc=>{ cc.maxPrice=next; cc._relax=(cc._relax||[]).concat('预算放宽到 '+next+'万'); } });
    }
  }
  out.sort((a,b)=> b.gain-a.gain);
  return { baseN, out };
}

/* ---------- 房源卡 ---------- */
function listingCard(item, c){
  const h = item.h;
  return GG.el('div',{class:'card pad', style:{display:'flex', flexDirection:'column', gap:'8px'}},
    GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'baseline', gap:'10px', flexWrap:'wrap'}},
      GG.el('h3',{style:{fontSize:'19px'}}, h.title),
      GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', fontWeight:'700', padding:'4px 11px', borderRadius:'999px', fontSize:'13px', whiteSpace:'nowrap'}}, h.price+' 万')
    ),
    GG.el('div',{class:'small muted'}, `${h.city} · ${h.beds}室 · ${h.area}㎡ · 房龄${h.ageYears}年`),
    GG.el('div',{class:'small', style:{color:'var(--accent)', fontWeight:'600'}}, '命中：'+reasonLine(h, c)),
    (c.tags && c.tags.length ? GG.el('div',{class:'row', style:{alignItems:'center', gap:'8px'}},
      GG.el('div',{style:{flex:'1', height:'8px', borderRadius:'5px', background:'var(--accent-soft)', overflow:'hidden'}},
        GG.el('i',{style:{display:'block', height:'100%', width:Math.round(item.hitTags.length/c.tags.length*100)+'%',
          background:'var(--accent)', borderRadius:'5px'}})),
      GG.el('span',{class:'small muted', style:{whiteSpace:'nowrap'}}, '偏好命中 '+item.hitTags.length+'/'+c.tags.length)
    ) : null),
    GG.el('p',{class:'small muted', style:{margin:'0'}}, h.blurb),
    GG.el('div',{class:'chips', style:{marginTop:'2px'}},
      h.tags.map(t=> GG.el('span',{class: item.hitTags.includes(t)?'chip on':'chip', style:{cursor:'default'}}, t)))
  );
}

function reasonLine(h, c){
  const parts = [];
  if(c.city)           parts.push(c.city+' ✓');
  if(c.beds)           parts.push(c.beds+'室 ✓');
  if(c.maxPrice!=null) parts.push('≤'+c.maxPrice+'万 ✓（本套 '+h.price+'万）');
  if(c.maxAge!=null)   parts.push((c._ageNote? c._ageNote.replace('（','').replace('）','') : ('房龄≤'+c.maxAge+'年'))+' ✓（'+h.ageYears+'年）');
  c.tags.forEach(t=>{ if(h.tags.includes(t)) parts.push(t+' ✓'); });
  return parts.length ? parts.join(' · ') : '符合你的描述';
}

function constraintChips(c){
  const chips = [];
  const add = (label)=> chips.push(GG.el('span',{class:'chip', style:{cursor:'default'}}, label));
  if(c.city)            add('📍 城市：'+c.city);
  if(c.beds)            add('🛏 '+c.beds+' 室');
  if(c.maxPrice!=null)  add('💰 预算 ≤ '+c.maxPrice+' 万');
  if(c.maxAge!=null)    add('🏗 '+(c._ageNote||('房龄 ≤ '+c.maxAge+' 年')));
  c.tags.forEach(t=> add('✨ '+t));
  if(!chips.length) add('（没读到明确约束，给你看全部房源）');
  return chips;
}

function needSentence(c){
  const seg = [];
  if(c.city) seg.push(c.city);
  if(c.maxPrice!=null) seg.push(c.maxPrice+'万以内');
  if(c.beds) seg.push(c.beds+'室');
  if(c.maxAge!=null) seg.push(c._ageNote||('房龄≤'+c.maxAge+'年'));
  if(c.tags.length) seg.push(c.tags.join('/'));
  return seg.length ? seg.join(' · ') : '没有明确约束';
}

/* ---------- AI 通路（连 key 用真实模型解析；过滤永远本地，硬约束绝不破） ---------- */
const NL_TAGS = ['地铁','学区','南北通透','带阳台','精装','小区新','高楼层','低楼层'];
const NL_SYS = [
  '你把用户找房的一句话解析成结构化约束。只输出严格 JSON（不要 markdown、不要前言）：',
  '{ "city":城市名或null, "beds":卧室数字或null, "maxPrice":预算上限(万,纯数字)或null, "maxAge":房龄上限(年,数字)或null, "tags":[软性偏好] }',
  'city 只能从这些里选最匹配的，没有就 null：'+CITIES.join('、')+'。',
  'tags 只能从这些里选(可多选，没有就 [])：'+NL_TAGS.join('、')+'。',
  'maxPrice 单位万(如 300 表示 300 万)；中文数字要转阿拉伯数字；次新房→maxAge≈5、新房→maxAge≈2。'
].join('\n');

async function getConstraints(query, useAI){
  if(useAI){
    try{
      const o = await GG.llm.json(NL_SYS, '这句话：'+query, {max_tokens:400});
      const c = {
        city: CITIES.includes(o.city) ? o.city : null,
        beds: parseInt(o.beds,10) || null,
        maxPrice: (o.maxPrice!=null && +o.maxPrice>0) ? Math.round(+o.maxPrice) : null,
        maxAge: (o.maxAge!=null && +o.maxAge>=0) ? Math.round(+o.maxAge) : null,
        tags: Array.isArray(o.tags) ? o.tags.filter(t=>NL_TAGS.includes(t)) : [],
        _ageNote: null, _ai: true
      };
      if(c.maxAge!=null) c._ageNote = '房龄≤'+c.maxAge+'年';
      return c;
    }catch(e){ GG.toast(GG.llm.errMsg(e)); }
  }
  return parseQuery(query);
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  injectStyles();
  const st = GG.decodeState();
  if(st && typeof st.q==='string' && st.q.trim()){ showResult(st.q, true); return; }
  intro();
}

/* 单屏品牌欢迎门面（消费向） */
function intro(){
  GG.clear(main);
  const ta = GG.el('textarea',{class:'field nh-ta',
    placeholder:'例如：我想在杭州找个两室一厅，预算300万以内，最好是次新房，离地铁近', rows:'3'});
  const go = ()=>{ const q = ta.value.trim();
    if(!q){ GG.toast('先用一句话描述你想要的家吧'); ta.focus(); return; }
    showResult(q, false); };

  main.appendChild(GG.el('div',{class:'nh-gate'},
    GG.el('div',{class:'nh-gate-head'},
      GG.el('div',{class:'nh-gate-glyph'}, '🏠'),
      GG.el('div',{class:'nh-gate-name'}, '一句话找房'),
      GG.el('div',{class:'nh-gate-tag'}, '想要的家，先说成一句话')),
    GG.el('div',{class:'nh-gate-body'},
      GG.el('div',{class:'nh-hook'}, '别勾几十个筛选框了——'),
      GG.el('p',{class:'nh-sub'}, '像跟中介聊天那样说：城市、几室、预算、房龄，还有那些「最好有」的小心愿。我读懂、从房源库里精挑，再帮你看清这份心愿单哪条最该松。'),
      ta,
      GG.el('div',{class:'small muted', style:{margin:'10px 0 6px'}}, '试试这些 ↓（点一下填入）'),
      GG.el('div',{class:'chips'},
        SAMPLES.map(s=> GG.el('span',{class:'chip', onClick:()=>{ ta.value = s; ta.focus(); }},
          s.length>20 ? s.slice(0,20)+'…' : s))),
      GG.el('button',{class:'nh-cta', onClick:go}, '🔍 帮我找房 →'),
      GG.el('div',{class:'nh-priv'}, '🔒 纯本地运行 · 你的找房描述只在这台浏览器解析，不上传服务器')
    )
  ));
}

async function showResult(query, fromLink){
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  const useAI = GG.llm.connected();
  let c;
  if(!fromLink){
    const think = GG.thinking(stage, [
      useAI ? 'AI 读你这句话…' : '读你这句话…',
      '抽取城市 / 卧室 / 预算 / 房龄约束…',
      '按硬约束过滤房源…',
      '算「松哪条解锁更多」…'
    ], useAI?1800:1600);
    const [cc] = await Promise.all([getConstraints(query, useAI), think]); c = cc;
  } else { c = await getConstraints(query, useAI); }
  GG.encodeState({ q: query });
  GG.clear(stage);
  renderWith(c, query, stage);
}

/* 用给定约束渲染结果（取舍雷达里的「松开重搜」直接调它，不再 thinking） */
function renderWith(c, query, stage){
  GG.clear(stage);
  const { scored, total, tightest } = search(c);
  const top = scored.slice(0, 4);

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'6px', paddingBottom:'4px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, '🏠 为你找到的房')));
  stage.appendChild(GG.el('div',{style:{margin:'0 0 6px'}}, GG.llm.badge(!!c._ai)));
  stage.appendChild(GG.llm.bar());

  // 原话 + 解析
  const said = GG.el('div',{class:'card pad', style:{margin:'14px 0 16px', background:'linear-gradient(160deg,var(--accent-soft),#fff 60%)'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '你说'),
    GG.el('p',{style:{margin:'0', fontSize:'17px', lineHeight:'1.6'}}, '“'+query+'”'),
    GG.el('div',{class:'section-t', style:{marginTop:'16px'}}, '我读到的需求'),
    GG.el('div',{class:'chips', style:{marginTop:'4px'}}, constraintChips(c)));
  if(c._relax && c._relax.length){
    said.appendChild(GG.el('div',{class:'nh-relaxnote'}, '已松开：'+c._relax.join('、')));
  }
  stage.appendChild(said);

  // 结果 / 空态
  if(total === 0){
    stage.appendChild(GG.el('div',{class:'card pad', style:{textAlign:'center'}},
      GG.el('div',{style:{fontSize:'40px'}}, '🔎'),
      GG.el('h3',{style:{fontSize:'19px', marginTop:'6px'}}, '没有完全符合的房源'),
      GG.el('p',{class:'muted', style:{margin:'8px 0 0'}},
        tightest ? `卡得最死的是「${tightest}」。下面的取舍雷达告诉你松哪条最划算 ↓` : '试着把约束说宽松些。下面看怎么松 ↓')
    ));
  } else {
    stage.appendChild(GG.el('div',{class:'small muted', style:{margin:'2px 0 12px'}},
      `按硬约束过滤后命中 ${total} 套，已排好序（违背城市/卧室/预算/房龄的已自动排除）。`));
    const list = GG.el('div',{class:'stack'});
    top.forEach(item=> list.appendChild(listingCard(item, c)));
    stage.appendChild(list);
  }

  // +1：心愿取舍雷达
  stage.appendChild(tradeoffCard(c, query, stage, scored, total));

  // 分享卡
  const bestHit = scored.length ? Math.max(...scored.map(s=>s.hitTags.length)) : 0;
  const shareSpec = {
    slug: SLUG, title: '为你找到的房', subtitle: '需求：'+needSentence(c),
    tags: constraintTagsForShare(c),
    rows: top.map((item,i)=>({ label:'匹配 '+(i+1), value:`${item.h.title} · ${item.h.city}/${item.h.beds}室/${item.h.price}万` })),
    note: total>0
      ? `共匹配 ${total} 套，已排除所有违背硬约束的房源；首选「${top[0].h.title}」。`
      : (tightest ? `0 套匹配，最卡的约束：${tightest}。` : '0 套匹配，建议放宽约束。')
  };
  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, total>0 ? '截图分享你的找房结果 ↓' : '换句话再试一次 ↓'),
    shareSpec));

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '↻ 换一句话再找')));
}

/* 取舍雷达卡：松哪条解锁更多 + 最划算让步 + 一键松开重搜 + 软心愿满足度 */
function tradeoffCard(c, query, stage, scored, total){
  const { out } = relaxations(c);
  const card = GG.el('div',{class:'card pad nh-trade', style:{marginTop:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '🎯 心愿取舍 · 哪条最该松'));

  // 没有任何硬约束可松（要么没硬约束，要么松了也不增）
  if(!out.length){
    card.appendChild(GG.el('p',{class:'small muted', style:{margin:'4px 0 0'}}, total>0
      ? '你这份心愿单挺现实——把硬性条件松开也不会多出别的房源，现有这些就是最合适的了 👏'
      : '把约束放宽也没有更多房源（可能是城市本身房源有限）。换个城市或换句描述试试。'));
  } else {
    const best = out[0];
    card.appendChild(GG.el('p',{class:'small', style:{margin:'4px 0 12px', color:'var(--ink-2)', lineHeight:'1.6'}},
      total>0 ? `同时满足你全部硬性要求的有 ${total} 套。想要更多选择，下面这些是性价比最高的让步：`
              : `一条都满足不了的硬性组合，最划算的松法是这几条（按能多解锁的套数排）：`));

    out.forEach((r,i)=>{
      const isBest = i===0;
      const gainTxt = r.kind==='price' ? `多 ${r.gain} 套（${r.from}）` : `多 ${r.gain} 套（原「${r.from}」）`;
      const row = GG.el('div',{class:'nh-relax'+(isBest?' best':'')},
        GG.el('div',{class:'nh-relax-l'},
          GG.el('div',{class:'nh-relax-t'},
            (isBest?'💡 最划算：':'')+r.label,
            isBest? GG.el('span',{class:'nh-relax-badge'}, '推荐') : null),
          GG.el('div',{class:'nh-relax-g'}, gainTxt)),
        GG.el('button',{class:'btn'+(isBest?' primary':''), style:{padding:'6px 12px', fontSize:'13px', whiteSpace:'nowrap'},
          onClick:()=>{ const c2 = relaxClone(c); r.apply(c2); renderWith(c2, query, stage);
            try{ stage.scrollIntoView({behavior:'smooth', block:'start'}); }catch(e){} }},
          '松开重搜 →'));
      card.appendChild(row);
    });
  }

  // 软心愿满足度：没有一套全中你的 N 个「最好有」
  if(c.tags && c.tags.length && scored.length){
    const bestHit = Math.max(...scored.map(s=>s.hitTags.length));
    if(bestHit < c.tags.length){
      const fullHit = scored.filter(s=>s.hitTags.length===bestHit);
      card.appendChild(GG.el('p',{class:'small muted', style:{margin:'12px 0 0', paddingTop:'10px', borderTop:'1px solid var(--line)'}},
        `提醒：你列了 ${c.tags.length} 个「最好有」（${c.tags.join('、')}），但没有一套全中——最多的也只命中 ${bestHit} 个（${fullHit.length} 套）。这些是「加分项」，不影响硬性筛选。`));
    }
  }
  return card;
}
function relaxClone(c){
  return { city:c.city, beds:c.beds, maxPrice:c.maxPrice, maxAge:c.maxAge,
           tags:(c.tags||[]).slice(), _ageNote:c._ageNote, _ai:c._ai, _relax:(c._relax||[]).slice() };
}

function constraintTagsForShare(c){
  const t = [];
  if(c.city) t.push(c.city);
  if(c.beds) t.push(c.beds+'室');
  if(c.maxPrice!=null) t.push('≤'+c.maxPrice+'万');
  if(c.maxAge!=null) t.push(c._ageNote||('房龄≤'+c.maxAge+'年'));
  c.tags.forEach(x=> t.push(x));
  return t;
}

/* ---------- 样式（JS 注入，不动 index.html） ---------- */
function injectStyles(){
  if(GG.$('#nh-style')) return;
  const css = `
  .nh-gate{ max-width:460px; margin:8px auto 0; border:1px solid var(--line); border-radius:20px;
    overflow:hidden; background:var(--surface); box-shadow:var(--sh-1); }
  .nh-gate-head{ padding:28px 24px 24px; text-align:center; color:#fff;
    background:linear-gradient(150deg, var(--accent), color-mix(in srgb, var(--accent) 60%, #10325a)); }
  .nh-gate-glyph{ font-size:44px; line-height:1; }
  .nh-gate-name{ font-size:22px; font-weight:800; margin-top:10px; letter-spacing:.5px; }
  .nh-gate-tag{ font-size:13.5px; opacity:.92; margin-top:6px; }
  .nh-gate-body{ padding:22px 22px 24px; }
  .nh-hook{ font-size:18px; font-weight:800; color:var(--ink-1,#1d1d1f); text-align:center; }
  .nh-sub{ font-size:13.5px; color:var(--ink-2); line-height:1.7; margin:10px 0 16px; text-align:center; }
  .nh-ta{ width:100%; box-sizing:border-box; }
  .nh-cta{ display:block; width:100%; box-sizing:border-box; margin-top:14px; padding:14px; border:none;
    border-radius:14px; background:var(--accent); color:#fff; font-size:16px; font-weight:700; cursor:pointer; transition:.15s; }
  .nh-cta:hover{ filter:brightness(1.05); transform:translateY(-1px); }
  .nh-priv{ font-size:11.5px; color:var(--ink-soft,#8a8a93); text-align:center; margin-top:14px; line-height:1.5; }
  .nh-relaxnote{ margin-top:12px; font-size:12.5px; font-weight:700; color:var(--accent);
    background:var(--accent-soft); border-radius:8px; padding:6px 10px; display:inline-block; }
  .nh-relax{ display:flex; align-items:center; gap:10px; padding:11px 0; border-top:1px solid var(--line); }
  .nh-relax:first-of-type{ border-top:none; }
  .nh-relax.best .nh-relax-t{ color:var(--accent); }
  .nh-relax-l{ flex:1; min-width:0; }
  .nh-relax-t{ font-weight:700; font-size:14.5px; color:var(--ink-1,#1d1d1f); display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .nh-relax-badge{ font-size:11px; font-weight:700; color:#fff; background:var(--accent); padding:1px 8px; border-radius:999px; }
  .nh-relax-g{ font-size:12.5px; color:var(--ink-2); margin-top:3px; }
  `;
  document.head.appendChild(GG.el('style',{id:'nh-style', html:css}));
}

start();
})();
