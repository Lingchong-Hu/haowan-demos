/* style-dna — 自拍色彩诊断。
   ① 干净的「登录 / 欢迎」首屏（在详情页手机预览里不再乱）。
   ② 真实像素取色 → 色彩季型 + 色彩人格 + 坐标定位。
   ③ 勾共鸣的实用层：戴对色 vs 戴错色对比、口红/腮红/金属/发色色号、衣柜该留该扔。
   核心取色 / 季型判定永远本地；连了 key 才叠加 AI 个性化造型建议。 */
(function(){
const SLUG='style-dna';
const {SAMPLES, NAMES, SEASONS, BEAUTY} = window.STYLEDNA;
let main, fileInput;

/* ---------- 颜色工具 ---------- */
function hex2rgb(h){ return GG._rgb(h); }
function rgb2hex(r,g,b){ const f=x=>('0'+Math.round(GG.clamp(x,0,255)).toString(16)).slice(-2); return '#'+f(r)+f(g)+f(b); }
function rgb2hsl(r,g,b){ r/=255;g/=255;b/=255; const mx=Math.max(r,g,b),mn=Math.min(r,g,b); let h,s,l=(mx+mn)/2;
  if(mx===mn){h=s=0;} else { const d=mx-mn; s=l>.5?d/(2-mx-mn):d/(mx+mn);
    h = mx===r? (g-b)/d+(g<b?6:0) : mx===g? (b-r)/d+2 : (r-g)/d+4; h/=6; }
  return [h*360, s, l]; }
function hsl2hex(h,s,l){ h/=360; const f=n=>{ const k=(n+h*12)%12; const a=s*Math.min(l,1-l);
  return l-a*Math.max(-1,Math.min(k-3,9-k,1)); }; return rgb2hex(f(0)*255,f(8)*255,f(4)*255); }
function dist(a,b){ const x=hex2rgb(a),y=hex2rgb(b); return (x.r-y.r)**2+(x.g-y.g)**2+(x.b-y.b)**2; }
function nameOf(hex){ let best=NAMES[0], bd=1e9; for(const[h,n] of NAMES){ const d=dist(hex,h); if(d<bd){bd=d; best=[h,n];} } return best[1]; }

/* ---------- 画样图（本地像素，可被真实取色） ---------- */
function drawSample(ctx, p, W, H){
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,p.bg); g.addColorStop(1, shade(p.bg,-14));
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.fillStyle=p.hair; ctx.beginPath(); ctx.ellipse(W/2,H*0.42,W*0.30,H*0.34,0,0,7); ctx.fill();      // 头发
  ctx.fillStyle=p.skin; ctx.beginPath(); ctx.ellipse(W/2,H*0.46,W*0.20,H*0.25,0,0,7); ctx.fill();      // 脸
  ctx.fillStyle=p.top; ctx.beginPath(); ctx.moveTo(W*0.18,H); ctx.quadraticCurveTo(W/2,H*0.66,W*0.82,H); // 衣服
  ctx.closePath(); ctx.fill();
}
function shade(hex,amt){ const {r,g,b}=hex2rgb(hex); return rgb2hex(r+amt,g+amt,b+amt); }
function sampleThumb(s, size){
  const c=document.createElement('canvas'); c.width=size; c.height=size; const ctx=c.getContext('2d');
  ctx.save(); ctx.beginPath(); ctx.arc(size/2,size/2,size/2,0,7); ctx.clip();
  drawSample(ctx, s, size, size); ctx.restore();
  return c;
}

/* ---------- 取色引擎：真实像素量化 ---------- */
function analyze(srcCanvas){
  const W=72, H=72;
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const ctx=c.getContext('2d'); ctx.drawImage(srcCanvas,0,0,W,H);
  const data=ctx.getImageData(0,0,W,H).data;
  const buckets={};
  let sumL=0, n=0, sumS=0, twb=0;
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
    if(a<128) continue;
    n++; twb += (r-b);
    const [h,s,l]=rgb2hsl(r,g,b); sumL+=l; sumS+=s;
    const key=(r>>5)+'-'+(g>>5)+'-'+(b>>5);
    if(!buckets[key]) buckets[key]={r:0,g:0,b:0,c:0};
    const bk=buckets[key]; bk.r+=r; bk.g+=g; bk.b+=b; bk.c++;
  }
  let arr=Object.values(buckets).map(o=>({hex:rgb2hex(o.r/o.c,o.g/o.c,o.b/o.c), c:o.c})).sort((a,b)=>b.c-a.c);
  const domin=[]; for(const o of arr){ if(domin.every(d=>dist(d.hex,o.hex)>1400)){ domin.push(o); } if(domin.length>=5) break; }
  const overallWarm = twb/Math.max(1,n);
  const isWarm = overallWarm > 5;
  const avgL=sumL/Math.max(1,n), avgS=sumS/Math.max(1,n);
  const isLight = avgL > 0.6;
  const key=(isWarm?'warm':'cool')+'-'+(isLight?'light':'deep');
  const season=SEASONS[key], beauty=BEAUTY[key];
  // 推荐配色板：以照片主色里饱和度最高的色相为基准做和谐衍生
  const domHsl = domin.map(o=>{ const x=hex2rgb(o.hex); const hsl=rgb2hsl(x.r,x.g,x.b); return {h:hsl[0],s:hsl[1],l:hsl[2]}; });
  const seed = domHsl.slice().sort((a,b)=>b.s-a.s)[0] || {h:(isWarm?35:210)};
  const baseH = seed.h;
  const sat = isLight ? 0.50 : 0.62, lit = isLight ? 0.64 : 0.44;
  const offs = [0, 32, -28, 150, 196];
  const palette = offs.map((off,i)=>{
    const hex=hsl2hex(((baseH+off)%360+360)%360, GG.clamp(sat + (i-2)*0.04,0.22,0.82), GG.clamp(lit + (i-2)*0.05,0.24,0.8));
    return {hex, name:nameOf(hex)};
  });
  const avoidHues = isWarm ? [210,250] : [35,15];
  const avoid = avoidHues.map(h=>{ const hex=hsl2hex(h,0.55,isLight?0.42:0.62); return {hex,name:nameOf(hex)}; });
  // 色彩坐标：冷暖 → x（0冷~1暖），深浅 → y（0深~1浅）。
  // 收窄到 [.24,.78]：让圆点稳稳落在象限内，又不会压住四角的象限名。
  const warmNorm = GG.clamp((overallWarm + 26) / 52, 0.24, 0.78);
  const lightNorm = GG.clamp((avgL - 0.40) / 0.34, 0.24, 0.78);
  return {
    dominant: domin.map(d=>({hex:d.hex, name:nameOf(d.hex)})),
    isWarm, isLight, avgL, avgS, key, season, beauty, palette, avoid,
    warmNorm, lightNorm,
    undertone: isWarm?'暖调':'冷调', depth:isLight?'浅':'深',
  };
}

