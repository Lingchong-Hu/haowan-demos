/* whips — 汽车版 Tinder。滑 ≥8 张学口味 → 精配 3 台 + 引用滑动倾向的理由。 */
(function(){
const SLUG='whips';
const {DECK, CATALOG} = window.WHIPS;
const DIMS = ['body','size','vibe','power','price'];
const DIM_LABEL = {body:'车型', size:'尺寸', vibe:'气质', power:'动力', price:'定位'};
const MIN_SWIPE = 8;
let main;

// 车身侧影 SVG（颜色随车变；type 微调车顶高度）
function carSVG(color, type){
  const tall = (type==='SUV'||type==='MPV'||type==='皮卡');
  const low  = (type==='跑车');
  const roofY = low ? 30 : (tall ? 14 : 24);
  const glassTop = low ? 33 : (tall ? 18 : 28);
  return `<svg viewBox="0 0 220 96" width="100%" style="display:block">
    <ellipse cx="110" cy="86" rx="92" ry="7" fill="rgba(0,0,0,.10)"/>
    <path d="M14 62 Q16 46 36 44 L66 ${roofY+18} Q80 ${roofY} 108 ${roofY-1} L150 ${roofY+1}
             Q168 ${roofY+6} 182 46 L202 50 Q210 52 210 60 L210 66 Q210 70 204 70 L22 70 Q14 70 14 62 Z"
          fill="${color}"/>
    <path d="M72 ${roofY+16} Q84 ${glassTop} 106 ${glassTop} L130 ${glassTop+1} L146 46 Z"
          fill="rgba(255,255,255,.34)"/>
    <circle cx="62" cy="70" r="15" fill="#1c1c22"/><circle cx="62" cy="70" r="6.5" fill="#cfcfd6"/>
    <circle cx="162" cy="70" r="15" fill="#1c1c22"/><circle cx="162" cy="70" r="6.5" fill="#cfcfd6"/>
  </svg>`;
}
function chips(car){
  return GG.el('div',{class:'chips', style:{marginTop:'10px'}},
    [car.body, car.size, car.vibe, car.power, car.price].map(t=>GG.el('span',{class:'chip',style:{cursor:'default'}}, t)));
}

/* ---------- 引擎 ---------- */
function recommend(likes, dislikes){
  // 倾向权重：喜欢 +1，讨厌 -0.6
  const w = {};
  const likedCounts = {};            // 只统计喜欢里各属性出现次数（用于理由）
  const add=(car,val)=>{ for(const d of DIMS){ const key=car[d]; w[key]=(w[key]||0)+val; } };
  likes.forEach(c=>{ add(c,1); for(const d of DIMS){ likedCounts[c[d]]=(likedCounts[c[d]]||0)+1; }});
  dislikes.forEach(c=>add(c,-0.6));
  // 候选打分
  const scored = CATALOG.map(car=>{
    let s=0; for(const d of DIMS) s += (w[car[d]]||0);
    return {car, s};
  }).sort((a,b)=> b.s - a.s);
  const maxS = scored[0].s || 1;
  const top3 = scored.slice(0,3).map(x=>({
    car:x.car,
    match: Math.round(GG.clamp(58 + (x.s/Math.max(1,maxS))*40, 58, 98))
  }));
  // 用户的主导倾向（喜欢里出现最多的属性值），最多 4 个
  const tendencies = Object.entries(likedCounts)
    .filter(([k,v])=>v>=1).sort((a,b)=>b[1]-a[1]).slice(0,4)
    .map(([k,v])=>({val:k, n:v, dim: DIMS.find(d=> DECK.concat(CATALOG).some(c=>c[d]===k))}));
  return {top3, tendencies, likedCount:likes.length};
}
// 某车命中了用户哪些主导倾向 → 理由
function reasonFor(car, tendencies){
  const hits = tendencies.filter(t=> DIMS.some(d=>car[d]===t.val));
  if(hits.length){
    const parts = hits.slice(0,3).map(t=> `${t.val}（你右滑里出现 ${t.n} 次）`);
    return `正中你的偏好：${parts.join('、')}。`;
  }
  return '在你没拒绝的方向里综合得分最高的一台。';
}

/* ---------- AI 通路（连了 key 让模型读你的滑动倾向、从车库里精配并解释；没连退回本地打分） ---------- */
const WHIPS_SYS = '你是懂车的购车顾问。用户在一堆车里左右滑（右滑=喜欢，左滑=不喜欢）。下面给你 ta 右滑/左滑的车，以及完整候选车库（每行 id|车名：车型/尺寸/气质/动力/定位）。请从【候选车库】里挑 3 台最合 ta 口味的车，并解释为什么——理由要引用 ta 右滑里反复出现的偏好。只输出严格 JSON：{"insight":"一句话总结 ta 的购车口味","picks":[{"id":"候选车库里的 id","match":契合度数字60到98,"reason":"为什么推荐，引用 ta 的滑动倾向，40字内"}]}。picks 必须 3 台，id 必须来自候选车库，按契合度从高到低。全部简体中文。';

function localRecs(liked, disliked){
  const {top3, tendencies, likedCount} = recommend(liked, disliked);
  return {
    top3: top3.map(t=>({car:t.car, match:t.match, reason:reasonFor(t.car, tendencies)})),
    tendencies, likedCount, insight:'', _ai:false
  };
}

async function getRecs(liked, disliked, useAI){
  const local = recommend(liked, disliked);
  if(useAI && liked.length){
    try{
      const fmt = c=>`${c.body}/${c.size}/${c.vibe}/${c.power}/${c.price}`;
      const cat = CATALOG.map(c=>`${c.id}|${c.name}：${fmt(c)}`).join('\n');
      const likeStr = liked.map(c=>`${c.name}(${fmt(c)})`).join('、') || '无';
      const dislikeStr = disliked.map(c=>c.name).join('、') || '无';
      const obj = await GG.llm.json(WHIPS_SYS,
        `右滑(喜欢)：${likeStr}\n左滑(不喜欢)：${dislikeStr}\n\n候选车库：\n${cat}`, {max_tokens:900});
      const seen = new Set();
      const picks = (Array.isArray(obj.picks)?obj.picks:[]).map(p=>{
        const car = CATALOG.find(c=> c.id===p.id);                 // id 必须真实存在，否则丢弃
        if(!car || seen.has(car.id)) return null; seen.add(car.id);
        return {car, match: Math.round(GG.clamp(parseInt(p.match,10)||80, 58, 98)), reason:String(p.reason||'').trim()};
      }).filter(Boolean);
      if(picks.length){
        // 不足 3 台用本地结果补齐（仍保证来自车库、不重复）
        for(const t of local.top3){ if(picks.length>=3) break;
          if(!seen.has(t.car.id)){ seen.add(t.car.id); picks.push({car:t.car, match:t.match, reason:reasonFor(t.car, local.tendencies)}); } }
        return {top3:picks.slice(0,3), tendencies:local.tendencies, likedCount:local.likedCount,
                insight:String(obj.insight||'').trim(), _ai:true};
      }
    }catch(e){ GG.toast(GG.llm.errMsg(e)); }
  }
  return localRecs(liked, disliked);
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  // 分享链接可复现：URL 里带着 likes/dislikes 就直接出结果
  const st = GG.decodeState();
  if(st && st.l){
    const byId = id=> DECK.find(c=>c.id===id);
    showResult((st.l||[]).map(byId).filter(Boolean), (st.d||[]).map(byId).filter(Boolean), true);
    return;
  }
  intro();
}

function intro(){
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '左右滑，找到你的本命车'),
    GG.el('p', null, `向右滑 ❤ 喜欢、向左滑 ✕ 不喜欢。滑满 ${MIN_SWIPE} 张，我就读懂你的口味，从车库里精配 3 台。`)
  ));
  main.appendChild(GG.llm.bar());
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn primary lg', onClick:swipeStage}, '开始滑车 →')
  ));
}

