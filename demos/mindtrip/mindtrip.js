/* mindtrip — 旅行规划：想去哪打哪 → 懂行的逐时行程 + 交互地图。
   两条路：①连了 AI key → 打字输入任意城市，AI 补全当地 POI 并吃透你的特殊要求(带娃/老人/不吃辣/预算…)；
           ②没 key → 从 4 个内置城市离线玩。两条路都走同一套本地引擎。
   本地引擎(可复现、不靠 AI)：
     · 懂行排程：按 POI 类型/名字推断「合适时段」，餐厅落饭点、寺庙/自然在白天、夜市/夜景在晚上——不再「晚上逛金阁寺」。
     · 分区分天：把全部点串成一条顺路链，再按节奏切成每天 → 每天天然是一个相邻片区。
     · 地图按天分段连线、按天着色；图钉与行程同一连续编号、双向高亮(点钉⇄点条目)。
     · 生成后可就地微调：📌锁定必去 / ↻换一个 / ✕删除 / 🎲换一批。全离线 inline SVG，无外部资源。 */
(function(){
const SLUG = 'mindtrip';
const { CITIES } = window.MINDTRIP;

const PACE = {
  relaxed: { key:'relaxed', label:'松弛', per:[2,3], note:'每天 2~3 个点，留足发呆时间' },
  medium:  { key:'medium',  label:'适中', per:[3,4], note:'每天 3~4 个点，张弛有度' },
  packed:  { key:'packed',  label:'紧凑', per:[4,5], note:'每天 4~5 个点，把时间榨干' }
};
const INTERESTS  = ['美食','历史','自然','购物','亲子'];
const SLOTS_ALL  = ['上午','中午','下午','傍晚','晚上'];
const TYPE_COLOR = { 美食:'#e0922b', 历史:'#9b5cc2', 自然:'#2e9e7b', 购物:'#c2569b', 亲子:'#3a7bd5' };
// 每天一种颜色（地图连线 + 图钉填色 + 行程小标）
const DAY_COLORS = ['#e0651f','#2e9e7b','#3a7bd5','#9b5cc2','#c2569b','#d99b1f'];

/* ===================== 懂行：时段亲和 + 标签推导（本地，canned/AI 通用） ===================== */
// 返回 {上午,中午,下午,傍晚,晚上} 的适合度分数。AI 显式给了 slots 就以它为准。
function affinityFor(poi){
  if(poi._aff) return poi._aff;
  const t = poi.type, n = String(poi.name||'');
  let a;
  if(t==='美食')      a = { 上午:.5, 中午:3,  下午:.7, 傍晚:1.6, 晚上:3   };
  else if(t==='历史') a = { 上午:2.6, 中午:.7, 下午:2.3, 傍晚:1,  晚上:.3  };
  else if(t==='自然') a = { 上午:2.7, 中午:1,  下午:2.1, 傍晚:1.6, 晚上:.3  };
  else if(t==='购物') a = { 上午:1,  中午:1.2, 下午:2.3, 傍晚:2.1, 晚上:1.8 };
  else if(t==='亲子') a = { 上午:2.5, 中午:1,  下午:2.2, 傍晚:.7, 晚上:.4  };
  else                a = { 上午:1.5, 中午:1.2, 下午:1.6, 傍晚:1.3, 晚上:1   };
  // 名字关键词修正（强信号）
  if(/夜市|夜景|夜游|夜间|酒吧|居酒屋|演出|灯光|live/i.test(n))      a = { 上午:.2, 中午:.5, 下午:.7, 傍晚:2, 晚上:3.2 };
  else if(/温泉|spa/i.test(n))                                       { a={...a, 傍晚:2.6, 晚上:2.4}; }
  else if(/竹林|清晨|晨/.test(n))                                    { a={...a, 上午:3.2, 傍晚:.6, 晚上:.2}; }
  // 需日光的户外：傍晚/晚上压低
  if(/瀑布|间歇泉|出海|观鲸|鲸|泻湖|冰川|徒步|登山|花园|庭园|庭院|湖$|山$|公园$/.test(n)){ a={...a, 晚上:.2, 傍晚:Math.min(a.傍晚,1)}; }
  // 适合看夜景/黄昏：傍晚晚上抬高
  if(/夜景|观景|展望|升降机|凯旋门|塔$|城堡|旋转餐厅/.test(n)){ a={...a, 傍晚:Math.max(a.傍晚,2), 晚上:Math.max(a.晚上,2.2)}; }
  // AI 显式 slots 覆盖
  if(Array.isArray(poi.slots) && poi.slots.length){
    const b = { 上午:.3, 中午:.3, 下午:.3, 傍晚:.3, 晚上:.3 };
    poi.slots.forEach(s=>{ if(b[s]!=null) b[s]=3; });
    a = b;
  }
  poi._aff = a; return a;
}

function deriveTags(poi){
  if(Array.isArray(poi.tags) && poi.tags.length) return poi.tags.slice(0,3);
  const out = [], n = String(poi.name||'');
  if(poi.type==='亲子') out.push('带娃友好');
  if(/山|寺|塔|城堡|爬|稻荷|双龙|登|升降机/.test(n)) out.push('需爬坡');
  if(/市场|夜市|商场|购物|工厂|博物馆|水族馆|料理|餐厅/.test(n)) out.push('室内/避雨');
  return out.slice(0,3);
}

/* ===================== AI：任意城市补全 POI ===================== */
const AI_SYS = `你是资深当地向导兼行程规划师。给定城市与旅行者要求，列出该城市最值得去、且贴合要求的地点。
只输出严格 JSON，不要任何解释或多余文字：
{"city":"城市中文名","blurb":"一句话城市印象(20字内)","pois":[
 {"name":"地点中文名(简洁)","type":"美食|历史|自然|购物|亲子 其一",
  "area":"所在片区名(同片区会被安排进同一天)",
  "x":0到100的数字,"y":0到100的数字,
  "hours":"建议停留如 1.5h","slots":["上午|中午|下午|傍晚|晚上 里适合的1~2个"],
  "tags":["带娃友好|无障碍友好|需爬坡|室内避雨|网红打卡 等，适用才填"],
  "blurb":"30字内的去处亮点"}
 ... 共 12~16 个]}
硬规则：
1) 必须覆盖用户勾选的兴趣方向，并包含该城不可错过的代表性地标。
2) 若用户写了特殊要求(带小孩/老人/腿脚不便/不吃辣/预算紧/怕晒/避雨等)，必须体现在选点与 tags 上(例如腿脚不便就避开需爬坡的点)。
3) x,y 是相对坐标：同一片区(area)的点要靠近、不同片区要分开，整体按真实地理的相对方位铺开，别全堆中间。
4) slots 要符合常识：寺庙/古迹/自然填白天，夜市/酒吧/夜景填晚上，餐厅填中午或晚上。
5) 全部简体中文。`;

function clampNum(v, lo, hi, dft){ v = Number(v); return isFinite(v) ? Math.max(lo, Math.min(hi, v)) : dft; }
function sanitizePoi(p, i){
  if(!p || !p.name) return null;
  const types = ['美食','历史','自然','购物','亲子'];
  return {
    id:   'a'+i,
    name: String(p.name).slice(0,18),
    type: types.includes(p.type) ? p.type : '历史',
    area: p.area ? String(p.area).slice(0,12) : '',
    x:    clampNum(p.x, 6, 94, 18 + (i*13)%72),
    y:    clampNum(p.y, 6, 54, 12 + (i*9)%40),
    hours:p.hours ? String(p.hours).slice(0,6) : '1h',
    slots:Array.isArray(p.slots) ? p.slots.filter(s=>SLOTS_ALL.includes(s)).slice(0,2) : null,
    tags: Array.isArray(p.tags)  ? p.tags.map(t=>String(t).slice(0,8)).filter(Boolean).slice(0,3) : null,
    blurb:p.blurb ? String(p.blurb).slice(0,40) : ''
  };
}
async function aiCity(cityText){
  const userText =
    `城市：${cityText}\n天数：${sel.days} 天\n节奏：${PACE[sel.pace].label}（约 ${PACE[sel.pace].per[0]}~${PACE[sel.pace].per[1]} 个点/天）\n`+
    `兴趣方向：${sel.interests.join('、')}\n特殊要求：${sel.constraints.trim()||'无'}`;
  const r = await GG.llm.json(AI_SYS, userText, { max_tokens:3200 });
  let pois = (Array.isArray(r.pois) ? r.pois : []).map(sanitizePoi).filter(Boolean);
  // 去重名
  const seen = new Set(); pois = pois.filter(p=>{ if(seen.has(p.name)) return false; seen.add(p.name); return true; });
  if(pois.length < 4) throw new Error('AI 返回的地点太少，换个写法或城市再试');
  return { name:(r.city||cityText).trim(), blurb:r.blurb||'', pois, ai:true, seed:GG.hash('ai|'+cityText) };
}

// 文字 → 内置城市 slug（中文名 / 英文名 / 别名）
const CANNED_ALIAS = { '京都':'kyoto','kyoto':'kyoto','里斯本':'lisbon','lisbon':'lisbon',
  '清迈':'chiangmai','chiangmai':'chiangmai','chiang mai':'chiangmai',
  '雷克雅未克':'reykjavik','reykjavik':'reykjavik','冰岛':'reykjavik' };
function matchCanned(text){
  const raw = String(text||'').trim(), k = raw.toLowerCase();
  for(const key in CITIES){ if(CITIES[key].name===raw || CITIES[key].en.toLowerCase()===k) return key; }
  return CANNED_ALIAS[k] || CANNED_ALIAS[raw] || null;
}

/* ===================== 引擎：顺路链 → 分天 → 排时段 → 编号 ===================== */
function nearestChain(pois){
  if(pois.length<=1) return pois.slice();
  const left = pois.slice();
  left.sort((a,b)=>(a.x+a.y)-(b.x+b.y));   // 从左上角起步
  const chain = [ left.shift() ];
  while(left.length){
    const last = chain[chain.length-1];
    let bi=0, bd=Infinity;
    left.forEach((p,i)=>{ const d=(p.x-last.x)**2+(p.y-last.y)**2; if(d<bd){ bd=d; bi=i; } });
    chain.push(left.splice(bi,1)[0]);
  }
  return chain;
}
function splitSizes(total, days){
  const base = Math.floor(total/days); let rem = total - base*days;
  const sizes = new Array(days).fill(base);
  for(let i=0;i<days && rem>0;i++,rem--) sizes[i]++;
  return sizes;
}
// 时段容量：中午只放 1 个（第二家餐厅自然落到晚上当晚饭）；白天时段各放 2 个，
// 这样寺庙/庭园/自然这类「只能白天」的点永远有白天位可去，不会被挤到夜里。
const SLOT_CAP   = { 上午:2, 中午:1, 下午:2, 傍晚:1, 晚上:1 };
const SLOT_ORDER = { 上午:0, 中午:1, 下午:2, 傍晚:3, 晚上:4 };
function bestSlot(a){ let b='下午', bw=-Infinity; SLOTS_ALL.forEach(s=>{ if(a[s]>bw){ bw=a[s]; b=s; } }); return b; }
// 最佳匹配排时段：把全局「最高亲和」的(点,时段)边一条条吃掉，受容量限制。
// 返回按时间(上午→晚上)排好的 [{poi,slot}]。
function assignDaySlots(dayPois){
  if(!dayPois.length) return [];
  if(dayPois.length===1) return [{ poi:dayPois[0], slot:bestSlot(affinityFor(dayPois[0])) }];
  const pts = dayPois.map((p,i)=>({ p, i, a:affinityFor(p) }));
  const cap = { ...SLOT_CAP };
  const edges = [];
  pts.forEach((pt,pi)=> SLOTS_ALL.forEach(s=> edges.push({ pi, s, w: pt.a[s] - pt.i*0.001 })));
  edges.sort((x,y)=> y.w - x.w);
  const slotOf = {};
  for(const e of edges){ if(slotOf[e.pi]!=null || cap[e.s]<=0) continue; slotOf[e.pi]=e.s; cap[e.s]--; }
  pts.forEach((pt,pi)=>{ if(slotOf[pi]==null) slotOf[pi]=bestSlot(pt.a); });   // 兜底（点数 > 总容量时）
  const res = pts.map((pt,pi)=>({ poi:pt.p, slot:slotOf[pi], a:pt.a }));
  // 一天若完全没有傍晚/晚上安排，但存在够格的夜间/晚餐候选（晚上亲和≥2.4），挪一个过去 → 像样的一天有收尾
  if(!res.some(r=>r.slot==='傍晚'||r.slot==='晚上')){
    let best=null, bw=2.4;
    res.forEach(r=>{ if(r.a.晚上>bw){ bw=r.a.晚上; best=r; } });
    if(best) best.slot='晚上';
  }
  res.sort((x,y)=> SLOT_ORDER[x.slot]-SLOT_ORDER[y.slot]);
  return res.map(r=>({ poi:r.poi, slot:r.slot }));
}
function planFrom(selected, days, pace){
  const pool = selected.slice();
  if(!pool.length) return { days:[], total:0 };
  const chain   = nearestChain(pool);
  const effDays = Math.max(1, Math.min(days, chain.length));
  const sizes   = splitSizes(chain.length, effDays);
  const out = []; let cur=0, n=1;
  for(let d=0; d<effDays; d++){
    const dayPois = chain.slice(cur, cur+sizes[d]); cur += sizes[d];
    const items = assignDaySlots(dayPois).map(x=>({ idx:n++, slot:x.slot, poi:x.poi }));
    out.push({ day:d+1, items });
  }
  return { days:out, total:n-1 };
}
function dayTheme(items){
  const areas = [...new Set(items.map(it=>it.poi.area).filter(Boolean))];
  if(areas.length) return areas.slice(0,2).join(' · ');
  const cnt = {}; items.forEach(it=> cnt[it.poi.type]=(cnt[it.poi.type]||0)+1);
  const top = Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];
  return top ? top+'为主' : '';
}

/* ===================== 选点 ===================== */
function needCount(days, pace, poolLen){
  const [lo,hi] = PACE[pace].per, mid = Math.round((lo+hi)/2);
  return Math.max(Math.min(days, poolLen), Math.min(poolLen, days*mid));
}
function pickSelection(pool, need, lockedIds, seed){
  const locked = pool.filter(p=>lockedIds.has(p.id));
  const rest = GG.shuffle(pool.filter(p=>!lockedIds.has(p.id)), seed);
  // 勾选的兴趣方向优先
  rest.sort((a,b)=> (sel.interests.includes(b.type)?1:0) - (sel.interests.includes(a.type)?1:0));
  const chosen = locked.slice();
  for(const p of rest){ if(chosen.length>=need) break; chosen.push(p); }
  return chosen.slice(0, Math.max(need, locked.length));
}

/* ===================== 地图（本地 inline SVG） ===================== */
// AI 城市没有手绘底图 → 用城市名做种子，程序化生成一张抽象底图（河/公园/路）
function genMap(seed){
  const r = GG.rng(seed), p=(a,b)=>a+r()*(b-a);
  const river = `M ${p(2,28)} ${p(2,12)} C ${p(20,40)} ${p(14,24)}, ${p(42,58)} ${p(26,34)}, ${p(40,60)} ${p(38,48)} S ${p(72,92)} ${p(46,56)}, ${p(82,98)} ${p(50,60)}`;
  return {
    rivers:[ river ],
    parks: [ {cx:p(14,38),cy:p(12,28),rx:p(9,14),ry:p(7,10)}, {cx:p(60,86),cy:p(28,46),rx:p(8,12),ry:p(6,9)} ],
    roads: [ `M 4 ${p(24,40)} H 96`, `M ${p(28,52)} 4 V 58`, `M 8 ${p(44,54)} L ${p(80,92)} ${p(8,20)}` ]
  };
}
function buildMap(itinerary, mapInfo){
  const NS='http://www.w3.org/2000/svg';
  const mk=(t,a)=>{ const e=document.createElementNS(NS,t); for(const k in a) e.setAttribute(k,a[k]); return e; };
  const svg = mk('svg',{ viewBox:'0 0 100 60', class:'mt-map', width:'100%',
    style:'display:block;border-radius:14px;background:linear-gradient(160deg,#eef6f4,#f7faf9)' });
  const m = mapInfo||{};
  (m.parks ||[]).forEach(pk=> svg.appendChild(mk('ellipse',{ cx:pk.cx,cy:pk.cy,rx:pk.rx,ry:pk.ry, fill:'#cfe8d6', opacity:'.8' })));
  (m.roads ||[]).forEach(d => svg.appendChild(mk('path',{ d, fill:'none', stroke:'#e4e4dd','stroke-width':'2.2','stroke-linecap':'round' })));
  (m.rivers||[]).forEach(d => svg.appendChild(mk('path',{ d, fill:'none', stroke:'#9fd0e6','stroke-width':'3.4','stroke-linecap':'round',opacity:'.9' })));
  // 按天分段连线 + 按天着色（不再跨天乱连）
  itinerary.days.forEach((d,di)=>{
    const col = DAY_COLORS[di%DAY_COLORS.length];
    if(d.items.length>1){
      let dd='M '+d.items[0].poi.x+' '+d.items[0].poi.y;
      for(let i=1;i<d.items.length;i++) dd+=' L '+d.items[i].poi.x+' '+d.items[i].poi.y;
      svg.appendChild(mk('path',{ d:dd, fill:'none', stroke:col, 'stroke-width':'1','stroke-dasharray':'2.5 2', opacity:'.6' }));
    }
  });
  const pinByIdx={};
  itinerary.days.forEach((d,di)=>{
    const col = DAY_COLORS[di%DAY_COLORS.length];
    d.items.forEach(it=>{
      const p=it.poi;
      const g = mk('g',{ class:'mt-pin','data-idx':String(it.idx), transform:`translate(${p.x} ${p.y})`, style:'cursor:pointer' });
      const halo= mk('circle',{ r:'4.8', fill:'#fff', class:'mt-pin-halo', opacity:'0' });
      const dot = mk('circle',{ r:'3.5', fill:col, stroke:TYPE_COLOR[p.type]||'#fff','stroke-width':'1.1', class:'mt-pin-dot' });
      const num = mk('text',{ 'text-anchor':'middle','dominant-baseline':'central', y:'.2','font-size':'3.4','font-weight':'700', fill:'#fff', class:'mt-pin-num' });
      num.textContent=String(it.idx);
      g.appendChild(halo); g.appendChild(dot); g.appendChild(num);
      g.addEventListener('click', ()=> focusItem(it.idx,'pin'));
      g.addEventListener('mouseenter', ()=> hi(it.idx,true,'pin'));
      g.addEventListener('mouseleave', ()=> { if(activeIdx!==it.idx) hi(it.idx,false,'pin'); });
      svg.appendChild(g); pinByIdx[it.idx]=g;
    });
  });
  svg._pinByIdx=pinByIdx; return svg;
}

/* ===================== 双向高亮 ===================== */
let activeIdx=null, mapSvg=null, listBox=null;
function hi(idx, on){
  const pin = mapSvg && mapSvg._pinByIdx[idx];
  if(pin){
    pin.classList.toggle('on', on);
    const dot=GG.$('.mt-pin-dot',pin), halo=GG.$('.mt-pin-halo',pin);
    if(dot) dot.setAttribute('r', on?'5.4':'3.5');
    if(halo) halo.setAttribute('opacity', on?'.9':'0');
    if(on && pin.parentNode) pin.parentNode.appendChild(pin);
  }
  const row = listBox && GG.$('.mt-item[data-idx="'+idx+'"]', listBox);
  if(row) row.classList.toggle('on', on);
}
function focusItem(idx, source){
  if(activeIdx!=null && activeIdx!==idx) hi(activeIdx,false);
  const same=(activeIdx===idx);
  activeIdx = same ? null : idx;
  hi(idx, !same);
  if(!same && source==='pin'){
    const row = listBox && GG.$('.mt-item[data-idx="'+idx+'"]', listBox);
    if(row) row.scrollIntoView({ behavior:'smooth', block:'center' });
  }
}

/* ===================== 状态 ===================== */
let main;
const G = { city:null, pool:[], selected:[], locked:new Set() };
let sel = { cityText:'京都', days:3, pace:'medium', interests:['美食','自然'], constraints:'' };
let rerollN = 0;

/* ===================== AI 旅行贴士（叠加在本地行程之上） ===================== */
const MT_SYS = '你是熟悉当地的向导。根据用户的城市行程（每天落脚点），给一段实用、个性化的旅行贴士。只输出严格 JSON：{"tips":["贴士(交通/吃什么/最佳时段/避坑等，要具体)",4到6条]}。全部简体中文、具体、别空话。';
function aiTipsBlock(userText){
  const out = GG.el('div',{class:'card pad', style:{display:'none', marginTop:'4px', background:'#fbfbf9'}});
  let loaded=false, busy=false;
  const btn = GG.el('button',{class:'btn', onClick:async()=>{
    if(busy) return;
    if(loaded){ out.style.display = out.style.display==='none'?'block':'none'; return; }
    busy=true; const old=btn.textContent; btn.textContent='AI 生成中…'; out.style.display='block';
    GG.clear(out); out.appendChild(GG.el('div',{class:'muted small'}, 'AI 正在写旅行贴士…'));
    try{
      const r = await GG.llm.json(MT_SYS, userText, {max_tokens:800});
      GG.clear(out);
      out.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'0'}}, 'AI 旅行贴士'));
      out.appendChild(GG.el('ul',{style:{margin:'4px 0 0', paddingLeft:'20px', lineHeight:'1.8'}},
        (Array.isArray(r.tips)?r.tips:[]).map(t=>GG.el('li',null,String(t)))));
      loaded=true; btn.textContent='✦ 收起贴士';
    }catch(e){ GG.clear(out); out.appendChild(GG.el('div',{class:'muted small'}, GG.llm.errMsg(e))); btn.textContent=old; }
    busy=false;
  }}, '✨ AI 旅行贴士');
  return GG.el('div',{style:{marginTop:'16px'}}, GG.el('div',{class:'center'}, btn), out);
}