/* ---------- 注入 demo 专属样式（一次） ---------- */
function injectCSS(){
  if(document.getElementById('sd-style')) return;
  const css = `
  .sd-gate{min-height:calc(100vh - 130px); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px 18px 36px}
  .sd-card{width:100%; max-width:392px; background:var(--surface); border:1px solid var(--line); border-radius:var(--r-l);
    box-shadow:var(--sh-2); overflow:hidden; animation:gl-rise .5s cubic-bezier(.2,.7,.2,1) both}
  .sd-top{position:relative; color:#fff; padding:30px 24px 26px; overflow:hidden;
    background:linear-gradient(135deg,#e08bbf,#c2569b 55%,#8a3f86)}
  .sd-blob{position:absolute; border-radius:50%; filter:blur(2px); opacity:.55; animation:sd-float 7s ease-in-out infinite}
  .sd-glyph{width:46px; height:46px; border-radius:14px; background:rgba(255,255,255,.22); display:grid; place-items:center;
    font-size:24px; backdrop-filter:blur(4px); position:relative; z-index:1}
  .sd-brand{font-size:23px; font-weight:760; letter-spacing:-.4px; margin-top:13px; position:relative; z-index:1}
  .sd-tag{font-size:13px; opacity:.92; margin-top:3px; position:relative; z-index:1}
  .sd-body{padding:22px 24px 24px}
  .sd-hook{font-size:18px; font-weight:720; letter-spacing:-.3px; line-height:1.35}
  .sd-hook b{color:var(--accent)}
  .sd-feats{display:flex; flex-direction:column; gap:9px; margin:15px 0 4px}
  .sd-feat{display:flex; gap:9px; align-items:flex-start; font-size:13.5px; color:var(--ink-2); line-height:1.4}
  .sd-feat .ic{flex:none; width:22px; height:22px; border-radius:7px; background:var(--accent-soft); color:var(--accent);
    display:grid; place-items:center; font-size:13px; margin-top:1px}
  .sd-proof{display:flex; align-items:center; gap:8px; margin:16px 0 4px; font-size:12px; color:var(--ink-3)}
  .sd-faces{display:flex; margin-right:2px}
  .sd-faces canvas{width:22px; height:22px; border-radius:50%; border:2px solid #fff; margin-left:-7px; box-shadow:var(--sh-1)}
  .sd-faces canvas:first-child{margin-left:0}
  .sd-go{width:100%; appearance:none; border:none; border-radius:13px; cursor:pointer; font-family:inherit;
    background:var(--accent); color:#fff; font-size:15.5px; font-weight:640; padding:14px; margin-top:14px; transition:.15s;
    display:flex; align-items:center; justify-content:center; gap:8px; box-shadow:0 6px 18px -8px var(--accent)}
  .sd-go:hover{filter:brightness(.97)} .sd-go:active{transform:translateY(1px)}
  .sd-wx{width:100%; appearance:none; border:1px solid var(--line); border-radius:13px; cursor:pointer; font-family:inherit;
    background:var(--surface); color:var(--ink-2); font-size:14px; font-weight:560; padding:11px; margin-top:9px; transition:.15s;
    display:flex; align-items:center; justify-content:center; gap:8px}
  .sd-wx:hover{border-color:var(--accent); color:var(--ink)} .sd-wx .g{color:#07c160; font-size:15px}
  .sd-or{display:flex; align-items:center; gap:12px; margin:17px 0 13px; color:var(--ink-3); font-size:12px}
  .sd-or::before,.sd-or::after{content:''; flex:1; height:1px; background:var(--line)}
  .sd-samp-h{font-size:12px; color:var(--ink-3); margin-bottom:9px; text-align:center}
  .sd-samps{display:flex; gap:10px; justify-content:center}
  .sd-samp{border:none; background:none; cursor:pointer; padding:0; display:flex; flex-direction:column; align-items:center; gap:5px;
    font-family:inherit; transition:.14s}
  .sd-samp canvas{width:52px; height:52px; border-radius:50%; box-shadow:var(--sh-1); border:2px solid #fff; transition:.14s}
  .sd-samp:hover canvas{transform:translateY(-2px); box-shadow:var(--sh-2)}
  .sd-samp span{font-size:11.5px; color:var(--ink-3)}
  .sd-priv{display:flex; align-items:flex-start; gap:6px; width:100%; max-width:392px; margin:14px auto 0; padding:0 6px;
    font-size:11.5px; color:var(--ink-3); line-height:1.5}
  .sd-priv > span:first-child{flex:none}

  /* 色彩坐标 */
  .sd-map{position:relative; width:100%; max-width:288px; margin:4px auto 2px; aspect-ratio:1; border-radius:16px;
    border:1px solid var(--line); overflow:hidden;
    background:
      radial-gradient(circle at 100% 0%, rgba(246,200,154,.85), transparent 62%),
      radial-gradient(circle at 100% 100%, rgba(176,74,50,.78), transparent 62%),
      radial-gradient(circle at 0% 0%, rgba(207,214,236,.92), transparent 62%),
      radial-gradient(circle at 0% 100%, rgba(31,58,92,.80), transparent 62%),
      #faf8f6}
  .sd-map .ax{position:absolute; font-size:10.5px; color:rgba(40,30,40,.6); font-weight:600}
  .sd-map .q{position:absolute; font-size:11px; font-weight:680; color:rgba(30,20,30,.62)}
  .sd-dot{position:absolute; width:18px; height:18px; border-radius:50%; background:#fff; border:3px solid var(--accent);
    box-shadow:0 0 0 4px rgba(255,255,255,.55), var(--sh-2); transform:translate(-50%,-50%); z-index:2;
    animation:sd-pop .5s .2s both cubic-bezier(.2,1.4,.4,1)}
  @keyframes sd-pop{from{transform:translate(-50%,-50%) scale(0)}to{transform:translate(-50%,-50%) scale(1)}}

  /* 戴对色 vs 戴错色 */
  .sd-compare{display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:4px}
  .sd-frame{border-radius:14px; padding:18px 10px 12px; display:flex; flex-direction:column; align-items:center; gap:11px;
    box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}
  .sd-face{width:78px; height:78px; border-radius:50%; object-fit:cover; border:3px solid rgba(255,255,255,.92);
    box-shadow:0 6px 18px -6px rgba(0,0,0,.45)}
  .sd-flabel{font-size:12.5px; font-weight:640; padding:4px 12px; border-radius:999px; background:rgba(255,255,255,.92)}
  .sd-flabel.good{color:#1f7a52} .sd-flabel.bad{color:#9a3326}

  /* 妆造速查 */
  .sd-beauty{display:flex; flex-direction:column; gap:0}
  .sd-brow{display:flex; align-items:center; gap:10px; padding:11px 0; border-top:1px solid var(--line-2)}
  .sd-brow:first-child{border-top:none}
  .sd-brow .bk{width:74px; flex:none; font-size:13px; color:var(--ink-3)}
  .sd-shades{display:flex; gap:7px; flex-wrap:wrap; flex:1}
  .sd-shade{display:inline-flex; align-items:center; gap:6px; background:var(--bg); border:1px solid var(--line);
    border-radius:999px; padding:4px 11px 4px 5px; font-size:12.5px; color:var(--ink-2)}
  .sd-shade i{width:16px; height:16px; border-radius:50%; flex:none; box-shadow:inset 0 0 0 1px rgba(0,0,0,.08)}
  .sd-brow .bt{font-size:13px; color:var(--ink-2)}

  /* 衣柜该留该扔 */
  .sd-ward{display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:4px}
  .sd-wcol{border:1px solid var(--line); border-radius:12px; padding:13px 13px 14px}
  .sd-wcol.keep{background:rgba(46,158,123,.06); border-color:rgba(46,158,123,.25)}
  .sd-wcol.toss{background:rgba(216,80,63,.05); border-color:rgba(216,80,63,.22)}
  .sd-wh{font-size:12.5px; font-weight:680; margin-bottom:9px; display:flex; align-items:center; gap:5px}
  .sd-wcol.keep .sd-wh{color:#1f7a52} .sd-wcol.toss .sd-wh{color:#9a3326}
  .sd-wtags{display:flex; flex-wrap:wrap; gap:6px}
  .sd-wtag{font-size:12px; background:var(--surface); border:1px solid var(--line); border-radius:7px; padding:3px 9px; color:var(--ink-2)}

  @keyframes sd-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
  @media (max-width:520px){ .sd-gate{min-height:calc(100vh - 110px); padding:18px 14px 28px} }
  `;
  document.head.appendChild(GG.el('style',{id:'sd-style', html:css}));
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  injectCSS();
  welcome();
}

