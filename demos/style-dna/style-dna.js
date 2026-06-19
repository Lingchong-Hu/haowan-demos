/* style-dna — 自拍色彩诊断。真实像素取色 → 色彩季型 + 配色板。换图→配色变。 */
(function(){
const SLUG='style-dna';
const {SAMPLES, NAMES, SEASONS} = window.STYLEDNA;
let main;

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
  // 头发
  ctx.fillStyle=p.hair; ctx.beginPath(); ctx.ellipse(W/2,H*0.42,W*0.30,H*0.34,0,0,7); ctx.fill();
  // 脸
  ctx.fillStyle=p.skin; ctx.beginPath(); ctx.ellipse(W/2,H*0.46,W*0.20,H*0.25,0,0,7); ctx.fill();
  // 衣服
  ctx.fillStyle=p.top; ctx.beginPath(); ctx.moveTo(W*0.18,H); ctx.quadraticCurveTo(W/2,H*0.66,W*0.82,H);
  ctx.closePath(); ctx.fill();
}
function shade(hex,amt){ const {r,g,b}=hex2rgb(hex); return rgb2hex(r+amt,g+amt,b+amt); }

/* ---------- 取色引擎：真实像素量化 ---------- */
function analyze(srcCanvas){
  const W=72, H=72;
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const ctx=c.getContext('2d'); ctx.drawImage(srcCanvas,0,0,W,H);
  const data=ctx.getImageData(0,0,W,H).data;
  const buckets={};        // 量化直方图
  let sr=0,sg=0,sb=0, skinN=0, sumL=0, n=0, sumS=0, twb=0;
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2],a=data[i+3];
    if(a<128) continue;
    n++; twb += (r-b);
    const [h,s,l]=rgb2hsl(r,g,b); sumL+=l; sumS+=s;
    // 量化到 24 级
    const key=(r>>5)+'-'+(g>>5)+'-'+(b>>5);
    if(!buckets[key]) buckets[key]={r:0,g:0,b:0,c:0};
    const bk=buckets[key]; bk.r+=r; bk.g+=g; bk.b+=b; bk.c++;
    // 肤色像素（暖、中等亮度）用于判断冷暖
    if(r>g && g>b && l>0.3 && l<0.85 && s>0.1 && s<0.6){ sr+=r; sg+=g; sb+=b; skinN++; }
  }
  // 主色 = 人口最多的若干桶，去相近
  let arr=Object.values(buckets).map(o=>({hex:rgb2hex(o.r/o.c,o.g/o.c,o.b/o.c), c:o.c}))
            .sort((a,b)=>b.c-a.c);
  const domin=[]; for(const o of arr){ if(domin.every(d=>dist(d.hex,o.hex)>1400)){ domin.push(o); } if(domin.length>=5) break; }
  // 冷暖：全图像素 R-B 均值（背景/头发/衣着都计入）。合成肤色天然偏暖，故不单独给肤色加权。
  const overallWarm = twb/Math.max(1,n);
  const isWarm = overallWarm > 5;
  const avgL=sumL/Math.max(1,n), avgS=sumS/Math.max(1,n);
  const isLight = avgL > 0.6;
  const key=(isWarm?'warm':'cool')+'-'+(isLight?'light':'deep');
  const season=SEASONS[key];
  // 推荐配色板：以照片主色里饱和度最高的色相为基准做和谐衍生 → 换照片→换基准→换配色板
  const domHsl = domin.map(o=>{ const x=hex2rgb(o.hex); const hsl=rgb2hsl(x.r,x.g,x.b); return {h:hsl[0],s:hsl[1],l:hsl[2]}; });
  const seed = domHsl.slice().sort((a,b)=>b.s-a.s)[0] || {h:(isWarm?35:210)};
  const baseH = seed.h;
  const sat = isLight ? 0.50 : 0.62;
  const lit = isLight ? 0.64 : 0.44;
  const offs = [0, 32, -28, 150, 196];        // 单色 / 邻近 / 互补 和谐
  const palette = offs.map((off,i)=>{
    const hex=hsl2hex(((baseH+off)%360+360)%360, GG.clamp(sat + (i-2)*0.04,0.22,0.82), GG.clamp(lit + (i-2)*0.05,0.24,0.8));
    return {hex, name:nameOf(hex)};
  });
  // 避开：与基准相反的冷暖方向
  const avoidHues = isWarm ? [210,250] : [35,15];
  const avoid = avoidHues.map(h=>{ const hex=hsl2hex(h,0.55,isLight?0.42:0.62); return {hex,name:nameOf(hex)}; });
  return {
    dominant: domin.map(d=>({hex:d.hex, name:nameOf(d.hex)})),
    isWarm, isLight, avgL, avgS, key, season, palette, avoid,
    undertone: isWarm?'暖调':'冷调', depth:isLight?'浅':'深',
  };
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  intro();
}
function intro(){
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '一张自拍，读出你的色彩季型'),
    GG.el('p', null, '上传一张自拍，或先试试样片。我会从照片的真实像素里取色，给你专属配色板。')
  ));
  // 上传
  const fileInput=GG.el('input',{type:'file', accept:'image/*', style:{display:'none'},
    onChange:e=>{ const f=e.target.files[0]; if(f) loadFile(f); }});
  const upBtn=GG.el('button',{class:'btn primary lg block', onClick:()=>fileInput.click()}, '📷 上传自拍');
  // 样片
  const sampleRow=GG.el('div',{class:'chips', style:{marginTop:'14px', justifyContent:'center'}},
    SAMPLES.map(s=>GG.el('button',{class:'chip', onClick:()=>useSample(s)}, '试试 '+s.label)));
  main.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'18px', maxWidth:'440px', margin:'18px auto 0'}},
    fileInput, upBtn,
    GG.el('div',{class:'center muted small', style:{margin:'14px 0 4px'}}, '— 或试试本地样片 —'),
    sampleRow
  ));
  main.appendChild(GG.el('p',{class:'center muted small', style:{marginTop:'14px'}},
    '照片只在你的浏览器本地处理，不上传任何服务器。'));
}