function swipeStage(){
  GG.clear(main);
  const liked=[], disliked=[];
  let idx=0;

  const counter = GG.el('div',{class:'small muted center', style:{marginTop:'6px'}});
  const deckBox = GG.el('div',{style:{position:'relative', height:'420px', margin:'18px auto 0', maxWidth:'380px'}});
  const hintBox = GG.el('div',{class:'center small muted', style:{marginTop:'4px'}}, '提示：拖动卡片，或用下方按钮 / 键盘 ← → 操作');
  const doneBtnWrap = GG.el('div',{class:'center', style:{marginTop:'16px', minHeight:'48px'}});

  const btnRow = GG.el('div',{class:'row', style:{justifyContent:'center', gap:'22px', marginTop:'14px'}},
    GG.el('button',{class:'btn lg', style:{width:'72px',height:'72px',borderRadius:'50%',fontSize:'26px',borderColor:'#e8543f',color:'#e8543f'},
      title:'不喜欢 (←)', onClick:()=>act(false)}, '✕'),
    GG.el('button',{class:'btn lg', style:{width:'72px',height:'72px',borderRadius:'50%',fontSize:'26px',borderColor:'#2e9e7b',color:'#2e9e7b'},
      title:'喜欢 (→)', onClick:()=>act(true)}, '❤')
  );

  main.appendChild(GG.el('div',{class:'hero', style:{paddingBottom:'0'}}, GG.el('h1',{style:{fontSize:'22px'}}, '滑出你的口味')));
  main.appendChild(counter);
  main.appendChild(deckBox);
  main.appendChild(btnRow);
  main.appendChild(hintBox);
  main.appendChild(doneBtnWrap);

  function updateCounter(){
    const n = liked.length+disliked.length;
    counter.textContent = `已滑 ${n} / ${DECK.length}　·　喜欢 ${liked.length}　不喜欢 ${disliked.length}` +
      (n<MIN_SWIPE? `　（再滑 ${MIN_SWIPE-n} 张可出结果）`:'');
    if(n>=MIN_SWIPE && !GG.$('#go', main)){
      doneBtnWrap.appendChild(GG.el('button',{id:'go', class:'btn primary lg', onClick:finish},
        `✨ 看我的精配 3 台 →`));
    }
  }

  function renderTop(){
    GG.clear(deckBox);
    if(idx>=DECK.length){ finish(); return; }
    // 渲染最上面 2 张（下面一张做层叠效果）
    for(let k=Math.min(idx+1, DECK.length-1); k>=idx; k--){
      const car = DECK[k];
      const depth = k-idx;
      const cardEl = makeCard(car, depth);
      deckBox.appendChild(cardEl);
      if(depth===0) attachDrag(cardEl, car);
    }
  }

  function makeCard(car, depth){
    const el = GG.el('div',{class:'card', style:{
      position:'absolute', inset:'0', padding:'18px', display:'flex', flexDirection:'column',
      transform:`scale(${1-depth*0.04}) translateY(${depth*10}px)`, zIndex: String(10-depth),
      transition:'transform .18s', boxShadow:'var(--sh-2)', cursor:depth===0?'grab':'default',
      background:`linear-gradient(160deg, ${hexA(car.color,.10)}, #fff 46%)`
    }},
      GG.el('div',{style:{flex:'1', display:'flex', alignItems:'center', justifyContent:'center', padding:'8px 0'},
        html:carSVG(car.color, car.body)}),
      GG.el('h3',{style:{fontSize:'21px'}}, car.name),
      GG.el('p',{class:'small muted', style:{margin:'6px 0 0'}}, car.blurb),
      chips(car)
    );
    // 拖动时的 ❤ / ✕ 大字
    const like = GG.el('div',{style:tagStyle('#2e9e7b','left')}, '❤ 喜欢');
    const nope = GG.el('div',{style:tagStyle('#e8543f','right')}, '✕ 算了');
    el._like=like; el._nope=nope; el.appendChild(like); el.appendChild(nope);
    return el;
  }
  function tagStyle(color, side){
    return {position:'absolute', top:'18px', [side==='left'?'right':'left']:'18px',
      border:`3px solid ${color}`, color, fontWeight:'800', fontSize:'18px',
      padding:'4px 12px', borderRadius:'10px', transform:'rotate(-12deg)', opacity:'0',
      transition:'opacity .1s', pointerEvents:'none'};
  }

  function attachDrag(el, car){
    let sx=0, sy=0, dx=0, dragging=false;
    const down=e=>{ dragging=true; el.style.transition='none'; el.style.cursor='grabbing';
      sx=(e.touches?e.touches[0].clientX:e.clientX); sy=(e.touches?e.touches[0].clientY:e.clientY);
      window.addEventListener('pointermove',move); window.addEventListener('pointerup',up); };
    const move=e=>{ if(!dragging)return; const cx=e.clientX, cy=e.clientY; dx=cx-sx; const dy=cy-sy;
      el.style.transform=`translate(${dx}px,${dy}px) rotate(${dx/18}deg)`;
      el._like.style.opacity = dx>30? Math.min(1, dx/120):0;
      el._nope.style.opacity = dx<-30? Math.min(1, -dx/120):0; };
    const up=()=>{ if(!dragging)return; dragging=false; el.style.cursor='grab';
      window.removeEventListener('pointermove',move); window.removeEventListener('pointerup',up);
      if(Math.abs(dx)>110){ fly(el, dx>0, ()=>register(car, dx>0)); }
      else { el.style.transition='transform .2s'; el.style.transform=''; el._like.style.opacity=0; el._nope.style.opacity=0; } };
    el.addEventListener('pointerdown', down);
  }
  function fly(el, right, cb){
    el.style.transition='transform .32s ease, opacity .32s';
    el.style.transform=`translate(${right?500:-500}px, -40px) rotate(${right?30:-30}deg)`;
    el.style.opacity='0';
    setTimeout(cb, 200);
  }
  function register(car, liked_){
    (liked_?liked:disliked).push(car);
    idx++; updateCounter(); renderTop();
  }
  function act(right){
    if(idx>=DECK.length) return;
    const car = DECK[idx];
    const z10 = GG.$$('.card', deckBox).find(c=>c.style.zIndex==='10'); // depth0 卡
    if(z10){ z10._like.style.opacity = right?1:0; z10._nope.style.opacity = right?0:1;
      fly(z10, right, ()=>register(car, right)); }
    else register(car, right);
  }
  window.addEventListener('keydown', keyh);
  function keyh(e){ if(e.key==='ArrowRight') act(true); else if(e.key==='ArrowLeft') act(false); }

  function finish(){
    window.removeEventListener('keydown', keyh);
    GG.encodeState({l: liked.map(c=>c.id), d: disliked.map(c=>c.id)});
    showResult(liked, disliked, false);
  }

  updateCounter(); renderTop();
}