/* ===== 首屏：干净的「欢迎 / 登录」门面 ===== */
function welcome(){
  fileInput = GG.el('input',{type:'file', accept:'image/*', style:{display:'none'},
    onChange:e=>{ const f=e.target.files[0]; if(f) loadFile(f); }});

  // 漂浮色块（呼应「色彩 DNA」）
  const blobs = [
    {bg:'#ffd54a', w:64, t:-18, l:-10, d:'0s'},
    {bg:'#7fb5c9', w:50, t:40, l:'78%', d:'1.4s'},
    {bg:'#f4805e', w:38, t:'62%', l:'18%', d:'2.6s'},
  ].map(b=>GG.el('span',{class:'sd-blob', style:{background:b.bg, width:b.w+'px', height:b.w+'px',
    top:(typeof b.t==='number'?b.t+'px':b.t), left:(typeof b.l==='number'?b.l+'px':b.l), animationDelay:b.d}}));

  const head = GG.el('div',{class:'sd-top'}, ...blobs,
    GG.el('div',{class:'sd-glyph'}, '🎨'),
    GG.el('div',{class:'sd-brand'}, '色彩 DNA'),
    GG.el('div',{class:'sd-tag'}, 'AI 个人色彩诊断 · 30 秒读出你的颜色'));

  const feat = (ic, t)=>GG.el('div',{class:'sd-feat'}, GG.el('span',{class:'ic'}, ic), t);

  // 示例脸缩略图
  const faces = SAMPLES.map(s=>{
    const btn=GG.el('button',{class:'sd-samp', onClick:()=>useSample(s)},
      sampleThumb(s, 104), GG.el('span', null, s.label));
    return btn;
  });
  const proofFaces = SAMPLES.map(s=>sampleThumb(s, 44));

  const body = GG.el('div',{class:'sd-body'},
    GG.el('div',{class:'sd-hook', html:'一张自拍，<b>读懂你的颜色</b><br>该穿什么、该买什么、口红选几号'}),
    GG.el('div',{class:'sd-feats'},
      feat('🎯', '冷暖深浅 → 你的专属色彩季型 + 色彩人格'),
      feat('👗', '戴对色 vs 戴错色：一眼看出差别'),
      feat('💄', '口红 / 腮红 / 金属 / 发色，直接抄色号')),
    GG.el('div',{class:'sd-proof'},
      GG.el('div',{class:'sd-faces'}, ...proofFaces),
      GG.el('span', null, '已有 12,847 人找到了自己的颜色')),
    fileInput,
    GG.el('button',{class:'sd-go', onClick:()=>fileInput.click()}, '📷 上传自拍，开始诊断'),
    GG.el('button',{class:'sd-wx', onClick:()=>{ GG.toast('微信授权成功（演示）'); useSample(SAMPLES[0]); }},
      GG.el('span',{class:'g'}, '❖'), '微信一键登录'),
    GG.el('div',{class:'sd-or'}, '没有合适的自拍？'),
    GG.el('div',{class:'sd-samp-h'}, '挑一张示例脸，先看看完整效果'),
    GG.el('div',{class:'sd-samps'}, ...faces));

  main.appendChild(GG.el('div',{class:'sd-gate'},
    GG.el('div',{class:'sd-card'}, head, body),
    GG.el('div',{class:'sd-priv'},
      GG.el('span', null, '🔒'),
      GG.el('span', null, '照片只在你的浏览器本机处理，不上传任何服务器；演示环境不收集账号信息。'))));
}

