/* mindtrip — 旅行规划：答偏好 → 逐时行程 + 交互地图。
   签名点：行程逐时可读；地图标点与行程条目用同一连续编号一一对应；
   点行程条目 ⇄ 点地图图钉 双向高亮（图钉放大变色 / 行程条目高亮并滚动到视野）。
   换偏好 → 重新筛 POI、重排、重编号 → 行程与标点都变。全离线，地图为本地 inline SVG 现画。 */
(function(){
const SLUG = 'mindtrip';
const { CITIES } = window.MINDTRIP;

const PACE = {
  relaxed:  { key:'relaxed',  label:'松弛', per:[2,3], note:'每天 2~3 个点，留足发呆时间' },
  medium:   { key:'medium',   label:'适中', per:[3,4], note:'每天 3~4 个点，张弛有度' },
  packed:   { key:'packed',   label:'紧凑', per:[4,5], note:'每天 4~5 个点，把时间榨干' }
};
const INTERESTS = ['美食','历史','自然','购物','亲子'];
const SLOT_NAMES = ['上午','中午','下午','晚上'];
// 类型 → 小圆点颜色（地图图钉描边/行程小标用）
const TYPE_COLOR = { 美食:'#e0922b', 历史:'#9b5cc2', 自然:'#2e9e7b', 购物:'#c2569b', 亲子:'#3a7bd5' };

let main;
// 当前选择
let sel = { city:'kyoto', days:3, pace:'medium', interests:['美食','自然'] };

/* ---------------- 引擎 ---------------- */
// 按所选兴趣筛 POI；不足则用全部兜底。返回筛后的 POI 数组。
function filterPois(city){
  const all = CITIES[city].pois;
  let pool = all.filter(p => sel.interests.includes(p.type));
  if(pool.length < 4) pool = all.slice();        // 兴趣太窄 → 全城兜底
  return pool;
}

// 邻近度粗排：贪心最近邻，从最靠左上的点起步，串成一条顺路链。
function nearestChain(pois){
  if(pois.length <= 1) return pois.slice();
  const left = pois.slice();
  // 起点：x+y 最小（地图左上角）
  left.sort((a,b)=> (a.x+a.y) - (b.x+b.y));
  const chain = [ left.shift() ];
  while(left.length){
    const last = chain[chain.length-1];
    let bi=0, bd=Infinity;
    left.forEach((p,i)=>{ const d=(p.x-last.x)**2 + (p.y-last.y)**2; if(d<bd){ bd=d; bi=i; } });
    chain.push(left.splice(bi,1)[0]);
  }
  return chain;
}

// 生成行程：筛 → 按节奏定每天个数 → 顺路链切成每天 → 时段分配 → 全程连续编号。
function plan(){
  const city = sel.city;
  const pool = filterPois(city);
  const [lo, hi] = PACE[sel.pace].per;
  // 用种子随机让“每天几个点”稳定可复现（同样选择 → 同样行程）
  const seed = GG.hash(city+'|'+sel.days+'|'+sel.pace+'|'+sel.interests.slice().sort().join(','));
  const rnd = GG.rng(seed);

  // 决定每天目标数量
  const perDay = [];
  for(let d=0; d<sel.days; d++){ perDay.push(lo + Math.floor(rnd()*(hi-lo+1))); }
  let need = perDay.reduce((a,b)=>a+b,0);

  // 取点：池子够就洗牌取前 need 个；不够就允许循环复用（小城 + 紧凑长天数时）
  let shuffled = GG.shuffle(pool, seed);
  let chosen = [];
  while(chosen.length < need){
    chosen = chosen.concat(shuffled);
  }
  chosen = chosen.slice(0, need);

  // 切成每天，并在“每天内部”按邻近度排顺序（顺路）
  const days = [];
  let cursor = 0, n = 1;
  for(let d=0; d<sel.days; d++){
    const cnt = perDay[d];
    const dayPois = nearestChain(chosen.slice(cursor, cursor+cnt));
    cursor += cnt;
    // 时段分配：1点→下午；2点→上午/下午；3→上午/下午/晚上；4→上午/中午/下午/晚上；5→上午/中午/下午/下午/晚上
    const slots = assignSlots(dayPois.length);
    const items = dayPois.map((p,i)=>({ idx: n++, slot: slots[i], poi: p }));
    days.push({ day: d+1, items });
  }
  return { city, days, total: n-1 };
}

function assignSlots(k){
  if(k<=1) return ['下午'];
  if(k===2) return ['上午','下午'];
  if(k===3) return ['上午','下午','晚上'];
  if(k===4) return ['上午','中午','下午','晚上'];
  return ['上午','中午','下午','下午','晚上'].slice(0,k);
}

/* ---------------- 地图（本地 inline SVG 现画） ---------------- */
function buildMap(itinerary){
  const city = CITIES[itinerary.city];
  const m = city.map;
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs)=>{ const e=document.createElementNS(NS, tag); for(const k in attrs) e.setAttribute(k, attrs[k]); return e; };

  const svg = mk('svg', { viewBox:'0 0 100 60', class:'mt-map', width:'100%',
    style:'display:block;border-radius:14px;background:linear-gradient(160deg,#eef6f4,#f7faf9)' });

  // 底图：公园
  (m.parks||[]).forEach(p=> svg.appendChild(mk('ellipse',
    { cx:p.cx, cy:p.cy, rx:p.rx, ry:p.ry, fill:'#cfe8d6', opacity:'.85' })));
  // 底图：主干道
  (m.roads||[]).forEach(d=> svg.appendChild(mk('path',
    { d, fill:'none', stroke:'#e2e2dc', 'stroke-width':'2.2', 'stroke-linecap':'round' })));
  // 底图：河流/海岸
  (m.rivers||[]).forEach(d=> svg.appendChild(mk('path',
    { d, fill:'none', stroke:'#9fd0e6', 'stroke-width':'3.4', 'stroke-linecap':'round', opacity:'.9' })));

  // 行程连线（按编号顺序把图钉串起来，更直观“顺路”）
  const pts = itinerary.days.flatMap(d=>d.items).sort((a,b)=>a.idx-b.idx);
  if(pts.length>1){
    let dd = 'M '+pts[0].poi.x+' '+pts[0].poi.y;
    for(let i=1;i<pts.length;i++) dd += ' L '+pts[i].poi.x+' '+pts[i].poi.y;
    svg.appendChild(mk('path', { d:dd, fill:'none', stroke:'var(--accent)', 'stroke-width':'.9',
      'stroke-dasharray':'2 2', opacity:'.55' }));
  }

  // 图钉：每个 POI 一个 <g>，圆 + 编号文字，data-idx 用于双向高亮
  const pinByIdx = {};
  pts.forEach(it=>{
    const p = it.poi;
    const g = mk('g', { class:'mt-pin', 'data-idx':String(it.idx),
      transform:`translate(${p.x} ${p.y})`, style:'cursor:pointer' });
    const halo = mk('circle', { r:'4.6', fill:'#fff', class:'mt-pin-halo', opacity:'.0' });
    const dot  = mk('circle', { r:'3.4', fill:'var(--accent)',
      stroke:TYPE_COLOR[p.type]||'#fff', 'stroke-width':'1', class:'mt-pin-dot' });
    const num  = mk('text', { 'text-anchor':'middle', 'dominant-baseline':'central', y:'.2',
      'font-size':'3.4', 'font-weight':'700', fill:'#fff', class:'mt-pin-num' });
    num.textContent = String(it.idx);
    g.appendChild(halo); g.appendChild(dot); g.appendChild(num);
    g.addEventListener('click', ()=> focusItem(it.idx, 'pin'));
    g.addEventListener('mouseenter', ()=> hi(it.idx, true, 'pin'));
    g.addEventListener('mouseleave', ()=> { if(activeIdx!==it.idx) hi(it.idx, false, 'pin'); });
    svg.appendChild(g);
    pinByIdx[it.idx] = g;
  });
  svg._pinByIdx = pinByIdx;
  return svg;
}

/* ---------------- 双向高亮 ---------------- */
let activeIdx = null;
let mapSvg = null;        // 当前地图
let listBox = null;       // 当前行程列表容器

function hi(idx, on, source){
  // 图钉
  const pin = mapSvg && mapSvg._pinByIdx[idx];
  if(pin){
    pin.classList.toggle('on', on);
    const dot = GG.$('.mt-pin-dot', pin), halo = GG.$('.mt-pin-halo', pin);
    if(dot) dot.setAttribute('r', on?'5.4':'3.4');
    if(halo) halo.setAttribute('opacity', on?'.9':'0');
    if(on && pin.parentNode) pin.parentNode.appendChild(pin); // 提到最上层
  }
  // 行程条目
  const row = listBox && GG.$('.mt-item[data-idx="'+idx+'"]', listBox);
  if(row) row.classList.toggle('on', on);
}

// 设为焦点：清掉旧的，点亮新的；若来源是图钉，把行程条目滚动到视野。
function focusItem(idx, source){
  if(activeIdx!=null && activeIdx!==idx) hi(activeIdx, false, source);
  const same = (activeIdx===idx);
  activeIdx = same ? null : idx;       // 再点一次取消
  hi(idx, !same, source);
  if(!same && source==='pin'){
    const row = listBox && GG.$('.mt-item[data-idx="'+idx+'"]', listBox);
    if(row) row.scrollIntoView({ behavior:'smooth', block:'center' });
  }
}

/* ---------------- 渲染：偏好表单 ---------------- */
function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.city && CITIES[st.city]){
    sel = { city:st.city, days:st.days||3, pace:st.pace||'medium',
            interests:(st.interests&&st.interests.length)?st.interests:['美食','自然'] };
    showResult(true);
    return;
  }
  intro();
}

