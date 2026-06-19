/* pet-health — 宠物拍照自检。选部位→拍照/选本地样图→真实读像素得指标→健康分+观察项+就医建议。
   完全离线可跑：本地 canvas 现画样图（参数不同→外观不同→读出不同指标→不同结果）。上传作可选增强。 */
(function(){
const SLUG='pet-health';
const {PARTS, SAMPLES, OBS, TRIAGE} = window.PETHEALTH;
let main, curPart = 'eye';

/* ---------- 画样图（本地像素，可被真实取色分析） ---------- */
function drawEye(ctx, p, W, H){
  // 眼周皮毛底
  ctx.fillStyle='#d8c4a6'; ctx.fillRect(0,0,W,H);
  // 眼白（结膜）——按 redness 调成偏红
  const r = Math.round(235 - p.redness*70);
  const g = Math.round(232 - p.redness*150);
  const b = Math.round(228 - p.redness*150);
  ctx.fillStyle=`rgb(${r},${g},${b})`;
  ctx.beginPath(); ctx.ellipse(W/2,H/2,W*0.40,H*0.26,0,0,7); ctx.fill();
  // 红血丝
  if(p.redness>0.3){
    ctx.strokeStyle=`rgba(200,40,30,${0.25+p.redness*0.5})`; ctx.lineWidth=1.4;
    for(let i=0;i<Math.round(p.redness*16);i++){
      const a=Math.random()*Math.PI*2, len=W*0.18*Math.random();
      ctx.beginPath(); ctx.moveTo(W*0.5+Math.cos(a)*W*0.16, H*0.5+Math.sin(a)*H*0.10);
      ctx.lineTo(W*0.5+Math.cos(a)*(W*0.16+len), H*0.5+Math.sin(a)*(H*0.10+len*0.4)); ctx.stroke();
    }
  }
  // 虹膜 + 瞳孔
  ctx.fillStyle=p.iris; ctx.beginPath(); ctx.arc(W/2,H/2,W*0.17,0,7); ctx.fill();
  ctx.fillStyle='#16110a'; ctx.beginPath(); ctx.arc(W/2,H/2,W*0.085,0,7); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.8)'; ctx.beginPath(); ctx.arc(W*0.45,H*0.44,W*0.03,0,7); ctx.fill();
  // 眼角分泌物（淡黄绿小点）
  for(let i=0;i<(p.discharge||0);i++){
    ctx.fillStyle='rgba(200,185,120,.9)';
    ctx.beginPath(); ctx.arc(W*0.16+i*7, H*0.5+(i%2?6:-6), 4+Math.random()*2,0,7); ctx.fill();
  }
}
function drawSkin(ctx, p, W, H){
  // 皮肤底色，按 redness 偏红
  const r = Math.round(232 - p.redness*30 + 20);
  const g = Math.round(205 - p.redness*90);
  const b = Math.round(190 - p.redness*100);
  ctx.fillStyle=`rgb(${r},${g},${b})`; ctx.fillRect(0,0,W,H);
  // 毛发纹理
  ctx.strokeStyle='rgba(150,120,90,.25)'; ctx.lineWidth=1;
  for(let i=0;i<60;i++){ const x=Math.random()*W, y=Math.random()*H;
    ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+6,y+12); ctx.stroke(); }
  // 红斑/丘疹
  for(let i=0;i<(p.spots||0);i++){
    const x=W*0.15+Math.random()*W*0.7, y=H*0.15+Math.random()*H*0.7, rad=5+Math.random()*8;
    const grd=ctx.createRadialGradient(x,y,0,x,y,rad);
    grd.addColorStop(0,'rgba(200,60,50,.85)'); grd.addColorStop(1,'rgba(200,60,50,0)');
    ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(x,y,rad,0,7); ctx.fill();
  }
  // 皮屑（白色小点）
  for(let i=0;i<Math.round((p.scale||0)*60);i++){
    ctx.fillStyle='rgba(245,245,238,.8)';
    ctx.beginPath(); ctx.arc(Math.random()*W, Math.random()*H, 1+Math.random()*1.6,0,7); ctx.fill();
  }
}
function drawSample(ctx, sample, W, H){
  if(sample.part==='eye') drawEye(ctx, sample.draw, W, H);
  else drawSkin(ctx, sample.draw, W, H);
}