function useSample(s){
  const c=document.createElement('canvas'); c.width=240; c.height=240;
  drawSample(c.getContext('2d'), s, 240, 240);
  run(c, c.toDataURL('image/png'), s.label+'示例');
}
function loadFile(f){
  const reader=new FileReader();
  reader.onload=()=>{ const img=new Image(); img.onload=()=>{
    const c=document.createElement('canvas'); const sz=240; c.width=sz; c.height=sz;
    const m=Math.min(img.width,img.height);
    c.getContext('2d').drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,sz,sz);
    run(c, c.toDataURL('image/png'), '你的自拍');
  }; img.src=reader.result; };
  reader.readAsDataURL(f);
}

async function run(canvas, dataURL, srcLabel){
  GG.clear(main);
  const stage=GG.el('div'); main.appendChild(stage);
  await GG.thinking(stage, ['读取照片像素…','量化主色…','判断冷暖与深浅…','匹配色彩人格…','生成你的配色板…'], 1600);
  const res=analyze(canvas);
  GG.clear(stage);
  renderResult(stage, res, dataURL, srcLabel);
}

/* ===== 结果页 ===== */
function swRow(list, big){
  return GG.el('div',{class:'swatches', style: big?{}:{height:'auto'}},
    list.map(s=>GG.el('div',{class:'sw', style:{background:s.hex, height: big?'84px':'64px'}},
      s.name?GG.el('span', null, s.name):null)));
}
function bullets(arr){
  return GG.el('ul',{class:'small', style:{margin:'4px 0 0', paddingLeft:'20px', color:'var(--ink-2)', lineHeight:'1.7'}},
    arr.map(t=>GG.el('li', null, t)));
}
function shadeChip(o){ return GG.el('span',{class:'sd-shade'}, GG.el('i',{style:{background:o.hex}}), o.n); }