function intro(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '说说你的旅行偏好'),
    GG.el('p', null, '选目的地与节奏、勾上感兴趣的方向，我来排出逐时行程，并把每个落脚点画到地图上。')
  ));

  const form = GG.el('div',{class:'stack', style:{marginTop:'8px'}});

  // 目的地
  form.appendChild(GG.el('div',{class:'card pad'},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '目的地'),
    GG.el('div',{class:'grid', style:{gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'10px'}},
      Object.keys(CITIES).map(key=>{
        const c = CITIES[key];
        const el = GG.el('div',{class:'opt'+(sel.city===key?' on':''),
          onClick:()=>{ sel.city=key; GG.$$('.opt', cityBox).forEach(o=>o.classList.remove('on')); el.classList.add('on'); }},
          GG.el('div',{class:'dot'}),
          GG.el('div',{},
            GG.el('div',{style:{fontWeight:'600'}}, c.name+' '),
            GG.el('div',{class:'small muted'}, c.blurb))
        );
        return el;
      })
    )
  ));
  const cityBox = form.lastChild;

  // 天数
  form.appendChild(GG.el('div',{class:'card pad'},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '天数'),
    GG.el('div',{class:'chips'},
      [2,3,4].map(n=> GG.el('span',{class:'chip'+(sel.days===n?' on':''),
        onClick:e=>{ sel.days=n; GG.$$('.chip', e.currentTarget.parentNode).forEach(c=>c.classList.remove('on')); e.currentTarget.classList.add('on'); }},
        n+' 天')))
  ));

  // 节奏
  form.appendChild(GG.el('div',{class:'card pad'},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '节奏'),
    GG.el('div',{class:'chips'},
      Object.values(PACE).map(p=> GG.el('span',{class:'chip'+(sel.pace===p.key?' on':''),
        title:p.note,
        onClick:e=>{ sel.pace=p.key; GG.$$('.chip', e.currentTarget.parentNode).forEach(c=>c.classList.remove('on')); e.currentTarget.classList.add('on'); }},
        p.label))),
    GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}}, '松弛 2~3 点／天 · 适中 3~4 · 紧凑 4~5')
  ));

  // 兴趣（多选）
  form.appendChild(GG.el('div',{class:'card pad'},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '感兴趣的方向（可多选）'),
    GG.el('div',{class:'chips'},
      INTERESTS.map(t=> GG.el('span',{class:'chip'+(sel.interests.includes(t)?' on':''),
        onClick:e=>{
          const i = sel.interests.indexOf(t);
          if(i>=0){ if(sel.interests.length>1) sel.interests.splice(i,1); else { GG.toast('至少保留一个方向'); return; } }
          else sel.interests.push(t);
          e.currentTarget.classList.toggle('on');
        }},
        GG.el('span',{style:{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',
          background:TYPE_COLOR[t],marginRight:'7px'}}), t)))
  ));

  main.appendChild(form);
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn primary lg', onClick:()=>showResult(false)}, '✨ 生成我的行程 →')
  ));
}

