/* 今天吃什么 — 融合 app（原 ollie + mealplan + dinner 三合一）。
   一条主线：冰箱库存（智能冰箱传感器：摄像头识别 / 称重估量 / 气味判新鲜）。
   三个入口都读写这条主线：
     🍳 今晚  = 用冰箱现有的菜，优先用掉快坏的（原 ollie 引擎）
     📅 一周  = 目标/忌口 → 7 天计划 + 购物清单（自动减去冰箱已有；前两天先用快坏的）（原 mealplan 引擎）
     ✨ 灵感  = 一段美食帖 → 图文菜谱 + 冰箱缺料（原 dinner 引擎，离线示例可跑，连 key 解析任意帖子）
   闭环：做完一道 → 扣库存；买到了 → 回填冰箱；救回快坏的 → 本月「救回 ¥/kg」计数。
   本地即时算，连 GG.llm 才把「解析任意帖子 / AI 现想做法」升级成真模型；离线不破。 */
(function(){
const SLUG = 'dinner';
const F = window.FOOD;
const ING = F.ING, STAPLES = F.STAPLES;
const STORE = 'food_state_v1';
const DIFF = { easy:'简单', medium:'中等', hard:'有点挑战' };
const el = GG.el;

let main, modeMount;
let state = null;
let fridgeOpen = false, tonightSeed = 0, inspireText = '', inspireMount = null;
let weekPrefs = { goal:'均衡', avoids:[], taste:'均衡', seed:7 };

/* ════════ 作用域样式（精修门面 + 冰箱 + 三 mode + 菜谱页） ════════ */
function injectStyle(){
  if(document.getElementById('kt-style')) return;
  document.head.appendChild(el('style',{id:'kt-style', html:`
  .kt-welcome{text-align:center; padding:40px 0 20px; animation:kt-rise .5s cubic-bezier(.2,.7,.2,1) both}
  .kt-wbrand{display:inline-flex; align-items:center; gap:8px; font-weight:700; color:var(--accent);
    background:var(--accent-soft); padding:6px 16px; border-radius:999px; font-size:15px}
  .kt-wtitle{font-size:29px; font-weight:760; letter-spacing:-.6px; margin:20px auto 0; max-width:520px; line-height:1.25}
  .kt-wsub{color:var(--ink-2); font-size:15.5px; max-width:460px; margin:14px auto 0; line-height:1.6}
  .kt-wrow{display:flex; gap:12px; justify-content:center; flex-wrap:wrap; margin:26px 0}
  .kt-wfeat{flex:1; min-width:120px; max-width:160px; border:1px solid var(--line); border-radius:16px;
    padding:16px 12px; background:var(--surface); box-shadow:var(--sh-1)}
  .kt-wfeat .em{font-size:26px}
  .kt-wfeat .t{font-weight:680; margin-top:6px; font-size:15px}
  .kt-wfeat .s{color:var(--ink-3); font-size:12.5px; margin-top:3px; line-height:1.4}
  .kt-wprivacy{display:flex; gap:7px; justify-content:center; align-items:center; color:var(--ink-3);
    font-size:12.5px; margin-top:18px; max-width:440px; margin-left:auto; margin-right:auto; line-height:1.5}
  @keyframes kt-rise{from{opacity:0; transform:translateY(14px)}to{opacity:1; transform:none}}

  /* 冰箱常驻顶栏 */
  .kt-fridge{border:1px solid var(--line); border-radius:18px; background:linear-gradient(170deg,var(--accent-soft),var(--surface) 55%);
    padding:16px 17px; margin-top:18px; box-shadow:var(--sh-1)}
  .kt-fhead{display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap}
  .kt-ftitle{font-weight:730; font-size:17px; display:flex; align-items:center; gap:8px}
  .kt-fcount{font-size:12px; color:var(--ink-3); background:var(--surface); border:1px solid var(--line);
    border-radius:999px; padding:2px 9px; font-weight:600}
  .kt-fhead-r{display:flex; gap:6px}
  .kt-flink{border:none; background:none; color:var(--accent); font-weight:600; cursor:pointer; font-size:13px;
    font-family:inherit; padding:4px 6px; border-radius:8px}
  .kt-flink:hover{background:var(--accent-soft)}
  .kt-urgent{display:flex; align-items:center; gap:7px; flex-wrap:wrap; margin-top:12px}
  .kt-urgcap{font-size:11px; font-weight:800; letter-spacing:.05em; color:var(--bad);
    background:#fff; border:1px solid var(--bad); border-radius:999px; padding:2px 9px; flex:none}
  .kt-urgchip{font-size:12.5px; border-radius:999px; padding:4px 11px; font-weight:560; white-space:nowrap}
  .kt-urgchip.kt-red{background:rgba(216,80,63,.12); color:var(--bad); border:1px solid rgba(216,80,63,.3)}
  .kt-urgchip.kt-yellow{background:rgba(217,138,31,.12); color:var(--warn); border:1px solid rgba(217,138,31,.3)}
  .kt-sensor{font-size:11.5px; color:var(--ink-3); margin-top:11px; line-height:1.5}
  .kt-grid{display:grid; grid-template-columns:repeat(auto-fill,minmax(92px,1fr)); gap:11px; margin-top:14px}
  .kt-cell{border:1px solid var(--line); border-radius:14px; background:var(--surface); padding:11px 6px 9px;
    cursor:pointer; transition:.13s; text-align:center; animation:kt-pop .35s ease both; font-family:inherit}
  .kt-cell:hover{border-color:var(--ink-3); transform:translateY(-2px); box-shadow:var(--sh-1)}
  @keyframes kt-pop{from{opacity:0; transform:scale(.92)}to{opacity:1; transform:none}}
  .kt-ring{width:52px; height:52px; border-radius:50%; margin:0 auto; display:grid; place-items:center;
    background:var(--line-2)}
  .kt-ring .em{width:40px; height:40px; border-radius:50%; background:var(--surface); display:grid; place-items:center; font-size:21px}
  .kt-cellnm{font-size:13px; font-weight:600; margin-top:7px}
  .kt-cellq{font-size:11px; color:var(--ink-3); margin-top:1px}
  .kt-cellb{font-size:10.5px; font-weight:700; margin-top:4px; border-radius:999px; padding:1px 7px; display:inline-block}
  .kt-cellb.kt-red{background:rgba(216,80,63,.12); color:var(--bad)}
  .kt-cellb.kt-yellow{background:rgba(217,138,31,.12); color:var(--warn)}
  .kt-cellb.kt-green{background:rgba(46,158,123,.12); color:var(--good)}
  .kt-staples{grid-column:1/-1; font-size:12px; color:var(--ink-3); border-top:1px dashed var(--line);
    padding-top:10px; margin-top:2px; line-height:1.5}
  .kt-addrow{margin-top:12px}
  .small.btn,.btn.small{padding:7px 13px; font-size:13px}

  /* mode 切换 */
  .kt-nav{display:flex; gap:8px; margin-top:18px; flex-wrap:wrap; align-items:center}
  .kt-navpill{border:1px solid var(--line); background:var(--surface); color:var(--ink-2); cursor:pointer;
    font-family:inherit; font-size:14.5px; font-weight:600; padding:9px 16px; border-radius:999px; transition:.13s}
  .kt-navpill:hover{border-color:var(--ink-3)}
  .kt-navpill.on{background:var(--accent); border-color:var(--accent); color:#fff}
  .kt-cart{margin-left:auto; border:1px solid var(--line); background:var(--surface); cursor:pointer;
    font-family:inherit; font-size:16px; padding:8px 13px; border-radius:999px; position:relative; transition:.13s}
  .kt-cart:hover{border-color:var(--ink-3)}
  .kt-cart.on{border-color:var(--accent)}
  .kt-cartn{position:absolute; top:-5px; right:-5px; background:var(--bad); color:#fff; font-size:11px; font-weight:700;
    min-width:18px; height:18px; border-radius:999px; display:grid; place-items:center; padding:0 4px}

  .kt-h1{font-size:21px; font-weight:740; letter-spacing:-.3px; margin:24px 0 4px}
  .kt-h2{font-size:13px; font-weight:680; letter-spacing:.04em; text-transform:uppercase; color:var(--ink-3); margin:24px 0 12px}
  .kt-lede{color:var(--ink-2); font-size:14.5px; margin:6px 0 0; line-height:1.6}

  /* 今晚 hero */
  .kt-hero{display:flex; gap:16px; align-items:center; flex-wrap:wrap; border:1px solid var(--accent);
    border-radius:18px; padding:18px; margin-top:12px; background:linear-gradient(160deg,var(--accent-soft),var(--surface) 60%)}
  .kt-heroem{font-size:48px; flex:none; line-height:1}
  .kt-heroinfo{flex:1; min-width:180px}
  .kt-herotag{font-size:11.5px; font-weight:700; color:var(--accent); background:#fff; border:1px solid var(--accent);
    border-radius:999px; padding:2px 10px; display:inline-block}
  .kt-heroname{font-size:24px; font-weight:760; letter-spacing:-.4px; margin-top:7px}
  .kt-heroblurb{color:var(--ink-2); font-size:13.5px; margin-top:4px; line-height:1.5}
  .kt-herourg{color:var(--bad); font-size:13px; font-weight:600; margin-top:8px}
  .kt-heroacts{display:flex; gap:8px; flex-wrap:wrap; width:100%}
  .kt-insight{display:flex; align-items:center; gap:10px; flex-wrap:wrap; border:1px dashed var(--accent);
    background:var(--accent-soft); border-radius:12px; padding:11px 14px; margin-top:14px; font-size:13.5px; color:var(--ink)}
  .kt-ilink{border:none; background:none; color:var(--accent); font-weight:700; cursor:pointer; font-family:inherit;
    font-size:13px; text-decoration:underline; text-underline-offset:2px; padding:0; white-space:nowrap}
  .kt-dishlist{display:flex; flex-direction:column; gap:10px}
  .kt-dish{display:flex; align-items:center; gap:13px; border:1px solid var(--line); border-radius:14px;
    padding:13px 14px; background:var(--surface); cursor:pointer; transition:.13s}
  .kt-dish:hover{border-color:var(--ink-3); transform:translateY(-1px); box-shadow:var(--sh-1)}
  .kt-dishem{font-size:28px; flex:none}
  .kt-dishbody{flex:1; min-width:0}
  .kt-dishnm{font-size:16px; font-weight:650}
  .kt-drbadges{display:flex; gap:6px; flex-wrap:wrap; margin-top:6px}
  .kt-badge{font-size:11.5px; border-radius:999px; padding:2px 9px; font-weight:600; border:1px solid var(--line); color:var(--ink-3)}
  .kt-badge.ok{background:var(--accent-soft); color:var(--accent); border-color:transparent}
  .kt-badge.warn{background:rgba(217,138,31,.12); color:var(--warn); border-color:transparent}
  .kt-badge.urg{background:rgba(216,80,63,.12); color:var(--bad); border-color:transparent}
  .kt-drmiss{font-size:12.5px; color:var(--ink-3); margin-top:6px; display:flex; gap:8px; flex-wrap:wrap; align-items:center}
  .kt-dishgo{font-size:22px; color:var(--ink-3); flex:none}

  /* 一周 */
  .kt-prefs{display:flex; gap:7px; flex-wrap:wrap; align-items:center; margin-top:12px}
  .kt-prefsep{width:1px; height:20px; background:var(--line)}
  .kt-week{display:flex; flex-direction:column; gap:9px}
  .kt-wday{display:flex; gap:12px; align-items:flex-start; border:1px solid var(--line); border-radius:13px;
    padding:12px 14px; background:var(--surface); flex-wrap:wrap}
  .kt-wdaylabel{width:48px; flex:none; font-weight:700; color:var(--accent); font-size:14px; padding-top:4px}
  .kt-wmeals{flex:1; min-width:200px; display:flex; flex-direction:column; gap:7px}
  .kt-wmeal{display:flex; align-items:center; gap:9px; border:none; background:none; font-family:inherit; cursor:pointer;
    font-size:14.5px; text-align:left; padding:3px 0; color:var(--ink)}
  .kt-wmeal:hover{color:var(--accent)}
  .kt-wmeal.muted{color:var(--ink-3); cursor:default}
  .kt-wslot{font-size:11px; font-weight:600; color:var(--accent); background:var(--accent-soft); border-radius:999px;
    padding:2px 9px; flex:none}
  .kt-shopcat{font-weight:700; font-size:13.5px; margin:14px 0 8px}
  .kt-haveline{font-size:12.5px; color:var(--good); margin-top:14px; line-height:1.5;
    border-top:1px dashed var(--line); padding-top:11px}

  /* 灵感 */
  .kt-eglabel{font-size:13px; color:var(--ink-3); margin:16px 0 9px}
  .kt-egs{display:flex; flex-wrap:wrap; gap:9px}
  .kt-eg{border:1px solid var(--line); background:var(--surface); border-radius:999px; padding:9px 15px; cursor:pointer;
    font-size:14px; transition:.13s; display:inline-flex; align-items:center; gap:7px; font-family:inherit}
  .kt-eg:hover{border-color:var(--accent); color:var(--accent); transform:translateY(-1px)}
  .kt-eg .em{font-size:16px}
  .kt-inresult{margin-top:8px}

  /* 菜谱页 */
  .kt-recipe{border:1px solid var(--line); border-radius:16px; background:var(--surface); padding:20px;
    box-shadow:var(--sh-1); margin-top:16px; animation:kt-rise .4s cubic-bezier(.2,.7,.2,1) both}
  .kt-recipe.modal{margin-top:0; box-shadow:none; border:none; padding:4px}
  .kt-rhero{display:flex; gap:18px; align-items:center; flex-wrap:wrap}
  .kt-plate{width:140px; height:140px; flex:none}
  .kt-rinfo{flex:1; min-width:180px}
  .kt-rname{font-size:24px; font-weight:760; letter-spacing:-.4px; line-height:1.15}
  .kt-roneline{color:var(--ink-2); font-size:14px; margin-top:6px}
  .kt-rbadges{display:flex; gap:7px; flex-wrap:wrap; margin-top:11px}
  .kt-rbadge{font-size:12px; background:var(--accent-soft); color:var(--accent); border-radius:999px;
    padding:4px 11px; font-weight:600}
  .kt-rsource{border-left:3px solid var(--accent); background:#fbfbf9; padding:9px 13px; border-radius:0 10px 10px 0;
    color:var(--ink-2); font-size:13px; margin-top:14px; line-height:1.6}
  .kt-rsource b{color:var(--ink-3); font-weight:600; font-size:11px; display:block; margin-bottom:3px; letter-spacing:.04em}
  .kt-rdiff{margin-top:14px; border-radius:12px; padding:11px 14px; font-size:13.5px; display:flex; gap:10px;
    align-items:center; flex-wrap:wrap; line-height:1.5}
  .kt-rdiff.has{background:rgba(217,138,31,.1); color:var(--ink)}
  .kt-rdiff.ok{background:rgba(46,158,123,.1); color:var(--good); font-weight:600}
  .kt-rh{font-size:12.5px; font-weight:680; letter-spacing:.04em; text-transform:uppercase; color:var(--ink-3); margin:22px 0 0}
  .kt-rings{display:grid; grid-template-columns:repeat(auto-fill,minmax(140px,1fr)); gap:9px; margin-top:11px}
  .kt-ring2{display:flex; align-items:center; gap:9px; border:1px solid var(--line); border-radius:11px; padding:9px 11px; background:var(--surface)}
  .kt-ring2.have{border-color:var(--good); background:rgba(46,158,123,.06)}
  .kt-ring2 .em{font-size:20px; flex:none}
  .kt-ring2 .nm{font-size:13.5px; font-weight:550}
  .kt-ring2 .tag{margin-left:auto; font-size:11px; color:var(--ink-3); background:var(--line-2); border-radius:999px; padding:2px 8px; white-space:nowrap; flex:none}
  .kt-ring2 .tag.have{background:rgba(46,158,123,.14); color:var(--good); font-weight:600}
  .kt-rsteps{display:flex; flex-direction:column; gap:11px; margin-top:11px}
  .kt-step{display:flex; gap:13px; align-items:flex-start; border:1px solid var(--line); border-radius:13px; padding:13px 14px; background:var(--surface)}
  .kt-stepicon{width:44px; height:44px; flex:none; border-radius:11px; background:var(--accent-soft); color:var(--accent);
    display:flex; align-items:center; justify-content:center}
  .kt-stepicon svg{width:24px; height:24px}
  .kt-step .body{flex:1; min-width:0}
  .kt-step .t{font-weight:650; font-size:14.5px; display:flex; align-items:center; gap:8px; flex-wrap:wrap}
  .kt-step .no{color:var(--accent); font-weight:800; font-size:12.5px}
  .kt-step .min{font-size:11px; color:var(--ink-3); border:1px solid var(--line); border-radius:999px; padding:1px 8px; font-weight:500}
  .kt-step .d{font-size:13.5px; color:var(--ink-2); margin-top:5px; line-height:1.6}
  .kt-nosteps{font-size:13px; color:var(--ink-3); margin-top:12px; display:flex; gap:8px; align-items:center; flex-wrap:wrap}
  .kt-ractions{display:flex; gap:9px; flex-wrap:wrap; margin-top:18px; padding-top:15px; border-top:1px solid var(--line-2)}
  .kt-ractions .btn{flex:1; min-width:130px}

  /* overlay */
  .kt-ov{position:fixed; inset:0; background:rgba(20,20,30,.42); z-index:200; display:flex; align-items:flex-start;
    justify-content:center; padding:24px 16px; overflow-y:auto; animation:kt-fade .2s ease both}
  @keyframes kt-fade{from{opacity:0}to{opacity:1}}
  .kt-ovpanel{background:var(--surface); border-radius:18px; max-width:540px; width:100%; padding:20px;
    box-shadow:var(--sh-pop); margin:auto}
  .kt-ovtitle{font-size:18px; font-weight:730}
  .kt-ovsub{font-size:13px; color:var(--ink-3); margin-top:4px}
  .kt-ovacts{display:flex; gap:9px; flex-wrap:wrap; margin-top:14px}
  .kt-ovacts .btn{flex:1; min-width:120px}
  .kt-shareprev{margin:14px 0 4px; text-align:center}
  .kt-shareprev canvas{max-width:100%; height:auto; border:1px solid var(--line); border-radius:12px; box-shadow:var(--sh-1)}

  /* 救回 + 购物清单 */
  .kt-saved{display:flex; align-items:center; gap:18px; border:1px solid var(--line); border-radius:16px;
    background:linear-gradient(150deg,rgba(46,158,123,.1),var(--surface) 60%); padding:18px 20px; margin-top:6px; flex-wrap:wrap}
  .kt-savedl{text-align:center}
  .kt-savedbig{font-size:28px; font-weight:780; color:var(--good); letter-spacing:-.5px; line-height:1}
  .kt-savedsub{font-size:12px; color:var(--ink-3); margin-top:4px}
  .kt-saveddiv{width:1px; height:36px; background:var(--line)}
  .kt-savedshare{margin-left:auto; border:1px solid var(--line); background:var(--surface); cursor:pointer;
    font-family:inherit; font-size:13px; font-weight:600; color:var(--ink-2); padding:8px 14px; border-radius:999px}
  .kt-savedshare:hover{border-color:var(--good); color:var(--good)}
  .kt-shopitem{display:flex; align-items:center; gap:11px; padding:9px 2px; border-bottom:1px solid var(--line-2)}
  .kt-check{width:24px; height:24px; flex:none; border-radius:50%; border:1.5px solid var(--accent); background:none;
    color:var(--accent); cursor:pointer; font-size:11px; line-height:1; font-family:inherit}
  .kt-check:hover{background:var(--accent-soft)}
  .kt-shopnm{flex:1; font-size:14.5px}
  .kt-shopdel{border:none; background:none; color:var(--ink-3); cursor:pointer; font-size:18px; line-height:1; padding:4px 8px; font-family:inherit}
  .kt-shopdel:hover{color:var(--bad)}

  /* 兜底 */
  .kt-oops{text-align:center; padding:18px 0}
  .kt-oops .big{font-size:38px}
  .kt-oops h3{font-size:18px; margin:9px 0 6px}
  .kt-oops p{color:var(--ink-2); font-size:14px; margin:0 auto; max-width:420px; line-height:1.6}

  @media (max-width:520px){
    .kt-wtitle{font-size:24px}
    .kt-heroname{font-size:21px}
    .kt-heroem{font-size:40px}
    .kt-plate{width:110px; height:110px}
    .kt-ractions .btn,.kt-ovacts .btn{min-width:0}
    .kt-saved{gap:12px}
    .kt-savedbig{font-size:24px}
  }
  `}));
}

/* ════════ 状态 / localStorage ════════ */
function load(){ try{ return JSON.parse(localStorage.getItem(STORE)); }catch(e){ return null; } }
function save(){ try{ localStorage.setItem(STORE, JSON.stringify(state)); }catch(e){} }
function freshState(){
  return { fridge: F.FRIDGE_SEED.map(x=>Object.assign({}, x)),
    shopping:[], saved:{yuan:86, kg:3.2}, mode:'tonight', seen:true };
}

/* ════════ 新鲜度引擎 ════════ */
function shelfOf(key){ return (ING[key] && ING[key].shelf) || 14; }
function daysLeft(it){ return shelfOf(it.key) - (it.days||0); }
function band(it){
  if(it.staple) return null;
  const d = daysLeft(it);
  if(d<=1) return {k:'red',    txt: d<=0?'今天就该吃':'明天到期'};
  if(d<=3) return {k:'yellow', txt: d+' 天内吃掉'};
  return {k:'green', txt:'还新鲜'};
}
function bandColor(b){ return b? (b.k==='red'?'var(--bad)':b.k==='yellow'?'var(--warn)':'var(--good)') : 'var(--good)'; }
function ringPct(it){ const d=daysLeft(it), s=shelfOf(it.key); return Math.max(0, Math.min(100, Math.round(d/s*100))); }
function findItem(key){ return state.fridge.find(it=>it.key===key); }
function urgent(){
  return state.fridge.filter(it=>!it.staple && it.n>0)
    .map(it=>({it, b:band(it), d:daysLeft(it)}))
    .filter(o=>o.b && o.b.k!=='green').sort((a,b)=>a.d-b.d);
}
function urgentLabels(){ return urgent().map(o=>(ING[o.it.key]||{}).label).filter(Boolean); }
function fridgeKeySet(){
  const s=new Set(); state.fridge.forEach(it=>{ if(it.n>0) s.add(it.key); }); STAPLES.forEach(k=>s.add(k)); return s;
}

/* ════════ 名称/品类工具 ════════ */
function guessEmoji(name){
  for(const k in ING){ if(ING[k].label && name.indexOf(ING[k].label)>=0) return ING[k].emoji; }
  const map={鸡胸:'🍗',鸡腿:'🍗',鸡:'🍗',牛:'🐄',三文鱼:'🐟',鱼:'🐟',虾:'🦐',豆腐:'🧈',西兰花:'🥦',生菜:'🥬',
    菠菜:'🥬',面包:'🍞',米:'🍚',饭:'🍚',面:'🍜',燕麦:'🥣',牛奶:'🥛',酸奶:'🍶',香蕉:'🍌',蓝莓:'🫐',牛油果:'🥑',
    花生:'🥜',核桃:'🥜',玉米:'🌽',土豆:'🥔',洋葱:'🧅',胡萝卜:'🥕',番茄:'🍅',黄瓜:'🥒',青椒:'🫑',香菇:'🍄',
    蘑:'🍄',南瓜:'🎃',红薯:'🍠',排骨:'🍖',冬瓜:'🥒',芦笋:'🌿',藜麦:'🌾',蛋:'🥚'};
  for(const k in map){ if(name.indexOf(k)>=0) return map[k]; }
  return '🍽️';
}
function isCondiment(name){ return /盐|油|生抽|酱油|糖|醋|辣椒|花椒|胡椒|蒜|姜|葱|料酒|淀粉|蜂蜜|芝麻/.test(name); }
function nameInFridge(name){
  return state.fridge.some(it=>it.n>0 && ING[it.key] && ING[it.key].label && name.indexOf(ING[it.key].label)>=0)
    || STAPLES.some(k=> ING[k] && name.indexOf(ING[k].label)>=0);
}
function mapKey(name){ for(const k in ING){ if(ING[k].label && name.indexOf(ING[k].label)>=0) return k; } return null; }
function guessCat(name){
  const k=mapKey(name); if(k) return ING[k].cat;
  if(isCondiment(name)) return '调料';
  if(/肉|鱼|虾|蛋|豆腐|排骨/.test(name)) return '蛋白';
  if(/饭|面|米|包|麦|薯|粉/.test(name)) return '主食';
  return '蔬菜';
}

/* ════════ 今晚引擎（原 ollie，读冰箱） ════════ */
function cookFromFridge(){
  const have = fridgeKeySet();
  return F.RECIPES.map(r=>{
    const missing  = r.need.filter(k=>!have.has(k));
    const useKeys  = r.need.filter(k=>have.has(k));
    const urgentUse= useKeys.filter(k=>{ const it=findItem(k); return it && !it.staple && band(it) && band(it).k!=='green'; });
    return { r, missing, useKeys, urgentUse };
  })
  .filter(d=>d.missing.length<=2)
  .sort((a,b)=> (b.urgentUse.length>0)-(a.urgentUse.length>0)
    || a.missing.length-b.missing.length
    || b.urgentUse.length-a.urgentUse.length
    || b.useKeys.length-a.useKeys.length);
}
function unlockInsight(){
  const have = fridgeKeySet();
  const now = F.RECIPES.filter(r=>r.need.every(k=>have.has(k))).length;
  const gain={};
  F.RECIPES.forEach(r=>{ const miss=r.need.filter(k=>!have.has(k)); if(miss.length===1) gain[miss[0]]=(gain[miss[0]]||0)+1; });
  let best=null; Object.keys(gain).forEach(k=>{ if(!best||gain[k]>gain[best]) best=k; });
  if(!best || gain[best]<2) return null;
  return { key:best, now, after:now+gain[best], add:gain[best] };
}

/* ════════ 一周引擎（原 mealplan，尊重冰箱） ════════ */
function availableMeals(meal, goal, avoids){
  const veg = avoids.includes('素食');
  const banMap={'不吃辣':'辣','无麸质':'麸质','不吃海鲜':'海鲜','不喝牛奶':'牛奶','无坚果':'坚果'};
  const banTags = avoids.map(a=>banMap[a]).filter(Boolean);
  return F.MEALS.filter(m=>m.meal===meal).filter(m=>{
    if(veg && !m.tags.includes('素')) return false;
    if(m.tags.some(t=>banTags.includes(t))) return false;
    return true;
  });
}
function mealUsesUrgent(m){ const u=urgentLabels(); return m.ingredients.some(ig=>u.some(lbl=>ig.name.indexOf(lbl)>=0)); }
function planSlot(pool, goal, taste, seed, biasUrgent){
  if(!pool.length) return [];
  const rnd=GG.rng(seed); const out=[]; let prev=null, prev2=null;
  for(let d=0; d<7; d++){
    const scored=pool.map(m=>{
      let s=(m.goalFit[goal]||0)*3;
      if(taste==='重口' && m.tags.includes('辣')) s+=2;
      if(taste==='清淡' && m.tags.includes('辣')) s-=2;
      if(biasUrgent && d<2 && mealUsesUrgent(m)) s+=6;
      s+=rnd()*4; if(m===prev) s-=100; if(m===prev2) s-=6;
      return {m,s};
    }).sort((a,b)=>b.s-a.s);
    const pick=scored[0].m; out.push(pick); prev2=prev; prev=pick;
  }
  return out;
}
function buildWeek(p){
  const days=['第1天','第2天','第3天','第4天','第5天','第6天','第7天'];
  const b =planSlot(availableMeals('早',p.goal,p.avoids), p.goal,p.taste, p.seed+':b', false);
  const l =planSlot(availableMeals('午',p.goal,p.avoids), p.goal,p.taste, p.seed+':l', true);
  const dn=planSlot(availableMeals('晚',p.goal,p.avoids), p.goal,p.taste, p.seed+':d', true);
  return { useLunch:true, plan: days.map((label,i)=>({label, 早:b[i]||null, 午:l[i]||null, 晚:dn[i]||null})) };
}
function weekShopping(plan){
  const acc={};
  plan.forEach(day=>['早','午','晚'].forEach(s=>{ const m=day[s]; if(!m) return;
    m.ingredients.forEach(ig=>{ acc[ig.name]=acc[ig.name]||{cat:ig.cat, n:0, has:nameInFridge(ig.name)}; acc[ig.name].n++; }); }));
  const need=[], own=[];
  Object.keys(acc).forEach(name=>{ const o=acc[name]; (o.has?own:need).push({name, cat:o.cat, n:o.n}); });
  return {need, own};
}

/* ════════ 菜谱归一化（三个来源 → 同一形状） ════════ */
function iconFor(t){
  t=String(t);
  if(/腌|拌|抓匀|调成|压成泥|打散/.test(t)) return 'mix';
  if(/切|拍|剥|备料/.test(t)) return 'knife';
  if(/炸|煎|爆炒|颠炒|快炒/.test(t)) return 'pan';
  if(/煮|炖|焖|烫|熬|汤/.test(t)) return 'pot';
  if(/烤|蒸/.test(t)) return 'oven';
  if(/淋|收汁|大火|爆香/.test(t)) return 'flame';
  if(/撒|出锅|装盘|盛出|铺|码|浇/.test(t)) return 'plate';
  if(/静置|泡|等|计时/.test(t)) return 'timer';
  return 'pan';
}
function recipeFromOllie(d){
  const r=d.r, have=fridgeKeySet();
  return {
    is_food:true, dish_name:r.name, one_line:r.blurb, time_minutes:r.minutes,
    servings:2, difficulty:null, source:'tonight', source_snippet:'',
    ingredients: r.need.map(k=>{ const m=ING[k]||{}; return {name:m.label||k, emoji:m.emoji||'🍽️', key:k, have:have.has(k), amount:''}; }),
    steps: r.steps.map(s=>({title:s, detail:'', minutes:null, icon:iconFor(s)}))
  };
}
function recipeFromMeal(m){
  return {
    is_food:true, dish_name:m.name, one_line:weekTagline(m), time_minutes:null, servings:1, difficulty:null,
    source:'week', source_snippet:'',
    ingredients: m.ingredients.map(x=>({name:x.name, emoji:guessEmoji(x.name), have:nameInFridge(x.name), amount:''})),
    steps:[]
  };
}
function weekTagline(m){
  const t=[]; if(m.tags.includes('素')) t.push('素'); if(m.tags.includes('辣')) t.push('微辣');
  const best=Object.keys(m.goalFit).filter(g=>m.goalFit[g]===2)[0]; if(best) t.push('适合'+best);
  return t.join(' · ') || '家常一餐';
}
function normalizeRecipe(d, source){
  d=d||{};
  const ICONSET=['knife','pan','pot','oven','mix','timer','plate','flame'];
  const ings=(Array.isArray(d.ingredients)?d.ingredients:[]).filter(x=>x&&x.name).map(x=>({
    name:String(x.name), amount:x.amount?String(x.amount):'', emoji:(x.emoji&&String(x.emoji))||guessEmoji(String(x.name)),
    have:nameInFridge(String(x.name))
  }));
  const steps=(Array.isArray(d.steps)?d.steps:[]).filter(x=>x&&(x.title||x.detail)).map(x=>({
    title:String(x.title||''), detail:String(x.detail||''),
    minutes:(x.minutes==null||x.minutes==='')?null:(parseInt(x.minutes,10)||null),
    icon:ICONSET.includes(x.icon)?x.icon:iconFor(String(x.title)+String(x.detail))
  }));
  return {
    is_food: d.is_food!==false, dish_name:(d.dish_name&&String(d.dish_name))||'未命名料理',
    one_line:d.one_line?String(d.one_line):'', servings:parseInt(d.servings,10)||null,
    time_minutes:parseInt(d.time_minutes,10)||null, difficulty:DIFF[d.difficulty]?d.difficulty:null,
    ingredients:ings, steps, source_snippet:d.source_snippet?String(d.source_snippet):'', source
  };
}
function missingForRecipe(rec){ return rec.ingredients.filter(ig=>!ig.have && !isCondiment(ig.name)); }

/* ════════ 库存变更（闭环） ════════ */
function cookDish(rec){
  let savedYuan=0, savedKg=0; const savedNames=[];
  rec.ingredients.forEach(ig=>{
    let it = ig.key ? findItem(ig.key) : state.fridge.find(f=>ING[f.key] && ING[f.key].label && ig.name.indexOf(ING[f.key].label)>=0);
    if(!it || it.staple || it.n<=0) return;
    const wasUrgent = band(it) && band(it).k!=='green';
    it.n -= 1;
    if(it.n<=0){
      if(wasUrgent){ const m=ING[it.key]||{}; savedYuan += m.price||0; savedKg += (m.g||0)/1000; savedNames.push(m.label||it.key); }
      state.fridge = state.fridge.filter(f=>f!==it);
    }
  });
  state.saved.yuan = Math.round((state.saved.yuan + savedYuan)*10)/10;
  state.saved.kg   = Math.round((state.saved.kg + savedKg)*10)/10;
  save();
  return { savedYuan, savedKg, savedNames };
}
function addToShopping(items){
  items.forEach(x=>{
    const name=typeof x==='string'?x:x.name;
    const cat=(typeof x==='object'&&x.cat)||guessCat(name);
    const ex=state.shopping.find(s=>s.name===name);
    if(ex) ex.n=(ex.n||1)+1; else state.shopping.push({name, cat, n:1});
  });
  save();
}
function buyItem(s){
  const key=mapKey(s.name);
  if(key){ const ex=findItem(key); if(ex){ ex.n+=(s.n||1); ex.days=0; } else state.fridge.push({key, n:s.n||1, unit:'新买', days:0}); }
  state.shopping=state.shopping.filter(x=>x!==s);
  save();
}

/* ════════ 视觉：插画盘 + 步骤图标（复用 dinner 的画法） ════════ */
const PAL=['#e9a23b','#d9542e','#7fae3a','#c0392b','#e07b39','#b5651d','#8fbf5a','#e8c34a','#cf6f3a','#6aa84f'];
function plateColors(seed){ return GG.shuffle(PAL, GG.hash('p'+seed)).slice(0,4); }
let _pid=0;
function plateSVG(name, ings){
  const id='ktp'+(++_pid), cols=plateColors(name||'x'), rnd=GG.rng(GG.hash('b'+(name||'')));
  let blobs='';
  for(let i=0;i<4;i++){
    const ang=(i/4)*Math.PI*2+rnd()*1.4, dist=12+rnd()*22;
    const cx=74+Math.cos(ang)*dist, cy=74+Math.sin(ang)*dist;
    const rx=18+rnd()*16, ry=14+rnd()*13, rot=Math.floor(rnd()*180);
    blobs+='<ellipse cx="'+cx.toFixed(1)+'" cy="'+cy.toFixed(1)+'" rx="'+rx.toFixed(1)+'" ry="'+ry.toFixed(1)+
      '" fill="'+cols[i]+'" opacity=".9" transform="rotate('+rot+' '+cx.toFixed(1)+' '+cy.toFixed(1)+')"/>';
  }
  const em=(ings&&ings[0]&&ings[0].emoji)||'🍽️', em2=(ings&&ings[2]&&ings[2].emoji)||'';
  return '<svg class="kt-plate" viewBox="0 0 148 148" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="'+(name||'料理')+' 示意图">'+
    '<defs><clipPath id="'+id+'"><circle cx="74" cy="74" r="50"/></clipPath></defs>'+
    '<circle cx="74" cy="74" r="63" fill="#fff" stroke="var(--line)" stroke-width="2"/>'+
    '<circle cx="74" cy="74" r="52" fill="#faf6f0" stroke="var(--line-2)" stroke-width="1"/>'+
    '<g clip-path="url(#'+id+')">'+blobs+'</g>'+
    '<circle cx="74" cy="74" r="52" fill="none" stroke="rgba(0,0,0,.04)" stroke-width="1"/>'+
    '<text x="60" y="90" font-size="34" text-anchor="middle">'+em+'</text>'+
    (em2?'<text x="98" y="64" font-size="24" text-anchor="middle" opacity=".95">'+em2+'</text>':'')+
    '</svg>';
}
const ICONS={
  knife:'<path d="M4 20 17 7"/><path d="M14.5 3.8c2.4-1 4.8.6 4.8 3.4 0 2.6-2.4 4-4.8 3"/><path d="M4 20l-1.4 1.4"/>',
  pan:'<path d="M3 12.5h13a0 0 0 0 1 0 0 6.5 6.5 0 0 1-13 0z"/><path d="M16 12.5h5.5"/><path d="M7 6l1.4 1.4M11 5l1.4 1.4"/>',
  pot:'<path d="M5.5 10.5h13v5.5a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3z"/><path d="M3.5 10.5h17"/><path d="M9.5 6.5c0-1.2.6-1.8 0-3M14.5 6.5c0-1.2.6-1.8 0-3"/>',
  oven:'<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 9.2h16"/><circle cx="7.5" cy="6.6" r=".7"/><circle cx="10.5" cy="6.6" r=".7"/><path d="M8.5 13.5h7"/>',
  mix:'<path d="M5 11a7 4.2 0 0 0 14 0z"/><path d="M5 11h14"/><path d="M15.5 11 18 3.5"/>',
  timer:'<circle cx="12" cy="13.5" r="7.2"/><path d="M12 13.5V9.3"/><path d="M9.4 3.2h5.2"/><path d="M18.5 7 20 5.5"/>',
  plate:'<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.2"/>',
  flame:'<path d="M12 3.2c1.2 4.2 5 5.2 5 9.3a5 5 0 0 1-10 0c0-2 1-3.2 2.1-4.2.4 2 2 2.2 3 1.1-1.1-2.1.1-4.3-.1-6.2z"/>'
};
function icon(name){
  const p=ICONS[name]||ICONS.pan;
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+p+'</svg>';
}
function drawPlate(ctx,cx,cy,r,rec){
  ctx.save();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx,cy,r,0,7); ctx.fill();
  ctx.lineWidth=2; ctx.strokeStyle='#e7e7e3'; ctx.stroke();
  const inner=r-9;
  ctx.fillStyle='#faf6f0'; ctx.beginPath(); ctx.arc(cx,cy,inner,0,7); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,inner,0,7); ctx.clip();
  const cols=plateColors(rec.dish_name||'x'), rnd=GG.rng(GG.hash('b'+(rec.dish_name||'')));
  for(let i=0;i<4;i++){
    const ang=(i/4)*Math.PI*2+rnd()*1.4, dist=inner*(0.12+rnd()*0.34);
    const x=cx+Math.cos(ang)*dist, yy=cy+Math.sin(ang)*dist;
    const rx=inner*(0.30+rnd()*0.22), ry=inner*(0.24+rnd()*0.18);
    ctx.save(); ctx.translate(x,yy); ctx.rotate(rnd()*Math.PI);
    ctx.fillStyle=cols[i]; ctx.globalAlpha=.9; ctx.beginPath(); ctx.ellipse(0,0,rx,ry,0,0,7); ctx.fill(); ctx.restore();
  }
  ctx.restore();
  const em=(rec.ingredients&&rec.ingredients[0]&&rec.ingredients[0].emoji)||'🍽️';
  ctx.font=Math.round(r*0.6)+'px "Segoe UI Emoji","Apple Color Emoji",system-ui';
  ctx.textAlign='center'; ctx.globalAlpha=1; ctx.fillText(em, cx-r*0.1, cy+r*0.22); ctx.textAlign='left';
  ctx.restore();
}
function buildRecipeCanvas(rec){
  const accent=GG.meta(SLUG).accent||'#e0651f';
  const SOFT=GG._soft(accent).replace('.10','.16');
  const W=720, PAD=48, scale=2, innerW=W-PAD*2;
  const plateD=150, gap=22, rightX=PAD+plateD+gap, rightW=innerW-plateD-gap;
  const Ff=(w,s)=>w+' '+s+'px "PingFang SC","Microsoft YaHei",system-ui,sans-serif';
  const meas=document.createElement('canvas').getContext('2d');
  function wrap(text,font,maxW){ meas.font=font; const out=[]; let cur='';
    for(const ch of String(text)){ if(ch==='\n'){out.push(cur);cur='';continue;}
      if(meas.measureText(cur+ch).width>maxW && cur){ out.push(cur); cur=ch; } else cur+=ch; }
    if(cur) out.push(cur); return out; }
  const titleLines=wrap(rec.dish_name, Ff(750,30), rightW);
  const oneLines=rec.one_line? wrap(rec.one_line, Ff(400,15), rightW):[];
  const srcLines=rec.source_snippet? wrap('“'+rec.source_snippet+'”', Ff(400,15), innerW):[];
  const s0=rec.steps[0]||null;
  const stepLines=s0? wrap(s0.detail||s0.title||'', Ff(400,15), innerW).slice(0,2):[];
  const badges=[]; if(rec.servings) badges.push(rec.servings+' 人份'); if(rec.time_minutes) badges.push(rec.time_minutes+' 分钟'); if(rec.difficulty) badges.push(DIFF[rec.difficulty]);
  const headH=Math.max(plateD, 8+titleLines.length*36+(oneLines.length?8+oneLines.length*22:0)+24+24);
  let H=PAD+22+10+headH+8;
  if(srcLines.length) H+=srcLines.length*24+14;
  H+=25; if(s0) H+=20+24+stepLines.length*22+12; H+=10+24+PAD+6; H=Math.round(H);
  const cv=document.createElement('canvas'); cv.width=W*scale; cv.height=H*scale; cv.style.width=W+'px'; cv.style.height=H+'px';
  const ctx=cv.getContext('2d'); ctx.scale(scale,scale); ctx.textBaseline='alphabetic';
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,W,H); ctx.fillStyle=accent; ctx.fillRect(0,0,W,8);
  let y=PAD; const brand='🍲 今天吃什么';
  ctx.font=Ff(700,15); ctx.fillStyle=accent; ctx.fillText(brand, PAD, y+16);
  const bw=ctx.measureText(brand).width; ctx.font=Ff(400,13); ctx.fillStyle='#8a8a93';
  ctx.fillText('冰箱有啥就做啥', PAD+bw+12, y+16); y+=32;
  const headTop=y; drawPlate(ctx, PAD+plateD/2, headTop+plateD/2, plateD/2-4, rec);
  let ty=headTop; ctx.fillStyle='#1d1d1f'; ctx.font=Ff(750,30);
  for(const ln of titleLines){ ty+=36; ctx.fillText(ln, rightX, ty); }
  if(oneLines.length){ ty+=8; ctx.fillStyle='#55555c'; ctx.font=Ff(400,15); for(const ln of oneLines){ ty+=22; ctx.fillText(ln, rightX, ty); } }
  ty+=26; { let bx=rightX; ctx.font=Ff(600,13);
    for(const b of badges){ const w=ctx.measureText(b).width+22; ctx.fillStyle=SOFT; GG._round(ctx,bx,ty-15,w,24,12); ctx.fill();
      ctx.fillStyle=accent; ctx.fillText(b,bx+11,ty+1); bx+=w+8; } }
  y=headTop+headH+8;
  if(srcLines.length){ const blockH=srcLines.length*24; ctx.fillStyle=accent; ctx.fillRect(PAD,y,3,blockH);
    ctx.fillStyle='#55555c'; ctx.font=Ff(400,15); let sy=y+17; for(const ln of srcLines){ ctx.fillText(ln, PAD+13, sy); sy+=24; } y+=blockH+14; }
  ctx.strokeStyle='#f0f0ec'; ctx.beginPath(); ctx.moveTo(PAD,y); ctx.lineTo(PAD+innerW,y); ctx.stroke(); y+=25;
  if(s0){ ctx.fillStyle=accent; ctx.font=Ff(700,13); ctx.fillText('第一步', PAD, y); y+=20;
    ctx.fillStyle='#1d1d1f'; ctx.font=Ff(650,16); ctx.fillText('① '+(s0.title||''), PAD, y); y+=24;
    ctx.fillStyle='#55555c'; ctx.font=Ff(400,15); for(const ln of stepLines){ ctx.fillText(ln, PAD, y); y+=22; } y+=12; }
  ctx.strokeStyle='#f0f0ec'; ctx.beginPath(); ctx.moveTo(PAD,y); ctx.lineTo(PAD+innerW,y); ctx.stroke(); y+=22;
  ctx.fillStyle='#b0b0b8'; ctx.font=Ff(400,12); ctx.fillText('今天吃什么 · 好玩的东西', PAD, y);
  ctx.fillStyle=accent; ctx.font=Ff(600,13); ctx.textAlign='right'; ctx.fillText('把冰箱交给它，少点浪费 →', PAD+innerW, y); ctx.textAlign='left';
  return cv;
}