function colorMap(res){
  const S=res.season;
  const dot = GG.el('div',{class:'sd-dot', style:{left:(res.warmNorm*100)+'%', top:((1-res.lightNorm)*100)+'%'}});
  return GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '你在色彩坐标里的位置'),
    GG.el('div',{class:'sd-map'},
      GG.el('span',{class:'q', style:{top:'8px', left:'10px'}}, '冷夏'),
      GG.el('span',{class:'q', style:{top:'8px', right:'10px'}}, '暖春'),
      GG.el('span',{class:'q', style:{bottom:'8px', left:'10px'}}, '冷冬'),
      GG.el('span',{class:'q', style:{bottom:'8px', right:'10px'}}, '暖秋'),
      GG.el('span',{class:'ax', style:{top:'50%', left:'8px', transform:'translateY(-50%)'}}, '冷'),
      GG.el('span',{class:'ax', style:{top:'50%', right:'8px', transform:'translateY(-50%)'}}, '暖'),
      GG.el('span',{class:'ax', style:{top:'6px', left:'50%', transform:'translateX(-50%)'}}, '浅'),
      GG.el('span',{class:'ax', style:{bottom:'6px', left:'50%', transform:'translateX(-50%)'}}, '深'),
      dot),
    GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}},
      `你落在 ${res.undertone}·${res.depth}色系 这一象限 —— ${S.name}。越靠角，特征越鲜明。`));
}