/* ---------- 真实像素分析引擎 ---------- */
function analyzeEye(data, n){
  // 中心区域（结膜）红色占比：r 明显高于 g,b 的像素
  let redN=0, total=0, sumR=0,sumG=0,sumB=0, yellowN=0;
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2]; total++;
    sumR+=r; sumG+=g; sumB+=b;
    if(r>120 && r-g>34 && r-b>34) redN++;            // 偏红像素
    if(r>150 && g>140 && b<140 && Math.abs(r-g)<40) yellowN++; // 黄绿分泌物
  }
  const redRatio = redN/total;             // 0~1
  const yellowRatio = yellowN/total;
  return { redRatio, yellowRatio,
           avg:[sumR/total,sumG/total,sumB/total] };
}
function analyzeSkin(data, n){
  let redN=0, brightN=0, total=0, sumR=0,sumG=0,sumB=0;
  for(let i=0;i<data.length;i+=4){
    const r=data[i],g=data[i+1],b=data[i+2]; total++;
    sumR+=r; sumG+=g; sumB+=b;
    if(r>140 && r-g>40 && r-b>45) redN++;            // 红斑像素
    if(r>235 && g>235 && b>225) brightN++;           // 皮屑（高亮白点）
  }
  return { redRatio:redN/total, scaleRatio:brightN/total,
           avg:[sumR/total,sumG/total,sumB/total] };
}
function analyze(canvas, part){
  const W=80, H=80;
  const c=document.createElement('canvas'); c.width=W; c.height=H;
  const ctx=c.getContext('2d'); ctx.drawImage(canvas,0,0,W,H);
  const data=ctx.getImageData(0,0,W,H).data;
  return part==='eye' ? analyzeEye(data, W*H) : analyzeSkin(data, W*H);
}

/* ---------- 由真实指标 → 健康分 + 观察项 + 就医档 ---------- */
function buildReport(metrics, part){
  const obs = OBS[part];
  let score = 100, items = [], findings = [];
  if(part==='eye'){
    const red = metrics.redRatio;        // 越大越红
    const yel = metrics.yellowRatio;
    score -= GG.clamp(red*180, 0, 55);
    score -= GG.clamp(yel*900, 0, 25);
    if(red < 0.06){ items.push(obs.rednessLow); }
    else if(red < 0.16){ items.push(obs.rednessMid); findings.push('结膜轻度发红'); }
    else { items.push(obs.rednessHigh); findings.push('结膜明显充血'); }
    if(yel < 0.004){ items.push(obs.dischargeNone); }
    else { items.push(obs.dischargeSome); findings.push('眼角分泌物'); }
    items.push('瞳孔对光区域清晰，未见明显浑浊');  // 固定正向项
  } else {
    const red = metrics.redRatio, scale = metrics.scaleRatio;
    score -= GG.clamp(red*220, 0, 50);
    score -= GG.clamp(scale*700, 0, 22);
    if(red < 0.04){ items.push(obs.rednessLow); items.push(obs.spotsLow); }
    else { items.push(obs.rednessHigh); items.push(obs.spotsHigh); findings.push('皮肤红斑'); }
    if(scale < 0.03){ items.push(obs.scaleLow); }
    else { items.push(obs.scaleHigh); findings.push('皮屑偏多'); }
  }
  score = Math.round(GG.clamp(score, 12, 99));
  const triage = TRIAGE.find(t=>score>=t.min) || TRIAGE[TRIAGE.length-1];
  return { score, items, findings, triage,
    metrics:{
      redPct: Math.round(metrics.redRatio*100),
      extraPct: Math.round((part==='eye'?metrics.yellowRatio:metrics.scaleRatio)*100),
    } };
}