/* ════════ overlay ════════ */
function overlay(node){
  const ov=el('div',{class:'kt-ov', onClick:(e)=>{ if(e.target===ov) ov.remove(); }});
  ov.appendChild(el('div',{class:'kt-ovpanel'}, node,
    el('button',{class:'btn ghost block', style:{marginTop:'12px'}, onClick:()=>ov.remove()}, '关闭')));
  document.body.appendChild(ov); return ov;
}
function closeOverlays(){ GG.$$('.kt-ov').forEach(o=>o.remove()); }

/* ════════ 启动 / 欢迎门面 ════════ */
function start(){
  main = GG.mountShell(SLUG);
  injectStyle();
  state = load();
  if(!state){ welcome(); } else { app(); }
}
function welcome(){
  GG.clear(main);
  main.appendChild(el('div',{class:'kt-welcome'},
    el('div',{class:'kt-wbrand'}, el('span',null,'🧊'), el('span',null,'今天吃什么')),
    el('div',{class:'kt-wtitle'}, '打开冰箱前，它已经替你想好今晚吃什么'),
    el('p',{class:'kt-wsub'}, '一台看得见里面的冰箱：知道你有什么、哪样快坏了。今晚做什么、排一周、刷到的帖子照着做——都从这一个地方开始。'),
    el('div',{class:'kt-wrow'},
      wfeat('🍳','今晚','用现有的，先吃快坏的'),
      wfeat('📅','一周','排好计划，只买缺的'),
      wfeat('✨','灵感','一段帖子变成一道菜')),
    el('button',{class:'btn primary lg', onClick:enter}, '打开我的冰箱 →'),
    el('div',{class:'kt-wprivacy'}, el('span',null,'🔒'), el('span',null,'演示用的虚拟冰箱，数据只存在你这台浏览器，里面的东西随便改。'))
  ));
}
function wfeat(em,t,s){ return el('div',{class:'kt-wfeat'}, el('div',{class:'em'},em), el('div',{class:'t'},t), el('div',{class:'s'},s)); }
function enter(){ state = state || freshState(); state.seen=true; save(); app(); }