/* ===================== 渲染：偏好表单 ===================== */
function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.city){
    sel = { cityText:st.city, days:st.days||3, pace:st.pace||'medium',
      interests:(st.interests&&st.interests.length)?st.interests:['美食','自然'], constraints:st.q||'' };
    const canned = matchCanned(st.city);
    if(canned || (st.ai && GG.llm.connected())){ generate(true); return; }
    intro(); GG.toast('这条链接是 AI 生成的城市，连上 key 后点「生成」即可复现'); return;
  }
  intro();
}

function intro(){
  GG.clear(main);
  activeIdx=null;
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '想去哪？我来排行程'),
    GG.el('p', null, '填一个城市、选节奏与方向（可写特殊要求），我排出懂行的逐时行程，并把每个落脚点画进地图。')
  ));
  main.appendChild(GG.llm.bar());

  const form = GG.el('div',{class:'stack', style:{marginTop:'8px'}});

  // 城市（文字输入 + 4 个内置快捷）
  const cityInput = GG.el('input',{ type:'text', value:sel.cityText, placeholder:'输入城市，如 东京 / 巴黎 / 成都…',
    style:{width:'100%',boxSizing:'border-box',padding:'12px 14px',fontSize:'16px',borderRadius:'12px',
      border:'1px solid var(--line)',background:'var(--surface)',color:'var(--ink)'},
    oninput:e=>{ sel.cityText=e.target.value; syncCityChips(); } });
  const quick = GG.el('div',{class:'chips', style:{marginTop:'10px'}},
    Object.keys(CITIES).map(key=> GG.el('span',{class:'chip', 'data-city':CITIES[key].name,
      onClick:()=>{ sel.cityText=CITIES[key].name; cityInput.value=CITIES[key].name; syncCityChips(); }},
      CITIES[key].name)));
  function syncCityChips(){
    const cur=(sel.cityText||'').trim();
    GG.$$('.chip',quick).forEach(c=>c.classList.toggle('on', c.getAttribute('data-city')===cur));
  }
  form.appendChild(GG.el('div',{class:'card pad'},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '目的地'),
    cityInput, quick,
    GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}},
      GG.llm.connected() ? '✓ 已连 AI · 任意城市都能排；点上面 4 个内置城市可离线秒出。'
                         : '内置 4 城可直接玩；连上 AI key 后，任意城市都能排。')
  ));
  syncCityChips();

  // 天数
  form.appendChild(GG.el('div',{class:'card pad'},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '天数'),
    GG.el('div',{class:'chips'},
      [2,3,4,5].map(n=> GG.el('span',{class:'chip'+(sel.days===n?' on':''),
        onClick:e=>{ sel.days=n; GG.$$('.chip', e.currentTarget.parentNode).forEach(c=>c.classList.remove('on')); e.currentTarget.classList.add('on'); }},
        n+' 天')))
  ));

  // 节奏
  form.appendChild(GG.el('div',{class:'card pad'},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '节奏'),
    GG.el('div',{class:'chips'},
      Object.values(PACE).map(p=> GG.el('span',{class:'chip'+(sel.pace===p.key?' on':''), title:p.note,
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
          const i=sel.interests.indexOf(t);
          if(i>=0){ if(sel.interests.length>1) sel.interests.splice(i,1); else { GG.toast('至少保留一个方向'); return; } }
          else sel.interests.push(t);
          e.currentTarget.classList.toggle('on');
        }},
        GG.el('span',{style:{display:'inline-block',width:'8px',height:'8px',borderRadius:'50%',
          background:TYPE_COLOR[t],marginRight:'7px'}}), t)))
  ));

  // 特殊要求
  form.appendChild(GG.el('div',{class:'card pad'},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '特殊要求（可选 · 连了 AI 才生效）'),
    GG.el('textarea',{ rows:'2', value:sel.constraints,
      placeholder:'例：带 3 岁小孩和腿脚不便的爸妈；不吃辣；想多看自然、少排队',
      style:{width:'100%',boxSizing:'border-box',padding:'11px 13px',fontSize:'15px',borderRadius:'12px',
        border:'1px solid var(--line)',background:'var(--surface)',color:'var(--ink)',resize:'vertical',lineHeight:'1.6'},
      oninput:e=>{ sel.constraints=e.target.value; } })
  ));

  main.appendChild(form);
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn primary lg', onClick:()=>generate(false)}, '✨ 生成我的行程 →')
  ));
}