/* ---------------- 渲染：结果 ---------------- */
async function showResult(fromLink){
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  activeIdx = null;
  const stage = GG.el('div'); main.appendChild(stage);

  const cityName = CITIES[sel.city].name;
  if(!fromLink){
    await GG.thinking(stage, [
      '读取你的偏好…',
      `在「${cityName}」里筛选 ${sel.interests.join(' / ')} 相关的去处…`,
      '按节奏分配每天的节点、串成顺路路线…',
      '把每个落脚点标到地图上…'
    ], 1600);
  }

  const itinerary = plan();
  GG.encodeState({ city:sel.city, days:sel.days, pace:sel.pace, interests:sel.interests });
  GG.clear(stage);

  // 标题
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'6px'}},
    GG.el('h1',{style:{fontSize:'26px'}}, `🗺️ ${cityName} · ${sel.days} 天行程`),
    GG.el('p',null, `${PACE[sel.pace].label}节奏 · ${sel.interests.join(' / ')} · 共 ${itinerary.total} 个落脚点（编号与地图一一对应）`)
  ));

  // 地图卡（在上，醒目）
  mapSvg = buildMap(itinerary);
  const mapCard = GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '交互地图 · 点图钉或行程互相高亮'),
    mapSvg,
    GG.el('div',{class:'chips', style:{marginTop:'12px', justifyContent:'center'}},
      INTERESTS.map(t=> GG.el('span',{class:'small muted', style:{display:'inline-flex',alignItems:'center',gap:'5px',marginRight:'4px'}},
        GG.el('span',{style:{display:'inline-block',width:'9px',height:'9px',borderRadius:'50%',
          background:'#fff',border:`2px solid ${TYPE_COLOR[t]}`}}), t)))
  );
  stage.appendChild(mapCard);

  // 行程列表（逐时）
  listBox = GG.el('div',{class:'stack'});
  itinerary.days.forEach(d=>{
    const dayCard = GG.el('div',{class:'card pad'},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, 'Day '+d.day));
    const items = GG.el('div',{class:'stack', style:{gap:'10px'}});
    d.items.forEach(it=>{
      const p = it.poi;
      const row = GG.el('div',{class:'mt-item', 'data-idx':String(it.idx),
        style:{display:'flex',gap:'12px',alignItems:'flex-start',padding:'10px 12px',
          border:'1px solid var(--line)',borderRadius:'12px',cursor:'pointer',transition:'.14s',background:'var(--surface)'},
        onClick:()=> focusItem(it.idx, 'list'),
        onMouseenter:()=> hi(it.idx, true, 'list'),
        onMouseleave:()=> { if(activeIdx!==it.idx) hi(it.idx, false, 'list'); }},
        // 编号徽标
        GG.el('div',{class:'mt-badge', style:{flex:'none',width:'30px',height:'30px',borderRadius:'50%',
          background:'var(--accent)',color:'#fff',fontWeight:'700',display:'flex',
          alignItems:'center',justifyContent:'center',fontSize:'14px'}}, String(it.idx)),
        GG.el('div',{style:{flex:'1',minWidth:'0'}},
          GG.el('div',{class:'row', style:{gap:'8px',flexWrap:'wrap'}},
            GG.el('span',{class:'small', style:{fontWeight:'700',color:'var(--ink-2)',minWidth:'34px'}}, it.slot),
            GG.el('span',{style:{fontWeight:'650',fontSize:'16px'}}, p.name),
            GG.el('span',{class:'small', style:{color:TYPE_COLOR[p.type]||'var(--ink-3)',fontWeight:'600'}}, p.type),
            GG.el('span',{class:'small muted'}, '· '+p.hours)),
          GG.el('div',{class:'small muted', style:{marginTop:'3px'}}, p.blurb)
        )
      );
      items.appendChild(row);
    });
    dayCard.appendChild(items);
    listBox.appendChild(dayCard);
  });
  stage.appendChild(listBox);

  // 分享卡：每天亮点
  const shareSpec = {
    slug: SLUG,
    title: `${cityName} ${sel.days} 天行程`,
    subtitle: `${PACE[sel.pace].label}节奏 · ${sel.interests.join(' / ')}`,
    tags: sel.interests,
    note: `共 ${itinerary.total} 个落脚点，按顺路串成 ${sel.days} 天，编号与地图一一对应。`,
    rows: itinerary.days.map(d=>({
      label: 'Day '+d.day,
      value: d.items.map(it=>it.poi.name).join(' → ')
    }))
  };

  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '截图分享你的行程 ↓'), shareSpec));
  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; intro(); }}, '↻ 换偏好重排')
  ));

  // 高亮态样式（首次注入）
  ensureStyle();
}

let styled = false;
function ensureStyle(){
  if(styled) return; styled = true;
  const css = `
  .mt-item.on{border-color:var(--accent)!important;background:var(--accent-soft)!important;
    box-shadow:0 2px 10px rgba(20,20,30,.08)}
  .mt-item.on .mt-badge{transform:scale(1.12)}
  .mt-item{will-change:transform}
  .mt-pin .mt-pin-dot{transition:r .15s}
  .mt-map{touch-action:manipulation}`;
  document.head.appendChild(GG.el('style',{html:css}));
}

start();
})();