/* ════════ 主框架 ════════ */
function app(){
  GG.clear(main);
  main.appendChild(fridgeHeader());
  main.appendChild(modeNav());
  modeMount = el('div'); main.appendChild(modeMount);
  renderMode();
}
function modeNav(){
  const nav=el('div',{class:'kt-nav'});
  [['tonight','🍳 今晚'],['week','📅 一周'],['inspire','✨ 灵感']].forEach(pair=>{
    nav.appendChild(el('button',{class:'kt-navpill'+(state.mode===pair[0]?' on':''),
      onClick:()=>{ state.mode=pair[0]; save(); app(); }}, pair[1]));
  });
  const n=state.shopping.reduce((a,s)=>a+(s.n||1),0);
  nav.appendChild(el('button',{class:'kt-cart'+(state.mode==='shop'?' on':''),
    onClick:()=>{ state.mode='shop'; save(); app(); }}, '🛒', n?el('span',{class:'kt-cartn'}, String(n)):null));
  return nav;
}
function renderMode(){
  GG.clear(modeMount);
  if(state.mode==='week') renderWeek(modeMount);
  else if(state.mode==='inspire') renderInspire(modeMount);
  else if(state.mode==='shop') renderShopping(modeMount);
  else renderTonight(modeMount);
}

/* ════════ 冰箱常驻顶栏 ════════ */
function fridgeHeader(){
  const wrap=el('div',{class:'kt-fridge'});
  const items=state.fridge.filter(it=>!it.staple && it.n>0);
  const urg=urgent();
  wrap.appendChild(el('div',{class:'kt-fhead'},
    el('div',{class:'kt-ftitle'}, '🧊 我的冰箱', el('span',{class:'kt-fcount'}, items.length+' 样')),
    el('div',{class:'kt-fhead-r'},
      el('button',{class:'kt-flink', onClick:rescan}, '↻ 重新识别'),
      el('button',{class:'kt-flink', onClick:()=>{ fridgeOpen=!fridgeOpen; app(); }}, fridgeOpen?'收起':'查看全部'))
  ));
  if(urg.length){
    const rail=el('div',{class:'kt-urgent'});
    rail.appendChild(el('span',{class:'kt-urgcap'}, '先吃我'));
    urg.slice(0,6).forEach(o=>{ const m=ING[o.it.key]||{};
      rail.appendChild(el('span',{class:'kt-urgchip kt-'+o.b.k}, (m.emoji||'')+' '+(m.label||o.it.key)+' · '+o.b.txt)); });
    wrap.appendChild(rail);
  }
  wrap.appendChild(el('div',{class:'kt-sensor'}, '📷 摄像头识别品类 · ⚖️ 称重估余量 · 🌡️ 气味传感判新鲜 —— 自动盘点，你什么都不用输'));
  if(fridgeOpen) wrap.appendChild(fridgeGrid());
  return wrap;
}
function rescan(){ GG.toast('📷 关门——冰箱重新认了一遍 ✓'); app(); }
function fridgeGrid(){
  const box=el('div');
  const grid=el('div',{class:'kt-grid'});
  state.fridge.filter(it=>!it.staple && it.n>0).sort((a,b)=>daysLeft(a)-daysLeft(b)).forEach(it=>{
    const m=ING[it.key]||{}, b=band(it);
    grid.appendChild(el('button',{class:'kt-cell', onClick:()=>itemMenu(it)},
      el('div',{class:'kt-ring', style:{background:'conic-gradient('+bandColor(b)+' '+ringPct(it)+'%, var(--line-2) 0)'}}, el('span',{class:'em'}, m.emoji||'🍽️')),
      el('div',{class:'kt-cellnm'}, m.label||it.key),
      el('div',{class:'kt-cellq'}, it.unit||('×'+it.n)),
      b? el('div',{class:'kt-cellb kt-'+b.k}, b.txt):null
    ));
  });
  const staples=state.fridge.filter(it=>it.staple && it.n>0).map(it=>(ING[it.key]||{}).label).filter(Boolean);
  if(staples.length) grid.appendChild(el('div',{class:'kt-staples'}, '🧂 常备调料：'+staples.join(' · ')));
  box.appendChild(grid);
  box.appendChild(el('div',{class:'kt-addrow'}, el('button',{class:'btn ghost small', onClick:addItemPrompt}, '＋ 手动加一样')));
  return box;
}
function itemMenu(it){
  const m=ING[it.key]||{}, b=band(it);
  const ov=overlay(el('div',null,
    el('div',{class:'kt-ovtitle'}, (m.emoji||'')+' '+(m.label||it.key)),
    el('div',{class:'kt-ovsub'}, '现在 '+(it.unit||('×'+it.n))+' · '+(b?b.txt:'新鲜')),
    el('div',{class:'kt-ovacts'},
      el('button',{class:'btn', onClick:()=>{ it.n=Math.max(0,it.n-1); if(it.n<=0) state.fridge=state.fridge.filter(f=>f!==it); save(); ov.remove(); app(); }}, '用掉一些'),
      el('button',{class:'btn', onClick:()=>{ it.days=0; save(); GG.toast('标记为刚补的 ✓'); ov.remove(); app(); }}, '刚补·标新鲜'),
      el('button',{class:'btn ghost', onClick:()=>{ state.fridge=state.fridge.filter(f=>f!==it); save(); ov.remove(); app(); }}, '扔了'))
  ));
}
function addItemPrompt(){
  const present=new Set(state.fridge.map(f=>f.key));
  const chips=el('div',{class:'chips'});
  Object.keys(ING).filter(k=>!present.has(k) && !STAPLES.includes(k)).forEach(k=>{ const m=ING[k];
    chips.appendChild(el('button',{class:'chip', onClick:()=>{ state.fridge.push({key:k,n:1,unit:'新加',days:0}); save(); closeOverlays(); app(); }}, (m.emoji||'')+' '+m.label)); });
  overlay(el('div',null, el('div',{class:'kt-ovtitle'},'加点什么进冰箱'), el('div',{class:'kt-ovsub'},'（这些你冰箱里现在没有）'), el('div',{style:{marginTop:'12px'}}, chips)));
}