function compareBlock(res, dataURL){
  const best=res.beauty.best, worst=res.beauty.worst;
  const frame=(c,label,good)=>GG.el('div',{class:'sd-frame', style:{background:c.hex}},
    GG.el('img',{class:'sd-face', src:dataURL, alt:''}),
    GG.el('div',{class:'sd-flabel'+(good?' good':' bad')}, label));
  return GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '戴对色 vs 戴错色'),
    GG.el('div',{class:'sd-compare'},
      frame(best, '✓ '+best.n, true),
      frame(worst, '✗ '+worst.n, false)),
    GG.el('p',{class:'small muted', style:{margin:'12px 0 0'}},
      `同一张脸，左边「${best.n}」提气色、右边「${worst.n}」显疲惫 —— 这就是选对颜色的差别。`));
}

function beautyBlock(res){
  const B=res.beauty;
  const row=(k, kids)=>GG.el('div',{class:'sd-brow'}, GG.el('div',{class:'bk'}, k), GG.el('div',{class:'sd-shades'}, ...kids));
  return GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '妆造速查 · 直接抄色号'),
    GG.el('div',{class:'sd-beauty'},
      row('口红', [shadeChip(B.lip), B.lip2?shadeChip(B.lip2):null].filter(Boolean)),
      row('腮红', [shadeChip(B.blush)]),
      row('金属配饰', [GG.el('span',{class:'bt'}, B.metal)]),
      row('发色', [shadeChip(B.hair)])),
    GG.el('p',{class:'small muted', style:{margin:'12px 0 0'}}, '色号是同色系参考，买前在自然光下贴脸比一比最准。'));
}