/* ---------- 流程 ---------- */
function start(){
  main = GG.mountShell(SLUG);
  intro();
}
function intro(){
  GG.clear(main);
  curPart = curPart || 'eye';
  main.appendChild(GG.el('div',{class:'hero'},
    GG.el('h1', null, '给宠物拍张照，做个健康自检'),
    GG.el('p', null, '选一个检查部位，拍照或直接点本地样图，我会真实读取图像像素，给出健康分、观察项清单和就医建议。')
  ));

  // 部位选择
  const partRow = GG.el('div',{class:'chips', style:{marginTop:'4px'}});
  function paintParts(){
    GG.clear(partRow);
    PARTS.forEach(p=> partRow.appendChild(
      GG.el('button',{class:'chip'+(p.id===curPart?' on':''), onClick:()=>{ curPart=p.id; paintParts(); paintBody(); }},
        p.emoji+' '+p.label)));
  }

  const body = GG.el('div',{style:{marginTop:'16px'}});
  function paintBody(){
    GG.clear(body);
    const part = PARTS.find(p=>p.id===curPart);
    body.appendChild(GG.el('p',{class:'small muted', style:{margin:'0 0 12px'}}, part.hint));

    // 本地样图（离线主路径）
    body.appendChild(GG.el('div',{class:'section-t', style:{marginTop:'4px'}}, '点一张本地样图，立即分析'));
    const grid = GG.el('div',{style:{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:'12px'}});
    SAMPLES[curPart].forEach(s=>{
      const c=document.createElement('canvas'); c.width=150; c.height=120;
      drawSample(c.getContext('2d'), s, 150, 120);
      c.style.width='100%'; c.style.height='auto'; c.style.borderRadius='12px'; c.style.boxShadow='var(--sh-1)';
      const tile = GG.el('div',{class:'opt', style:{flexDirection:'column', alignItems:'stretch', padding:'10px', gap:'8px'},
        onClick:()=>useSample(s)},
        c, GG.el('div',{class:'small', style:{textAlign:'center', color:'var(--ink-2)'}}, s.label));
      grid.appendChild(tile);
    });
    body.appendChild(grid);

    // 上传（可选增强）
    const fileInput=GG.el('input',{type:'file', accept:'image/*', style:{display:'none'},
      onChange:e=>{ const f=e.target.files[0]; if(f) loadFile(f, curPart); }});
    body.appendChild(GG.el('div',{class:'center', style:{marginTop:'16px'}},
      fileInput,
      GG.el('button',{class:'btn', onClick:()=>fileInput.click()}, '📷 用自己的照片（可选）'),
      GG.el('p',{class:'small muted', style:{marginTop:'10px'}}, '照片只在你的浏览器本地处理，不上传任何服务器。')
    ));
  }

  paintParts(); paintBody();
  main.appendChild(GG.el('div',{class:'card pad', style:{marginTop:'10px'}}, partRow, body));
}

function useSample(s){
  const c=document.createElement('canvas'); c.width=260; c.height=200;
  drawSample(c.getContext('2d'), s, 260, 200);
  run(c, c.toDataURL('image/png'), s.part, s.label);
}
function loadFile(f, part){
  const reader=new FileReader();
  reader.onload=()=>{ const img=new Image(); img.onload=()=>{
    const c=document.createElement('canvas'); const W=260,H=200; c.width=W; c.height=H;
    const ar=img.width/img.height, tar=W/H; let sw,sh,sx,sy;
    if(ar>tar){ sh=img.height; sw=sh*tar; sx=(img.width-sw)/2; sy=0; }
    else { sw=img.width; sh=sw/tar; sx=0; sy=(img.height-sh)/2; }
    c.getContext('2d').drawImage(img,sx,sy,sw,sh,0,0,W,H);
    run(c, c.toDataURL('image/png'), part, '你的照片');
  }; img.src=reader.result; };
  reader.readAsDataURL(f);
}

async function run(canvas, dataURL, part, srcLabel){
  GG.clear(main);
  const stage=GG.el('div'); main.appendChild(stage);
  await GG.thinking(stage, ['读取图像像素…','检测发红/异常区域…','量化关键指标…','生成健康报告…'], 1500);
  const metrics = analyze(canvas, part);
  const report = buildReport(metrics, part);
  GG.clear(stage);
  renderResult(stage, report, dataURL, part, srcLabel);
}

/* ---------- 报告 ---------- */
function toneColor(tone){ return tone==='good'?'var(--good)':tone==='warn'?'var(--warn)':'var(--bad)'; }