/* ════════ mode：今晚 ════════ */
function renderTonight(mount){
  const dishes=cookFromFridge();
  mount.appendChild(el('div',{class:'kt-h1'}, '🍳 今晚吃什么'));
  if(dishes.length){
    const hero=dishes[tonightSeed % dishes.length], r=hero.r;
    mount.appendChild(el('div',{class:'kt-hero'},
      el('div',{class:'kt-heroem'}, r.emoji),
      el('div',{class:'kt-heroinfo'},
        el('div',{class:'kt-herotag'}, hero.missing.length? ('差 '+hero.missing.length+' 样就能做') : '现在就能做'),
        el('div',{class:'kt-heroname'}, r.name),
        el('div',{class:'kt-heroblurb'}, r.blurb),
        hero.urgentUse.length? el('div',{class:'kt-herourg'}, '🔴 '+heroUrgentText(hero)):null),
      el('div',{class:'kt-heroacts'},
        el('button',{class:'btn primary', onClick:()=>openRecipe(recipeFromOllie(hero))}, '照着做 →'),
        el('button',{class:'btn', onClick:()=>{ tonightSeed++; renderMode(); }}, '换一个'))
    ));
  } else {
    mount.appendChild(el('div',{class:'card pad muted'}, '冰箱快空了——去「灵感」贴个帖子，或在「一周」排个购物清单补点货。'));
  }
  mount.appendChild(GG.llm.bar(()=>renderMode()));
  if(GG.llm.connected()){
    mount.appendChild(el('button',{class:'btn block', style:{marginTop:'10px'}, onClick:aiTonight}, '✨ 让 AI 用我冰箱里的，现想一道'));
  }
  const ins=unlockInsight();
  if(ins){ const m=ING[ins.key]||{};
    mount.appendChild(el('div',{class:'kt-insight'},
      el('span',null, '💡 再买 '+(m.emoji||'')+(m.label||ins.key)+'，今晚能做的从 '+ins.now+' 道 → '+ins.after+' 道'),
      el('button',{class:'kt-ilink', onClick:()=>{ addToShopping([{name:m.label||ins.key, cat:m.cat}]); GG.toast('已加入购物清单 🛒'); app(); }}, '加入清单')));
  }
  mount.appendChild(el('div',{class:'kt-h2'}, '冰箱现在能配出的菜 · '+dishes.length+' 道'));
  const list=el('div',{class:'kt-dishlist'});
  dishes.slice(0,10).forEach(d=>list.appendChild(dishRow(d)));
  mount.appendChild(list);
}
function urgPhrase(it){ const d=daysLeft(it); return d<=0?'今天该吃的':(d===1?'明天到期的':'这两天得吃的'); }
function heroUrgentText(hero){
  const k=hero.urgentUse.slice().sort((a,b)=>{ const ia=findItem(a),ib=findItem(b);
    return (ia?daysLeft(ia):99)-(ib?daysLeft(ib):99); })[0];
  const m=ING[k]||{}, it=findItem(k);
  return '正好用掉'+(it?urgPhrase(it):'快到期的')+(m.label||k);
}
function dishRow(d){
  const r=d.r, now=d.missing.length===0;
  const row=el('div',{class:'kt-dish', onClick:()=>openRecipe(recipeFromOllie(d))},
    el('span',{class:'kt-dishem'}, r.emoji),
    el('div',{class:'kt-dishbody'},
      el('div',{class:'kt-dishnm'}, r.name),
      el('div',{class:'kt-drbadges'},
        now? el('span',{class:'kt-badge ok'},'✓ 现在能做') : el('span',{class:'kt-badge warn'},'差 '+d.missing.length+' 样'),
        el('span',{class:'kt-badge'}, '⏱ '+r.minutes+' 分钟'),
        d.urgentUse.length? el('span',{class:'kt-badge urg'}, '🔴 用掉先吃我'):null),
      d.missing.length? el('div',{class:'kt-drmiss'}, '还差：'+d.missing.map(k=>(ING[k]||{}).label||k).join('、'),
        el('button',{class:'kt-ilink', onClick:(e)=>{ e.stopPropagation();
          addToShopping(d.missing.map(k=>({name:(ING[k]||{}).label||k, cat:(ING[k]||{}).cat}))); GG.toast('缺的已进清单 🛒'); app(); }}, '加入清单')):null),
    el('span',{class:'kt-dishgo'}, '›'));
  return row;
}
async function aiTonight(){
  if(!GG.llm.connected()){ GG.toast('先连接 AI'); return; }
  const have=state.fridge.filter(it=>it.n>0).map(it=>(ING[it.key]||{}).label).filter(Boolean);
  GG.toast('✨ AI 用你冰箱里的现想中…');
  try{
    const obj=await GG.llm.json(SYS_FROM_FRIDGE, '冰箱现有：'+have.join('、')+'。优先用掉快坏的：'+(urgentLabels().join('、')||'无'), {max_tokens:1200});
    openRecipe(normalizeRecipe(obj,'tonight'));
  }catch(e){ GG.toast(GG.llm.errMsg(e)); }
}