function wardrobeBlock(res){
  const B=res.beauty;
  const col=(cls,h,tags)=>GG.el('div',{class:'sd-wcol '+cls},
    GG.el('div',{class:'sd-wh'}, h),
    GG.el('div',{class:'sd-wtags'}, ...tags.map(t=>GG.el('span',{class:'sd-wtag'}, t))));
  return GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '衣柜断舍离'),
    GG.el('div',{class:'sd-ward'},
      col('keep','✓ 该留 / 多买', B.keep),
      col('toss','✗ 别再踩雷', B.toss)));
}

/* ---------- AI 造型顾问（连了 key 才叠加） ---------- */
const SD_SYS = '你是资深色彩造型顾问。用户做完色彩季型诊断，下面是结果。请给出更个性化、可执行的穿搭与妆容建议。只输出严格 JSON：{"summary":"一句话点评 ta 的色彩特质","wear":["3条具体的单品/颜色搭配建议"],"makeup":["2条妆容或配饰建议"],"avoid":"一句话提醒最该避开什么"}。全部简体中文，建议要具体（点名颜色/单品），不要空话。';
function aiAdvice(res){
  const S = res.season, B=res.beauty;
  const user = `色彩季型：${S.name}（${S.vibe}）\n色彩人格：${B.persona}\n冷暖：${res.undertone}\n深浅：${res.depth}色系\n照片主色：${res.dominant.map(d=>d.name).join('、')}\n推荐配色板：${res.palette.map(p=>p.name).join('、')}\n口红色号：${B.lip.n}`;
  return GG.llm.json(SD_SYS, user, {max_tokens:700});
}
function mountAdvice(stage, res){
  // 状态条始终给（让访客可以连 AI 升级）；连了才自动生成
  const body = GG.el('div', null);
  const head = GG.el('div',{class:'row', style:{justifyContent:'space-between', alignItems:'center'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '✨ AI 造型顾问'),
    GG.llm.badge(GG.llm.connected()));
  const card = GG.el('div',{class:'card pad', style:{marginBottom:'16px', borderLeft:'3px solid var(--accent)'}}, head, body);
  stage.appendChild(card);

  if(!GG.llm.connected()){
    body.appendChild(GG.el('p',{class:'small muted', style:{margin:'0 0 10px'}},
      '上面的季型 / 配色 / 色号都是本机即时算出来的。连上 AI 后，这里会多一份「为你这张脸量身写」的穿搭与妆容建议。'));
    body.appendChild(GG.llm.bar(()=>{ start(); /* 连接状态变化后让用户重测以看到 AI 段落 */ }));
    return;
  }
  body.appendChild(GG.el('p',{class:'small muted', style:{margin:'0'}}, '正在为你的季型生成个性化建议…'));
  aiAdvice(res).then(obj=>{
    GG.clear(body);
    if(obj.summary) body.appendChild(GG.el('p',{style:{margin:'0 0 10px', fontWeight:'600'}}, String(obj.summary)));
    const wear = (Array.isArray(obj.wear)?obj.wear:[]).map(String).filter(Boolean);
    const makeup = (Array.isArray(obj.makeup)?obj.makeup:[]).map(String).filter(Boolean);
    if(wear.length){ body.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'4px'}}, '穿搭')); body.appendChild(bullets(wear)); }
    if(makeup.length){ body.appendChild(GG.el('div',{class:'section-t'}, '妆容 / 配饰')); body.appendChild(bullets(makeup)); }
    if(obj.avoid) body.appendChild(GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}}, '避开：'+String(obj.avoid)));
    if(!wear.length && !makeup.length && !obj.summary) body.appendChild(GG.el('p',{class:'small muted', style:{margin:'0'}}, '这次没生成出建议，核心诊断不受影响。'));
  }).catch(e=>{ GG.clear(body);
    body.appendChild(GG.el('p',{class:'small muted', style:{margin:'0'}},
      'AI 建议没拿到（'+(e&&e.code||'NET')+'），核心色彩诊断不受影响。')); });
}

