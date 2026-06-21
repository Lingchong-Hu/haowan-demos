/* nl-home — 一句话找房。
   用户用一句话描述想要的家 → 解析出结构化约束（城市/卧室/预算/房龄/标签）
   → 硬约束过滤（城市·卧室·预算上限·房龄上限，违背直接排除）
   → 软约束(标签)命中数排序 → 给出匹配房源 + 命中理由。
   签名点：自然语言里的约束被真正解析并用于过滤，违背硬约束的房源绝不出现。 */
(function(){
const SLUG = 'nl-home';
const { LISTINGS, CITIES } = window.NLHOME;
let main;

/* 一键填充示例（每条覆盖不同约束组合，换一句话 → 不同解析 → 不同结果） */
const SAMPLES = [
  '我想在杭州找个两室一厅，预算300万以内，最好是次新房，离地铁近',
  '成都三室，总价不超过250万，要南北通透带精装的新房',
  '上海地铁口的两房，预算500万，有学区就更好',
  '北京三室，800万以内，房龄10年内，最好带阳台'
];

/* 中文数字 → 阿拉伯 */
const CN_NUM = { 一:1, 二:2, 两:2, 三:3, 四:4, 五:5, 六:6, 七:7, 八:8, 九:9, 十:10 };
function cn2num(s){
  if(s==null) return null;
  if(/^\d+$/.test(s)) return parseInt(s,10);
  if(s.length===1 && CN_NUM[s]!=null) return CN_NUM[s];
  // 处理「十/十X/X十/X十X」
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

  // 城市：匹配 data 里出现过的城市名
  for(const city of CITIES){ if(text.indexOf(city)>=0){ c.city = city; break; } }

  // 卧室数：「X室 / X居 / X房 / X室一厅 / 单间」
  const bedM = text.match(/([一二两三四五六七八九十\d]+)\s*(?:室|居|房)/);
  if(bedM){ const n = cn2num(bedM[1]); if(n) c.beds = n; }
  else if(/单间|一居室?|开间/.test(text)) c.beds = 1;

  // 预算上限：「预算X万 / X万以内 / 不超过X万 / 总价X万 / X万以下」
  // 支持「300」「三百」等；优先带“以内/不超过/以下/预算”的语境
  const priceCtx = text.match(/(?:预算|总价|不超过|不高于)\s*([0-9]{2,5}|[一二两三四五六七八九十百千]+)\s*万?/);
  const priceCap = text.match(/([0-9]{2,5}|[一二两三四五六七八九十百千]+)\s*万?\s*(?:以内|以下|左右|封顶)/);
  const priceBare = text.match(/([0-9]{2,5})\s*万/); // 兜底：句中出现「X万」
  const parsePriceCN = s=>{
    if(/^\d+$/.test(s)) return parseInt(s,10);
    // 简单中文：百/千 组合（找房价多为「三百/三百五十」）
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

  // 房龄上限：次新(≤5)、新房/纯新(≤2)、房龄X年内/X年以内
  const ageM = text.match(/(?:房龄)?\s*([一二两三四五六七八九十\d]+)\s*年\s*(?:内|以内)/);
  if(ageM){ const n = cn2num(ageM[1]); if(n){ c.maxAge = n; c._ageNote = '房龄≤'+n+'年'; } }
  else if(/次新/.test(text)){ c.maxAge = 5; c._ageNote = '次新（≤5年）'; }  // 必须在「新房」前判断：「次新房」含「新房」
  else if(/纯新|新房|新盘/.test(text)){ c.maxAge = 2; c._ageNote = '新房（≤2年）'; }
  // 「老破小/老房」表示可接受旧房：不设房龄上限（视为不限）

  // 软约束标签
  const TAG_RULES = [
    ['地铁', /地铁|轨交|通勤/],
    ['学区', /学区|名校|学位/],
    ['南北通透', /南北通透|通透/],
    ['带阳台', /阳台/],
    ['精装', /精装|拎包|带装修/],
    ['小区新', /小区新|新小区|新社区/],
    ['高楼层', /高楼层|视野好/],
    ['低楼层', /低楼层|一楼|底层/]
  ];
  for(const [tag,re] of TAG_RULES){ if(re.test(text)) c.tags.push(tag); }

  return c;
}

/* ---------- 过滤 + 排序 ---------- */
function search(c){
  // 硬约束：城市 / 卧室 / 预算上限 / 房龄上限。任一违背 → 排除（记录原因便于解释）
  const passHard = h=>{
    if(c.city   && h.city !== c.city) return false;
    if(c.beds   && h.beds !== c.beds) return false;
    if(c.maxPrice!=null && h.price > c.maxPrice) return false;
    if(c.maxAge !=null && h.ageYears > c.maxAge) return false;
    return true;
  };
  const survivors = LISTINGS.filter(passHard);

  // 软约束(标签)命中数排序；同分按总价升序（更便宜更靠前）
  const scored = survivors.map(h=>{
    const hitTags = c.tags.filter(t=> h.tags.includes(t));
    return { h, hitTags, score: hitTags.length };
  }).sort((a,b)=> (b.score - a.score) || (a.h.price - b.h.price));

  // 找出最苛刻的硬约束（0 结果时给提示用）：哪条单独就排除得最多
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

/* 把解析出的约束渲染成 chip（显式展示「我读到的需求」，证明真的解析了） */
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

/* 命中理由：把每条硬约束逐项打勾 + 命中的软标签 */
function reasonLine(h, c){
  const parts = [];
  if(c.city)           parts.push(c.city+' ✓');
  if(c.beds)           parts.push(c.beds+'室 ✓');
  if(c.maxPrice!=null) parts.push('≤'+c.maxPrice+'万 ✓（本套 '+h.price+'万）');
  if(c.maxAge!=null)   parts.push((c._ageNote? c._ageNote.replace('（','').replace('）','') : ('房龄≤'+c.maxAge+'年'))+' ✓（'+h.ageYears+'年）');
  c.tags.forEach(t=>{ if(h.tags.includes(t)) parts.push(t+' ✓'); });
  return parts.length ? parts.join(' · ') : '符合你的描述';
}

/* 把约束串成一句人话（用于 subtitle / 没读到时友好提示） */
function needSentence(c){
  const seg = [];
  if(c.city) seg.push(c.city);
  if(c.maxPrice!=null) seg.push(c.maxPrice+'万以内');
  if(c.beds) seg.push(c.beds+'室');
  if(c.maxAge!=null) seg.push(c._ageNote||('房龄≤'+c.maxAge+'年'));
  if(c.tags.length) seg.push(c.tags.join('/'));
  return seg.length ? seg.join(' · ') : '没有明确约束';
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
    GG.el('p',{class:'small muted', style:{margin:'0'}}, h.blurb),
    GG.el('div',{class:'chips', style:{marginTop:'2px'}},
      h.tags.map(t=> GG.el('span',{class: item.hitTags.includes(t)?'chip on':'chip', style:{cursor:'default'}}, t)))
  );
}

/* ---------- AI 通路（连了 key 用真实模型解析这句话；房源过滤永远本地，硬约束绝不破） ---------- */
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
  const st = GG.decodeState();
  if(st && typeof st.q==='string' && st.q.trim()){
    showResult(st.q, true);
    return;
  }
  intro();
}

function intro(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '用一句话，找到你的家'),
    GG.el('p', null, '像跟中介聊天那样描述：城市、几室、预算、房龄、还有那些“最好有”的小心愿。我来读懂，并从房源库里精挑。')
  ));
  main.appendChild(GG.llm.bar());

  const ta = GG.el('textarea',{class:'field', placeholder:'例如：我想在杭州找个两室一厅，预算300万以内，最好是次新房，离地铁近', rows:'3'});

  const sampleWrap = GG.el('div',{class:'chips', style:{marginTop:'12px'}},
    SAMPLES.map(s=> GG.el('span',{class:'chip', onClick:()=>{ ta.value = s; ta.focus(); }},
      s.length>22 ? s.slice(0,22)+'…' : s))
  );

  const go = GG.el('button',{class:'btn primary lg block', style:{marginTop:'16px'}, onClick:()=>{
    const q = ta.value.trim();
    if(!q){ GG.toast('先用一句话描述你想要的家吧'); ta.focus(); return; }
    showResult(q, false);
  }}, '🔍 帮我找房 →');

  main.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'18px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '描述你的理想居所'),
    ta,
    GG.el('div',{class:'small muted', style:{marginTop:'10px'}}, '试试这些 ↓（点一下填入）'),
    sampleWrap,
    go
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
      '按“最好有”加分排序…'
    ], useAI?1800:1600);
    const [cc] = await Promise.all([getConstraints(query, useAI), think]); c = cc;
  } else {
    c = await getConstraints(query, useAI);
  }
  const { scored, total, tightest } = search(c);
  GG.encodeState({ q: query });
  GG.clear(stage);

  // 原话回显
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'6px', paddingBottom:'4px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, '🏠 为你找到的房')));
  stage.appendChild(GG.el('div',{style:{margin:'0 0 6px'}}, GG.llm.badge(!!c._ai)));
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', background:'linear-gradient(160deg,var(--accent-soft),#fff 60%)'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '你说'),
    GG.el('p',{style:{margin:'0', fontSize:'17px', lineHeight:'1.6'}}, '“'+query+'”'),
    GG.el('div',{class:'section-t', style:{marginTop:'16px'}}, '我读到的需求'),
    GG.el('div',{class:'chips', style:{marginTop:'4px'}}, constraintChips(c))
  ));

  // 结果列表 / 空态
  const top = scored.slice(0, 4);
  if(total === 0){
    const harshMsg = tightest
      ? `最苛刻的一条是「${tightest}」，房源库里大多数都卡在这。试试放宽它，或换个说法。`
      : '试着把约束说得宽松一些，或换一句描述。';
    stage.appendChild(GG.el('div',{class:'card pad', style:{textAlign:'center'}},
      GG.el('div',{style:{fontSize:'40px'}}, '🔎'),
      GG.el('h3',{style:{fontSize:'19px', marginTop:'6px'}}, '没有完全符合的房源'),
      GG.el('p',{class:'muted', style:{margin:'8px 0 0'}}, harshMsg)
    ));
  } else {
    stage.appendChild(GG.el('div',{class:'small muted', style:{margin:'2px 0 12px'}},
      `按硬约束过滤后命中 ${total} 套，已为你排好序（违背城市/卧室/预算/房龄的房源已自动排除）。`));
    const list = GG.el('div',{class:'stack'});
    top.forEach(item=> list.appendChild(listingCard(item, c)));
    stage.appendChild(list);
  }

  // 分享卡
  const shareSpec = {
    slug: SLUG,
    title: '为你找到的房',
    subtitle: '需求：'+needSentence(c),
    tags: constraintTagsForShare(c),
    rows: top.map((item,i)=>({ label:'匹配 '+(i+1), value:`${item.h.title} · ${item.h.city}/${item.h.beds}室/${item.h.price}万` })),
    note: total>0
      ? `共匹配 ${total} 套，已排除所有违背硬约束的房源；首选「${top[0].h.title}」。`
      : (tightest ? `0 套匹配，最苛刻约束：${tightest}。` : '0 套匹配，建议放宽约束。')
  };

  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, total>0 ? '截图分享你的找房结果 ↓' : '换句话再试一次 ↓'),
    shareSpec));

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '↻ 换一句话再找')
  ));
}

/* 分享卡 tags：约束的紧凑文字 */
function constraintTagsForShare(c){
  const t = [];
  if(c.city) t.push(c.city);
  if(c.beds) t.push(c.beds+'室');
  if(c.maxPrice!=null) t.push('≤'+c.maxPrice+'万');
  if(c.maxAge!=null) t.push(c._ageNote||('房龄≤'+c.maxAge+'年'));
  c.tags.forEach(x=> t.push(x));
  return t;
}

start();
})();