/* ════════ mode：一周 ════════ */
function renderWeek(mount){
  mount.appendChild(el('div',{class:'kt-h1'}, '📅 这一周吃什么'));
  mount.appendChild(weekPrefBar());
  mount.appendChild(GG.llm.bar(()=>renderMode()));
  const wk=buildWeek(weekPrefs);
  mount.appendChild(el('div',{class:'kt-h2'}, '7 天安排 · 前两天先用掉冰箱里快坏的'));
  const slots=wk.useLunch?['早','午','晚']:['早','晚'];
  const pw=el('div',{class:'kt-week'});
  wk.plan.forEach(day=>{
    pw.appendChild(el('div',{class:'kt-wday'},
      el('div',{class:'kt-wdaylabel'}, day.label),
      el('div',{class:'kt-wmeals'}, slots.map(s=> day[s]?
        el('button',{class:'kt-wmeal', onClick:()=>openRecipe(recipeFromMeal(day[s]))}, el('span',{class:'kt-wslot'}, s), day[s].name)
        : el('span',{class:'kt-wmeal muted'}, el('span',{class:'kt-wslot'}, s), '—')))
    ));
  });
  mount.appendChild(pw);
  const sl=weekShopping(wk.plan);
  mount.appendChild(el('div',{class:'kt-h2'}, '购物清单 · 已减去冰箱现成的'));
  mount.appendChild(weekShopCard(sl));
}
function weekPrefBar(){
  const bar=el('div',{class:'kt-prefs'});
  ['均衡','减脂','增肌'].forEach(g=> bar.appendChild(el('button',{class:'chip'+(weekPrefs.goal===g?' on':''),
    onClick:()=>{ weekPrefs.goal=g; renderMode(); }}, g)));
  bar.appendChild(el('span',{class:'kt-prefsep'}));
  ['清淡','均衡','重口'].forEach(t=> bar.appendChild(el('button',{class:'chip'+(weekPrefs.taste===t?' on':''),
    onClick:()=>{ weekPrefs.taste=t; renderMode(); }}, t)));
  bar.appendChild(el('span',{class:'kt-prefsep'}));
  ['不吃辣','素食','不吃海鲜'].forEach(a=> bar.appendChild(el('button',{class:'chip'+(weekPrefs.avoids.includes(a)?' on':''),
    onClick:()=>{ const i=weekPrefs.avoids.indexOf(a); if(i>=0) weekPrefs.avoids.splice(i,1); else weekPrefs.avoids.push(a); renderMode(); }}, a)));
  bar.appendChild(el('button',{class:'kt-flink', style:{marginLeft:'auto'},
    onClick:()=>{ weekPrefs.seed=(weekPrefs.seed*7+13)%9000; renderMode(); }}, '↻ 换一批'));
  return bar;
}
function catLabel(c){ return ({'蔬菜':'🥬 蔬菜','蛋白':'🍗 蛋白','肉蛋':'🍗 蛋白','主食':'🍚 主食','调料':'🧂 调料','其他':'🧺 其他'})[c]||c; }
function weekShopCard(sl){
  const card=el('div',{class:'card pad'});
  card.appendChild(el('p',{class:'small muted', style:{marginTop:0}},
    '要买 '+sl.need.length+' 样；冰箱已有 '+sl.own.length+' 样不用买。'));
  ['蔬菜','蛋白','肉蛋','主食','调料','其他'].forEach(cat=>{
    const items=sl.need.filter(x=>x.cat===cat); if(!items.length) return;
    card.appendChild(el('div',{class:'kt-shopcat'}, catLabel(cat)));
    card.appendChild(el('div',{class:'chips'}, items.map(x=>el('span',{class:'chip', style:{cursor:'default'}}, x.name+(x.n>1?' ×'+x.n:'')))));
  });
  if(sl.own.length) card.appendChild(el('div',{class:'kt-haveline'}, '✓ 冰箱已有，省下不用买：'+sl.own.map(x=>x.name).join('、')));
  card.appendChild(el('button',{class:'btn primary block', style:{marginTop:'14px'},
    onClick:()=>{ addToShopping(sl.need); GG.toast('已存进购物清单 🛒'); app(); }}, '把要买的存进购物清单'));
  return card;
}