function renderResult(stage, res, dataURL, srcLabel){
  const S=res.season, B=res.beauty;
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, '🎨 你的色彩 DNA')));

  // 头部：预览图 + 季型 + 色彩人格
  stage.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'16px', alignItems:'center', flexWrap:'wrap', marginBottom:'16px',
      background:'linear-gradient(160deg,var(--accent-soft),#fff 62%)'}},
    GG.el('img',{src:dataURL, alt:srcLabel, style:{width:'92px', height:'92px', borderRadius:'16px', objectFit:'cover', boxShadow:'var(--sh-1)'}}),
    GG.el('div',{style:{flex:'1', minWidth:'200px'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0', marginBottom:'4px'}}, '色彩季型 · 色彩人格'),
      GG.el('div',{style:{fontSize:'28px', fontWeight:'760', lineHeight:'1.15'}}, S.name),
      GG.el('div',{style:{fontSize:'15px', fontWeight:'650', color:'var(--accent)', marginTop:'2px'}}, '「'+B.persona+'」'),
      GG.el('div',{class:'kpi', style:{marginTop:'9px'}},
        GG.el('span',{class:'pill'}, res.undertone),
        GG.el('span',{class:'pill'}, res.depth+'色系'),
        GG.el('span',{class:'pill'}, S.vibe))
    )
  ));

  // 共鸣钩子
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', background:'var(--accent-soft)', border:'none'}},
    GG.el('p',{style:{margin:'0', fontSize:'15px', fontWeight:'560', color:'var(--ink)', lineHeight:'1.55'}}, '“'+B.hook+'”')));

  // 色彩坐标定位
  stage.appendChild(colorMap(res));

  // 戴对色 vs 戴错色
  stage.appendChild(compareBlock(res, dataURL));

  // 从照片取出的主色
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '从你的照片里取到的主色'),
    swRow(res.dominant, true),
    GG.el('p',{class:'small muted', style:{margin:'12px 0 0'}},
      `共量化 ${res.dominant.length} 个主色：${res.dominant.map(d=>d.name).join('、')}。冷暖依据全图红蓝差判定。`)
  ));

  // 推荐配色板 + 避开
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '为你生成的专属配色板'),
    swRow(res.palette, true),
    GG.el('p',{class:'small', style:{margin:'12px 0 6px', color:'var(--ink-2)'}}, S.advice),
    GG.el('div',{class:'section-t'}, '建议避开'),
    swRow(res.avoid, false)
  ));

  // 妆造速查
  stage.appendChild(beautyBlock(res));

  // 衣柜断舍离
  stage.appendChild(wardrobeBlock(res));

  // ✨ AI 造型建议
  mountAdvice(stage, res);

  const shareSpec={
    slug:SLUG, title:'我的色彩季型 · '+S.name+'「'+B.persona+'」',
    subtitle:`${res.undertone} / ${res.depth}色系 · ${S.vibe}`,
    swatches: res.palette,
    note: B.hook,
    rows:[ {label:'口红色号', value:B.lip.n+(B.lip2?(' / '+B.lip2.n):'')},
           {label:'金属配饰', value:B.metal} ],
    tags: res.dominant.slice(0,4).map(d=>d.name),
  };
  stage.appendChild(GG.resultCard(SLUG, GG.el('div',{class:'center muted small'}, '存图分享你的色彩 DNA ↓'), shareSpec));
  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ start(); }}, '↻ 换张照片')));
}

start();
})();