function hexA(hex,a){ const {r,g,b}=GG._rgb(hex); return `rgba(${r},${g},${b},${a})`; }

async function showResult(liked, disliked, fromLink){
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  const useAI = GG.llm.connected();
  let recs;
  if(!fromLink){
    const think = GG.thinking(stage, ['读取你的 '+liked.length+' 次右滑…',
      useAI?'AI 拆解你的购车口味…':'拆解车型 / 气质 / 动力倾向…','在车库里匹配…','精配 3 台中…'], useAI?1900:1500);
    const [r] = await Promise.all([getRecs(liked, disliked, useAI), think]); recs = r;
  } else {
    recs = await getRecs(liked, disliked, useAI);
  }
  const {top3, tendencies, likedCount, insight} = recs;

  GG.clear(stage);
  // 口味 DNA
  const dnaLine = tendencies.length
    ? tendencies.map(t=>`${t.val}`).join(' · ')
    : '口味很挑（几乎都左滑了）';
  const dna = GG.el('div',{class:'card pad', style:{marginBottom:'16px', background:`linear-gradient(160deg,var(--accent-soft),#fff 60%)`}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '你的购车口味 DNA'),
    GG.el('div',{style:{fontSize:'22px', fontWeight:'700'}}, dnaLine),
    GG.el('p',{class:'small muted', style:{margin:'8px 0 0'}},
      tendencies.length
        ? `基于你 ${likedCount} 次右滑统计：${tendencies.map(t=>`${DIM_LABEL[t.dim]||''}「${t.val}」×${t.n}`).join('，')}。`
        : `你把大多数车划走了，我按你“没拒绝”的方向反推。`)
  );
  // 3 台精配
  const list = GG.el('div',{class:'stack'});
  top3.forEach((r,i)=>{
    const car=r.car;
    list.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'16px', alignItems:'center', flexWrap:'wrap'}},
      GG.el('div',{style:{width:'132px', flex:'none'}, html:carSVG(car.color, car.body)}),
      GG.el('div',{style:{flex:'1', minWidth:'200px'}},
        GG.el('div',{class:'row', style:{justifyContent:'space-between'}},
          GG.el('div',{class:'row', style:{gap:'8px'}},
            GG.el('span',{class:'pill', style:{background:'var(--accent)', color:'#fff', fontWeight:'700', padding:'4px 11px', borderRadius:'999px', fontSize:'13px'}}, '推荐 '+(i+1)),
            GG.el('h3',{style:{fontSize:'19px'}}, car.name)),
          GG.el('span',{class:'pill'}, '契合 '+r.match+'%')
        ),
        GG.el('p',{class:'small', style:{margin:'8px 0 0', color:'var(--ink-2)'}}, r.reason),
        GG.el('p',{class:'small muted', style:{margin:'4px 0 0'}}, car.blurb),
        chips(car)
      )
    ));
  });

  const shareSpec = {
    slug:SLUG, title:'我的本命车 · 精配 3 台',
    subtitle: tendencies.length? ('口味 DNA：'+dnaLine) : '口味很挑',
    tags: tendencies.map(t=>t.val),
    note: top3.length? (top3[0].car.name+' —— '+top3[0].reason) : '',
    rows: top3.map((r,i)=>({label:'推荐 '+(i+1), value:`${r.car.name}（契合 ${r.match}%）`})),
  };

  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}}, GG.el('h1',{style:{fontSize:'24px'}}, '🎉 你的精配结果')));
  stage.appendChild(GG.el('div',{style:{margin:'0 0 10px'}}, GG.llm.badge(!!recs._ai)));
  stage.appendChild(dna);
  if(insight){
    stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', borderLeft:'3px solid var(--accent)'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '✨ AI 口味洞察'),
      GG.el('p',{style:{margin:'0', fontSize:'15px', color:'var(--ink-2)', lineHeight:'1.7'}}, insight)));
  }
  stage.appendChild(list);
  stage.appendChild(GG.resultCard(SLUG, GG.el('div',{class:'center muted small'}, '截图分享你的本命车 ↓'), shareSpec));
  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; start(); }}, '↻ 换一组滑法')
  ));
}

start();
})();