/* ════════ mode：灵感 ════════ */
const SYS_INSPIRE=[
  '你是「今天吃什么」引擎：把一段美食类社交媒体帖子，转成一份今晚就能照着做的结构化菜谱。',
  '只输出严格 JSON（单个对象），不要 markdown、不要前言。',
  '字段：{ "is_food":boolean, "dish_name":string, "one_line":string(≤30字), "servings":number, "time_minutes":number,',
  '  "difficulty":"easy"|"medium"|"hard", "ingredients":[{"name":string,"amount":string,"emoji":string}](4-10项),',
  '  "steps":[{"title":string,"detail":string,"minutes":number|null,"icon":string}](3-7步), "source_snippet":string(≤40字) }',
  '硬规则：1) 内容真实源自帖子，绝不套用无关模板；2) 不同帖子产出不同菜谱；',
  '3) 若输入不是讲吃的，把 is_food 设 false、其余留空；4) icon 只从 knife pan pot oven mix timer plate flame 里选最贴切的；5) 全部简体中文。'
].join('\n');
const SYS_FROM_FRIDGE=[
  '你是家常菜助手：根据用户冰箱现有食材，给出一道现在就能做、优先用掉快坏食材的家常菜。',
  '只输出严格 JSON（单个对象），字段同上：is_food/dish_name/one_line/servings/time_minutes/difficulty/ingredients[{name,amount,emoji}]/steps[{title,detail,minutes,icon}]/source_snippet（此处留空字符串）。',
  'icon 只从 knife pan pot oven mix timer plate flame 里选；ingredients 尽量用用户现有食材；全部简体中文。'
].join('\n');