/* ===================== 生成（决定走 AI 还是内置） ===================== */
async function generate(fromLink){
  const cityText = (sel.cityText||'').trim();
  if(!cityText){ GG.toast('先填一个想去的城市'); return; }
  const cannedSlug = matchCanned(cityText);
  const wantAI = GG.llm.connected() && (!cannedSlug || sel.constraints.trim());
  if(!cannedSlug && !GG.llm.connected()){
    GG.toast('连上 AI key 才能去任意城市，或点下面 4 个内置城市'); return;
  }

  main = main || GG.mountShell(SLUG);
  GG.clear(main); activeIdx=null;
  const stage = GG.el('div'); main.appendChild(stage); main.__stage = stage;

  const steps = wantAI
    ? [ `让 AI 想想「${cityText}」有什么值得去…`,
        sel.constraints.trim() ? `按你的要求（${sel.constraints.trim().slice(0,16)}…）挑点…` : `挑出代表性地标 + 你勾的 ${sel.interests.join(' / ')}…`,
        '按片区分天、串顺路、配时段…', '把每个落脚点标到地图上…' ]
    : [ '读取你的偏好…', `在「${cityText}」筛 ${sel.interests.join(' / ')}…`,
        '按片区分天、串顺路、配时段…', '把每个落脚点标到地图上…' ];

  let cityData;
  try{
    if(wantAI){
      const pending = aiCity(cityText);          // 并行：动画的同时请求
      await GG.thinking(stage, steps, 1400);
      cityData = await pending;
    }else{
      const c = CITIES[cannedSlug];
      await GG.thinking(stage, steps, fromLink?300:1100);
      cityData = { name:c.name, blurb:c.blurb, pois:c.pois, map:c.map, ai:false, seed:GG.hash(cannedSlug) };
    }
  }catch(e){
    GG.clear(main); intro();
    GG.toast(GG.llm && GG.llm.errMsg ? GG.llm.errMsg(e) : '生成失败，换个城市或稍后再试');
    return;
  }

  G.city = cityData;
  G.pool = cityData.pois.slice();
  G.locked = new Set();
  const need = needCount(sel.days, sel.pace, G.pool.length);
  G.selected = pickSelection(G.pool, need, G.locked,
    GG.hash(cityText+'|'+sel.days+'|'+sel.pace+'|'+sel.interests.slice().sort().join(',')));

  GG.encodeState({ city:cityText, days:sel.days, pace:sel.pace, interests:sel.interests, q:sel.constraints, ai:wantAI?1:0 });
  GG.clear(stage);
  renderResult(stage);
}

