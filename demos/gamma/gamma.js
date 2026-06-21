/* gamma — 一句话变 Deck。输入主题 → thinking → 生成 ≥5 页 deck。
   每页：标题 + 要点(3~4 条) + 一张占位图(纯 SVG 现画)。
   卡片以「拼装/逐页淡入」错峰动画依次出现；可左右切换浏览每页。 */
(function(){
const SLUG = 'gamma';
const {PALETTES, PROTOTYPES} = window.GAMMA;
const SVGNS = 'http://www.w3.org/2000/svg';
const EXAMPLES = ['新能源汽车的下一个十年','把读书会做成一门生意','给小学生讲清楚黑洞','远程团队如何高效协作','城市夜跑爱好者社区'];

let main, deck = [], cur = 0, curTopic = '';

/* ---------- AI 通路（连了 key 用真实模型排版，没连退回本地原型引擎） ---------- */
const ART = ['cover','grid','flow','bars','pie','rings','timeline','wave','stack','spark'];
const GAMMA_SYS = [
  '你是演示稿设计引擎：把主题排成一套多页 deck。',
  '只输出严格 JSON（不要 markdown、不要前言）：',
  '{ "slides":[ {"kicker":"2到6字小标签","title":"页标题","sub":"一句副标题(可空)",',
  '  "points":["要点",3到4条], "art":"cover|grid|flow|bars|pie|rings|timeline|wave|stack|spark"} ] }',
  '规则：5到8 页；第一页 art 必须是 "cover"；art 只能从枚举里选最贴合该页内容的那个；',
  '叙事要有起承转合（封面→背景/问题→方案/要点→数据/收益→结语）；紧扣主题、内容真实；全部简体中文。'
].join('\n');

async function getDeck(topic, useAI){
  if(useAI){
    try{
      const obj = await GG.llm.json(GAMMA_SYS, '主题：'+topic, {max_tokens:2000});
      const d = normalizeDeck(obj, topic);
      if(d && d.length>=3){ d._ai = true; return d; }
    }catch(e){ GG.toast(GG.llm.errMsg(e)); }
  }
  return buildDeck(topic);
}

function normalizeDeck(obj, topic){
  let slides = Array.isArray(obj && obj.slides) ? obj.slides : (Array.isArray(obj)?obj:[]);
  slides = slides.filter(s=> s && (s.title || s.points)).slice(0,9);
  if(slides.length < 3) return null;
  const seed = GG.hash(topic);
  const pal = PALETTES[seed % PALETTES.length];
  return slides.map((s,i)=>{
    let art = ART.includes(s.art) ? s.art : ART[i % ART.length];
    if(i===0) art = 'cover';
    return {
      kicker: String(s.kicker || ('第 '+(i+1)+' 节')),
      title: String(s.title || ''),
      sub: s.sub ? String(s.sub) : '',
      points: (Array.isArray(s.points)?s.points:[]).map(String).filter(Boolean).slice(0,5),
      art, color: pal[i % pal.length], pal, n: i+1
    };
  });
}

/* ---------- 启动 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  const st = GG.decodeState();
  if(st && st.t){ run(st.t, true); return; }
  intro();
}

function intro(){
  GG.clear(main);
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '一句话，变成一套 Deck'),
    GG.el('p', null, '输入一个主题，AI 当场排版出一份多页演示稿：每页都有标题、要点和配图，逐页拼装着出现。')
  ));
  main.appendChild(GG.llm.bar());
  const input = GG.el('input',{class:'field', type:'text', maxlength:'40',
    placeholder:'例如：新能源汽车的下一个十年',
    onKeydown:e=>{ if(e.key==='Enter') go(); }});
  main.appendChild(GG.el('div',{style:{marginTop:'18px'}},
    GG.el('label',{class:'label'}, '你的主题'),
    input
  ));
  // 示例 chip
  main.appendChild(GG.el('div',{class:'chips', style:{marginTop:'12px'}},
    EXAMPLES.map(t=> GG.el('span',{class:'chip', onClick:()=>{ input.value=t; input.focus(); }}, t))
  ));
  main.appendChild(GG.el('div',{class:'center', style:{marginTop:'22px'}},
    GG.el('button',{class:'btn primary lg', onClick:go}, '✨ 生成我的 Deck →')
  ));
  function go(){
    const t = (input.value||'').trim();
    if(!t){ input.focus(); input.style.borderColor='var(--bad)'; GG.toast('先输入一个主题'); return; }
    GG.encodeState({t});
    run(t, false);
  }
  setTimeout(()=>input.focus(), 60);
}

/* ---------- 生成 deck：把主题注入原型 → ≥5 页 ---------- */
function buildDeck(topic){
  const seed = GG.hash(topic);
  const pal = PALETTES[seed % PALETTES.length];
  // 选页：必含封面 + 结语，中间从原型里按 seed 取 4~6 张 → 总计 ≥6 页（稳过 ≥5）
  const cover = PROTOTYPES.find(p=>p.id==='cover');
  const closing = PROTOTYPES.find(p=>p.id==='closing');
  const middlePool = PROTOTYPES.filter(p=>p.id!=='cover' && p.id!=='closing');
  const nMid = 4 + (seed % 3);                      // 4~6 张
  const middle = GG.shuffle(middlePool, seed)       // 主题不同→顺序/选页不同
    .slice(0, nMid)
    .sort((a,b)=> middlePool.indexOf(a) - middlePool.indexOf(b)); // 仍按叙事顺序排
  const order = [cover, ...middle, closing];
  return order.map((proto,i)=> ({
    kicker: proto.kicker,
    title: inject(proto.title, topic),
    sub: proto.sub ? inject(proto.sub, topic) : '',
    points: (proto.points||[]).map(p=> inject(p, topic)),
    art: proto.art,
    color: pal[i % pal.length],
    pal,
    n: i+1
  }));
}
function inject(s, topic){ return String(s).replace(/\{topic\}/g, topic); }

async function run(topic, fromLink){
  curTopic = topic;
  main = main || GG.mountShell(SLUG);
  GG.clear(main);
  const stage = GG.el('div'); main.appendChild(stage);
  const useAI = GG.llm.connected();
  if(!fromLink){
    const think = GG.thinking(stage, [
      '读你的主题：「'+topic+'」…',
      useAI ? 'AI 搭叙事骨架：封面 → 问题 → 方案 → 收益…' : '搭叙事骨架：封面 → 问题 → 方案 → 收益…',
      '为每页配图、铺要点…',
      '排版 + 拼装中…'
    ], useAI ? 1900 : 1700);
    const [d] = await Promise.all([getDeck(topic, useAI), think]);
    deck = d;
  } else {
    deck = await getDeck(topic, useAI);
  }
  cur = 0;
  GG.clear(stage);
  renderDeck(stage);
}

/* ---------- 占位图：纯 SVG 现画（createElementNS，无外部图片） ---------- */
function S(tag, attrs){
  const e = document.createElementNS(SVGNS, tag);
  for(const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
function withAlpha(hex, a){ const {r,g,b}=GG._rgb(hex); return `rgba(${r},${g},${b},${a})`; }

function makeArt(slide){
  const W=400, H=225, c=slide.color, pal=slide.pal;
  const svg = S('svg',{viewBox:`0 0 ${W} ${H}`, width:'100%', preserveAspectRatio:'xMidYMid slice',
    style:'display:block;border-radius:12px;background:'+withAlpha(c,.08)});
  const k = slide.art;
  const acc = (i)=> pal[i % pal.length];

  if(k==='cover'){
    svg.appendChild(S('rect',{x:0,y:0,width:W,height:H,fill:withAlpha(c,.10)}));
    svg.appendChild(S('circle',{cx:300,cy:60,r:90,fill:withAlpha(acc(1),.30)}));
    svg.appendChild(S('circle',{cx:90,cy:190,r:70,fill:withAlpha(acc(2),.45)}));
    svg.appendChild(S('rect',{x:48,y:96,width:150,height:14,rx:7,fill:withAlpha(c,.7)}));
    svg.appendChild(S('rect',{x:48,y:120,width:96,height:10,rx:5,fill:withAlpha(c,.4)}));
  } else if(k==='grid'){
    for(let r=0;r<2;r++) for(let col=0;col<3;col++){
      svg.appendChild(S('rect',{x:40+col*110, y:50+r*85, width:90, height:64, rx:10,
        fill:withAlpha(acc(r*3+col),.55)}));
    }
  } else if(k==='flow'){
    const cy=H/2, xs=[60,165,270,360];
    xs.forEach((x,i)=>{
      if(i<xs.length-1) svg.appendChild(S('line',{x1:x,y1:cy,x2:xs[i+1],y2:cy,
        stroke:withAlpha(c,.4), 'stroke-width':6, 'stroke-linecap':'round'}));
    });
    [60,165,270].forEach((x,i)=> svg.appendChild(S('rect',{x:x-26,y:cy-26,width:52,height:52,rx:12,fill:acc(i)})));
    svg.appendChild(S('circle',{cx:360,cy:cy,r:24,fill:acc(3)}));
  } else if(k==='bars'){
    const hs=[60,110,150,90,130];
    hs.forEach((h,i)=> svg.appendChild(S('rect',{x:46+i*66, y:H-20-h, width:42, height:h, rx:8, fill:acc(i)})));
    svg.appendChild(S('line',{x1:36,y1:H-20,x2:W-30,y2:H-20,stroke:withAlpha(c,.35),'stroke-width':3}));
  } else if(k==='pie'){
    const cx=140,cy=H/2,r=78, segs=[0,.34,.62,.85,1], col=pal;
    segs.slice(0,-1).forEach((s,i)=> svg.appendChild(arc(cx,cy,r,s*360,segs[i+1]*360,col[i%col.length])));
    svg.appendChild(S('circle',{cx,cy,r:34,fill:withAlpha('#ffffff',.92)}));
    [0,1,2].forEach(i=> svg.appendChild(S('rect',{x:270,y:64+i*34,width:90,height:16,rx:8,fill:withAlpha(acc(i),.6)})));
  } else if(k==='rings'){
    [78,56,34].forEach((rr,i)=> svg.appendChild(S('circle',{cx:W/2,cy:H/2,r:rr,fill:'none',
      stroke:acc(i),'stroke-width':14, 'stroke-linecap':'round',
      'stroke-dasharray':(rr*5)+' '+(rr*1.6), transform:`rotate(${i*40} ${W/2} ${H/2})`})));
  } else if(k==='timeline'){
    const y=H/2;
    svg.appendChild(S('line',{x1:50,y1:y,x2:W-40,y2:y,stroke:withAlpha(c,.35),'stroke-width':5,'stroke-linecap':'round'}));
    [80,180,280,360].forEach((x,i)=>{
      svg.appendChild(S('circle',{cx:x,cy:y,r:13,fill:acc(i)}));
      svg.appendChild(S('rect',{x:x-22, y: i%2? y+22:y-46, width:44, height:22, rx:6, fill:withAlpha(acc(i),.4)}));
    });
  } else if(k==='wave'){
    let d='M 20 150 ';
    for(let x=20;x<=380;x+=20){ const yy=130 + Math.sin(x/34)*42; d+=`L ${x} ${yy.toFixed(0)} `; }
    svg.appendChild(S('path',{d:d+`L 380 205 L 20 205 Z`, fill:withAlpha(c,.45)}));
    let d2='M 20 170 ';
    for(let x=20;x<=380;x+=20){ const yy=160 + Math.sin((x+40)/30)*30; d2+=`L ${x} ${yy.toFixed(0)} `; }
    svg.appendChild(S('path',{d:d2+`L 380 205 L 20 205 Z`, fill:withAlpha(acc(1),.5)}));
  } else if(k==='stack'){
    [200,150,100].forEach((w,i)=> svg.appendChild(S('rect',{x:(W-w)/2, y:48+i*52, width:w, height:40, rx:10, fill:acc(i)})));
  } else { // spark
    let d='M 30 180 '; const pts=[180,120,150,80,110,50,70];
    pts.forEach((yy,i)=> d+=`L ${30+i*58} ${yy} `);
    svg.appendChild(S('path',{d, fill:'none', stroke:c, 'stroke-width':6, 'stroke-linecap':'round','stroke-linejoin':'round'}));
    pts.forEach((yy,i)=> svg.appendChild(S('circle',{cx:30+i*58, cy:yy, r:7, fill:acc(i)})));
  }
  return svg;
}
// 饼图扇形
function arc(cx,cy,r,a0,a1,fill){
  const rad=d=> (d-90)*Math.PI/180;
  const x0=cx+r*Math.cos(rad(a0)), y0=cy+r*Math.sin(rad(a0));
  const x1=cx+r*Math.cos(rad(a1)), y1=cy+r*Math.sin(rad(a1));
  const large = (a1-a0)>180?1:0;
  return S('path',{d:`M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`, fill});
}

/* ---------- 渲染 deck（当前页大图 + 缩略条 + 左右箭头） ---------- */
function renderDeck(stage){
  GG.clear(stage);
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px', paddingBottom:'4px'}},
    GG.el('h1',{style:{fontSize:'22px'}}, '🖼️ 你的 Deck · 共 '+deck.length+' 页')));
  stage.appendChild(GG.el('div',{class:'center', style:{marginBottom:'4px'}}, GG.llm.badge(!!deck._ai)));

  const slideBox = GG.el('div',{id:'slideBox'});
  stage.appendChild(slideBox);

  // 左右箭头 + 页码
  const nav = GG.el('div',{class:'row', style:{justifyContent:'center', gap:'18px', marginTop:'16px'}},
    GG.el('button',{class:'btn', onClick:()=>goPage(cur-1)}, '← 上一页'),
    GG.el('div',{id:'pageNo', class:'small muted', style:{minWidth:'66px', textAlign:'center'}}),
    GG.el('button',{class:'btn', onClick:()=>goPage(cur+1)}, '下一页 →')
  );
  stage.appendChild(nav);

  // 缩略条
  const thumbs = GG.el('div',{id:'thumbs', class:'row',
    style:{gap:'8px', marginTop:'16px', overflowX:'auto', paddingBottom:'6px', justifyContent:'center', flexWrap:'wrap'}});
  deck.forEach((s,i)=>{
    const t = GG.el('button',{class:'btn', dataset:{i:String(i)},
      style:{padding:'0', width:'68px', height:'42px', flex:'none', borderRadius:'8px', overflow:'hidden', position:'relative'},
      title:s.title, onClick:()=>goPage(i)});
    const mini = makeArt(s); mini.setAttribute('style', mini.getAttribute('style')+';border-radius:0');
    t.appendChild(mini);
    t.appendChild(GG.el('span',{style:{position:'absolute',left:'3px',top:'2px',fontSize:'10px',fontWeight:'700',
      color:'#fff', textShadow:'0 1px 2px rgba(0,0,0,.5)'}}, String(i+1)));
    thumbs.appendChild(t);
  });
  stage.appendChild(thumbs);

  // 分享卡
  const shareSpec = {
    slug: SLUG,
    title: curTopic + ' · Deck',
    subtitle: deck.length + ' 页',
    tags: [curTopic],
    note: deck[0].sub || '一份由 AI 即时排版的演示稿',
    rows: deck.map(s=> ({label:'P'+s.n, value:s.title})),
  };
  stage.appendChild(GG.resultCard(SLUG,
    GG.el('div',{class:'center muted small'}, '截图分享你的 Deck（每页一行）↓'), shareSpec));

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ location.hash=''; intro(); }}, '↻ 换个主题')));

  // 键盘左右翻页
  window.removeEventListener('keydown', keyh);
  window.addEventListener('keydown', keyh);

  renderSlide(slideBox, cur);
}
function keyh(e){
  if(!deck.length) return;
  if(e.key==='ArrowRight') goPage(cur+1);
  else if(e.key==='ArrowLeft') goPage(cur-1);
}
function goPage(i){
  i = GG.clamp(i, 0, deck.length-1);
  if(i===cur) return;
  cur = i;
  renderSlide(GG.$('#slideBox'), cur);
}