function useSample(s){
  const c=document.createElement('canvas'); c.width=240; c.height=240;
  drawSample(c.getContext('2d'), s, 240, 240);
  run(c, c.toDataURL('image/png'), s.label);
}
function loadFile(f){
  const reader=new FileReader();
  reader.onload=()=>{ const img=new Image(); img.onload=()=>{
    const c=document.createElement('canvas'); const sz=240; c.width=sz; c.height=sz;
    // 居中裁剪成方形
    const m=Math.min(img.width,img.height);
    c.getContext('2d').drawImage(img,(img.width-m)/2,(img.height-m)/2,m,m,0,0,sz,sz);
    run(c, c.toDataURL('image/png'), '你的自拍');
  }; img.src=reader.result; };
  reader.readAsDataURL(f);
}

async function run(canvas, dataURL, srcLabel){
  GG.clear(main);
  const stage=GG.el('div'); main.appendChild(stage);
  await GG.thinking(stage, ['读取照片像素…','量化主色…','判断冷暖与深浅…','生成你的配色板…'], 1400);
  const res=analyze(canvas);
  GG.clear(stage);
  renderResult(stage, res, dataURL, srcLabel);
}

function swRow(list, big){
  return GG.el('div',{class:'swatches', style: big?{}:{height:'auto'}},
    list.map(s=>GG.el('div',{class:'sw', style:{background:s.hex, height: big?'84px':'64px'}},
      s.name?GG.el('span', null, s.name):null)));
}

function renderResult(stage, res, dataURL, srcLabel){
  const S=res.season;
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, '🎨 你的色彩 DNA')));

  // 头部：预览图 + 季型
  stage.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'18px', alignItems:'center', flexWrap:'wrap', marginBottom:'16px',
      background:'linear-gradient(160deg,var(--accent-soft),#fff 60%)'}},
    GG.el('img',{src:dataURL, alt:srcLabel, style:{width:'92px', height:'92px', borderRadius:'16px', objectFit:'cover', boxShadow:'var(--sh-1)'}}),
    GG.el('div',{style:{flex:'1', minWidth:'200px'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '色彩季型'),
      GG.el('div',{style:{fontSize:'30px', fontWeight:'760'}}, S.name),
      GG.el('div',{class:'kpi', style:{marginTop:'8px'}},
        GG.el('span',{class:'pill'}, res.undertone),
        GG.el('span',{class:'pill'}, res.depth+'色系'),
        GG.el('span',{class:'pill'}, S.vibe))
    )
  ));

  // 从照片取出的主色（真实像素）
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '从你的照片里取到的主色'),
    swRow(res.dominant, true),
    GG.el('p',{class:'small muted', style:{margin:'12px 0 0'}},
      `共量化 ${res.dominant.length} 个主色：${res.dominant.map(d=>d.name).join('、')}。冷暖判定依据照片肤色区域的红蓝差。`)
  ));

  // 推荐配色板
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '为你生成的专属配色板'),
    swRow(res.palette, true),
    GG.el('p',{class:'small', style:{margin:'12px 0 6px', color:'var(--ink-2)'}}, S.advice),
    GG.el('div',{class:'section-t'}, '建议避开'),
    swRow(res.avoid, false)
  ));

  const shareSpec={
    slug:SLUG, title:'我的色彩季型 · '+S.name,
    subtitle:`${res.undertone} / ${res.depth}色系 · ${S.vibe}`,
    swatches: res.palette,
    note: S.advice,
    tags: res.dominant.slice(0,4).map(d=>d.name),
  };
  stage.appendChild(GG.resultCard(SLUG, GG.el('div',{class:'center muted small'}, '存图分享你的配色板 ↓'), shareSpec));
  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ start(); }}, '↻ 换张照片')));
}

start();
})();