/* ===================== 就地微调 ===================== */
function reRender(){ const stage=main.__stage; if(!stage) return; activeIdx=null; GG.clear(stage); renderResult(stage); }
function tweakDelete(id){
  if(G.selected.length<=2){ GG.toast('至少保留 2 个点'); return; }
  G.selected = G.selected.filter(p=>p.id!==id); G.locked.delete(id); reRender();
}
function tweakSwap(id){
  const cur = G.selected.find(p=>p.id===id); if(!cur) return;
  const used = new Set(G.selected.map(p=>p.id));
  const cands = G.pool.filter(p=>!used.has(p.id));
  if(!cands.length){ GG.toast('没有更多备选地点了'); return; }
  const same = cands.filter(p=>p.type===cur.type);
  const arr  = same.length ? same : cands;
  rerollN++;
  const repl = arr[Math.floor(GG.rng(GG.hash('swap|'+id+'|'+rerollN))()*arr.length)];
  G.selected = G.selected.map(p=> p.id===id ? repl : p);
  if(G.locked.has(id)){ G.locked.delete(id); G.locked.add(repl.id); }
  GG.toast('已换成「'+repl.name+'」'); reRender();
}
function tweakLock(id){ if(G.locked.has(id)) G.locked.delete(id); else G.locked.add(id); reRender(); }
function reshuffle(){
  if(G.pool.length<=G.selected.length){ GG.toast('已经把能去的点都放进来了'); return; }
  rerollN++;
  G.selected = pickSelection(G.pool, G.selected.length, G.locked, GG.hash('reroll|'+rerollN+'|'+sel.cityText));
  reRender();
}