function renderResult(stage, rep, dataURL, part, srcLabel){
  const partLabel = PARTS.find(p=>p.id===part).label;
  stage.appendChild(GG.el('div',{class:'hero', style:{paddingTop:'8px'}},
    GG.el('h1',{style:{fontSize:'24px'}}, '🐾 '+partLabel+'自检报告')));

  // 头部：预览 + 健康分
  stage.appendChild(GG.el('div',{class:'card pad', style:{display:'flex', gap:'18px', alignItems:'center', flexWrap:'wrap', marginBottom:'16px',
      background:'linear-gradient(160deg,var(--accent-soft),#fff 60%)'}},
    GG.el('img',{src:dataURL, alt:srcLabel, style:{width:'108px', height:'84px', borderRadius:'14px', objectFit:'cover', boxShadow:'var(--sh-1)'}}),
    GG.el('div',{style:{flex:'1', minWidth:'180px'}},
      GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '健康分'),
      GG.el('div',{class:'score-ring'},
        GG.el('div',{class:'bignum', style:{color:toneColor(rep.triage.tone)}}, String(rep.score)),
        GG.el('div',{class:'small muted'}, '/ 100')),
      GG.el('div',{class:'kpi', style:{marginTop:'8px'}},
        GG.el('span',{class:'pill', style:{background:'var(--accent-soft)', color:toneColor(rep.triage.tone)}}, rep.triage.level),
        GG.el('span',{class:'pill'}, srcLabel))
    )
  ));

  // 量化指标条
  const m1Label = part==='eye' ? '发红区域占比' : '红斑区域占比';
  const m2Label = part==='eye' ? '分泌物迹象' : '皮屑迹象';
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '从图像里读到的指标'),
    bar(m1Label, rep.metrics.redPct),
    bar(m2Label, rep.metrics.extraPct),
    GG.el('p',{class:'small muted', style:{margin:'10px 0 0'}}, '以上数值来自对图像像素的真实统计（发红像素 / 异常高亮点的占比）。')
  ));

  // 观察项清单
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px'}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '观察项清单'),
    GG.el('div',{class:'stack', style:{gap:'10px'}},
      rep.items.map(it=> GG.el('div',{class:'row', style:{alignItems:'flex-start', gap:'10px'}},
        GG.el('span',{style:{color:'var(--accent)', flex:'none', marginTop:'2px'}}, '•'),
        GG.el('span', null, it))))
  ));

  // 就医建议
  stage.appendChild(GG.el('div',{class:'card pad', style:{marginBottom:'16px', borderLeft:'4px solid '+toneColor(rep.triage.tone)}},
    GG.el('div',{class:'section-t', style:{marginTop:'0'}}, '就医建议'),
    GG.el('div',{style:{fontWeight:'680', fontSize:'18px', color:toneColor(rep.triage.tone), marginBottom:'4px'}}, rep.triage.level),
    GG.el('p',{style:{margin:'0', color:'var(--ink-2)'}}, rep.triage.advice)
  ));

  // 结果卡（含「非诊断」免责 + 分享栏）
  const subtitle = partLabel + ' · ' + (rep.findings.length ? '发现：'+rep.findings.join('、') : '未见明显异常');
  const shareSpec = {
    slug: SLUG, title:'宠物健康自检',
    big:{ value:rep.score, label:'健康分' },
    subtitle,
    rows: rep.items.map((it,i)=>({ label:'观察项'+(i+1), value:it })),
    note: rep.triage.advice,
    tags:[partLabel, rep.triage.level],
  };
  stage.appendChild(GG.resultCard(SLUG, GG.el('div',{class:'center muted small'}, '存图分享这份自检报告 ↓'), shareSpec));

  stage.appendChild(GG.el('div',{class:'center', style:{marginTop:'18px'}},
    GG.el('button',{class:'btn', onClick:()=>{ start(); }}, '↻ 再检查一处')));
}

function bar(label, pct){
  return GG.el('div',{class:'bar-row'},
    GG.el('div',{class:'nm'}, label),
    GG.el('div',{class:'bar'}, GG.el('i',{style:{width:GG.clamp(pct,2,100)+'%',
      background: pct>30?'var(--bad)':pct>12?'var(--warn)':'var(--good)'}})),
    GG.el('div',{class:'pct'}, pct+'%'));
}

start();
})();