function renderInspire(mount){
  mount.appendChild(el('div',{class:'kt-h1'}, '✨ 刷到啥，照着做'));
  mount.appendChild(el('p',{class:'kt-lede'}, '把一段美食帖粘进来（探店 / brunch / 家常 / 深夜放毒都行），变成今晚能照做的图文菜谱，还会告诉你冰箱缺哪几样。'));
  mount.appendChild(GG.llm.bar(()=>renderMode()));
  mount.appendChild(el('div',{class:'kt-eglabel'}, '懒得想？点一个例子直接跑（离线也能出）↓'));
  const ta=el('textarea',{class:'field', placeholder:'把一段美食帖粘到这里…（也可以贴一段根本不是吃的，看它怎么礼貌拒绝）'});
  const egs=el('div',{class:'kt-egs'});
  F.EXAMPLES.forEach(e=> egs.appendChild(el('button',{class:'kt-eg', onClick:()=>{ ta.value=e.text; inspireText=e.text; runInspire(e); }},
    el('span',{class:'em'}, e.em), e.label)));
  mount.appendChild(egs);
  ta.value=inspireText;
  ta.addEventListener('input', e=>{ inspireText=e.target.value; });
  mount.appendChild(el('div',{style:{marginTop:'12px'}}, ta));
  mount.appendChild(el('button',{class:'btn primary lg block', style:{marginTop:'12px'}, onClick:()=>runInspire(null, ta.value)}, '🍳 生成菜谱'));
  inspireMount=el('div',{class:'kt-inresult'}); mount.appendChild(inspireMount);
}
async function runInspire(example, typed){
  const rmount=inspireMount; if(!rmount) return; GG.clear(rmount);
  const stage=el('div'); rmount.appendChild(stage);
  if(example){
    await GG.thinking(stage, ['读懂这段帖子…','抽取菜品意图…','拆解食材与火候…','摆盘出图…'], 1200);
    GG.clear(stage); openRecipeInline(stage, normalizeRecipe(example.recipe,'inspire'));
    return;
  }
  const post=(typed||'').trim();
  if(!post){ GG.clear(rmount); GG.toast('先粘一段帖子，或点上面的例子'); return; }
  if(!GG.llm.connected()){ GG.clear(rmount); GG.toast('连接 AI 才能解析任意帖子；或点上面的例子（离线可跑）'); return; }
  const t=GG.thinking(stage, ['读懂这段帖子…','抽取菜品意图…','拆解食材与火候…','摆盘出图…'], 1800);
  let rec;
  try{ const r=await Promise.all([GG.llm.json(SYS_INSPIRE, post, {max_tokens:1200}), t]); rec=normalizeRecipe(r[0],'inspire'); }
  catch(err){ GG.clear(stage); stage.appendChild(inspireError(err)); return; }
  GG.clear(stage);
  if(!rec.is_food){ stage.appendChild(notFood()); return; }
  openRecipeInline(stage, rec);
}
function notFood(){
  return el('div',{class:'card pad'}, el('div',{class:'kt-oops'},
    el('div',{class:'big'},'🤔'), el('h3',null,'这条看起来不是吃的'),
    el('p',null,'我没从这段里读到能下锅的东西，就不硬编一道菜糊弄你了。换一段美食帖，或点上面的例子。')));
}
function inspireError(err){
  const c=err&&err.code; let title='出了点状况', msg='再试一次，或换一段内容。';
  if(c==='BAD_KEY'){ title='Key 看起来不对'; msg='这个 Anthropic API Key 没通过校验，检查后重新连接。'; }
  else if(c==='NET'){ title='连不上模型'; msg='可能是网络或浏览器直连被拦，换个网络再试。'; }
  else if(c==='PARSE_FAIL'){ title='这次没解析成功'; msg='模型偶尔返回不规整，点「生成菜谱」重试通常就好。'; }
  else if(err&&err.message){ msg=err.message; }
  return el('div',{class:'card pad'}, el('div',{class:'kt-oops'},
    el('div',{class:'big'}, c==='PARSE_FAIL'?'🔁':'🔌'), el('h3',null,title), el('p',null,msg)));
}