/* ===================== 渲染：结果（可被微调重复调用） ===================== */
function actBtn(label, title, on, active){
  return GG.el('button',{ class:'mt-act'+(active?' on':''), title,
    onClick:e=>{ e.stopPropagation(); on(e); } }, label);
}
function renderResult(stage){
  const itinerary = planFrom(G.selected, sel.days, sel.pace);
  const cityName = G.city.name;
  mapSvg = listBox = null;

  // 标题
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'6px'}},
    GG.el('h1',{style:{fontSize:'26px'}}, `🗺️ ${cityName} · ${itinerary.days.length} 天行程`),
    GG.el('p',null, `${PACE[sel.pace].label}节奏 · ${sel.interests.join(' / ')} · 共 ${itinerary.total} 个落脚点（编号与地图一一对应）`
      + (G.city.ai && G.city.blurb ? '　·　'+G.city.blurb : ''))
  ));
  if(G.city.ai){
    stage.appendChild(GG.el('div',{class:'small muted', style:{margin:'-6px 0 12px', textAlign:'center'}},
      '✦ 地点由 AI 按你的要求挑选；时段/分天/连线由本地引擎排（可复现）'));
  }

  // 地图卡
  mapSvg = buildMap(itinerary, G.city.map || genMap(G.city.seed||GG.hash(cityName)));
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '交互地图 · 点图钉或行程互相高亮'),
    mapSvg,
    GG.el('div',{class:'chips', style:{marginTop:'12px', justifyContent:'center'}},
      itinerary.days.map((d,di)=> GG.el('span',{class:'small muted', style:{display:'inline-flex',alignItems:'center',gap:'5px',marginRight:'8px'}},
        GG.el('span',{style:{display:'inline-block',width:'10px',height:'10px',borderRadius:'50%',background:DAY_COLORS[di%DAY_COLORS.length]}}),
        'Day '+d.day)))
  ));

  // 微调工具条
  stage.appendChild(GG.el('div',{class:'row', style:{justifyContent:'space-between',alignItems:'center',marginBottom:'10px',flexWrap:'wrap',gap:'8px'}},
    GG.el('span',{class:'small muted'}, '每条右侧：📌锁定 · ↻换一个 · ✕删除'),
    GG.el('button',{class:'btn', style:{padding:'7px 14px'}, onClick:reshuffle}, '🎲 换一批')
  ));

  // 行程列表（逐时 + 微调）
  listBox = GG.el('div',{class:'stack'});
  itinerary.days.forEach((d,di)=>{
    const col = DAY_COLORS[di%DAY_COLORS.length];
    const theme = dayTheme(d.items);
    const dayCard = GG.el('div',{class:'card pad'},
      GG.el('div',{class:'row', style:{gap:'8px',alignItems:'center',marginBottom:'2px'}},
        GG.el('span',{style:{display:'inline-block',width:'12px',height:'12px',borderRadius:'50%',background:col}}),
        GG.el('div',{class:'section-t', style:{margin:'0'}}, 'Day '+d.day),
        theme ? GG.el('span',{class:'small muted'}, '· '+theme) : null)
    );
    const items = GG.el('div',{class:'stack', style:{gap:'10px',marginTop:'8px'}});
    d.items.forEach(it=>{
      const p = it.poi, locked = G.locked.has(p.id), tags = deriveTags(p);
      const row = GG.el('div',{class:'mt-item'+(locked?' locked':''), 'data-idx':String(it.idx),
        onClick:()=>focusItem(it.idx,'list'),
        onMouseenter:()=>hi(it.idx,true), onMouseleave:()=>{ if(activeIdx!==it.idx) hi(it.idx,false); }},
        GG.el('div',{class:'mt-badge', style:{background:col}}, String(it.idx)),
        GG.el('div',{style:{flex:'1',minWidth:'0'}},
          GG.el('div',{class:'row', style:{gap:'8px',flexWrap:'wrap',alignItems:'baseline'}},
            GG.el('span',{class:'small', style:{fontWeight:'700',color:'var(--ink-2)',minWidth:'34px'}}, it.slot),
            GG.el('span',{style:{fontWeight:'650',fontSize:'16px'}}, p.name),
            GG.el('span',{class:'small', style:{color:TYPE_COLOR[p.type]||'var(--ink-3)',fontWeight:'600'}}, p.type),
            GG.el('span',{class:'small muted'}, '· '+p.hours)),
          p.blurb ? GG.el('div',{class:'small muted', style:{marginTop:'3px'}}, p.blurb) : null,
          tags.length ? GG.el('div',{class:'row', style:{gap:'6px',marginTop:'6px',flexWrap:'wrap'}},
            tags.map(t=>GG.el('span',{class:'mt-tag'}, t))) : null
        ),
        GG.el('div',{class:'mt-acts'},
          actBtn('📌', locked?'已锁定·点击取消':'锁定必去（换一批时保留）', ()=>tweakLock(p.id), locked),
          actBtn('↻', '换一个', ()=>tweakSwap(p.id)),
          actBtn('✕', '删除', ()=>tweakDelete(p.id))
        )
      );
      items.appendChild(row);
    });
    dayCard.appendChild(items);
    listBox.appendChild(dayCard);
  });
  stage.appendChild(listBox);

  // AI 旅行贴士（连了 key 才出现）
  if(GG.llm.connected()){
    const userText = `城市：${cityName}\n行程：`+
      itinerary.days.map(d=>'Day'+d.day+'：'+d.items.map(it=>it.poi.name).join('→')).join('；')
      + (sel.constraints.trim()? `\n特殊要求：${sel.constraints.trim()}` : '');
    stage.appendChild(aiTipsBlock(userText));
  }

  // 分享卡
  const shareSpec = {
    slug: SLUG,
    title: `${cityName} ${itinerary.days.length} 天行程`,
    subtitle: `${PACE[sel.pace].label}节奏 · ${sel.interests.join(' / ')}`,
    tags: sel.interests,
    note: `共 ${itinerary.total} 个落脚点，按片区分 ${itinerary.days.length} 天、串顺路，编号与地图一一对应。`,
    rows: itinerary.days.map(d=>({ label:'Day '+d.day, value:d.items.map(it=>it.poi.name).join(' → ') }))
  };
  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '截图分享你的行程 ↓'), shareSpec));
  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; intro(); }}, '↻ 换城市 / 换偏好')
  ));

  ensureStyle();
}