/* 单页：错峰淡入 + 轻微位移 = 「拼装」感 */
function renderSlide(box, i){
  GG.clear(box);
  const s = deck[i];
  GG.$('#pageNo').textContent = (i+1)+' / '+deck.length;
  GG.$$('#thumbs button').forEach(b=>{
    const on = b.dataset.i===String(i);
    b.style.outline = on ? '3px solid var(--accent)' : 'none';
    b.style.opacity = on ? '1' : '.6';
  });

  // 16:9 幻灯片卡
  const card = GG.el('div',{class:'card', style:{
    padding:'0', overflow:'hidden', display:'flex', flexDirection:'column',
    background:`linear-gradient(160deg, ${withAlpha(s.color,.10)}, #fff 52%)`,
    borderTop:`4px solid ${s.color}`, boxShadow:'var(--sh-2)'
  }});

  const inner = GG.el('div',{style:{padding:'26px 28px 28px', display:'flex', gap:'24px',
    flexWrap:'wrap', alignItems:'flex-start'}});

  // 左：文字
  const text = GG.el('div',{style:{flex:'1 1 280px', minWidth:'240px'}},
    anim(GG.el('div',{class:'section-t', style:{margin:'0 0 8px', color:s.color}}, s.kicker+' · 第 '+(i+1)+' 页'), 0),
    anim(GG.el('h2',{style:{fontSize:'26px', lineHeight:'1.18', letterSpacing:'-.5px'}}, s.title), 1)
  );
  if(s.sub) text.appendChild(anim(GG.el('p',{class:'muted', style:{margin:'10px 0 0', fontSize:'15px'}}, s.sub), 2));
  if(s.points && s.points.length){
    const ul = GG.el('div',{class:'stack', style:{gap:'10px', marginTop:'16px'}});
    s.points.forEach((p,pi)=>{
      ul.appendChild(anim(GG.el('div',{class:'row', style:{gap:'10px', alignItems:'flex-start'}},
        GG.el('span',{style:{flex:'none', width:'9px', height:'9px', marginTop:'8px', borderRadius:'50%', background:s.color}}),
        GG.el('div',{style:{fontSize:'15.5px', color:'var(--ink-2)', lineHeight:'1.5'}}, p)
      ), 3+pi));
    });
    text.appendChild(ul);
  }

  // 右：占位图
  const artWrap = anim(GG.el('div',{style:{flex:'1 1 300px', minWidth:'260px'}}, makeArt(s)),
    s.points && s.points.length ? 3+s.points.length : 3);

  inner.appendChild(text);
  inner.appendChild(artWrap);
  card.appendChild(inner);
  box.appendChild(card);

  // 加分 feature：连了 AI 时，每页可一键生成「讲者备注」口播稿
  if(deck._ai){
    const notes = GG.el('div',{class:'small', style:{display:'none', marginTop:'12px', padding:'12px 14px',
      borderRadius:'10px', background:'var(--accent-soft)', color:'var(--ink-2)', lineHeight:'1.7'}});
    let loaded=false, busy=false;
    const nb = GG.el('button',{class:'btn ghost', style:{fontSize:'13px'}, onClick:async()=>{
      if(busy) return;
      if(loaded){ notes.style.display = notes.style.display==='none'?'block':'none'; return; }
      busy=true; const old=nb.textContent; nb.textContent='生成中…'; notes.style.display='block'; notes.textContent='AI 正在写口播稿…';
      try{
        const r = await GG.llm.json(
          '你是演讲教练。为这一页幻灯片写一段 60到90 字、自然口语的讲者备注（上台照着说的口播稿）。只输出 JSON：{"notes":"..."}',
          '主题：'+curTopic+'\n页标题：'+s.title+'\n要点：'+(s.points||[]).join('；'), {max_tokens:400});
        notes.textContent = r.notes || '（无）'; loaded=true; nb.textContent='✦ 收起备注';
      }catch(e){ notes.textContent = GG.llm.errMsg(e); nb.textContent=old; }
      busy=false;
    }}, '✦ 讲者备注');
    box.appendChild(GG.el('div',{class:'center', style:{marginTop:'12px'}}, nb));
    box.appendChild(notes);
  }
}

/* 错峰入场：透明 + 轻微下移/缩放 → 依次归位（CSS transition 实现「拼装」） */
function anim(el, order){
  el.style.opacity = '0';
  el.style.transform = 'translateY(12px) scale(.98)';
  el.style.transition = 'opacity .42s ease, transform .42s cubic-bezier(.2,.7,.2,1)';
  requestAnimationFrame(()=> setTimeout(()=>{
    el.style.opacity = '1';
    el.style.transform = 'none';
  }, 70 + order*85));
  return el;
}

start();
})();