/* ════════ 共享菜谱页 + 闭环 ════════ */
function openRecipe(rec){ overlay(renderRecipe(rec, {modal:true})); }
function openRecipeInline(parent, rec){ parent.appendChild(renderRecipe(rec, {modal:false})); }
function rbadge(t){ return el('span',{class:'kt-rbadge'}, t); }
function renderRecipe(rec, opts){
  opts=opts||{};
  const card=el('div',{class:'kt-recipe'+(opts.modal?' modal':'')});
  const pw=document.createElement('div'); pw.innerHTML=plateSVG(rec.dish_name, rec.ingredients);
  card.appendChild(el('div',{class:'kt-rhero'}, pw.firstElementChild,
    el('div',{class:'kt-rinfo'},
      el('div',{class:'kt-rname'}, rec.dish_name),
      rec.one_line? el('div',{class:'kt-roneline'}, rec.one_line):null,
      el('div',{class:'kt-rbadges'},
        rec.servings? rbadge('👥 '+rec.servings+' 人份'):null,
        rec.time_minutes? rbadge('⏱ '+rec.time_minutes+' 分钟'):null,
        rec.difficulty? rbadge('🔥 '+DIFF[rec.difficulty]):null))));
  if(rec.source_snippet) card.appendChild(el('div',{class:'kt-rsource'}, el('b',null,'来自你贴的这段'), '“'+rec.source_snippet+'”'));
  const miss=missingForRecipe(rec);
  card.appendChild(el('div',{class:'kt-rdiff '+(miss.length?'has':'ok')},
    el('span',null, miss.length? ('🛒 这道菜你冰箱缺 '+miss.length+' 样：'+miss.map(x=>x.name).join('、')) : '✓ 这道菜的主料你冰箱都有'),
    miss.length? el('button',{class:'kt-ilink', onClick:()=>{ addToShopping(miss.map(x=>({name:x.name}))); GG.toast('缺的已进清单 🛒'); }}, '加入购物清单'):null));
  card.appendChild(el('div',{class:'kt-rh'}, '要买什么 · '+rec.ingredients.length+' 样'));
  const ig=el('div',{class:'kt-rings'});
  rec.ingredients.forEach(x=> ig.appendChild(el('div',{class:'kt-ring2'+(x.have?' have':'')},
    el('span',{class:'em'}, x.emoji), el('span',{class:'nm'}, x.name),
    x.have? el('span',{class:'tag have'},'冰箱有') : (x.amount? el('span',{class:'tag'}, x.amount):null))));
  card.appendChild(ig);
  if(rec.steps.length){
    card.appendChild(el('div',{class:'kt-rh'}, '怎么做 · '+rec.steps.length+' 步'));
    const sd=el('div',{class:'kt-rsteps'});
    rec.steps.forEach((s,i)=>{ const ic=document.createElement('div'); ic.className='kt-stepicon'; ic.innerHTML=icon(s.icon);
      sd.appendChild(el('div',{class:'kt-step'}, ic, el('div',{class:'body'},
        el('div',{class:'t'}, el('span',{class:'no'},'第'+(i+1)+'步'), s.title, (s.minutes!=null)?el('span',{class:'min'},'约 '+s.minutes+' 分钟'):null),
        s.detail? el('div',{class:'d'}, s.detail):null))); });
    card.appendChild(sd);
  } else {
    card.appendChild(el('div',{class:'kt-nosteps'},
      el('span',null, GG.llm.connected()? '连了 AI，可生成这道菜的详细做法。' : '详细做法连接 AI 后可生成；这里先给你食材和缺料。'),
      GG.llm.connected()? el('button',{class:'kt-ilink', onClick:()=>genSteps(rec, card)}, '生成做法'):null));
  }
  const acts=el('div',{class:'kt-ractions'});
  acts.appendChild(el('button',{class:'btn primary', onClick:()=>{ const r=cookDish(rec); celebrateCook(r); closeOverlays(); app(); }}, '✅ 做完了 · 扣库存'));
  acts.appendChild(el('button',{class:'btn', onClick:()=>shareRecipe(rec)}, '📷 分享卡'));
  if(rec.source==='inspire'){
    acts.appendChild(el('button',{class:'btn', onClick:()=>{ const m2=missingForRecipe(rec); if(m2.length) addToShopping(m2.map(x=>({name:x.name})));
      state.mode='week'; save(); closeOverlays(); app(); GG.toast('缺的进了清单，去一周把它排进某天 📅'); }}, '📅 排进一周'));
  }
  card.appendChild(acts);
  return card;
}
async function genSteps(rec, card){
  if(!GG.llm.connected()){ GG.toast('先连接 AI'); return; }
  GG.toast('AI 生成做法中…');
  try{
    const obj=await GG.llm.json('你是家常菜助手。给出这道菜的做法。只输出 JSON：{"steps":[{"title":"小标题","detail":"一句话","minutes":数或null}]}，3到6步，简体中文。',
      '菜名：'+rec.dish_name+'，食材：'+rec.ingredients.map(i=>i.name).join('、'), {max_tokens:800});
    const steps=(obj.steps||[]).map(s=>({title:String(s.title||''), detail:String(s.detail||''),
      minutes:(s.minutes==null?null:parseInt(s.minutes,10)||null), icon:iconFor(String(s.title)+String(s.detail))}));
    if(steps.length){ rec.steps=steps; const fresh=renderRecipe(rec, {modal:card.classList.contains('modal')}); card.replaceWith(fresh); }
    else GG.toast('这次没生成出来，再试一次');
  }catch(e){ GG.toast(GG.llm.errMsg(e)); }
}
function celebrateCook(r){
  if(r.savedNames && r.savedNames.length) GG.toast('🎉 赶在变质前吃掉了 '+r.savedNames.join('、')+'，本月已救回 ¥'+state.saved.yuan);
  else GG.toast('记一笔，冰箱已更新 ✓');
}
function shareRecipe(rec){
  const cv=buildRecipeCanvas(rec);
  overlay(el('div',null, el('div',{class:'kt-ovtitle'},'分享这道菜'),
    el('div',{class:'kt-shareprev'}, cv),
    el('div',{class:'kt-ovacts'},
      el('button',{class:'btn primary', onClick:()=>GG.copyCanvas(cv)}, '📷 复制图'),
      el('button',{class:'btn', onClick:()=>GG.downloadCanvas(cv, '今天吃什么-'+rec.dish_name)}, '⬇️ 存图'))));
}

/* ════════ mode：购物清单 + 救回计数 ════════ */
function renderShopping(mount){
  mount.appendChild(el('div',{class:'kt-h1'}, '🛒 购物清单'));
  mount.appendChild(savedCard());
  if(!state.shopping.length){
    mount.appendChild(el('div',{class:'card pad muted', style:{marginTop:'14px'}}, '清单是空的。去「今晚」把缺的料、或「一周」的购物清单加进来；买到了一勾，就自动回填进冰箱。'));
    return;
  }
  const card=el('div',{class:'card pad', style:{marginTop:'14px'}});
  card.appendChild(el('div',{class:'row', style:{justifyContent:'space-between', marginBottom:'6px'}},
    el('div',{class:'small muted'}, state.shopping.reduce((a,s)=>a+(s.n||1),0)+' 样待买'),
    el('button',{class:'kt-flink', onClick:()=>{ state.shopping.slice().forEach(s=>buyItem(s)); GG.toast('全部买到，已回填冰箱 🧊'); app(); }}, '全部买到 → 回填冰箱')));
  ['蔬菜','蛋白','肉蛋','主食','调料','其他'].forEach(cat=>{
    const items=state.shopping.filter(s=>s.cat===cat); if(!items.length) return;
    card.appendChild(el('div',{class:'kt-shopcat'}, catLabel(cat)));
    items.forEach(s=> card.appendChild(el('div',{class:'kt-shopitem'},
      el('button',{class:'kt-check', title:'买到了', onClick:()=>{ const back=!!mapKey(s.name); buyItem(s); GG.toast(back?'已回填冰箱 🧊':'已买到 ✓'); app(); }}, '○'),
      el('span',{class:'kt-shopnm'}, s.name+(s.n>1?' ×'+s.n:'')),
      el('button',{class:'kt-shopdel', title:'删除', onClick:()=>{ state.shopping=state.shopping.filter(x=>x!==s); save(); app(); }}, '×'))));
  });
  mount.appendChild(card);
}
function savedCard(){
  return el('div',{class:'kt-saved'},
    el('div',{class:'kt-savedl'}, el('div',{class:'kt-savedbig'}, '¥'+state.saved.yuan), el('div',{class:'kt-savedsub'}, '本月帮你救回')),
    el('div',{class:'kt-saveddiv'}),
    el('div',{class:'kt-savedl'}, el('div',{class:'kt-savedbig'}, state.saved.kg+'kg'), el('div',{class:'kt-savedsub'}, '食材没进垃圾桶')),
    el('button',{class:'kt-savedshare', onClick:shareSaved}, '📷 晒一下'));
}
function shareSaved(){
  const cv=GG.shareCard({ slug:SLUG, title:'本月我帮冰箱救回的',
    big:{value:'¥'+state.saved.yuan, label:'＋ '+state.saved.kg+'kg 没浪费'},
    note:'用快坏的先做、按冰箱排菜，省下的不只是钱', tags:['今天吃什么','少点浪费','先吃我'] });
  overlay(el('div',null, el('div',{class:'kt-ovtitle'},'晒一下这个月'),
    el('div',{class:'kt-shareprev'}, cv),
    el('div',{class:'kt-ovacts'},
      el('button',{class:'btn primary', onClick:()=>GG.copyCanvas(cv)}, '📷 复制图'),
      el('button',{class:'btn', onClick:()=>GG.downloadCanvas(cv,'今天吃什么-救回')}, '⬇️ 存图'))));
}

/* ── 开发自检钩子（仅供本地/无头验证，不伪造主链路） ── */
window.FOOD_DEV = {
  reset: ()=>{ try{ localStorage.removeItem(STORE); }catch(e){} state=null; start(); },
  enter: ()=>{ state=freshState(); save(); app(); },
  sampleRecipe: ()=> normalizeRecipe(F.EXAMPLES[0].recipe,'inspire'),
  openSample: ()=> openRecipe(normalizeRecipe(F.EXAMPLES[0].recipe,'inspire')),
  state: ()=> state
};

start();
})();