let styled=false;
function ensureStyle(){
  if(styled) return; styled=true;
  const css = `
  .mt-item{display:flex;gap:12px;align-items:flex-start;padding:10px 12px;border:1px solid var(--line);
    border-radius:12px;cursor:pointer;transition:.14s;background:var(--surface)}
  .mt-item.on{border-color:var(--accent)!important;background:var(--accent-soft)!important;
    box-shadow:0 2px 10px rgba(20,20,30,.08)}
  .mt-item.on .mt-badge{transform:scale(1.12)}
  .mt-item.locked{border-color:var(--accent)}
  .mt-badge{flex:none;width:30px;height:30px;border-radius:50%;color:#fff;font-weight:700;
    display:flex;align-items:center;justify-content:center;font-size:14px;transition:.14s}
  .mt-tag{font-size:11.5px;color:var(--ink-3);background:rgba(20,20,30,.05);border-radius:999px;padding:2px 9px}
  .mt-acts{flex:none;display:flex;flex-direction:column;gap:5px}
  .mt-act{width:28px;height:26px;border:1px solid var(--line);background:var(--surface);border-radius:8px;
    cursor:pointer;font-size:13px;line-height:1;color:var(--ink-2);transition:.12s;padding:0}
  .mt-act:hover{border-color:var(--accent);color:var(--accent)}
  .mt-act.on{background:var(--accent);color:#fff;border-color:var(--accent)}
  .mt-pin .mt-pin-dot{transition:r .15s}
  .mt-map{touch-action:manipulation}
  @media (max-width:520px){ .mt-acts{flex-direction:row} }`;
  document.head.appendChild(GG.el('style',{html:css}));
}

start();
})();
